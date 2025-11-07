import * as THREE from 'three'
import React, { JSX, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    mesh_0: THREE.Mesh
    mesh_1: THREE.Mesh
    mesh_2: THREE.Mesh
    mesh_3: THREE.Mesh
  }
  materials: {}
}

export function ModelAI(props: JSX.IntrinsicElements['group']) {
    const { nodes, materials } = useGLTF('/models/AI_exported.glb') as unknown as GLTFResult
    const textureMap = new THREE.TextureLoader().load('/TEXTURE.png')
    const textureNormal = new THREE.TextureLoader().load('/TEXTURE_2.png')

    const material = new THREE.MeshStandardMaterial({
        map: textureMap,
        normalMap: textureNormal,
        roughness: 0.08,
        color: '#ffffff',
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1
    });
    return (
        <group {...props} dispose={null} position={[0,0.1,1.2]} rotation={[0,-3.15,0]}>
            <ambientLight intensity={1}/>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.mesh_0.geometry}
                material={material}
                
            />
       </group>
    )
}

useGLTF.preload('/models/AI_exported.glb')