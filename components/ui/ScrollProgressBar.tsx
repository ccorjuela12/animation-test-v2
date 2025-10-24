'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let storedProgress = -1;

    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;
      const nextProgress = Math.min(Math.max(maxScroll > 0 ? scrollTop / maxScroll : 0, 0), 1);

      if (Math.abs(nextProgress - storedProgress) > 0.001) {
        storedProgress = nextProgress;
        setProgress(nextProgress);
      }

      frameId = 0;
    };

    const requestUpdate = () => {
      if (frameId !== 0) {
        return;
      }
      frameId = window.requestAnimationFrame(updateProgress);
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  const percent = Math.round(progress * 100);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-end justify-between px-6 pt-6">
        <span className="text-[10px] uppercase tracking-[0.5em] text-white/30">
          Scroll progress
        </span>
        <span className="text-sm font-medium text-white">
          {percent}
          <span className="ml-1 text-xs text-white/50">%</span>
        </span>
      </div>
      <div className="mx-auto mt-3 h-px max-w-6xl overflow-hidden bg-white/10">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avance de desplazamiento"
          className="h-full origin-left bg-gradient-to-r from-lime-400 via-white to-white/30 transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  );
}
