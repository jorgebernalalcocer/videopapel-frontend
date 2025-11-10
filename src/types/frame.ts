export type FramePosition = 'top' | 'right' | 'bottom' | 'left'

export type FrameSettingClient = {
  frame?: {
    id: number
    name: string | null
    description?: string | null
    style?: string | null
  } | null
  tile?: {
    id: number
    name: string | null
    slug?: string | null
  } | null
  thickness_px: number
  thickness_pct?: number | null
  positions: FramePosition[]
  color_hex?: string | null
} | null
