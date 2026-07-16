import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildSig,
  loadThumbsFromCache,
  saveThumbsToCache,
  removeThumbsFromCache,
  type Thumbnail,
} from './thumbCache'

const sigArgs = {
  clipId: 1,
  videoSrc: 'https://x/v.mp4',
  durationMs: 10_000,
  targetCount: 40,
  thumbnailHeight: 300,
  framesVersion: '0,1000,2000',
}

beforeEach(() => localStorage.clear())

describe('buildSig', () => {
  it('incluye la versión v:4 (guardián de invalidación de caché)', () => {
    // ⚠️ Si este test falla porque cambió la generación de thumbnails,
    // hay que BUMPEAR la v en buildSig, no ajustar el test a ciegas.
    const parsed = JSON.parse(buildSig(sigArgs))
    expect(parsed.v).toBe(4)
  })

  it('produce la misma firma para los mismos argumentos', () => {
    expect(buildSig(sigArgs)).toBe(buildSig(sigArgs))
  })

  it('cambia la firma si cambia cualquier argumento relevante', () => {
    const base = buildSig(sigArgs)
    expect(buildSig({ ...sigArgs, durationMs: 9999 })).not.toBe(base)
    expect(buildSig({ ...sigArgs, thumbnailHeight: 301 })).not.toBe(base)
    expect(buildSig({ ...sigArgs, framesVersion: '0,1000' })).not.toBe(base)
    expect(buildSig({ ...sigArgs, targetCount: 41 })).not.toBe(base)
  })
})

describe('save/load round-trip', () => {
  const items: Thumbnail[] = [
    { t: 0, url: 'data:image/jpeg;base64,AAA' },
    { t: 1000, url: 'data:image/jpeg;base64,BBB' },
  ]

  it('devuelve los thumbnails guardados con la misma firma', () => {
    const sig = buildSig(sigArgs)
    saveThumbsToCache('proj1', 1, sig, items)
    expect(loadThumbsFromCache('proj1', 1, sig)).toEqual(items)
  })

  it('devuelve null cuando la firma no coincide (caché obsoleta)', () => {
    saveThumbsToCache('proj1', 1, buildSig(sigArgs), items)
    const otherSig = buildSig({ ...sigArgs, durationMs: 5000 })
    expect(loadThumbsFromCache('proj1', 1, otherSig)).toBeNull()
  })

  it('devuelve null cuando no hay nada cacheado', () => {
    expect(loadThumbsFromCache('proj1', 99, buildSig(sigArgs))).toBeNull()
  })

  it('devuelve null y no lanza si el JSON está corrupto', () => {
    localStorage.setItem('vp:thumbs:proj1:1', '{no es json valido')
    expect(loadThumbsFromCache('proj1', 1, buildSig(sigArgs))).toBeNull()
  })

  it('aísla por projectId y clipId en la clave de localStorage', () => {
    const sig = buildSig(sigArgs)
    saveThumbsToCache('projA', 1, sig, items)
    expect(loadThumbsFromCache('projB', 1, sig)).toBeNull()
    expect(loadThumbsFromCache('projA', 2, sig)).toBeNull()
  })
})

describe('removeThumbsFromCache', () => {
  it('borra la entrada de la caché', () => {
    const sig = buildSig(sigArgs)
    saveThumbsToCache('proj1', 1, sig, [{ t: 0, url: 'x' }])
    removeThumbsFromCache('proj1', 1)
    expect(loadThumbsFromCache('proj1', 1, sig)).toBeNull()
  })
})
