import Button, { type ButtonSize, type ButtonVariant } from '@/experience/components/atoms/Button'
import { text } from '@/experience/components/shared'
import type { ExperienceComponentProps } from '@/experience/components/types'
import { mergeProps } from '@/experience/components/mergeProps'

export default function ButtonAtom({ content, settings }: ExperienceComponentProps) {
  const props = mergeProps(content, settings)
  const variant = text(props.variant)
  const size = text(props.size)
  return <Button
    ariaLabel={text(props.accessibleLabel) || undefined}
    className={text(props.className) || undefined}
    disabled={props.disabled === true}
    href={text(props.href) || undefined}
    icon={text(props.icon) || undefined}
    iconOnly={props.iconOnly === true}
    iconPosition={props.iconPosition === 'left' ? 'left' : 'right'}
    label={text(props.text ?? props.label)}
    loading={props.loading === true}
    size={(['small', 'medium', 'large', 'sm', 'md', 'lg'].includes(size) ? size : 'medium') as ButtonSize}
    variant={(['primary', 'secondary', 'outline', 'ghost', 'danger', 'white', 'tertiary', 'light', 'dark', 'bright'].includes(variant) ? variant : 'primary') as ButtonVariant}
    width={props.fullWidth === true ? 'full' : 'auto'}
  />
}
