'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVideoTexture } from '@react-three/drei'
import * as THREE from 'three'
import { RoundedVideoPlane } from './utils/utils'

const CARD_SOURCES: string[] = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
]

const CARD_COUNT = CARD_SOURCES.length
const CARD_GAP = 2
const CARD_WIDTH = 1.45
const CARD_HEIGHT = 0.75 
const CARD_RADIUS = 0.08

type SliderProjectsProps = {
  revealRef: MutableRefObject<number>
  activeRef?: MutableRefObject<number>
}

export default function SliderProjects({ revealRef, activeRef }: SliderProjectsProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const animatedRevealRef = useRef(0)
  const animatedIndexRef = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return
    }

    const activeProgress = THREE.MathUtils.clamp(activeRef?.current ?? 0, 0, 1)
    const baseReveal = THREE.MathUtils.clamp(revealRef.current, 0, 1)
    const targetReveal = THREE.MathUtils.clamp(baseReveal, 0, 1)
    const smoothing = 1 - Math.exp(-delta * 6)
    animatedRevealRef.current += (targetReveal - animatedRevealRef.current) * smoothing
    const reveal = THREE.MathUtils.smoothstep(animatedRevealRef.current, 0, 1)

    const maxIndex = Math.max(CARD_COUNT - 1, 1)
    const extendedProgress = THREE.MathUtils.smoothstep(activeProgress, 0, 1)
    const targetIndex = extendedProgress * maxIndex + THREE.MathUtils.lerp(0, 1.1, activeProgress ** 1.25)
    animatedIndexRef.current += (targetIndex - animatedIndexRef.current) * smoothing
    const scrollIndex = animatedIndexRef.current

    const slideX = THREE.MathUtils.lerp(16, 0, reveal)
    const slideZ = THREE.MathUtils.lerp(1.8, 0.7, reveal)
    const slideY = THREE.MathUtils.lerp(-0.05, 0.12, reveal)
    const rotation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-18, 0, reveal))
    const scale = THREE.MathUtils.lerp(1.65, 1.35, reveal)
    const fadeOut = 1 - THREE.MathUtils.smoothstep(activeProgress, 0.84, 1)

    groupRef.current.visible = reveal > 0.02 && fadeOut > 0.01
    groupRef.current.position.set(slideX, slideY, slideZ)
    groupRef.current.rotation.y = rotation
    groupRef.current.scale.setScalar(scale)
    groupRef.current.renderOrder = 20

    groupRef.current.children.forEach((child, index) => {
      const card = child as THREE.Group
      const orderDelay = reveal - index * 0.09
      const cardReveal = THREE.MathUtils.clamp(orderDelay, 0, 1)
      const cardOpacity = THREE.MathUtils.smoothstep(cardReveal, 0, 1) * fadeOut
      const relative = index - scrollIndex

      card.visible = cardOpacity > 0.02
      card.position.x = relative * CARD_GAP
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

  const cards = useMemo(() => CARD_SOURCES.map((src, index) => ({ index, src })), [])

  return (
    <group ref={groupRef}>
      {cards.map(({ index, src }) => (
        <SliderCard key={index} videoSrc={src} />
      ))}
    </group>
  )
}

type SliderCardProps = {
  videoSrc: string
}

function SliderCard({ videoSrc }: SliderCardProps) {
  const cardRef = useRef<THREE.Group | null>(null)
  const texture = useVideoTexture(
    videoSrc,
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
    <group ref={cardRef} position={[0, 0, 0]} renderOrder={30}>
      <RoundedVideoPlane
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        radius={CARD_RADIUS}
        map={texture}
        borderColor="#FF4000"
        borderSize={0.01}
        borderFeather={0.012}
      />
    </group>
  )
}
