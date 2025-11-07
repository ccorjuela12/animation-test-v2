'use client'

import { useMemo } from 'react'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import type { SVGLoaderPath } from 'three/examples/jsm/loaders/SVGLoader.js'
import * as THREE from 'three'
import type { GroupProps } from '@/types/types'
import { ICONS } from './utils/icons'

type LogoBillboardProps = GroupProps & {
  width?: number
  height?: number
  colorOverride?: string
  toneMapped?: boolean
  gap?: number
}

type IconShape = {
  key: string
  shape: THREE.Shape
  color: string
}

const loader = new SVGLoader()

const serializeIconToShapes = (index: number, colorOverride?: string): {
  width: number
  height: number
  shapes: IconShape[]
} => {
  const icon = ICONS[index]
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" widht="${icon.width}" height="${icon.height}">${icon.paths
    .map(
      (path) =>
        `<path fill="${colorOverride ?? path.finalFill ?? '#ffffff'}" d="${path.d}" />`,
    )
    .join('')}</svg>`

  const data = loader.parse(svgMarkup)
  const shapes = data.paths.flatMap((path: SVGLoaderPath, pathIndex: number) => {
    const pathColor =
      typeof path.color === 'string'
        ? path.color
        : path.color instanceof THREE.Color
          ? path.color.getStyle()
          : undefined

    const resolvedColor = colorOverride ?? path.userData?.style?.fill ?? pathColor ?? '#ffffff'

    return path.toShapes(true).map((shape: THREE.Shape, shapeIndex: number) => ({
      key: `${index}-${pathIndex}-${shapeIndex}`,
      shape,
      color: resolvedColor,
    }))
  })

  return {
    width: icon.width,
    height: icon.height,
    shapes,
  }
}

export default function LogoBillboard({
  width,
  height,
  colorOverride,
  toneMapped = false,
  gap = 8,
  ...props
}: LogoBillboardProps) {
  const iconShapes = useMemo(() => {
    return ICONS.map((_, index) => serializeIconToShapes(index, colorOverride))
  }, [colorOverride])

  const totalWidth =
    iconShapes.reduce((acc, icon, idx) => acc + icon.width + (idx > 0 ? gap : 0), 0) || 1
  const maxHeight = iconShapes.reduce((acc, icon) => Math.max(acc, icon.height), 0)
  const defaultWidth = 5

  const targetWidth =
    width ??
    (height ? (height / maxHeight) * totalWidth : defaultWidth)
  const scaleFromWidth = targetWidth / totalWidth
  const scaleFromHeight = height ? height / maxHeight : scaleFromWidth
  const scale = Math.min(scaleFromWidth, scaleFromHeight)

  const scaledWidth = totalWidth * scale
  const scaledHeight = maxHeight * scale

  let cursor = 0

  return (
    <group
      {...props}
      scale={[scale, scale, scale]}
      position={[-scaledWidth / 2, -scaledHeight / 2, 0]}
    >
      {iconShapes.map((icon, iconIndex) => {
        const iconPositionX = cursor
        const isLast = iconIndex === iconShapes.length - 1
        cursor += icon.width + (isLast ? 0 : gap)
        return (
          <group key={`icon-${iconIndex}`} position={[iconPositionX, 0, 0]}>
            {icon.shapes.map(({ key, shape, color }) => (
              <mesh key={key}>
                <shapeGeometry args={[shape]} />
                <meshBasicMaterial
                  color={new THREE.Color(color)}
                  transparent
                  toneMapped={toneMapped}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}
