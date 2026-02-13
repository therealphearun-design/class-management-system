import React, { useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';
import {
  HiOutlineDocumentText,
  HiOutlineMinusCircle,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlinePlusCircle,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi';

import { classOptions, sectionOptions, shiftOptions, studentsData, subjectOptions } from '../../data/students';
import { assignmentsAPI } from '../../services/api';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';

const LOCAL_ASSIGNMENTS_KEY = 'assignments_local_v2';

const seedAssignments = [
  {
    id: 1,
    title: 'Algebra Problem Set',
    subject: 'Mathematics',
    dueDate: '2026-03-15',
    status: 'active',
    submissions: 28,
    total: 30,
    classCode: '10A',
    section: 'A',
    shift: 'Morning',
    description: '',
  },
  {
    id: 2,
    title: 'Lab Report: Photosynthesis',
    subject: 'Science',
    dueDate: '2026-03-12',
    status: 'active',
    submissions: 22,
    total: 30,
    classCode: '11C',
    section: 'C',
    shift: 'Afternoon',
    description: '',
  },
  {
    id: 3,
    title: 'Essay: Climate Change',
    subject: 'English',
    dueDate: '2026-02-10',
    status: 'completed',
    submissions: 30,
    total: 30,
    classCode: '9B',
    section: 'B',
    shift: 'Afternoon',
    description: '',
  },
  {
    id: 4,
    title: 'World War II Research',
    subject: 'History',
    dueDate: '2026-02-08',
    status: 'completed',
    submissions: 30,
    total: 30,
    classCode: '10D',
    section: 'D',
    shift: 'Morning',
    description: '',
  },
  {
    id: 5,
    title: 'Python Basics Project',
    subject: 'Computer Science',
    dueDate: '2026-03-20',
    status: 'active',
    submissions: 15,
    total: 30,
    classCode: '12A',
    section: 'A',
    shift: 'Afternoon',
    description: '',
  },
  {
    id: 6,
    title: 'Geometry Worksheet',
    subject: 'Mathematics',
    dueDate: '2026-03-18',
    status: 'draft',
    submissions: 0,
    total: 30,
    classCode: '9A',
    section: 'A',
    shift: 'Morning',
    description: '',
  },
];

const readLocalAssignments = () => {
  try {
    const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalAssignments = (items) => {
  try {
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors for offline mode.
  }
};

const normalizeAssignment = (assignment) => ({
  id: assignment.id ?? `local-${Date.now()}`,
  title: assignment.title || 'Untitled Assignment',
  subject: assignment.subject || 'Mathematics',
  dueDate: assignment.dueDate || '',
  status: assignment.status || 'active',
  submissions: Math.max(0, Number(assignment.submissions) || 0),
  total: Math.max(1, Number(assignment.total) || 30),
  classCode: assignment.classCode || assignment.class || '10A',
  section: assignment.section || 'A',
  shift: assignment.shift || 'Morning',
  description: assignment.description || '',
});

const getStudentCountForGroup = (classCode, section, shift) => {
  const count = studentsData.filter(
    (student) =>
      student.class === classCode &&
      student.section === section &&
      student.shift === shift
  ).length;
  return count || 30;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: subjectOptions.find((opt) => opt.value === 'mathematics')?.label || 'Mathematics',
    dueDate: '',
    total: 30,
    status: 'active',
    classCode: '10A',
    section: 'A',
    shift: 'Morning',
    description: '',
  });

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      const localData = readLocalAssignments().map(normalizeAssignment);
      try {
        const response = await assignmentsAPI.getAll();
        const apiData = (Array.isArray(response?.data) ? response.data : []).map(normalizeAssignment);
        const base = apiData.length > 0 ? apiData : seedAssignments.map(normalizeAssignment);
        const merged = [...localData, ...base.filter((item) => !localData.some((local) => String(local.id) === String(item.id)))];
        setAssignments(merged);
      } catch (_error) {
        const base = seedAssignments.map(normalizeAssignment);
        const merged = [...localData, ...base.filter((item) => !localData.some((local) => String(local.id) === String(item.id)))];
        setAssignments(merged);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      subject: subjectOptions.find((opt) => opt.value === 'mathematics')?.label || 'Mathematics',
      dueDate: '',
      total: getStudentCountForGroup('10A', 'A', 'Morning'),
      status: 'active',
      classCode: '10A',
      section: 'A',
      shift: 'Morning',
      description: '',
    });
  };

  const openCreateModal = () => {
    setEditingAssignmentId(null);
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setFormData({
      title: assignment.title,
      subject: assignment.subject,
      dueDate: assignment.dueDate,
      total: assignment.total,
      status: assignment.status,
      classCode: assignment.classCode,
      section: assignment.section,
      shift: assignment.shift,
      description: assignment.description || '',
    });
    setIsCreateOpen(true);
  };

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesSearch =
        q.length === 0 ||
        assignment.title.toLowerCase().includes(q) ||
        assignment.subject.toLowerCase().includes(q) ||
        assignment.classCode.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' || assignment.status === statusFilter;
      const matchesClass = classFilter === 'all' || assignment.classCode === classFilter;
      const matchesShift = shiftFilter === 'all' || assignment.shift === shiftFilter;
      return matchesSearch && matchesStatus && matchesClass && matchesShift;
    }).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  }, [assignments, classFilter, search, shiftFilter, statusFilter]);

  const stats = useMemo(() => {
    const filteredBase = assignments.filter((assignment) => {
      const matchesClass = classFilter === 'all' || assignment.classCode === classFilter;
      const matchesShift = shiftFilter === 'all' || assignment.shift === shiftFilter;
      return matchesClass && matchesShift;
    });
    const active = filteredBase.filter((a) => a.status === 'active').length;
    const completed = filteredBase.filter((a) => a.status === 'completed').length;
    const draft = filteredBase.filter((a) => a.status === 'draft').length;
    return { total: filteredBase.length, active, completed, draft };
  }, [assignments, classFilter, shiftFilter]);

  const persistAssignments = (nextAssignments) => {
    setAssignments(nextAssignments);
    saveLocalAssignments(nextAssignments);
  };

  const handleCreateOrUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) return;

    setIsSaving(true);
    const normalizedTotal = Math.max(1, Number(formData.total) || 1);
    const nextStatus =
      formData.status === 'draft'
        ? 'draft'
        : normalizedTotal > 0 && normalizedTotal <= Number(formData.total)
        ? formData.status
        : 'active';

    const payload = {
      title: formData.title.trim(),
      subject: formData.subject,
      dueDate: formData.dueDate,
      total: normalizedTotal,
      submissions: editingAssignmentId
        ? Math.min(
            assignments.find((item) => String(item.id) === String(editingAssignmentId))?.submissions || 0,
            normalizedTotal
          )
        : 0,
      status: nextStatus,
      classCode: formData.classCode,
      section: formData.section,
      shift: formData.shift,
      description: formData.description.trim(),
    };

    try {
      if (editingAssignmentId) {
        const response = await assignmentsAPI.update(editingAssignmentId, payload);
        const updated = normalizeAssignment(
          response?.data && typeof response.data === 'object'
            ? response.data
            : { ...payload, id: editingAssignmentId }
        );
        persistAssignments(
          assignments.map((item) =>
            String(item.id) === String(editingAssignmentId) ? updated : item
          )
        );
        setNotification({ type: 'success', message: 'Assignment updated successfully.' });
      } else {
        const response = await assignmentsAPI.create(payload);
        const created = normalizeAssignment(
          response?.data && typeof response.data === 'object'
            ? response.data
            : { ...payload, id: `local-${Date.now()}` }
        );
        persistAssignments([created, ...assignments]);
        setNotification({ type: 'success', message: 'Assignment created successfully.' });
      }
    } catch (_error) {
      if (editingAssignmentId) {
        const updated = normalizeAssignment({ ...payload, id: editingAssignmentId });
        persistAssignments(
          assignments.map((item) =>
            String(item.id) === String(editingAssignmentId) ? updated : item
          )
        );
        setNotification({ type: 'success', message: 'Assignment updated locally (API unavailable).' });
      } else {
        const created = normalizeAssignment({ ...payload, id: `local-${Date.now()}` });
        persistAssignments([created, ...assignments]);
        setNotification({ type: 'success', message: 'Assignment created locally (API unavailable).' });
      }
    } finally {
      setIsSaving(false);
      setIsCreateOpen(false);
      setEditingAssignmentId(null);
      resetForm();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async (assignmentId) => {
    const confirmed = window.confirm('Delete this assignment?');
    if (!confirmed) return;

    const nextAssignments = assignments.filter((item) => String(item.id) !== String(assignmentId));
    try {
      await assignmentsAPI.delete(assignmentId);
    } catch {
      // Continue with local delete fallback.
    }
    persistAssignments(nextAssignments);
    setNotification({ type: 'success', message: 'Assignment deleted.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateSubmissions = async (assignment, delta) => {
    const nextSubmissions = Math.min(
      assignment.total,
      Math.max(0, Number(assignment.submissions) + delta)
    );
    const nextStatus =
      assignment.status === 'draft' && nextSubmissions > 0
        ? 'active'
        : nextSubmissions >= assignment.total
        ? 'completed'
        : assignment.status === 'completed' && nextSubmissions < assignment.total
        ? 'active'
        : assignment.status;

    const updated = {
      ...assignment,
      submissions: nextSubmissions,
      status: nextStatus,
    };

    const nextAssignments = assignments.map((item) =>
      String(item.id) === String(assignment.id) ? updated : item
    );
    persistAssignments(nextAssignments);

    try {
      await assignmentsAPI.update(assignment.id, updated);
    } catch {
      // Keep local updates if API unavailable.
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage assignments by class, shift, and submission progress.</p>
        </div>
        <Button icon={HiOutlinePlus} onClick={openCreateModal}>
          New Assignment
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center border-b-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center border-b-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center border-b-4 border-gray-400">
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
          <p className="text-xs text-gray-500 mt-1">Draft</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-card flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Classes</option>
            {classOptions.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Shifts</option>
            {shiftOptions.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'completed', 'draft'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-8 shadow-card text-center text-sm text-gray-500">
          Loading assignments...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-card text-center text-sm text-gray-500">
          No assignments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-xl p-5 shadow-card hover:shadow-lg transition-all border border-transparent hover:border-primary-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
                </div>
                <Badge
                  variant={
                    assignment.status === 'active'
                      ? 'success'
                      : assignment.status === 'completed'
                      ? 'info'
                      : 'neutral'
                  }
                >
                  {assignment.status}
                </Badge>
              </div>

              <h3 className="font-semibold text-gray-800 mb-1">{assignment.title}</h3>
              <p className="text-xs text-gray-400 mb-3">{assignment.subject}</p>
              <p className="text-xs text-gray-500 mb-3">
                Class {assignment.classCode} | Section {assignment.section} | {assignment.shift}
              </p>
              {assignment.description ? (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{assignment.description}</p>
              ) : null}

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Submissions</span>
                  <span className="font-medium text-gray-700">
                    {assignment.submissions}/{assignment.total}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 rounded-full h-1.5 transition-all"
                    style={{
                      width: `${Math.min(100, (assignment.submissions / assignment.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-400">
                  Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'dd MMM yyyy') : '-'}
                </span>
                <span className="text-gray-500 font-medium">{assignment.submissions} submitted</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 text-gray-600"
                    onClick={() => updateSubmissions(assignment, -1)}
                    aria-label="Decrease submissions"
                  >
                    <HiOutlineMinusCircle className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 text-primary-600"
                    onClick={() => updateSubmissions(assignment, 1)}
                    aria-label="Increase submissions"
                  >
                    <HiOutlinePlusCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded border border-gray-200 hover:border-primary-300 text-gray-600"
                    onClick={() => openEditModal(assignment)}
                  >
                    <HiOutlinePencil className="w-3.5 h-3.5 inline mr-1" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded border border-red-200 hover:border-red-300 text-red-600"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          if (isSaving) return;
          setIsCreateOpen(false);
          setEditingAssignmentId(null);
          resetForm();
        }}
        title={editingAssignmentId ? 'Edit Assignment' : 'Create Assignment'}
      >
        <form onSubmit={handleCreateOrUpdateAssignment} className="space-y-4">
          <div>
            <label htmlFor="assignment-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="assignment-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="assignment-subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              id="assignment-subject"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {subjectOptions
                .filter((option) => option.value)
                .map((option) => (
                  <option key={option.value} value={option.label}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="assignment-class" className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                id="assignment-class"
                value={formData.classCode}
                onChange={(e) => {
                  const classCode = e.target.value;
                  const nextTotal = getStudentCountForGroup(classCode, formData.section, formData.shift);
                  setFormData((prev) => ({ ...prev, classCode, total: nextTotal }));
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {classOptions.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assignment-section" className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                id="assignment-section"
                value={formData.section}
                onChange={(e) => {
                  const section = e.target.value;
                  const nextTotal = getStudentCountForGroup(formData.classCode, section, formData.shift);
                  setFormData((prev) => ({ ...prev, section, total: nextTotal }));
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sectionOptions.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assignment-shift" className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                id="assignment-shift"
                value={formData.shift}
                onChange={(e) => {
                  const shift = e.target.value;
                  const nextTotal = getStudentCountForGroup(formData.classCode, formData.section, shift);
                  setFormData((prev) => ({ ...prev, shift, total: nextTotal }));
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {shiftOptions.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="assignment-due-date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="assignment-due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="assignment-total" className="block text-sm font-medium text-gray-700 mb-1">
                Total Students
              </label>
              <input
                id="assignment-total"
                type="number"
                min="1"
                value={formData.total}
                onChange={(e) => setFormData((prev) => ({ ...prev, total: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assignment-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="assignment-description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Instructions for students..."
            />
          </div>

          <div>
            <label htmlFor="assignment-status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="assignment-status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingAssignmentId(null);
                resetForm();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingAssignmentId ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
