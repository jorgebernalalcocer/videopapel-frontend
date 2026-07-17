import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CornerPositionSelector from './CornerPositionSelector'

describe('CornerPositionSelector (controlado)', () => {
  it('renderiza las cuatro posiciones y el título', () => {
    render(<CornerPositionSelector value="top_left" onChange={vi.fn()} />)
    expect(screen.getByText('Posición')).toBeInTheDocument()
    for (const label of ['Superior izquierda', 'Superior derecha', 'Inferior izquierda', 'Inferior derecha']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('resalta la posición activa', () => {
    render(<CornerPositionSelector value="bottom_right" onChange={vi.fn()} />)
    const active = screen.getByText('Inferior derecha')
    expect(active.className).toContain('bg-purple-600')
    // otra posición no está activa
    expect(screen.getByText('Superior izquierda').className).not.toContain('bg-purple-600')
  })

  it('llama onChange con la posición pulsada', async () => {
    const onChange = vi.fn()
    render(<CornerPositionSelector value="top_left" onChange={onChange} />)
    await userEvent.click(screen.getByText('Inferior derecha'))
    expect(onChange).toHaveBeenCalledWith('bottom_right')
  })

  it('permite personalizar el título', () => {
    render(<CornerPositionSelector value="top_left" onChange={vi.fn()} title="Esquina del número" />)
    expect(screen.getByText('Esquina del número')).toBeInTheDocument()
  })
})
