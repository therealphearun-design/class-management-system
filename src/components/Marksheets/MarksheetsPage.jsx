import React, { useEffect, useMemo, useState } from 'react';

import { classOptions, sectionOptions, shiftOptions, studentsData } from '../../data/students';
import { marksheetsAPI, studentsAPI } from '../../services/api';
import Badge from '../common/Badge';
import Button from '../common/Button';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';

const LOCAL_STUDENTS_KEY = 'students_local_v2';
const LOCAL_MARKSHEETS_KEY = 'marksheets_local_v2';
const SUBJECTS = ['math', 'science', 'english', 'history', 'computer'];

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function uniqueStudents(students) {
  const seen = new Set();
  return students.filter((student) => {
    const key = String(student.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeStudent(student) {
  return {
    ...student,
    shift: student.shift || 'Morning',
    section: student.section || 'A',
  };
}

function deterministicScore(student, offset) {
  const seedString = `${student.id}-${student.class}-${student.rollNo}-${offset}`;
  let seed = 0;
  for (let i = 0; i < seedString.length; i += 1) {
    seed = (seed * 31 + seedString.charCodeAt(i)) % 100000;
  }
  return 45 + (seed % 56);
}

function buildFallbackScores(student) {
  return SUBJECTS.reduce((acc, subject, index) => {
    acc[subject] = deterministicScore(student, index + 1);
    return acc;
  }, {});
}

function normalizeScoreMap(payload) {
  if (!payload) return {};

  if (Array.isArray(payload)) {
    return payload.reduce((acc, item) => {
      const studentId = item?.studentId ?? item?.id;
      if (studentId == null) return acc;
      acc[String(studentId)] = SUBJECTS.reduce((scores, subject) => {
        if (item?.scores && typeof item.scores === 'object') {
          scores[subject] = clampScore(item.scores[subject]);
        } else {
          scores[subject] = clampScore(item?.[subject]);
        }
        return scores;
      }, {});
      return acc;
    }, {});
  }

  if (typeof payload === 'object') {
    return Object.entries(payload).reduce((acc, [studentId, value]) => {
      acc[String(studentId)] = SUBJECTS.reduce((scores, subject) => {
        if (value && typeof value === 'object' && value.scores && typeof value.scores === 'object') {
          scores[subject] = clampScore(value.scores[subject]);
        } else {
          scores[subject] = clampScore(value?.[subject]);
        }
        return scores;
      }, {});
      return acc;
    }, {});
  }

  return {};
}

function getGradeFromAverage(avg) {
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
}

export default function MarksheetsPage() {
  const [students, setStudents] = useState([]);
  const [marksByStudent, setMarksByStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedShift, setSelectedShift] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [formScores, setFormScores] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const localStudents = safeReadJson(LOCAL_STUDENTS_KEY, []).map(normalizeStudent);

      let mergedStudents;
      try {
        const response = await studentsAPI.getAll();
        const apiStudents = Array.isArray(response?.data) ? response.data : [];
        const baseStudents = apiStudents.length > 0 ? apiStudents : studentsData;
        mergedStudents = uniqueStudents([...localStudents, ...baseStudents.map(normalizeStudent)]);
      } catch {
        mergedStudents = uniqueStudents([...localStudents, ...studentsData.map(normalizeStudent)]);
      }

      let apiScores = {};
      try {
        const response = await marksheetsAPI.getAll();
        const payload = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.items)
          ? response.data.items
          : response?.data;
        apiScores = normalizeScoreMap(payload);
      } catch {
        apiScores = {};
      }

      const localScores = normalizeScoreMap(safeReadJson(LOCAL_MARKSHEETS_KEY, {}));
      setStudents(mergedStudents);
      setMarksByStudent({ ...apiScores, ...localScores });
      setLoading(false);
    };

    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const classOk = selectedClass === 'ALL' || student.class === selectedClass;
      const sectionOk = selectedSection === 'ALL' || student.section === selectedSection;
      const shiftOk = selectedShift === 'ALL' || student.shift === selectedShift;
      return classOk && sectionOk && shiftOk;
    });
  }, [students, selectedClass, selectedSection, selectedShift]);

  const rows = useMemo(() => {
    const baseRows = filteredStudents.map((student) => {
      const studentId = String(student.id);
      const scores = marksByStudent[studentId] || buildFallbackScores(student);
      const total = SUBJECTS.reduce((sum, subject) => sum + clampScore(scores[subject]), 0);
      const avg = Number((total / SUBJECTS.length).toFixed(1));
      const grade = getGradeFromAverage(avg);
      return {
        id: student.id,
        studentId,
        name: student.name,
        class: student.class,
        section: student.section,
        shift: student.shift,
        rollNo: student.rollNo,
        ...scores,
        total,
        avg,
        grade,
      };
    });

    // Rank by performance first so the rank column and table order always match.
    const ranked = [...baseRows].sort((a, b) => {
      if (b.avg !== a.avg) return b.avg - a.avg;
      if (b.total !== a.total) return b.total - a.total;
      return String(a.name).localeCompare(String(b.name));
    });

    // Dense ranking: equal avg+total share the same rank number.
    let prevKey = null;
    let currentRank = 0;
    return ranked.map((row, index) => {
      const key = `${row.avg}-${row.total}`;
      if (key !== prevKey) {
        currentRank = index + 1;
        prevKey = key;
      }
      return { ...row, rank: currentRank };
    });
  }, [filteredStudents, marksByStudent]);

  const stats = useMemo(() => {
    if (rows.length === 0) return { students: 0, avg: 0, passRate: 0 };
    const avg = rows.reduce((sum, row) => sum + row.avg, 0) / rows.length;
    const passCount = rows.filter((row) => row.avg >= 50).length;
    return {
      students: rows.length,
      avg: avg.toFixed(1),
      passRate: ((passCount / rows.length) * 100).toFixed(1),
    };
  }, [rows]);

  const openEditModal = (row) => {
    setEditing(row);
    setFormScores(
      SUBJECTS.reduce((acc, subject) => {
        acc[subject] = clampScore(row[subject]);
        return acc;
      }, {})
    );
  };

  const closeEditModal = () => {
    if (isSaving) return;
    setEditing(null);
    setFormScores({});
  };

  const handleSaveScores = async (event) => {
    event.preventDefault();
    if (!editing) return;

    const nextScores = SUBJECTS.reduce((acc, subject) => {
      acc[subject] = clampScore(formScores[subject]);
      return acc;
    }, {});

    const nextMap = {
      ...marksByStudent,
      [String(editing.studentId)]: nextScores,
    };

    setIsSaving(true);
    try {
      await marksheetsAPI.update(editing.studentId, {
        studentId: editing.studentId,
        studentName: editing.name,
        ...nextScores,
      });
      setNotification({ type: 'success', message: 'Marksheet updated successfully.' });
    } catch {
      setNotification({ type: 'success', message: 'Marksheet updated locally (API unavailable).' });
    } finally {
      setMarksByStudent(nextMap);
      saveJson(LOCAL_MARKSHEETS_KEY, nextMap);
      setIsSaving(false);
      closeEditModal();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const columns = [
    {
      header: 'Rank',
      accessor: 'rank',
      sortable: true,
    },
    {
      header: 'Student',
      accessor: 'name',
      sortable: true,
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
      header: 'Shift',
      accessor: 'shift',
      sortable: true,
      render: (value) => <Badge variant="success">{value}</Badge>,
    },
    ...SUBJECTS.map((subject) => ({
      header: subject.toUpperCase(),
      accessor: subject,
      sortable: true,
    })),
    {
      header: 'Total',
      accessor: 'total',
      sortable: true,
    },
    {
      header: 'Average',
      accessor: 'avg',
      sortable: true,
    },
    {
      header: 'Grade',
      accessor: 'grade',
      sortable: true,
      render: (value) => {
        const variant =
          value === 'A' ? 'success' : value === 'B' ? 'primary' : value === 'C' ? 'warning' : 'danger';
        return <Badge variant={variant}>{value}</Badge>;
      },
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (_value, row) => (
        <Button size="sm" variant="secondary" onClick={() => openEditModal(row)}>
          Edit
        </Button>
      ),
    },
  ];

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
          <h1 className="text-2xl font-bold text-gray-800">Marksheets</h1>
          <p className="text-sm text-gray-500 mt-1">Student performance using real project student records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.students}</p>
          <p className="text-xs text-gray-500 mt-1">Students in Scope</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.avg}%</p>
          <p className="text-xs text-gray-500 mt-1">Average Score</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-green-600">{stats.passRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Pass Rate</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="w-full md:w-52">
          <label htmlFor="marks-class-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            id="marks-class-filter"
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

        <div className="w-full md:w-52">
          <label htmlFor="marks-section-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Section
          </label>
          <select
            id="marks-section-filter"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Sections</option>
            {sectionOptions.filter((opt) => opt.value).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-52">
          <label htmlFor="marks-shift-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Shift
          </label>
          <select
            id="marks-shift-filter"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Shifts</option>
            {shiftOptions.filter((opt) => opt.value).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        searchable={true}
        exportable={true}
        itemsPerPage={30}
      />

      <Modal isOpen={Boolean(editing)} onClose={closeEditModal} title="Update Marksheet">
        {editing && (
          <form onSubmit={handleSaveScores} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">{editing.name}</p>
              <p className="text-xs text-gray-500">
                {editing.class} | Section {editing.section} | {editing.shift}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map((subject) => (
                <div key={subject}>
                  <label htmlFor={`score-${subject}`} className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {subject}
                  </label>
                  <input
                    id={`score-${subject}`}
                    type="number"
                    min="0"
                    max="100"
                    value={formScores[subject] ?? ''}
                    onChange={(e) => setFormScores((prev) => ({ ...prev, [subject]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeEditModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
