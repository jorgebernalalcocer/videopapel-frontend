'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  apiBase: string
  accessToken: string | null
  projectId: string
  value?: boolean | null
  onSaved?: (isPublic: boolean) => void
  className?: string
}

export default function PrivacySelector({
  apiBase,
  accessToken,
  projectId,
  value = false,
  onSaved,
  className,
}: Props) {
  const [current, setCurrent] = useState<boolean>(Boolean(value))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCurrent(Boolean(value))
  }, [value])

  const canRequest = useMemo(() => Boolean(apiBase && accessToken && projectId), [apiBase, accessToken, projectId])

  const handleUpdate = useCallback(
    async (next: boolean) => {
      if (!canRequest || next === current) return
      const previous = current
      setCurrent(next)
      try {
        setSaving(true)
        setError(null)
        const res = await fetch(`${apiBase}/projects/${projectId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ is_public: next }),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Error ${res.status} guardando privacidad.`)
        }
        onSaved?.(next)
      } catch (err: any) {
        setError(err?.message || 'No se pudo actualizar la privacidad.')
        setCurrent(previous)
      } finally {
        setSaving(false)
      }
    },
    [apiBase, accessToken, projectId, canRequest, current, onSaved]
  )

  return (
    <div className={className}>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">Privacidad del proyecto</legend>
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="project-privacy"
              value="private"
              checked={!current}
              onChange={() => handleUpdate(false)}
              disabled={saving || !canRequest}
              className="h-4 w-4"
            />
            <span>
              <span className="font-medium">Privado</span>
              <span className="block text-xs text-gray-500">
                Solo tú podrás ver y editar este proyecto.
              </span>
            </span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="project-privacy"
              value="public"
              checked={current}
              onChange={() => handleUpdate(true)}
              disabled={saving || !canRequest}
              className="h-4 w-4"
            />
            <span>
              <span className="font-medium">Pública</span>
              <span className="block text-xs text-gray-500">
                Cualquiera podrá visualizarlo pero no editar.
              </span>
            </span>
          </label>
        </div>
        {saving && <p className="text-xs text-gray-500">Guardando…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </fieldset>
    </div>
  )
}
