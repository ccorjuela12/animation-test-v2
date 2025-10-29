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
// import IgniteEmitter from './ignite_emiter'
import BackgroundTexture from './background_texture'
import SliderProjects from './SliderProjects'
import IgniteEmitter from './ignite_emiter'

gsap.registerPlugin(ScrollTrigger)

const ROTATION_RANGE = Math.PI / 4

type SceneProps = {
  rotationTarget: MutableRefObject<number>
  logoVisibility: MutableRefObject<number>
  sliderReveal: MutableRefObject<number>
  sliderActive: MutableRefObject<number>
}

function Scene({ rotationTarget, logoVisibility, sliderReveal, sliderActive }: SceneProps) {
  const groupRef = useRef<Group>(null)
  const logoRef = useRef<Mesh>(null)
  const smoothedLogo = useRef(1)

  useFrame((_, delta) => {
    const activeAmount = MathUtils.clamp(sliderActive.current, 0, 1)

    if (groupRef.current) {
      const rotationBlend = MathUtils.lerp(0.075, 0.02, activeAmount)
      groupRef.current.rotation.y = MathUtils.lerp(
        groupRef.current.rotation.y,
        rotationTarget.current,
        rotationBlend,
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
      <BackgroundTexture />
      <group ref={groupRef}>
        <ModelText />
      </group>
      <Center position={[0, 0.1, -0.4]}>
        <DreiImage ref={logoRef} url="/logo.png" transparent opacity={1} scale={[5, 1]} />
      </Center>
      <SliderProjects revealRef={sliderReveal} activeRef={sliderActive} />
    </>
  )
}

type AnimationCanvasProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>
  sliderRevealRef?: MutableRefObject<number>
  logoVisibilityRef?: MutableRefObject<number>
  sliderActiveRef?: MutableRefObject<number>
}

export default function AnimationCanvas({
  containerRef,
  sliderRevealRef,
  logoVisibilityRef,
  sliderActiveRef,
}: AnimationCanvasProps) {
  const rotationTarget = useRef(0)
  const internalSliderReveal = useRef(0)
  const internalLogoVisibility = useRef(1)
  const internalSliderActive = useRef(0)
  const sliderReveal = sliderRevealRef ?? internalSliderReveal
  const logoVisibility = logoVisibilityRef ?? internalLogoVisibility
  const sliderActive = sliderActiveRef ?? internalSliderActive
  const usingExternalSlider = Boolean(sliderRevealRef)
  const usingExternalLogo = Boolean(logoVisibilityRef)

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
          const activeAmount = MathUtils.clamp(sliderActive.current, 0, 1)
          const maxRange = ROTATION_RANGE * (1 - 0.45 * activeAmount)
          rotationTarget.current = gsap.utils.mapRange(0, 1, 0, maxRange, progress)

          if (!usingExternalSlider) {
            sliderReveal.current = progress
          }

          if (!usingExternalLogo) {
            logoVisibility.current = 1 - progress
          }
        },
      })
    }, containerRef)

    return () => {
      ctx.revert()
      gsap.ticker.remove(updateLenis)
      lenis.off('scroll', updateScrollTrigger)
      lenis.destroy()
    }
  }, [
    containerRef,
    logoVisibility,
    sliderActive,
    sliderReveal,
    usingExternalLogo,
    usingExternalSlider,
  ])

  return (
    <Canvas camera={{ position: [0, 0.1, 2.15] }} className="h-full w-full">
      <Suspense fallback={null}>
        <Scene
          rotationTarget={rotationTarget}
          logoVisibility={logoVisibility}
          sliderReveal={sliderReveal}
          sliderActive={sliderActive}
        />
        {/* <IgniteEmitter visibilityRef={logoVisibility} /> */}
      </Suspense>
    </Canvas>
  )
}
