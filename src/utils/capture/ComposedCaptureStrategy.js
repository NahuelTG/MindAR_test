// 10. src/utils/capture/ComposedCaptureStrategy.js
import { CaptureStrategy } from './CaptureStrategy'

export class ComposedCaptureStrategy extends CaptureStrategy {
  async capture() {
    // Crear canvas de alta resolución
    const canvas = document.createElement('canvas')
    canvas.width = this.dimensions.width * 2
    canvas.height = this.dimensions.height * 2
    const ctx = canvas.getContext('2d')

    // Escalar el contexto
    ctx.scale(2, 2)

    // 1. Capturar video de fondo
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      ctx.drawImage(videoElement, 0, 0, this.dimensions.width, this.dimensions.height)
    }

    // 2. Intentar capturar elementos AR
    const arElements = this.sceneRef.current?.querySelectorAll('canvas')
    if (arElements) {
      for (let element of arElements) {
        try {
          // Forzar renderizado
          if (this.arManagerRef.current?.render) {
            this.arManagerRef.current.render()
          }

          await new Promise((resolve) => setTimeout(resolve, 50))

          ctx.globalCompositeOperation = 'source-over'
          ctx.drawImage(element, 0, 0, this.dimensions.width, this.dimensions.height)
        } catch (elementError) {
          console.warn('Error capturando elemento AR:', elementError)
        }
      }
    }

    // Volver a escala normal
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = this.dimensions.width
    finalCanvas.height = this.dimensions.height
    const finalCtx = finalCanvas.getContext('2d')
    finalCtx.drawImage(canvas, 0, 0, this.dimensions.width, this.dimensions.height)

    return finalCanvas.toDataURL('image/jpeg', 0.9)
  }
}
