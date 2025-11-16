// src/components/ShareModal.tsx
'use client'

import React, { useCallback, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { type Project } from './MyProjects' // Importa el tipo Project
import { Facebook, Instagram, Share2, X as XIcon, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

type ShareModalProps = {
  project: Project | null
  onClose: () => void
}

/**
 * Muestra la modal con opciones para compartir el enlace de un proyecto público.
 */
export function ShareModal({ project, onClose }: ShareModalProps) {
  if (!project || !project.is_public) return null

  const PROJECT_URL = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/projects/${project.id}`
  }, [project.id])

  const PROJECT_TITLE = project.name || 'Proyecto de VideoPapel'
  const PROJECT_TEXT = `Mira mi proyecto de VideoPapel: ${PROJECT_TITLE}`

  // Función para abrir enlaces de compartir
  const openShareWindow = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400')
  }, [])

  // Función para copiar el enlace
  const copyLink = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(PROJECT_URL)
        toast.success('Enlace del proyecto copiado al portapapeles.')
      } else {
        const input = document.createElement('input')
        input.value = PROJECT_URL
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        toast.success('Enlace del proyecto copiado al portapapeles.')
      }
    } catch (err: any) {
      toast.error('No se pudo copiar el enlace.')
    }
  }, [PROJECT_URL])


  // Lista de opciones de compartir
  const shareOptions = useMemo(() => [
    {
      name: 'Copiar enlace',
      icon: <LinkIcon className="w-5 h-5" />,
      action: copyLink,
      color: 'bg-gray-500 hover:bg-gray-600',
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      action: () => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PROJECT_URL)}&quote=${encodeURIComponent(PROJECT_TEXT)}`),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'X (Twitter)',
      icon: <XIcon className="w-5 h-5" />,
      action: () => openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(PROJECT_URL)}&text=${encodeURIComponent(PROJECT_TEXT)}`),
      color: 'bg-black hover:bg-gray-800',
    },
    {
      name: 'WhatsApp',
      icon: null, // Sin icono Lucide
      action: () => openShareWindow(`https://wa.me/?text=${encodeURIComponent(PROJECT_TEXT + ' ' + PROJECT_URL)}`),
      color: 'bg-green-500 hover:bg-green-600',
      text: 'WhatsApp',
    },
    {
      name: 'Telegram',
      icon: null, // Sin icono Lucide
      action: () => openShareWindow(`https://t.me/share/url?url=${encodeURIComponent(PROJECT_URL)}&text=${encodeURIComponent(PROJECT_TEXT)}`),
      color: 'bg-blue-400 hover:bg-blue-500',
      text: 'Telegram',
    },
    {
      name: 'Instagram',
      icon: <Instagram className="w-5 h-5" />,
      // Instagram no tiene una URL de compartición directa como otras, pero podemos dirigir a la web.
      // Generalmente se pide al usuario copiar el enlace para compartir en la aplicación.
      action: copyLink, 
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      name: 'TikTok',
      icon: null, // Sin icono Lucide
      // TikTok tampoco tiene una URL de compartición directa.
      action: copyLink, 
      color: 'bg-black hover:bg-gray-800',
      text: 'TikTok',
    },
    {
      name: 'Compartir nativo',
      icon: <Share2 className="w-5 h-5" />,
      action: async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: PROJECT_TITLE,
              text: PROJECT_TEXT,
              url: PROJECT_URL,
            })
          } catch (err: any) {
            if (err?.name !== 'AbortError') {
              toast.error('Error al usar el compartir nativo.')
            }
          }
        } else {
          toast.info('Compartir nativo no disponible. Copiando enlace...')
          void copyLink()
        }
      },
      color: 'bg-blue-500 hover:bg-blue-600',
    },
  ], [PROJECT_URL, PROJECT_TEXT, openShareWindow, copyLink])

  return (
    <Modal
      open={Boolean(project)}
      onClose={onClose}
      title={`Compartir proyecto: ${project.name || project.id}`}
      description="Selecciona la plataforma en la que deseas compartir tu proyecto."
      size="md"
      contentClassName="p-0" // Quitar padding del content para usarlo en el grid
    >
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
            {shareOptions.map((option) => (
                <button
                    key={option.name}
                    type="button"
                    onClick={option.action}
                    className={`
                        flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg text-white transition
                        ${option.color}
                    `}
                >
                    {option.icon}
                    {option.text || option.name}
                </button>
            ))}
            <a
                href={PROJECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg border text-gray-700 hover:bg-gray-50 transition"
            >
                Ver página del proyecto <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    </Modal>
  )
}