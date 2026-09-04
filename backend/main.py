import os
import logging
import json
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app_config import Settings
from api_schemas import AnalysisRequest
from logging_config import configure_logging

configure_logging()

from management.api import router as management_router
from service_setup import ApplicationServices, create_application_services
from services.agronomy.agronomic_service import AgronomicService
from services.telemetry.api import get_telemetry_service, router as telemetry_router
from services.telemetry.telemetry_service import TelemetryService
from shared.rate_limiter import RateLimitMiddleware, RateLimitRule


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AgriSmart Services...")
    try:
        services = await create_application_services(Settings.from_environment())
        app.state.application_services = services
        app.state.db_service = services.database
        app.state.telemetry_service = services.telemetry
        logger.info("AgriSmart Services successfully initialized.")
        yield
    except Exception as error:
        logger.error("Failed to initialize services: %s", error, exc_info=True)
        raise
    finally:
        initialized = getattr(app.state, "application_services", None)
        if initialized is not None:
            logger.info("Shutting down AgriSmart Services...")
            await initialized.close()


app = FastAPI(title="AgriSmart API", lifespan=lifespan)
app.include_router(management_router)
app.include_router(telemetry_router)

RATE_LIMIT_RULES = {
    ("POST", "/analyze"): RateLimitRule(max_requests=12, window_seconds=60),
    ("GET", "/analyze-stream"): RateLimitRule(max_requests=6, window_seconds=60),
    ("POST", "/telemetry/visit"): RateLimitRule(max_requests=60, window_seconds=60),
    ("POST", "/telemetry/download"): RateLimitRule(max_requests=20, window_seconds=60),
    # ("POST", "/management/farms"): RateLimitRule(max_requests=20, window_seconds=60),
    # ("POST", "/management/analysis-reports"): RateLimitRule(
    #     max_requests=20, window_seconds=60
    # ),
}

app.add_middleware(RateLimitMiddleware, rules=RATE_LIMIT_RULES)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agri-smart-beta.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to AgriSmart Precision Crop Planning API"}

@app.get("/health")
async def health(request: Request):
    if getattr(request.app.state, "application_services", None) is not None:
        return {"status": "healthy", "services": "initialized"}
    return {"status": "unhealthy", "services": "not_initialized"}


def get_agronomic_service(request: Request) -> AgronomicService:
    services: ApplicationServices | None = getattr(
        request.app.state, "application_services", None
    )
    if services is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agronomic service is not initialized",
        )
    return services.agronomic


# this should be inside the according service , not here in the api layer
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
async def analyze(
    request: AnalysisRequest,
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
    agronomic_service: AgronomicService = Depends(get_agronomic_service),
):
    try:
        lat = round(request.lat, 3)
        lng = round(request.lng, 3)

        result = await agronomic_service.analyze(lat, lng)
        parsed_result = parse_recommendation(result)

        await telemetry_service.log_analysis(
            request.session_id,
            lat,
            lng,
            parsed_result,
        )
        logger.info(
            f"Received analysis request for lat={request.lat}, lng={request.lng}"
        )

        return parsed_result
    except Exception as e:
        logger.error(f"Error during analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze-stream")
async def analyze_stream(
    lat: float,
    lng: float,
    session_id: str | None = None,
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
    agronomic_service: AgronomicService = Depends(get_agronomic_service),
):
    
    async def event_generator():
        try:
            async for event in agronomic_service.analyze_stream(lat, lng):
                if event["type"] == "result":
                    event["data"] = parse_recommendation(event["data"])
                    await telemetry_service.log_analysis(
                        session_id,
                        lat,
                        lng,
                        event["data"],
                    )
                
                yield {"data": json.dumps(event)}
        except Exception as e:
            logger.error(f"Error during streaming analysis: {e}", exc_info=True)
            yield {"data": json.dumps({"type": "error", "message": str(e)})}

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")), log_level="info")
