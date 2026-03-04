import React from 'react';

import {
  HiOutlineBookOpen,
  HiOutlineCalendar,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

import { studentsData } from '../../data/students';

const ATTENDANCE_STORAGE_KEY = 'attendance_records_v1';
const LOCAL_ASSIGNMENTS_KEY = 'assignments_local_v2';

const activeModules = [
  {
    name: 'Student Management',
    note: 'Manage student records by class and section.',
    path: '/students',
    icon: HiOutlineUserGroup,
  },
  {
    name: 'Attendance Tracking',
    note: 'Daily attendance records and latest status.',
    path: '/attendance',
    icon: HiOutlineClipboardCheck,
  },
  {
    name: 'Assignments',
    note: 'Homework and practical tasks from teachers.',
    path: '/assignments',
    icon: HiOutlineBookOpen,
  },
  {
    name: 'Marksheets & Reports',
    note: 'Student scores, ranking, and report export.',
    path: '/marksheets',
    icon: HiOutlineDocumentText,
  },
  {
    name: 'Class Calendar',
    note: 'Exam and class schedule visibility.',
    path: '/calendar',
    icon: HiOutlineCalendar,
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getLatestAttendanceStats() {
  const records = readJson(ATTENDANCE_STORAGE_KEY, {});
  const dates = Object.keys(records || {}).sort();
  if (dates.length === 0) return { marked: 0, presentRate: 0 };

  const latestDate = dates[dates.length - 1];
  const latest = records[latestDate] || {};
  const statuses = Object.values(latest).filter(Boolean);
  if (statuses.length === 0) return { marked: 0, presentRate: 0 };

  const present = statuses.filter((status) => status === 'present').length;
  return {
    marked: statuses.length,
    presentRate: Math.round((present / statuses.length) * 1000) / 10,
  };
}

export default function SystemProgressPage() {
  const attendance = getLatestAttendanceStats();
  const assignments = readJson(LOCAL_ASSIGNMENTS_KEY, []);
  const draftAssignments = assignments.filter(
    (item) => String(item?.status || 'active').toLowerCase() === 'draft'
  ).length;
  const publishedAssignments = Math.max(0, assignments.length - draftAssignments);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-7 shadow-card">
        <p className="inline-flex items-center rounded-md bg-primary-700 px-3 py-1 text-sm font-semibold text-white">
          Overview
        </p>
        <div className="mt-4">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900">School Operational Summary</h1>
            <p className="mt-2 text-sm lg:text-base text-gray-600">
              Quick view of key school data and working modules.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Students in System</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{studentsData.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Latest Attendance Marked</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{attendance.marked}</p>
          <p className="text-xs text-gray-500 mt-1">Present rate: {attendance.presentRate}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Assignments</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{publishedAssignments} published</p>
          <p className="text-xs text-gray-500 mt-1">{draftAssignments} draft</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Active Modules</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{activeModules.length}</p>
          <p className="text-xs text-gray-500 mt-1">Operational in current version</p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Core Modules</h2>
          <span className="text-sm text-gray-500">{activeModules.length} modules</span>
        </div>
        <div className="mt-5 space-y-3">
          {activeModules.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="block w-full rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary-50 p-2 text-primary-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.note}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
