import { useNavigate } from 'react-router'

export const Selector = () => {
  const navigate = useNavigate()
  const beeTargetImageUrl = 'https://staticg.sportskeeda.com/editor/2023/11/636fb-16998456726938-1920.jpg'

  const openTargetImage = () => {
    window.open(beeTargetImageUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 p-4 bg-gray-100 text-gray-800 selection:bg-amber-500 selection:text-white">
      <header className="text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Experiencia AR</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-12">Descubre la magia de la Realidad Aumentada.</p>
      </header>

      <div className="w-full max-w-xs sm:max-w-sm p-8 bg-white rounded-xl shadow-2xl space-y-6">
        <button
          onClick={() => navigate('/Bee')}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:from-amber-500 hover:to-orange-600 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 text-lg"
        >
          🐝 Iniciar AR Abeja
        </button>

        <button
          onClick={openTargetImage}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 text-lg"
        >
          🎯 Ver Imagen de Referencia
        </button>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Para la "AR Abeja", apunta tu cámara a la imagen de referencia.</p>
      </footer>
    </div>
  )
}
