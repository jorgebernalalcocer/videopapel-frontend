'use client'

type DeleteFrameButtonProps = {
  onClick: () => void
  disabled?: boolean
}

export default function DeleteFrameButton({ onClick, disabled }: DeleteFrameButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Eliminar fotograma seleccionado"
      className={`inline-flex items-center justify-center rounded-full h-9 w-9 border
        ${disabled
          ? 'opacity-50 cursor-not-allowed border-gray-300 bg-white'
          : 'hover:bg-red-50 active:bg-red-100 border-red-300 bg-white'}
      `}
      title="Eliminar fotograma seleccionado"
    >
      {/* Icono papelera (SVG inline, sin dependencias) */}
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  )
}
