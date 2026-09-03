export type MapMode = 'agroecological' | 'administrative'

export default function MapModeToggle({
  value,
  onChange,
}: {
  value: MapMode
  onChange: (mode: MapMode) => void
}) {
  return (
    <div className="map-mode-toggle" role="group" aria-label="Mode cartographique">
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
