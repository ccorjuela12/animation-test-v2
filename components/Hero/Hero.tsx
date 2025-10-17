"use client";
'use client';

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

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);
  const logoPathRef = useRef<SVGGeometryElement | null>(null);
  const pathRefs = useRef<(SVGGeometryElement | null)[]>([]);
  const [modelVisible, setModelVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const infoRevealRef = useRef({ left: false, right: false });

  useEffect(() => {
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.hero__title .line', { yPercent: 120, duration: 0.9, stagger: 0.06 }, 0)
      .from('.hero__sub', { y: 20, opacity: 0, duration: 0.6 }, 0.35);

    if (logoWrapperRef.current) {
      gsap.set(logoWrapperRef.current, { transformOrigin: '50% 50%', rotation: 0 });
    }

    // --- SVG intro animation ---
    const logoPath = logoPathRef.current;
    const iconPaths = pathRefs.current.filter(Boolean) as SVGGeometryElement[];
    const svgPaths = [logoPath, ...iconPaths].filter(Boolean) as SVGGeometryElement[];

    const preparePath = (element: SVGGeometryElement) => {
      const length = element.getTotalLength();
      element.setAttribute('fill', 'none');
      element.setAttribute('stroke', STROKE_COLOR);
      element.setAttribute('stroke-width', String(STROKE_WIDTH));
      element.style.strokeDasharray = String(length);
      element.style.strokeDashoffset = String(length);
    };

    const solidifyPath = (element: SVGGeometryElement) => {
      element.style.strokeDasharray = '';
      element.style.strokeDashoffset = '';
      if (element === logoPath) {
        element.setAttribute('fill', 'none');
        element.setAttribute('stroke', STROKE_COLOR);
        element.setAttribute('stroke-width', String(STROKE_WIDTH));
        element.setAttribute('stroke-opacity', '0.45');
      } else {
        element.removeAttribute('stroke');
        element.removeAttribute('stroke-width');
        element.removeAttribute('stroke-opacity');
        element.setAttribute('fill', 'white');
        element.setAttribute('fill-opacity', '0.25');
      }
    };

    const highlightPath = (element: SVGGeometryElement) => {
      element.setAttribute('fill', 'none');
      element.removeAttribute('fill-opacity');
      element.removeAttribute('stroke-opacity');
      element.setAttribute('stroke', STROKE_COLOR);
      element.setAttribute('stroke-width', String(STROKE_WIDTH));
    };

    svgPaths.forEach(preparePath);

    const iconsTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    if (logoPath) {
      iconsTl.to(logoPath, { strokeDashoffset: 0, duration: 0.9 }, 0);
      iconsTl.add(() => solidifyPath(logoPath));
    }

    iconPaths.forEach((element, index) => {
      const position = index === 0 && !logoPath ? 0 : '>';
      iconsTl.to(element, { strokeDashoffset: 0, duration: 0.7 }, position);
      iconsTl.add(() => solidifyPath(element));
    });

    iconsTl.add(() => {
      const fourth = iconPaths[3];
      if (fourth) highlightPath(fourth);
      setModelVisible(true);
    });

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
      end: 'bottom+=150% top',
      pin: true,
      scrub: 1,
      onUpdate: ({ progress }) => {
        setProgress(progress);
        if (!infoRevealRef.current.left && progress > 0.05) {
          infoRevealRef.current.left = true;
          gsap.to(infoTargets.left, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
        }
        if (!infoRevealRef.current.right && progress > 0.15) {
          infoRevealRef.current.right = true;
          gsap.to(infoTargets.right, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
        }
        if (logoWrapperRef.current) {
          gsap.to(logoWrapperRef.current, {
            rotation: progress * 360,
            duration: 0.4,
            ease: 'power2.out',
            overwrite: true,
          });
        }
      },
    });

    // Respeta reduce-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      svgPaths.forEach((element) => solidifyPath(element));
      const fourth = iconPaths[3];
      if (fourth) highlightPath(fourth);
      setModelVisible(true);
      tl.progress(1);
      iconsTl.progress(1);
      iconsTl.kill();
      st.disable();
      lenis.destroy();
      gsap.set([infoTargets.left, infoTargets.right], { opacity: 1, x: 0 });
      infoRevealRef.current = { left: true, right: true };
      if (logoWrapperRef.current) {
        gsap.set(logoWrapperRef.current, { rotation: 0 });
      }
    }

    return () => {
      cancelAnimationFrame(rafScrollId);
      iconsTl.kill();
      tl.kill();
      st.kill();
      ScrollTrigger.getAll().forEach((s) => s.kill());
      lenis.destroy();
    };
  }, []);

  const halfIndex = Math.floor(ICONS.length / 2);
  const firstIcons = ICONS.slice(0, halfIndex);
  const secondIcons = ICONS.slice(halfIndex);
  pathRefs.current.length = ICONS.length;

  return (
    <section className="hero relative overflow-hidden" ref={heroRef}>
      <div className="hero__canvas absolute inset-0 z-0">
        <GridCanvas className="h-full w-full" />
      </div>
      {/* Textura oculta hasta terminar animación de entrada */}
      {/* <CircleModel visible={modelVisible} progress={progress} /> */}
      <div className="hero__copy h-full py-20 relative z-10 place-content-center text-center">
        <div className="top min-h-3/6 flex flex-col justify-center items-center w-full">
          <div className="transition1">
            <div className="flex justify-center items-center gap-2.5">
              {firstIcons.map((icon, idx) => (
                <svg
                  key={`icon-left-${idx}`}
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
              <div
                ref={logoWrapperRef}
                className="hero__logo-wrapper flex items-center justify-center"
                style={{ width: '180px', height: '140px' }}
              >
                <svg
                  className="hero__logo"
                  viewBox="0 0 747 656"
                  width="150"
                  height="130"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    ref={(el) => {
                      logoPathRef.current = el;
                    }}
                    x="8"
                    y="8"
                    width="731"
                    height="640"
                    rx="48"
                    fill="none"
                  />
                </svg>
              </div>
              {secondIcons.map((icon, idx) => {
                const globalIndex = idx + firstIcons.length;
                return (
                  <svg
                    key={`icon-right-${globalIndex}`}
                    xmlns="http://www.w3.org/2000/svg"
                    width={icon.width}
                    height={icon.height}
                    viewBox={icon.viewBox}
                    fill="none"
                  >
                    <path
                      ref={(el) => {
                        pathRefs.current[globalIndex] = el;
                      }}
                      d={icon.d}
                      fill="none"
                    />
                  </svg>
                );
              })}
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



