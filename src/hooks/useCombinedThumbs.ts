// src/hooks/useCombinedThumbs.ts
import { useEffect, useMemo, useState } from 'react'
import { cloudinaryFrameUrlFromVideoUrl } from '@/utils/cloudinary'
import { buildSig, loadThumbsFromCache, saveThumbsToCache, Thumbnail } from '@/utils/thumbCache'
import { generateTimesFromDuration } from '@/utils/time'

export type ClipState = {
  clipId: number; videoSrc: string; durationMs: number; frames: number[];
  timeStartMs?: number; timeEndMs?: number
}

export type CombinedThumb = {
  id: string; clipId: number; tLocal: number; tGlobal: number; videoSrc: string; url?: string
}

function framesCountFor(durationMs: number, suggestedCount?: number, pps?: number) {
  if (suggestedCount && suggestedCount > 1) return suggestedCount
  if (pps && pps > 0) return Math.max(2, Math.round((durationMs / 1000) * pps) + 1)
  return Math.max(2, Math.round(durationMs / 1000) + 1)
}

export function useCombinedThumbs(params: {
  projectId: string
  apiBase: string
  accessToken: string | null
  clipsOrdered: ClipState[]
  clipOffsets: Record<number, { offset: number; start: number; end: number }>
  thumbnailsCount?: number
  thumbsPerSecond?: number
  thumbnailHeight: number
  disableAutoThumbnails?: boolean
}) {
  const {
    projectId, apiBase, accessToken, clipsOrdered, clipOffsets,
    thumbnailsCount, thumbsPerSecond, thumbnailHeight, disableAutoThumbnails
  } = params

  const [combinedThumbs, setCombinedThumbs] = useState<CombinedThumb[]>([])
  const [state, setState] = useState({ generating: false, error: null as string | null, isCacheLoaded: false })

  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        setState({ generating: true, error: null, isCacheLoaded: false })
        const perClip: CombinedThumb[][] = []

        for (const c of clipsOrdered) {
          const { offset, start, end } = clipOffsets[c.clipId]
          const targetCount = framesCountFor(c.durationMs, thumbnailsCount, thumbsPerSecond)
          const sig = buildSig({
            clipId: c.clipId, videoSrc: c.videoSrc, durationMs: c.durationMs,
            targetCount, thumbnailHeight, framesVersion: c.frames?.join(',') ?? null,
          })

          let items = loadThumbsFromCache(projectId, c.clipId, sig)

          const legacy39 = Array.isArray(c.frames) && c.frames.length === 39 && (thumbnailsCount == null)
          const tooFew  = !Array.isArray(c.frames) || c.frames.length < 2

          if (!items || items.length === 0 || legacy39 || tooFew) {
            const seedsTimes = generateTimesFromDuration(c.durationMs, targetCount)
            items = seedsTimes.map((t) => ({ t, url: '' }))
          }

          items = items.filter((it) => it.t >= start && it.t < end)

          if (items.some((it) => !it.url) && !disableAutoThumbnails) {
            items = items.map((it) => ({ t: it.t, url: cloudinaryFrameUrlFromVideoUrl(c.videoSrc, it.t, thumbnailHeight) }))
            saveThumbsToCache(projectId, c.clipId, sig, items)

            if (accessToken) {
              try {
                await fetch(`${apiBase}/projects/${projectId}/clips/${c.clipId}/frames/`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                  body: JSON.stringify({ frames: items.map((i) => i.t) }),
                })
              } catch { /* noop */ }
            }
          }

          const merged: CombinedThumb[] = items.map(({ t, url }) => ({
            id: `${c.clipId}:${t}`,
            clipId: c.clipId,
            tLocal: t,
            tGlobal: (t - start) + offset,
            videoSrc: c.videoSrc,
            url,
          }))

          perClip.push(merged)
        }

        if (!canceled) {
          const all = perClip.flat().sort((a, b) => a.tGlobal - b.tGlobal)
          setCombinedThumbs(all)
          setState({ generating: false, error: null, isCacheLoaded: true })
        }
      } catch (e: any) {
        if (!canceled) setState({ generating: false, error: e?.message || 'Error preparando miniaturas', isCacheLoaded: true })
      }
    })()

    return () => { canceled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, clipsOrdered, clipOffsets, thumbnailsCount, thumbnailHeight, disableAutoThumbnails, thumbsPerSecond])

  return { combinedThumbs, ...state, setCombinedThumbs }
}
