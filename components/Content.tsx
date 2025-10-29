import type { MutableRefObject } from 'react'
import HeroFooterText from './taskListViews/HeroFooterText'
import SliderTextContent from './taskListViews/SliderTextContent'

type ContentPageProps = {
  logoVisibilityRef: MutableRefObject<number>
  sliderRevealRef: MutableRefObject<number>
  sliderActiveRef: MutableRefObject<number>
}

export default function ContentPage({
  logoVisibilityRef,
  sliderRevealRef,
  sliderActiveRef,
}: ContentPageProps) {
  return (
    <div className="contentTaksList">
      <HeroFooterText logoVisibilityRef={logoVisibilityRef} />
      <SliderTextContent sliderRevealRef={sliderRevealRef} sliderActiveRef={sliderActiveRef} />
    </div>
  )
}
