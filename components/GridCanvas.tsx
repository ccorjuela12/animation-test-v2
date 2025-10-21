'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

type ImageLayoutConfig = {
  src: string;
  layout?: {
    heightFactor?: number;
    yFactor?: number;
    xFactor?: number;
    gapFactor?: number;
    rotationDeg?: number;
    xJitter?: number;
    scale?: number;
  };
};

const IMAGES: ImageLayoutConfig[] = [
  { src: '/images/1.png', layout: { heightFactor: 0.5, yFactor: 0.52, xFactor: -0.4, rotationDeg: 1, scale: .5 } },
  { src: '/images/2.png', layout: { heightFactor: 0.5, yFactor: -0.36, xFactor: 0.0, rotationDeg: 1, scale: .5 } },
  { src: '/images/3.png', layout: { heightFactor: 0.5, yFactor: 0.52, xFactor: 0.4, rotationDeg: 1, scale: .5 } },
  { src: '/images/4.png', layout: { heightFactor: 0.5, yFactor: -0.2, xFactor: 0.8, rotationDeg: 1, scale: .5 } },
];

const LIGHT_COLOR_HEX = ['#CAFF1D', '#67FFED', '#FF6AD5', '#FF8A3D'];
const LIGHT_COLOR_PALETTE = LIGHT_COLOR_HEX.map((hex) => new THREE.Color(hex));

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
  uniform vec3 uLightColor;
  uniform vec2 uLightPos;
  uniform float uLightIntensity;
  uniform vec3 uImageLightColors[4];
  uniform vec2 uImageLightPositions[4];
  uniform float uImageLightIntensities[4];

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
    float alpha = uLinesOpacity * lines * vignette + neon * 0.4;

    for(int i = 0; i < 4; i++) {
      if(uImageLightIntensities[i] > 0.0) {
        vec2 imageLightPx = uImageLightPositions[i] * uResolution;
        float imageLightDist = distance(px, imageLightPx);
        float imageNeon = uImageLightIntensities[i] * exp(-imageLightDist * 0.01);
        col += uImageLightColors[i] * imageNeon;
        alpha += imageNeon * 0.5;
      }
    }

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

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

    const track = new THREE.Group();
    track.position.set(0, 0, 0.01);
    track.renderOrder = 1;
    scene.add(track);

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
        uImageLightColors: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
        uImageLightPositions: { value: [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()] },
        uImageLightIntensities: { value: [0, 0, 0, 0] },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false });
    const gridMesh = new THREE.Mesh(geometry, material);
    gridMesh.renderOrder = 0;
    scene.add(gridMesh);

    threeRef.current = { ...threeRef.current, scene, camera, renderer, track, uniforms, gridMesh };

    let imageMaterials: THREE.ShaderMaterial[] = [];
    let imageMeshes: THREE.Mesh[] = [];
    let imageLayoutData: any[] = [];
    let trackWidthUnits = 0;

    const layoutImages = () => {
        const viewWidth = camera.right - camera.left;
        const viewHeight = camera.top - camera.bottom;
        if (imageMeshes.length === 0 || viewHeight <= 0) {
            trackWidthUnits = 0;
            return;
        }

        const baseHeight = viewHeight * 0.5;
        let cursor = -viewWidth * 0.2;
        const centers: number[] = [];
        const widths: number[] = [];
        const yOffsets: number[] = [];
        const rotations: number[] = [];

        imageMeshes.forEach((mesh, index) => {
            const texRes = imageMaterials[index].uniforms.uTexRes.value as THREE.Vector2;
            const texW = texRes.x || 1;
            const texH = texRes.y || 1;
            const layout = imageLayoutData[index] ?? { heightFactor: 0.5, yFactor: 0, gapFactor: 0.12, xFactor: null, rotation: 0, xJitter: 0, scale: 1 };
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
                cursor += planeW + pad;
            } else {
                cursor = Math.max(cursor, centerX + planeW * 0.5 + pad);
            }
        });

        if (!centers.length) {
            trackWidthUnits = viewWidth;
            return;
        }

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

    if (animateIn) {
        const loader = new THREE.TextureLoader();
        const loadTexture = (src: string) => new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(src, (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                resolve(texture);
            }, undefined, (error) => reject(error));
        });

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
            vec2 distort(vec2 px){ float t = uTime * 0.25; float wy = sin((px.y*0.01 + t) * 6.0) * 0.6; float wx = sin((px.x*0.01 + t*0.7) * 3.0) * 0.45; float amp = mix(1.0, 1.6, smoothstep(0.0, 0.8, length(uMouse - vec2(0.5)))); return px + vec2(wx, wy) * (uDistort * amp); }
            vec2 cover(vec2 uv, vec2 plane, vec2 tex){ float pr = plane.x/plane.y, tr = tex.x/tex.y; vec2 s = (pr > tr) ? vec2(1.0, tr/pr) : vec2(pr/tr, 1.0); return (uv - 0.5) * s + 0.5; }
            void main(){
                vec2 n  = gl_FragCoord.xy / uResolution;
                vec2 n2 = distort(gl_FragCoord.xy) / uResolution;
                vec2 delta = n2 - n;
                vec2 uv = cover(vUv + delta, vec2(1.0), uTexRes);
                vec3 col = texture2D(uTex, uv).rgb;
                gl_FragColor = vec4(col, uAlpha);
            }
        `;

        Promise.all(IMAGES.map(({ src }) => loadTexture(src)))
            .then((textures) => {
                textures.forEach((texture, index) => {
                    const texWidth = texture.image?.width ?? 1;
                    const texHeight = texture.image?.height ?? 1;
                    const override = IMAGES[index]?.layout ?? {};
                    const UNIFORM_GAP_FACTOR = 0.35;
                    const randomHeight = THREE.MathUtils.lerp(0.3, 0.75, THREE.MathUtils.seededRandom());
                    const randomY = THREE.MathUtils.lerp(-0.45, 0.45, THREE.MathUtils.seededRandom());
                    const randomRotDeg = THREE.MathUtils.lerp(-14, 14, THREE.MathUtils.seededRandom());
                    const randomJitter = THREE.MathUtils.lerp(-0.12, 0.12, THREE.MathUtils.seededRandom());
                    const randomScale = THREE.MathUtils.lerp(0.85, 1.25, THREE.MathUtils.seededRandom());

                    imageLayoutData.push({ heightFactor: override.heightFactor ?? randomHeight, yFactor: override.yFactor ?? randomY, xFactor: override.xFactor ?? null, gapFactor: override.gapFactor ?? UNIFORM_GAP_FACTOR, rotation: THREE.MathUtils.degToRad(override.rotationDeg ?? randomRotDeg), xJitter: override.xFactor !== undefined ? 0 : (override.xJitter ?? randomJitter), scale: override.scale ?? randomScale });

                    const material = new THREE.ShaderMaterial({ uniforms: { uTex: { value: texture }, uTexRes: { value: new THREE.Vector2(texWidth, texHeight) }, uResolution: uniforms.uResolution, uAlpha: { value: 0 }, uTime: uniforms.uTime, uDistort: uniforms.uDistort, uMouse: uniforms.uMouse }, vertexShader, fragmentShader: imageFragment, transparent: true, depthWrite: false });
                    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
                    mesh.position.set(0, 0, 0.01);
                    track.add(mesh);
                    imageMaterials.push(material);
                    imageMeshes.push(mesh);
                });

                layoutImages();

                imageMaterials.forEach((mat, i) => {
                    gsap.to(mat.uniforms.uAlpha, { value: 0.7, duration: 1.2, delay: i * 0.15, ease: 'power2.out' });
                });
            });
    }

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
        if (imageMeshes.length > 0) layoutImages();
    };

    resize();
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    let rafId: number;
    const renderLoop = () => {
        uniforms.uTime.value = clock.getElapsedTime();
        if (imageMeshes.length > 0) {
            const viewWidth = camera.right - camera.left;
            const maxShift = Math.max(0, trackWidthUnits - viewWidth);
            const p = (uniforms.uScroll.value as number) || 0;
            track.position.x = -THREE.MathUtils.lerp(0, maxShift, p);

            imageMeshes.forEach((mesh, index) => {
                const worldX = mesh.position.x + track.position.x;
                const d = Math.abs(worldX - 0);
                const vis = 1.0 - THREE.MathUtils.smoothstep(d, 0.0, viewWidth * 0.35);
                // No fade-in animation here, just setting based on scroll
                // const alphaUniform = imageMaterials[index]?.uniforms.uAlpha as THREE.IUniform | undefined;
                // if (alphaUniform) {
                //     alphaUniform.value = vis * 0.7;
                // }

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