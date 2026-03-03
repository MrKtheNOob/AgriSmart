export interface Climate {
  region: string;
  annual_stats: Record<
    string,
    {
      temperature_2m: number;
      precipitation: number;
      snowfall: number;
      apparent_temperature: number;
    }
  >;
  heat_days: number;
  frost_days: number;
}

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
    <section className="bg-orange-50 p-6 rounded-3xl border border-orange-200">
      <h3 className="text-orange-900 font-bold mb-6">
        🌦️ Climat & Risques ({climate?.region || "Zone locale"})
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-orange-200">
          <span className="text-[10px] uppercase text-slate-400 font-bold">
            Précipitations
          </span>
          <p className="text-xl font-black text-slate-800">
            {avgRainfall.toFixed(1)} mm
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200">
          <span className="text-[10px] uppercase text-slate-400 font-bold">
            Température Moy.
          </span>
          <p className="text-xl font-black text-slate-800">
            {avgTemp.toFixed(1)}°C
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-orange-700 font-medium">
              Jours de forte chaleur
            </span>
            <span className="font-bold text-orange-900">
              {climate?.heat_days || 0} j/an
            </span>
          </div>
          <div className="w-full bg-orange-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full"
              style={{
                width: `${((climate?.heat_days || 0) / 365) * 100}%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-700 font-medium">Jours de gel</span>
            <span className="font-bold text-blue-900">
              {climate?.frost_days || 0} j/an
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${((climate?.frost_days || 0) / 365) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
