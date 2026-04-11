'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PreviewLogo from '@/components/profile/PreviewLogo'
import { ColorActionButton } from '@/components/ui/color-action-button'


export type MyLogosCompany = {
  id: number
  name: string
}

export type MyLogosLogo = {
  id: number
  company: number
  name: string
  image: string | null
  type: 'main' | 'secondary' | 'print' | 'watermark'
  is_default: boolean
  created_at?: string
}

type MyLogosProps = {
  companies: MyLogosCompany[]
  companyLogos: MyLogosLogo[]
  canRequest: boolean
  onCreateCompany: () => void
  onAddLogo: () => void
  onMarkLogoDefault: (logoId: number) => void
  showHeader?: boolean
  showAddButton?: boolean
}

export default function MyLogos({
  companies,
  companyLogos,
  canRequest,
  onCreateCompany,
  onAddLogo,
  onMarkLogoDefault,
  showHeader = true,
  showAddButton = true,
}: MyLogosProps) {
  const [previewLogo, setPreviewLogo] = useState<MyLogosLogo | null>(null)

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies],
  )

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Logos</h2>
            <p className="text-sm text-gray-500">
              Crea tu perfil de empresa para añadir logos a tus diseños.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateCompany}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            disabled={!canRequest}
          >
            <Plus className="h-4 w-4" />
            Crear perfil de empresa
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {showHeader && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Logos</h2>
              <p className="text-sm text-gray-500">Almacena tu logo o el de tus clientes.</p>
            </div>
            {showAddButton && (
              <ColorActionButton
                onClick={onAddLogo}
                color="slate"
                filled
                size="compact"
                icon={Plus}
                title="Añadir logo"
                disabled={!canRequest}
              >
                Añadir logo
              </ColorActionButton>
            )}
          </div>
        )}

        <div className="px-6 py-6">
          {companyLogos.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no has añadido ningún logo.</p>
          ) : (
            <ul className="space-y-4">
              {companyLogos.map((logo) => (
                <li
                  key={logo.id}
                  className={`cursor-pointer rounded-xl bg-gray-50 px-4 py-3 transition hover:bg-slate-100 ${
                    logo.is_default ? 'border-5 border-gray-200' : 'border-2 border-gray-100'
                  }`}
                  onClick={() => setPreviewLogo(logo)}
                >
                  <div className="flex items-start gap-4">
                    {logo.image ? (
                      <img
                        src={logo.image}
                        alt={`Logo ${logo.type}`}
                        className="h-16 w-16 rounded-lg border border-gray-200 bg-white object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs text-gray-400">
                        Sin logo
                      </div>
                    )}
                    <div className="space-y-1 text-sm text-gray-700">
                      {companyMap.get(logo.company) && (
                        <p className="font-semibold text-gray-900">{companyMap.get(logo.company)}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p>Nombre: {logo.name}</p>
                        {logo.is_default && (
                          <span className="text-md font-semibold text-emerald-600">
                            Logo principal
                          </span>
                        )}
                      </div>
                      <p>Tipo: {logo.type}</p>
                      <p>Predeterminado: {logo.is_default ? 'Sí' : 'No'}</p>
                      {logo.created_at && (
                        <p className="text-xs text-gray-400">
                          Añadido el {new Date(logo.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!logo.is_default && (
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onMarkLogoDefault(logo.id)
                        }}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        Marcar logo como principal
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PreviewLogo
        open={Boolean(previewLogo)}
        onClose={() => setPreviewLogo(null)}
        image={previewLogo?.image ?? null}
        name={previewLogo?.name}
      />
    </>
  )
}
