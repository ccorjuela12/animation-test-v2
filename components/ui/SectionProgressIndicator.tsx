'use client'

import { useEffect, useRef, useState } from 'react'

type SectionEntry = {
  id: string
  label: string
  progress: number
}

type SectionConfig = {
  node: HTMLElement
  id: string
  label: string
}

export default function SectionProgressIndicator() {
  const [sections, setSections] = useState<SectionEntry[]>([])
  const configRef = useRef<SectionConfig[]>([])
  const previousProgressRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)
  const retryTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const computeProgress = () => {
      if (configRef.current.length === 0) {
        rafRef.current = 0
        return
      }

      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight || 1

      const updated = configRef.current.map((entry) => {
        const rect = entry.node.getBoundingClientRect()
        const sectionTop = rect.top + scrollY
        const sectionHeight = entry.node.offsetHeight || rect.height || 1
        const numerator = scrollY + viewportHeight - sectionTop
        const denominator = sectionHeight + viewportHeight
        const progress = Math.min(Math.max(numerator / denominator, 0), 1)
        return { ...entry, progress }
      })

      const previous = previousProgressRef.current
      const changed =
        updated.length !== previous.length ||
        updated.some((entry, index) => Math.abs(entry.progress - (previous[index] ?? -1)) > 0.01)

      if (changed) {
        previousProgressRef.current = updated.map((entry) => entry.progress)
        setSections(updated.map(({ id, label, progress }) => ({ id, label, progress })))
      }

      rafRef.current = 0
    }

    const scheduleProgressUpdate = () => {
      if (rafRef.current !== 0) {
        return
      }
      rafRef.current = window.requestAnimationFrame(computeProgress)
    }

    const collectSections = () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      const elements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-section-progress]'),
      )

      if (elements.length === 0) {
        configRef.current = []
        previousProgressRef.current = []
        setSections([])
        retryTimeoutRef.current = window.setTimeout(collectSections, 250)
        return
      }

      configRef.current = elements.map((element, index) => ({
        node: element,
        id: element.dataset.sectionProgress ?? `section-${index}`,
        label: element.dataset.sectionLabel ?? `Section ${index + 1}`,
      }))
      previousProgressRef.current = configRef.current.map(() => 0)
      setSections(
        configRef.current.map(({ id, label }) => ({
          id,
          label,
          progress: 0,
        })),
      )
      scheduleProgressUpdate()
    }

    const initFrame = window.requestAnimationFrame(collectSections)
    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
    window.addEventListener('resize', scheduleProgressUpdate)

    return () => {
      window.cancelAnimationFrame(initFrame)
      if (rafRef.current !== 0) {
        window.cancelAnimationFrame(rafRef.current)
      }
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current)
      }
      window.removeEventListener('scroll', scheduleProgressUpdate)
      window.removeEventListener('resize', scheduleProgressUpdate)
    }
  }, [])

  if (sections.length <= 1) {
    return null
  }

  return (
    <aside className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:flex">
      <div className="relative flex h-[70vh] w-12 flex-col items-center justify-between rounded-full border border-white/10 bg-black/30 px-4 py-6 backdrop-blur">
        <div className="absolute left-1/2 top-6 bottom-6 w-px -translate-x-1/2 bg-white/10" />
        <div className="flex h-full w-full flex-col justify-between">
          {sections.map((section, index) => {
            const clampedProgress = Math.min(Math.max(section.progress, 0), 1)
            const isCurrent = clampedProgress > 0 && clampedProgress < 1
            const isComplete = clampedProgress >= 0.99
            const dotScale = isComplete ? 1 : isCurrent ? 0.85 : 0.6
            const dotColor = isComplete ? '#FF4000' : '#ffffff'
            const dotOpacity = isComplete ? 1 : isCurrent ? 0.85 : 0.25

            const labelOpacity = isCurrent ? 1 : 0

            return (
              <div
                key={section.id}
                className={`flex ${index < sections.length - 1 ? 'flex-1' : 'flex-none'} flex-col items-center`}
              >
                <div className="relative flex h-6 w-full items-center justify-center">
                  <span
                    className="pointer-events-none absolute right-full mr-4 whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-white/70 transition-opacity duration-300 ease-out"
                    style={{ opacity: labelOpacity }}
                  >
                    {section.label}
                  </span>
                  <span
                    className="h-3 w-3 rounded-full transition-transform duration-300 ease-out"
                    style={{
                      background: dotColor,
                      opacity: dotOpacity,
                      transform: `scale(${dotScale})`,
                    }}
                  />
                </div>
                {index < sections.length - 1 && (
                  <div className="relative mx-auto mt-2 flex h-full w-px flex-1">
                    <div
                      className="absolute inset-0 rounded-full bg-white/15 transition-opacity duration-300 ease-out"
                      style={{ opacity: clampedProgress > 0 ? 0.1 : 0 }}
                    />
                    <div
                      className="absolute inset-0 origin-top bg-gradient-to-b from-primary via-white to-white/20 transition-transform duration-300 ease-out"
                      style={{
                        transform: `scaleY(${clampedProgress})`,
                        opacity: clampedProgress > 0 ? 1 : 0,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
