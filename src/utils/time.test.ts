import { describe, it, expect } from 'vitest'
import { formatTime, nearestIndex, generateTimesFromDuration, clamp01 } from './time'

describe('formatTime', () => {
  it('formatea mm:ss por debajo de una hora', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(1000)).toBe('00:01')
    expect(formatTime(65_000)).toBe('01:05')
  })

  it('añade el segmento de horas cuando corresponde', () => {
    expect(formatTime(3_600_000)).toBe('01:00:00')
    expect(formatTime(3_661_000)).toBe('01:01:01')
  })

  it('trata los ms negativos como 0', () => {
    expect(formatTime(-5000)).toBe('00:00')
  })

  it('trunca los milisegundos sobrantes (no redondea hacia arriba)', () => {
    expect(formatTime(1999)).toBe('00:01')
  })
})

describe('nearestIndex', () => {
  it('encuentra el índice del valor más cercano', () => {
    expect(nearestIndex([0, 100, 200, 300], 170)).toBe(2)
    expect(nearestIndex([0, 100, 200, 300], 40)).toBe(0)
  })

  it('con empate devuelve el primero (estricto menor que)', () => {
    expect(nearestIndex([0, 100], 50)).toBe(0)
  })
})

describe('generateTimesFromDuration', () => {
  it('devuelve [0] cuando hay un frame o menos', () => {
    expect(generateTimesFromDuration(10_000, 1)).toEqual([0])
    expect(generateTimesFromDuration(10_000, 0)).toEqual([0])
  })

  it('reparte los tiempos uniformemente y clava el último en la duración', () => {
    const times = generateTimesFromDuration(10_000, 5)
    expect(times).toHaveLength(5)
    expect(times[0]).toBe(0)
    expect(times[times.length - 1]).toBe(10_000)
  })

  it('usa una duración sintética si la duración es 0', () => {
    const times = generateTimesFromDuration(0, 3)
    expect(times[0]).toBe(0)
    expect(times[times.length - 1]).toBe(3000)
  })
})

describe('clamp01', () => {
  it('acota al rango [0, 1]', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(2)).toBe(1)
  })
})
