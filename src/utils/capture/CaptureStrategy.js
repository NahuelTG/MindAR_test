//src/utils/capture/CaptureStrategy.js
export class CaptureStrategy {
  constructor(context) {
    this.arManagerRef = context.arManagerRef
    this.sceneRef = context.sceneRef
    this.dimensions = context.dimensions
    this.isCameraOnly = false
  }

  async capture() {
    throw new Error('capture() debe ser implementado por las subclases')
  }
}
