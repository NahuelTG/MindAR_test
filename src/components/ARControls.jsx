//src/components/ARControls.jsx

const ARControls = ({ isStaticMode, toggleStaticMode, resetObjectPosition, isTargetFound, onBackToHome, isMobile }) => {
  return (
    <>
      {/* Botón Volver - siempre en la esquina superior izquierda */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <button
          onClick={onBackToHome}
          className={`bg-black bg-opacity-70 text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 ${
            isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base'
          }`}
        >
          ← Volver
        </button>
      </div>

      {/* Indicador de estado del target - debajo del botón volver en móvil */}
      <div
        className={`absolute ${
          isMobile
            ? 'top-16 left-4' // Debajo del botón volver en móvil
            : 'top-4 right-44' // Posición original en desktop
        } z-50 pointer-events-none`}
      >
        <div
          className={`rounded-lg font-medium backdrop-blur-sm shadow-lg border border-white border-opacity-20 ${
            isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
          } ${isTargetFound ? 'bg-green-600 bg-opacity-80 text-white' : 'bg-red-600 bg-opacity-80 text-white'}`}
        >
          {isMobile ? (isTargetFound ? '✓ Detectado' : '✗ Buscando') : isTargetFound ? '✓ Patrón Detectado' : '✗ Buscando Patrón'}
        </div>
      </div>

      {/* Controles de modo - debajo del indicador en móvil */}
      <div
        className={`absolute ${
          isMobile
            ? 'top-28 left-4 flex-col' // Debajo del indicador en móvil
            : 'top-4 left-44 flex-col' // Posición original en desktop
        } z-50 flex gap-1 pointer-events-none`}
      >
        <button
          onClick={toggleStaticMode}
          className={`rounded-lg font-medium transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 ${
            isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
          } ${
            isStaticMode
              ? 'bg-green-600 bg-opacity-80 text-white hover:bg-green-700'
              : 'bg-blue-600 bg-opacity-80 text-white hover:bg-blue-700'
          }`}
        >
          {isMobile ? (isStaticMode ? '📍 Fijo' : '🎯 Track') : isStaticMode ? '📍 Modo Fijo' : '🎯 Modo Tracking'}
        </button>

        {isStaticMode && (
          <button
            onClick={resetObjectPosition}
            className={`bg-red-600 bg-opacity-80 text-white rounded-lg hover:bg-red-700 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 font-medium cursor-pointer ${
              isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
            }`}
          >
            🔄 {isMobile ? 'Reset' : 'Resetear'}
          </button>
        )}
      </div>
    </>
  )
}

export default ARControls
