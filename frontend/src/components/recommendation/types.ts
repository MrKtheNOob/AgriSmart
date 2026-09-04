export interface Crop {
  name: string;
  reason: string;
  soil_score: number;
  climate_score: number;
  overall_score: number;
  revenue_per_ha?: number;
  profitability_index?: number;
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

export interface CropRanking {
  crop_name: string;
  soil_score: number;
  climate_score: number;
  overall_score: number;
  planting_month: number;
  growing_months: number;
}

export interface Climate {
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
}

export interface RecommendationResponse {
  coordinates: {
    lat: number;
    lng: number;
  };
  soil: Soil;
  climate: Climate;
  water_insight?: WaterInsight;
  crop_rankings: CropRanking[] | null;
  recommendation: {
    recommended_crops: Crop[];
  };
}
