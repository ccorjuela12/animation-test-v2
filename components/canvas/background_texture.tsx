import * as THREE from 'three'
import { useTexture, Environment } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

export default function BackgroundTexture() {
  const { viewport, camera } = useThree()
  const texture = useTexture('/BG.png')

  const envTexture = texture.clone()
  envTexture.mapping = THREE.EquirectangularReflectionMapping

  const planePositionZ = -20
  // Calcula la distancia desde la cámara al plano
  const distance = camera.position.z - planePositionZ
  // Calcula el factor de escala para que el plano llene la vista a esa distancia.
  // El tamaño del viewport se calcula en z=0, a una distancia de `camera.position.z`.
  const scale = distance / camera.position.z

  return (
    <>
      <Environment map={envTexture} background={false}/>

      <mesh
        position={[0, 0, planePositionZ]}
        scale={[viewport.width * scale, viewport.height * scale, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} color="gray" toneMapped={false} />
      </mesh>
    </>
  )
}