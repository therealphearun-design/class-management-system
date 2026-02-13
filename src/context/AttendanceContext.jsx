import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { format } from 'date-fns';

const AttendanceContext = createContext(null);

const initialState = {
  records: {},       // { 'YYYY-MM-DD': { studentId: 'present' | 'absent' | 'late' | null } }
  currentDate: new Date(),
  selectedClass: '',
  selectedSubject: '',
  selectedSection: '',
  viewMode: 'grid',  // 'grid' | 'list'
  isSubmitting: false,
  notification: null,
};

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
      const { studentId, status } = action.payload;
      const dateRecords = state.records[dateKey] || {};
      const currentStatus = dateRecords[studentId];

      return {
        ...state,
        records: {
          ...state.records,
          [dateKey]: {
            ...dateRecords,
            [studentId]: currentStatus === status ? null : status,
          },
        },
      };
    }

    case 'MARK_ALL': {
      const dateKey = format(state.currentDate, 'yyyy-MM-dd');
      const dateRecords = { ...(state.records[dateKey] || {}) };
      action.payload.studentIds.forEach((id) => {
        dateRecords[id] = action.payload.status;
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
  const [state, dispatch] = useReducer(attendanceReducer, initialState);

  const markAttendance = useCallback((studentId, status) => {
    dispatch({ type: 'MARK_ATTENDANCE', payload: { studentId, status } });
  }, []);

  const markAllPresent = useCallback((studentIds) => {
    dispatch({ type: 'MARK_ALL', payload: { studentIds, status: 'present' } });
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

  const submitAttendance = useCallback(async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    dispatch({ type: 'SET_SUBMITTING', payload: false });
    dispatch({
      type: 'SET_NOTIFICATION',
      payload: {
        type: 'success',
        message: 'Attendance submitted successfully!',
      },
    });
    setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 3000);
  }, []);

  const getStudentStatus = useCallback(
    (studentId) => {
      const dateKey = format(state.currentDate, 'yyyy-MM-dd');
      return state.records[dateKey]?.[studentId] || null;
    },
    [state.records, state.currentDate]
  );

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