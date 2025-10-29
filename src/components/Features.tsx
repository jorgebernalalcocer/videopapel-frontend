// src/components/Features.tsx
export default function Features() {
  const items = [
    {
      title: "Editor en tiempo real",
      desc: "Arrastra, recorta y aplica efectos con un lienzo colaborativo que guarda cambios automáticamente y muestra la resolución de salida.",
    },
    {
      title: "Gestión de color profesional",
      desc: "Perfiles ICC personalizados, pruebas soft-proofing y validación CMYK para que tus piezas salgan idénticas a pantalla.",
    },
    {
      title: "Logística en 48 horas",
      desc: "Plazos garantizados con tracking en toda la UE, embalaje sostenible y opciones de dropshipping con tu branding.",
    },
  ]

  return (
    <section id="caracteristicas" className="mx-auto max-w-6xl px-6 py-20">
      <header className="max-w-3xl">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Diseñado para creativos, tiendas online y equipos de marketing exigentes
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          VideoPapel combina un editor cloud, perfiles de impresión certificados y logística expres para
          que transformes tus campañas en impresiones tangibles sin fricciones técnicas.
        </p>
      </header>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((f) => (
          <article
            key={f.title}
            className="h-full rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{f.title}</h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
