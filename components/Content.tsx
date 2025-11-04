import type { MutableRefObject } from 'react'
import HeroFooterText from './taskListViews/HeroFooterText'
import SliderTextContent from './taskListViews/SliderTextContent'
import StoriesSection from './taskListViews/StoriesSection'

type ContentPageProps = {
  logoVisibilityRef: MutableRefObject<number>
  sliderRevealRef: MutableRefObject<number>
  sliderActiveRef: MutableRefObject<number>
  glowRevealRef: MutableRefObject<number>
  storiesVideoRevealRef: MutableRefObject<number>
  storiesVideoLayoutRef: MutableRefObject<number>
  modelTextProgressRef: MutableRefObject<number>
}

export default function ContentPage({
  logoVisibilityRef,
  sliderRevealRef,
  sliderActiveRef,
  glowRevealRef,
  storiesVideoRevealRef,
  storiesVideoLayoutRef,
  modelTextProgressRef,
}: ContentPageProps) {
  return (
    <div className="contentTaksList">
      <HeroFooterText logoVisibilityRef={logoVisibilityRef} glowRevealRef={glowRevealRef} />
      <SliderTextContent sliderRevealRef={sliderRevealRef} sliderActiveRef={sliderActiveRef} />
      <StoriesSection
        modelTextProgressRef={modelTextProgressRef}
        storiesVideoRevealRef={storiesVideoRevealRef}
        storiesVideoLayoutRef={storiesVideoLayoutRef}
      />
      
    </div>
  )
}
