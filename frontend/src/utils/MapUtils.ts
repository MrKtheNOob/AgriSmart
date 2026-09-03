import type { FeatureCollection } from 'geojson'
import senegalZonesGeoJSONString from '../assets/senegal_agroecological_zones.geojson?raw'
import senegalRegionsGeoJSONString from '../assets/senegal_adm1.geojson?raw'
import senegalDepartmentsGeoJSONString from '../assets/senegal_adm2.geojson?raw'
import type { GeoFeature } from './geo'

export const agroecologicalZones: FeatureCollection = JSON.parse(senegalZonesGeoJSONString)
export const senegalRegions: FeatureCollection = JSON.parse(senegalRegionsGeoJSONString)
export const senegalDepartments: FeatureCollection = JSON.parse(senegalDepartmentsGeoJSONString)

export const ZONE_COLORS: Record<string, string> = {
  ZSP: '#c8ad78', NDK: '#69b9ad', BA: '#d9ad55',
  VAL: '#70a9b8', ZF: '#78a77c', ASP: '#958ab5',
}

export const getZoneCode = (feature?: GeoFeature) => {
  const code = feature?.properties.ZONE
  return typeof code === 'string' ? code : 'unknown'
}

export const getZoneName = (feature?: GeoFeature) => {
  const value = feature?.properties.AEZ
  if (typeof value !== 'string') return 'Zone agroécologique'
  return value.replace(/\s+/g, ' ').trim().replace('Zone Sylvo Pastorale', 'Zone Sylvo-Pastorale')
}

export const buildOutsideMask = (countryGeoJSON: FeatureCollection): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
        ...countryGeoJSON.features.flatMap((feature) => {
          if (!feature.geometry) return []
          if (feature.geometry.type === 'Polygon') return feature.geometry.coordinates
          if (feature.geometry.type === 'MultiPolygon') return feature.geometry.coordinates.flat(1)
          return []
        })],
    },
  }],
})
