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

const Sidebar: React.FC<SidebarProps> = ({ loading, error, recommendation, onClear }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Crop Recommendation</h2>

      <button
        onClick={onClear}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Clear Selection
      </button>

      {loading && (
        <div className="flex items-center justify-center p-4">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700">Loading recommendation...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {recommendation && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Recommended Crop:</h3>
            <p className="text-green-600 text-lg">{recommendation.recommended_crop}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Confidence:</h3>
            <p className="text-gray-600 text-lg">{(recommendation.confidence * 100).toFixed(2)}%</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Reasoning:</h3>
            <p className="text-gray-600">{recommendation.why}</p>
          </div>
          {recommendation.alternatives && recommendation.alternatives.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-700">Alternatives:</h3>
              <ul className="list-disc list-inside text-gray-600">
                {recommendation.alternatives.map((alt, index) => (
                  <li key={index}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!loading && !error && !recommendation && (
        <p className="text-gray-500 text-center mt-8">Click on the map to get a crop recommendation.</p>
      )}
    </div>
  );
};

export default Sidebar;
