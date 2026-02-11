
// =====================================================
// src/pages/Login.jsx
// =====================================================
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()

  const handleLogin = () => {
    // Temporary demo login
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <input className="w-full border p-2 mb-3" placeholder="Email" />
        <input
          className="w-full border p-2 mb-3"
          type="password"
          placeholder="Password"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  )
}

export default Login
