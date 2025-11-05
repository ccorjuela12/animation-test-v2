'use client'

import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vector3Tuple, Euler } from 'three'

const vertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */`
  precision highp float;

  varying vec2 vUv;
  varying vec3 vWorld;

  uniform float uTime;
  uniform float uTunnelDepth;
  uniform vec3 uColorNear;
  uniform vec3 uColorFar;
  uniform vec3 uGridColor;
  uniform vec3 uGlowColor;
  uniform vec2 uUvScale;
  uniform vec2 uMinorScale;
  uniform float uPanelType;
  uniform float uDepthAxis;
  uniform float uDepthFlip;
  uniform float uLateralFlip;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float gridLines(vec2 uv, vec2 scale, float widen) {
    vec2 scaled = uv * scale;
    vec2 g = abs(fract(scaled) - 0.5);
    float d = min(g.x, g.y);
    float fw = fwidth(d) * widen + 1e-5;
    return 1.0 - smoothstep(fw, fw * 2.0, d);
  }

  void main() {
    float depthCoord = (uDepthAxis < 0.5) ? vUv.x : vUv.y;
    float lateralCoord = (uDepthAxis < 0.5) ? vUv.y : vUv.x;
    if (uDepthFlip > 0.5) depthCoord = 1.0 - depthCoord;
    if (uLateralFlip > 0.5) lateralCoord = 1.0 - lateralCoord;

    float tunnelDepth = max(uTunnelDepth, 0.0001);
    float depth = clamp(-vWorld.z / tunnelDepth, 0.0, 1.0);

    float nearAmount = pow(1.0 - depth, 1.45);
    vec3 base = mix(uColorFar, uColorNear, nearAmount);

    float sideShadow = smoothstep(0.0, 0.9, abs(lateralCoord - 0.5) * 1.5);
    base *= mix(1.05, 0.35, sideShadow);

    if (uPanelType < 0.5) {
      float centerGlow = exp(-pow((lateralCoord - 0.5) * 3.4, 2.0));
      base += uGlowColor * centerGlow * pow(1.0 - depth, 2.3) * 0.45;
    } else if (uPanelType < 1.5) {
      float ceilingShade = smoothstep(0.0, 0.6, abs(lateralCoord - 0.5) * 1.8);
      base *= mix(0.95, 0.4, ceilingShade);
    } else if (uPanelType > 3.5) {
      float vign = smoothstep(0.0, 0.85, depthCoord * (1.0 - depthCoord) * 4.0);
      base *= mix(0.75, 0.25, vign);
    }

    vec2 gridUv = vec2(lateralCoord, depthCoord);
    float major = gridLines(gridUv, uUvScale, 0.7);
    float minor = gridLines(gridUv, uMinorScale, 0.9);
    float gridValue = clamp(major + minor * 0.35, 0.0, 1.2);
    if (uPanelType > 3.5) {
      gridValue *= 0.25;
    }

    vec3 color = base + uGridColor * gridValue * (0.7 - depth * 0.35);

    float depthGlow = pow(1.0 - depth, 3.0);
    color += uGlowColor * depthGlow * 0.12;

    if (uPanelType > 1.5 && uPanelType < 2.5) {
      float smear = smoothstep(0.0, 0.28, depthCoord);
      float scatter = smoothstep(0.75, 0.2, lateralCoord);
      float staticGlow = smear * scatter;
    } else if (uPanelType > 2.5 && uPanelType < 3.5) {
      float rim = smoothstep(0.2, 0.0, abs(lateralCoord - 0.5));
      color += uGlowColor * rim * pow(1.0 - depth, 2.2) * 0.2;
    }

    float scan = sin(depth * 160.0 - uTime * 6.0) * 0.015;
    color += uGlowColor * scan * 0.15;

    float fog = smoothstep(0.55, 1.0, depth);
    color = mix(color, uColorFar * 0.3, fog * 0.65);

    float vignette = smoothstep(0.65, 1.1, depth) * 0.2;
    color *= 1.0 - vignette;

    color = mix(color, uColorFar, clamp(depth * 0.35, 0.0, 0.35));

    gl_FragColor = vec4(color, 1.0);
  }
`

type PanelType = 0 | 1 | 2 | 3 | 4

type GridPanelProps = {
  geometry: THREE.PlaneGeometry
  position: Vector3Tuple
  rotation: Euler
  uvScale: [number, number]
  minorScale: [number, number]
  panelType: PanelType
  depthAxis: 0 | 1
  depthFlip?: boolean
  lateralFlip?: boolean
  tunnelDepth: number
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
}: GridPanelProps) {
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTunnelDepth: { value: tunnelDepth },
        uColorNear: { value: new THREE.Color('#1a1d24') },
        uColorFar: { value: new THREE.Color('#020203') },
        uGridColor: { value: new THREE.Color('#a2a3a7') },
        uGlowColor: { value: new THREE.Color('#020203') },
        uUvScale: { value: new THREE.Vector2(uvScale[0], uvScale[1]) },
        uMinorScale: { value: new THREE.Vector2(minorScale[0], minorScale[1]) },
        uPanelType: { value: panelType },
        uDepthAxis: { value: depthAxis },
        uDepthFlip: { value: depthFlip ? 1 : 0 },
        uLateralFlip: { value: lateralFlip ? 1 : 0 },
      },
      vertexShader,
      fragmentShader,
    })

    mat.depthWrite = false
    mat.toneMapped = false
    mat.side = THREE.DoubleSide

    return mat
  }, [depthAxis, depthFlip, lateralFlip, minorScale, panelType, tunnelDepth, uvScale])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
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

export default function GridTunnel() {
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

  return (
    <group position={[0, 0, -1.8]}>
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
        />
      ))}
    </group>
  )
}
