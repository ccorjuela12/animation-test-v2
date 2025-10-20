### Prompt para Codex/Copilot — **Agregar imágenes desplazándose en X con el scroll (sin tocar la grid existente)**

Abre **`components/GridCanvas.tsx`** y **NO modifiques** el `vertexShader`, `fragmentShader` ni la lógica de la **grid** actual. Agrega lo siguiente para renderizar **imágenes (texturas) encima de la grid**, colocadas en un **track horizontal** que se desplaza en **X** según el uniform existente `uScroll` (0..1). Usa el **mismo renderer/escena/cámara** ya creados. Parte del archivo actual: 

**Instrucciones (genera el código exacto):**

1. **Imports y estado (arriba del `useEffect`)**

   * Define una constante `const IMAGES = ['/images/1.jpg','/images/2.jpg','/images/3.jpg','/images/4.jpg'];` (pon rutas de ejemplo).
   * No agregues nuevas dependencias; usa `THREE.TextureLoader`.

2. **Dentro del `useEffect`, después de crear `scene`, `camera`, `renderer` y ANTES del `resize()`**

   * Crea un **grupo** para el carrusel:

     ```ts
     const track = new THREE.Group();
     track.position.set(0, 0, 0.01); // por encima de la grid
     scene.add(track);
     ```
   * Prepara arrays para manejar recursos:

     ```ts
     const imageMaterials: THREE.ShaderMaterial[] = [];
     const imageMeshes: THREE.Mesh[] = [];
     let trackWidthUnits = 0; // ancho total del track en unidades de cámara
     ```

3. **Shader de imagen (SÓLO para las imágenes; NO toques el de la grid)**

   * Usa el mismo `vertexShader` ya definido (pásalo como `vertexShader`).
   * Crea un `fragment` propio para imágenes que:

     * Tome `uTex` (sampler2D), `uTexRes` (vec2), `uResolution` (vec2), `uAlpha` (float), `uTime` (float), `uDistort` (float), `uMouse` (vec2).
     * Haga **warp/distorsión suave** en coordenadas de pantalla, inspirada en la grid (usa `gl_FragCoord.xy / uResolution` para obtener `n`, aplica el mismo seno en X/Y para generar un `delta`, y desplaza las `vUv` antes de muestrear).
     * Ajuste la imagen en modo **cover** dentro del plano.
     * Devuelva `gl_FragColor = vec4(col, uAlpha);` con `transparent: true` y `depthWrite: false`.
   * Ejemplo mínimo que debes generar:

     ```ts
     const imageFragment = /* glsl */`
       precision highp float;
       varying vec2 vUv;
       uniform sampler2D uTex;
       uniform vec2  uTexRes;
       uniform vec2  uResolution;
       uniform float uAlpha;
       uniform float uTime;
       uniform float uDistort;
       uniform vec2  uMouse;
       vec2 distort(vec2 px){
         float t = uTime * 0.25;
         float wy = sin((px.y*0.01 + t) * 6.0) * 0.6;
         float wx = sin((px.x*0.01 + t*0.7) * 3.0) * 0.45;
         float amp = mix(1.0, 1.6, smoothstep(0.0, 0.8, length(uMouse - vec2(0.5))));
         return px + vec2(wx, wy) * (uDistort * amp);
       }
       vec2 cover(vec2 uv, vec2 plane, vec2 tex){
         float pr = plane.x/plane.y, tr = tex.x/tex.y;
         vec2 s = (pr > tr) ? vec2(1.0, tr/pr) : vec2(pr/tr, 1.0);
         return (uv - 0.5) * s + 0.5;
       }
       void main(){
         // warp en espacio de pantalla
         vec2 n  = gl_FragCoord.xy / uResolution;
         vec2 n2 = distort(gl_FragCoord.xy) / uResolution;
         vec2 delta = n2 - n;
         vec2 uv = cover(vUv + delta, vec2(1.0), uTexRes);
         vec3 col = texture2D(uTex, uv).rgb;
         gl_FragColor = vec4(col, uAlpha);
       }
     `;
     ```

4. **Cargar texturas y crear los planos**

   * Carga `IMAGES` con `TextureLoader`, establece `colorSpace = THREE.SRGBColorSpace`.
   * Por cada textura:

     * Crea `ShaderMaterial` con uniforms: `uTex`, `uTexRes` (width/height reales), `uResolution` (igual al de la grid), `uAlpha: 0.0`, `uTime`, `uDistort` (reutiliza el valor del uniform de la grid para que “matchée”), `uMouse` (reutiliza el de la grid).
     * Crea un `PlaneGeometry(1, 1)` provisional y un `Mesh` con este material; añade el mesh al `track`.
     * Guarda material y mesh en los arrays para poder actualizarlos y liberar en cleanup.

5. **Función `layoutImages()` (DESPUÉS del `resize()` y reutilizable)**

   * Calcula el **ancho de vista** en unidades: `const viewWidth = (camera.right - camera.left);` y el alto: `const viewHeight = (camera.top - camera.bottom);`
   * Fija una **altura de tile**: `const tileH = viewHeight * 0.45;`
   * Para cada imagen:

     * Recalcula `planeW = tileH * (texW/texH)` y actualiza su geometría:

       ```ts
       mesh.geometry.dispose();
       mesh.geometry = new THREE.PlaneGeometry(planeW, tileH);
       ```
     * Posición en **X** acumulativa con un **padding** (p. ej. `pad = viewWidth * 0.12`), en **Y** centro: `mesh.position.set(x + planeW/2 + pad, 0, 0.01); x += planeW + pad;`
   * Guarda `trackWidthUnits = x + pad;`

6. **Hookear `layoutImages()`**

   * Llama `layoutImages()` **tras cargar todas las texturas** y también **dentro de `resize()`** para relayout responsivo.

7. **Scroll → movimiento horizontal del track**

   * En tu `renderLoop` actual ya se actualiza `uTime`/`uMouse` y se renderiza.
   * Agrega antes del `renderer.render`:

     ```ts
     // mapear uScroll (0..1) a desplazamiento en X del track
     const viewWidth = (camera.right - camera.left);
     const maxShift = Math.max(0, trackWidthUnits - viewWidth);
     const p = (uniforms.uScroll.value as number) || 0;
     track.position.x = -THREE.MathUtils.lerp(0, maxShift, p);
     ```
   * Con esto, el **scroll vertical** ya mueve el carrusel en **X**.

8. **Reveal por cercanía al centro**

   * En el mismo `renderLoop`, después de mover el track:

     ```ts
     const centerX = 0; // porque la cámara está centrada en 0
     imageMeshes.forEach((mesh, i) => {
       const worldX = mesh.position.x + track.position.x;
       const d = Math.abs(worldX - centerX);
       const vis = 1.0 - THREE.MathUtils.smoothstep(d, 0.0, viewWidth * 0.35);
       (imageMaterials[i].uniforms.uAlpha as any).value = vis;
     });
     ```

9. **Resize/cleanup**

   * En `resize()` ya calculas `uResolution`; tras hacerlo, llama `layoutImages();`.
   * En el **cleanup**, además de lo que ya hay, libera:

     ```ts
     imageMeshes.forEach(m => m.geometry.dispose());
     imageMaterials.forEach(m => m.dispose());
     scene.remove(track);
     ```

> Resultado: verás la **grid intacta**, y por encima un **carrusel horizontal** de imágenes que **se desplaza en X** con tu `uScroll` (scroll vertical → progreso 0..1). Cada imagen **aparece** suavemente al acercarse al centro y comparte la **misma distorsión dinámica** (tiempo + mouse) que la grid.
