import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  GeoJSON,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { GeoJSON as LeafletGeoJSON } from 'leaflet';
import type {
  FeatureCollection,
  Feature,
  Geometry,
} from 'geojson';
import type {
  LeafletMouseEvent,
  PathOptions,
  LatLngTuple,
  LatLngBoundsExpression,
} from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import SearchBar from './SearchBar';
import senegalRegionsGeoJSONString from '../assets/senegal_adm1.geojson?raw';
import senegalDepartmentsGeoJSONString from '../assets/senegal_adm2.geojson?raw';

type GeoFeature = Feature<Geometry, Record<string, unknown>>;
const senegalRegionsGeoJSON: FeatureCollection = JSON.parse(
  senegalRegionsGeoJSONString,
);
const senegalDepartmentsGeoJSON: FeatureCollection = JSON.parse(
  senegalDepartmentsGeoJSONString,
);

const getFeatureName = (properties: Record<string, unknown>) => {
  const candidates = [
    properties.adm2_name,
    properties.adm1_name,
    properties.shapeName,
    properties.name,
    properties.ADM2_EN,
    properties.ADM1_EN,
    properties.SNAME,
  ];

  const name = candidates.find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  return name ?? 'Selected area';
};

const buildOutsideMask = (regionGeoJSON: FeatureCollection): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
          ],
          ...regionGeoJSON.features.flatMap((feature) => {
            if (!feature.geometry) return [];
            if (feature.geometry.type === 'Polygon') return feature.geometry.coordinates;
            if (feature.geometry.type === 'MultiPolygon') {
              return feature.geometry.coordinates.flat(1);
            }
            return [];
          }),
        ],
      },
    },
  ],
});

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
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

  const [zoomLevel, setZoomLevel] = useState(6);
  const regionGeoJSON = senegalRegionsGeoJSON;
  const departmentGeoJSON = senegalDepartmentsGeoJSON;

  const departmentGeoJsonRef = useRef<LeafletGeoJSON | null>(null);
  const regionGeoJsonRef = useRef<LeafletGeoJSON | null>(null);
  const outsideMaskGeoJSON = useMemo(
    () => (regionGeoJSON ? buildOutsideMask(regionGeoJSON) : null),
    [regionGeoJSON],
  );

  const defaultStyle: PathOptions = {
    weight: 1,
    opacity: 1,
    color: '#f8fafc',
    fillOpacity: 0,
  };

  const maskStyle: PathOptions = {
    stroke: false,
    // gray
    fillColor: '#9ca3af',
    fillOpacity: 0.55,
    interactive: false,
  };

  const highlightStyle: PathOptions = {
    fillColor: '#66BB6A',
    weight: 2,
    color: '#1B5E20',
    fillOpacity: 0.05,
  };

  const onEachDepartment = (feature: GeoFeature, layer: L.Layer) => {
    const departmentName = getFeatureName(feature.properties);
    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target as L.Path;
        target.setStyle(highlightStyle);
        target.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        departmentGeoJsonRef.current?.resetStyle(e.target as L.Path);
      },
      click: (e: LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng, departmentName);
        (e.target as L.Path)
          .bindPopup(`<strong>District:</strong> ${departmentName}`)
          .openPopup(e.latlng);
      },
    });
  };

  const onEachRegion = (feature: GeoFeature, layer: L.Layer) => {
    const regionName = getFeatureName(feature.properties);
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
          .bindPopup(`<strong>Region:</strong> ${regionName}`)
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

  const showDepartments =
    zoomLevel > 7 && !!departmentGeoJSON?.features.length;

  return (
    <MapContainer
      bounds={senegalBounds}
      maxBounds={senegalBounds}
      maxBoundsViscosity={1.0}
      minZoom={6}
      zoom={6}
      maxZoom={18}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md"
    >
      <TileLayer
        minZoom={6}
        maxZoom={18}
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SearchBar />

      {outsideMaskGeoJSON ? <GeoJSON data={outsideMaskGeoJSON} style={() => maskStyle} /> : null}

      <ZoomHandler />

      {showDepartments ? (
        departmentGeoJSON ? (
          <GeoJSON
            key="departments"
            ref={departmentGeoJsonRef}
            data={departmentGeoJSON}
            style={() => defaultStyle}
            onEachFeature={onEachDepartment}
          />
        ) : null
      ) : regionGeoJSON ? (
        <GeoJSON
          key="regions"
          ref={regionGeoJsonRef}
          data={regionGeoJSON}
          style={() => defaultStyle}
          onEachFeature={onEachRegion}
        />
      ) : null}

      {markerPosition ? <Marker position={markerPosition} children={<></>} /> : null}
    </MapContainer>
  );
}
