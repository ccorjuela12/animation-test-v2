'use client'

import AnimationCanvas from '@/components/canvas/animation_canvas'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'
import { useRef } from 'react'

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <ScrollProgressBar />
      <main ref={containerRef} className="relative min-h-[280vh] bg-black text-white">
        <div className="pointer-events-none sticky top-0 h-screen w-full">
          <AnimationCanvas containerRef={containerRef} />
          <div className="bottom absolute bottom-10 w-full">
            <div className="hero__info container mb-4 flex flex-row items-center justify-between space-x-2">
              <div className="hero__info-left max-w-fit">
                <span className="h2 mb-4 rounded-4xl border border-white py-2 px-4">Your story, </span>
                <br />
                <h2 className="mt-2 px-4 text-left font-light">
                  reinvented
                  <br /> through AI.
                </h2>
              </div>
              <div className="hero__info-right max-w-96 flex flex-col items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16" fill="none">
                  <path d="M10.5583 0C20.6612 0 21.0732 0.411924 21.0732 8C21.0732 15.5881 20.6829 16 10.5583 16C0.411929 16 0 15.5881 0 8C0 0.411924 0.433608 0 10.5583 0ZM15.8482 12.206C16.1734 12.206 16.4336 11.9458 16.4336 11.6206V4.3794C16.4336 4.0542 16.1734 3.79404 15.8482 3.79404H5.22493C4.89973 3.79404 4.63957 4.0542 4.63957 4.3794V11.6206C4.63957 11.9458 4.89973 12.206 5.22493 12.206H15.8482Z" fill="#CAFF1D" />
                </svg>
                <p className="max-w-96 text-left">
                  At <b>STUDIO</b>, we merge artificial intelligence and creativity to craft videos that captivate, adapt, and resonate.
                </p>
              </div>
            </div>
            <p className="hero__sub pt-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="16" viewBox="0 0 11 16" fill="none" className="m-auto">
                <path d="M5.35156 1.42188L0.703125 6.0625L0 5.35938L5.35156 0L10.7031 5.35938L10 6.0625L5.35156 1.42188ZM5.35156 14L10 9.35938L10.7031 10.0625L5.35156 15.4219L0 10.0625L0.703125 9.35938L5.35156 14Z" fill="#FDFEFF" />
              </svg>
              scroll to explore
            </p>
          </div>
        </div>
        
      </main>
      
    </>
  )
}
