// 16. src/components/ARScene.jsx - Componente refactorizado
import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useARScene } from '../hooks/useARScene'
import { useARControls } from '../hooks/useARControls'
import { useARCapture } from '../hooks/useARCapture'
import { useWindowDimensions } from '../hooks/useWindowDimensions'
import LoadingScreen from './LoadingScreen'
import ARControls from './ARControls'
import CaptureButton from './CaptureButton'
import DimensionsIndicator from './DimensionsIndicator'

const ARScene = () => {
  const { modelType } = useParams()
  const navigate = useNavigate()
  const dimensions = useWindowDimensions()

  const { sceneRef, arManagerRef, loading, error, isTargetFound } = useARScene(modelType, dimensions)

  const { isStaticMode, toggleStaticMode, resetObjectPosition } = useARControls(arManagerRef)

  const { capturePhoto, isCapturing } = useARCapture(arManagerRef, sceneRef, dimensions)

  // Manejar resize del AR Manager
  useEffect(() => {
    if (arManagerRef.current) {
      arManagerRef.current.handleResize(dimensions.width, dimensions.height)
    }
  }, [dimensions])

  // Manejar evento de retomar foto
  useEffect(() => {
    const handleRetakePhoto = () => {
      capturePhoto()
    }

    window.addEventListener('retakePhoto', handleRetakePhoto)
    return () => window.removeEventListener('retakePhoto', handleRetakePhoto)
  }, [capturePhoto])

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
      className="fixed inset-0 bg-black overflow-hidden ar-scene-capture-target"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
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
        }}
      />

      {loading && <LoadingScreen modelType={modelType} />}

      {!loading && (
        <>
          <CaptureButton onCapture={capturePhoto} isCapturing={isCapturing} />

          <ARControls
            isStaticMode={isStaticMode}
            toggleStaticMode={toggleStaticMode}
            resetObjectPosition={resetObjectPosition}
            isTargetFound={isTargetFound}
            onBackToHome={handleBackToHome}
          />

          <DimensionsIndicator dimensions={dimensions} />
        </>
      )}
    </div>
  )
}

export default ARScene
