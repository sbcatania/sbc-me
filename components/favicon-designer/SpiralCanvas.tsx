"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface SpiralProps {
  turns: number;
  radius: number;
  height: number;
  tubeRadius: number;
  segments: number;
  colorStart: string;
  colorEnd: string;
  autoRotate: boolean;
  wireframe: boolean;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

function Spiral({
  turns,
  radius,
  height,
  tubeRadius,
  segments,
  colorStart,
  colorEnd,
  autoRotate,
  wireframe,
  rotationX,
  rotationY,
  rotationZ,
}: SpiralProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Create helix curve
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const totalPoints = segments * turns;

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * turns * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = (t - 0.5) * height;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(points);
  }, [turns, radius, height, segments]);

  // Create tube geometry
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, segments * turns * 4, tubeRadius, 16, false);
  }, [curve, segments, turns, tubeRadius]);

  // Create gradient material with vertex colors
  const material = useMemo(() => {
    const startColor = new THREE.Color(colorStart);
    const endColor = new THREE.Color(colorEnd);

    // Create vertex colors for gradient effect
    const colors: number[] = [];
    const positionAttribute = geometry.getAttribute("position");
    const count = positionAttribute.count;

    for (let i = 0; i < count; i++) {
      const y = positionAttribute.getY(i);
      const normalizedY = (y / height + 0.5);
      const color = startColor.clone().lerp(endColor, normalizedY);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe,
      metalness: 0.3,
      roughness: 0.4,
    });
  }, [geometry, colorStart, colorEnd, height, wireframe]);

  // Convert degrees to radians for the base rotation
  const baseRotationX = (rotationX * Math.PI) / 180;
  const baseRotationY = (rotationY * Math.PI) / 180;
  const baseRotationZ = (rotationZ * Math.PI) / 180;

  useFrame((_, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} rotation={[baseRotationX, baseRotationY, baseRotationZ]}>
      <mesh ref={meshRef} geometry={geometry} material={material} />
    </group>
  );
}

interface SpiralCanvasProps {
  spiralConfig: SpiralProps;
  backgroundColor: string;
}

export default function SpiralCanvas({ spiralConfig, backgroundColor }: SpiralCanvasProps) {
  return (
    <div className="w-full h-full" style={{ backgroundColor }}>
      <Canvas gl={{ preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={[3, 2, 3]} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <Spiral {...spiralConfig} />
      </Canvas>
    </div>
  );
}
