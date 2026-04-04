import React, { useEffect, useMemo, useState } from 'react';

import {
  HiOutlineAcademicCap,
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineSearch,
  HiOutlineUsers,
  HiMenu,
  HiViewGrid,
} from 'react-icons/hi';

import { classOptions as studentClassOptions } from '../../data/students';
import { normalizeTeacherStream } from '../../data/teachers';
import { teachersAPI, studentsAPI } from '../../services/api';
import { generateAvatarByGender, normalizeGender } from '../../utils/avatar';
import { buildStudentPassword, normalizeStudentAccount } from '../../utils/studentAuth';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const LOCAL_STUDENTS_KEY = 'students_local_v2';
const DIRECTORY_TYPES = {
  STUDENT: 'student',
  STAFF: 'staff',
};
const VIEW_MODES = {
  LIST: 'list',
  CARD: 'card',
};

function readLocalStudents() {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function compareClassCodes(left, right) {
  const leftValue = String(left || '').trim().toUpperCase();
  const rightValue = String(right || '').trim().toUpperCase();
  const leftMatch = leftValue.match(/^(\d+)([A-Z]*)$/);
  const rightMatch = rightValue.match(/^(\d+)([A-Z]*)$/);

  if (leftMatch && rightMatch) {
    const gradeDiff = Number(leftMatch[1]) - Number(rightMatch[1]);
    if (gradeDiff !== 0) return gradeDiff;
    return leftMatch[2].localeCompare(rightMatch[2]);
  }

  return leftValue.localeCompare(rightValue);
}

function formatDobLabel(dateOfBirth) {
  const parts = String(dateOfBirth || '').split('-');
  if (parts.length !== 3) return '-';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatProfileValue(value, fallback = 'Not available') {
  const normalized = String(value ?? '').trim();
  return normalized && normalized !== '-' ? normalized : fallback;
}

function formatGenderLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Not recorded';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStudentAccountStatus(student) {
  if (!student) return 'Not ready';
  if (student.hasAccount && buildStudentPassword(student)) return 'Login ready';
  if (student.email && student.dateOfBirth) return 'Needs linked account';
  return 'Missing required information';
}

function normalizeTeacherAccount(teacher, index = 1) {
  const fullName = String(teacher?.fullName || teacher?.full_name || '').trim();
  const gender = normalizeGender(teacher?.profileGender || teacher?.gender, index % 2 === 0 ? 'female' : 'male');
  const email = String(teacher?.email || '').trim().toLowerCase();
  const stream = normalizeTeacherStream(teacher?.stream || teacher?.department || teacher?.class);
  const subjectName = String(teacher?.subjectName || teacher?.subject_name || '').trim();

  return {
    id: teacher?.id ?? `teacher-${index}`,
    type: DIRECTORY_TYPES.STAFF,
    name: fullName || `Teacher ${index}`,
    fullName: fullName || `Teacher ${index}`,
    email,
    gender,
    avatar: teacher?.avatar || generateAvatarByGender(email || fullName || `teacher-${index}`, gender),
    employeeCode: String(teacher?.employeeCode || teacher?.employee_code || '').trim(),
    stream,
    subjectName,
    phone: String(teacher?.phone || '').trim(),
    isActive: Number(teacher?.isActive ?? 1) === 1,
    role: 'Teacher',
  };
}

function getStudentClasses(students) {
  const classesFromData = studentClassOptions
    .map((option) => String(option.value || '').trim())
    .filter(Boolean);
  const classesFromStudents = students
    .map((student) => String(student.class || '').trim())
    .filter(Boolean);

  return Array.from(new Set([...classesFromData, ...classesFromStudents])).sort(compareClassCodes);
}

function downloadFile(filename, content, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function exportRowsAsCsv(filename, headers, rows) {
  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
  downloadFile(filename, new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'text/csv;charset=utf-8;');
}

function SectionTitle({ eyebrow, title, summary }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--moeys-gold)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      {summary ? <p className="mt-2 text-sm leading-6 text-slate-500">{summary}</p> : null}
    </div>
  );
}

