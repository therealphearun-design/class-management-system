import React, { useEffect, useMemo, useState } from 'react';

import { HiOutlinePlus } from 'react-icons/hi';

import { classOptions, sectionOptions, shiftOptions, studentsData } from '../../data/students';
import { studentsAPI } from '../../services/api';
import Badge from '../common/Badge';
import Button from '../common/Button';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';

const LOCAL_STUDENTS_KEY = 'students_local_v2';
const STUDENT_ID_PREFIX = 'CMS';
const STUDENT_ID_BASE = 100000;

const generateAvatar = (name) => {
  const seed = String(name || '').replace(/\s/g, '');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'student'}`;
};

const parseStudentIdNumber = (studentId) => {
  if (typeof studentId !== 'string') return null;
  const match = studentId.match(/^CMS(\d+)$/);
  return match ? Number(match[1]) : null;
};

const formatStudentId = (num) => `${STUDENT_ID_PREFIX}${String(num)}`;

const normalizeStudentIds = (items) => {
  const existingNumbers = items
    .map((student) => parseStudentIdNumber(student.studentId))
    .filter((n) => Number.isFinite(n));

  let nextNumber = Math.max(STUDENT_ID_BASE + 1, ...existingNumbers, 0);

  return items.map((student) => {
    const currentNumber = parseStudentIdNumber(student.studentId);
    if (currentNumber) return student;
    const withId = { ...student, studentId: formatStudentId(nextNumber) };
    nextNumber += 1;
    return withId;
  });
};

function readLocalStudents() {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveLocalStudents(students) {
  try {
    localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(students));
  } catch (_error) {
    // Ignore storage errors.
  }
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState('9A');
  const [formData, setFormData] = useState({
    name: '',
    class: '10A',
    section: 'A',
    shift: 'Morning',
    rollNo: '',
  });

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      const localStudents = readLocalStudents();
      try {
        const response = await studentsAPI.getAll();
        const apiStudents = Array.isArray(response?.data) ? response.data : [];
        const base = apiStudents.length > 0 ? apiStudents : studentsData;
        const merged = [...localStudents, ...base.filter((s) => !localStudents.some((l) => l.id === s.id))];
        const normalized = normalizeStudentIds(
          merged.map((student) => ({ ...student, shift: student.shift || 'Morning' }))
        );
        saveLocalStudents(normalized.filter((s) => String(s.id).startsWith('local-')));
        setStudents(normalized);
      } catch (_error) {
        const merged = [...localStudents, ...studentsData.filter((s) => !localStudents.some((l) => l.id === s.id))];
        const normalized = normalizeStudentIds(
          merged.map((student) => ({ ...student, shift: student.shift || 'Morning' }))
        );
        saveLocalStudents(normalized.filter((s) => String(s.id).startsWith('local-')));
        setStudents(normalized);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const stats = useMemo(() => {
    const classSet = new Set(students.map((s) => s.class));
    const sectionSet = new Set(students.map((s) => s.section));
    const shiftSet = new Set(students.map((s) => s.shift || 'Morning'));
    return {
      total: students.length,
      classes: classSet.size,
      sections: sectionSet.size,
      shifts: shiftSet.size,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass || selectedClass === 'ALL') return students;
    return students.filter((student) => student.class === selectedClass);
  }, [selectedClass, students]);

  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || generateAvatar(value)}
            alt={value}
            className="w-9 h-9 rounded-full object-cover border border-gray-200"
          />
          <div>
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-400">ID: {row.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Class',
      accessor: 'class',
      sortable: true,
    },
    {
      header: 'Section',
      accessor: 'section',
      sortable: true,
      render: (value) => <Badge variant="info">Section {value}</Badge>,
    },
    {
      header: 'Roll No',
      accessor: 'rollNo',
      sortable: true,
    },
    {
      header: 'Shift',
      accessor: 'shift',
      sortable: true,
      render: (value) => <Badge variant="success">{value || 'Morning'}</Badge>,
    },
  ];

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    const rollNo = Number(formData.rollNo);
    if (!name || !rollNo) return;

    const currentNumbers = students
      .map((s) => parseStudentIdNumber(s.studentId))
      .filter((n) => Number.isFinite(n));
    const nextStudentIdNumber = Math.max(STUDENT_ID_BASE, ...currentNumbers, 0) + 1;
    const studentId = formatStudentId(nextStudentIdNumber);

    const payload = {
      name,
      class: formData.class,
      section: formData.section,
      shift: formData.shift,
      rollNo,
      avatar: generateAvatar(name),
      studentId,
    };

    setIsSaving(true);
    try {
      const response = await studentsAPI.create(payload);
      const created = response?.data && typeof response.data === 'object'
        ? { ...payload, ...response.data, studentId: response.data.studentId || studentId }
        : { ...payload, id: `local-${Date.now()}` };
      setStudents((prev) => [created, ...prev]);
      const localStudents = [created, ...readLocalStudents().filter((s) => s.id !== created.id)];
      saveLocalStudents(localStudents);
      setNotification({ type: 'success', message: 'Student added successfully.' });
    } catch (_error) {
      const created = { ...payload, id: `local-${Date.now()}` };
      setStudents((prev) => [created, ...prev]);
      const localStudents = [created, ...readLocalStudents().filter((s) => s.id !== created.id)];
      saveLocalStudents(localStudents);
      setNotification({ type: 'success', message: 'Student added locally (API unavailable).' });
    } finally {
      setIsSaving(false);
      setIsCreateOpen(false);
      setFormData({
        name: '',
        class: '10A',
        section: 'A',
        shift: 'Morning',
        rollNo: '',
      });
      setTimeout(() => setNotification(null), 3000);
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
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-sm text-gray-500 mt-1">View all current students and add new records.</p>
        </div>
        <Button icon={HiOutlinePlus} onClick={() => setIsCreateOpen(true)}>
          New Student
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.classes}</p>
          <p className="text-xs text-gray-500 mt-1">Classes</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.sections}</p>
          <p className="text-xs text-gray-500 mt-1">Sections</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-green-600">{stats.shifts}</p>
          <p className="text-xs text-gray-500 mt-1">Shifts</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Class View</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {filteredStudents.length} students
            {selectedClass !== 'ALL' ? ` in class ${selectedClass}` : ' in all classes'}.
          </p>
        </div>
        <div className="w-full sm:w-52">
          <label htmlFor="students-class-filter" className="sr-only">
            Filter by class
          </label>
          <select
            id="students-class-filter"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Classes</option>
            {classOptions.filter((opt) => opt.value).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredStudents}
        loading={loading}
        searchable={true}
        exportable={true}
        itemsPerPage={30}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSaving && setIsCreateOpen(false)}
        title="Add New Student"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="student-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="student-class" className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                id="student-class"
                value={formData.class}
                onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {classOptions.filter((opt) => opt.value).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="student-section" className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                id="student-section"
                value={formData.section}
                onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sectionOptions.filter((opt) => opt.value).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="student-shift" className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                id="student-shift"
                value={formData.shift}
                onChange={(e) => setFormData((prev) => ({ ...prev, shift: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {shiftOptions.filter((opt) => opt.value).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="student-roll" className="block text-sm font-medium text-gray-700 mb-1">
              Roll Number
            </label>
            <input
              id="student-roll"
              type="number"
              min="1"
              value={formData.rollNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, rollNo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              Save Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
