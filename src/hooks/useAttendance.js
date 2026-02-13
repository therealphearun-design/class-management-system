import { useMemo } from 'react';
import { studentsData } from '../data/students';
import { useAttendanceContext } from '../context/AttendanceContext';

export function useFilteredStudents() {
  const { selectedClass, selectedSection } = useAttendanceContext();

  const filteredStudents = useMemo(() => {
    let students = [...studentsData];

    if (selectedClass) {
      students = students.filter((s) => s.class === selectedClass);
    }
    if (selectedSection) {
      students = students.filter((s) => s.section === selectedSection);
    }

    return students;
  }, [selectedClass, selectedSection]);

  const groupedStudents = useMemo(() => {
    const groups = {};
    filteredStudents.forEach((student) => {
      const letter = student.name.charAt(0).toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(student);
    });

    // Sort alphabetically
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
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
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayRecords = records[dateKey] || {};
    const studentIds = filteredStudents.map((s) => s.id);

    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;

    studentIds.forEach((id) => {
      const status = dayRecords[id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else unmarked++;
    });

    return {
      total: studentIds.length,
      present,
      absent,
      late,
      unmarked,
    };
  }, [records, currentDate, filteredStudents]);
}