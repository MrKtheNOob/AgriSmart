import type { Climate } from "./types";

interface ClimateSectionProps {
  climate: Climate;
}

export default function ClimateSection({ climate }: ClimateSectionProps) {
  const {
    temperature_mean_c: avgTemp,
    annual_precipitation_mean_mm: avgRainfall,
    heat_days_mean: heatDays,
    rainy_days_mean: rainyDays,
  } = climate.summary;

  return (
    <section className="bg-orange-50 p-6 rounded-none border border-orange-100 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-orange-800 font-serif text-[23px] font-normal tracking-[-.6px] mb-4 flex items-center gap-2">
        Climat historique · {climate.region || "Zone locale"}
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-[2px] border border-slate-100 shadow-none">
          <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
            Pluie annuelle moyenne
          </span>
          <span className="text-lg font-semibold tabular-nums text-slate-700">
            {avgRainfall.toFixed(1)} mm
          </span>
        </div>
        <div className="bg-white p-3 rounded-[2px] border border-slate-100 shadow-none">
          <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
            Température moyenne
          </span>
          <span className="text-lg font-semibold tabular-nums text-slate-700">
            {avgTemp.toFixed(1)}°C
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-orange-700 font-medium">
            Jours de forte chaleur / an
          </span>
          <span className="font-bold text-orange-900">
            {heatDays || 0}j/an
          </span>
        </div>
        <div className="w-full bg-orange-200/50 rounded-[2px] h-1.5">
          <div
            className="bg-orange-500 h-1.5 rounded-[2px]"
            style={{ width: `${((heatDays || 0) / 365) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-sm mt-4">
          <span className="text-blue-700 font-medium">Jours de pluie / an</span>
          <span className="font-bold text-blue-900">
            {rainyDays || 0}j/an
          </span>
        </div>
        <div className="w-full bg-blue-200/50 rounded-[2px] h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-[2px]"
            style={{ width: `${((rainyDays || 0) / 365) * 100}%` }}
          ></div>
        </div>
      </div>
    </section>
  );
}
