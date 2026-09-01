import type { Feature, FeatureCollection, Geometry } from 'geojson'

export type GeoFeature = Feature<Geometry, Record<string, unknown>>

export const getFeatureName = (properties: Record<string, unknown>) => {
  const candidates = [
    properties.adm2_name,
    properties.adm1_name,
    properties.shapeName,
    properties.name,
    properties.ADM2_EN,
    properties.ADM1_EN,
    properties.SNAME,
  ]

  return (
    candidates.find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    ) ?? 'Zone sélectionnée'
  )
}

export const getGeometryCenter = (geometry: Geometry): [number, number] => {
  const points: Array<[number, number]> = []

  const collectPoints = (coordinates: unknown): void => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return

    if (
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      points.push([coordinates[0], coordinates[1]])
      return
    }

    coordinates.forEach(collectPoints)
  }

  if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach((item) => {
      const [lat, lng] = getGeometryCenter(item)
      points.push([lng, lat])
    })
  } else {
    collectPoints(geometry.coordinates)
  }

  if (points.length === 0) return [14.5, -14.5]

  const bounds = points.reduce(
    (current, [lng, lat]) => ({
      minLat: Math.min(current.minLat, lat),
      maxLat: Math.max(current.maxLat, lat),
      minLng: Math.min(current.minLng, lng),
      maxLng: Math.max(current.maxLng, lng),
    }),
    {
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
    },
  )

  return [
    (bounds.minLat + bounds.maxLat) / 2,
    (bounds.minLng + bounds.maxLng) / 2,
  ]
}

const pointInRing = (point: [number, number], ring: number[][]) => {
  const [lng, lat] = point
  let inside = false

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [currentLng, currentLat] = ring[index]
    const [previousLng, previousLat] = ring[previous]
    const intersects =
      currentLat > lat !== previousLat > lat &&
      lng <
        ((previousLng - currentLng) * (lat - currentLat)) /
          (previousLat - currentLat + 0.0000001) +
          currentLng

    if (intersects) inside = !inside
  }

  return inside
}

const pointInPolygon = (point: [number, number], polygon: number[][][]) => {
  if (polygon.length === 0) return false
  const [outerRing, ...holes] = polygon
  if (!pointInRing(point, outerRing)) return false
  return !holes.some((hole) => pointInRing(point, hole))
}

export const pointInGeometry = (
  point: [number, number],
  geometry: Geometry,
): boolean => {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates)
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) =>
      pointInPolygon(point, polygon),
    )
  }

  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.some((item) => pointInGeometry(point, item))
  }

  return false
}

export const findContainingFeature = (
  point: [number, number],
  collection: FeatureCollection,
): GeoFeature | undefined =>
  collection.features.find(
    (feature): feature is GeoFeature =>
      Boolean(
        feature.geometry && pointInGeometry(point, feature.geometry),
      ),
  )
