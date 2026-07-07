export interface Crop {
  name: string;
  reason: string;
  revenue_per_ha: number;
  profitability_index: number;
}

export interface Soil {
  target_depth: string;
  classification: string;
  properties: Record<string, string>;
}

export interface WaterInsight {
  awc_value: number;
  retention_score: number;
  category: string;
  insight: string;
}

export interface Climate {
  region: string;
  annual_stats: Record<
    string,
    {
      temperature_2m: number;
      precipitation: number;
      snowfall: number;
      apparent_temperature: number;
    }
  >;
  heat_days: number;
  rainy_days: number;
}

export interface RecommendationResponse {
  coordinates: {
    lat: number;
    lng: number;
  };
  soil: Soil;
  climate: Climate;
  water_insight?: WaterInsight;
  recommendation: {
    recommended_crops: Crop[];
  };
}
