import L, { GeoJSON as LeafletGeoJSON } from 'leaflet'
import type {
  LatLngTuple,
  LeafletMouseEvent,
  PathOptions,
} from 'leaflet'
import { useCallback, useEffect, useRef } from 'react'
import {
  findContainingFeature,
  getFeatureName,
  type GeoFeature,
} from '../../utils/geo'
import {
  agroecologicalZones,
  getZoneName,
  senegalDepartments,
  senegalRegions,
} from '../../utils/MapUtils'
import type { MapMode } from '../MapModeToggle'
import {
  administrativeHighlightStyle,
  zoneHighlightStyle,
  zoneSelectedStyle,
} from './mapStyles'

interface UseMapSelectionOptions {
  mapMode: MapMode
  markerPosition: LatLngTuple | null
  onMapClick: (lat: number, lng: number, name?: string) => void
}

/** Own polygon selection, hover behavior, location lookup, and popups. */
export default function useMapSelection({
  mapMode,
  markerPosition,
  onMapClick,
}: UseMapSelectionOptions) {
  const zoneGeoJsonRef = useRef<LeafletGeoJSON | null>(null)
  const regionGeoJsonRef = useRef<LeafletGeoJSON | null>(null)
  const departmentGeoJsonRef = useRef<LeafletGeoJSON | null>(null)
  const selectedAreaLayerRef = useRef<L.Path | null>(null)
  const selectedAreaResetRef = useRef<(() => void) | null>(null)

  const clearSelectedArea = useCallback(() => {
    selectedAreaLayerRef.current
      ?.getElement()
      ?.classList.remove('agro-zone-selected')
    selectedAreaResetRef.current?.()
    selectedAreaLayerRef.current = null
    selectedAreaResetRef.current = null
  }, [])

  useEffect(() => {
    if (!markerPosition) clearSelectedArea()
  }, [clearSelectedArea, markerPosition])

  useEffect(() => {
    clearSelectedArea()
  }, [clearSelectedArea, mapMode])

  const selectCoordinate = useCallback(
    (latitude: number, longitude: number, selectedZone?: GeoFeature) => {
      const point: [number, number] = [longitude, latitude]
      const zone =
        selectedZone ?? findContainingFeature(point, agroecologicalZones)
      const region = findContainingFeature(point, senegalRegions)
      const department = findContainingFeature(point, senegalDepartments)

      const zoneName = zone ? getZoneName(zone) : undefined
      const regionName = region
        ? getFeatureName(region.properties)
        : undefined
      const departmentName = department
        ? getFeatureName(department.properties)
        : undefined
      const locationName = [departmentName, regionName, zoneName]
        .filter(Boolean)
        .join(' · ')

      onMapClick(latitude, longitude, locationName || undefined)
      return { zoneName, regionName, departmentName }
    },
    [onMapClick],
  )

  const selectAreaLayer = useCallback(
    (target: L.Path, style: PathOptions, reset: () => void) => {
      if (selectedAreaLayerRef.current === target) return

      clearSelectedArea()
      selectedAreaLayerRef.current = target
      selectedAreaResetRef.current = reset
      target.setStyle(style)
      target.getElement()?.classList.remove('agro-zone-hovered')
      target.getElement()?.classList.add('agro-zone-selected')
      target.bringToFront()
    },
    [clearSelectedArea],
  )

  const showSelectionPopup = useCallback(
    (
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

      const target = event.target as L.Path
      target.bindPopup(lines.join('<br />')).openPopup(event.latlng)
    },
    [],
  )

  const onEachZone = useCallback(
    (feature: GeoFeature, layer: L.Layer) => {
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
          showSelectionPopup(
            event,
            selectCoordinate(event.latlng.lat, event.latlng.lng, feature),
          )
        },
      })
    },
    [selectAreaLayer, selectCoordinate, showSelectionPopup],
  )

  const onEachAdministrativeArea = useCallback(
    (
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
          showSelectionPopup(
            event,
            selectCoordinate(event.latlng.lat, event.latlng.lng),
          )
        },
      })
    },
    [selectAreaLayer, selectCoordinate, showSelectionPopup],
  )

  return {
    departmentGeoJsonRef,
    onEachAdministrativeArea,
    onEachZone,
    regionGeoJsonRef,
    zoneGeoJsonRef,
  }
}
