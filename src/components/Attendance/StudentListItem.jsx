import React, { memo } from 'react';
import Avatar from '../common/Avatar';
import { useAttendanceContext } from '../../context/AttendanceContext';

const StudentListItem = memo(function StudentListItem({ student }) {
  const { markAttendance, getStudentStatus } = useAttendanceContext();
  const status = getStudentStatus(student.id);

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-card hover:shadow-md transition-all duration-200 border border-transparent hover:border-primary-100">
      <div className="flex items-center gap-4">
        <Avatar src={student.avatar} name={student.name} size="md" />
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{student.name}</h3>
          <p className="text-xs text-gray-400">
            Roll #{student.rollNo} • {student.class} - {student.section}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => markAttendance(student.id, 'present')}
          className={`attendance-btn ${
            status === 'present' ? 'present' : 'inactive'
          }`}
        >
          P
        </button>
        <button
          onClick={() => markAttendance(student.id, 'absent')}
          className={`attendance-btn ${
            status === 'absent' ? 'absent' : 'inactive'
          }`}
        >
          A
        </button>
        <button
          onClick={() => markAttendance(student.id, 'late')}
          className={`attendance-btn ${
            status === 'late' ? 'late' : 'inactive'
          }`}
        >
          L
        </button>
      </div>
    </div>
  );
});

export default StudentListItem;