'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Modal, type ModalProps } from './Modal'

export type TileOption = {
  id: string | number
  label: string
  imageUrl?: string | null
  description?: string | null
  disabled?: boolean
}

type BaseTileModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  tiles: TileOption[]
  selectedId?: string | number | null
  loading?: boolean
  error?: string | null
  onSelect?: (option: TileOption) => void
  emptyState?: ReactNode
  gridClassName?: string
  modalProps?: Partial<Omit<ModalProps, 'open' | 'onClose' | 'children'>>
}

export function BaseTileModal({
  open,
  onClose,
  title,
  description,
  tiles,
  selectedId,
  loading = false,
  error,
  onSelect,
  emptyState,
  gridClassName,
  modalProps,
}: BaseTileModalProps) {
  const gridClasses = useMemo(() => {
    return [
      'grid gap-3 sm:gap-4',
      gridClassName || 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    ]
      .filter(Boolean)
      .join(' ')
  }, [gridClassName])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      {...modalProps}
    >
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : tiles.length === 0 ? (
        emptyState || (
          <div className="py-10 text-center text-sm text-gray-500">
            No hay elementos para mostrar.
          </div>
        )
      ) : (
        <div className={gridClasses}>
          {tiles.map((tile) => {
            const isSelected =
              selectedId !== null && selectedId !== undefined && tile.id === selectedId
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => (tile.disabled ? undefined : onSelect?.(tile))}
                disabled={tile.disabled}
                className={[
                  'group relative flex flex-col items-center rounded-2xl border p-3 text-center transition',
                  tile.disabled
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                    : isSelected
                      ? 'border-purple-500 ring-2 ring-purple-500/60'
                      : 'border-gray-200 hover:border-purple-400 hover:ring-2 hover:ring-purple-200',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="h-28 w-full overflow-hidden rounded-xl bg-gray-100">
                  {tile.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tile.imageUrl}
                      alt={tile.label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      Vista previa
                    </div>
                  )}
                </div>
                <span className="mt-3 text-sm font-medium text-gray-800">
                  {tile.label}
                </span>
                {tile.description && (
                  <span className="mt-1 text-xs text-gray-500">
                    {tile.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
