// src/components/FloatingGamePopup.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getGameByAnimation } from '@/assets/ar/games/wolfGamesData'
import { showGameNotification } from './GameNotifications'
import { useWorldProjection } from '@/hooks/useWorldProjection'

const FloatingGamePopup = ({ currentAnimation, isVisible, isTargetFound, arManagerRef, hideWhenControlsVisible = false }) => {
  const [gameData, setGameData] = useState(null)
  const [gameState, setGameState] = useState('waiting')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [playerSequence, setPlayerSequence] = useState([])
  const [showSequence, setShowSequence] = useState(false)
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0)
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isCompact, setIsCompact] = useState(false)

  // Memoizar la condición de visibilidad para evitar re-renders innecesarios
  const shouldShowProjection = useMemo(() => {
    return isVisible && isTargetFound
  }, [isVisible, isTargetFound])

  // Usar el hook de proyección con la condición memoizada
  const { screenPosition, getOptimalPopupPosition, getConnectionAngle, isProjectorReady } = useWorldProjection(
    arManagerRef,
    'wolf',
    shouldShowProjection
  )

  // Memoizar la posición del popup para evitar recálculos constantes
  const popupPosition = useMemo(() => {
    if (isProjectorReady && screenPosition.isVisible) {
      return getOptimalPopupPosition()
    }
    return { x: 0, y: 0, isVisible: false }
  }, [isProjectorReady, screenPosition.isVisible, screenPosition.x, screenPosition.y, getOptimalPopupPosition])

  // Determinar si el popup debe ser visible
  const shouldShowPopup = useMemo(() => {
    return gameData && popupPosition.isVisible && !hideWhenControlsVisible
  }, [gameData, popupPosition.isVisible, hideWhenControlsVisible])

  // Usar useCallback para las funciones que no cambian frecuentemente
  const resetGame = useCallback(() => {
    setGameState('waiting')
    setCurrentQuestion(0)
    setScore(0)
    setUserAnswer('')
    setShowResult(false)
    setSelectedAnswer(null)
    setPlayerSequence([])
    setShowSequence(false)
    setCurrentSequenceIndex(0)
    setIsMinimized(false)
    setIsCompact(false)
  }, [])

  const startMemoryGame = useCallback(() => {
    if (!gameData?.sequences) return

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
  }, [gameData, currentQuestion])

  const startGame = useCallback(() => {
    if (gameData?.type === 'memory') {
      startMemoryGame()
    } else {
      setGameState('playing')
    }
    showGameNotification('tip', `🎮 ¡${gameData.title} iniciado!`)
  }, [gameData, startMemoryGame])

  const completeGame = useCallback(() => {
    setGameState('completed')
    setTotalGamesPlayed((prev) => prev + 1)

    const totalQuestions =
      gameData.questions?.length || gameData.challenges?.length || gameData.sequences?.length || gameData.scenarios?.length
    const percentage = Math.round((score / totalQuestions) * 100)

    if (percentage === 100) {
      showGameNotification('achievement', '🏆 ¡Puntuación perfecta! Eres un verdadero alfa', 5000)
    } else if (percentage >= 80) {
      showGameNotification('achievement', '🌟 ¡Excelente puntuación! El lobo está orgulloso', 4000)
    } else if (percentage >= 60) {
      showGameNotification('success', '👍 ¡Buen trabajo! Has demostrado tus instintos', 3000)
    } else {
      showGameNotification('tip', '💪 ¡Sigue practicando! Los lobos aprenden de cada experiencia', 3000)
    }

    if (totalGamesPlayed === 5) {
      showGameNotification('achievement', '🎮 ¡Has completado todos los juegos! Eres el maestro del lobo', 6000)
    }
  }, [gameData, score, totalGamesPlayed])

  // Efecto para cargar datos del juego - solo cuando cambia currentAnimation
  useEffect(() => {
    if (currentAnimation !== null) {
      const game = getGameByAnimation(currentAnimation)
      setGameData(game)
      resetGame()
    }
  }, [currentAnimation, resetGame])

  const handleQuizAnswer = useCallback(
    (answerIndex) => {
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
    },
    [gameData, currentQuestion, score, completeGame]
  )

  const handleWordGame = useCallback(() => {
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
  }, [gameData, currentQuestion, userAnswer, score, completeGame])

  const handleMemoryClick = useCallback(
    (emoji) => {
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
    },
    [playerSequence, gameData, currentQuestion, score, startMemoryGame, completeGame]
  )

  // Componentes de renderizado para cada tipo de juego
  const renderQuizGame = () => {
    const question = gameData.questions?.[currentQuestion] || gameData.scenarios?.[currentQuestion]

    return (
      <div className="text-center">
        <h4 className="text-sm font-bold mb-3 text-white">
          Pregunta {currentQuestion + 1}/{gameData.questions?.length || gameData.scenarios?.length}
        </h4>
        <p className="text-white mb-4 text-xs leading-relaxed">{question.question || question.situation}</p>

        <div className="grid grid-cols-1 gap-1 mb-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleQuizAnswer(index)}
              disabled={showResult}
              className={`px-2 py-1.5 rounded text-xs transition-all duration-200 ${
                showResult
                  ? index === question.correct
                    ? 'bg-green-600 text-white'
                    : index === selectedAnswer
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                  : 'bg-blue-600 bg-opacity-80 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {showResult && <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-300">{question.explanation}</div>}
      </div>
    )
  }

  const renderWordGame = () => {
    const challenge = gameData.challenges[currentQuestion]

    return (
      <div className="text-center">
        <h4 className="text-sm font-bold mb-3 text-white">
          Palabra {currentQuestion + 1}/{gameData.challenges.length}
        </h4>
        <div className="mb-3">
          <p className="text-xl font-bold text-yellow-400 mb-2">{challenge.scrambled}</p>
          <p className="text-xs text-gray-300">💡 {challenge.hint}</p>
        </div>

        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Escribe la palabra..."
          className="w-full px-2 py-1.5 rounded bg-gray-700 text-white mb-3 text-center text-sm"
          disabled={showResult}
        />

        <button
          onClick={handleWordGame}
          disabled={!userAnswer.trim() || showResult}
          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 text-xs active:scale-95"
        >
          Verificar
        </button>

        {showResult && (
          <div className="mt-3 p-2 bg-gray-800 rounded">
            <p
              className={`text-sm font-bold ${
                userAnswer.toUpperCase() === challenge.answer.toUpperCase() ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {userAnswer.toUpperCase() === challenge.answer.toUpperCase() ? '¡Correcto!' : `Incorrecto. Era: ${challenge.answer}`}
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
        <h4 className="text-sm font-bold mb-3 text-white">
          Secuencia {currentQuestion + 1}/{gameData.sequences.length}
        </h4>

        {showSequence ? (
          <div>
            <p className="text-white mb-3 text-xs">Memoriza esta secuencia:</p>
            <div className="flex justify-center gap-1 mb-3">
              {sequence.pattern.map((emoji, index) => (
                <div
                  key={index}
                  className={`text-lg p-1 rounded transition-all duration-300 ${
                    index === currentSequenceIndex ? 'bg-yellow-500 scale-110' : 'bg-gray-700 opacity-50'
                  }`}
                >
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-300">{sequence.story}</p>
          </div>
        ) : (
          <div>
            <p className="text-white mb-3 text-xs">Reproduce la secuencia:</p>
            <div className="grid grid-cols-4 gap-1 mb-3">
              {['🐺', '🌙', '🏔️', '🦌', '🌲', '💨', '🌕', '👥', '🏞️', '🔥', '❄️', '🐾', '🏠', '🌨️'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleMemoryClick(emoji)}
                  className="text-sm p-1 bg-gray-700 hover:bg-gray-600 rounded transition-all duration-200 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-1 mb-3">
              {playerSequence.map((emoji, index) => (
                <span key={index} className="text-sm">
                  {emoji}
                </span>
              ))}
            </div>
            {showResult && (
              <p className={`text-sm font-bold ${playerSequence.length === sequence.pattern.length ? 'text-green-400' : 'text-red-400'}`}>
                {playerSequence.length === sequence.pattern.length ? '¡Perfecto!' : '¡Inténtalo de nuevo!'}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!shouldShowPopup) return null

  const connectionAngle = getConnectionAngle(popupPosition)

  return (
    <>
      {/* Línea de conexión visual */}
      <div
        className="absolute z-40 pointer-events-none"
        style={{
          left: popupPosition.x + 160,
          top: popupPosition.y + 140,
          width: '2px',
          height: '30px',
          background: 'linear-gradient(to bottom, rgba(147, 51, 234, 0.8), transparent)',
          transform: `rotate(${connectionAngle}deg)`,
          transformOrigin: 'top center',
        }}
      />

      {/* Pop-up flotante desde el lobo */}
      <div
        className="absolute z-50 pointer-events-auto transform-gpu transition-all duration-500 ease-in-out"
        style={{
          left: isCompact ? popupPosition.x + 200 : popupPosition.x,
          top: popupPosition.y,
          width: isCompact ? '120px' : '320px',
          transform: isMinimized ? 'scale(0.9)' : 'scale(1)',
          opacity: popupPosition.isVisible ? 1 : 0,
        }}
      >
        <div className="bg-black bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl border border-purple-500 border-opacity-50 relative overflow-hidden">
          {/* Indicador de conexión con el lobo */}
          <div
            className="absolute w-3 h-3 bg-purple-500 rounded-full border-2 border-black shadow-lg"
            style={{
              left: '50%',
              bottom: '-6px',
              transform: 'translateX(-50%)',
            }}
          />

          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-transparent to-blue-400/5 pointer-events-none" />

          {/* Header del popup */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-lg animate-pulse">🐺</span>
              {!isCompact && (
                <div>
                  <h3 className="text-sm font-bold text-purple-400">{gameData.title}</h3>
                  <p className="text-xs text-gray-400">El lobo te desafía</p>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {!isCompact && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs flex items-center justify-center transition-colors active:scale-95"
                  title={isMinimized ? 'Expandir' : 'Minimizar'}
                >
                  {isMinimized ? '▲' : '▼'}
                </button>
              )}
              <button
                onClick={() => setIsCompact(!isCompact)}
                className="w-6 h-6 rounded bg-gray-700 hover:bg-blue-600 text-white text-xs flex items-center justify-center transition-colors active:scale-95"
                title={isCompact ? 'Expandir popup' : 'Modo compacto'}
              >
                👁️
              </button>
              <button
                onClick={resetGame}
                className="w-6 h-6 rounded bg-gray-700 hover:bg-red-600 text-white text-xs flex items-center justify-center transition-colors active:scale-95"
                title="Cerrar juego"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Contenido del juego */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: isMinimized || isCompact ? '0px' : '400px',
              opacity: isMinimized || isCompact ? 0 : 1,
            }}
          >
            <div className="p-3 relative z-10">
              {gameState === 'waiting' && (
                <div className="text-center">
                  <p className="text-xs text-gray-300 mb-4 leading-relaxed">{gameData.description}</p>
                  <button
                    onClick={startGame}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all duration-200 text-sm active:scale-95 shadow-lg"
                  >
                    🎮 ¡Acepto el Desafío!
                  </button>
                </div>
              )}

              {gameState === 'playing' && (
                <div>
                  {/* Barra de progreso y puntuación */}
                  <div className="flex justify-between items-center mb-4 p-2 bg-gray-800 rounded">
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-400 flex items-center gap-1">
                        🏆 <span className="font-bold">{score}</span>
                      </span>
                      {(gameData.questions || gameData.challenges || gameData.sequences || gameData.scenarios) && (
                        <span className="text-blue-400 flex items-center gap-1">
                          📊{' '}
                          <span className="font-bold">
                            {currentQuestion + 1}/
                            {gameData.questions?.length ||
                              gameData.challenges?.length ||
                              gameData.sequences?.length ||
                              gameData.scenarios?.length}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-1 bg-gray-600 rounded">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded transition-all duration-300"
                        style={{
                          width: `${
                            ((currentQuestion + 1) /
                              (gameData.questions?.length ||
                                gameData.challenges?.length ||
                                gameData.sequences?.length ||
                                gameData.scenarios?.length ||
                                1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {gameData.type === 'quiz' && renderQuizGame()}
                  {gameData.type === 'wordGame' && renderWordGame()}
                  {gameData.type === 'memory' && renderMemoryGame()}
                  {gameData.type === 'soundMatch' && renderQuizGame()}
                  {gameData.type === 'strategy' && renderQuizGame()}
                </div>
              )}

              {gameState === 'completed' && (
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h4 className="text-lg font-bold text-yellow-400 mb-2">¡Desafío Completado!</h4>
                    <div className="bg-gray-800 rounded p-3 mb-3">
                      <p className="text-sm text-white">
                        Puntuación Final:{' '}
                        <span className="font-bold text-green-400">
                          {score}/
                          {gameData.questions?.length ||
                            gameData.challenges?.length ||
                            gameData.sequences?.length ||
                            gameData.scenarios?.length}
                        </span>
                      </p>
                      <div className="w-full h-2 bg-gray-600 rounded mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded transition-all duration-500"
                          style={{
                            width: `${
                              (score /
                                (gameData.questions?.length ||
                                  gameData.challenges?.length ||
                                  gameData.sequences?.length ||
                                  gameData.scenarios?.length ||
                                  1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 text-sm active:scale-95 shadow-lg"
                  >
                    🔄 Nuevo Desafío
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FloatingGamePopup
