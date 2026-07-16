import { describe, it, expect } from 'vitest'
import { SPANISH_PROVINCES, findSpanishProvince } from './spanishProvinces'

describe('SPANISH_PROVINCES', () => {
  it('cubre las 52 provincias', () => {
    expect(SPANISH_PROVINCES).toHaveLength(52)
  })

  it('asigna las zonas especiales de envío correctamente', () => {
    const zoneOf = (id: string) => SPANISH_PROVINCES.find((p) => p.id === id)?.zone
    expect(zoneOf('Illes Balears')).toBe('balearic')
    expect(zoneOf('Las Palmas')).toBe('canary')
    expect(zoneOf('Santa Cruz de Tenerife')).toBe('canary')
    expect(zoneOf('Ceuta')).toBe('ceuta_melilla')
    expect(zoneOf('Melilla')).toBe('ceuta_melilla')
    expect(zoneOf('Madrid')).toBe('spain_mainland')
  })
})

describe('findSpanishProvince', () => {
  it('encuentra por id o por label', () => {
    expect(findSpanishProvince('Barcelona')?.zone).toBe('spain_mainland')
    expect(findSpanishProvince('Las Palmas')?.id).toBe('Las Palmas')
  })

  it('devuelve null para valores vacíos o desconocidos', () => {
    expect(findSpanishProvince(null)).toBeNull()
    expect(findSpanishProvince(undefined)).toBeNull()
    expect(findSpanishProvince('')).toBeNull()
    expect(findSpanishProvince('Lisboa')).toBeNull()
  })
})
