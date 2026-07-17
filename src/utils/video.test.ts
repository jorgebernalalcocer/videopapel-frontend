import { describe, it, expect, vi } from 'vitest'
import { setVideoSrcAndWait, paintFrameToCanvas } from './video'

describe('setVideoSrcAndWait', () => {
  it('resuelve cuando el vídeo dispara loadedmetadata y configura el elemento', async () => {
    const video = document.createElement('video')
    const promise = setVideoSrcAndWait(video, 'blob:fake')

    // el hook configura el elemento antes de esperar
    expect(video.getAttribute('src')).toBe('blob:fake')
    expect(video.muted).toBe(true)
    expect(video.preload).toBe('auto')

    video.dispatchEvent(new Event('loadedmetadata'))
    await expect(promise).resolves.toBeUndefined()
  })

  it('rechaza si el vídeo dispara error', async () => {
    const video = document.createElement('video')
    const promise = setVideoSrcAndWait(video, 'blob:bad')
    video.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow('Error cargando video')
  })
})

describe('paintFrameToCanvas', () => {
  function videoWithDims(w: number, h: number) {
    const video = document.createElement('video')
    Object.defineProperty(video, 'videoWidth', { value: w, configurable: true })
    Object.defineProperty(video, 'videoHeight', { value: h, configurable: true })
    return video
  }

  it('lanza si las dimensiones del vídeo son inválidas', async () => {
    // videoWidth 0 cae al fallback 1280 (|| 1280); solo dims negativas son inválidas
    const video = videoWithDims(-1, -1)
    const canvas = document.createElement('canvas')
    await expect(paintFrameToCanvas(video, canvas, null, false)).rejects.toThrow('invalid video dims')
  })

  it('lanza si no hay contexto 2d', async () => {
    const video = videoWithDims(1280, 720)
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    await expect(paintFrameToCanvas(video, canvas, null, false)).rejects.toThrow('no ctx')
  })

  it('pinta el frame: ajusta el tamaño del canvas y dibuja el vídeo', async () => {
    const video = videoWithDims(1280, 720)
    const canvas = document.createElement('canvas')
    const ctx = { clearRect: vi.fn(), drawImage: vi.fn() }
    vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)

    await paintFrameToCanvas(video, canvas, null, false)

    expect(canvas.width).toBe(1280)
    expect(canvas.height).toBe(720)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1280, 720)
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
  })
})
