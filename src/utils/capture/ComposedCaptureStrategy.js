// ComposedCaptureStrategy.js - Corregido para detectar móvil correctamente
import { CaptureStrategy } from './CaptureStrategy'

export class ComposedCaptureStrategy extends CaptureStrategy {
  async capture() {
    // Obtener dimensiones correctas para la captura usando la nueva lógica
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
      strategy: 'fallback',
    }

    console.log('📸 CAPTURA con detección móvil corregida:', captureResolution)

    // Crear canvas con las dimensiones correctas
    const canvas = document.createElement('canvas')
    canvas.width = captureResolution.width
    canvas.height = captureResolution.height
    const ctx = canvas.getContext('2d')

    // 1. Capturar video de fondo con estrategias específicas de móvil
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      if (captureResolution.strategy === 'full_video') {
        // ✅ Caso 1: Usar toda la imagen del video (aspect ratios similares)
        console.log('✅ MÓVIL: Usando toda la imagen del video')
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight, // fuente: todo el video
          0,
          0,
          captureResolution.width,
          captureResolution.height // destino: todo el canvas
        )
      } else if (captureResolution.strategy === 'mobile_crop_horizontal') {
        // 🔧 Caso 2: Crop horizontal centrado (móvil)
        console.log('🔧 MÓVIL: Aplicando crop horizontal centrado')
        ctx.drawImage(
          videoElement,
          captureResolution.cropX,
          0,
          captureResolution.width,
          captureResolution.height, // fuente: crop horizontal centrado
          0,
          0,
          captureResolution.width,
          captureResolution.height // destino: todo el canvas
        )
      } else if (captureResolution.strategy === 'mobile_crop_vertical') {
        // 🔧 Caso 3: Crop vertical centrado (móvil)
        console.log('🔧 MÓVIL: Aplicando crop vertical centrado')
        ctx.drawImage(
          videoElement,
          0,
          captureResolution.cropY,
          captureResolution.width,
          captureResolution.height, // fuente: crop vertical centrado
          0,
          0,
          captureResolution.width,
          captureResolution.height // destino: todo el canvas
        )
      } else if (captureResolution.strategy === 'mobile_extreme_scale') {
        // 🚨 Caso 4: Escalado para casos extremos (móvil)
        console.log('🚨 MÓVIL: Aplicando escalado para caso extremo')
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight, // fuente: todo el video original
          0,
          0,
          captureResolution.width,
          captureResolution.height // destino: escalado al tamaño calculado
        )
      } else if (captureResolution.strategy === 'mobile_extreme_scale_fixed') {
        // 🎯 Caso 4B: Escalado FIJO a dimensiones exactas de pantalla (móvil)
        console.log('🎯 MÓVIL FIXED: Escalado exacto a dimensiones de pantalla')
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight, // fuente: todo el video original
          0,
          0,
          captureResolution.width,
          captureResolution.height // destino: escalado EXACTO a pantalla
        )
      } else if (captureResolution.strategy === 'mobile_scale_to_screen') {
        // 📐 Caso 5: Escalado directo a pantalla (móvil - evitar crops excesivos)
        console.log('📐 MÓVIL: Escalado directo a dimensiones de pantalla')
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight, // fuente: todo el video
          0,
          0,
          captureResolution.width,
          captureResolution.height // destino: escalado a pantalla
        )
      }
      // Estrategias legacy (compatibilidad)
      else if (captureResolution.strategy === 'crop_horizontal') {
        console.log('🔧 LEGACY: Crop horizontal')
        ctx.drawImage(
          videoElement,
          captureResolution.cropX || 0,
          0,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'crop_vertical') {
        console.log('🔧 LEGACY: Crop vertical')
        ctx.drawImage(
          videoElement,
          0,
          captureResolution.cropY || 0,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'extreme_scale') {
        console.log('🚨 LEGACY: Escalado extremo')
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'scale_to_screen') {
        console.log('📐 LEGACY: Escalado a pantalla')
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else {
        // 🖥️ Caso desktop o fallback
        console.log('🖥️ DESKTOP/FALLBACK: Usando lógica estándar')
        ctx.drawImage(videoElement, 0, 0, captureResolution.width, captureResolution.height)
      }
    }

    // 2. Capturar elementos AR encima
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

// RendererCaptureStrategy.js - Mejorado para casos extremos
export class RendererCaptureStrategy extends CaptureStrategy {
  async capture() {
    const renderer = this.arManagerRef.current?.renderer
    if (!renderer) return null

    // Obtener dimensiones correctas para la captura usando la nueva lógica
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
      strategy: 'fallback',
    }

    console.log('📸 RendererCapture con lógica anti-deformación:', captureResolution)

    // Forzar renderizado antes de capturar
    renderer.render(this.arManagerRef.current.scene, this.arManagerRef.current.camera)

    const webglCanvas = renderer.domElement

    // Crear canvas final con las dimensiones correctas
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = captureResolution.width
    finalCanvas.height = captureResolution.height
    const ctx = finalCanvas.getContext('2d')

    // Primero el video de fondo usando la nueva lógica mejorada
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      if (captureResolution.strategy === 'full_video') {
        // ✅ Usar toda la imagen del video
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'crop_horizontal') {
        // 🔧 Crop horizontal centrado
        ctx.drawImage(
          videoElement,
          captureResolution.cropX,
          0,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'crop_vertical') {
        // 🔧 Crop vertical centrado
        ctx.drawImage(
          videoElement,
          0,
          captureResolution.cropY,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'extreme_scale') {
        // 🚨 Escalado para caso extremo
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'scale_to_screen') {
        // 📐 Escalado a pantalla
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else {
        // 🖥️ Desktop/fallback
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

// WebGLCaptureStrategy.js - Mejorado para casos extremos
export class WebGLCaptureStrategy extends CaptureStrategy {
  async capture() {
    const canvas = this.sceneRef.current?.querySelector('canvas')
    if (!canvas) return null

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return null

    // Obtener dimensiones correctas para la captura usando la nueva lógica
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
      strategy: 'fallback',
    }

    console.log('📸 WebGLCapture con lógica anti-deformación:', captureResolution)

    // Crear canvas de composición con las dimensiones correctas
    const compositeCanvas = document.createElement('canvas')
    compositeCanvas.width = captureResolution.width
    compositeCanvas.height = captureResolution.height
    const ctx = compositeCanvas.getContext('2d')

    // Fondo de video usando la nueva lógica mejorada
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      if (captureResolution.strategy === 'full_video') {
        // ✅ Usar toda la imagen del video
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'crop_horizontal') {
        // 🔧 Crop horizontal centrado
        ctx.drawImage(
          videoElement,
          captureResolution.cropX,
          0,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'crop_vertical') {
        // 🔧 Crop vertical centrado
        ctx.drawImage(
          videoElement,
          0,
          captureResolution.cropY,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'extreme_scale') {
        // 🚨 Escalado para caso extremo
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'scale_to_screen') {
        // 📐 Escalado a pantalla
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else {
        // 🖥️ Desktop/fallback
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
    // Usar el stream existente del ARManager si está disponible
    const existingStream = this.arManagerRef.current?.cameraConfig?.mediaStream

    if (existingStream && existingStream.active) {
      console.log('📹 Usando stream existente para captura')
      return this.captureFromExistingStream(existingStream)
    }

    // Si no hay stream, crear uno nuevo
    console.log('📹 Creando nuevo stream para captura')
    return this.captureFromNewStream()
  }

  async captureFromExistingStream() {
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
      strategy: 'fallback',
    }

    console.log('📸 CameraOnly con stream existente:', captureResolution)

    // Usar el video element existente
    const videoElement = this.sceneRef.current?.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      const canvas = document.createElement('canvas')
      canvas.width = captureResolution.width
      canvas.height = captureResolution.height
      const ctx = canvas.getContext('2d')

      // Aplicar la misma lógica que en las otras estrategias
      if (captureResolution.strategy === 'full_video') {
        ctx.drawImage(
          videoElement,
          0,
          0,
          captureResolution.videoWidth,
          captureResolution.videoHeight,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'crop_horizontal') {
        ctx.drawImage(
          videoElement,
          captureResolution.cropX,
          0,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else if (captureResolution.strategy === 'crop_vertical') {
        ctx.drawImage(
          videoElement,
          0,
          captureResolution.cropY,
          captureResolution.width,
          captureResolution.height,
          0,
          0,
          captureResolution.width,
          captureResolution.height
        )
      } else {
        ctx.drawImage(videoElement, 0, 0, captureResolution.width, captureResolution.height)
      }

      return canvas.toDataURL('image/jpeg', 0.9)
    }

    // Fallback al método original
    return this.captureFromNewStream()
  }

  async captureFromNewStream() {
    const captureResolution = this.arManagerRef.current?.getCaptureResolution?.() || {
      width: this.dimensions.width,
      height: this.dimensions.height,
      strategy: 'fallback',
    }

    const isMobile = this.dimensions.width <= 768
    const screenAspectRatio = this.dimensions.width / this.dimensions.height

    let cameraConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: captureResolution.width },
        height: { ideal: captureResolution.height },
      },
    }

    if (isMobile) {
      // Para móviles, usar las mismas constraints que en setupImprovedMobileCamera
      cameraConstraints = {
        video: {
          facingMode: 'environment',
          aspectRatio: { exact: screenAspectRatio },
          width: {
            min: this.dimensions.width,
            ideal: this.dimensions.width * 2,
            max: this.dimensions.width * 3,
          },
          height: {
            min: this.dimensions.height,
            ideal: this.dimensions.height * 2,
            max: this.dimensions.height * 3,
          },
          frameRate: { ideal: 30 },
        },
      }
    }

    console.log('📹 CameraOnly - nuevo stream con constraints:', cameraConstraints)

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

    // Aplicar la misma lógica de crop/scale
    if (captureResolution.strategy === 'full_video') {
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, captureResolution.width, captureResolution.height)
    } else if (captureResolution.strategy === 'crop_horizontal') {
      const cropX = Math.round((video.videoWidth - captureResolution.width) / 2)
      ctx.drawImage(
        video,
        cropX,
        0,
        captureResolution.width,
        captureResolution.height,
        0,
        0,
        captureResolution.width,
        captureResolution.height
      )
    } else if (captureResolution.strategy === 'crop_vertical') {
      const cropY = Math.round((video.videoHeight - captureResolution.height) / 2)
      ctx.drawImage(
        video,
        0,
        cropY,
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

    // Limpiar el stream temporal
    stream.getTracks().forEach((track) => track.stop())

    return canvas.toDataURL('image/jpeg', 0.9)
  }
}
