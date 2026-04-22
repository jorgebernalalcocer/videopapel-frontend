'use client'

type Props = {
  onClick: () => void
}

export default function GenerateTemporalInvitation({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
    >
      Generar invitación
    </button>
  )
}
