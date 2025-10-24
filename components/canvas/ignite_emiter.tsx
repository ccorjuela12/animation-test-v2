import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Billboard, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing'

/** Emisor para GodRays + halo */
export default function IgniteEmitter({ color = '#ff7a00' }) {
  const sun = useRef<THREE.Mesh>(null)
  const [sunTarget, setSunTarget] = useState<THREE.Mesh | null>(null)

  const haloUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
    }),
    [color],
  )

  useLayoutEffect(() => {
    if (sun.current) {
      setSunTarget(sun.current)
    }
  }, [])

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
        <mesh scale={[3, 3, 1]} position={[0, 0, -0.05]}>
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

              void main(){
                vec2 p = vUv - 0.5;
                float r = length(p) * 1.8;

                float glow = exp(-5.5 * r * r);    // brillo radial suave
                glow *= smoothstep(0.9, 0.55, r);  // desvanecer borde exterior

                gl_FragColor = vec4(uColor * glow, glow);
              }
            `}
          />
        </mesh>
      </Billboard>

      {/* Luz para realzar el texto */}
      <pointLight
        color={new THREE.Color(color)}
        intensity={7.5}
        distance={16}
        decay={2}
        position={[0, 0, 0.4]}
      />

      {/* Reflejos desde el entorno */}
      <Environment resolution={768}>
        <Lightformer form="circle" color={color} intensity={3} scale={5} position={[0, 0, 5.5]} />
      </Environment>

      {/* Post-procesado */}
      {sunTarget && (
        <EffectComposer multisampling={4}>
          <GodRays
            sun={sunTarget}
            samples={40}
            density={0.92}
            decay={0.95}
            weight={0.85}
            exposure={0.32}
            clampMax={1.0}
          />
          <Bloom
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
