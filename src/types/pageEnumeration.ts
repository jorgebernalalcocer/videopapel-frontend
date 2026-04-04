export type PageEnumerationPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right'

export type PageEnumerationSettingClient = {
  enabled: boolean
  position: PageEnumerationPosition
  size_pct: number
  fill_color_hex: string
  text_color_hex: string
} | null
