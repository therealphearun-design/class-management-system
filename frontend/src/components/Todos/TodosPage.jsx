import React, { useEffect, useMemo, useState } from 'react';

import {
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi';

import { ACCOUNT_ROLES, normalizeRole } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const STORAGE_KEY = 'cms_todos_v3';

const CATEGORY_OPTIONS = [
  'General',
  'Attendance',
  'Assignments',
  'Academics',
  'Exams',
  'Schedule',
  'Certificates',
  'Communication',
  'Profile',
];

const STATUS_FILTERS = ['All', 'Pending', 'Completed'];

function getUserStorageKey(role, user) {
  const identityRaw = String(user?.id || user?.email || user?.name || 'anonymous')
    .trim()
    .toLowerCase();
  const identitySafe = identityRaw.replace(/[^a-z0-9@._-]/g, '_');
  return `${STORAGE_KEY}:${role || 'unknown'}:${identitySafe}`;
}

function normalizeTodo(item) {
  return {
    id: item?.id ?? Date.now(),
    title: String(item?.title || '').trim(),
    category: String(item?.category || 'General').trim() || 'General',
    priority: ['High', 'Medium', 'Low'].includes(item?.priority) ? item.priority : 'Medium',
    dueDate: item?.dueDate ? String(item.dueDate) : null,
    completed: Boolean(item?.completed),
  };
}

function loadTodos(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTodo).filter((item) => item.title.length > 0);
  } catch {
    return [];
  }
}

export default function TodosPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isStudent = role === ACCOUNT_ROLES.STUDENT;
  const storageKey = getUserStorageKey(role, user);
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((item) => item.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [todos]);

  useEffect(() => {
    setTodos(loadTodos(storageKey));
  }, [storageKey]);

  const persist = (nextTodos) => {
    setTodos(nextTodos);
    localStorage.setItem(storageKey, JSON.stringify(nextTodos));
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const nextTodos = [
      {
        id: Date.now(),
        title: title.trim(),
        category,
        priority,
        dueDate: dueDate || null,
        completed: false,
      },
      ...todos,
    ];
    persist(nextTodos);
    setTitle('');
    setCategory('General');
    setPriority('Medium');
    setDueDate('');
  };

  const toggleTodo = (id) => {
    const nextTodos = todos.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    persist(nextTodos);
  };

  const removeTodo = (id) => {
    const nextTodos = todos.filter((item) => item.id !== id);
    persist(nextTodos);
  };

  const clearCompleted = () => {
    const nextTodos = todos.filter((item) => !item.completed);
    persist(nextTodos);
  };

  const filteredTodos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todos.filter((item) => {
      const matchSearch =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Completed' ? item.completed : !item.completed);
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, todos]);

  const sortedTodos = useMemo(() => {
    const priorityScore = { High: 0, Medium: 1, Low: 2 };
    return [...filteredTodos].sort((left, right) => {
      if (left.completed !== right.completed) return left.completed ? 1 : -1;
      const leftDue = left.dueDate || '9999-12-31';
      const rightDue = right.dueDate || '9999-12-31';
      if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);
      const leftPriority = priorityScore[left.priority] ?? 3;
      const rightPriority = priorityScore[right.priority] ?? 3;
      return leftPriority - rightPriority;
    });
  }, [filteredTodos]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">To Do List</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isStudent
            ? 'Track real study workflow: class schedule, assignments, and exam preparation.'
            : 'Track real operational work: attendance, assignments, reports, and communication.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Tasks</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Add Task</h2>
        <form onSubmit={addTodo} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="sm:col-span-5 flex justify-end">
            <Button type="submit" icon={HiOutlinePlus}>Add Task</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Task List</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearCompleted}
            disabled={stats.completed === 0}
          >
            Clear Completed
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-2 relative">
            <HiOutlineSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or category"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {sortedTodos.length === 0 ? (
            <p className="text-sm text-gray-500">
              {todos.length === 0
                ? 'No tasks yet. Add your first task above.'
                : 'No tasks match the current filters.'}
            </p>
          ) : (
            sortedTodos.map((item) => (
              <div
                key={item.id}
                className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-3"
              >
                <div>
                  <p className={`text-sm font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Category: {item.category || 'General'} |{' '}
                    Priority: {item.priority}
                    {item.dueDate ? ` | Due: ${item.dueDate}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={item.completed ? 'secondary' : 'success'}
                    size="sm"
                    onClick={() => toggleTodo(item.id)}
                    icon={HiOutlineCheck}
                  >
                    {item.completed ? 'Undo' : 'Mark Done'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeTodo(item.id)}
                    icon={HiOutlineTrash}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
