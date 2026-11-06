'use client'

import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { CircleHelp, Clock3 } from 'lucide-react'
import { resolveExperienceLink } from '@/experience/navigation/resolver'
import type { ExperienceSite } from '@/experience/registry/componentRegistry'
import CTAButton from '../molecules/CTAButton'
import Media from '../atoms/Media'
import { asMediaURL, readButtonCTA, text, type CTAContent } from '../shared'

type GuideTab = {
  label?: string
  heading?: string
  description?: string
  linkLabel?: string
  url?: string
  cta?: CTAContent
  image?: unknown
  imageAlt?: string
  additionalImage?: unknown
  additionalImageAlt?: string
}

const paragraphs = (value: string) => value.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
const toTabHashKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const memberPortalURL = 'https://memberportal.bestdoctorsinsurance.com/Account/Login'
const agentPortalURL = 'https://agentportal.bestdoctorsinsurance.com/Account/Login'
const authorizationTipClockURL = '/api/media/file/1f2724fb61f8a10e62a7e5da680f0a9b78ae38e9-1987x2048.webp?prefix=experience-platform%2Fmedia'
const renderMemberPortalLinks = (value: string) => value.split(/(agent or member portal|portal para agentes o asegurados|portal do agente ou do segurado|member portal|agent portal|portal para el asegurado|portal del asegurado|portal de asegurados|portal para agentes|portal do segurado|portal do agente|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi).flatMap((part, index) => {
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(part)) return <a href={`mailto:${part}`} key={`${index}-${part}`}>{part}</a>
  if (/^(agent or member portal|portal para agentes o asegurados|portal do agente ou do segurado)$/i.test(part)) {
    const labels = part.match(/^portal para /i) ? ['Agentes', 'Asegurados'] : part.match(/^portal do /i) ? ['Agente', 'Segurado'] : ['Agent', 'Member']
    return <span key={`${index}-${part}`}><a href={agentPortalURL} rel="noopener noreferrer" target="_blank">{labels[0]}</a>{part.match(/^portal para /i) ? ' o ' : ' or '}<a href={memberPortalURL} rel="noopener noreferrer" target="_blank">{labels[1]}</a>{part.match(/ portal$/i) ? ' Portal' : ''}</span>
  }
  if (/^(member portal|portal para el asegurado|portal del asegurado|portal de asegurados|portal do segurado)$/i.test(part)) return <a href={memberPortalURL} key={`${index}-${part}`} rel="noopener noreferrer" target="_blank">{part}</a>
  if (/^(agent portal|portal para agentes|portal do agente)$/i.test(part)) return <a href={agentPortalURL} key={`${index}-${part}`} rel="noopener noreferrer" target="_blank">{part}</a>
  return part
})
const emergencyHeadingPrefix = 'What should I do in a medical emergency'
const tabHeadingPrefixes: Record<string, string[]> = {
  en: [
    emergencyHeadingPrefix,
    'What coverage is provided',
    'What documentation do I need',
    'What does the policy cover',
  ],
  es: [
    '¿Qué debo hacer en caso de una emergencia médica',
    '¿Cuál es la cobertura',
    '¿Qué documentación debo presentar',
    '¿Qué cubre la póliza',
  ],
  pt: [
    'O que devo fazer em caso de uma emergência médica',
    'Qual é a cobertura fornecida',
    'Que documentação preciso apresentar',
    'O que a apólice cobre',
  ],
}
const getTabHeadingPresentation = (heading: string, index: number, locale: string) => {
  const prefix = tabHeadingPrefixes[locale.slice(0, 2).toLowerCase()]?.[index]
  return prefix && heading.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase())
    ? { prefix: heading.slice(0, prefix.length), suffix: heading.slice(prefix.length) }
    : null
}
const accidentHeadingPrefixes: Record<string, string> = {
  en: 'What coverage is provided',
  es: '¿Cuál es la cobertura',
  pt: 'Qual é a cobertura fornecida',
}
export const getAccidentHeadingPresentation = (heading: string, locale: string) => {
  const prefix = accidentHeadingPrefixes[locale.slice(0, 2).toLowerCase()]
  return prefix && heading.startsWith(prefix) ? { prefix, suffix: heading.slice(prefix.length).trim() } : null
}
const renderTabHeading = (heading: string, index: number, locale: string) => {
  const presentation = getTabHeadingPresentation(heading, index, locale)
    ?? (index === 1 ? getAccidentHeadingPresentation(heading, locale) : null)
  return presentation
    ? <><strong>{presentation.prefix}</strong><span>{presentation.suffix}</span></>
    : heading
}
const renderNotificationBannerHeading = (heading: string, index: number, locale: string) => {
  const language = locale.slice(0, 2).toLowerCase()
  if (index === 2) {
    const brand = /\s+(Best Doctors Insurance)$/i.exec(heading)
    return brand ? <>{heading.slice(0, brand.index)} <strong>{brand[1]}</strong></> : heading
  }
  if (index === 3) {
    const patterns: Record<string, RegExp> = {
      en: /3 main benefits/i,
      es: /3\s+(?:beneficios principales|principales beneficios)/i,
      pt: /3\s+principais benef[ií]cios/i,
    }
    const match = patterns[language]?.exec(heading) ?? null
    return <strong>{match?.index !== undefined ? <>{heading.slice(0, match.index)}{heading.slice(match.index, match.index + match[0].length)}{heading.slice(match.index + match[0].length)}</> : heading}</strong>
  }
  if (index === 4) {
    const comma = heading.lastIndexOf(',')
    const suffix = comma >= 0 ? heading.slice(comma + 1) : ''
    return suffix.trim() ? <>{heading.slice(0, comma + 1)}<strong>{suffix}</strong></> : heading
  }
  return <strong>{heading}</strong>
}
export const getAccidentLeadPresentation = (copy: string, locale = 'en') => {
  const match = /\b(?:over|more than|más de|mas de|mais de)\s+\d+\s+(?:hours?|horas?)\b/i.exec(copy)
  if (!match) {
    const language = locale.slice(0, 2).toLowerCase()
    const missingPortugueseDuration = language === 'pt' ? /\bexigir\s+(?=de\s+hospitaliza)/i.exec(copy) : null
    if (!missingPortugueseDuration || missingPortugueseDuration.index === undefined) return null
    return {
      context: `${copy.slice(0, missingPortugueseDuration.index).trimEnd()} exigir`,
      duration: 'mais de 24',
      unit: 'horas',
      subline: copy.slice(missingPortugueseDuration.index + 'exigir'.length).trim(),
    }
  }
  const unit = /(?:hours?|horas?)$/i.exec(match[0])?.[0]
  if (!unit) return null
  return {
    context: copy.slice(0, match.index).trim(),
    duration: match[0].slice(0, -unit.length).trim(),
    unit,
    subline: copy.slice(match.index + match[0].length).trim(),
  }
}
export const getAccidentBenefitPresentation = (copy: string, index: number, locale = 'en') => {
  const normalized = copy.replace(/\s+/g, ' ').trim()
  const separator = /\s+[—–]\s+/.exec(normalized)
  let heading = ''
  let detail = ''
  if (separator && separator.index !== undefined) {
    heading = normalized.slice(0, separator.index).trim()
    detail = normalized.slice(separator.index + separator[0].length).trim()
  } else if (index === 0) {
    const percentage = /\(?((?:\d+(?:[.,]\d+)?)%)\)?/.exec(normalized)
    if (!percentage || percentage.index === undefined) return null
    heading = normalized.slice(0, percentage.index).trim()
    detail = `${percentage[1]} ${normalized.slice(percentage.index + percentage[0].length).trim()}`.trim()
  } else if (index === 1) {
    const availabilityPatterns: Record<string, RegExp> = {
      en: /\b(?:may|can|might) be available\b/i,
      es: /\b(?:puede|podría|podra)\s+estar\s+disponible\b/i,
      pt: /\b(?:pode|poderá|podera)\s+estar\s+disponível\b/i,
    }
    const marker = availabilityPatterns[locale.slice(0, 2).toLowerCase()]?.exec(normalized)
    if (!marker || marker.index === undefined) return null
    heading = normalized.slice(0, marker.index).trim()
    detail = normalized.slice(marker.index).trim()
  } else return null

  if (index === 0) {
    const value = /^(\d+(?:[.,]\d+)?%)\s+(.+)$/.exec(detail)
    return value ? { heading, value: value[1], subtitle: '', description: value[2] } : null
  }

  const center = /\s+((?:to|a|al|ao|para)\s+(?:(?:a|an|the|un|una|um|uma)\s+)?(?:center|centro)\s+(?:of|de)\s+(?:excellence|excelencia|excelência))$/i.exec(heading)
  return {
    heading: center ? heading.slice(0, center.index).trim() : heading,
    value: '',
    subtitle: center?.[1] ?? '',
    description: detail,
  }
}
export const getDocumentStepBody = (copy: string, title: string) => {
  let body = copy.replace(/^\s*\d+[.)]\s*/, '').trim()
  const normalizedTitle = title.trim()
  for (let match = 0; match < 2 && body.toLocaleLowerCase().startsWith(normalizedTitle.toLocaleLowerCase()); match += 1) {
    body = body.slice(normalizedTitle.length).trimStart()
  }
  return body.replace(/^[\s,;:—–-]+/, '').trim()
}
type NotificationBlock =
  | { type: 'heading'; level: number; value: string }
  | { type: 'paragraph'; value: string }
  | { type: 'ordered' | 'unordered'; values: string[] }
type NotificationDeadline = { label: string; before: string; duration: string; after: string; note: string }
type NotificationDetailSection = { heading: string; kind: 'deadline' | 'penalty' | 'submission' | 'help' | 'general'; blocks: NotificationBlock[] }

const notificationHeadingPatterns: Record<string, Record<NotificationDetailSection['kind'], RegExp>> = {
  en: {
    deadline: /^when must a notification be made\?/i,
    penalty: /^what happens if you don.t notify\?/i,
    submission: /^how is a notification submitted\?/i,
    help: /^need help\?/i,
    general: /^$/,
  },
  es: {
    deadline: /^¿cuándo se debe enviar la notificación\?/i,
    penalty: /^¿qué ocurre si no lo notificas\?/i,
    submission: /^¿cómo se envía una notificación\?/i,
    help: /^¿necesitas ayuda\?/i,
    general: /^$/,
  },
  pt: {
    deadline: /^quando é necessário fazer uma notificação:?/i,
    penalty: /^o que acontece se você não notificar\?/i,
    submission: /^como enviar uma notificação\?/i,
    help: /^precisa de ajuda\?/i,
    general: /^$/,
  },
}

