//src/utils/helpers/CanvasHelper.js
export class CanvasHelper {
  static createCanvas(width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  static getContext(canvas, contextType = '2d') {
    return canvas.getContext(contextType)
  }

  static drawVideoToCanvas(canvas, videoElement, width, height) {
    const ctx = this.getContext(canvas)
    ctx.drawImage(videoElement, 0, 0, width, height)
  }

  static drawCanvasToCanvas(targetCanvas, sourceCanvas, width, height) {
    const ctx = this.getContext(targetCanvas)
    ctx.drawImage(sourceCanvas, 0, 0, width, height)
  }

  static scaleCanvas(canvas, scale) {
    const ctx = this.getContext(canvas)
    ctx.scale(scale, scale)
    return ctx
  }

  static toDataURL(canvas, format = 'image/jpeg', quality = 0.9) {
    return canvas.toDataURL(format, quality)
  }

  static async waitForFrame(delay = 16) {
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
}
