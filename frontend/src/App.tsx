import Sidebar from './components/Sidebar';
import { useMapLogic } from './hooks/useMapLogic';
import MoroccoMap from './components/Map';
import Navbar from './components/Navbar';
import BottomSheet from './components/BottomSheet';
import { useEffect, useState } from 'react';

const LoadingOverlay = ({ status }: { status: string | null }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4 max-w-[80%] text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    <span 
      key={status} 
      className="font-bold text-slate-700 text-lg animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
    >
      {status || "Analyse en cours..."}
    </span>
  </div>
);

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { markerPosition, locationName, recommendation, loading, error, status, handleMapClick, triggerAnalysis, clearRecommendation } = useMapLogic();

  useEffect(() => {
    if (markerPosition || recommendation || loading) {
      setIsDrawerOpen(true);
    }
  }, [markerPosition, recommendation, loading]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    clearRecommendation();
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col h-full md:flex-row">
        {/* Map Section */}
        <div className="grow md:w-7/12 lg:w-3/4 h-[50vh] md:h-full relative border-r border-slate-200">
          <MoroccoMap onMapClick={handleMapClick} markerPosition={markerPosition} />

          {/* Desktop Loading Overlay (Hidden on Mobile via md:flex) */}
          {loading && (
            <div className="hidden md:flex absolute inset-0 bg-white/40 backdrop-blur-[2px] z-1000 items-center justify-center">
              <LoadingOverlay status={status} />
            </div>
          )}
        </div>

        {/* Sidebar Desktop */}
        <aside className="hidden md:block md:w-5/12 lg:w-1/4 bg-white shadow-xl z-10 overflow-y-auto">
          <Sidebar
            loading={loading}
            error={error}
            recommendation={recommendation}
            markerPosition={markerPosition}
            locationName={locationName}
            onClear={clearRecommendation}
            fetchAnalysis={triggerAnalysis}
          />
        </aside>

        {/* Bottom Sheet Mobile */}
        <BottomSheet isOpen={isDrawerOpen} onClose={handleCloseDrawer}>
          <div className="relative min-h-75">
            <Sidebar
              loading={loading}
              error={error}
              recommendation={recommendation}
              markerPosition={markerPosition}
              locationName={locationName}
              onClear={handleCloseDrawer}
              fetchAnalysis={triggerAnalysis}
            />
            {/* Mobile Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-t-4xl">
                <LoadingOverlay status={status} />
              </div>
            )}
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
