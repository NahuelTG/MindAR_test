// 6. src/services/PhotoPreviewService.js
import { PhotoPreviewUI } from '../components/PhotoPreviewUI'

export class PhotoPreviewService {
  showPreview(capturedData) {
    const previewUI = new PhotoPreviewUI(capturedData)
    previewUI.show()
  }
}
