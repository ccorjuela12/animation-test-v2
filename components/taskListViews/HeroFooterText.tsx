export default function HeroFooterText(){
    return(
        <section className="relative flex h-screen items-end justify-center">
            <div className="relative flex w-full">
            <div className="pointer-events-auto relative w-full pb-16">
                <div ref={heroInfoRef} className="hero__info container absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 flex-row items-center justify-between space-x-2 opacity-0">
                    <div ref={heroTextLeft} className="hero__info-left max-w-fit">
                        <span className="h2 mb-4 rounded-4xl border border-primary py-2 px-4">Your story, </span>
                        <br />
                        <h2 className="mt-2 px-4 text-left font-light">
                        reinvented
                        <br /> through AI.
                        </h2>
                    </div>
                    <div ref={heroTextRight} className="hero__info-right max-w-96 flex flex-col items-start gap-2">
                        <div className="h-2 w-7 rounded bg-primary" />
                        <p className="max-w-96 text-left">
                        At <b>STUDIO</b>, we merge artificial intelligence and creativity to craft videos that captivate, adapt, and resonate.
                        </p>
                    </div>
                </div>

                <div ref={heroSecondaryRef} className="hero__info container absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 flex-row items-center justify-between space-x-2 opacity-0">
                    <div ref={heroSecondaryLeft} className="hero__info-left max-w-fit">
                        <span className="h2 mb-4 rounded-4xl border border-primary py-2 px-4">From insight,</span>
                        <br />
                        <h2 className="mt-2 px-4 text-left font-light">
                        to immersive
                        <br /> narratives.
                        </h2>
                    </div>
                    <div ref={heroSecondaryRight} className="hero__info-right max-w-96 flex flex-col items-start gap-3">
                        <div className="h-2 w-10 rounded bg-primary" />
                        <p className="max-w-96 text-left">
                        We orchestrate cohesive launch paths, custom visuals, and adaptive storytelling that help your next release feel inevitable.
                        </p>
                        <p className="max-w-96 text-left text-sm text-zinc-300">
                        Motion, copy, and data unite so every frame earns attention.
                        </p>
                    </div>
                </div>
            </div>
            </div>
        </section>
    );
}