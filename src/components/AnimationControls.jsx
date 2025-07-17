// src/components/AnimationControls.jsx
import { useState } from 'react'
import { useARAnimations } from '@/hooks/useARAnimations'

const AnimationControls = ({ arManagerRef, modelType, isVisible, isMobile = false, onControlsToggle }) => {
  const [showControls, setShowControls] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(0.8)

  const {
    animationInfo,
    isSupported,
    playAnimation,
    nextAnimation,
    previousAnimation,
    togglePause,
    setAnimationSpeed: setModelSpeed,
  } = useARAnimations(arManagerRef, modelType)

  const handleSpeedChange = (newSpeed) => {
    setAnimationSpeed(newSpeed)
    setModelSpeed(newSpeed)
  }

  // Solo mostrar controles para modelos que soporten animaciones múltiples
  if (!isSupported || !animationInfo || !isVisible) {
    return null
  }

  // Función para manejar el toggle de controles y notificar al componente padre
  const handleToggleControls = () => {
    const newShowControls = !showControls
    setShowControls(newShowControls)

    // Notificar al componente padre
    if (onControlsToggle) {
      onControlsToggle(newShowControls)
    }
  }

  return (
    <div
      className={`absolute z-40 pointer-events-none ${
        isMobile
          ? 'bottom-4 left-4 right-4' // En móvil: parte inferior completa
          : 'bottom-4 left-4 right-4' // En desktop: parte inferior completa
      }`}
    >
      {/* Botón para mostrar/ocultar controles */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleToggleControls}
          className={`bg-purple-600 bg-opacity-80 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 font-medium ${
            isMobile ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'
          }`}
        >
          🎭 {showControls ? 'Ocultar' : 'Mostrar'} Animaciones
        </button>
      </div>

      {/* Panel de controles */}
      {showControls && (
        <div
          className={`bg-black bg-opacity-90 backdrop-blur-sm rounded-lg shadow-2xl border border-white border-opacity-20 pointer-events-auto mx-auto ${
            isMobile ? 'p-3 text-xs max-w-sm' : 'p-4 text-sm max-w-md'
          }`}
        >
          {/* Información de la animación actual */}
          <div className="text-center mb-3 text-white">
            <h3 className={`font-bold mb-2 ${isMobile ? 'text-sm' : 'text-lg'}`}>🐺 Animaciones del Lobo</h3>
            <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {animationInfo.currentName} ({animationInfo.currentIndex + 1}/{animationInfo.totalAnimations})
            </p>
          </div>

          {/* Controles principales */}
          <div className={`flex justify-center mb-3 ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <button
              onClick={previousAnimation}
              className={`bg-blue-600 bg-opacity-80 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg font-medium ${
                isMobile ? 'px-2 py-1 text-xs w-8 h-8 flex items-center justify-center' : 'px-3 py-2 text-sm'
              }`}
              title="Animación anterior"
            >
              ⏮️
            </button>

            <button
              onClick={togglePause}
              className={`rounded-lg transition-all duration-200 shadow-lg font-medium ${
                isMobile ? 'px-2 py-1 text-xs w-8 h-8 flex items-center justify-center' : 'px-3 py-2 text-sm'
              } ${
                animationInfo.isPaused
                  ? 'bg-green-600 bg-opacity-80 text-white hover:bg-green-700'
                  : 'bg-yellow-600 bg-opacity-80 text-white hover:bg-yellow-700'
              }`}
              title={animationInfo.isPaused ? 'Reproducir' : 'Pausar'}
            >
              {animationInfo.isPaused ? '▶️' : '⏸️'}
            </button>

            <button
              onClick={nextAnimation}
              className={`bg-blue-600 bg-opacity-80 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg font-medium ${
                isMobile ? 'px-2 py-1 text-xs w-8 h-8 flex items-center justify-center' : 'px-3 py-2 text-sm'
              }`}
              title="Siguiente animación"
            >
              ⏭️
            </button>
          </div>

          {/* Control de velocidad */}
          <div className="mb-3">
            <label className={`block text-white font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              Velocidad: {animationSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className={`flex justify-between text-gray-400 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <span>0.1x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Selector de animaciones */}
          <div className={`grid gap-1 mb-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {animationInfo.animationNames.map((name, index) => (
              <button
                key={index}
                onClick={() => playAnimation(index)}
                className={`rounded transition-all duration-200 shadow-lg font-medium ${
                  isMobile ? 'px-1 py-1 text-xs' : 'px-2 py-1 text-xs'
                } ${
                  index === animationInfo.currentIndex
                    ? 'bg-purple-600 bg-opacity-90 text-white'
                    : 'bg-gray-600 bg-opacity-80 text-white hover:bg-gray-500'
                }`}
                title={name}
              >
                {index + 1}.{' '}
                {isMobile && name.length > 6 ? name.substring(0, 6) + '...' : name.length > 10 ? name.substring(0, 10) + '...' : name}
              </button>
            ))}
          </div>

          {/* Indicadores y tips */}
          <div className="text-center">
            <div className={`flex justify-center gap-2 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <span className="text-green-400">✓ {animationInfo.isPaused ? 'Pausado' : 'Activo'}</span>
              <span className="text-blue-400">🎬 {animationInfo.totalAnimations} anims</span>
            </div>
            {!isMobile && <p className="text-xs text-gray-400">💡 Tip: Usa las flechas del teclado para navegación rápida</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimationControls
