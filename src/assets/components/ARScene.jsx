import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ARManager } from '../ar/ARManager'
import { modelConfigs } from '../ar/models/modelConfigs'
import LoadingScreen from './LoadingScreen'

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

  // Función para manejar el redimensionamiento
  const handleResize = () => {
    const newDimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
    setDimensions(newDimensions)

    // Notificar al ARManager sobre el cambio de tamaño
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

    // Añadir listener para resize
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
  }, [modelType, error])

  const handleBackToHome = () => {
    if (arManagerRef.current) {
      arManagerRef.current.cleanup()
    }
    navigate('/')
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
      className="fixed inset-0 bg-black overflow-hidden"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      {/* Contenedor del canvas AR con aspect ratio preservado */}
      <div
        ref={sceneRef}
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />

      {loading && <LoadingScreen modelType={modelType} />}

      {/* Botón de volver optimizado para mobile */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <button
          onClick={handleBackToHome}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-black bg-opacity-70 cursor-pointer text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 text-sm sm:text-base"
        >
          ← Volver
        </button>
      </div>

      {/* Overlay para debugging (opcional - quitar en producción) */}

      <div className="absolute bottom-4 right-4 z-50 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
        {dimensions.width}x{dimensions.height}
      </div>
    </div>
  )
}

export default ARScene
