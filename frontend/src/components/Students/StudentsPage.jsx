import React, { useEffect, useMemo, useState } from 'react';

import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

import {
  classOptions,
  DEFAULT_CLASS_CODE,
  DEFAULT_SHIFT,
  normalizeShift,
} from '../../data/students';
import { studentsAPI } from '../../services/api';
import { generateAvatarByGender, normalizeGender } from '../../utils/avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';

const LOCAL_STUDENTS_KEY = 'students_local_v2';
const EMPTY_FORM = {
  studentId: '',
  name: '',
  class: DEFAULT_CLASS_CODE,
  shift: DEFAULT_SHIFT,
  gender: 'male',
  dateOfBirth: '',
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

function normalizeStudentRecord(student, fallbackId = null) {
  const id = student?.id ?? fallbackId ?? `local-${Date.now()}`;
  const name = String(student?.name ?? student?.full_name ?? '').trim();
  const classCode = String(student?.class ?? student?.class_name ?? '').trim().toUpperCase();
  const gender = normalizeGender(student?.gender, 'male');
  const email = String(student?.email || '').trim();
  const studentId = String(student?.studentId ?? student?.student_code ?? '').trim();

  return {
    ...student,
    id,
    studentId,
    name,
    class: classCode,
    shift: normalizeShift(student?.shift),
    gender,
    email,
    dateOfBirth: String(student?.dateOfBirth ?? student?.dob ?? '').trim(),
    avatar:
      student?.avatar ||
      generateAvatarByGender(email || studentId || name || `student-${id}`, gender),
    isLocalOnly: Boolean(student?.isLocalOnly) || String(id).startsWith('local-'),
    status: student?.status || 'active',
  };
}

function mergeUniqueStudents(items) {
  const map = new Map();
  items.forEach((item, index) => {
    const normalized = normalizeStudentRecord(item, index + 1);
    const key =
      (normalized.id != null && `id:${String(normalized.id)}`) ||
      (normalized.studentId && `studentId:${normalized.studentId}`) ||
      (normalized.email && `email:${normalized.email.toLowerCase()}`) ||
      `fallback:${normalized.name.toLowerCase()}-${normalized.class}-${index}`;
    map.set(key, normalized);
  });
  return Array.from(map.values());
}

function formatDateOfBirth(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB').format(date);
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      const localStudents = readLocalStudents().map((student, index) =>
        normalizeStudentRecord(student, index + 1)
      );

      try {
        const response = await studentsAPI.getAll();
        const apiStudents = Array.isArray(response?.data) ? response.data : [];
        const merged = mergeUniqueStudents([
          ...apiStudents,
          ...localStudents.filter((student) => student.isLocalOnly),
        ]);
        setStudents(merged);
        saveLocalStudents(merged);
      } catch (_error) {
        setStudents(localStudents);
        saveLocalStudents(localStudents);
        setNotification({
          type: 'warning',
          message: 'Student API is unavailable. Showing locally cached records only.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const stats = useMemo(() => {
    const activeStudents = students.filter((student) => student.status !== 'alumni');
    const classSet = new Set(activeStudents.map((student) => student.class).filter(Boolean));
    const localOnly = activeStudents.filter((student) => student.isLocalOnly).length;
    return {
      total: activeStudents.length,
      classes: classSet.size,
      shifts: new Set(activeStudents.map((student) => student.shift)).size,
      localOnly,
    };
  }, [students]);

  const classFilterOptions = useMemo(
    () => classOptions.filter((opt) => opt.value).map((opt) => opt.value),
    []
  );

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'ALL') return students;
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
            src={row.avatar}
            alt={value}
            className="h-9 w-9 rounded-full border border-gray-200 object-cover"
          />
          <div>
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-400">{row.studentId || 'Auto-generated ID'}</p>
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
      header: 'Gender',
      accessor: 'gender',
      sortable: true,
      render: (value) => <Badge variant={value === 'female' ? 'info' : 'success'}>{value}</Badge>,
    },
    {
      header: 'Date of Birth',
      accessor: 'dateOfBirth',
      sortable: true,
      render: (value) => formatDateOfBirth(value),
    },
    {
      header: 'Source',
      accessor: 'isLocalOnly',
      sortable: true,
      render: (value) => <Badge variant={value ? 'warning' : 'success'}>{value ? 'Local only' : 'Backend'}</Badge>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={HiOutlinePencil}
            onClick={() => {
              setEditingStudent(row);
              setFormData({
                studentId: row.studentId || '',
                name: row.name || '',
                class: row.class || DEFAULT_CLASS_CODE,
                shift: row.shift || DEFAULT_SHIFT,
                gender: row.gender || 'male',
                dateOfBirth: row.dateOfBirth || '',
              });
              setIsCreateOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={HiOutlineTrash}
            onClick={() => setDeletingStudent(row)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingStudent(null);
    setIsCreateOpen(false);
  };

  const upsertStudent = (student) => {
    const normalized = normalizeStudentRecord(student);
    setStudents((prev) => {
      const exists = prev.some((item) => String(item.id) === String(normalized.id));
      const next = exists
        ? prev.map((item) => (String(item.id) === String(normalized.id) ? normalized : item))
        : [normalized, ...prev];
      saveLocalStudents(next);
      return next;
    });
  };

  const removeStudent = (studentId) => {
    setStudents((prev) => {
      const next = prev.filter((item) => String(item.id) !== String(studentId));
      saveLocalStudents(next);
      return next;
    });
  };

  const handleCreateOrUpdateStudent = async (event) => {
    event.preventDefault();
    const payload = {
      studentId: formData.studentId.trim(),
      name: formData.name.trim(),
      class: formData.class,
      shift: formData.shift,
      gender: normalizeGender(formData.gender, 'male'),
      dateOfBirth: formData.dateOfBirth || '',
    };

    if (!payload.name) {
      setNotification({ type: 'error', message: 'Student name is required.' });
      return;
    }

    if (!payload.dateOfBirth) {
      setNotification({
        type: 'error',
        message: 'Date of birth is required because the student password is generated from it.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = editingStudent
        ? editingStudent.isLocalOnly
          ? await studentsAPI.create(payload)
          : await studentsAPI.update(editingStudent.id, payload)
        : await studentsAPI.create(payload);

      if (editingStudent?.isLocalOnly) {
        removeStudent(editingStudent.id);
        upsertStudent(response?.data && typeof response.data === 'object' ? response.data : payload);
        setNotification({ type: 'success', message: 'Legacy student record synced to the backend successfully.' });
      } else {
        upsertStudent(response?.data && typeof response.data === 'object' ? response.data : payload);
        setNotification({
          type: 'success',
          message: editingStudent ? 'Student updated successfully.' : 'Student added successfully.',
        });
      }
      resetForm();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error?.response?.data?.message || 'Could not save the student right now.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      if (!deletingStudent.isLocalOnly) {
        await studentsAPI.delete(deletingStudent.id);
      }
      removeStudent(deletingStudent.id);
      setDeletingStudent(null);
      setNotification({
        type: 'success',
        message: deletingStudent.isLocalOnly
          ? 'Local student record removed.'
          : 'Student removed successfully.',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: error?.response?.data?.message || 'Could not remove this student right now.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notification.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : notification.type === 'warning'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student records with backend-backed create, update, and delete actions.
          </p>
        </div>
        <Button
          icon={HiOutlinePlus}
          onClick={() => {
            setEditingStudent(null);
            setFormData(EMPTY_FORM);
            setIsCreateOpen(true);
          }}
        >
          New Student
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="mt-1 text-xs text-gray-500">Student Records</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-primary-600">{stats.classes}</p>
          <p className="mt-1 text-xs text-gray-500">Classes</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-green-600">{stats.shifts}</p>
          <p className="mt-1 text-xs text-gray-500">Shifts</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-amber-600">{stats.localOnly}</p>
          <p className="mt-1 text-xs text-gray-500">Local Legacy Records</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Class View</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Showing {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}
            {selectedClass === 'ALL' ? ' across all classes.' : ` in class ${selectedClass}.`}
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Classes</option>
            {classFilterOptions.map((value) => (
              <option key={value} value={value}>
                {value}
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
        itemsPerPage={20}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSaving && resetForm()}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={handleCreateOrUpdateStudent} className="space-y-4">
          <div>
            <label htmlFor="student-id" className="mb-1 block text-sm font-medium text-gray-700">
              Student ID
            </label>
            <input
              id="student-id"
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData((prev) => ({ ...prev, studentId: e.target.value }))}
              placeholder="Optional. Leave empty to auto-generate."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="student-name" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="student-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="student-class" className="mb-1 block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                id="student-class"
                value={formData.class}
                onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {classOptions.filter((opt) => opt.value).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="student-gender" className="mb-1 block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                id="student-gender"
                value={formData.gender}
                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="student-date-of-birth" className="mb-1 block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              id="student-date-of-birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Required for student login. The first password uses last name + date of birth.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingStudent ? 'Save Changes' : 'Save Student'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deletingStudent)}
        onClose={() => !isDeleting && setDeletingStudent(null)}
        title="Remove Student"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Remove <span className="font-semibold text-gray-800">{deletingStudent?.name || 'this student'}</span> from the student list?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeletingStudent(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDeleteStudent}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
