import Icon from '../atoms/Icon'

export type LanguageOption = { active?: boolean; code: string; href: string; label: string }

const flagForLocale = (code: string) => ({ en: 'us', es: 'es', pt: 'br' }[code.toLowerCase()] ?? code.toLowerCase())

export default function LanguageSelector({ languages }: { languages?: LanguageOption[] | null }) {
  const items = languages ?? []
  if (!items.length) return null
  const current = items.find((item) => item.active) ?? items[0]
  return (
    <details className="experience-language-selector">
      <summary aria-label={current.code === 'es' ? 'Cambiar idioma' : current.code === 'pt' ? 'Alterar idioma' : 'Change language'}>
        <img alt="" height={16} src={`/flags/4x3/${flagForLocale(current.code)}.svg`} width={24} />
        <span>{current.code.toUpperCase()}</span>
        <Icon ariaHidden name="chevron-down" size={16} />
      </summary>
      <ul>
        {items.map((item) => <li key={item.code}><a aria-current={item.active ? 'page' : undefined} href={item.href}>
          <img alt="" height={16} src={`/flags/4x3/${flagForLocale(item.code)}.svg`} width={24} />
          <span>{item.label}</span>
        </a></li>)}
      </ul>
    </details>
  )
}
