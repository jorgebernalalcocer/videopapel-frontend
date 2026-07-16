import { describe, it, expect, vi } from 'vitest'
import type { KeyboardEvent } from 'react'
import { makeTimelineKeydownHandler } from './useKeyboardTimelineNav'

type Item = { id: string; tGlobal: number }
const items: Item[] = [
  { id: 'a', tGlobal: 0 },
  { id: 'b', tGlobal: 100 },
  { id: 'c', tGlobal: 200 },
]

// Evento de teclado falso mínimo
function keyEvent(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent
}

function setup(selectedId: string | null) {
  const setSelected = vi.fn()
  const scrollIntoView = vi.fn()
  const togglePlay = vi.fn()
  const handler = makeTimelineKeydownHandler(items, selectedId, setSelected, scrollIntoView, togglePlay)
  return { handler, setSelected, scrollIntoView, togglePlay }
}

describe('makeTimelineKeydownHandler', () => {
  it('ArrowRight avanza al siguiente item y hace scroll', () => {
    const { handler, setSelected, scrollIntoView } = setup('a')
    handler(keyEvent('ArrowRight'))
    expect(setSelected).toHaveBeenCalledWith(items[1])
    expect(scrollIntoView).toHaveBeenCalledWith('b')
  })

  it('ArrowLeft retrocede al item anterior', () => {
    const { handler, setSelected } = setup('c')
    handler(keyEvent('ArrowLeft'))
    expect(setSelected).toHaveBeenCalledWith(items[1])
  })

  it('ArrowRight se detiene en el último (clamp)', () => {
    const { handler, setSelected } = setup('c')
    handler(keyEvent('ArrowRight'))
    expect(setSelected).toHaveBeenCalledWith(items[2])
  })

  it('ArrowLeft se detiene en el primero (clamp)', () => {
    const { handler, setSelected } = setup('a')
    handler(keyEvent('ArrowLeft'))
    expect(setSelected).toHaveBeenCalledWith(items[0])
  })

  it('sin selección, arranca desde el índice 0', () => {
    const { handler, setSelected } = setup(null)
    handler(keyEvent('ArrowRight'))
    expect(setSelected).toHaveBeenCalledWith(items[1])
  })

  it('Espacio alterna la reproducción y previene el scroll de la página', () => {
    const { handler, togglePlay } = setup('a')
    const e = keyEvent(' ')
    handler(e)
    expect(togglePlay).toHaveBeenCalledTimes(1)
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('ignora otras teclas', () => {
    const { handler, setSelected, togglePlay } = setup('a')
    handler(keyEvent('Enter'))
    expect(setSelected).not.toHaveBeenCalled()
    expect(togglePlay).not.toHaveBeenCalled()
  })

  it('con lista vacía no selecciona nada (pero previene el default)', () => {
    const setSelected = vi.fn()
    const handler = makeTimelineKeydownHandler([] as Item[], null, setSelected, vi.fn(), vi.fn())
    const e = keyEvent('ArrowRight')
    handler(e)
    expect(setSelected).not.toHaveBeenCalled()
    expect(e.preventDefault).toHaveBeenCalled()
  })
})
