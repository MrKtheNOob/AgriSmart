import React from 'react';

interface Recommendation {
  recommended_crop: string;
  confidence: number;
  why: string;
  alternatives: string[];
}

interface SidebarProps {
  loading: boolean;
  error: string | null;
  recommendation: Recommendation | null;
  onClear: () => void;
}

// components/SkeletonSidebar.tsx
const SkeletonSidebar = () => {
  return (
    <div className="space-y-8 animate-pulse p-2">
      {/* Header Skeleton */}
      <div className="border-b border-slate-100 pb-6">
        <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
        <div className="h-10 w-48 bg-slate-300 rounded-lg mb-4"></div>
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-green-100 rounded"></div>
          <div className="h-4 w-32 bg-slate-100 rounded mt-1"></div>
        </div>
      </div>

      {/* "Why" Section Skeleton */}
      <section>
        <div className="h-5 w-40 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded"></div>
          <div className="h-4 w-full bg-slate-100 rounded"></div>
          <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
        </div>
      </section>

      {/* "Virtual Sensor" Section Skeleton */}
      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <div className="h-5 w-48 bg-slate-200 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-3 w-32 bg-slate-200 rounded"></div>
            <div className="h-3 w-8 bg-slate-200 rounded"></div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3"></div>
          <div className="h-3 w-full bg-slate-100 rounded mt-4"></div>
          <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
        </div>
      </section>

      {/* Button Skeleton */}
      <div className="h-10 w-full bg-slate-100 rounded-xl mt-8"></div>
    </div>
  );
};
// components/EmptyState.tsx
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative mb-6">
        {/* Un cercle décoratif pour l'icône */}
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-pulse opacity-50"></div>
        <div className="relative bg-white p-5 rounded-full shadow-sm border border-green-100">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">Prêt pour l'analyse ?</h3>
      <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">
        Sélectionnez une parcelle sur la carte du Maroc pour obtenir des <span className="text-green-600 font-semibold">recommandations IA</span> basées sur le sol et le climat local.
      </p>
      
      <div className="mt-8 flex gap-2 items-center text-xs text-slate-400 font-medium uppercase tracking-widest">
        <span className="w-8 h-[1px] bg-slate-200"></span>
        <span>AgriSmart Engine</span>
        <span className="w-8 h-[1px] bg-slate-200"></span>
      </div>
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
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-bold text-red-800 mb-2">Analyse impossible</h3>
      <p className="text-red-600 text-sm mb-6 leading-relaxed">
        {message || "Nous n'avons pas pu récupérer les données agronomiques pour cette zone. Veuillez vérifier votre connexion."}
      </p>
      
      <button 
        onClick={onRetry}
        className="w-full py-3 bg-white border border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors shadow-sm"
      >
        Réessayer l'analyse
      </button>
    </div>
  );
};

export default function Sidebar({ loading, error, recommendation, onClear }:SidebarProps){
  if (loading) return <SkeletonSidebar />; // Un petit placeholder qui brille
  if (error) return <ErrorMessage message={error} onRetry={()=>{}} />;
  if (!recommendation) return <EmptyState />;

  return (
    <div className="space-y-6">
      <header className="border-b pb-4">
        <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider">Expert Insight</h2>
        <h1 className="text-3xl font-extrabold text-slate-900">{recommendation.recommended_crop}</h1>
        <div className="flex items-center mt-2 gap-2">
          <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
            {recommendation.confidence * 100}% Match
          </div>
          <span className="text-slate-400 text-xs italic">Basé sur données INRA</span>
        </div>
      </header>

      {/* C'est ici que tu mets la vision "Insight" */}
      <section>
        <h3 className="text-slate-800 font-bold mb-3 flex items-center gap-2">
           📖 Pourquoi ce choix ?
        </h3>
        <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
          {recommendation.why}
        </p>
      </section>

      {/* LA FEATURE "PRÉSENT" : Le Capteur Virtuel */}
      <section className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
        <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2">
          💧 Pilotage Temps Réel (Virtual Sensor)
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-bold text-blue-600 uppercase">
            <span>Humidité estimée (Hamri)</span>
            <span>65%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <p className="text-xs text-blue-700 leading-tight italic">
            "Le sol Hamri retient bien l'eau de la pluie d'hier. Aucun arrosage nécessaire pour les prochaines 48h."
          </p>
        </div>
      </section>

      <button onClick={onClear} className="w-full py-3 text-slate-400 text-sm hover:text-red-500 transition-colors">
        Réinitialiser l'analyse
      </button>
    </div>
  );
};