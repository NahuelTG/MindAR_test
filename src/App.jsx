import { BrowserRouter as Router, Routes, Route } from 'react-router'
import { Selector } from './assets/components/Selector.jsx'
import ARScene from './assets/components/ARScene.jsx'
import FaceFilter from './assets/components/FaceFilter.jsx'
// import { ComponenteB } from './ComponenteB'
import './App.css'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Selector />} />
        <Route path="/Bee" element={<ARScene />} />
        <Route path="/Filter" element={<FaceFilter />} />
      </Routes>
    </Router>
  )
}
