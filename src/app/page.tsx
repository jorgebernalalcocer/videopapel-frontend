// app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import Hero from "@/components/Hero";
import Features from "@/components/Features"; // si lo creas

// --- SEO ---
export const metadata = {
  title: "VideoPapel – Impresión personalizada de alta calidad | Diseña, visualiza y pide online",
  description:
    "Crea productos de impresión personalizados con facilidad. Diseña, visualiza en tiempo real y solicita impresiones de alta calidad para tu marca u hogar.",
  keywords: [
    "impresión personalizada",
    "diseño online",
    "tarjetas de visita",
    "láminas personalizadas",
    "papelería corporativa",
    "posters",
    "VideoPapel",
  ],
  metadataBase: new URL("https://www.videopapel.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VideoPapel – Impresión personalizada de alta calidad",
    description:
      "Diseña, visualiza y solicita impresiones premium con envíos rápidos.",
    url: "https://www.videopapel.com/",
    siteName: "VideoPapel",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og/videopapel-og.jpg",
        width: 1200,
        height: 630,
        alt: "VideoPapel – Impresión personalizada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VideoPapel – Impresión personalizada de alta calidad",
    description:
      "Diseña, visualiza y solicita impresiones premium con envíos rápidos.",
    images: ["/og/videopapel-og.jpg"],
    creator: "@videopapel",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// --- Constants ---
const features = [
  {
    title: "Editor en tiempo real",
    desc: "Visualiza tu diseño final al instante con nuestra previsualización interactiva.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <path d="M4 5a2 2 0 0 1 2-2h6l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z" className="fill-current opacity-20" />
        <path d="M8 13h8M8 17h5M13 3v5h5" className="stroke-current" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Perfiles de color pro",
    desc: "CMYK verificado y pruebas de color para resultados consistentes.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <circle cx="8" cy="8" r="4" className="fill-current opacity-20" />
        <circle cx="16" cy="8" r="4" className="fill-current opacity-40" />
        <circle cx="12" cy="16" r="4" className="fill-current opacity-60" />
      </svg>
    ),
  },
  {
    title: "Entrega rápida",
    desc: "Producción en 48h y envíos rastreables en toda España.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <path d="M3 6h12v8h6l-2-5h-4V6" className="stroke-current" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="7" cy="18" r="2" className="fill-current opacity-20" />
        <circle cx="17" cy="18" r="2" className="fill-current opacity-20" />
      </svg>
    ),
  },
];

// --- Lazy sections ---
function Gallery() {
  return (
    <section id="galeria" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-8">
        Inspírate con ejemplos reales
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
            <Image
              src={`/samples/sample-${i}.jpg`}
              alt={`Muestra de impresión ${i}`}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
              priority={i <= 2}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "¿Qué formatos aceptan?",
      a: "Aceptamos PDF/X-1a, PNG y SVG. Para fotos, JPG de alta calidad.",
    },
    {
      q: "¿Puedo pedir una prueba?",
      a: "Sí, puedes solicitar prueba de color impresa antes de la tirada.",
    },
    {
      q: "¿Hacen envíos internacionales?",
      a: "Actualmente enviamos dentro de la UE. Consulta plazos al pagar.",
    },
  ];
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 pb-24">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-8">
        Preguntas frecuentes
      </h2>
      <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
        {items.map((it) => (
          <details key={it.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-left">
              <span className="font-medium text-lg">{it.q}</span>
              <span className="transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-28">
      <div className="relative overflow-hidden rounded-3xl p-10 md:p-14 shadow-lg bg-gradient-to-tr from-fuchsia-500/20 via-sky-500/20 to-emerald-500/20 ring-1 ring-white/10">
        <div className="absolute -inset-1 bg-[radial-gradient(1000px_400px_at_0%_0%,rgba(255,255,255,0.06),transparent)]" aria-hidden />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3">
          ¿Listo para imprimir como un pro?
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300 mb-6">
          Empieza gratis. Sube tus artes finales y obtén una previsualización instantánea.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/editor" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold ring-1 ring-transparent bg-black text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black">
            Abrir editor
          </Link>
          <Link href="#precios" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/5">
            Ver precios
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <Hero />
      <Features />
      <Gallery />
      <FAQ />
      <CTA />
    </>
  )
}

// --- Accessibility & performance hints ---
// 1) Usa <html lang="es"> en app/layout.tsx y precarga fuentes con next/font.
// 2) Coloca imágenes OG/Twitter en /public/og/.
// 3) Habilita ISR con export const revalidate = 3600 si tu contenido cambia a menudo.
// 4) Añade sitemap.ts y robots.ts en /app. Ejemplo:
//    // app/robots.ts
//    export default function robots() { return { rules: { userAgent: '*', allow: '/' }, sitemap: 'https://www.videopapel.com/sitemap.xml' } }
//    // app/sitemap.ts
//    export default async function sitemap() { return [{ url: 'https://www.videopapel.com', lastModified: new Date() }] }
