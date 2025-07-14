//src/utils/capture/WebGLCaptureStrategy.js
import { CaptureStrategy } from './CaptureStrategy'

export class WebGLCaptureStrategy extends CaptureStrategy {
  async capture() {
    const canvas = this.sceneRef.current?.querySelector('canvas')
    if (!canvas) return null

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return null

    // Crear canvas de composición
    const compositeCanvas = document.createElement('canvas')
    compositeCanvas.width = this.dimensions.width
    compositeCanvas.height = this.dimensions.height
    const ctx = compositeCanvas.getContext('2d')

    // Fondo de video
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      ctx.drawImage(videoElement, 0, 0, compositeCanvas.width, compositeCanvas.height)
    }

    // Forzar un frame de renderizado
    if (this.arManagerRef.current?.render) {
      this.arManagerRef.current.render()
    }

    // Pequeña espera para asegurar que el renderizado se complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Capturar el canvas WebGL
    try {
      ctx.drawImage(canvas, 0, 0, compositeCanvas.width, compositeCanvas.height)

      // Verificar que el canvas no esté vacío
      const imageData = ctx.getImageData(0, 0, compositeCanvas.width, compositeCanvas.height)
      const hasContent = imageData.data.some((pixel, index) => index % 4 !== 3 && pixel !== 0)

      if (hasContent) {
        return compositeCanvas.toDataURL('image/jpeg', 0.9)
      }
    } catch (webglError) {
      console.warn('Error accediendo al canvas WebGL:', webglError)
    }

    return null
  }
}
