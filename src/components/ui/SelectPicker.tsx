'use client'

import type { ReactNode } from 'react'
import PickerSelector from '@/components/project/PickerSelector'

type SelectPickerOption = {
  id: string | number
  label: string
  description?: string
}

type SelectPickerProps<T extends SelectPickerOption> = {
  open: boolean
  onClose: () => void
  title: string
  options: T[]
  selectedOption: T | null
  onSelectOption: (option: T) => void
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  confirmBusyLabel?: string
  busy?: boolean
  loading?: boolean
  error?: string | null
  emptyLabel?: string
  preListSlot?: ReactNode
  renderOption?: (args: { option: T; selected: boolean }) => ReactNode
}

export default function SelectPicker<T extends SelectPickerOption>({
  open,
  onClose,
  title,
  options,
  selectedOption,
  onSelectOption,
  onConfirm,
  confirmLabel,
  confirmBusyLabel,
  busy,
  loading,
  error,
  emptyLabel,
  preListSlot,
  renderOption,
}: SelectPickerProps<T>) {
  return (
    <PickerSelector
      open={open}
      onClose={onClose}
      title={title}
      items={options}
      selectedItem={selectedOption}
      onSelectItem={onSelectOption}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      confirmBusyLabel={confirmBusyLabel}
      busy={busy}
      loading={loading}
      error={error}
      emptyLabel={emptyLabel}
      preListSlot={preListSlot}
      renderItem={({ item, selected }) =>
        renderOption ? (
          renderOption({ option: item, selected })
        ) : (
          <div className={`px-4 py-3 ${selected ? 'bg-blue-50' : 'bg-white'}`}>
            <p className="font-medium text-gray-900">{item.label}</p>
            {item.description ? <p className="text-sm text-gray-500">{item.description}</p> : null}
          </div>
        )
      }
    />
  )
}
