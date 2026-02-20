import { useState, useCallback } from 'react';

interface RecommendationResponse {
  recommended_crop: string;
  confidence: number;
  why: string;
  alternatives: string[];
}

interface MapLogic {
  markerPosition: [number, number] | null;
  locationName: string | null;
  recommendation: RecommendationResponse | null;
  loading: boolean;
  error: string | null;
  handleMapClick: (lat: number, lng: number, name?: string) => void;
  triggerAnalysis: () => Promise<void>;
  clearRecommendation: () => void;
}
async function fetchRecommendation(lat: number, lng: number): Promise<RecommendationResponse> {
  // Mocked API call
  console.log('Fetching recommendation for:', { lat, lng });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        recommended_crop: 'Wheat',
        confidence: 0.85,
        why: 'The soil composition and climate are ideal for wheat cultivation.',
        alternatives: ['Barley', 'Oats'],
      });
    }, 2000);
  });
}

export function useMapLogic(): MapLogic {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearRecommendation = useCallback(() => {
    setRecommendation(null);
    setError(null);
    setMarkerPosition(null);
    setLocationName(null);
  }, []);
  
  const handleMapClick = useCallback((lat: number, lng: number, name?: string) => {
    setMarkerPosition([lat, lng]);
    setLocationName(name || null);
    setError(null);
    setRecommendation(null); // Clear previous recommendation
  }, []);

  const triggerAnalysis = useCallback(async () => {
    if (!markerPosition) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchRecommendation(markerPosition[0], markerPosition[1]);
      setRecommendation(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [markerPosition]);

  return {
    markerPosition,
    locationName,
    recommendation,
    loading,
    error,
    
    handleMapClick,
    triggerAnalysis,
    clearRecommendation,
  };
};