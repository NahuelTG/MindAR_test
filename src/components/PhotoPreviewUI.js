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
      padding: 10px;
      box-sizing: border-box;
    `
    return overlay
  }

  createPreviewContainer() {
    const container = document.createElement('div')
    const isMobile = window.innerWidth <= 768

    container.style.cssText = `
      display: flex;
      flex-direction: column;
      background: white;
      padding: ${isMobile ? '15px' : '20px'};
      border-radius: 15px;
      text-align: center;
      width: ${isMobile ? '100%' : '90%'};
      max-width: ${isMobile ? '100%' : '600px'};
      height: ${isMobile ? '95vh' : 'auto'};
      max-height: 95vh;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      box-sizing: border-box;
      overflow: hidden;
      align-items: center;
      justify-content: flex-start;
      margin: ${isMobile ? '5px' : '0'};
    `
    return container
  }

  createTitle() {
    const title = document.createElement('h3')
    title.innerHTML = this.capturedData.cameraOnly ? '📷 Foto capturada (solo cámara)' : '📸 Foto AR capturada'
    const isMobile = window.innerWidth <= 768

    title.style.cssText = `
      margin: 0 0 15px 0;
      color: ${this.capturedData.cameraOnly ? '#ff9800' : '#4CAF50'};
      font-size: ${isMobile ? '16px' : '18px'};
      font-weight: bold;
      flex-shrink: 0;
    `
    return title
  }

  createImage() {
    const img = document.createElement('img')
    img.src = this.capturedData.dataURL

    const isMobile = window.innerWidth <= 768

    // Estilos iniciales para la imagen con object-fit: cover
    img.style.cssText = `
      width: 100%;
      height: ${isMobile ? 'calc(100% - 120px)' : '400px'};
      min-height: ${isMobile ? '300px' : '300px'};
      max-height: ${isMobile ? 'calc(70vh - 100px)' : '500px'};
      border-radius: 10px;
      margin: 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      object-position: center;
      display: block;
      flex: 1;
      background-color: #f0f0f0;
    `

    // Ya no necesitamos el onload ya que usamos object-fit: cover
    img.onload = () => {
      console.log(`Imagen cargada: ${img.naturalWidth}x${img.naturalHeight}`)
    }

    return img
  }

  optimizeImageDisplay(img) {
    const isMobile = window.innerWidth <= 768

    if (!isMobile) {
      // En desktop, mantener el comportamiento original
      return
    }

    // Obtener dimensiones del contenedor
    const container = img.parentElement
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width - 30 // Restar padding
    const containerHeight = containerRect.height - 120 // Restar espacio para título y botones

    // Obtener dimensiones naturales de la imagen
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight
    const imageAspectRatio = naturalWidth / naturalHeight

    // Calcular el tamaño máximo que puede ocupar la imagen
    const maxViewportHeight = window.innerHeight * 0.7 // 70% de la altura de la pantalla
    const maxHeight = Math.min(containerHeight, maxViewportHeight)

    // Calcular dimensiones óptimas
    let displayWidth = containerWidth
    let displayHeight = displayWidth / imageAspectRatio

    // Si la altura calculada excede el máximo, ajustar por altura
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight
      displayWidth = displayHeight * imageAspectRatio
    }

    // Asegurar que no exceda el ancho del contenedor
    if (displayWidth > containerWidth) {
      displayWidth = containerWidth
      displayHeight = displayWidth / imageAspectRatio
    }

    // Aplicar los estilos calculados
    img.style.cssText = `
      width: ${Math.floor(displayWidth)}px;
      height: ${Math.floor(displayHeight)}px;
      max-width: 100%;
      max-height: 70vh;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      object-fit: contain;
      display: block;
      flex-shrink: 0;
    `

    console.log(`Imagen optimizada para móvil: ${Math.floor(displayWidth)}x${Math.floor(displayHeight)}`)
  }

  createButtonsContainer() {
    const container = document.createElement('div')
    const isMobile = window.innerWidth <= 768

    container.style.cssText = `
      display: flex;
      gap: ${isMobile ? '8px' : '15px'};
      justify-content: center;
      flex-wrap: wrap;
      padding-top: 10px;
      flex-shrink: 0;
      width: 100%;
      min-height: 60px;
      align-items: center;
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
    const isMobile = window.innerWidth <= 768

    button.style.cssText = `
      padding: ${isMobile ? '12px 16px' : '12px 24px'};
      background: ${bgColor};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: ${isMobile ? '14px' : '16px'};
      font-weight: bold;
      transition: all 0.3s ease;
      min-width: ${isMobile ? '90px' : '100px'};
      white-space: nowrap;
      flex: ${isMobile ? '1' : '0 1 auto'};
      max-width: ${isMobile ? '120px' : 'none'};
    `

    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor
      if (!isMobile) {
        button.style.transform = 'translateY(-2px)'
      }
    })

    button.addEventListener('mouseleave', () => {
      button.style.background = bgColor
      if (!isMobile) {
        button.style.transform = 'translateY(0)'
      }
    })

    // Mejorar la experiencia táctil en móviles
    if (isMobile) {
      button.addEventListener('touchstart', () => {
        button.style.background = hoverColor
        button.style.transform = 'scale(0.95)'
      })

      button.addEventListener('touchend', () => {
        setTimeout(() => {
          button.style.background = bgColor
          button.style.transform = 'scale(1)'
        }, 100)
      })
    }

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
