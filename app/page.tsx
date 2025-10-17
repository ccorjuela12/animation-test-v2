import Hero from '@/components/Hero';

export default function Page() {
  return (
    <>
      <Hero />
      <section className="section">
        <h2>Works</h2>
        <p>Sección de ejemplo para testear el pin del hero. Agrega tu grid de proyectos aquí.</p>
      </section>
      <section className="section">
        <h2>About</h2>
        <p>Otra sección de contenido para ver la transición desde el pin.</p>
      </section>
    </>
  );
}
