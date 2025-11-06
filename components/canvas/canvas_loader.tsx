'use client'

import { useProgress } from '@react-three/drei'
import gsap from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PathEntry } from '@/types/types'
import { ICONS } from './utils/icons'

const STROKE_COLOR = '#FF4000'
const STROKE_WIDTH = 1



export default function CanvasLoader() {
  const { active, progress } = useProgress()
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const iconsWrapperRef = useRef<HTMLDivElement | null>(null)

  const pathDefinitions = useMemo(() => ICONS.flatMap((icon) => icon.paths), [])
  const pathRefs = useRef<(SVGPathElement | null)[]>(new Array(pathDefinitions.length).fill(null))
  const pathLengthsRef = useRef<number[]>(new Array(pathDefinitions.length).fill(0))

  const iconTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const exitTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const iconsCompleteRef = useRef(false)
  const activeRef = useRef(active)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [overlayActive, setOverlayActive] = useState(true)

  const registerPath = useCallback(
    (index: number) => (element: SVGPathElement | null) => {
      pathRefs.current[index] = element
    },
    [],
  )

  const getPathEntries = useCallback((): PathEntry[] => {
    const entries: PathEntry[] = []
    pathRefs.current.forEach((path, index) => {
      if (path) {
        entries.push({
          path,
          index,
          def: pathDefinitions[index] ?? { d: '' },
        })
      }
    })
    return entries
  }, [pathDefinitions])

  const preparePaths = useCallback((entries: PathEntry[]) => {
    entries.forEach(({ path, index }) => {
      const length = path.getTotalLength()
      pathLengthsRef.current[index] = length
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', STROKE_COLOR)
      path.setAttribute('stroke-width', String(STROKE_WIDTH))
      path.style.strokeDasharray = String(length)
      path.style.strokeDashoffset = String(length)
      path.style.opacity = '1'
    })
  }, [])

  const solidifyPath = useCallback(
    (entry: PathEntry) => {
      const { path, index, def } = entry
      const fill = def.finalFill ?? '#FFFFFF'
      path.removeAttribute('stroke')
      path.removeAttribute('stroke-width')
      path.style.strokeDasharray = ''
      path.style.strokeDashoffset = ''
      path.setAttribute('fill', fill)
      path.style.opacity = '1'
      pathLengthsRef.current[index] = def.d ? path.getTotalLength() : pathLengthsRef.current[index]
    },
    [],
  )

  const resetOverlay = useCallback(() => {
    exitTimelineRef.current?.kill()
    exitTimelineRef.current = null

    if (overlayRef.current) {
      gsap.set(overlayRef.current, {
        opacity: 1,
        scale: 1,
        pointerEvents: 'auto',
        transformOrigin: '50% 50%',
      })
    }

    if (iconsWrapperRef.current) {
      gsap.set(iconsWrapperRef.current, { opacity: 1, scale: 1 })
    }
  }, [])

  const resetScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
    const maybeLenis = (window as unknown as { lenis?: { scrollTo?: (position: number, options?: { immediate?: boolean }) => void } }).lenis
    if (maybeLenis?.scrollTo) {
      maybeLenis.scrollTo(0, { immediate: true })
    }
  }, [])

  const exitOverlay = useCallback(() => {
    if (!overlayActive) {
      return
    }

    if (activeRef.current || !iconsCompleteRef.current || exitTimelineRef.current) {
      return
    }

    const overlay = overlayRef.current
    if (!overlay) {
      setOverlayActive(false)
      return
    }

    resetScrollPosition()

    exitTimelineRef.current = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        exitTimelineRef.current = null
        setOverlayActive(false)
        resetScrollPosition()
      },
    })

    if (iconsWrapperRef.current) {
      exitTimelineRef.current.to(
        iconsWrapperRef.current,
        { opacity: 0, scale: 0.86, duration: 0.35 },
        0,
      )
    }

    exitTimelineRef.current.to(
      overlay,
      {
        scale: 1.12,
        opacity: 0,
        duration: 0.75,
      },
      0,
    )
  }, [overlayActive, resetScrollPosition])

  const drawPaths = useCallback(
    (entries: PathEntry[]) => {
      iconsCompleteRef.current = false
      iconTimelineRef.current?.kill()

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          iconsCompleteRef.current = true
          exitOverlay()
        },
      })

      entries.forEach((entry, idx) => {
        const length = pathLengthsRef.current[entry.index] ?? entry.path.getTotalLength()
        timeline.to(entry.path, { strokeDashoffset: 0, duration: 0.45 }, idx === 0 ? 0 : '>')
        timeline.add(() => solidifyPath(entry))
      })

      iconTimelineRef.current = timeline
    },
    [exitOverlay, solidifyPath],
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(media.matches)
    updatePreference()
    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (active) {
      setOverlayActive(true)
    }
  }, [active])

  useEffect(() => {
    if (!overlayActive) {
      pathRefs.current = new Array(pathDefinitions.length).fill(null)
      pathLengthsRef.current = new Array(pathDefinitions.length).fill(0)
      return
    }

    resetOverlay()
  }, [overlayActive, pathDefinitions.length, resetOverlay])

  useLayoutEffect(() => {
    if (!overlayActive) {
      return
    }

    let rafId: number | null = null

    const setup = () => {
      const entries = getPathEntries()
      if (!entries.length) {
        rafId = requestAnimationFrame(setup)
        return
      }

      iconsCompleteRef.current = false
      preparePaths(entries)

      if (prefersReducedMotion) {
        entries.forEach((entry) => solidifyPath(entry))
        iconsCompleteRef.current = true
        exitOverlay()
        return
      }

      drawPaths(entries)
    }

    setup()

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      iconTimelineRef.current?.kill()
      iconTimelineRef.current = null
    }
  }, [drawPaths, exitOverlay, getPathEntries, overlayActive, preparePaths, prefersReducedMotion, solidifyPath])

  useEffect(() => {
    activeRef.current = active

    if (!overlayActive) {
      return
    }

    const entries = getPathEntries()
    if (!entries.length) {
      return
    }

    if (active) {
      iconsCompleteRef.current = prefersReducedMotion
      resetOverlay()
      preparePaths(entries)

      if (prefersReducedMotion) {
        entries.forEach((entry) => solidifyPath(entry))
      } else if (iconTimelineRef.current) {
        iconTimelineRef.current.progress(0).restart()
      } else {
        drawPaths(entries)
      }
    } else {
      exitOverlay()
    }
  }, [
    active,
    drawPaths,
    exitOverlay,
    getPathEntries,
    overlayActive,
    preparePaths,
    prefersReducedMotion,
    resetOverlay,
    solidifyPath,
  ])

  if (!overlayActive) {
    return null
  }

  let pathIndex = -1

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-6 bg-black text-center text-white"
    >
      <div
        ref={iconsWrapperRef}
        className="flex flex-col items-center justify-center gap-2.5"
      >
        <div className="flex items-center justify-center gap-2.5">
          {ICONS.map((icon, index) => (
            <svg
              key={index}
              xmlns="http://www.w3.org/2000/svg"
              width={icon.width}
              height={icon.height}
              viewBox={icon.viewBox}
              fill="none"
            >
              {icon.paths.map((pathDef) => {
                pathIndex += 1
                return (
                  <path
                    key={`${pathIndex}-${pathDef.d.slice(0, 12)}`}
                    ref={registerPath(pathIndex)}
                    d={pathDef.d}
                    fill="none"
                  />
                )
              })}
            </svg>
          ))}
        </div>
      </div>
    </div>
  )
}
