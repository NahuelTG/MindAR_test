// src/components/CameraDebugInfo.jsx
import { useState, useEffect } from 'react'

const CameraDebugInfo = ({ arManagerRef, show = false }) => {
  const [debugInfo, setDebugInfo] = useState({
    screen: { width: 0, height: 0, aspectRatio: 0 },
    video: { width: 0, height: 0, aspectRatio: 0 },
    capture: { width: 0, height: 0, cropX: 0, cropY: 0 },
    orientation: 'unknown',
    devicePixelRatio: 1,
    cameraConfig: null,
  })

  useEffect(() => {
    if (!show) return

    const updateDebugInfo = () => {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const screenAspectRatio = screenWidth / screenHeight

      let videoWidth = 0
      let videoHeight = 0
      let videoAspectRatio = 0
      let cameraConfig = null
      let captureResolution = { width: screenWidth, height: screenHeight }

      // Buscar el elemento de video
      const videoElement = document.querySelector('video') || arManagerRef.current?.videoElement
      if (videoElement) {
        videoWidth = videoElement.videoWidth
        videoHeight = videoElement.videoHeight
        videoAspectRatio = videoWidth / videoHeight
      }

      // Obtener configuración de la cámara del ARManager
      if (arManagerRef.current?.cameraConfig) {
        cameraConfig = arManagerRef.current.cameraConfig
      }

      // Obtener resolución de captura
      if (arManagerRef.current?.getCaptureResolution) {
        captureResolution = arManagerRef.current.getCaptureResolution()
      }

      const orientation = window.screen?.orientation?.type || (screenWidth > screenHeight ? 'landscape' : 'portrait')

      setDebugInfo({
        screen: {
          width: screenWidth,
          height: screenHeight,
          aspectRatio: screenAspectRatio,
        },
        video: {
          width: videoWidth,
          height: videoHeight,
          aspectRatio: videoAspectRatio,
        },
        capture: {
          width: captureResolution.width || 0,
          height: captureResolution.height || 0,
          cropX: captureResolution.cropX || 0,
          cropY: captureResolution.cropY || 0,
        },
        orientation,
        devicePixelRatio: window.devicePixelRatio || 1,
        cameraConfig,
      })
    }

    // Actualizar info cada segundo
    const interval = setInterval(updateDebugInfo, 1000)
    updateDebugInfo() // Llamada inicial

    return () => clearInterval(interval)
  }, [show, arManagerRef])

  const testCapture = async () => {
    if (!arManagerRef.current?.getCaptureResolution) return

    try {
      const captureRes = arManagerRef.current.getCaptureResolution()
      console.log('🔧 Test de captura:', captureRes)

      // Crear canvas de prueba
      const testCanvas = document.createElement('canvas')
      testCanvas.width = captureRes.width
      testCanvas.height = captureRes.height
      const ctx = testCanvas.getContext('2d')

      // Dibujar información de prueba
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, captureRes.width, captureRes.height)

      ctx.fillStyle = '#fff'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${captureRes.width}x${captureRes.height}`, captureRes.width / 2, captureRes.height / 2)

      if (captureRes.cropX !== undefined) {
        ctx.fillStyle = '#ff0'
        ctx.fillText(`Crop: ${captureRes.cropX},${captureRes.cropY}`, captureRes.width / 2, captureRes.height / 2 + 30)
      }

      // Mostrar canvas de prueba
      const dataURL = testCanvas.toDataURL('image/jpeg', 0.9)
      const newWindow = window.open()
      newWindow.document.write(`<img src="${dataURL}" style="max-width:100%; max-height:100%;">`)
    } catch (error) {
      console.error('Error en test de captura:', error)
    }
  }

  if (!show) return null

  const getAspectRatioStatus = () => {
    const screenAR = debugInfo.screen.aspectRatio
    const videoAR = debugInfo.video.aspectRatio

    if (Math.abs(screenAR - videoAR) < 0.1) {
      return { status: '✅ Perfecta', color: 'text-green-400' }
    } else if (videoAR > screenAR) {
      return { status: '⚠️ Video más ancho', color: 'text-yellow-400' }
    } else {
      return { status: '⚠️ Video más alto', color: 'text-orange-400' }
    }
  }

  const aspectRatioStatus = getAspectRatioStatus()

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono max-w-xs backdrop-blur-sm border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-yellow-400">📹 Camera Debug</h4>
        <button onClick={testCapture} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">
          Test
        </button>
      </div>

      <div className="space-y-2">
        {/* Información de pantalla */}
        <div className="border-b border-gray-600 pb-2">
          <div className="text-blue-400 font-semibold">📱 Pantalla</div>
          <div>
            Tamaño: {debugInfo.screen.width}x{debugInfo.screen.height}
          </div>
          <div>Ratio: {debugInfo.screen.aspectRatio.toFixed(2)}</div>
          <div>Orientación: {debugInfo.orientation}</div>
          <div>DPR: {debugInfo.devicePixelRatio}</div>
        </div>

        {/* Información de video */}
        <div className="border-b border-gray-600 pb-2">
          <div className="text-green-400 font-semibold">📹 Video Real</div>
          <div>
            Tamaño: {debugInfo.video.width}x{debugInfo.video.height}
          </div>
          <div>Ratio: {debugInfo.video.aspectRatio.toFixed(2)}</div>
          <div className={aspectRatioStatus.color}>{aspectRatioStatus.status}</div>
        </div>

        {/* Información de captura */}
        <div className="border-b border-gray-600 pb-2">
          <div className="text-purple-400 font-semibold">📸 Captura</div>
          <div>
            Tamaño: {debugInfo.capture.width}x{debugInfo.capture.height}
          </div>
          {debugInfo.capture.cropX > 0 || debugInfo.capture.cropY > 0 ? (
            <div className="text-yellow-400">
              Crop: {debugInfo.capture.cropX},{debugInfo.capture.cropY}
            </div>
          ) : (
            <div className="text-gray-400">Sin crop</div>
          )}
        </div>

        {/* Configuración de cámara */}
        {debugInfo.cameraConfig && (
          <div>
            <div className="text-orange-400 font-semibold">⚙️ Config</div>
            <div>Móvil: {debugInfo.cameraConfig.isMobile ? 'Sí' : 'No'}</div>
            {debugInfo.cameraConfig.actualResolution?.width && (
              <div>
                Real: {debugInfo.cameraConfig.actualResolution.width}x{debugInfo.cameraConfig.actualResolution.height}
              </div>
            )}
          </div>
        )}

        {/* Recomendaciones */}
        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
          {debugInfo.video.aspectRatio > debugInfo.screen.aspectRatio + 0.1 && (
            <div className="text-yellow-300">💡 Video se recorta en los lados</div>
          )}
          {debugInfo.video.aspectRatio < debugInfo.screen.aspectRatio - 0.1 && (
            <div className="text-yellow-300">💡 Video se recorta arriba/abajo</div>
          )}
          {Math.abs(debugInfo.video.aspectRatio - debugInfo.screen.aspectRatio) < 0.1 && (
            <div className="text-green-300">✨ Aspect ratio óptimo</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CameraDebugInfo
