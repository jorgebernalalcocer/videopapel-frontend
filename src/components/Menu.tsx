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
import CartButtonString from '@/components/CartButtonString'
import { LogIn, Menu as MenuIcon, Minimize, UserPlus, X } from 'lucide-react'
import { fascinate, fascinateFontStack } from '@/fonts/fascinate'
import ProfileActionCards from '@/components/profile/ProfileActionCards'

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
      className={`flex aspect-square min-h-[140px] flex-col items-center justify-center rounded-xl border p-4 text-center shadow-sm transition hover:shadow-md ${cardClassName}`}
    >
      <Icon className={`mb-2 h-8 w-8 ${iconClassName}`} />
      <span className={`text-sm font-medium ${textClassName}`}>{label}</span>
    </Link>
  )
}

export default function Menu() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [companiesCount, setCompaniesCount] = useState(0)

  useEffect(() => {
    // @ts-ignore - propiedad añadida por zustand/persist
    useAuth.persist.rehydrate?.()
  }, [])

  const hasHydrated = useAuth((s) => s.hasHydrated)
  const user = useAuth((s) => s.user)
  const accessToken = useAuth((s) => s.accessToken)
  const canRequest = Boolean(accessToken)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE!
  const isCompanyGuest = user?.actor_type === 'company_guest'
  const userLabel =
    isCompanyGuest
      ? `@${(user.company_name || '').trim().toLowerCase() || 'empresa'}`
      : user?.email || ''

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

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileMenuOpen])

  if (!hasHydrated) {
    return (
      <header className="flex h-16 w-full items-center justify-between border-b bg-white/80 px-4 backdrop-blur" />
    )
  }

  return (
    <>
      <header className="sticky inset-x-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-white/90 px-4 backdrop-blur">
        <Link
          href="/"
          className={`ml-1 flex items-center gap-4 font-semibold leading-none ${fascinate.className}`}
          style={{
            fontFamily: fascinateFontStack,
            fontSize: '2rem',
            lineHeight: 2,
            color: '#78ad70',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="block px-1">papel video</span>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hola {userLabel}</span>
              <ProjectsButton />
              <ClipsButton />
              {!isCompanyGuest ? (
                <>
                  <EventsButton />
                  <OrdersButton />
                  <CartButtonString />
                  <ProfileButton />
                </>
              ) : null}
            </>
          ) : (
            <>
              <LoginButton />
              <RegisterButton />
            </>
          )}
        </nav>

        <button
          className="p-2 md:hidden"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          type="button"
        >
          {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-40 bg-white md:hidden"
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <MobileMenuWrapper closeMenu={() => setIsMobileMenuOpen(false)}>
                {user ? (
                  <ProfileActionCards
                    className="grid grid-cols-2 gap-3"
                    onCardClick={() => setIsMobileMenuOpen(false)}
                    showProfileCard
                    companiesCount={companiesCount}
                    guestRestricted={isCompanyGuest}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <MobileGuestActionCard
                      href="/login"
                      label="Iniciar sesión"
                      icon={LogIn}
                      iconClassName="text-sky-700"
                      cardClassName="border-sky-100 bg-sky-50"
                      textClassName="text-sky-900"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <MobileGuestActionCard
                      href="/register"
                      label="Registrarse"
                      icon={UserPlus}
                      iconClassName="text-emerald-700"
                      cardClassName="border-emerald-100 bg-emerald-50"
                      textClassName="text-emerald-900"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  </div>
                )}
              </MobileMenuWrapper>
            </div>

            <div
              className="border-t bg-white px-4 pb-4 pt-3"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex justify-center">
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
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Contenedor del menú móvil.
 * Mantiene padding y asegura que el contenido pueda hacer scroll sin cortar la última card.
 */
function MobileMenuWrapper({
  children,
  closeMenu,
}: {
  children: ReactNode
  closeMenu: () => void
}) {
  const childrenArray = Children.toArray(children)

  return (
    <nav
      className="flex flex-col gap-3 p-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {childrenArray.map((child, index) => {
        if (!isValidElement(child)) return child

        return (
          <div
            key={index}
            onClick={closeMenu}
            className="w-full [&>*]:w-full"
          >
            {child}
          </div>
        )
      })}
    </nav>
  )
}
