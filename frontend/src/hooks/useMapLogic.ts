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
  status: string | null;
  handleMapClick: (lat: number, lng: number, name?: string) => void;
  triggerAnalysis: () => Promise<void>;
  clearRecommendation: () => void;
}


export function useMapLogic(): MapLogic {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const clearRecommendation = useCallback(() => {
    setRecommendation(null);
    setError(null);
    setMarkerPosition(null);
    setLocationName(null);
    setStatus(null);
  }, []);
  
  const handleMapClick = useCallback((lat: number, lng: number, name?: string) => {
    setMarkerPosition([lat, lng]);
    setLocationName(name || null);
    console.log(locationName)
    setError(null);
    setRecommendation(null); // Clear previous recommendation
    setStatus(null);
  }, []);

  const triggerAnalysis = useCallback(async () => {
    if (!markerPosition) return;

    setLoading(true);
    setError(null);
    setStatus("Initialisation...");

    const [lat, lng] = markerPosition;
    const url = `${BASE_URL}/analyze-stream?lat=${lat}&lng=${lng}`;
    
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "status") {
          setStatus(data.message);
        } else if (data.type === "result") {
          setRecommendation(data.data);
          setLoading(false);
          eventSource.close();
        } else if (data.type === "error") {
          setError(data.message);
          setLoading(false);
          eventSource.close();
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setError("Erreur de connexion au serveur");
      setLoading(false);
      eventSource.close();
    };

  }, [markerPosition]);

  return {
    markerPosition,
    locationName,
    recommendation,
    loading,
    error,
    status,
    handleMapClick,
    triggerAnalysis,
    clearRecommendation,
  };
};