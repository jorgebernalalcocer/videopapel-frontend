'use client'

type PlayButtonProps = {
  onClick: () => void
  title?: string
}

export default function PlayButton({ onClick, title = 'Siguiente fotograma' }: PlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="
        inline-grid place-items-center
        w-10 h-10 rounded-full
        bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600
        text-black shadow ring-1 ring-black/10
        transition
      "
    >
      {/* Icono triangular clásico de “play” (sin texto) */}
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M8 5v14l11-7z" />
      </svg>
      <span className="sr-only">{title}</span>
    </button>
  )
}
