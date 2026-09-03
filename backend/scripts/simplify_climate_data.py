"""Aggregate hourly Senegal climate observations into complete monthly records."""

from __future__ import annotations

import argparse
import calendar
from pathlib import Path

import pandas as pd


BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = BACKEND_DIR / "data/processed/senegal_climate.feather"
DEFAULT_OUTPUT = BACKEND_DIR / "data/processed/senegal_climate_monthly.feather"

REQUIRED_COLUMNS = {
    "region",
    "latitude",
    "longitude",
    "time",
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "vapor_pressure_deficit",
}


def expected_hours(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1] * 24


def aggregate_monthly(data: pd.DataFrame, minimum_coverage: float) -> pd.DataFrame:
    missing_columns = REQUIRED_COLUMNS.difference(data.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Climate dataset is missing required columns: {missing}")

    frame = data.copy()
    frame["time"] = pd.to_datetime(frame["time"], utc=True)
    frame = frame.drop_duplicates(subset=["region", "time"])
    frame["year"] = frame["time"].dt.year
    frame["month"] = frame["time"].dt.month
    frame["date"] = frame["time"].dt.floor("D")

    group_columns = ["region", "latitude", "longitude", "year", "month"]
    monthly = (
        frame.groupby(group_columns, as_index=False)
        .agg(
            temperature_mean_c=("temperature_2m", "mean"),
            temperature_min_c=("temperature_2m", "min"),
            temperature_max_c=("temperature_2m", "max"),
            relative_humidity_mean_pct=("relative_humidity_2m", "mean"),
            apparent_temperature_mean_c=("apparent_temperature", "mean"),
            precipitation_total_mm=("precipitation", "sum"),
            vapor_pressure_deficit_mean_kpa=("vapor_pressure_deficit", "mean"),
            observed_hours=("time", "count"),
        )
        .sort_values(["region", "year", "month"])
    )

    daily = (
        frame.groupby(group_columns + ["date"], as_index=False)
        .agg(
            daily_temperature_mean_c=("temperature_2m", "mean"),
            daily_precipitation_mm=("precipitation", "sum"),
        )
    )
    daily["is_heat_day"] = daily["daily_temperature_mean_c"] > 30
    daily["is_rainy_day"] = daily["daily_precipitation_mm"] >= 1
    monthly_days = (
        daily.groupby(group_columns, as_index=False)
        .agg(
            heat_days=("is_heat_day", "sum"),
            rainy_days=("is_rainy_day", "sum"),
        )
    )
    monthly = monthly.merge(monthly_days, on=group_columns, how="left")

    monthly["expected_hours"] = [
        expected_hours(int(year), int(month))
        for year, month in zip(monthly["year"], monthly["month"], strict=True)
    ]
    monthly["coverage_ratio"] = monthly["observed_hours"] / monthly["expected_hours"]
    monthly = monthly[monthly["coverage_ratio"] >= minimum_coverage].copy()
    monthly["month_start"] = pd.to_datetime(
        monthly[["year", "month"]].assign(day=1), utc=True
    )

    numeric_columns = monthly.select_dtypes(include="number").columns
    monthly[numeric_columns] = monthly[numeric_columns].round(3)
    return monthly.reset_index(drop=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--minimum-coverage",
        type=float,
        default=0.9,
        help="Minimum observed-hour ratio required to keep a region-month",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not 0 < args.minimum_coverage <= 1:
        raise ValueError("--minimum-coverage must be greater than 0 and at most 1")

    hourly = pd.read_feather(args.input)
    monthly = aggregate_monthly(hourly, args.minimum_coverage)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    monthly.to_feather(args.output)

    print(f"Read {len(hourly):,} hourly observations from {args.input}")
    print(f"Wrote {len(monthly):,} complete monthly records to {args.output}")
    print(f"Coverage: {monthly['month_start'].min()} to {monthly['month_start'].max()}")


if __name__ == "__main__":
    main()
