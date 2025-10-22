### Prompt para Codex/Copilot — **Agregar imágenes desplazándose en X con el scroll (sin tocar la grid existente)**

Abre **`components/projects/Projects.tsx`** elimina lo actual ejecuta las siguientes instrucciones.

**Instrucciones**

* Creemos un slider el cual tenga de aun slide, pero que en laterales muestre el anterior y el siguiente aprenas 10px.
* Cuando la secion entre agregemos una animacion del contenido ingrese desde arriba, usando el prgreso del slider.
* El slider debe accionarse desde el scroll para hacer animaciones  pasar al siguiente.
* el slider tiene video, titulo, descripcion y boton, esta animacion debe ser de la siguiente manera:
  1) ingresa el video en pantalla.
  2) ingresa el titulo.
  3) ingresa decripcion.
  4) ingresa boton.
  5) el progreso tambien debe ser con el scroll.
* una vez ingresen todos los items del slider, cuando hagamos scroll el video debe aumentar su tamano a pantalla completa con el scroll e ir avanzando unas fraciones el video sincronizado con el scroll.
* cuando termine apantlla completa aun seguria el scroll debe ya alejar el video y pasar al siguinte slider con la misma animacion.

**resultado esperado**
* Animacion de transicion entre una seccion y otra.
* animacion de slider con scroll.
* archivo result.md con resultado de la ejecucion, complicaciones, descripcion de lo ejecutado e instrucciones de implementacion.

**herramientas**
usa gsap animaciones, si requieres 3d utiliza react/fiber react/drei (solo si es necesario no cre que se requiera), estilos usa tailwind (si requieres lgo mas especifico usa css puro en el archivo del proyecto y deja un comentario).