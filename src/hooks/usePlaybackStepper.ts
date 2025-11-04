// src/hooks/usePlaybackStepper.ts
import { useEffect, useRef } from 'react'

export function usePlaybackStepper(
  isPlaying: boolean,
  fps: number,
  deps: any[],
  stepForward: () => void,
) {
  const timerRef = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } return }
    const intervalMs = Math.max(16, Math.round(1000 / fps))
    timerRef.current = window.setInterval(stepForward, intervalMs)
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, fps, ...deps])
}
