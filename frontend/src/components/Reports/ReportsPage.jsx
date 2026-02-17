import React, { useMemo, useState } from 'react';

import { format, getISOWeek, getQuarter, parseISO, startOfWeek } from 'date-fns';
import { HiOutlineDownload } from 'react-icons/hi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { classOptions, studentsData } from '../../data/students';
import Button from '../common/Button';
import Select from '../common/Select';

const ATTENDANCE_STORAGE_KEY = 'attendance_records_v1';
const LOCAL_STUDENTS_KEY = 'students_local_v2';
const LOCAL_ASSIGNMENTS_KEY = 'assignments_local_v2';
const REPORT_HISTORY_KEY = 'report_history_v1';

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0ea5e9'];

const defaultAssignments = [
  { subject: 'Mathematics', submissions: 28, total: 30, classCode: '10A' },
  { subject: 'Science', submissions: 22, total: 30, classCode: '11C' },
  { subject: 'English', submissions: 30, total: 30, classCode: '9B' },
  { subject: 'History', submissions: 30, total: 30, classCode: '10D' },
  { subject: 'Computer Science', submissions: 15, total: 30, classCode: '12A' },
];

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
    // Ignore quota/permission errors.
  }
}

function getMergedStudents() {
  const localStudents = safeReadJson(LOCAL_STUDENTS_KEY, []);
  const merged = [...localStudents, ...studentsData];
  const seen = new Set();
  return merged.filter((student) => {
    const key = `${student.name}-${student.class}-${student.section}-${student.rollNo}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getBucketKey(date, period) {
  if (period === 'weekly') {
    return `${format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')}-W${String(getISOWeek(date)).padStart(2, '0')}`;
  }
  if (period === 'quarterly') {
    return `Q${getQuarter(date)} ${format(date, 'yyyy')}`;
  }
  if (period === 'yearly') {
    return format(date, 'yyyy');
  }
  return format(date, 'MMM yyyy');
}

function getBucketLabel(bucketKey, period) {
  if (period === 'weekly') return bucketKey;
  return bucketKey;
}

function round(num) {
  return Math.round(num * 10) / 10;
}

function createCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('attendance');
  const [period, setPeriod] = useState('monthly');
  const [selectedClass, setSelectedClass] = useState('all');
  const [recentReports, setRecentReports] = useState(() =>
    safeReadJson(REPORT_HISTORY_KEY, []).slice(0, 8)
  );

  const students = useMemo(() => getMergedStudents(), []);
  const attendanceRecords = useMemo(() => safeReadJson(ATTENDANCE_STORAGE_KEY, {}), []);
  const assignments = useMemo(() => {
    const localAssignments = safeReadJson(LOCAL_ASSIGNMENTS_KEY, []);
    return localAssignments.length > 0 ? localAssignments : defaultAssignments;
  }, []);
  const filteredStudents = useMemo(() => {
    if (selectedClass === 'all') return students;
    return students.filter((student) => student.class === selectedClass);
  }, [selectedClass, students]);

  const attendanceTrend = useMemo(() => {
    const studentIds = new Set(filteredStudents.map((student) => String(student.id)));
    const buckets = {};

    Object.entries(attendanceRecords || {}).forEach(([dateKey, dayRecord]) => {
      let date;
      try {
        date = parseISO(dateKey);
      } catch {
        return;
      }
      if (Number.isNaN(date.getTime())) return;

      const bucketKey = getBucketKey(date, period);
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = { present: 0, absent: 0, late: 0, marked: 0 };
      }

      Object.entries(dayRecord || {}).forEach(([studentId, status]) => {
        if (!studentIds.has(String(studentId))) return;
        if (!status) return;
        if (status === 'present') buckets[bucketKey].present += 1;
        if (status === 'absent') buckets[bucketKey].absent += 1;
        if (status === 'late') buckets[bucketKey].late += 1;
        buckets[bucketKey].marked += 1;
      });
    });

    const sorted = Object.entries(buckets)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([bucketKey, value]) => {
        const marked = value.marked || 1;
        return {
          period: getBucketLabel(bucketKey, period),
          present: round((value.present / marked) * 100),
          absent: round((value.absent / marked) * 100),
          late: round((value.late / marked) * 100),
          marked: value.marked,
        };
      });

    return sorted.length > 0
      ? sorted
      : [{ period: 'No Data', present: 0, absent: 0, late: 0, marked: 0 }];
  }, [attendanceRecords, filteredStudents, period]);

  const performanceData = useMemo(() => {
    const scoped = assignments.filter((assignment) =>
      selectedClass === 'all'
        ? true
        : (assignment.classCode || assignment.class) === selectedClass
    );

    const subjectMap = {};
    scoped.forEach((assignment) => {
      const subject = assignment.subject || 'Unknown';
      const total = Math.max(1, Number(assignment.total) || 1);
      const rate = Math.min(100, Math.max(0, (Number(assignment.submissions) / total) * 100));

      if (!subjectMap[subject]) {
        subjectMap[subject] = { subject, rates: [] };
      }
      subjectMap[subject].rates.push(rate);
    });

    const result = Object.values(subjectMap).map((entry) => {
      const rates = entry.rates;
      const sum = rates.reduce((acc, value) => acc + value, 0);
      return {
        subject: entry.subject,
        average: round(sum / rates.length),
        highest: round(Math.max(...rates)),
        lowest: round(Math.min(...rates)),
      };
    });

    return result.length > 0
      ? result
      : [{ subject: 'No Data', average: 0, highest: 0, lowest: 0 }];
  }, [assignments, selectedClass]);

  const demographicsData = useMemo(() => {
    const shiftCount = filteredStudents.reduce((acc, student) => {
      const key = student.shift || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const result = Object.entries(shiftCount).map(([name, value]) => ({ name, value }));
    return result.length > 0 ? result : [{ name: 'No Data', value: 1 }];
  }, [filteredStudents]);

  const summaryStats = useMemo(() => {
    const attendanceMarked = attendanceTrend.reduce((sum, row) => sum + (row.marked || 0), 0);
    const avgPresent =
      attendanceTrend.length > 0
        ? round(attendanceTrend.reduce((sum, row) => sum + row.present, 0) / attendanceTrend.length)
        : 0;
    const avgAbsent =
      attendanceTrend.length > 0
        ? round(attendanceTrend.reduce((sum, row) => sum + row.absent, 0) / attendanceTrend.length)
        : 0;
    const avgPerformance =
      performanceData.length > 0
        ? round(performanceData.reduce((sum, row) => sum + row.average, 0) / performanceData.length)
        : 0;

    return {
      students: filteredStudents.length,
      attendanceMarked,
      avgPresent,
      avgAbsent,
      avgPerformance,
      subjects: performanceData.filter((row) => row.subject !== 'No Data').length,
    };
  }, [attendanceTrend, filteredStudents.length, performanceData]);

  const exportReport = () => {
    const classLabel = selectedClass === 'all' ? 'All Classes' : selectedClass;
    const stamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    let rows = [];
    let filename = '';

    if (reportType === 'attendance') {
      rows = [
        ['Report', 'Attendance Trends'],
        ['Class', classLabel],
        ['Period', period],
        [],
        ['Bucket', 'Present %', 'Absent %', 'Late %', 'Marked Records'],
        ...attendanceTrend.map((row) => [row.period, row.present, row.absent, row.late, row.marked]),
      ];
      filename = `attendance-report-${stamp}.csv`;
    } else if (reportType === 'performance') {
      rows = [
        ['Report', 'Performance Analytics'],
        ['Class', classLabel],
        [],
        ['Subject', 'Average %', 'Highest %', 'Lowest %'],
        ...performanceData.map((row) => [row.subject, row.average, row.highest, row.lowest]),
      ];
      filename = `performance-report-${stamp}.csv`;
    } else {
      rows = [
        ['Report', 'Student Demographics by Shift'],
        ['Class', classLabel],
        [],
        ['Shift', 'Students'],
        ...demographicsData.map((row) => [row.name, row.value]),
      ];
      filename = `demographics-report-${stamp}.csv`;
    }

    const csv = createCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const history = safeReadJson(REPORT_HISTORY_KEY, []);
    const nextHistory = [
      {
        id: Date.now(),
        type: reportType,
        period,
        classLabel,
        createdAt: new Date().toISOString(),
      },
      ...history,
    ].slice(0, 20);
    saveJson(REPORT_HISTORY_KEY, nextHistory);
    setRecentReports(nextHistory.slice(0, 8));
  };

  const classesWithAll = useMemo(
    () => [{ value: 'all', label: 'All Classes' }, ...classOptions.filter((opt) => opt.value)],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time insights from attendance, students, and assignments.</p>
        </div>
        <Button icon={HiOutlineDownload} variant="secondary" onClick={exportReport}>
          Export Report
        </Button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-card flex flex-wrap gap-4">
        <Select
          options={[
            { value: 'attendance', label: 'Attendance Report' },
            { value: 'performance', label: 'Performance Report' },
            { value: 'demographics', label: 'Demographics' },
          ]}
          value={reportType}
          onChange={setReportType}
          className="min-w-[200px]"
        />
        <Select
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          value={period}
          onChange={setPeriod}
          className="min-w-[150px]"
        />
        <Select
          options={classesWithAll}
          value={selectedClass}
          onChange={setSelectedClass}
          className="min-w-[150px]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-card lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {reportType === 'attendance'
              ? 'Attendance Trend by Period'
              : reportType === 'performance'
              ? 'Subject Submission Performance'
              : 'Student Shift Distribution'}
          </h2>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              {reportType === 'attendance' ? (
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="absent" stroke="#dc2626" strokeWidth={2} />
                  <Line type="monotone" dataKey="late" stroke="#ea580c" strokeWidth={2} />
                </LineChart>
              ) : reportType === 'performance' ? (
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subject" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#2563eb" />
                  <Bar dataKey="highest" fill="#16a34a" />
                  <Bar dataKey="lowest" fill="#ea580c" />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={demographicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {demographicsData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Students in Scope</span>
              <span className="text-lg font-bold text-gray-800">{summaryStats.students}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Present</span>
              <span className="text-lg font-bold text-green-600">{summaryStats.avgPresent}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Absent</span>
              <span className="text-lg font-bold text-red-600">{summaryStats.avgAbsent}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Performance Average</span>
              <span className="text-lg font-bold text-blue-600">{summaryStats.avgPerformance}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Subjects Reported</span>
              <span className="text-lg font-bold text-gray-800">{summaryStats.subjects}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Exports</h2>
          <div className="space-y-3">
            {recentReports.length === 0 ? (
              <p className="text-sm text-gray-500">No exports yet. Export a report to create history.</p>
            ) : (
              recentReports.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)} | {item.classLabel}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.period} | {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
