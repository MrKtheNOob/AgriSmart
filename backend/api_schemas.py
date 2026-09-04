from pydantic import BaseModel
class AnalysisRequest(BaseModel):
    lat: float
    lng: float
    session_id: str | None = None


class CropRecommendation(BaseModel):
    name: str
    reason: str