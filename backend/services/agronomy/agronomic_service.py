"""Master service using all services in this directory to exexute the whole pipeline"""

import logging
import asyncio

from services.crops.crop_ranking_service import CropRankingService
from services.soil.isdasoil_service import DesertLandError
from services.soil.soil_analysis_service import SoilAnalysisService
from services.climate.climate_service import ClimateService

from services.RAG.RAG_service import RAGService, VectorStore
from services.soil.water_insight_service import WaterInsightService

logger = logging.getLogger(__name__)


class AgronomicService:
    def __init__(
        self,
        soil_service: SoilAnalysisService,
        climate_service: ClimateService,
        crop_ranking_service: CropRankingService,
        rag_service: RAGService,
        water_insight_service: WaterInsightService,
    ):
        logger.info("Initializing AgronomicService with all sub-services")
        self.soil_service = soil_service
        self.climate_service = climate_service
        self.crop_ranking_service = crop_ranking_service
        self.water_insight_service = water_insight_service
        self.rag_service = rag_service
        logger.debug("AgronomicService initialized successfully")

    async def analyze(self, lat: float, lng: float):
        logger.info("Starting agronomic analysis for lat=%s, lng=%s", lat, lng)
        soil_data, climate_data = await asyncio.gather(
            self.soil_service.get_soil_analysis(lat, lng),
            self.climate_service.get_climate_profile(lat, lng),
        )

        # Calculate water insight
        water_insight = await self.water_insight_service.get_water_insight(soil_data, climate_data)
        crop_rankings = self.crop_ranking_service.rank_crops(soil_data, climate_data)
        logger.info("Crop ranking completed for lat=%s, lng=%s", lat, lng)
        
        logger.info("Generating RAG recommendation for lat=%s, lng=%s", lat, lng)
        # RAG service is async — call it directly
        recommendation = await self.rag_service.generate_recommendation(
            soil_data,
            climate_data,
            crop_rankings,
        )
        logger.info("Agronomic analysis completed for lat=%s, lng=%s", lat, lng)

        return {
            "coordinates": {"lat": lat, "lng": lng},
            "soil": soil_data.model_dump(),
            "climate": climate_data.model_dump(),
            "water_insight": water_insight,
            "crop_rankings": [ranking.model_dump() for ranking in crop_rankings],
            "recommendation": recommendation,
        }

    async def analyze_stream(self, lat: float, lng: float):
        result = {}
        yield {"type": "status", "message": "Analyse du sol et du climat..."}

        try:
            soil_data, climate_data = await asyncio.gather(
                self.soil_service.get_soil_analysis(lat, lng), self.climate_service.get_climate_profile(lat, lng)
            )
        except DesertLandError:

            climate_data = await self.climate_service.get_climate_profile(lat, lng)
            result = {
                "coordinates": {"lat": lat, "lng": lng},
                "soil": None,
                "climate": climate_data.model_dump(),
                "water_insight": None,
                "crop_rankings": None,
                "recommendation": [],
            }
            yield {"type": "result", "data": result}
            return

        yield {"type": "status", "message": "Calcul de la rétention d'eau..."}

        water_insight = await self.water_insight_service.get_water_insight(soil_data, climate_data)

        yield {"type": "status", "message": "Optimisation des cultures ..."}

        crop_rankings = self.crop_ranking_service.rank_crops(soil_data, climate_data)

        recommendation = await self.rag_service.generate_recommendation(
            soil_data,
            climate_data,
            crop_rankings,
        )

        result = {
            "coordinates": {"lat": lat, "lng": lng},
            "soil": soil_data.model_dump() if soil_data else None,
            "climate": climate_data.model_dump() if climate_data else None,
            "water_insight": water_insight,
            "crop_rankings": [ranking.model_dump() for ranking in crop_rankings],
            "recommendation": recommendation if recommendation else None,
        }
        logger.info("Streaming agronomic analysis completed for lat=%s, lng=%s", lat, lng)
        yield {"type": "result", "data": result}


if __name__ == "__main__":
    import json
    import os
    from pathlib import Path

    from dotenv import load_dotenv

    from services.soil.isdasoil_service import iSDAsoilService
    from services.soil.zone_service import ZoneService

    async def test() -> None:
        """CLI testing ground for building the agronomic pipeline incrementally."""
        backend_dir = Path(__file__).resolve().parents[2]
        load_dotenv(backend_dir / ".env")

        latitude = 14.6928
        longitude = -17.4467
        provider = iSDAsoilService(
            email=os.environ["ISDA_EMAIL"],
            password=os.environ["ISDA_PASSWORD"],
        )
        soil_service = SoilAnalysisService(
            isda_service=provider,
            zone_service=ZoneService(backend_dir / "data/geographic/senegal_agroecological_zones.geojson"),
            metadata_path=backend_dir / "data/processed/soil_metadata.json",
        )
        climate_service = await ClimateService.create(backend_dir / "data/processed/senegal_climate_monthly.feather")
        water_insight_service = WaterInsightService()
        with (backend_dir / "data/processed/crops_merged.json").open() as crop_file:
            ranking_service = CropRankingService(json.load(crop_file))

        try:
            # Step 1: verify that both environmental data services work together.
            soil_data, climate_data = await asyncio.gather(
                soil_service.get_soil_analysis(latitude, longitude),
                climate_service.get_climate_profile(latitude, longitude),
            )

            # Step 2: calculate water retention and deterministic crop rankings.
            water_insight = await water_insight_service.get_water_insight(soil_data, climate_data)
            rankings = ranking_service.rank_crops(soil_data, climate_data)
            print(
                json.dumps(
                    {
                        "water_insight": water_insight,
                        "crop_rankings": [ranking.model_dump() for ranking in rankings],
                    },
                    indent=2,
                    ensure_ascii=False,
                )
            )
            # Step 3: pass deterministic rankings to the RAG explanation layer.
        finally:
            await provider.client.aclose()

    async def main() -> None:
        load_dotenv()
        isda_service = iSDAsoilService(email=os.environ["ISDA_EMAIL"], password=os.environ["ISDA_PASSWORD"])
        zone_service = ZoneService(
            Path(__file__).resolve().parents[2] / "data/geographic/senegal_agroecological_zones.geojson"
        )

        soil_service = SoilAnalysisService(
            isda_service,
            zone_service,
            metadata_path=Path(__file__).resolve().parents[2] / "data/processed/soil_metadata.json",
        )

        climate_service = await ClimateService.create(
            Path(__file__).resolve().parents[2] / "data/processed/senegal_climate_monthly.feather"
        )
        ranking_service = CropRankingService(
            json.load(open(Path(__file__).resolve().parents[2] / "data/processed/crops_merged.json"))
        )
        md_file_path = Path(__file__).resolve().parents[2] / "data/RAG/knowledge_base.md"

        persist_directory = "../data/RAG/chroma_db"
        vector_store=await VectorStore.create(markdown_file=md_file_path, persist_directory=persist_directory)
        rag_service = RAGService(vector_store)
        service = AgronomicService(
            soil_service,
            climate_service,
            ranking_service,
            rag_service,
            water_insight_service=WaterInsightService(),
        )

        result = await service.analyze(14.859028460954358, -16.38041379951907)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    asyncio.run(main())
