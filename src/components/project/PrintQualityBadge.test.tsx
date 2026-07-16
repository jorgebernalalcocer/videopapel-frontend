import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrintQualityBadge from './PrintQualityBadge'

describe('PrintQualityBadge', () => {
  it('muestra el placeholder cuando no hay valor', () => {
    render(<PrintQualityBadge />)
    expect(screen.getByText('Elige la calidad')).toBeInTheDocument()
  })

  it('compone el label con nombre y DPI', () => {
    render(<PrintQualityBadge name="Alta" dpi={300} />)
    expect(screen.getByText('Alta — 300 DPI')).toBeInTheDocument()
  })

  it('usa ppi como respaldo cuando no hay dpi', () => {
    render(<PrintQualityBadge name="Media" ppi={200} />)
    expect(screen.getByText('Media — 200 DPI')).toBeInTheDocument()
  })

  it('expone un title/aria-label accesible con el valor seleccionado', () => {
    render(<PrintQualityBadge name="Alta" dpi={300} />)
    expect(
      screen.getByLabelText('Calidad de impresión: Alta — 300 DPI')
    ).toBeInTheDocument()
  })

  it('indica en el aria-label cuando no hay calidad seleccionada', () => {
    render(<PrintQualityBadge />)
    expect(
      screen.getByLabelText('Calidad de impresión no seleccionada')
    ).toBeInTheDocument()
  })

  it('no añade title cuando titleHint es false', () => {
    render(<PrintQualityBadge name="Alta" dpi={300} titleHint={false} />)
    expect(screen.getByText('Alta — 300 DPI')).not.toHaveAttribute('aria-label')
  })

  describe('tono de color según la calidad', () => {
    // El color se aplica como clase de texto sobre el span renderizado
    const colorClass = (el: HTMLElement) =>
      Array.from(el.classList).find((c) => c.startsWith('text-') && c.endsWith('-700'))

    it('azul (blue) para >= 300 DPI', () => {
      render(<PrintQualityBadge name="Q" dpi={300} />)
      expect(colorClass(screen.getByText('Q — 300 DPI'))).toBe('text-blue-700')
    })

    it('esmeralda (emerald) para > 150 DPI', () => {
      render(<PrintQualityBadge name="Q" dpi={200} />)
      expect(colorClass(screen.getByText('Q — 200 DPI'))).toBe('text-emerald-700')
    })

    it('ámbar (amber) para calidad baja con valor', () => {
      render(<PrintQualityBadge name="Q" dpi={100} />)
      expect(colorClass(screen.getByText('Q — 100 DPI'))).toBe('text-amber-700')
    })

    it('slate cuando no hay valor', () => {
      render(<PrintQualityBadge />)
      expect(colorClass(screen.getByText('Elige la calidad'))).toBe('text-slate-700')
    })
  })
})
