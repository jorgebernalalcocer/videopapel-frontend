// src/components/Menu.tsx
'use client'

import Link from 'next/link'
import {
  Children,
  isValidElement,
  ReactNode,
  useEffect,
  useState,
} from 'react'
import { useAuth } from '@/store/auth'
import LoginButton from '@/components/LoginButton'
import RegisterButton from '@/components/RegisterButton'
// import LogoutButton from '@/components/LogoutButton'
import ClipsButton from '@/components/ClipsButton'
import ProjectsButton from '@/components/ProjectsButton'
import OrdersButton from './OrdersButton'
import ProfileButton from '@/components/ProfileButton'
import CartButtonIcon from '@/components/CartButtonIcon'
import CartButtonString from '@/components/CartButtonString'
import { Menu as MenuIcon, X } from 'lucide-react' // Importar iconos
import { pacifico, pacificoFontStack } from '@/fonts/pacifico'
import { fascinate, fascinateFontStack } from '@/fonts/fascinate'
import { borelFontStack } from '@/fonts/borel'
import { cookieFontStack } from '@/fonts/cookie'
import BookLogo from './BookLogo'

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
<header className="sticky top-0 inset-x-0 h-16 w-full border-b bg-white/90 backdrop-blur flex items-center justify-between px-4 z-50">
{/* <Link
  href="/"
  className={`flex items-center gap-4 ml-1 ${pacifico.className} text-lg font-semibold leading-none`}
  style={{ fontFamily: pacificoFontStack, fontSize: '2rem', lineHeight: 2}}
  onClick={() => setIsMobileMenuOpen(false)}
>  
  <span className="block px-1 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500">
    papel video

  </span>
</Link> */}
<Link
  href="/"
  className={`flex items-center gap-4 ml-1 ${fascinate.className} text-lg font-semibold leading-none`}
  style={{ fontFamily: fascinateFontStack, fontSize: '2rem', lineHeight: 2}}
  onClick={() => setIsMobileMenuOpen(false)}
>  
  <span className="block px-1 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500">
    papel video

  </span>
</Link>
{/* <Link
  href="/"
  className={`flex items-center gap-4 ml-1 ${pacifico.className} text-lg font-semibold leading-none`}
  style={{ fontFamily: pacificoFontStack, fontSize: '2rem', lineHeight: 2}}
  onClick={() => setIsMobileMenuOpen(false)}
>
  <span className="block px-1 text-[#c6613f]">
    papel video
  </span>
</Link> */}
{/* <Link
  href="/"
  className={`flex items-center gap-4 ml-1 ${fascinate.className} text-lg font-semibold leading-none`}
  style={{ fontFamily: fascinateFontStack, fontSize: '2rem', lineHeight: 2}}
  onClick={() => setIsMobileMenuOpen(false)}
>
  <span className="block px-1 text-[#CB5FED]">
    papel video
  </span>
</Link> */}

      {/* Navegación de ESCRITORIO (visible desde 'md' hacia arriba) */}
      <nav className="hidden md:flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              Hola {user.email}
            </span>
            <ProjectsButton />
            <ClipsButton />
            <OrdersButton />
            {/* <CartButtonIcon /> */}
                            <CartButtonString />

            <ProfileButton />
            
            {/* <LogoutButton /> */}
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
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
      </button>

      {/* Panel de Menú MÓVIL */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden absolute top-16 left-0 w-full bg-white border-b shadow-lg shadow-black/5"
        >
          {/* Envolvemos los botones en un componente simple 
            para que al hacer clic en ellos se cierre el menú.
          */}
          <MobileMenuWrapper closeMenu={() => setIsMobileMenuOpen(false)}>
            {user ? (
              <>
                {/* <span className="text-sm text-gray-600 px-4 pt-2">
                  Hola {user.email}
                </span> */}
                <ProjectsButton />
                <ClipsButton />
                
                <OrdersButton />
                
                <CartButtonString />
                <ProfileButton />
                {/* <LogoutButton /> */}
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
  children: ReactNode,
  closeMenu: () => void
}) {
  const childrenArray = Children.toArray(children);

  return (
    <nav className="flex flex-col gap-1 p-4">
      {childrenArray.map((child, index) => {
        if (!isValidElement(child)) return child

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
