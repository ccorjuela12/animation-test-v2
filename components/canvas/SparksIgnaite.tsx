'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

type SparksIgnaiteProps = {
  count?: number
  rangeX?: [number, number]
  rangeY?: [number, number]
  rangeZ?: [number, number]
  sizeRange?: [number, number]
  colorInner?: string
  colorOuter?: string
  stretchRange?: [number, number]
  spawnSpeed?: number
}

/**
 * Static ember cloud that fans out from the centre with varied sizes/orientations.
 */
export default function SparksIgnaite({
  count = 280,
  rangeX = [-0.9, 0.9],
  rangeY = [-0.15, 0.6],
  rangeZ = [-0.55, 0.55],
  sizeRange = [0.06, 0.32],
  colorInner = '#ffb05c',
  colorOuter = '#ff3b00',
  stretchRange = [0.6, 2.4],
  spawnSpeed = 0.08,
}: SparksIgnaiteProps) {
  const pointsRef = useRef<THREE.Points>(null!)

  const attributes = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const tilts = new Float32Array(count)
    const heats = new Float32Array(count)
    const sizes = new Float32Array(count)
    const stretches = new Float32Array(count)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const base = i * 3
      const x = THREE.MathUtils.lerp(rangeX[0], rangeX[1], Math.random())
      const y = THREE.MathUtils.lerp(rangeY[0], rangeY[1], Math.random())
      const z = THREE.MathUtils.lerp(rangeZ[0], rangeZ[1], Math.random())

      positions[base] = x
      positions[base + 1] = y
      positions[base + 2] = z

      tilts[i] = Math.atan2(z, x) + (Math.random() - 0.5) * 0.9
      heats[i] = Math.random()
      sizes[i] = Math.random()
      stretches[i] = Math.random()
      seeds[i] = Math.random()
    }

    return { positions, tilts, heats, sizes, stretches, seeds }
  }, [count, rangeX, rangeY, rangeZ])

  const uniforms = useMemo(
    () => ({
      uSizeMin: { value: sizeRange[0] },
      uSizeMax: { value: sizeRange[1] },
      uStretchMin: { value: stretchRange[0] },
      uStretchMax: { value: stretchRange[1] },
      uColorInner: { value: new THREE.Color(colorInner) },
      uColorOuter: { value: new THREE.Color(colorOuter) },
      uTime: { value: 0 },
      uSpawnSpeed: { value: spawnSpeed },
    }),
    [sizeRange, stretchRange, colorInner, colorOuter, spawnSpeed],
  )

  useFrame((_, delta) => {
    uniforms.uTime.value += delta
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[attributes.positions, 3]}
        />
        <bufferAttribute attach="attributes-aTilt" args={[attributes.tilts, 1]} />
        <bufferAttribute attach="attributes-aHeat" args={[attributes.heats, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[attributes.sizes, 1]} />
        <bufferAttribute
          attach="attributes-aStretch"
          args={[attributes.stretches, 1]}
        />
        <bufferAttribute attach="attributes-aSeed" args={[attributes.seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        transparent
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform float uSizeMin;
          uniform float uSizeMax;
          uniform float uTime;
          uniform float uSpawnSpeed;

          attribute float aTilt;
          attribute float aHeat;
          attribute float aSize;
          attribute float aStretch;
          attribute float aSeed;

          varying float vTilt;
          varying float vHeat;
          varying float vSize;
          varying float vStretch;
          varying float vCycle;

          void main() {
            float cycle = fract(uTime * uSpawnSpeed + aSeed);
            vec3 displaced = position;
            displaced.y += cycle * 0.8;
            float swirl = (cycle + aSeed) * 6.2831853;
            displaced.x += sin(swirl) * 0.08;
            displaced.z += cos(swirl) * 0.08;

            vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
            float perspective = 1.0 / -mvPosition.z;
            float baseSize = mix(uSizeMin, uSizeMax, aSize);
            gl_PointSize = baseSize * perspective * 600.0;

            vTilt = aTilt;
            vHeat = aHeat;
            vSize = aSize;
            vStretch = aStretch;
            vCycle = cycle;

            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uColorInner;
          uniform vec3 uColorOuter;
          uniform float uStretchMin;
          uniform float uStretchMax;

          varying float vTilt;
          varying float vHeat;
          varying float vSize;
          varying float vStretch;
          varying float vCycle;

          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);

            float c = cos(vTilt);
            float s = sin(vTilt);
            vec2 rotated = vec2(
              coord.x * c - coord.y * s,
              coord.x * s + coord.y * c
            );

            float aspect = mix(uStretchMin, uStretchMax, vStretch);
            rotated.x *= aspect;
            rotated.y *= mix(0.7, 1.6, vSize);

            float dist = length(rotated * vec2(1.3, 1.0));
            float alpha = smoothstep(0.5, 0.1, dist);
            if (alpha <= 0.001) discard;

            float rim = smoothstep(0.35, 0.0, dist);
            vec3 color = mix(uColorInner, uColorOuter, vHeat) * (0.6 + rim * 0.5);
            float birth = smoothstep(0.02, 0.2, vCycle);
            float fade = smoothstep(1.0, 0.65, vCycle);
            float life = birth * fade;
            gl_FragColor = vec4(color, alpha * life);
          }
        `}
      />
    </points>
  )
}
