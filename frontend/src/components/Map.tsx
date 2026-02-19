import {MapContainer,TileLayer,Marker,useMapEvents,GeoJSON,} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, {GeoJSON as LeafletGeoJSON,} from "leaflet";
import type {LeafletMouseEvent,PathOptions,LatLngTuple,LatLngBoundsExpression} from "leaflet";
import  { useRef } from "react";
import moroccoGeoJSONString from "../assets/morocco_adm1.geojson?raw";

const moroccoGeoJSON: GeoJSON.FeatureCollection =
  JSON.parse(moroccoGeoJSONString);

interface MoroccoRegionProperties {
  shapeName: string;
  shapeISO: string;
  shapeID: string;
  shapeGroup: string;
  shapeType: string;
}

type MoroccoFeature = GeoJSON.Feature<
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
  onMapClick: (lat: number, lng: number) => void;
  markerPosition: LatLngTuple | null;
}

export default function MoroccoMap({ onMapClick, markerPosition }: MapProps) {
  const moroccoBounds: LatLngBoundsExpression = [
    [20.0, -18.0],
    [36.5, -0.5],
  ];

  const geoJsonRef = useRef<LeafletGeoJSON | null>(null);

  // Default region style
  const defaultStyle: PathOptions = {
    weight: 1,
    opacity: 1,
    color: "#ffffff",
    fillOpacity: 0.4,
  };

  const highlightStyle: PathOptions = {
    fillColor: "#66BB6A",
    weight: 2,
    color: "#1B5E20",
    fillOpacity: 0.01,
  };

  const onEachFeature = (feature: MoroccoFeature, layer: L.Layer) => {
    const regionName = feature.properties.shapeName;

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target as L.Path;
        target.setStyle(highlightStyle);
        target.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        geoJsonRef.current?.resetStyle(e.target as L.Path);
      },
      click: (e: LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
        (e.target as L.Path)
          .bindPopup(`<strong>${regionName}</strong>`)
          .openPopup(e.latlng);
      },
    });
  };

  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer
      bounds={moroccoBounds}
      maxBounds={moroccoBounds}
      maxBoundsViscosity={1.0}
      minZoom={6}
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

      <GeoJSON
        ref={geoJsonRef}
        data={moroccoGeoJSON}
        style={() => defaultStyle}
        onEachFeature={onEachFeature}
      />

      <MapClickHandler />

      {markerPosition && <Marker position={markerPosition} />}
    </MapContainer>
  );
};


