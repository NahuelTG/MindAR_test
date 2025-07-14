// 1. src/hooks/useARCapture.js
import { useState } from 'react'
import { PhotoCaptureService } from '../services/PhotoCaptureService'
import { PhotoPreviewService } from '../services/PhotoPreviewService'

export const useARCapture = (arManagerRef, sceneRef, dimensions) => {
  const [isCapturing, setIsCapturing] = useState(false)

  const capturePhoto = async () => {
    if (isCapturing) return

    setIsCapturing(true)

    try {
      const captureService = new PhotoCaptureService(arManagerRef, sceneRef, dimensions)
      const capturedData = await captureService.capture()

      if (capturedData) {
        const previewService = new PhotoPreviewService()
        previewService.showPreview(capturedData)
      }
    } catch (error) {
      console.error('Error al capturar foto:', error)
      alert('Error al capturar la foto. Verifica los permisos de cámara.')
    } finally {
      setIsCapturing(false)
    }
  }

  return { capturePhoto, isCapturing }
}
