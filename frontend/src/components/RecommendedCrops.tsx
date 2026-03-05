
export interface Crop {
  name: string;
  reason: string;
  revenue_per_ha: number;
  profitability_index: number;
}

interface RecommendedCropsProps {
  crops: Crop[];
}

export default function RecommendedCrops({ crops }: RecommendedCropsProps) {
  return <>
  <div className="space-y-5">
    {crops.length > 0 ? (
      crops.map((crop, idx) => (
        <div
          key={`${crop.name}-${idx}`}
          className={`p-6 rounded-3xl border transition-all
          ${
            idx === 0
              ? "bg-green-50 border-green-200 ring-1 ring-green-300/40"
              : "bg-white border-slate-200 hover:border-green-200"
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <h3
              className={`font-bold text-xl ${
                idx === 0 ? "text-green-800" : "text-slate-800"
              }`}
            >
              {idx === 0 && "⭐ "}
              {crop.name}
            </h3>

            {idx === 0 && (
              <span className="px-3 py-1 bg-green-200 text-green-800 text-[10px] font-black uppercase rounded-full">
                Top Match
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            {crop.reason}
          </p>

          {(crop.revenue_per_ha || crop.profitability_index) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-100">
              {crop.revenue_per_ha && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    Revenue / Ha
                  </span>
                  <p className="text-lg font-black text-slate-800">
                    ~ ${(crop.revenue_per_ha / 10).toLocaleString()} USD
                  </p>
                </div>
              )}

              {crop.profitability_index && (
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    Profit Index
                  </span>
                  <p className="text-lg font-black text-green-600">
                    {(crop.profitability_index * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))
    ) : (
      <div className="p-6 text-center bg-orange-50 rounded-3xl border border-orange-200">
        <p className="text-orange-800 font-semibold text-sm mb-2">
          Aucune culture recommandée
        </p>
        <p className="text-xs text-orange-700 leading-relaxed">
          Conditions climatiques extrêmes ou précipitations insuffisantes.
          Une exploitation nécessiterait une infrastructure d’irrigation robuste.
        </p>
      </div>
    )}
  </div>
  </>
}



