import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { GeoJSON as LeafletGeoJSON } from "leaflet";
import type {
  LeafletMouseEvent,
  PathOptions,
  LatLngTuple,
  LatLngBoundsExpression,
} from "leaflet";
import { useRef, useState, useEffect } from "react";
import provinceGeoJSONString from "../assets/mar_admin2.geojson?raw";
import regionGeoJSONString from "../assets/morocco_adm1.geojson?raw";

const provinceGeoJSON: GeoJSON.FeatureCollection =
  JSON.parse(provinceGeoJSONString);
const regionGeoJSON: GeoJSON.FeatureCollection =
  JSON.parse(regionGeoJSONString);

// Create a mask for everything outside Morocco
const worldMaskGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          // Outer boundary: World
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
          ],
          // Holes: Morocco regions
          ...regionGeoJSON.features.flatMap((f: any) => {
            if (f.geometry.type === "Polygon") return f.geometry.coordinates;
            if (f.geometry.type === "MultiPolygon")
              return f.geometry.coordinates.flat(1);
            return [];
          }),
        ],
      },
    },
  ],
};

// Province properties
interface MoroccoProvinceProperties {
  adm2_name: string;
  adm1_name: string;
  adm0_name: string;
}

// Region properties
interface MoroccoRegionProperties {
  shapeName: string;
}

type ProvinceFeature = GeoJSON.Feature<
  GeoJSON.Geometry,
  MoroccoProvinceProperties
>;
type RegionFeature = GeoJSON.Feature<
  GeoJSON.Geometry,
  MoroccoRegionProperties
>;

// Fix default marker icon
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

export default function MoroccoMap({ onMapClick, markerPosition }: MapProps) {
  const moroccoBounds: LatLngBoundsExpression = [
    [20.0, -18.0],
    [36.5, -0.5],
  ];

  const [zoomLevel, setZoomLevel] = useState(6);
  console.log("Current zoom level:", zoomLevel);

  const provinceGeoJsonRef = useRef<LeafletGeoJSON | null>(null);
  const regionGeoJsonRef = useRef<LeafletGeoJSON | null>(null);

  const defaultStyle: PathOptions = {
    weight: 1,
    opacity: 1,
    color: "#ffffff",
    fillOpacity: 0, // Morocco itself is clear
  };

  const maskStyle: PathOptions = {
    stroke: false,
    fillColor: "#ffffff",
    fillOpacity: 0.6, // Outside Morocco is dimmed
    interactive: false,
  };

  const highlightStyle: PathOptions = {
    fillColor: "#66BB6A",
    weight: 2,
    color: "#1B5E20",
    fillOpacity: 0.03,
  };

  const onEachProvince = (feature: ProvinceFeature, layer: L.Layer) => {
    const provinceName = feature.properties.adm2_name;
    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target as L.Path;
        target.setStyle(highlightStyle);
        target.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        provinceGeoJsonRef.current?.resetStyle(e.target as L.Path);
      },
      click: (e: LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng, provinceName);
        (e.target as L.Path)
          .bindPopup(`<strong>${provinceName}</strong>`)
          .openPopup(e.latlng);
      },
    });
  };

  const onEachRegion = (feature: RegionFeature, layer: L.Layer) => {
    const regionName = feature.properties.shapeName;
    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target as L.Path;
        target.setStyle(highlightStyle);
        target.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        regionGeoJsonRef.current?.resetStyle(e.target as L.Path);
      },
      click: (e: LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng, regionName);
        (e.target as L.Path)
          .bindPopup(`<strong>${regionName}</strong>`)
          .openPopup(e.latlng);
      },
    });
  };

  function ZoomHandler() {
    const map = useMapEvents({
      zoomend: () => {
        setZoomLevel(map.getZoom());
      },
    });

    useEffect(() => {
      setZoomLevel(map.getZoom());
    }, [map]);

    return null;
  }

  return (
    <MapContainer
      bounds={moroccoBounds}
      maxBounds={moroccoBounds}
      maxBoundsViscosity={1.0}
      minZoom={6}
      zoom={6}
      maxZoom={18}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg shadow-md"
    >
      <TileLayer
        minZoom={6}
        maxZoom={18}
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON data={worldMaskGeoJSON} style={() => maskStyle} />

      <ZoomHandler />

      {zoomLevel > 7 ? (
        <GeoJSON
          key="provinces"
          ref={provinceGeoJsonRef}
          data={provinceGeoJSON}
          style={() => defaultStyle}
          onEachFeature={onEachProvince}
        />
      ) : (
        <GeoJSON
          key="regions"
          ref={regionGeoJsonRef}
          data={regionGeoJSON}
          style={() => defaultStyle}
          onEachFeature={onEachRegion}
        />
      )}

      {markerPosition && <Marker position={markerPosition} children={<></>} />}
    </MapContainer>
  );
}
