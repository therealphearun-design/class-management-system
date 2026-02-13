import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardPage from './components/Dashboard/DashboardPage';
import AttendancePage from './components/Attendance/AttendancePage';
import SchedulePage from './components/Schedule/SchedulePage';
import MarksheetsPage from './components/Marksheets/MarksheetsPage';
import AssignmentsPage from './components/Assignments/AssignmentsPage';
import { AttendanceProvider } from './context/AttendanceContext';

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-xl font-bold text-gray-700">{title}</h2>
        <p className="text-sm text-gray-400 mt-2">This page is under construction</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AttendanceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/marksheets" element={<MarksheetsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/exams" element={<PlaceholderPage title="Exams List" />} />
          <Route path="/certificates" element={<PlaceholderPage title="Certificates" />} />
          <Route path="/payroll" element={<PlaceholderPage title="Payroll" />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="/messages" element={<PlaceholderPage title="SMS/Mail" />} />
          <Route path="/calendar" element={<PlaceholderPage title="Calendar" />} />
          <Route path="/todos" element={<PlaceholderPage title="To Do List" />} />
        </Routes>
      </Layout>
    </AttendanceProvider>
  );
}