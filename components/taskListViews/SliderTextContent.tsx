export default function SliderTextContent(){
    return(
        <section className="relative flex h-screen items-end justify-center">
            <div className="relative flex w-full">
                <div className="pointer-events-auto relative w-full pb-16">
                    <div className="hero__info container absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 flex-row items-center justify-between space-x-2 opacity-0">
                    <div  className="hero__info-left max-w-fit">
                        <h2 className="mt-2 px-4 text-left font-light">
                        Project Name
                        </h2>
                    </div>
                    <div className="hero__info-right max-w-96 flex flex-col items-start gap-2">
                        <div className="h-2 w-7 rounded bg-primary" />
                        <p className="max-w-96 text-left">
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Enim eos sunt qui voluptatum, dolor laborum et porro nihil officia atque, velit sit iure esse provident voluptatem fugiat error blanditiis dicta.
                        </p>
                    </div>
                    </div>
                </div>
            </div>
        </section>
    );
}