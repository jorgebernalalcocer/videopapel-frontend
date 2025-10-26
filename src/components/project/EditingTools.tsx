'use client'

import { Button } from '@/components/ui/button'
import { Play, Plus } from 'lucide-react'

type EditingToolsProps = {
  heightPx: number
  isPlaying: boolean
  onTogglePlay: () => void
  onSave?: () => void
  canSave?: boolean
  isSaving?: boolean
  onInsertVideo?: () => void
}

export default function EditingTools({
  heightPx,
  isPlaying,
  onTogglePlay,
  onSave,
  canSave = false,
  isSaving = false,
  onInsertVideo,
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
        variant="outline"
        onClick={onInsertVideo}
        className="inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Insertar vídeo
      </Button>

      <Button
        type="button"
        variant="default"
        onClick={onSave}
        disabled={!canSave || isSaving}
        className="ml-auto"
      >
        {isSaving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </div>
  )
}
