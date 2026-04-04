'use client'

type Props = {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  accentClassName?: string
  helpText?: string
  displayFormatter?: (value: number) => string
}

export default function PercentageSizeSliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  accentClassName = 'accent-purple-600',
  helpText,
  displayFormatter = (current) => `${current.toFixed(2)}%`,
}: Props) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
        <span>{label}</span>
        <span className="text-xs text-gray-500">{displayFormatter(value)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${accentClassName}`}
      />
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  )
}
