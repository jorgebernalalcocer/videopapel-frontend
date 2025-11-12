// src/hooks/useProjectTexts.ts
import { useCallback, useEffect, useMemo, useState } from 'react'

export type ProjectTextOverlayApi = {
  id: number; clip: number; frame_start: number | null; frame_end: number | null;
  specific_frames: number[]; position_x: number; position_y: number;
}
export type ProjectTextApiModel = {
  id: number; project: string; content: string; typography: string | null;
  font_size?: number | null;
  color_hex?: string | null;
  frame_start: number | null; frame_end: number | null; specific_frames: number[];
  overlays: ProjectTextOverlayApi[];
  kind?: 'manual' | 'subtitle';
}
export type TextFrame = {
  id: number; clip: number; text_id?: number; project_id?: string;
  content: string; typography: string | null; font_size?: number | null; color_hex?: string | null;
  frame_start: number | null; frame_end: number | null; specific_frames: number[];
  position_x: number; position_y: number;
  frame_start_global?: number | null; frame_end_global?: number | null;
  specific_frames_global?: number[];
}

const clampFontSize = (value: number | null | undefined) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 18
  return Math.min(60, Math.max(5, parsed))
}

const normalizeColor = (value?: string | null) => {
  const raw = (value || '#FFFFFF').trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) {
    return raw.toUpperCase()
  }
  return '#FFFFFF'
}

type ClipMetaMap = Record<number, { offset: number; start: number; end: number }>
type GlobalLookup = Map<number, Map<number, number>>

