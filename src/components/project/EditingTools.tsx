'use client'

import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react' // si usas lucide; opcional

type EditingToolsProps = {
  heightPx: number
  isPlaying: boolean
  onTogglePlay: () => void
}

export default function EditingTools({
  heightPx,
  isPlaying,
  onTogglePlay,
}: EditingToolsProps) {
  return (
    <div
      className="mt-3 border rounded-lg bg-white flex items-center gap-2 px-2"
      style={{ height: heightPx }}
      aria-label="Editing tools"
    >
      <Button
        type="button"
        variant="secondary"
        onClick={onTogglePlay}
        className="inline-flex items-center gap-2"
        title={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {/* Icono opcional; quítalo si no usas lucide */}
        <Play className="h-4 w-4" />
        {isPlaying ? 'Pausar' : 'Reproducir'}
      </Button>

      {/* deja espacio para futuras herramientas (recorte, zoom, etc.) */}
      <div className="text-xs text-gray-500 ml-2">
        (más herramientas próximamente)
      </div>
    </div>
  )
}
