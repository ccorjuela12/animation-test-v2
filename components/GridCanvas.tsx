'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

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
    vec3 col = vec3(1.0) * lines * uGridIntensity * vignette;
    float alpha = clamp(uLinesOpacity * lines * vignette, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

export default function GridCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    };

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
    };

    resize();
    window.addEventListener('resize', resize);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => resize())
      : null;
    resizeObserver?.observe(canvas.parentElement ?? canvas);

    const mouse = { x: 0.5, y: 0.5 };
    const quickToX = gsap.quickTo(mouse, 'x', { duration: 0.2, ease: 'power3.out' });
    const quickToY = gsap.quickTo(mouse, 'y', { duration: 0.2, ease: 'power3.out' });

    const handleScroll = () => {
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

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    let hasPointer = false;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

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

    const renderLoop = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouse.value.set(mouse.x, mouse.y);
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(renderLoop);
    };

    rafId = window.requestAnimationFrame(renderLoop);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
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
