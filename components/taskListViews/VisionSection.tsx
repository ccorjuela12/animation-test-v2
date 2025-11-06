'use client'

import { useLayoutEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type VisionSectionProps = {
  storiesVideoRevealRef: MutableRefObject<number>
  storiesVideoLayoutRef: MutableRefObject<number>
  modelTextProgressRef: MutableRefObject<number>
  visionGridProgressRef: MutableRefObject<number>
  visionModelTextProgressRef: MutableRefObject<number>
}

export default function VisionSection({
  storiesVideoRevealRef,
  storiesVideoLayoutRef,
  modelTextProgressRef,
  visionGridProgressRef,
  visionModelTextProgressRef,
}: VisionSectionProps) {
  const sectionVisionRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const section = sectionVisionRef.current
    if (!section) {
      return undefined
    }

    const clamp01 = gsap.utils.clamp(0, 1)
    visionGridProgressRef.current = 0
    visionModelTextProgressRef.current = 0

    const playReelContainer = document.querySelector<HTMLElement>('[data-stories-reel-container]')

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          const progress = clamp01(self.progress)

          const hideProgress = clamp01(gsap.utils.mapRange(0, 0.4, 0, 1, progress))
          const remaining = clamp01(1 - hideProgress)
          storiesVideoRevealRef.current = remaining
          storiesVideoLayoutRef.current = clamp01(remaining * 0.82)

          if (progress > 0.2) {
            modelTextProgressRef.current = 1
          }

          const tunnelReveal = clamp01(gsap.utils.mapRange(0.25, 0.95, 0, 1, progress))
          const textReveal = clamp01(gsap.utils.mapRange(0.45, 1, 0, 1, progress))
          visionGridProgressRef.current = tunnelReveal
          visionModelTextProgressRef.current = textReveal

          if (playReelContainer) {
            const reelAlpha = clamp01(1 - hideProgress * 1.1)
            gsap.set(playReelContainer, {
              autoAlpha: reelAlpha,
              yPercent: progress * 16,
            })
          }
        },
        onLeave: () => {
          storiesVideoRevealRef.current = 0
          storiesVideoLayoutRef.current = 0
          visionGridProgressRef.current = 1
          visionModelTextProgressRef.current = 1
          if (playReelContainer) {
            gsap.set(playReelContainer, { autoAlpha: 0, yPercent: 18 })
          }
        },
        onLeaveBack: () => {
          visionGridProgressRef.current = 0
          visionModelTextProgressRef.current = 0
          storiesVideoRevealRef.current = 0
          storiesVideoLayoutRef.current = 0
          modelTextProgressRef.current = 0
          if (playReelContainer) {
            gsap.set(playReelContainer, { autoAlpha: 0, yPercent: 8 })
          }
        },
      })

      return () => {
        trigger.kill()
      }
    }, sectionVisionRef)

    return () => {
      ctx.revert()
      visionGridProgressRef.current = 0
      visionModelTextProgressRef.current = 0
    }
  }, [
    modelTextProgressRef,
    storiesVideoLayoutRef,
    storiesVideoRevealRef,
    visionGridProgressRef,
    visionModelTextProgressRef,
  ])

  return (
    <section
      ref={sectionVisionRef}
      data-section-progress="vision"
      data-section-label="Vision"
      className="relative flex h-screen flex-col justify-end overflow-hidden"
    >
      <div className="container gap-12 pb-10  flex flex-col items-center perspective-dramatic ">
        <h2 className="h1 max-w-4xl text-center rotate-x-6">
          Step into the grid tunnel.
        </h2>
      </div>
    </section>
  )
}
