import type { MouseEventHandler } from 'react'

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
