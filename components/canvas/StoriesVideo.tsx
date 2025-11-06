import { useMemo, useRef } from 'react'
import { Euler, MathUtils, Group, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useVideoTexture } from '@react-three/drei'
import { RoundedVideoPlane } from './utils/utils'
import ModelText from './model_text'
import { StoriesVideoProps } from '@/types/types'

const CARD_WIDTH = [2.05, 4]
const CARD_HEIGHT = [1, 2.1]
const VIDEO_LOCAL_BASE = [new Vector3(-0.64, -0.30, -1.8), new Vector3(0, -0.12, -1.8)]
const CARD_RADIUS = 0.08
const VISIBLE_THRESHOLD = 0.01
const FLIP_QUATERNION = new Quaternion().setFromEuler(new Euler(0, Math.PI, 0))
const TEXT_FADE_THRESHOLD = 0.35
const TEXT_HIDE_PROGRESS = 0.98
const TEXT_FADE_SPEED = 14
const FADE_OUT_SPEED = 2.5
const WOBBLE_FREQUENCY = Math.PI * 1.75
const WOBBLE_AMPLITUDE = 0.32

const easeOutElastic = (t: number): number => {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const p = 0.5
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * 2 * Math.PI) / p) + 1
}

const easeOutBack = (t: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export default function StoriesVideo({ revealRef, layoutRef }: StoriesVideoProps) {
  const videoRef = useRef<Group | null>(null)
  const smoothedReveal = useRef(0)
  const smoothedLayout = useRef(0)
  const modelTextProgress = useRef(0)
  const textSmoothedProgress = useRef(0)
  const smoothedScaleProgress = useRef(0)
  const tempWorld = useMemo(() => new Vector3(), [])
  const localBase = useMemo(() => new Vector3(), [])
  const billboardQuat = useMemo(() => new Quaternion(), [])
  const planeGroupRef = useRef<Group | null>(null)
  const { camera } = useThree()
  const texture = useVideoTexture(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    {
      muted: true,
      loop: true,
    },
  )
  texture.flipY = true

  useFrame((_, delta) => {
    const target = MathUtils.clamp(revealRef.current, 0, 1)
    const targetIsIncreasing = target > smoothedReveal.current
    const speed = targetIsIncreasing ? 6 : FADE_OUT_SPEED
    const smoothing = 1 - Math.exp(-delta * speed)
    smoothedReveal.current += (target - smoothedReveal.current) * smoothing
    const progress = MathUtils.clamp(smoothedReveal.current, 0, 1)
    const opacityProgress = MathUtils.smoothstep(progress, 0, 1)

    const layoutTarget = MathUtils.clamp(layoutRef.current, 0, 1)
    const layoutSmoothing = 1 - Math.exp(-delta * 6)
    smoothedLayout.current += (layoutTarget - smoothedLayout.current) * layoutSmoothing
    const layoutProgress = MathUtils.clamp(smoothedLayout.current, 0, 1)

    const rawTextTarget =
      layoutProgress < TEXT_FADE_THRESHOLD
        ? MathUtils.clamp(layoutProgress / TEXT_FADE_THRESHOLD, 0, 1)
        : 1
    modelTextProgress.current = rawTextTarget

    const textSmoothing = 1 - Math.exp(-delta * TEXT_FADE_SPEED)
    textSmoothedProgress.current += (rawTextTarget - textSmoothedProgress.current) * textSmoothing

    const textHidden = textSmoothedProgress.current >= TEXT_HIDE_PROGRESS
    const targetScaleProgress = textHidden
      ? MathUtils.clamp((layoutProgress - TEXT_FADE_THRESHOLD) / (1 - TEXT_FADE_THRESHOLD), 0, 1)
      : 0
    smoothedScaleProgress.current += (targetScaleProgress - smoothedScaleProgress.current) * layoutSmoothing
    const scaleProgress = MathUtils.clamp(smoothedScaleProgress.current, 0, 1)

    const easedScale = easeOutElastic(scaleProgress)
    const easedOffset = easeOutBack(scaleProgress)
    const wobble = Math.sin(scaleProgress * WOBBLE_FREQUENCY) * WOBBLE_AMPLITUDE * (1 - scaleProgress)

    const group = videoRef.current
    if (!group) {
      return
    }

    localBase.copy(VIDEO_LOCAL_BASE[0]).lerp(VIDEO_LOCAL_BASE[1], easedOffset)
    tempWorld.copy(localBase).applyQuaternion(camera.quaternion).add(camera.position)
    group.position.copy(tempWorld)
    group.scale.setScalar(1)
    billboardQuat.copy(camera.quaternion).multiply(FLIP_QUATERNION)
    group.quaternion.copy(billboardQuat)
    const isVisible = opacityProgress > VISIBLE_THRESHOLD || target > VISIBLE_THRESHOLD
    group.visible = isVisible

    const widthScale = MathUtils.lerp(1, CARD_WIDTH[1] / CARD_WIDTH[0], easedScale)
    const heightScale = MathUtils.lerp(1, CARD_HEIGHT[1] / CARD_HEIGHT[0], easedScale)
    const planeGroup = planeGroupRef.current
    if (planeGroup) {
      planeGroup.scale.set(widthScale, heightScale, 1)
      planeGroup.rotation.set(wobble * 0.08, wobble * 0.18, wobble * 0.12)
      planeGroup.position.set(wobble * 0.18, wobble * 0.12, wobble * -0.05)
    }

    group.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        const material = child.material as MeshBasicMaterial
        material.transparent = true
        material.opacity = opacityProgress
        material.needsUpdate = true
      }
    })
  })

  return (
    <group ref={videoRef} renderOrder={30} position={[0,0,0]}>
      <group ref={planeGroupRef}>
        <RoundedVideoPlane
          width={CARD_WIDTH[0]}
          height={CARD_HEIGHT[0]}
          radius={CARD_RADIUS}
          map={texture}
          borderColor="#FF4000"
          borderSize={0.01}
          borderFeather={0.012}
        />
        <ModelText
          animationProgressRef={modelTextProgress}
          text={'A'}
          size={1.1}
          position={[-0.05, 0.05, 0]}
          scaleRange={[1, 1]}
          fadeSpeed={TEXT_FADE_SPEED}
        />
      </group>
    </group>
  )
}
