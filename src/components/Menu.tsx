// src/components/Menu.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/auth'

export default function Menu() {
  const router = useRouter()

  // Fuerza la rehidratación del store persistido (evita flicker)
  useEffect(() => {
    // @ts-ignore - propiedad añadida por zustand/persist
    useAuth.persist.rehydrate?.()
  }, [])

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const user = useAuth((s) => s.user)
  const doLogout = useAuth((s) => s.logout)

  const handleLogout = useCallback(async () => {
    await doLogout()
    router.push('/') // navegación correcta en Next.js (sin window.location)
  }, [doLogout, router])

  // Placeholder con misma altura mientras hidrata (evita saltos visuales)
  if (!hasHydrated) {
    return (
      <header className="h-16 w-full border-b bg-white/80 backdrop-blur flex items-center justify-between px-4" />
    )
  }

  return (
    <header className="h-16 w-full border-b bg-white/80 backdrop-blur flex items-center justify-between px-4">
      <Link href="/" className="text-lg font-semibold">VideoPapel</Link>

      <nav className="flex items-center gap-3">
        {/* <Link href="/" className="text-sm hover:underline">Inicio</Link>
        <Link href="/productos" className="text-sm hover:underline">Productos</Link>
        <Link href="/contacto" className="text-sm hover:underline">Contacto</Link> */}

        {user ? (
          <>
            <span className="hidden sm:inline text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="secondary">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
