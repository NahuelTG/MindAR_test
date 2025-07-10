import { BrowserRouter as Router, Routes, Route } from 'react-router'
import { Selector } from './assets/components/Selector.jsx'
import ARScene from './assets/components/ARScene.jsx'
import './App.css'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Selector />} />
        <Route path="/ar/:modelType" element={<ARScene />} />
      </Routes>
    </Router>
  )
}
