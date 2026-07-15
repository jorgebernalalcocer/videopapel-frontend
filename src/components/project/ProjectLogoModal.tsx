'use client'

import { useMemo } from 'react'
import { ImagePlus } from 'lucide-react'
import { BaseTileModal, type TileOption } from '@/components/ui/BaseTileModal'
import { ColorActionButton } from '@/components/ui/color-action-button'
import type { MyLogosLogo } from '@/components/profile/MyLogos'

type ProjectLogoModalProps = {
  open: boolean
  onClose: () => void
  logos: MyLogosLogo[]
  selectedLogoId?: number | null
  loading?: boolean
  error?: string | null
  busy?: boolean
  onSelect: (logoId: number) => void
  onAddLogo: () => void
}

export default function ProjectLogoModal({
  open,
  onClose,
  logos,
  selectedLogoId = null,
  loading = false,
  error = null,
  busy = false,
  onSelect,
  onAddLogo,
}: ProjectLogoModalProps) {
  const tiles = useMemo<TileOption[]>(
    () =>
      logos.map((logo) => ({
        id: logo.id,
        label: logo.name,
        imageUrl: logo.image,
        description: logo.is_default ? 'Logo principal' : null,
      })),
    [logos],
  )

  return (
    <BaseTileModal
      open={open}
      onClose={onClose}
      title="Configurar logo"
      tiles={tiles}
      selectedId={selectedLogoId}
      loading={loading}
      error={error}
      onSelect={(tile) => {
        if (busy) return
        const logoId = typeof tile.id === 'number' ? tile.id : Number(tile.id)
        if (!Number.isFinite(logoId)) return
        onSelect(logoId)
      }}
      emptyState={
        <div className="space-y-4 py-8 text-center">
          <p className="text-sm text-gray-500">Todavía no has añadido ningún logo.</p>
          <div className="flex justify-center">
            <ColorActionButton
              onClick={onAddLogo}
              color="slate"
              filled
              size="large"
              icon={ImagePlus}
              title="Añadir logo"
            >
              Añadir logo
            </ColorActionButton>
          </div>
        </div>
      }
      description="Selecciona el logo que quieres asociar a este proyecto."
      headerContent={
        <div className="flex justify-end">
          <ColorActionButton
            onClick={onAddLogo}
            color="slate"
            filled
            size="compact"
            icon={ImagePlus}
            title="Añadir logo"
          >
            Añadir logo
          </ColorActionButton>
        </div>
      }
    />
  )
}
