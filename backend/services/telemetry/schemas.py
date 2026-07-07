from __future__ import annotations

from pydantic import BaseModel


class TelemetryVisitRequest(BaseModel):
    session_id: str | None = None


class TelemetryAnalysisRequest(BaseModel):
    session_id: str | None = None
    lat: float | None = None
    lng: float | None = None
    data: dict | list | None = None


class TelemetryDownloadRequest(BaseModel):
    session_id: str | None = None
    lat: float | None = None
    lng: float | None = None
    data: dict | list | None = None
