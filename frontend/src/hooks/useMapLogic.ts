import { useState, useCallback } from 'react';
import { BASE_URL } from '../utils';
import { getTelemetrySessionId } from '../services/telemetry';

interface Crop {
  name: string;
  reason: string;
  revenue_per_ha: number;
  profitability_index: number;
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
    latitude: number;
    longitude: number;
    data_period: {
      start: string;
      end: string;
    };
    summary: {
      temperature_mean_c: number;
      annual_precipitation_mean_mm: number;
      heat_days_mean: number;
      rainy_days_mean: number;
    };
    monthly_climate: Array<{
      month: number;
      temperature_mean_c: number;
      temperature_min_c: number;
      temperature_max_c: number;
      relative_humidity_mean_pct: number;
      apparent_temperature_mean_c: number;
      precipitation_mean_mm: number;
      vapor_pressure_deficit_mean_kpa: number;
      heat_days_mean: number;
      rainy_days_mean: number;
      years_observed: number;
    }>;
  };
  water_insight?: {
    awc_value: number;
    retention_score: number;
    category: string;
    insight: string;
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
    const sessionId = getTelemetrySessionId();
    const url = `${BASE_URL}/analyze-stream?lat=${lat}&lng=${lng}&session_id=${encodeURIComponent(sessionId)}`;
    
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
