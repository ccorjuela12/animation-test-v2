'use client'

import * as THREE from 'three'
import { useMemo } from 'react'

type IgniteEmitterProps = {
  /** Overall scale of the billboard plane */
  scale?: number
  /** Core to edge colour ramp */
  coreColor?: string
  rimColor?: string
  /** How sharp the inner bloom is */
  coreSharpness?: number
  /** How intense the long rays are */
  rayIntensity?: number
  /** Blend factor controlling ray opacity */
  rayOpacity?: number
  /** Optional position for the emitter */
  position?: [number, number, number]
}

export default function IgniteEmitter({
  scale = 6,
  coreColor = '#ffb05c',
  rimColor = '#ff3c00',
  coreSharpness = 5,
  rayIntensity = 0.6,
  rayOpacity = 0.4,
  position = [0, 0, 0],
}: IgniteEmitterProps) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uCoreColor: { value: new THREE.Color(coreColor) },
        uRimColor: { value: new THREE.Color(rimColor) },
        uCoreSharpness: { value: coreSharpness },
        uRayIntensity: { value: rayIntensity },
        uRayOpacity: { value: rayOpacity },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv - 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform vec3 uCoreColor;
        uniform vec3 uRimColor;
        uniform float uCoreSharpness;
        uniform float uRayIntensity;
        uniform float uRayOpacity;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(27.168, 81.512))) * 43758.5453);
        }

        float rayLayer(float angle, float offset, float sharp) {
          float wrapped = abs(sin(angle * sharp + offset));
          return pow(max(0.0, 1.0 - wrapped), 4.0);
        }

        void main() {
          vec2 uv = vUv;
          uv *= 1.4;

          float r = length(uv);
          float angle = atan(uv.y, uv.x);

          float baseGlow = exp(-r * uCoreSharpness * 4.0);
          baseGlow += exp(-pow(r * uCoreSharpness * 1.8, 2.0)) * 0.8;

          float rays = 0.0;
          rays += rayLayer(angle, 0.2, 5.5) / (1.0 + r * 6.0);
          rays += rayLayer(angle, 1.57, 9.5) / (1.0 + r * 4.6);
          rays += rayLayer(angle, 2.9, 14.0) / (1.0 + r * 3.6);

          float spark =
            smoothstep(0.24, 0.0, r) *
            hash(vec2(angle * 1.7, r * 11.0 + hash(vec2(angle, r * 0.8))));
          rays += spark * 0.25;

          float rayGlow = rays * uRayIntensity * uRayOpacity;
          float glow = baseGlow + rayGlow;
          vec3 color = mix(uRimColor, uCoreColor, clamp(baseGlow * 1.5, 0.0, 1.0));
          color += uCoreColor * rayGlow * 0.8;

          float circleMask = 1.0 - smoothstep(0.35, 0.65, r);
          float vignette = circleMask * (1.0 - smoothstep(0.55, 0.9, r));
          float alpha = clamp(glow * vignette, 0.0, 1.0);
          if (alpha <= 0.002) discard;

          gl_FragColor = vec4(color * glow * vignette, alpha);
        }
      `,
    })
  }, [coreColor, rimColor, coreSharpness, rayIntensity, rayOpacity])

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
