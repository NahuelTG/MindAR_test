import { modelConfigs } from '../assets/ar/models/modelConfigs'

const LoadingScreen = ({ modelType }) => {
  const modelConfig = modelConfigs[modelType]

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white z-10">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-500 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-2 border-2 border-amber-300 rounded-full animate-spin-slow border-b-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">{modelConfig?.emoji || '🔄'}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-amber-400">Cargando {modelConfig?.name || 'Modelo'}</h2>
          <p className="text-gray-300 leading-relaxed">Preparando la experiencia AR...</p>
          <div className="text-sm text-gray-400">
            <p>• Inicializando cámara</p>
            <p>• Cargando modelo 3D</p>
            <p>• Configurando seguimiento</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
