'use client'

import { Button } from '@/components/ui/button'
import { Play, Film, Camera, Type, Save, Captions } from 'lucide-react'
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
  onGenerateSubtitles?: () => void
  isGeneratingSubtitles?: boolean
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
  onGenerateSubtitles,
  isGeneratingSubtitles = false,
}: EditingToolsProps) {
  // 🔁 Relación inversa: si se puede guardar => bloquear inserción
  const actionsLocked = (canSave && !isSaving) || isGeneratingSubtitles

  const handleInsertClick = () => {
    if (actionsLocked) {
      toast.warning(isGeneratingSubtitles
        ? 'Estamos generando subtítulos. Espera a que finalice para insertar un nuevo video.'
        : 'Debes de guardar cambios antes de insertar un nuevo video'
      )
      return
    }
    onInsertVideo?.()
  }

  const handleInsertTextClick = () => {
    if (actionsLocked) {
      toast.warning(isGeneratingSubtitles
        ? 'Estamos generando subtítulos. Espera a que finalice para insertar un nuevo texto.'
        : 'Debes de guardar cambios antes de insertar un nuevo texto'
      )
      return
    }
    onInsertText?.()
  }

  const handleGenerateSubtitles = () => {
    if (actionsLocked && !isGeneratingSubtitles) {
      toast.warning('Debes guardar cambios antes de generar subtítulos.')
      return
    }
    onGenerateSubtitles?.()
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
        aria-disabled={actionsLocked}
        aria-label="Insertar video"
        className={`
          inline-flex items-center gap-2
          ${actionsLocked ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Film className="h-4 w-4" />
        <span className="hidden sm:inline">Insertar video</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleInsertClick}
        aria-disabled={actionsLocked}
        aria-label="Insertar imagen"
        className={`
          inline-flex items-center gap-2
          ${actionsLocked ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline">Insertar imagen</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleInsertTextClick}
        aria-disabled={actionsLocked}
        aria-label="Insertar texto"
        className={`
          inline-flex items-center gap-2
          ${actionsLocked ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <Type className="h-4 w-4" />
        <span className="hidden sm:inline">Insertar texto</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleGenerateSubtitles}
        disabled={isGeneratingSubtitles}
        aria-label="Añadir subtítulos"
        className="inline-flex items-center gap-2"
      >
        <Captions className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isGeneratingSubtitles ? 'Generando…' : 'Añadir subtítulos'}
        </span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onSave}
        disabled={!canSave || isSaving || isGeneratingSubtitles}
        aria-label="Guardar cambios"
        className="ml-auto inline-flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">{isSaving ? 'Guardando…' : 'Guardar cambios'}</span>
      </Button>
    </div>
  )
}
