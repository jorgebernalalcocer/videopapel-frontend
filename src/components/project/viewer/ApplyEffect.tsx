'use client'

import { cloneElement, isValidElement, type CSSProperties, type ReactElement } from 'react'

type EffectKey =
  | 'grayscale'
  | 'sepia'
  | 'vintage'
  | 'negative'
  | 'bright'
  | 'dark'
  | 'contrast'
  | 'desaturate'
  | 'blur'
  | 'sharpen'
  | 'posterize'
  | 'polaroid'
  | 'watercolor'
  | 'sketch'

type EffectStyle = {
  style: CSSProperties
}

const EFFECT_STYLES: Record<EffectKey, EffectStyle> = {
  grayscale: { style: { filter: 'grayscale(1)' } },
  sepia: { style: { filter: 'sepia(0.85) saturate(0.9)' } },
  vintage: { style: { filter: 'sepia(0.5) contrast(0.9) brightness(1.05) saturate(0.85)' } },
  negative: { style: { filter: 'invert(1)' } },
  bright: { style: { filter: 'brightness(1.3)' } },
  dark: { style: { filter: 'brightness(0.7)' } },
  contrast: { style: { filter: 'contrast(1.4) saturate(1.1)' } },
  desaturate: { style: { filter: 'saturate(0.45)' } },
  blur: { style: { filter: 'blur(2px)' } },
  sharpen: { style: { filter: 'contrast(1.15) saturate(1.05)' } },
  posterize: { style: { filter: 'contrast(1.15) saturate(0.8)' } },
  polaroid: { style: { filter: 'saturate(1.2) contrast(1.05) hue-rotate(-8deg)' } },
  watercolor: { style: { filter: 'saturate(1.05) contrast(0.95) brightness(1.02)' } },
  sketch: { style: { filter: 'grayscale(1) contrast(1.25) brightness(1.05)' } },
}

const KEYWORD_MAP: Record<EffectKey, string[]> = {
  grayscale: ['grayscale', 'blanco y negro', 'byn', 'b/n', 'bw'],
  sepia: ['sepia'],
  vintage: ['vintage'],
  negative: ['negative', 'negativo'],
  bright: ['bright', 'brillo'],
  dark: ['dark', 'apagado'],
  contrast: ['contrast', 'contraste'],
  desaturate: ['desaturate', 'desaturado', 'desaturada'],
  blur: ['blur', 'desenfoque', 'desenfocado'],
  sharpen: ['sharpen', 'enfocar', 'enfocado'],
  posterize: ['posterize', 'acuarela 1'],
  polaroid: ['polaroid'],
  watercolor: ['watercolor', 'acuarela 2', 'acuarela'],
  sketch: ['sketch', 'blanco y negro saturado'],
}

type ApplyEffectProps = {
  effectName?: string | null
  children: ReactElement
}

const normalize = (value?: string | null) =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

function resolveEffectKey(effectName?: string | null): EffectKey | null {
  if (!effectName) return null
  const normalized = normalize(effectName)
  if (!normalized) return null

  const direct = (Object.keys(EFFECT_STYLES) as EffectKey[]).find(
    (key) => key === normalized,
  )
  if (direct) return direct

  for (const [key, synonyms] of Object.entries(KEYWORD_MAP) as [EffectKey, string[]][]) {
    if (synonyms.some((syn) => normalized.includes(normalize(syn)))) {
      return key
    }
  }
  return null
}

export default function ApplyEffect({ effectName, children }: ApplyEffectProps) {
  const effectKey = resolveEffectKey(effectName)
  if (!effectKey || !isValidElement(children)) {
    return children
  }

  const effectStyle = EFFECT_STYLES[effectKey]
  const childStyle = (children.props?.style ?? {}) as CSSProperties
  const mergedStyle: CSSProperties = { ...childStyle, ...effectStyle.style }

  if (effectStyle.style.filter && childStyle.filter) {
    mergedStyle.filter = `${childStyle.filter} ${effectStyle.style.filter}`.trim()
  }

  return cloneElement(children, {
    style: mergedStyle,
  })
}
