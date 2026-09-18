/**
 * Color and rendering data for Elite Dangerous body types.
 * Based on in-game visuals and edassets.org iconography.
 */

export interface BodyVisualStyle {
  /** Primary fill color */
  fill: string;
  /** Secondary/accent color (for gradients, bands, etc.) */
  accent?: string;
  /** Glow color for stars */
  glow?: string;
  /** Glow radius in px */
  glowRadius?: number;
  /** Whether this body type has rings in the game */
  hasRings?: boolean;
  /** Opacity (0-1) — some bodies like barycentres are faint */
  opacity?: number;
}

// ── Stars ──────────────────────────────────────────────────────
// Spectral classes map to the in-game star colors.

const STAR_STYLES: Record<string, BodyVisualStyle> = {
  O: { fill: "#9bb0ff", glow: "#6b8bff", glowRadius: 40 },
  B: { fill: "#aabfff", glow: "#7b9fff", glowRadius: 35 },
  A: { fill: "#cad7ff", glow: "#a0b5ff", glowRadius: 30 },
  F: { fill: "#f8f7ff", glow: "#d0d0ff", glowRadius: 25 },
  G: { fill: "#fff4ea", glow: "#ffcc66", glowRadius: 22 },
  K: { fill: "#ffd2a1", glow: "#ff9933", glowRadius: 20 },
  M: { fill: "#ffcc6f", glow: "#ff6600", glowRadius: 18 },
  L: { fill: "#ff6600", glow: "#cc3300", glowRadius: 15 },
  T: { fill: "#993300", glow: "#662200", glowRadius: 12 },
  Y: { fill: "#661100", glow: "#440000", glowRadius: 10 },
  // Special star types
  "White Dwarf": { fill: "#ffffff", glow: "#aaccff", glowRadius: 16 },
  "Neutron Star": { fill: "#99ccff", glow: "#0066ff", glowRadius: 20 },
  "Black Hole": { fill: "#000000", glow: "#330066", glowRadius: 30 },
  "T Tauri Star": { fill: "#ff9966", glow: "#ff6633", glowRadius: 18 },
  "Herbig Ae/Be Star": { fill: "#ffccaa", glow: "#ff8844", glowRadius: 22 },
  Supergiant: { fill: "#ff6666", glow: "#ff0000", glowRadius: 35 },
};

// ── Planets ────────────────────────────────────────────────────

const PLANET_STYLES: Record<string, BodyVisualStyle> = {
  // Rocky
  "Rocky body": { fill: "#8b7355", accent: "#6b5335" },
  "Rocky Ice body": { fill: "#8899aa", accent: "#667788" },
  "High metal content body": { fill: "#778899", accent: "#556677" },
  "Metal-rich body": { fill: "#667788", accent: "#445566" },

  // Icy
  "Icy body": { fill: "#b0c4de", accent: "#8faabe" },

  // Gas giants
  "Gas giant with water-based life": { fill: "#4488aa", accent: "#2266aa", hasRings: true },
  "Gas giant with ammonia-based life": { fill: "#557766", accent: "#335544", hasRings: true },
  "Water giant": { fill: "#3366aa", accent: "#224488" },
  "Helium gas giant": { fill: "#ccbb99", accent: "#aa9977", hasRings: true },
  "Helium-rich gas giant": { fill: "#ddccaa", accent: "#bbaa88", hasRings: true },
  "Sudarsky class I gas giant": { fill: "#aa8866", accent: "#886644", hasRings: true },
  "Sudarsky class II gas giant": { fill: "#99aabb", accent: "#778899", hasRings: true },
  "Sudarsky class III gas giant": { fill: "#667788", accent: "#556677", hasRings: true },
  "Sudarsky class IV gas giant": { fill: "#554433", accent: "#443322", hasRings: true },
  "Sudarsky class V gas giant": { fill: "#443322", accent: "#332211", hasRings: true },

  // Terraformable / special
  "Earth-like body": { fill: "#4488cc", accent: "#22aa44" },
  "Water world": { fill: "#2266bb", accent: "#1155aa" },
  "Ammonia world": { fill: "#556644", accent: "#445533" },

  // Fallback
  Planet: { fill: "#888888", accent: "#666666" },
};

// ── Lookup ─────────────────────────────────────────────────────

/** Get the spectral class letter from a star subtype string. */
function extractSpectralClass(subType: string | undefined): string {
  if (!subType) return "G";
  // "G (Yellow-White) Star" → "G", "White Dwarf (DA) Star" → "White Dwarf"
  if (subType.includes("White Dwarf")) return "White Dwarf";
  if (subType.includes("Neutron")) return "Neutron Star";
  if (subType.includes("Black Hole")) return "Black Hole";
  if (subType.includes("T Tauri")) return "T Tauri Star";
  if (subType.includes("Herbig")) return "Herbig Ae/Be Star";
  if (subType.includes("Supergiant")) return "Supergiant";
  const match = subType.match(/^([OBAFGKLMYT])/);
  return match ? match[1] : "G";
}

/** Get the visual style for a body. */
export function getBodyStyle(body: { type: string; subType?: string }): BodyVisualStyle {
  if (body.type === "Star") {
    const spectralClass = extractSpectralClass(body.subType);
    return STAR_STYLES[spectralClass] ?? STAR_STYLES["G"];
  }

  if (body.type === "Planet") {
    const key = body.subType ?? "Planet";
    return PLANET_STYLES[key] ?? PLANET_STYLES["Planet"];
  }

  // Barycentres, stations, unknown
  return { fill: "#444444", opacity: 0.4 };
}

/** Is this a gas giant (for rendering bands/rings)? */
export function isGasGiant(subType: string | undefined): boolean {
  if (!subType) return false;
  return subType.toLowerCase().includes("gas giant") || subType.toLowerCase().includes("sudarsky");
}

/** Is this a star? */
export function isStar(type: string): boolean {
  return type === "Star";
}

/** Min render radius by body type (so tiny moons aren't invisible). */
export function getMinRadius(body: { type: string }): number {
  if (body.type === "Star") return 12;
  if (body.type === "Planet") return 5;
  return 3;
}