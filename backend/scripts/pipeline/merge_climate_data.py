"""Merge non-null climate requirements into the existing crop catalog."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from json_formatter import write_json_atomic


PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_SOURCE = PIPELINE_DIR / "crops.json"
DEFAULT_TARGET = PIPELINE_DIR / "crops_merged.json"


def prune_nulls(value: Any) -> Any:
    """Recursively remove null values and containers left empty by removal."""
    if isinstance(value, dict):
        cleaned = {
            key: pruned
            for key, item in value.items()
            if (pruned := prune_nulls(item)) is not None
        }
        return cleaned or None
    if isinstance(value, list):
        cleaned = [pruned for item in value if (pruned := prune_nulls(item)) is not None]
        return cleaned or None
    return value


def collect_source_ids(value: Any) -> set[str]:
    source_ids: set[str] = set()
    if isinstance(value, dict):
        source_id = value.get("source_id")
        if isinstance(source_id, str):
            source_ids.add(source_id)
        for item in value.values():
            source_ids.update(collect_source_ids(item))
    elif isinstance(value, list):
        for item in value:
            source_ids.update(collect_source_ids(item))
    return source_ids


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Merge non-null climate data into existing crop records"
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--target", type=Path, default=DEFAULT_TARGET)
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path; defaults to updating --target in place",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = args.output or args.target
    source_profiles = json.loads(args.source.read_text(encoding="utf-8"))
    target_profiles = json.loads(args.target.read_text(encoding="utf-8"))

    source_by_name = {
        profile["crop"]["common_name"].casefold(): profile
        for profile in source_profiles
    }

    matched: list[str] = []
    for target in target_profiles:
        source = source_by_name.get(target["crop_name"].casefold())
        if source is None:
            continue

        climate = prune_nulls(source.get("requirements", {}).get("climate"))
        if climate is None:
            continue

        target["climate_requirements"] = climate
        referenced_ids = collect_source_ids(climate)
        target["climate_data_sources"] = [
            item for item in source.get("sources", []) if item.get("id") in referenced_ids
        ]
        matched.append(target["crop_name"])

    write_json_atomic(output_path, target_profiles)
    print(f"Wrote {len(target_profiles)} existing crops to {output_path}")
    print(f"Merged non-null climate data into {len(matched)} crops: {', '.join(matched)}")


if __name__ == "__main__":
    main()
