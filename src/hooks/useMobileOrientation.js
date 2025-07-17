// src/hooks/useMobileOrientation.js
import { useState, useEffect } from 'react'

export const useMobileOrientation = () => {
  const [orientation, setOrientation] = useState({
    angle: 0,
    type: 'portrait-primary',
  })
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const updateOrientation = () => {
      const angle = window.screen?.orientation?.angle || window.orientation || 0
      const type = window.screen?.orientation?.type || (window.innerWidth > window.innerHeight ? 'landscape-primary' : 'portrait-primary')

      setOrientation({ angle, type })

      // Actualizar dimensiones después de un pequeño delay para asegurar que el cambio se complete
      setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, 100)
    }

    // Listeners para cambios de orientación
    window.addEventListener('orientationchange', updateOrientation)
    window.addEventListener('resize', updateOrientation)

    // Listener específico para la Screen Orientation API si está disponible
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation)
    }

    // Configuración inicial
    updateOrientation()

    return () => {
      window.removeEventListener('orientationchange', updateOrientation)
      window.removeEventListener('resize', updateOrientation)

      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation)
      }
    }
  }, [])

  return {
    orientation,
    dimensions,
    isPortrait: orientation.type.includes('portrait'),
    isLandscape: orientation.type.includes('landscape'),
  }
}
