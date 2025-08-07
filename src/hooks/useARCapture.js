// hooks/useARCapture.js - Versión mejorada
import { useState, useCallback } from 'react'
import * as THREE from 'three'

export const useARCapture = (arManagerRef, sceneRef) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)

  /**
   * Busca el elemento video en diferentes ubicaciones posibles de MindAR
   */
  const findVideoElement = useCallback(() => {
    // Estrategia 1: Video en arManagerRef
    if (arManagerRef?.current?.video) {
      return arManagerRef.current.video
    }

    // Estrategia 2: Video en el contenedor de escena
    if (arManagerRef?.current?.mindarThree?.video) {
      return arManagerRef.current.mindarThree.video
    }

    // Estrategia 3: Buscar video element en el DOM
    const videoElement = document.querySelector('video')
    if (videoElement && videoElement.videoWidth > 0) {
      return videoElement
    }

    // Estrategia 4: Video en el canvas/contenedor del AR
    if (sceneRef?.current) {
      const containerVideo = sceneRef.current.querySelector('video')
      if (containerVideo && containerVideo.videoWidth > 0) {
        return containerVideo
      }
    }

    return null
  }, [arManagerRef, sceneRef])

  /**
   * Busca el renderer de Three.js en diferentes ubicaciones de MindAR
   */
  const findThreeRenderer = useCallback(() => {
    // Estrategia 1: Renderer en arManagerRef
    if (arManagerRef?.current?.renderer) {
      return arManagerRef.current.renderer
    }

    // Estrategia 2: Renderer en mindarThree
    if (arManagerRef?.current?.mindarThree?.renderer) {
      return arManagerRef.current.mindarThree.renderer
    }

    // Estrategia 3: Renderer en la escena Three.js
    if (arManagerRef?.current?.scene && window.THREE) {
      // Buscar en la escena alguna pista del renderer
      const scene = arManagerRef.current.scene
      if (scene.userData && scene.userData.renderer) {
        return scene.userData.renderer
      }
    }

    return null
  }, [arManagerRef])

  /**
   * Busca la cámara de Three.js en MindAR
   */
  const findThreeCamera = useCallback(() => {
    // Estrategia 1: Cámara en arManagerRef
    if (arManagerRef?.current?.camera) {
      return arManagerRef.current.camera
    }

    // Estrategia 2: Cámara en mindarThree
    if (arManagerRef?.current?.mindarThree?.camera) {
      return arManagerRef.current.mindarThree.camera
    }

    return null
  }, [arManagerRef])

  /**
   * Busca la escena de Three.js
   */
  const findThreeScene = useCallback(() => {
    // Estrategia 1: Escena en arManagerRef
    if (arManagerRef?.current?.scene) {
      return arManagerRef.current.scene
    }

    // Estrategia 2: Escena en mindarThree
    if (arManagerRef?.current?.mindarThree?.scene) {
      return arManagerRef.current.mindarThree.scene
    }

    // Estrategia 3: sceneRef podría contener la escena Three.js
    if (sceneRef?.current && sceneRef.current.type === 'Scene') {
      return sceneRef.current
    }

    return null
  }, [arManagerRef, sceneRef])
  /**
   * Obtiene las dimensiones reales del video de la cámara (como useCamera)
   */
  const getVideoDimensions = useCallback(() => {
    const video = findVideoElement()

    if (!video) {
      console.warn('Video element no encontrado')
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        aspectRatio: window.innerWidth / window.innerHeight,
        isVideoAvailable: false,
      }
    }

    // Verificar que el video tenga dimensiones válidas (como en useCamera)
    if (!video.videoWidth || !video.videoHeight || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video aún no tiene dimensiones válidas')
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        aspectRatio: window.innerWidth / window.innerHeight,
        isVideoAvailable: false,
      }
    }

    // Usar las dimensiones EXACTAS del video (como useCamera)
    return {
      width: video.videoWidth,
      height: video.videoHeight,
      aspectRatio: video.videoWidth / video.videoHeight,
      isVideoAvailable: true,
    }
  }, [findVideoElement])

  /**
   * Captura solo la cámara (sin AR) - Idéntico al método de useCamera
   */
  const captureCameraOnly = useCallback(async () => {
    const video = findVideoElement()

    if (!video) {
      console.error('Video element no disponible para captura')
      return null
    }

    // Verificar que el video esté listo (como en useCamera)
    if (!video.videoWidth || !video.videoHeight) {
      console.error('Video no tiene dimensiones válidas para capturar')
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      // Configurar canvas con las dimensiones EXACTAS del video (como useCamera)
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Dibujar el frame actual del video (como useCamera)
      context.drawImage(video, 0, 0)

      // Convertir a base64 con la misma calidad que useCamera
      return canvas.toDataURL('image/jpeg', 0.9)
    } catch (error) {
      console.error('Error capturando cámara:', error)
      return null
    }
  }, [findVideoElement])

  /**
   * Captura cámara + contenido 3D/AR usando dimensiones exactas del video
   */
  const captureWithAR = useCallback(async () => {
    const video = findVideoElement()

    if (!video || !video.videoWidth || !video.videoHeight) {
      console.warn('Video no disponible o sin dimensiones para captura AR')
      return await captureCameraOnly()
    }

    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      // Usar dimensiones EXACTAS del video (como useCamera)
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // 1. Dibujar el video de fondo (igual que useCamera)
      context.drawImage(video, 0, 0)

      // 2. Intentar capturar el contenido 3D de diferentes maneras
      let captured3D = false

      // Método 1: Usar el renderer existente de MindAR
      const renderer = findThreeRenderer()
      const camera = findThreeCamera()
      const scene = findThreeScene()

      if (renderer && camera && scene) {
        console.log('📦 Usando renderer de MindAR existente')

        // Preservar el buffer de dibujo
        const preserveDrawingBuffer = renderer.preserveDrawingBuffer
        renderer.preserveDrawingBuffer = true

        // Forzar un render
        renderer.render(scene, camera)

        // Obtener los datos del canvas del renderer
        const rendererCanvas = renderer.domElement
        if (rendererCanvas && rendererCanvas.width > 0 && rendererCanvas.height > 0) {
          try {
            // Superponer el render 3D sobre el video usando dimensiones exactas
            context.globalCompositeOperation = 'source-over'
            context.drawImage(rendererCanvas, 0, 0, video.videoWidth, video.videoHeight)
            captured3D = true
            console.log('✅ 3D content captured using existing renderer')
          } catch (e) {
            console.warn('Error drawing from renderer canvas:', e)
          }
        }

        // Restaurar configuración original
        renderer.preserveDrawingBuffer = preserveDrawingBuffer
      }

      // Método 2: Buscar canvas de Three.js en el DOM
      if (!captured3D) {
        console.log('🔍 Buscando canvas de Three.js en el DOM')
        const canvases = document.querySelectorAll('canvas')

        for (const threeCanvas of canvases) {
          // Verificar si es un canvas de Three.js (no el video)
          if (threeCanvas.width > 0 && threeCanvas.height > 0 && threeCanvas !== video && !threeCanvas.style.display === 'none') {
            try {
              console.log('🎯 Intentando capturar canvas:', {
                width: threeCanvas.width,
                height: threeCanvas.height,
                id: threeCanvas.id,
                className: threeCanvas.className,
              })

              context.globalCompositeOperation = 'source-over'
              // Usar las dimensiones exactas del video como destino
              context.drawImage(threeCanvas, 0, 0, video.videoWidth, video.videoHeight)
              captured3D = true
              console.log('✅ 3D content captured from DOM canvas')
              break
            } catch (e) {
              console.warn('Error capturing canvas:', e)
            }
          }
        }
      }

      // Método 3: Crear render temporal si tenemos escena y cámara
      if (!captured3D && scene && camera) {
        console.log('🛠️ Creando render temporal con dimensiones exactas del video')

        try {
          const tempCanvas = document.createElement('canvas')
          // Usar las dimensiones exactas del video
          tempCanvas.width = video.videoWidth
          tempCanvas.height = video.videoHeight

          const tempRenderer = new THREE.WebGLRenderer({
            canvas: tempCanvas,
            alpha: true,
            preserveDrawingBuffer: true,
            antialias: true,
          })
          tempRenderer.setSize(video.videoWidth, video.videoHeight)
          tempRenderer.setClearColor(0x000000, 0) // Transparente

          // Ajustar aspect ratio de la cámara usando dimensiones exactas del video
          const videoAspectRatio = video.videoWidth / video.videoHeight
          if (camera.aspect !== videoAspectRatio) {
            camera.aspect = videoAspectRatio
            camera.updateProjectionMatrix()
          }

          // Renderizar escena 3D
          tempRenderer.render(scene, camera)

          // Superponer el render 3D sobre el video
          context.globalCompositeOperation = 'source-over'
          context.drawImage(tempCanvas, 0, 0)

          // Limpiar renderer temporal
          tempRenderer.dispose()

          captured3D = true
          console.log('✅ 3D content captured using temporary renderer')
        } catch (e) {
          console.error('Error creating temporary renderer:', e)
        }
      }

      if (!captured3D) {
        console.warn('⚠️ No se pudo capturar contenido 3D - solo video')
      }

      return canvas.toDataURL('image/jpeg', 0.9)
    } catch (error) {
      console.error('Error capturando con AR:', error)
      // Fallback: capturar solo cámara
      return await captureCameraOnly()
    }
  }, [findVideoElement, findThreeRenderer, findThreeCamera, findThreeScene, captureCameraOnly])

  /**
   * Función principal de captura que intenta AR primero
   */
  const capturePhoto = useCallback(async () => {
    if (isCapturing) {
      console.log('Ya hay una captura en progreso')
      return null
    }

    setIsCapturing(true)

    try {
      // Verificar que el sistema AR esté listo
      const video = findVideoElement()
      if (!video) {
        throw new Error('Video de cámara no disponible - ¿AR inicializado?')
      }

      // Esperar un momento si el video acaba de cargarse
      if (!video.videoWidth || !video.videoHeight) {
        console.log('Esperando que el video tenga dimensiones válidas...')
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Verificar nuevamente después del timeout
        if (!video.videoWidth || !video.videoHeight) {
          throw new Error('El video no tiene dimensiones válidas después de esperar')
        }
      }

      // Intentar captura con AR primero
      let photoDataURL = await captureWithAR()

      // Si falla, capturar solo cámara
      if (!photoDataURL) {
        console.log('Captura AR falló - intentando solo cámara')
        photoDataURL = await captureCameraOnly()
      }

      if (photoDataURL) {
        setCapturedPhoto(photoDataURL)
        console.log('✅ Foto capturada exitosamente')
        return photoDataURL
      } else {
        throw new Error('No se pudo capturar la foto con ningún método')
      }
    } catch (error) {
      console.error('Error en capturePhoto:', error)
      alert(`Error al capturar la foto: ${error.message}`)
      return null
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, captureWithAR, captureCameraOnly, findVideoElement])

  /**
   * Guardar foto capturada
   */
  const savePhoto = useCallback((dataURL, filename) => {
    if (!dataURL) return false

    try {
      const link = document.createElement('a')
      link.href = dataURL

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.download = filename || `ar_photo_${timestamp}.jpg`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return true
    } catch (error) {
      console.error('Error guardando foto:', error)
      return false
    }
  }, [])

  /**
   * Capturar y guardar directamente
   */
  const captureAndSave = useCallback(
    async (filename) => {
      const photo = await capturePhoto()
      if (photo) {
        const saved = savePhoto(photo, filename)
        return { photo, saved }
      }
      return { photo: null, saved: false }
    },
    [capturePhoto, savePhoto]
  )

  /**
   * Limpiar foto capturada
   */
  const clearCapturedPhoto = useCallback(() => {
    setCapturedPhoto(null)
  }, [])

  /**
   * Debug: verificar estado del sistema AR (mostrando dimensiones exactas como useCamera)
   */
  const debugARState = useCallback(() => {
    console.log('🔍 DEBUG AR STATE:')
    console.log('- arManagerRef.current:', !!arManagerRef?.current)
    console.log('- sceneRef.current:', !!sceneRef?.current)

    const video = findVideoElement()
    console.log('- video element found:', !!video)

    if (video) {
      console.log('- video dimensions (like useCamera):', {
        videoWidth: video.videoWidth, // Dimensión real del stream
        videoHeight: video.videoHeight, // Dimensión real del stream
        clientWidth: video.clientWidth, // Dimensión visual en DOM
        clientHeight: video.clientHeight, // Dimensión visual en DOM
      })
      console.log('- video ready state:', video.readyState)
      console.log('- video paused:', video.paused)
      console.log('- video currentTime:', video.currentTime)
      console.log('- video duration:', video.duration)
    }

    const dimensions = getVideoDimensions()
    console.log('- calculated dimensions:', dimensions)

    // Debug Three.js components
    const renderer = findThreeRenderer()
    const camera = findThreeCamera()
    const scene = findThreeScene()

    console.log('- Three.js renderer:', !!renderer)
    console.log('- Three.js camera:', !!camera)
    console.log('- Three.js scene:', !!scene)

    if (renderer) {
      console.log('- renderer canvas:', {
        width: renderer.domElement.width,
        height: renderer.domElement.height,
        preserveDrawingBuffer: renderer.preserveDrawingBuffer,
      })
    }

    if (camera) {
      console.log('- camera properties:', {
        aspect: camera.aspect,
        fov: camera.fov,
        near: camera.near,
        far: camera.far,
      })
    }

    if (scene) {
      console.log('- scene children count:', scene.children.length)
      console.log(
        '- scene children:',
        scene.children.map((child) => ({
          type: child.type,
          name: child.name,
          visible: child.visible,
          position: { x: child.position.x, y: child.position.y, z: child.position.z },
        }))
      )
    }

    // Debug DOM canvases
    const canvases = document.querySelectorAll('canvas')
    console.log('- DOM canvases found:', canvases.length)
    canvases.forEach((canvas, index) => {
      console.log(`- Canvas ${index}:`, {
        width: canvas.width,
        height: canvas.height,
        id: canvas.id,
        className: canvas.className,
        style: canvas.style.cssText,
        isVideo: canvas === video,
      })
    })

    return {
      arManager: !!arManagerRef?.current,
      scene: !!sceneRef?.current,
      video: !!video,
      videoDimensions: video
        ? {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            clientWidth: video.clientWidth,
            clientHeight: video.clientHeight,
          }
        : null,
      threeRenderer: !!renderer,
      threeCamera: !!camera,
      threeScene: !!scene,
      sceneChildrenCount: scene ? scene.children.length : 0,
      domCanvasCount: canvases.length,
      calculatedDimensions: dimensions,
    }
  }, [arManagerRef, sceneRef, findVideoElement, getVideoDimensions, findThreeRenderer, findThreeCamera, findThreeScene])

  return {
    // Estado
    isCapturing,
    capturedPhoto,

    // Funciones principales
    capturePhoto,
    captureAndSave,
    savePhoto,
    clearCapturedPhoto,

    // Funciones específicas
    captureCameraOnly,
    captureWithAR,
    getVideoDimensions,

    // Debug
    debugARState,
  }
}
