import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrintSizeBadge from './PrintSizeBadge'

describe('PrintSizeBadge', () => {
  it('muestra placeholder sin valor', () => {
    render(<PrintSizeBadge />)
    expect(screen.getByText('Sin tamaño')).toBeInTheDocument()
    expect(screen.getByLabelText('Tamaño de impresión no seleccionado')).toBeInTheDocument()
  })

  it('compone nombre + dimensiones', () => {
    render(<PrintSizeBadge name="A4" widthMm={210} heightMm={297} />)
    expect(screen.getByText('A4 — 210×297 mm')).toBeInTheDocument()
    expect(screen.getByLabelText('Tamaño de impresión: A4 — 210×297 mm')).toBeInTheDocument()
  })

  it('muestra solo el nombre si faltan dimensiones', () => {
    render(<PrintSizeBadge name="Cuadrado" />)
    expect(screen.getByText('Cuadrado')).toBeInTheDocument()
  })
})
