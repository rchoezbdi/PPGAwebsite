import React from 'react'
import { designTextColor, text } from '@/experience/components/shared'
import type { ExperienceComponentProps } from '@/experience/components/types'
import { mergeProps } from '@/experience/components/mergeProps'

export default function TextAtom({ content, settings }: ExperienceComponentProps) {
  const props = mergeProps(content, settings)
  const tag = ['p', 'span', 'div'].includes(text(props.semanticTag)) ? text(props.semanticTag) : 'p'
  const color = designTextColor(props.colorToken)
  const style: React.CSSProperties = {
    ...(color ? { color } : {}),
    ...(text(props.align) ? { textAlign: text(props.align) as React.CSSProperties['textAlign'] } : {}),
    ...(Number(props.maxLines) > 0 ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: Number(props.maxLines), overflow: 'hidden' } : {}),
  }
  return React.createElement(tag, { className: 'experience-text-atom', style }, text(props.text))
}
