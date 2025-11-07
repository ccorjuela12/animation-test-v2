'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vector3Tuple, Euler } from 'three'
import { GridPanelProps, GridTunnelProps, PanelType, GradientBackgroundProps } from '@/types/types'
import {vertexShaderGrid as vertexShader, fragmentShaderGrid as fragmentShader} from './utils/utils'

function GradientBackground({ position, rotation, progressRef }: GradientBackgroundProps & { progressRef: React.MutableRefObject<number> }) {
  const { viewport } = useThree()
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#0F0E0E') },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          // CSS: linear-gradient(180deg, rgba(15, 14, 14, 0.00) 0%, #0F0E0E 84.62%)
          // vUv.y is 0 at bottom, 1 at top. We want transparent at top.
          float alpha = smoothstep(1.0, 0.1538, vUv.y);
          gl_FragColor = vec4(uColor, alpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
  }, [])

  useFrame(() => {
    material.uniforms.uOpacity.value = THREE.MathUtils.clamp(progressRef.current, 0, 1)
  })

  return (
    <mesh position={position} rotation={rotation} scale={[viewport.width, viewport.height / 2, 1]}>
      <planeGeometry args={[2, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function GridPanel({
  geometry,
  position,
  rotation,
  uvScale,
  minorScale,
  panelType,
  depthAxis,
  depthFlip = false,
  lateralFlip = false,
  tunnelDepth,
  progressRef,
}: GridPanelProps) {
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTunnelDepth: { value: tunnelDepth },
        uColorNear: { value: new THREE.Color('#1a1d24') },
        uColorFar: { value: new THREE.Color('#3B3939') },
        uGridColor: { value: new THREE.Color('#5C5C5C') },
        uGlowColor: { value: new THREE.Color('#F15A24') },
        uUvScale: { value: new THREE.Vector2(uvScale[0], uvScale[1]) },
        uMinorScale: { value: new THREE.Vector2(minorScale[0], minorScale[1]) },
        uPanelType: { value: panelType },
        uDepthAxis: { value: depthAxis },
        uDepthFlip: { value: depthFlip ? 1 : 0 },
        uLateralFlip: { value: lateralFlip ? 1 : 0 },
        uOpacity: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    })

    mat.depthWrite = false
    mat.toneMapped = false
    mat.side = THREE.DoubleSide
    mat.transparent = true

    return mat
  }, [depthAxis, depthFlip, lateralFlip, minorScale, panelType, tunnelDepth, uvScale])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    material.uniforms.uOpacity.value = THREE.MathUtils.clamp(progressRef.current, 0, 1)
  })

  useEffect(() => {
    material.uniforms.uTunnelDepth.value = tunnelDepth
    material.uniforms.uPanelType.value = panelType
    material.uniforms.uDepthAxis.value = depthAxis
    material.uniforms.uDepthFlip.value = depthFlip ? 1 : 0
    material.uniforms.uLateralFlip.value = lateralFlip ? 1 : 0
    material.uniforms.uUvScale.value.set(uvScale[0], uvScale[1])
    material.uniforms.uMinorScale.value.set(minorScale[0], minorScale[1])
  }, [
    depthAxis,
    depthFlip,
    lateralFlip,
    material,
    minorScale,
    panelType,
    tunnelDepth,
    uvScale,
  ])

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      renderOrder={-5}
    />
  )
}

const TUNNEL_WIDTH = 14
const TUNNEL_HEIGHT = 7.5
const TUNNEL_DEPTH = 55

