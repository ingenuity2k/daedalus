/**
 * Orrery — Interactive SVG system map.
 * Renders stars, planets, moons with orbital paths.
 * Supports zoom (scroll) and pan (drag).
 */
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { Body, PositionedBody } from "../../data/types";
import { computePositions, getOrbitEllipse, scaleDistance, getRootBodies, buildTree } from "./orreryUtils";
import OrreryBody from "./OrreryBody";
import { getBodyStyle, isStar } from "../../data/bodyTypes";

interface Props {
  bodies: Body[];
  selectedBodyId: number | null;
  onSelectBody: (id: number | null) => void;
}

export default function Orrery({ bodies, selectedBodyId, onSelectBody }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredBody, setHoveredBody] = useState<PositionedBody | null>(null);

  // Compute positions — memoized to avoid render loops
  const positioned = useMemo(() => computePositions(bodies, zoom), [bodies, zoom]);
  const positionMap = useMemo(() => new Map(positioned.map(b => [b.id, b])), [positioned]);

  // Build parent lookup for orbit rendering — memoized
  const childToParent = useMemo(() => {
    const map = new Map<number, Body>();
    const tree = buildTree(bodies);
    for (const [parentId, children] of tree) {
      if (parentId === null) continue;
      const parentBody = bodies.find(b => b.id === parentId);
      if (parentBody) {
        for (const child of children) {
          map.set(child.id, parentBody);
        }
      }
    }
    return map;
  }, [bodies]);

  // ── Zoom ─────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.1, Math.min(10, z * delta)));
  }, []);

  // ── Pan ──────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // ── Fit to view ──────────────────────────────────────────────
  // Computes positions at zoom=1 to avoid circular dependency with zoom state.
  const fitToView = useCallback(() => {
    if (bodies.length === 0) return;
    const positioned = computePositions(bodies, 1);
    const xs = positioned.map(b => Math.abs(b.x));
    const ys = positioned.map(b => Math.abs(b.y));
    const maxDist = Math.max(...xs, ...ys, 100);
    const svgRect = svgRef.current?.getBoundingClientRect();
    const viewSize = Math.min(svgRect?.width ?? 800, svgRect?.height ?? 600);
    const newZoom = (viewSize * 0.4) / maxDist;
    setZoom(Math.max(0.1, Math.min(5, newZoom)));
    setPan({ x: 0, y: 0 });
  }, [bodies]);

  useEffect(() => {
    if (bodies.length > 0) {
      const t = setTimeout(fitToView, 50);
      return () => clearTimeout(t);
    }
  }, [bodies, fitToView]);

  // ── Render orbit ellipses ────────────────────────────────────
  const renderOrbits = () => {
    const orbits: React.ReactNode[] = [];
    for (const body of positioned) {
      const parentBody = childToParent.get(body.id);
      if (!parentBody) continue;
      const parentPos = positionMap.get(parentBody.id);
      if (!parentPos) continue;

      const ellipse = getOrbitEllipse(body, parentPos.x, parentPos.y, zoom);
      if (!ellipse) continue;

      orbits.push(
        <ellipse
          key={`orbit-${body.id}`}
          cx={ellipse.cx}
          cy={ellipse.cy}
          rx={ellipse.rx}
          ry={ellipse.ry}
          fill="none"
          stroke="#333"
          strokeWidth={0.5}
          opacity={0.6}
          transform={`rotate(${(body.orbitalInclination ?? 0) * 0.1}, ${ellipse.cx}, ${ellipse.cy})`}
        />
      );
    }
    return orbits;
  };

  // ── Selected body info ───────────────────────────────────────
  const selected = selectedBodyId != null ? positionMap.get(selectedBodyId) : null;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#0a0e17" }}>
      {/* Zoom controls */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: "flex", gap: 4 }}>
        <button onClick={() => setZoom(z => z * 1.2)} style={controlBtnStyle}>+</button>
        <button onClick={() => setZoom(z => z / 1.2)} style={controlBtnStyle}>−</button>
        <button onClick={fitToView} style={controlBtnStyle}>⊡</button>
      </div>

      {/* Zoom level indicator */}
      <div style={{ position: "absolute", bottom: 12, right: 12, zIndex: 10, color: "#555", fontSize: 11, fontFamily: "monospace" }}>
        {(zoom * 100).toFixed(0)}%
      </div>

      {/* Hover tooltip */}
      {hoveredBody && (
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 10,
          background: "rgba(10, 14, 23, 0.9)", border: "1px solid #333",
          borderRadius: 6, padding: "8px 12px", fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: "#ddd", fontSize: 13, pointerEvents: "none",
        }}>
          <div style={{ fontWeight: 600, color: getBodyStyle(hoveredBody).fill }}>
            {hoveredBody.name}
          </div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
            {hoveredBody.subType ?? hoveredBody.type}
            {hoveredBody.distanceToArrival != null && ` · ${hoveredBody.distanceToArrival.toLocaleString()} ls`}
          </div>
          {hoveredBody.isLandable && <div style={{ color: "#00ff88", fontSize: 11, marginTop: 2 }}>⬡ Landable</div>}
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {/* Center the view */}
        <g transform={`translate(${500 + pan.x}, ${350 + pan.y}) scale(${zoom})`}>
          {/* Background grid (subtle) */}
          <GridLines />

          {/* Orbital paths */}
          {renderOrbits()}

          {/* Connection lines from parent to child */}
          {positioned.map(body => {
            const parent = childToParent.get(body.id);
            if (!parent) return null;
            const parentPos = positionMap.get(parent.id);
            if (!parentPos) return null;
            return (
              <line
                key={`conn-${body.id}`}
                x1={parentPos.x} y1={parentPos.y}
                x2={body.x} y2={body.y}
                stroke="#222"
                strokeWidth={0.5}
                opacity={0.3}
              />
            );
          })}

          {/* Bodies */}
          {positioned.map(body => (
            <OrreryBody
              key={body.id}
              body={body}
              isSelected={body.id === selectedBodyId}
              onClick={() => onSelectBody(body.id === selectedBodyId ? null : body.id)}
              onHover={(h) => setHoveredBody(h ? body : null)}
              zoom={zoom}
            />
          ))}
        </g>
      </svg>

      {/* Selected body detail panel */}
      {selected && (
        <BodyPanel body={selected} onClose={() => onSelectBody(null)} />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function GridLines() {
  const lines: React.ReactNode[] = [];
  const extent = 2000;
  const step = 100;
  for (let i = -extent; i <= extent; i += step) {
    lines.push(
      <line key={`h-${i}`} x1={-extent} y1={i} x2={extent} y2={i} stroke="#111" strokeWidth={0.5} />,
      <line key={`v-${i}`} x1={i} y1={-extent} x2={i} y2={extent} stroke="#111" strokeWidth={0.5} />
    );
  }
  return <g opacity={0.3}>{lines}</g>;
}

function BodyPanel({ body, onClose }: { body: PositionedBody; onClose: () => void }) {
  const style = getBodyStyle(body);
  return (
    <div style={{
      position: "absolute", bottom: 12, left: 12, zIndex: 10,
      background: "rgba(10, 14, 23, 0.95)", border: "1px solid #333",
      borderRadius: 8, padding: 16, fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#ddd", fontSize: 13, minWidth: 220, maxWidth: 320,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: style.fill, fontSize: 15 }}>{body.name}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
      <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>{body.subType ?? body.type}</div>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <tbody>
          {body.distanceToArrival != null && (
            <tr><td style={labelStyle}>Distance</td><td style={valueStyle}>{body.distanceToArrival.toLocaleString()} ls</td></tr>
          )}
          {body.radius != null && (
            <tr><td style={labelStyle}>Radius</td><td style={valueStyle}>{body.radius.toLocaleString()} km</td></tr>
          )}
          {body.gravity != null && (
            <tr><td style={labelStyle}>Gravity</td><td style={valueStyle}>{body.gravity.toFixed(2)} G</td></tr>
          )}
          {body.surfaceTemperature != null && (
            <tr><td style={labelStyle}>Temp</td><td style={valueStyle}>{body.surfaceTemperature.toLocaleString()} K</td></tr>
          )}
          {body.terraformingState && body.terraformingState !== "Not terraformable" && (
            <tr><td style={labelStyle}>Terraforming</td><td style={{ ...valueStyle, color: "#00ff88" }}>{body.terraformingState}</td></tr>
          )}
          {body.isLandable && (
            <tr><td style={labelStyle}>Landable</td><td style={{ ...valueStyle, color: "#00ff88" }}>Yes</td></tr>
          )}
          {(body.rings?.length ?? 0) > 0 && (
            <tr><td style={labelStyle}>Rings</td><td style={valueStyle}>{body.rings!.map(r => r.name).join(", ")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const labelStyle: React.CSSProperties = { color: "#666", padding: "2px 8px 2px 0", textAlign: "left" };
const valueStyle: React.CSSProperties = { color: "#ccc", padding: "2px 0" };

const controlBtnStyle: React.CSSProperties = {
  background: "rgba(10, 14, 23, 0.8)",
  border: "1px solid #333",
  borderRadius: 4,
  color: "#888",
  width: 28,
  height: 28,
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};