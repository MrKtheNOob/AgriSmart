import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { GeoJSON as LeafletGeoJSON } from 'leaflet'
import type { FeatureCollection } from 'geojson'
import type {
  LatLngBoundsExpression,
  LatLngTuple,
  LeafletMouseEvent,
  PathOptions,
} from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import SearchBar from './SearchBar'
import senegalZonesGeoJSONString from '../assets/senegal_agroecological_zones.geojson?raw'
import senegalRegionsGeoJSONString from '../assets/senegal_adm1.geojson?raw'
import senegalDepartmentsGeoJSONString from '../assets/senegal_adm2.geojson?raw'
import {
  findContainingFeature,
  getFeatureName,
  getGeometryCenter,
  type GeoFeature,
} from '../utils/geo'

const agroecologicalZones: FeatureCollection = JSON.parse(
  senegalZonesGeoJSONString,
)
const senegalRegions: FeatureCollection = JSON.parse(senegalRegionsGeoJSONString)
const senegalDepartments: FeatureCollection = JSON.parse(
  senegalDepartmentsGeoJSONString,
)

const ZONE_COLORS: Record<string, string> = {
  ZSP: '#c8ad78',
  NDK: '#69b9ad',
  BA: '#d9ad55',
  VAL: '#70a9b8',
  ZF: '#78a77c',
  ASP: '#958ab5',
}

const ZONE_LABEL_POSITIONS: Record<string, LatLngTuple> = {
  ZSP: [15.45, -14.35],
  NDK: [15.25, -16.75],
  BA: [14.25, -15.15],
  VAL: [16.15, -14.4],
  ZF: [12.75, -15.45],
  ASP: [13.55, -12.75],
}

const normalizeZoneName = (value: unknown) => {
  if (typeof value !== 'string') return 'Zone agroécologique'

  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace('Zone Sylvo Pastorale', 'Zone Sylvo-Pastorale')
}

const getZoneCode = (feature?: GeoFeature) => {
  const code = feature?.properties.ZONE
  return typeof code === 'string' ? code : 'unknown'
}

const getZoneName = (feature?: GeoFeature) =>
  normalizeZoneName(feature?.properties.AEZ)

const buildOutsideMask = (
  countryGeoJSON: FeatureCollection,
): FeatureCollection => ({
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
          ...countryGeoJSON.features.flatMap((feature) => {
            if (!feature.geometry) return []
            if (feature.geometry.type === 'Polygon') {
              return feature.geometry.coordinates
            }
            if (feature.geometry.type === 'MultiPolygon') {
              return feature.geometry.coordinates.flat(1)
            }
            return []
          }),
        ],
      },
    },
  ],
})

const createLabelIcon = (
  label: string,
  className: string,
  width: number,
) =>
  L.divIcon({
    className: `map-text-label ${className}`,
    html: `<span>${label}</span>`,
    iconSize: [width, 24],
    iconAnchor: [width / 2, 12],
  })

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

type MapMode = 'agroecological' | 'administrative'

function AdministrativeLabels({
  zoomLevel,
  mapMode,
}: {
  zoomLevel: number
  mapMode: MapMode
}) {
  const showDepartments = zoomLevel >= 8
  const showZones = mapMode === 'agroecological' && zoomLevel <= 8

  return (
    <>
      {showZones
        ? agroecologicalZones.features.map((feature, index) => {
            if (!feature.geometry) return null
            const typedFeature = feature as GeoFeature
            const code = getZoneCode(typedFeature)
            const position =
              ZONE_LABEL_POSITIONS[code] ?? getGeometryCenter(feature.geometry)

            return (
              <Marker
                key={`zone-label-${code}-${index}`}
                position={position}
                icon={createLabelIcon(
                  getZoneName(typedFeature),
                  'zone-map-label',
                  180,
                )}
                interactive={false}
              />
            )
          })
        : null}

      {senegalRegions.features.map((feature, index) => {
        if (!feature.geometry) return null
        const name = getFeatureName(
          feature.properties as Record<string, unknown>,
        )

        return (
          <Marker
            key={`region-label-${name}-${index}`}
            position={getGeometryCenter(feature.geometry)}
            icon={createLabelIcon(name, 'region-map-label', 120)}
            interactive={false}
          />
        )
      })}

      {showDepartments
        ? senegalDepartments.features.map((feature, index) => {
            if (!feature.geometry) return null
            const name = getFeatureName(
              feature.properties as Record<string, unknown>,
            )

            return (
              <Marker
                key={`department-label-${name}-${index}`}
                position={getGeometryCenter(feature.geometry)}
                icon={createLabelIcon(name, 'department-map-label', 100)}
                interactive={false}
              />
            )
          })
        : null}
    </>
  )
}

