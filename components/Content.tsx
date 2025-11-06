import type { MutableRefObject } from 'react'
import HeroFooterText from './taskListViews/HeroFooterText'
import SliderTextContent from './taskListViews/SliderTextContent'
import StoriesSection from './taskListViews/StoriesSection'
import VisionSection from './taskListViews/VisionSection'
import { ContentPageProps } from '@/types/types'

export default function ContentPage({
  logoVisibilityRef,
  sliderRevealRef,
  sliderActiveRef,
  glowRevealRef,
  storiesVideoRevealRef,
  storiesVideoLayoutRef,
  modelTextProgressRef,
  visionGridProgressRef,
  visionModelTextProgressRef,
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
      <VisionSection
        storiesVideoRevealRef={storiesVideoRevealRef}
        storiesVideoLayoutRef={storiesVideoLayoutRef}
        modelTextProgressRef={modelTextProgressRef}
        visionGridProgressRef={visionGridProgressRef}
        visionModelTextProgressRef={visionModelTextProgressRef}
      />
      
    </div>
  )
}
