//src/services/PhotoCaptureService.js
import { CaptureStrategy } from '@/utils/capture/CaptureStrategy'
import { RendererCaptureStrategy } from '@/utils/capture/RendererCaptureStrategy'
import { WebGLCaptureStrategy } from '@/utils/capture/WebGLCaptureStrategy'
import { ComposedCaptureStrategy } from '@/utils/capture/ComposedCaptureStrategy'
import { CameraOnlyCaptureStrategy } from '@/utils/capture/CameraOnlyCaptureStrategy'

export class PhotoCaptureService {
  constructor(arManagerRef, sceneRef, dimensions) {
    this.arManagerRef = arManagerRef
    this.sceneRef = sceneRef
    this.dimensions = dimensions
    this.strategies = this.initializeStrategies()
  }

  initializeStrategies() {
    const context = {
      arManagerRef: this.arManagerRef,
      sceneRef: this.sceneRef,
      dimensions: this.dimensions,
    }

    return [
      new RendererCaptureStrategy(context),
      new WebGLCaptureStrategy(context),
      new ComposedCaptureStrategy(context),
      new CameraOnlyCaptureStrategy(context),
    ]
  }

  async capture() {
    for (const strategy of this.strategies) {
      try {
        const result = await strategy.capture()
        if (result) {
          return {
            dataURL: result,
            cameraOnly: strategy.isCameraOnly || false,
          }
        }
      } catch (error) {
        console.warn(`Error en estrategia ${strategy.constructor.name}:`, error)
      }
    }

    throw new Error('No se pudo capturar la foto con ninguna estrategia')
  }
}
