import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrintAspectBadge from './PrintAspectBadge'

describe('PrintAspectBadge', () => {
  it('por defecto (sin slug) muestra "Relleno completo"', () => {
    render(<PrintAspectBadge />)
    expect(screen.getByText('Relleno completo')).toBeInTheDocument()
    expect(
      screen.getByLabelText('La imagen rellena todo el área de impresión recortando los sobrantes.')
    ).toBeInTheDocument()
  })

  it('con slug "fit" muestra "Imagen completa"', () => {
    render(<PrintAspectBadge slug="fit" />)
    expect(screen.getByText('Imagen completa')).toBeInTheDocument()
    expect(
      screen.getByLabelText('La imagen se adapta completa, añadiendo márgenes si es necesario.')
    ).toBeInTheDocument()
  })

  it('con slug "fill" muestra "Relleno completo"', () => {
    render(<PrintAspectBadge slug="fill" />)
    expect(screen.getByText('Relleno completo')).toBeInTheDocument()
  })

  it('el name explícito tiene prioridad sobre el label por defecto', () => {
    render(<PrintAspectBadge slug="fit" name="Ajuste especial" />)
    expect(screen.getByText('Ajuste especial')).toBeInTheDocument()
  })
})
