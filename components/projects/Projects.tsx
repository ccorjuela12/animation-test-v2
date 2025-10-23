"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  category: string;
  title: string;
  description: string;
  cta: string;
  media: string;
  preview: string;
};

const SLIDES: Slide[] = [
  {
    id: "immersive-sound",
    category: "Project Category",
    title: "Neon Soundscapes",
    description:
      "Lorem ipsum dolor sit amet consectetur. Pellentesque nisl sed congue in felis at nisl libero risus lectus justo odio.",
    cta: "View case study",
    media:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1600&q=80",
    preview:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "sensorial-commerce",
    category: "Interactive Retail",
    title: "Sensors In Motion",
    description:
      "Curated microinteracciones con sensores de proximidad, feedback haptico y composicion tipografica adaptable.",
    cta: "Launch experience",
    media:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80",
    preview:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "immersive-labs",
    category: "Realtime Visuals",
    title: "Spectrum Labs",
    description:
      "Audio-reactive pipelines con curvas organicas y capas de glitch controladas desde un timeline modular.",
    cta: "Watch prototype",
    media:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
    preview:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "motion-system",
    category: "Design Systems",
    title: "Motion Atlas",
    description:
      "Libreria de patrones compatibles con WebGL, presets reutilizables y orquestacion basada en tokens.",
    cta: "Open repository",
    media:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80",
    preview:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=700&q=80",
  },
];

