import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProjectTexts, type ProjectTextApiModel } from './useProjectTexts'

// clip 10: offset 1000ms, duración 5000ms (start 0, end 5000)
const clipsOrdered = [{ clipId: 10 }]
const clipOffsets = { 10: { offset: 1000, start: 0, end: 5000 } }
const emptyLookup = new Map<number, Map<number, number>>()

// Un texto (id 1) con dos overlays en el mismo clip → comparten text_id
const ITEM: ProjectTextApiModel = {
  id: 1,
  project: 'p1',
  content: 'Hola',
  typography: 'Borel',
  font_size: 200, // se acota a 60
  color_hex: '#abc', // se normaliza a #ABC
  text_background_enabled: true,
  text_background_style: null, // con enabled true → 'fill'
  text_background_color_hex: null, // fallback #000000
  frame_start: null,
  frame_end: null,
  specific_frames: [],
  overlays: [
    { id: 100, clip: 10, frame_start: 2000, frame_end: 4000, specific_frames: [3000], position_x: 0.5, position_y: 0.5 },
    { id: 101, clip: 10, frame_start: 1500, frame_end: 3500, specific_frames: [], position_x: 0.2, position_y: 0.2 },
  ],
}

function renderTexts(enabled = true, textsVersion = 0) {
  return renderHook(() =>
    useProjectTexts(
      enabled,
      { apiBase: 'http://api.test', accessToken: 'tok', projectId: 'p1' },
      'sig-1',
      clipsOrdered,
      clipOffsets,
      emptyLookup,
      textsVersion,
    )
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [ITEM] }))
})
afterEach(() => vi.restoreAllMocks())

describe('useProjectTexts', () => {
  it('carga los textos y construye los frames por clip', async () => {
    const { result } = renderTexts()
    await waitFor(() => expect(result.current.textFramesByClip[10]).toHaveLength(2))
    expect(result.current.projectTexts).toHaveLength(1)
  })

  it('convierte los tiempos globales a locales restando el offset del clip', async () => {
    const { result } = renderTexts()
    await waitFor(() => expect(result.current.textFramesByClip[10]).toBeTruthy())

    // ordenados por frame_start: overlay 101 (1500→500) antes que 100 (2000→1000)
    const [first, second] = result.current.textFramesByClip[10]
    expect(first.id).toBe(101)
    expect(first.frame_start).toBe(500) // 1500 - 1000
    expect(second.id).toBe(100)
    expect(second.frame_start).toBe(1000) // 2000 - 1000
    expect(second.frame_end).toBe(3000) // 4000 - 1000
    expect(second.specific_frames).toEqual([2000]) // 3000 - 1000
    // conserva los valores globales originales
    expect(second.frame_start_global).toBe(2000)
    expect(second.specific_frames_global).toEqual([3000])
  })

  it('normaliza tipografía/estilo: font_size acotado, color en mayúsculas, fondo', async () => {
    const { result } = renderTexts()
    await waitFor(() => expect(result.current.textFramesByClip[10]).toBeTruthy())

    const tf = result.current.textFramesByClip[10].find((t) => t.id === 100)!
    expect(tf.font_size).toBe(60) // clamp de 200
    expect(tf.color_hex).toBe('#ABC')
    expect(tf.text_background_enabled).toBe(true)
    expect(tf.text_background_style).toBe('fill')
    expect(tf.text_background_color_hex).toBe('#000000')
  })

  it('construye el mapa overlay→text_id', async () => {
    const { result } = renderTexts()
    await waitFor(() => expect(result.current.textFramesByClip[10]).toBeTruthy())
    expect(result.current.overlayToTextId).toEqual({ 100: 1, 101: 1 })
  })

  it('getOverlayIdsForText devuelve los overlays hermanos del mismo texto', async () => {
    const { result } = renderTexts()
    await waitFor(() => expect(result.current.textFramesByClip[10]).toBeTruthy())
    expect(result.current.getOverlayIdsForText(100).sort()).toEqual([100, 101])
  })

  it('updateTextFrameLocal mueve todos los overlays del mismo texto', async () => {
    const { result } = renderTexts()
    await waitFor(() => expect(result.current.textFramesByClip[10]).toBeTruthy())

    act(() => result.current.updateTextFrameLocal(100, 0.9, 0.8))

    for (const tf of result.current.textFramesByClip[10]) {
      expect(tf.position_x).toBe(0.9)
      expect(tf.position_y).toBe(0.8)
    }
  })

  it('con enabled=false limpia el estado y no hace fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderTexts(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.projectTexts).toEqual([])
    expect(result.current.textFramesByClip).toEqual({})
  })

  it('acepta payload paginado con {results: [...]}', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [ITEM] }) }))
    const { result } = renderTexts()
    await waitFor(() => expect(result.current.projectTexts).toHaveLength(1))
  })
})
