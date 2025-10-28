'use client'

import { useLayoutEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type SliderTextContentProps = {
  sliderRevealRef: MutableRefObject<number>
}

type AccentWidth = 'small' | 'medium' | 'large' | 'wide'

type SlideContent = {
  label: string
  title: [string, string]
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
    title: ['Map the moment,', 'before launch.'],
    paragraphs: [
      'We prototype storyboards with real product data so every teaser primes intent.',
      'Our AI loops surface the angles that resonate the most before you go wide.',
    ],
    accent: 'medium',
  },
  {
    label: 'Realtime pivots',
    title: ['Switch the beat', 'while it streams.'],
    paragraphs: [
      'Video variants evolve as telemetry rolls in - no offline renders or late-night uploads.',
    ],
    accent: 'small',
  },
  {
    label: 'Creative ops',
    title: ['Spin up shots', 'in minutes.'],
    paragraphs: [
      'Ingest your brand kit and we output camera moves, lighting, and motion cues tuned for your palette.',
      'Directors keep final call with human-in-the-loop approvals on every scene.',
    ],
    accent: 'large',
  },
  {
    label: 'Audience loops',
    title: ['Personalise', 'every storyline.'],
    paragraphs: [
      'Swap voiceover, copy, or CTA per segment and ship hyper-specific cuts that still feel premium.',
    ],
    accent: 'wide',
  },
  {
    label: 'Signal intelligence',
    title: ['Forecast what', 'deserves the spotlight.'],
    paragraphs: [
      'We cross-reference social, CRM, and product heatmaps to decide which beats to amplify next.',
    ],
    accent: 'medium',
  },
  {
    label: 'Post-launch lift',
    title: ['Keep content', 'learning forward.'],
    paragraphs: [
      'Automated recuts refresh top performers for new audiences without starting from zero.',
      'Hold attention high with living stories that never sit still.',
    ],
    accent: 'large',
  },
]

export default function SliderTextContent({ sliderRevealRef }: SliderTextContentProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const slidesWrapperRef = useRef<HTMLDivElement | null>(null)
  const slideRefs = useRef<Array<HTMLDivElement | null>>(new Array(SLIDER_CONTENT.length).fill(null))
  const activeIndexRef = useRef(0)

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
    activeIndexRef.current = 0

    const ctx = gsap.context(() => {
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
          sliderRevealRef.current = 0
        },
        onLeave: () => {
          sliderRevealRef.current = 1
        },
        onEnterBack: () => {
          sliderRevealRef.current = 1
        },
        onLeaveBack: () => {
          sliderRevealRef.current = 0
        },
        onUpdate: (self) => {
          const progress = gsap.utils.clamp(0, 1, self.progress)
          const sliderPhase = gsap.utils.clamp(
            0,
            1,
            gsap.utils.normalize(0.5, 1, progress),
          )
          sliderRevealRef.current = sliderPhase

          if (SLIDER_CONTENT.length <= 1) {
            return
          }

          const segment = 1 / SLIDER_CONTENT.length
          const newIndex = Math.min(
            SLIDER_CONTENT.length - 1,
            Math.floor((sliderPhase + segment * 0.25) / segment),
          )

          if (newIndex === activeIndexRef.current) {
            return
          }

          const direction = newIndex > activeIndexRef.current ? 1 : -1
          const previous = slideRefs.current[activeIndexRef.current]
          const next = slideRefs.current[newIndex]

          const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
          if (previous) {
            tl.to(previous, {
              autoAlpha: 0,
              y: -32 * direction,
              duration: 0.45,
              ease: 'power2.inOut',
            })
          }

          if (next) {
            tl.fromTo(
              next,
              { autoAlpha: 0, y: 32 * direction },
              { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' },
              previous ? '<0.08' : 0,
            )
          }

          activeIndexRef.current = newIndex
        },
      })
    }, wrapper)

    return () => {
      ctx.revert()
      sliderRevealRef.current = 0
      activeIndexRef.current = 0
    }
  }, [sliderRevealRef])

  return (
    <section ref={sectionRef} className="relative flex h-screen items-end justify-center pb-5">
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
                  <div className="hero__info-left max-w-fit">
                    <span className="h2 mb-4 rounded-4xl border border-primary py-2 px-4">{slide.label}</span>
                    <br />
                    <h2 className="mt-2 px-4 text-left font-light">
                      {slide.title[0]}
                      <br />
                      {slide.title[1]}
                    </h2>
                  </div>
                  <div className="hero__info-right max-w-96 flex flex-col items-start gap-3">
                    <div className={`h-2 rounded bg-primary ${accent}`} />
                    {slide.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="max-w-96 text-left">
                        {paragraph}
                      </p>
                    ))}
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
