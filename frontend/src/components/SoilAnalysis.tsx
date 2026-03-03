
export interface Soil {
  target_depth: string;
  classification: string;
  properties: Record<string, string>;
}

export interface WaterInsight {
  awc_value: number;
  retention_score: number;
  category: string;
  insight: string;
}

interface SoilAnalysisProps {
  soil: Soil | null;
  waterInsight?: WaterInsight;
}

export default function SoilAnalysis({ soil, waterInsight }: SoilAnalysisProps) {
  const getSoilProp = (keyPart: string) => {
    if (!soil?.properties) return "N/A";
    const foundKey = Object.keys(soil.properties).find((k) =>
      k.toLowerCase().includes(keyPart.toLowerCase()),
    );
    return foundKey ? soil.properties[foundKey] : "N/A";
  };

  if (!soil) {
    return (
      <div className="text-center py-6">
        <p className="text-sm font-semibold text-slate-800 mb-2">
          Données pédologiques indisponibles
        </p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          Certaines zones hyper-arides peuvent être exclues en raison d’une
          fiabilité prédictive limitée.
        </p>
      </div>
    );
  }

  return (
    <>
     <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
    {soil ? (
      <>
        <h3 className="text-slate-900 font-bold mb-6">
          🌱 Profil du Sol ({soil.classification})
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              pH
            </span>
            <p className="text-2xl font-black text-slate-800">
              {getSoilProp("pH")}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Carbone Organique
            </span>
            <p className="text-2xl font-black text-slate-800">
              {getSoilProp("Carbon, organic")}
            </p>
          </div>
        </div>

        {/* Fertility */}
        <div className="mb-8">
          <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-4">
            Fertilité & Nutriments
          </h4>

          <div className="grid grid-cols-3 gap-4">
            {["Nitrogen", "Phosphorus", "Potassium"].map((key, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl border border-slate-200 text-center"
              >
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  {key}
                </span>
                <p className="text-lg font-black text-slate-800">
                  {getSoilProp(key)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Water Insight */}
        {waterInsight && (
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200">
            <h4 className="text-[11px] uppercase tracking-widest text-blue-700 font-black mb-4">
              Analyse Hydrique
            </h4>

            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold text-slate-700">
                Rétention d'eau
              </span>
              <span className="text-2xl font-black text-blue-700">
                {waterInsight.retention_score}%
              </span>
            </div>

            <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${waterInsight.retention_score}%`,
                }}
              />
            </div>

            <p className="text-xs text-blue-900 font-semibold mb-1">
              {waterInsight.category}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {waterInsight.insight}
            </p>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-6">
        <p className="text-slate-700 text-sm font-semibold mb-2">
          Données pédologiques indisponibles
        </p>
      </div>
    )}
  </section>
    </>
  );
}
