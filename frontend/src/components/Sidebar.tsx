import type { RefObject } from "react";
import { Cpu, Download } from "lucide-react";
import RecommendedCrops from "./recommendation/RecommendedCrops";
import SoilAnalysis from "./recommendation/SoilAnalysis";
import ClimateSection from "./recommendation/ClimateSection";
import type { RecommendationResponse } from "./recommendation/types";

interface SidebarProps {
  loading: boolean;
  error: string | null;
  recommendation: RecommendationResponse | null;
  markerPosition: [number, number] | null;
  locationName: string | null;
  status: string | null;
  onClear: () => void;
  fetchAnalysis: () => void;
  onDownloadPdf?: () => void;
  variant?: "sidebar" | "pdf";
  containerRef?: RefObject<HTMLDivElement | null>;
}

const SkeletonSidebar = () => {
  return (
    <div className="space-y-8 animate-pulse p-2">
      <div className="border-b border-slate-100 pb-6">
        <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
        <div className="h-10 w-48 bg-slate-300 rounded-lg mb-4"></div>
      </div>
      <section className="space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded"></div>
        <div className="h-24 w-full bg-slate-100 rounded-xl"></div>
      </section>
      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-slate-200 rounded"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
        </div>
      </section>
    </div>
  );
};
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-pulse opacity-40"></div>
        <div className="relative bg-white p-5 rounded-full shadow-sm border border-green-100">
          <svg
            className="w-10 h-10 text-green-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-3">
        Analyse de parcelle
      </h3>

      <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
        Cliquez sur une zone du Senegal pour lancer une
        <span className="text-green-700 font-semibold">
          {" "}
          analyse environnementale{" "}
        </span>
        basée sur les données de sol et les tendances climatiques locales.
      </p>

      <p className="text-[11px] text-slate-400 mt-6 uppercase tracking-wide">
        Sol • Climat • Risque • Culture optimale
      </p>
    </div>
  );
};
interface ErrorProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage = ({ message, onRetry }: ErrorProps) => {
  return (
    <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-red-800 mb-2">
        Analyse impossible
      </h3>
      <p className="text-red-600 text-sm mb-6 leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="w-full py-3 bg-white border border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors shadow-sm"
      >
        Réessayer l'analyse
      </button>
    </div>
  );
};

export default function Sidebar({
  loading,
  error,
  recommendation,
  markerPosition,
  locationName,
  status,
  onClear,
  fetchAnalysis,
  onDownloadPdf,
  variant = "sidebar",
  containerRef,
}: SidebarProps) {
  const isPdfVariant = variant === "pdf";
  const rootClassName =
    variant === "pdf"
      ? "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 bg-white"
      : "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4";

  if (loading) {
    return (
      <div ref={containerRef} className="relative h-full overflow-hidden">
        <SkeletonSidebar />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] ">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4 max-w-[80%] text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span
              key={status}
              className="font-bold text-slate-700 text-lg animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
            >
              {status || "Analyse en cours..."}
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} onRetry={fetchAnalysis} />;

  if (markerPosition && !recommendation) {
    return (
      <div ref={containerRef} className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="relative mb-6">
          <div className="relative bg-white p-5 rounded-full shadow-sm border border-green-100">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {locationName || "Zone Sélectionnée"}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-60">
          📍 Selected Site <br />
          <span className="text-slate-900">
            Latitude: {markerPosition[0].toFixed(4)}
            <br /> Longitude: {markerPosition[1].toFixed(4)}
          </span>
        </p>
        <button
          onClick={fetchAnalysis}
          className="flex gap-2 justify-center m-4 w-[85%] px-8 py-4 bg-green-600 text-white rounded-2xl shadow-md hover:bg-green-800 transition-colors font-semibold text-base"
        >
          <Cpu /> Lancer l'analyse
        </button>
        <button
          onClick={onClear}
          className="mt-4 w-full py-3 text-slate-400 text-sm hover:text-red-500 transition-colors"
        >
          Annuler la sélection
        </button>
      </div>
    );
  }

  if (!recommendation) return <EmptyState />;

  return (
    <div ref={containerRef} className={rootClassName}>
      <header className="border-b border-slate-100 pb-6 text-left pl-5">
        <h2 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">
          AgriSmart Engine
        </h2>
        <div className="flex items-start justify-between gap-4">
          <h1
            className={`font-extrabold text-slate-900 leading-tight ${
              isPdfVariant ? "text-2xl" : "text-3xl"
            }`}
          >
          Analyse du Site Agricole
          </h1>
          {!isPdfVariant && onDownloadPdf ? (
            <button
              onClick={onDownloadPdf}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download size={14} />
              PDF
            </button>
          ) : null}
        </div>
        <p className="text-sm text-slate-500 mt-2">📍{locationName}</p>
      </header>

      {/* Recommended Crops */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <RecommendedCrops
          crops={recommendation.recommendation?.recommended_crops || []}
        />
      </div>
      {/* Soil Analysis - Crucial for Investors */}
      <SoilAnalysis
        soil={recommendation.soil}
        waterInsight={recommendation.water_insight}
      />

      {/* Climate Risk - Crucial for Farmers */}
      <ClimateSection climate={recommendation.climate} />

      {!isPdfVariant ? (
        <button
          onClick={onClear}
          className="w-full py-4 text-slate-400 text-sm font-medium hover:text-red-500 transition-colors"
        >
          Réinitialiser l'analyse
        </button>
      ) : null}
    </div>
  );
}
