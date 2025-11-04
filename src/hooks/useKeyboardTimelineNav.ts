// src/hooks/useKeyboardTimelineNav.ts
import { KeyboardEvent } from 'react'

export function makeTimelineKeydownHandler<T extends { id: string; tGlobal: number }>(
  items: T[],
  selectedId: string | null,
  setSelected: (item: T) => void,
  scrollIntoView: (id: string) => void,
  togglePlay: () => void,
) {
  return (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const idx = selectedId ? items.findIndex(t => t.id === selectedId) : 0
      const nextIdx = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(items.length - 1, idx + 1)
      if (items.length > 0) {
        const n = items[nextIdx]; setSelected(n); scrollIntoView(n.id)
      }
    } else if (e.key === ' ') {
      e.preventDefault(); togglePlay()
    }
  }
}