const notificationSectionKind = (heading: string, locale: string): NotificationDetailSection['kind'] => {
  const patterns = notificationHeadingPatterns[locale.slice(0, 2).toLowerCase()]
  if (!patterns) return 'general'
  return (Object.entries(patterns).find(([kind, pattern]) => kind !== 'general' && pattern.test(heading))?.[0] as NotificationDetailSection['kind'] | undefined) ?? 'general'
}

const normalizeNotificationHeadings = (blocks: NotificationBlock[], locale: string) => {
  const patterns = notificationHeadingPatterns[locale.slice(0, 2).toLowerCase()]
  if (!patterns) return blocks
  return blocks.flatMap<NotificationBlock>((block): NotificationBlock[] => {
    if (block.type !== 'paragraph') return [block]
    const headingPattern = Object.values(patterns).find((pattern) => pattern.test(block.value))
    if (!headingPattern) return [block]
    const match = headingPattern.exec(block.value)
    if (!match) return [block]
    const heading = match[0].trim()
    const remainder = block.value.slice(match[0].length).trim()
    return [{ type: 'heading' as const, level: 4, value: heading }, ...(remainder ? [{ type: 'paragraph' as const, value: remainder }] : [])]
  })
}

const groupNotificationDetails = (blocks: NotificationBlock[], locale: string): NotificationDetailSection[] => {
  const sections: NotificationDetailSection[] = []
  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 4) {
      sections.push({ heading: block.value, kind: notificationSectionKind(block.value, locale), blocks: [] })
    } else if (sections.length) sections[sections.length - 1].blocks.push(block)
  }
  return sections
}

const authorizationHelpPatterns: Record<string, RegExp> = {
  en: /^need help\?/i,
  es: /^¿necesitas ayuda\?/i,
  pt: /^precisa de ajuda\?/i,
}

const getAuthorizationHelpSection = (tabs: GuideTab[], locale: string) => {
  for (const tab of tabs) {
    const blocks = normalizeNotificationHeadings(parseNotificationDescription(text(tab.description)), locale)
    const help = groupNotificationDetails(blocks, locale).find((section) => section.kind === 'help')
    if (help) return help
  }
  return null
}

const removeTrailingAuthorizationHelp = (groups: Array<{ heading: Extract<NotificationBlock, { type: 'heading' }> | null; blocks: NotificationBlock[] }>, locale: string) => {
  const pattern = authorizationHelpPatterns[locale.slice(0, 2).toLowerCase()]
  if (!pattern) return groups
  let removeFollowing = false
  return groups.flatMap((group) => {
    if (removeFollowing) return []
    if (group.heading && pattern.test(group.heading.value.trim())) {
      removeFollowing = true
      return []
    }
    const helpIndex = group.blocks.findIndex((block) => block.type === 'paragraph' && pattern.test(block.value.trim()))
    if (helpIndex < 0) return [group]
    removeFollowing = true
    const blocks = group.blocks.slice(0, helpIndex)
    return blocks.length ? [{ ...group, blocks }] : []
  })
}

const getNotificationDeadlineItems = (blocks: NotificationBlock[], locale: string): NotificationDeadline[] => {
  const labels: Record<string, [string, string]> = {
    en: ['Scheduled services', 'Emergencies'],
    es: ['Servicios programados', 'Emergencias'],
    pt: ['Serviços agendados', 'Emergências'],
  }
  const localizedLabels = labels[locale.slice(0, 2).toLowerCase()]
  if (!localizedLabels) return []
  const values = blocks.flatMap((block) => block.type === 'unordered' || block.type === 'ordered' ? block.values : block.type === 'paragraph' ? [block.value] : [])
  const splitValues = values.flatMap((value) => {
    const emergencyStart = new RegExp(`\\s+(?=${localizedLabels[1]}\\s*(?::|[—–-]))`, 'i').exec(value)
    return emergencyStart?.index !== undefined ? [value.slice(0, emergencyStart.index).trim(), value.slice(emergencyStart.index).trim()] : [value]
  })
  return splitValues.flatMap((value) => {
    const match = localizedLabels.map((label) => ({ label, entry: new RegExp(`^${label.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*(?::|[—–-])\\s*(.+)$`, 'i').exec(value) })).find((candidate) => candidate.entry)
    if (!match?.entry) return []
    const { label } = match
    const content = match.entry[1].trim()
    const durationMatch = /\b\d+(?:[.,]\d+)?\s*(?:hours?|horas?)\b/i.exec(content)
    if (!durationMatch || durationMatch.index === undefined) return []
    const noteMatch = /\s*(\([^()]+\)(?:[.!?])?)\s*$/.exec(content)
    const end = noteMatch?.index ?? content.length
    return [{
      label,
      before: content.slice(0, durationMatch.index).trim(),
      duration: durationMatch[0].trim(),
      after: content.slice(durationMatch.index + durationMatch[0].length, end).trim(),
      note: noteMatch?.[1] ?? '',
    }]
  })
}

const renderNotificationPenalty = (copy: string) => {
  const match = /30\s*%\s+(?:of all|de todos los|de todas las|de todas as)\s+(?:covered expenses|gastos cubiertos|despesas cobertas)/i.exec(copy)
  if (!match || match.index === undefined) return <p>{renderMemberPortalLinks(copy)}</p>
  const lead = copy.slice(0, match.index).trim()
  const amount = match[0]
  const remainder = copy.slice(match.index + match[0].length).trim()
  const coveredMatch = /\b(?:Covered Expenses|gastos cubiertos|despesas cobertas)\b/i.exec(amount)
  const coveredLabel = coveredMatch?.[0] ?? ''
  const percentage = coveredMatch?.index === undefined ? amount : amount.slice(0, coveredMatch.index).trim()
  return <>
    {lead ? <p className="first-aid-notification__penalty-lead">{renderMemberPortalLinks(lead)}</p> : null}
    <div className="first-aid-notification__penalty-callout">
      <strong>{percentage}</strong>
      <span>{coveredLabel}</span>
      {remainder ? <p>{renderMemberPortalLinks(remainder)}</p> : null}
    </div>
  </>
}

const renderNotificationDetailSection = (section: NotificationDetailSection, index: number, locale: string, submissionImage: string) => {
  const key = `notification-section-${index}`
  const heading = renderSplitHeading(section.heading, locale, `${key}-heading`) ?? <h4 key={`${key}-heading`}>{section.heading}</h4>
  if (section.kind === 'deadline') {
    const lead = section.blocks[0]?.type === 'paragraph' ? section.blocks[0] : null
    const deadlineBlocks = lead ? section.blocks.slice(1) : section.blocks
    const deadlines = getNotificationDeadlineItems(deadlineBlocks, locale)
    return <section className="first-aid-notification__section first-aid-notification__section--deadline" key={key}>
      {heading}
      {lead ? <p className="first-aid-notification__deadline-intro">{renderMemberPortalLinks(lead.value)}</p> : null}
      {deadlines.length === 2 ? <div className="first-aid-notification__deadlines">{deadlines.map((deadline) => <article className="first-aid-notification__deadline" key={deadline.label}>
        <h5>{deadline.label}</h5>
        {deadline.before ? <p>{deadline.before}</p> : null}
        <strong><Clock3 aria-hidden="true" size={24} strokeWidth={1.8} />{deadline.duration}</strong>
        {deadline.after ? <p>{deadline.after}</p> : null}
        {deadline.note ? <p className="first-aid-notification__deadline-note">{deadline.note}</p> : null}
      </article>)}</div> : renderNotificationBlocks(section.blocks, key, locale)}
    </section>
  }
  if (section.kind === 'penalty') return <section className="first-aid-notification__section first-aid-notification__section--penalty" key={key}>
    {heading}
    {section.blocks.map((block, blockIndex) => block.type === 'paragraph'
      ? <div className="first-aid-notification__penalty-copy" key={`${key}-${blockIndex}`}>{renderNotificationPenalty(block.value)}</div>
      : renderNotificationBlocks([block], `${key}-${blockIndex}`, locale))}
  </section>
  if (section.kind === 'submission') return <section className="first-aid-notification__section first-aid-notification__section--submission" key={key}>
    {heading}
    {section.blocks[0]?.type === 'paragraph' ? <p className="first-aid-notification__submission-intro">{renderMemberPortalLinks(section.blocks[0].value)}</p> : null}
    <div className={`first-aid-notification__submission-layout${submissionImage ? ' has-art' : ''}`}>
      {submissionImage ? <Media alt="" className="first-aid-notification__submission-image" objectFit="contain" src={submissionImage} /> : null}
      <div className="first-aid-notification__submission-copy">{section.blocks.slice(section.blocks[0]?.type === 'paragraph' ? 1 : 0).map((block, blockIndex) => {
        const blockKey = `${key}-${blockIndex}`
        if (block.type === 'unordered' || block.type === 'ordered') return <ul className="first-aid-notification__requirements" key={blockKey}>{block.values.map((item, itemIndex) => <li key={`${blockKey}-${itemIndex}`}>{renderMemberPortalLinks(item)}</li>)}</ul>
        return renderNotificationBlocks([block], blockKey, locale)
      })}</div>
    </div>
  </section>
  if (section.kind === 'help') return <section className="first-aid-notification__section first-aid-notification__section--help" key={key}>
    {heading}
    <div className="first-aid-notification__help-copy">{renderNotificationBlocks(section.blocks, key, locale)}</div>
  </section>
  return <section className="first-aid-notification__section" key={key}>{heading}{renderNotificationBlocks(section.blocks, key, locale)}</section>
}

const notificationTabLabels: Record<string, string[]> = {
  en: ['Notification', 'Authorization', 'Out-of-network', 'Deductible prepayment', 'Required forms'],
  es: ['Notificación', 'Autorización', 'Fuera de la red', 'Prepago de deducible', 'Formularios requeridos'],
  pt: ['Notificação', 'Autorização', 'Fora da rede', 'Franquia pré-paga', 'Formulários necessários'],
}

const isNotificationAuthorizationTabs = (tabs: GuideTab[], locale: string) => {
  const expected = notificationTabLabels[locale.slice(0, 2).toLowerCase()]
  return Boolean(expected && tabs.length === expected.length && expected.every((label, index) => text(tabs[index]?.label).trim() === label))
}

