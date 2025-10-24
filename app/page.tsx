'use client'

import AnimationCanvas from '@/components/canvas/animation_canvas'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

type SegmentConfig = {
  start: number
  span: number
}

const heroRevealConfig: Record<'left' | 'right', SegmentConfig> = {
  /** Ajusta estos porcentajes (0 a 1) para controlar el punto de entrada */
  left: { start: 0.4, span: 0.5 },
  right: { start: 0.42, span: 0.5 },
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroInfoRef = useRef<HTMLDivElement>(null)
  const heroTextLeft = useRef<HTMLDivElement>(null)
  const heroTextRight = useRef<HTMLDivElement>(null)
  const heroScroll = useRef<HTMLParagraphElement>(null)
  const heroSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const heroSection = heroSectionRef.current
    if (!heroSection) {
      return
    }

    const ease = gsap.parseEase('power3.out')
    const setSegment = (
      element: HTMLElement | null,
      config: SegmentConfig,
      axis: 'left' | 'right' | 'bottom',
      progress: number,
    ) => {
      if (!element) return

      const { start, span } = config
      const effectiveSpan = Math.max(span, 0.0001)
      const t = gsap.utils.clamp(0, 1, (progress - start) / effectiveSpan)
      const eased = ease(t)

      if (axis === 'left') {
        gsap.set(element, {
          x: gsap.utils.interpolate(-160, 0, eased),
          opacity: eased,
        })
      } else if (axis === 'right') {
        gsap.set(element, {
          x: gsap.utils.interpolate(160, 0, eased),
          opacity: eased,
        })
      } else {
        gsap.set(element, {
          y: gsap.utils.interpolate(40, 0, eased),
          opacity: eased,
        })
      }
    }

    gsap.set([heroTextLeft.current, heroTextRight.current, heroScroll.current], { opacity: 0 })
    gsap.set(heroInfoRef.current, { opacity: 1 })

    const heroTrigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const progress = gsap.utils.clamp(0, 1, self.progress)
        console.log(progress)
        setSegment(heroTextLeft.current, heroRevealConfig.left, 'left', progress)
        setSegment(heroTextRight.current, heroRevealConfig.right, 'right', progress)

        const fadeOutProgress = gsap.utils.clamp(0, 1, (progress - 0.75) / 0.15)
        const fadeOpacity = 1 - fadeOutProgress

        gsap.set(heroInfoRef.current, { opacity: fadeOpacity })
        gsap.set(heroScroll.current, {
          opacity: fadeOpacity,
          y: gsap.utils.interpolate(0, 24, fadeOutProgress),
        })
      },
    })

    const heroPin = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      pin: heroSection,
    })

    const handleResize = () => {
      heroTrigger.refresh()
      heroPin.refresh()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      heroTrigger.kill()
      heroPin.kill()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      <ScrollProgressBar />
      <main ref={containerRef} className="relative min-h-[280vh] bg-black text-white">
        <div ref={heroSectionRef} className="pointer-events-none h-screen w-full hero">
          <AnimationCanvas containerRef={containerRef} />
          <div className="bottom absolute bottom-10 w-full">
            <div ref={heroInfoRef} className="hero__info container mb-4 flex flex-row items-center justify-between space-x-2 opacity-0">
              <div ref={heroTextLeft} className="hero__info-left max-w-fit">
                <span className="h2 mb-4 rounded-4xl border border-primary py-2 px-4">Your story, </span>
                <br />
                <h2 className="mt-2 px-4 text-left font-light">
                  reinvented
                  <br /> through AI.
                </h2>
              </div>
              <div ref={heroTextRight} className="hero__info-right max-w-96 flex flex-col items-start gap-2">
                <div className="h-2 w-7 rounded bg-primary" />
                <p className="max-w-96 text-left">
                  At <b>STUDIO</b>, we merge artificial intelligence and creativity to craft videos that captivate, adapt, and resonate.
                </p>
              </div>
            </div>
            <p ref={heroScroll} className="hero__sub pt-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="16" viewBox="0 0 11 16" fill="none" className="m-auto">
                <path d="M5.35156 1.42188L0.703125 6.0625L0 5.35938L5.35156 0L10.7031 5.35938L10 6.0625L5.35156 1.42188ZM5.35156 14L10 9.35938L10.7031 10.0625L5.35156 15.4219L0 10.0625L0.703125 9.35938L5.35156 14Z" fill="#FDFEFF" />
              </svg>
              scroll to explore
            </p>
          </div>
        </div>
        <section className="relative flex h-screen items-center justify-center">
          <p>top</p>
        </section>
      </main>
    </>
  )
}
