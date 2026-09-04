import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    """Environment values and repository paths required at application startup."""

    db_uri: str
    isda_email: str
    isda_password: str
    climate_data_path: Path
    crop_data_path: Path
    soil_metadata_path: Path
    zone_geojson_path: Path
    rag_markdown_path: Path
    rag_persist_directory: Path

    @classmethod
    def from_environment(cls) -> "Settings":
        backend_dir = Path(__file__).resolve().parent
        load_dotenv(backend_dir / ".env")

        required_environment = ("DB_URI", "ISDA_EMAIL", "ISDA_PASSWORD")
        missing = [name for name in required_environment if not os.environ.get(name)]
        if missing:
            raise RuntimeError(
                f"Missing required environment variables: {', '.join(missing)}"
            )

        return cls(
            db_uri=os.environ["DB_URI"],
            isda_email=os.environ["ISDA_EMAIL"],
            isda_password=os.environ["ISDA_PASSWORD"],
            climate_data_path=(
                backend_dir / "data/processed/senegal_climate_monthly.feather"
            ),
            crop_data_path=backend_dir / "data/processed/crops_merged.json",
            soil_metadata_path=backend_dir / "data/processed/soil_metadata.json",
            zone_geojson_path=(
                backend_dir / "data/geographic/senegal_agroecological_zones.geojson"
            ),
            rag_markdown_path=backend_dir / "data/RAG/knowledge_base.md",
            rag_persist_directory=backend_dir / "data/RAG/chroma_db",
        )
