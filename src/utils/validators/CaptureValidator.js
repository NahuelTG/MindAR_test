//src/utils/validators/CaptureValidator.js
export class CaptureValidator {
  static validateARManager(arManagerRef) {
    return arManagerRef?.current && arManagerRef.current.renderer
  }

  static validateWebGLContext(canvas) {
    if (!canvas) return false
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  }

  static validateVideoElement(videoElement) {
    return videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0
  }

  static validateCanvasContent(canvas, dimensions) {
    try {
      const ctx = canvas.getContext('2d')
      const imageData = ctx.getImageData(0, 0, dimensions.width, dimensions.height)
      return imageData.data.some((pixel, index) => index % 4 !== 3 && pixel !== 0)
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return false
    }
  }

  static validateMediaStream(stream) {
    return stream && stream.getTracks().length > 0
  }
}
