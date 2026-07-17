import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrintOrientationBadge from './PrintOrientationBadge'

// El badge muestra un skeleton hasta que monta (useEffect); render() de RTL
// ejecuta los efectos dentro de act, así que ya vemos el contenido real.
describe('PrintOrientationBadge', () => {
  it.each([
    ['vertical', 'Vertical'],
    ['horizontal', 'Horizontal'],
    ['cuadrado', 'Cuadrado'],
  ] as const)('muestra "%s" → "%s"', (orientation, expected) => {
    render(<PrintOrientationBadge orientation={orientation} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('muestra "Sin orientación" cuando no hay valor', () => {
    render(<PrintOrientationBadge orientation={null} />)
    expect(screen.getByText('Sin orientación')).toBeInTheDocument()
  })

  it('expone aria-label con la orientación seleccionada', () => {
    render(<PrintOrientationBadge orientation="vertical" />)
    expect(screen.getByLabelText('Orientación de impresión: Vertical')).toBeInTheDocument()
  })

  it('indica en el aria-label cuando no está seleccionada', () => {
    render(<PrintOrientationBadge orientation={null} />)
    expect(screen.getByLabelText('Orientación de impresión no seleccionada')).toBeInTheDocument()
  })
})
