"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { ICONS } from './icons';
import CircleModel from './CircleModel';
import GridCanvas from '../GridCanvas';

gsap.registerPlugin(ScrollTrigger);

const STROKE_COLOR = '#CAFF1D';
const STROKE_WIDTH = 3.8982;
const UNDRAW_START_THRESHOLD = 0.85;
const UNDRAW_RESET_THRESHOLD = 0.75;

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const pathLengthsRef = useRef<number[]>([]);
  const undrawTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const undrawTriggeredRef = useRef(false);
  const iconsReadyRef = useRef(false);
  const [modelVisible, setModelVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const infoRevealRef = useRef({ left: false, right: false });
  const [startGridAnimation, setStartGridAnimation] = useState(false);

  useEffect(() => {
    if (!heroRef.current) return;

    // --- GSAP: intro (texto) ---
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.hero__title .line', { yPercent: 120, duration: 0.9, stagger: 0.06 }, 0)
      .from('.hero__sub', { y: 20, opacity: 0, duration: 0.6 }, 0.35);

    // --- Animación de entrada de SVGs (secuencial) ---
    const svgPaths = pathRefs.current.filter(Boolean) as SVGPathElement[];

    const preparePath = (p: SVGPathElement, len: number) => {
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', STROKE_COLOR);
      p.setAttribute('stroke-width', String(STROKE_WIDTH));
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    };

    const solidifyPath = (p: SVGPathElement) => {
      p.removeAttribute('stroke');
      p.removeAttribute('stroke-width');
      p.style.strokeDasharray = '';
      p.style.strokeDashoffset = '';
      p.setAttribute('fill', 'white');
      p.style.opacity = '1';
    };

    const highlightPath = (p: SVGPathElement) => {
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', STROKE_COLOR);
      p.setAttribute('stroke-width', String(STROKE_WIDTH));
      p.style.opacity = '1';
    };

    // Preparación inicial
    svgPaths.forEach((path, index) => {
      const len = path.getTotalLength();
      pathLengthsRef.current[index] = len;
      preparePath(path, len);
    });

    const iconsTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    svgPaths.forEach((p, i) => {
      const len = pathLengthsRef.current[i];
      iconsTl.to(p, { strokeDashoffset: 0, duration: 0.4 }, i === 0 ? 0 : '>');
      iconsTl.add(() => solidifyPath(p));
    });

    // Al terminar todas las animaciones: resaltar el 4° SVG y mostrar el modelo
    iconsTl.add(() => {
      const fourth = svgPaths[3];
      if (fourth) highlightPath(fourth);
      setModelVisible(true);
      setStartGridAnimation(true);
      iconsReadyRef.current = true;
    });

    const undrawIcons = () => {
      if (!iconsReadyRef.current || !svgPaths.length) return;
      undrawTimelineRef.current?.kill();
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      const reversedPaths = [...svgPaths].reverse();
      reversedPaths.forEach((path, reverseIndex) => {
        const originalIndex = svgPaths.length - 1 - reverseIndex;
        const len = pathLengthsRef.current[originalIndex] ?? path.getTotalLength();
        const delay = reverseIndex * 0.18;
        tl.add(() => {
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', STROKE_COLOR);
          path.setAttribute('stroke-width', String(STROKE_WIDTH));
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = '0';
          path.style.opacity = '1';
        }, delay);
        tl.to(path, { strokeDashoffset: len, duration: 0.6 }, delay);
        tl.to(path, { opacity: 0, duration: 0.4 }, delay + 0.35);
      });
      undrawTimelineRef.current = tl;
    };

    const redrawIcons = () => {
      undrawTimelineRef.current?.kill();
      undrawTimelineRef.current = null;
      if (!iconsReadyRef.current || !svgPaths.length) return;
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      svgPaths.forEach((path, index) => {
        const len = pathLengthsRef.current[index] ?? path.getTotalLength();
        const delay = index * 0.18;
        tl.add(() => {
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', STROKE_COLOR);
          path.setAttribute('stroke-width', String(STROKE_WIDTH));
          path.style.opacity = '1';
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len);
        }, delay);
        tl.to(path, { strokeDashoffset: 0, duration: 0.6 }, delay);
        tl.add(() => {
          solidifyPath(path);
          path.style.strokeDasharray = '';
          path.style.strokeDashoffset = '';
        }, delay + 0.6);
      });
      tl.add(() => {
        const fourth = svgPaths[3];
        if (fourth) highlightPath(fourth);
      });
      undrawTimelineRef.current = tl;
    };

    // --- Lenis + ScrollTrigger (pin + scrub) ---
    const lenis = new Lenis({ lerp: 0.12 });
    let rafScrollId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafScrollId = requestAnimationFrame(raf);
    };
    rafScrollId = requestAnimationFrame(raf);

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
      end: 'bottom+=250% top', // Ajusta este offset para ampliar el recorrido y mostrar todas las im�genes.
      pin: true,
      scrub: 1,
      onUpdate: ({ progress }) => {
        setProgress(progress);
        const leftThreshold = 0.05;
        const rightThreshold = 0.15;

        if (!infoRevealRef.current.left && progress > leftThreshold) {
          infoRevealRef.current.left = true;
          gsap.to(infoTargets.left, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
        } else if (infoRevealRef.current.left && progress <= leftThreshold - 0.02) {
          infoRevealRef.current.left = false;
          gsap.to(infoTargets.left, { opacity: 0, x: -32, duration: 0.45, ease: 'power2.inOut' });
        }

        if (!infoRevealRef.current.right && progress > rightThreshold) {
          infoRevealRef.current.right = true;
          gsap.to(infoTargets.right, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
        } else if (infoRevealRef.current.right && progress <= rightThreshold - 0.02) {
          infoRevealRef.current.right = false;
          gsap.to(infoTargets.right, { opacity: 0, x: 32, duration: 0.45, ease: 'power2.inOut' });
        }

        if (iconsReadyRef.current) {
          if (!undrawTriggeredRef.current && progress >= UNDRAW_START_THRESHOLD) {
            undrawTriggeredRef.current = true;
            undrawIcons();
            gsap.to(infoTargets.left, { opacity: 0, x: -32, duration: 0.45, ease: 'power2.inOut' });
            gsap.to(infoTargets.right, { opacity: 0, x: 32, duration: 0.45, ease: 'power2.inOut' })
          } else if (undrawTriggeredRef.current && progress <= UNDRAW_RESET_THRESHOLD) {
            undrawTriggeredRef.current = false;
            redrawIcons();
            gsap.to(infoTargets.left, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' })
            gsap.to(infoTargets.right, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
          }
        }
      },
    });

    // Respeta reduce-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      svgPaths.forEach((p) => solidifyPath(p));
      const fourth = svgPaths[3];
      if (fourth) highlightPath(fourth);
      setModelVisible(true);
      tl.progress(1);
      st.disable();
      lenis.destroy();
      gsap.set([infoTargets.left, infoTargets.right], { opacity: 1, x: 0 });
      infoRevealRef.current = { left: true, right: true };
      iconsReadyRef.current = true;
    }

    return () => {
      cancelAnimationFrame(rafScrollId);
      ScrollTrigger.getAll().forEach((s) => s.kill());
      lenis.destroy();
      undrawTimelineRef.current?.kill();
      undrawTimelineRef.current = null;
    };
  }, []);

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
              {ICONS.map((icon, idx) => (
                <svg
                  key={idx}
                  xmlns="http://www.w3.org/2000/svg"
                  width={icon.width}
                  height={icon.height}
                  viewBox={icon.viewBox}
                  fill="none"
                >
                  <path
                    ref={(el) => {
                      pathRefs.current[idx] = el;
                    }}
                    d={icon.d}
                    fill="none"
                  />
                </svg>
              ))}
            </div>
          </div>
        </div>
        <div className="bottom absolute bottom-10 w-full">
          <div className="hero__info flex flex-row justify-between items-center mb-4 space-x-2 container">
            <div className="hero__info-left max-w-fit">
              <span className='border border-white rounded-4xl py-2 px-4 mb-4 h2'>Your story, </span><br />
              <h2 className='mt-2 font-light text-left px-4'>
                reinvented<br/> through AI.
              </h2>
            </div>
            <div className='hero__info-right max-w-96 flex flex-col gap-2 items-start'>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16" fill="none">
                <path d="M10.5583 0C20.6612 0 21.0732 0.411924 21.0732 8C21.0732 15.5881 20.6829 16 10.5583 16C0.411929 16 0 15.5881 0 8C0 0.411924 0.433608 0 10.5583 0ZM15.8482 12.206C16.1734 12.206 16.4336 11.9458 16.4336 11.6206V4.3794C16.4336 4.0542 16.1734 3.79404 15.8482 3.79404H5.22493C4.89973 3.79404 4.63957 4.0542 4.63957 4.3794V11.6206C4.63957 11.9458 4.89973 12.206 5.22493 12.206H15.8482Z" fill="#CAFF1D"/>
              </svg>
              <p className='max-w-96 text-left'>
                At <b>STUDIO</b>, we merge artificial intelligence and creativity to craft videos that captivate, adapt, and resonate.
              </p>
            </div>
          </div>
          <p className="hero__sub text-center pt-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="16" viewBox="0 0 11 16" fill="none" className='m-auto'>
              <path d="M5.35156 1.42188L0.703125 6.0625L0 5.35938L5.35156 0L10.7031 5.35938L10 6.0625L5.35156 1.42188ZM5.35156 14L10 9.35938L10.7031 10.0625L5.35156 15.4219L0 10.0625L0.703125 9.35938L5.35156 14Z" fill="#FDFEFF"/>
            </svg>
            scroll to explore
          </p>
        </div>
      </div>
    </section>
  );
}

