// 11. src/utils/capture/CameraOnlyCaptureStrategy.js
import { CaptureStrategy } from './CaptureStrategy'

export class CameraOnlyCaptureStrategy extends CaptureStrategy {
  constructor(context) {
    super(context)
    this.isCameraOnly = true
  }

  async capture() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })

    const video = document.createElement('video')
    video.srcObject = stream
    video.play()

    await new Promise((resolve) => {
      video.addEventListener('loadedmetadata', resolve)
    })

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    ctx.drawImage(video, 0, 0)

    stream.getTracks().forEach((track) => track.stop())

    return canvas.toDataURL('image/jpeg', 0.9)
  }
}
