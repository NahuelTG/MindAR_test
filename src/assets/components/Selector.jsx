import { useNavigate } from 'react-router'

export const Selector = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100">
      <h1 className="text-3xl font-bold">Elige la experiencia</h1>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/Steve')}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow hover:bg-blue-700 transition"
        >
          Steve AR
        </button>
        <button
          onClick={() => navigate('/b')}
          className="px-6 py-3 bg-green-600 text-white rounded-2xl shadow hover:bg-green-700 transition"
        >
          Filtro
        </button>
      </div>
    </div>
  )
}
