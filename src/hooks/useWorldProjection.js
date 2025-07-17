// src/hooks/useWorldProjection.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import WorldToScreenProjector from '@/utils/worldToScreenUtils'
import * as THREE from 'three'

export const useWorldProjection = (arManagerRef, targetObject, isVisible = true) => {
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0, isVisible: false })
  const [projector, setProjector] = useState(null)
  const animationFrameRef = useRef(null)
  const lastPositionRef = useRef({ x: 0, y: 0, isVisible: false })

  // Inicializar proyector cuando esté disponible el AR Manager
  useEffect(() => {
    if (arManagerRef.current?.camera && arManagerRef.current?.renderer) {
      const newProjector = new WorldToScreenProjector(arManagerRef.current.camera, arManagerRef.current.renderer)
      setProjector(newProjector)
    }
  }, [arManagerRef])

  // Función para verificar si la posición cambió significativamente
  const hasPositionChanged = useCallback((newPos, threshold = 5) => {
    const lastPos = lastPositionRef.current
    return (
      Math.abs(newPos.x - lastPos.x) > threshold || Math.abs(newPos.y - lastPos.y) > threshold || newPos.isVisible !== lastPos.isVisible
    )
  }, [])

  // Actualizar posición en tiempo real con throttling
  useEffect(() => {
    if (!isVisible || !targetObject || !projector || !arManagerRef.current?.model?.object) {
      setScreenPosition({ x: 0, y: 0, isVisible: false })
      lastPositionRef.current = { x: 0, y: 0, isVisible: false }
      return
    }

    let frameCount = 0
    const updatePosition = () => {
      try {
        // Solo actualizar cada 3 frames para optimizar rendimiento
        frameCount++
        if (frameCount % 3 !== 0) {
          animationFrameRef.current = requestAnimationFrame(updatePosition)
          return
        }

        const worldPosition = new THREE.Vector3()
        arManagerRef.current.model.object.getWorldPosition(worldPosition)

        const screenPos = projector.worldToScreen(worldPosition, { x: 0, y: 0.3, z: 0 })

        // Solo actualizar si la posición cambió significativamente
        if (hasPositionChanged(screenPos)) {
          setScreenPosition(screenPos)
          lastPositionRef.current = screenPos
        }

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
  }, [isVisible, targetObject, projector, arManagerRef, hasPositionChanged])

  // Función memoizada para obtener posición óptima para popups
  const getOptimalPopupPosition = useCallback(
    (popupSize = { width: 320, height: 280 }) => {
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
    },
    [projector, arManagerRef]
  )

  // Función memoizada para obtener ángulo de conexión
  const getConnectionAngle = useCallback(
    (popupPosition) => {
      if (!projector || !screenPosition.isVisible) return 0
      return projector.getConnectionAngle(popupPosition, screenPosition)
    },
    [projector, screenPosition]
  )

  // Memoizar el estado del proyector
  const isProjectorReady = useMemo(() => !!projector, [projector])

  return {
    screenPosition,
    getOptimalPopupPosition,
    getConnectionAngle,
    isProjectorReady,
  }
}
