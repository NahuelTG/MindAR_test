//src/components/ARControls.jsx

const ARControls = ({ isStaticMode, toggleStaticMode, resetObjectPosition, isTargetFound, onBackToHome }) => {
  return (
    <>
      {/* Botón Volver */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <button
          onClick={onBackToHome}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-black bg-opacity-70 text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 text-sm sm:text-base"
        >
          ← Volver
        </button>
      </div>

      {/* Controles de modo */}
      <div className="absolute top-4 left-44 z-50 flex flex-col gap-2 pointer-events-none">
        <button
          onClick={toggleStaticMode}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 ${
            isStaticMode
              ? 'bg-green-600 bg-opacity-80 text-white hover:bg-green-700'
              : 'bg-blue-600 bg-opacity-80 text-white hover:bg-blue-700'
          }`}
        >
          {isStaticMode ? '📍 Modo Fijo' : '🎯 Modo Tracking'}
        </button>

        {isStaticMode && (
          <button
            onClick={resetObjectPosition}
            className="px-3 py-2 bg-red-600 bg-opacity-80 text-white rounded-lg hover:bg-red-700 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 text-sm font-medium cursor-pointer"
          >
            🔄 Resetear
          </button>
        )}
      </div>

      {/* Indicador de estado */}
      <div className="absolute top-4 right-44 z-50 pointer-events-none">
        <div
          className={`px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm shadow-lg border border-white border-opacity-20 ${
            isTargetFound ? 'bg-green-600 bg-opacity-80 text-white' : 'bg-red-600 bg-opacity-80 text-white'
          }`}
        >
          {isTargetFound ? '✓ Patrón Detectado' : '✗ Buscando Patrón'}
        </div>
      </div>
    </>
  )
}

export default ARControls
