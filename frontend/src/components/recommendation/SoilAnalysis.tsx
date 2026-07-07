import type { Soil, WaterInsight } from "./types";

interface SoilAnalysisProps {
  soil: Soil | null;
  waterInsight?: WaterInsight;
}

export default function SoilAnalysis({ soil, waterInsight }: SoilAnalysisProps) {
  const getSoilProp = (keyParts: string | string[]) => {
    if (!soil?.properties) return "N/A";
    const parts = Array.isArray(keyParts) ? keyParts : [keyParts];
    const foundKey = Object.keys(soil.properties).find((k) =>
      parts.some((part) => k.toLowerCase().includes(part.toLowerCase())),
    );
    return foundKey ? soil.properties[foundKey] : "N/A";
  };

  if (!soil) {
    return (
      <div className="text-center py-6">
        <p className="text-sm font-semibold text-slate-800 mb-2">Données pédologiques indisponibles</p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          Certaines zones hyper-arides peuvent être exclues en raison d’une fiabilité prédictive limitée.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
        Profil du Sol ({soil.classification || "Zone Aride"})
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">pH du Sol</span>
          <span className="text-xl font-black text-slate-800">{getSoilProp("pH")}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Carbone Organique</span>
          <span className="text-xl font-black text-slate-800">{getSoilProp("Carbon, organic")}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2">
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Classe texturale (USDA)</span>
          <span className="text-base font-bold text-slate-800">{getSoilProp(["Classe texturale", "Texture Class"])}</span>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-4">Fertilité & Nutriments</h4>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Azote (N)</span>
            <span className="text-base font-black text-slate-800">{getSoilProp("Nitrogen")}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Phosphore (P)</span>
            <span className="text-base font-black text-slate-800">{getSoilProp("Phosphorus")}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Potassium (K)</span>
            <span className="text-base font-black text-slate-800">{getSoilProp("Potassium")}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
          <span className="text-sm font-medium text-slate-600">Capacité d&apos;Échange (CEC)</span>
          <span className="text-base font-black text-slate-800">{getSoilProp("Cation Exchange Capacity")}</span>
        </div>
      </div>

      {waterInsight ? (
        <div className="mb-8 bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50">
          <h4 className="text-[11px] uppercase tracking-widest text-blue-600 font-black mb-4">Analyse Hydrique</h4>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-slate-700">Rétention d&apos;eau</span>
            <span className="text-2xl font-black text-blue-700">{waterInsight.retention_score}%</span>
          </div>
          <div className="w-full bg-blue-200/30 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              style={{ width: `${waterInsight.retention_score}%` }}
            ></div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-blue-100">
            <p className="text-[10px] font-black uppercase text-blue-500 mb-1">{waterInsight.category}</p>
            <p className="text-xs text-slate-600 leading-relaxed italic">&quot;{waterInsight.insight}&quot;</p>
          </div>
        </div>
      ) : null}

      {(getSoilProp("Stone content") !== "N/A" || getSoilProp("Depth to bedrock") !== "N/A") && (
        <div>
          <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-4">Détails Techniques</h4>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            {getSoilProp("Depth to bedrock") !== "N/A" && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Profondeur de roche</span>
                <span className="font-bold text-slate-800">{getSoilProp("Depth to bedrock")}</span>
              </div>
            )}
            {getSoilProp("Stone content") !== "N/A" && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Contenu en pierres</span>
                <span className="font-bold text-slate-800">{getSoilProp("Stone content")}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
