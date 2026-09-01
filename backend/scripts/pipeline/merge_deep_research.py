"""Merge compatible Deep Research enrichment into crop profiles.

The source files are never modified. Fertilizer application rates are stored
as management requirements because kg/ha cannot fill soil concentration fields
such as total nitrogen (g/kg) or extractable phosphorus (ppm).
"""

from __future__ import annotations

import argparse
import copy
import json
import re
import unicodedata
from pathlib import Path
from typing import Any


PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_CROPS = PIPELINE_DIR / "crops.json"
DEFAULT_ENRICHMENT = PIPELINE_DIR / "deep-research.json"
DEFAULT_OUTPUT = PIPELINE_DIR / "crops_merged.json"

FRENCH_TO_CROP_ID = {
    "oignon": "onion",
    "tomate": "tomato",
    "carotte": "carrot",
}


def normalize_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "_", ascii_name.lower()).strip("_")


def numeric_range(
    minimum: float | int | None,
    maximum: float | int | None,
    unit: str,
    source_id: str,
    note: str,
) -> dict[str, Any]:
    """Represent a derived screening range using the existing schema shape."""
    return {
        "optimal": {"minimum": None, "maximum": None},
        "tolerable": {"minimum": minimum, "maximum": maximum},
        "critical": {"minimum": None, "maximum": None},
        "canonical_unit": unit,
        "claims": [
            {
                "original_value": f"{minimum}-{maximum}",
                "original_unit": unit,
                "normalized_minimum": minimum,
                "normalized_maximum": maximum,
                "source_id": source_id,
                "source_location": "deep-research.json",
                "evidence_type": "derived",
                "supporting_quote": note,
            }
        ],
    }


def parse_range(value: Any) -> tuple[float | None, float | None]:
    if not isinstance(value, str):
        return None, None
    match = re.fullmatch(r"\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*", value)
    if not match:
        return None, None
    return float(match.group(1)), float(match.group(2))


def merge_profile(profile: dict[str, Any], enrichment: dict[str, Any]) -> dict[str, Any]:
    merged = copy.deepcopy(profile)
    crop_id = merged["crop"]["id"]
    source_id = f"{crop_id}_deep_research_soil_enrichment_2026_09_01"
    notes = enrichment.get("isra_specific_notes", "")
    soil = merged["requirements"]["soil"]

    clay = enrichment.get("clay_percentage", {})
    if soil.get("clay_content") is None:
        soil["clay_content"] = numeric_range(
            clay.get("min"), clay.get("max"), "%", source_id, notes
        )

    sand = enrichment.get("sand_percentage", {})
    if soil.get("sand_content") is None:
        soil["sand_content"] = numeric_range(
            sand.get("min"), sand.get("max"), "%", source_id, notes
        )

    cec = enrichment.get("cec_cmol_kg", {})
    cec_optimal_min, cec_optimal_max = parse_range(cec.get("optimal_range"))
    if soil.get("cation_exchange_capacity") is None:
        soil["cation_exchange_capacity"] = {
            "optimal": {
                "minimum": cec_optimal_min,
                "maximum": cec_optimal_max,
            },
            "tolerable": {
                "minimum": cec.get("min_required"),
                "maximum": None,
            },
            "critical": {"minimum": None, "maximum": None},
            "canonical_unit": "cmol(+)/kg",
            "claims": [
                {
                    "original_value": cec.get("optimal_range"),
                    "original_unit": "cmol(+)/kg",
                    "normalized_minimum": cec_optimal_min,
                    "normalized_maximum": cec_optimal_max,
                    "source_id": source_id,
                    "source_location": "deep-research.json",
                    "evidence_type": "derived",
                    "supporting_quote": notes,
                }
            ],
        }

    soil["preferred_usda_texture_classes"] = enrichment.get(
        "usda_texture_preferences", []
    )
    soil["senegal_soil_equivalents"] = enrichment.get(
        "senegal_soil_equivalents", []
    )

    requirements = merged["requirements"]
    requirements["management"] = {
        "fertilizer_application_kg_ha": {
            "nitrogen_n": enrichment.get("nitrogen_kg_ha"),
            "phosphorus_p2o5": enrichment.get("phosphorus_kg_ha"),
            "potassium_k2o": enrichment.get("potassium_kg_ha"),
        },
        "research_notes": notes,
    }

    merged.setdefault("sources", []).append(
        {
            "id": source_id,
            "title": f"Deep Research soil and fertilizer enrichment: {crop_id}",
            "publisher": "AI-assisted synthesis of cited agronomic sources",
            "authors": [],
            "publication_year": 2026,
            "url": None,
            "accessed_at": "2026-09-01",
            "source_type": "research_synthesis",
            "quality_notes": notes,
            "source_descriptions": enrichment.get("data_sources", []),
        }
    )

    filled_paths = {
        "requirements.soil.clay_content",
        "requirements.soil.sand_content",
        "requirements.soil.cation_exchange_capacity",
    }
    merged["missing_fields"] = [
        path for path in merged.get("missing_fields", []) if path not in filled_paths
    ]
    return merged


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Merge crop research enrichment")
    parser.add_argument("--crops", type=Path, default=DEFAULT_CROPS)
    parser.add_argument("--enrichment", type=Path, default=DEFAULT_ENRICHMENT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    crops = json.loads(args.crops.read_text(encoding="utf-8"))
    enrichment_rows = json.loads(args.enrichment.read_text(encoding="utf-8"))

    enrichment_by_id: dict[str, dict[str, Any]] = {}
    unmatched: list[str] = []
    crop_ids = {profile["crop"]["id"] for profile in crops}

    for row in enrichment_rows:
        normalized = normalize_name(row["crop_name"])
        crop_id = FRENCH_TO_CROP_ID.get(normalized, normalized)
        if crop_id in crop_ids:
            enrichment_by_id[crop_id] = row
        else:
            unmatched.append(row["crop_name"])

    merged = [
        merge_profile(profile, enrichment_by_id[profile["crop"]["id"]])
        if profile["crop"]["id"] in enrichment_by_id
        else copy.deepcopy(profile)
        for profile in crops
    ]

    args.output.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(merged)} profiles to {args.output}")
    print(f"Enriched crops: {', '.join(sorted(enrichment_by_id))}")
    print(f"Unmatched new crops: {', '.join(unmatched) if unmatched else 'none'}")


if __name__ == "__main__":
    main()
