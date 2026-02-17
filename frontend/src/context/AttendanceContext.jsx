import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

import { format } from 'date-fns';

const AttendanceContext = createContext(null);
const ATTENDANCE_STORAGE_KEY = 'attendance_records_v1';

const initialState = {
  records: {},
  currentDate: new Date(),
  selectedClass: '',
  selectedSubject: '',
  selectedSection: '',
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

  const submitAttendance = useCallback(async (studentIds = []) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const dateKey = format(state.currentDate, 'yyyy-MM-dd');
      const dateRecords = state.records[dateKey] || {};
      const scopedIds = studentIds.length > 0
        ? studentIds
        : Object.keys(dateRecords);
      const markedCount = scopedIds.filter((id) => dateRecords[id]).length;

      if (markedCount === 0) {
        throw new Error('Please mark at least one student before submitting.');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      dispatch({ type: 'SET_NOTIFICATION', payload: { 
        type: 'success', 
        message: `Attendance submitted successfully! (${markedCount} marked)` 
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
  }, [state.currentDate, state.records]);

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
