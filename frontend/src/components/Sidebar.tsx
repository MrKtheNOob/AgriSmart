import { Cpu } from "lucide-react";
import RecommendedCrops from "./RecommendedCrops";
import SoilAnalysis from "./SoilAnalysis";

interface Crop {
  name: string;
  reason: string;
  revenue_per_ha: number;
  profitability_index: number;
}

interface RecommendationResponse {
  coordinates: {
    lat: number;
    lng: number;
  };
  soil: {
    target_depth: string;
    classification: string;
    properties: Record<string, string>;
  };
  climate: {
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
  };
  water_insight?: {
    awc_value: number;
    retention_score: number;
    category: string;
    insight: string;
  };
  recommendation: {
    recommended_crops: Crop[];
  };
}

interface SidebarProps {
  loading: boolean;
  error: string | null;
  recommendation: RecommendationResponse | null;
  markerPosition: [number, number] | null;
  locationName: string | null;
  status: string | null;
  onClear: () => void;
  fetchAnalysis: () => void;
}

// components/SkeletonSidebar.tsx
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
// components/EmptyState.tsx
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
        Cliquez sur une zone du Maroc pour lancer une
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
// components/ErrorMessage.tsx
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
}: SidebarProps) {
  if (loading) {
    return (
      <div className="relative h-full overflow-hidden">
        <SkeletonSidebar />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] z-10">
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
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
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

  const crops = recommendation.recommendation?.recommended_crops || [];
  const soil = recommendation.soil;
  const climate = recommendation.climate;

  const calculateAverages = (
    annualStats: RecommendationResponse["climate"]["annual_stats"],
  ) => {
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

  // Helper to find soil property by partial key match (e.g. "pH" vs "Soil pH")
  // const getSoilProp = (keyPart: string) => {
  //   if (!soil?.properties) return "N/A";
  //   const foundKey = Object.keys(soil.properties).find((k) =>
  //     k.toLowerCase().includes(keyPart.toLowerCase()),
  //   );
  //   return foundKey ? soil.properties[foundKey] : "N/A";
  // };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4">
      <header className="border-b border-slate-100 pb-6 text-left pl-5">
        <h2 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">
          AgriSmart Engine
        </h2>
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
          Analyse du Site Agricole
        </h1>
        <p className="text-sm text-slate-500 mt-2">📍{locationName}</p>
      </header>

      {/* Recommended Crops */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <RecommendedCrops crops={crops} />
      </div>
      {/* Soil Analysis - Crucial for Investors */}
      <SoilAnalysis soil={soil} waterInsight={recommendation.water_insight} />

      {/* Climate Risk - Crucial for Farmers */}
      <section className="bg-orange-50 p-6 rounded-3xl border border-orange-100 animate-in fade-in slide-in-from-bottom-4">
        <h3 className="text-orange-800 font-bold mb-4 flex items-center gap-2">
          🌦️ Climat & Risques ({climate?.region || "Zone locale"})
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
              Jours de forte chaleur
            </span>
            <span className="font-bold text-orange-900">
              {climate?.heat_days || 0}j/an
            </span>
          </div>
          <div className="w-full bg-orange-200/50 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full"
              style={{ width: `${((climate?.heat_days || 0) / 365) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-sm mt-4">
            <span className="text-blue-700 font-medium">Jours de gel</span>
            <span className="font-bold text-blue-900">
              {climate?.frost_days || 0}j/an
            </span>
          </div>
          <div className="w-full bg-blue-200/50 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${((climate?.frost_days || 0) / 365) * 100}%` }}
            ></div>
          </div>
        </div>
      </section>

      <button
        onClick={onClear}
        className="w-full py-4 text-slate-400 text-sm font-medium hover:text-red-500 transition-colors"
      >
        Réinitialiser l'analyse
      </button>
    </div>
  );
}
