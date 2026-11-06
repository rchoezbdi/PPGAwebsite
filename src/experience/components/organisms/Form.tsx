'use client'

import Script from 'next/script'
import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react'
import Button, { type ButtonVariant } from '../atoms/Button'
import ContentModal from '../molecules/ContentModal'
import Icon from '../atoms/Icon'
import SearchableListField from '../molecules/SearchableListField'
import { text } from '../shared'
import { findProfanity } from '../../forms/profanityFilter'
import { findLink } from '../../forms/linkFilter'
import { findMarkup } from '../../forms/markupFilter'
import { findSqlInjection } from '../../forms/sqlInjectionFilter'
import { findDisallowedCharacters } from '../../forms/specialCharacterFilter'
import { FALLBACK_CITIES, FALLBACK_COUNTRIES, fetchCities, fetchCountries } from '../../forms/countryCityData'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type FieldDef = {
  fullWidth?: boolean
  label?: string
  name?: string
  options?: string
  placeholder?: string
  required?: boolean
  type?: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const PROFANITY_TEXT: Record<string, string> = {
  es: 'Revisa este campo: contiene lenguaje que no podemos aceptar.',
  en: 'Please review this field: it contains language we can’t accept.',
  pt: 'Revise este campo: contém linguagem que não podemos aceitar.',
}
// Generic enough to cover any of the three inline field checks below (profanity, link/URL, SQL
// injection shape) — the message just points at whatever field got the red outline, same as the
// per-field text (PROFANITY_TEXT/LINK_TEXT/SQL_TEXT) already does.
const FIELD_ERROR_SUBMIT_TEXT: Record<string, string> = {
  es: 'Revisa los campos marcados en rojo antes de continuar.',
  en: 'Please fix the fields marked in red before continuing.',
  pt: 'Revise os campos marcados em vermelho antes de continuar.',
}
const TURNSTILE_REQUIRED_TEXT: Record<string, string> = {
  es: 'Confirma que no eres un robot antes de enviar.',
  en: 'Please confirm you’re not a robot before submitting.',
  pt: 'Confirme que você não é um robô antes de enviar.',
}
const LINK_TEXT: Record<string, string> = {
  es: 'No se permiten enlaces ni direcciones web en este campo.',
  en: 'Links and web addresses aren’t allowed in this field.',
  pt: 'Não são permitidos links ou endereços web neste campo.',
}
const MARKUP_TEXT: Record<string, string> = {
  es: 'No se permiten etiquetas HTML ni código en este campo.',
  en: 'HTML tags or code aren’t allowed in this field.',
  pt: 'Não são permitidas tags HTML ou código neste campo.',
}
const SQL_TEXT: Record<string, string> = {
  es: 'Este campo contiene caracteres que no podemos aceptar.',
  en: 'This field contains characters we can’t accept.',
  pt: 'Este campo contém caracteres que não podemos aceitar.',
}
const CHARACTER_TEXT: Record<string, string> = {
  es: 'Este campo contiene símbolos no permitidos. Usa letras, números y puntuación básica.',
  en: 'This field contains unsupported symbols. Use letters, numbers, and basic punctuation.',
  pt: 'Este campo contém símbolos não permitidos. Use letras, números e pontuação básica.',
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, params: { sitekey: string; callback?: (token: string) => void }) => string
      getResponse: (widgetId?: string) => string
      reset: (widgetId?: string) => void
    }
  }
}

/** Explicit render (not Turnstile's auto-render-on-script-load) because this Form can mount well
 * after the Turnstile script already finished loading — inside a ContentModal opened later by a
 * click, auto-render would never see the widget's container div. Polls briefly for
 * `window.turnstile` to be ready since the <Script> tag and this component can settle in either
 * order. Replaces the earlier reCAPTCHA v2 integration (23 sep, explicit product decision — one
 * human-verification widget per form, not two). */
function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false
    let timer: number | undefined
    const tryRender = () => {
      if (cancelled || widgetId.current !== undefined) return
      const container = containerRef.current
      if (window.turnstile?.render && container) {
        widgetId.current = window.turnstile.render(container, { sitekey: siteKey })
        return
      }
      timer = window.setTimeout(tryRender, 200)
    }
    tryRender()
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [siteKey])

  const getToken = (): string => (widgetId.current !== undefined ? window.turnstile?.getResponse(widgetId.current) ?? '' : '')
  const reset = () => { if (widgetId.current !== undefined) window.turnstile?.reset(widgetId.current) }
  return { containerRef, enabled: Boolean(siteKey), getToken, reset }
}

/** The heading/description/fields/submit markup, shared by the normal inline render and the
 * modal one below — only the wrapper around it (a <section> vs a portaled dialog) differs. */
