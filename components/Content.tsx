import type { MutableRefObject } from 'react'
import HeroFooterText from './taskListViews/HeroFooterText'
import SliderTextContent from './taskListViews/SliderTextContent'

type ContentPageProps = {
  logoVisibilityRef: MutableRefObject<number>
  sliderRevealRef: MutableRefObject<number>
  sliderActiveRef: MutableRefObject<number>
  glowRevealRef: MutableRefObject<number>
}

export default function ContentPage({
  logoVisibilityRef,
  sliderRevealRef,
  sliderActiveRef,
  glowRevealRef,
}: ContentPageProps) {
  return (
    <div className="contentTaksList">
      <HeroFooterText logoVisibilityRef={logoVisibilityRef} glowRevealRef={glowRevealRef} />
      <SliderTextContent sliderRevealRef={sliderRevealRef} sliderActiveRef={sliderActiveRef} />
    </div>
  )
}
