import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'

import { useARScene } from '@/hooks/useARScene'
import { useARControls } from '@/hooks/useARControls'
import { useARCapture } from '@/hooks/useARCapture'
import { useWindowDimensions } from '@/hooks/useWindowDimensions'
import { useMobileOrientation } from '@/hooks/useMobileOrientation'

import LoadingScreen from './LoadingScreen'
import ARControls from './ARControls'
import AnimationControls from './AnimationControls'
import FloatingGamePopup from './FloatingGamePopup'
import GameNotifications from './GameNotifications'
import CaptureButton from './CaptureButton'
import DimensionsIndicator from './DimensionsIndicator'
import CameraDebugInfo from './CameraDebugInfo'

const ARScene = () => {
  const { modelType } = useParams()
  const navigate = useNavigate()
  const dimensions = useWindowDimensions()
  const { orientation } = useMobileOrientation()

  const { sceneRef, arManagerRef, loading, error, isTargetFound } = useARScene(modelType, dimensions)

  const { isStaticMode, toggleStaticMode, resetObjectPosition } = useARControls(arManagerRef)

  const { capturePhoto, isCapturing } = useARCapture(arManagerRef, sceneRef, dimensions)

  // Estado para el juego interactivo
  const [currentGameAnimation, setCurrentGameAnimation] = useState(null)
  const [showCameraDebug, setShowCameraDebug] = useState(false)

  // Función mejorada para volver al inicio
  const handleBackToHome = useCallback(() => {
    try {
      // Limpiar el AR Manager de forma segura
      if (arManagerRef.current) {
        console.log('Limpiando AR Manager...')
        arManagerRef.current.cleanup()
        arManagerRef.current = null
      }

      // Limpiar eventos globales
      window.removeEventListener('wolfAnimationChanged', () => {})
      window.removeEventListener('wolfTargetFound', () => {})
      window.removeEventListener('wolfTargetLost', () => {})

      // Remover clase AR del body
      document.body.classList.remove('ar-active')

      // Pequeña pausa antes de navegar para asegurar limpieza
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 100)
    } catch (error) {
      console.error('Error al limpiar:', error)
      // Navegar de todos modos
      navigate('/', { replace: true })
    }
  }, [navigate, arManagerRef])

  // Configurar viewport para móviles
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]')
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    } else {
      const viewport = document.createElement('meta')
      viewport.name = 'viewport'
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      document.head.appendChild(viewport)
    }

    // Prevenir zoom en inputs (iOS)
    const style = document.createElement('style')
    style.textContent = `
      @media screen and (max-width: 768px) {
        input, select, textarea {
          font-size: 16px !important;
        }
        
        /* Evitar el zoom en dispositivos iOS */
        * {
          -webkit-text-size-adjust: 100%;
          -webkit-tap-highlight-color: transparent;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // Escuchar eventos del modelo Wolf para juegos interactivos
  useEffect(() => {
    if (modelType !== 'wolf') return

    const handleAnimationChange = (event) => {
      setCurrentGameAnimation(event.detail.animationIndex)
    }

    const handleTargetFound = (event) => {
      setCurrentGameAnimation(event.detail.currentAnimation)
    }

    const handleTargetLost = () => {
      // Opcional: mantener el juego activo o pausarlo
    }

    window.addEventListener('wolfAnimationChanged', handleAnimationChange)
    window.addEventListener('wolfTargetFound', handleTargetFound)
    window.addEventListener('wolfTargetLost', handleTargetLost)

    return () => {
      window.removeEventListener('wolfAnimationChanged', handleAnimationChange)
      window.removeEventListener('wolfTargetFound', handleTargetFound)
      window.removeEventListener('wolfTargetLost', handleTargetLost)
    }
  }, [modelType])

  // Manejar resize del AR Manager con debounce y orientación
  useEffect(() => {
    if (!arManagerRef.current) return

    let timeoutId
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (arManagerRef.current) {
          console.log(`Redimensionando por orientación: ${orientation.type}`)
          arManagerRef.current.handleResize(dimensions.width, dimensions.height)
        }
      }, 200) // Aumentamos el delay para cambios de orientación
    }

    handleResize()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [dimensions, orientation, arManagerRef])

  // Manejar evento de retomar foto
  useEffect(() => {
    const handleRetakePhoto = () => {
      capturePhoto()
    }

    window.addEventListener('retakePhoto', handleRetakePhoto)
    return () => window.removeEventListener('retakePhoto', handleRetakePhoto)
  }, [capturePhoto])

  // Manejar controles de teclado para animaciones (solo para wolf)
  useEffect(() => {
    if (modelType !== 'wolf') return

    const handleKeyPress = (event) => {
      if (!arManagerRef.current?.model) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          arManagerRef.current.model.previousAnimation?.()
          break
        case 'ArrowRight':
          event.preventDefault()
          arManagerRef.current.model.nextAnimation?.()
          break
        case ' ':
          event.preventDefault()
          arManagerRef.current.model.togglePause?.()
          break
        case 'Escape':
          event.preventDefault()
          handleBackToHome()
          break
        case 'd':
        case 'D':
          if (isMobile) {
            event.preventDefault()
            setShowCameraDebug(!showCameraDebug)
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5': {
          event.preventDefault()
          const index = parseInt(event.key) - 1
          arManagerRef.current.model.playAnimation?.(index)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [modelType, arManagerRef, handleBackToHome])

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (arManagerRef.current) {
        arManagerRef.current.cleanup()
      }
      document.body.classList.remove('ar-active')
    }
  }, [arManagerRef])

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4 p-4">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-sm">{error}</p>
          <button onClick={handleBackToHome} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  const isMobile = dimensions.width <= 768

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden ar-scene-capture-target"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        // Asegurar que no haya scroll en móviles
        touchAction: 'none',
        overscrollBehavior: 'none',
      }}
    >
      <div
        ref={sceneRef}
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          // Corregir el aspect ratio en móviles
          aspectRatio: isMobile ? 'auto' : 'unset',
          // Evitar el zoom/pan en móviles
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          // Asegurar que el canvas use todo el espacio disponible
          display: 'block',
        }}
      />

      {loading && <LoadingScreen modelType={modelType} />}

      {!loading && (
        <>
          <CaptureButton
            onCapture={capturePhoto}
            isCapturing={isCapturing}
            style={{
              // Ajustar posición en móviles
              bottom: isMobile ? '120px' : '30px',
              right: isMobile ? '20px' : '30px',
            }}
          />

          <ARControls
            isStaticMode={isStaticMode}
            toggleStaticMode={toggleStaticMode}
            resetObjectPosition={resetObjectPosition}
            isTargetFound={isTargetFound}
            onBackToHome={handleBackToHome}
            isMobile={isMobile}
          />

          {/* Controles de animación solo para el modelo wolf */}
          <AnimationControls arManagerRef={arManagerRef} modelType={modelType} isVisible={!loading && isTargetFound} />

          {/* Pop-up flotante de juego desde el lobo */}
          {modelType === 'wolf' && (
            <FloatingGamePopup
              currentAnimation={currentGameAnimation}
              isVisible={!loading}
              isTargetFound={isTargetFound}
              arManagerRef={arManagerRef}
            />
          )}

          {/* Sistema de notificaciones */}
          <GameNotifications />

          {!isMobile && <DimensionsIndicator dimensions={dimensions} />}

          {/* Debug info para la cámara */}
          <CameraDebugInfo arManagerRef={arManagerRef} show={isMobile && showCameraDebug} />

          {/* Botón de debug para móviles */}
          {isMobile && (
            <button
              onClick={() => setShowCameraDebug(!showCameraDebug)}
              className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-red-500 bg-opacity-70 text-white rounded-full text-xs font-bold shadow-lg"
              style={{ fontSize: '10px' }}
            >
              📹
            </button>
          )}

          {/* Instrucciones mejoradas para wolf (solo desktop) */}
          {modelType === 'wolf' && !isMobile && (
            <div className="absolute bottom-4 left-4 z-40 pointer-events-none">
              <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-3 text-white text-xs max-w-xs">
                <p className="mb-2">
                  🎮 <strong>Controles:</strong>
                </p>
                <p className="mb-1">← → Cambiar animación</p>
                <p className="mb-1">Espacio: Pausar/Reproducir</p>
                <p className="mb-1">1-5: Seleccionar animación</p>
                <p className="mb-1">Escape: Volver al inicio</p>
                <p className="mt-2 text-purple-300">
                  🐺 <strong>¡El lobo te invitará a jugar!</strong>
                </p>
              </div>
            </div>
          )}

          {/* Indicador mejorado de juego activo */}
          {modelType === 'wolf' && isTargetFound && currentGameAnimation !== null && (
            <div className="absolute top-4 right-4 z-40 pointer-events-none">
              <div className="bg-purple-600 bg-opacity-80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm shadow-lg border border-purple-400 border-opacity-50 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">🎮 Lobo Interactivo</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ARScene
