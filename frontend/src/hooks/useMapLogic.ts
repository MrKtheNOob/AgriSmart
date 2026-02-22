import { useState, useCallback } from 'react';
import { BASE_URL } from '../utils';

interface Crop {
  name: string;
  reason: string;
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
    annual_stats: Record<string, {
      temperature_2m: number;
      precipitation: number;
      snowfall: number;
      apparent_temperature: number;
    }>;
    heat_days: number;
    frost_days: number;
  };
  recommendation: {
    recommended_crops: Crop[];
  };
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

  const response = await fetch(BASE_URL+'/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lat ,lng  }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed with status ${response.status}`);
  }

  return response.json();
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