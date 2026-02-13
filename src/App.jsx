import React, { useEffect } from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AssignmentsPage from './components/Assignments/AssignmentsPage';
import AttendancePage from './components/Attendance/AttendancePage';
import LoginPage from './components/Auth/LoginPage';
import CalendarPage from './components/Calendar/CalendarPage';
import CertificatesPage from './components/Certificates/CertificatesPage';
import DashboardPage from './components/Dashboard/DashboardPage';
import ExamsPage from './components/Exams/ExamsPage';
import Layout from './components/Layout/Layout';
import MarksheetsPage from './components/Marksheets/MarksheetsPage';
import MessagesPage from './components/Messages/MessagesPage';
import ProfilePage from './components/Profile/ProfilePage';
import ReportsPage from './components/Reports/ReportsPage';
import SchedulePage from './components/Schedule/SchedulePage';
import StudentsPage from './components/Students/StudentsPage';
import TodosPage from './components/Todos/TodosPage';
import { AttendanceProvider } from './context/AttendanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/attendance" element={
        <PrivateRoute>
          <Layout>
            <AttendancePage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/students" element={
        <PrivateRoute>
          <Layout>
            <StudentsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/schedule" element={
        <PrivateRoute>
          <Layout>
            <SchedulePage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/marksheets" element={
        <PrivateRoute>
          <Layout>
            <MarksheetsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/assignments" element={
        <PrivateRoute>
          <Layout>
            <AssignmentsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/exams" element={
        <PrivateRoute>
          <Layout>
            <ExamsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/certificates" element={
        <PrivateRoute>
          <Layout>
            <CertificatesPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/reports" element={
        <PrivateRoute>
          <Layout>
            <ReportsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/calendar" element={
        <PrivateRoute>
          <Layout>
            <CalendarPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/messages" element={
        <PrivateRoute>
          <Layout>
            <MessagesPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Layout>
            <ProfilePage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/todos" element={
        <PrivateRoute>
          <Layout>
            <TodosPage />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AttendanceProvider>
          <AppRoutes />
        </AttendanceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
