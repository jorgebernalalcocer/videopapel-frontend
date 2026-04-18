'use client'

import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'

type PickerSelectorProps<T extends { id: string | number }> = {
  open: boolean
  onClose: () => void
  title: string
  items: T[]
  selectedItem?: T | null
  onSelectItem?: (item: T) => void
  selectionMode?: 'single' | 'multiple'
  selectedItems?: T[]
  onToggleItem?: (item: T) => void
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  confirmBusyLabel?: string
  confirmDisabled?: boolean
  busy?: boolean
  loading?: boolean
  error?: string | null
  emptyLabel?: string
  preListSlot?: ReactNode
  renderItem: (args: { item: T; selected: boolean }) => ReactNode
}

export default function PickerSelector<T extends { id: string | number }>({
  open,
  onClose,
  title,
  items,
  selectedItem = null,
  onSelectItem,
  selectionMode = 'single',
  selectedItems = [],
  onToggleItem,
  onConfirm,
  confirmLabel = 'Confirmar',
  confirmBusyLabel,
  confirmDisabled = false,
  busy = false,
  loading = false,
  error,
  emptyLabel = 'No hay elementos disponibles.',
  preListSlot,
  renderItem,
}: PickerSelectorProps<T>) {
  const hasSelection =
    selectionMode === 'multiple'
      ? selectedItems.length > 0
      : Boolean(selectedItem)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          {error ? <span className="text-sm text-red-600">{error}</span> : <span />}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!hasSelection || loading || busy || confirmDisabled}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={() => {
                void onConfirm()
              }}
            >
              {busy ? (confirmBusyLabel || `${confirmLabel}…`) : confirmLabel}
            </button>
          </div>
        </div>
      }
    >
      {preListSlot}
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-auto pr-1">
          {items.map((item) => {
            const selected =
              selectionMode === 'multiple'
                ? selectedItems.some((selectedItem) => selectedItem.id === item.id)
                : selectedItem?.id === item.id
            return (
              <li
                key={item.id}
                className={`rounded-lg border overflow-hidden cursor-pointer ${
                  selected ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'
                }`}
                onClick={() => {
                  if (selectionMode === 'multiple') {
                    onToggleItem?.(item)
                    return
                  }
                  onSelectItem?.(item)
                }}
              >
                {renderItem({ item, selected })}
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
