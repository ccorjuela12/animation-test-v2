"use client"

import { Suspense, useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils, type Group, type Mesh, type Material } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Center, Image as DreiImage } from '@react-three/drei'
import ModelText from './model_text'
import IgniteEmitter from './ignite_emiter'
import BackgroundTexture from './background_texture'
import SliderProjects from './SliderProjects'

gsap.registerPlugin(ScrollTrigger)

const ROTATION_RANGE = Math.PI / 4

type SceneProps = {
  rotationTarget: MutableRefObject<number>
  scrollProgress: MutableRefObject<number>
  emitterVisibility: MutableRefObject<number>
}

function Scene({ rotationTarget, scrollProgress, emitterVisibility }: SceneProps) {
  const groupRef = useRef<Group>(null)
  const logoRef = useRef<Mesh>(null)

  useFrame(() => {
    if (!groupRef.current) {
      return
    }

    groupRef.current.rotation.y = MathUtils.lerp(
      groupRef.current.rotation.y,
      rotationTarget.current,
      0.075,
    )

    const fadeStart = 0.75
    const fadeEnd = 0.95
    const fade = MathUtils.smoothstep(scrollProgress.current, fadeStart, fadeEnd)
    const visibility = 1 - fade
    emitterVisibility.current = visibility

    if (logoRef.current && logoRef.current.material) {
      const materials = Array.isArray(logoRef.current.material)
        ? (logoRef.current.material as Material[])
        : [logoRef.current.material as Material]

      materials.forEach((material) => {
        if ('opacity' in material) {
          material.transparent = true
          material.opacity = visibility
          material.needsUpdate = true
        }
      })
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
    </>
  )
}

type AnimationCanvasProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>
}

export default function AnimationCanvas({ containerRef }: AnimationCanvasProps) {
  const rotationTarget = useRef(0)
  const scrollProgress = useRef(0)
  const emitterVisibility = useRef(1)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
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
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          rotationTarget.current = gsap.utils.mapRange(
            0,
            1,
            0,
            ROTATION_RANGE,
            self.progress,
          )
          scrollProgress.current = self.progress
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
    <Canvas camera={{ position: [0, 0.1, 2] }}>
      <Suspense fallback={null}>
        <Scene
          rotationTarget={rotationTarget}
          scrollProgress={scrollProgress}
          emitterVisibility={emitterVisibility}
        />
        {/* <SliderProjects/> */}
      </Suspense>
    </Canvas>
  )
}
