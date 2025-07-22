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
      actualConstraints: null,
      mediaStream: null,
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

      console.log(`🎯 Configurando cámara para: ${screenWidth}x${screenHeight} (AR: ${screenAspectRatio.toFixed(3)})`)

      // ============ NUEVA LÓGICA DE CONSTRAINTS ============
      let cameraConstraints

      if (isMobile) {
        // Para móviles: usar el MISMO aspect ratio que la pantalla
        cameraConstraints = {
          video: {
            facingMode: 'environment',
            // Usar exactamente el mismo aspect ratio que la pantalla
            aspectRatio: { exact: screenAspectRatio },
            // Resoluciones que respeten este aspect ratio
            width: {
              min: screenWidth,
              ideal: screenWidth * 2, // 2x para mejor calidad
              max: screenWidth * 3,
            },
            height: {
              min: screenHeight,
              ideal: screenHeight * 2, // 2x para mejor calidad
              max: screenHeight * 3,
            },
            frameRate: { ideal: 30, max: 60 },
          },
        }
      } else {
        // Para desktop, comportamiento original
        cameraConstraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: screenWidth },
            height: { ideal: screenHeight },
            aspectRatio: { ideal: screenAspectRatio },
          },
        }
      }

      console.log('📹 Camera constraints:', cameraConstraints)

      const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints)

      // Guardar referencias para limpieza
      this.cameraConfig.mediaStream = stream

      // Obtener las configuraciones reales que se aplicaron
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const actualSettings = videoTrack.getSettings()
        this.cameraConfig.actualConstraints = actualSettings
        console.log('⚙️ Settings reales de cámara:', actualSettings)
      }

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

          console.log(`✅ Video configurado:`)
          console.log(`   📐 Resolución: ${actualVideoWidth}x${actualVideoHeight}`)
          console.log(`   📏 AR Video: ${actualAspectRatio.toFixed(3)}`)
          console.log(`   📱 AR Pantalla: ${screenAspectRatio.toFixed(3)}`)
          console.log(`   🎯 Diferencia AR: ${Math.abs(actualAspectRatio - screenAspectRatio).toFixed(3)}`)

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
    const videoAspectRatio = this.cameraConfig.aspectRatio
    const screenWidth = this.currentDimensions.width
    const screenHeight = this.currentDimensions.height
    const screenAspectRatio = screenWidth / screenHeight

    console.log(`🎨 Aplicando estilos - Video AR: ${videoAspectRatio.toFixed(3)}, Pantalla AR: ${screenAspectRatio.toFixed(3)}`)

    if (isMobile) {
      // Para móviles, usar object-fit: cover para llenar toda la pantalla
      // manteniendo las proporciones correctas
      const videoStyles = `
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        object-fit: cover !important;
        object-position: center !important;
        z-index: 1 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-width: 100vw !important;
        min-height: 100vh !important;
      `

      this.videoElement.style.cssText = videoStyles
      console.log('📱 Aplicados estilos móvil con object-fit: cover')
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

  // ============ MÉTODO DE CAPTURA COMPLETAMENTE REESCRITO ============
  getCaptureResolution() {
    if (!this.videoElement || !this.cameraConfig.actualResolution.width) {
      return {
        width: this.currentDimensions.width,
        height: this.currentDimensions.height,
        strategy: 'fallback',
      }
    }

    const isMobile = this.cameraConfig.isMobile

    if (isMobile) {
      const videoWidth = this.cameraConfig.actualResolution.width
      const videoHeight = this.cameraConfig.actualResolution.height
      const videoAspectRatio = this.cameraConfig.aspectRatio

      const screenWidth = this.currentDimensions.width
      const screenHeight = this.currentDimensions.height
      const screenAspectRatio = screenWidth / screenHeight

      console.log(`🔍 Calculando captura móvil:`)
      console.log(`   📹 Video: ${videoWidth}x${videoHeight} (AR: ${videoAspectRatio.toFixed(3)})`)
      console.log(`   📱 Pantalla: ${screenWidth}x${screenHeight} (AR: ${screenAspectRatio.toFixed(3)})`)

      // ============ NUEVA LÓGICA: NO HAY CROP, USAR TODO EL VIDEO ============
      // Si conseguimos el aspect ratio correcto, usar toda la imagen
      const aspectRatioDiff = Math.abs(videoAspectRatio - screenAspectRatio)

      if (aspectRatioDiff < 0.05) {
        // Tolerance de 5%
        console.log('✅ Aspect ratios coinciden, usar toda la imagen')
        return {
          width: videoWidth,
          height: videoHeight,
          strategy: 'full_video',
          videoWidth,
          videoHeight,
          cropX: 0,
          cropY: 0,
          note: 'Usando toda la imagen del video sin crop',
        }
      } else {
        console.log('⚠️ Aspect ratios difieren, aplicar crop inteligente')

        // Determinar cuál dimensión limita
        if (videoAspectRatio > screenAspectRatio) {
          // Video más ancho: crop horizontal (mantener altura)
          const newWidth = Math.round(videoHeight * screenAspectRatio)
          const cropX = Math.round((videoWidth - newWidth) / 2)

          console.log(`🔧 Crop horizontal: ${newWidth}x${videoHeight}, cropX: ${cropX}`)

          return {
            width: newWidth,
            height: videoHeight,
            strategy: 'crop_horizontal',
            videoWidth,
            videoHeight,
            cropX,
            cropY: 0,
            note: `Crop horizontal de ${cropX}px por lado`,
          }
        } else {
          // Video más alto: crop vertical (mantener ancho)
          const newHeight = Math.round(videoWidth / screenAspectRatio)
          const cropY = Math.round((videoHeight - newHeight) / 2)

          console.log(`🔧 Crop vertical: ${videoWidth}x${newHeight}, cropY: ${cropY}`)

          return {
            width: videoWidth,
            height: newHeight,
            strategy: 'crop_vertical',
            videoWidth,
            videoHeight,
            cropX: 0,
            cropY,
            note: `Crop vertical de ${cropY}px arriba y abajo`,
          }
        }
      }
    }

    // Desktop: sin cambios
    return {
      width: this.currentDimensions.width,
      height: this.currentDimensions.height,
      strategy: 'desktop',
    }
  }

  // ============ MÉTODO PARA OBTENER CONFIGURACIÓN DE DEBUG ============
  getCameraDebugInfo() {
    return {
      screen: {
        width: this.currentDimensions.width,
        height: this.currentDimensions.height,
        aspectRatio: this.currentDimensions.width / this.currentDimensions.height,
      },
      video: {
        width: this.cameraConfig.actualResolution.width,
        height: this.cameraConfig.actualResolution.height,
        aspectRatio: this.cameraConfig.aspectRatio,
      },
      capture: this.getCaptureResolution(),
      actualConstraints: this.cameraConfig.actualConstraints,
      isMobile: this.cameraConfig.isMobile,
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

        if (this.onTargetFound) {
          this.onTargetFound()
        }

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

        if (this.onTargetLost) {
          this.onTargetLost()
        }

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
      const worldPosition = new THREE.Vector3()
      const worldRotation = new THREE.Euler()
      const worldScale = new THREE.Vector3()

      this.model.object.getWorldPosition(worldPosition)
      this.model.object.getWorldQuaternion(new THREE.Quaternion().setFromEuler(worldRotation))
      this.model.object.getWorldScale(worldScale)

      this.savedPosition = worldPosition.clone()
      this.savedRotation = worldRotation.clone()
      this.savedScale = worldScale.clone()

      if (this.anchor) {
        this.anchor.group.remove(this.model.object)
      }

      this.model.object.position.copy(this.savedPosition)
      this.model.object.rotation.copy(this.savedRotation)
      this.model.object.scale.copy(this.savedScale)

      if (this.staticGroup) {
        this.staticGroup.add(this.model.object)
      }

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
        this.staticGroup.remove(this.model.object)

        this.model.object.position.set(0, 0, 0)
        this.model.object.rotation.set(0, 0, 0)
        this.model.object.scale.set(1, 1, 1)

        if (this.anchor) {
          this.anchor.group.add(this.model.object)
        }

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
        this.deactivateStaticMode()
        this.isStaticMode = false
      }

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

  handleResize(width, height) {
    if (this.isCleanedUp || !this.renderer || !this.camera) return

    try {
      const validWidth = Math.max(width || window.innerWidth, 1)
      const validHeight = Math.max(height || window.innerHeight, 1)

      this.currentDimensions = { width: validWidth, height: validHeight }
      this.cameraConfig.isMobile = validWidth <= 768

      this.renderer.setSize(validWidth, validHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

      this.camera.aspect = validWidth / validHeight
      this.camera.updateProjectionMatrix()

      this.applyImprovedVideoStyles()

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
      setTimeout(onResize, 500)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientationChange)

    setTimeout(onResize, 100)

    this.cleanupFunctions.push(() => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientationChange)
    })
  }

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
      this.cleanupFunctions.forEach((fn) => {
        try {
          fn()
        } catch (error) {
          console.warn('Error ejecutando función de limpieza:', error)
        }
      })
      this.cleanupFunctions = []

      if (this.renderer) {
        this.renderer.setAnimationLoop(null)
      }

      // Limpiar el stream de video
      if (this.cameraConfig.mediaStream) {
        const tracks = this.cameraConfig.mediaStream.getTracks()
        tracks.forEach((track) => track.stop())
        this.cameraConfig.mediaStream = null
      }

      if (this.videoElement && this.videoElement.srcObject) {
        const stream = this.videoElement.srcObject
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
        this.videoElement.srcObject = null
      }

      if (this.mindarInstance) {
        try {
          this.mindarInstance.stop()
        } catch (error) {
          console.warn('Error deteniendo MindAR:', error)
        }
      }

      if (this.model?.cleanup) {
        try {
          this.model.cleanup()
        } catch (error) {
          console.warn('Error limpiando modelo:', error)
        }
      }

      if (this.container) {
        try {
          this.container.innerHTML = ''
        } catch (error) {
          console.warn('Error limpiando contenedor:', error)
        }
      }

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
