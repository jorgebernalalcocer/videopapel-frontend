import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrintBindingBadge from './PrintBindingBadge'

describe('PrintBindingBadge', () => {
  it('muestra el nombre de la encuadernación', () => {
    render(<PrintBindingBadge name="Grapada" />)
    expect(screen.getByText('Grapada')).toBeInTheDocument()
    expect(screen.getByLabelText('Encuadernación: Grapada')).toBeInTheDocument()
  })

  it('añade la descripción al aria-label cuando existe', () => {
    render(<PrintBindingBadge name="Cosida" description="a hilo" />)
    expect(screen.getByLabelText('Encuadernación: Cosida — a hilo')).toBeInTheDocument()
  })

  it('muestra placeholder sin encuadernación', () => {
    render(<PrintBindingBadge />)
    expect(screen.getByText('Sin encuadernación')).toBeInTheDocument()
    expect(screen.getByLabelText('Encuadernación no seleccionada')).toBeInTheDocument()
  })
})
