import { useMemo } from 'react';

import { format } from 'date-fns';

import { useAttendanceContext } from '../context/AttendanceContext';
import { studentsData } from '../data/students';

export function useFilteredStudents() {
  const { selectedClass, selectedShift } = useAttendanceContext();

  const filteredStudents = useMemo(() => {
    let students = [...studentsData];

    if (selectedClass) {
      students = students.filter(s => s.class === selectedClass);
    }
    if (selectedShift) {
      students = students.filter(s => s.shift === selectedShift);
    }

    return students;
  }, [selectedClass, selectedShift]);

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
