/**
 * GalaxyMap — 3D galaxy map for system selection.
 * Uses react-three-fiber for WebGL rendering with orbit camera controls.
 * Star systems rendered as glowing points, clickable to preview.
 */
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useState, useMemo, useCallback, useRef } from "react";
import * as THREE from "three";
import type { SystemData } from "../../data/types";

export interface GalaxySystem {
  id64: number;
  name: string;
  x: number;
  y: number;
  z: number;
  /** Number of bodies in the system */
  bodyCount?: number;
  /** Whether the system is inhabited */
  inhabited?: boolean;
  /** Distance from center (computed) */
  distance?: number;
  /** Allegiance (Federation, Empire, Independent, etc.) */
  allegiance?: string;
}

interface Props {
  /** Systems to render */
  systems: GalaxySystem[];
  /** Center system (e.g. Trailblazer megaship) */
  centerName?: string;
  /** Called when a system is clicked */
  onSelectSystem: (system: GalaxySystem) => void;
  /** Currently selected system id64 */
  selectedId64?: number | null;
}

export default function GalaxyMap({ systems, centerName, onSelectSystem, selectedId64 }: Props) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#000" }}>
      <Canvas
        camera={{ position: [0, 50, 100], fov: 60, near: 0.1, far: 10000 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000008");
        }}
      >
        <ambientLight intensity={0.1} />
        <StarField systems={systems} onSelectSystem={onSelectSystem} selectedId64={selectedId64} />
        <CenterMarker name={centerName} />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={0.5}
          zoomSpeed={1.2}
          minDistance={5}
          maxDistance={2000}
        />
        <BackgroundStars />
      </Canvas>
    </div>
  );
}

// ── Star systems as instanced points ───────────────────────────

function StarField({ systems, onSelectSystem, selectedId64 }: {
  systems: GalaxySystem[];
  onSelectSystem: (s: GalaxySystem) => void;
  selectedId64?: number | null;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const { matrix, colors, count } = useMemo(() => {
    const count = systems.length;
    const matrix = new THREE.Matrix4();
    const colors = new Float32Array(count * 3);
    const tempColor = new THREE.Color();

    return { matrix, colors, count };
  }, [systems]);

  // Update instance matrices and colors
  useMemo(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();

    systems.forEach((sys, i) => {
      tempMatrix.setPosition(sys.x, sys.y, sys.z);
      mesh.setMatrixAt(i, tempMatrix);

      // Color by allegiance
      if (sys.id64 === selectedId64) {
        tempColor.set("#00ff88");
      } else if (sys.id64 === hovered) {
        tempColor.set("#ffffff");
      } else if (sys.inhabited) {
        tempColor.set("#4488ff");
      } else {
        // Unoccupied — the ones we care about
        tempColor.set("#ff8844");
      }
      mesh.setColorAt(i, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [systems, selectedId64, hovered]);

  const handleClick = useCallback((e: THREE.Intersection) => {
    const instanceId = e.instanceId;
    if (instanceId != null && instanceId < systems.length) {
      onSelectSystem(systems[instanceId]);
    }
  }, [systems, onSelectSystem]);

  const handlePointerOver = useCallback((e: THREE.Intersection) => {
    const instanceId = e.instanceId;
    if (instanceId != null && instanceId < systems.length) {
      setHovered(systems[instanceId].id64);
      document.body.style.cursor = "pointer";
    }
  }, [systems]);

  const handlePointerOut = useCallback(() => {
    setHovered(null);
    document.body.style.cursor = "default";
  }, []);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
}

// ── Center marker (Trailblazer / reference system) ────────────

function CenterMarker({ name }: { name?: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Glowing center sphere */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#00ff88" toneMapped={false} />
      </mesh>
      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Label */}
      {name && (
        <Html position={[0, 4, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{
            color: "#00ff88",
            fontSize: 12,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            textShadow: "0 0 8px #00ff8866",
          }}>
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Background star field (ambient decoration) ────────────────

function BackgroundStars() {
  const count = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4000;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4000;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4000;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.5} color="#334" sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}