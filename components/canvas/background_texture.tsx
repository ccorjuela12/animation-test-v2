import * as THREE from 'three'
import { Environment } from '@react-three/drei'

export default function BackgroundTexture() {
  return (
    <Environment resolution={1920} background backgroundIntensity={0.01} blur={0.07}>
      <mesh>
        <sphereGeometry args={[50, 64, 64]} />
        <shaderMaterial
          side={THREE.BackSide}
          uniforms={{
            uCells:      { value: new THREE.Vector2(120, 80) }, // más celdas = cuadrados más pequeños
            uThickness:  { value: 1.25 },    // “pixel-ish” en pantalla
            uFeather:    { value: 0.75 },    // suavizado del borde (anti alias)
            uColor:      { value: new THREE.Color('#ffffff') },
            uBgColor:    { value: new THREE.Color('#000000') },
          }}
          vertexShader={/* glsl */`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
          `}
          fragmentShader={/* glsl */`
            varying vec2 vUv;
            uniform vec2  uCells;
            uniform float uThickness; // grosor en píxeles “aprox”
            uniform float uFeather;   // suavizado en píxeles
            uniform vec3  uColor, uBgColor;

            // Grilla con grosor en espacio de pantalla usando derivadas
            void main() {
              vec2 grid = vUv * uCells;

              // distancia a la línea más cercana en cada eje, centrada en 0.5
              vec2 g = abs(fract(grid - 0.5) - 0.5);

              // Derivadas: tamaño de 1 “uv de celda” en pantalla (px-ish)
              vec2 w = fwidth(grid);                  // ~ px por celda
              float px = 0.5 * (w.x + w.y);           // escala promedio

              // Grosor/feather en pantalla
              float t  = uThickness * px;
              float fe = uFeather   * px;

              // Bordes (menor de X/Y), luego perfil con smoothstep
              float d = min(g.x, g.y);
              float line = 1.0 - smoothstep(t, t + fe, d);

              vec3 col = mix(uBgColor, uColor, line);
              gl_FragColor = vec4(col, 1.0);
            }
          `}
        />
      </mesh>
    </Environment>
  )
}
