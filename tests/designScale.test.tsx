// @vitest-environment jsdom
import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { colorToken, radiusToken, spacingToken } from '@/experience/design-system/scale'
import BackToTopRuntime from '@/experience/runtime/BackToTopRuntime'
import ContainerSection from '@/experience/components/organisms/ContainerSection'

afterEach(cleanup)

describe('design scale mapping', () => {
  it('accepts token names and maps legacy pixel values to the nearest token', () => {
    expect(spacingToken('space.6')).toBe('var(--space-6)')
    expect(spacingToken(16)).toBe('var(--space-4)')
    expect(spacingToken(30)).toBe('var(--space-8)')
    expect(spacingToken(undefined)).toBe('var(--space-4)')
    expect(radiusToken('radius.md')).toBe('var(--radius-md)')
    expect(radiusToken(0)).toBeUndefined()
    expect(radiusToken('none')).toBeUndefined()
    expect(radiusToken(13)).toBe('var(--radius-md)')
    expect(radiusToken({ topLeft: 24, topRight: 24, bottomRight: 0, bottomLeft: 0 })).toBe('var(--radius-xl)')
  })

  it('never lets a raw colour through: tokens, theme variables and the nearest token only', () => {
    expect(colorToken('color.brand', 'x')).toBe('var(--ds-color-brand)')
    expect(colorToken('var(--brand)', 'x')).toBe('var(--ds-color-brand)')
    expect(colorToken('#0c2260', 'x')).toBe('var(--ds-color-brand)')
    expect(colorToken('url(javascript:alert(1))', 'var(--brand)')).toBe('var(--brand)')
    expect(colorToken(undefined, 'var(--surface)')).toBe('var(--surface)')
  })
})

describe('components that used free visual values', () => {
  it('Container renders its gap and radius through tokens', () => {
    const { container } = render(<ContainerSection content={{ gap: 18, borderRadius: 11, columns: [] }} locale="es" settings={{}} site={{ name: 's', slug: 'home', supportedLocales: ['es'] }} />)
    expect((container.querySelector('.page-container-runtime__columns') as HTMLElement).style.gap).toBe('var(--space-4)')
    expect((container.querySelector('.page-container-runtime') as HTMLElement).style.borderRadius).toBe('var(--radius-md)')
  })

  it('Back to top renders its colours through tokens, even for a legacy hex value', () => {
    window.scrollY = 500
    const { container } = render(<BackToTopRuntime content={{ backgroundColor: '#ff0000', iconColor: 'color.surface', showAfter: 0 }} settings={{}} />)
    act(() => { window.dispatchEvent(new Event('scroll')) })
    const button = container.querySelector('button') as HTMLElement
    expect(button.style.background).not.toContain('#ff0000')
    expect(button.style.background).toMatch(/^var\(--ds-color-/)
    expect(button.style.color).toBe('var(--ds-color-surface)')
  })
})
