/**
 * D.A.E.D.A.L.U.S. — Dominion Architects Elite Dangerous Assembly, Logistics, Upgrades & Settlement
 *
 * Full-stack colonization manager for Elite Dangerous.
 */
import { useState, useCallback, useMemo } from "react";
import type { SpanshSystemHit } from "./api/spansh";
import { fetchSystem } from "./api/spansh";
import { toBody } from "./components/Orrery/orreryUtils";
import type { Body } from "./data/types";
import Orrery from "./components/Orrery/Orrery";
import SystemSearch from "./components/SystemSearch";
import GalaxyMap from "./components/GalaxyMap/GalaxyMap";
import type { GalaxySystem } from "./components/GalaxyMap/GalaxyMap";
import { generateMockSystems } from "./data/mockGalaxy";

type View = "galaxy" | "orrery";

export default function App() {
  const [view, setView] = useState<View>("galaxy");
  const [bodies, setBodies] = useState<Body[]>([]);
  const [systemName, setSystemName] = useState<string>("");
  const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Galaxy map state
  const [galaxyCenter, setGalaxyCenter] = useState<string>("Trailblazer Echo");
  const [selectedGalaxySystem, setSelectedGalaxySystem] = useState<GalaxySystem | null>(null);
  const mockSystems = useMemo(() => generateMockSystems(), []);

  const handleSelectSystem = useCallback(async (hit: SpanshSystemHit) => {
    setLoading(true);
    setError(null);
    setSystemName(hit.name);
    setView("orrery");
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

  const handleSelectGalaxySystem = useCallback((sys: GalaxySystem) => {
    setSelectedGalaxySystem(sys);
  }, []);

  const handleViewOrrery = useCallback(async () => {
    if (!selectedGalaxySystem) return;
    setLoading(true);
    setError(null);
    setSystemName(selectedGalaxySystem.name);
    setView("orrery");
    try {
      const data = await fetchSystem(selectedGalaxySystem.id64);
      setBodies(data.bodies.map(toBody));
      setSelectedBodyId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load system");
      setBodies([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGalaxySystem]);

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
        gap: 16,
        flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "#00ff88" }}>
          DAEDALUS
        </h1>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 2 }}>
          <TabButton active={view === "galaxy"} onClick={() => setView("galaxy")}>
            Galaxy
          </TabButton>
          <TabButton active={view === "orrery"} onClick={() => setView("orrery")}>
            System
          </TabButton>
        </div>

        <div style={{ flex: 1 }} />
        <SystemSearch onSelect={handleSelectSystem} />
      </header>

      {/* Status bar */}
      {(systemName || loading || error) && (
        <div style={{
          padding: "6px 20px",
          background: "#111827",
          borderBottom: "1px solid #1a1f2e",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 12,
        }}>
          {systemName && (
            <>
              <span style={{ color: "#666" }}>System:</span>
              <span style={{ color: "#00ff88", fontWeight: 600 }}>{systemName}</span>
              <span style={{ color: "#444" }}>·</span>
              <span style={{ color: "#666" }}>{bodies.length} bodies</span>
            </>
          )}
          {loading && <span style={{ color: "#ffaa00" }}>Loading...</span>}
          {error && <span style={{ color: "#ff4444" }}>{error}</span>}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, position: "relative" }}>
        {view === "galaxy" ? (
          <>
            <GalaxyMap
              systems={mockSystems}
              centerName={galaxyCenter}
              onSelectSystem={handleSelectGalaxySystem}
              selectedId64={selectedGalaxySystem?.id64}
            />
            {/* Galaxy info panel */}
            <div style={{
              position: "absolute", top: 12, left: 12,
              background: "rgba(10, 14, 23, 0.9)", border: "1px solid #222",
              borderRadius: 8, padding: 16, fontSize: 13, minWidth: 220, maxWidth: 300,
            }}>
              <div style={{ color: "#00ff88", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                System Finder
              </div>
              <div style={{ color: "#666", fontSize: 12, marginBottom: 12 }}>
                Showing {mockSystems.length} systems within 15 ly of {galaxyCenter}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <LegendDot color="#ff8844" label="Unoccupied" />
                <LegendDot color="#4488ff" label="Inhabited" />
              </div>
              {selectedGalaxySystem && (
                <div style={{
                  borderTop: "1px solid #222", paddingTop: 12, marginTop: 8,
                }}>
                  <div style={{ color: "#fff", fontWeight: 600, marginBottom: 4 }}>
                    {selectedGalaxySystem.name}
                  </div>
                  <div style={{ color: "#888", fontSize: 11, lineHeight: 1.6 }}>
                    <div>Distance: {selectedGalaxySystem.distance?.toFixed(1)} ly</div>
                    <div>Bodies: {selectedGalaxySystem.bodyCount ?? "?"}</div>
                    <div>Status: {selectedGalaxySystem.inhabited ? "Inhabited" : "Unoccupied"}</div>
                    {selectedGalaxySystem.allegiance && (
                      <div>Allegiance: {selectedGalaxySystem.allegiance}</div>
                    )}
                  </div>
                  <button
                    onClick={handleViewOrrery}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      padding: "8px 0",
                      background: "#00ff8822",
                      border: "1px solid #00ff8844",
                      borderRadius: 4,
                      color: "#00ff88",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    View System Orrery →
                  </button>
                </div>
              )}
            </div>
          </>
        ) : bodies.length > 0 ? (
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

// ── Sub-components ─────────────────────────────────────────────

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        background: active ? "#1a2a1a" : "transparent",
        border: `1px solid ${active ? "#00ff8844" : "#222"}`,
        borderRadius: 4,
        color: active ? "#00ff88" : "#666",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ color: "#888" }}>{label}</span>
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