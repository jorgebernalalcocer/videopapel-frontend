// src/components/TopProgress.tsx
'use client'

import { useEffect, useRef } from 'react'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useLoading } from '@/store/loading'

NProgress.configure({ showSpinner: false, trickleSpeed: 120 })

export default function TopProgress() {
  const isFetching = useIsFetching()          // queries activas
  const isMutating = useIsMutating()          // mutations activas
  const manual = useLoading((s) => s.pending) // fetch manual via apiFetch
  const active = isFetching + isMutating + manual > 0

  // Evita doble start/done por renders consecutivos
  const wasActive = useRef(false)

  useEffect(() => {
    // pequeño delay para no parpadear en requests ultra cortas
    let t: ReturnType<typeof setTimeout> | null = null

    if (active && !wasActive.current) {
      t = setTimeout(() => {
        NProgress.start()
        wasActive.current = true
      }, 120)
    }

    if (!active && wasActive.current) {
      if (t) clearTimeout(t)
      NProgress.done()
      wasActive.current = false
    }

    return () => {
      if (t) clearTimeout(t)
    }
  }, [active])

  return null
}
