// src/store/loading.ts
'use client'

import { create } from 'zustand'

interface LoadingState {
  pending: number
  start: () => void
  stop: () => void
}

export const useLoading = create<LoadingState>((set) => ({
  pending: 0,
  start: () => set((s) => ({ pending: s.pending + 1 })),
  stop: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}))
