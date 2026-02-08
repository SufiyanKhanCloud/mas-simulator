"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useRef, useMemo } from "react"
import * as THREE from "three"

function Particles({ count = 600 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    const neonGreen = new THREE.Color("#00ff88")
    const neonCyan = new THREE.Color("#00d4ff")
    const dimWhite = new THREE.Color("#334455")

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      pos[i3] = (Math.random() - 0.5) * 30
      pos[i3 + 1] = (Math.random() - 0.5) * 20
      pos[i3 + 2] = (Math.random() - 0.5) * 15

      vel[i3] = (Math.random() - 0.5) * 0.005
      vel[i3 + 1] = (Math.random() - 0.5) * 0.005
      vel[i3 + 2] = (Math.random() - 0.5) * 0.003

      const r = Math.random()
      let color: THREE.Color
      if (r < 0.15) color = neonGreen
      else if (r < 0.25) color = neonCyan
      else color = dimWhite

      col[i3] = color.r
      col[i3 + 1] = color.g
      col[i3 + 2] = color.b
    }

    return { positions: pos, velocities: vel, colors: col }
  }, [count])

  const linePositions = useMemo(() => new Float32Array(count * count * 0.01 * 6), [count])
  const lineColors = useMemo(() => new Float32Array(count * count * 0.01 * 6), [count])

  useFrame((state) => {
    if (!meshRef.current) return

    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const time = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      posArray[i3] += velocities[i3] + Math.sin(time * 0.3 + i * 0.1) * 0.001
      posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i * 0.1) * 0.001
      posArray[i3 + 2] += velocities[i3 + 2]

      // Wrap around
      if (posArray[i3] > 15) posArray[i3] = -15
      if (posArray[i3] < -15) posArray[i3] = 15
      if (posArray[i3 + 1] > 10) posArray[i3 + 1] = -10
      if (posArray[i3 + 1] < -10) posArray[i3 + 1] = 10
      if (posArray[i3 + 2] > 7.5) posArray[i3 + 2] = -7.5
      if (posArray[i3 + 2] < -7.5) posArray[i3 + 2] = 7.5
    }
    posAttr.needsUpdate = true

    // Draw connection lines
    if (linesRef.current) {
      let lineIdx = 0
      const maxLines = Math.floor(count * count * 0.01)
      const threshold = 3.5

      for (let i = 0; i < count && lineIdx < maxLines; i++) {
        for (let j = i + 1; j < count && lineIdx < maxLines; j++) {
          const dx = posArray[i * 3] - posArray[j * 3]
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1]
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2]
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (dist < threshold) {
            const alpha = 1 - dist / threshold
            const l6 = lineIdx * 6
            linePositions[l6] = posArray[i * 3]
            linePositions[l6 + 1] = posArray[i * 3 + 1]
            linePositions[l6 + 2] = posArray[i * 3 + 2]
            linePositions[l6 + 3] = posArray[j * 3]
            linePositions[l6 + 4] = posArray[j * 3 + 1]
            linePositions[l6 + 5] = posArray[j * 3 + 2]

            const g = 0.3 * alpha
            lineColors[l6] = 0
            lineColors[l6 + 1] = g
            lineColors[l6 + 2] = g * 0.5
            lineColors[l6 + 3] = 0
            lineColors[l6 + 4] = g
            lineColors[l6 + 5] = g * 0.5
            lineIdx++
          }
        }
      }

      // Zero out remaining
      for (let i = lineIdx * 6; i < linePositions.length; i++) {
        linePositions[i] = 0
        lineColors[i] = 0
      }

      const lp = linesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const lc = linesRef.current.geometry.attributes.color as THREE.BufferAttribute
      lp.needsUpdate = true
      lc.needsUpdate = true
    }
  })

  return (
    <>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={linePositions.length / 3}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
            count={lineColors.length / 3}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </>
  )
}

function FloatingGrid() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.PI * 0.5
      ref.current.position.y = -4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })

  return (
    <mesh ref={ref} position={[0, -4, -5]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshBasicMaterial
        color="#00ff88"
        wireframe
        transparent
        opacity={0.04}
      />
    </mesh>
  )
}

export function ParticleBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#080c14"]} />
        <fog attach="fog" args={["#080c14", 8, 25]} />
        <Particles count={400} />
        <FloatingGrid />
      </Canvas>
      {/* Radial gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(8,12,20,0.7) 100%)",
        }}
      />
    </div>
  )
}
