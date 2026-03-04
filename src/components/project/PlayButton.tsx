'use client'

type PlayButtonProps = {
  onClick: () => void
  title?: string
  size?: 'default' | 'presentation'
}

import { Clapperboard } from 'lucide-react'

export default function PlayButton({
  onClick,
  title = 'Siguiente fotograma',
  size = 'default',
}: PlayButtonProps) {
  const isPresentation = size === 'presentation'
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="
        inline-grid place-items-center
        rounded-full
        bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600
        text-black shadow ring-1 ring-black/10
        transition
      "
      style={{
        width: isPresentation ? 60 : 40,
        height: isPresentation ? 60 : 40,
      }}
    >
      {/* Icono triangular clásico de “play” (sin texto) */}
      {/* <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M8 5v14l11-7z" />
      </svg> */}
      <Clapperboard className={isPresentation ? 'h-7 w-7' : 'h-5 w-5'} />

      <span className="sr-only">{title}</span>
    </button>
  )
}