export function useProjectTexts(
  enabled: boolean,
  { apiBase, accessToken, projectId } : { apiBase: string; accessToken: string | null; projectId: string },
  clipSignature: string,
  clipsOrdered: { clipId: number }[],
  clipOffsets: ClipMetaMap,
  globalFrameLookupByClip: GlobalLookup,
  textsVersion: number,
) {
  const [projectTexts, setProjectTexts] = useState<ProjectTextApiModel[]>([])
  const [textFramesByClip, setTextFramesByClip] = useState<Record<number, TextFrame[]>>({})
  const [overlayToTextId, setOverlayToTextId] = useState<Record<number, number>>({})

  const updateTextFrameLocal = useCallback((id: number, x: number, y: number) => {
    const textId = overlayToTextId[id] ?? overlayToTextId[String(id) as unknown as number]
    setTextFramesByClip(prev => {
      const next: typeof prev = {}
      let hasChanges = false
      for (const [clipIdStr, list] of Object.entries(prev)) {
        const clipId = Number(clipIdStr)
        let mutated = false
        const updated = list.map((tf) => {
          if (tf.id === id || (textId != null && tf.text_id === textId)) {
            mutated = true
            hasChanges = true
            return {
              ...tf,
              position_x: Number(x),
              position_y: Number(y),
            }
          }
          return tf
        })
        next[clipId] = mutated ? updated : list
      }
      return hasChanges ? next : prev
    })
  }, [overlayToTextId])

  const getOverlayIdsForText = useCallback((overlayId: number) => {
    const textId = overlayToTextId[overlayId] ?? overlayToTextId[String(overlayId) as unknown as number]
    if (textId == null) return [overlayId]
    const ids: number[] = []
    for (const [overlayKey, mappedTextId] of Object.entries(overlayToTextId)) {
      if (mappedTextId === textId) {
        ids.push(Number(overlayKey))
      }
    }
    if (!ids.includes(overlayId)) {
      ids.push(overlayId)
    }
    return Array.from(new Set(ids))
  }, [overlayToTextId])

  useEffect(() => {
    if (!enabled) { setProjectTexts([]); setTextFramesByClip({}); setOverlayToTextId({}); return }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/project-texts/?project=${projectId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`ProjectTexts ${res.status}`)
        const payload = await res.json()
        if (cancelled) return
        const list: ProjectTextApiModel[] = Array.isArray(payload) ? payload :
          Array.isArray(payload?.results) ? payload.results : []
        setProjectTexts(list)
      } catch {
        if (!cancelled) console.error('Error cargando textos del proyecto')
      }
    })()
    return () => { cancelled = true }
  }, [enabled, apiBase, accessToken, projectId, clipSignature, textsVersion, clipsOrdered.length])

  const rebuildTextFrames = useCallback((items: ProjectTextApiModel[]) => {
    const allowedClipIds = new Set(clipsOrdered.map((c) => c.clipId))
    const byClip: Record<number, TextFrame[]> = {}
    const overlayMap: Record<number, number> = {}

    const normalizeGlobalSpecific = (values: number[] | null | undefined) =>
      Array.isArray(values) ? Array.from(new Set(values.map(v => Math.round(Number(v))))).sort((a,b)=>a-b) : []

    for (const item of items) {
      for (const overlay of item.overlays ?? []) {
        if (!allowedClipIds.has(overlay.clip)) continue
        overlayMap[overlay.id] = item.id
        const clipMeta = clipOffsets[overlay.clip]
        const offset = clipMeta?.offset ?? 0
        const clipDuration = clipMeta ? Math.max(0, clipMeta.end - clipMeta.start) : Number.POSITIVE_INFINITY
        const globalSpecific = normalizeGlobalSpecific(overlay.specific_frames)

        const toLocal = (value: number | null | undefined) => (value == null ? null : Math.max(0, value - offset))
        const normalizeSpecific = (values: number[] | null | undefined) => {
          if (!Array.isArray(values)) return []
          const lookup = globalFrameLookupByClip.get(overlay.clip)
          return values.map((v) => {
              if (lookup && lookup.size) {
                const rounded = Math.round(v)
                if (lookup.has(rounded)) return lookup.get(rounded)!
                let bestLocal = v - offset, bestDiff = Number.POSITIVE_INFINITY
                lookup.forEach((localMs, globalMs) => {
                  const diff = Math.abs(globalMs - v)
                  if (diff < bestDiff) { bestDiff = diff; bestLocal = localMs }
                })
                return bestLocal
              }
              return v - offset
            })
            .filter((v) => v >= 0 && v <= clipDuration)
            .map((v) => Math.round(v))
        }

        const localStart = toLocal(overlay.frame_start)
        const localEnd = toLocal(overlay.frame_end)
        const normalized: TextFrame = {
          id: overlay.id, clip: overlay.clip, text_id: item.id, project_id: item.project,
          content: item.content, typography: item.typography, font_size: clampFontSize(item.font_size), color_hex: normalizeColor(item.color_hex),
          frame_start: localStart == null ? null : Math.max(0, Math.min(localStart, clipDuration)),
          frame_end: localEnd == null ? null : Math.max(0, Math.min(localEnd, clipDuration)),
          specific_frames: normalizeSpecific(overlay.specific_frames),
          position_x: overlay.position_x, position_y: overlay.position_y,
          frame_start_global: overlay.frame_start ?? null,
          frame_end_global: overlay.frame_end ?? null,
          specific_frames_global: globalSpecific,
        }
        if (!byClip[normalized.clip]) byClip[normalized.clip] = []
        byClip[normalized.clip].push(normalized)
      }
    }

    for (const list of Object.values(byClip)) {
      list.sort((a, b) => {
        const aStart = a.frame_start ?? (a.specific_frames[0] ?? Number.MAX_SAFE_INTEGER)
        const bStart = b.frame_start ?? (b.specific_frames[0] ?? Number.MAX_SAFE_INTEGER)
        return aStart - bStart
      })
    }

    setOverlayToTextId(overlayMap)
    setTextFramesByClip(byClip)
  }, [clipsOrdered, clipOffsets, globalFrameLookupByClip])

  useEffect(() => {
    if (!projectTexts.length) {
      setTextFramesByClip({})
      setOverlayToTextId({})
      return
    }
    rebuildTextFrames(projectTexts)
  }, [projectTexts, clipSignature, rebuildTextFrames])

  return { projectTexts, textFramesByClip, overlayToTextId, updateTextFrameLocal, getOverlayIdsForText }
}
