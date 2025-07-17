import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { ModelFactory } from './models/ModelFactory'
import { LightingManager } from './lighting/LightingManager'

export class ARManager {
  constructor(container) {
    this.container = container
    this.mindarInstance = null
    this.scene = null
    this.renderer = null
    this.camera = null
    this.model = null
    this.clock = new THREE.Clock()
    this.canvas = null
    this.cleanupFunctions = []
    this.currentDimensions = { width: 0, height: 0 }
    this.isInitialized = false
    this.isCleanedUp = false
    this.videoElement = null

    // Nuevas propiedades para el modo estático
    this.isStaticMode = false
    this.staticGroup = null
    this.savedPosition = null
    this.savedRotation = null
    this.savedScale = null
    this.anchor = null

    // Callbacks para el estado del target
    this.onTargetFound = null
    this.onTargetLost = null

    // Propiedades para la configuración de cámara mejorada
    this.cameraConfig = {
      actualResolution: { width: 0, height: 0 },
      aspectRatio: 1,
      isMobile: window.innerWidth <= 768,
    }
  }

  async initialize(modelType, dimensions = null) {
    if (this.isInitialized || this.isCleanedUp) {
      console.warn('ARManager ya ha sido inicializado o limpiado')
      return
    }

    try {
      // Guardar dimensiones iniciales
      if (dimensions) {
        this.currentDimensions = dimensions
      } else {
        this.currentDimensions = {
          width: window.innerWidth,
          height: window.innerHeight,
        }
      }

      this.cameraConfig.isMobile = this.currentDimensions.width <= 768

      // Crear modelo
      this.model = await ModelFactory.createModel(modelType)

      // Inicializar MindAR con configuración mejorada para móviles
      this.mindarInstance = new MindARThree({
        container: this.container,
        imageTargetSrc: this.model.targetSrc,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
        maxTrack: 1,
        filterMinCF: 0.0001,
        filterBeta: 0.001,
        missTolerance: 0,
        warmupTolerance: 5,
        // Configuración específica para móviles mejorada
        videoSettings: {
          facingMode: 'environment',
        },
      })

      const { renderer, scene, camera } = this.mindarInstance
      this.renderer = renderer
      this.scene = scene
      this.camera = camera

      // Configurar el renderer
      this.setupRenderer()

      // Configurar la cámara mejorada para móviles
      await this.setupImprovedMobileCamera()

      // Configurar iluminación
      const lightingManager = new LightingManager(scene)
      lightingManager.setupLights()

      // Configurar anchor y guardarlo en la instancia
      this.anchor = this.mindarInstance.addAnchor(0)
      this.anchor.group.add(this.model.object)
      this.model.object.visible = false

      // Crear grupo para el modo estático
      this.staticGroup = new THREE.Group()
      this.scene.add(this.staticGroup)

      // Configurar eventos con protección contra errores
      this.setupAnchorEvents(this.anchor)

      // Iniciar MindAR con manejo de errores
      await this.mindarInstance.start()

      // Configurar loop de renderizado
      this.setupRenderLoop()

      // Configurar redimensionamiento con protección
      this.setupResize()

      this.isInitialized = true

      // Log de información del modelo para debug
      if (modelType === 'wolf' && this.model.getAnimationInfo) {
        console.log('Información del modelo Wolf:', this.model.getAnimationInfo())
      }
    } catch (error) {
      console.error('Error initializing AR:', error)
      this.cleanup()
      throw error
    }
  }

