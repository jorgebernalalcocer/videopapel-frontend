import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['draft', 'Elaborando'],
    ['ready', 'Listo para comprar'],
    ['exported', 'Comprado'],
  ] as const)('estado "%s" muestra "%s"', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByLabelText(`Estado del proyecto: ${label}`)).toBeInTheDocument()
  })

  it('no es clicable si el estado no es "ready"', async () => {
    render(<StatusBadge status="draft" onAddToCart={vi.fn()} />)
    // No hay modal ni interacción de compra
    expect(screen.queryByText('Añadir a la cesta')).not.toBeInTheDocument()
  })

  it('no es clicable si es "ready" pero no hay onAddToCart', () => {
    render(<StatusBadge status="ready" />)
    // Renderiza como botón deshabilitado (forceDisabled), sin abrir modal
    expect(screen.queryByText('El proyecto está listo para ser comprado')).not.toBeInTheDocument()
  })

  it('estado "ready" con onAddToCart: abre modal y permite añadir a la cesta', async () => {
    const onAddToCart = vi.fn()
    render(<StatusBadge status="ready" onAddToCart={onAddToCart} />)

    await userEvent.click(screen.getByRole('button', { name: 'Estado del proyecto: Listo para comprar' }))

    // Se abre el modal
    expect(await screen.findByText('El proyecto está listo para ser comprado')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Añadir a la cesta'))
    expect(onAddToCart).toHaveBeenCalledTimes(1)
  })

  it('muestra "Añadiendo…" mientras se añade a la cesta', async () => {
    render(<StatusBadge status="ready" onAddToCart={vi.fn()} addingToCart />)
    await userEvent.click(screen.getByRole('button', { name: 'Estado del proyecto: Listo para comprar' }))
    expect(await screen.findByText('Añadiendo…')).toBeInTheDocument()
  })
})
