import { BASE_URL } from '../utils';

export interface Farm {
  id: number;
  name: string;
  region: string | null;
  commune: string | null;
  latitude: number;
  longitude: number;
  area_ha: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmCreatePayload {
  name: string;
  region?: string | null;
  commune?: string | null;
  latitude: number;
  longitude: number;
  area_ha?: number | null;
  notes?: string | null;
}

export interface AnalysisReportCreatePayload {
  farm_id: number;
  title?: string | null;
  sector_name?: string | null;
  latitude: number;
  longitude: number;
  analysis_payload: Record<string, unknown>;
}

export interface AnalysisReport {
  id: number;
  farm_id: number;
  title: string | null;
  sector_name: string | null;
  latitude: number;
  longitude: number;
  analysis_payload: Record<string, unknown>;
  created_at: string;
}

const API_BASE = BASE_URL || '';

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function listFarms(): Promise<Farm[]> {
  return requestJson<Farm[]>('/management/farms');
}

export async function createFarm(
  payload: FarmCreatePayload,
): Promise<Farm> {
  return requestJson<Farm>('/management/farms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAnalysisReport(
  payload: AnalysisReportCreatePayload,
): Promise<{ id: number }> {
  return requestJson<{ id: number }>('/management/analysis-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getFarm(farmId: number): Promise<Farm> {
  return requestJson<Farm>(`/management/farms/${farmId}`);
}

export async function listFarmReports(farmId: number): Promise<AnalysisReport[]> {
  return requestJson<AnalysisReport[]>(
    `/management/farms/${farmId}/analysis-reports`,
  );
}

export async function listAnalysisReports(): Promise<AnalysisReport[]> {
  return requestJson<AnalysisReport[]>('/management/analysis-reports');
}
