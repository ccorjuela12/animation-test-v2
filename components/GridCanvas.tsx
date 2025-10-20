'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Tipado para la configuración de diseño de cada imagen en la cuadrícula.
type ImageLayoutConfig = {
  src: string; // Ruta de la imagen.
  layout?: { // Propiedades de diseño opcionales para anular el comportamiento aleatorio.
    heightFactor?: number; // Factor de altura relativo a la vista.
    yFactor?: number; // Posición vertical.
    xFactor?: number; // Posición horizontal.
    gapFactor?: number; // Espaciado con la imagen anterior.
    rotationDeg?: number; // Rotación en grados.
    xJitter?: number; // Desplazamiento horizontal aleatorio.
    scale?: number; // Escala de la imagen.
    autoScrollProgress?: number; // Progreso de autoscroll inicial.
  };
};

// Array de configuración para las imágenes que se mostrarán en la escena.
const IMAGES: ImageLayoutConfig[] = [
  {
    src: '/images/1.png',
    layout: { heightFactor: 0.5, yFactor: 0.52, xFactor: -0.4, rotationDeg: 1, scale: .5 },
  },
  {
    src: '/images/2.png',
    layout: { heightFactor: 0.5, yFactor: -0.36, xFactor: 0.0, rotationDeg: 1, scale: .5 },
  },
  {
    src: '/images/3.png',
    layout: { heightFactor: 0.5, yFactor: 0.52, xFactor: 0.4, rotationDeg: 1, scale: .5 },
  },
  {
    src: '/images/4.png',
    layout: { heightFactor: 0.5, yFactor: -0.2, xFactor: 0.8, rotationDeg: 1, scale: .5 },
  },
];

// --- Constantes y Shaders ---
const DEFAULT_AUTO_SCROLL_PROGRESS = 0.25;
const LIGHT_COLOR_HEX = ['#CAFF1D', '#67FFED', '#FF6AD5', '#FF8A3D'];
const LIGHT_COLOR_PALETTE = LIGHT_COLOR_HEX.map((hex) => new THREE.Color(hex));
const LIGHT_ACTIVATION_THRESHOLD = 0.08; // Punto de scroll en el que se activan las luces.

