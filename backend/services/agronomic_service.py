"""Master service using all services in this directory to exexute the whole pipeline"""
import os
import logging
import time
from dotenv import load_dotenv
import asyncio

from isdasoil_service import iSDAsoilService
from climate_service import ClimateService
from vector_store import VectorStore
from RAG_service import RAGService

logging.basicConfig(
    format='%(asctime)s %(levelname)-8s %(message)s',
    level=logging.INFO,
    datefmt='%Y-%m-%d %H:%M:%S'  # Custom time format
)
logger = logging.getLogger(__name__)


class AgronomicService:
    def __init__(
        self,
        soil_service: iSDAsoilService,
        climate_service: ClimateService,
        
        rag_service: RAGService,
    ):
        logger.info("Initializing AgronomicService with all sub-services")
        self.soil_service = soil_service
        self.climate_service = climate_service
        # self.water_insight_service=water_insight_service
        self.rag_service = rag_service
        logger.debug("AgronomicService initialized successfully")

    async def analyze(self, lat: float, lng: float):

        
        soil_data, climate_data = await asyncio.gather(
            self.soil_service.get_soil_analysis(lat, lng),
            self.climate_service.get_climate_profile(lat, lng),
        )
        
            
        # water_insight=self.water_insight_service.get_water_insight(soil_data,climate_data)

        # RAG service is async — call it directly
        recommendation = await self.rag_service.generate_recommendation(
            soil_data, climate_data
        )

        return {
            "coordinates": {"lat": lat, "lng": lng},
            "soil": soil_data,
            "climate": climate_data,
            "recommendation": recommendation,
        }


if __name__ == "__main__":

    logger.info("Starting AgronomicService main execution")

    load_dotenv()
    FILE_DIR="../files/"
    FEATHER_PATH=FILE_DIR+"/morocco_climate.feather"
    MARKDOWN_FILE="../RAG/agronomy_data.md"
    PERSIST_DIRECTORY="../RAG/chroma_db"
    
    try:

        async def main():
            logger.info("Initializing all services...")
            soil_service = iSDAsoilService(
                email=os.getenv("ISDA_EMAIL"), password=os.getenv("ISDA_PASSWORD")
            )
            climate_service, vector_store = await asyncio.gather(
                ClimateService.create(feather_path=FEATHER_PATH),
                VectorStore.create(markdown_file=MARKDOWN_FILE,persist_directory=PERSIST_DIRECTORY),
            )
            rag_service = RAGService(vector_store)
            start_time = time.time()
            agronomic_service = AgronomicService(
                soil_service=soil_service,
                climate_service=climate_service,
                rag_service=rag_service,
            )
            logger.info("All services initialized")

            logger.info("Analyzing Fes, Morocco coordinates...")
            result = await agronomic_service.analyze(lat=26.4801, lng=-13.7057)
            logger.info(f"Analysis completed in {time.time() - start_time:.2f} seconds")
            print(result)

        asyncio.run(main())
        
    except Exception as e:
        logger.error(f"Fatal error in main execution: {str(e)}", exc_info=True)
        raise
