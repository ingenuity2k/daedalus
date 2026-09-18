/**
 * Renders a single body in the Orrery — star, planet, or moon.
 * Stars get glow effects, gas giants get banding, planets get solid fills.
 */
import { getBodyStyle, isGasGiant, isStar } from "../../data/bodyTypes";
import type { PositionedBody } from "../../data/types";

interface Props {
  body: PositionedBody;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
  zoom: number;
}

export default function OrreryBody({ body, isSelected, onClick, onHover, zoom }: Props) {
  const style = getBodyStyle(body);
  const r = body.renderRadius;
  const isGiant = isGasGiant(body.subType);
  const isStarType = isStar(body.type);
  const gradientId = `grad-${body.id}`;
  const glowId = `glow-${body.id}`;

  return (
    <g
      transform={`translate(${body.x}, ${body.y})`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Defs for this body */}
      <defs>
        {/* Star glow */}
        {isStarType && style.glow && (
          <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={style.glowRadius ?? 20} />
          </filter>
        )}
        {/* Radial gradient for planets */}
        {!isStarType && style.accent && (
          <radialGradient id={gradientId} cx="35%" cy="35%">
            <stop offset="0%" stopColor={style.fill} />
            <stop offset="100%" stopColor={style.accent} />
          </radialGradient>
        )}
        {/* Star radial gradient */}
        {isStarType && (
          <radialGradient id={gradientId} cx="40%" cy="40%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor={style.fill} />
            <stop offset="100%" stopColor={style.glow ?? style.fill} stopOpacity="0.6" />
          </radialGradient>
        )}
      </defs>

      {/* Star glow (behind everything) */}
      {isStarType && style.glow && (
        <circle
          r={r * 3}
          fill={style.glow}
          opacity={0.3}
          filter={`url(#${glowId})`}
        />
      )}

      {/* Gas giant bands */}
      {isGiant && (
        <>
          <ellipse
            rx={r}
            ry={r * 0.95}
            fill={`url(#${gradientId})`}
            opacity={style.opacity ?? 1}
          />
          {/* Band lines */}
          {[-0.6, -0.2, 0.2, 0.6].map((offset, i) => (
            <line
              key={i}
              x1={-r * 0.9}
              y1={r * offset}
              x2={r * 0.9}
              y2={r * offset}
              stroke={style.accent ?? "#555"}
              strokeWidth={r * 0.08}
              opacity={0.4}
              strokeLinecap="round"
            />
          ))}
        </>
      )}

      {/* Main body circle */}
      {!isGiant && (
        <circle
          r={r}
          fill={isStarType ? `url(#${gradientId})` : (style.accent ? `url(#${gradientId})` : style.fill)}
          opacity={style.opacity ?? 1}
          stroke={isSelected ? "#00ff88" : "transparent"}
          strokeWidth={isSelected ? 2 / zoom : 0}
        />
      )}

      {/* Rings */}
      {(body.rings?.length ?? 0) > 0 && (
        <ellipse
          rx={r * 2}
          ry={r * 0.5}
          fill="none"
          stroke={style.fill}
          strokeWidth={Math.max(1, r * 0.15)}
          opacity={0.5}
          transform="rotate(-20)"
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <circle
          r={r + 4}
          fill="none"
          stroke="#00ff88"
          strokeWidth={1.5}
          opacity={0.8}
          strokeDasharray="4 2"
        />
      )}

      {/* Body name label */}
      <text
        y={r + 14}
        textAnchor="middle"
        fill="#999"
        fontSize={Math.max(9, 11 / zoom)}
        fontFamily="'Segoe UI', system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {body.name.replace(body.name.split(" ").slice(0, -1).join(" "), "").trim() || body.name}
      </text>
    </g>
  );
}