function FormBody({ instanceId, locale, p }: { instanceId?: string | number; locale: string; p: Record<string, unknown> }) {
  const rawFields = (Array.isArray(p.fields) ? p.fields : []) as FieldDef[]
  const isMessageForm = rawFields.some((field) => text(field.name).toLowerCase() === 'message')
  const fields = rawFields.map((field) => {
    const name = text(field.name).toLowerCase()
    const requiredByDefault = name === 'name' || name === 'email' || (isMessageForm && (name === 'country' || name === 'city'))
    return { ...field, required: Boolean(field.required || requiredByDefault), type: name === 'country' ? 'country' : name === 'city' ? 'city' : field.type }
  })
  const layout = text(p.layout) === 'two-column' ? 'two-column' : 'stacked'
  const columns = Number(p.columns ?? 2)
  const buttonVariant: ButtonVariant = ['primary', 'secondary', 'outline'].includes(text(p.buttonVariant))
    ? text(p.buttonVariant) as ButtonVariant
    : 'primary'
  const copy = locale in PROFANITY_TEXT ? locale : 'en'
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const turnstile = useTurnstile()
  const hasCountryField = fields.some((field) => text(field.type) === 'country')
  const [countryOptions, setCountryOptions] = useState<string[]>(FALLBACK_COUNTRIES)
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState('')

  // Public API first, the fixed fallback list stays in place (already the initial state) if it
  // fails — see countryCityData.ts for why this exact endpoint/shape.
  useEffect(() => {
    if (!hasCountryField) return
    let cancelled = false
    fetchCountries().then((names) => { if (!cancelled) setCountryOptions(names) }).catch(() => {})
    return () => { cancelled = true }
  }, [hasCountryField])

  const validateField = (name: string, value: string, fieldType?: string) => {
    const message = findMarkup(value)
      ? MARKUP_TEXT[copy]
      : findDisallowedCharacters(value, fieldType, name)
        ? CHARACTER_TEXT[copy]
      : findProfanity(value)
        ? PROFANITY_TEXT[copy]
        // Email is its own field type/validator — skip the link check on it (same reasoning as
        // the server-side check in forms/submit/route.ts, which excludes type:'email' too).
        : fieldType !== 'email' && findLink(value)
          ? LINK_TEXT[copy]
          : findSqlInjection(value)
            ? SQL_TEXT[copy]
            : null
    setFieldErrors((previous) => {
      if (!message) {
        if (!(name in previous)) return previous
        const next = { ...previous }
        delete next[name]
        return next
      }
      return { ...previous, [name]: message }
    })
    return !message
  }

  const onFieldBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget
    const fieldType = fields.find((f) => text(f.name) === name)?.type
    if (name) validateField(name, value, fieldType)
  }

  const onFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget
    const fieldType = fields.find((field) => text(field.name) === name)?.type
    if (name) validateField(name, value, fieldType)
  }

  // Country is chosen (or typed) first — the City field's suggestion list depends on it, fetched
  // fresh per country rather than loading every country's cities up front.
  const onCountryBlur = (event: FocusEvent<HTMLInputElement>) => {
    onFieldBlur(event)
    const country = event.currentTarget.value
    setSelectedCountry(country)
    if (!country) { setCityOptions([]); return }
    fetchCities(country)
      .then(setCityOptions)
      .catch(() => setCityOptions(FALLBACK_CITIES[country] ?? []))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!instanceId) return
    setErrorMessage('')

    const formElement = event.currentTarget
    let hasFieldError = false
    for (const field of fields) {
      const name = text(field.name)
      if (!name) continue
      const element = formElement.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null
      if (!element || !('value' in element)) continue
      if (!validateField(name, element.value, field.type)) hasFieldError = true
    }
    if (hasFieldError) {
      setStatus('error')
      setErrorMessage(FIELD_ERROR_SUBMIT_TEXT[copy])
      return
    }

    const formData = new FormData(formElement)
    if (turnstile.enabled) {
      const token = turnstile.getToken()
      if (!token) {
        setStatus('error')
        setErrorMessage(TURNSTILE_REQUIRED_TEXT[copy])
        return
      }
      formData.set('cf-turnstile-response', token)
    }

    setStatus('submitting')
    formData.set('instanceId', String(instanceId))
    try {
      const response = await fetch('/api/dxp/forms/submit', { method: 'POST', body: formData })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'No fue posible enviar el formulario.')
      setStatus('success')
      formElement.reset()
      turnstile.reset()
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible enviar el formulario.')
      turnstile.reset()
    }
  }

  if (status === 'success' && text(p.successAction) !== 'redirect') {
    return <p className="form-success" role="status">{text(p.successMessage) || 'Gracias, recibimos tu mensaje. Te contactaremos pronto.'}</p>
  }

  return (
    <>
      {turnstile.enabled ? <Script id="turnstile-api" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" /> : null}
      <h2 className={text(p.displayMode) === 'modal' && isMessageForm ? 'form-box__heading-with-icon' : undefined}>
        {text(p.displayMode) === 'modal' && isMessageForm ? <Icon name="message-square" size={28} /> : null}
        <span>{text(p.heading) || 'Contacto'}</span>
      </h2>
      {text(p.description) && <p>{text(p.description)}</p>}
      <form className={`form-grid form-grid--${columns} ${layout === 'two-column' ? 'is-two-column' : ''}`} onSubmit={onSubmit}>
        {/* Honeypot: hidden from real visitors via CSS, only a script fills it. */}
        <input aria-hidden="true" className="form-field--honeypot" name="company_website" tabIndex={-1} type="text" autoComplete="off" />
        {fields.map((field, index) => {
          const fieldType = text(field.type) || 'text'
          const label = text(field.label)
          const required = Boolean(field.required)
          const name = text(field.name) || `field-${index}`
          const placeholder = text(field.placeholder)
          const fullWidth = Boolean(field.fullWidth)
          const options = String(field.options ?? '').split(',').map((option) => option.trim()).filter(Boolean)
          const fieldError = fieldErrors[name]
          const className = `form-field${fullWidth ? ' form-field--full' : ''}${fieldError ? ' has-error' : ''}`
          const fieldKey = `${name}-${index}`
          if (fieldType === 'textarea') {
            return (
              <label className={className} key={fieldKey}>
                <span>{label}{required ? <b className="form-field__required" aria-hidden="true"> *</b> : null}</span>
                <textarea name={name} onBlur={onFieldBlur} onChange={onFieldChange} placeholder={placeholder} required={required} rows={4} />
                {fieldError ? <em className="form-field__error" role="alert">{fieldError}</em> : null}
              </label>
            )
          }
          if (fieldType === 'select') {
            return (
              <label className={className} key={fieldKey}>
                <span>{label}{required ? <b className="form-field__required" aria-hidden="true"> *</b> : null}</span>
                <select defaultValue="" name={name} required={required}>
                  <option disabled value="">Select an option</option>
                  {options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            )
          }
          if (fieldType === 'checkbox') {
            return (
              <label className={`${className} form-field--checkbox`} key={fieldKey}>
                <input name={name} required={required} type="checkbox" />
                <span>{label}{required ? <b className="form-field__required" aria-hidden="true"> *</b> : null}</span>
              </label>
            )
          }
          if (fieldType === 'file') {
            return (
              <label className={className} key={fieldKey}>
                <span>{label}{required ? <b className="form-field__required" aria-hidden="true"> *</b> : null}</span>
                <input accept={text(field.placeholder) || '.pdf,.jpg,.jpeg,.png'} name={name} required={required} type="file" />
              </label>
            )
          }
          if (fieldType === 'country') {
            return (
              <SearchableListField
                className={className}
                key={fieldKey}
                label={label}
                name={name}
                onBlur={onCountryBlur}
                onChange={(value) => validateField(name, value, fieldType)}
                options={countryOptions}
                placeholder={placeholder}
                required={required}
                showFlags
              />
            )
          }
          if (fieldType === 'city') {
            return (
              <SearchableListField
                className={className}
                disabled={!selectedCountry}
                key={fieldKey}
                label={label}
                name={name}
                onBlur={onFieldBlur}
                onChange={(value) => validateField(name, value, fieldType)}
                options={cityOptions}
                placeholder={selectedCountry ? placeholder : (locale === 'es' ? 'Elige primero un país' : locale === 'pt' ? 'Escolha primeiro um país' : 'Choose a country first')}
                required={required}
              />
            )
          }
          return (
            <label className={className} key={fieldKey}>
              <span>{label}{required ? <b className="form-field__required" aria-hidden="true"> *</b> : null}</span>
              <input
                name={name}
                onBlur={onFieldBlur}
                onChange={onFieldChange}
                placeholder={placeholder}
                required={required}
                type={['email', 'tel', 'number', 'date', 'time'].includes(fieldType) ? fieldType : 'text'}
              />
              {fieldError ? <em className="form-field__error" role="alert">{fieldError}</em> : null}
            </label>
          )
        })}
        {turnstile.enabled ? <div className="form-turnstile" ref={turnstile.containerRef} /> : null}
        <div className="form-actions">
          <Button disabled={status === 'submitting'} icon={p.showIcon === false ? undefined : text(p.buttonIcon) || 'arrow-right'} label={status === 'submitting' ? 'Sending…' : (text(p.ctaLabel) || 'Submit')} variant={buttonVariant} />
          {status === 'error' ? <p className="form-error" role="alert">{errorMessage}</p> : null}
        </div>
      </form>
    </>
  )
}

/**
 * Real, working contact form. Submits to /api/dxp/forms/submit, which stores the entry in
 * `form-submissions` and dispatches it to whatever `content.destinations` names (email today;
 * webhook/CRM are additive — see dispatchFormSubmission.ts) — not hardcoded to any one channel.
 *
 * `content.displayMode:'modal'` keeps this Form out of the normal page flow and instead opens it
 * through ContentModal whenever a ModalTrigger elsewhere on the page (a Card, typically)
 * dispatches CONTENT_MODAL_EVENT with a matching `content.modalKey` — see shared.ts.
 */
export default function Form({ content, settings, instanceId, locale }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const modalKey = text(p.modalKey)

  if (text(p.displayMode) === 'modal' && modalKey) {
    return (
      <ContentModal locale={locale} modalKey={modalKey}>
        <div className="form-box">
          <FormBody instanceId={instanceId} locale={locale} p={p} />
        </div>
      </ContentModal>
    )
  }

  return (
    <section className="section form-section">
      <div className="section-container form-box">
        <FormBody instanceId={instanceId} locale={locale} p={p} />
      </div>
    </section>
  )
}
