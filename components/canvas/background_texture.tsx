import { useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import { useTexture, Environment } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { BackgroundTextureProps } from '@/types/types'

export default function BackgroundTexture({ sliderReveal, glowReveal, hideProgress }: BackgroundTextureProps) {
  const { viewport, camera, scene } = useThree()
  const texture = useTexture('/BG.png')
  const glowRef = useRef<THREE.Mesh | null>(null)
  const glowSecondaryRef = useRef<THREE.Mesh | null>(null)
  const smoothedReveal = useRef(0)
  const smoothedHide = useRef(0)
  const planeRef = useRef<THREE.Mesh | null>(null)

  const envTexture = texture.clone()
  envTexture.mapping = THREE.EquirectangularReflectionMapping

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

  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 6)
    const revealTarget = Math.max(sliderReveal.current, glowReveal?.current ?? 0)
    smoothedReveal.current += (revealTarget - smoothedReveal.current) * smoothing
    const hideTarget = THREE.MathUtils.clamp(hideProgress?.current ?? 0, 0, 1)
    const hideSmoothing = 1 - Math.exp(-delta * 4.5)
    smoothedHide.current += (hideTarget - smoothedHide.current) * hideSmoothing
    const visibleFactor = THREE.MathUtils.clamp(1 - smoothedHide.current, 0, 1)
    const baseIntensity = THREE.MathUtils.smoothstep(smoothedReveal.current, 0.05, 0.95)
    const intensity = baseIntensity * visibleFactor

    if (planeRef.current) {
      const material = planeRef.current.material as THREE.MeshBasicMaterial | undefined
      if (material) {
        material.opacity = visibleFactor
        material.transparent = true
        material.needsUpdate = true
      }
      planeRef.current.visible = visibleFactor > 0.02
    }

    scene.environment = visibleFactor > 0.02 ? envTexture : null

    const updateGlow = (mesh: THREE.Mesh | null, baseScale: number, opacityScale = 0.4) => {
      if (!mesh) {
        return
      }

      const material = mesh.material as THREE.MeshBasicMaterial | undefined
      if (material) {
        material.opacity = opacityScale * intensity
        material.needsUpdate = true
      }

      mesh.visible = intensity > 0.02
      const scale = baseScale * THREE.MathUtils.lerp(0.85, 1.1, intensity)
      mesh.scale.set(scale, scale, 1)
    }

    updateGlow(glowRef.current, 6.5, 0.18)
    updateGlow(glowSecondaryRef.current, 10.8, 0.16)
  })

  const planePositionZ = -20
  const distance = camera.position.z - planePositionZ
  const backgroundScale = distance / camera.position.z
  const glowPosition: [number, number, number] = [viewport.width * 0.9, 0, -2.5]
  const glowSecondaryPosition: [number, number, number] = [-viewport.width * 0.8, -3.95, -2.5]

  return (
    <>
      <Environment map={envTexture} background={false} />

      <mesh
        ref={planeRef}
        position={[0, 0, planePositionZ]}
        scale={[viewport.width * backgroundScale, viewport.height * backgroundScale, 1]}
        visible={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} color="gray" toneMapped={false} transparent opacity={0} />
      </mesh>

      {glowTexture && (
        <mesh ref={glowRef} position={glowPosition} rotation={[0, 0, 0]} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glowTexture}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      
      {glowTexture && (
        <mesh
          ref={glowSecondaryRef}
          position={glowSecondaryPosition}
          rotation={[0, 0, 0]}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glowTexture}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  )
}
