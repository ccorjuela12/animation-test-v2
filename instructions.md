### Prompt para Codex/Copilot — **Agregar imágenes desplazándose en X con el scroll (sin tocar la grid existente)**

Ya deje componetizado las dos secciones que tenemos actualmente, la idea es con scroll ir mostrando el flujo de los textos e ir iterando las animaciones.

**Instrucciones**
*  las animacionaes deben funcionar de la siguiente manera:
  * aparece el hero (**animation_canvas.tsx**) con el texto scroll to explore, como esta en este debemos mostrar el texto cuando se cargue la pagina con una animacion de entrada.
  * a medida que avanza el scroll llega el **HeroFooterText.tsx** cuando este toque el viewport de arriba debe anclar el scroll y mostrar los textos una vez termine de mostrar todos los textos secuencialmente soltar el scroll y ocultar el Image del canvas.
  * a medida que avanza el scroll llega el **SliderTextContent.tsx** cuando este toque el viewport de arriba debe anclar el scroll y aparecer como esta el slider.
    * el slider debe quedar encima del **modelText**.
    * los textos deben ir animando de primero despues el segundo la idea es que cada vez que entra un video nuevo, vaya mostrando el texto.

**resultado esperado**
* Animacion de transicion entre una seccion y otra.
* animacion de slider con scroll.
* archivo result.md con resultado de la ejecucion, complicaciones, descripcion de lo ejecutado e instrucciones de implementacion.

**herramientas**
usa gsap animaciones y lenis para controlar el scroll.