'use client'

import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react' // si usas lucide; opcional

type EditingToolsProps = {
  heightPx: number
  isPlaying: boolean
  onTogglePlay: () => void
  onSave?: () => void
  canSave?: boolean
}

export default function EditingTools({
  heightPx,
  isPlaying,
  onTogglePlay,
  onSave,
  canSave = false,
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

      <Button
        type="button"
        variant="default"
        onClick={onSave}
        disabled={!canSave}
        className="ml-auto"
      >
        Guardar cambios
      </Button>
    </div>
  )
}
