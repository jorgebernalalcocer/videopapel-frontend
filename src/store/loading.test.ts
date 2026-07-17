import { describe, it, expect, beforeEach } from 'vitest'
import { useLoading } from './loading'

beforeEach(() => useLoading.setState({ pending: 0 }))

describe('useLoading store', () => {
  it('empieza en 0', () => {
    expect(useLoading.getState().pending).toBe(0)
  })

  it('start incrementa el contador (soporta peticiones concurrentes)', () => {
    useLoading.getState().start()
    useLoading.getState().start()
    expect(useLoading.getState().pending).toBe(2)
  })

  it('stop decrementa el contador', () => {
    useLoading.setState({ pending: 2 })
    useLoading.getState().stop()
    expect(useLoading.getState().pending).toBe(1)
  })

  it('stop nunca baja de 0 (clamp)', () => {
    useLoading.getState().stop()
    useLoading.getState().stop()
    expect(useLoading.getState().pending).toBe(0)
  })
})
