'use client'

import { JSX, useEffect, useMemo } from 'react'
import * as THREE from 'three'

type GroupProps = JSX.IntrinsicElements['group']

type RoundedVideoPlaneProps = GroupProps & {
  width?: number
  height?: number
  radius?: number
  map?: THREE.Texture | null
  borderColor?: string
  borderSize?: number
  borderFeather?: number
}

export function RoundedVideoPlane({
  width = 1,
  height = 0.5,
  radius = 0.05,
  map,
  borderColor = '#ffffff',
  borderSize = 0.12,
  borderFeather = 0.02,
  ...props
}: RoundedVideoPlaneProps) {
  const geometry = useMemo<THREE.ShapeGeometry>(() => {
    const shape = new THREE.Shape()
    const hw = width / 2
    const hh = height / 2
    const r = Math.min(radius, hw, hh)
    shape.moveTo(-hw + r, -hh)
    shape.lineTo(hw - r, -hh)
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r)
    shape.lineTo(hw, hh - r)
    shape.quadraticCurveTo(hw, hh, hw - r, hh)
    shape.lineTo(-hw + r, hh)
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r)
    shape.lineTo(-hw, -hh + r)
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
    const plane = new THREE.ShapeGeometry(shape, 32)
    const uv = plane.attributes.uv
    const pos = plane.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const u = (x + width / 2) / width
      const v = (y + height / 2) / height
      uv.setXY(i, u, v)
    }
    uv.needsUpdate = true
    return plane
  }, [width, height, radius])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  const borderTexture = useMemo<THREE.CanvasTexture | null>(() => {
    const ratio = THREE.MathUtils.clamp(borderSize, 0, 1)
    if (ratio <= 0) return null
    if (typeof document === 'undefined') return null
    const feather = THREE.MathUtils.clamp(borderFeather, 0, ratio)
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const gradient = ctx.createLinearGradient(0, 0, 0, size)
    const start = 1 - ratio
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(start, 'rgba(255,255,255,0)')
    if (feather > 0) {
      gradient.addColorStop(Math.min(1, start + feather), 'rgba(255,255,255,1)')
    } else {
      gradient.addColorStop(start, 'rgba(255,255,255,1)')
    }
    gradient.addColorStop(1, 'rgba(255,255,255,1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
  }, [borderSize, borderFeather])

  useEffect(() => {
    return () => {
      borderTexture?.dispose()
    }
  }, [borderTexture])

  return (
    <group {...props}>
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      {borderTexture && (
        <mesh geometry={geometry} position={[0, 0, 0.0001]} renderOrder={2}>
          <meshBasicMaterial
            color={borderColor}
            toneMapped={false}
            transparent
            alphaMap={borderTexture}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
