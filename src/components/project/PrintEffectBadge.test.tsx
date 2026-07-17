import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrintEffectBadge from './PrintEffectBadge'

describe('PrintEffectBadge', () => {
  it('muestra el nombre del efecto', () => {
    render(<PrintEffectBadge name="Sepia" />)
    expect(screen.getByText('Sepia')).toBeInTheDocument()
    expect(screen.getByLabelText('Efecto de impresión: Sepia')).toBeInTheDocument()
  })

  it('muestra placeholder sin efecto', () => {
    render(<PrintEffectBadge />)
    expect(screen.getByText('Sin efecto')).toBeInTheDocument()
    expect(screen.getByLabelText('Efecto de impresión no seleccionado')).toBeInTheDocument()
  })

  it('trata un nombre en blanco como sin efecto', () => {
    render(<PrintEffectBadge name="   " />)
    expect(screen.getByText('Sin efecto')).toBeInTheDocument()
  })
})
