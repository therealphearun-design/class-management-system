import React from 'react';
import {
  HiOutlineUsers,
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

const stats = [
  { label: 'Total Students', value: '1,250', icon: HiOutlineUsers, color: 'bg-blue-500', change: '+12%' },
  { label: 'Total Classes', value: '48', icon: HiOutlineAcademicCap, color: 'bg-purple-500', change: '+3%' },
  { label: 'Attendance Rate', value: '94.2%', icon: HiOutlineClipboardCheck, color: 'bg-green-500', change: '+2.1%' },
  { label: 'Performance', value: '87.5%', icon: HiOutlineTrendingUp, color: 'bg-orange-500', change: '+5.4%' },
];

const recentActivities = [
  { id: 1, text: 'Class 10-A attendance submitted', time: '2 min ago', type: 'attendance' },
  { id: 2, text: 'New assignment posted for Class 9-B', time: '15 min ago', type: 'assignment' },
  { id: 3, text: 'Marksheet updated for mid-term exams', time: '1 hour ago', type: 'marks' },
  { id: 4, text: 'Parent meeting scheduled for Class 8-A', time: '2 hours ago', type: 'event' },
  { id: 5, text: 'Report cards generated for Class 10-B', time: '3 hours ago', type: 'report' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats cards */}
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
              <span className="text-xs font-medium text-green-500">{stat.change}</span>
              <span className="text-xs text-gray-400">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activities */}
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

        {/* Quick links */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Take Attendance', color: 'bg-green-100 text-green-700' },
              { label: 'Create Assignment', color: 'bg-blue-100 text-blue-700' },
              { label: 'View Reports', color: 'bg-purple-100 text-purple-700' },
              { label: 'Send Message', color: 'bg-orange-100 text-orange-700' },
              { label: 'Schedule Class', color: 'bg-pink-100 text-pink-700' },
            ].map((action) => (
              <button
                key={action.label}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium ${action.color} hover:opacity-80 transition-opacity`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}