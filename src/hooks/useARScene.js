// 2. src/hooks/useARScene.js
import { useEffect, useRef, useState } from 'react'
import { ARManager } from '../assets/ar/ARManager'
import { modelConfigs } from '../assets/ar/models/modelConfigs'

export const useARScene = (modelType, dimensions) => {
  const sceneRef = useRef(null)
  const arManagerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isTargetFound, setIsTargetFound] = useState(false)

  useEffect(() => {
    if (!modelConfigs[modelType]) {
      setError(`Modelo "${modelType}" no encontrado`)
      return
    }

    document.body.classList.add('ar-active')
    return () => document.body.classList.remove('ar-active')
  }, [modelType])

  useEffect(() => {
    if (!sceneRef.current || !modelConfigs[modelType] || error) return

    const initAR = async () => {
      try {
        arManagerRef.current = new ARManager(sceneRef.current)
        arManagerRef.current.onTargetFound = () => setIsTargetFound(true)
        arManagerRef.current.onTargetLost = () => setIsTargetFound(false)
        await arManagerRef.current.initialize(modelType, dimensions)
        setLoading(false)
      } catch (err) {
        console.error('Error inicializando AR:', err)
        setError('Error al inicializar la experiencia AR')
        setLoading(false)
      }
    }

    initAR()

    return () => {
      if (arManagerRef.current) {
        arManagerRef.current.cleanup()
      }
    }
  }, [modelType, error, dimensions])

  return {
    sceneRef,
    arManagerRef,
    loading,
    error,
    isTargetFound,
  }
}
