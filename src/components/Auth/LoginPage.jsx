import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { ACCOUNT_ROLES, ROLE_LABELS, getRoleHomePath } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ACCOUNT_ROLES.TEACHER);
  const [error, setError] = useState('');
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRoleHomePath(user?.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password, role);
    if (result.success) {
      navigate(getRoleHomePath(role));
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5fb] px-4">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-r from-[#243671] to-[#2b3f86] p-[2px] shadow-xl">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#243671] to-[#2b3f86] px-6 py-3 border-b border-blue-900">
            <h2 className="text-lg font-semibold text-blue-50 text-center tracking-wide">Class Management Portal</h2>
          </div>
          <div className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-center text-blue-900">Login</h3>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="role" className="block text-gray-700 mb-2">Account Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={ACCOUNT_ROLES.STUDENT}>{ROLE_LABELS[ACCOUNT_ROLES.STUDENT]}</option>
              <option value={ACCOUNT_ROLES.TEACHER}>{ROLE_LABELS[ACCOUNT_ROLES.TEACHER]}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#243671] to-[#2b3f86] text-white py-2 rounded-lg hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
