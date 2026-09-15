import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'

/** Keep React UI synchronized with Leaflet's current zoom level. */
export default function MapZoomHandler({
  onZoomChange,
}: {
  onZoomChange: (zoom: number) => void
}) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  })

  useEffect(() => {
    onZoomChange(map.getZoom())
  }, [map, onZoomChange])

  return null
}
