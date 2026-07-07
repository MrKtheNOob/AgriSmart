import type { Climate } from "./types";

interface ClimateSectionProps {
  climate: Climate;
}

export default function ClimateSection({ climate }: ClimateSectionProps) {
  const calculateAverages = (annualStats: Climate["annual_stats"]) => {
    const years = Object.values(annualStats || {});
    if (years.length === 0) {
      return { avgTemp: 0, avgRainfall: 0 };
    }
    const totalTemp = years.reduce((sum, year) => sum + year.temperature_2m, 0);
    const totalRainfall = years.reduce(
      (sum, year) => sum + year.precipitation,
      0,
    );
    return {
      avgTemp: totalTemp / years.length,
      avgRainfall: totalRainfall / years.length,
    };
  };

  const { avgTemp, avgRainfall } = calculateAverages(climate.annual_stats);

  return (
    <section className="bg-orange-50 p-6 rounded-3xl border border-orange-100 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-orange-800 font-bold mb-4 flex items-center gap-2">
        🌦️ Climat & Risques ( ~ {climate.region || "Zone locale"})
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
            Avg. Annual Rainfall
          </span>
          <span className="text-lg font-black text-slate-700">
            {avgRainfall.toFixed(1)} mm
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
            Avg. Annual Temp
          </span>
          <span className="text-lg font-black text-slate-700">
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
            {climate.heat_days || 0}j/an
          </span>
        </div>
        <div className="w-full bg-orange-200/50 rounded-full h-1.5">
          <div
            className="bg-orange-500 h-1.5 rounded-full"
            style={{ width: `${((climate.heat_days || 0) / 365) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-sm mt-4">
          <span className="text-blue-700 font-medium">Jours de pluie / an</span>
          <span className="font-bold text-blue-900">
            {climate.rainy_days || 0}j/an
          </span>
        </div>
        <div className="w-full bg-blue-200/50 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full"
            style={{ width: `${((climate.rainy_days || 0) / 365) * 100}%` }}
          ></div>
        </div>
      </div>
    </section>
  );
}
