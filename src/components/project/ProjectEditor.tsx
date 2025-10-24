// src/components/ProjectEditor.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/store/auth'
import EditingCanvas from '@/components/project/EditingCanvas'

// Define el tipo de dato del Proyecto, incluyendo el UUID (string)
type Project = {
  id: string
  name: string | null
  owner_id: number
  status: string
  created_at: string
  // Añade aquí cualquier otro campo que necesites del modelo Project
  // Por ejemplo, detalles del clip principal o configuraciones
}

interface ProjectEditorProps {
  projectId: string // El UUID del proyecto
}

export default function ProjectEditor({ projectId }: ProjectEditorProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)

  // 1. Función para cargar los datos del proyecto
  const fetchProject = useCallback(async () => {
    if (!accessToken || !projectId) return

    setLoading(true)
    setError(null)

    // Usamos el UUID para el endpoint de detalle
    const url = `${API_BASE}/projects/${projectId}/`

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })

      console.log('Fetch project response status:', res.status)

      if (res.status === 404) {
        // Manejar el caso de proyecto no encontrado
        throw new Error('Proyecto no encontrado (404)')
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Error ${res.status}: ${text || 'Fallo al cargar el proyecto'}`)
      }

      setProject(await res.json())

    } catch (e: any) {
      setError(e.message || 'Error al cargar los detalles del proyecto.')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, accessToken, projectId])

  // 2. Ejecutar la carga al montar y si cambia el ID o el token
  useEffect(() => {
    fetchProject()
  }, [fetchProject])


  // --- Renderizado de estados ---

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold text-gray-700">Cargando proyecto...</p>
        <p className="text-sm text-gray-500">ID: {projectId}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-600">Error</h2>
        <p className="text-sm text-red-700 mt-2">{error}</p>
      </div>
    )
  }

  if (!project) {
    // Esto no debería suceder si el 404 se manejó en el error, pero es un buen fallback
    return (
        <div className="p-8 text-center">
            <p className="text-xl font-semibold text-gray-700">Proyecto no disponible.</p>
        </div>
    )
  }


  // --- Interfaz Principal del Editor ---

  return (
    <div className="w-full h-full p-4 bg-gray-50">
      <header className="mb-6 border-b pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Editor: {project.name || 'Proyecto sin nombre'}
        </h1>
        <div className="text-sm text-gray-500">
          Estado: <span className={`font-medium ${project.status === 'draft' ? 'text-blue-500' : 'text-green-600'}`}>
            {project.status.toUpperCase()}
          </span>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 🚀 Zona principal de edición / previsualización aquí */}
      {/* ---------------------------------------------------- */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna 1: Visor del Proyecto */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Previsualización y Edición de Clips</h2>
{/* Previsualización y Edición de Clips */}
<div className="aspect-video bg-black rounded-lg mb-4 p-2">
  {project && (project as any).primary_clip ? (
    <EditingCanvas
      videoSrc={(project as any).primary_clip.video_url}
      durationMs={(project as any).primary_clip.duration_ms}
      initialTimeMs={(project as any).primary_clip.time_start_ms ?? 0}
      onChange={(ms) => {
        // Aquí puedes guardar selección temporal, o preparar recorte
        // console.log('Selected frame at', ms, 'ms')
      }}
    />
  ) : (
    <div className="h-full w-full grid place-items-center text-white/50">
      No hay clip principal
    </div>
  )}
</div>

          
          {/* Timeline de Clips */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Clips en el Proyecto</h3>
            {/* Componente para manejar ProjectClip list y ordering */}
            <div className="bg-gray-100 p-3 rounded-md min-h-[100px]">
              [ProjectClipList / Timeline Component]
            </div>
          </div>
        </div>

        {/* Columna 2: Configuración y Propiedades */}
        <aside className="lg:col-span-1 space-y-6">
          
          {/* Panel de Configuración de Impresión */}
          <div className="bg-white rounded-xl shadow p-4 border">
            <h2 className="text-xl font-semibold mb-3">Configuración de Salida</h2>
            <div className="space-y-3 text-sm">
              <p>Tamaño: [Select PrintSize]</p>
              <p>Calidad: [Select PrintQuality]</p>
              <p>Efecto: [Select Effect]</p>
              <p>Orientación: [Select Orientation]</p>
              
              <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-purple-700 transition">
                Guardar Cambios
              </button>
            </div>
          </div>

          {/* Panel de Exportación */}
          <div className="bg-green-50 border border-green-200 rounded-xl shadow-md p-4">
            <h2 className="text-xl font-semibold mb-3 text-green-800">Exportar y Comprar</h2>
            <button className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
              Generar PDF / Iniciar Compra
            </button>
            <p className="text-xs text-green-700 mt-2">
              Se utilizarán los clips y configuraciones actuales.
            </p>
          </div>
        </aside>
      </div>
      
    </div>
  )
}