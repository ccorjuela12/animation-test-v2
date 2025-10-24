import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing'
import gsap from 'gsap'
import { BloomEffect, EffectComposer as EffectComposerImpl, GodRaysEffect } from 'postprocessing'

/** Emisor para GodRays + halo */
type IgniteEmitterProps = {
  color?: string
  visibilityRef?: MutableRefObject<number>
}

export default function IgniteEmitter({ color = '#ff7a00', visibilityRef }: IgniteEmitterProps) {
  const sun = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const pointLight = useRef<THREE.PointLight>(null)
  const lightformer = useRef<(THREE.Mesh & { intensity: number }) | null>(null)
  const composer = useRef<EffectComposerImpl | null>(null)
  const godRaysEffect = useRef<GodRaysEffect | null>(null)
  const bloomEffect = useRef<BloomEffect | null>(null)
  const [sunTarget, setSunTarget] = useState<THREE.Mesh | null>(null)
  const animatedState = useRef({
    intro: 0,
    visibility: 0,
  })

  const haloUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uAlpha: { value: 0 },
    }),
    [color],
  )

  useLayoutEffect(() => {
    if (sun.current) {
      setSunTarget(sun.current)
    }
  }, [])

  useEffect(() => {
    animatedState.current.intro = 0
    animatedState.current.visibility = 0
    const tween = gsap.to(animatedState.current, {
      intro: 1,
      duration: 1.2,
      ease: 'power3.out',
    })

    return () => {
      tween.kill()
    }
  }, [])

  useFrame((_, delta) => {
    const targetVisibility = THREE.MathUtils.clamp(visibilityRef?.current ?? 1, 0, 1)
    const smoothing = 1 - Math.exp(-delta * 6)
    animatedState.current.visibility += (targetVisibility - animatedState.current.visibility) * smoothing

    const composite = THREE.MathUtils.clamp(
      animatedState.current.intro * animatedState.current.visibility,
      0,
      1,
    )

    const scaledHalo = THREE.MathUtils.lerp(0.1, 3, composite)
    if (halo.current) {
      halo.current.scale.set(scaledHalo, scaledHalo, 1)
    }

    if (sun.current) {
      const material = sun.current.material as THREE.MeshBasicMaterial | undefined
      if (material) {
        material.opacity = composite * 0.45
      }
      sun.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, composite))
    }

    if (pointLight.current) {
      pointLight.current.intensity = 7.5 * composite
    }

    if (lightformer.current) {
      lightformer.current.intensity = 3 * composite
    }

    if (composer.current) {
      composer.current.enabled = composite > 0.01
    }

    if (godRaysEffect.current) {
      godRaysEffect.current.weight = 0.85 * composite
      godRaysEffect.current.exposure = 0.32 * composite
    }

    if (bloomEffect.current) {
      bloomEffect.current.intensity = 0.3 * composite
    }

    haloUniforms.uAlpha.value = composite
  })

  return (
    <>
      {/* Nucleo casi invisible que alimenta los GodRays */}
      <mesh ref={sun} position={[0, 0, 0]}>
        <sphereGeometry args={[0.06, 32, 32]} />
        <meshBasicMaterial
          color={color}
          toneMapped={false}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {/* Halo aditivo sin rayos */}
      <Billboard>
        <mesh ref={halo} scale={[0.1, 0.1, 1]} position={[0, 0, -0.05]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            uniforms={haloUniforms}
            vertexShader={/* glsl */`
              varying vec2 vUv;
              void main(){
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
              }
            `}
            fragmentShader={/* glsl */`
              varying vec2 vUv;
              uniform vec3 uColor;
              uniform float uAlpha;

              void main(){
                vec2 p = vUv - 0.5;
                float r = length(p) * 1.8;

                float glow = exp(-5.5 * r * r);    // brillo radial suave
                glow *= smoothstep(0.9, 0.55, r);  // desvanecer borde exterior

                float alpha = glow * uAlpha;
                gl_FragColor = vec4(uColor * glow * uAlpha, alpha);
              }
            `}
          />
        </mesh>
      </Billboard>

      {/* Luz para realzar el texto */}
      <pointLight
        ref={pointLight}
        color={new THREE.Color(color)}
        intensity={7.5}
        distance={16}
        decay={2}
        position={[0, 0, 0.4]}
      />

      {/* Reflejos desde el entorno */}
      <Environment resolution={768}>
        <Lightformer
          ref={lightformer}
          form="circle"
          color={color}
          intensity={3}
          scale={5}
          position={[0, 0, 5.5]}
        />
      </Environment>

      {/* Post-procesado */}
      {sunTarget && (
        <EffectComposer ref={composer} multisampling={4}>
          <GodRays
            ref={godRaysEffect}
            sun={sunTarget}
            samples={40}
            density={0.92}
            decay={0.95}
            weight={0.85}
            exposure={0.32}
            clampMax={1.0}
          />
          <Bloom
            ref={bloomEffect}
            intensity={0.3}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.1}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  )
}
