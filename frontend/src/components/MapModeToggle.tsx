export type MapMode = 'agroecological' | 'administrative'

export default function MapModeToggle({
  value,
  onChange,
}: {
  value: MapMode
  onChange: (mode: MapMode) => void
}) {
  return (
    <div
      className="map-mode-toggle pointer-events-auto shrink-0"
      data-mode={value}
      role="group"
      aria-label="Mode cartographique"
    >
      <span className="map-mode-toggle__indicator" aria-hidden="true" />
      <button
        type="button"
        className={value === 'agroecological' ? 'is-active' : undefined}
        aria-pressed={value === 'agroecological'}
        onClick={() => onChange('agroecological')}
      >
        Pédologique
      </button>
      <button
        type="button"
        className={value === 'administrative' ? 'is-active' : undefined}
        aria-pressed={value === 'administrative'}
        onClick={() => onChange('administrative')}
      >
        Administratif
      </button>
    </div>
  )
}
