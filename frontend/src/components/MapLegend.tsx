import L from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import { Marker, Pane } from 'react-leaflet'
import { getFeatureName, getGeometryCenter, type GeoFeature } from '../utils/geo'
import {
  agroecologicalZones,
  getZoneCode,
  getZoneName,
  senegalDepartments,
  senegalRegions,
  ZONE_COLORS,
} from '../utils/MapUtils'
import type { MapMode } from './MapModeToggle'

const ZONE_LABEL_POSITIONS: Record<string, LatLngTuple> = {
  ZSP: [15.45, -14.35],
  NDK: [15.25, -16.75],
  BA: [14.25, -15.15],
  VAL: [16.15, -14.4],
  ZF: [12.75, -15.45],
  ASP: [13.55, -12.75],
}

const createLabelIcon = (label: string, className: string, width: number) =>
  L.divIcon({
    className: `map-text-label ${className}`,
    html: `<span>${label}</span>`,
    iconSize: [width, 24],
    iconAnchor: [width / 2, 12],
  })

export function AdministrativeLabels({
  zoomLevel,
  mapMode,
}: {
  zoomLevel: number
  mapMode: MapMode
}) {
  const showDepartments = zoomLevel >= 8
  const showZones = zoomLevel <= 8

  return (
    <>
      {/* Labels use a higher pane so colored polygons cannot dim their text. */}
      <Pane
        name="agroecological-labels"
        className={`map-mode-pane${
          mapMode === 'agroecological' ? '' : ' is-hidden'
        }`}
        style={{ zIndex: 650 }}
      >
        {showZones
          ? agroecologicalZones.features.map((feature, index) => {
              if (!feature.geometry) return null
              const zone = feature as GeoFeature
              const code = getZoneCode(zone)
              const position =
                ZONE_LABEL_POSITIONS[code] ??
                getGeometryCenter(feature.geometry)

              return (
                <Marker
                  key={`zone-label-${code}-${index}`}
                  position={position}
                  icon={createLabelIcon(
                    getZoneName(zone),
                    'zone-map-label',
                    180,
                  )}
                  interactive={false}
                />
              )
            })
          : null}
      </Pane>

      <Pane
        name="administrative-labels"
        className={`map-mode-pane${
          mapMode === 'administrative' ? '' : ' is-hidden'
        }`}
        style={{ zIndex: 650 }}
      >
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
                  icon={createLabelIcon(
                    name,
                    'department-map-label',
                    100,
                  )}
                  interactive={false}
                />
              )
            })
          : null}
      </Pane>
    </>
  )
}

export function ZoneLegend({ visible }: { visible: boolean }) {
  return (
    <div
      className={`agro-zone-legend ${visible ? '' : 'is-hidden'}`}
      aria-hidden={!visible}
      aria-label="Légende des zones agroécologiques"
    >
      <div className="agro-zone-legend__eyebrow">Territoire agricole</div>
      <div className="agro-zone-legend__title">Zones agroécologiques</div>
      <div className="agro-zone-legend__items">
        {agroecologicalZones.features.map((feature) => {
          const zone = feature as GeoFeature
          const code = getZoneCode(zone)
          return (
            <div className="agro-zone-legend__item" key={`legend-${code}`}>
              <span
                className="agro-zone-legend__swatch"
                style={{ backgroundColor: ZONE_COLORS[code] }}
              />
              <span>{getZoneName(zone)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
