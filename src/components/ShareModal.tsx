'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CircleX, Globe, Search, Users } from 'lucide-react'
import { toast } from 'sonner'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Modal } from '@/components/ui/Modal'
import { type Project } from './MyProjects'

type ShareModalProps = {
  project: Project | null
  onClose: () => void
  onProjectUpdated?: (project: Project) => void
}

type MembershipRole = 'edit' | 'view'
type ShareStep = 'shareInfo' | 'sharing'

type ProjectMembership = {
  id: number
  email: string
  role: MembershipRole
  role_label: string
  created_at: string
  updated_at: string
}

type ProjectInvitation = {
  token: string
  email: string
  role: MembershipRole
  role_label: string
  created_at: string
  expires_at: string | null
  accepted_at: string | null
}

type MembershipResponse = {
  project_id: string
  is_public: boolean
  memberships: ProjectMembership[]
  invitations?: ProjectInvitation[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
]

function avatarColorFor(value: string) {
  const seed = Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_COLORS[seed % AVATAR_COLORS.length]
}

function emailInitial(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed[0].toUpperCase() : '?'
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback
  if ('detail' in payload && typeof payload.detail === 'string') return payload.detail
  if ('email' in payload && Array.isArray(payload.email) && typeof payload.email[0] === 'string') {
    return payload.email[0]
  }
  return fallback
}

export function ShareModal({ project, onClose, onProjectUpdated }: ShareModalProps) {
  const user = useAuth((state) => state.user)
  const [step, setStep] = useState<ShareStep>('shareInfo')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MembershipRole>('edit')
  const [message, setMessage] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [memberships, setMemberships] = useState<ProjectMembership[]>([])
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [updatingAccess, setUpdatingAccess] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const stepOneInputRef = useRef<HTMLInputElement>(null)
  const stepTwoInputRef = useRef<HTMLInputElement>(null)

  const isValidEmail = useMemo(() => EMAIL_RE.test(email.trim()), [email])

  useEffect(() => {
    if (!project) return

    setStep('shareInfo')
    setEmail('')
    setRole('edit')
    setMessage('')
    setIsPublic(Boolean(project.is_public))
    setMemberships([])
    setInvitations([])
    setMembersError(null)

    let cancelled = false

    const loadMemberships = async () => {
      setLoadingMembers(true)
      try {
        const response = await apiFetch(`/projects/${project.id}/memberships/`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) {
          throw new Error(`Error ${response.status} cargando accesos.`)
        }
        const payload = (await response.json()) as MembershipResponse
        if (cancelled) return
        setMemberships(payload.memberships ?? [])
        setInvitations(payload.invitations ?? [])
        setIsPublic(Boolean(payload.is_public))
      } catch (error: any) {
        if (cancelled) return
        setMembersError(error?.message || 'No se pudo cargar la lista de accesos.')
      } finally {
        if (!cancelled) {
          setLoadingMembers(false)
        }
      }
    }

    void loadMemberships()

    return () => {
      cancelled = true
    }
  }, [project])

  useEffect(() => {
    if (step !== 'sharing') return
    const id = window.setTimeout(() => {
      const input = stepTwoInputRef.current
      if (!input) return
      input.focus()
      const cursor = input.value.length
      input.setSelectionRange(cursor, cursor)
    }, 0)
    return () => window.clearTimeout(id)
  }, [step])

  if (!project) return null

  const ownerEmail = user?.email ?? ''

  const handleComposerValue = (value: string) => {
    setEmail(value)
    if (value.trim().length > 0) {
      setStep('sharing')
      return
    }
    setStep('shareInfo')
  }

  const resetComposer = () => {
    setEmail('')
    setMessage('')
    setStep('shareInfo')
    window.setTimeout(() => {
      stepOneInputRef.current?.focus()
    }, 0)
  }

  const handleAccessChange = async (nextValue: boolean) => {
    if (!project || nextValue === isPublic) return

    const previousValue = isPublic
    setIsPublic(nextValue)
    setUpdatingAccess(true)

    try {
      const response = await apiFetch(`/projects/${project.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_public: nextValue }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(extractErrorMessage(payload, 'No se pudo actualizar el nivel de acceso.'))
      }

      const updatedProject = (await response.json()) as Project
      setIsPublic(Boolean(updatedProject.is_public))
      onProjectUpdated?.(updatedProject)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
      }
    } catch (error: any) {
      setIsPublic(previousValue)
      toast.error(error?.message || 'No se pudo actualizar el nivel de acceso.')
    } finally {
      setUpdatingAccess(false)
    }
  }

  const handleShare = async () => {
    if (!project || !isValidEmail) return

    setSharing(true)
    try {
      const response = await apiFetch(`/projects/${project.id}/memberships/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          message,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, 'No se pudo enviar la invitación.'))
      }

      setMemberships(Array.isArray(payload?.memberships) ? payload.memberships : memberships)
      setInvitations(Array.isArray(payload?.invitations) ? payload.invitations : invitations)
      toast.success('Invitación enviada correctamente.')
      resetComposer()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar la invitación.')
    } finally {
      setSharing(false)
    }
  }

  const accessOptions = [
    {
      value: false,
      icon: Users,
      title: 'Solo tienen acceso las personas añadidas',
      description: 'Solo las personas que tienen acceso al diseño pueden utilizar este enlace.',
    },
    {
      value: true,
      icon: Globe,
      title: 'Cualquier persona que tenga el enlace',
      description: 'Cualquiera puede acceder al diseño a través de este enlace. No hace falta iniciar sesión.',
    },
  ] as const

  return (
    <Modal
      open={Boolean(project)}
      onClose={onClose}
      title="Compartir proyecto"
      size={step === 'sharing' ? 'md' : 'lg'}
    >
      {step === 'shareInfo' ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Personas con acceso</p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={stepOneInputRef}
                type="text"
                value={email}
                onChange={(event) => handleComposerValue(event.target.value)}
                placeholder="Añade el mail de las personas"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColorFor(ownerEmail || project.id)}`}>
                  {emailInitial(ownerEmail || project.id)}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm text-gray-900">{ownerEmail || 'Titular del proyecto'}</p>
                <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">Titular</span>
              </div>

              {loadingMembers && <p className="text-sm text-gray-500">Cargando accesos...</p>}
              {membersError && <p className="text-sm text-red-600">{membersError}</p>}

              {memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColorFor(membership.email)}`}>
                    {emailInitial(membership.email)}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-gray-900">{membership.email}</p>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {membership.role === 'edit' ? 'Editor' : 'Ver'}
                  </span>
                </div>
              ))}

              {invitations.map((invitation) => (
                <div
                  key={invitation.token}
                  className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-4 py-3"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColorFor(invitation.email)}`}>
                    {emailInitial(invitation.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900">{invitation.email}</p>
                    <p className="text-xs text-amber-600">Invitación pendiente</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {invitation.role === 'edit' ? 'Editar' : 'Ver'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-sm font-semibold text-gray-900">Nivel de acceso</p>
            <div className="grid gap-3">
              {accessOptions.map((option) => {
                const Icon = option.icon
                const active = isPublic === option.value
                return (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => void handleAccessChange(option.value)}
                    disabled={updatingAccess}
                    className={[
                      'flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition',
                      active ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                      updatingAccess ? 'opacity-70' : '',
                    ].join(' ')}
                  >
                    <span className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
                      <Icon className="h-4 w-4 text-gray-700" />
                    </span>
                    <span className="space-y-1">
                      <span className="block text-sm font-semibold text-gray-900">{option.title}</span>
                      <span className="block text-sm text-gray-500">{option.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetComposer}
              aria-label="Volver"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-gray-900">Compartir diseño</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={stepTwoInputRef}
                type="email"
                value={email}
                onChange={(event) => handleComposerValue(event.target.value)}
                placeholder="Añade el mail de las personas"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-11 text-sm text-gray-900 outline-none transition focus:border-gray-400"
              />
              {email.trim().length > 0 && (
                <button
                  type="button"
                  onClick={resetComposer}
                  aria-label="Borrar email"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                >
                  <CircleX className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={role}
              onChange={(event) => setRole(event.target.value as MembershipRole)}
              className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400"
            >
              <option value="edit">Editar</option>
              <option value="view">Ver</option>
            </select>
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Añadir mensaje (opcional)"
            rows={4}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
          />

          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={!isValidEmail || sharing}
            className="w-full rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-purple-50 disabled:text-gray-500"
          >
            {sharing ? 'Compartiendo...' : 'Compartir'}
          </button>
        </div>
      )}
    </Modal>
  )
}
