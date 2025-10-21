import * as THREE from 'three';

export const LIGHT_COLOR_HEX = ['#CAFF1D', '#67FFED', '#FF6AD5', '#FF8A3D'];
export const LIGHT_COLOR_PALETTE = LIGHT_COLOR_HEX.map((hex) => new THREE.Color(hex));

export const BASE_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GRID_FRAGMENT_SHADER = `
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

export type GridUniformMap = Record<string, THREE.IUniform>;

export function createGridLayer(scene: THREE.Scene) {
  const uniforms: GridUniformMap = {
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
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: BASE_VERTEX_SHADER,
    fragmentShader: GRID_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
  });

  const gridMesh = new THREE.Mesh(geometry, material);
  gridMesh.renderOrder = 0;
  scene.add(gridMesh);

  return { gridMesh, uniforms };
}

