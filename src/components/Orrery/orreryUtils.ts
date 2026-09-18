/**
 * Utilities for positioning bodies in the Orrery view.
 * Converts real orbital data into render coordinates.
 */
import type { Body, PositionedBody } from "../../data/types";
import type { SpanshBody } from "../../api/spansh";
import { getBodyStyle, getMinRadius } from "../../data/bodyTypes";

/** Convert SpanshBody to our local Body type. */
export function toBody(b: SpanshBody): Body {
  return {
    id: b.bodyId,
    name: b.name,
    type: b.type,
    subType: b.subType,
    distanceToArrival: b.distanceToArrival,
    parents: b.parents,
    semiMajorAxis: b.semiMajorAxis,
    orbitalPeriod: b.orbitalPeriod,
    orbitalEccentricity: b.orbitalEccentricity,
    orbitalInclination: b.orbitalInclination,
    argOfPeriapsis: b.argOfPeriapsis,
    radius: b.radius,
    gravity: b.gravity,
    surfaceTemperature: b.surfaceTemperature,
    rings: b.rings,
    belts: b.belts,
    signals: b.signals,
    isLandable: b.isLandable,
    terraformingState: b.terraformingState,
    volcanismType: b.volcanismType,
    atmosphereType: b.atmosphereType,
    reserveLevel: b.reserveLevel,
    isMainStar: b.mainStar,
    isScoopable: b.isScoopable,
    luminosity: b.luminosity,
  };
}

/** Build a parent→children map from the body list. */
export function buildTree(bodies: Body[]): Map<number | null, Body[]> {
  const map = new Map<number | null, Body[]>();
  for (const body of bodies) {
    // First parent in the array is the direct parent.
    // If no parents or parents is empty, it's a root body.
    const parentId = body.parents?.length ? body.parents[0][Object.keys(body.parents[0])[0]] : null;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId)!.push(body);
  }
  return map;
}

/** Get the root bodies (stars with no parent, or the main star). */
export function getRootBodies(bodies: Body[]): Body[] {
  const tree = buildTree(bodies);
  // Root = bodies whose first parent doesn't exist in the list, or have no parents
  const root = tree.get(null) ?? [];
  if (root.length > 0) return root;
  // Fallback: find bodies not referenced as children
  const childIds = new Set(bodies.flatMap(b => (b.parents ?? []).flatMap(p => Object.values(p))));
  return bodies.filter(b => !childIds.has(b.id));
}

/**
 * Scale factor: real orbital distances span millions of ls.
 * We use sqrt scaling so inner planets aren't invisible and outer ones aren't off-screen.
 */
export function scaleDistance(distanceLs: number, zoom: number = 1): number {
  if (!distanceLs || distanceLs <= 0) return 0;
  // sqrt scaling with a base multiplier
  return Math.sqrt(distanceLs) * 8 * zoom;
}

/**
 * Scale body radius for rendering. Real radii span thousands of km to millions.
 * We use a capped log scale so everything is visible.
 */
export function scaleRadius(radiusKm: number | undefined, bodyType: string): number {
  const min = getMinRadius({ type: bodyType });
  if (!radiusKm || radiusKm <= 0) return min;
  // Log scale: Jupiter ~71k km → ~14px, Earth ~6k km → ~8px, Moon ~1.7k km → ~5px
  const scaled = Math.log10(radiusKm) * 4;
  return Math.max(min, Math.min(scaled, 30)); // cap at 30px
}

/**
 * Compute position on an orbital ellipse.
 * @param semiMajorAxis - in light-seconds
 * @param eccentricity - 0 = circle, 0-1 = ellipse
 * @param angle - position angle in radians (0 = periapsis)
 * @param parentX - parent body x position
 * @param parentY - parent body y position
 */
export function orbitalPosition(
  semiMajorAxis: number,
  eccentricity: number,
  angle: number,
  parentX: number,
  parentY: number,
  zoom: number = 1,
): { x: number; y: number } {
  const a = scaleDistance(semiMajorAxis, zoom);
  const b = a * Math.sqrt(1 - (eccentricity ?? 0) ** 2);
  const x = parentX + a * Math.cos(angle);
  const y = parentY + b * Math.sin(angle);
  return { x, y };
}

/**
 * Compute positioned bodies for rendering.
 * Assigns each body a position based on its orbital parameters.
 * Siblings are spread evenly around their orbit for now (we don't have real-time orbital positions).
 */
export function computePositions(bodies: Body[], zoom: number = 1): PositionedBody[] {
  const tree = buildTree(bodies);
  const positioned: PositionedBody[] = [];
  const positionMap = new Map<number, { x: number; y: number }>();

  function process(parentId: number | null, parentX: number, parentY: number, depth: number) {
    const children = tree.get(parentId) ?? [];
    children.forEach((child, index) => {
      const ecc = child.orbitalEccentricity ?? 0;
      const sma = child.semiMajorAxis ?? 0;

      // Spread siblings evenly around the orbit
      const angle = children.length > 1
        ? (index / children.length) * Math.PI * 2
        : 0;

      let x: number, y: number;

      if (sma > 0 && parentId !== null) {
        const pos = orbitalPosition(sma, ecc, angle, parentX, parentY, zoom);
        x = pos.x;
        y = pos.y;
      } else if (parentId === null) {
        // Root body — position it based on sibling index
        const spacing = 80 * zoom;
        const offset = (index - (children.length - 1) / 2) * spacing;
        x = parentX + offset;
        y = parentY;
      } else {
        x = parentX;
        y = parentY;
      }

      const style = getBodyStyle(child);
      const renderRadius = scaleRadius(child.radius, child.type);

      positionMap.set(child.id, { x, y });
      positioned.push({
        ...child,
        x,
        y,
        renderRadius,
        depth,
        siblingIndex: index,
        siblingCount: children.length,
      });

      // Recurse into children (moons, etc.)
      process(child.id, x, y, depth + 1);
    });
  }

  // Start from root bodies
  const roots = getRootBodies(bodies);
  if (roots.length > 0) {
    process(null, 0, 0, 0);
  }

  return positioned;
}

/** Get orbit ellipse parameters for rendering. */
export function getOrbitEllipse(
  body: PositionedBody,
  parentX: number,
  parentY: number,
  zoom: number,
): { cx: number; cy: number; rx: number; ry: number } | null {
  if (!body.semiMajorAxis || body.semiMajorAxis <= 0) return null;
  const a = scaleDistance(body.semiMajorAxis, zoom);
  const ecc = body.orbitalEccentricity ?? 0;
  const b = a * Math.sqrt(1 - ecc ** 2);
  // Center of ellipse is offset from parent by focal distance
  const focalOffset = a * ecc;
  return {
    cx: parentX + focalOffset,
    cy: parentY,
    rx: a,
    ry: b,
  };
}