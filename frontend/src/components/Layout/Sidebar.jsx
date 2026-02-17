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
  HiOutlineSearch,
} from 'react-icons/hi';
import { NavLink } from 'react-router-dom';

import { ACCOUNT_ROLES, normalizeRole } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/dashboard', icon: HiOutlineHome, label: 'Dashboard', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { path: '/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance', roles: [ACCOUNT_ROLES.TEACHER] },
  { path: '/students', icon: HiOutlineUserGroup, label: 'Students', roles: [ACCOUNT_ROLES.TEACHER] },
  { path: '/student-lookup', icon: HiOutlineSearch, label: 'Student Lookup', roles: [ACCOUNT_ROLES.TEACHER] },
  { path: '/schedule', icon: HiOutlineCalendar, label: 'Class Schedule', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { path: '/marksheets', icon: HiOutlineDocumentText, label: 'Marksheets', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { path: '/assignments', icon: HiOutlineBookOpen, label: 'Assignments', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { path: '/exams', icon: HiOutlineAcademicCap, label: 'Exams List', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { path: '/certificates', icon: HiOutlineBadgeCheck, label: 'Certificates', roles: [ACCOUNT_ROLES.TEACHER] },
  { path: '/reports', icon: HiOutlineChartBar, label: 'Reports', roles: [ACCOUNT_ROLES.TEACHER] },
  { path: '/messages', icon: HiOutlineMail, label: 'SMS/Mail', roles: [ACCOUNT_ROLES.TEACHER] },
  { path: '/calendar', icon: HiOutlineClock, label: 'Calendar', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { path: '/todos', icon: HiOutlineClipboardList, label: 'To Do List', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { path: '/profile', icon: HiOutlineUser, label: 'My Profile', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
];

function MenuToggleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-100" aria-hidden="true">
      <rect x="3" y="6" width="18" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="3" y="11" width="18" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="3" y="16" width="18" height="2.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose, onMenuVisibilityToggle }) {
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(role));
  const technicalSupportUrl = 'https://t.me/+I9OUYneewiA0NTc1';

  const openTelegram = () => {
    const popup = window.open(technicalSupportUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.href = technicalSupportUrl;
    }
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
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 relative">
          <button
            type="button"
            onClick={() => setShowSupportMenu((prev) => !prev)}
            className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center hover:bg-primary-400 transition-colors"
            aria-label="Open support menu"
          >
            <span className="text-white font-bold text-lg">C</span>
          </button>
          {showSupportMenu && (
            <div className="absolute top-[60px] left-6 z-10 min-w-[160px] rounded-lg border border-white/20 bg-sidebar-bg shadow-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setShowSupportMenu(false);
                  openTelegram();
                }}
                className="w-full text-left px-3 py-2 text-sm text-blue-100 hover:bg-white/10 rounded-md transition-colors"
              >
                Telegram
              </button>
            </div>
          )}
          <div>
            <h1 className="text-white font-bold text-xl tracking-wide">Class</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider">
              Management
            </p>
          </div>
          <button
            type="button"
            onClick={onMenuVisibilityToggle}
            className="ml-auto p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Turn off menu"
          >
            <MenuToggleIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 space-y-1 overflow-y-auto h-[calc(100%-80px)] pb-6">
          {visibleMenuItems.map((item) => (
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
