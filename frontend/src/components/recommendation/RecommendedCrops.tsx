import type { Crop } from "./types";

interface RecommendedCropsProps {
  crops: Crop[];
}

export default function RecommendedCrops({ crops }: RecommendedCropsProps) {
  return (
    <div className="space-y-5">
      {crops.length > 0 ? (
        crops.map((crop, idx) => (
          <div
            key={`${crop.name}-${idx}`}
            className={`p-6 rounded-none border border-t-2 transition-colors ${
              idx === 0
                ? "bg-green-50 border-green-200 border-t-olive"
                : "bg-white border-slate-200 hover:border-green-200"
            }`}
          >
            <div className="flex justify-between items-start gap-4 mb-3">
              <h3
                className={`font-serif font-normal text-[23px] tracking-[-.6px] ${
                  idx === 0 ? "text-green-800" : "text-slate-800"
                }`}
              >
                <span className="mb-2.5 block font-sans text-[11px] tracking-[1px] text-muted">0{idx + 1} / </span>
                {crop.name}
              </h3>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {idx === 0 && (
                  <span className="px-3 py-1 bg-green-200 text-green-800 text-[10px] font-semibold tabular-nums uppercase rounded-[2px]">
                    En tête du classement
                  </span>
                )}
                <span className="text-2xl font-semibold tabular-nums text-green-700">
                  {crop.overall_score.toFixed(1)}%
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              {crop.reason}
            </p>

            <div className="grid grid-cols-2 gap-3 border-t border-green-100 pt-4">
              <div className="rounded-[2px] bg-white/80 px-4 py-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Sol
                </span>
                <span className="text-base font-semibold tabular-nums text-slate-800">
                  {crop.soil_score.toFixed(1)}%
                </span>
              </div>
              <div className="rounded-[2px] bg-white/80 px-4 py-3 text-right">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Climat
                </span>
                <span className="text-base font-semibold tabular-nums text-slate-800">
                  {crop.climate_score.toFixed(1)}%
                </span>
              </div>
            </div>

            {(crop.revenue_per_ha || crop.profitability_index) && (
              <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-green-100">
                {crop.revenue_per_ha ? (
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      Revenue / Ha
                    </span>
                    <p className="text-lg font-semibold tabular-nums text-slate-800">
                      ~ ${(crop.revenue_per_ha / 10).toLocaleString()} USD
                    </p>
                  </div>
                ) : null}

                {crop.profitability_index ? (
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      Profit Index
                    </span>
                    <p className="text-lg font-semibold tabular-nums text-green-600">
                      {(crop.profitability_index * 100).toFixed(1)}%
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="p-6 text-center bg-orange-50 rounded-[2px] border border-orange-200">
          <p className="text-orange-800 font-semibold text-sm mb-2">
            Aucune culture recommandée
          </p>
          <p className="text-xs text-orange-700 leading-relaxed">
            Conditions climatiques extrêmes ou précipitations insuffisantes.
            Une exploitation nécessiterait une infrastructure d&apos;irrigation
            robuste.
          </p>
        </div>
      )}
    </div>
  );
}
