'use client'

import { Button } from '@/components/ui/button'
import { Play, Pause, Film, Camera, Type, Captions, Frame as FrameIcon, MonitorPlay, Image as ImageIcon, Hash } from 'lucide-react'
import { toast } from 'sonner'
import RecoverDeletedButton from '@/components/project/RecoverDeletedButton'
import SaveChangesButton from '@/components/project/SaveChangesButton'

type EditingToolsProps = {
  heightPx: number
  isPlaying: boolean
  onTogglePlay: () => void
  onSave?: () => void
  canSave?: boolean
  isSaving?: boolean
  onInsertVideo?: () => void
  onInsertImage?: () => void
  onInsertText?: () => void
  onInsertFrame?: () => void
  onEditFrame?: () => void
  onOpenEnumeration?: () => void
  onGenerateSubtitles?: () => void
  isGeneratingSubtitles?: boolean
  hasFrame?: boolean
  onOpenPresentation?: () => void
  onOpenCover?: () => void
  onDiscardChanges?: () => void
  editingDisabled?: boolean
}

export default function EditingTools({
  heightPx,
  isPlaying,
  onTogglePlay,
  onSave,
  canSave = false,
  isSaving = false,
  onInsertVideo,
  onInsertImage,
  onInsertText,
  onInsertFrame,
  onEditFrame,
  onOpenEnumeration,
  onGenerateSubtitles,
  isGeneratingSubtitles = false,
  hasFrame = false,
  onOpenPresentation,
  onOpenCover,
  onDiscardChanges,
  editingDisabled = false,
}: EditingToolsProps) {
  const hasPendingChanges = canSave && !isSaving
  const actionsLocked = isGeneratingSubtitles || editingDisabled
  const showActionButtons = !hasPendingChanges

  const handleInsertClick = () => {
    if (actionsLocked) {
      toast.warning(
        isGeneratingSubtitles
          ? 'Estamos generando subtítulos. Espera a que finalice para insertar un nuevo video.'
          : 'Este proyecto ya ha sido comprado. Duplícalo para modificarlo.'
      )
      return
    }
    onInsertVideo?.()
  }

  const handleInsertTextClick = () => {
    if (actionsLocked) {
      toast.warning(
        isGeneratingSubtitles
          ? 'Estamos generando subtítulos. Espera a que finalice para insertar un nuevo texto.'
          : 'Este proyecto ya ha sido comprado. Duplícalo para modificarlo.'
      )
      return
    }
    onInsertText?.()
  }

  const handleInsertImageClick = () => {
    if (actionsLocked) {
      toast.warning(
        isGeneratingSubtitles
          ? 'Estamos generando subtítulos. Espera a que finalice para insertar una nueva imagen.'
          : 'Este proyecto ya ha sido comprado. Duplícalo para modificarlo.'
      )
      return
    }
    onInsertImage?.()
  }

  const handleGenerateSubtitles = () => {
    if (actionsLocked) {
      toast.warning(
        isGeneratingSubtitles
          ? 'Estamos generando subtítulos. Espera a que finalice.'
          : 'Este proyecto ya ha sido comprado. Duplícalo para modificarlo.'
      )
      return
    }
    onGenerateSubtitles?.()
  }

  const handleInsertFrame = () => {
    if (actionsLocked) {
      toast.warning(
        isGeneratingSubtitles
          ? 'Estamos generando subtítulos. Espera a que finalice para insertar un nuevo marco.'
          : 'Este proyecto ya ha sido comprado. Duplícalo para modificarlo.'
      )
      return
    }
    onInsertFrame?.()
  }

  const handleOpenEnumeration = () => {
    if (actionsLocked) {
      toast.warning(
        isGeneratingSubtitles
          ? 'Estamos generando subtítulos. Espera a que finalice para editar la enumeración.'
          : 'Este proyecto ya ha sido comprado. Duplícalo para modificarlo.'
      )
      return
    }
    onOpenEnumeration?.()
  }

  const handleOpenCover = () => {
    if (editingDisabled) {
      toast.warning('Este proyecto ya ha sido comprado. Duplícalo para modificarlo.')
      return
    }
    onOpenCover?.()
  }

  const handleDiscardChanges = () => {
    if (onDiscardChanges) {
      onDiscardChanges()
      return
    }

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
      {!hasPendingChanges && (
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-2"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-yellow-600" />
            ) : (
              <Play className="h-4 w-4 text-yellow-600" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenPresentation}
            className="inline-flex items-center gap-2"
            title="Presentación"
          >
            <MonitorPlay className="h-4 w-4 text-blue-700" />
            {'Presentación'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleOpenCover}
            className="inline-flex items-center gap-2"
            title="Portada"
            disabled={editingDisabled}
          >
            <ImageIcon className="h-4 w-4 text-indigo-700" />
            {'Portada'}
          </Button>
        </>
      )}

      {showActionButtons && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleInsertClick}
            aria-disabled={actionsLocked}
            disabled={actionsLocked}
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
            onClick={handleInsertImageClick}
            aria-disabled={actionsLocked}
            disabled={actionsLocked}
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
            disabled={actionsLocked}
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
            disabled={actionsLocked}
            aria-label="Subtítulos"
            className="inline-flex items-center gap-2"
          >
            <Captions className="h-4 w-4 text-fuchsia-600" />
            <span className="hidden sm:inline">
              {isGeneratingSubtitles ? 'Generando…' : 'Añadir subtítulos'}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={hasFrame ? onEditFrame ?? handleInsertFrame : handleInsertFrame}
            aria-disabled={actionsLocked}
            disabled={actionsLocked}
            aria-label={hasFrame ? 'Editar marco' : 'Insertar marco'}
            className={`
              inline-flex items-center gap-2
              ${actionsLocked ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <FrameIcon className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">{hasFrame ? 'Editar marco' : 'Insertar marco'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleOpenEnumeration}
            aria-disabled={actionsLocked}
            disabled={actionsLocked}
            aria-label="Enumeración"
            className={`
              inline-flex items-center gap-2
              ${actionsLocked ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <Hash className="h-4 w-4 text-slate-700" />
            <span className="hidden sm:inline">Enumeración</span>
          </Button>
        </>
      )}

      {hasPendingChanges && (
        <div className="flex w-full items-center justify-center gap-2 md:justify-start">
          <RecoverDeletedButton
            onClick={handleDiscardChanges}
            disabled={isSaving || isGeneratingSubtitles}
          />

          <SaveChangesButton
            onClick={onSave}
            disabled={!canSave || isSaving || isGeneratingSubtitles}
            isSaving={isSaving}
          />
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
