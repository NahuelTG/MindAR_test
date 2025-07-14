import { BrowserRouter as Router, Routes, Route } from 'react-router'
import { Selector } from './components/Selector.jsx'
import ARScene from './components/ARScene.jsx'
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