export default function GridTunnel({ progressRef }: GridTunnelProps = {}) {
  const floorGeometry = useMemo(
    () => new THREE.PlaneGeometry(TUNNEL_WIDTH, TUNNEL_DEPTH, 1, 1),
    [],
  )
  const ceilingGeometry = floorGeometry
  const leftWallGeometry = useMemo(
    () => new THREE.PlaneGeometry(TUNNEL_DEPTH, TUNNEL_HEIGHT, 1, 1),
    [],
  )
  const rightWallGeometry = leftWallGeometry
  const backWallGeometry = useMemo(
    () => new THREE.PlaneGeometry(TUNNEL_WIDTH, TUNNEL_HEIGHT, 1, 1),
    [],
  )

  useEffect(() => {
    return () => {
      floorGeometry.dispose()
      leftWallGeometry.dispose()
      backWallGeometry.dispose()
    }
  }, [backWallGeometry, floorGeometry, leftWallGeometry])

  const halfHeight = TUNNEL_HEIGHT / 2
  const halfWidth = TUNNEL_WIDTH / 2
  const halfDepth = TUNNEL_DEPTH / 2
  const groupRef = useRef<THREE.Group | null>(null)
  const internalProgressRef = useRef(0)

  useFrame((_, delta) => {
    const target = THREE.MathUtils.clamp(progressRef?.current ?? 0, 0, 1)
    const smoothing = 1 - Math.exp(-delta * 4.5)
    internalProgressRef.current += (target - internalProgressRef.current) * smoothing

    const progress = THREE.MathUtils.clamp(internalProgressRef.current, 0, 1)
    if (groupRef.current) {
      const baseZ = -1.8
      const targetZ = -4.6
      groupRef.current.position.z = THREE.MathUtils.lerp(baseZ, targetZ, progress)
      const baseScale = 1.05
      const targetScale = 2.45
      const scale = THREE.MathUtils.lerp(baseScale, targetScale, progress)
      groupRef.current.scale.setScalar(scale)
      groupRef.current.visible = progress > 0.01
    }
  })

  const panels = useMemo(
    () => [
      {
        key: 'floor',
        geometry: floorGeometry,
        position: [0, -halfHeight, -halfDepth] as Vector3Tuple,
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        uvScale: [8, 28] as [number, number],
        minorScale: [40, 150] as [number, number],
        panelType: 0 as PanelType,
        depthAxis: 1 as 0 | 1,
        tunnelDepth: TUNNEL_DEPTH,
        progressRef: internalProgressRef,
      },
      {
        key: 'ceiling',
        geometry: ceilingGeometry,
        position: [0, halfHeight, -halfDepth] as Vector3Tuple,
        rotation: new THREE.Euler(Math.PI / 2, 0, Math.PI),
        uvScale: [8, 28] as [number, number],
        minorScale: [40, 150] as [number, number],
        panelType: 1 as PanelType,
        depthAxis: 1 as 0 | 1,
        depthFlip: true,
        lateralFlip: true,
        tunnelDepth: TUNNEL_DEPTH,
        progressRef: internalProgressRef,
      },
      {
        key: 'left',
        geometry: leftWallGeometry,
        position: [-halfWidth, 0, -halfDepth] as Vector3Tuple,
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
        uvScale: [7, 28] as [number, number],
        minorScale: [36, 150] as [number, number],
        panelType: 2 as PanelType,
        depthAxis: 0 as 0 | 1,
        lateralFlip: true,
        tunnelDepth: TUNNEL_DEPTH,
        progressRef: internalProgressRef,
      },
      {
        key: 'right',
        geometry: rightWallGeometry,
        position: [halfWidth, 0, -halfDepth] as Vector3Tuple,
        rotation: new THREE.Euler(0, -Math.PI / 2, 0),
        uvScale: [7, 28] as [number, number],
        minorScale: [36, 150] as [number, number],
        panelType: 3 as PanelType,
        depthAxis: 0 as 0 | 1,
        depthFlip: true,
        tunnelDepth: TUNNEL_DEPTH,
        progressRef: internalProgressRef,
      },
      {
        key: 'back',
        geometry: backWallGeometry,
        position: [0, 0, -TUNNEL_DEPTH] as Vector3Tuple,
        rotation: new THREE.Euler(0, Math.PI, 0),
        uvScale: [9, 6] as [number, number],
        minorScale: [42, 28] as [number, number],
        panelType: 4 as PanelType,
        depthAxis: 1 as 0 | 1,
        depthFlip: true,
        tunnelDepth: TUNNEL_DEPTH,
        progressRef: internalProgressRef,
      },
    ],
    [
      backWallGeometry,
      ceilingGeometry,
      floorGeometry,
      halfDepth,
      halfHeight,
      halfWidth,
      leftWallGeometry,
      rightWallGeometry,
    ],
  )

  const { viewport } = useThree()
  const glowRef = useRef<THREE.Mesh | null>(null)
  const glowPositions: Array<[number, number, number]> = [[viewport.width * 0.8, 0, 0], [viewport.width * -0.8, 0, 0], [0, -3, 0], [0, 3, 0]]

  const glowTexture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) {
      return null
    }

    const gradient = context.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(241,90,36,1)')
    gradient.addColorStop(1, 'rgba(241,90,36,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)

    const gradientTexture = new THREE.CanvasTexture(canvas)
    gradientTexture.wrapS = THREE.ClampToEdgeWrapping
    gradientTexture.wrapT = THREE.ClampToEdgeWrapping
    gradientTexture.needsUpdate = true
    return gradientTexture
  }, [])

  return (
    <>
      <group ref={groupRef} position={[0, 0, -1.8]}>
        <GradientBackground position={[0, viewport.height * -0.45, 0]} progressRef={internalProgressRef} />
        <GradientBackground position={[0, viewport.height * 0.40, 0]} rotation={[0, 0, -3.15]} progressRef={internalProgressRef} />
        {panels.map((panel) => (
          <GridPanel
            key={panel.key}
            geometry={panel.geometry}
            position={panel.position}
            rotation={panel.rotation}
            uvScale={panel.uvScale}
            minorScale={panel.minorScale}
            panelType={panel.panelType}
            depthAxis={panel.depthAxis}
            depthFlip={panel.depthFlip}
            lateralFlip={panel.lateralFlip}
            tunnelDepth={panel.tunnelDepth}
            progressRef={panel.progressRef}
          />
        ))}
        {glowTexture && (
          glowPositions.map((glowPosition, index) =>(
            <mesh
              key={index}
              ref={glowRef}
              position={glowPosition}
              rotation={[0, 0, 0]}
              // scale={[4, 6,1]}
              scale={index < 1 ? [4, 6, 1] : [4, 6,1]}
              renderOrder={5}
            >
              <planeGeometry args={[2, 1]} />
              <meshBasicMaterial
                map={glowTexture}
                transparent
                opacity={0.12}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))
        )}
      </group>
    </>
  )
}
