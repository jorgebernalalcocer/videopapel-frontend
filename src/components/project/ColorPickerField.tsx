'use client'

import type { InputHTMLAttributes } from 'react'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  helpText?: string
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'>
}

export default function ColorPickerField({
  label,
  value,
  onChange,
  helpText,
  inputProps,
}: Props) {
  const textValue = value ?? ''
  const isValidHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(textValue)
  const colorInputValue = isValidHex ? textValue : '#000000'

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          className="h-10 w-16 rounded border border-gray-300"
          value={colorInputValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          {...inputProps}
        />
        <input
          type="text"
          value={textValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="#FFFFFF"
        />
      </div>
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  )
}
