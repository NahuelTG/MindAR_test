// src/components/GameNotifications.jsx
import { useState, useEffect } from 'react'

const GameNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [nextId, setNextId] = useState(1)
  const [lastAnimationIndex, setLastAnimationIndex] = useState(null) // Para evitar duplicados

  useEffect(() => {
    const handleGameNotification = (event) => {
      const { type, message, duration = 3000 } = event.detail

      const notification = {
        id: nextId,
        type,
        message,
        timestamp: Date.now(),
      }

      setNextId((prev) => prev + 1)
      setNotifications((prev) => [...prev, notification])

      // Auto-remove notification after duration
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, duration)
    }

    // Listen for game events
    window.addEventListener('gameNotification', handleGameNotification)

    // Listen for animation changes to show tips
    const handleAnimationChanged = (event) => {
      const animationIndex = event.detail.animationIndex

      // Solo mostrar si es diferente al último índice mostrado
      if (animationIndex !== lastAnimationIndex) {
        setLastAnimationIndex(animationIndex)

        const animationTips = {
          0: '🌲 ¡Modo Explorador! Responde preguntas sobre la naturaleza',
          1: '🔤 ¡Modo Cazador! Forma palabras relacionadas con lobos',
          2: '🧠 ¡Modo Líder! Memoriza secuencias como un alfa',
          3: '🎵 ¡Modo Guardián! Identifica sonidos de la naturaleza',
          4: '🎯 ¡Modo Salvaje! Planifica estrategias de caza',
        }

        const tip = animationTips[animationIndex]
        if (tip) {
          handleGameNotification({
            detail: {
              type: 'tip',
              message: tip,
              duration: 4000,
            },
          })
        }
      }
    }

    window.addEventListener('wolfAnimationChanged', handleAnimationChanged)

    return () => {
      window.removeEventListener('gameNotification', handleGameNotification)
      window.removeEventListener('wolfAnimationChanged', handleAnimationChanged)
    }
  }, [nextId, lastAnimationIndex])

  const getNotificationStyle = (type) => {
    const baseStyle = 'mb-2 p-3 rounded-lg shadow-lg border backdrop-blur-sm transform transition-all duration-300 animate-slideIn'

    switch (type) {
      case 'success':
        return `${baseStyle} bg-green-600 bg-opacity-90 text-white border-green-400`
      case 'error':
        return `${baseStyle} bg-red-600 bg-opacity-90 text-white border-red-400`
      case 'tip':
        return `${baseStyle} bg-purple-600 bg-opacity-90 text-white border-purple-400`
      case 'achievement':
        return `${baseStyle} bg-yellow-600 bg-opacity-90 text-white border-yellow-400`
      default:
        return `${baseStyle} bg-blue-600 bg-opacity-90 text-white border-blue-400`
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'tip':
        return '💡'
      case 'achievement':
        return '🏆'
      default:
        return 'ℹ️'
    }
  }

  if (notifications.length === 0) return null

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
        `}
      </style>

      <div className="fixed top-20 right-4 z-50 max-w-sm pointer-events-none">
        {notifications.map((notification) => (
          <div key={notification.id} className={getNotificationStyle(notification.type)}>
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// Helper function to trigger notifications from anywhere
export const showGameNotification = (type, message, duration = 3000) => {
  window.dispatchEvent(
    new CustomEvent('gameNotification', {
      detail: { type, message, duration },
    })
  )
}

export default GameNotifications
