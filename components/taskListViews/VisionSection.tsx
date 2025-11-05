import { useRef } from "react";

export default function VisionSection(){
    const sectionVisionRef = useRef<HTMLElement | null>(null);
    return(
        <section
            ref={sectionVisionRef}
            data-section-progress="vision"
            data-section-label="Vision"
            className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-primary/20"
        >
            <div className="container flex flex-col gap-20 py-36">

            </div>
        </section>
    );
}