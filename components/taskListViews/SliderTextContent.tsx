'use client'

import { useLayoutEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MathUtils } from 'three'

gsap.registerPlugin(ScrollTrigger)

type SliderTextContentProps = {
  sliderRevealRef: MutableRefObject<number>
  sliderActiveRef: MutableRefObject<number>
}

type AccentWidth = 'small' | 'medium' | 'large' | 'wide'

type SlideContent = {
  label: string
  title: string
  paragraphs: string[]
  accent?: AccentWidth
}

const ACCENT_WIDTH_CLASS: Record<AccentWidth, string> = {
  small: 'w-6',
  medium: 'w-8',
  large: 'w-10',
  wide: 'w-12',
}

const SLIDER_CONTENT: SlideContent[] = [
  {
    label: 'Campaign seeds',
    title: 'Map the moment before launch.',
    paragraphs: [
      'We prototype storyboards with real product data so every teaser primes intent.',
      'Our AI loops surface the angles that resonate the most before you go wide.',
    ],
    accent: 'medium',
  },
  {
    label: 'Realtime pivots',
    title: 'Switch the beat while it streams.',
    paragraphs: [
      'Video variants evolve as telemetry rolls in - no offline renders or late-night uploads.',
    ],
    accent: 'small',
  },
  {
    label: 'Creative ops',
    title: 'Spin up shots in minutes.',
    paragraphs: [
      'Ingest your brand kit and we output camera moves, lighting, and motion cues tuned for your palette.',
      'Directors keep final call with human-in-the-loop approvals on every scene.',
    ],
    accent: 'large',
  },
  {
    label: 'Audience loops',
    title: 'Personalise every storyline.',
    paragraphs: [
      'Swap voiceover, copy, or CTA per segment and ship hyper-specific cuts that still feel premium.',
    ],
    accent: 'wide',
  },
  {
    label: 'Signal intelligence',
    title: 'Forecast what deserves the spotlight.',
    paragraphs: [
      'We cross-reference social, CRM, and product heatmaps to decide which beats to amplify next.',
    ],
    accent: 'medium',
  },
  {
    label: 'Post-launch lift',
    title: 'Keep content learning forward.',
    paragraphs: [
      'Automated recuts refresh top performers for new audiences without starting from zero.',
      'Hold attention high with living stories that never sit still.',
    ],
    accent: 'large',
  },
]

