// src/components/Menu.tsx
'use client'

import Link from 'next/link'
import {
  Children,
  isValidElement,
  type ElementType,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useAuth } from '@/store/auth'
import LoginButton from '@/components/LoginButton'
import RegisterButton from '@/components/RegisterButton'
// import LogoutButton from '@/components/LogoutButton'
import ClipsButton from '@/components/ClipsButton'
import EventsButton from '@/components/EventsButton'
import ProjectsButton from '@/components/ProjectsButton'
import OrdersButton from './OrdersButton'
import ProfileButton from '@/components/ProfileButton'
import CartButtonIcon from '@/components/CartButtonIcon'
import CartButtonString from '@/components/CartButtonString'
import { LogIn, Menu as MenuIcon, Minimize, UserPlus, X } from 'lucide-react' // Importar iconos
import { pacifico, pacificoFontStack } from '@/fonts/pacifico'
import { fascinate, fascinateFontStack } from '@/fonts/fascinate'
import { borelFontStack } from '@/fonts/borel'
import { cookieFontStack } from '@/fonts/cookie'
import BookLogo from './BookLogo'
import AnimatedLogo from '@/components/AnimatedLogoType'
import ProfileActionCards from '@/components/profile/ProfileActionCards'
// import '@/styles/animated-logo-type.css'

type MobileGuestActionCardProps = {
  href: string
  label: string
  icon: ElementType
  iconClassName: string
  cardClassName: string
  textClassName: string
  onClick: () => void
}

function MobileGuestActionCard({
  href,
  label,
  icon: Icon,
  iconClassName,
  cardClassName,
  textClassName,
  onClick,
}: MobileGuestActionCardProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex aspect-square flex-col items-center justify-center rounded-xl border p-4 text-center shadow-sm transition hover:shadow-md ${cardClassName}`}
    >
      <Icon className={`mb-2 h-8 w-8 ${iconClassName}`} />
      <span className={`text-sm font-medium ${textClassName}`}>{label}</span>
    </Link>
  )
}

export default function Menu() {
  // Estado para controlar la apertura del menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [companiesCount, setCompaniesCount] = useState(0)

  // Fuerza la rehidratación del store persistido (evita flicker)
  useEffect(() => {
    // @ts-ignore - propiedad añadida por zustand/persist
    useAuth.persist.rehydrate?.()
  }, [])

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const user = useAuth((s) => s.user)
  const accessToken = useAuth((s) => s.accessToken)
  const canRequest = Boolean(accessToken)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE!

  const fetchCompaniesCount = useCallback(async () => {
    if (!canRequest || !accessToken) {
      setCompaniesCount(0)
      return
    }

    try {
      const res = await fetch(`${apiBase}/companies/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }

      const payload = await res.json()
      const companies = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : []

      setCompaniesCount(companies.length)
    } catch {
      setCompaniesCount(0)
    }
  }, [accessToken, apiBase, canRequest])

  useEffect(() => {
    if (user) {
      void fetchCompaniesCount()
    } else {
      setCompaniesCount(0)
    }
  }, [fetchCompaniesCount, user])

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
  className={`flex items-center gap-4 ml-1 ${fascinate.className} text-lg font-semibold leading-none`}
  style={{ fontFamily: fascinateFontStack, fontSize: '2rem', lineHeight: 2}}
  onClick={() => setIsMobileMenuOpen(false)}
>  
  <span className="block px-1 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500">
    papel video

  </span>
</Link> */}

<Link
  href="/"
  className={`flex items-center gap-4 ml-1 ${fascinate.className} font-semibold leading-none`}
  style={{ 
    fontFamily: fascinateFontStack, 
    fontSize: '2rem', 
    lineHeight: 2,
    /* Aplicamos el color directamente aquí o mediante Tailwind */
    color: '#78ad70' 
  }}
  onClick={() => setIsMobileMenuOpen(false)}
>  
  <span className="block px-1">
    papel video
  </span>
</Link>


  {/* <AnimatedLogo /> */}


      {/* Navegación de ESCRITORIO (visible desde 'md' hacia arriba) */}
      <nav className="hidden md:flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              Hola {user.email}
            </span>
            <ProjectsButton />
            <EventsButton />
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
          className="md:hidden absolute top-16 left-0 w-full min-h-[calc(100vh-4rem)] bg-white border-b shadow-lg shadow-black/5 overflow-y-auto"
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
                <ProfileActionCards
                  className="grid grid-cols-2 gap-3 pb-3"
                  onCardClick={() => setIsMobileMenuOpen(false)}
                  showProfileCard
                  profileCardFirst
                  companiesCount={companiesCount}
                />
                {/* <ProjectsButton />
                <ClipsButton />
                
                <OrdersButton />
                
                <CartButtonString />
                <ProfileButton /> */}
                {/* <LogoutButton /> */}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-3">
                <MobileGuestActionCard
                  href="/login"
                  label="Iniciar sesión"
                  icon={LogIn}
                  iconClassName="text-sky-700"
                  cardClassName="bg-sky-50 border-sky-100"
                  textClassName="text-sky-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <MobileGuestActionCard
                  href="/register"
                  label="Registrarse"
                  icon={UserPlus}
                  iconClassName="text-emerald-700"
                  cardClassName="bg-emerald-50 border-emerald-100"
                  textClassName="text-emerald-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>
            )}
          </MobileMenuWrapper>
          <div className="flex justify-center pb-4">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Cerrar menú"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <Minimize size={35} />
            </button>
          </div>
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
