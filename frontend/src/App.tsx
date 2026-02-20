import Sidebar from './components/Sidebar';
import { useMapLogic } from './hooks/useMapLogic';
import MoroccoMap from './components/Map';
import Navbar from './components/Navbar';
import BottomSheet from './components/BottomSheet';
import { useEffect, useState } from 'react';

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { markerPosition, locationName, recommendation, loading, error, handleMapClick, triggerAnalysis, clearRecommendation } = useMapLogic();

  useEffect(() => {
    if (markerPosition || recommendation || loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
          <Sidebar
            loading={loading}
            error={error}
            recommendation={recommendation}
            markerPosition={markerPosition}
            locationName={locationName}
            onClear={handleCloseDrawer}
            fetchAnalysis={triggerAnalysis}
          />
        </BottomSheet>
      </div>
    </div>
  );
}
