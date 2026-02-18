import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMail,
  HiOutlineMoon,
  HiOutlineSearch,
  HiOutlineSun,
  HiOutlineX,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import { ACCOUNT_ROLES, getRoleLabel, normalizeRole } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { classOptions, studentsData } from '../../data/students';
import Avatar from '../common/Avatar';

const LOCAL_STUDENTS_KEY = 'students_local_v2';
const projectNavItems = [
  { label: 'Dashboard', to: '/dashboard', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { label: 'Attendance', to: '/attendance', roles: [ACCOUNT_ROLES.TEACHER] },
  { label: 'Students', to: '/students', roles: [ACCOUNT_ROLES.TEACHER] },
  { label: 'Student Lookup', to: '/student-lookup', roles: [ACCOUNT_ROLES.TEACHER] },
  { label: 'Assignments', to: '/assignments', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { label: 'Exams', to: '/exams', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { label: 'Certificates', to: '/certificates', roles: [ACCOUNT_ROLES.TEACHER] },
  { label: 'Reports', to: '/reports', roles: [ACCOUNT_ROLES.TEACHER] },
  { label: 'Calendar', to: '/calendar', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
];

const pageEntries = [
  { id: 'dashboard', title: 'Dashboard', subtitle: 'Overview', path: '/dashboard', type: 'page', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { id: 'attendance', title: 'Attendance', subtitle: 'Daily attendance', path: '/attendance', type: 'page', roles: [ACCOUNT_ROLES.TEACHER] },
  { id: 'students', title: 'Students', subtitle: 'Student records', path: '/students', type: 'page', roles: [ACCOUNT_ROLES.TEACHER] },
  { id: 'student-lookup', title: 'Student Lookup', subtitle: 'Find by ID or email', path: '/student-lookup', type: 'page', roles: [ACCOUNT_ROLES.TEACHER] },
  { id: 'assignments', title: 'Assignments', subtitle: 'Homework and tasks', path: '/assignments', type: 'page', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { id: 'exams', title: 'Exams', subtitle: 'Exam list and schedule', path: '/exams', type: 'page', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { id: 'reports', title: 'Reports', subtitle: 'Analytics and reports', path: '/reports', type: 'page', roles: [ACCOUNT_ROLES.TEACHER] },
  { id: 'messages', title: 'SMS/Mail', subtitle: 'Messages and announcements', path: '/messages', type: 'page', roles: [ACCOUNT_ROLES.TEACHER] },
  { id: 'certificates', title: 'Certificates', subtitle: 'Issue certificates', path: '/certificates', type: 'page', roles: [ACCOUNT_ROLES.TEACHER] },
  { id: 'profile', title: 'My Profile', subtitle: 'Account settings', path: '/profile', type: 'page', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
  { id: 'todos', title: 'To Do List', subtitle: 'Task tracking', path: '/todos', type: 'page', roles: [ACCOUNT_ROLES.STUDENT, ACCOUNT_ROLES.TEACHER] },
];

function readLocalStudents() {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatRole(user) {
  return getRoleLabel(user?.role || user?.designation || user?.title);
}

function MenuToggleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" aria-hidden="true">
      <rect x="3" y="6" width="18" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="3" y="11" width="18" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="3" y="16" width="18" height="2.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

export default function Header({ onMenuToggle, isMenuEnabled, onMenuVisibilityToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const role = normalizeRole(user?.role);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const searchEntries = useMemo(() => {
    const localStudents = readLocalStudents();
    const mergedStudents = [...localStudents, ...studentsData];
    const seen = new Set();
    const studentEntries = mergedStudents
      .filter((student) => {
        const key = `${student.name}-${student.class}-${student.rollNo}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 900)
      .map((student, idx) => ({
        id: `student-${idx}-${student.name}`,
        title: student.name,
        subtitle: `Class ${student.class} | Roll ${student.rollNo}`,
        path: '/students',
        type: 'student',
      }));

    const classEntries = classOptions
      .filter((option) => option.value)
      .map((option) => ({
        id: `class-${option.value}`,
        title: `Class ${option.value}`,
        subtitle: 'Student list',
        path: '/students',
        type: 'class',
      }));

    const visiblePages = pageEntries.filter((entry) => entry.roles.includes(role));
    return [...visiblePages, ...classEntries, ...studentEntries];
  }, [role]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return searchEntries
      .filter((entry) => {
        const haystack = `${entry.title} ${entry.subtitle}`.toLowerCase();
        return haystack.includes(term);
      })
      .slice(0, 8);
  }, [query, searchEntries]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
        setFocusIndex(-1);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const executeSearchResult = (entry) => {
    setSearchOpen(false);
    setFocusIndex(-1);
    if (!entry) return;
    navigate(entry.path);
  };

  const onSearchKeyDown = (e) => {
    if (!results.length) {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigate('/students');
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = focusIndex >= 0 ? results[focusIndex] : results[0];
      executeSearchResult(target);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      setFocusIndex(-1);
    }
  };

  const profileName = user?.name || user?.email?.split('@')[0] || 'User';
  const profileRole = formatRole(user);
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 shadow-sm">
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-5">
          <div className="w-12 h-12 rounded-full border-2 border-blue-700 text-blue-700 flex items-center justify-center font-bold text-xs">
            HS
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-extrabold text-blue-800 tracking-wide truncate">
              សាលាវិទ្យាល័យ High School
            </h1>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-blue-500">
              High School Class Management Portal
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#243671] to-[#2b3f86] px-3 sm:px-6 h-10 border-b border-blue-900">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3">
          <nav className="hidden lg:flex h-full items-stretch gap-4 text-xs font-semibold text-blue-50">
            {projectNavItems.filter((item) => item.roles.includes(role)).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.to)}
                className="h-full px-3 text-[13px] whitespace-nowrap text-blue-100 hover:bg-white/10 hover:text-white active:bg-white/20 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isMenuEnabled && (
            <button
              type="button"
              onClick={onMenuVisibilityToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Turn on menu"
            >
              <MenuToggleIcon />
            </button>
          )}

          {isMenuEnabled && (
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
              aria-label="Toggle menu"
            >
              <MenuToggleIcon />
            </button>
          )}

          <div ref={searchRef} className="relative flex-1 max-w-xl">
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open search"
            >
              <HiOutlineSearch className="w-5 h-5 text-gray-500" />
            </button>

            <div className={`${searchOpen ? 'flex' : 'hidden'} md:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-transparent focus-within:border-primary-200`}>
              <HiOutlineSearch className="w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search students, classes, pages..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder-gray-400"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                  setFocusIndex(-1);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={onSearchKeyDown}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setFocusIndex(-1);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200"
                  aria-label="Clear search"
                >
                  <HiOutlineX className="w-4 h-4 text-gray-500" />
                </button>
              ) : null}
            </div>

            {searchOpen && query.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40">
                {results.length ? (
                  <ul className="max-h-80 overflow-y-auto">
                    {results.map((result, index) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => executeSearchResult(result)}
                          className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 ${
                            index === focusIndex ? 'bg-primary-50' : ''
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-800">{result.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{result.subtitle}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-3 text-sm text-gray-500">
                    No result found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light Theme' : 'Dark Theme'}
          >
            {isDark ? (
              <HiOutlineSun className="w-5 h-5 text-amber-500" />
            ) : (
              <HiOutlineMoon className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {role === ACCOUNT_ROLES.TEACHER && (
            <button
              onClick={() => navigate('/messages')}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open messages"
            >
              <HiOutlineMail className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          )}

          <button
            onClick={() => navigate('/todos')}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open notifications"
          >
            <HiOutlineBell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block"
            aria-label="Open settings"
          >
            <HiOutlineCog className="w-5 h-5 text-gray-500" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <HiOutlineLogout className="w-5 h-5 text-red-600" />
          </button>

          <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors min-w-0"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-700 truncate max-w-[140px]">{profileName}</p>
              <p className="text-xs text-gray-400 truncate max-w-[140px]">{profileRole}</p>
            </div>
            <Avatar
              name={profileName}
              size="sm"
              src={user?.avatar}
            />
          </button>
        </div>
      </div>
      </div>
    </header>
  );
}
