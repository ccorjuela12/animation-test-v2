import { memo, useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { PlayReelProps } from '@/types/types'

type MarqueeStyle = CSSProperties & {
  ['--marquee-duration']?: string
  ['--marquee-start']?: string
}

function PlayReelBase({
  text,
  numberIcons,
  repeat,
  className,
  isLooping = false,
  marqueeSpeed = 24,
  direction = 'left',
  onMouseEnter,
  onMouseLeave,
}: PlayReelProps) {
  const segments = useMemo(() => Array.from({ length: repeat }), [repeat])
  const icons = useMemo(() => Array.from({ length: numberIcons }), [numberIcons])

  const containerClass = [
    'relative flex overflow-hidden',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const baseTrackClass = 'flex w-full shrink-0 items-center justify-between gap-6 px-8'
  const animationClass = isLooping
    ? direction === 'right'
      ? 'animate-marquee-right'
      : 'animate-marquee-left'
    : ''
  const trackClassName = animationClass ? `${baseTrackClass} ${animationClass}` : baseTrackClass

  const primaryStyle: MarqueeStyle | undefined = isLooping
    ? {
        '--marquee-duration': `${marqueeSpeed}s`,
        '--marquee-start': '0%',
      }
    : undefined

  const duplicateStyle: MarqueeStyle | undefined = isLooping
    ? {
        '--marquee-duration': `${marqueeSpeed}s`,
        '--marquee-start': direction === 'right' ? '-100%' : '100%',
      }
    : undefined

  const renderTrack = (keyPrefix: string, style?: MarqueeStyle) => (
    <div className={trackClassName} style={style} key={keyPrefix}>
      {segments.map((_, repeatIdx) => (
        <div className="flex items-center gap-4" key={`${keyPrefix}-repeat-${repeatIdx}`}>
          <p className="whitespace-nowrap text-sm uppercase tracking-[0.35em]">{text}</p>
          <div className="flex gap-2">
            {icons.map((_, iconIdx) => (
              <svg
                key={`${keyPrefix}-icon-${repeatIdx}-${iconIdx}`}
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="13"
                viewBox="0 0 11 13"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M10.1887 5.0002C10.9937 5.46499 10.9937 6.62697 10.1887 7.09176L1.81122 11.9285C1.00618 12.3933 -0.000118857 11.8123 -0.000118817 10.8827L-0.000118394 1.20926C-0.000118353 0.279682 1.00618 -0.301307 1.81122 0.163483L10.1887 5.0002Z"
                  fill="white"
                />
              </svg>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className={containerClass} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {renderTrack('primary', primaryStyle)}
      {isLooping && renderTrack('duplicate', duplicateStyle)}
    </div>
  )
}

export default memo(PlayReelBase)
