import { BASE_URL } from "../utils";

const SESSION_KEY = "agrismart_session_id";
const VISIT_SENT_KEY = "agrismart_visit_sent";

const API_BASE = BASE_URL || "";

function generateSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getTelemetrySessionId() {
  if (typeof window === "undefined") return generateSessionId();

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const sessionId = generateSessionId();
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function hasSentTelemetryVisit(sessionId: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(VISIT_SENT_KEY) === sessionId;
}

export function markTelemetryVisitSent(sessionId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VISIT_SENT_KEY, sessionId);
}

export async function sendTelemetryVisit(sessionId: string) {
  if (!sessionId || hasSentTelemetryVisit(sessionId)) return;

  const response = await fetch(`${API_BASE}/telemetry/visit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Telemetry visit failed with status ${response.status}`);
  }

  markTelemetryVisitSent(sessionId);
}

export async function sendTelemetryDownload(
  sessionId: string,
  payload: {
    lat?: number;
    lng?: number;
    data?: Record<string, unknown>;
  } = {},
) {
  if (!sessionId) return;

  const response = await fetch(`${API_BASE}/telemetry/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      lat: payload.lat,
      lng: payload.lng,
      data: payload.data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telemetry download failed with status ${response.status}`);
  }
}
