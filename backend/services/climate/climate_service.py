import logging
import pandas as pd
import numpy as np
from pydantic import BaseModel
import time
import asyncio

logger = logging.getLogger(__name__)


class ClimateMetrics(BaseModel):
    region: str
    annual_stats: dict
    seasonality: float
    heat_days: int
    frost_days: int
    drought_index: dict


class ClimateService:
    def __init__(self, feather_path="../data/processed/senegal_climate.feather"):
        # synchronous constructor remains for backward compatibility
        logger.info(f"Loading climate data from {feather_path}")
        self._load_feather(feather_path)

    def _load_feather(self, feather_path: str):
        self.df = pd.read_feather(feather_path)
        self.df["region"] = self.df["region"].astype(str)  # ensure string dtype
        self.df["time"] = pd.to_datetime(self.df["time"])
        self.df.set_index("time", inplace=True)
        logger.debug(f"Climate data loaded: {len(self.df)} rows")

    @classmethod
    async def create(cls, feather_path: str = "../data/processed/senegal_climate.feather") -> "ClimateService":
        """Async factory to create ClimateService and load feather in a thread."""
        self = cls.__new__(cls)
        # run the blocking IO in a thread
        await asyncio.to_thread(self._load_feather, feather_path)
        return self

    def _get_nearest_station(self, lat, lon):
        """Finds the nearest station using Euclidean distance. Returns the region name (string)."""
        df_stations = self.df[["latitude", "longitude", "region"]].drop_duplicates().reset_index(drop=True)
        df_stations["distance"] = np.sqrt(
            (df_stations["latitude"] - lat) ** 2 + (df_stations["longitude"] - lon) ** 2
        )
        nearest = df_stations.loc[df_stations["distance"].idxmin(), "region"]
        return str(nearest)  # force scalar string

    def _aggregate_annual_stats(self, region_name):
        """Aggregates annual statistics for a region."""
        region_df = self.df[self.df["region"] == region_name].copy()
        region_df["year"] = region_df.index.year
        stats = (
            region_df.groupby("year")
            .agg(
                {
                    "temperature_2m": "mean",
                    "precipitation": "sum",
                    "snowfall": "sum",
                    "apparent_temperature": "mean",
                }
            )
            .to_dict(orient="index")
        )
        # Ensure keys (years) are strings for JSON serialization
        return {str(k): v for k, v in stats.items()}

    def _compute_seasonality(self, rainfall_series):
        monthly = rainfall_series.resample("ME").sum()
        return monthly.std() / monthly.mean() if monthly.mean() != 0 else np.nan

    def _compute_heat_days(self, temp_series, threshold=30):
        daily = temp_series.resample("D").mean()
        return int((daily > threshold).sum())

    def _compute_frost_days(self, temp_series, threshold=0):
        daily_min = temp_series.resample("D").min()
        return int((daily_min < threshold).sum())

    def _compute_drought_index(self, rainfall_series):
        monthly = rainfall_series.resample("ME").sum()
        mean = monthly.mean()
        std = monthly.std()
        drought_index = (monthly - mean) / std if std != 0 else np.nan
        # Convert Timestamp keys to string for JSON serialization
        return {str(k): v for k, v in drought_index.to_dict().items()}

    async def get_climate_profile(self, lat, lon) -> ClimateMetrics:
        """Async entry to compute climate profile; heavy pandas ops run in a thread."""
        logger.info(f"Retrieving climate profile for lat={lat}, lon={lon}")
        try:
            region_name = await asyncio.to_thread(self._get_nearest_station, lat, lon)

            # slice region dataframe in thread to avoid blocking
            region_df = await asyncio.to_thread(lambda: self.df[self.df["region"] == region_name])
            annual_stats = await asyncio.to_thread(self._aggregate_annual_stats, region_name)
            seasonality = await asyncio.to_thread(self._compute_seasonality, region_df["precipitation"])
            heat_days = await asyncio.to_thread(self._compute_heat_days, region_df["temperature_2m"])
            frost_days = await asyncio.to_thread(self._compute_frost_days, region_df["temperature_2m"])
            drought_index = await asyncio.to_thread(self._compute_drought_index, region_df["precipitation"])

            response = ClimateMetrics(
                region=region_name,
                annual_stats=annual_stats,
                seasonality=seasonality,
                heat_days=heat_days,
                frost_days=frost_days,
                drought_index=drought_index,
            )

            logger.info(
                f"Climate profile retrieved: region={response.region}, heat_days={response.heat_days}, frost_days={response.frost_days}"
            )

            return response
        except Exception as e:
            logger.error(f"Error retrieving climate profile: {str(e)}", exc_info=True)
            raise



if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    start_time = time.time()
    logger.info("Starting ClimateService test")
    try:
        async def main():
            service = await ClimateService.create()
            result = await service.get_climate_profile(lat=30.048748647184787, lon=-8.570123192097313)
            print(result.model_dump_json())

        asyncio.run(main())

        logger.info("ClimateService test completed successfully")
        elapsed_time = time.time() - start_time
        logger.info(f"Total process time: {elapsed_time:.2f} seconds")
    except Exception as e:
        logger.error(f"Error in ClimateService test: {str(e)}", exc_info=True)
