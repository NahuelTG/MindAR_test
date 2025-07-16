// src/hooks/useARAnimations.js
import { useState, useEffect, useCallback } from 'react'

export const useARAnimations = (arManagerRef, modelType) => {
  const [animationInfo, setAnimationInfo] = useState(null)
  const [isSupported, setIsSupported] = useState(false)

  // Verificar si el modelo soporta animaciones múltiples
  useEffect(() => {
    setIsSupported(modelType === 'wolf')
  }, [modelType])

  // Configurar callbacks del modelo
  useEffect(() => {
    if (!arManagerRef.current?.model || !isSupported) return

    const model = arManagerRef.current.model

    // Configurar callback para cambios de animación
    const originalCallback = model.onAnimationChanged
    model.onAnimationChanged = (index, name) => {
      setAnimationInfo(model.getAnimationInfo())
      // Llamar al callback original si existe
      if (originalCallback) {
        originalCallback(index, name)
      }
    }

    // Obtener información inicial
    if (model.getAnimationInfo) {
      setAnimationInfo(model.getAnimationInfo())
    }

    return () => {
      if (model.onAnimationChanged) {
        model.onAnimationChanged = originalCallback
      }
    }
  }, [arManagerRef, isSupported])

  // Funciones de control
  const playAnimation = useCallback(
    (index) => {
      if (arManagerRef.current?.model?.playAnimation) {
        arManagerRef.current.model.playAnimation(index)
      }
    },
    [arManagerRef]
  )

  const nextAnimation = useCallback(() => {
    if (arManagerRef.current?.model?.nextAnimation) {
      arManagerRef.current.model.nextAnimation()
    }
  }, [arManagerRef])

  const previousAnimation = useCallback(() => {
    if (arManagerRef.current?.model?.previousAnimation) {
      arManagerRef.current.model.previousAnimation()
    }
  }, [arManagerRef])

  const togglePause = useCallback(() => {
    if (arManagerRef.current?.model?.togglePause) {
      const isPlaying = arManagerRef.current.model.togglePause()
      setAnimationInfo((prev) => ({ ...prev, isPaused: !isPlaying }))
      return isPlaying
    }
    return false
  }, [arManagerRef])

  const setAnimationSpeed = useCallback(
    (speed) => {
      if (arManagerRef.current?.model?.setAnimationSpeed) {
        arManagerRef.current.model.setAnimationSpeed(speed)
      }
    },
    [arManagerRef]
  )

  return {
    animationInfo,
    isSupported,
    playAnimation,
    nextAnimation,
    previousAnimation,
    togglePause,
    setAnimationSpeed,
  }
}
