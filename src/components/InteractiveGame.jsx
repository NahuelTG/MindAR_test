// src/components/InteractiveGame.jsx
import { useState, useEffect } from 'react'
import { getGameByAnimation } from '@/assets/ar/games/wolfGamesData'
import { showGameNotification } from './GameNotifications'

const InteractiveGame = ({ currentAnimation, isVisible, isTargetFound }) => {
  const [gameData, setGameData] = useState(null)
  const [gameState, setGameState] = useState('waiting') // waiting, playing, completed, showingResult
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [playerSequence, setPlayerSequence] = useState([])
  const [showSequence, setShowSequence] = useState(false)
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0)
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)

  useEffect(() => {
    if (currentAnimation !== null) {
      const game = getGameByAnimation(currentAnimation)
      setGameData(game)
      resetGame()
    }
  }, [currentAnimation])

  const resetGame = () => {
    setGameState('waiting')
    setCurrentQuestion(0)
    setScore(0)
    setUserAnswer('')
    setShowResult(false)
    setSelectedAnswer(null)
    setPlayerSequence([])
    setShowSequence(false)
    setCurrentSequenceIndex(0)
  }

  const startGame = () => {
    if (gameData?.type === 'memory') {
      startMemoryGame()
    } else {
      setGameState('playing')
    }

    showGameNotification('tip', `🎮 ¡${gameData.title} iniciado!`)
  }

  const startMemoryGame = () => {
    setGameState('playing')
    setShowSequence(true)
    setCurrentSequenceIndex(0)

    const sequence = gameData.sequences[currentQuestion]
    let index = 0

    const showNextItem = () => {
      if (index < sequence.pattern.length) {
        setCurrentSequenceIndex(index)
        index++
        setTimeout(showNextItem, 1000)
      } else {
        setShowSequence(false)
        setCurrentSequenceIndex(0)
      }
    }

    setTimeout(showNextItem, 500)
  }

  const handleQuizAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex)
    const isCorrect = answerIndex === (gameData.questions?.[currentQuestion]?.correct ?? gameData.scenarios?.[currentQuestion]?.correct)

    if (isCorrect) {
      setScore(score + 1)
      showGameNotification('success', '🎉 ¡Respuesta correcta!')
    } else {
      showGameNotification('error', '❌ Respuesta incorrecta, ¡sigue intentando!')
    }

    setShowResult(true)

    setTimeout(() => {
      const totalQuestions = gameData.questions?.length || gameData.scenarios?.length
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        completeGame()
      }
    }, 2500)
  }

  const handleWordGame = () => {
    const challenge = gameData.challenges[currentQuestion]
    const isCorrect = userAnswer.toUpperCase() === challenge.answer.toUpperCase()

    if (isCorrect) {
      setScore(score + 1)
      showGameNotification('success', `✨ ¡Correcto! La palabra era "${challenge.answer}"`)
    } else {
      showGameNotification('error', `💭 Incorrecto. La palabra era "${challenge.answer}"`)
    }

    setShowResult(true)

    setTimeout(() => {
      if (currentQuestion < gameData.challenges.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setUserAnswer('')
        setShowResult(false)
      } else {
        completeGame()
      }
    }, 2000)
  }

  const handleMemoryClick = (emoji) => {
    const newSequence = [...playerSequence, emoji]
    setPlayerSequence(newSequence)

    const currentPattern = gameData.sequences[currentQuestion].pattern
    const isCorrectSoFar = newSequence.every((item, index) => item === currentPattern[index])

    if (!isCorrectSoFar) {
      showGameNotification('error', '🧠 ¡Secuencia incorrecta! Inténtalo de nuevo')
      setShowResult(true)
      setTimeout(() => {
        setPlayerSequence([])
        setShowResult(false)
      }, 2000)
    } else if (newSequence.length === currentPattern.length) {
      setScore(score + 1)
      showGameNotification('success', '🎯 ¡Secuencia perfecta!')
      setShowResult(true)
      setTimeout(() => {
        if (currentQuestion < gameData.sequences.length - 1) {
          setCurrentQuestion(currentQuestion + 1)
          setPlayerSequence([])
          setShowResult(false)
          startMemoryGame()
        } else {
          completeGame()
        }
      }, 2000)
    }
  }

  const completeGame = () => {
    setGameState('completed')
    setTotalGamesPlayed((prev) => prev + 1)

    const totalQuestions =
      gameData.questions?.length || gameData.challenges?.length || gameData.sequences?.length || gameData.scenarios?.length
    const percentage = Math.round((score / totalQuestions) * 100)

    // Show achievement notifications
    if (percentage === 100) {
      showGameNotification('achievement', '🏆 ¡Puntuación perfecta! Eres un verdadero alfa', 5000)
    } else if (percentage >= 80) {
      showGameNotification('achievement', '🌟 ¡Excelente puntuación! El lobo está orgulloso', 4000)
    } else if (percentage >= 60) {
      showGameNotification('success', '👍 ¡Buen trabajo! Has demostrado tus instintos', 3000)
    } else {
      showGameNotification('tip', '💪 ¡Sigue practicando! Los lobos aprenden de cada experiencia', 3000)
    }

    // Special achievements
    if (totalGamesPlayed === 5) {
      showGameNotification('achievement', '🎮 ¡Has completado todos los juegos! Eres el maestro del lobo', 6000)
    }
  }

  const renderQuizGame = () => {
    const question = gameData.questions[currentQuestion]

    return (
      <div className="text-center">
        <h4 className="text-lg font-bold mb-4 text-white">
          Pregunta {currentQuestion + 1}/{gameData.questions.length}
        </h4>
        <p className="text-white mb-6 text-sm">{question.question}</p>

        <div className="grid grid-cols-1 gap-2 mb-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleQuizAnswer(index)}
              disabled={showResult}
              className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                showResult
                  ? index === question.correct
                    ? 'bg-green-600 text-white'
                    : index === selectedAnswer
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                  : 'bg-blue-600 bg-opacity-80 text-white hover:bg-blue-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300">{question.explanation}</p>
          </div>
        )}
      </div>
    )
  }

  const renderWordGame = () => {
    const challenge = gameData.challenges[currentQuestion]

    return (
      <div className="text-center">
        <h4 className="text-lg font-bold mb-4 text-white">
          Palabra {currentQuestion + 1}/{gameData.challenges.length}
        </h4>
        <div className="mb-4">
          <p className="text-2xl font-bold text-yellow-400 mb-2">{challenge.scrambled}</p>
          <p className="text-sm text-gray-300">💡 {challenge.hint}</p>
        </div>

        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Escribe la palabra..."
          className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white mb-4 text-center text-lg"
          disabled={showResult}
        />

        <button
          onClick={handleWordGame}
          disabled={!userAnswer.trim() || showResult}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600"
        >
          Verificar
        </button>

        {showResult && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p
              className={`text-lg font-bold ${
                userAnswer.toUpperCase() === challenge.answer.toUpperCase() ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {userAnswer.toUpperCase() === challenge.answer.toUpperCase()
                ? '¡Correcto!'
                : `Incorrecto. La respuesta era: ${challenge.answer}`}
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderMemoryGame = () => {
    const sequence = gameData.sequences[currentQuestion]

    return (
      <div className="text-center">
        <h4 className="text-lg font-bold mb-4 text-white">
          Secuencia {currentQuestion + 1}/{gameData.sequences.length}
        </h4>

        {showSequence ? (
          <div>
            <p className="text-white mb-4">Memoriza esta secuencia:</p>
            <div className="flex justify-center gap-2 mb-4">
              {sequence.pattern.map((emoji, index) => (
                <div
                  key={index}
                  className={`text-3xl p-2 rounded-lg transition-all duration-300 ${
                    index === currentSequenceIndex ? 'bg-yellow-500 scale-110' : 'bg-gray-700 opacity-50'
                  }`}
                >
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-300">{sequence.story}</p>
          </div>
        ) : (
          <div>
            <p className="text-white mb-4">Reproduce la secuencia:</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['🐺', '🌙', '🏔️', '🦌', '🌲', '💨', '🌕', '👥', '🏞️', '🔥', '❄️', '🐾', '🏠', '🌨️'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleMemoryClick(emoji)}
                  className="text-2xl p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-1 mb-4">
              {playerSequence.map((emoji, index) => (
                <span key={index} className="text-xl">
                  {emoji}
                </span>
              ))}
            </div>
            {showResult && (
              <p className={`text-lg font-bold ${playerSequence.length === sequence.pattern.length ? 'text-green-400' : 'text-red-400'}`}>
                {playerSequence.length === sequence.pattern.length ? '¡Perfecto!' : '¡Inténtalo de nuevo!'}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderStrategyGame = () => {
    const scenario = gameData.scenarios[currentQuestion]

    return (
      <div className="text-center">
        <h4 className="text-lg font-bold mb-4 text-white">
          Escenario {currentQuestion + 1}/{gameData.scenarios.length}
        </h4>
        <div className="mb-6 p-3 bg-gray-800 rounded-lg">
          <p className="text-white text-sm">{scenario.situation}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-4">
          {scenario.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleQuizAnswer(index)}
              disabled={showResult}
              className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
                showResult
                  ? index === scenario.correct
                    ? 'bg-green-600 text-white'
                    : index === selectedAnswer
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                  : 'bg-purple-600 bg-opacity-80 text-white hover:bg-purple-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300">{scenario.explanation}</p>
          </div>
        )}
      </div>
    )
  }

  if (!gameData || !isVisible || !isTargetFound) return null

  return (
    <div className="absolute top-20 left-4 right-4 z-40 pointer-events-none">
      <div className="bg-black bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-purple-500 border-opacity-50 pointer-events-auto max-w-md mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-purple-400 mb-2">{gameData.title}</h3>
          <p className="text-sm text-gray-300 mb-3">{gameData.description}</p>

          {gameState !== 'waiting' && (
            <div className="flex justify-center gap-4 text-sm">
              <span className="text-green-400">🏆 Puntos: {score}</span>
              {gameData.questions && (
                <span className="text-blue-400">
                  📊 {currentQuestion + 1}/{gameData.questions.length}
                </span>
              )}
            </div>
          )}
        </div>

        {gameState === 'waiting' && (
          <div className="text-center">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200"
            >
              🎮 ¡Jugar!
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            {gameData.type === 'quiz' && renderQuizGame()}
            {gameData.type === 'wordGame' && renderWordGame()}
            {gameData.type === 'memory' && renderMemoryGame()}
            {gameData.type === 'soundMatch' && renderQuizGame()}
            {gameData.type === 'strategy' && renderStrategyGame()}
          </div>
        )}

        {gameState === 'completed' && (
          <div className="text-center">
            <h4 className="text-2xl font-bold text-yellow-400 mb-4">🎉 ¡Juego Completado!</h4>
            <p className="text-lg text-white mb-4">
              Puntuación final: {score}/
              {gameData.questions?.length || gameData.challenges?.length || gameData.sequences?.length || gameData.scenarios?.length}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
              >
                🔄 Jugar de Nuevo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InteractiveGame
