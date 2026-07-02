"""
Script to gather Senegal weather data for the past 6 years
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
# Senegal Climate Regions
# -------------------------
regions = [
    {"name": "Dakar", "lat": 14.6922, "lon": -17.4483},
    {"name": "Touba", "lat": 14.8646, "lon": -15.8833},
    {"name": "Thiès", "lat": 14.7915, "lon": -16.9297},
    {"name": "Kaolack", "lat": 14.1378, "lon": -16.0758},
    {"name": "Mbour", "lat": 14.4220, "lon": -16.9639},
    {"name": "Saint-Louis", "lat": 16.0179, "lon": -16.5042},
    {"name": "Ziguinchor", "lat": 12.5833, "lon": -16.2719},
]

# -------------------------
# Date Range (Past 6 Years)
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
        "timezone": "Africa/Dakar"
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
        print(f"Processed: {record.region} at {record.time}")
        all_records.append(record.model_dump())

# -------------------------
# Save Dataset
# -------------------------
final_df = pd.DataFrame(all_records)
final_df.to_csv("senegal_climate_with_coordinates.csv", index=False)

print("Saved: senegal_climate_with_coordinates.csv")
print("Rows:", final_df.shape[0])
print("Columns:", final_df.shape[1])