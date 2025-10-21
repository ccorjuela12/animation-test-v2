'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createGridLayer, LIGHT_COLOR_PALETTE } from './gridLayer';
import { createImageLayer } from './imageLayer';

export default function GridCanvas({ className, animateIn, scrollProgress }: { className?: string, animateIn?: boolean, scrollProgress?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeRef = useRef<any>({});

  useEffect(() => {
    const three = threeRef.current;
    if (three.uniforms && typeof scrollProgress === 'number') {
        gsap.to(three.uniforms.uScroll, {
            value: scrollProgress,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: true,
        });
    }
  }, [scrollProgress]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    const { gridMesh, uniforms } = createGridLayer(scene);
    const imageLayer = createImageLayer({ scene, camera, uniforms, animateIn });

    threeRef.current = { ...threeRef.current, scene, camera, renderer, track: imageLayer.track, uniforms, gridMesh };

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
            gridMesh.scale.set(aspect, 1, 1);
        } else {
            gridMesh.scale.set(1, 1 / aspect, 1);
        }
        uniforms.uResolution.value.set(width, height);
        if (imageLayer.imageMeshes.length > 0) imageLayer.layoutImages();
    };

    resize();
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    let rafId: number;
    const renderLoop = () => {
        uniforms.uTime.value = clock.getElapsedTime();
        if (imageLayer.imageMeshes.length > 0) {
            const viewWidth = camera.right - camera.left;
            const maxShift = Math.max(0, imageLayer.getTrackWidthUnits() - viewWidth);
            const p = (uniforms.uScroll.value as number) || 0;
            imageLayer.track.position.x = -THREE.MathUtils.lerp(0, maxShift, p);

            imageLayer.imageMeshes.forEach((mesh, index) => {
                const worldX = mesh.position.x + imageLayer.track.position.x;
                const d = Math.abs(worldX - 0);
                const vis = 1.0 - THREE.MathUtils.smoothstep(d, 0.0, viewWidth * 0.35);

                if (index < 4) {
                    const lightIntensity = vis * 1.5;
                    const worldY = mesh.position.y;
                    const screenX = (worldX - camera.left) / (camera.right - camera.left);
                    const screenY = (worldY - camera.bottom) / (camera.top - camera.bottom);

                    if (uniforms.uImageLightPositions.value[index]) {
                        (uniforms.uImageLightPositions.value[index] as THREE.Vector2).set(screenX, screenY);
                        (uniforms.uImageLightColors.value[index] as THREE.Color).copy(LIGHT_COLOR_PALETTE[index % LIGHT_COLOR_PALETTE.length]);
                        uniforms.uImageLightIntensities.value[index] = lightIntensity;
                    }
                }
            });
        }
        renderer.render(scene, camera);
        rafId = window.requestAnimationFrame(renderLoop);
    };

    rafId = window.requestAnimationFrame(renderLoop);

    if (animateIn) {
        void imageLayer.loadImages();
    }

    return () => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
    };
  }, [animateIn]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
