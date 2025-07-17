// src/components/CameraDebugInfo.jsx
import { useState, useEffect } from 'react'

const CameraDebugInfo = ({ arManagerRef, show = false }) => {
  const [debugInfo, setDebugInfo] = useState({
    screen: { width: 0, height: 0 },
    video: { width: 0, height: 0 },
    aspectRatios: { screen: 0, video: 0 },
    orientation: 'unknown',
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

      // Buscar el elemento de video
      const videoElement = document.querySelector('video') || arManagerRef.current?.videoElement
      if (videoElement) {
        videoWidth = videoElement.videoWidth
        videoHeight = videoElement.videoHeight
        videoAspectRatio = videoWidth / videoHeight
      }

      const orientation = window.screen?.orientation?.type || (screenWidth > screenHeight ? 'landscape' : 'portrait')

      setDebugInfo({
        screen: { width: screenWidth, height: screenHeight },
        video: { width: videoWidth, height: videoHeight },
        aspectRatios: { screen: screenAspectRatio, video: videoAspectRatio },
        orientation,
      })
    }

    // Actualizar info cada segundo
    const interval = setInterval(updateDebugInfo, 1000)
    updateDebugInfo() // Llamada inicial

    return () => clearInterval(interval)
  }, [show, arManagerRef])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
      <h4 className="font-bold mb-2 text-yellow-400">📹 Camera Debug</h4>

      <div className="space-y-1">
        <div>
          <span className="text-blue-400">Screen:</span> {debugInfo.screen.width}x{debugInfo.screen.height}
        </div>
        <div>
          <span className="text-green-400">Video:</span> {debugInfo.video.width}x{debugInfo.video.height}
        </div>
        <div>
          <span className="text-purple-400">Ratios:</span> S:{debugInfo.aspectRatios.screen.toFixed(2)} V:
          {debugInfo.aspectRatios.video.toFixed(2)}
        </div>
        <div>
          <span className="text-orange-400">Orient:</span> {debugInfo.orientation}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-xs text-gray-400">
            {debugInfo.aspectRatios.video > debugInfo.aspectRatios.screen
              ? '📐 Video más ancho que pantalla'
              : '📐 Video más alto que pantalla'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraDebugInfo
