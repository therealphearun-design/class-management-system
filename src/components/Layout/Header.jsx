import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineMail,
  HiOutlineMenu,
  HiOutlineSearch,
  HiOutlineX,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { classOptions, studentsData } from '../../data/students';
import Avatar from '../common/Avatar';

const LOCAL_STUDENTS_KEY = 'students_local_v2';

const pageEntries = [
  { id: 'dashboard', title: 'Dashboard', subtitle: 'Overview', path: '/dashboard', type: 'page' },
  { id: 'attendance', title: 'Attendance', subtitle: 'Daily attendance', path: '/attendance', type: 'page' },
  { id: 'students', title: 'Students', subtitle: 'Student records', path: '/students', type: 'page' },
  { id: 'assignments', title: 'Assignments', subtitle: 'Homework and tasks', path: '/assignments', type: 'page' },
  { id: 'exams', title: 'Exams', subtitle: 'Exam list and schedule', path: '/exams', type: 'page' },
  { id: 'reports', title: 'Reports', subtitle: 'Analytics and reports', path: '/reports', type: 'page' },
  { id: 'messages', title: 'SMS/Mail', subtitle: 'Messages and announcements', path: '/messages', type: 'page' },
  { id: 'certificates', title: 'Certificates', subtitle: 'Issue certificates', path: '/certificates', type: 'page' },
  { id: 'profile', title: 'My Profile', subtitle: 'Account settings', path: '/profile', type: 'page' },
  { id: 'todos', title: 'To Do List', subtitle: 'Task tracking', path: '/todos', type: 'page' },
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
  return user?.role || user?.designation || user?.title || 'Teacher';
}

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const { user } = useAuth();

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

    return [...pageEntries, ...classEntries, ...studentEntries];
  }, []);

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

  return (
    <header className="bg-white border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <HiOutlineMenu className="w-5 h-5 text-gray-600" />
          </button>

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
            onClick={() => navigate('/messages')}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open messages"
          >
            <HiOutlineMail className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

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
    </header>
  );
}
