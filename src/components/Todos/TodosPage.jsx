import React, { useMemo, useState } from 'react';

import {
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi';

import { ACCOUNT_ROLES, normalizeRole } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const STORAGE_KEY = 'cms_todos_v1';
const teacherDefaultTodos = [
  {
    id: 1,
    title: 'Review attendance report for Grade 10',
    priority: 'High',
    dueDate: '2026-02-13',
    completed: false,
  },
  {
    id: 2,
    title: 'Prepare assignment schedule for next week',
    priority: 'Medium',
    dueDate: '2026-02-14',
    completed: false,
  },
];

const studentDefaultTodos = [
  {
    id: 1,
    title: 'Complete Mathematics assignment',
    priority: 'High',
    dueDate: '2026-02-16',
    completed: false,
  },
  {
    id: 2,
    title: 'Prepare for upcoming exam schedule',
    priority: 'Medium',
    dueDate: '2026-02-18',
    completed: false,
  },
];

function getInitialTodos(role) {
  const storageKey = `${STORAGE_KEY}_${role}`;
  const saved = localStorage.getItem(storageKey);
  if (!saved) return role === ACCOUNT_ROLES.STUDENT ? studentDefaultTodos : teacherDefaultTodos;
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore parse errors and fallback below.
  }
  return role === ACCOUNT_ROLES.STUDENT ? studentDefaultTodos : teacherDefaultTodos;
}

export default function TodosPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isStudent = role === ACCOUNT_ROLES.STUDENT;
  const [todos, setTodos] = useState(() => getInitialTodos(role));
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((item) => item.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [todos]);

  const persist = (nextTodos) => {
    setTodos(nextTodos);
    localStorage.setItem(`${STORAGE_KEY}_${role}`, JSON.stringify(nextTodos));
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const nextTodos = [
      {
        id: Date.now(),
        title: title.trim(),
        priority,
        dueDate: dueDate || null,
        completed: false,
      },
      ...todos,
    ];
    persist(nextTodos);
    setTitle('');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">To Do List</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isStudent
            ? 'Track your assignment and exam preparation tasks.'
            : 'Track administrative work and daily teaching tasks.'}
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
        <form onSubmit={addTodo} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
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
          <div className="sm:col-span-4 flex justify-end">
            <Button type="submit" icon={HiOutlinePlus}>Add Task</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Task List</h2>
          <Button variant="secondary" size="sm" onClick={clearCompleted}>
            Clear Completed
          </Button>
        </div>

        <div className="space-y-3">
          {todos.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks yet.</p>
          ) : (
            todos.map((item) => (
              <div
                key={item.id}
                className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-3"
              >
                <div>
                  <p className={`text-sm font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
                    {item.completed ? 'Done' : 'Mark Done'}
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
