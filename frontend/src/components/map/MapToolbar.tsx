import { useEffect, useRef } from 'react'
import L from 'leaflet'
import SearchBar from '../SearchBar'
import MapModeToggle, { type MapMode } from '../MapModeToggle'

/** Keep map controls in normal flow; wrapping handles narrow map viewports. */
export default function MapToolbar({ mode, onModeChange }: {
  mode: MapMode
  onModeChange: (mode: MapMode) => void
}) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = container.current
    if (!element) return
    L.DomEvent.disableClickPropagation(element)
    L.DomEvent.disableScrollPropagation(element)
    return () => { L.DomEvent.off(element) }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-3">
      <div ref={container} className="flex flex-wrap items-start justify-end gap-3">
        <SearchBar />
        <MapModeToggle value={mode} onChange={onModeChange} />
      </div>
    </div>
  )
}
