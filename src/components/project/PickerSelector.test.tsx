import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PickerSelector from './PickerSelector'

type Item = { id: number; name: string }
const items: Item[] = [
  { id: 1, name: 'Uno' },
  { id: 2, name: 'Dos' },
]

const renderItem = ({ item }: { item: Item; selected: boolean }) => <span>{item.name}</span>

function setup(props: Partial<React.ComponentProps<typeof PickerSelector<Item>>> = {}) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  const onSelectItem = vi.fn()
  render(
    <PickerSelector<Item>
      open
      onClose={onClose}
      title="Elige uno"
      items={items}
      onConfirm={onConfirm}
      onSelectItem={onSelectItem}
      renderItem={renderItem}
      {...props}
    />
  )
  return { onClose, onConfirm, onSelectItem }
}

describe('PickerSelector', () => {
  it('renderiza el título y los items cuando está abierto', () => {
    setup()
    expect(screen.getByText('Elige uno')).toBeInTheDocument()
    expect(screen.getByText('Uno')).toBeInTheDocument()
    expect(screen.getByText('Dos')).toBeInTheDocument()
  })

  it('muestra el estado de carga', () => {
    setup({ loading: true })
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
  })

  it('muestra el mensaje de vacío cuando no hay items', () => {
    setup({ items: [], emptyLabel: 'Nada por aquí' })
    expect(screen.getByText('Nada por aquí')).toBeInTheDocument()
  })

  it('deshabilita Confirmar sin selección y lo habilita al seleccionar', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('con un item seleccionado, Confirmar está activo y dispara onConfirm', async () => {
    const { onConfirm } = setup({ selectedItem: items[0] })
    const confirm = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirm).toBeEnabled()
    await userEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('al hacer clic en un item llama onSelectItem', async () => {
    const { onSelectItem } = setup()
    await userEvent.click(screen.getByText('Dos'))
    expect(onSelectItem).toHaveBeenCalledWith(items[1])
  })

  it('Cancelar llama onClose', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('muestra el label de ocupado mientras busy', () => {
    setup({ selectedItem: items[0], busy: true, confirmBusyLabel: 'Guardando…' })
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeInTheDocument()
  })
})
