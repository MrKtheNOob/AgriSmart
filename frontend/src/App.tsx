import { useState } from 'react';

import Sidebar from './components/Sidebar';
import { useMapLogic } from './hooks/useMapLogic';
import MoroccoMap from './components/Map';
import Navbar from './components/Navbar';

// App.tsx
export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // On passe un callback pour ouvrir le drawer dès que le résultat arrive
  const { markerPosition, recommendation, loading, error, handleMapClick, clearRecommendation } = useMapLogic();

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col h-full md:flex-row">
        {/* Map Section - Ajout d'un overlay de chargement sur la map */}
        <div className="grow md:w-7/12 lg:w-3/4 h-[50vh] md:h-full relative border-r border-slate-200">
          <MoroccoMap onMapClick={handleMapClick} markerPosition={markerPosition} />
          
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-1000 flex items-center justify-center">
              <div className="bg-white p-4 rounded-xl shadow-2xl flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                <span className="font-medium text-slate-700">Analyse du sol en cours...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Desktop */}
        <aside className="hidden md:block md:w-5/12 lg:w-1/4 bg-white shadow-xl z-10 overflow-y-auto">
          <Sidebar loading={loading} error={error} recommendation={recommendation} onClear={clearRecommendation} />
        </aside>

        {/* Bottom Sheet Mobile - Amélioration du design */}
        <div className={`fixed inset-x-0 bottom-0 bg-white transition-transform duration-500 z-2000 md:hidden
            ${isDrawerOpen || loading ? 'translate-y-0' : 'translate-y-full'} 
            h-[70vh] rounded-t-4xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col`}
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3" onClick={() => setIsDrawerOpen(false)} />
          <div className="flex-1 overflow-y-auto p-6 pt-2">
             <Sidebar loading={loading} error={error} recommendation={recommendation} onClear={clearRecommendation} />
          </div>
        </div>
      </div>
    </div>
  );
}