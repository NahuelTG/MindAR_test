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

          if (gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.object)
            gltf.animations.forEach((clip) => {
              const action = this.mixer.clipAction(clip)
              action.timeScale = this.config.animationTimeScale
              action.play()
            })
          }

          resolve()
        },
        undefined,
        reject
      )
    })
  }

  onTargetFound() {
    // Comportamiento específico del lobo al encontrar target
    console.log('¡Lobo detectado!')
  }
}
