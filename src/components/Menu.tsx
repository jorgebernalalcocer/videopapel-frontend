'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import LoginButton from '@/components/LoginButton'
import RegisterButton from '@/components/RegisterButton'
import { useAuth } from '@/store/auth'

export default function Menu() {
  // 1) Hooks SIEMPRE primero y SIEMPRE en el mismo orden
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // 2) Para evitar el “flash”, ocultamos visualmente hasta hidratar
  return (
    <header className={`bg-blue-400 text-white p-4 flex justify-between items-center ${mounted ? '' : 'invisible'}`}>
      <h1 className="text-xl font-semibold">VideoPapel</h1>
      <nav className="space-x-4">
        <a href="#" className="hover:underline">Inicio</a>

        {!user ? (
          <>
            <LoginButton />
            <RegisterButton />
          </>
        ) : (
          <Button variant="secondary" onClick={logout}>
            Cerrar sesión
          </Button>
        )}
      </nav>
    </header>
  )
}
