export type ShippingZone = 'spain_mainland' | 'balearic' | 'canary' | 'ceuta_melilla'

export type SpanishProvinceOption = {
  id: string
  label: string
  zone: ShippingZone
}

export const SPANISH_PROVINCES: SpanishProvinceOption[] = [
  { id: 'A Coruna', label: 'A Coruna', zone: 'spain_mainland' },
  { id: 'Alava', label: 'Alava', zone: 'spain_mainland' },
  { id: 'Albacete', label: 'Albacete', zone: 'spain_mainland' },
  { id: 'Alicante', label: 'Alicante', zone: 'spain_mainland' },
  { id: 'Almeria', label: 'Almeria', zone: 'spain_mainland' },
  { id: 'Asturias', label: 'Asturias', zone: 'spain_mainland' },
  { id: 'Avila', label: 'Avila', zone: 'spain_mainland' },
  { id: 'Badajoz', label: 'Badajoz', zone: 'spain_mainland' },
  { id: 'Barcelona', label: 'Barcelona', zone: 'spain_mainland' },
  { id: 'Burgos', label: 'Burgos', zone: 'spain_mainland' },
  { id: 'Caceres', label: 'Caceres', zone: 'spain_mainland' },
  { id: 'Cadiz', label: 'Cadiz', zone: 'spain_mainland' },
  { id: 'Cantabria', label: 'Cantabria', zone: 'spain_mainland' },
  { id: 'Castellon', label: 'Castellon', zone: 'spain_mainland' },
  { id: 'Ceuta', label: 'Ceuta', zone: 'ceuta_melilla' },
  { id: 'Ciudad Real', label: 'Ciudad Real', zone: 'spain_mainland' },
  { id: 'Cordoba', label: 'Cordoba', zone: 'spain_mainland' },
  { id: 'Cuenca', label: 'Cuenca', zone: 'spain_mainland' },
  { id: 'Girona', label: 'Girona', zone: 'spain_mainland' },
  { id: 'Granada', label: 'Granada', zone: 'spain_mainland' },
  { id: 'Guadalajara', label: 'Guadalajara', zone: 'spain_mainland' },
  { id: 'Gipuzkoa', label: 'Gipuzkoa', zone: 'spain_mainland' },
  { id: 'Huelva', label: 'Huelva', zone: 'spain_mainland' },
  { id: 'Huesca', label: 'Huesca', zone: 'spain_mainland' },
  { id: 'Illes Balears', label: 'Illes Balears', zone: 'balearic' },
  { id: 'Jaen', label: 'Jaen', zone: 'spain_mainland' },
  { id: 'Leon', label: 'Leon', zone: 'spain_mainland' },
  { id: 'Lleida', label: 'Lleida', zone: 'spain_mainland' },
  { id: 'Lugo', label: 'Lugo', zone: 'spain_mainland' },
  { id: 'Madrid', label: 'Madrid', zone: 'spain_mainland' },
  { id: 'Malaga', label: 'Malaga', zone: 'spain_mainland' },
  { id: 'Melilla', label: 'Melilla', zone: 'ceuta_melilla' },
  { id: 'Murcia', label: 'Murcia', zone: 'spain_mainland' },
  { id: 'Navarra', label: 'Navarra', zone: 'spain_mainland' },
  { id: 'Ourense', label: 'Ourense', zone: 'spain_mainland' },
  { id: 'Palencia', label: 'Palencia', zone: 'spain_mainland' },
  { id: 'Las Palmas', label: 'Las Palmas', zone: 'canary' },
  { id: 'Pontevedra', label: 'Pontevedra', zone: 'spain_mainland' },
  { id: 'La Rioja', label: 'La Rioja', zone: 'spain_mainland' },
  { id: 'Salamanca', label: 'Salamanca', zone: 'spain_mainland' },
  { id: 'Santa Cruz de Tenerife', label: 'Santa Cruz de Tenerife', zone: 'canary' },
  { id: 'Segovia', label: 'Segovia', zone: 'spain_mainland' },
  { id: 'Sevilla', label: 'Sevilla', zone: 'spain_mainland' },
  { id: 'Soria', label: 'Soria', zone: 'spain_mainland' },
  { id: 'Tarragona', label: 'Tarragona', zone: 'spain_mainland' },
  { id: 'Teruel', label: 'Teruel', zone: 'spain_mainland' },
  { id: 'Toledo', label: 'Toledo', zone: 'spain_mainland' },
  { id: 'Valencia', label: 'Valencia', zone: 'spain_mainland' },
  { id: 'Valladolid', label: 'Valladolid', zone: 'spain_mainland' },
  { id: 'Bizkaia', label: 'Bizkaia', zone: 'spain_mainland' },
  { id: 'Zamora', label: 'Zamora', zone: 'spain_mainland' },
  { id: 'Zaragoza', label: 'Zaragoza', zone: 'spain_mainland' },
]

export const findSpanishProvince = (value?: string | null): SpanishProvinceOption | null => {
  if (!value) return null
  return SPANISH_PROVINCES.find((province) => province.label === value || province.id === value) ?? null
}