const parseNotificationDescription = (value: string): NotificationBlock[] => {
  const blocks: NotificationBlock[] = []
  let paragraph: string[] = []
  let listType: 'ordered' | 'unordered' | null = null
  let list: string[] = []
  const finishParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', value: paragraph.join(' ').trim() })
    paragraph = []
  }
  const finishList = () => {
    if (list.length && listType) blocks.push({ type: listType, values: list })
    list = []
    listType = null
  }

  const lines = value.replace(/[\u2028\u2029]/g, ' ').split(/\r?\n/)
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    const heading = /^(#{2,4})\s+(.+)$/.exec(line.trim())
    const ordered = /^\s*\d+[.)]\s*(.+)$/.exec(line)
    const unordered = /^\s*[•–-]\s*(.+)$/.exec(line)
    if (heading) {
      finishParagraph()
      finishList()
      blocks.push({ type: 'heading', level: heading[1].length, value: heading[2].trim() })
    } else if (ordered || unordered) {
      finishParagraph()
      const nextType = ordered ? 'ordered' : 'unordered'
      if (listType && listType !== nextType) finishList()
      listType = nextType
      list.push((ordered ?? unordered)?.[1].trim() ?? '')
    } else if (!line.trim()) {
      finishParagraph()
      const nextLine = lines.slice(lineIndex + 1).find((candidate) => candidate.trim())?.trim() ?? ''
      const nextListType = /^\d+[.)]\s*/.test(nextLine) ? 'ordered' : /^[•–-]\s*/.test(nextLine) ? 'unordered' : null
      if (!listType || nextListType !== listType) finishList()
    } else {
      if (listType) finishList()
      paragraph.push(line.trim())
    }
  }
  finishParagraph()
  finishList()
  return blocks
}

const renderNotificationInline = (value: string) => value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
  const highlighted = /^\*\*(.+)\*\*$/.exec(part)
  return highlighted ? <mark key={index}>{highlighted[1]}</mark> : part
})

