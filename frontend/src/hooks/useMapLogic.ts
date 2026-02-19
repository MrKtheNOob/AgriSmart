import { useState, useCallback } from 'react';

interface RecommendationResponse {
  recommended_crop: string;
  confidence: number;
  why: string;
  alternatives: string[];
}

interface MapLogic {
  markerPosition: [number, number] | null;
  recommendation: RecommendationResponse | null;
  loading: boolean;
  error: string | null;
  handleMapClick: (lat: number, lng: number) => void;
  clearRecommendation: () => void;
}
async function fetchRecommendation(lat: number, lng: number): Promise<RecommendationResponse> {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lat, lng }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const useMapLogic = (): MapLogic => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearRecommendation = useCallback(() => {
    setRecommendation(null);
    setError(null);
    setMarkerPosition(null);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    setLoading(true);
    setError(null);
    setRecommendation(null); // Clear previous recommendation

    try {
      // const response = await fetch('/api/recommend', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ lat, lng }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data: RecommendationResponse = await response.json();
      console.log('Fetching recommendation for:', { lat, lng });
      const data = await fetchRecommendation(lat, lng);
      console.log('Received recommendation:', data);
      
      setRecommendation(null);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markerPosition,
    recommendation,
    loading,
    error,
    handleMapClick,
    clearRecommendation,
  };
};