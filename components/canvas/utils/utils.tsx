'use client'

import { JSX, useEffect, useMemo } from 'react'
import * as THREE from 'three'

type GroupProps = JSX.IntrinsicElements['group']

type RoundedVideoPlaneProps = GroupProps & {
  width?: number
  height?: number
  radius?: number
  map?: THREE.Texture | null
  borderColor?: string
  borderSize?: number
  borderFeather?: number
  opacity?: number
}

export function RoundedVideoPlane({
  width = 1,
  height = 0.5,
  radius = 0.05,
  map,
  borderColor = '#ffffff',
  borderSize = 0.12,
  borderFeather = 0.02,
  opacity = 1,
  ...props
}: RoundedVideoPlaneProps) {
  const geometry = useMemo<THREE.ShapeGeometry>(() => {
    const shape = new THREE.Shape()
    const hw = width / 2
    const hh = height / 2
    const r = Math.min(radius, hw, hh)
    shape.moveTo(-hw + r, -hh)
    shape.lineTo(hw - r, -hh)
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r)
    shape.lineTo(hw, hh - r)
    shape.quadraticCurveTo(hw, hh, hw - r, hh)
    shape.lineTo(-hw + r, hh)
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r)
    shape.lineTo(-hw, -hh + r)
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
    const plane = new THREE.ShapeGeometry(shape, 32)
    const uv = plane.attributes.uv
    const pos = plane.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const u = (x + width / 2) / width
      const v = (y + height / 2) / height
      uv.setXY(i, u, v)
    }
    uv.needsUpdate = true
    return plane
  }, [width, height, radius])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  const borderTexture = useMemo<THREE.CanvasTexture | null>(() => {
    const ratio = THREE.MathUtils.clamp(borderSize, 0, 1)
    if (ratio <= 0) return null
    if (typeof document === 'undefined') return null
    const feather = THREE.MathUtils.clamp(borderFeather, 0, ratio)
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const gradient = ctx.createLinearGradient(0, 0, 0, size)
    const start = 1 - ratio
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(start, 'rgba(255,255,255,0)')
    if (feather > 0) {
      gradient.addColorStop(Math.min(1, start + feather), 'rgba(255,255,255,1)')
    } else {
      gradient.addColorStop(start, 'rgba(255,255,255,1)')
    }
    gradient.addColorStop(1, 'rgba(255,255,255,1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
  }, [borderSize, borderFeather])

  useEffect(() => {
    return () => {
      borderTexture?.dispose()
    }
  }, [borderTexture])

  return (
    <group {...props}>
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial
          map={map}
          toneMapped={false}
          transparent={opacity < 1}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {borderTexture && (
        <mesh geometry={geometry} position={[0, 0, 0.0001]} renderOrder={2}>
          <meshBasicMaterial
            color={borderColor}
            toneMapped={false}
            transparent
            alphaMap={borderTexture}
            depthWrite={false}
            opacity={opacity}
            side={THREE.FrontSide}
          />
        </mesh>
      )}
    </group>
  )
}


//shaders
export const vertexShaderGrid = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const fragmentShaderGrid = /* glsl */`
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
  uniform float uOpacity;

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

    color *= uOpacity;
    gl_FragColor = vec4(color, uOpacity);
  }
`