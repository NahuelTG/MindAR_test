//src/components/CaptureButton.jsx
const CaptureButton = ({ onCapture, isCapturing, isMobile = false }) => {
  return (
    <div
      className={`absolute ${
        isMobile
          ? 'top-4 right-4' // En móvil: esquina superior derecha
          : 'top-4 right-4' // En desktop: esquina superior derecha también
      } z-50 pointer-events-auto`}
    >
      <button
        onClick={onCapture}
        disabled={isCapturing}
        className={`rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center ${
          isMobile
            ? 'w-10 h-10 text-sm' // Más pequeño en móvil
            : 'w-12 h-12 text-base' // Tamaño normal en desktop
        } ${isCapturing ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-600'}`}
        title={isCapturing ? 'Capturando...' : 'Capturar Foto'}
      >
        <span className={isMobile ? 'text-lg' : 'text-xl'}>{isCapturing ? '⏳' : '📸'}</span>
      </button>
    </div>
  )
}

export default CaptureButton
