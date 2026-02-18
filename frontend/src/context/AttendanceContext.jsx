import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

import { format } from 'date-fns';

import { attendanceAPI } from '../services/api';

const AttendanceContext = createContext(null);
const ATTENDANCE_STORAGE_KEY = 'attendance_records_v1';

const initialState = {
  records: {},
  currentDate: new Date(),
  selectedClass: '',
  selectedSubject: '',
  selectedShift: '',
  viewMode: 'grid',
  isSubmitting: false,
  notification: null,
};

function initializeAttendanceState() {
  try {
    const savedRecords = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!savedRecords) {
      return initialState;
    }

    return {
      ...initialState,
      records: JSON.parse(savedRecords),
    };
  } catch (_error) {
    return initialState;
  }
}

function attendanceReducer(state, action) {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_FILTER':
      return { ...state, [action.field]: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'MARK_ATTENDANCE': {
      const dateKey = format(state.currentDate, 'yyyy-MM-dd');
      const dateRecords = state.records[dateKey] || {};
      const currentStatus = dateRecords[action.payload.studentId];
      
      return {
        ...state,
        records: {
          ...state.records,
          [dateKey]: {
            ...dateRecords,
            [action.payload.studentId]: 
              currentStatus === action.payload.status ? null : action.payload.status,
          },
        },
      };
    }
    case 'MARK_ALL_PRESENT': {
      const dateKey = format(state.currentDate, 'yyyy-MM-dd');
      const dateRecords = { ...(state.records[dateKey] || {}) };
      action.payload.studentIds.forEach(id => {
        dateRecords[id] = 'present';
      });
      return {
        ...state,
        records: {
          ...state.records,
          [dateKey]: dateRecords,
        },
      };
    }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    default:
      return state;
  }
}

function buildAttendanceExcelBlob({
  currentDate,
  selectedClass,
  selectedSubject,
  selectedShift,
  students,
  dateRecords,
}) {
  const statusShortMap = {
    present: 'P',
    absent: 'A',
    late: 'L',
    unmarked: 'U',
  };
  const toShortStatus = (status) => statusShortMap[String(status || 'unmarked').toLowerCase()] || 'U';

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const rows = students
    .map(
      (student) => `
        <tr>
          <td>${escapeHtml(student.rollNo)}</td>
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(student.class)}</td>
          <td>${escapeHtml(student.shift || 'Morning')}</td>
          <td>${escapeHtml(toShortStatus(dateRecords[student.id]))}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8" />
    </head>
    <body>
      <table border="1">
        <tr><th>Date</th><td>${escapeHtml(format(currentDate, 'yyyy-MM-dd'))}</td></tr>
        <tr><th>Class</th><td>${escapeHtml(selectedClass || 'All')}</td></tr>
        <tr><th>Shift</th><td>${escapeHtml(selectedShift || 'All')}</td></tr>
        <tr><th>Subject</th><td>${escapeHtml(selectedSubject || 'All')}</td></tr>
      </table>
      <br />
      <table border="1">
        <tr>
          <th>Roll No</th>
          <th>Student Name</th>
          <th>Class</th>
          <th>Shift</th>
          <th>Status</th>
        </tr>
        ${rows}
      </table>
    </body>
    </html>
  `;

  return new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
}

function toShortToken(value, maxLen = 5) {
  const normalized = String(value || 'all')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return (normalized || 'all').slice(0, maxLen);
}

export function AttendanceProvider({ children }) {
  const [state, dispatch] = useReducer(
    attendanceReducer,
    initialState,
    initializeAttendanceState
  );

  useEffect(() => {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(state.records));
    } catch (_error) {
      // Ignore localStorage write failures (private mode/storage limits)
    }
  }, [state.records]);

  const markAttendance = useCallback((studentId, status) => {
    dispatch({ type: 'MARK_ATTENDANCE', payload: { studentId, status } });
  }, []);

  const markAllPresent = useCallback((studentIds) => {
    dispatch({ type: 'MARK_ALL_PRESENT', payload: { studentIds } });
  }, []);

  const setDate = useCallback((date) => {
    dispatch({ type: 'SET_DATE', payload: date });
  }, []);

  const setFilter = useCallback((field, value) => {
    dispatch({ type: 'SET_FILTER', field, payload: value });
  }, []);

  const setViewMode = useCallback((mode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const submitAttendance = useCallback(async (studentIds = [], students = []) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const dateKey = format(state.currentDate, 'yyyy-MM-dd');
      const dateRecords = state.records[dateKey] || {};
      const scopedIds = studentIds.length > 0
        ? studentIds
        : Object.keys(dateRecords);
      const markedCount = scopedIds.filter((id) => dateRecords[id]).length;
      const scopedStudents = students.filter((student) => scopedIds.includes(student.id));

      if (markedCount === 0) {
        throw new Error('Please mark at least one student before submitting.');
      }

      let excelSent = false;
      let telegramFailureMessage = '';
      if (scopedStudents.length > 0) {
        const excelBlob = buildAttendanceExcelBlob({
          currentDate: state.currentDate,
          selectedClass: state.selectedClass,
          selectedSubject: state.selectedSubject,
          selectedShift: state.selectedShift,
          students: scopedStudents,
          dateRecords,
        });
        const now = new Date();
        const classToken = toShortToken(state.selectedClass || 'all', 6);
        const subjectToken = toShortToken(state.selectedSubject || 'all', 5);
        const shiftMap = {
          morning: 'm',
          afternoon: 'a',
        };
        const shiftToken = shiftMap[toShortToken(state.selectedShift || 'all', 9)] || toShortToken(state.selectedShift || 'all', 1);
        const timeToken = format(now, 'HHmm');
        const dateToken = format(state.currentDate, 'yyMMdd');
        const baseName = `${classToken}-${subjectToken}-${shiftToken}-${timeToken}-${dateToken}`;
        const caption = `Attendance report ${format(state.currentDate, 'yyyy-MM-dd')} | Class: ${state.selectedClass || 'All'} | Shift: ${state.selectedShift || 'All'} | Subject: ${state.selectedSubject || 'All'}`;

        const excelFormData = new FormData();
        excelFormData.append('file', excelBlob, `${baseName}.xls`);
        excelFormData.append('caption', caption);
        try {
          await attendanceAPI.sendTelegramReport(excelFormData);
          excelSent = true;
        } catch (sendError) {
          excelSent = false;
          telegramFailureMessage =
            sendError?.response?.data?.message ||
            sendError?.message ||
            'Telegram send failed';
        }
      }

      dispatch({ type: 'SET_NOTIFICATION', payload: { 
        type: 'success', 
        message: excelSent
          ? `Attendance submitted successfully! (${markedCount} marked). Excel sent to Admin Center Telegram.`
          : `Attendance submitted successfully! (${markedCount} marked). Telegram send failed: ${telegramFailureMessage}.`
      }});
    } catch (error) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { 
        type: 'error', 
        message: error.message || 'Failed to submit attendance',
      }});
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
      setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 3000);
    }
  }, [
    state.currentDate,
    state.records,
    state.selectedClass,
    state.selectedShift,
    state.selectedSubject,
  ]);

  const getStudentStatus = useCallback((studentId) => {
    const dateKey = format(state.currentDate, 'yyyy-MM-dd');
    return state.records[dateKey]?.[studentId] || null;
  }, [state.records, state.currentDate]);

  const value = {
    ...state,
    markAttendance,
    markAllPresent,
    setDate,
    setFilter,
    setViewMode,
    submitAttendance,
    getStudentStatus,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendanceContext() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendanceContext must be used within AttendanceProvider');
  }
  return context;
}
