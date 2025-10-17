'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

export default function HeroAnt() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !heroRef.current) return;

    // --- THREE.js setup ---
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0a10, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir1.position.set(2, 3, 4);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x9a6bff, 0.6);
    dir2.position.set(-3, -2, 2);
    scene.add(dir2);

    // 3D O (Torus) con sección algo cuadrada y material translúcido
    const geo = new THREE.TorusGeometry(1.2, 0.35, 6, 220);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      transmission: 0.4,
      thickness: 0.1,
      roughness: 0.2,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const mesh = new THREE.Mesh(geo, material);
    scene.add(mesh);

    // Escalar a ~30% del ancho visible
    const scaleToViewportWidth = () => {
      const rect = canvas.getBoundingClientRect();
      const aspect = rect.width / Math.max(1, rect.height);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const viewHeight = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 450);
      const viewWidth = viewHeight * aspect;
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      const baseWidth = Math.max(0.0001, size.x);
      const targetWidth = viewWidth * 0.3;
      const s = targetWidth / baseWidth;
      mesh.scale.setScalar(s);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const { width, height } = rect;
      const safeW = Math.max(1, Math.floor(width));
      const safeH = Math.max(1, Math.floor(height));
      renderer.setSize(safeW, safeH, false);
      camera.aspect = safeW / safeH;
      camera.updateProjectionMatrix();
      scaleToViewportWidth();
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    const render = () => {
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    // --- GSAP: intro (texto) ---
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.hero__title .line', { yPercent: 120, duration: 0.9, stagger: 0.06 }, 0)
      .from('.hero__sub', { y: 20, opacity: 0, duration: 0.6 }, 0.35)
      .from(mesh.rotation, { x: -0.4, y: 0.6, duration: 1.2 }, 0);

    // --- Lenis + ScrollTrigger (pin + scrub) ---
    const lenis = new Lenis({ lerp: 0.12 });
    let rafScrollId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafScrollId = requestAnimationFrame(raf);
    };
    rafScrollId = requestAnimationFrame(raf);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value?: number) {
        if (typeof value === 'number') {
          lenis.scrollTo(value);
          return undefined as unknown as number; // satisfy signature
        }
        return window.scrollY;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.body.style.transform ? 'transform' : 'fixed',
    });
    lenis.on('scroll', ScrollTrigger.update);

    const st = ScrollTrigger.create({
      trigger: heroRef.current!,
      start: 'top top',
      end: 'bottom+=150% top',
      pin: true,
      scrub: 1,
      onUpdate: ({ progress }) => {
        gsap.to(mesh.rotation, {
          x: gsap.utils.mapRange(0, 1, 0, Math.PI * 1.25, progress),
          y: gsap.utils.mapRange(0, 1, 0, Math.PI * 2.0, progress),
          duration: 0.12,
          overwrite: true,
        });
        camera.position.z = 6 - progress * 1.0;
      },
    });

    // Respeta reduce-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      tl.progress(1);
      st.disable();
      lenis.destroy();
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(rafScrollId);
      ScrollTrigger.getAll().forEach((s) => s.kill());
      lenis.destroy();
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <canvas ref={canvasRef} className="hero__canvas" />
      <div className="hero__copy h-full py-20 relative z-10 place-content-center text-center">
        <div className="top min-h-3/6 flex flex-col justify-center items-center w-full">
          <div className="transition1">
            <div className="flex justify-center items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="201" height="154" viewBox="0 0 201 154" fill="none">
                <path d="M100.218 60.3727C183.412 60.3727 200.424 60.3727 200.424 104.771C200.424 149.168 182.374 153.11 100.01 153.11C21.5877 153.11 1.67096 149.791 0.0112303 110.165C-0.196236 106.845 2.50083 104.148 5.61282 104.148H38.8074C41.9194 104.148 44.409 106.638 44.409 109.75V111.202C44.409 114.314 46.8986 116.804 50.0106 116.804H150.217C153.329 116.804 155.819 114.314 155.819 111.202V98.3391C155.819 95.2271 153.329 92.7375 150.217 92.7375H100.218C17.8533 92.7375 1.67096 92.7375 1.67096 48.3397C1.67096 3.94186 19.7205 0 100.218 0C177.188 0 196.689 4.3568 198.349 42.9456C198.557 46.265 196.067 48.9621 192.748 48.9621H159.553C156.441 48.9621 153.951 46.4725 153.951 43.3605V41.9082C153.951 38.7962 151.462 36.3066 148.35 36.3066H51.8778C48.7658 36.3066 46.2762 38.7962 46.2762 41.9082V54.7711C46.2762 57.8831 48.7658 60.3727 51.8778 60.3727H91.2965C94.201 60.3727 97.1055 60.3727 100.218 60.3727Z" fill="white"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="204" height="146" viewBox="0 0 204 146" fill="none">
                <path d="M198.13 0C201.242 0 203.732 2.4896 203.732 5.60159V26.7632C203.732 29.8752 201.242 32.3648 198.13 32.3648H129.667C126.555 32.3648 124.065 34.8544 124.065 37.9664V139.625C124.065 142.737 121.575 145.226 118.463 145.226H85.2687C82.1567 145.226 79.6671 142.737 79.6671 139.625V37.9664C79.6671 34.8544 77.1775 32.3648 74.0655 32.3648H5.60159C2.48959 32.3648 0 29.8752 0 26.7632V5.60159C0 2.4896 2.48959 0 5.60159 0H198.13Z" fill="white"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="194" height="150" viewBox="0 0 194 150" fill="none">
                <path d="M193.568 72.6132C193.568 145.226 195.228 149.168 96.8886 149.168C-1.65796 149.168 0.00176244 145.226 0.00176244 72.6132V5.60159C0.00176244 2.4896 2.49137 0 5.60337 0H38.5905C41.7025 0 44.3996 2.4896 44.3996 5.60159V107.468C44.3996 110.58 46.8892 113.069 50.0012 113.069H143.569C146.681 113.069 149.17 110.58 149.17 107.468V5.60159C149.17 2.4896 151.867 0 154.979 0H187.966C191.078 0 193.568 2.4896 193.568 5.60159V72.6132Z" fill="white"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="313" height="154" viewBox="0 0 313 154" fill="none">
                <path d="M208.421 1.94922C232.574 1.94922 251.048 2.19388 265.13 3.64844C279.176 5.09941 289.168 7.77834 296.138 12.8809C303.213 18.0608 306.898 25.5255 308.831 35.8359C310.751 46.0725 310.991 59.3822 310.991 76.5117C310.991 93.6395 310.763 106.936 308.86 117.152C306.944 127.443 303.278 134.886 296.213 140.041C289.255 145.117 279.268 147.769 265.214 149.2C251.124 150.635 232.625 150.865 208.422 150.865L208.423 150.866L9.50195 151.074H9.5C5.31157 151.074 1.94927 147.712 1.94922 143.523V9.5C1.94924 5.31158 5.31155 1.94922 9.5 1.94922H208.421ZM53.8975 42.1543C51.9529 42.1545 50.2454 43.8855 50.2451 46.0137V107.217C50.2452 109.252 51.8621 110.869 53.8975 110.869H259.042C261.077 110.869 262.695 109.252 262.695 107.217V46.0137C262.695 43.8853 260.987 42.1543 259.042 42.1543H53.8975Z" stroke="#CAFF1D" stroke-width="3.8982"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="45" height="146" viewBox="0 0 45 146" fill="none">
                <path d="M38.7962 0C41.9082 0 44.3978 2.4896 44.3978 5.60159V139.625C44.3978 142.737 41.9082 145.226 38.7962 145.226H5.60157C2.48958 145.226 0 142.737 0 139.625V5.60159C0 2.4896 2.48958 0 5.60157 0H38.7962Z" fill="white"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="202" height="154" viewBox="0 0 202 154" fill="none">
                <path d="M101.036 0C197.716 0 201.657 3.94186 201.657 76.5551C201.657 149.168 197.923 153.11 101.036 153.11C3.9419 153.11 0 149.168 0 76.5551C0 3.94186 4.14937 0 101.036 0ZM151.658 116.804C154.77 116.804 157.26 114.314 157.26 111.202V41.9082C157.26 38.7962 154.77 36.3066 151.658 36.3066H49.9994C46.8874 36.3066 44.3979 38.7962 44.3979 41.9082V111.202C44.3979 114.314 46.8874 116.804 49.9994 116.804H151.658Z" fill="white"/>
              </svg>
            </div>
          </div>
          <div className="transition2">
            <p className="hero__description mt-6 max-w-xl mx-auto text-lg opacity-90"></p>
          </div>
        </div>
       <div className="bottom absolute bottom-10 w-full flex justify-center">
         <p className="hero__sub">scroll to explore →</p>
       </div>
      </div>
    </section>
  );
}

