import type { PathOptions } from 'leaflet'
import type { GeoFeature } from '../../utils/geo'
import { getZoneCode, ZONE_COLORS } from '../../utils/MapUtils'

export const zoneStyle = (feature?: GeoFeature): PathOptions => ({
  color: '#f8fafc',
  weight: 1.15,
  opacity: 0.95,
  fillColor: ZONE_COLORS[getZoneCode(feature)] ?? '#94a3b8',
  fillOpacity: 0.42,
})

export const zoneHighlightStyle: PathOptions = {
  color: '#ffffff',
  weight: 1.8,
  fillOpacity: 0.52,
}

export const zoneSelectedStyle: PathOptions = {
  color: '#315d50',
  weight: 2.4,
  opacity: 0.96,
  fillOpacity: 0.58,
}

export const administrativeRegionStyle: PathOptions = {
  color: '#526171',
  weight: 1.2,
  opacity: 0.78,
  fillOpacity: 0,
}

export const administrativeDepartmentStyle: PathOptions = {
  color: '#697786',
  weight: 0.75,
  opacity: 0.62,
  fillOpacity: 0,
}

export const administrativeHighlightStyle: PathOptions = {
  color: '#ffffff',
  weight: 1.8,
  fillColor: '#8eb29f',
  fillOpacity: 0.5,
}

export const regionBoundaryStyle: PathOptions = {
  color: '#526171',
  weight: 0.85,
  opacity: 0.58,
  fillOpacity: 0,
  interactive: false,
}

export const departmentBoundaryStyle: PathOptions = {
  color: '#697786',
  weight: 0.55,
  opacity: 0.42,
  dashArray: '3 4',
  fillOpacity: 0,
  interactive: false,
}

export const outsideMaskStyle: PathOptions = {
  stroke: false,
  fillColor: '#64748b',
  fillOpacity: 0.6,
  interactive: false,
}
