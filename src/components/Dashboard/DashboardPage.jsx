import React, { useMemo } from 'react';

import {
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineTrendingUp,
  HiOutlineUsers,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import { studentsData } from '../../data/students';

const ATTENDANCE_STORAGE_KEY = 'attendance_records_v1';

function getAttendanceSummary() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    const records = raw ? JSON.parse(raw) : {};
    const dates = Object.keys(records || {}).sort();
    if (dates.length === 0) return { rate: 0, marked: 0 };

    const latestDate = dates[dates.length - 1];
    const latest = records[latestDate] || {};
    const statuses = Object.values(latest).filter(Boolean);
    const marked = statuses.length;
    if (marked === 0) return { rate: 0, marked: 0 };
    const present = statuses.filter((s) => s === 'present').length;
    return { rate: Math.round((present / marked) * 1000) / 10, marked };
  } catch (_error) {
    return { rate: 0, marked: 0 };
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const dashboard = useMemo(() => {
    const totalStudents = studentsData.length;
    const classCount = new Set(studentsData.map((s) => s.class)).size;
    const sectionCount = new Set(studentsData.map((s) => s.section)).size;
    const shiftCount = new Set(studentsData.map((s) => s.shift)).size;
    const attendance = getAttendanceSummary();

    return {
      totalStudents,
      classCount,
      sectionCount,
      shiftCount,
      attendanceRate: attendance.rate,
      markedCount: attendance.marked,
    };
  }, []);

  const stats = [
    {
      label: 'Total Students',
      value: dashboard.totalStudents,
      icon: HiOutlineUsers,
      color: 'bg-blue-500',
      hint: `${dashboard.classCount} classes`,
    },
    {
      label: 'Total Classes',
      value: dashboard.classCount,
      icon: HiOutlineAcademicCap,
      color: 'bg-purple-500',
      hint: `${dashboard.sectionCount} sections`,
    },
    {
      label: 'Attendance Rate',
      value: `${dashboard.attendanceRate}%`,
      icon: HiOutlineClipboardCheck,
      color: 'bg-green-500',
      hint: `${dashboard.markedCount} records marked`,
    },
    {
      label: 'Study Shifts',
      value: dashboard.shiftCount,
      icon: HiOutlineClock,
      color: 'bg-orange-500',
      hint: 'Morning / Afternoon',
    },
  ];

  const recentActivities = [
    { id: 1, text: `${dashboard.totalStudents} active students in system`, time: 'Now' },
    { id: 2, text: `${dashboard.classCount} classes configured (9A to 12F)`, time: 'Now' },
    { id: 3, text: `${dashboard.shiftCount} study shifts available`, time: 'Now' },
    { id: 4, text: 'Certificates page updated with live create/issue actions', time: 'Recent' },
    { id: 5, text: 'Assignments page supports create + status filters', time: 'Recent' },
  ];

  const quickActions = [
    { label: 'Take Attendance', color: 'bg-green-100 text-green-700', to: '/attendance' },
    { label: 'Manage Students', color: 'bg-blue-100 text-blue-700', to: '/students' },
    { label: 'Create Assignment', color: 'bg-purple-100 text-purple-700', to: '/assignments' },
    { label: 'View Reports', color: 'bg-orange-100 text-orange-700', to: '/reports' },
    { label: 'Issue Certificate', color: 'bg-pink-100 text-pink-700', to: '/certificates' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Current overview of classes, students, and operations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-5 shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <HiOutlineTrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-gray-500">{stat.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Activities</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{activity.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium ${action.color} hover:opacity-80 transition-opacity`}
              >
                {action.label}
              </button>
            ))}
          </div>
          <div className="mt-5 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <HiOutlineDocumentText className="w-4 h-4" />
              Latest attendance records: {dashboard.markedCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