  async setupImprovedMobileCamera() {
    try {
      const isMobile = this.cameraConfig.isMobile

      // Obtener la resolución de la pantalla para calcular constraints óptimos
      const screenWidth = this.currentDimensions.width
      const screenHeight = this.currentDimensions.height
      const screenAspectRatio = screenWidth / screenHeight

      console.log(`Configurando cámara para: ${screenWidth}x${screenHeight} (${screenAspectRatio.toFixed(2)})`)

      // Configurar constraints optimizadas según el dispositivo
      let cameraConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: screenWidth },
          height: { ideal: screenHeight },
          aspectRatio: { ideal: screenAspectRatio },
        },
      }

      if (isMobile) {
        // Para móviles, usar resoluciones más comunes y que se adapten mejor
        const isPortrait = screenHeight > screenWidth

        if (isPortrait) {
          // Modo portrait - usar resoluciones 4:3 o 16:9 estándar
          cameraConstraints.video = {
            facingMode: 'environment',
            width: {
              min: 480,
              ideal: Math.min(screenWidth, 1080),
              max: 1920,
            },
            height: {
              min: 640,
              ideal: Math.min(screenHeight, 1920),
              max: 2560,
            },
            aspectRatio: {
              ideal: screenAspectRatio,
              min: 0.5,
              max: 2.0,
            },
            frameRate: { ideal: 30, max: 60 },
          }
        } else {
          // Modo landscape
          cameraConstraints.video = {
            facingMode: 'environment',
            width: {
              min: 640,
              ideal: Math.min(screenWidth, 1920),
              max: 1920,
            },
            height: {
              min: 480,
              ideal: Math.min(screenHeight, 1080),
              max: 1080,
            },
            aspectRatio: {
              ideal: screenAspectRatio,
              min: 1.0,
              max: 2.5,
            },
            frameRate: { ideal: 30, max: 60 },
          }
        }
      }

      console.log('Camera constraints:', cameraConstraints)

      const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints)

      // Buscar el elemento de video existente o crear uno nuevo
      this.videoElement = this.container.querySelector('video') || document.createElement('video')

      if (!this.container.contains(this.videoElement)) {
        this.container.appendChild(this.videoElement)
      }

      this.videoElement.srcObject = stream
      this.videoElement.autoplay = true
      this.videoElement.playsInline = true
      this.videoElement.muted = true

      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play()

          // Obtener las dimensiones reales del video
          const actualVideoWidth = this.videoElement.videoWidth
          const actualVideoHeight = this.videoElement.videoHeight
          const actualAspectRatio = actualVideoWidth / actualVideoHeight

          // Guardar configuración real de la cámara
          this.cameraConfig.actualResolution = {
            width: actualVideoWidth,
            height: actualVideoHeight,
          }
          this.cameraConfig.aspectRatio = actualAspectRatio

          console.log(`Video configurado: ${actualVideoWidth}x${actualVideoHeight} (${actualAspectRatio.toFixed(2)})`)
          console.log(`Pantalla: ${screenWidth}x${screenHeight} (${screenAspectRatio.toFixed(2)})`)

          // Aplicar estilos optimizados
          this.applyImprovedVideoStyles()

          resolve()
        }
      })
    } catch (error) {
      console.error('Error configurando cámara móvil:', error)
      throw error
    }
  }

  applyImprovedVideoStyles() {
    if (!this.videoElement) return

    const isMobile = this.cameraConfig.isMobile
    //const videoWidth = this.cameraConfig.actualResolution.width
    //const videoHeight = this.cameraConfig.actualResolution.height
    const videoAspectRatio = this.cameraConfig.aspectRatio

    const screenWidth = this.currentDimensions.width
    const screenHeight = this.currentDimensions.height
    const screenAspectRatio = screenWidth / screenHeight

    console.log(`Aplicando estilos - Video: ${videoAspectRatio.toFixed(2)}, Pantalla: ${screenAspectRatio.toFixed(2)}`)

    if (isMobile) {
      // Para móviles, asegurar que el video llene toda la pantalla correctamente
      let videoStyles = `
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        object-fit: cover !important;
        object-position: center !important;
        z-index: 1 !important;
      `

      // Calcular dimensiones que mantengan la proporción y llenen la pantalla
      if (videoAspectRatio > screenAspectRatio) {
        // Video más ancho que pantalla - ajustar por altura
        videoStyles += `
          height: 100vh !important;
          width: ${(100 * videoAspectRatio * screenHeight) / screenWidth}vw !important;
          min-height: 100vh !important;
          min-width: 100vw !important;
        `
      } else {
        // Video más alto que pantalla - ajustar por ancho
        videoStyles += `
          width: 100vw !important;
          height: ${(100 * screenWidth) / (videoAspectRatio * screenHeight)}vh !important;
          min-width: 100vw !important;
          min-height: 100vh !important;
        `
      }

      this.videoElement.style.cssText = videoStyles
    } else {
      // Estilos para desktop
      this.videoElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        z-index: 1;
      `
    }
  }

  // Método para obtener las dimensiones reales de captura para móviles
  getCaptureResolution() {
    if (!this.videoElement || !this.cameraConfig.actualResolution.width) {
      return {
        width: this.currentDimensions.width,
        height: this.currentDimensions.height,
      }
    }

    const isMobile = this.cameraConfig.isMobile

    if (isMobile) {
      // Para móviles, usar la resolución real del video
      const videoWidth = this.cameraConfig.actualResolution.width
      const videoHeight = this.cameraConfig.actualResolution.height
      const videoAspectRatio = this.cameraConfig.aspectRatio

      const screenWidth = this.currentDimensions.width
      const screenHeight = this.currentDimensions.height
      const screenAspectRatio = screenWidth / screenHeight

      // Calcular las dimensiones de captura basadas en cómo se muestra el video
      let captureWidth, captureHeight

      if (videoAspectRatio > screenAspectRatio) {
        // Video más ancho - se corta horizontalmente
        captureHeight = videoHeight
        captureWidth = videoHeight * screenAspectRatio
      } else {
        // Video más alto - se corta verticalmente
        captureWidth = videoWidth
        captureHeight = videoWidth / screenAspectRatio
      }

      return {
        width: Math.round(captureWidth),
        height: Math.round(captureHeight),
        videoWidth,
        videoHeight,
        cropX: Math.round((videoWidth - captureWidth) / 2),
        cropY: Math.round((videoHeight - captureHeight) / 2),
      }
    }

    return {
      width: this.currentDimensions.width,
      height: this.currentDimensions.height,
    }
  }

  // [El resto de los métodos permanecen igual...]
  setupRenderer() {
    if (!this.renderer || this.isCleanedUp) return

    try {
      // Configurar el tamaño del renderer con validación
      const width = Math.max(this.currentDimensions.width, 1)
      const height = Math.max(this.currentDimensions.height, 1)

      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

      // Configurar el canvas para que ocupe todo el contenedor
      const canvas = this.renderer.domElement
      if (canvas) {
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.objectFit = 'cover'
        canvas.style.objectPosition = 'center'
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.zIndex = '2'
      }
    } catch (error) {
      console.error('Error configurando renderer:', error)
    }
  }

  setupAnchorEvents(anchor) {
    if (!anchor || this.isCleanedUp) return

    try {
      anchor.onTargetFound = () => {
        if (this.isCleanedUp) return

        console.log('Target encontrado')

        if (!this.isStaticMode) {
          this.model.object.visible = true
        }

        // Ejecutar callbacks externos
        if (this.onTargetFound) {
          this.onTargetFound()
        }

        // Ejecutar callback del modelo
        if (this.model?.onTargetFound) {
          this.model.onTargetFound()
        }
      }

      anchor.onTargetLost = () => {
        if (this.isCleanedUp) return

        console.log('Target perdido')

        if (!this.isStaticMode) {
          this.model.object.visible = false
        }

        // Ejecutar callbacks externos
        if (this.onTargetLost) {
          this.onTargetLost()
        }

        // Ejecutar callback del modelo
        if (this.model?.onTargetLost) {
          this.model.onTargetLost()
        }
      }
    } catch (error) {
      console.error('Error configurando eventos del anchor:', error)
    }
  }

  setStaticMode(enabled) {
    if (this.isCleanedUp) return

    this.isStaticMode = enabled

    if (enabled) {
      this.activateStaticMode()
    } else {
      this.deactivateStaticMode()
    }
  }

  activateStaticMode() {
    if (this.isCleanedUp || !this.model?.object?.visible) {
      console.log('No se puede activar modo estático: objeto no disponible')
      return
    }

    try {
      // Guardar la posición actual del objeto en el mundo
      const worldPosition = new THREE.Vector3()
      const worldRotation = new THREE.Euler()
      const worldScale = new THREE.Vector3()

      this.model.object.getWorldPosition(worldPosition)
      this.model.object.getWorldQuaternion(new THREE.Quaternion().setFromEuler(worldRotation))
      this.model.object.getWorldScale(worldScale)

      // Guardar las transformaciones
      this.savedPosition = worldPosition.clone()
      this.savedRotation = worldRotation.clone()
      this.savedScale = worldScale.clone()

      // Remover el objeto del anchor
      if (this.anchor) {
        this.anchor.group.remove(this.model.object)
      }

      // Aplicar las transformaciones guardadas al objeto
      this.model.object.position.copy(this.savedPosition)
      this.model.object.rotation.copy(this.savedRotation)
      this.model.object.scale.copy(this.savedScale)

      // Añadir el objeto al grupo estático
      if (this.staticGroup) {
        this.staticGroup.add(this.model.object)
      }

      // Asegurar que el objeto esté visible
      this.model.object.visible = true

      console.log('Modo estático activado')
    } catch (error) {
      console.error('Error activando modo estático:', error)
    }
  }

  deactivateStaticMode() {
    if (this.isCleanedUp) return

    try {
      if (this.staticGroup && this.staticGroup.children.includes(this.model.object)) {
        // Remover del grupo estático
        this.staticGroup.remove(this.model.object)

        // Resetear transformaciones
        this.model.object.position.set(0, 0, 0)
        this.model.object.rotation.set(0, 0, 0)
        this.model.object.scale.set(1, 1, 1)

        // Volver a añadir al anchor
        if (this.anchor) {
          this.anchor.group.add(this.model.object)
        }

        // El objeto será visible solo cuando se detecte el target
        this.model.object.visible = false
      }

      console.log('Modo estático desactivado')
    } catch (error) {
      console.error('Error desactivando modo estático:', error)
    }
  }

  resetObjectPosition() {
    if (this.isCleanedUp) return

    try {
      if (this.isStaticMode) {
        // Desactivar modo estático
        this.deactivateStaticMode()
        this.isStaticMode = false
      }

      // Resetear posición del objeto
      if (this.model?.object) {
        this.model.object.position.set(0, 0, 0)
        this.model.object.rotation.set(0, 0, 0)
        this.model.object.scale.set(1, 1, 1)
      }

      console.log('Posición del objeto reseteada')
    } catch (error) {
      console.error('Error reseteando posición:', error)
    }
  }

  // Método mejorado para manejar el redimensionamiento
  handleResize(width, height) {
    if (this.isCleanedUp || !this.renderer || !this.camera) return

    try {
      // Validar dimensiones
      const validWidth = Math.max(width || window.innerWidth, 1)
      const validHeight = Math.max(height || window.innerHeight, 1)

      // Actualizar dimensiones
      this.currentDimensions = { width: validWidth, height: validHeight }
      this.cameraConfig.isMobile = validWidth <= 768

      // Redimensionar el renderer
      this.renderer.setSize(validWidth, validHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

      // Actualizar la cámara de Three.js
      this.camera.aspect = validWidth / validHeight
      this.camera.updateProjectionMatrix()

      // Reajustar el video para móviles
      this.applyImprovedVideoStyles()

      // Notificar a MindAR del cambio de tamaño de forma segura
      if (this.mindarInstance && typeof this.mindarInstance.resize === 'function') {
        this.mindarInstance.resize()
      }

      console.log(`Redimensionado a: ${validWidth}x${validHeight}`)
    } catch (error) {
      console.error('Error en handleResize:', error)
    }
  }

  setupRenderLoop() {
    if (this.isCleanedUp) return

    try {
      this.renderer.setAnimationLoop(() => {
        if (this.isCleanedUp) return

        const delta = this.clock.getDelta()

        if (this.model?.object?.visible && this.model.update) {
          this.model.update(delta)
        }

        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera)
        }
      })
    } catch (error) {
      console.error('Error configurando render loop:', error)
    }
  }

  setupResize() {
    if (this.isCleanedUp) return

    const onResize = () => {
      if (this.isCleanedUp) return

      try {
        if (this.container && this.renderer && this.camera) {
          const { clientWidth, clientHeight } = this.container
          this.handleResize(clientWidth, clientHeight)
        }
      } catch (error) {
        console.error('Error en onResize:', error)
      }
    }

    const onOrientationChange = () => {
      if (this.isCleanedUp) return
      // Esperar a que la orientación cambie completamente
      setTimeout(onResize, 500)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    // Aplicar tamaño inicial
    setTimeout(onResize, 100)

    this.cleanupFunctions.push(() => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientationChange)
    })
  }

  // Métodos de conveniencia para acceder a las funciones del modelo
  getModelAnimationInfo() {
    if (this.isCleanedUp) return null
    return this.model?.getAnimationInfo?.() || null
  }

  playModelAnimation(index) {
    if (this.isCleanedUp) return
    this.model?.playAnimation?.(index)
  }

  nextModelAnimation() {
    if (this.isCleanedUp) return
    this.model?.nextAnimation?.()
  }

  previousModelAnimation() {
    if (this.isCleanedUp) return
    this.model?.previousAnimation?.()
  }

  toggleModelAnimation() {
    if (this.isCleanedUp) return false
    return this.model?.togglePause?.() || false
  }

  setModelAnimationSpeed(speed) {
    if (this.isCleanedUp) return
    this.model?.setAnimationSpeed?.(speed)
  }

  cleanup() {
    if (this.isCleanedUp) {
      console.log('ARManager ya ha sido limpiado')
      return
    }

    console.log('Limpiando ARManager')
    this.isCleanedUp = true

    try {
      // Limpiar funciones de limpieza registradas
      this.cleanupFunctions.forEach((fn) => {
        try {
          fn()
        } catch (error) {
          console.warn('Error ejecutando función de limpieza:', error)
        }
      })
      this.cleanupFunctions = []

      // Detener el renderer
      if (this.renderer) {
        this.renderer.setAnimationLoop(null)
        // No dispose del renderer aquí ya que pertenece a MindAR
      }

      // Limpiar el stream de video
      if (this.videoElement && this.videoElement.srcObject) {
        const stream = this.videoElement.srcObject
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
        this.videoElement.srcObject = null
      }

      // Detener MindAR de forma segura
      if (this.mindarInstance) {
        try {
          this.mindarInstance.stop()
        } catch (error) {
          console.warn('Error deteniendo MindAR:', error)
        }
      }

      // Limpiar el modelo
      if (this.model?.cleanup) {
        try {
          this.model.cleanup()
        } catch (error) {
          console.warn('Error limpiando modelo:', error)
        }
      }

      // Limpiar el contenedor
      if (this.container) {
        try {
          this.container.innerHTML = ''
        } catch (error) {
          console.warn('Error limpiando contenedor:', error)
        }
      }

      // Limpiar referencias
      this.staticGroup = null
      this.savedPosition = null
      this.savedRotation = null
      this.savedScale = null
      this.anchor = null
      this.model = null
      this.mindarInstance = null
      this.renderer = null
      this.scene = null
      this.camera = null
      this.videoElement = null

      console.log('ARManager limpiado exitosamente')
    } catch (error) {
      console.error('Error durante la limpieza del ARManager:', error)
    }
  }
}
