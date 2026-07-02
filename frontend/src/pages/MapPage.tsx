import { useEffect, useState } from "react";
import SenegalMap from "../components/Map";
import Sidebar from "../components/Sidebar";
import BottomSheet from "../components/BottomSheet";
import { BASE_URL } from "../utils";
import { useMapLogic } from "../hooks/useMapLogic";

export default function MapPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    markerPosition,
    locationName,
    recommendation,
    loading,
    error,
    status,
    handleMapClick,
    triggerAnalysis,
    clearRecommendation,
  } = useMapLogic();

  useEffect(() => {
    fetch(BASE_URL + "/health")
      .then((res) => res.json())
      .then((data) => console.log("API Health:", data))
      .catch((err) => console.error("API Health Check Failed:", err));
  }, []);

  useEffect(() => {
    if (markerPosition || recommendation || loading) {
      setIsDrawerOpen(true);
    }
  }, [markerPosition, recommendation, loading]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    clearRecommendation();
  };

  return (
    <div className="flex flex-col h-full md:flex-row">
      <div className="grow md:w-7/12 lg:w-3/4 h-[50vh] md:h-full relative border-r border-slate-200">
        <SenegalMap onMapClick={handleMapClick} markerPosition={markerPosition} />
      </div>

      <aside className="hidden md:block md:w-5/12 lg:w-1/4 bg-white shadow-xl z-10 overflow-y-auto">
        <Sidebar
          loading={loading}
          error={error}
          recommendation={recommendation}
          markerPosition={markerPosition}
          locationName={locationName}
          status={status}
          onClear={clearRecommendation}
          fetchAnalysis={triggerAnalysis}
        />
      </aside>

      <BottomSheet isOpen={isDrawerOpen} onClose={handleCloseDrawer}>
        <div className="relative min-h-75">
          <Sidebar
            loading={loading}
            error={error}
            recommendation={recommendation}
            markerPosition={markerPosition}
            locationName={locationName}
            status={status}
            onClear={handleCloseDrawer}
            fetchAnalysis={triggerAnalysis}
          />
        </div>
      </BottomSheet>
    </div>
  );
}
