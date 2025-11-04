'use client'

import { Button } from '@/components/ui/button'
import { Play, Plus, Video, Film, Camera, Type, Save } from 'lucide-react'
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
        aria-label="Insertar video"
        className={`
          inline-flex items-center gap-2
          ${insertDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Film className="h-4 w-4" />
        <span className="hidden sm:inline">Insertar video</span>
      </Button>

            <Button
        type="button"
        variant="outline"
        onClick={handleInsertClick}
        aria-disabled={insertDisabled}
        aria-label="Insertar imagen"
        className={`
          inline-flex items-center gap-2
          ${insertDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline">Insertar imagen</span>
      </Button>

                  <Button
        type="button"
        variant="outline"
        onClick={handleInsertTextClick}
        aria-disabled={insertDisabled}
        aria-label="Insertar texto"
        className={`
          inline-flex items-center gap-2
          ${insertDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Type className="h-4 w-4" />
        <span className="hidden sm:inline">Insertar texto</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onSave}
        disabled={!canSave || isSaving}
        aria-label="Guardar cambios"
        className="ml-auto inline-flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">{isSaving ? 'Guardando…' : 'Guardar cambios'}</span>
      </Button>
    </div>
  )
}
