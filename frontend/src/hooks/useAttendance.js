import { useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';

import { ACCOUNT_ROLES, normalizeRole } from '../constants/roles';
import { useAttendanceContext } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { studentsData } from '../data/students';
import { loadTeachers } from '../data/teachers';

export function useFilteredStudents() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === ACCOUNT_ROLES.ADMIN;
  const { selectedClass, selectedShift, selectedSubject } = useAttendanceContext();
  const [teachers, setTeachers] = useState(() => (isAdmin ? loadTeachers() : []));

  useEffect(() => {
    if (!isAdmin) return undefined;
    const refreshTeachers = () => setTeachers(loadTeachers());
    refreshTeachers();
    window.addEventListener('teachers-updated', refreshTeachers);
    window.addEventListener('storage', refreshTeachers);
    return () => {
      window.removeEventListener('teachers-updated', refreshTeachers);
      window.removeEventListener('storage', refreshTeachers);
    };
  }, [isAdmin]);

  const filteredStudents = useMemo(() => {
    let students = isAdmin ? [...teachers] : [...studentsData];

    if (selectedClass) {
      students = students.filter(s => s.class === selectedClass);
    }
    if (!isAdmin && selectedShift) {
      students = students.filter(s => s.shift === selectedShift);
    }
    if (isAdmin && selectedSubject) {
      students = students.filter((teacher) => teacher.subject === selectedSubject);
    }

    return students;
  }, [isAdmin, selectedClass, selectedShift, selectedSubject, teachers]);

  const groupedStudents = useMemo(() => {
    const groups = {};
    
    filteredStudents.forEach(student => {
      const firstLetter = student.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(student);
    });

    // Sort groups alphabetically
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach(key => {
        sortedGroups[key] = groups[key].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      });

    return sortedGroups;
  }, [filteredStudents]);

  return { filteredStudents, groupedStudents };
}

export function useAttendanceStats() {
  const { records, currentDate } = useAttendanceContext();
  const { filteredStudents } = useFilteredStudents();

  return useMemo(() => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const dayRecords = records[dateKey] || {};
    
    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;

    filteredStudents.forEach(student => {
      const status = dayRecords[student.id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else unmarked++;
    });

    return {
      total: filteredStudents.length,
      present,
      absent,
      late,
      unmarked,
    };
  }, [records, currentDate, filteredStudents]);
}
