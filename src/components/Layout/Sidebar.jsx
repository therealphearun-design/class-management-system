import React, { useState } from 'react';

import {
  HiOutlineHome,
  HiOutlineClipboardCheck,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineBadgeCheck,
  HiOutlineChartBar,
  HiOutlineMail,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineUser,
} from 'react-icons/hi';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { path: '/', icon: HiOutlineHome, label: 'Dashboard' },
  { path: '/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance' },
  { path: '/students', icon: HiOutlineUserGroup, label: 'Students' },
  { path: '/schedule', icon: HiOutlineCalendar, label: 'Class Schedule' },
  { path: '/marksheets', icon: HiOutlineDocumentText, label: 'Marksheets' },
  { path: '/assignments', icon: HiOutlineBookOpen, label: 'Assignments' },
  { path: '/exams', icon: HiOutlineAcademicCap, label: 'Exams List' },
  { path: '/certificates', icon: HiOutlineBadgeCheck, label: 'Certificates' },
  { path: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
  { path: '/messages', icon: HiOutlineMail, label: 'SMS/Mail' },
  { path: '/calendar', icon: HiOutlineClock, label: 'Calendar' },
  { path: '/todos', icon: HiOutlineClipboardList, label: 'To Do List' },
  { path: '/profile', icon: HiOutlineUser, label: 'My Profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const [showCredit, setShowCredit] = useState(false);

  const handleLogoClick = () => {
    setShowCredit(true);
    window.setTimeout(() => setShowCredit(false), 3000);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClose();
          }}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-sidebar-bg z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 shadow-sidebar
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <button
            type="button"
            onClick={handleLogoClick}
            className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center hover:bg-primary-400 transition-colors"
            aria-label="Project credits"
          >
            <span className="text-white font-bold text-lg">C</span>
          </button>
          <div>
            <h1 className="text-white font-bold text-xl tracking-wide">Class</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider">
              Management
            </p>
          </div>
        </div>

        {showCredit && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-primary-500/20 border border-primary-400/40 text-xs text-blue-100">
            This project was created by PCE Team.
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-4 px-3 space-y-1 overflow-y-auto h-[calc(100%-80px)] pb-6">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
