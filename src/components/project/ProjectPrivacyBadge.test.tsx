import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectPrivacyBadge from './ProjectPrivacyBadge'

const colorClass = (el: HTMLElement) =>
  Array.from(el.classList).find((c) => c.startsWith('text-') && c.endsWith('-700'))

describe('ProjectPrivacyBadge', () => {
  it('muestra "Privado" por defecto con tono rose', () => {
    render(<ProjectPrivacyBadge />)
    const el = screen.getByText('Privado')
    expect(el).toBeInTheDocument()
    expect(colorClass(el)).toBe('text-rose-700')
  })

  it('muestra "Público" con tono emerald cuando isPublic', () => {
    render(<ProjectPrivacyBadge isPublic />)
    const el = screen.getByText('Público')
    expect(el).toBeInTheDocument()
    expect(colorClass(el)).toBe('text-emerald-700')
  })

  it('expone un aria-label descriptivo', () => {
    render(<ProjectPrivacyBadge isPublic />)
    expect(screen.getByLabelText('Este proyecto es público')).toBeInTheDocument()
  })
})
