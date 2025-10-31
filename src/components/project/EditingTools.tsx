'use client'

import { Button } from '@/components/ui/button'
import { Play, Plus } from 'lucide-react'
import { toast } from 'sonner'

type EditingToolsProps = {
  heightPx: number
  isPlaying: boolean
  onTogglePlay: () => void
  onSave?: () => void
  canSave?: boolean
  isSaving?: boolean
  onInsertVideo?: () => void
  onInsertText?: () => void
}

export default function EditingTools({
  heightPx,
  isPlaying,
  onTogglePlay,
  onSave,
  canSave = false,
  isSaving = false,
  onInsertVideo,
  onInsertText,
}: EditingToolsProps) {
  // 🔁 Relación inversa: si se puede guardar => bloquear inserción
  const insertDisabled = canSave && !isSaving

  const handleInsertClick = () => {
    if (insertDisabled) {
      toast.warning("Debes de guardar cambios antes de insertar un nuevo video")
      return
    }
    onInsertVideo?.()
  }

  const handleInsertTextClick = () => {
    if (insertDisabled) {
      toast.warning("Debes de guardar cambios antes de insertar un nuevo texto")
      return
    }
    onInsertText?.()
  }
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
        <Play className="h-4 w-4" />
        {isPlaying ? 'Pausar' : 'Reproducir'}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleInsertClick}
        aria-disabled={insertDisabled}
        className={`
          inline-flex items-center gap-2
          ${insertDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Plus className="h-4 w-4" />
        Insertar video
      </Button>

            <Button
        type="button"
        variant="outline"
        onClick={handleInsertClick}
        aria-disabled={insertDisabled}
        className={`
          inline-flex items-center gap-2
          ${insertDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Plus className="h-4 w-4" />
        Insertar imagen
      </Button>

                  <Button
        type="button"
        variant="outline"
        onClick={handleInsertTextClick}
        aria-disabled={insertDisabled}
        className={`
          inline-flex items-center gap-2
          ${insertDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Plus className="h-4 w-4" />
        Insertar texto
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onSave}
        disabled={!canSave || isSaving}
        className="ml-auto"
      >
        {isSaving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </div>
  )
}
