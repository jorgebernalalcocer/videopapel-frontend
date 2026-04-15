'use client'

import Link from 'next/link'
import EventsButton from '@/components/EventsButton'

type EventsLandingSectionProps = {
  onCreated?: () => void | Promise<void>
  className?: string
}

export default function EventsLandingSection({
  onCreated,
  className,
}: EventsLandingSectionProps) {
  return (
    <section
      aria-labelledby="events-empty-title"
      className={[
        'overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50',
        className ?? '',
      ].join(' ')}
    >
      <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-10 lg:py-10">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
            Seccion de eventos
          </div>
          <div className="space-y-3">
            <h2 id="events-empty-title" className="max-w-2xl text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Organiza proyectos por bodas, marcas, ferias o cualquier evento en un solo lugar.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-gray-600">
              La seccion de eventos te permite agrupar proyectos relacionados, compartirlos con clientes o equipos
              y mantener cada entrega mejor ordenada dentro de Video Papel.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <EventsButton mode="create" onCreated={onCreated} />
            <Link
              href="/projects"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Ver mis proyectos
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Agrupa trabajos relacionados</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Reune en un mismo evento todos los proyectos que pertenecen a una celebracion, cliente o campana.
              </p>
            </article>
            <article className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Comparte con tu equipo</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Invita a otras personas para revisar, colaborar y mantener cada evento centralizado y accesible.
              </p>
            </article>
            <article className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm sm:col-span-2 xl:col-span-1">
              <h3 className="text-sm font-semibold text-gray-900">Prepara entregas con contexto</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Visualiza el conjunto de piezas de un evento antes de compartirlo, comprarlo o seguir editando.
              </p>
            </article>
          </div>
        </div>

        <aside className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Como funciona el archivo de eventos</h3>
          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">1. Crea un evento</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Define un nombre y una descripcion para identificar rapidamente el contexto del trabajo.
              </p>
            </div>
            <div className="rounded-2xl bg-lime-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-700">2. Vincula proyectos</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Asocia proyectos existentes o crea nuevos directamente dentro del evento.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-700">3. Comparte o compra</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Gestiona colaboraciones, revisa el contenido y usa el evento como punto central de entrega.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
