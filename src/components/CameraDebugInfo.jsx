// src/components/CameraDebugInfo.jsx - Mejorado con nueva lógica
import { useState, useEffect } from 'react'

const CameraDebugInfo = ({ arManagerRef, show = false }) => {
  const [debugInfo, setDebugInfo] = useState({
    screen: { width: 0, height: 0, aspectRatio: 0 },
    video: { width: 0, height: 0, aspectRatio: 0 },
    capture: { width: 0, height: 0, strategy: 'unknown' },
    orientation: 'unknown',
    devicePixelRatio: 1,
    cameraConfig: null,
    actualConstraints: null,
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
      let actualConstraints = null
      let captureResolution = { width: screenWidth, height: screenHeight, strategy: 'fallback' }

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
        actualConstraints = cameraConfig.actualConstraints
      }

      // Obtener resolución de captura con nueva lógica
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
        capture: captureResolution,
        orientation,
        devicePixelRatio: window.devicePixelRatio || 1,
        cameraConfig,
        actualConstraints,
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
      console.log('🔧 Test de captura con nueva lógica:', captureRes)

      // Crear canvas de prueba
      const testCanvas = document.createElement('canvas')
      testCanvas.width = captureRes.width
      testCanvas.height = captureRes.height
      const ctx = testCanvas.getContext('2d')

      // Fondo
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, captureRes.width, captureRes.height)

      // Información de prueba
      ctx.fillStyle = '#fff'
      ctx.font = `${Math.min(captureRes.width, captureRes.height) / 20}px Arial`
      ctx.textAlign = 'center'

      const centerX = captureRes.width / 2
      const centerY = captureRes.height / 2
      const lineHeight = Math.min(captureRes.width, captureRes.height) / 15

      ctx.fillText(`${captureRes.width}x${captureRes.height}`, centerX, centerY - lineHeight)
      ctx.fillText(`Estrategia: ${captureRes.strategy}`, centerX, centerY)

      if (captureRes.cropX !== undefined || captureRes.cropY !== undefined) {
        ctx.fillStyle = '#ff0'
        ctx.fillText(`Crop: ${captureRes.cropX || 0},${captureRes.cropY || 0}`, centerX, centerY + lineHeight)
      }

      if (captureRes.note) {
        ctx.fillStyle = '#0f0'
        ctx.font = `${Math.min(captureRes.width, captureRes.height) / 30}px Arial`
        ctx.fillText(captureRes.note, centerX, centerY + lineHeight * 2)
      }

      // Bordes para identificar el área
      ctx.strokeStyle = '#f00'
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, captureRes.width - 4, captureRes.height - 4)

      // Mostrar canvas de prueba
      const dataURL = testCanvas.toDataURL('image/jpeg', 0.9)
      const newWindow = window.open()
      newWindow.document.write(`
        <html>
          <head><title>Test de Captura - ${captureRes.strategy}</title></head>
          <body style="margin:0; background:#333; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <div style="text-align:center; color:white;">
              <h2>Test de Captura</h2>
              <p>Estrategia: ${captureRes.strategy}</p>
              <p>Resolución: ${captureRes.width}x${captureRes.height}</p>
              <img src="${dataURL}" style="max-width:90vw; max-height:70vh; border:2px solid #fff;">
            </div>
          </body>
        </html>
      `)
    } catch (error) {
      console.error('Error en test de captura:', error)
    }
  }

  if (!show) return null

  const getAspectRatioStatus = () => {
    const screenAR = debugInfo.screen.aspectRatio
    const videoAR = debugInfo.video.aspectRatio
    const diff = Math.abs(screenAR - videoAR)

    if (diff < 0.05) {
      return { status: '✅ Excelente', color: 'text-green-400' }
    } else if (diff < 0.1) {
      return { status: '✅ Buena', color: 'text-green-300' }
    } else if (videoAR > screenAR) {
      return { status: '⚠️ Video más ancho', color: 'text-yellow-400' }
    } else {
      return { status: '⚠️ Video más alto', color: 'text-orange-400' }
    }
  }

  const getStrategyStatus = () => {
    const strategy = debugInfo.capture.strategy
    switch (strategy) {
      case 'full_video':
        return { icon: '✅', color: 'text-green-400', desc: 'Óptimo: Sin crop' }
      case 'crop_horizontal':
        return { icon: '🔧', color: 'text-yellow-400', desc: 'Crop horizontal' }
      case 'crop_vertical':
        return { icon: '🔧', color: 'text-orange-400', desc: 'Crop vertical' }
      case 'desktop':
        return { icon: '🖥️', color: 'text-blue-400', desc: 'Modo desktop' }
      default:
        return { icon: '❓', color: 'text-gray-400', desc: 'Desconocido' }
    }
  }

  const aspectRatioStatus = getAspectRatioStatus()
  const strategyStatus = getStrategyStatus()

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-95 text-white p-3 rounded-lg text-xs font-mono max-w-xs backdrop-blur-sm border border-gray-600 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-yellow-400">📹 Camera Debug v2</h4>
        <button onClick={testCapture} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors">
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
          <div>AR: {debugInfo.screen.aspectRatio.toFixed(3)}</div>
          <div>Orientación: {debugInfo.orientation}</div>
          <div>DPR: {debugInfo.devicePixelRatio}</div>
        </div>

        {/* Información de video */}
        <div className="border-b border-gray-600 pb-2">
          <div className="text-green-400 font-semibold">📹 Video Real</div>
          <div>
            Tamaño: {debugInfo.video.width}x{debugInfo.video.height}
          </div>
          <div>AR: {debugInfo.video.aspectRatio.toFixed(3)}</div>
          <div className={aspectRatioStatus.color}>{aspectRatioStatus.status}</div>
          <div className="text-xs text-gray-400">
            Diff: {Math.abs(debugInfo.video.aspectRatio - debugInfo.screen.aspectRatio).toFixed(3)}
          </div>
        </div>

        {/* Nueva sección: Estrategia de captura */}
        <div className="border-b border-gray-600 pb-2">
          <div className="text-purple-400 font-semibold">🎯 Estrategia</div>
          <div className={`flex items-center gap-1 ${strategyStatus.color}`}>
            <span>{strategyStatus.icon}</span>
            <span>{debugInfo.capture.strategy}</span>
          </div>
          <div className={`text-xs ${strategyStatus.color}`}>{strategyStatus.desc}</div>
        </div>

        {/* Información de captura */}
        <div className="border-b border-gray-600 pb-2">
          <div className="text-purple-400 font-semibold">📸 Captura Final</div>
          <div>
            Tamaño: {debugInfo.capture.width}x{debugInfo.capture.height}
          </div>

          {debugInfo.capture.cropX > 0 && <div className="text-yellow-400">CropX: {debugInfo.capture.cropX}</div>}
          {debugInfo.capture.cropY > 0 && <div className="text-yellow-400">CropY: {debugInfo.capture.cropY}</div>}

          {debugInfo.capture.note && <div className="text-xs text-green-300 mt-1 leading-tight">💡 {debugInfo.capture.note}</div>}
        </div>

        {/* Configuración de cámara real */}
        {debugInfo.actualConstraints && (
          <div className="border-b border-gray-600 pb-2">
            <div className="text-orange-400 font-semibold">⚙️ Config Real</div>
            <div>W: {debugInfo.actualConstraints.width}</div>
            <div>H: {debugInfo.actualConstraints.height}</div>
            {debugInfo.actualConstraints.aspectRatio && <div>AR: {debugInfo.actualConstraints.aspectRatio.toFixed(3)}</div>}
            <div>FPS: {debugInfo.actualConstraints.frameRate || 'N/A'}</div>
          </div>
        )}

        {/* Estado general */}
        <div className="text-xs text-gray-400 pt-2">
          <div className="font-semibold text-white mb-1">Estado:</div>

          {debugInfo.capture.strategy === 'full_video' && <div className="text-green-300">✨ Configuración óptima</div>}

          {debugInfo.capture.strategy.includes('crop') && <div className="text-yellow-300">🔧 Crop aplicado correctamente</div>}

          {Math.abs(debugInfo.video.aspectRatio - debugInfo.screen.aspectRatio) < 0.05 && (
            <div className="text-green-300">🎯 Aspect ratios coinciden</div>
          )}

          {debugInfo.cameraConfig?.isMobile && <div className="text-blue-300">📱 Modo móvil activo</div>}
        </div>

        {/* Indicadores de problemas */}
        {debugInfo.video.aspectRatio > 0 && Math.abs(debugInfo.video.aspectRatio - debugInfo.screen.aspectRatio) > 0.2 && (
          <div className="text-red-300 text-xs mt-2 p-1 bg-red-900 bg-opacity-30 rounded">⚠️ Gran diferencia en aspect ratios</div>
        )}
      </div>
    </div>
  )
}

export default CameraDebugInfo
