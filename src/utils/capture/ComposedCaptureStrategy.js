// ComposedCaptureStrategy.js - Mejorado para móviles
import { CaptureStrategy } from './CaptureStrategy'

export class ComposedCaptureStrategy extends CaptureStrategy {
  async capture() {
    // Obtener dimensiones correctas para la captura
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
    }

    console.log('Capturando con resolución:', captureResolution)

    // Crear canvas con las dimensiones correctas
    const canvas = document.createElement('canvas')
    canvas.width = captureResolution.width
    canvas.height = captureResolution.height
    const ctx = canvas.getContext('2d')

    // 1. Capturar video de fondo con las dimensiones correctas
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      // Para móviles, usar la información de crop si está disponible
      if (captureResolution.cropX !== undefined && captureResolution.cropY !== undefined) {
        // Dibujar solo la parte visible del video (croppeada)
        ctx.drawImage(
          videoElement,
          captureResolution.cropX, // sx - punto de inicio x en el video
          captureResolution.cropY, // sy - punto de inicio y en el video
          captureResolution.width, // sWidth - ancho a copiar del video
          captureResolution.height, // sHeight - alto a copiar del video
          0, // dx - punto de destino x en el canvas
          0, // dy - punto de destino y en el canvas
          captureResolution.width, // dWidth - ancho en el canvas de destino
          captureResolution.height // dHeight - alto en el canvas de destino
        )
      } else {
        // Comportamiento normal para desktop
        ctx.drawImage(videoElement, 0, 0, captureResolution.width, captureResolution.height)
      }
    }

    // 2. Intentar capturar elementos AR
    const arElements = this.sceneRef.current?.querySelectorAll('canvas')
    if (arElements) {
      for (let element of arElements) {
        try {
          // Forzar renderizado
          if (this.arManagerRef.current?.renderer?.render) {
            this.arManagerRef.current.renderer.render(this.arManagerRef.current.scene, this.arManagerRef.current.camera)
          }

          await new Promise((resolve) => setTimeout(resolve, 50))

          ctx.globalCompositeOperation = 'source-over'

          // Escalar el canvas AR para que coincida con las dimensiones de captura
          const scaleX = captureResolution.width / element.width
          const scaleY = captureResolution.height / element.height

          ctx.save()
          ctx.scale(scaleX, scaleY)
          ctx.drawImage(element, 0, 0)
          ctx.restore()
        } catch (elementError) {
          console.warn('Error capturando elemento AR:', elementError)
        }
      }
    }

    return canvas.toDataURL('image/jpeg', 0.9)
  }
}

// RendererCaptureStrategy.js - Mejorado para móviles
export class RendererCaptureStrategy extends CaptureStrategy {
  async capture() {
    const renderer = this.arManagerRef.current?.renderer
    if (!renderer) return null

    // Obtener dimensiones correctas para la captura
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
    }

    // Forzar renderizado antes de capturar
    renderer.render(this.arManagerRef.current.scene, this.arManagerRef.current.camera)

    const webglCanvas = renderer.domElement

    // Crear canvas final con las dimensiones correctas
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = captureResolution.width
    finalCanvas.height = captureResolution.height
    const ctx = finalCanvas.getContext('2d')

    // Primero el video de fondo
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      if (captureResolution.cropX !== undefined && captureResolution.cropY !== undefined) {
        // Para móviles con crop
        ctx.drawImage(
          videoElement,
          captureResolution.cropX,
          captureResolution.cropY,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else {
        // Para desktop
        ctx.drawImage(videoElement, 0, 0, captureResolution.width, captureResolution.height)
      }
    }

    // Luego el canvas WebGL encima, escalado apropiadamente
    const scaleX = captureResolution.width / webglCanvas.width
    const scaleY = captureResolution.height / webglCanvas.height

    ctx.save()
    ctx.scale(scaleX, scaleY)
    ctx.drawImage(webglCanvas, 0, 0)
    ctx.restore()

    return finalCanvas.toDataURL('image/jpeg', 0.9)
  }
}

// WebGLCaptureStrategy.js - Mejorado para móviles
export class WebGLCaptureStrategy extends CaptureStrategy {
  async capture() {
    const canvas = this.sceneRef.current?.querySelector('canvas')
    if (!canvas) return null

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return null

    // Obtener dimensiones correctas para la captura
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
    }

    // Crear canvas de composición con las dimensiones correctas
    const compositeCanvas = document.createElement('canvas')
    compositeCanvas.width = captureResolution.width
    compositeCanvas.height = captureResolution.height
    const ctx = compositeCanvas.getContext('2d')

    // Fondo de video
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      if (captureResolution.cropX !== undefined && captureResolution.cropY !== undefined) {
        // Para móviles con crop
        ctx.drawImage(
          videoElement,
          captureResolution.cropX,
          captureResolution.cropY,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else {
        // Para desktop
        ctx.drawImage(videoElement, 0, 0, captureResolution.width, captureResolution.height)
      }
    }

    // Forzar un frame de renderizado
    if (this.arManagerRef.current?.renderer?.render) {
      this.arManagerRef.current.renderer.render(this.arManagerRef.current.scene, this.arManagerRef.current.camera)
    }

    // Pequeña espera para asegurar que el renderizado se complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Capturar el canvas WebGL con escalado apropiado
    try {
      const scaleX = captureResolution.width / canvas.width
      const scaleY = captureResolution.height / canvas.height

      ctx.save()
      ctx.scale(scaleX, scaleY)
      ctx.drawImage(canvas, 0, 0)
      ctx.restore()

      // Verificar que el canvas no esté vacío
      const imageData = ctx.getImageData(0, 0, captureResolution.width, captureResolution.height)
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

// CameraOnlyCaptureStrategy.js - Mejorado para móviles
export class CameraOnlyCaptureStrategy extends CaptureStrategy {
  constructor(context) {
    super(context)
    this.isCameraOnly = true
  }

  async capture() {
    // Obtener dimensiones correctas para la captura
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
    }

    const isMobile = this.dimensions.width <= 768

    let cameraConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: captureResolution.width },
        height: { ideal: captureResolution.height },
      },
    }

    if (isMobile) {
      // Para móviles, usar constraints más específicos
      const screenAspectRatio = this.dimensions.width / this.dimensions.height

      cameraConstraints = {
        video: {
          facingMode: 'environment',
          width: {
            min: 480,
            ideal: Math.min(captureResolution.width, 1920),
            max: 1920,
          },
          height: {
            min: 640,
            ideal: Math.min(captureResolution.height, 1920),
            max: 1920,
          },
          aspectRatio: { ideal: screenAspectRatio },
          frameRate: { ideal: 30 },
        },
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints)

    const video = document.createElement('video')
    video.srcObject = stream
    video.play()

    await new Promise((resolve) => {
      video.addEventListener('loadedmetadata', resolve)
    })

    const canvas = document.createElement('canvas')
    canvas.width = captureResolution.width
    canvas.height = captureResolution.height
    const ctx = canvas.getContext('2d')

    // Para móviles, aplicar el mismo crop que se usa en la vista
    if (isMobile && captureResolution.cropX !== undefined && captureResolution.cropY !== undefined) {
      ctx.drawImage(
        video,
        captureResolution.cropX,
        captureResolution.cropY,
        captureResolution.width,
        captureResolution.height,
        0,
        0,
        captureResolution.width,
        captureResolution.height
      )
    } else {
      ctx.drawImage(video, 0, 0, captureResolution.width, captureResolution.height)
    }

    stream.getTracks().forEach((track) => track.stop())

    return canvas.toDataURL('image/jpeg', 0.9)
  }
}
