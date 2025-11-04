// src/components/ui/BusyOverlay.tsx
'use client'
export default function BusyOverlay({ show, labelPending = 'Cargando…', labelBusy = 'Generando miniaturas…' }:{
  show: boolean
  labelPending?: string
  labelBusy?: string
}) {
  if (!show) return null
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="inline-flex flex-col items-center gap-3 text-white text-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        <span>{labelBusy}</span>
      </div>
    </div>
  )
}
