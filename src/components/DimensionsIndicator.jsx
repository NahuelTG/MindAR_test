//src/components/DimensionsIndicator.jsx
import React from 'react'

const DimensionsIndicator = ({ dimensions }) => {
  return (
    <div className="absolute bottom-4 right-4 z-50 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
      {dimensions.width}x{dimensions.height}
    </div>
  )
}

export default DimensionsIndicator
