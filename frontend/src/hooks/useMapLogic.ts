import { useState, useCallback } from 'react';

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
  // Mocked API call with the provided backend structure
  console.log('Fetching recommendation for:', { lat, lng });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        "coordinates": { "lat": lat, "lng": lng },
        "soil": {
          "target_depth": "0-20 centimeters",
          "classification": "Hamri (Balanced)",
          "properties": {
            "Aluminium, extractable": "29.0 ppm",
            "pH": "7.0 None",
            "Nitrogen, total": "1.1 g/kg",
            "Phosphorus, extractable": "4.0 ppm",
            "Potassium, extractable": "65.7 ppm",
            "Magnesium, extractable": "220.4 ppm",
            "Calcium, extractable": "1211.0 ppm",
            "Iron, extractable": "26.1 ppm",
            "Zinc, extractable": "1.2 ppm",
            "Sulphur, extractable": "12.5 ppm",
            "Carbon, total": "10.0 g/kg",
            "Carbon, organic": "7.2 g/kg",
            "Bulk density, <2mm fraction": "1.4 g/cm³",
            "Stone content": "2.3 %",
            "Silt content": "22 %",
            "Clay content": "25 %",
            "Sand content": "51 %",
            "USDA Texture Class": "Sandy Clay Loam None",
            "Effective Cation Exchange Capacity": "11.2 cmol(+)/kg"
          }
        },
        "climate": {
          "region": "Ouarzazate",
          "annual_stats": {
            "2025": {
              "temperature_2m": 19.68,
              "precipitation": 107.0,
              "snowfall": 1.47,
              "apparent_temperature": 16.69
            }
          },
          "heat_days": 314,
          "frost_days": 53
        },
        "recommendation": {
          "recommended_crops": [
            {
              "name": "Olives",
              "reason": "Olives thrive in soil with a pH of around 7.0, making this Hamri soil suitable. The average annual temperature is approximately 20.1°C, which is optimal for olive growth."
            },
            {
              "name": "Almonds",
              "reason": "Almonds prefer sandy loam soils with a good drainage capacity, which aligns with the sandy clay loam texture."
            }
          ]
        }
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