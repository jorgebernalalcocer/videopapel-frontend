'use client'

import { Button } from '@/components/ui/button'
import { Play, Film, Camera, Type, Save, Captions, RotateCcw } from 'lucide-react'
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
  const hasPendingChanges = canSave && !isSaving
  const actionsLocked = isGeneratingSubtitles
  const showActionButtons = !hasPendingChanges

  const handleInsertClick = () => {
    if (actionsLocked) {
      toast.warning(isGeneratingSubtitles
        ? 'Estamos generando subtítulos. Espera a que finalice para insertar un nuevo video.'
        : 'Acción no disponible en este momento.'
      )
      return
    }
    onInsertVideo?.()
  }

  const handleInsertTextClick = () => {
    if (actionsLocked) {
      toast.warning(isGeneratingSubtitles
        ? 'Estamos generando subtítulos. Espera a que finalice para insertar un nuevo texto.'
        : 'Acción no disponible en este momento.'
      )
      return
    }
    onInsertText?.()
  }

  const handleGenerateSubtitles = () => {
    if (actionsLocked) {
      toast.warning('Estamos generando subtítulos. Espera a que finalice.')
      return
    }
    onGenerateSubtitles?.()
  }

  const handleDiscardChanges = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div
      className="mt-3 border rounded-lg bg-white flex flex-wrap items-start gap-2 px-2 py-2"
      style={{ minHeight: '3rem' }}
      aria-label="Editing tools"
    >
      <Button
        type="button"
        variant="secondary"
        onClick={onTogglePlay}
        className="inline-flex items-center gap-2"
        title={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        <Play className="h-4 w-4 text-yellow-600" />
        {!hasPendingChanges && (isPlaying ? 'Pausar' : 'Reproducir')}
      </Button>

      {showActionButtons && (
        <>
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
            <Film className="h-4 w-4 text-red-600" />
            <span className="hidden sm:inline">Más videos</span>
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
            <Camera className="h-4 w-4 text-purple-600" />
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
            <Type className="h-4 w-4 text-pink-600" />
            <span className="hidden sm:inline">Escribir texto</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateSubtitles}
            disabled={isGeneratingSubtitles}
            aria-label="Subtítulos"
            className="inline-flex items-center gap-2"
          >
            <Captions className="h-4 w-4 text-fuchsia-600" />
            <span className="hidden sm:inline">
              {isGeneratingSubtitles ? 'Generando…' : 'Añadir subtítulos'}
            </span>
          </Button>
        </>
      )}

      {hasPendingChanges && (
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscardChanges}
            disabled={isSaving || isGeneratingSubtitles}
            aria-label="Descartar cambios"
            className="inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <span>Descartar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={!canSave || isSaving || isGeneratingSubtitles}
            aria-label="Guardar cambios"
            className="inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4 text-green-600" />
            <span>{isSaving ? 'Guardando…' : 'Guardar'}</span>
          </Button>
        </div>
      )}
    </div>
  )
}


// listado de colores para Tailwind CSS

// Nombre del Color	Ejemplo de Clase	Descripción
// Gris (Gray)	text-gray-500	Un gris neutro, ideal para texto secundario.
// Ceniza (Slate)	bg-slate-700	Un gris con un ligero tono azulado.
// Zinc	border-zinc-400	Un gris con un ligero tono marrón/cálido.
// Neutral	text-neutral-500	Similar al gris, pero más neutro.
// Piedra (Stone)	bg-stone-100	Un gris cálido, similar a la piedra.
// Rojo (Red)	text-red-600	Un rojo vibrante.
// Naranja (Orange)	bg-orange-400	Un naranja tradicional.
// Ámbar (Amber)	text-amber-500	Similar al naranja, con más amarillo.
// Amarillo (Yellow)	bg-yellow-200	Un amarillo brillante.
// Lima (Lime)	text-lime-500	Un verde claro y brillante.
// Verde (Green)	border-green-700	Un verde tradicional.
// Esmeralda (Emerald)	bg-emerald-500	Un verde brillante con un toque de azul.
// Cerceta (Teal)	text-teal-400	Un color azul verdoso oscuro.
// Cian (Cyan)	bg-cyan-300	Un azul claro y vibrante.
// Cielo (Sky)	text-sky-500	Un azul claro y suave.
// Azul (Blue)	bg-blue-600	Un azul estándar, como el que pediste usar.
// Índigo (Indigo)	text-indigo-800	Un azul oscuro con un toque de púrpura.
// Violeta (Violet)	bg-violet-500	Un color púrpura.
// Púrpura (Purple)	text-purple-700	Similar al violeta.
// Fucsia (Fuchsia)	bg-fuchsia-400	Un púrpura/rosa brillante.
// Rosa (Pink)	text-pink-600	Un color rosa.
// Rosa (Rose)	bg-rose-50	Un rosa con un ligero tono rojo.
