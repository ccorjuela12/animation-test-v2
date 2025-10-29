'use client'

import { useLayoutEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type HeroFooterTextProps = {
  logoVisibilityRef: MutableRefObject<number>
  glowRevealRef: MutableRefObject<number>
}

export default function HeroFooterText({ logoVisibilityRef, glowRevealRef }: HeroFooterTextProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const heroInfoRef = useRef<HTMLDivElement | null>(null)
  const heroTextLeft = useRef<HTMLDivElement | null>(null)
  const heroTextRight = useRef<HTMLDivElement | null>(null)
  const heroSecondaryRef = useRef<HTMLDivElement | null>(null)
  const heroSecondaryLeft = useRef<HTMLDivElement | null>(null)
  const heroSecondaryRight = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) {
      return
    }

    const logoProxy = { value: 1 }
    logoVisibilityRef.current = logoProxy.value
    glowRevealRef.current = 0

    const ctx = gsap.context(() => {
      gsap.set(heroInfoRef.current, { autoAlpha: 0 })
      gsap.set(heroSecondaryRef.current, { autoAlpha: 0 })
      gsap.set([heroTextLeft.current, heroTextRight.current], { autoAlpha: 0, y: 48 })
      gsap.set([heroSecondaryLeft.current, heroSecondaryRight.current], { autoAlpha: 0, y: 48 })

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=200%',
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onLeave: () => {
            logoProxy.value = 0
            logoVisibilityRef.current = 0
          },
          onLeaveBack: () => {
            logoProxy.value = 1
            logoVisibilityRef.current = 1
            glowRevealRef.current = 0
          },
        },
      })
        .to(heroInfoRef.current, { autoAlpha: 1, duration: 0.6 })
        .to(heroTextLeft.current, { autoAlpha: 1, y: 0, duration: 0.8 }, '<')
        .to(heroTextRight.current, { autoAlpha: 1, y: 0, duration: 0.8 }, '<0.1')
        .to(heroTextLeft.current, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.inOut' }, '+=0.3')
        .to(heroTextRight.current, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.inOut' }, '<')
        .to(heroInfoRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, '<')
        .to(heroSecondaryRef.current, { autoAlpha: 1, duration: 0.6 }, '>-0.1')
        .to(heroSecondaryLeft.current, { autoAlpha: 1, y: 0, duration: 0.8 }, '<')
        .to(heroSecondaryRight.current, { autoAlpha: 1, y: 0, duration: 0.8 }, '<0.1')
        .to(heroSecondaryLeft.current, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.inOut' }, '+=0.35')
        .to(heroSecondaryRight.current, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.inOut' }, '<')
        .to(heroSecondaryRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, '<');

      timeline.add('secondaryCleared');
      timeline.call(() => {
        glowRevealRef.current = 1
      }, [], 'secondaryCleared');

      timeline.to(
          logoProxy,
          {
            value: 0,
            duration: 0.65,
            ease: 'power2.inOut',
            onUpdate: () => {
              logoVisibilityRef.current = logoProxy.value
            },
          },
          'secondaryCleared+=0.1',
        );
    })

    return () => {
      ctx.revert()
      logoVisibilityRef.current = 1
      glowRevealRef.current = 0
    }
  }, [glowRevealRef, logoVisibilityRef])

  return (
    <section ref={sectionRef} className="relative flex h-screen items-end justify-center pb-10">
      <div className="relative flex w-full">
        <div className="pointer-events-auto relative w-full pb-16">
          <div
            ref={heroInfoRef}
            className="hero__info container absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 flex-row items-center justify-between space-x-2 opacity-0"
          >
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
                At <b>STUDIO</b>, we merge artificial intelligence and creativity to craft videos that captivate,
                adapt, and resonate.
              </p>
            </div>
          </div>

          <div
            ref={heroSecondaryRef}
            className="hero__info container absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 flex-row items-center justify-between space-x-2 opacity-0"
          >
            <div ref={heroSecondaryLeft} className="hero__info-left max-w-fit">
              <span className="h2 mb-4 rounded-4xl border border-primary py-2 px-4">From insight,</span>
              <br />
              <h2 className="mt-2 px-4 text-left font-light">
                to immersive
                <br /> narratives.
              </h2>
            </div>
            <div ref={heroSecondaryRight} className="hero__info-right max-w-96 flex flex-col items-start gap-3">
              <div className="h-2 w-10 rounded bg-primary" />
              <p className="max-w-96 text-left">
                We orchestrate cohesive launch paths, custom visuals, and adaptive storytelling that help your next
                release feel inevitable.
              </p>
              <p className="max-w-96 text-left text-sm text-zinc-300">
                Motion, copy, and data unite so every frame earns attention.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
