"use client";

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
  const defaultIndex = 0;
  const total = SLIDES.length;
  const current = SLIDES[defaultIndex];
  const previous = SLIDES[(defaultIndex - 1 + total) % total];
  const next = SLIDES[(defaultIndex + 1) % total];

  return (
    <section className="section relative overflow-hidden py-24 md:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(202,255,29,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-x-0 top-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute inset-y-0 left-[10%] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-y-0 right-[6%] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col justify-between gap-12 px-6 py-16">
        <header className="flex flex-col gap-4 container items-center">
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

        <div className="relative w-full mt-16 flex flex-1 items-center justify-center">
          <div className="relative h-[60vh] w-full max-w-[1400px] min-h-[420px] md:h-[72vh]">
            <div
              aria-hidden
              className="group absolute left-0 top-[28%] z-10 w-[36vw] min-w-[220px] max-w-[480px] overflow-hidden rounded-[32px] border border-white/10 bg-white/5/40 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)]"
              style={{
                transform: "translate(-92%, -50%) rotate(-2deg)",
                transformOrigin: "center right",
              }}
            >
              <img
                src={previous.preview}
                alt={previous.title}
                className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/20" />
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
              <figure className="relative aspect-[16/10] overflow-hidden rounded-[42px] border border-white/15 bg-white/5 shadow-[0_45px_120px_-35px_rgba(202,255,29,0.6)]">
                <img
                  src={current.media}
                  alt={current.title}
                  className="h-full w-full object-cover transition duration-500"
                  key={current.id}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/40" />
                <div className="pointer-events-none absolute inset-x-12 bottom-8 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
              </figure>
              <div className="absolute -bottom-10 left-1/2 h-12 w-[68%] -translate-x-1/2 rounded-full border border-primary/30 blur-lg" />
            </article>

            <div
              aria-hidden
              className="group absolute right-0 top-[72%] z-10 w-[36vw] min-w-[220px] max-w-[480px] overflow-hidden rounded-[32px] border border-white/10 bg-white/5/40 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)]"
              style={{
                transform: "translate(92%, -50%) rotate(3deg)",
                transformOrigin: "center left",
              }}
            >
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

        <div className="container mx-auto">
            <div className="mt-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div className="max-w-xl">
                    <p className="text-xs uppercase tracking-[0.35rem] text-primary">
                    {current.category}
                    </p>
                    <h3 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
                    {current.title}
                    </h3>
                    <p className="mt-4 text-base text-white/80">{current.description}</p>
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

        <div className="mt-12 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3rem] text-white/50">
          {SLIDES.map((slide, index) => (
            <span
              key={slide.id}
              className={`relative flex items-center gap-2 ${
                index === defaultIndex ? "text-primary" : ""
              }`}
            >
              <span className="h-px w-6 bg-current" />
              {index + 1 < 10 ? `0${index + 1}` : index + 1}
            </span>
          ))}
          <span className="ml-auto text-white/40">
            View more projects &#10140;
          </span>
        </div>
      </div>
    </section>
  );
}
