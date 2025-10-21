import * as THREE from 'three';
import { gsap } from 'gsap';
import { BASE_VERTEX_SHADER, GridUniformMap } from './gridLayer';

export type ImageLayoutConfig = {
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

export const IMAGES: ImageLayoutConfig[] = [
  { src: '/images/1.png', layout: { heightFactor: 0.5, yFactor: 0.52, xFactor: -0.4, rotationDeg: 1, scale: 0.5 } },
  { src: '/images/2.png', layout: { heightFactor: 0.5, yFactor: -0.36, xFactor: 0.0, rotationDeg: 1, scale: 0.5 } },
  { src: '/images/3.png', layout: { heightFactor: 0.5, yFactor: 0.52, xFactor: 0.4, rotationDeg: 1, scale: 0.5 } },
  { src: '/images/4.png', layout: { heightFactor: 0.5, yFactor: -0.2, xFactor: 0.8, rotationDeg: 1, scale: 0.5 } },
];

type ImageLayoutData = {
  heightFactor: number;
  yFactor: number;
  xFactor: number | null;
  gapFactor: number;
  rotation: number;
  xJitter: number;
  scale: number;
};

const IMAGE_FRAGMENT_SHADER = /* glsl */ `
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

type CreateImageLayerParams = {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  uniforms: GridUniformMap;
  animateIn?: boolean;
};

export type ImageLayer = {
  track: THREE.Group;
  imageMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[];
  imageMaterials: THREE.ShaderMaterial[];
  layoutImages: () => void;
  getTrackWidthUnits: () => number;
  loadImages: () => Promise<void>;
};

export function createImageLayer({ scene, camera, uniforms, animateIn }: CreateImageLayerParams): ImageLayer {
  const track = new THREE.Group();
  track.position.set(0, 0, 0.01);
  track.renderOrder = 1;
  scene.add(track);

  const imageMaterials: THREE.ShaderMaterial[] = [];
  const imageMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  const imageLayoutData: ImageLayoutData[] = [];
  let trackWidthUnits = 0;
  let loaded = false;

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
      const layout = imageLayoutData[index] ?? {
        heightFactor: 0.5,
        yFactor: 0,
        gapFactor: 0.12,
        xFactor: null as number | null,
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
  };

  const loadImages = async () => {
    if (loaded) return;
    loaded = true;

    const loader = new THREE.TextureLoader();
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

    const textures = await Promise.all(IMAGES.map(({ src }) => loadTexture(src)));
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

      imageLayoutData.push({
        heightFactor: override.heightFactor ?? randomHeight,
        yFactor: override.yFactor ?? randomY,
        xFactor: override.xFactor ?? null,
        gapFactor: override.gapFactor ?? UNIFORM_GAP_FACTOR,
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
        vertexShader: BASE_VERTEX_SHADER,
        fragmentShader: IMAGE_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
      });

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
  };

  if (animateIn) {
    void loadImages();
  }

  return {
    track,
    imageMeshes,
    imageMaterials,
    layoutImages,
    getTrackWidthUnits: () => trackWidthUnits,
    loadImages,
  };
}

