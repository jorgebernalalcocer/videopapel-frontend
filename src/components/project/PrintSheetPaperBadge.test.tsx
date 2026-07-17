import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrintSheetPaperBadge from './PrintSheetPaperBadge'

describe('PrintSheetPaperBadge', () => {
  it('muestra placeholder sin papel', () => {
    render(<PrintSheetPaperBadge />)
    expect(screen.getByText('Sin papel')).toBeInTheDocument()
    expect(screen.getByLabelText('Papel de impresión no seleccionado')).toBeInTheDocument()
  })

  it('une label, gramaje y acabado con guiones', () => {
    render(<PrintSheetPaperBadge label="Estucado" weight={120} finishing="Mate" />)
    expect(screen.getByText('Estucado — 120 g/m2 — Mate')).toBeInTheDocument()
    expect(screen.getByLabelText('Papel de impresión: Estucado — 120 g/m2 — Mate')).toBeInTheDocument()
  })

  it('omite las partes ausentes', () => {
    render(<PrintSheetPaperBadge weight={250} />)
    expect(screen.getByText('250 g/m2')).toBeInTheDocument()
  })
})
