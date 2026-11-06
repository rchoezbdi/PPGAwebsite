'use client'

import { useMemo, useState, type FocusEvent } from 'react'
import { countryFlag } from '../../forms/countryCityData'

/** A dropdown-with-search backed by a native `<input list>`/`<datalist>` pair instead of a
 * hand-rolled combobox — the browser already gives free type-to-filter behavior and full
 * keyboard/screen-reader support for this exact pattern, and (the actual reason it fits here)
 * typing anything not in `options` still just submits as plain text. That's the entire answer to
 * "what if the country/city isn't listed": there's no separate free-text/"Other" mode to build,
 * the field never restricts input in the first place. Used by Form.tsx for the "country"/"city"
 * field types (see countryCityData.ts for where `options` comes from). */
export default function SearchableListField({ className, disabled, label, name, onBlur, onChange, options, placeholder, required, showFlags = false }: {
  className?: string
  disabled?: boolean
  label: string
  name: string
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  onChange?: (value: string) => void
  options: string[]
  placeholder?: string
  required?: boolean
  showFlags?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => options.filter((option) => option.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 100), [options, query])
  return (
    <label className={`${className ?? ''} searchable-field${open ? ' is-open' : ''}`}>
      <span>{label}{required ? <b className="form-field__required" aria-hidden="true"> *</b> : null}</span>
      <input
        autoComplete="off"
        disabled={disabled}
        name={name}
        onBlur={(event) => { onBlur?.(event); window.setTimeout(() => setOpen(false), 120) }}
        onChange={(event) => { setQuery(event.currentTarget.value); onChange?.(event.currentTarget.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}
        placeholder={placeholder}
        required={required}
        type="text"
      />
      {open && !disabled ? <div className="searchable-field__options" role="listbox">
        {filtered.map((option) => <button key={option} type="button" role="option" aria-selected={query === option} onMouseDown={(event) => event.preventDefault()} onClick={(event) => {
          const input = event.currentTarget.parentElement?.previousElementSibling as HTMLInputElement | null
          if (input) { input.value = option; setQuery(option); onChange?.(option); input.blur() }
          setOpen(false)
        }}>{showFlags ? <span aria-hidden="true">{countryFlag(option)}</span> : null}{option}</button>)}
        {!filtered.length ? <span className="searchable-field__empty">No results</span> : null}
      </div> : null}
    </label>
  )
}
