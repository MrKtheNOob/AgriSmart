from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FarmBase(BaseModel):
    name: str
    region: str | None = None
    commune: str | None = None
    latitude: float
    longitude: float
    area_ha: float | None = None
    notes: str | None = None


class FarmCreate(FarmBase):
    pass


class FarmRead(FarmBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisReportBase(BaseModel):
    farm_id: int
    title: str | None = None
    sector_name: str | None = None
    latitude: float
    longitude: float
    analysis_payload: dict[str, Any] = Field(default_factory=dict)


class AnalysisReportCreate(AnalysisReportBase):
    pass


class AnalysisReportRead(AnalysisReportBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
