import { BaseModel } from './BaseModel'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'

export class BeeModel extends BaseModel {
  constructor() {
    super()
    this.targetSrc = '/bee.mind'
    this.config = {
      modelPath: '/bee.glb',
      scale: { x: 0.1, y: 0.1, z: 0.1 },
      position: { x: 0, y: -0.2, z: 0 },
      rotation: { speed: Math.PI / 5 },
      animationTimeScale: 0.6,
    }
  }

  static async create() {
    const model = new BeeModel()
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
}
