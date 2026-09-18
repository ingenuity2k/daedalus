/**
 * D.A.E.D.A.L.U.S. — Elysium Area Elite Dangerous Assembly, Logistics, Upgrades & Settlement
 *
 * Full-stack colonization manager for Elite Dangerous.
 */
import { useState, useCallback } from "react";
import type { SpanshSystemHit } from "./api/spansh";
import { fetchSystem } from "./api/spansh";
import { toBody } from "./components/Orrery/orreryUtils";
import type { Body } from "./data/types";
import Orrery from "./components/Orrery/Orrery";
import SystemSearch from "./components/SystemSearch";

export default function App() {
  const [bodies, setBodies] = useState<Body[]>([]);
  const [systemName, setSystemName] = useState<string>("");
  const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSystem = useCallback(async (hit: SpanshSystemHit) => {
    setLoading(true);
    setError(null);
    setSystemName(hit.name);
    try {
      const data = await fetchSystem(hit.id64);
      setBodies(data.bodies.map(toBody));
      setSelectedBodyId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load system");
      setBodies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0a0e17",
      color: "#eee",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        padding: "12px 20px",
        borderBottom: "1px solid #1a1f2e",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "#00ff88" }}>
          DAEDALUS
        </h1>
        <span style={{ color: "#444", fontSize: 11, fontFamily: "monospace" }}>
          Elysium Area Elite Dangerous Assembly, Logistics, Upgrades & Settlement
        </span>
        <div style={{ flex: 1 }} />
        <SystemSearch onSelect={handleSelectSystem} />
      </header>

      {/* System name bar */}
      {systemName && (
        <div style={{
          padding: "8px 20px",
          background: "#111827",
          borderBottom: "1px solid #1a1f2e",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
        }}>
          <span style={{ color: "#666" }}>System:</span>
          <span style={{ color: "#00ff88", fontWeight: 600 }}>{systemName}</span>
          <span style={{ color: "#444" }}>·</span>
          <span style={{ color: "#666" }}>{bodies.length} bodies</span>
          {loading && <span style={{ color: "#ffaa00" }}>Loading...</span>}
          {error && <span style={{ color: "#ff4444" }}>{error}</span>}
        </div>
      )}

      {/* Orrery */}
      <div style={{ flex: 1, position: "relative" }}>
        {bodies.length > 0 ? (
          <Orrery
            bodies={bodies}
            selectedBodyId={selectedBodyId}
            onSelectBody={setSelectedBodyId}
          />
        ) : (
          <EmptyState loading={loading} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#333",
      gap: 12,
    }}>
      {loading ? (
        <>
          <div style={{ fontSize: 24 }}>🪶</div>
          <div style={{ fontSize: 14, color: "#555" }}>Loading system data...</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, opacity: 0.3 }}>🪶</div>
          <div style={{ fontSize: 16, color: "#444" }}>Search for a system to begin</div>
          <div style={{ fontSize: 12, color: "#333" }}>Build your wings. Reach new worlds.</div>
        </>
      )}
    </div>
  );
}