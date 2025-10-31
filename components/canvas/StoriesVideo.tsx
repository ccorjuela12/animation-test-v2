import { useVideoTexture } from "@react-three/drei";
import { RoundedVideoPlane } from "./utils/utils";
import * as THREE from 'three'
import { useRef } from "react";

const CARD_WIDTH = 1.45
const CARD_HEIGHT = 0.75 
const CARD_RADIUS = 0.08

export default function StoriesVideo(){
    const videoRef = useRef<THREE.Group | null>(null);
    const texture = useVideoTexture(
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      {
        muted: true,
        loop: true,
      },
    );
    return (
      <group ref={videoRef} position={[0, 0, 0]} renderOrder={30}>
        <RoundedVideoPlane
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          radius={CARD_RADIUS}
          map={texture}
          borderColor="#FF4000"
          borderSize={0.01}
          borderFeather={0.012}
        />
      </group>
    );
}