// Shader de vértices básico: pasa las coordenadas UV al fragment shader.
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Shader de fragmentos para el fondo: dibuja una cuadrícula distorsionada con efectos de luz.
const fragmentShader = `
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uCellPx;
  uniform float uLinePx;
  uniform float uDistort;
  uniform float uGridIntensity;
  uniform float uLinesOpacity;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform vec3 uLightColor;
  uniform vec2 uLightPos;
  uniform float uLightIntensity;

  void main() {
    float t = uTime * 0.1;
    vec2 ndc = vUv * 2.0 - 1.0;
    float radius = length(ndc);
    float sphere = sqrt(max(0.0, 1.0 - radius * radius * 0.6));
    vec2 warped = ndc * mix(1.0, sphere, 0.82);
    vec2 warpedNorm = warped * 0.5 + 0.5;
    vec2 px = warpedNorm * uResolution + vec2(uScroll * 160.0, uScroll * -110.0);

    float mouseDist = distance(warpedNorm, uMouse);
    float influence = smoothstep(0.35, 0.0, mouseDist);
    float intensity = mix(0.05, 0.55, influence);
    float wy = sin((px.y * 0.01 + t) * 6.0) * 0.6;
    float wx = sin((px.x * 0.01 + t * 0.7) * 3.0) * 0.45;
    px += vec2(wx, wy) * uDistort * intensity * 0.75;

    vec2 uv = px / uCellPx;
    vec2 g = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);
    float lines = 1.0 - smoothstep(uLinePx, uLinePx + 1.0, min(g.x, g.y));

    float rim = smoothstep(0.7, 1.05, radius);
    float vignette = mix(1.0, 0.4, rim);

    vec2 lightPx = uLightPos * uResolution;
    float lightDist = distance(px, lightPx);
    float neon = uLightIntensity > 0.0 ? uLightIntensity * exp(-lightDist * 0.008) : 0.0;
    vec3 col = vec3(1.0) * lines * uGridIntensity * vignette + uLightColor * neon;
    float alpha = clamp(uLinesOpacity * lines * vignette + neon * 0.4, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * Componente principal de React que renderiza un lienzo (canvas) de Three.js.
 * Muestra una cuadrícula animada de fondo y una serie de imágenes que se desplazan
 * horizontalmente y reaccionan al movimiento del ratón y al scroll de la página.
 */
export default function GridCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // useEffect principal que se ejecuta una vez para configurar toda la escena de Three.js.
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    // Grupo que contendrá todas las imágenes y se moverá horizontalmente.
    const track = new THREE.Group();
    track.position.set(0, 0, 0.01);
    scene.add(track);

    // Arrays para gestionar los objetos de Three.js y datos de layout.
    const imageMaterials: THREE.ShaderMaterial[] = [];
    const imageMeshes: THREE.Mesh[] = [];
    const imageTextures: THREE.Texture[] = [];
    const imageLayoutData: Array<{
      heightFactor: number;
      yFactor: number;
      xFactor: number | null;
      gapFactor: number;
      rotation: number;
      xJitter: number;
      scale: number;
    }> = [];
    let trackWidthUnits = 0; // Ancho total del track de imágenes.
    let disposed = false; // Flag para controlar la limpieza de recursos.
    let autoScrollTween: gsap.core.Tween | null = null;
    let userHasScrolled = false;
    const tempLightColor = new THREE.Color();

    // Shader para renderizar las imágenes con un efecto de distorsión.
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
        vec2 n  = gl_FragCoord.xy / uResolution;
        vec2 n2 = distort(gl_FragCoord.xy) / uResolution;
        vec2 delta = n2 - n;
        vec2 uv = cover(vUv + delta, vec2(1.0), uTexRes);
        vec3 col = texture2D(uTex, uv).rgb;
        gl_FragColor = vec4(col, uAlpha);
      }
    `;

    // Uniforms para los shaders: variables que se pasan desde JS a GLSL.
    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCellPx: { value: 60.0 },
      uLinePx: { value: 0.28 },
      uDistort: { value: 0.05 },
      uGridIntensity: { value: 0.8 },
      uLinesOpacity: { value: 0.22 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uLightColor: { value: new THREE.Color(0x000000) },
      uLightPos: { value: new THREE.Vector2(0.5, 0.5) },
      uLightIntensity: { value: 0 },
    };

    // Geometría y material para el plano de fondo (la cuadrícula).
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    material.extensions = { ...(material.extensions ?? {}) };

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const loader = new THREE.TextureLoader();

    /**
     * Carga una textura de forma asíncrona y devuelve una promesa.
     * @param src - La ruta de la imagen a cargar.
     */
    const loadTexture = (src: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          src,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            resolve(texture);
          },
          undefined,
          (error) => reject(error),
        );
      });

    // Carga todas las imágenes y, una vez cargadas, las configura en la escena.
    Promise.all(IMAGES.map(({ src }) => loadTexture(src)))
      .then((textures) => {
        if (disposed) {
          textures.forEach((texture) => texture.dispose());
          return;
        }
        // Para cada textura cargada, crea un material y una malla (mesh).
        textures.forEach((texture, index) => {
          imageTextures.push(texture);
          const texWidth = texture.image?.width ?? 1;
          const texHeight = texture.image?.height ?? 1;
          const override = IMAGES[index]?.layout ?? {};
          // Genera valores aleatorios para el layout si no se especifican.
          const UNIFORM_GAP_FACTOR = 0.35; // Valor de espaciado uniforme.
          const randomHeight = THREE.MathUtils.lerp(0.3, 0.75, THREE.MathUtils.seededRandom());
          const randomY = THREE.MathUtils.lerp(-0.45, 0.45, THREE.MathUtils.seededRandom());
          const randomRotDeg = THREE.MathUtils.lerp(-14, 14, THREE.MathUtils.seededRandom());
          const randomJitter = THREE.MathUtils.lerp(-0.12, 0.12, THREE.MathUtils.seededRandom());
          const randomScale = THREE.MathUtils.lerp(0.85, 1.25, THREE.MathUtils.seededRandom());

          imageLayoutData.push({
            heightFactor: override.heightFactor ?? randomHeight,
            yFactor: override.yFactor ?? randomY,
            xFactor: override.xFactor ?? null,
            gapFactor: override.gapFactor ?? UNIFORM_GAP_FACTOR, // Usa el espaciado uniforme.
            rotation: THREE.MathUtils.degToRad(override.rotationDeg ?? randomRotDeg),
            xJitter: override.xFactor !== undefined ? 0 : (override.xJitter ?? randomJitter),
            scale: override.scale ?? randomScale,
          });
          const material = new THREE.ShaderMaterial({
            uniforms: {
              uTex: { value: texture },
              uTexRes: { value: new THREE.Vector2(texWidth, texHeight) },
              uResolution: uniforms.uResolution,
              uAlpha: { value: 0 },
              uTime: uniforms.uTime,
              uDistort: uniforms.uDistort,
              uMouse: uniforms.uMouse,
            },
            vertexShader,
            fragmentShader: imageFragment,
            transparent: true,
            depthWrite: false,
          });
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
          mesh.position.set(0, 0, 0.01);
          track.add(mesh);
          imageMaterials.push(material);
          imageMeshes.push(mesh);
        });
        layoutImages(); // Posiciona las imágenes recién creadas.
        // La animación de autoscroll inicial se ha eliminado para evitar el "salto"
        // al comenzar el scroll manual. La escena comenzará en la posición de scroll 0.
      })
      .catch((error) => {
        console.error('Failed to load track images', error);
      });

    /**
     * Se ejecuta al cambiar el tamaño de la ventana. 
     * Actualiza las dimensiones del renderer, la cámara y reposiciona las imágenes.
     */
    const resize = () => {
      const parentRect = canvas.parentElement?.getBoundingClientRect();
      const rect = parentRect && parentRect.width > 0 && parentRect.height > 0 ? parentRect : canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width || window.innerWidth);
      const height = Math.max(1, rect.height || window.innerHeight);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      if (aspect >= 1) {
        mesh.scale.set(aspect, 1, 1);
      } else {
        mesh.scale.set(1, 1 / aspect, 1);
      }
      uniforms.uResolution.value.set(width, height);
      layoutImages();
    };

    /**
     * Calcula y aplica la posición, tamaño y rotación de cada imagen en el track.
     * El layout puede ser fijo (usando xFactor) o dinámico (fluyendo una tras otra).
     */
    function layoutImages() {
      const viewWidth = camera.right - camera.left;
      const viewHeight = camera.top - camera.bottom;
      if (imageMeshes.length === 0 || viewHeight <= 0) {
        trackWidthUnits = 0;
        return;
      }

      const baseHeight = viewHeight * 0.5;
      let cursor = -viewWidth * 0.2; // Posición inicial del cursor para colocar imágenes.
      const centers: number[] = [];
      const widths: number[] = [];
      const yOffsets: number[] = [];
      const rotations: number[] = [];

      imageMeshes.forEach((mesh, index) => {
        const texRes = imageMaterials[index].uniforms.uTexRes.value as THREE.Vector2;
        const texW = texRes.x || 1;
        const texH = texRes.y || 1;
        const layout = imageLayoutData[index] ?? {
          heightFactor: 0.5,
          yFactor: 0,
          gapFactor: 0.12,
          xFactor: null,
          rotation: 0,
          xJitter: 0,
          scale: 1,
        };
        const scale = THREE.MathUtils.clamp(layout.scale ?? 1, 0.7, 1.35);
        const tileH = baseHeight * THREE.MathUtils.clamp(layout.heightFactor, 0.2, 0.85) * scale;
        const planeW = tileH * (texW / texH);
        const pad = viewWidth * THREE.MathUtils.clamp(layout.gapFactor, 0.04, 0.25);
        const jitter = (layout.xJitter ?? 0) * viewWidth;

        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(planeW, tileH);

        const yOffset = layout.yFactor * viewHeight * 0.5;
        const manualCenter = typeof layout.xFactor === 'number' ? layout.xFactor : null;
        const baseCenter = cursor + planeW * 0.5 + pad + jitter;
        const centerX = manualCenter !== null ? manualCenter * (viewWidth * 0.5) : baseCenter;

        centers.push(centerX);
        widths.push(planeW);
        yOffsets.push(yOffset);
        rotations.push(layout.rotation);

        if (manualCenter === null) {
          cursor += planeW + pad; // Mueve el cursor para la siguiente imagen.
        } else {
          cursor = Math.max(cursor, centerX + planeW * 0.5 + pad);
        }
      });

      if (!centers.length) {
        trackWidthUnits = viewWidth;
        return;
      }

      // Calcula el ancho total y centra las imágenes.
      let minEdge = Infinity;
      let maxEdge = -Infinity;
      centers.forEach((center, i) => {
        const half = widths[i] * 0.5;
        minEdge = Math.min(minEdge, center - half);
        maxEdge = Math.max(maxEdge, center + half);
      });

      const offset = Number.isFinite(minEdge) ? minEdge : 0;
      imageMeshes.forEach((mesh, index) => {
        mesh.position.set(centers[index] - offset, yOffsets[index], 0.01);
        mesh.rotation.set(0, 0, rotations[index]);
      });

      const widthSpan = Number.isFinite(maxEdge) && Number.isFinite(minEdge) ? maxEdge - minEdge : viewWidth;
      trackWidthUnits = Math.max(widthSpan, viewWidth * 2) + viewWidth * 0.1;
    }

    // --- Event Listeners ---
    resize();
    window.addEventListener('resize', resize);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => resize())
      : null;
    resizeObserver?.observe(canvas.parentElement ?? canvas);

    const mouse = { x: 0.5, y: 0.5 };
    const quickToX = gsap.quickTo(mouse, 'x', { duration: 0.2, ease: 'power3.out' });
    const quickToY = gsap.quickTo(mouse, 'y', { duration: 0.2, ease: 'power3.out' });

    /**
     * Maneja el evento de scroll de la página y actualiza el uniform `uScroll`.
     * @param fromUser - Indica si el scroll fue iniciado por el usuario.
     */
    const handleScroll = (fromUser = true) => {
      if (fromUser) {
        userHasScrolled = true;
        autoScrollTween?.kill();
        autoScrollTween = null;
      }
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
      gsap.to(uniforms.uScroll, {
        value: progress,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    handleScroll(false);
    const handleScrollEvent = () => handleScroll(true);
    window.addEventListener('scroll', handleScrollEvent, { passive: true });

    let hasPointer = false;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    /**
     * Maneja el movimiento del puntero (ratón/táctil) para actualizar la distorsión.
     * @param event - El evento de puntero.
     */
    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      const clientX = event.clientX;
      const clientY = event.clientY;

      const x = THREE.MathUtils.clamp((clientX - rect.left) / width, 0, 1);
      const y = THREE.MathUtils.clamp(1.0 - (clientY - rect.top) / height, 0, 1);

      quickToX(x);
      quickToY(y);

      const now = performance.now();
      if (!hasPointer) {
        hasPointer = true;
        lastX = clientX;
        lastY = clientY;
        lastTime = now;
        return;
      }

      // Aumenta la distorsión basada en la velocidad del puntero.
      const dt = now - lastTime;
      if (dt > 0) {
        const dx = clientX - lastX;
        const dy = clientY - lastY;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        const mappedSpeed = Math.min(speed / 1800, 0.25);

        gsap.to(uniforms.uDistort, {
          value: 0.05 + mappedSpeed,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: true,
        });
      }

      lastX = clientX;
      lastY = clientY;
      lastTime = now;
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointermove', handlePointerMove);

    const clock = new THREE.Clock();
    let rafId = 0;

    /**
     * El bucle de renderizado principal, se llama en cada frame.
     * Actualiza uniforms, posiciones y renderiza la escena.
     */
    const renderLoop = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouse.value.set(mouse.x, mouse.y);
      const viewWidth = camera.right - camera.left;
      const maxShift = Math.max(0, trackWidthUnits - viewWidth);
      const p = (uniforms.uScroll.value as number) || 0;
      track.position.x = -THREE.MathUtils.lerp(0, maxShift, p);

      // Actualiza la luz de neón basada en la posición de scroll.
      const scrollValue = THREE.MathUtils.clamp(p, 0, 1);
      if (!userHasScrolled || scrollValue <= LIGHT_ACTIVATION_THRESHOLD) {
        uniforms.uLightIntensity.value = 0;
      } else {
        const normalized = THREE.MathUtils.clamp(
          (scrollValue - LIGHT_ACTIVATION_THRESHOLD) / (1 - LIGHT_ACTIVATION_THRESHOLD),
          0,
          1,
        );
        const palettePosition = normalized * (LIGHT_COLOR_PALETTE.length - 1);
        const baseIndex = Math.floor(palettePosition);
        const nextIndex = Math.min(baseIndex + 1, LIGHT_COLOR_PALETTE.length - 1);
        const blend = palettePosition - baseIndex;
        tempLightColor.copy(LIGHT_COLOR_PALETTE[baseIndex]).lerp(LIGHT_COLOR_PALETTE[nextIndex], blend);
        (uniforms.uLightColor.value as THREE.Color).copy(tempLightColor);
        uniforms.uLightIntensity.value = THREE.MathUtils.lerp(0, 2.5, normalized);
        const angle = normalized * Math.PI * 2.4;
        const radiusX = 0.35;
        const radiusY = 0.22;
        uniforms.uLightPos.value.set(0.5 + Math.cos(angle) * radiusX, 0.5 + Math.sin(angle) * radiusY);
      }

      // Desvanece las imágenes cuando están fuera de la vista.
      const centerX = 0;
      imageMeshes.forEach((mesh, index) => {
        const worldX = mesh.position.x + track.position.x;
        const d = Math.abs(worldX - centerX);
        const vis = 1.0 - THREE.MathUtils.smoothstep(d, 0.0, viewWidth * 0.35);
        const alphaUniform = imageMaterials[index]?.uniforms.uAlpha as THREE.IUniform | undefined;
        if (alphaUniform) {
          alphaUniform.value = vis;
        }
      });

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(renderLoop);
    };

    rafId = window.requestAnimationFrame(renderLoop);

    // Función de limpieza: se ejecuta cuando el componente se desmonta.
    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScrollEvent);
      resizeObserver?.disconnect();
      autoScrollTween?.kill();
      autoScrollTween = null;
      // Libera la memoria de geometrías, materiales y texturas.
      imageMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        track.remove(mesh);
      });
      imageMaterials.forEach((mat) => mat.dispose());
      imageTextures.forEach((tex) => tex.dispose());
      scene.remove(track);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}