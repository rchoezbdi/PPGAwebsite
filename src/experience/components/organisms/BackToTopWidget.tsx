import BackToTopRuntime from '@/experience/runtime/BackToTopRuntime'
import type { ExperienceComponentProps } from '@/experience/components/types'

export default function BackToTopWidgetComponent({ content, settings }: ExperienceComponentProps) {
  return <BackToTopRuntime content={content} settings={settings} />
}
