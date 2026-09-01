"""Flatten researched crop profiles into an app-oriented JSON dataset.

The source research file remains untouched. Missing requirements stay null so
that later enrichment jobs can fill them without introducing guessed values.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pandas as pd


PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = PIPELINE_DIR / "crops.json"
DEFAULT_OUTPUT = PIPELINE_DIR / "crops_simplified.json"


def nested_get(data: dict[str, Any], path: str) -> Any:
    """Return a nested dictionary value or None when the path is absent."""
    value: Any = data
    for key in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def range_values(
    profile: dict[str, Any], path: str, band: str = "optimal"
) -> tuple[float | None, float | None]:
    """Extract the minimum and maximum from one requirement range."""
    requirement = nested_get(profile, path)
    if not isinstance(requirement, dict):
        return None, None

    selected_range = requirement.get(band)
    if not isinstance(selected_range, dict):
        return None, None

    return selected_range.get("minimum"), selected_range.get("maximum")


def descriptive_value(profile: dict[str, Any], path: str) -> str | None:
    """Extract a short description from a qualitative requirement."""
    value = nested_get(profile, path)
    if isinstance(value, dict):
        description = value.get("description")
        return description if isinstance(description, str) else None
    return value if isinstance(value, str) else None


def simplify_profile(profile: dict[str, Any]) -> dict[str, Any]:
    """Convert one research profile into a single calculation-friendly row."""
    ph_min, ph_max = range_values(profile, "requirements.soil.ph")
    temperature_min, temperature_max = range_values(
        profile, "requirements.climate.temperature"
    )
    rainfall_min, rainfall_max = range_values(
        profile, "requirements.climate.seasonal_rainfall"
    )
    water_min, water_max = range_values(
        profile, "requirements.water.seasonal_crop_water_requirement"
    )
    nitrogen_min, nitrogen_max = range_values(
        profile, "requirements.soil.nitrogen_total"
    )
    phosphorus_min, phosphorus_max = range_values(
        profile, "requirements.soil.phosphorus_extractable"
    )
    potassium_min, potassium_max = range_values(
        profile, "requirements.soil.potassium_extractable"
    )
    carbon_min, carbon_max = range_values(
        profile, "requirements.soil.carbon_organic"
    )
    cec_min, cec_max = range_values(
        profile, "requirements.soil.cation_exchange_capacity"
    )

    # The research used the tolerable band to store documented crop-cycle
    # ranges, rather than an agronomic "optimal" duration.
    maturity_min, maturity_max = range_values(
        profile, "requirements.growth_cycle.days_to_maturity", band="tolerable"
    )

    textures = nested_get(profile, "requirements.soil.preferred_texture_classes")
    if not isinstance(textures, list):
        textures = []

    crop = profile.get("crop", {})
    return {
        "crop_id": crop.get("id"),
        "common_name": crop.get("common_name"),
        "scientific_name": crop.get("scientific_name"),
        "soil_ph_min": ph_min,
        "soil_ph_max": ph_max,
        "temperature_min_c": temperature_min,
        "temperature_max_c": temperature_max,
        "seasonal_rainfall_min_mm": rainfall_min,
        "seasonal_rainfall_max_mm": rainfall_max,
        "crop_water_requirement_min_mm": water_min,
        "crop_water_requirement_max_mm": water_max,
        "nitrogen_total_min_g_kg": nitrogen_min,
        "nitrogen_total_max_g_kg": nitrogen_max,
        "phosphorus_extractable_min_ppm": phosphorus_min,
        "phosphorus_extractable_max_ppm": phosphorus_max,
        "potassium_extractable_min_ppm": potassium_min,
        "potassium_extractable_max_ppm": potassium_max,
        "organic_carbon_min_g_kg": carbon_min,
        "organic_carbon_max_g_kg": carbon_max,
        "cec_min_cmol_kg": cec_min,
        "cec_max_cmol_kg": cec_max,
        "preferred_soil_textures": textures,
        "days_to_maturity_min": maturity_min,
        "days_to_maturity_max": maturity_max,
        "drought_tolerance": descriptive_value(
            profile, "requirements.climate.drought_tolerance"
        ),
        "waterlogging_tolerance": descriptive_value(
            profile, "requirements.climate.waterlogging_tolerance"
        ),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a simplified crop dataset from Deep Research profiles."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    with args.input.open(encoding="utf-8") as source_file:
        profiles = json.load(source_file)

    if not isinstance(profiles, list):
        raise ValueError("Expected the input JSON root to be an array of crop profiles")

    dataframe = pd.DataFrame(simplify_profile(profile) for profile in profiles)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_json(args.output, orient="records", indent=2, force_ascii=False)

    populated = dataframe.notna().sum()
    print(f"Wrote {len(dataframe)} crop profiles to {args.output}")
    print("Populated numeric fields:")
    for column in dataframe.select_dtypes(include="number").columns:
        print(f"  {column}: {int(populated[column])}/{len(dataframe)}")


if __name__ == "__main__":
    main()