export default function SliderTextContent({
  sliderRevealRef,
  sliderActiveRef,
}: SliderTextContentProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const slidesWrapperRef = useRef<HTMLDivElement | null>(null)
  const slideRefs = useRef<Array<HTMLDivElement | null>>(new Array(SLIDER_CONTENT.length).fill(null))
  const activeIndexRef = useRef(0)
  const transitionRef = useRef<gsap.core.Timeline | null>(null)

  const setSlideRef = (index: number) => (element: HTMLDivElement | null) => {
    slideRefs.current[index] = element
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    const wrapper = slidesWrapperRef.current
    if (!section || !wrapper) {
      return
    }

    sliderRevealRef.current = 0
    sliderActiveRef.current = 0
    activeIndexRef.current = 0
    let entranceProgress = 0
    const fadeOutActiveSlide = () => {
      const activeSlide = slideRefs.current[activeIndexRef.current]
      if (!activeSlide) {
        return
      }
      transitionRef.current?.kill()
      gsap.to(activeSlide, {
        autoAlpha: 0,
        y: -32,
        duration: 0.4,
        ease: 'power2.inOut',
        overwrite: 'auto',
      })
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          entranceProgress = gsap.utils.clamp(0, 1, self.progress)
          sliderRevealRef.current = entranceProgress
        },
        onEnter: () => {
          entranceProgress = 0
          sliderRevealRef.current = 0
        },
        onLeave: () => {
          entranceProgress = 1
          sliderRevealRef.current = 1
        },
        onEnterBack: () => {
          entranceProgress = 1
          sliderRevealRef.current = 1
        },
        onLeaveBack: () => {
          entranceProgress = 0
          sliderRevealRef.current = 0
        },
      })

      slideRefs.current.forEach((slide, index) => {
        if (!slide) return
        gsap.set(slide, { autoAlpha: index === 0 ? 1 : 0, y: index === 0 ? 0 : 48 })
      })

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=250%',
        scrub: true,
        pin: true,
        anticipatePin: 1,
        onEnter: () => {
          sliderActiveRef.current = 0
          sliderRevealRef.current = 1
        },
        onEnterBack: () => {
          sliderActiveRef.current = 1
          sliderRevealRef.current = 1
        },
        onLeave: () => {
          sliderActiveRef.current = 1
          sliderRevealRef.current = 0
          fadeOutActiveSlide()
        },
        onLeaveBack: () => {
          sliderActiveRef.current = 0
          sliderRevealRef.current = entranceProgress
          fadeOutActiveSlide()
        },
        onUpdate: (self) => {
          const progress = gsap.utils.clamp(0, 1, self.progress)
          sliderActiveRef.current = progress

          if (SLIDER_CONTENT.length <= 1) {
            return
          }

          const steps = Math.max(SLIDER_CONTENT.length - 1, 1)
          const rawIndex = progress * steps
          const nearestIndex = MathUtils.clamp(Math.round(rawIndex), 0, steps)
          const centerDistance = Math.abs(rawIndex - nearestIndex)
          const holdStrength = 1 - MathUtils.smoothstep(centerDistance, 0, 0.24)
          const focusIndex = MathUtils.lerp(rawIndex, nearestIndex, holdStrength * 0.9)
          const desiredIndex = MathUtils.clamp(Math.round(focusIndex), 0, steps)
          const stepDelta = MathUtils.clamp(desiredIndex - activeIndexRef.current, -1, 1)
          const newIndex = activeIndexRef.current + stepDelta

          if (newIndex === activeIndexRef.current) {
            return
          }

          const direction = newIndex > activeIndexRef.current ? 1 : -1
          const previous = slideRefs.current[activeIndexRef.current]
          const next = slideRefs.current[newIndex]

          transitionRef.current?.kill()
          const tl = gsap.timeline({ defaults: { ease: 'power2.out', overwrite: 'auto' } })
          if (previous) {
            tl.to(previous, {
              autoAlpha: 0,
              y: -32 * direction,
              duration: 0.45,
              ease: 'power2.inOut',
              overwrite: 'auto',
            })
          }

          if (next) {
            tl.fromTo(
              next,
              { autoAlpha: 0, y: 32 * direction },
              { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' },
              previous ? '<0.08' : 0,
            )
          }

          activeIndexRef.current = newIndex
          transitionRef.current = tl
          tl.eventCallback('onComplete', () => {
            if (transitionRef.current === tl) {
              transitionRef.current = null
            }
          })
        },
      })
    }, wrapper)

    return () => {
      ctx.revert()
      transitionRef.current?.kill()
      if (transitionRef.current) {
        transitionRef.current = null
      }
      sliderRevealRef.current = 0
      sliderActiveRef.current = 0
      activeIndexRef.current = 0
    }
  }, [sliderActiveRef, sliderRevealRef])

  return (
    <section ref={sectionRef} className="relative flex h-screen items-end justify-center pb-10 px-30">
      <div className="relative flex w-full">
        <div className="pointer-events-auto relative w-full pb-16">
          <div
            ref={slidesWrapperRef}
            className="hero__info container absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 justify-center"
          >
            {SLIDER_CONTENT.map((slide, index) => {
              const accent = ACCENT_WIDTH_CLASS[slide.accent ?? 'medium']
              return (
                <div
                  key={slide.label}
                  ref={setSlideRef(index)}
                  className="absolute inset-x-0 bottom-0 flex w-full flex-row items-center justify-between space-x-2 opacity-0"
                >
                  <div className="hero__info-left max-w-2/3 flex flex-col items-start gap-3">
                    <div className='gap-2 flex flex-col'>
                       <span className="text-sm text-primary">{slide.label}</span>
                      <h2 className=" text-left font-light">
                        <b>{slide.title}</b>
                      </h2>
                    </div>
                    <div>
                        {slide.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-left ">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
