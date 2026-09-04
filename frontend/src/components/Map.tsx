import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { GeoJSON as LeafletGeoJSON } from "leaflet";
import type {
  LatLngBoundsExpression,
  LatLngTuple,
  LeafletMouseEvent,
  PathOptions,
} from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import {
  findContainingFeature,
  getFeatureName,
  type GeoFeature,
} from "../utils/geo";
import MapModeToggle from "./MapModeToggle";
import { AdministrativeLabels, ZoneLegend } from './MapLegend'
import type { MapMode } from './MapModeToggle'
import {
  agroecologicalZones,
  buildOutsideMask,
  getZoneCode,
  getZoneName,
  senegalDepartments,
  senegalRegions,
  ZONE_COLORS,
} from '../utils/MapUtils'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface MapProps {
  onMapClick: (lat: number, lng: number, name?: string) => void;
  markerPosition: LatLngTuple | null;
}

export default function SenegalMap({ onMapClick, markerPosition }: MapProps) {
  const senegalBounds: LatLngBoundsExpression = [
    [12.2, -17.8],
    [17.8, -11.2],
  ];

  const [zoomLevel, setZoomLevel] = useState(10);
  const [mapMode, setMapMode] = useState<MapMode>("agroecological");
  const zoneGeoJsonRef = useRef<LeafletGeoJSON | null>(null);
  const regionGeoJsonRef = useRef<LeafletGeoJSON | null>(null);
  const departmentGeoJsonRef = useRef<LeafletGeoJSON | null>(null);
  const selectedAreaLayerRef = useRef<L.Path | null>(null);
  const selectedAreaResetRef = useRef<(() => void) | null>(null);
  const outsideMaskGeoJSON = useMemo(
    () => buildOutsideMask(senegalRegions),
    [],
  );

  const clearSelectedArea = () => {
    selectedAreaLayerRef.current
      ?.getElement()
      ?.classList.remove("agro-zone-selected");
    selectedAreaResetRef.current?.();
    selectedAreaLayerRef.current = null;
    selectedAreaResetRef.current = null;
  };

  useEffect(() => {
    if (!markerPosition) clearSelectedArea();
  }, [markerPosition]);

  useEffect(() => {
    clearSelectedArea();
  }, [mapMode]);

  const zoneStyle = (feature?: GeoFeature): PathOptions => ({
    color: "#f8fafc",
    weight: 1.15,
    opacity: 0.95,
    fillColor: ZONE_COLORS[getZoneCode(feature)] ?? "#94a3b8",
    fillOpacity: 0.42,
  });

  const zoneHighlightStyle: PathOptions = {
    color: "#ffffff",
    weight: 1.8,
    fillOpacity: 0.52,
  };

  const zoneSelectedStyle: PathOptions = {
    color: "#315d50",
    weight: 2.4,
    opacity: 0.96,
    fillOpacity: 0.58,
  };

  const administrativeRegionStyle: PathOptions = {
    color: "#526171",
    weight: 1.2,
    opacity: 0.78,
    fillOpacity: 0,
  };

  const administrativeDepartmentStyle: PathOptions = {
    color: "#697786",
    weight: 0.75,
    opacity: 0.62,
    fillOpacity: 0,
  };

  const administrativeHighlightStyle: PathOptions = {
    color: "#ffffff",
    weight: 1.8,
    fillColor: "#8eb29f",
    fillOpacity: 0.5,
  };

  const regionBoundaryStyle: PathOptions = {
    color: "#526171",
    weight: 0.85,
    opacity: 0.58,
    fillOpacity: 0,
    interactive: false,
  };

  const departmentBoundaryStyle: PathOptions = {
    color: "#697786",
    weight: 0.55,
    opacity: 0.42,
    dashArray: "3 4",
    fillOpacity: 0,
    interactive: false,
  };

  const maskStyle: PathOptions = {
    stroke: false,
    fillColor: "#64748b",
    fillOpacity: 0.42,
    interactive: false,
  };

  const selectCoordinate = (
    latitude: number,
    longitude: number,
    selectedZone?: GeoFeature,
  ) => {
    const point: [number, number] = [longitude, latitude];
    const zone =
      selectedZone ?? findContainingFeature(point, agroecologicalZones);
    const region = findContainingFeature(point, senegalRegions);
    const department = findContainingFeature(point, senegalDepartments);

    const zoneName = zone ? getZoneName(zone) : undefined;
    const regionName = region ? getFeatureName(region.properties) : undefined;
    const departmentName = department
      ? getFeatureName(department.properties)
      : undefined;
    const locationName = [departmentName, regionName, zoneName]
      .filter(Boolean)
      .join(" · ");

    onMapClick(latitude, longitude, locationName || undefined);
    return { zoneName, regionName, departmentName };
  };

  const selectAreaLayer = (
    target: L.Path,
    style: PathOptions,
    reset: () => void,
  ) => {
    if (selectedAreaLayerRef.current === target) return;

    clearSelectedArea();
    selectedAreaLayerRef.current = target;
    selectedAreaResetRef.current = reset;
    target.setStyle(style);
    target.getElement()?.classList.remove("agro-zone-hovered");
    target.getElement()?.classList.add("agro-zone-selected");
    target.bringToFront();
  };

  const showSelectionPopup = (
    event: LeafletMouseEvent,
    selection: ReturnType<typeof selectCoordinate>,
  ) => {
    const lines = [
      selection.departmentName
        ? `<strong>Département :</strong> ${selection.departmentName}`
        : null,
      selection.regionName
        ? `<strong>Région :</strong> ${selection.regionName}`
        : null,
      selection.zoneName
        ? `<strong>Zone agricole :</strong> ${selection.zoneName}`
        : null,
    ].filter(Boolean);

    (event.target as L.Path)
      .bindPopup(lines.join("<br />"))
      .openPopup(event.latlng);
  };

  const onEachZone = (feature: GeoFeature, layer: L.Layer) => {
    layer.on({
      mouseover: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path;
        if (selectedAreaLayerRef.current !== target) {
          target.setStyle(zoneHighlightStyle);
          target.getElement()?.classList.add("agro-zone-hovered");
        }
        target.bringToFront();
      },
      mouseout: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path;
        target.getElement()?.classList.remove("agro-zone-hovered");
        if (selectedAreaLayerRef.current !== target) {
          zoneGeoJsonRef.current?.resetStyle(target);
        }
      },
      click: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path;
        selectAreaLayer(target, zoneSelectedStyle, () =>
          zoneGeoJsonRef.current?.resetStyle(target),
        );

        const selection = selectCoordinate(
          event.latlng.lat,
          event.latlng.lng,
          feature,
        );
        showSelectionPopup(event, selection);
      },
    });
  };

  const onEachAdministrativeArea = (
    _feature: GeoFeature,
    layer: L.Layer,
    resetStyle: (target: L.Path) => void,
  ) => {
    layer.on({
      mouseover: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path;
        if (selectedAreaLayerRef.current !== target) {
          target.setStyle(administrativeHighlightStyle);
          target.getElement()?.classList.add("agro-zone-hovered");
        }
        target.bringToFront();
      },
      mouseout: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path;
        target.getElement()?.classList.remove("agro-zone-hovered");
        if (selectedAreaLayerRef.current !== target) resetStyle(target);
      },
      click: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path;
        selectAreaLayer(target, zoneSelectedStyle, () => resetStyle(target));
        const selection = selectCoordinate(event.latlng.lat, event.latlng.lng);
        showSelectionPopup(event, selection);
      },
    });
  };

  function ZoomHandler() {
    const map = useMapEvents({
      zoomend: () => setZoomLevel(map.getZoom()),
    });

    useEffect(() => {
      setZoomLevel(map.getZoom());
    }, [map]);

    return null;
  }

  return (
    <MapContainer
      bounds={senegalBounds}
      maxBounds={senegalBounds}
      maxBoundsViscosity={1}
      minZoom={6}
      zoom={6}
      maxZoom={18}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="premium-agri-map rounded-lg shadow-md"
    >
      <TileLayer
        minZoom={6}
        maxZoom={18}
        opacity={1}
        attribution={
          mapMode === "agroecological"
            ? "© OpenStreetMap contributors · Zones agroécologiques : Ministère de l'Agriculture du Sénégal"
            : "© OpenStreetMap contributors"
        }
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SearchBar />
      <MapModeToggle value={mapMode} onChange={setMapMode} />
      {mapMode === "agroecological" ? <ZoneLegend /> : null}
      <GeoJSON data={outsideMaskGeoJSON} style={() => maskStyle} />
      <ZoomHandler />

      {mapMode === "agroecological" ? (
        <>
          <GeoJSON
            key="agroecological-zones"
            ref={zoneGeoJsonRef}
            data={agroecologicalZones}
            style={(feature) => zoneStyle(feature as GeoFeature | undefined)}
            onEachFeature={onEachZone}
          />
          <GeoJSON
            key="region-boundaries"
            data={senegalRegions}
            style={() => regionBoundaryStyle}
            interactive={false}
          />
          {zoomLevel >= 8 ? (
            <GeoJSON
              key="department-boundaries"
              data={senegalDepartments}
              style={() => departmentBoundaryStyle}
              interactive={false}
            />
          ) : null}
        </>
      ) : zoomLevel >= 8 ? (
        <GeoJSON
          key="administrative-departments"
          ref={departmentGeoJsonRef}
          data={senegalDepartments}
          style={() => administrativeDepartmentStyle}
          onEachFeature={(feature, layer) =>
            onEachAdministrativeArea(feature as GeoFeature, layer, (target) =>
              departmentGeoJsonRef.current?.resetStyle(target),
            )
          }
        />
      ) : (
        <GeoJSON
          key="administrative-regions"
          ref={regionGeoJsonRef}
          data={senegalRegions}
          style={() => administrativeRegionStyle}
          onEachFeature={(feature, layer) =>
            onEachAdministrativeArea(feature as GeoFeature, layer, (target) =>
              regionGeoJsonRef.current?.resetStyle(target),
            )
          }
        />
      )}

      <AdministrativeLabels zoomLevel={zoomLevel} mapMode={mapMode} />
      {markerPosition ? <Marker position={markerPosition} /> : null}
    </MapContainer>
  );
}
