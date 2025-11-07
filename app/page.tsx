'use client'

import AnimationCanvas from '@/components/canvas/animation_canvas'
import CanvasLoader from '@/components/canvas/canvas_loader'
import ContentPage from '@/components/Content'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'
import SectionProgressIndicator from '@/components/ui/SectionProgressIndicator'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const heroScroll = useRef<HTMLParagraphElement>(null)
  const sliderRevealRef = useRef(0)
  const logoVisibilityRef = useRef(1)
  const sliderActiveRef = useRef(0)
  const glowRevealRef = useRef(0)
  const storiesVideoRevealRef = useRef(0)
  const storiesVideoLayoutRef = useRef(0)
  const modelTextProgressRef = useRef(0)
  const visionGridProgressRef = useRef(0)
  const visionModelTextProgressRef = useRef(0)
  const loaderReadyRef = useRef(0)

  useEffect(() => {
    const prompt = heroScroll.current
    if (!prompt) {
      return
    }

    const intro = gsap.fromTo(
      prompt,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.4 },
    )

    const section = heroSectionRef.current
    if (!section) {
      return () => {
        intro.kill()
      }
    }

    const fade = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const progress = gsap.utils.clamp(0, 1, self.progress)
        gsap.set(prompt, {
          autoAlpha: 1 - progress,
          y: 24 * progress,
        })
      },
    })

    return () => {
      intro.kill()
      fade.kill()
    }
  }, [])

  return (
    <>
      <CanvasLoader onComplete={() => {
        loaderReadyRef.current = 1
      }} />
      {/* <ScrollProgressBar /> */}
      <SectionProgressIndicator />
      <main ref={containerRef} className="relative bg-black text-white">
        <section
          ref={heroSectionRef}
          data-section-progress="hero"
          data-section-label="Top"
          className="hero relative h-[320vh] w-full"
        >
          <div className="fixed top-0 h-screen w-full">
            <AnimationCanvas
              containerRef={containerRef}
              sliderRevealRef={sliderRevealRef}
              logoVisibilityRef={logoVisibilityRef}
              sliderActiveRef={sliderActiveRef}
              glowRevealRef={glowRevealRef}
              storiesVideoRevealRef={storiesVideoRevealRef}
              storiesVideoLayoutRef={storiesVideoLayoutRef}
              modelTextProgressRef={modelTextProgressRef}
              visionGridProgressRef={visionGridProgressRef}
              visionModelTextProgressRef={visionModelTextProgressRef}
              loaderReadyRef={loaderReadyRef}
            />
            <p
              ref={heroScroll}
              className="hero__sub pointer-events-auto absolute bottom-5 left-1/2 w-full -translate-x-1/2 pt-12 text-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="16"
                viewBox="0 0 11 16"
                fill="none"
                className="m-auto"
              >
                <path d="M5.35156 1.42188L0.703125 6.0625L0 5.35938L5.35156 0L10.7031 5.35938L10 6.0625L5.35156 1.42188ZM5.35156 14L10 9.35938L10.7031 10.0625L5.35156 15.4219L0 10.0625L0.703125 9.35938L5.35156 14Z" fill="#FDFEFF" />
              </svg>
              scroll to explore
            </p>
          </div>
        </section>
        <ContentPage
          logoVisibilityRef={logoVisibilityRef}
          sliderRevealRef={sliderRevealRef}
          sliderActiveRef={sliderActiveRef}
          glowRevealRef={glowRevealRef}
          storiesVideoRevealRef={storiesVideoRevealRef}
          storiesVideoLayoutRef={storiesVideoLayoutRef}
          modelTextProgressRef={modelTextProgressRef}
          visionGridProgressRef={visionGridProgressRef}
          visionModelTextProgressRef={visionModelTextProgressRef}
        />
      </main>
    </>
  )
}
