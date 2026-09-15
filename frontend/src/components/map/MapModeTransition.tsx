import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { MapMode } from '../MapModeToggle'

/** Crossfade Leaflet's persistent data panes without remounting their layers. */
export default function MapModeTransition({ mode }: { mode: MapMode }) {
  const map = useMap()

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      for (const paneName of [
        'agroecological-mode',
        'agroecological-labels',
      ]) {
        map
          .getPane(paneName)
          ?.classList.toggle('is-hidden', mode !== 'agroecological')
      }
      for (const paneName of [
        'administrative-mode',
        'administrative-labels',
      ]) {
        map
          .getPane(paneName)
          ?.classList.toggle('is-hidden', mode !== 'administrative')
      }
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [map, mode])

  return null
}
