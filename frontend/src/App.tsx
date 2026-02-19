import { useState } from 'react';

import Sidebar from './components/Sidebar';
import { useMapLogic } from './hooks/useMapLogic';
import MoroccoMap from './components/Map';

function App() {
  const { markerPosition, recommendation, loading, error, handleMapClick, clearRecommendation } = useMapLogic();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleClearAndCloseDrawer = () => {
    clearRecommendation();
    setIsDrawerOpen(false); // Close drawer when clearing
  };

  return (
    <div className="flex flex-col h-screen md:flex-row font-sans">
      {/* Map Section */}
      <div className="grow md:w-7/10 h-1/2 md:h-full relative">
        <MoroccoMap onMapClick={handleMapClick} markerPosition={markerPosition} />

        {/* Mobile: Open Drawer Button */}
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={toggleDrawer}
            className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            {isDrawerOpen ? 'Close Results' : 'View Results'}
          </button>
        </div>
      </div>

      {/* Sidebar Section (Desktop) */}
      <div className="hidden md:block md:w-3/10 p-4 overflow-y-auto">
        <Sidebar
          loading={loading}
          error={error}
          recommendation={recommendation}
          onClear={handleClearAndCloseDrawer}
        />
      </div>

      {/* Bottom Drawer Section (Mobile) */}
      <div
        className={`fixed inset-x-0 bottom-0 w-full bg-white transition-transform duration-300 ease-in-out z-20 md:hidden
          ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'} h-2/3 max-h-[80vh] rounded-t-lg shadow-lg overflow-y-auto`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Crop Recommendation Results</h2>
            <button
              onClick={toggleDrawer}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <Sidebar
            loading={loading}
            error={error}
            recommendation={recommendation}
            onClear={handleClearAndCloseDrawer}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
