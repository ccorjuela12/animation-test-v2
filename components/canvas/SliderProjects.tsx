'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVideoTexture } from '@react-three/drei'
import * as THREE from 'three'
import { RoundedVideoPlane } from './utils/utils'

const CARD_COUNT = 6
const CARD_GAP = 1.6
const CARD_WIDTH = 1
const CARD_HEIGHT = 0.56
const CARD_RADIUS = 0.06

type SliderProjectsProps = {
  revealRef: MutableRefObject<number>
}

export default function SliderProjects({ revealRef }: SliderProjectsProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const animatedRevealRef = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return
    }

    const target = THREE.MathUtils.clamp(revealRef.current, 0, 1)
    const smoothing = 1 - Math.exp(-delta * 6)
    animatedRevealRef.current += (target - animatedRevealRef.current) * smoothing
    const reveal = THREE.MathUtils.smoothstep(animatedRevealRef.current, 0, 1)

    const slideX = THREE.MathUtils.lerp(2.4, -0.4, reveal)
    const slideZ = THREE.MathUtils.lerp(-1.2, -0.25, reveal)
    const slideY = THREE.MathUtils.lerp(-0.05, 0, reveal)
    const rotation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-12, 0, reveal))

    groupRef.current.visible = reveal > 0.02
    groupRef.current.position.set(slideX, slideY, slideZ)
    groupRef.current.rotation.y = rotation

    groupRef.current.children.forEach((child, index) => {
      const card = child as THREE.Group
      const orderDelay = reveal - index * 0.09
      const cardReveal = THREE.MathUtils.clamp(orderDelay, 0, 1)
      const cardOpacity = THREE.MathUtils.smoothstep(cardReveal, 0, 1)

      card.visible = cardOpacity > 0.02
      card.children.forEach((mesh) => {
        if (!(mesh instanceof THREE.Mesh)) {
          return
        }

        const material = mesh.material
        const applyOpacity = (mat: THREE.Material) => {
          mat.transparent = true
          mat.opacity = cardOpacity
          mat.needsUpdate = true
        }

        if (Array.isArray(material)) {
          material.forEach(applyOpacity)
        } else if (material) {
          applyOpacity(material)
        }
      })
    })
  })

  const cards = useMemo(
    () =>
      Array.from({ length: CARD_COUNT }, (_, index) => {
        const offset = (index - (CARD_COUNT - 1) / 2) * CARD_GAP
        return { offset, index }
      }),
    [],
  )

  return (
    <group ref={groupRef}>
      {cards.map(({ offset, index }) => (
        <SliderCard key={index} positionX={offset} />
      ))}
    </group>
  )
}

type SliderCardProps = {
  positionX: number
}

function SliderCard({ positionX }: SliderCardProps) {
  const cardRef = useRef<THREE.Group | null>(null)
  const texture = useVideoTexture(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    {
      muted: true,
      loop: true,
      
    },
  )

  useEffect(() => {
    if (!texture) {
      return
    }

    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.generateMipmaps = false
  }, [texture])

  useEffect(() => {
    if (!cardRef.current) {
      return
    }

    cardRef.current.visible = false
  }, [])

  return (
    <group ref={cardRef} position={[positionX, 0, 0]} renderOrder={3}>
      <RoundedVideoPlane
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        radius={CARD_RADIUS}
        map={texture}
        borderColor="#00bcd4"
        borderSize={0.12}
        borderFeather={0.012}
      />
    </group>
  )
}
