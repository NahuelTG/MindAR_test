// src/utils/worldToScreenUtils.js
import * as THREE from 'three'

export class WorldToScreenProjector {
  constructor(camera, renderer) {
    this.camera = camera
    this.renderer = renderer
    this.vector = new THREE.Vector3()
  }

  updateCamera(camera) {
    this.camera = camera
  }

  updateRenderer(renderer) {
    this.renderer = renderer
  }

  // Convierte posición 3D del mundo a coordenadas 2D de pantalla
  worldToScreen(worldPosition, offset = { x: 0, y: 0, z: 0 }) {
    if (!this.camera || !this.renderer) {
      return { x: 0, y: 0, isVisible: false }
    }

    // Crear vector con offset
    this.vector.copy(worldPosition)
    this.vector.add(new THREE.Vector3(offset.x, offset.y, offset.z))

    // Proyectar a coordenadas normalizadas del dispositivo (NDC)
    this.vector.project(this.camera)

    // Convertir NDC a coordenadas de píxeles
    const canvas = this.renderer.domElement
    const rect = canvas.getBoundingClientRect()

    const x = (this.vector.x * 0.5 + 0.5) * rect.width
    const y = (this.vector.y * -0.5 + 0.5) * rect.height

    // Verificar si está dentro de la pantalla y no está detrás de la cámara
    const isVisible = this.vector.z < 1 && x >= -50 && x <= rect.width + 50 && y >= -50 && y <= rect.height + 50

    return {
      x: Math.round(x),
      y: Math.round(y),
      isVisible,
      depth: this.vector.z,
    }
  }

  // Obtiene la posición óptima para mostrar un pop-up
  getOptimalPopupPosition(worldPosition, popupSize = { width: 300, height: 200 }) {
    const screenPos = this.worldToScreen(worldPosition, { x: 0, y: 0.3, z: 0 }) // Offset hacia arriba

    if (!screenPos.isVisible) {
      return { ...screenPos, x: 0, y: 0 }
    }

    const canvas = this.renderer.domElement
    const rect = canvas.getBoundingClientRect()

    let { x, y } = screenPos

    // Ajustar horizontalmente para que no se salga de la pantalla
    if (x + popupSize.width > rect.width) {
      x = rect.width - popupSize.width - 10
    }
    if (x < 10) {
      x = 10
    }

    // Ajustar verticalmente
    if (y + popupSize.height > rect.height) {
      y = rect.height - popupSize.height - 10
    }
    if (y < 10) {
      y = 10
    }

    return {
      x: Math.round(x),
      y: Math.round(y),
      isVisible: screenPos.isVisible,
      depth: screenPos.depth,
      originalX: screenPos.x,
      originalY: screenPos.y,
    }
  }

  // Calcula el ángulo para la flecha que conecta el pop-up con el lobo
  getConnectionAngle(popupPos, wolfPos) {
    const dx = wolfPos.x - (popupPos.x + 150) // Centro del popup
    const dy = wolfPos.y - (popupPos.y + 100)
    return Math.atan2(dy, dx) * (180 / Math.PI)
  }
}

export default WorldToScreenProjector
