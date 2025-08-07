// components/CaptureButton.jsx - Versión mejorada
import { useState } from 'react'
import { useARCapture } from '@/hooks/useARCapture'

const CaptureButton = ({ arManagerRef, sceneRef, isMobile = false }) => {
  const {
    capturePhoto,
    isCapturing,
    capturedPhoto,
    savePhoto,
    clearCapturedPhoto,
    debugARState,
    getVideoDimensions,
    captureCameraOnly,
    captureWithAR,
  } = useARCapture(arManagerRef, sceneRef)

  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  const handleCapture = async () => {
    const result = await capturePhoto()
    if (result) {
      console.log('✅ Captura exitosa')
    }
  }

  const handleDebug = () => {
    const info = debugARState()
    setDebugInfo(info)
    setShowDebug(!showDebug)
  }

  const handleSave = () => {
    if (capturedPhoto) {
      const saved = savePhoto(capturedPhoto, `ar_capture_${Date.now()}.jpg`)
      if (saved) {
        alert('¡Foto guardada!')
        clearCapturedPhoto()
      }
    }
  }

  const handleDimensionsCheck = () => {
    const dims = getVideoDimensions()
    const video = dims.isVideoAvailable
      ? `Video: ${dims.width}x${dims.height}\nAspect Ratio: ${dims.aspectRatio.toFixed(2)}\nVideo disponible: ✅`
      : `Fallback: ${dims.width}x${dims.height}\nVideo disponible: ❌`

    alert(`Dimensiones (como useCamera):\n${video}`)
  }

  const handleForcedARCapture = async () => {
    console.log('🔬 Forzando captura AR...')
    const result = await captureWithAR()
    if (result) {
      console.log('✅ Captura AR forzada exitosa')
    }
  }

  const handleCameraOnlyCapture = async () => {
    console.log('📷 Captura solo cámara...')
    const result = await captureCameraOnly()
    if (result) {
      console.log('✅ Captura solo cámara exitosa')
    }
  }

  return (
    <>
      {/* Botón principal de captura */}
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? '20px' : '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
        }}
      >
        {/* Debug button (solo desarrollo) */}
        <>
          <button
            onClick={handleDebug}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 0, 0, 0.7)',
              border: '2px solid white',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title="Debug AR State"
          >
            🔍
          </button>

          <button
            onClick={handleForcedARCapture}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(128, 0, 128, 0.7)',
              border: '2px solid white',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title="Forzar captura AR"
          >
            🔬
          </button>

          <button
            onClick={handleCameraOnlyCapture}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 128, 0, 0.7)',
              border: '2px solid white',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title="Solo cámara"
          >
            📹
          </button>
        </>

        {/* Dimensiones button */}
        <button
          onClick={handleDimensionsCheck}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 255, 0.7)',
            border: '2px solid white',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
          title="Ver dimensiones"
        >
          📏
        </button>
        {/* Botón principal de captura */}
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          style={{
            width: isMobile ? '60px' : '70px',
            height: isMobile ? '60px' : '70px',
            borderRadius: '50%',
            backgroundColor: isCapturing ? '#ccc' : 'white',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            cursor: isCapturing ? 'not-allowed' : 'pointer',
            fontSize: isMobile ? '20px' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.2s ease',
          }}
          title={isCapturing ? 'Capturando...' : 'Capturar foto'}
        >
          {isCapturing ? '⏳' : '📷'}
        </button>
      </div>

      {/* Debug info panel */}
      {showDebug && debugInfo && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            right: '10px',
            zIndex: 60,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <strong>🔍 Debug AR State</strong>
            <button
              onClick={() => setShowDebug(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>

          <div>AR Manager: {debugInfo.arManager ? '✅' : '❌'}</div>
          <div>Scene Ref: {debugInfo.scene ? '✅' : '❌'}</div>
          <div>Video Element: {debugInfo.video ? '✅' : '❌'}</div>
          <div>
            Video Dimensions:{' '}
            {debugInfo.videoDimensions ? `${debugInfo.videoDimensions.videoWidth}x${debugInfo.videoDimensions.videoHeight}` : '❌'}
          </div>
          <div>
            Client Dimensions:{' '}
            {debugInfo.videoDimensions ? `${debugInfo.videoDimensions.clientWidth}x${debugInfo.videoDimensions.clientHeight}` : '❌'}
          </div>
          <div>Three.js Renderer: {debugInfo.threeRenderer ? '✅' : '❌'}</div>
          <div>Three.js Camera: {debugInfo.threeCamera ? '✅' : '❌'}</div>
          <div>Three.js Scene: {debugInfo.threeScene ? '✅' : '❌'}</div>
          <div>Scene Children: {debugInfo.sceneChildrenCount || 0}</div>
          <div>DOM Canvases: {debugInfo.domCanvasCount || 0}</div>
          <div>Dimensions OK: {debugInfo.calculatedDimensions?.isVideoAvailable ? '✅' : '❌'}</div>
        </div>
      )}

      {/* Modal de foto capturada */}
      {capturedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <h3 style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>📸 Foto AR Capturada</h3>

          <img
            src={capturedPhoto}
            alt="Foto capturada"
            style={{
              maxWidth: '90%',
              maxHeight: '60%',
              objectFit: 'contain',
              borderRadius: '10px',
              border: '2px solid white',
            }}
          />

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={clearCapturedPhoto}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ❌ Descartar
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                backgroundColor: '#44ff44',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              💾 Guardar
            </button>

            <button
              onClick={handleCapture}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4444ff',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              📷 Otra Foto
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default CaptureButton
