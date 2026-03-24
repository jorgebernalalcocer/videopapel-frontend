'use client'

import { useMemo, useState } from 'react'
import SelectPicker from '@/components/ui/SelectPicker'
import { findSpanishProvince, SPANISH_PROVINCES } from '@/lib/spanishProvinces'

type ProvinceSelectFieldProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}

const zoneLabel: Record<string, string> = {
  spain_mainland: 'Peninsula',
  balearic: 'Baleares',
  canary: 'Canarias',
  ceuta_melilla: 'Ceuta y Melilla',
}

export default function ProvinceSelectField({
  label = 'Provincia',
  value,
  onChange,
  required = false,
  disabled = false,
}: ProvinceSelectFieldProps) {
  const [open, setOpen] = useState(false)

  const selectedProvince = useMemo(() => findSpanishProvince(value), [value])

  return (
    <>
      <label className="text-sm font-medium text-gray-700">
        {label}
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="mt-1 flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <span className={selectedProvince ? 'text-gray-900' : 'text-gray-400'}>
            {selectedProvince?.label || 'Selecciona'}
          </span>
          <span className="text-xs text-gray-400">Elegir</span>
        </button>
        {required ? <input type="hidden" value={value} required readOnly /> : null}
      </label>
      <SelectPicker
        open={open}
        onClose={() => setOpen(false)}
        title="Selecciona una provincia"
        options={SPANISH_PROVINCES}
        selectedOption={selectedProvince}
        onSelectOption={(option) => onChange(option.label)}
        onConfirm={() => setOpen(false)}
        confirmLabel="Usar provincia"
        renderOption={({ option, selected }) => (
          <div className={`px-4 py-3 ${selected ? 'bg-blue-50' : 'bg-white'}`}>
            <p className="font-medium text-gray-900">{option.label}</p>
            <p className="text-sm text-gray-500">{zoneLabel[option.zone]}</p>
          </div>
        )}
      />
    </>
  )
}
