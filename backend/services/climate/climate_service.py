import asyncio
import logging
import time
from pathlib import Path
from typing import Any, cast

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
DEFAULT_DATA_PATH = Path(__file__).resolve().parents[2] / "data/processed/senegal_climate_monthly.feather"


class ClimateDataPeriod(BaseModel):
    start: str
    end: str


class ClimateSummary(BaseModel):
    temperature_mean_c: float
    annual_precipitation_mean_mm: float
    heat_days_mean: float
    rainy_days_mean: float


class MonthlyClimate(BaseModel):
    month: int = Field(ge=1, le=12)
    temperature_mean_c: float
    temperature_min_c: float
    temperature_max_c: float
    relative_humidity_mean_pct: float
    apparent_temperature_mean_c: float
    precipitation_mean_mm: float
    vapor_pressure_deficit_mean_kpa: float
    heat_days_mean: float
    rainy_days_mean: float
    years_observed: int


class ClimateMetrics(BaseModel):
    region: str
    latitude: float
    longitude: float
    data_period: ClimateDataPeriod
    summary: ClimateSummary
    monthly_climate: list[MonthlyClimate]


class ClimateService:
    def __init__(self, feather_path: str | Path = DEFAULT_DATA_PATH):
        logger.info("Loading monthly climate data from %s", feather_path)
        self._load_feather(feather_path)

    def _load_feather(self, feather_path: str | Path) -> None:
        self.df = pd.read_feather(feather_path)
        required_columns = {
            "region",
            "latitude",
            "longitude",
            "year",
            "month",
            "month_start",
            "temperature_mean_c",
            "temperature_min_c",
            "temperature_max_c",
            "relative_humidity_mean_pct",
            "apparent_temperature_mean_c",
            "precipitation_total_mm",
            "vapor_pressure_deficit_mean_kpa",
            "heat_days",
            "rainy_days",
        }
        missing_columns = required_columns.difference(self.df.columns)
        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise ValueError(f"Monthly climate dataset is missing columns: {missing}")

        self.df["region"] = self.df["region"].astype(str)
        self.df["month_start"] = pd.to_datetime(self.df["month_start"], utc=True)
        logger.debug("Loaded %s monthly climate records", len(self.df))

    @classmethod
    async def create(cls, feather_path: str | Path = DEFAULT_DATA_PATH) -> "ClimateService":
        self = cls.__new__(cls)
        await asyncio.to_thread(self._load_feather, feather_path)
        return self

    def _get_nearest_station(self, lat: float, lon: float) -> tuple[str, float, float]:
        stations = self.df[["latitude", "longitude", "region"]].drop_duplicates().reset_index(drop=True)
        stations["distance"] = np.sqrt((stations["latitude"] - lat) ** 2 + (stations["longitude"] - lon) ** 2)
        nearest = cast(
            dict[str, Any],
            stations.loc[stations["distance"].idxmin()].to_dict(),
        )
        return str(nearest["region"]), float(nearest["latitude"]), float(nearest["longitude"])

    def _build_profile(self, region: str, latitude: float, longitude: float) -> ClimateMetrics:
        region_data = self.df[self.df["region"] == region].copy()
        if region_data.empty:
            raise ValueError(f"No monthly climate records found for {region}")

        grouped = region_data.groupby("month", as_index=False).agg(
            temperature_mean_c=("temperature_mean_c", "mean"),
            temperature_min_c=("temperature_min_c", "mean"),
            temperature_max_c=("temperature_max_c", "mean"),
            relative_humidity_mean_pct=("relative_humidity_mean_pct", "mean"),
            apparent_temperature_mean_c=("apparent_temperature_mean_c", "mean"),
            precipitation_mean_mm=("precipitation_total_mm", "mean"),
            vapor_pressure_deficit_mean_kpa=(
                "vapor_pressure_deficit_mean_kpa",
                "mean",
            ),
            heat_days_mean=("heat_days", "mean"),
            rainy_days_mean=("rainy_days", "mean"),
            years_observed=("year", "nunique"),
        )
        if len(grouped) != 12:
            available = ", ".join(str(month) for month in grouped["month"].tolist())
            raise ValueError(f"Expected 12 climate months for {region}; found {available}")

        monthly_records = cast(
            list[dict[str, Any]],
            grouped.to_dict(orient="records"),
        )
        monthly_climate = [
            MonthlyClimate(
                month=int(row["month"]),
                temperature_mean_c=round(float(row["temperature_mean_c"]), 2),
                temperature_min_c=round(float(row["temperature_min_c"]), 2),
                temperature_max_c=round(float(row["temperature_max_c"]), 2),
                relative_humidity_mean_pct=round(float(row["relative_humidity_mean_pct"]), 2),
                apparent_temperature_mean_c=round(float(row["apparent_temperature_mean_c"]), 2),
                precipitation_mean_mm=round(float(row["precipitation_mean_mm"]), 2),
                vapor_pressure_deficit_mean_kpa=round(float(row["vapor_pressure_deficit_mean_kpa"]), 3),
                heat_days_mean=round(float(row["heat_days_mean"]), 1),
                rainy_days_mean=round(float(row["rainy_days_mean"]), 1),
                years_observed=int(row["years_observed"]),
            )
            for row in monthly_records
        ]

        summary = ClimateSummary(
            temperature_mean_c=round(float(grouped["temperature_mean_c"].mean()), 2),
            annual_precipitation_mean_mm=round(float(grouped["precipitation_mean_mm"].sum()), 2),
            heat_days_mean=round(float(grouped["heat_days_mean"].sum()), 1),
            rainy_days_mean=round(float(grouped["rainy_days_mean"].sum()), 1),
        )
        return ClimateMetrics(
            region=region,
            latitude=latitude,
            longitude=longitude,
            data_period=ClimateDataPeriod(
                start=region_data["month_start"].min().date().isoformat(),
                end=region_data["month_start"].max().date().isoformat(),
            ),
            summary=summary,
            monthly_climate=monthly_climate,
        )

    async def get_climate_profile(self, lat: float, lon: float) -> ClimateMetrics:
        logger.info("Retrieving climate profile for lat=%s, lon=%s", lat, lon)
        try:
            region, station_latitude, station_longitude = await asyncio.to_thread(self._get_nearest_station, lat, lon)
            response = await asyncio.to_thread(self._build_profile, region, station_latitude, station_longitude)
            logger.info("Climate profile retrieved from nearest station: %s", region)
            return response
        except Exception:
            logger.exception("Failed to retrieve climate profile")
            raise


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    start_time = time.time()

    async def main() -> None:
        service = await ClimateService.create()
        result = await service.get_climate_profile(
            lat=14.64544074287179,
            lon=-16.29337186288759,
        )
        output_path = Path(__file__).resolve().parents[2] / "data/processed/climate_profile.json"
        output_path.write_text(result.model_dump_json(indent=2), encoding="utf-8")

    asyncio.run(main())
    logger.info("Climate service test completed in %.2f seconds", time.time() - start_time)
