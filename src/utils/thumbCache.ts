// src/utils/thumbCache.ts
export type Thumbnail = { t: number; url: string }

const LS_PREFIX = 'vp:thumbs'
const LS_KEY = (projectId: string, clipId: number | string) => `${LS_PREFIX}:${projectId}:${clipId}`

export function buildSig(args: {
  clipId: number
  videoSrc: string
  durationMs: number
  targetCount: number
  thumbnailHeight: number
  framesVersion?: string | null
}) {
  const { clipId, videoSrc, durationMs, targetCount, thumbnailHeight, framesVersion } = args
  return JSON.stringify({ v: 4, clipId, videoSrc, durationMs, targetCount, thumbnailHeight, framesVersion })
}

export function loadThumbsFromCache(projectId: string, clipId: number | string, sig: string): Thumbnail[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY(projectId, clipId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.sig !== sig) return null
    const items = parsed?.items
    if (!Array.isArray(items)) return null
    return items.map((it: any) => ({ t: Number(it.t) || 0, url: String(it.dataUrl || '') }))
  } catch { return null }
}

export function saveThumbsToCache(projectId: string, clipId: number | string, sig: string, items: Thumbnail[]) {
  try {
    const payload = { sig, createdAt: Date.now(), items: items.map(i => ({ t: i.t, dataUrl: i.url })) }
    localStorage.setItem(LS_KEY(projectId, clipId), JSON.stringify(payload))
  } catch { /* ignore */ }
}
