export type PageEnumerationPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right'
export type PageEnumerationBackgroundStyle = 'fill' | 'outline' | 'transparent'

export type PageEnumerationSettingClient = {
  enabled: boolean
  position: PageEnumerationPosition
  size_pct: number
  background_style: PageEnumerationBackgroundStyle
  fill_color_hex: string
  text_color_hex: string
} | null
