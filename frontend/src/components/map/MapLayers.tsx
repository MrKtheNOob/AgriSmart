import { GeoJSON, Pane } from 'react-leaflet'
import type { GeoJSON as LeafletGeoJSON } from 'leaflet'
import type { RefObject } from 'react'
import type { GeoFeature } from '../../utils/geo'
import {
  agroecologicalZones,
  senegalDepartments,
  senegalRegions,
} from '../../utils/MapUtils'
import type { MapMode } from '../MapModeToggle'
import {
  administrativeDepartmentStyle,
  administrativeRegionStyle,
  departmentBoundaryStyle,
  regionBoundaryStyle,
  zoneStyle,
} from './mapStyles'

interface MapLayersProps {
  mapMode: MapMode
  zoomLevel: number
  zoneRef: RefObject<LeafletGeoJSON | null>
  regionRef: RefObject<LeafletGeoJSON | null>
  departmentRef: RefObject<LeafletGeoJSON | null>
  onEachZone: (feature: GeoFeature, layer: L.Layer) => void
  onEachAdministrativeArea: (
    feature: GeoFeature,
    layer: L.Layer,
    resetStyle: (target: L.Path) => void,
  ) => void
}

/** Render both selectable map modes in persistent panes for smooth crossfades. */
export default function MapLayers({
  mapMode,
  zoomLevel,
  zoneRef,
  regionRef,
  departmentRef,
  onEachZone,
  onEachAdministrativeArea,
}: MapLayersProps) {
  return (
    <>
      {/* Colored agricultural zones with administrative boundaries for context. */}
      <Pane
        name="agroecological-mode"
        className={`map-mode-pane${
          mapMode === 'agroecological' ? '' : ' is-hidden'
        }`}
        style={{ zIndex: 410 }}
      >
        <GeoJSON
          ref={zoneRef}
          data={agroecologicalZones}
          style={(feature) => zoneStyle(feature as GeoFeature | undefined)}
          onEachFeature={(feature, layer) =>
            onEachZone(feature as GeoFeature, layer)
          }
        />
        <GeoJSON
          data={senegalRegions}
          style={() => regionBoundaryStyle}
          interactive={false}
        />
        {zoomLevel >= 8 ? (
          <GeoJSON
            data={senegalDepartments}
            style={() => departmentBoundaryStyle}
            interactive={false}
          />
        ) : null}
      </Pane>

      {/* Standard Leaflet appearance with selectable regions or departments. */}
      <Pane
        name="administrative-mode"
        className={`map-mode-pane${
          mapMode === 'administrative' ? '' : ' is-hidden'
        }`}
        style={{ zIndex: 420 }}
      >
        {zoomLevel >= 8 ? (
          <GeoJSON
            ref={departmentRef}
            data={senegalDepartments}
            style={() => administrativeDepartmentStyle}
            onEachFeature={(feature, layer) =>
              onEachAdministrativeArea(
                feature as GeoFeature,
                layer,
                (target) => departmentRef.current?.resetStyle(target),
              )
            }
          />
        ) : (
          <GeoJSON
            ref={regionRef}
            data={senegalRegions}
            style={() => administrativeRegionStyle}
            onEachFeature={(feature, layer) =>
              onEachAdministrativeArea(
                feature as GeoFeature,
                layer,
                (target) => regionRef.current?.resetStyle(target),
              )
            }
          />
        )}
      </Pane>
    </>
  )
}
