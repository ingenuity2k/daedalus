/**
 * Spansh API adapter — fetches system data for Orrery rendering.
 * Uses a CORS proxy since Spansh doesn't send Access-Control-Allow-Origin headers.
 *
 * Endpoints used:
 * - /systems/field_values/name?q=... → typeahead search
 * - /dump/{id64} → full system dump with all bodies
 */

// In dev, Vite proxies /api/spansh → spansh-proxy.iotguru.dev (avoids CORS).
// In production, point directly at the proxy (it allowlists the deployed origin).
const SPANSH_PROXY = import.meta.env.DEV
  ? "/api/spansh"
  : "https://spansh-proxy.iotguru.dev";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SPANSH_PROXY}${path}`);
  if (!res.ok) throw new Error(`Spansh request failed (${res.status})`);
  return (await res.json()) as T;
}

// ── Types ──────────────────────────────────────────────────────

export interface SpanshSystemHit {
  id64: number;
  name: string;
}

export interface SpanshRing {
  name: string;
  type: string;
  mass: number;
}

export interface SpanshBody {
  bodyId: number;
  id64: number;
  name: string;
  type: "Star" | "Planet" | "Barycentre" | string;
  mainStar?: boolean;
  subType?: string;
  distanceToArrival?: number;
  parents?: Record<string, number>[];
  isLandable?: boolean;
  gravity?: number;
  surfaceTemperature?: number;
  radius?: number;
  atmosphereType?: string | null;
  rotationalPeriodTidallyLocked?: boolean;
  terraformingState?: string;
  volcanismType?: string | null;
  reserveLevel?: string;
  rings?: SpanshRing[];
  belts?: SpanshRing[];
  signals?: { signals: Record<string, number> };
  semiMajorAxis?: number;
  orbitalPeriod?: number;
  orbitalEccentricity?: number;
  orbitalInclination?: number;
  argOfPeriapsis?: number;
  isScoopable?: boolean;
  luminosity?: string;
}

export interface SpanshSystemDump {
  name: string;
  id64: number;
  bodies: SpanshBody[];
}

// ── API ────────────────────────────────────────────────────────

/** Search system names for typeahead. Returns empty array on no match. */
export async function searchSystems(query: string): Promise<SpanshSystemHit[]> {
  if (!query.trim()) return [];
  try {
    const data = await getJson<{ min_max: SpanshSystemHit[] }>(
      `/systems/field_values/name?q=${encodeURIComponent(query)}`
    );
    return data.min_max ?? [];
  } catch {
    return [];
  }
}

/** Fetch full system dump by id64. */
export async function fetchSystem(id64: number): Promise<SpanshSystemDump> {
  const data = await getJson<{ system: SpanshSystemDump }>(`/dump/${id64}`);
  return data.system;
}

/** Check proxy health. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${SPANSH_PROXY}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}