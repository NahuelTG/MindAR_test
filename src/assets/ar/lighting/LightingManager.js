import * as THREE from 'three'

export class LightingManager {
  constructor(scene) {
    this.scene = scene
  }

  setupLights() {
    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // Luz direccional principal
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(3, 5, 4)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    // Luz de relleno
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-3, 2, -4)
    this.scene.add(fillLight)

    // Luz puntual para destacar
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10)
    pointLight.position.set(0, 3, 2)
    this.scene.add(pointLight)
  }
}
