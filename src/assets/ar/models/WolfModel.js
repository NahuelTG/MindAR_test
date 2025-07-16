import { BaseModel } from './BaseModel'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'

export class WolfModel extends BaseModel {
  constructor() {
    super()
    this.targetSrc = '/wolf.mind'
    this.config = {
      modelPath: '/wolf.glb',
      scale: { x: 0.15, y: 0.15, z: 0.15 },
      position: { x: 0, y: -0.1, z: 0 },
      rotation: { speed: Math.PI / 6 },
      animationTimeScale: 0.8,
    }

    // Propiedades para el manejo de animaciones
    this.animations = []
    this.currentAnimationIndex = 0
    this.currentAction = null
    this.animationNames = []
    this.isAnimationPaused = false

    // Callbacks para el control de animaciones
    this.onAnimationChanged = null

    // Nombres temáticos para las animaciones
    this.thematicNames = ['Explorador del Bosque', 'Cazador Sigiloso', 'Líder de la Manada', 'Guardián Nocturno', 'Espíritu Salvaje']
  }

  static async create() {
    const model = new WolfModel()
    await model.load()
    return model
  }

  async load() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.load(
        this.config.modelPath,
        (gltf) => {
          this.object = gltf.scene
          this.object.scale.set(this.config.scale.x, this.config.scale.y, this.config.scale.z)
          this.object.position.set(this.config.position.x, this.config.position.y, this.config.position.z)

          // Configurar animaciones
          if (gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.object)
            this.animations = gltf.animations

            // Usar nombres temáticos o nombres originales como fallback
            this.animationNames = this.animations.map((clip, index) => {
              return this.thematicNames[index] || clip.name || `Animación ${index + 1}`
            })

            console.log('Animaciones disponibles:', this.animationNames)

            // Reproducir la primera animación
            this.playAnimation(0)
          }

          resolve()
        },
        undefined,
        reject
      )
    })
  }

  playAnimation(index) {
    if (index < 0 || index >= this.animations.length) {
      console.warn('Índice de animación inválido:', index)
      return
    }

    // Detener la animación actual si existe
    if (this.currentAction) {
      this.currentAction.fadeOut(0.3)
    }

    // Configurar la nueva animación
    const clip = this.animations[index]
    this.currentAction = this.mixer.clipAction(clip)
    this.currentAction.timeScale = this.config.animationTimeScale
    this.currentAction.reset()
    this.currentAction.fadeIn(0.3)
    this.currentAction.play()

    this.currentAnimationIndex = index
    this.isAnimationPaused = false

    // Notificar el cambio de animación
    if (this.onAnimationChanged) {
      this.onAnimationChanged(index, this.animationNames[index])
    }

    console.log(`Reproduciendo animación: ${this.animationNames[index]}`)

    // Disparar evento personalizado para el juego interactivo
    this.triggerAnimationEvent(index)
  }

  triggerAnimationEvent(animationIndex) {
    // Dispatch custom event that the game component can listen to
    const event = new CustomEvent('wolfAnimationChanged', {
      detail: {
        animationIndex,
        animationName: this.animationNames[animationIndex],
        timestamp: Date.now(),
      },
    })
    window.dispatchEvent(event)
  }

  nextAnimation() {
    const nextIndex = (this.currentAnimationIndex + 1) % this.animations.length
    this.playAnimation(nextIndex)
  }

  previousAnimation() {
    const prevIndex = (this.currentAnimationIndex - 1 + this.animations.length) % this.animations.length
    this.playAnimation(prevIndex)
  }

  togglePause() {
    if (!this.currentAction) return

    if (this.isAnimationPaused) {
      this.currentAction.play()
      this.isAnimationPaused = false
    } else {
      this.currentAction.stop()
      this.isAnimationPaused = true
    }

    return !this.isAnimationPaused
  }

  setAnimationSpeed(speed) {
    if (this.currentAction) {
      this.currentAction.timeScale = speed
    }
  }

  getCurrentAnimationName() {
    return this.animationNames[this.currentAnimationIndex] || 'Sin nombre'
  }

  getAnimationInfo() {
    return {
      currentIndex: this.currentAnimationIndex,
      currentName: this.getCurrentAnimationName(),
      totalAnimations: this.animations.length,
      animationNames: this.animationNames,
      isPaused: this.isAnimationPaused,
    }
  }

  onTargetFound() {
    console.log('¡Lobo detectado!')
    console.log(`Animación actual: ${this.getCurrentAnimationName()}`)

    // Disparar evento cuando se encuentra el target
    window.dispatchEvent(
      new CustomEvent('wolfTargetFound', {
        detail: {
          currentAnimation: this.currentAnimationIndex,
          animationName: this.getCurrentAnimationName(),
        },
      })
    )
  }

  onTargetLost() {
    console.log('Lobo perdido')

    // Disparar evento cuando se pierde el target
    window.dispatchEvent(new CustomEvent('wolfTargetLost'))
  }

  cleanup() {
    if (this.currentAction) {
      this.currentAction.stop()
    }
    super.cleanup()
  }
}
