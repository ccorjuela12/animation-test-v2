"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { ICONS, type IconPathDef } from './icons';
import CircleModel from './CircleModel';
import GridCanvas from '../GridCanvas';

gsap.registerPlugin(ScrollTrigger);

const STROKE_COLOR = '#CAFF1D';
const STROKE_WIDTH = 3.8982;
const UNDRAW_START_THRESHOLD = 0.85;
const UNDRAW_RESET_THRESHOLD = 0.75;

type PathEntry = {
  path: SVGPathElement;
  index: number;
  def: IconPathDef;
};

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const pathDefinitions = useMemo(() => ICONS.flatMap((icon) => icon.paths), []);
  const pathRefs = useRef<(SVGPathElement | null)[]>(new Array(pathDefinitions.length).fill(null));
  const pathLengthsRef = useRef<number[]>(new Array(pathDefinitions.length).fill(0));
  const undrawTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const undrawTriggeredRef = useRef(false);
  const iconsReadyRef = useRef(false);
  const [modelVisible, setModelVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const infoRevealRef = useRef({ left: false, right: false });
  const [startGridAnimation, setStartGridAnimation] = useState(false);

  const registerPath = useCallback(
    (index: number) => (element: SVGPathElement | null) => {
      pathRefs.current[index] = element;
    },
    [],
  );

  const getPathEntries = useCallback((): PathEntry[] => {
    const entries: PathEntry[] = [];
    pathRefs.current.forEach((path, index) => {
      if (path) {
        entries.push({
          path,
          index,
          def: pathDefinitions[index] ?? { d: '' },
        });
      }
    });
    return entries;
  }, [pathDefinitions]);

  useEffect(() => {
    if (!heroRef.current) return;

    const textTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    textTl
      .from('.hero__title .line', { yPercent: 120, duration: 0.9, stagger: 0.06 }, 0)
      .from('.hero__sub', { y: 20, opacity: 0, duration: 0.6 }, 0.35);

    const initialEntries = getPathEntries();
    if (!initialEntries.length) {
      return;
    }

    const highlightEntry = (entry: PathEntry | undefined) => {
      if (!entry) return;
      entry.path.setAttribute('fill', 'none');
      entry.path.setAttribute('stroke', STROKE_COLOR);
      entry.path.setAttribute('stroke-width', String(STROKE_WIDTH));
      entry.path.style.opacity = '1';
    };

    const prepareEntry = (entry: PathEntry) => {
      const len = entry.path.getTotalLength();
      pathLengthsRef.current[entry.index] = len;
      entry.path.setAttribute('fill', 'none');
      entry.path.setAttribute('stroke', STROKE_COLOR);
      entry.path.setAttribute('stroke-width', String(STROKE_WIDTH));
      entry.path.style.strokeDasharray = String(len);
      entry.path.style.strokeDashoffset = String(len);
      entry.path.style.opacity = '1';
    };

    const solidifyEntry = (entry: PathEntry) => {
      entry.path.removeAttribute('stroke');
      entry.path.removeAttribute('stroke-width');
      entry.path.style.strokeDasharray = '';
      entry.path.style.strokeDashoffset = '';
      entry.path.setAttribute('fill', entry.def.finalFill ?? '#FFFFFF');
      entry.path.style.opacity = '1';
    };

    initialEntries.forEach(prepareEntry);

    const iconsTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    initialEntries.forEach((entry, i) => {
      const len = pathLengthsRef.current[entry.index] ?? entry.path.getTotalLength();
      iconsTl.to(entry.path, { strokeDashoffset: 0, duration: 0.4 }, i === 0 ? 0 : '>');
      iconsTl.add(() => solidifyEntry(entry));
    });

    iconsTl.add(() => {
      highlightEntry(initialEntries[3]);
      setModelVisible(true);
      setStartGridAnimation(true);
      iconsReadyRef.current = true;
    });

    const undrawIcons = () => {
      const currentEntries = getPathEntries();
      if (!iconsReadyRef.current || !currentEntries.length) return;
      undrawTimelineRef.current?.kill();
      const tlIcons = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      const reversedEntries = [...currentEntries].reverse();
      reversedEntries.forEach((entry, reverseIndex) => {
        const len = pathLengthsRef.current[entry.index] ?? entry.path.getTotalLength();
        const delay = reverseIndex * 0.18;
        tlIcons.add(() => {
          entry.path.setAttribute('fill', 'none');
          entry.path.setAttribute('stroke', STROKE_COLOR);
          entry.path.setAttribute('stroke-width', String(STROKE_WIDTH));
          entry.path.style.strokeDasharray = String(len);
          entry.path.style.strokeDashoffset = '0';
          entry.path.style.opacity = '1';
        }, delay);
        tlIcons.to(entry.path, { strokeDashoffset: len, duration: 0.6 }, delay);
        tlIcons.to(entry.path, { opacity: 0, duration: 0.4 }, delay + 0.35);
      });
      undrawTimelineRef.current = tlIcons;
    };

    const redrawIcons = () => {
      const currentEntries = getPathEntries();
      undrawTimelineRef.current?.kill();
      undrawTimelineRef.current = null;
      if (!iconsReadyRef.current || !currentEntries.length) return;
      const tlIcons = gsap.timeline({ defaults: { ease: 'power2.out' } });
      currentEntries.forEach((entry, index) => {
        const len = pathLengthsRef.current[entry.index] ?? entry.path.getTotalLength();
        const delay = index * 0.18;
        tlIcons.add(() => {
          entry.path.setAttribute('fill', 'none');
          entry.path.setAttribute('stroke', STROKE_COLOR);
          entry.path.setAttribute('stroke-width', String(STROKE_WIDTH));
          entry.path.style.opacity = '1';
          entry.path.style.strokeDasharray = String(len);
          entry.path.style.strokeDashoffset = String(len);
        }, delay);
        tlIcons.to(entry.path, { strokeDashoffset: 0, duration: 0.6 }, delay);
        tlIcons.add(() => {
          solidifyEntry(entry);
          entry.path.style.strokeDasharray = '';
          entry.path.style.strokeDashoffset = '';
        }, delay + 0.6);
      });
      tlIcons.add(() => {
        highlightEntry(currentEntries[3]);
      });
      undrawTimelineRef.current = tlIcons;
    };

    const lenis = new Lenis({ lerp: 0.12 });
    let rafScrollId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafScrollId = requestAnimationFrame(raf);
    };
    rafScrollId = requestAnimationFrame(raf);
    // @ts-ignore
    (window as any).lenis = lenis;

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value?: number) {
        if (typeof value === 'number') {
          lenis.scrollTo(value);
          return undefined as unknown as number;
        }
        return window.scrollY;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.body.style.transform ? 'transform' : 'fixed',
    });
    lenis.on('scroll', ScrollTrigger.update);

    const infoTargets = {
      left: '.hero__info-left',
      right: '.hero__info-right',
    };

    gsap.set(infoTargets.left, { opacity: 0, x: -32 });
    gsap.set(infoTargets.right, { opacity: 0, x: 32 });

    const st = ScrollTrigger.create({
      trigger: heroRef.current!,
      start: 'top top',
      end: 'bottom+=250% top',
      pin: true,
      scrub: 1,
      onUpdate: ({ progress: currentProgress }) => {
        setProgress(currentProgress);
        const leftThreshold = 0.05;
        const rightThreshold = 0.15;

        if (!infoRevealRef.current.left && currentProgress > leftThreshold) {
          infoRevealRef.current.left = true;
          gsap.to(infoTargets.left, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
        } else if (infoRevealRef.current.left && currentProgress <= leftThreshold - 0.02) {
          infoRevealRef.current.left = false;
          gsap.to(infoTargets.left, { opacity: 0, x: -32, duration: 0.45, ease: 'power2.inOut' });
        }

        if (!infoRevealRef.current.right && currentProgress > rightThreshold) {
          infoRevealRef.current.right = true;
          gsap.to(infoTargets.right, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
        } else if (infoRevealRef.current.right && currentProgress <= rightThreshold - 0.02) {
          infoRevealRef.current.right = false;
          gsap.to(infoTargets.right, { opacity: 0, x: 32, duration: 0.45, ease: 'power2.inOut' });
        }

        if (iconsReadyRef.current) {
          if (!undrawTriggeredRef.current && currentProgress >= UNDRAW_START_THRESHOLD) {
            undrawTriggeredRef.current = true;
            undrawIcons();
            gsap.to(infoTargets.left, { opacity: 0, x: -32, duration: 0.45, ease: 'power2.inOut' });
            gsap.to(infoTargets.right, { opacity: 0, x: 32, duration: 0.45, ease: 'power2.inOut' });
          } else if (undrawTriggeredRef.current && currentProgress <= UNDRAW_RESET_THRESHOLD) {
            undrawTriggeredRef.current = false;
            redrawIcons();
            gsap.to(infoTargets.left, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
            gsap.to(infoTargets.right, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
          }
        }
      },
    });

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      initialEntries.forEach(solidifyEntry);
      highlightEntry(initialEntries[3]);
      setModelVisible(true);
      textTl.progress(1);
      st.disable();
      // @ts-ignore
      if ((window as any).lenis === lenis) {
        // @ts-ignore
        delete (window as any).lenis;
      }
      lenis.destroy();
      gsap.set([infoTargets.left, infoTargets.right], { opacity: 1, x: 0 });
      infoRevealRef.current = { left: true, right: true };
      iconsReadyRef.current = true;
    }

    return () => {
      cancelAnimationFrame(rafScrollId);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      // @ts-ignore
      if ((window as any).lenis === lenis) {
        // @ts-ignore
        delete (window as any).lenis;
      }
      lenis.destroy();
      undrawTimelineRef.current?.kill();
      undrawTimelineRef.current = null;
    };
  }, [getPathEntries]);

  let pathIndex = -1;

  return (
    <section className="hero relative overflow-hidden" ref={heroRef}>
      <div className="hero__canvas absolute inset-0 z-0">
        <GridCanvas className="h-full w-full" animateIn={startGridAnimation} scrollProgress={progress} />
      </div>
      {/* Textura oculta hasta terminar animación de entrada */}
      {/* <CircleModel visible={modelVisible} progress={progress} /> */}
      <div className="hero__copy h-full py-20 relative z-10 place-content-center text-center">
        <div className="top min-h-3/6 flex flex-col justify-center items-center w-full">
          <div className="transition1">
            <div className="flex justify-center items-center gap-2.5">
              {ICONS.map((icon) => (
                <svg
                  key={`${icon.viewBox}-${icon.paths.length}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width={icon.width}
                  height={icon.height}
                  viewBox={icon.viewBox}
                  fill="none"
                >
                  {icon.paths.map((pathDef) => {
                    pathIndex += 1;
                    return (
                      <path
                        key={`${pathIndex}-${pathDef.d.slice(0, 12)}`}
                        ref={registerPath(pathIndex)}
                        d={pathDef.d}
                        fill="none"
                      />
                    );
                  })}
                </svg>
              ))}
            </div>
          </div>
        </div>
        <div className="bottom absolute bottom-10 w-full">
          <div className="hero__info flex flex-row justify-between items-center mb-4 space-x-2 container">
            <div className="hero__info-left max-w-fit">
              <span className="border border-white rounded-4xl py-2 px-4 mb-4 h2">Your story, </span>
              <br />
              <h2 className="mt-2 font-light text-left px-4">
                reinvented
                <br /> through AI.
              </h2>
            </div>
            <div className="hero__info-right max-w-96 flex flex-col gap-2 items-start">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16" fill="none">
                <path d="M10.5583 0C20.6612 0 21.0732 0.411924 21.0732 8C21.0732 15.5881 20.6829 16 10.5583 16C0.411929 16 0 15.5881 0 8C0 0.411924 0.433608 0 10.5583 0ZM15.8482 12.206C16.1734 12.206 16.4336 11.9458 16.4336 11.6206V4.3794C16.4336 4.0542 16.1734 3.79404 15.8482 3.79404H5.22493C4.89973 3.79404 4.63957 4.0542 4.63957 4.3794V11.6206C4.63957 11.9458 4.89973 12.206 5.22493 12.206H15.8482Z" fill="#CAFF1D" />
              </svg>
              <p className="max-w-96 text-left">
                At <b>STUDIO</b>, we merge artificial intelligence and creativity to craft videos that captivate, adapt, and resonate.
              </p>
            </div>
          </div>
          <p className="hero__sub text-center pt-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="16" viewBox="0 0 11 16" fill="none" className="m-auto">
              <path d="M5.35156 1.42188L0.703125 6.0625L0 5.35938L5.35156 0L10.7031 5.35938L10 6.0625L5.35156 1.42188ZM5.35156 14L10 9.35938L10.7031 10.0625L5.35156 15.4219L0 10.0625L0.703125 9.35938L5.35156 14Z" fill="#FDFEFF" />
            </svg>
            scroll to explore
          </p>
        </div>
      </div>
    </section>
  );
}
