import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

from .schemas import SoilProfile, SoilPropertyMetadata
from .isdasoil_service import iSDAsoilService, PropertyResponse
from .zone_service import ZoneService


logger = logging.getLogger(__name__)


class SoilAnalysisService:
    """Combine provider data, local interpretation, and geographic context."""

    def __init__(
        self,
        isda_service: iSDAsoilService,
        zone_service: ZoneService,
        metadata_path: str | Path,
    ):
        self.isda_service = isda_service
        self.zone_service = zone_service
        self._metadata = self._load_metadata(metadata_path)

    async def get_soil_analysis(
        self, lat: float, lon: float, depth: str = "0-20"
    ) -> SoilProfile:
        """Build one domain result from provider properties and local zone data."""
        logger.info("Retrieving soil profile for lat=%s, lon=%s", lat, lon)
        # Keep remote acquisition in the adapter, then enrich its result locally.
        # Zone lookup is independent of iSDA and therefore still replaceable.
        provider_data = await self.isda_service.get_soil_properties(lat, lon, depth)
        profile = self._interpret_agronomy(provider_data, depth)
        profile.agroecological_zone = self.zone_service.find_zone(lat, lon)
        logger.info(
            "Soil profile retrieved: classification=%s, zone=%s",
            profile.classification,
            profile.agroecological_zone.code if profile.agroecological_zone else "unknown",
        )
        return profile

    @staticmethod
    def _load_metadata(path: str | Path) -> dict[str, SoilPropertyMetadata]:
        """Validate display metadata once when the service is constructed."""
        try:
            with Path(path).open(encoding="utf-8") as metadata_file:
                data = json.load(metadata_file)
            return {
                name: SoilPropertyMetadata(**value)
                for name, value in data["property"].items()
            }
        except Exception as error:
            logger.exception("Could not load soil metadata from %s", path)
            raise

    def _interpret_agronomy(self, data: PropertyResponse, depth: str) -> SoilProfile:
        """Convert the provider response into calculation and presentation views."""
        properties: dict[str, str] = {}
        raw_properties: dict[str, float] = {}

        for property_name, measurements in data.property.items():
            if not measurements or measurements[0].value.value is None:
                continue

            value = measurements[0].value.value
            # Numeric values remain unformatted for downstream water and crop
            # calculations. Categorical fields, such as texture, stay display-only.
            try:
                raw_properties[property_name] = float(value)
            except (ValueError, TypeError):
                pass

            metadata = self._metadata.get(property_name)
            # Metadata supplies readable labels and units without changing the
            # original provider keys stored in raw_properties.
            description = metadata.description if metadata else property_name
            unit = measurements[0].value.unit or (metadata.unit if metadata else "")
            label = self._translate_property_label(property_name, description)
            display_value = (
                self._translate_texture_class(value)
                if property_name == "USDA Texture Class" and isinstance(value, str)
                else value
            )
            properties[label] = f"{display_value} {unit}".strip()

        for key in ("pH", "Classe texturale (USDA)", "USDA Texture Class"):
            # Some iSDA values have no unit and were historically rendered with
            # the literal text "None"; remove it only from the display view.
            if key in properties:
                properties[key] = properties[key].replace("None", "").strip()

        return SoilProfile(
            target_depth=f"{depth} centimeters",
            classification=self._classify_senegal_soil(raw_properties),
            properties=properties,
            raw_properties=raw_properties,
        )

    @staticmethod
    def _translate_property_label(property_name: str, description: str) -> str:
        if property_name == "USDA Texture Class":
            return "Classe texturale (USDA)"
        return description

    @staticmethod
    def _translate_texture_class(value: str) -> str:
        translations = {
            "Sand": "Sable",
            "Loamy Sand": "Sable limoneux",
            "Sandy Loam": "Limon sableux",
            "Sandy Clay Loam": "Limon argilo-sableux",
            "Clay Loam": "Limon argileux",
            "Silty Clay Loam": "Limon argilo-limoneux",
            "Silty Clay": "Argile limoneuse",
            "Silt Loam": "Limon",
            "Silt": "Limon fin",
            "Loam": "Limon franc",
            "Sandy Clay": "Argile sableuse",
            "Clay": "Argile",
            "Clayey Sand": "Sable argileux",
        }
        return translations.get(value, value)

    @staticmethod
    def _classify_senegal_soil(raw_properties: dict[str, float]) -> str:
        """Classify a profile using ordered Senegal-specific heuristic rules."""
        sand = raw_properties["sand_content"]
        clay = raw_properties["clay_content"]
        silt = raw_properties["silt_content"]
        ph = raw_properties["ph"]
        organic_carbon = raw_properties["carbon_organic"]

        # Chemical hazards and distinctive organic profiles take precedence over
        # texture, after which increasingly specific clay/sand rules are applied.
        # Returning on the first match makes that precedence explicit.
        if ph <= 5.0:
            return "Tanne"
        if organic_carbon >= 15.0 and sand >= 50.0:
            return "Niayes"
        if clay >= 40.0:
            return "Hollaldé"
        if clay >= 20.0:
            return "Fondé" if silt >= 20.0 else "Deck"
        if sand >= 80.0 and clay <= 10.0:
            return "Dior"
        return "Deck-Dior"


if __name__ == "__main__":
    import asyncio

    from .isdasoil_service import iSDAsoilService
    from .zone_service import ZoneService

    async def main():
        load_dotenv()
        isda_service = iSDAsoilService(email=os.getenv("ISDA_EMAIL",""), password=os.getenv("ISDA_PASSWORD",""))
        zone_service = ZoneService(geojson_path="./data/geographic/senegal_agroecological_zones.geojson")
        soil_analysis_service = SoilAnalysisService(
            isda_service=isda_service,
            zone_service=zone_service,
            metadata_path="./data/processed/soil_metadata.json",
        )

        lat, lon = 14.64544074287179, -16.29337186288759  # Example coordinates
        depth = "0-20"
        soil_profile = await soil_analysis_service.get_soil_analysis(lat, lon, depth)
        j=json.dumps(soil_profile.model_dump(), indent=2, ensure_ascii=False)
        with open("./data/processed/soil_analysis_output.json", "w", encoding="utf-8") as f:
            f.write(j)

    asyncio.run(main())
