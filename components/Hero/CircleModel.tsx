'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

type Props = {
  visible?: boolean;
  progress?: number; // 0..1 desde el ScrollTrigger del contenedor
};

export default function CircleModel({ visible = false, progress = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0a10, 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;
    cameraRef.current = camera;

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir1.position.set(2, 3, 4);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x9a6bff, 0.6);
    dir2.position.set(-3, -2, 2);
    scene.add(dir2);

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
    meshRef.current = mesh;
    scene.add(mesh);

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

    // Pequeño giro de entrada para el modelo
    gsap.from(mesh.rotation, { x: -0.4, y: 0.6, duration: 1.2, ease: 'power2.out' });

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // Actualiza la rotación y la cámara en base al progreso del scroll
  useEffect(() => {
    const mesh = meshRef.current;
    const camera = cameraRef.current;
    if (!mesh || !camera) return;
    gsap.to(mesh.rotation, {
      x: -0.4 + 0.8 * progress,
      y: 0.6 - 1.2 * progress,
      duration: 0.12,
      overwrite: true,
      ease: 'none',
    });
    camera.position.z = 6 - progress * 1.0;
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className={`hero__canvas transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

