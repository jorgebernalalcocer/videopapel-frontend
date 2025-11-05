'use client'

type ProgressIndicatorProps = {
  label: string
  progress: number
}

export default function ProgressIndicator({ label, progress }: ProgressIndicatorProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)))
  return (
    <div className="w-full max-w-md mt-5">
      <p className="text-sm font-medium text-gray-700 text-center mb-2">{label}</p>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-blue-600 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-2 text-center">{pct}%</p>
    </div>
  )
}
