import { useRef } from 'react'
import type { MutableRefObject, JSX } from 'react'
import { MathUtils, Group, type MeshPhysicalMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import { Center, MeshTransmissionMaterial, MeshTransmissionMaterialProps, Text3D } from '@react-three/drei'

type GroupProps = JSX.IntrinsicElements['group']

type ModelTextProps = GroupProps & {
  animationProgressRef: MutableRefObject<number>
  text?: string
  size?: number
  position?: [number, number, number]
  scaleRange?: [number, number]
  fadeSpeed?: number
}

export default function ModelText({
  animationProgressRef,
  text = 'AI',
  size = 1.65,
  position = [0, 0.18, -0.2],
  scaleRange = [1, 1.85],
  fadeSpeed = 6,
  ...groupProps
}: ModelTextProps) {
  const groupRef = useRef<Group | null>(null)
  const materialRef = useRef<MeshTransmissionMaterialProps | null>(null)
  const smoothedProgress = useRef(0)

  useFrame((_, delta) => {
    const target = MathUtils.clamp(animationProgressRef.current, 0, 1)
    const smoothing = 1 - Math.exp(-delta * fadeSpeed)
    smoothedProgress.current += (target - smoothedProgress.current) * smoothing

    const scale = MathUtils.lerp(scaleRange[0], scaleRange[1], smoothedProgress.current)
    const opacity = MathUtils.clamp(1 - smoothedProgress.current, 0, 1)

    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale)
      groupRef.current.visible = opacity > 0.01
    }

    if (materialRef.current) {
      materialRef.current.transparent = true
      materialRef.current.opacity = opacity
      materialRef.current.needsUpdate = true
    }
  })

  return (
    <group ref={groupRef} {...groupProps}>
      {/* Keep the logo visible through the text using a transmissive glass material. */}
      <Center position={position}>
        <Text3D
          font="/unison_bold.json"
          size={size}
          height={0.25}
          bevelEnabled
          bevelSize={0.02}
          bevelThickness={0.03}
          curveSegments={24}
        >
          {text}
          <MeshTransmissionMaterial
            ref={materialRef}
            transparent
            opacity={1}
            anisotropy={0.25}
            chromaticAberration={0.02}
            distortion={0.05}
            distortionScale={0.5}
            ior={1.5}
            roughness={0.08}
            samples={16}
            thickness={0.75}
            temporalDistortion={0.1}
            color="#b7f3ff"
          />
        </Text3D>
      </Center>
    </group>
  )
}
