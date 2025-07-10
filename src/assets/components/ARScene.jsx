// src/components/ARScene.jsx
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ARManager } from '../ar/ARManager'
import { modelConfigs } from '../ar/models/modelConfigs'
import { snapdom } from '@zumer/snapdom'
import LoadingScreen from './LoadingScreen'
import ARControlsInfo from './ARControlsInfo'

const ARScene = () => {
  const { modelType } = useParams()
  const navigate = useNavigate()
  const sceneRef = useRef(null)
  const arManagerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [isStaticMode, setIsStaticMode] = useState(false)
  const [isTargetFound, setIsTargetFound] = useState(false)

  const handleResize = () => {
    const newDimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
    setDimensions(newDimensions)

    if (arManagerRef.current) {
      arManagerRef.current.handleResize(newDimensions.width, newDimensions.height)
    }
  }

  useEffect(() => {
    if (!modelConfigs[modelType]) {
      setError(`Modelo "${modelType}" no encontrado`)
      return
    }

    document.body.classList.add('ar-active')
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      document.body.classList.remove('ar-active')
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
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

  const handleBackToHome = () => {
    if (arManagerRef.current) {
      arManagerRef.current.cleanup()
    }
    navigate('/')
  }

  const toggleStaticMode = () => {
    if (arManagerRef.current) {
      const newMode = !isStaticMode
      setIsStaticMode(newMode)
      arManagerRef.current.setStaticMode(newMode)
    }
  }

  const resetObjectPosition = () => {
    if (arManagerRef.current) {
      arManagerRef.current.resetObjectPosition()
      setIsStaticMode(false)
    }
  }

  const capturePhoto = async () => {
    try {
      if (!sceneRef.current) return

      const canvas = sceneRef.current.querySelector('canvas')
      if (!canvas) {
        console.error('No se encontró el canvas de WebGL dentro de sceneRef')
        return
      }

      // Método 4: Usar la API de Screen Capture (requiere permisos)
      if ('getDisplayMedia' in navigator.mediaDevices) {
        try {
          console.log('Intentando captura de pantalla...')
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' },
          })

          const video = document.createElement('video')
          video.srcObject = stream
          video.play()

          video.addEventListener('loadedmetadata', () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            const ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0)

            const dataURL = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.download = `ar-capture-${Date.now()}.png`
            link.href = dataURL
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Detener el stream
            stream.getTracks().forEach((track) => track.stop())
            console.log('Captura de pantalla exitosa')
          })
        } catch (screenError) {
          console.error('Captura de pantalla falló:', screenError)
        }
      }
    } catch (err) {
      console.error('Error general al capturar imagen:', err)
      alert('Error al capturar la imagen. Verifica la consola para más detalles.')
    }
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToHome} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden ar-scene-capture-target"
      style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
    >
      <div
        ref={sceneRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
      />

      {loading && <LoadingScreen modelType={modelType} />}

      {!loading && (
        <div className="absolute bottom-4 right-4 z-50 pointer-events-auto">
          <button onClick={capturePhoto} className="px-4 py-2 bg-yellow-500 text-black rounded-lg shadow-lg hover:bg-yellow-600 transition">
            📸 Capturar Foto
          </button>
        </div>
      )}

      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <button
          onClick={handleBackToHome}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-black bg-opacity-70 text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 text-sm sm:text-base"
        >
          ← Volver
        </button>
      </div>

      {!loading && (
        <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
          <button
            onClick={toggleStaticMode}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 ${
              isStaticMode
                ? 'bg-green-600 bg-opacity-80 text-white hover:bg-green-700'
                : 'bg-blue-600 bg-opacity-80 text-white hover:bg-blue-700'
            }`}
          >
            {isStaticMode ? '📍 Modo Fijo' : '🎯 Modo Tracking'}
          </button>

          {isStaticMode && (
            <button
              onClick={resetObjectPosition}
              className="px-3 py-2 bg-red-600 bg-opacity-80 text-white rounded-lg hover:bg-red-700 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 text-sm font-medium cursor-pointer"
            >
              🔄 Resetear
            </button>
          )}
        </div>
      )}

      {!loading && (
        <div className="absolute top-4 right-4 z-50 pointer-events-none">
          <div
            className={`px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm shadow-lg border border-white border-opacity-20 ${
              isTargetFound ? 'bg-green-600 bg-opacity-80 text-white' : 'bg-red-600 bg-opacity-80 text-white'
            }`}
          >
            {isTargetFound ? '✓ Patrón Detectado' : '✗ Buscando Patrón'}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-50 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
        {dimensions.width}x{dimensions.height}
      </div>
    </div>
  )
}

export default ARScene
