import asyncio
import logging
from dataclasses import dataclass
from typing import Awaitable, Callable, TypeVar

from app_config import Settings
from management.api import close_management_db, init_management_db
from services.RAG.RAG_service import RAGService
from services.RAG.vector_store import VectorStore
from services.agronomy.agronomic_service import AgronomicService
from services.climate.climate_service import ClimateService
from services.crops.crop_ranking_service import CropRankingService
from services.soil.isdasoil_service import iSDAsoilService
from services.soil.soil_analysis_service import SoilAnalysisService
from services.soil.water_insight_service import WaterInsightService
from services.soil.zone_service import ZoneService
from services.telemetry.telemetry_service import TelemetryService
from shared.database_service import DatabaseService

logger = logging.getLogger(__name__)
ServiceType = TypeVar("ServiceType")


class ServiceInitializationError(RuntimeError):
    """Identify the exact application service that failed during startup."""

    def __init__(self, service_name: str, error: Exception):
        self.service_name = service_name
        self.original_error = error
        super().__init__(f"Failed to initialize {service_name}: {error}")


def _build_service(
    service_name: str,
    factory: Callable[[], ServiceType],
) -> ServiceType:
    try:
        return factory()
    except Exception as error:
        raise ServiceInitializationError(service_name, error) from error


async def _initialize_service(
    service_name: str,
    initialization: Awaitable[ServiceType],
) -> ServiceType:
    try:
        return await initialization
    except Exception as error:
        raise ServiceInitializationError(service_name, error) from error


async def _clean_up_startup_failure(
    database: DatabaseService,
    soil_provider: iSDAsoilService,
) -> None:
    cleanup_steps = (
        ("management database reference", close_management_db()),
        ("iSDAsoil HTTP client", soil_provider.client.aclose()),
        ("database connection", database.close()),
    )
    for resource_name, cleanup in cleanup_steps:
        try:
            await cleanup
        except Exception:
            logger.exception("Failed to clean up %s", resource_name)


@dataclass
class ApplicationServices:
    """Initialized services owned by one FastAPI application lifespan."""

    agronomic: AgronomicService
    telemetry: TelemetryService
    database: DatabaseService
    soil_provider: iSDAsoilService

    async def close(self) -> None:
        logger.info("Closing application services")
        await close_management_db()
        await self.soil_provider.client.aclose()
        await self.database.close()
        logger.info("Application services closed")


async def create_application_services(settings: Settings) -> ApplicationServices:
    """Construct and connect the complete application service graph."""
    logger.info("Initializing application services")
    database = DatabaseService(settings.db_uri)
    soil_provider = iSDAsoilService(
        email=settings.isda_email,
        password=settings.isda_password,
    )

    try:
        await _initialize_service("database connection", database.connect())
        logger.info("Database connected")
        telemetry = _build_service(
            "telemetry service",
            lambda: TelemetryService(database),
        )
        await _initialize_service("telemetry schema", telemetry.init_table())
        await _initialize_service(
            "management schema",
            init_management_db(database),
        )
        logger.info("Management and telemetry databases initialized")

        zone_service = _build_service(
            "agroecological zone service",
            lambda: ZoneService(settings.zone_geojson_path),
        )
        soil = _build_service(
            "soil analysis service",
            lambda: SoilAnalysisService(
                isda_service=soil_provider,
                zone_service=zone_service,
                metadata_path=settings.soil_metadata_path,
            ),
        )
        climate, vector_store, crop_ranking_service = await asyncio.gather(
            _initialize_service(
                "climate service",
                ClimateService.create(settings.climate_data_path),
            ),
            _initialize_service(
                "RAG vector store",
                VectorStore.create(
                    markdown_file=str(settings.rag_markdown_path),
                    persist_directory=str(settings.rag_persist_directory),
                ),
            ),
            _initialize_service(
                "crop ranking service",
                asyncio.to_thread(
                    CropRankingService.create,
                    settings.crop_data_path,
                ),
            ),
        )

        rag = _build_service("RAG service", lambda: RAGService(vector_store))
        water_insight = _build_service(
            "water insight service",
            WaterInsightService,
        )
        agronomic = _build_service(
            "agronomic service",
            lambda: AgronomicService(
                soil_service=soil,
                climate_service=climate,
                crop_ranking_service=crop_ranking_service,
                rag_service=rag,
                water_insight_service=water_insight,
            ),
        )
        logger.info("Application services initialized successfully")
        return ApplicationServices(
            agronomic=agronomic,
            telemetry=telemetry,
            database=database,
            soil_provider=soil_provider,
        )
    except Exception as error:
        logger.error("%s; cleaning up", error, exc_info=True)
        await _clean_up_startup_failure(database, soil_provider)
        raise
