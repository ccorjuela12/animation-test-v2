import Hero from '@/components/Hero';
import Projects from '@/components/projects/Projects';

export default function Page() {
  return (
    <>
      <Hero />
      <Projects/>
      <section className="section">
        <h2>About</h2>
        <p>Otra sección de contenido para ver la transición desde el pin.</p>
      </section>
    </>
  );
}
