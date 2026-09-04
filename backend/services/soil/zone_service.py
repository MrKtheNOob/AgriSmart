import json
from pathlib import Path
from typing import Any

from .schemas import AgroecologicalZone


Position = tuple[float, float]


class ZoneService:
    """Resolve coordinates against locally stored agroecological boundaries."""

    def __init__(self, geojson_path: str | Path):
        # Boundaries are static and small, so load them once at startup instead of
        # reading the GeoJSON for every analysis request.
        with Path(geojson_path).open(encoding="utf-8") as geojson_file:
            collection = json.load(geojson_file)
        self._features: list[dict[str, Any]] = collection["features"]

    def find_zone(self, lat: float, lon: float) -> AgroecologicalZone | None:
        """Return the first zone polygon covering a latitude/longitude pair."""
        # GeoJSON coordinates use (longitude, latitude), the reverse of the API's
        # public method signature.
        point = (lon, lat)
        for feature in self._features:
            if self._geometry_contains(point, feature.get("geometry")):
                properties = feature.get("properties", {})
                code = properties.get("ZONE")
                name = properties.get("AEZ")
                if isinstance(code, str) and isinstance(name, str):
                    return AgroecologicalZone(code=code, name=self._normalize_name(name))
        return None

    @classmethod
    def _geometry_contains(cls, point: Position, geometry: dict[str, Any] | None) -> bool:
        """Dispatch containment checks for the two polygon types used by GeoJSON."""
        if not geometry:
            return False
        coordinates = geometry.get("coordinates", [])
        if geometry.get("type") == "Polygon":
            return cls._polygon_contains(point, coordinates)
        if geometry.get("type") == "MultiPolygon":
            return any(cls._polygon_contains(point, polygon) for polygon in coordinates)
        return False

    @classmethod
    def _polygon_contains(cls, point: Position, rings: list[list[list[float]]]) -> bool:
        """Accept points inside the exterior ring unless they fall in a hole."""
        # GeoJSON stores the outer boundary first and optional holes afterwards.
        if not rings or not cls._ring_contains(point, rings[0]):
            return False
        return not any(cls._ring_contains(point, hole) for hole in rings[1:])

    @staticmethod
    def _ring_contains(point: Position, ring: list[list[float]]) -> bool:
        """Apply the ray-casting algorithm to one closed polygon ring."""
        x, y = point
        inside = False
        previous = ring[-1]
        for current in ring:
            x1, y1 = previous
            x2, y2 = current
            # A near-zero cross product means the point is collinear with this
            # edge. Treat an on-edge point as covered to avoid boundary gaps.
            cross_product = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
            if (
                abs(cross_product) < 1e-10
                and min(x1, x2) <= x <= max(x1, x2)
                and min(y1, y2) <= y <= max(y1, y2)
            ):
                return True
            # Cast a horizontal ray from the point. Every edge crossing toggles
            # the state; an odd number of crossings means the point is inside.
            if (y1 > y) != (y2 > y):
                intersection_x = (x2 - x1) * (y - y1) / (y2 - y1) + x1
                if x <= intersection_x:
                    inside = not inside
            previous = current
        return inside

    @staticmethod
    def _normalize_name(value: str) -> str:
        return " ".join(value.split()).replace(
            "Zone Sylvo Pastorale", "Zone Sylvo-Pastorale"
        )
