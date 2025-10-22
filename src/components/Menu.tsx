// src/components/Menu.tsx
'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useAuth } from '@/store/auth'
import LoginButton from '@/components/LoginButton'
import RegisterButton from '@/components/RegisterButton'
import LogoutButton from '@/components/LogoutButton' 
import ClipsButton from '@/components/ClipsButton' 

export default function Menu() {
  // Fuerza la rehidratación del store persistido (evita flicker)
  useEffect(() => {
    // @ts-ignore - propiedad añadida por zustand/persist
    useAuth.persist.rehydrate?.()
  }, [])

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const user = useAuth((s) => s.user)

  if (!hasHydrated) {
    return (
      <header className="h-16 w-full border-b bg-white/80 backdrop-blur flex items-center justify-between px-4" />
    )
  }

  return (
    <header className="h-16 w-full border-b bg-white/80 backdrop-blur flex items-center justify-between px-4">
      <Link href="/" className="text-lg font-semibold">VideoPapel</Link>

      <nav className="flex items-center gap-3">
        {user ? (
          <>
            <span className="hidden sm:inline text-sm text-gray-600">
              Hola {user.email}
            </span>
            <ClipsButton />
            <LogoutButton />
          </>
        ) : (
          <>
            <LoginButton />
            <RegisterButton />
          </>
        )}
      </nav>
    </header>
  )
}
