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
  ZSP: '#d6a85f',
  NDK: '#5cc8c3',
  BA: '#e8c65a',
  VAL: '#65a9e8',
  ZF: '#5dbb78',
  ASP: '#9c7ad6',
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

function AdministrativeLabels({ zoomLevel }: { zoomLevel: number }) {
  const showDepartments = zoomLevel >= 8
  const showZones = zoomLevel <= 8

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

export default function SenegalMap({ onMapClick, markerPosition }: MapProps) {
  const senegalBounds: LatLngBoundsExpression = [
    [12.2, -17.8],
    [17.8, -11.2],
  ]

  const [zoomLevel, setZoomLevel] = useState(6)
  const zoneGeoJsonRef = useRef<LeafletGeoJSON | null>(null)
  const outsideMaskGeoJSON = useMemo(
    () => buildOutsideMask(senegalRegions),
    [],
  )

  const zoneStyle = (feature?: GeoFeature): PathOptions => ({
    color: '#ffffff',
    weight: 1.4,
    opacity: 0.9,
    fillColor: ZONE_COLORS[getZoneCode(feature)] ?? '#94a3b8',
    fillOpacity: 0.34,
  })

  const zoneHighlightStyle: PathOptions = {
    color: '#166534',
    weight: 2.5,
    fillOpacity: 0.46,
  }

  const regionBoundaryStyle: PathOptions = {
    color: '#334155',
    weight: 1.15,
    opacity: 0.72,
    fillOpacity: 0,
    interactive: false,
  }

  const departmentBoundaryStyle: PathOptions = {
    color: '#475569',
    weight: 0.7,
    opacity: 0.48,
    dashArray: '4 4',
    fillOpacity: 0,
    interactive: false,
  }

  const maskStyle: PathOptions = {
    stroke: false,
    fillColor: '#9ca3af',
    fillOpacity: 0.55,
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

  const onEachZone = (feature: GeoFeature, layer: L.Layer) => {
    layer.on({
      mouseover: (event: LeafletMouseEvent) => {
        const target = event.target as L.Path
        target.setStyle(zoneHighlightStyle)
        target.bringToFront()
      },
      mouseout: (event: LeafletMouseEvent) => {
        zoneGeoJsonRef.current?.resetStyle(event.target as L.Path)
      },
      click: (event: LeafletMouseEvent) => {
        const selection = selectCoordinate(
          event.latlng.lat,
          event.latlng.lng,
          feature,
        )
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
      className="rounded-lg shadow-md"
    >
      <TileLayer
        minZoom={6}
        maxZoom={18}
        attribution="© OpenStreetMap · Zones agroécologiques : Ministère de l'Agriculture du Sénégal"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SearchBar />
      <GeoJSON data={outsideMaskGeoJSON} style={() => maskStyle} />
      <ZoomHandler />

      <GeoJSON
        key="agroecological-zones"
        ref={zoneGeoJsonRef}
        data={agroecologicalZones}
        style={(feature) => zoneStyle(feature as GeoFeature | undefined)}
        onEachFeature={onEachZone}
      />

      <GeoJSON
        key="regions"
        data={senegalRegions}
        style={() => regionBoundaryStyle}
        interactive={false}
      />

      {zoomLevel >= 8 ? (
        <GeoJSON
          key="departments"
          data={senegalDepartments}
          style={() => departmentBoundaryStyle}
          interactive={false}
        />
      ) : null}

      <AdministrativeLabels zoomLevel={zoomLevel} />
      {markerPosition ? <Marker position={markerPosition} /> : null}
    </MapContainer>
  )
}
