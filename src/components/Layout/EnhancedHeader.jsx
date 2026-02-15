import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMenu,
  HiOutlineBell,
  HiOutlineMail,
  HiOutlineCog,
  HiOutlineSearch,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineClipboardCheck,
  HiOutlineAcademicCap,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import { getRoleLabel } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

const notifications = [
  { id: 1, type: 'attendance', message: 'Class 10-A attendance pending', time: '5 min ago', read: false },
  { id: 2, type: 'assignment', message: '5 assignments need grading', time: '1 hour ago', read: false },
  { id: 3, type: 'meeting', message: 'Parent-teacher meeting at 3 PM', time: '2 hours ago', read: true },
  { id: 4, type: 'exam', message: 'Math exam schedule updated', time: '1 day ago', read: true },
];

export default function EnhancedHeader({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'attendance': return <HiOutlineClipboardCheck className="w-4 h-4" />;
      case 'assignment': return <HiOutlineAcademicCap className="w-4 h-4" />;
      case 'meeting': return <HiOutlineCalendar className="w-4 h-4" />;
      default: return <HiOutlineBell className="w-4 h-4" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
        >
          <HiOutlineMenu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Enhanced Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-full max-w-md">
          <HiOutlineSearch className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students, classes, assignments..."
            className="bg-transparent border-none outline-none text-sm text-gray-600 w-full placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 hover:bg-gray-200 rounded-full"
            >
              <span className="text-gray-400">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HiOutlineBell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button className="text-xs text-primary-600 hover:text-primary-700">
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0 ${
                        !notification.read ? 'bg-primary-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.read ? 'bg-gray-100' : 'bg-primary-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100 text-center">
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
          <HiOutlineMail className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
          <HiOutlineCog className="w-5 h-5 text-gray-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700">{user?.name || 'Brittany Babotts'}</p>
              <p className="text-xs text-gray-400">{getRoleLabel(user?.role)}</p>
            </div>
            <Avatar
              name={user?.name || 'Brittany Babotts'}
              size="sm"
              src={user?.avatar}
            />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{user?.name || 'Brittany Babotts'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'brittany@wdc.edu'}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <HiOutlineUser className="w-4 h-4 text-gray-500" />
                    Profile Settings
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <HiOutlineCalendar className="w-4 h-4 text-gray-500" />
                    My Schedule
                  </button>
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <HiOutlineLogout className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
