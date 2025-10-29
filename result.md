# Registro de ejecuciones

## 2025-10-28 - Hero + Slider sincronizados con scroll

### Descripcion de lo implementado
- AnimationCanvas ahora acepta refs externas para controlar la visibilidad del logo y el progreso del slider 3D, manteniendo Lenis como orquestador del scroll.
- HeroFooterText ancla el scroll, muestra dos bloques de copy de forma secuencial y atenua el logo del canvas al concluir la transicion.
- SliderTextContent fija la seccion, sincroniza el desplazamiento lateral del carrusel 3D y rota seis textos conforme cada video entra en vista.
- El prompt "scroll to explore" aparece con una animacion de entrada y se desvanece al abandonar el hero.

### Archivos tocados
- app/page.tsx
- components/Content.tsx
- components/canvas/animation_canvas.tsx
- components/taskListViews/HeroFooterText.tsx
- components/taskListViews/SliderTextContent.tsx
- result.md

### Decisiones y consideraciones
- Se reutilizo la instancia de Lenis para garantizar suavidad en los pins de ScrollTrigger y evitar dobles inicializaciones.
- El slider 3D recibe un progreso normalizado (0 -> 1) mientras que el logo se atenua mediante un proxy para conservar transiciones fluidas en Three.js.
- Los textos del slider se apilan en DOM con GSAP gestionando el crossfade segun la direccion del scroll; evita renders extra en React.
- El modulo ignite_emiter.tsx permanece comentado como indico el brief, listo para reactivarse cuando sea necesario.

### Complicaciones encontradas
- npm run lint sigue reportando errores heredados (Hero.tsx, Projects.tsx, tailwind.config.js, etc.); fuera del alcance actual.

### Instrucciones de verificacion
1. Ejecuta npm run dev y recorre la landing: el prompt del hero debe entrar con fade-in y ocultarse al salir del viewport.
2. En HeroFooterText, el scroll se fija, los bloques de copy se suceden y el logo del canvas desaparece al cerrar la secuencia.
3. En SliderTextContent, la seccion se ancla, el carrusel avanza en X y cada texto se actualiza al entrar un nuevo video.
4. Ajusta el contenido del carrusel editando la constante SLIDER_CONTENT en components/taskListViews/SliderTextContent.tsx.

---

## 2025-10-22 - Seccion de Proyectos (Slider con Scroll)

### Descripcion de lo implementado
- Se reemplazo components/projects/Projects.tsx por una seccion Works con un slider horizontal controlado por scroll usando GSAP + ScrollTrigger.
- El contenedor se fija (pin) y el track se traslada en X mientras el usuario hace scroll, mostrando un slide a la vez con peek de 10px del anterior/siguiente.
- En cada slide se anima la entrada del contenido en orden: video -> titulo -> descripcion -> boton. Las animaciones se ligan al progreso del slider (scrub).
- Tras ingresar el contenido, se aplica un zoom sutil del video hacia pantalla completa y se sincroniza la reproduccion del video avanzando una fraccion de su duracion con el scroll.
- Se anadieron 4 slides de ejemplo con un video CC0 publico (se pueden reemplazar por archivos propios en public/).

### Archivos tocados
- components/projects/Projects.tsx
- result.md

### Decisiones y consideraciones
- GSAP ya estaba en dependencias; se registro ScrollTrigger localmente en el componente cliente.
- Para respetar mostrar 10px del anterior y siguiente: el track tiene padding-left/right 10px y cada slide usa width calc(100vw - 20px).
- El zoom a pantalla completa se implementa como un scale sutil (~1.12) y eliminacion de bordes redondeados. Evita posiciones fijas complejas durante el pin y mantiene la experiencia fluida.
- La reproduccion del video se ata a onUpdate de un ScrollTrigger por slide, avanzando ~35% de la duracion (editable).
- La animacion de entrada procede desde arriba (y = 0, opacidad = 1) encadenando video -> titulo -> descripcion -> boton.

### Complicaciones encontradas
- Se detectaron caracteres mojibake en el archivo original de Projects.tsx; se opto por reemplazar el archivo para evitar problemas de parcheo.
- No se incluyeron videos locales en public/; para demo se usa un recurso CC0 remoto. Reemplazable sin cambios de codigo (solo actualizar videoSrc).

### Instrucciones de implementacion/uso
1. (Opcional) Reemplaza los videoSrc en components/projects/Projects.tsx:22 por rutas locales (por ejemplo: /videos/proyecto1.mp4).
2. Ajusta titulos, descripciones y CTA en el arreglo SLIDES del mismo archivo (components/projects/Projects.tsx:16).
3. Para modificar el peek lateral, cambia el paddingLeft/Right del track o el width de cada slide.
4. El porcentaje de avance del video con el scroll se controla en fraction = 0.35 (components/projects/Projects.tsx:138).
5. Ejecuta:
   - npm run dev para desarrollo.
   - npm run build && npm start para produccion.

### Notas
- Estilos con Tailwind y utilidades existentes. Si se requiere un full-bleed fullscreen mas agresivo, se puede migrar a un contenedor fijo temporal dentro del mismo pin, pero aumenta la complejidad del layout.
