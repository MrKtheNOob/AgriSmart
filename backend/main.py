import asyncio
import os
import logging
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse

from management.api import close_management_db, init_management_db, router as management_router
from services.RAG.RAG_service import RAGService
from services.agronomy.agronomic_service import AgronomicService
from services.climate.climate_service import ClimateService
from shared.database_service import DatabaseService
from services.soil.isdasoil_service import iSDAsoilService
from services.RAG.vector_store import VectorStore
from services.soil.water_insight_service import WaterInsightService
from services.telemetry.telemetry_service import TelemetryService


# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    force=True
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# --- Global Service Instance ---
agronomic_service: AgronomicService | None = None
telemetry_service: TelemetryService | None= None
db_service: DatabaseService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global agronomic_service, telemetry_service, db_service

    logger.info("Initializing AgriSmart Services...")

    # Define paths relative to this file
    base_dir = os.path.dirname(__file__)
    feather_path = os.path.join(base_dir, "data/processed/senegal_climate.feather")
    markdown_file = os.path.join(base_dir, "data/RAG/agronomy_data.md")
    persist_directory = os.path.join(base_dir, "data/RAG/chroma_db")

    try:
        # Database and telemetry service initialization
        db_uri = os.getenv("DB_URI")
        if not db_uri:
            raise RuntimeError("No database URI found for database service.")

        db_service = DatabaseService(db_uri)
        await db_service.connect()
        telemetry_service = TelemetryService(db_service)
        await telemetry_service.init_table()
        await init_management_db(db_service)

        # Initialize sub-services
        soil_service = iSDAsoilService(
            email=os.getenv("ISDA_EMAIL",""), password=os.getenv("ISDA_PASSWORD","")
        )

        # Async initialization

        climate_service, vector_store = await asyncio.gather(
            ClimateService.create(feather_path=feather_path),
            VectorStore.create(
                markdown_file=markdown_file, persist_directory=persist_directory
            ),
        )

        rag_service = RAGService(vector_store)
        water_insight_service = WaterInsightService()
        # Master service
        agronomic_service = AgronomicService(
            soil_service=soil_service,
            climate_service=climate_service,
            rag_service=rag_service,
            water_insight_service=water_insight_service,
        )

        logger.info("AgriSmart Services successfully initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}", exc_info=True)
        raise
        # We don't raise here to allow the app to start (and maybe show health errors),
        # but the endpoint will fail.

    yield
    logger.info("Shutting down AgriSmart Services...")
    await close_management_db()
    if db_service:
        await db_service.close()


app = FastAPI(title="AgriSmart API", lifespan=lifespan)
app.include_router(management_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class AnalysisRequest(BaseModel):
    lat: float
    lng: float


class CropRecommendation(BaseModel):
    name: str
    reason: str


@app.get("/telemetry/count")
async def get_telemetry_count():
    if not telemetry_service:
        return {"count": 0}
    count = await telemetry_service.get_analysis_count()
    return {"count": count}


@app.get("/")
async def root():
    return {"message": "Welcome to AgriSmart Precision Crop Planning API"}


@app.get("/health")
async def health():
    if agronomic_service:
        return {"status": "healthy", "services": "initialized"}
    return {"status": "unhealthy", "services": "not_initialized"}


def parse_recommendation(result):
    # The RAG service returns a JSON string, we should parse it if it's not already a dict
    if isinstance(result.get("recommendation"), str):
        try:
            # Basic cleaning if LLM adds markdown blocks
            clean_json = (
                result["recommendation"]
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            result["recommendation"] = json.loads(clean_json)
        except Exception as parse_err:
            logger.error(f"Failed to parse LLM recommendation JSON: {parse_err}")
            # Fallback or keep as string
    return result


@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    if not agronomic_service:
        raise HTTPException(status_code=503, detail="Services not initialized")

    try:
        lat = round(request.lat, 3)
        lng = round(request.lng, 3)
        
        # Log telemetry
        if telemetry_service:
            asyncio.create_task(telemetry_service.log_analysis(lat, lng))

        result = await agronomic_service.analyze(lat, lng)
        logger.info(
            f"Received analysis request for lat={request.lat}, lng={request.lng}"
        )

        return parse_recommendation(result)
    except Exception as e:
        logger.error(f"Error during analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze-stream")
async def analyze_stream(lat: float, lng: float):
    # Log telemetry
    if telemetry_service:
        asyncio.create_task(telemetry_service.log_analysis(lat, lng))
    
    async def event_generator():
        global agronomic_service
        if not agronomic_service:
            yield {"data": json.dumps({"type": "error", "message": "Services not initialized"})}
            return
        try:
            async for event in agronomic_service.analyze_stream(lat, lng):
                if event["type"] == "result":
                    event["data"] = parse_recommendation(event["data"])
                
                yield {"data": json.dumps(event)}
        except Exception as e:
            logger.error(f"Error during streaming analysis: {e}", exc_info=True)
            yield {"data": json.dumps({"type": "error", "message": str(e)})}

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")), log_level="info")
