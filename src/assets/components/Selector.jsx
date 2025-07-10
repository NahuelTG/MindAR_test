// assets/components/Selector.jsx
import { useNavigate } from 'react-router'

export const Selector = () => {
  const navigate = useNavigate()

  const models = [
    {
      id: 'bee',
      name: 'Abeja',
      emoji: '🐝',
      targetImageUrl: 'https://staticg.sportskeeda.com/editor/2023/11/636fb-16998456726938-1920.jpg',
      gradient: 'from-amber-400 to-orange-500',
      hoverGradient: 'hover:from-amber-500 hover:to-orange-600',
      focusRing: 'focus:ring-orange-400',
    },
    {
      id: 'wolf',
      name: 'Lobo',
      emoji: '🐺',
      targetImageUrl: 'https://example.com/wolf-target.jpg',
      gradient: 'from-slate-600 to-gray-700',
      hoverGradient: 'hover:from-slate-700 hover:to-gray-800',
      focusRing: 'focus:ring-slate-500',
    },
  ]

  const openTargetImage = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 p-4 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 selection:bg-amber-500 selection:text-white">
      <header className="text-center max-w-4xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-600 to-red-600">Experiencia AR</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Descubre la magia de la Realidad Aumentada con nuestros modelos 3D interactivos.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all duration-300 hover:scale-105 hover:shadow-3xl"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">{model.emoji}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">AR {model.name}</h3>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate(`/ar/${model.id}`)}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r ${model.gradient} text-white font-semibold rounded-lg shadow-md ${model.hoverGradient} transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 ${model.focusRing} focus:ring-opacity-75 text-lg`}
              >
                <span>{model.emoji}</span>
                Iniciar AR {model.name}
              </button>

              <button
                onClick={() => openTargetImage(model.targetImageUrl)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 text-lg"
              >
                🎯 Ver Imagen de Referencia
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm max-w-2xl">
        <p>Para activar la experiencia AR, apunta tu cámara a la imagen de referencia correspondiente.</p>
      </footer>
    </div>
  )
}
