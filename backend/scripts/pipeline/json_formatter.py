"""Width-aware JSON formatting for pipeline datasets."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path
from typing import Any


def format_json(value: Any, indent: int = 0, width: int = 100) -> str:
    """Keep compact values inline when they fit, expanding larger containers."""
    compact = json.dumps(value, ensure_ascii=False, separators=(", ", ": "))
    if not isinstance(value, (dict, list)) or indent + len(compact) <= width:
        return compact

    padding = " " * indent
    child_padding = " " * (indent + 2)
    if isinstance(value, dict):
        lines: list[str] = []
        for key, item in value.items():
            rendered = format_json(item, indent + 2, width)
            key_text = json.dumps(key, ensure_ascii=False)
            lines.append(f"{child_padding}{key_text}: {rendered}")
        return "{\n" + ",\n".join(lines) + f"\n{padding}}}"

    lines = [f"{child_padding}{format_json(item, indent + 2, width)}" for item in value]
    return "[\n" + ",\n".join(lines) + f"\n{padding}]"


def write_json_atomic(path: Path, data: Any, width: int = 100) -> None:
    descriptor, temporary_name = tempfile.mkstemp(
        dir=path.parent, prefix=f".{path.name}.", suffix=".tmp"
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            output.write(format_json(data, width=width))
            output.write("\n")
        os.replace(temporary_name, path)
    except Exception:
        Path(temporary_name).unlink(missing_ok=True)
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Format JSON using a target line width")
    parser.add_argument("path", type=Path)
    parser.add_argument("--width", type=int, default=100)
    args = parser.parse_args()
    data = json.loads(args.path.read_text(encoding="utf-8"))
    write_json_atomic(args.path, data, args.width)


if __name__ == "__main__":
    main()
