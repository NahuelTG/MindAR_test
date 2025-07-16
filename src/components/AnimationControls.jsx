// src/components/AnimationControls.jsx
import { useState } from 'react'
import { useARAnimations } from '@/hooks/useARAnimations'

const AnimationControls = ({ arManagerRef, modelType, isVisible }) => {
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

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 pointer-events-none">
      {/* Botón para mostrar/ocultar controles */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowControls(!showControls)}
          className="px-4 py-2 bg-purple-600 bg-opacity-80 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 text-sm font-medium"
        >
          🎭 {showControls ? 'Ocultar' : 'Mostrar'} Animaciones
        </button>
      </div>

      {/* Panel de controles */}
      {showControls && (
        <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-white border-opacity-20 pointer-events-auto max-w-md mx-auto">
          {/* Información de la animación actual */}
          <div className="text-center mb-4 text-white">
            <h3 className="text-lg font-bold mb-2">🐺 Animaciones del Lobo</h3>
            <p className="text-sm text-gray-300">
              {animationInfo.currentName} ({animationInfo.currentIndex + 1}/{animationInfo.totalAnimations})
            </p>
          </div>

          {/* Controles principales */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={previousAnimation}
              className="px-3 py-2 bg-blue-600 bg-opacity-80 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg text-sm font-medium"
              title="Animación anterior"
            >
              ⏮️
            </button>

            <button
              onClick={togglePause}
              className={`px-3 py-2 rounded-lg transition-all duration-200 shadow-lg text-sm font-medium ${
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
              className="px-3 py-2 bg-blue-600 bg-opacity-80 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg text-sm font-medium"
              title="Siguiente animación"
            >
              ⏭️
            </button>
          </div>

          {/* Control de velocidad */}
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">Velocidad: {animationSpeed.toFixed(1)}x</label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Selector de animaciones */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {animationInfo.animationNames.map((name, index) => (
              <button
                key={index}
                onClick={() => playAnimation(index)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 shadow-lg ${
                  index === animationInfo.currentIndex
                    ? 'bg-purple-600 bg-opacity-90 text-white'
                    : 'bg-gray-600 bg-opacity-80 text-white hover:bg-gray-500'
                }`}
                title={name}
              >
                {index + 1}. {name.length > 10 ? name.substring(0, 10) + '...' : name}
              </button>
            ))}
          </div>

          {/* Indicadores y tips */}
          <div className="text-center">
            <div className="flex justify-center gap-4 mb-2 text-xs">
              <span className="text-green-400">✓ {animationInfo.isPaused ? 'Pausado' : 'Reproduciendo'}</span>
              <span className="text-blue-400">🎬 {animationInfo.totalAnimations} animaciones</span>
            </div>
            <p className="text-xs text-gray-400">💡 Tip: Usa las flechas del teclado para navegación rápida</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimationControls
