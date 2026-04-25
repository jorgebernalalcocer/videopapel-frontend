// src/components/Hero.tsx
import Link from "next/link";
import { pacifico, pacificoFontStack } from '@/fonts/pacifico'
import { ColorActionButton } from "@/components/ui/color-action-button";
import { User, Scroll } from "lucide-react";
// import NewProjectButton from '@/components/NewProjectButton'




export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50 dark:from-black dark:via-black dark:to-emerald-950/30">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[48rem] w-[48rem] -translate-x-1/2 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-fuchsia-400 via-sky-400 to-emerald-400" />
        <div className="absolute top-1/2 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full blur-2xl opacity-20 bg-gradient-to-tr from-amber-300 to-pink-400" />
      </div>
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
          flipbook · impresión personalizada
        </p>
        <h1 className="mt-4 text-balance text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Impresión de videos en papel
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500">
            personalizados, listos para enviar
          </span>
        </h1>
        {/* <Link
  href="/"
  className={`flex items-center gap-4 ml-1 ${pacifico.className} text-lg font-semibold leading-none`}
  style={{ fontFamily: pacificoFontStack, fontSize: '2rem', lineHeight: 2}}
  onClick={() => setIsMobileMenuOpen(false)}
>  
  <span className="block px-1 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500">
    papel.video

  </span>
</Link> */}
        <p className="mt-6 max-w-2xl text-lg text-neutral-700 dark:text-neutral-300">
          Diseña, visualiza y solicita videos impresos. Previsualización en tiempo real,
          100% personalizable y entrega en casa.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3">
{/* Botón de Registro */}
{/* <Link href="/register" aria-label="Abrir el editor de VideoPapel">
    <ColorActionButton
      color="emerald" // O el color oscuro que use tu componente
      filled
      size="large"
      icon={User}
    >
      Registrarsee
    </ColorActionButton>
  </Link> */}
  {/* <NewProjectButton /> */}

  {/* Botón de Características */}
  <Link href="#caracteristicas">
    <ColorActionButton
      color="slate" // O el color con borde/claro que use tu componente
      size="large"
      icon={Scroll}
    >
      Ver características
    </ColorActionButton>
  </Link>
        </div>
        <ul className="mt-10 grid gap-2 text-sm text-neutral-600 dark:text-neutral-400 sm:grid-cols-2">
          <li>✔️ Soportes premium: papeles fotográficos</li>
          <li>✔️ Envío a toda España</li>
        </ul>
      </div>
    </section>
  );
}
