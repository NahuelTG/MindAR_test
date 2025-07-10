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
  }

  async initialize(modelType, dimensions = null) {
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

      // Configurar el renderer con las dimensiones correctas
      this.setupRenderer()

      // Configurar la cámara
      await this.setupCamera()
      // Crear modelo
      this.model = await ModelFactory.createModel(modelType)

      // Inicializar MindAR sin animaciones UI
      this.mindarInstance = new MindARThree({
        container: this.container,
        imageTargetSrc: this.model.targetSrc,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
      })

      const { renderer, scene, camera } = this.mindarInstance
      this.renderer = renderer
      this.scene = scene
      this.camera = camera

      // Configurar iluminación
      const lightingManager = new LightingManager(scene)
      lightingManager.setupLights()

      // Configurar anchor
      const anchor = this.mindarInstance.addAnchor(0)
      anchor.group.add(this.model.object)
      this.model.object.visible = false

      // Configurar eventos
      this.setupAnchorEvents(anchor)

      // Iniciar MindAR
      await this.mindarInstance.start()

      // Configurar loop de renderizado
      this.setupRenderLoop()

      // Configurar redimensionamiento
      this.setupResize()
    } catch (error) {
      console.error('Error initializing AR:', error)
      throw error
    }
  }

  setupAnchorEvents(anchor) {
    anchor.onTargetFound = () => {
      console.log('Target encontrado')
      this.model.object.visible = true
      this.model.onTargetFound?.()
    }

    anchor.onTargetLost = () => {
      console.log('Target perdido')
      this.model.object.visible = false
      this.model.onTargetLost?.()
    }
  }

  setupRenderer() {
    if (this.renderer) {
      this.renderer.dispose()
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })

    // Configurar el tamaño del renderer
    this.renderer.setSize(this.currentDimensions.width, this.currentDimensions.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Configurar el canvas para que ocupe todo el contenedor
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.renderer.domElement.style.objectFit = 'cover'
    this.renderer.domElement.style.objectPosition = 'center'

    this.container.appendChild(this.renderer.domElement)
  }

  async setupCamera() {
    try {
      // Configurar constraints de video para mejor calidad
      const constraints = {
        video: {
          facingMode: 'environment', // Cámara trasera
          width: { ideal: this.currentDimensions.width },
          height: { ideal: this.currentDimensions.height },
          aspectRatio: { ideal: this.currentDimensions.width / this.currentDimensions.height },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Crear elemento de video
      this.videoElement = document.createElement('video')
      this.videoElement.srcObject = stream
      this.videoElement.autoplay = true
      this.videoElement.playsInline = true
      this.videoElement.muted = true

      // Configurar el video para que se ajuste correctamente
      this.videoElement.style.width = '100%'
      this.videoElement.style.height = '100%'
      this.videoElement.style.objectFit = 'cover'
      this.videoElement.style.objectPosition = 'center'

      // Añadir el video al contenedor (detrás del canvas)
      this.container.style.position = 'relative'
      this.container.insertBefore(this.videoElement, this.container.firstChild)

      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play()
          resolve()
        }
      })
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      throw error
    }
  }

  // Nuevo método para manejar el redimensionamiento
  handleResize(width, height) {
    // Actualizar dimensiones
    this.currentDimensions = { width, height }

    // Redimensionar el renderer
    if (this.renderer) {
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    // Actualizar la cámara de Three.js si existe
    if (this.camera) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }

    // Actualizar el video element
    if (this.videoElement) {
      // Reconfigurar constraints si es necesario
      this.updateVideoConstraints()
    }
  }

  updateVideoConstraints() {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject
      const videoTrack = stream.getVideoTracks()[0]

      if (videoTrack) {
        const constraints = {
          width: { ideal: this.currentDimensions.width },
          height: { ideal: this.currentDimensions.height },
          aspectRatio: { ideal: this.currentDimensions.width / this.currentDimensions.height },
        }

        videoTrack.applyConstraints(constraints).catch((error) => {
          console.warn('No se pudieron aplicar las nuevas constraints:', error)
        })
      }
    }
  }

  setupRenderLoop() {
    this.renderer.setAnimationLoop(() => {
      const delta = this.clock.getDelta()

      if (this.model.object.visible) {
        this.model.update?.(delta)
      }

      this.renderer.render(this.scene, this.camera)
    })
  }

  setupResize() {
    const onResize = () => {
      if (this.container && this.renderer && this.camera) {
        const { clientWidth, clientHeight } = this.container
        this.renderer.setSize(clientWidth, clientHeight)
        this.camera.aspect = clientWidth / clientHeight
        this.camera.updateProjectionMatrix()
      }
    }

    window.addEventListener('resize', onResize)
    onResize()

    this.cleanupFunctions.push(() => {
      window.removeEventListener('resize', onResize)
    })
  }

  cleanup() {
    console.log('Limpiando ARManager')

    this.cleanupFunctions.forEach((fn) => fn())
    this.cleanupFunctions = []

    // Limpiar video stream
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject
      const tracks = stream.getTracks()
      tracks.forEach((track) => track.stop())
    }

    if (this.renderer) {
      this.renderer.setAnimationLoop(null)
      this.renderer.dispose()
    }
    // Limpiar contenedor
    if (this.container) {
      this.container.innerHTML = ''
    }

    if (this.mindarInstance) {
      this.mindarInstance.stop()
    }

    if (this.model?.cleanup) {
      this.model.cleanup()
    }
  }
}
