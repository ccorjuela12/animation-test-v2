import { Center, MeshTransmissionMaterial, Text3D } from '@react-three/drei';

export default function ModelText() {
  return (
    // Keep the logo visible through the text using a transmissive glass material.
    <Center position={[0, 0.18, -0.2]}>
      <Text3D
        font="/unison_bold.json"
        size={1.65}
        height={0.25}
        bevelEnabled
        bevelSize={0.02}
        bevelThickness={0.03}
        curveSegments={24}
      >
        AI
        <MeshTransmissionMaterial
          anisotropy={0.25}
          chromaticAberration={0.02}
          distortion={0.05}
          distortionScale={0.5}
          ior={1.5}
          roughness={0.08}
          samples={16}
          thickness={0.75}
          temporalDistortion={0.1}
          color="#b7f3ff"
        />
      </Text3D>
    </Center>
  );
}
