/**
 * Mock data generator for prototyping the galaxy map.
 * Generates systems around a center point with realistic-looking coordinates.
 */
import type { GalaxySystem } from "../components/GalaxyMap/GalaxyMap";

/** Generate mock systems around a center point (simulates 15ly radius). */
export function generateMockSystems(centerX = 0, centerY = 0, centerZ = 0): GalaxySystem[] {
  const systems: GalaxySystem[] = [];
  const names = [
    "Alpha Centauri", "Barnard's Star", "Wolf 359", "Lalande 21185", "Luyten's Star",
    "Ross 154", "Ross 248", "Epsilon Eridani", "Lacaille 9352", "Ross 128",
    "EZ Aquarii", "Procyon", "61 Cygni", "Struve 2398", "Groombridge 34",
    "DX Cancri", "Tau Ceti", "Epsilon Indi", "YZ Ceti", "Luyten's Star",
    "Teegarden's Star", "Kapteyn's Star", "Lacaille 8760", "Kruger 60",
    "Ross 614", "Wolf 1061", "Van Maanen's Star", "Gliese 1", "Gliese 687",
    "Gliese 876", "Gliese 581", "Gliese 667C", "Gliese 832", "Gliese 445",
    "Gliese 436", "Gliese 1214", "TRAPPIST-1", "Kepler-442", "Kepler-186",
    "HD 219134", "HD 40307", "HD 85512", "HD 10700", "HD 192310",
    "HIP 57050", "HIP 113044", "HIP 39862", "HIP 85602", "HIP 103983",
  ];

  const allegiances = ["Federation", "Empire", "Independent", "Alliance", null];
  const radius = 15; // light-years

  names.forEach((name, i) => {
    // Spread systems in a sphere around center
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * radius;
    const x = centerX + r * Math.sin(phi) * Math.cos(theta);
    const y = centerY + r * Math.sin(phi) * Math.sin(theta);
    const z = centerZ + r * Math.cos(phi);

    systems.push({
      id64: 1000000000000 + i,
      name,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: Math.round(z * 100) / 100,
      bodyCount: Math.floor(Math.random() * 30) + 1,
      inhabited: Math.random() > 0.6,
      allegiance: allegiances[Math.floor(Math.random() * allegiances.length)] ?? undefined,
      distance: Math.round(r * 100) / 100,
    });
  });

  return systems;
}