"""Merge fertilizer research into the existing soil-oriented crop catalog.

Only crops already present in crops_merged.json are retained. Existing soil
values are never overwritten. The output is written atomically and can be
regenerated from the two source datasets.
"""

from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path
from typing import Any

from json_formatter import write_json_atomic


PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_CROPS = PIPELINE_DIR / "crops_merged.json"
DEFAULT_RESEARCH = PIPELINE_DIR / "deep-research.json"

NAME_ALIASES = {
    "oignon": "onion",
    "tomate": "tomato",
    "piment": "chili pepper",
    "gombo": "okra",
    "aubergine": "eggplant",
    "carotte": "carrot",
    "chou": "cabbage",
    "salade": "lettuce",
    "pasteque": "watermelon",
    "poivron": "bell pepper",
}


def normalized_name(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore")
    return " ".join(ascii_value.decode("ascii").lower().split())


def canonical_name(value: str) -> str:
    normalized = normalized_name(value)
    return NAME_ALIASES.get(normalized, normalized)


def unique_strings(*groups: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for group in groups:
        for value in group:
            if value not in seen:
                seen.add(value)
                result.append(value)
    return result


def merge_crop(crop: dict[str, Any], research: dict[str, Any]) -> dict[str, Any]:
    """Add management data while preserving all existing soil attributes."""
    merged = dict(crop)
    merged["fertilizer_application_kg_ha"] = {
        "nitrogen_n": research.get("nitrogen_kg_ha"),
        "phosphorus_p2o5": research.get("phosphorus_kg_ha"),
        "potassium_k2o": research.get("potassium_kg_ha"),
    }
    merged["fertilizer_research_notes"] = research.get("isra_specific_notes")
    merged["data_sources"] = unique_strings(
        crop.get("data_sources", []), research.get("data_sources", [])
    )
    return merged


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Merge Deep Research management data into existing crops"
    )
    parser.add_argument("--crops", type=Path, default=DEFAULT_CROPS)
    parser.add_argument("--research", type=Path, default=DEFAULT_RESEARCH)
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path; defaults to updating --crops in place",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = args.output or args.crops
    crops = json.loads(args.crops.read_text(encoding="utf-8"))
    research_rows = json.loads(args.research.read_text(encoding="utf-8"))

    research_by_name = {
        canonical_name(row["crop_name"]): row for row in research_rows
    }
    if len(research_by_name) != len(research_rows):
        raise ValueError("Deep Research contains duplicate normalized crop names")

    existing_names = {canonical_name(crop["crop_name"]) for crop in crops}
    merged: list[dict[str, Any]] = []
    matched: list[str] = []
    for crop in crops:
        name = canonical_name(crop["crop_name"])
        research = research_by_name.get(name)
        if research is None:
            merged.append(crop)
            continue
        merged.append(merge_crop(crop, research))
        matched.append(crop["crop_name"])

    unmatched_existing = [
        crop["crop_name"]
        for crop in crops
        if canonical_name(crop["crop_name"]) not in research_by_name
    ]
    ignored_research = [
        row["crop_name"]
        for row in research_rows
        if canonical_name(row["crop_name"]) not in existing_names
    ]

    write_json_atomic(output_path, merged)
    print(f"Wrote {len(merged)} existing crops to {output_path}")
    print(f"Merged fertilizer data into {len(matched)} crops: {', '.join(matched)}")
    print(f"Existing crops without research: {', '.join(unmatched_existing) or 'none'}")
    print(f"Ignored research-only crops: {', '.join(ignored_research) or 'none'}")


if __name__ == "__main__":
    main()
