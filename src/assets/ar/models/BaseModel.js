// assets/ar/models/BaseModel.js
import * as THREE from 'three'

export class BaseModel {
  constructor() {
    this.object = null
    this.mixer = null
    this.targetSrc = null
    this.config = null
  }

  async load() {
    // Implementar en subclases
    throw new Error('Método load debe ser implementado en subclases')
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta)
    }

    if (this.object && this.config.rotation) {
      this.object.rotation.y += delta * this.config.rotation.speed
    }
  }

  onTargetFound() {
    // Implementar en subclases si es necesario
  }

  onTargetLost() {
    // Implementar en subclases si es necesario
  }

  cleanup() {
    if (this.mixer) {
      this.mixer.stopAllAction()
    }
  }
}