function DirectoryCard({ item, activeType, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar src={item.avatar} name={item.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{item.name}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{item.email || 'No email available'}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {activeType === DIRECTORY_TYPES.STUDENT ? (
          <>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Class: {item.class || '-'}</div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Address: {item.currentAddress || '-'}</div>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Stream: {item.stream || '-'}</div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Subject: {item.subjectName || '-'}</div>
          </>
        )}
      </div>
    </button>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-900">{value || '-'}</p>
    </div>
  );
}

export default function StudentLookupPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [activeType, setActiveType] = useState(DIRECTORY_TYPES.STUDENT);
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [nameQuery, setNameQuery] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [streamFilter, setStreamFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const loadDirectory = async () => {
      setLoading(true);
      const localStudents = readLocalStudents().map((student, index) =>
        normalizeStudentAccount(student, student.id ?? index + 1)
      );

      const [studentsResult, teachersResult] = await Promise.allSettled([
        studentsAPI.getAll(),
        teachersAPI.getAll(),
      ]);

      const hasStudentApi =
        studentsResult.status === 'fulfilled' &&
        Array.isArray(studentsResult.value?.data);

      if (hasStudentApi) {
        const normalizedApiStudents = studentsResult.value.data.map((student, index) =>
          normalizeStudentAccount(student, student.id ?? index + 1)
        );
        setStudents(normalizedApiStudents);
      } else {
        setStudents(localStudents);
      }

      if (
        teachersResult.status === 'fulfilled' &&
        Array.isArray(teachersResult.value?.data)
      ) {
        const normalizedTeachers = teachersResult.value.data.map((teacher, index) =>
          normalizeTeacherAccount(teacher, index + 1)
        );
        setTeachers(normalizedTeachers);
      } else {
        setTeachers([]);
      }

      setLoading(false);
    };

    loadDirectory();
  }, []);

  const classOptions = useMemo(() => getStudentClasses(students), [students]);
  const streamOptions = useMemo(
    () =>
      Array.from(new Set(teachers.map((teacher) => teacher.stream).filter(Boolean))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [teachers]
  );

  const activeRecords = activeType === DIRECTORY_TYPES.STUDENT ? students : teachers;

  const filteredRecords = useMemo(() => {
    const nameTerm = nameQuery.trim().toLowerCase();
    const emailTerm = emailQuery.trim().toLowerCase();

    return activeRecords.filter((item) => {
      if (nameTerm && !String(item.name || '').toLowerCase().includes(nameTerm)) return false;
      if (emailTerm && !String(item.email || '').toLowerCase().includes(emailTerm)) return false;
      if (activeType === DIRECTORY_TYPES.STUDENT && classFilter !== 'ALL' && String(item.class) !== classFilter) return false;
      if (activeType === DIRECTORY_TYPES.STAFF && streamFilter !== 'ALL' && String(item.stream) !== streamFilter) return false;
      return true;
    });
  }, [activeRecords, activeType, classFilter, emailQuery, nameQuery, streamFilter]);

  const effectiveSelectedId = useMemo(() => {
    if (!filteredRecords.length) return null;
    return filteredRecords.some((item) => String(item.id) === String(selectedId))
      ? selectedId
      : filteredRecords[0].id;
  }, [filteredRecords, selectedId]);

  useEffect(() => {
    if (activeType !== DIRECTORY_TYPES.STUDENT || !effectiveSelectedId) return undefined;

    let cancelled = false;

    const loadSelectedStudentDetails = async () => {
      try {
        const response = await studentsAPI.getById(effectiveSelectedId);
        const detail = response?.data && typeof response.data === 'object'
          ? normalizeStudentAccount(response.data, Number(effectiveSelectedId) || 1)
          : null;

        if (!cancelled) {
          setSelectedStudentDetails(detail);
        }
      } catch {
        if (!cancelled) {
          setSelectedStudentDetails(null);
        }
      }
    };

    loadSelectedStudentDetails();

    return () => {
      cancelled = true;
    };
  }, [activeType, effectiveSelectedId]);

  const selectedRecord = useMemo(() => {
    const baseRecord = filteredRecords.find((item) => String(item.id) === String(effectiveSelectedId)) || null;
    if (
      activeType === DIRECTORY_TYPES.STUDENT &&
      selectedStudentDetails &&
      String(selectedStudentDetails.id) === String(effectiveSelectedId)
    ) {
      return {
        ...baseRecord,
        ...selectedStudentDetails,
      };
    }
    return baseRecord;
  }, [activeType, effectiveSelectedId, filteredRecords, selectedStudentDetails]);

  const directoryStats = useMemo(
    () => ({
      students: students.length,
      teachers: teachers.length,
      visible: filteredRecords.length,
    }),
    [filteredRecords.length, students.length, teachers.length]
  );

  const exportCurrentDirectory = () => {
    if (activeType === DIRECTORY_TYPES.STUDENT) {
      const rows = filteredRecords.map((student) => [
        student.name,
        student.studentId || '',
        student.class,
        student.shift,
        student.dateOfBirth || '',
        getStudentAccountStatus(student),
        buildStudentPassword(student),
        student.email,
        student.currentAddress || '',
      ]);
      exportRowsAsCsv(
        'students-directory.csv',
        ['Name', 'Student ID', 'Class', 'Shift', 'Date of Birth', 'Account Status', 'Login Password', 'Email', 'Current Address'],
        rows
      );
      return;
    }

    const rows = filteredRecords.map((teacher) => [
      teacher.name,
      teacher.employeeCode,
      teacher.stream,
      teacher.subjectName,
      teacher.phone,
      teacher.email,
    ]);
    exportRowsAsCsv(
      'staff-directory.csv',
      ['Name', 'Employee Code', 'Stream', 'Subject', 'Phone', 'Email'],
      rows
    );
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef4ff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--moeys-gold)]">
              User Directory
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              User Lookup
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Search the school directory, review professional profile details, and switch between student and teacher records from one clean lookup workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveType(DIRECTORY_TYPES.STUDENT)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeType === DIRECTORY_TYPES.STUDENT
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <HiOutlineAcademicCap className="h-4 w-4" />
                Student Lookup
              </button>
              <button
                type="button"
                onClick={() => setActiveType(DIRECTORY_TYPES.STAFF)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeType === DIRECTORY_TYPES.STAFF
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <HiOutlineUsers className="h-4 w-4" />
                Staff / Teacher Lookup
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Student Records</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{directoryStats.students}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Staff Records</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{directoryStats.teachers}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Visible Results</p>
                <p className="mt-2 text-2xl font-bold text-primary-700">{directoryStats.visible}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle
          eyebrow="Search Filters"
          title={`Find ${activeType === DIRECTORY_TYPES.STUDENT ? 'students' : 'staff members'}`}
          summary="Use the directory filters below to narrow the records and then switch between list and card views."
        />

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px_260px_auto] xl:items-end">
          <div>
            <label htmlFor="lookup-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <div className="relative">
              <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="lookup-name"
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder={activeType === DIRECTORY_TYPES.STUDENT ? 'Search student name' : 'Search teacher name'}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lookup-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="lookup-email"
              type="email"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              placeholder="Search by email"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {activeType === DIRECTORY_TYPES.STUDENT ? (
            <div>
              <label htmlFor="lookup-class" className="mb-1.5 block text-sm font-medium text-slate-700">
                Class
              </label>
              <select
                id="lookup-class"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="ALL">All Classes</option>
                {classOptions.map((classCode) => (
                  <option key={classCode} value={classCode}>
                    {classCode}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="lookup-stream" className="mb-1.5 block text-sm font-medium text-slate-700">
                Stream
              </label>
              <select
                id="lookup-stream"
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="ALL">All Streams</option>
                {streamOptions.map((stream) => (
                  <option key={stream} value={stream}>
                    {stream}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">View</span>
            <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODES.LIST)}
                className={`flex h-10 w-10 items-center justify-center transition ${
                  viewMode === VIEW_MODES.LIST
                    ? 'bg-primary-700 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
                aria-label="List view"
                title="List view"
              >
                <HiMenu className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODES.CARD)}
                className={`flex h-10 w-10 items-center justify-center transition ${
                  viewMode === VIEW_MODES.CARD
                    ? 'bg-primary-700 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
                aria-label="Card view"
                title="Card view"
              >
                <HiViewGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="secondary" icon={HiOutlineDownload} onClick={exportCurrentDirectory}>
              Export
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading directory records...
        </div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              eyebrow="Results"
              title={`${activeType === DIRECTORY_TYPES.STUDENT ? 'Student' : 'Staff'} directory results`}
              summary={`Browse the filtered ${activeType === DIRECTORY_TYPES.STUDENT ? 'student' : 'staff'} records and select one to inspect the full details.`}
            />

            <div className="mt-5">
              {!filteredRecords.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No matching {activeType === DIRECTORY_TYPES.STUDENT ? 'student' : 'staff'} record found.
                </div>
              ) : viewMode === VIEW_MODES.LIST ? (
                <div className="overflow-x-auto rounded-[24px] border border-slate-200">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</th>
                        {activeType === DIRECTORY_TYPES.STUDENT ? (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Employee Code</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Stream</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subject</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((item) => (
                        <tr
                          key={`${activeType}-${item.id}`}
                          onClick={() => setSelectedId(item.id)}
                          className={`cursor-pointer transition hover:bg-slate-50 ${
                            String(effectiveSelectedId) === String(item.id) ? 'bg-primary-50/70' : 'bg-white'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={item.avatar} name={item.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {activeType === DIRECTORY_TYPES.STUDENT ? 'Student' : 'Teacher'}
                                </p>
                              </div>
                            </div>
                          </td>
                          {activeType === DIRECTORY_TYPES.STUDENT ? (
                            <>
                              <td className="px-4 py-3 text-sm text-slate-600">{item.studentId || '-'}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{item.class || '-'}</td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-700">{getStudentAccountStatus(item)}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{item.currentAddress || '-'}</td>
                              <td className="px-4 py-3 text-sm text-primary-700">{item.email || '-'}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm text-slate-600">{item.employeeCode || '-'}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{item.stream || '-'}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{item.subjectName || '-'}</td>
                              <td className="px-4 py-3 text-sm text-primary-700">{item.email || '-'}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredRecords.map((item) => (
                    <DirectoryCard
                      key={`${activeType}-card-${item.id}`}
                      item={item}
                      activeType={activeType}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="self-start rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
            <SectionTitle
              eyebrow="Profile View"
              title={activeType === DIRECTORY_TYPES.STUDENT ? 'Selected student profile' : 'Selected staff profile'}
              summary="Review the current directory details and use the built-in actions for quick follow-up."
            />

            <div className="mt-5">
              {selectedRecord ? (
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar src={selectedRecord.avatar} name={selectedRecord.name} size="xl" className="h-20 w-20 ring-4 ring-white shadow-md" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xl font-semibold text-slate-900">{selectedRecord.name}</h3>
                            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {activeType === DIRECTORY_TYPES.STUDENT ? 'Student Profile' : 'Teacher Profile'}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {selectedRecord.email || 'No email available'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              {activeType === DIRECTORY_TYPES.STUDENT
                                ? `Class ${formatProfileValue(selectedRecord.class, 'Unassigned')}`
                                : `Stream ${formatProfileValue(selectedRecord.stream)}`}
                            </span>
                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              {activeType === DIRECTORY_TYPES.STUDENT
                                ? `Shift ${formatProfileValue(selectedRecord.shift, 'Not assigned')}`
                                : formatProfileValue(selectedRecord.subjectName, 'Subject pending')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:min-w-[220px]">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {activeType === DIRECTORY_TYPES.STUDENT ? 'Student ID' : 'Employee Code'}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {activeType === DIRECTORY_TYPES.STUDENT
                              ? formatProfileValue(selectedRecord.studentId)
                              : formatProfileValue(selectedRecord.employeeCode)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {activeType === DIRECTORY_TYPES.STUDENT ? 'Account Status' : 'Status'}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {activeType === DIRECTORY_TYPES.STUDENT
                              ? getStudentAccountStatus(selectedRecord)
                              : (selectedRecord.isActive ? 'Active' : 'Inactive')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeType === DIRECTORY_TYPES.STUDENT ? (
                      <>
                        <InfoCard label="Class" value={formatProfileValue(selectedRecord.class, 'Unassigned')} />
                        <InfoCard label="Shift" value={formatProfileValue(selectedRecord.shift, 'Not assigned')} />
                        <InfoCard label="Date of Birth" value={formatProfileValue(formatDobLabel(selectedRecord.dateOfBirth), 'Not recorded')} />
                        <InfoCard label="Login Password" value={formatProfileValue(buildStudentPassword(selectedRecord), 'Needs date of birth')} />
                        <InfoCard label="Login Email" value={formatProfileValue(selectedRecord.email)} />
                        <InfoCard label="Current Address" value={formatProfileValue(selectedRecord.currentAddress, 'Not recorded')} />
                        <InfoCard label="Account Status" value={getStudentAccountStatus(selectedRecord)} />
                        <InfoCard label="Gender" value={formatGenderLabel(selectedRecord.gender)} />
                      </>
                    ) : (
                      <>
                        <InfoCard label="Employee Code" value={formatProfileValue(selectedRecord.employeeCode)} />
                        <InfoCard label="Stream" value={formatProfileValue(selectedRecord.stream)} />
                        <InfoCard label="Subject" value={formatProfileValue(selectedRecord.subjectName)} />
                        <InfoCard label="Phone" value={formatProfileValue(selectedRecord.phone, 'Not added')} />
                        <InfoCard label="Email" value={formatProfileValue(selectedRecord.email)} />
                        <InfoCard label="Status" value={selectedRecord.isActive ? 'Active' : 'Inactive'} />
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="secondary"
                      icon={HiOutlineMail}
                      onClick={() => {
                        if (!selectedRecord.email) return;
                        window.location.href = `mailto:${selectedRecord.email}`;
                      }}
                    >
                      Send Email
                    </Button>
                    {activeType === DIRECTORY_TYPES.STAFF && selectedRecord.phone ? (
                      <Button
                        variant="secondary"
                        icon={HiOutlinePhone}
                        onClick={() => {
                          window.location.href = `tel:${selectedRecord.phone}`;
                        }}
                      >
                        Call
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Select a {activeType === DIRECTORY_TYPES.STUDENT ? 'student' : 'staff member'} from the results to view the profile details.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle
          eyebrow="Directory Summary"
          title={activeType === DIRECTORY_TYPES.STUDENT ? 'Student list view' : 'Staff list view'}
          summary="This condensed list is useful when you want a quick administrative overview without opening each profile one by one."
        />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</th>
                {activeType === DIRECTORY_TYPES.STUDENT ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Login Password</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Employee Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Stream</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subject</th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.slice(0, 150).map((item) => (
                <tr key={`summary-${activeType}-${item.id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                  {activeType === DIRECTORY_TYPES.STUDENT ? (
                    <>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.studentId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.class}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{getStudentAccountStatus(item)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.currentAddress || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{buildStudentPassword(item)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.employeeCode}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.stream}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.subjectName}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-sm text-primary-700">{item.email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > 150 ? (
          <p className="mt-3 text-xs text-slate-500">
            Showing the first 150 records in summary view. Use export for the full filtered directory.
          </p>
        ) : null}
      </section>
    </div>
  );
}