function MapModeToggle({
  value,
  onChange,
}: {
  value: MapMode
  onChange: (mode: MapMode) => void
}) {
  return (
    <div className="map-mode-toggle" role="group" aria-label="Mode cartographique">
      <button
        type="button"
        className={value === 'agroecological' ? 'is-active' : undefined}
        aria-pressed={value === 'agroecological'}
        onClick={() => onChange('agroecological')}
      >
        Pédologique
      </button>
      <button
        type="button"
        className={value === 'administrative' ? 'is-active' : undefined}
        aria-pressed={value === 'administrative'}
        onClick={() => onChange('administrative')}
      >
        Administratif
      </button>
    </div>
  )
}

function ZoneLegend() {
  return (
    <div className="agro-zone-legend" aria-label="Légende des zones agroécologiques">
      <div className="agro-zone-legend__eyebrow">Territoire agricole</div>
      <div className="agro-zone-legend__title">Zones agroécologiques</div>
      <div className="agro-zone-legend__items">
        {agroecologicalZones.features.map((feature) => {
          const typedFeature = feature as GeoFeature
          const code = getZoneCode(typedFeature)

          return (
            <div className="agro-zone-legend__item" key={`legend-${code}`}>
              <span
                className="agro-zone-legend__swatch"
                style={{ backgroundColor: ZONE_COLORS[code] }}
              />
              <span>{getZoneName(typedFeature)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SenegalMap({ onMapClick, markerPosition }: MapProps) {
  const senegalBounds: LatLngBoundsExpression = [
    [12.2, -17.8],
    [17.8, -11.2],
  ]

  const [zoomLevel, setZoomLevel] = useState(6)
  const [mapMode, setMapMode] = useState<MapMode>('agroecological')
  const zoneGeoJsonRef = useRef<LeafletGeoJSON | null>(null)
  const regionGeoJsonRef = useRef<LeafletGeoJSON | null>(null)
  const departmentGeoJsonRef = useRef<LeafletGeoJSON | null>(null)
  const selectedAreaLayerRef = useRef<L.Path | null>(null)
  const selectedAreaResetRef = useRef<(() => void) | null>(null)
  const outsideMaskGeoJSON = useMemo(
    () => buildOutsideMask(senegalRegions),
    [],
  )

  const clearSelectedArea = () => {
    selectedAreaLayerRef.current
      ?.getElement()
      ?.classList.remove('agro-zone-selected')
    selectedAreaResetRef.current?.()
    selectedAreaLayerRef.current = null
    selectedAreaResetRef.current = null
  }

  useEffect(() => {
    if (!markerPosition) clearSelectedArea()
  }, [markerPosition])

  useEffect(() => {
    clearSelectedArea()
  }, [mapMode])

  const zoneStyle = (feature?: GeoFeature): PathOptions => ({
    color: '#f8fafc',
    weight: 1.15,
    opacity: 0.95,
    fillColor: ZONE_COLORS[getZoneCode(feature)] ?? '#94a3b8',
    fillOpacity: 0.42,
  })

  const zoneHighlightStyle: PathOptions = {
    color: '#ffffff',
    weight: 1.8,
    fillOpacity: 0.52,
  }

  const zoneSelectedStyle: PathOptions = {
    color: '#315d50',
    weight: 2.4,
    opacity: 0.96,
    fillOpacity: 0.58,
  }

  const administrativeRegionStyle: PathOptions = {
    color: '#526171',
    weight: 1.2,
    opacity: 0.78,
    fillOpacity: 0,
  }

  const administrativeDepartmentStyle: PathOptions = {
    color: '#697786',
    weight: 0.75,
    opacity: 0.62,
    fillOpacity: 0,
  }

  const administrativeHighlightStyle: PathOptions = {
    color: '#ffffff',
    weight: 1.8,
    fillColor: '#8eb29f',
    fillOpacity: 0.5,
  }

  const regionBoundaryStyle: PathOptions = {
    color: '#526171',
    weight: 0.85,
    opacity: 0.58,
    fillOpacity: 0,
    interactive: false,
  }

  const departmentBoundaryStyle: PathOptions = {
    color: '#697786',
    weight: 0.55,
    opacity: 0.42,
    dashArray: '3 4',
    fillOpacity: 0,
    interactive: false,
  }

  const maskStyle: PathOptions = {
    stroke: false,
    fillColor: '#f3f5f4',
    fillOpacity: 0.16,
    interactive: false,
  }

  const selectCoordinate = (
    latitude: number,
    longitude: number,
    selectedZone?: GeoFeature,
  ) => {
    const point: [number, number] = [longitude, latitude]
    const zone =
      selectedZone ?? findContainingFeature(point, agroecologicalZones)
    const region = findContainingFeature(point, senegalRegions)
    const department = findContainingFeature(point, senegalDepartments)

    const zoneName = zone ? getZoneName(zone) : undefined
    const regionName = region ? getFeatureName(region.properties) : undefined
    const departmentName = department
      ? getFeatureName(department.properties)
      : undefined
    const locationName = [departmentName, regionName, zoneName]
      .filter(Boolean)
      .join(' · ')

    onMapClick(latitude, longitude, locationName || undefined)
    return { zoneName, regionName, departmentName }
  }

  const selectAreaLayer = (
    target: L.Path,
    style: PathOptions,
    reset: () => void,
  ) => {
    if (selectedAreaLayerRef.current === target) return

    clearSelectedArea()
    selectedAreaLayerRef.current = target
    selectedAreaResetRef.current = reset
    target.setStyle(style)
    target.getElement()?.classList.remove('agro-zone-hovered')
    target.getElement()?.classList.add('agro-zone-selected')
    target.bringToFront()
  }

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
    ].filter(Boolean)

    ;(event.target as L.Path)
      .bindPopup(lines.join('<br />'))
      .openPopup(event.latlng)
  }

  const onEachZone = (feature: GeoFeature, layer: L.Layer) => {
    layer.on({
      mouseover: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path
        if (selectedAreaLayerRef.current !== target) {
          target.setStyle(zoneHighlightStyle)
          target.getElement()?.classList.add('agro-zone-hovered')
        }
        target.bringToFront()
      },
      mouseout: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path
        target.getElement()?.classList.remove('agro-zone-hovered')
        if (selectedAreaLayerRef.current !== target) {
          zoneGeoJsonRef.current?.resetStyle(target)
        }
      },
      click: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path
        selectAreaLayer(target, zoneSelectedStyle, () =>
          zoneGeoJsonRef.current?.resetStyle(target),
        )

        const selection = selectCoordinate(
          event.latlng.lat,
          event.latlng.lng,
          feature,
        )
        showSelectionPopup(event, selection)
      },
    })
  }

  const onEachAdministrativeArea = (
    _feature: GeoFeature,
    layer: L.Layer,
    resetStyle: (target: L.Path) => void,
  ) => {
    layer.on({
      mouseover: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path
        if (selectedAreaLayerRef.current !== target) {
          target.setStyle(administrativeHighlightStyle)
          target.getElement()?.classList.add('agro-zone-hovered')
        }
        target.bringToFront()
      },
      mouseout: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path
        target.getElement()?.classList.remove('agro-zone-hovered')
        if (selectedAreaLayerRef.current !== target) resetStyle(target)
      },
      click: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path
        selectAreaLayer(target, zoneSelectedStyle, () => resetStyle(target))
        const selection = selectCoordinate(event.latlng.lat, event.latlng.lng)
        showSelectionPopup(event, selection)
      },
    })
  }

  function ZoomHandler() {
    const map = useMapEvents({
      zoomend: () => setZoomLevel(map.getZoom()),
    })

    useEffect(() => {
      setZoomLevel(map.getZoom())
    }, [map])

    return null
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
      style={{ height: '100%', width: '100%' }}
      className="premium-agri-map rounded-lg shadow-md"
    >
      <TileLayer
        minZoom={6}
        maxZoom={18}
        opacity={0.48}
        className="premium-basemap"
        attribution="© OpenStreetMap contributors · Zones agroécologiques : Ministère de l'Agriculture du Sénégal"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SearchBar />
      <MapModeToggle value={mapMode} onChange={setMapMode} />
      {mapMode === 'agroecological' ? <ZoneLegend /> : null}
      <GeoJSON data={outsideMaskGeoJSON} style={() => maskStyle} />
      <ZoomHandler />

      {mapMode === 'agroecological' ? (
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
            onEachAdministrativeArea(
              feature as GeoFeature,
              layer,
              (target) => departmentGeoJsonRef.current?.resetStyle(target),
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
            onEachAdministrativeArea(
              feature as GeoFeature,
              layer,
              (target) => regionGeoJsonRef.current?.resetStyle(target),
            )
          }
        />
      )}

      <AdministrativeLabels zoomLevel={zoomLevel} mapMode={mapMode} />
      {markerPosition ? <Marker position={markerPosition} /> : null}
    </MapContainer>
  )
}
