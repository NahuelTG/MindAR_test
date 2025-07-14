//src/components/PhotoPreviewUI.js
export class PhotoPreviewUI {
  constructor(capturedData) {
    this.capturedData = capturedData
  }

  show() {
    const overlay = this.createOverlay()
    const previewContainer = this.createPreviewContainer()

    const title = this.createTitle()
    const image = this.createImage()
    const buttonsContainer = this.createButtonsContainer()

    previewContainer.appendChild(title)
    previewContainer.appendChild(image)
    previewContainer.appendChild(buttonsContainer)
    overlay.appendChild(previewContainer)

    document.body.appendChild(overlay)
    this.setupKeyboardNavigation(overlay)
  }

  createOverlay() {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
    `
    return overlay
  }

  createPreviewContainer() {
    const container = document.createElement('div')
    container.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 15px;
      text-align: center;
      max-width: 90%;
      max-height: 90%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `
    return container
  }

  createTitle() {
    const title = document.createElement('h3')
    title.innerHTML = this.capturedData.cameraOnly ? '📷 Foto capturada (solo cámara)' : '📸 Foto AR capturada'
    title.style.cssText = `
      margin: 0 0 15px 0;
      color: ${this.capturedData.cameraOnly ? '#ff9800' : '#4CAF50'};
      font-size: 18px;
      font-weight: bold;
    `
    return title
  }

  createImage() {
    const img = document.createElement('img')
    img.src = this.capturedData.dataURL
    img.style.cssText = `
      max-width: 100%;
      max-height: 400px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `
    return img
  }

  createButtonsContainer() {
    const container = document.createElement('div')
    container.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    `

    const downloadBtn = this.createButton('📥 Descargar', '#4CAF50', '#45a049', this.downloadPhoto.bind(this))
    const retakeBtn = this.createButton('📸 Tomar otra', '#2196F3', '#1976D2', this.retakePhoto.bind(this))
    const closeBtn = this.createButton('❌ Cerrar', '#f44336', '#d32f2f', this.closePreview.bind(this))

    container.appendChild(downloadBtn)
    container.appendChild(retakeBtn)
    container.appendChild(closeBtn)

    return container
  }

  createButton(text, bgColor, hoverColor, clickHandler) {
    const button = document.createElement('button')
    button.innerHTML = text
    button.style.cssText = `
      padding: 12px 24px;
      background: ${bgColor};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: all 0.3s ease;
    `

    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor
      button.style.transform = 'translateY(-2px)'
    })

    button.addEventListener('mouseleave', () => {
      button.style.background = bgColor
      button.style.transform = 'translateY(0)'
    })

    button.onclick = clickHandler
    return button
  }

  downloadPhoto() {
    const link = document.createElement('a')
    link.download = `foto-ar-${Date.now()}.jpg`
    link.href = this.capturedData.dataURL
    link.click()
    this.closePreview()
  }

  retakePhoto() {
    this.closePreview()
    // Aquí podrías emitir un evento o callback para retomar la foto
    setTimeout(() => {
      const event = new CustomEvent('retakePhoto')
      window.dispatchEvent(event)
    }, 100)
  }

  closePreview() {
    const overlay = document.querySelector('[style*="z-index: 10000"]')
    if (overlay) {
      document.body.removeChild(overlay)
    }
  }

  setupKeyboardNavigation() {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closePreview()
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
  }
}
