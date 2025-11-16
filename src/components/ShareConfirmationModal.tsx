// src/components/ShareConfirmationModal.tsx
'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal' // ⭐️ Importa tu Modal base
import type { Project } from './MyProjects' // ⭐️ Importa el tipo Project

type ShareConfirmationModalProps = {
  project: Project | null
  onClose: () => void
  onMakePublic: (project: Project) => Promise<void> // Función para hacerlo público
  isUpdating: boolean // Indica si se está actualizando la privacidad
}

/**
 * Modal de confirmación que pregunta si el usuario quiere hacer público
 * un proyecto privado antes de compartirlo.
 */
export function ShareConfirmationModal({
  project,
  onClose,
  onMakePublic,
  isUpdating,
}: ShareConfirmationModalProps) {
  if (!project) return null

  return (
    <Modal
      open={Boolean(project)}
      onClose={onClose}
      title="No puedes compartir un proyecto privado"
      description="¿Deseas hacerlo público para poder compartirlo?"
      size="sm" // Un tamaño más pequeño es apropiado para un modal de confirmación
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          disabled={isUpdating}
        >
          Mantener privado
        </button>
        <button
          type="button"
          onClick={() => void onMakePublic(project)} // Llama a onMakePublic con el proyecto
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          disabled={isUpdating}
        >
          {isUpdating ? 'Actualizando…' : 'Publicar'}
        </button>
      </div>
    </Modal>
  )
}