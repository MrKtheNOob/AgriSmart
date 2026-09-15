import L from 'leaflet'
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import { useMemo, useState } from 'react'
import { GeoJSON, MapContainer, Marker, TileLayer, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { buildOutsideMask, senegalRegions } from '../utils/MapUtils'
import { AdministrativeLabels, ZoneLegend } from './MapLegend'
import type { MapMode } from './MapModeToggle'
import MapToolbar from './map/MapToolbar'
import MapLayers from './map/MapLayers'
import MapModeTransition from './map/MapModeTransition'
import MapZoomHandler from './map/MapZoomHandler'
import { outsideMaskStyle } from './map/mapStyles'
import useMapSelection from './map/useMapSelection'

// Restore Leaflet's default marker assets when the map is bundled by Vite.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

interface MapProps {
  onMapClick: (lat: number, lng: number, name?: string) => void
  markerPosition: LatLngTuple | null
}

const SENEGAL_BOUNDS: LatLngBoundsExpression = [
  [12.2, -17.8],
  [17.8, -11.2],
]

/** Compose the Senegal basemap, controls, selectable layers, labels, and marker. */
export default function SenegalMap({ onMapClick, markerPosition }: MapProps) {
  const [zoomLevel, setZoomLevel] = useState(10)
  const [mapMode, setMapMode] = useState<MapMode>('agroecological')
  const outsideMask = useMemo(() => buildOutsideMask(senegalRegions), [])
  const selection = useMapSelection({
    mapMode,
    markerPosition,
    onMapClick,
  })

  return (
    <MapContainer
      bounds={SENEGAL_BOUNDS}
      maxBounds={SENEGAL_BOUNDS}
      maxBoundsViscosity={1}
      minZoom={6.3}
      zoom={7}
      maxZoom={18}
      scrollWheelZoom
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
      className="premium-agri-map rounded-lg shadow-md"
    >
      {/* Keep the normal colorful OpenStreetMap appearance inside Senegal. */}
      <TileLayer
        minZoom={6}
        maxZoom={18}
        opacity={1}
        attribution={
          mapMode === 'agroecological'
            ? "© OpenStreetMap contributors · Zones agroécologiques : Ministère de l'Agriculture du Sénégal"
            : '© OpenStreetMap contributors'
        }
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* The mask visually disables neighboring territory without muting Senegal. */}
      <GeoJSON data={outsideMask} style={() => outsideMaskStyle} />

      <MapToolbar mode={mapMode} onModeChange={setMapMode} />
      <ZoomControl position="bottomright" />
      <ZoneLegend visible={mapMode === 'agroecological'} />
      <MapZoomHandler onZoomChange={setZoomLevel} />

      <MapLayers
        mapMode={mapMode}
        zoomLevel={zoomLevel}
        zoneRef={selection.zoneGeoJsonRef}
        regionRef={selection.regionGeoJsonRef}
        departmentRef={selection.departmentGeoJsonRef}
        onEachZone={selection.onEachZone}
        onEachAdministrativeArea={selection.onEachAdministrativeArea}
      />
      <AdministrativeLabels zoomLevel={zoomLevel} mapMode={mapMode} />
      <MapModeTransition mode={mapMode} />

      {/* Show the coordinate selected by a polygon click or search result. */}
      {markerPosition ? <Marker position={markerPosition} /> : null}
    </MapContainer>
  )
}
