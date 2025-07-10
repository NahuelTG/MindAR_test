import { useState } from 'react'

const ARControlsInfo = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute bottom-4 right-4 z-50 pointer-events-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-all duration-200 backdrop-blur-sm pointer-events-auto shadow-lg border border-white border-opacity-20 flex items-center justify-center text-lg"
      >
        ?
      </button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm border border-white border-opacity-20 w-80 max-w-sm pointer-events-auto">
          <h3 className="text-lg font-bold mb-3">Controles AR</h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-blue-400">🎯</span>
              <div>
                <strong>Modo Tracking:</strong> El objeto 3D sigue el patrón detectado. Se muestra solo cuando el patrón está visible.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-400">📍</span>
              <div>
                <strong>Modo Fijo:</strong> El objeto 3D se queda fijo en el espacio una vez detectado el patrón. Permanece visible aunque
                se pierda el patrón.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-red-400">🔄</span>
              <div>
                <strong>Resetear:</strong> Vuelve al modo tracking y resetea la posición del objeto.
              </div>
            </div>

            <div className="pt-2 border-t border-white border-opacity-20">
              <p className="text-xs text-gray-300">
                <strong>Tip:</strong> Para activar el modo fijo, primero debes detectar el patrón con la cámara.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ARControlsInfo