type SplitTone = 'cyan' | 'navy'
// Section titles that the WordPress guide paints in two tones: a lead-in plus a highlighted tail.
const splitHeadingRules: Record<string, Array<[RegExp, SplitTone]>> = {
  en: [
    [/^(It is the process)\s+(by which the insured)$/i, 'cyan'],
    [/^(When must a)\s+(notification be made\?)$/i, 'cyan'],
    [/^(What happens if)\s+(you don[’']t notify\?)$/i, 'cyan'],
    [/^(It is the Insurance)\s+(Company[’']s)$/i, 'cyan'],
    [/^(When should you request)\s+(an authorization\?)$/i, 'cyan'],
    [/^(Which services)\s+(require Authorization\?)$/i, 'cyan'],
    [/^(Additional services that must also be coordinated)\s+(by the Insurance Company:?)$/i, 'cyan'],
    [/^(How is a request for)\s+(authorization submitted\?)$/i, 'cyan'],
    [/^(How to take advantage)\s+(of this incentive\?)$/i, 'navy'],
  ],
  es: [
    [/^(Es el proceso)\s+(mediante el cual el asegurado)$/i, 'cyan'],
    [/^(¿Cuándo se)\s+(debe enviar la notificación\?)$/i, 'cyan'],
    [/^(¿Qué ocurre)\s+(si no lo notificas\?)$/i, 'cyan'],
    [/^(Es la aprobación formal)\s+(emitida por la compañía de seguros)$/i, 'cyan'],
    [/^(¿Cuándo se debe solicitar)\s+(una autorización\?)$/i, 'cyan'],
    [/^(¿Qué servicios)\s+(requieren autorización\?)$/i, 'cyan'],
    [/^(Servicios adicionales que también deben ser coordinados)\s+(por la compañía de seguros:?)$/i, 'cyan'],
    [/^(¿Cómo se envía una)\s+(solicitud para autorización\?)$/i, 'cyan'],
    [/^(¿Cómo aprovechar)\s+(este incentivo\?)$/i, 'navy'],
  ],
  pt: [
    [/^(É o processo)\s+(pelo qual o segurado)$/i, 'cyan'],
    [/^(Quando é necessário)\s+(fazer uma notificação:?)$/i, 'cyan'],
    [/^(O que acontece se você)\s+(não notificar\?)$/i, 'cyan'],
    [/^(É a aprovação formal)\s+(da companhia de seguros)$/i, 'cyan'],
    [/^(Quando você deve solicitar)\s+(uma autorização\?)$/i, 'cyan'],
    [/^(Quais serviços)\s+(requerem autorização\?)$/i, 'cyan'],
    [/^(Serviços adicionais que também devem ser coordenados)\s+(pela companhia de seguros:?)$/i, 'cyan'],
    [/^(Como enviar uma)\s+(solicitação de autorização\?)$/i, 'cyan'],
    [/^(Como se beneficiar)\s+(desse incentivo\?)$/i, 'navy'],
  ],
}
export const getSplitHeading = (value: string, locale?: string) => {
  const rules = splitHeadingRules[(locale ?? '').slice(0, 2).toLowerCase()]
  if (!rules) return null
  const normalized = value.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  for (const [pattern, tone] of rules) {
    const match = pattern.exec(normalized)
    if (match) return { prefix: match[1], highlight: match[2], tone }
  }
  return null
}
const renderSplitHeading = (value: string, locale: string | undefined, key: string, Tag: 'h2' | 'h3' | 'h4' | 'h5' = 'h4') => {
  const split = getSplitHeading(value, locale)
  if (!split) return null
  return <Tag className={`first-aid-split-heading first-aid-split-heading--${split.tone}`} key={key}><span className="first-aid-split-heading__prefix">{split.prefix}</span> <span className="first-aid-split-heading__highlight">{split.highlight}</span></Tag>
}

const splitSentences = (value: string) => value.replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/g, '$1\u0000').split('\u0000').map((part) => part.trim()).filter(Boolean)
const capitalize = (value: string) => `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}`

// "Emergency care" closing box of the Out-of-network tab: label, short copy and a highlighted statement.
const emergencyCareRule = /^(Emergency care|Atención de emergencias|Atendimento de emergência)\s*(?:—|–|:|-)\s*(.+)$/i
const emergencyStatementRules: Record<string, RegExp> = {
  en: /^(No 40% penalty)\s+(.+)$/i,
  es: /^(.*penalización del)\s+(40\s?%\.?)$/i,
  pt: /^(Não se aplica)\s+(.+)$/i,
}
export const getEmergencyCare = (value: string, locale: string) => {
  const match = emergencyCareRule.exec(value.replace(/\s+/g, ' ').trim())
  if (!match) return null
  const sentences = splitSentences(match[2])
  const statement = sentences.length > 1 ? sentences[sentences.length - 1] : ''
  const split = statement ? emergencyStatementRules[locale.slice(0, 2).toLowerCase()]?.exec(statement) : null
  return {
    heading: match[1],
    body: capitalize((statement ? sentences.slice(0, -1) : sentences).join(' ')),
    statement: statement ? { lead: split ? split[1] : statement, tail: split ? split[2] : '' } : null,
  }
}

// Deductible prepayment tab: three benefits, "how to" steps and the "keep in mind" box.
type DeductiblePresentation = {
  benefits: Array<{ title: string; body: string }>
  stepsHeading: string
  steps: string[]
  reminder: { heading: string; items: string[] } | null
}
const deductibleReminderRule = /^(Keep in mind|Recuerda|Lembre-se)\s*:?\s*([\s\S]*)$/i
export const getDeductiblePresentation = (blocks: NotificationBlock[]): DeductiblePresentation | null => {
  const list = blocks.find((block): block is Extract<NotificationBlock, { type: 'unordered' | 'ordered' }> => block.type === 'unordered' && block.values.length >= 2)
  const stepsIndex = blocks.findIndex((block) => block.type === 'ordered')
  const stepsBlock = stepsIndex >= 0 ? blocks[stepsIndex] : null
  if (!list || !stepsBlock || stepsBlock.type !== 'ordered') return null
  const benefits = list.values.map((item) => {
    const match = /^([\s\S]+?)(?:\s+[—–]\s+|:\s+)([\s\S]+)$/.exec(item.trim())
    return match ? { title: match[1].trim(), body: match[2].trim() } : { title: item.trim(), body: '' }
  })
  const heading = blocks[stepsIndex - 1]
  let reminder: DeductiblePresentation['reminder'] = null
  for (const [index, block] of blocks.entries()) {
    if (index <= stepsIndex || (block.type !== 'paragraph' && block.type !== 'heading')) continue
    const match = deductibleReminderRule.exec(block.value.trim())
    if (!match) continue
    const following = blocks[index + 1]
    const items = match[2].trim()
      ? splitSentences(match[2])
      : following?.type === 'unordered' ? following.values : following?.type === 'paragraph' ? splitSentences(following.value) : []
    reminder = { heading: match[1], items: items.map(capitalize) }
    break
  }
  return { benefits, stepsHeading: heading?.type === 'paragraph' ? heading.value : '', steps: stepsBlock.values, reminder }
}
const deductibleGlyphs = [[18, 64, 102, 16], [60, 12, 60, 68], [18, 16, 102, 64]]
const renderDeductible = (deductible: DeductiblePresentation, tab: GuideTab, locale: string) => {
  const link = tab.url && tab.linkLabel ? { url: tab.url, label: tab.linkLabel, external: /^https?:\/\//i.test(tab.url) } : null
  const anchor = (label: string) => link ? <a href={link.url} {...(link.external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>{label}</a> : <>{label}</>
  return <div className="first-aid-deductible">
    <ul className="first-aid-deductible__benefits">{deductible.benefits.map((benefit, index) => {
      const isLast = index === deductible.benefits.length - 1
      const [x1, y1, x2, y2] = deductibleGlyphs[index % deductibleGlyphs.length]
      const body = capitalize(benefit.body)
      const linkAt = link && isLast ? body.toLocaleLowerCase().indexOf(link.label.toLocaleLowerCase()) : -1
      return <li key={index}>
        <svg aria-hidden="true" className="first-aid-deductible__glyph" viewBox="0 0 120 80"><line x1={x1} x2={x2} y1={y1} y2={y2} /><circle cx={x1} cy={y1} r="5" /><circle cx={x2} cy={y2} r="5" /></svg>
        <h4>{benefit.title}</h4>
        <p>{linkAt >= 0 && link ? <>{body.slice(0, linkAt)}{anchor(body.slice(linkAt, linkAt + link.label.length))}{body.slice(linkAt + link.label.length)}</> : body}</p>
        {isLast && link && linkAt < 0 ? <p>{anchor(link.label)}</p> : null}
      </li>
    })}</ul>
    {deductible.stepsHeading ? renderSplitHeading(deductible.stepsHeading, locale, 'deductible-steps-heading') ?? <h4 className="first-aid-split-heading first-aid-split-heading--navy">{deductible.stepsHeading}</h4> : null}
    <ol className="first-aid-deductible__steps">{deductible.steps.map((step, index) => <li key={index}><span>{renderMemberPortalLinks(step)}</span></li>)}</ol>
    {deductible.reminder ? <aside className="first-aid-card first-aid-card--reminder" role="note">
      <h4 className="first-aid-card__header">{deductible.reminder.heading}</h4>
      <ul className="first-aid-card__list">{deductible.reminder.items.map((item, index) => <li key={index}>{item}</li>)}</ul>
    </aside> : null}
  </div>
}

const renderNotificationBlocks = (blocks: NotificationBlock[], keyPrefix: string, locale?: string) => blocks.map((block, index) => {
  const key = `${keyPrefix}-${index}`
  if (block.type === 'heading') {
    const Heading = block.level === 2 ? 'h2' : block.level === 3 ? 'h3' : 'h4'
    return renderSplitHeading(block.value, locale, key, Heading) ?? <Heading key={key}>{renderNotificationInline(block.value)}</Heading>
  }
  if (block.type === 'paragraph') return (block.value.length < 90 ? renderSplitHeading(block.value, locale, key) : null) ?? <p key={key}>{renderMemberPortalLinks(block.value)}</p>
  if (block.type === 'ordered') return <ol key={key}>{block.values.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}><span>{renderMemberPortalLinks(item)}</span></li>)}</ol>
  return <ul key={key}>{block.values.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderMemberPortalLinks(item)}</li>)}</ul>
})

const groupGuideBlocks = (blocks: NotificationBlock[], locale: string, panelIndex: number) => {
  const portugueseAuthorization = locale.slice(0, 2).toLowerCase() === 'pt' && panelIndex === 1 && !blocks.some((block) => block.type === 'heading')
  if (portugueseAuthorization) {
    const servicesStart = blocks.findIndex((block) => block.type === 'paragraph' && /tratamentos medicos avancados relacionados/.test(block.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()))
    const submissionStart = blocks.findIndex((block) => block.type === 'paragraph' && /^e-mail precert@/.test(block.value.toLowerCase()))
    if (servicesStart > 0 && submissionStart > servicesStart) return [
      { heading: null, blocks: blocks.slice(0, servicesStart) },
      { heading: null, blocks: blocks.slice(servicesStart, submissionStart) },
      { heading: null, blocks: blocks.slice(submissionStart) },
    ]
  }

  return blocks.reduce<Array<{ heading: Extract<NotificationBlock, { type: 'heading' }> | null; blocks: NotificationBlock[] }>>((groups, block) => {
  if (block.type === 'heading') groups.push({ heading: block, blocks: [] })
  else {
    if (!groups.length) groups.push({ heading: null, blocks: [] })
    groups[groups.length - 1].blocks.push(block)
  }
  return groups
  }, [])
}

const guideSectionKind = (heading: string, panelIndex: number, groupIndex: number) => {
  const normalized = heading.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/when should|when must|cuando se debe|quando.*notific|quando voce deve/.test(normalized)) return 'timeline'
  if (/additional services|servicios adicionales|servicos adicionais/.test(normalized)) return 'additional-services'
  if (/which services|que servicios|quais servicos/.test(normalized)) return 'services'
  if (/how is a request for authorization submitted|como se presenta una solicitud de autorizacion|como se envia una solicitud para autorizacion|como enviar uma solicitacao de autorizacao/.test(normalized)) return 'submission'
  if (/how is|how to|como se|como enviar|simply follow/.test(normalized)) return 'steps'
  if (/keep in mind|ten en cuenta|lembre-se/.test(normalized)) return 'reminder'
  if (/plans with|planes con|planos com|emergency care|atencion de emergencia|atendimento de emergencia/.test(normalized)) return 'network-note'
  if (panelIndex === 1 && groupIndex === 0) return 'timeline'
  if (panelIndex === 1 && groupIndex === 1) return 'services'
  if (panelIndex === 1 && groupIndex === 2) return 'submission'
  if (panelIndex === 2 && groupIndex === 0) return 'network-overview'
  if (panelIndex === 3 && groupIndex === 0) return 'deductible-overview'
  if (panelIndex === 4 && groupIndex === 0) return 'forms-instructions'
  return 'content'
}

const isLocalizedTip = (value: string) => /^(tip|consejo|dica)\s*:/i.test(value.trim())
export const getAuthorizationIntroPresentation = (copy: string, locale: string) => {
  const language = locale.slice(0, 2).toLowerCase()
  if (language === 'en') {
    const match = /^(It is the Insurance\s+)(Company(?:['’]s))\s+(formal approval confirming that a specific medical service or treatment is covered under the policy)\.?\s*(.*)$/i.exec(copy.trim())
    return match ? { prefix: match[1], highlight: match[2], subtitle: match[3], description: match[4] } : null
  }
  if (language === 'es') {
    const match = /^(Es la aprobación formal)\s+(emitida por la compañía de seguros)\s+(que confirma que un servicio médico o tratamiento específico está cubierto por la póliza)\.?\s*(.*)$/i.exec(copy.trim())
    return match ? { prefix: match[1], highlight: match[2], subtitle: match[3], description: match[4] } : null
  }
  if (language === 'pt') {
    const match = /^(É a aprovação formal)\s+(da companhia de seguros)\s+(confirmando que um serviço ou tratamento médico específico está coberto pela apólice)\.?\s*(.*)$/i.exec(copy.trim())
    return match ? { prefix: match[1], highlight: match[2], subtitle: match[3], description: match[4] } : null
  }
  return null
}
export const getAuthorizationHeadingPresentation = (heading: string, locale: string) => {
  const language = locale.slice(0, 2).toLowerCase()
  const normalizedHeading = heading.trim().replace(/\s+/g, ' ')
  const matches: RegExp[] = language === 'en' ? [
    /^(When should you request\s+)(an authorization\?)$/i,
    /^(How is a request for\s+)(authorization submitted\?)$/i,
    /^(Additional services that must also be\s+)(coordinated by the Insurance Company:)$/i,
  ] : language === 'es' ? [
    /^(¿Cuándo se debe solicitar\s+)(una autorización\?)$/i,
    /^(¿Qué servicios\s+)(requieren autorización\?)$/i,
    /^(¿Cómo se envía una solicitud para\s+)(autorización\?)$/i,
  ] : []
  for (const pattern of matches) {
    const match = pattern.exec(normalizedHeading)
    if (match) return { prefix: match[1], highlight: match[2] }
  }
  return null
}
const getAuthorizationServicesPresentation = (blocks: NotificationBlock[]) => {
  const list = blocks.find((block): block is Extract<NotificationBlock, { type: 'ordered' | 'unordered' }> => block.type === 'unordered')
  const subtitleBlock = blocks.find((block): block is Extract<NotificationBlock, { type: 'paragraph' }> => block.type === 'paragraph')
  const advancedIndex = list?.values.findIndex((value) => /^Advanced medical treatments related to:/i.test(value)) ?? -1
  if (!list || advancedIndex < 3) return null
  const advancedMatch = /^Advanced medical treatments related to:\s*(.+)$/i.exec(list.values[advancedIndex])
  if (!advancedMatch) return null
  const advancedServices = advancedMatch[1].replace(/[.]$/, '').split(/,\s*/).map((value) => `${value.charAt(0).toUpperCase()}${value.slice(1)}.`)
  return {
    subtitle: subtitleBlock?.value.replace(/^When/i, 'when').replace(/:$/, '') ?? '',
    primaryServices: list.values.slice(0, advancedIndex),
    advancedServices: [...advancedServices, ...list.values.slice(advancedIndex + 1)],
    remaining: blocks.filter((block) => block !== list && block !== subtitleBlock),
  }
}
const getSpanishAuthorizationServicesPresentation = (blocks: NotificationBlock[], locale: string) => {
  if (locale.slice(0, 2).toLowerCase() !== 'es') return null
  const list = blocks.find((block): block is Extract<NotificationBlock, { type: 'ordered' | 'unordered' }> => block.type === 'unordered')
  const advancedIndex = list?.values.findIndex((value) => /^Tratamientos médicos avanzados relacionados con:/i.test(value)) ?? -1
  if (!list || advancedIndex < 3) return null
  const advancedEntry = list.values[advancedIndex]
  const separator = advancedEntry.indexOf(':')
  if (separator < 0) return null
  const advancedServices = advancedEntry.slice(separator + 1).trim().split(/,\s+/).filter(Boolean)
  const subtitle = blocks.find((block): block is Extract<NotificationBlock, { type: 'paragraph' }> => block.type === 'paragraph')
  return {
    subtitle: subtitle?.value.replace(/[.:]$/, '').replace(/^\((.*)\)$/, '$1') ?? '',
    primaryServices: list.values.slice(0, advancedIndex),
    advancedHeading: advancedEntry.slice(0, separator + 1),
    advancedServices: [...advancedServices, ...list.values.slice(advancedIndex + 1)],
    remaining: blocks.filter((block) => block !== list && block !== subtitle),
  }
}
const getSpanishAuthorizationAdditionalServices = (blocks: NotificationBlock[], locale: string) => {
  if (locale.slice(0, 2).toLowerCase() !== 'es') return null
  const paragraph = blocks.find((block): block is Extract<NotificationBlock, { type: 'paragraph' }> => block.type === 'paragraph' && /^Servicios adicionales que también deben ser coordinados por la compañía de seguros:/i.test(block.value))
  if (!paragraph) return null
  const separator = paragraph.value.indexOf(':')
  const services = paragraph.value.slice(separator + 1).trim().split(/,\s+/).filter(Boolean)
  return services.length ? { block: paragraph, heading: paragraph.value.slice(0, separator), services } : null
}
type NetworkOverviewPresentation = {
  heading: string
  headline: string
  subtitle: string
  beforeShare: NotificationBlock[]
  share: { lead: string; value: string; label: string } | null
  afterShare: NotificationBlock[]
}
type NetworkPlanSection = {
  heading: string
  reminder: string
  portalCopy: string
  sourceGroupIndex: number
  sourceBlock: NotificationBlock | null
  additionalBlocks: NotificationBlock[]
}
const networkPlans = [
  { name: 'Global Care', slug: 'global-care', logo: 'Vector-17.svg', image: '40851b0b303f4281a2a0d808ef795feee638311f-2-scaled-1.webp', linked: true },
  { name: 'Medical Care', slug: 'medical-care', logo: 'Vector-18.svg', image: '17-Desktop-Isurance-product-BDI-PROStandard-31-scaled-1.webp', linked: true },
  { name: 'Medical Select', slug: 'medical-select', logo: 'Vector-19.svg', image: '17-Desktop-Isurance-product-BDI-PROStandard-34-scaled-1.webp', linked: true },
  { name: 'Premiere Plus', slug: 'premiere-plus', logo: 'Vector-16.svg', image: 'Imagen-1-e1775858774312.webp', linked: true },
  { name: 'Ultimate Care', slug: 'ultimate-care', logo: 'Vector-21.svg', image: 'Imagen-e1775858618451.webp', linked: false },
]
const networkPlanHeadingPatterns: Record<string, RegExp> = {
  en: /plans with hospital restrictions/i,
  es: /planes con restricciones hospitalarias/i,
  pt: /planos com restricoes hospitalares/i,
}
const networkReminderPatterns: Record<string, RegExp> = {
  en: /important reminder\s*:\s*/i,
  es: /nota importante\s*:\s*/i,
  pt: /lembrete importante\s*:\s*/i,
}
const networkPortalCopyPatterns: Record<string, RegExp> = {
  en: /You can easily find the list of participating hospitals in the Member Portal\.?/i,
  es: /También puedes consultar fácilmente la lista de hospitales adheridos en el Portal de Asegurados\.?/i,
  pt: /Você pode encontrar facilmente a lista de hospitais participantes no Portal do Segurado\.?/i,
}
const normalizeNetworkCopy = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const hasNetworkPlanCopy = (value: string, locale: string) => {
  const language = locale.slice(0, 2).toLowerCase()
  return Boolean(networkPlanHeadingPatterns[language]?.test(normalizeNetworkCopy(value)) || networkReminderPatterns[language]?.test(normalizeNetworkCopy(value)))
}
const getNetworkPlanSection = (groups: Array<{ heading: Extract<NotificationBlock, { type: 'heading' }> | null; blocks: NotificationBlock[] }>, locale: string): NetworkPlanSection | null => {
  const language = locale.slice(0, 2).toLowerCase()
  const headingPattern = networkPlanHeadingPatterns[language]
  const reminderPattern = networkReminderPatterns[language]
  if (!headingPattern || !reminderPattern) return null
  for (const [groupIndex, group] of groups.entries()) {
    const headingText = group.heading?.value ?? ''
    const sourceBlock = group.blocks.find((block) => block.type === 'paragraph' && hasNetworkPlanCopy(block.value, locale)) ?? null
    const headingMatch = headingPattern.exec(headingText) ?? (sourceBlock?.type === 'paragraph' ? headingPattern.exec(sourceBlock.value) : null)
    const reminderMatch = sourceBlock?.type === 'paragraph' ? reminderPattern.exec(sourceBlock.value) : null
    if (!headingMatch && !reminderMatch) continue
    const reminderText = reminderMatch && sourceBlock?.type === 'paragraph'
      ? sourceBlock.value.slice(reminderMatch.index + reminderMatch[0].length).trim()
      : ''
    const portalCopyMatch = networkPortalCopyPatterns[language].exec(reminderText)
    const portalCopy = portalCopyMatch?.[0] ?? ''
    const reminder = portalCopy
      ? reminderText.replace(portalCopy, '').replace(/\s{2,}/g, ' ').trim()
      : reminderText
    const heading = headingMatch?.[0] ?? (language === 'es' ? 'Planes con restricciones hospitalarias' : language === 'pt' ? 'Planos com restrições hospitalares' : 'Plans with hospital restrictions')
    return {
      heading,
      reminder,
      portalCopy,
      sourceGroupIndex: groupIndex,
      sourceBlock,
      additionalBlocks: groupIndex === 0 ? [] : group.blocks.filter((block) => block !== sourceBlock),
    }
  }
  return null
}
const networkPlanHref = (slug: string, locale: string, site?: ExperienceSite) => {
  if (!site) return null
  if (site.localizedRoutes) return resolveExperienceLink({ page: { slug }, locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes }).href
  const path = site.slug === 'ppga' ? `/${slug}?locale=${locale}` : `/${locale}/${slug}`
  return resolveExperienceLink({ url: path, locale, fallbackSite: site.slug }).href
}
const networkOverviewPatterns: Record<string, { heading?: RegExp; subtitle: RegExp; share: RegExp }> = {
  en: {
    heading: /^(What you need to know):\s*/i,
    subtitle: /^To ensure\b/i,
    share: /(Using a non-participating hospital may result in a)\s+(40\s*%)\s*(cost share)(\.?)/i,
  },
  es: {
    heading: /^(Lo que debes saber):\s*/i,
    subtitle: /^Para asegurarte\b/i,
    share: /(Usar un hospital no adherido puede implicar un)\s+(40\s*%)\s*(de costos compartidos)(\.?)/i,
  },
  pt: {
    heading: /^(Informações essenciais):\s*/i,
    subtitle: /^Para garantir\b/i,
    share: /(Utilizar um hospital não participante pode resultar em)\s+(compartilhamento de custos)\s+de\s+(40\s*%)(\.?)/i,
  },
}
const takeNetworkSentence = (value: string) => {
  const match = /^([\s\S]+?[.!?])(?:\s+|$)([\s\S]*)$/.exec(value.trim())
  return match ? { sentence: match[1], remainder: match[2].trim() } : { sentence: value.trim(), remainder: '' }
}
export const getNetworkOverviewPresentation = (blocks: NotificationBlock[], locale: string): NetworkOverviewPresentation | null => {
  const language = locale.slice(0, 2).toLowerCase()
  const patterns = networkOverviewPatterns[language]
  if (!patterns) return null
  let heading = ''
  let headline = ''
  let subtitle = ''
  const introIndex = blocks.findIndex((block) => block.type === 'paragraph')
  let introCopy = introIndex >= 0 && blocks[introIndex].type === 'paragraph' ? blocks[introIndex].value : ''
  const headingMatch = patterns.heading?.exec(introCopy)
  if (headingMatch) {
    heading = headingMatch[1]
    const introSentence = takeNetworkSentence(introCopy.slice(headingMatch[0].length))
    headline = introSentence.sentence
    introCopy = introSentence.remainder
  }
  if (patterns.subtitle.test(introCopy)) {
    const subtitleSentence = takeNetworkSentence(introCopy)
    subtitle = subtitleSentence.sentence
    introCopy = subtitleSentence.remainder
  }

  const preparedBlocks = blocks.map((block, index) => index === introIndex && block.type === 'paragraph' ? { ...block, value: introCopy } : block)
    .filter((block) => block.type !== 'paragraph' || Boolean(block.value.trim()))
  const beforeShare: NotificationBlock[] = []
  const afterShare: NotificationBlock[] = []
  let share: NetworkOverviewPresentation['share'] = null
  for (const block of preparedBlocks) {
    if (!share && block.type === 'paragraph') {
      const match = patterns.share.exec(block.value)
      if (match && match.index !== undefined) {
        const before = block.value.slice(0, match.index).trim()
        const after = block.value.slice(match.index + match[0].length).trim()
        if (before) beforeShare.push({ ...block, value: before })
        share = language === 'pt'
          ? { lead: `${match[1]} ${match[2]} de`, value: match[3], label: match[4] ?? '' }
          : { lead: match[1], value: match[2], label: `${match[3]}${match[4] ?? ''}` }
        if (after) afterShare.push({ ...block, value: after })
        continue
      }
      beforeShare.push(block)
      continue
    }
    if (share) afterShare.push(block)
    else beforeShare.push(block)
  }
  return { heading, headline, subtitle, beforeShare: share ? beforeShare : preparedBlocks, share, afterShare }
}
export const getAuthorizationTipPresentation = (copy: string) => {
  const duration = /(\d+(?:[-–]\d+)?\s+(?:business\s+days?|días?\s+hábiles|dias?\s+úteis))/i.exec(copy)
  if (!duration || duration.index === undefined) return null
  const durationParts = /^(\d+(?:[-–]\d+)?)\s+(.+)$/i.exec(duration[0])
  if (!durationParts) return null
  const prefix = copy.slice(0, duration.index)
  const label = /^(tip|consejo|dica)\s*:\s*/i.exec(prefix)
  return {
    label: label?.[1] ?? '',
    before: prefix.slice(label?.[0].length ?? 0).trim(),
    value: durationParts[1],
    unit: durationParts[2],
    after: copy.slice(duration.index + duration[0].length).trim(),
  }
}

function NotificationAuthorizationPanel({ active, index, id, locale, site, submissionImage, tab }: { active: number; index: number; id: string; locale: string; site?: ExperienceSite; submissionImage: string; tab: GuideTab }) {
  const parsedBlocks = parseNotificationDescription(text(tab.description))
  const isNotification = index === 0
  const blocks = isNotification ? normalizeNotificationHeadings(parsedBlocks, locale) : parsedBlocks
  const processHeadingIndex = blocks.findIndex((block) => block.type === 'heading' && block.level === 2)
  const subtitleIndex = blocks.findIndex((block, blockIndex) => blockIndex > processHeadingIndex && block.type === 'heading' && block.level === 3)
  const processEndIndex = blocks.findIndex((block, blockIndex) => blockIndex > subtitleIndex && block.type === 'heading' && block.level === 4)
  const processHeading = processHeadingIndex >= 0 ? blocks[processHeadingIndex] : null
  const processSubtitle = subtitleIndex >= 0 ? blocks[subtitleIndex] : null
  const processCopy = blocks.filter((_, blockIndex) => blockIndex > subtitleIndex && (processEndIndex < 0 || blockIndex < processEndIndex) && blocks[blockIndex].type !== 'ordered')
  const steps = blocks.find((block, blockIndex) => blockIndex > subtitleIndex && block.type === 'ordered' && (processEndIndex < 0 || blockIndex < processEndIndex))
  const details = processEndIndex < 0 ? [] : blocks.slice(processEndIndex)
  const detailSections = groupNotificationDetails(details, locale)
  const visibleDetailSections = isNotification ? detailSections.filter((section) => section.kind !== 'help') : detailSections
  const submissionArtwork = asMediaURL(tab.additionalImage) || submissionImage
  const image = asMediaURL(tab.image)
  const isAuthorization = index === 1
  const isEnglishAuthorization = isAuthorization && locale.slice(0, 2).toLowerCase() === 'en'
  const panelVariant = ['notification', 'authorization', 'network', 'deductible', 'forms'][index] ?? 'guide'
  const remainingBlocks = isNotification ? blocks.filter((_, blockIndex) => blockIndex !== processHeadingIndex) : blocks
  const guideGroups = groupGuideBlocks(remainingBlocks, locale, index)
  const visiblePanelGuideGroups = index === 4 ? removeTrailingAuthorizationHelp(guideGroups, locale) : guideGroups
  const hasSpanishAuthorizationServices = isAuthorization && guideGroups.some((group, groupIndex) => guideSectionKind(group.heading?.value ?? '', index, groupIndex) === 'services' && getSpanishAuthorizationServicesPresentation(group.blocks, locale))
  const authorizationIntroGroup = isAuthorization && !guideGroups[0]?.blocks.some((block) => block.type === 'ordered' || block.type === 'unordered') ? guideGroups[0] : null
  const authorizationIntroParagraph = authorizationIntroGroup?.blocks.find((block) => block.type === 'paragraph')
  const authorizationIntro = authorizationIntroParagraph?.type === 'paragraph' ? getAuthorizationIntroPresentation(authorizationIntroParagraph.value, locale) : null
  const authorizationIntroRemainder = authorizationIntro ? authorizationIntroGroup?.blocks.filter((block) => block !== authorizationIntroParagraph) ?? [] : authorizationIntroGroup?.blocks ?? []
  const panelId = `${id}-panel-${index}`
  const isNetwork = index === 2
  const isDeductible = index === 3
  const isForms = index === 4
  const networkPlanSection = isNetwork ? getNetworkPlanSection(guideGroups, locale) : null
  const emergencyBlock = isNetwork ? guideGroups.flatMap((group) => group.blocks).find((block) => block.type === 'paragraph' && emergencyCareRule.test(block.value.replace(/\s+/g, ' ').trim())) : undefined
  const emergencyCare = emergencyBlock?.type === 'paragraph' ? getEmergencyCare(emergencyBlock.value, locale) : null
  const deductible = isDeductible ? getDeductiblePresentation(remainingBlocks) : null
  const groupsToRender = deductible ? [] : visiblePanelGuideGroups
  // Governed button: the tab's `cta` group, else its legacy link text + URL (portal/mailto links stay inline text).
  const tabCTA = readButtonCTA(tab as Record<string, unknown>, { label: 'linkLabel' }, { variant: 'primary', showIcon: false, linkType: 'external' })
  const legacyInlineLink = !tab.cta && /^mailto:|portal\.bestdoctorsinsurance\.com/i.test(tab.url ?? '')
  const action = tabCTA && !legacyInlineLink && !deductible ? <div className="first-aid-notification-tab-content__actions"><CTAButton cta={tabCTA} locale={locale} site={site} size="md" /></div> : null

  return (
    <div aria-labelledby={`${id}-tab-${index}`} className={`first-aid-guide-tabs__panel first-aid-guide-tabs__panel--notification first-aid-guide-tabs__panel--${panelVariant}${isNotification ? ' is-notification' : ''}`} hidden={active !== index} id={panelId} role="tabpanel" tabIndex={0}>
      {isNotification ? <>
        <section className="rich-section rich-section--first-aid-notification-banner">
          <div className="section-container"><div className="rich-content-box">
            {image ? <Media alt={text(tab.imageAlt)} className="rich-content__media" objectFit="contain" src={image} /> : null}
            <h2>{renderNotificationBannerHeading(text(tab.heading), index, locale)}</h2>
          </div></div>
        </section>
        <section className="rich-section rich-section--first-aid-notification-process">
          <div className="section-container"><div className="rich-content-box">
            {processHeading?.type === 'heading' ? renderSplitHeading(processHeading.value, locale, 'process-heading', 'h2') ?? <h2>{renderNotificationInline(processHeading.value)}</h2> : null}
            {processSubtitle?.type === 'heading' ? <h3>{renderNotificationInline(processSubtitle.value)}</h3> : null}
            {renderNotificationBlocks(processCopy, 'notification-intro', locale)}
            {steps?.type === 'ordered' ? <ol aria-label="Motivos para notificar" className="first-aid-notification-process__steps">{steps.values.map((step, stepIndex) => <li key={stepIndex}><span>{renderMemberPortalLinks(step)}</span></li>)}</ol> : null}
            <div className="first-aid-notification__details">{visibleDetailSections.map((section, sectionIndex) => renderNotificationDetailSection(section, sectionIndex, locale, section.kind === 'submission' ? submissionArtwork : ''))}</div>
            {action}
          </div></div>
        </section>
      </> : <section className={`section first-aid-notification-tab-content first-aid-notification-tab-content--${panelVariant}${isEnglishAuthorization ? ' first-aid-notification-tab-content--authorization-source' : hasSpanishAuthorizationServices ? ' first-aid-notification-tab-content--authorization-services-source' : ''}`}>
        <div className="section-container">
          {isAuthorization ? <>
            <div className="first-aid-notification-tab-content__authorization-banner first-aid-notification-tab-content__page-banner">
              {image ? <Media alt={text(tab.imageAlt)} className="first-aid-notification-tab-content__authorization-image first-aid-notification-tab-content__page-banner-image" objectFit="contain" src={image} /> : null}
              <h2>{renderNotificationBannerHeading(text(tab.heading), index, locale)}</h2>
            </div>
            {authorizationIntroGroup ? <div className="first-aid-notification-tab-content__authorization-overview">
              {authorizationIntro ? <>
                {authorizationIntro.highlight
                  ? <h2 className="first-aid-split-heading first-aid-split-heading--cyan first-aid-split-heading--stacked"><span className="first-aid-split-heading__prefix">{authorizationIntro.prefix.trim()}</span> <span className="first-aid-split-heading__highlight">{authorizationIntro.highlight}</span></h2>
                  : <h2>{authorizationIntro.prefix}</h2>}
                <h3>{authorizationIntro.subtitle}</h3>
                {authorizationIntro.description ? <p>{renderMemberPortalLinks(authorizationIntro.description)}</p> : null}
                {renderNotificationBlocks(authorizationIntroRemainder, 'authorization-overview-copy', locale)}
              </> : <>
                {authorizationIntroGroup.heading ? renderNotificationBlocks([authorizationIntroGroup.heading], 'authorization-overview-heading', locale) : null}
                {renderNotificationBlocks(authorizationIntroGroup.blocks, 'authorization-overview-copy', locale)}
              </>}
            </div> : null}
          </> : isNetwork ? <header className="first-aid-guide-tabs__banner first-aid-guide-tabs__network-banner first-aid-notification-tab-content__page-banner">
            {image ? <Media alt={text(tab.imageAlt)} className="first-aid-guide-tabs__icon first-aid-notification-tab-content__page-banner-image" objectFit="contain" src={image} /> : <span aria-hidden="true" className="first-aid-guide-tabs__network-icon"><CircleHelp size={48} strokeWidth={2.2} /></span>}
            <h3>{renderNotificationBannerHeading(text(tab.heading), index, locale)}</h3>
          </header> : isDeductible || isForms ? <header className="first-aid-notification-tab-content__page-banner">
            {image ? <Media alt={text(tab.imageAlt)} className="first-aid-notification-tab-content__page-banner-image" objectFit="contain" src={image} /> : null}
            <h2>{renderNotificationBannerHeading(text(tab.heading), index, locale)}</h2>
          </header> : null}
          <div className="first-aid-notification-tab-content__groups">
            {deductible ? renderDeductible(deductible, tab, locale) : null}
            {groupsToRender.map((group, groupIndex) => {
              if (group === authorizationIntroGroup) return null
              if (isNetwork && networkPlanSection?.sourceGroupIndex === groupIndex && groupIndex !== 0) return null
              const heading = group.heading?.value ?? ''
              const authorizationHeading = isAuthorization ? getSplitHeading(heading, locale) : null
              const tipBlocks = isAuthorization ? group.blocks.filter((block) => block.type === 'paragraph' && isLocalizedTip(block.value)) : []
              const bodyBlocks = tipBlocks.length ? group.blocks.filter((block) => !tipBlocks.includes(block)) : group.blocks
              const tip = tipBlocks[0]?.type === 'paragraph' ? getAuthorizationTipPresentation(tipBlocks[0].value) : null
              const authorizationServices = isEnglishAuthorization && guideSectionKind(heading, index, groupIndex) === 'services' ? getAuthorizationServicesPresentation(bodyBlocks) : null
              const spanishAuthorizationServices = isAuthorization && guideSectionKind(heading, index, groupIndex) === 'services' ? getSpanishAuthorizationServicesPresentation(bodyBlocks, locale) : null
              const spanishAdditionalServices = isAuthorization ? getSpanishAuthorizationAdditionalServices(bodyBlocks, locale) : null
              const networkOverview = isNetwork && groupIndex === 0 ? getNetworkOverviewPresentation(bodyBlocks, locale) : null
              const networkAfterShare = networkOverview?.afterShare.filter((block) => block !== emergencyBlock && (block.type !== 'paragraph' || !hasNetworkPlanCopy(block.value, locale))) ?? []
              const headlineSplit = networkOverview?.headline ? /([–—,])\s*/.exec(networkOverview.headline) : null
              const highlightedHeadline = headlineSplit?.index !== undefined ? networkOverview?.headline.slice(0, headlineSplit.index + headlineSplit[0].length) : networkOverview?.headline
              const remainingHeadline = headlineSplit?.index !== undefined ? networkOverview?.headline.slice(headlineSplit.index + headlineSplit[0].length) : ''
              const section = <section className={`first-aid-notification-tab-content__group first-aid-notification-tab-content__group--${guideSectionKind(heading, index, groupIndex)}`} key={groupIndex}>
                {networkOverview ? <div className="first-aid-guide-tabs__network-content">
                  {networkOverview.heading ? <h2 className="first-aid-guide-tabs__network-title">{networkOverview.heading}</h2> : null}
                  {networkOverview.headline ? <h3 className="first-aid-guide-tabs__network-headline"><mark>{highlightedHeadline}</mark>{remainingHeadline}</h3> : null}
                  {networkOverview.subtitle ? <h3 className="first-aid-guide-tabs__network-subtitle">{networkOverview.subtitle}</h3> : null}
                  {renderNotificationBlocks(networkOverview.beforeShare, `network-before-${groupIndex}`, locale)}
                  {networkOverview.share ? <div className="first-aid-guide-tabs__network-cost-share">
                    <p>{networkOverview.share.lead}</p>
                    <div className="first-aid-guide-tabs__network-cost-share-value"><strong>{networkOverview.share.value}</strong><span>{networkOverview.share.label}</span></div>
                  </div> : null}
                  <div className="first-aid-guide-tabs__network-coordination">{renderNotificationBlocks(networkAfterShare, `network-after-${groupIndex}`, locale)}</div>
                </div> : authorizationHeading ? renderSplitHeading(heading, locale, `authorization-heading-${groupIndex}`) : group.heading ? renderNotificationBlocks([group.heading], `notification-tab-${index}-heading-${groupIndex}`, locale) : null}
                {networkOverview ? null : authorizationServices || spanishAuthorizationServices ? <>
                  {(authorizationServices?.subtitle || spanishAuthorizationServices?.subtitle) ? <p className="first-aid-notification-tab-content__authorization-services-subtitle">({authorizationServices?.subtitle || spanishAuthorizationServices?.subtitle})</p> : null}
                  <div className="first-aid-notification-tab-content__authorization-services-layout">
                    <ul className="first-aid-notification-tab-content__authorization-services-primary">{(authorizationServices?.primaryServices ?? spanishAuthorizationServices?.primaryServices ?? []).map((service, serviceIndex) => <li key={serviceIndex}>{service}</li>)}</ul>
                    <div className="first-aid-notification-tab-content__authorization-services-advanced">
                      <h5 className="first-aid-notification-tab-content__authorization-services-advanced-heading"><span aria-hidden="true" />{authorizationServices ? 'Advanced medical treatments related to:' : spanishAuthorizationServices?.advancedHeading}</h5>
                      <ul className="first-aid-notification-tab-content__authorization-services-detail-list">{(authorizationServices?.advancedServices ?? spanishAuthorizationServices?.advancedServices ?? []).map((service, serviceIndex) => <li key={serviceIndex}>{service}</li>)}</ul>
                    </div>
                  </div>
                  {renderNotificationBlocks((authorizationServices?.remaining ?? spanishAuthorizationServices?.remaining ?? []).filter((block) => block !== spanishAdditionalServices?.block), `notification-tab-${index}-group-${groupIndex}`, locale)}
                  {spanishAdditionalServices ? <div className="first-aid-notification-tab-content__authorization-additional-services">
                    {renderSplitHeading(spanishAdditionalServices.heading, locale, 'additional-services-heading', 'h5') ?? <h5>{spanishAdditionalServices.heading}</h5>}
                    <ul>{spanishAdditionalServices.services.map((service, serviceIndex) => <li key={serviceIndex}>{service}</li>)}</ul>
                  </div> : null}
                </> : spanishAdditionalServices ? <>
                  {renderNotificationBlocks(bodyBlocks.filter((block) => block !== spanishAdditionalServices.block), `notification-tab-${index}-group-${groupIndex}`, locale)}
                  <div className="first-aid-notification-tab-content__authorization-additional-services">
                    {renderSplitHeading(spanishAdditionalServices.heading, locale, 'additional-services-heading', 'h5') ?? <h5>{spanishAdditionalServices.heading}</h5>}
                    <ul>{spanishAdditionalServices.services.map((service, serviceIndex) => <li key={serviceIndex}>{service}</li>)}</ul>
                  </div>
                </> : renderNotificationBlocks(bodyBlocks, `notification-tab-${index}-group-${groupIndex}`, locale)}
              </section>
              return tipBlocks.length ? <Fragment key={`tip-${groupIndex}`}>{section}<aside className="first-aid-notification-tab-content__tip" role="note">
                {tip ? <>
                  <strong className="first-aid-notification-tab-content__tip-label">{tip.label}</strong>
                  <div className="first-aid-notification-tab-content__tip-content">
                    {tip.before ? <p className="first-aid-notification-tab-content__tip-intro">{tip.before}</p> : null}
                    <div className="first-aid-notification-tab-content__tip-timing">
                      <Media alt="" className="first-aid-notification-tab-content__tip-clock" objectFit="contain" src={authorizationTipClockURL} />
                      <div className="first-aid-notification-tab-content__tip-duration"><strong>{tip.value}</strong><span>{tip.unit}</span></div>
                    </div>
                    {tip.after ? <p className="first-aid-notification-tab-content__tip-after">{tip.after}</p> : null}
                  </div>
                </> : renderNotificationBlocks(tipBlocks, `notification-tab-${index}-tip-${groupIndex}`, locale)}
              </aside></Fragment> : section
            })}
            {networkPlanSection ? <section aria-label={networkPlanSection.heading} className="first-aid-guide-tabs__network-restrictions">
              <h3 className="first-aid-guide-tabs__network-restrictions-heading">{(() => {
                const split = /^(Plans with|Planes con|Planos com)\s+(.+)$/i.exec(networkPlanSection.heading)
                return split ? <><span className="first-aid-split-heading__prefix">{split[1]}</span> <span className="first-aid-split-heading__highlight">{split[2]}</span></> : networkPlanSection.heading
              })()}</h3>
              <div className="first-aid-guide-tabs__network-plans">{networkPlans.map((plan) => {
                const logo = `/api/media/file/${plan.logo}?prefix=experience-platform%2Fmedia`
                const photo = `/api/media/file/${plan.image}?prefix=experience-platform%2Fmedia`
                const image = <Media alt="" className="first-aid-guide-tabs__network-plan-logo" objectFit="contain" src={logo} />
                const href = plan.linked ? networkPlanHref(plan.slug, locale, site) : null
                const style = { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.05) 24%,rgba(0,0,0,.62) 100%),url("${photo}")` }
                return href ? <a aria-label={plan.name} className="first-aid-guide-tabs__network-plan" href={href} key={plan.slug} style={style}>{image}</a>
                  : <div aria-label={plan.name} className="first-aid-guide-tabs__network-plan" key={plan.slug} role="img" style={style}>{image}</div>
              })}</div>
              {networkPlanSection.reminder ? <aside className="first-aid-guide-tabs__network-reminder" role="note">
                <h4>{locale.slice(0, 2).toLowerCase() === 'es' ? 'Nota importante' : locale.slice(0, 2).toLowerCase() === 'pt' ? 'Lembrete importante' : 'Important reminder'}</h4>
                <p>{renderMemberPortalLinks(capitalize(networkPlanSection.reminder))}</p>
              </aside> : null}
              {networkPlanSection.portalCopy || networkPlanSection.additionalBlocks.length ? <div className="first-aid-guide-tabs__network-reminder-copy">
                {networkPlanSection.portalCopy ? <p>{renderMemberPortalLinks(networkPlanSection.portalCopy)}</p> : null}
                {networkPlanSection.additionalBlocks.length ? renderNotificationBlocks(networkPlanSection.additionalBlocks, 'network-reminder-copy', locale) : null}
              </div> : null}
            </section> : null}
            {emergencyCare ? <section className="first-aid-card first-aid-card--emergency">
              <h4 className="first-aid-card__header">{emergencyCare.heading}</h4>
              <div className="first-aid-card__body">
                {emergencyCare.body ? <p>{emergencyCare.body}</p> : null}
                {emergencyCare.statement ? <p className="first-aid-card__statement"><span>{emergencyCare.statement.lead}</span>{emergencyCare.statement.tail ? <> <span>{emergencyCare.statement.tail}</span></> : null}</p> : null}
              </div>
            </section> : null}
          </div>
          {action}
          {image && !isAuthorization && !isNetwork && !isDeductible && !isForms ? <Media alt={text(tab.imageAlt)} className="first-aid-notification-tab-content__image" objectFit="contain" src={image} /> : null}
        </div>
      </section>}
    </div>
  )
}

const getEmergencyStepPresentation = (copy: string, index: number, locale: string) => {
  const patterns: Record<string, Array<{ prefix: string; highlight: string }>> = {
    en: [
      { prefix: 'Seek immediate ', highlight: 'medical attention' },
      { prefix: 'Within ', highlight: 'forty-eight (48) hours,' },
      { prefix: 'If it’s confirmed that ', highlight: 'the situation qualifies' },
    ],
    es: [
      { prefix: 'Busca atención ', highlight: 'médica de inmediato' },
      { prefix: 'Notifica dentro de ', highlight: 'cuarenta y ocho (48) horas' },
      { prefix: 'Si se confirma que ', highlight: 'la situación califica' },
    ],
    pt: [
      { prefix: 'Procure atendimento ', highlight: 'médico imediato' },
      { prefix: 'Dentro de ', highlight: 'quarenta e oito (48) horas' },
      { prefix: 'Se for confirmado que ', highlight: 'a situação se qualifica' },
    ],
  }
  const pattern = patterns[locale.slice(0, 2).toLowerCase()]?.[index]
  if (!pattern || !copy.toLocaleLowerCase().startsWith(pattern.prefix.toLocaleLowerCase())) return null
  const highlightStart = copy.toLocaleLowerCase().indexOf(pattern.highlight.toLocaleLowerCase())
  if (highlightStart < pattern.prefix.length) return null

  let body = copy.slice(highlightStart + pattern.highlight.length).replace(/^[\s—–:;,.-]+/, '')
  let note = ''
  if (index === 1) {
    const noteStarts: Record<string, string> = {
      en: 'If an authorization is required for the emergency,',
      es: 'Si se requiere autorización para la emergencia,',
      pt: 'Se for necessária uma autorização para a emergência,',
    }
    const noteStart = body.toLocaleLowerCase().indexOf(noteStarts[locale.slice(0, 2).toLowerCase()]?.toLocaleLowerCase() ?? '\u0000')
    if (noteStart >= 0) {
      note = body.slice(noteStart)
      body = body.slice(0, noteStart).trimEnd()
    }
  }

  return { prefix: copy.slice(0, highlightStart), highlight: pattern.highlight, body, note }
}

const repatriationStepStarts: Record<string, string[]> = {
  en: ['This benefit is reimbursed', 'Service requires'],
  es: ['Este beneficio se reembolsa', 'El servicio está sujeto a precertificación.'],
  pt: ['Esse benefício será reembolsado', 'O serviço exige certificação prévia.'],
}
export const getRepatriationSteps = (copy: string, locale: string) => {
  const steps = paragraphs(copy)
  const markers = repatriationStepStarts[locale.slice(0, 2).toLowerCase()] ?? []
  for (const marker of markers) {
    const stepIndex = steps.findIndex((step) => step.indexOf(marker) > 0)
    if (stepIndex < 0) continue
    const splitAt = steps[stepIndex].indexOf(marker)
    steps.splice(stepIndex, 1, steps[stepIndex].slice(0, splitAt).trim(), steps[stepIndex].slice(splitAt).trim())
  }
  return steps
}
const repatriationHighlights: Record<string, string[]> = {
  en: ['It covers the costs for transfer, coordination', 'required documentation.', 'precertification.'],
  es: ['Cubre los gastos de traslado, coordinación y gestión', 'documentación requerida', 'precertificación.'],
  pt: ['Cobre os custos de transferência, coordenação egestão', 'documentação necessária.', 'certificação prévia.'],
}
const renderRepatriationCopy = (copy: string, highlight: string) => {
  const renderEmail = (value: string, keyPrefix: string) => value.split(/(precert@bestdoctorsinsurance\.com)/gi).map((part, index) => part.toLowerCase() === 'precert@bestdoctorsinsurance.com'
    ? <a href={`mailto:${part}`} key={`${keyPrefix}-${index}`}>{part}</a>
    : part)
  const highlightStart = copy.indexOf(highlight)
  if (highlightStart < 0) return renderEmail(copy, 'copy')
  return <>{renderEmail(copy.slice(0, highlightStart), 'before')}<strong>{highlight}</strong>{renderEmail(copy.slice(highlightStart + highlight.length), 'after')}</>
}

export default function FirstAidGuideTabs({ tabs, locale, site }: { tabs: GuideTab[]; locale: string; site?: ExperienceSite }) {
  const [active, setActive] = useState(0)
  const id = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const current = tabs[active]
  const description = text(current?.description)
  const stepStart = description.search(/^\s*\d+[.)]\s/m)
  const prefix = stepStart > 0 ? description.slice(0, stepStart).trim() : ''
  const numberedSteps = (stepStart >= 0 ? description.slice(stepStart) : '').split(/(?=^\s*\d+[.)]\s)/m).map((part) => part.trim()).filter(Boolean)
  const repatriationSteps = numberedSteps.length ? numberedSteps.map((step) => step.replace(/^\s*\d+[.)]\s*/, '')) : getRepatriationSteps(description, locale)
  const documentSteps = numberedSteps.length ? numberedSteps : paragraphs(description)
  const isNumbered = numberedSteps.length > 0
  const additionalImage = asMediaURL(current?.additionalImage)
  const notificationAuthorization = isNotificationAuthorizationTabs(tabs, locale)
  const persistentHelp = notificationAuthorization ? getAuthorizationHelpSection(tabs, locale) : null
  const spanishTabHashes = locale.slice(0, 2).toLowerCase() === 'es'
  const stableTabHashes = notificationAuthorization
    ? spanishTabHashes
      ? ['notificacion', 'autorizacion', 'fuera-de-la-red', 'prepago-del-deducible', 'formularios-requeridos']
      : ['notification', 'authorization', 'out-of-network', 'deductible-prepayment', 'required-forms']
    : tabs.length === 4
      ? spanishTabHashes
        ? ['emergencia-internacional', 'cobertura-por-accidente', 'documentacion-requerida', 'repatriacion']
        : ['international-emergency', 'accident-coverage', 'required-documents', 'repatriation']
      : tabs.map((tab, index) => toTabHashKey(text(tab.label) || text(tab.heading)) || `tab-${index + 1}`)
  const legacyTabHashes = notificationAuthorization
    ? ['notification', 'authorization', 'out-of-network', 'deductible-prepayment', 'required-forms']
    : ['international-emergency', 'accident-coverage', 'required-documents', 'repatriation']
  const tabHashSignature = stableTabHashes.join('|')
  const selectTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length
    setActive(next)
    if (typeof window !== 'undefined') {
      const nextHash = `#${stableTabHashes[next]}`
      if (window.location.hash !== nextHash) window.history.pushState(null, '', nextHash)
    }
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextByKey: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }
    if (!(event.key in nextByKey) || tabs.length === 0) return
    event.preventDefault()
    const next = (nextByKey[event.key] + tabs.length) % tabs.length
    selectTab(next)
    tabRefs.current[next]?.focus()
  }
  useEffect(() => {
    const syncTabFromHash = () => {
      const key = decodeURIComponent(window.location.hash.slice(1))
      const index = tabHashSignature.split('|').indexOf(key) >= 0
        ? tabHashSignature.split('|').indexOf(key)
        : legacyTabHashes.indexOf(key)
      if (index >= 0) setActive(index)
      else if (!key) setActive(0)
    }
    syncTabFromHash()
    window.addEventListener('hashchange', syncTabFromHash)
    window.addEventListener('popstate', syncTabFromHash)
    return () => {
      window.removeEventListener('hashchange', syncTabFromHash)
      window.removeEventListener('popstate', syncTabFromHash)
    }
  }, [tabHashSignature])
  if (!tabs.length) return null
  const panelType = notificationAuthorization ? 'guide' : ['emergency', 'accident', 'documents', 'repatriation'][active] ?? 'guide'
  const accidentLead = panelType === 'accident' ? getAccidentLeadPresentation(prefix, locale) : null
  const documentStepTitles: Record<string, string[]> = {
    en: ['Your health', 'Once stable', 'To activate', 'To request', 'If the service'],
    es: ['Tu salud', 'Una vez estabilizado', 'Para activar/solicitar', 'Si el servicio se gestiona por reembolso'],
    pt: ['Sua saúde', 'Após estabilizar', 'Para ativar', 'Para solicitar', 'Se houver reembolso'],
  }

  return (
    <section className="section first-aid-guide-tabs-section">
      <div className="section-container first-aid-guide-tabs">
        <div aria-label={notificationAuthorization ? (locale === 'es' ? 'Secciones de notificación y autorización médica' : locale === 'pt' ? 'Seções de notificação e autorização médica' : 'Medical notification and authorization sections') : locale === 'es' ? 'Secciones de la guía First Aid Kit' : locale === 'pt' ? 'Seções do guia First Aid Kit' : 'First Aid Kit guide sections'} className="first-aid-guide-tabs__list" role="tablist">
          {tabs.map((tab, index) => <button
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            className={`first-aid-guide-tabs__tab${active === index ? ' is-active' : ''}`}
            id={`${id}-tab-${index}`}
            data-tab-hash={`#${stableTabHashes[index]}`}
            key={index}
            onClick={() => selectTab(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            ref={(element) => { tabRefs.current[index] = element }}
            role="tab"
            tabIndex={active === index ? 0 : -1}
            type="button"
          >{text(tab.label)}</button>)}
        </div>
        {tabs.map((tab, index) => notificationAuthorization
          ? <NotificationAuthorizationPanel active={active} id={id} index={index} key={index} locale={locale} site={site} submissionImage={asMediaURL(tabs[1]?.image)} tab={tab} />
          : <div
          aria-labelledby={`${id}-tab-${index}`}
          hidden={active !== index}
          id={`${id}-panel-${index}`}
          key={index}
          role="tabpanel"
          tabIndex={0}
        >
          <header className={`first-aid-guide-tabs__banner${index === 3 ? ' first-aid-guide-tabs__banner--repatriation' : ''}`}>
            {asMediaURL(tab.image) ? <Media alt={text(tab.imageAlt)} className="first-aid-guide-tabs__icon" objectFit="contain" src={asMediaURL(tab.image)} /> : null}
            <h3>{renderTabHeading(text(tab.heading), index, locale)}</h3>
          </header>
          <div className={`first-aid-guide-tabs__body first-aid-guide-tabs__body--${panelType}${(isNumbered || (panelType === 'documents' && documentSteps.length > 0)) && active === index ? ' has-steps' : ''}`}>
            {active === index && panelType === 'accident' ? <>
              {prefix ? accidentLead ? <div className="first-aid-guide-tabs__accident-intro">
                <h2 className="first-aid-guide-tabs__lead">{accidentLead.context}</h2>
                <div className="first-aid-guide-tabs__duration-card">
                  <h3><span>{accidentLead.duration}</span> <span className="first-aid-guide-tabs__step-highlight">{accidentLead.unit}</span></h3>
                  <p>{accidentLead.subline}</p>
                </div>
              </div> : <h2 className="first-aid-guide-tabs__lead">{prefix}</h2> : null}
              {additionalImage ? <Media alt={text(tab.additionalImageAlt)} className="first-aid-guide-tabs__timeline-art" objectFit="contain" src={additionalImage} /> : null}
              <div className="first-aid-guide-tabs__benefits">{numberedSteps.map((step, stepIndex) => {
                const copy = step.replace(/^\s*\d+[.)]\s*/, '')
                const benefit = getAccidentBenefitPresentation(copy, stepIndex, locale)
                return <article className="first-aid-guide-tabs__benefit" key={stepIndex}>
                  <span className="first-aid-guide-tabs__step-number">{stepIndex + 1}</span>
                  {benefit ? <div className="first-aid-guide-tabs__benefit-content">
                    <h3 className="first-aid-guide-tabs__benefit-title">{benefit.heading}</h3>
                    {benefit.value ? <p className="first-aid-guide-tabs__benefit-value">{benefit.value}</p> : null}
                    {benefit.subtitle ? <p className="first-aid-guide-tabs__benefit-subtitle">{benefit.subtitle}</p> : null}
                    <p className="first-aid-guide-tabs__benefit-description">{benefit.description}</p>
                  </div> : paragraphs(copy).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                </article>
              })}</div>
            </> : panelType === 'documents' && active === index ? <ol className="first-aid-guide-tabs__documents-steps">{documentSteps.map((step, stepIndex) => {
              const copy = step.replace(/^\s*\d+[.)]\s*/, '')
              const title = documentStepTitles[locale.slice(0, 2).toLowerCase()]?.[stepIndex] ?? `Step ${stepIndex + 1}`
              const body = getDocumentStepBody(copy, title)
              return <li className="first-aid-guide-tabs__document-step" key={stepIndex}>
                <span aria-hidden="true" className="first-aid-guide-tabs__step-number">{stepIndex + 1}</span>
                <div className="first-aid-guide-tabs__document-step-content">
                  <h4>{title}</h4>
                  {paragraphs(body).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                </div>
              </li>
            })}</ol> : panelType === 'repatriation' && active === index ? <div className="first-aid-guide-tabs__repatriation">
              {additionalImage ? <Media alt={text(tab.additionalImageAlt)} className="first-aid-guide-tabs__illustration" objectFit="contain" src={additionalImage} /> : null}
              <ul className="first-aid-guide-tabs__repatriation-steps">{repatriationSteps.map((paragraph, stepIndex) => <li className="first-aid-guide-tabs__repatriation-step" key={stepIndex}>
                <span aria-hidden="true" className="first-aid-guide-tabs__repatriation-marker" />
                <p>{renderRepatriationCopy(paragraph, repatriationHighlights[locale.slice(0, 2).toLowerCase()]?.[stepIndex] ?? '')}</p>
              </li>)}</ul>
            </div> : isNumbered && active === index
              ? <>{prefix ? paragraphs(prefix).map((paragraph, paragraphIndex) => <p key={`intro-${paragraphIndex}`}>{paragraph}</p>) : null}{numberedSteps.map((step, stepIndex) => {
                const copy = step.replace(/^\s*\d+[.)]\s*/, '')
                const emergencyStep = panelType === 'emergency' ? getEmergencyStepPresentation(copy, stepIndex, locale) : null
                const [lead, ...rest] = copy.split(/\s+[—–:]\s+/, 2)
                return <article className="first-aid-guide-tabs__step" key={stepIndex}>
                  <span aria-hidden="true" className="first-aid-guide-tabs__step-number">{stepIndex + 1}</span>
                  <div>{emergencyStep ? <><h4 className="first-aid-guide-tabs__step-heading"><span>{emergencyStep.prefix}</span><span className="first-aid-guide-tabs__step-highlight">{emergencyStep.highlight}</span></h4><p>{renderMemberPortalLinks(emergencyStep.body)}</p>{emergencyStep.note ? <p className="first-aid-guide-tabs__step-note">{emergencyStep.note}</p> : null}</> : <>{active === 2 ? <h4>{documentStepTitles[locale]?.[stepIndex] ?? `Step ${stepIndex + 1}`}</h4> : null}{rest.length ? <><h4>{lead}</h4><p>{panelType === 'emergency' ? renderMemberPortalLinks(rest.join(' — ')) : rest.join(' — ')}</p></> : paragraphs(copy).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{panelType === 'emergency' ? renderMemberPortalLinks(paragraph) : paragraph}</p>)}</>}</div>
                </article>
              })}</>
              : paragraphs(text(tab.description)).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
          </div>
          {active === index && additionalImage && panelType !== 'accident' && panelType !== 'repatriation' ? <Media alt={text(tab.additionalImageAlt)} className="first-aid-guide-tabs__illustration" objectFit="contain" src={additionalImage} /> : null}
        </div>)}
      </div>
      {persistentHelp ? <div className="first-aid-guide-tabs__persistent-help">{renderNotificationDetailSection(persistentHelp, 0, locale, '')}</div> : null}
    </section>
  )
}
