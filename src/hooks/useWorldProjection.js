// src/hooks/useWorldProjection.js
import { useState, useEffect, useRef } from 'react'
import WorldToScreenProjector from '@/utils/worldToScreenUtils'
import * as THREE from 'three'

export const useWorldProjection = (arManagerRef, targetObject, isVisible = true) => {
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0, isVisible: false })
  const [projector, setProjector] = useState(null)
  const animationFrameRef = useRef(null)

  // Inicializar proyector cuando esté disponible el AR Manager
  useEffect(() => {
    if (arManagerRef.current?.camera && arManagerRef.current?.renderer) {
      const newProjector = new WorldToScreenProjector(arManagerRef.current.camera, arManagerRef.current.renderer)
      setProjector(newProjector)
    }
  }, [arManagerRef])

  // Actualizar posición en tiempo real
  useEffect(() => {
    if (!isVisible || !targetObject || !projector || !arManagerRef.current?.model?.object) {
      setScreenPosition({ x: 0, y: 0, isVisible: false })
      return
    }

    const updatePosition = () => {
      try {
        const worldPosition = new THREE.Vector3()
        arManagerRef.current.model.object.getWorldPosition(worldPosition)

        const screenPos = projector.worldToScreen(worldPosition, { x: 0, y: 0.3, z: 0 })
        setScreenPosition(screenPos)

        if (screenPos.isVisible) {
          animationFrameRef.current = requestAnimationFrame(updatePosition)
        }
      } catch (error) {
        console.warn('Error updating projection:', error)
      }
    }

    updatePosition()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isVisible, targetObject, projector, arManagerRef])

  // Función para obtener posición óptima para popups
  const getOptimalPopupPosition = (popupSize = { width: 320, height: 280 }) => {
    if (!projector || !arManagerRef.current?.model?.object) {
      return { x: 0, y: 0, isVisible: false }
    }

    try {
      const worldPosition = new THREE.Vector3()
      arManagerRef.current.model.object.getWorldPosition(worldPosition)
      return projector.getOptimalPopupPosition(worldPosition, popupSize)
    } catch (error) {
      console.warn('Error getting optimal position:', error)
      return { x: 0, y: 0, isVisible: false }
    }
  }

  // Función para obtener ángulo de conexión
  const getConnectionAngle = (popupPosition) => {
    if (!projector || !screenPosition.isVisible) return 0
    return projector.getConnectionAngle(popupPosition, screenPosition)
  }

  return {
    screenPosition,
    getOptimalPopupPosition,
    getConnectionAngle,
    isProjectorReady: !!projector,
  }
}
