'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PlayReel from '../PlayReel'

gsap.registerPlugin(ScrollTrigger)

export default function StoriesSection() {
  const sectionStoriesRef = useRef<HTMLElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    const section = sectionStoriesRef.current
    if (!section) {
      return undefined
    }

    const ctx = gsap.context(() => {
      timelineRef.current = gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=200%',
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        })
        // Placeholder tween to reserve the timeline; replace with real animations later.
        .to(section, { duration: 1 })
    }, sectionStoriesRef)

    return () => {
      ctx.revert()
      timelineRef.current?.kill()
      timelineRef.current = null
    }
  }, [])

  return (
    <section
      ref={sectionStoriesRef}
      className="relative  h-screen overflow-hidden flex flex-col items-center justify-center"
    >
        {/* Future story animations will live here */}
        <div className="container flex flex-col py-36 gap-20">
            <h2 ref={titleRef} className="h1 opacity-0">Where <span className="text-primary">stories</span><br/>breathe.</h2>
            <div className="flex items-center gap-20">
                <div className="flex-2">
                    <img ref={imageRef} src="./images/stories.png" alt="test"  className='w-full h-auto opacity-0'/>
                </div>
                <div className="flex-1 flex flex-col gap-2 opacity-0" ref={textRef}>
                    <div className="h-2 w-10 rounded bg-primary" />
                    <p className="max-w-96 text-left text-base">
                        At <b>STUDIO</b>, we don’t just produce videos — we create living, breathing visual narratives tailored to your brand and audience. Using cutting-edge AI and human craftsmanship, we transform your ideas into immersive visual experiences. No templates. No one-size-fits-all.
                    </p>
                </div>
            </div>
            
        </div>
        <div className="absolute w-[70%] h-[85%] top-[12%] left-[15%] z-20 flex flex-col justify-between gap-14">
          <PlayReel text={'PLAY REEL'} numberIcons={3} repeat={4}/>
          <div className='w-full h-[80%]'>

          </div>
          <PlayReel text={'PLAY REEL'} numberIcons={3} repeat={4}/>
        </div>
    </section>
  )
}