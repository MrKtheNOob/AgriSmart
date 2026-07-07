from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from services.telemetry.schemas import TelemetryDownloadRequest, TelemetryVisitRequest
from services.telemetry.telemetry_service import TelemetryService

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


def get_telemetry_service(request: Request) -> TelemetryService:
    service = getattr(request.app.state, "telemetry_service", None)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telemetry service is not initialized",
        )
    return service


@router.post("/visit")
async def log_visit(
    request: TelemetryVisitRequest,
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
):
    await telemetry_service.log_visit(request.session_id)
    return {"ok": True}


@router.get("/count")
async def get_telemetry_count(
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
):
    count = await telemetry_service.get_device_count()
    return {"count": count}


@router.post("/download")
async def log_download(
    request: TelemetryDownloadRequest,
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
):
    await telemetry_service.log_download(
        request.session_id,
        request.lat,
        request.lng,
        request.data,
    )
    return {"ok": True}
