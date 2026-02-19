"""
Script to gather morocco weather data 6 years from now
"""
import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry
from pydantic import BaseModel
from datetime import datetime, timedelta

# -------------------------
# Pydantic Data Model
# -------------------------
class ClimateRecord(BaseModel):
    region: str
    latitude: float
    longitude: float
    time: datetime

    temperature_2m: float | None = None
    relative_humidity_2m: float | None = None
    apparent_temperature: float | None = None
    precipitation: float | None = None
    snowfall: float | None = None
    wind_speed_10m: float | None = None
    wind_direction_10m: float | None = None
    surface_pressure: float | None = None
    cloud_cover: float | None = None
    shortwave_radiation: float | None = None
    vapor_pressure_deficit: float | None = None


# -------------------------
# Open-Meteo Client Setup
# -------------------------
cache_session = requests_cache.CachedSession('.cache', expire_after=-1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)


# -------------------------
# Morocco Climate Regions
# -------------------------
regions = [
    {"name": "Casablanca", "lat": 33.57, "lon": -7.59},
    {"name": "Rabat", "lat": 34.02, "lon": -6.83},
    {"name": "Tangier", "lat": 35.76, "lon": -5.83},
    {"name": "Fes", "lat": 34.04, "lon": -5.00},
    {"name": "Marrakesh", "lat": 31.63, "lon": -7.99},
    {"name": "Agadir", "lat": 30.43, "lon": -9.60},
    {"name": "Ouarzazate", "lat": 30.92, "lon": -6.90},
]

# -------------------------
# Date Range (Past 1 Year)
# -------------------------
end_date = datetime.utcnow().date()
start_date = end_date - timedelta(days=365*6)

# -------------------------
# Variables for AI Modeling
# -------------------------
hourly_variables = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "snowfall",
    "wind_speed_10m",
    "wind_direction_10m",
    "surface_pressure",
    "cloud_cover",
    "shortwave_radiation",
    "vapor_pressure_deficit"
]

all_records = []

for region in regions:
    params = {
        "latitude": region["lat"],
        "longitude": region["lon"],
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "hourly": hourly_variables,
        "timezone": "Africa/Casablanca"
    }

    responses = openmeteo.weather_api(
        "https://archive-api.open-meteo.com/v1/archive",
        params=params
    )

    response = responses[0]
    hourly = response.Hourly()

    data = {
        "time": pd.date_range(
            start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
            end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
            freq=pd.Timedelta(seconds=hourly.Interval()),
            inclusive="left"
        )
    }

    for i, var in enumerate(hourly_variables):
        data[var] = hourly.Variables(i).ValuesAsNumpy()

    df = pd.DataFrame(data)

    for _, row in df.iterrows():
        record = ClimateRecord(
            region=region["name"],
            latitude=region["lat"],
            longitude=region["lon"],
            **row.to_dict()
        )
        all_records.append(record.model_dump())

# -------------------------
# Save Dataset
# -------------------------
final_df = pd.DataFrame(all_records)
final_df.to_csv("morocco_climate_with_coordinates.csv", index=False)

print("Saved: morocco_climate_last_year_with_coordinates.csv")
print("Rows:", final_df.shape[0])
print("Columns:", final_df.shape[1])
