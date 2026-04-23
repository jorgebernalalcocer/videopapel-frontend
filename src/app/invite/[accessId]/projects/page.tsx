'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import MyProjects from '@/components/MyProjects'

export default function InviteAccessProjectsPage({
  params,
}: {
  params: Promise<{ accessId: string }>
}) {
  const { accessId } = use(params)
  const searchParams = useSearchParams()
  const clientName = (searchParams.get('client_name') || '').trim()
  const title = clientName ? `Proyectos de ${clientName}` : 'Proyectos del cliente'
  const emptyMessage = clientName
    ? `Todavía no hay proyectos vinculados a los videos de ${clientName}.`
    : 'Todavía no hay proyectos vinculados a los videos de este cliente.'

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <Link href="/invite" className="mb-4 inline-flex text-sm text-gray-500 hover:text-gray-900">
            Volver a invitaciones
          </Link>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-amber-700" />
            <div>
              <h1 className="text-3xl font-semibold text-grey-600">{title}</h1>
              <p className="text-sm text-gray-500">Muestra los proyectos que usan videos subidos por este acceso temporal.</p>
            </div>
          </div>
        </div>

        <MyProjects
          fetchPath={`/company-guest-accesses/${accessId}/projects/`}
          emptyMessage={emptyMessage}
          searchPlaceholder="Buscar proyectos vinculados a este cliente..."
        />
      </div>
    </main>
  )
}
