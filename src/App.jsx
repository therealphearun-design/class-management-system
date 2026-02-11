import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Students from './pages/Students.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/students" element={<Students />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
