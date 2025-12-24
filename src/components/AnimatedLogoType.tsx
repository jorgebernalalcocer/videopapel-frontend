// src/components/AnimatedLogo.tsx
'use client'

import { useEffect, useState } from 'react'
import { fascinate } from '@/fonts/fascinate'

export default function AnimatedLogo() {
  // Las letras de "papel video" con espacios donde indicaste
//   const letters = ['p', 'a', 'p', 'e', 'l', ' ', 'v', 'i', 'd', 'e', 'o', ' ']
  const letters = [' ', ' ']

  
  // Colores del degradado (fuchsia-500 -> sky-500 -> emerald-500)
  const colors = [
    'bg-fuchsia-500',
    'bg-fuchsia-400',
    'bg-purple-500',
    'bg-violet-500',
    'bg-blue-500',
    'bg-sky-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-green-500',
  ]

  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [currentColorIndex, setCurrentColorIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLetterIndex((prev) => (prev + 1) % letters.length)
      setCurrentColorIndex((prev) => (prev + 1) % colors.length)
    }, 400) // Cambia cada 400ms

    return () => clearInterval(interval)
  }, [letters.length, colors.length])

  const currentLetter = letters[currentLetterIndex]
  const currentColor = colors[currentColorIndex]
  const isSpace = currentLetter === ' '

  return (
    <div
      className={`
        w-10 h-14 
        ${currentColor}
        rounded-sm
        flex items-center justify-center
        transition-colors duration-300
        shadow-md
      `}
    >
      {!isSpace && (
        <span
          className={`
            ${fascinate.className}
            text-white text-2xl font-bold
            animate-fade-in
          `}
          key={currentLetterIndex}
        >
          {currentLetter}
        </span>
      )}
    </div>
  )
}