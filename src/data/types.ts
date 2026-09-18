/** A celestial body in a system — star, planet, moon, barycentre, or station. */
export interface Body {
  id: number;
  name: string;
  type: "Star" | "Planet" | "Barycentre" | "Station" | string;
  subType?: string;
  /** Distance from arrival point in light-seconds. */
  distanceToArrival?: number;
  /** Parent chain — first entry is the direct parent. */
  parents?: Record<string, number>[];
  /** Orbital parameters */
  semiMajorAxis?: number;
  orbitalPeriod?: number;
  orbitalEccentricity?: number;
  orbitalInclination?: number;
  argOfPeriapsis?: number;
  /** Physical properties */
  radius?: number;
  gravity?: number;
  surfaceTemperature?: number;
  /** Rings / belts */
  rings?: Ring[];
  belts?: Ring[];
  /** Classification */
  isLandable?: boolean;
  terraformingState?: string;
  volcanismType?: string | null;
  atmosphereType?: string | null;
  reserveLevel?: string;
  /** Signals (colonization-relevant) */
  signals?: { signals: Record<string, number> };
  /** Star-specific */
  isMainStar?: boolean;
  isScoopable?: boolean;
  luminosity?: string;
  /** Build slots — derived from signals/game data */
  buildSlots?: BuildSlot[];
}

export interface Ring {
  name: string;
  type: string;
  mass: number;
}

export interface BuildSlot {
  id: string;
  type: "orbital" | "ground";
  /** What's been built here, if anything */
  facility?: string;
  tier?: number;
}

/** A system loaded from Spansh/EDSM. */
export interface SystemData {
  name: string;
  id64: number;
  bodies: Body[];
}

/** Positioned body for rendering — computed from orbital data. */
export interface PositionedBody extends Body {
  /** Render position (relative to system center) */
  x: number;
  y: number;
  /** Render radius in px (scaled from real radius) */
  renderRadius: number;
  /** Nesting depth (0 = star, 1 = planet, 2 = moon, etc.) */
  depth: number;
  /** Index among siblings at this depth (for orbital spacing) */
  siblingIndex: number;
  /** Total siblings at this depth under the same parent */
  siblingCount: number;
}