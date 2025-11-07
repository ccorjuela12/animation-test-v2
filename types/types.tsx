import type { JSX, MouseEventHandler, MutableRefObject } from 'react'
import * as THREE from 'three'
import type { Vector3Tuple, Euler } from 'three'


//Loader
export type PathEntry = {
  path: SVGPathElement
  index: number
  def: IconPathDef
}

export type IconPathDef = {
  d: string;
  finalFill?: string;
};

export type IconDef = {
  width: number;
  height: number;
  viewBox: string;
  paths: IconPathDef[];
};

//progress indicateor
export type SectionEntry = {
  id: string
  label: string
  progress: number
}

export type SectionConfig = {
  node: HTMLElement
  id: string
  label: string
}

//animation canvas
export type SceneProps = {
  rotationTarget: MutableRefObject<number>
  logoVisibility: MutableRefObject<number>
  sliderReveal: MutableRefObject<number>
  sliderActive: MutableRefObject<number>
  glowReveal: MutableRefObject<number>
  storiesVideoReveal: MutableRefObject<number>
  storiesVideoLayout: MutableRefObject<number>
  modelTextProgress: MutableRefObject<number>
  visionGridProgress: MutableRefObject<number>
  visionModelTextProgress: MutableRefObject<number>
}

export type AnimationCanvasProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>
  sliderRevealRef?: MutableRefObject<number>
  logoVisibilityRef?: MutableRefObject<number>
  sliderActiveRef?: MutableRefObject<number>
  glowRevealRef?: MutableRefObject<number>
  storiesVideoRevealRef?: MutableRefObject<number>
  storiesVideoLayoutRef?: MutableRefObject<number>
  modelTextProgressRef?: MutableRefObject<number>
  visionGridProgressRef?: MutableRefObject<number>
  visionModelTextProgressRef?: MutableRefObject<number>
}

//Content Section Pages
export type ContentPageProps = {
  logoVisibilityRef: MutableRefObject<number>
  sliderRevealRef: MutableRefObject<number>
  sliderActiveRef: MutableRefObject<number>
  glowRevealRef: MutableRefObject<number>
  storiesVideoRevealRef: MutableRefObject<number>
  storiesVideoLayoutRef: MutableRefObject<number>
  modelTextProgressRef: MutableRefObject<number>
  visionGridProgressRef: MutableRefObject<number>
  visionModelTextProgressRef: MutableRefObject<number>
}

// Scene Canvas Sections
export type BackgroundTextureProps = {
  sliderReveal: MutableRefObject<number>
  glowReveal?: MutableRefObject<number>
  hideProgress?: MutableRefObject<number>
}

export type GroupProps = JSX.IntrinsicElements['group']

export type ModelTextProps = GroupProps & {
  animationProgressRef: MutableRefObject<number>
  text?: string
  size?: number
  position?: [number, number, number]
  scaleRange?: [number, number]
  fadeSpeed?: number
  mode?: 'fadeOut' | 'fadeIn'
}

export type SliderProjectsProps = {
  revealRef: MutableRefObject<number>
  activeRef?: MutableRefObject<number>
}

export type StoriesVideoProps = {
  revealRef: MutableRefObject<number>
  layoutRef: MutableRefObject<number>
}

export type SliderCardProps = {
  videoSrc: string
}

export type GridPanelProps = {
  geometry: THREE.PlaneGeometry
  position: Vector3Tuple
  rotation: Euler
  uvScale: [number, number]
  minorScale: [number, number]
  panelType: PanelType
  depthAxis: 0 | 1
  depthFlip?: boolean
  lateralFlip?: boolean
  tunnelDepth: number
  progressRef: MutableRefObject<number>
}

export type PanelType = 0 | 1 | 2 | 3 | 4

export type GridTunnelProps = {
  progressRef?: MutableRefObject<number>
}

export interface PlayReelProps {
  text: string
  numberIcons: number
  repeat: number
  className?: string
  isLooping?: boolean
  marqueeSpeed?: number
  direction?: 'left' | 'right'
  onMouseEnter?: MouseEventHandler<HTMLDivElement>
  onMouseLeave?: MouseEventHandler<HTMLDivElement>
}

export type GradientBackgroundProps = {
  position?: Vector3Tuple
  rotation?: Vector3Tuple
}