export default function Projects() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const amberRef = useRef<HTMLDivElement | null>(null);
  const activeFrameRef = useRef<HTMLDivElement | null>(null);
  const activeFigureRef = useRef<HTMLElement | null>(null);
  const prevOverflowRef = useRef<string>("");
  const measuredScaleRef = useRef<number>(1.5);
  const [pinned, setPinned] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"expand" | "contract">("expand");
  const [phaseT, setPhaseT] = useState(0); // 0..1 dentro de la fase actual
  const [completedCount, setCompletedCount] = useState(0);
  const visitedRef = useRef<Set<number>>(new Set());
  const phaseRef = useRef<"expand" | "contract">("expand");
  const phaseTRef = useRef(0);
  const activeIndexRef = useRef(0);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const showHeader = progress >= 0.11;
  const showImages = progress >= 0.20;
  const getRowItemStyle = (i: number): React.CSSProperties => {
    const revealStart = 0.42; // 42% de scroll
    const itemStep = 0.03; // separación entre items
    const span = 0.06; // ancho de la rampa de aparición por item
    const start = revealStart + i * itemStep;
    const tRaw = (progress - start) / span;
    const t = Math.max(0, Math.min(1, tRaw));
    const y = (1 - t) * 8; // px
    return {
      opacity: t,
      transform: `translateY(${y}px)`,
      willChange: 'opacity, transform',
    };
  };

  const total = SLIDES.length;
  const current = SLIDES[activeIndex];
  const previous = SLIDES[(activeIndex - 1 + total) % total];
  const next = SLIDES[(activeIndex + 1) % total];

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      {
        rootMargin: "-10% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  // Medir escala necesaria para fullscreen (aprox) del frame activo
  useLayoutEffect(() => {
    const el = activeFigureRef.current || activeFrameRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vw = Math.max(window.innerWidth, 1);
      const vh = Math.max(window.innerHeight, 1);
      const scaleX = vw / Math.max(rect.width, 1);
      const scaleY = vh / Math.max(rect.height, 1);
      measuredScaleRef.current = Math.min(2.5, Math.max(scaleX, scaleY) * 1.02);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex]);

  // Detectar cuando la sección queda al tope para pin interno
  useEffect(() => {
    const onScroll = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const atTop = rect.top <= 0.5 && rect.bottom - 1 > window.innerHeight;
      setPinned(atTop);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mantener refs sincronizados para handlers estables
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { phaseTRef.current = phaseT; }, [phaseT]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // Capturar rueda cuando está pinneado y conducir la animación por fases (handlers estables)
  useEffect(() => {
    if (!pinned) return;
    const sensitivity = 0.001; // más bajo = más suave
    const totalSlides = total;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      const dir = delta > 0 ? 1 : -1;
      let t = phaseTRef.current + Math.abs(delta) * sensitivity;
      if (t >= 1) {
        if (phaseRef.current === "expand") {
          phaseRef.current = "contract";
          setPhase("contract");
          phaseTRef.current = 0;
          setPhaseT(0);
        } else {
          // Termina contract → rotar
          const nextIndex = (activeIndexRef.current + (dir > 0 ? 1 : totalSlides - 1)) % totalSlides;
          activeIndexRef.current = nextIndex;
          setActiveIndex(nextIndex);
          visitedRef.current.add(nextIndex);
          setCompletedCount(visitedRef.current.size);
          phaseRef.current = "expand";
          setPhase("expand");
          phaseTRef.current = 0;
          setPhaseT(0);
          // Si ya visitamos todos, liberar scroll
          if (visitedRef.current.size >= totalSlides) {
            const winAny = window as any;
            const lenis: any = winAny.lenis;
            if (lenis && typeof lenis.start === 'function') {
              lenis.start();
              if (typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(window.scrollY + 2, { immediate: true });
              }
            } else {
              document.body.style.overflow = prevOverflowRef.current;
              window.scrollBy(0, 2);
            }
            setPinned(false);
          }
        }
      } else {
        phaseTRef.current = t;
        setPhaseT(t);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        const t = Math.min(1, phaseTRef.current + 0.08);
        phaseTRef.current = t;
        setPhaseT(t);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const t = Math.max(0, phaseTRef.current - 0.08);
        phaseTRef.current = t;
        setPhaseT(t);
      }
    };
    // Bloquear scroll de página usando Lenis si está disponible
    const winAny = window as any;
    const lenis: any = winAny.lenis;
    prevOverflowRef.current = document.body.style.overflow;
    if (lenis && typeof lenis.stop === 'function') {
      lenis.stop();
    } else {
      document.body.style.overflow = "hidden";
    }
    // Reset de visitas al entrar en modo pinned
    visitedRef.current = new Set([activeIndexRef.current]);
    setCompletedCount(visitedRef.current.size);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey, { passive: false });
    return () => {
      if (lenis && typeof lenis.start === 'function') {
        lenis.start();
      } else {
        document.body.style.overflow = prevOverflowRef.current;
      }
      window.removeEventListener("wheel", onWheel as any);
      window.removeEventListener("keydown", onKey as any);
    };
  }, [pinned, total]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const updateProgress = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const totalDistance = rect.height + viewportHeight;
      const visible = Math.min(
        Math.max((viewportHeight - rect.top) / totalDistance, 0),
        1,
      );
      setProgress(Number(visible.toFixed(3)));
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleY(${visible})`;
      }
      if (amberRef.current) {
        const t = Math.max(0, (visible - 0.01) / 0.95); // arranca al 5%
        const r = 180 * t; // radio en %
        amberRef.current.style.setProperty("--r", `${r}%`);
        amberRef.current.style.opacity = String(1 - t);
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);


  
  return (
    <section ref={sectionRef} className="section relative overflow-hidden bg-transparent">
      <div
        aria-hidden
        className={`pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}
      >
        <span className="text-xs uppercase tracking-[0.3rem] text-white/40">
          Scroll
        </span>
        <div className="relative h-32 w-[2px] overflow-hidden rounded-full bg-white/10">
          <div
            ref={progressFillRef}
            className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-full bg-primary transition-transform duration-200 ease-out"
            style={{ transform: `scaleY(${progress})` }}
          />
        </div>
        <span className="text-xs font-light text-white/40">
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div className="relative overflow-hidden py-12 md:py-24">
        <div
          ref={amberRef}
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: "#000000",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 0%, transparent var(--r, 0%), black calc(var(--r, 0%) + 1px))",
            maskImage:
              "radial-gradient(circle at 50% 0%, transparent var(--r, 0%), black calc(var(--r, 0%) + 1px))",
            opacity: 1,
          } as React.CSSProperties}
        />

        <div className="relative z-10 flex flex-col justify-between gap-30 px-6 py-5">
          {/*Title*/}
          <header
            className={`container flex flex-col items-center gap-4 transition-all duration-700 ease-out ${
              isActive && showHeader ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.7rem] text-primary">
              Projects
            </p>
            <h2 className="font-bold text-4xl md:text-6xl leading-tight tracking-[0.55rem] text-white">
              PROJ
              <span className="relative inline-block px-4 text-primary">
                <span className="absolute inset-0 rounded-full border border-primary/60 blur-[2px]" />
                <span className="relative">E</span>
              </span>
              CTS
            </h2>
          </header>

            {/*Slider*/}
          <div
            className={`relative  flex w-full flex-1 items-center justify-center transition-all duration-700 ease-out delay-150 ${
              isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="relative h-[60vh] w-full max-w-[1400px] min-h-[420px] md:h-[42vh]">
              <div
                aria-hidden
                className={`border-b-2 border-[#CAFF1D] group absolute left-0 top-[28%] z-10 w-[36vw] min-w-[220px] max-w-[480px] overflow-hidden rounded-[32px] bg-white/5/40 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)] transition-opacity duration-700 ${showImages ? "opacity-100" : "opacity-0"}`}
                style={{
                  transform: "translate(-92%, -50%) rotate(-2deg)",
                  transformOrigin: "center right",
                }}
              >
                <div className={`relative h-full w-full transition-transform duration-700 ease-out ${showImages ? 'scale-100' : 'scale-95'}`}>
                  <img
                    src={previous.preview}
                    alt={previous.title}
                    className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/20" />
                </div>
              </div>

              <article className="absolute left-1/2 top-1/2 z-20 w-[60vw] min-w-[320px] max-w-[900px] -translate-x-1/2 -translate-y-1/2">
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <div className="absolute -top-[130px] left-1/2 h-[140%] w-[140%] -translate-x-1/2">
                    <img
                      src="/logo_o.svg"
                      alt=""
                      aria-hidden
                      className="h-full w-full opacity-[0.2]"
                    />
                  </div>
                </div>
                <div className="absolute -inset-[9%] rounded-[90px] border border-primary/40 opacity-30 blur-xl" />
                <figure
                  ref={activeFigureRef as any}
                  className={`border-b-2 border-[#CAFF1D] relative aspect-[16/10] overflow-hidden bg-white/5 shadow-[0_45px_120px_-35px_rgba(202,255,29,0.6)] ${showImages ? "opacity-100" : "opacity-0"}`}
                  style={{
                    borderRadius: `${Math.max(0, 42 * (phase === 'expand' ? 1 - phaseT : phaseT))}px`,
                    transform: `scale(${phase === 'expand' ? (1 + (measuredScaleRef.current - 1) * phaseT) : (1 + (measuredScaleRef.current - 1) * (1 - phaseT))})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                    willChange: 'transform'
                  }}
                >
                  <div ref={activeFrameRef} className={`relative h-full w-full`}>
                    <img
                      src={current.media}
                      alt={current.title}
                      className="h-full w-full object-cover transition duration-500"
                      key={current.id}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/40" />
                    <div className="pointer-events-none absolute inset-x-12 bottom-8 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                  </div>
                </figure>
                <div className="absolute -bottom-10 left-1/2 h-12 w-[68%] -translate-x-1/2 rounded-full border border-primary/30 blur-lg" />
              </article>

              <div
                aria-hidden
                className={`border-b-2 border-[#CAFF1D] group absolute right-0 top-[72%] z-10 w-[36vw] min-w-[220px] max-w-[480px] overflow-hidden rounded-[32px] bg-white/5/40 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)] transition-opacity duration-700 ${showImages ? "opacity-100" : "opacity-0"}`}
                style={{
                  transform: "translate(92%, -50%) rotate(3deg)",
                  transformOrigin: "center left",
                }}
              >
                <div className={`relative h-full w-full transition-transform duration-700 ease-out ${showImages ? 'scale-100' : 'scale-95'}`}>
                  <img
                    src={next.preview}
                    alt={next.title}
                    className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`container mx-auto transition-all duration-700 ease-out delay-300 ${
              isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="mt-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-[0.35rem] text-primary">
                  {current.category}
                </p>
                <h3 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
                  {current.title}
                </h3>
                <p className="mt-4 text-base text-white/80">
                  {current.description}
                </p>
              </div>
              <button
                type="button"
                className="group inline-flex items-center gap-3 rounded-full border border-white/20 px-8 py-3 text-sm uppercase tracking-[0.4rem] transition hover:border-primary/70 hover:bg-primary/10"
              >
                {current.cta}
                <span className="text-lg transition group-hover:translate-x-1">
                  &#10142;
                </span>
              </button>
            </div>
          </div>

          
        </div>
      </div>
    </section>
  );
}
