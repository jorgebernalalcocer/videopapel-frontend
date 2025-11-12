// src/components/Menu.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react' // Importar useState
import { useAuth } from '@/store/auth'
import LoginButton from '@/components/LoginButton'
import RegisterButton from '@/components/RegisterButton'
import LogoutButton from '@/components/LogoutButton'
import ClipsButton from '@/components/ClipsButton'
import ProjectsButton from '@/components/ProjectsButton'
import ProfileButton from '@/components/ProfileButton'
import { Menu as MenuIcon, X } from 'lucide-react' // Importar iconos

export default function Menu() {
  // Estado para controlar la apertura del menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fuerza la rehidratación del store persistido (evita flicker)
  useEffect(() => {
    // @ts-ignore - propiedad añadida por zustand/persist
    useAuth.persist.rehydrate?.()
  }, [])

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const user = useAuth((s) => s.user)

  // Skeleton mientras se hidrata
  if (!hasHydrated) {
    return (
      <header className="h-16 w-full border-b bg-white/80 backdrop-blur flex items-center justify-between px-4" />
    )
  }

  return (
    // Añadimos 'relative' para que el menú móvil absoluto se posicione correctamente
    <header className="relative h-16 w-full border-b bg-white/80 backdrop-blur flex items-center justify-between px-4 z-50">
      <Link
        href="/"
        className="text-lg font-semibold"
        onClick={() => setIsMobileMenuOpen(false)} // Cerrar menú al ir a Home
      >
        VideoPapel
      </Link>

      {/* Navegación de ESCRITORIO (visible desde 'md' hacia arriba) */}
      <nav className="hidden md:flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              Hola {user.email}
            </span>
            <ClipsButton />
            <ProjectsButton />
            <ProfileButton />
            <LogoutButton />
          </>
        ) : (
          <>
            <LoginButton />
            <RegisterButton />
          </>
        )}
      </nav>

      {/* Botón de Hamburguesa (visible SÓLO en 'md' hacia abajo) */}
      <button
        className="md:hidden p-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Abrir menú"
      >
        {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
      </button>

      {/* Panel de Menú MÓVIL */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden absolute top-16 left-0 w-full bg-white border-b shadow-lg"
        >
          {/* Envolvemos los botones en un componente simple 
            para que al hacer clic en ellos se cierre el menú.
          */}
          <MobileMenuWrapper closeMenu={() => setIsMobileMenuOpen(false)}>
            {user ? (
              <>
                <span className="text-sm text-gray-600 px-4 pt-2">
                  Hola {user.email}
                </span>
                <ClipsButton />
                <ProjectsButton />
                <LogoutButton />
              </>
            ) : (
              <>
                <LoginButton />
                <RegisterButton />
              </>
            )}
          </MobileMenuWrapper>
        </div>
      )}
    </header>
  )
}

/**
 * Componente contenedor para los botones del menú móvil.
 * Clona sus hijos y les añade un 'onClick' para cerrar el menú.
 * También les aplica estilos para que sean verticales.
 */
function MobileMenuWrapper({ children, closeMenu }: {
  children: React.ReactNode,
  closeMenu: () => void
}) {
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <nav className="flex flex-col gap-1 p-4">
      {childrenArray.map((child, index) => {
        if (child.type === 'span') return child; // No modificar el 'span'

        return (
          <div
            key={index}
            onClick={closeMenu}
            className="w-full [&>*]:w-full" // Aplica 'w-full' al hijo directo
          >
            {child}
          </div>
        )
      })}
    </nav>
  )
}