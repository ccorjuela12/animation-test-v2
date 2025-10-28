"use client"

import { Suspense, useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils, type Group, type Material, type Mesh } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Center, Image as DreiImage } from '@react-three/drei'
import ModelText from './model_text'
import IgniteEmitter from './ignite_emiter'
import BackgroundTexture from './background_texture'
import SliderProjects from './SliderProjects'

gsap.registerPlugin(ScrollTrigger)

export const HERO_SCROLL_MARKS = {
  primaryLeft: { start: 0.12, span: 0.32 },
  primaryRight: { start: 0.18, span: 0.32 },
  secondaryLeft: { start: 0.38, span: 0.28 },
  secondaryRight: { start: 0.44, span: 0.28 },
  primaryFadeStart: 0.6,
  primaryFadeEnd: 0.74,
  sliderRevealStart: 0.74,
  sliderRevealEnd: 0.95,
} as const

const ROTATION_RANGE = Math.PI / 4

type SceneProps = {
  rotationTarget: MutableRefObject<number>
  logoVisibility: MutableRefObject<number>
  sliderReveal: MutableRefObject<number>
}

function Scene({ rotationTarget, logoVisibility, sliderReveal }: SceneProps) {
  const groupRef = useRef<Group>(null)
  const logoRef = useRef<Mesh>(null)
  const smoothedLogo = useRef(1)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = MathUtils.lerp(
        groupRef.current.rotation.y,
        rotationTarget.current,
        0.075,
      )
    }

    const targetVisibility = MathUtils.clamp(logoVisibility.current, 0, 1)
    const smoothing = 1 - Math.exp(-delta * 6)
    smoothedLogo.current += (targetVisibility - smoothedLogo.current) * smoothing
    const visibility = MathUtils.clamp(smoothedLogo.current, 0, 1)

    if (logoRef.current && logoRef.current.material) {
      const materials = Array.isArray(logoRef.current.material)
        ? (logoRef.current.material as Material[])
        : [logoRef.current.material as Material]

      materials.forEach((material) => {
        material.transparent = true
        material.opacity = visibility
        material.needsUpdate = true
      })

      logoRef.current.visible = visibility > 0.04
    }
  })

  return (
    <>
      <group ref={groupRef}>
        <BackgroundTexture />
        <ModelText />
      </group>
      <Center position={[0, 0.1, -0.4]}>
        <DreiImage ref={logoRef} url="/logo.png" transparent opacity={1} scale={[5, 1]} />
      </Center>
      <SliderProjects revealRef={sliderReveal} />
    </>
  )
}

type AnimationCanvasProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>
}

export default function AnimationCanvas({ containerRef }: AnimationCanvasProps) {
  const rotationTarget = useRef(0)
  const logoVisibility = useRef(1)
  const sliderReveal = useRef(0)
  const emitterVisibility = useRef(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    })

    const updateScrollTrigger = () => {
      ScrollTrigger.update()
    }

    lenis.on('scroll', updateScrollTrigger)

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(updateLenis)

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const progress = MathUtils.clamp(self.progress, 0, 1)
          rotationTarget.current = gsap.utils.mapRange(0, 1, 0, ROTATION_RANGE, progress)

          const sliderPhase = gsap.utils.clamp(
            0,
            1,
            gsap.utils.normalize(
              HERO_SCROLL_MARKS.sliderRevealStart,
              HERO_SCROLL_MARKS.sliderRevealEnd,
              progress,
            ),
          )

          sliderReveal.current = sliderPhase
          logoVisibility.current = 1 - sliderPhase
        },
      })
    }, containerRef)

    return () => {
      ctx.revert()
      gsap.ticker.remove(updateLenis)
      lenis.off('scroll', updateScrollTrigger)
      lenis.destroy()
    }
  }, [containerRef])

  return (
    <Canvas camera={{ position: [0, 0.1, 2.15] }} className="h-full w-full">
      <Suspense fallback={null}>
        <Scene
          rotationTarget={rotationTarget}
          logoVisibility={logoVisibility}
          sliderReveal={sliderReveal}
        />
        {/* <IgniteEmitter visibilityRef={emitterVisibility} /> */}
      </Suspense>
    </Canvas>
  )
}
