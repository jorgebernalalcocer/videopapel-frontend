import Link from 'next/link'
import type { Metadata } from 'next'

type PublicClip = {
  id: number
  position: number
  video_id: number
  video_title: string | null
  video_thumbnail: string | null
  video_url: string
  duration_ms: number
  time_start_ms: number
  time_end_ms: number
  frames: number[]
}

type PublicProjectResponse = {
  project: {
    id: string
    name: string | null
    created_at: string
    updated_at: string
    clip_count: number
  }
  clips: PublicClip[]
}

type PageProps = {
  params: Promise<{ projectId: string }>
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params
  const title = `Clips del proyecto ${projectId} · VideoPapel`
  return {
    title,
    description:
      'Visualiza los clips asociados a este proyecto de VideoPapel y reproduce los vídeos vinculados desde cualquier dispositivo.',
    alternates: {
      canonical: `/clips/${projectId}`,
    },
  }
}

async function fetchProjectClips(projectId: string): Promise<PublicProjectResponse> {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_BASE no está definido')
  }
  const res = await fetch(`${API_BASE}/projects/${projectId}/public-clips/`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('PROJECT_NOT_FOUND')
    }
    throw new Error(`FETCH_ERROR_${res.status}`)
  }
  return (await res.json()) as PublicProjectResponse
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default async function PublicClipsPage({ params }: PageProps) {
  const { projectId } = await params
  let data: PublicProjectResponse | null = null
  try {
    data = await fetchProjectClips(projectId)
  } catch (error: any) {
    const code = error?.message
    if (code === 'PROJECT_NOT_FOUND') {
      return (
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold">Proyecto no encontrado</h1>
          <p className="mt-3 text-neutral-600">
            Verifica que el código del proyecto sea correcto o contacta con VideoPapel si crees que es un error.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Volver a la página principal
          </Link>
        </main>
      )
    }
    throw error
  }

  const projectName = data.project.name || `Proyecto ${projectId}`

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-14">
      <header className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-600">VideoPapel</p>
        <h1 className="mt-3 text-balance text-3xl sm:text-4xl font-bold tracking-tight">{projectName}</h1>
        <p className="mt-3 text-neutral-600">
          Este proyecto contiene {data.project.clip_count === 1 ? '1 clip' : `${data.project.clip_count} clips`} de vídeo.
          Pulsa sobre cualquiera para reproducirlo.
        </p>
      </header>

      <section className="grid gap-8">
        {data.clips.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center text-neutral-500">
            Este proyecto todavía no tiene clips asociados.
          </p>
        ) : (
          data.clips.map((clip) => (
            <article key={clip.id} className="rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="grid gap-4 p-5 sm:grid-cols-[240px_1fr]">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
                  <video
                    controls
                    preload="metadata"
                    poster={clip.video_thumbnail || undefined}
                    src={clip.video_url}
                    className="h-full w-full rounded-xl bg-black object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {clip.video_title || `Clip #${clip.position}`}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Duración: {formatDuration(clip.duration_ms)} · Posición {clip.position}
                  </p>
                  {clip.frames.length > 0 && (
                    <p className="mt-3 text-sm text-neutral-600">
                      Este clip incluye {clip.frames.length} fotograma{clip.frames.length === 1 ? '' : 's'} destacados que
                      se usan para la impresión.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="mt-auto border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
        <p>
          ¿Quieres editar este proyecto?{' '}
          <Link href={`/projects/${data.project.id}`} className="font-semibold text-emerald-600 hover:underline">
            Accede a la versión completa de VideoPapel
          </Link>
        </p>
      </footer>
    </main>
  )
}
