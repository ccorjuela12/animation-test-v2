'use client'

import { useLayoutEffect, useRef, useState, type MutableRefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PlayReel from '../PlayReel'

gsap.registerPlugin(ScrollTrigger)

type StoriesSectionProps = {
  modelTextProgressRef: MutableRefObject<number>
  storiesVideoRevealRef: MutableRefObject<number>
  storiesVideoLayoutRef: MutableRefObject<number>
}

export default function StoriesSection({
  modelTextProgressRef,
  storiesVideoRevealRef,
  storiesVideoLayoutRef,
}: StoriesSectionProps) {
  const sectionStoriesRef = useRef<HTMLElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  const imageContainerRef = useRef<HTMLDivElement | null>(null)
  const videoContainerRef = useRef<HTMLDivElement | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const titleTweenRef = useRef<gsap.core.Tween | null>(null)
  const textTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const textExitTweenRef = useRef<gsap.core.Tween | null>(null)
  const titleFadeTweenRef = useRef<gsap.core.Tween | null>(null)
  const imageTweenRef = useRef<gsap.core.Tween | null>(null)
  const videoTweenRef = useRef<gsap.core.Tween | null>(null)
  const videoStateRef = useRef({ value: 0 })
  const videoShownRef = useRef(false)
  const lastTitleProgressRef = useRef(0)
  const videoLayoutStateRef = useRef({ value: 0 })
  const videoLayoutTweenRef = useRef<gsap.core.Tween | null>(null)
  const videoExpandedRef = useRef(false)
  const videoContainerTweenRef = useRef<gsap.core.Tween | null>(null)
  const [isReelLooping, setIsReelLooping] = useState(false)

  useLayoutEffect(() => {
    const section = sectionStoriesRef.current
    if (!section) {
      return undefined
    }

    modelTextProgressRef.current = 0
    storiesVideoRevealRef.current = 0
    storiesVideoLayoutRef.current = 0
    videoLayoutStateRef.current.value = 0
    const clampProgress = gsap.utils.clamp(0, 1)

    const ctx = gsap.context(() => {
      const setVideoLayout = (target: number, options?: { immediate?: boolean }) => {
        const immediate = options?.immediate ?? false
        if (immediate) {
          videoLayoutTweenRef.current?.kill()
          videoLayoutTweenRef.current = null
          videoLayoutStateRef.current.value = target
          storiesVideoLayoutRef.current = target
          if (target === 0) {
            const containerEl = videoContainerRef.current
            if (containerEl) {
              videoContainerTweenRef.current?.kill()
              gsap.set(containerEl, { autoAlpha: 0, yPercent: 8 })
            }
            setIsReelLooping(false)
          }
          return
        }

        if (videoLayoutStateRef.current.value === target) {
          storiesVideoLayoutRef.current = clampProgress(videoLayoutStateRef.current.value)
          return
        }

        videoLayoutTweenRef.current?.kill()
        videoLayoutTweenRef.current = gsap.to(videoLayoutStateRef.current, {
          value: target,
          duration: 0.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            storiesVideoLayoutRef.current = clampProgress(videoLayoutStateRef.current.value)
          },
          onComplete: () => {
            storiesVideoLayoutRef.current = clampProgress(videoLayoutStateRef.current.value)
            const containerEl = videoContainerRef.current
            if (!containerEl) {
              return
            }
            videoContainerTweenRef.current?.kill()
            if (target >= 0.99) {
              setIsReelLooping(false)
              videoContainerTweenRef.current = gsap.to(containerEl, {
                autoAlpha: 1,
                yPercent: 0,
                duration: 0.5,
                ease: 'power2.out',
              })
            } else {
              setIsReelLooping(false)
              videoContainerTweenRef.current = gsap.to(containerEl, {
                autoAlpha: 0,
                yPercent: 8,
                duration: 0.4,
                ease: 'power2.in',
              })
            }
          },
        })
      }

      timelineRef.current = gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=200%',
            scrub: true,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              const progress = clampProgress(self.progress)
              const expandThreshold = 0.6
              const collapseThreshold = 0.45
              if (videoShownRef.current && !videoExpandedRef.current && progress >= expandThreshold) {
                videoExpandedRef.current = true
                setVideoLayout(1)
                const titleEl = titleRef.current
                if (titleEl) {
                  titleFadeTweenRef.current?.kill()
                  titleFadeTweenRef.current = gsap.to(titleEl, {
                    autoAlpha: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                  })
                }
                const textElement = textRef.current
                const textTimeline = textTimelineRef.current
                if (textElement) {
                  textExitTweenRef.current?.kill()
                  textExitTweenRef.current = gsap.to(textElement, {
                    autoAlpha: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                    onComplete: () => {
                      textTimeline?.pause(0)
                      textTimeline?.progress(0)
                      gsap.set(textElement, { xPercent: 45, autoAlpha: 0 })
                    },
                  })
                } else {
                  textTimeline?.pause(0)
                  textTimeline?.progress(0)
                }
              } else if (videoExpandedRef.current && progress < collapseThreshold) {
                videoExpandedRef.current = false
                setVideoLayout(0)
                const titleEl = titleRef.current
                if (titleEl) {
                  titleFadeTweenRef.current?.kill()
                  titleFadeTweenRef.current = gsap.to(titleEl, {
                    autoAlpha: 1,
                    duration: 0.4,
                    ease: 'power2.out',
                  })
                }
                textExitTweenRef.current?.kill()
                textTimelineRef.current?.restart(true)
              }
            },
          },
        })
        .to(section, { duration: 1 })

      const showThreshold = 0.95
      const hideThreshold = 0.85
      const title = titleRef.current
      if (title) {
        gsap.set(title, { clipPath: 'inset(0 100% 0 0)', opacity: 1 })
        titleTweenRef.current = gsap.to(title, {
          clipPath: 'inset(0 0% 0 0)',
          ease: 'none',
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=25%',
            scrub: true,
            onUpdate: () => {
              const progress = titleTweenRef.current?.progress() ?? 0
              const prevProgress = lastTitleProgressRef.current
              const isScrollingBack = progress < prevProgress - 0.0001
              const textProgress = modelTextProgressRef.current
              const shouldShowVideo = progress >= showThreshold && textProgress >= showThreshold
              const shouldHideVideo = isScrollingBack && (progress <= hideThreshold || textProgress <= hideThreshold)

              const animateVideo = (target: number) => {
                videoTweenRef.current?.kill()
                videoTweenRef.current = gsap.to(videoStateRef.current, {
                  value: target,
                  duration: target > videoStateRef.current.value ? 0.8 : 0.6,
                  ease: 'power2.out',
                  onUpdate: () => {
                    storiesVideoRevealRef.current = clampProgress(videoStateRef.current.value)
                  },
                })
              }

              if (shouldShowVideo && !videoShownRef.current) {
                videoShownRef.current = true
                videoExpandedRef.current = false
                setVideoLayout(0, { immediate: true })
                animateVideo(1)
                textExitTweenRef.current?.kill()
                textTimelineRef.current?.restart(true)
                const titleElement = titleRef.current
                if (titleElement) {
                  titleFadeTweenRef.current?.kill()
                  gsap.set(titleElement, { autoAlpha: 1 })
                }
              } else if (shouldHideVideo && videoShownRef.current) {
                videoShownRef.current = false
                videoExpandedRef.current = false
                setVideoLayout(0)
                setIsReelLooping(false)
                animateVideo(0)
                const titleElement = titleRef.current
                if (titleElement) {
                  titleFadeTweenRef.current?.kill()
                  titleFadeTweenRef.current = gsap.to(titleElement, {
                    autoAlpha: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                  })
                }
                const textElement = textRef.current
                const textTimeline = textTimelineRef.current
                textTimeline?.pause()
                if (textElement) {
                  textExitTweenRef.current?.kill()
                  textExitTweenRef.current = gsap.to(textElement, {
                    autoAlpha: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                    onComplete: () => {
                      textTimeline?.pause(0)
                      textTimeline?.progress(0)
                      gsap.set(textElement, { xPercent: 45, autoAlpha: 0 })
                    },
                  })
                } else {
                  textTimeline?.pause(0)
                  textTimeline?.progress(0)
                }
              }
              lastTitleProgressRef.current = progress
            },
          },
        })
      }

      const text = textRef.current
      if (text) {
        gsap.set(text, { xPercent: 45, autoAlpha: 0 })
        textTimelineRef.current = gsap
          .timeline({ paused: true })
          .to(text, {
            xPercent: 0,
            autoAlpha: 1,
            ease: 'bounce.out',
            duration: 0.9,
          })
      }

      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          modelTextProgressRef.current = clampProgress(self.progress)
        },
        onLeave: () => {
          modelTextProgressRef.current = 1
        },
        onLeaveBack: () => {
          modelTextProgressRef.current = 0
        },
      })

      const image = imageContainerRef.current
      if (image) {
        imageTweenRef.current = gsap.fromTo(
          image,
          { scale: 0.85, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: 'power2.out',
            duration: 1,
            scrollTrigger: {
              trigger: section,
              start: () => `top+=${window.innerHeight * 0.38} top`,
              end: () => `top+=${window.innerHeight * 0.55} top`,
              scrub: true,
            },
          },
        )
      }
      const videoContainer = videoContainerRef.current
      if (videoContainer) {
        gsap.set(videoContainer, { autoAlpha: 0, yPercent: 8 })
      }
    }, sectionStoriesRef)

    return () => {
      ctx.revert()
      timelineRef.current?.kill()
      timelineRef.current = null
      modelTextProgressRef.current = 0
      storiesVideoRevealRef.current = 0
      titleTweenRef.current?.kill()
      textTimelineRef.current?.kill()
      imageTweenRef.current?.kill()
      videoTweenRef.current?.kill()
      textExitTweenRef.current?.kill()
      titleFadeTweenRef.current?.kill()
      videoLayoutTweenRef.current?.kill()
      videoContainerTweenRef.current?.kill()
      videoStateRef.current.value = 0
      videoShownRef.current = false
      lastTitleProgressRef.current = 0
      videoLayoutStateRef.current.value = 0
      videoExpandedRef.current = false
      storiesVideoLayoutRef.current = 0
      const containerEl = videoContainerRef.current
      if (containerEl) {
        gsap.set(containerEl, { autoAlpha: 0, yPercent: 8 })
      }
    }
  }, [modelTextProgressRef, storiesVideoRevealRef, storiesVideoLayoutRef, setIsReelLooping])

  return (
    <section
      ref={sectionStoriesRef}
      data-section-progress="stories"
      data-section-label="Stories"
      className="relative flex h-screen flex-col items-center justify-center overflow-hidden"
    >
      {/* Future story animations will live here */}
      <div className="container flex flex-col gap-20 py-36">
        <h2 ref={titleRef} className="h1 opacity-0">
          Where <span className="text-primary">stories</span>
          <br />
          breathe.
        </h2>
        <div className="flex items-center gap-20">
          {/* Future story animation image container here*/}
          <div className="flex-2 h-[485px]"/>
          <div className="flex-1 flex flex-col gap-2" ref={textRef}>
            <div className="h-2 w-10 rounded bg-primary" />
            <p className="max-w-96 text-left text-base">
              At <b>STUDIO</b>, we don't just produce videos - we create living, breathing visual narratives tailored to
              your brand and audience. Using cutting-edge AI and human craftsmanship, we transform your ideas into
              immersive visual experiences. No templates. No one-size-fits-all.
            </p>
          </div>
        </div>
      </div>
      <div
        className="absolute left-[15%] top-[12%] z-20 flex h-[85%] w-[70%] flex-col justify-between gap-14 opacity-0"
        ref={videoContainerRef}
        onMouseLeave={() => setIsReelLooping(false)}
      >
        <PlayReel text="PLAY REEL" numberIcons={3} repeat={4} isLooping={isReelLooping} marqueeSpeed={18} direction="left" />
        <div className="flex h-[80%] w-full items-center justify-center gap-14">
          <p className="h1">PLAY</p>
          <div
            className="flex h-[81px] w-[107px] items-center justify-center rounded-[30px] bg-white transition-all duration-300 ease-in-out hover:scale-110 hover:bg-primary cursor-pointer"
            onMouseEnter={() => {
              if (videoExpandedRef.current) {
                setIsReelLooping(true)
              }
            }}
            onMouseLeave={() => setIsReelLooping(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={43} height={43} viewBox="0 0 640 640">
              <path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z" />
            </svg>
          </div>
          <p className="h1">REEL</p>
        </div>
        <PlayReel text="PLAY REEL" numberIcons={3} repeat={4} isLooping={isReelLooping} marqueeSpeed={18} direction="right" />
      </div>
    </section>
  )
}
