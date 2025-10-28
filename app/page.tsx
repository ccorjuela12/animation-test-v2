'use client'

import AnimationCanvas, { HERO_SCROLL_MARKS } from '@/components/canvas/animation_canvas'
import CanvasLoader from '@/components/canvas/canvas_loader'
import ContentPage from '@/components/Content'
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
  left: HERO_SCROLL_MARKS.primaryLeft,
  right: HERO_SCROLL_MARKS.primaryRight,
}

const secondaryRevealConfig: Record<'left' | 'right', SegmentConfig> = {
  left: HERO_SCROLL_MARKS.secondaryLeft,
  right: HERO_SCROLL_MARKS.secondaryRight,
}

const TEXT_FADE_START = HERO_SCROLL_MARKS.primaryFadeStart
const TEXT_FADE_END = HERO_SCROLL_MARKS.primaryFadeEnd
const SCROLL_PROMPT_OFFSET = 24

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroInfoRef = useRef<HTMLDivElement>(null)
  const heroTextLeft = useRef<HTMLDivElement>(null)
  const heroTextRight = useRef<HTMLDivElement>(null)
  const heroScroll = useRef<HTMLParagraphElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const heroSecondaryRef = useRef<HTMLDivElement>(null)
  const heroSecondaryLeft = useRef<HTMLDivElement>(null)
  const heroSecondaryRight = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
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
    gsap.set(heroInfoRef.current, { opacity: 1, pointerEvents: 'auto' })
    gsap.set(heroSecondaryRef.current, { opacity: 0, pointerEvents: 'none' })
    gsap.set([heroSecondaryLeft.current, heroSecondaryRight.current], { opacity: 0 })

    const heroTrigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const progress = gsap.utils.clamp(0, 1, self.progress)
        setSegment(heroTextLeft.current, heroRevealConfig.left, 'left', progress)
        setSegment(heroTextRight.current, heroRevealConfig.right, 'right', progress)
        setSegment(heroSecondaryLeft.current, secondaryRevealConfig.left, 'left', progress)
        setSegment(heroSecondaryRight.current, secondaryRevealConfig.right, 'right', progress)

        const fadeOutProgress = gsap.utils.clamp(
          0,
          1,
          gsap.utils.normalize(TEXT_FADE_START, TEXT_FADE_END, progress),
        )
        const fadeOpacity = 1 - fadeOutProgress
        const secondaryProgress = gsap.utils.clamp(
          0,
          1,
          gsap.utils.normalize(
            secondaryRevealConfig.left.start,
            secondaryRevealConfig.left.start + secondaryRevealConfig.left.span,
            progress,
          ),
        )

        gsap.set(heroInfoRef.current, {
          opacity: fadeOpacity,
          pointerEvents: fadeOpacity > 0.05 ? 'auto' : 'none',
        })
        gsap.set(heroScroll.current, {
          opacity: fadeOpacity,
          y: gsap.utils.interpolate(0, SCROLL_PROMPT_OFFSET, fadeOutProgress),
        })
        gsap.set(heroSecondaryRef.current, {
          opacity: secondaryProgress,
          pointerEvents: secondaryProgress > 0.05 ? 'auto' : 'none',
        })
      },
    })

    const handleResize = () => {
      heroTrigger.refresh()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      heroTrigger.kill()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      <CanvasLoader />
      <ScrollProgressBar />
      <main ref={containerRef} className="relative bg-black text-white">
        <section ref={heroSectionRef} className="relative h-[320vh] w-full hero">
          <div className="fixed top-0 h-screen w-full">
            <AnimationCanvas containerRef={containerRef} />
            <p
                ref={heroScroll}
                className="hero__sub pointer-events-auto absolute bottom-5 left-1/2 w-full -translate-x-1/2 pt-12 text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="16" viewBox="0 0 11 16" fill="none" className="m-auto">
                  <path d="M5.35156 1.42188L0.703125 6.0625L0 5.35938L5.35156 0L10.7031 5.35938L10 6.0625L5.35156 1.42188ZM5.35156 14L10 9.35938L10.7031 10.0625L5.35156 15.4219L0 10.0625L0.703125 9.35938L5.35156 14Z" fill="#FDFEFF" />
                </svg>
                scroll to explore
              </p>
          </div>
        </section>
        <ContentPage/>
      </main>
    </>
  )
}
