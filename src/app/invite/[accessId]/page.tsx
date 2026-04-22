'use client'

import { use } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Film } from 'lucide-react'
import MyClips from '@/components/MyClips'

export default function InviteAccessVideosPage({
  params,
}: {
  params: Promise<{ accessId: string }>
}) {
  const { accessId } = use(params)
  const searchParams = useSearchParams()
  const clientName = (searchParams.get('client_name') || '').trim()
  const title = clientName ? `Videos de ${clientName}` : 'Videos del cliente'
  const emptyMessage = clientName
    ? `${clientName} todavía no ha subido ningún video.`
    : 'Este cliente todavía no ha subido ningún video.'

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <Link href="/invite" className="mb-4 inline-flex text-sm text-gray-500 hover:text-gray-900">
            Volver a invitaciones
          </Link>
          <div className="flex items-center gap-3">
            <Film className="h-8 w-8 text-red-700" />
            <div>
              <h1 className="text-3xl font-semibold text-grey-600">{title}</h1>
              <p className="text-sm text-gray-500">Muestra solo los videos subidos mediante esta invitación temporal.</p>
            </div>
          </div>
        </div>

        <MyClips
          fetchPath={`/company-guest-accesses/${accessId}/videos/`}
          title={title}
          emptyMessage={emptyMessage}
        />
      </div>
    </main>
  )
}
