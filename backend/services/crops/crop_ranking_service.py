from datetime import UTC, datetime
import json
import logging
from math import ceil
from numbers import Real
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from services.climate.climate_service import ClimateMetrics
from services.soil.schemas import SoilProfile


logger = logging.getLogger(__name__)


class CropRankingResult(BaseModel):
    crop_name: str
    soil_score: float
    climate_score: float
    overall_score: float
    planting_month: int
    growing_months: int


class CropRankingService:
    """Rank crops using equally weighted soil and climate suitability."""

    SOIL_REQUIREMENTS = (
        ("nitrogen_total_gkg", "nitrogen_total"),
        ("phosphorus_extractable_ppm", "phosphorous_extractable"),
        ("potassium_extractable_ppm", "potassium_extractable"),
        ("carbon_organic_gkg", "carbon_organic"),
        ("clay_percentage", "clay_content"),
        ("sand_percentage", "sand_content"),
        ("ph", "ph"),
    )

    def __init__(self, crop_dataset: list[dict[str, Any]]):
        self.crop_dataset = crop_dataset

    @staticmethod
    def _numeric(value: object) -> float:
        if isinstance(value, Real) and not isinstance(value, bool):
            return float(value)
        raise TypeError(f"Expected a numeric value, received {value!r}")

    @staticmethod
    def _label_matches(actual: str, preferences: list[str]) -> bool:
        normalized_actual = actual.casefold()
        return any(
            preference.casefold().removeprefix("sol ") in normalized_actual
            for preference in preferences
        )
    @classmethod
    def create(cls, crop_data_path: str | Path) -> "CropRankingService":
        """Create a service by loading its crop dataset from a JSON file."""
        with Path(crop_data_path).open(encoding="utf-8") as crop_file:
            return cls(json.load(crop_file))

    def match_soil(self, crop: dict[str, Any], soil_profile: SoilProfile) -> float:
        """Score all required soil properties, failing on incomplete pipeline data."""
        scores: list[float] = []
        for requirement_name, soil_name in self.SOIL_REQUIREMENTS:
            requirement = crop[requirement_name]
            minimum = self._numeric(requirement["min"])
            maximum = self._numeric(requirement["max"])
            soil_value = self._numeric(soil_profile.raw_properties[soil_name])
            scores.append(100.0 if minimum <= soil_value <= maximum else 0.0)

        minimum_cec = self._numeric(
            crop["cation_exchange_capacity_cmol_kg"]["min_required"]
        )
        soil_cec = self._numeric(
            soil_profile.raw_properties["cation_exchange_capacity"]
        )
        scores.append(100.0 if soil_cec >= minimum_cec else 0.0)

        usda_class = soil_profile.properties["Classe texturale (USDA)"]
        scores.append(
            100.0
            if self._label_matches(usda_class, crop["usda_texture_preferences"])
            else 0.0
        )
        scores.append(
            100.0
            if self._label_matches(
                soil_profile.classification, crop["senegal_soil_equivalents"]
            )
            else 0.0
        )
        return round(sum(scores) / len(scores), 1)

    @classmethod
    def _range_score(cls, value: float, optimal: object, tolerable: object) -> float:
        """Return 100 in the optimal band, tapering to 50 at tolerance limits."""
        if not isinstance(optimal, dict) or not isinstance(tolerable, dict):
            raise TypeError("Climate ranges must be objects")
        optimal_min = cls._numeric(optimal["minimum"])
        optimal_max = cls._numeric(optimal["maximum"])
        tolerable_min = cls._numeric(tolerable["minimum"])
        tolerable_max = cls._numeric(tolerable["maximum"])
        if not tolerable_min <= optimal_min <= optimal_max <= tolerable_max:
            raise ValueError("Climate ranges are not ordered correctly")
        if optimal_min <= value <= optimal_max:
            return 100.0
        if value < tolerable_min or value > tolerable_max:
            return 0.0
        if value < optimal_min:
            span = optimal_min - tolerable_min
            return 50.0 + 50.0 * (value - tolerable_min) / span
        span = tolerable_max - optimal_max
        return 50.0 + 50.0 * (tolerable_max - value) / span

    @classmethod
    def _growth_months(cls, crop: dict[str, Any]) -> int:
        maximum_days = cls._numeric(crop["growth_time"]["maximum"])
        if maximum_days <= 0:
            raise ValueError(f"{crop['crop_name']} has an invalid growth time")
        return ceil(maximum_days / 30)

    def match_climate(self,crop: dict[str, Any],climate_data: ClimateMetrics) -> float:
        """Score recurring monthly temperatures from planting through harvest."""
        # A requested planting date can be supported later. For the first working
        # version, ranking starts in the month when the request is made.
        month = datetime.now(UTC).month
        climate = (
            climate_data
            if isinstance(climate_data, ClimateMetrics)
            else ClimateMetrics.model_validate(climate_data)
        )
        rows_by_month = {
            row.month: row for row in climate.monthly_climate
        }
        required_months = self._growth_months(crop)
        growing_window = [
            ((month - 1 + offset) % 12) + 1 for offset in range(required_months)
        ]

        temperature = crop["climate_requirements"]["temperature"]

        monthly_scores: list[float] = []
        for climate_month in growing_window:
            row = rows_by_month[climate_month]
            value = row.temperature_mean_c
            score = self._range_score(
                value, temperature["optimal"], temperature["tolerable"]
            )
            monthly_scores.append(score)
        return round(sum(monthly_scores) / len(monthly_scores), 1)

    def rank_crop(
        self,
        crop: dict[str, Any],
        soil_profile: SoilProfile,
        climate_data: ClimateMetrics,
    ) -> CropRankingResult:
        month = datetime.now(UTC).month
        soil_score = self.match_soil(crop, soil_profile)
        climate_score = self.match_climate(crop, climate_data)
        overall_score = round(0.5 * soil_score + 0.5 * climate_score, 1)
        return CropRankingResult(
            crop_name=crop["crop_name"],
            soil_score=soil_score,
            climate_score=climate_score,
            overall_score=overall_score,
            planting_month=month,
            growing_months=self._growth_months(crop),
        )

    def rank_crops(self,soil_profile: SoilProfile,climate_data: ClimateMetrics) -> list[CropRankingResult]:
        logger.info("Ranking %s crops", len(self.crop_dataset))
        results = [
            self.rank_crop(crop, soil_profile, climate_data)
            for crop in self.crop_dataset
        ]
        logger.info("Rankings: %s", results)
        top_crops = sorted(
            results,
            key=lambda result: result.overall_score,
            reverse=True,
        )[:3]
        logger.info(
            "Top crop rankings: %s",
            ", ".join(
                f"{result.crop_name} ({result.overall_score:.1f})"
                for result in top_crops
            ),
        )
        return top_crops
