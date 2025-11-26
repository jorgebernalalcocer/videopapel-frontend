// src/hooks/useCombinedThumbs.ts
import { useEffect, useMemo, useState } from 'react'
import { cloudinaryFrameUrlFromVideoUrl } from '@/utils/cloudinary'
import { buildSig, loadThumbsFromCache, saveThumbsToCache, Thumbnail } from '@/utils/thumbCache'

export type ClipState = {
  clipId: number; videoSrc: string; durationMs: number; frames: number[];
  thumbnails?: { image_url?: string | null; frame_time_ms?: number | null }[];
  timeStartMs?: number; timeEndMs?: number
}

export type CombinedThumb = {
  id: string; clipId: number; tLocal: number; tGlobal: number; videoSrc: string; url?: string
}

const BASE_GRID_DENSITY = 10

function resolveDensity(value?: number | null) {
  return Math.max(1, Math.round(value ?? 1))
}

function gridStepMsForDensity(density: number) {
  return Math.max(1, Math.round(1000 / density))
}

function buildGridTimes(durationMs: number, density: number): number[] {
  const duration = Math.max(0, Math.round(durationMs))
  const step = gridStepMsForDensity(density)
  if (duration === 0) return [0]
  const totalSteps = Math.max(1, Math.round(duration / step))
  const times: number[] = []
  for (let idx = 0; idx <= totalSteps; idx++) {
    const value = Math.min(duration, idx * step)
    times.push(value)
  }
  times[0] = 0
  times[times.length - 1] = duration
  return Array.from(new Set(times)).sort((a, b) => a - b)
}

function selectTimesFromGrid(gridTimes: number[], desiredCount: number): number[] {
  if (!gridTimes.length) return []
  if (!desiredCount || desiredCount >= gridTimes.length) return gridTimes.slice()
  const lastIndex = gridTimes.length - 1
  const segments = Math.max(1, desiredCount - 1)
  const step = lastIndex / segments
  const picked: number[] = []
  for (let i = 0; i < desiredCount; i++) {
    const idx = Math.min(lastIndex, Math.round(i * step))
    picked.push(gridTimes[idx])
  }
  picked[picked.length - 1] = gridTimes[lastIndex]
  return Array.from(new Set(picked)).sort((a, b) => a - b)
}

function snapTimesToGrid(values: number[], stepMs: number, durationMs: number): number[] {
  const snapped = values.map((value) => {
    const clamped = Math.min(Math.max(0, Math.round(value)), durationMs)
    const snappedValue = Math.round(clamped / stepMs) * stepMs
    return Math.max(0, Math.min(durationMs, snappedValue))
  })
  return Array.from(new Set(snapped)).sort((a, b) => a - b)
}

function framesCountForDuration(durationMs: number, density: number): number {
  const durationSec = Math.max(0, durationMs) / 1000
  const raw = Math.round(durationSec * density)
  return Math.max(2, raw + 1)
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
          
  const baseGridTimes = buildGridTimes(c.durationMs, BASE_GRID_DENSITY)
const targetTimes = baseGridTimes // rejilla maestra completa

          const targetTimeSet = new Set(targetTimes)
          const stepMs = gridStepMsForDensity(BASE_GRID_DENSITY)
          const sig = buildSig({
            clipId: c.clipId, videoSrc: c.videoSrc, durationMs: c.durationMs,
            targetCount: targetTimes.length, thumbnailHeight, framesVersion: c.frames?.join(',') ?? null,
          })

          let items = loadThumbsFromCache(projectId, c.clipId, sig)

          const backendFramesRaw = Array.isArray(c.frames)
            ? c.frames
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value >= 0)
                .sort((a, b) => a - b)
            : []

          const snappedBackendFrames = backendFramesRaw.length
            ? snapTimesToGrid(backendFramesRaw, stepMs, c.durationMs)
            : []

          const backendThumbnails = Array.isArray(c.thumbnails)
            ? c.thumbnails
                .map((thumb) => {
                    const t = Number(thumb?.frame_time_ms ?? 0)
                    if (!Number.isFinite(t)) return null
                    return {
                    t: Math.max(0, Math.min(c.durationMs, Math.round(t))),
                    url: thumb?.image_url ?? '',
                  }
                })
                .filter((entry): entry is { t: number; url: string } => Boolean(entry))
                .sort((a, b) => a.t - b.t)
            : []

          if (backendThumbnails.length) {
            console.log('[useCombinedThumbs] usando thumbnails backend', {
              clipId: c.clipId,
              count: backendThumbnails.length,
              sample: backendThumbnails.slice(0, 4),
            })
            items = backendThumbnails
            saveThumbsToCache(projectId, c.clipId, sig, backendThumbnails)
          } else {
            console.log('[useCombinedThumbs] sin thumbnails backend', { clipId: c.clipId })
          }

          if ((!items || items.length === 0) && snappedBackendFrames.length) {
            const filtered = snappedBackendFrames.filter((t) => targetTimeSet.has(t))
            const baseTimes = filtered.length ? filtered : targetTimes
            items = baseTimes.map((t) => ({ t, url: '' }))
          }

          const legacy39 = snappedBackendFrames.length === 39 && thumbnailsCount == null
          const missingAny = !items || items.length === 0
          if (missingAny && snappedBackendFrames.length === 0) {
            const seedsTimes = targetTimes
            items = seedsTimes.map((t) => ({ t, url: '' }))
          } else if (legacy39) {
            const seedsTimes = targetTimes
            items = seedsTimes.map((t) => ({ t, url: '' }))
          }


          if (!items || items.length === 0) continue

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
          console.log('[useCombinedThumbs] combined thumbs ready', {
            clips: clipsOrdered.map((c) => c.clipId),
            total: perClip.reduce((sum, arr) => sum + arr.length, 0),
          })
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
