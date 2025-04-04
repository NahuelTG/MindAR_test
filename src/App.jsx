import { BrowserRouter as Router, Routes, Route } from 'react-router'
import { Selector } from './assets/components/Selector.jsx'
// import { ComponenteA } from './ComponenteA'
// import { ComponenteB } from './ComponenteB'
import './App.css'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Selector />} />
        {/* <Route path="/a" element={<ComponenteA />} />
        <Route path="/b" element={<ComponenteB />} /> */}
      </Routes>
    </Router>
  )
}
