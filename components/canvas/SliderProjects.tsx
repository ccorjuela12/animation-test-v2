'use client'

import * as THREE from 'three'
import { JSX, Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ScrollControls, useScroll, useVideoTexture } from '@react-three/drei'
import type { Group } from 'three'
import { RoundedVideoPlane } from './utils/utils'

const CARD_COUNT = 6
const CARD_GAP = 1.6

type CardsProps = {
  count?: number
  gap?: number
}

type GroupProps = JSX.IntrinsicElements['group']

type VideoCardProps = GroupProps & {
  width?: number
  height?: number
  radius?: number
  borderColor?: string
  borderSize?: number
  borderFeather?: number
}

export default function SliderProjects() {
  const pages = Math.max(1, CARD_COUNT / 2)

  return (
    <Cards count={CARD_COUNT} gap={CARD_GAP} />
  )
}

function Cards({ count = CARD_COUNT, gap = CARD_GAP }: CardsProps) {
  const ref = useRef<Group | null>(null)
  const scroll = useScroll()
  const totalWidth = (count - 1) * gap
  const centerOffset = totalWidth / 2

  useFrame(() => {
    if (!ref.current) {
      return
    }

    ref.current.position.x = -scroll.offset * totalWidth
  })

  return (
    <group ref={ref}>
      {Array.from({ length: count }, (_, index) => (
        <VideoCard
          key={index}
          position={[index * gap - centerOffset, 0, 0]}
        />
      ))}
    </group>
  )
}

function VideoCard({
  width = 1,
  height = 0.5,
  radius = 0.05,
  borderColor = '#00bcd4',
  borderSize = 0.12,
  borderFeather = 0.015,
  ...props
}: VideoCardProps) {
  const texture = useVideoTexture('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', {
    muted: true,
    loop: true,
  })

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

  return (
    <RoundedVideoPlane
      {...props}
      width={width}
      height={height}
      radius={radius}
      map={texture}
      borderColor={borderColor}
      borderSize={borderSize}
      borderFeather={borderFeather}
    />
  )
}
