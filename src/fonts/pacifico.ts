'use client'

import { Pacifico } from 'next/font/google'

/**
 * Carga de la fuente Pacifico desde Google Fonts.
 * Usa pacifico.className o pacifico.variable para aplicar la tipografía.
 */
export const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pacifico',
})

/**
 * Helper CSS para aplicar la fuente en estilos en línea.
 */
export const pacificoFontStack = '"Pacifico", "Comic Sans MS", cursive'
