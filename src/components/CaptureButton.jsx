//src/components/CaptureButton.jsx
const CaptureButton = ({ onCapture, isCapturing }) => {
  return (
    <div className="absolute top-4 right-4 z-50 pointer-events-auto">
      <button
        onClick={onCapture}
        disabled={isCapturing}
        className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-200 ${
          isCapturing ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-600'
        }`}
      >
        {isCapturing ? '⏳ Capturando...' : '📸 Capturar Foto'}
      </button>
    </div>
  )
}

export default CaptureButton
