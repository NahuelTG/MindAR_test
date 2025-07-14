// 3. src/hooks/useARControls.js
import { useState } from 'react'

export const useARControls = (arManagerRef) => {
  const [isStaticMode, setIsStaticMode] = useState(false)

  const toggleStaticMode = () => {
    if (arManagerRef.current) {
      const newMode = !isStaticMode
      setIsStaticMode(newMode)
      arManagerRef.current.setStaticMode(newMode)
    }
  }

  const resetObjectPosition = () => {
    if (arManagerRef.current) {
      arManagerRef.current.resetObjectPosition()
      setIsStaticMode(false)
    }
  }

  return {
    isStaticMode,
    toggleStaticMode,
    resetObjectPosition,
  }
}
