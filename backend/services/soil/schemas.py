from typing import Any

from pydantic import BaseModel, Field


class SoilPropertyValue(BaseModel):
    value: float | int | str | None = None
    unit: str | None = None
    type: str = "float"


class SoilPropertyDepth(BaseModel):
    value: str | None = Field(None, description="The depth range (e.g., '0-20')")
    unit: str | None = None


class SoilData(BaseModel):
    value: SoilPropertyValue
    depth: SoilPropertyDepth
    uncertainty: Any | None = None


class LayersDepth(BaseModel):
    unit: str | None = None
    values: list[str]


class SoilPropertyMetadata(BaseModel):
    description: str
    theme: str
    unit: str | None = None
    depths: LayersDepth


class PropertyResponse(BaseModel):
    property: dict[str, list[SoilData]]


class AgroecologicalZone(BaseModel):
    code: str
    name: str


class SoilProfile(BaseModel):
    target_depth: str = "0-20cm"
    classification: str
    properties: dict[str, str]
    raw_properties: dict[str, float] = Field(default_factory=dict)
    agroecological_zone: AgroecologicalZone | None = None
