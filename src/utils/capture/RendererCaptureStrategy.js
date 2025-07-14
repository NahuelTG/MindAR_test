// 8. src/utils/capture/RendererCaptureStrategy.js
import { CaptureStrategy } from './CaptureStrategy'

export class RendererCaptureStrategy extends CaptureStrategy {
  async capture() {
    const renderer = this.arManagerRef.current?.renderer
    if (!renderer) return null

    // Forzar renderizado antes de capturar
    if (this.arManagerRef.current.render) {
      this.arManagerRef.current.render()
    }

    const canvas = renderer.domElement
    renderer.render(this.arManagerRef.current.scene, this.arManagerRef.current.camera)

    // Crear canvas final combinando video + WebGL
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = this.dimensions.width
    finalCanvas.height = this.dimensions.height
    const ctx = finalCanvas.getContext('2d')

    // Primero el video de fondo
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      ctx.drawImage(videoElement, 0, 0, finalCanvas.width, finalCanvas.height)
    }

    // Luego el canvas WebGL encima
    ctx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height)

    return finalCanvas.toDataURL('image/jpeg', 0.9)
  }
}
