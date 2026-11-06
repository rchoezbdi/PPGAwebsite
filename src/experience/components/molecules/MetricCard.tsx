import Counter from '../atoms/Counter'
import Text from '../atoms/Text'

export default function MetricCard({ animate = true, decimals = 0, description, label, prefix, suffix, value }: {
  animate?: boolean
  decimals?: number
  description?: string
  label?: string
  prefix?: string
  suffix?: string
  value?: number
}) {
  if (typeof value !== 'number') return null
  return (
    <article className="metric-card">
      <strong className="metric-card__value"><Counter animate={animate} decimals={decimals} prefix={prefix} suffix={suffix} value={value} /></strong>
      {label ? <span className="metric-card__label">{label}</span> : null}
      <Text size="sm" tone="muted">{description}</Text>
    </article>
  )
}
