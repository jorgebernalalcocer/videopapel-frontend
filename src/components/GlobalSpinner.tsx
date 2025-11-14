// src/components/GlobalSpinner.tsx
'use client'

import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useLoading } from '@/store/loading'
import { useEffect, useState } from 'react'

type GlobalSpinnerProps = {
  force?: boolean
}

export default function GlobalSpinner({ force = false }: GlobalSpinnerProps) {
  const isFetching = useIsFetching()           // queries (GETs)
  const isMutating = useIsMutating()           // mutations (POST/PUT/DELETE) si usas React Query
  const manual = useLoading((s) => s.pending)  // fetch manual con apiFetch
  const active = force || isFetching + isMutating + manual > 0

  // para transiciones suaves (evita “blink” en requests ultracortas)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    let t: any
    if (active) {
      // pequeño delay para no mostrar spinner si dura <150ms
      t = setTimeout(() => setVisible(true), 150)
    } else {
      setVisible(false)
    }
    return () => clearTimeout(t)
  }, [active])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      {/* Spinner accesible */}
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white" aria-label="Cargando" />
    </div>
  )
}
