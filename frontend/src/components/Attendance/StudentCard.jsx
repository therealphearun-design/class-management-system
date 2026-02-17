import React, { memo } from 'react';

import { useAttendanceContext } from '../../context/AttendanceContext';
import Avatar from '../common/Avatar';

const StudentCard = memo(function StudentCard({ student }) {
  const { markAttendance, getStudentStatus } = useAttendanceContext();
  const status = getStudentStatus(student.id);

  const handleMark = (newStatus) => {
    markAttendance(student.id, newStatus);
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-card hover:shadow-lg transition-all duration-300 group border border-transparent hover:border-primary-100">
      <div className="flex flex-col items-center text-center mb-4">
        <div className="relative mb-3">
          <Avatar src={student.avatar} name={student.name} size="lg" />
          {status && (
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white
                ${status === 'present' ? 'bg-attendance-present' : ''}
                ${status === 'absent' ? 'bg-attendance-absent' : ''}
                ${status === 'late' ? 'bg-attendance-late' : ''}
              `}
            >
              {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
            </div>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
          {student.name}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Roll #{student.rollNo} | {student.class}-{student.section} | {student.shift || 'Morning'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => handleMark('present')}
          className={`attendance-btn ${
            status === 'present' ? 'present' : 'inactive'
          }`}
          title="Present"
        >
          P
        </button>
        <button
          onClick={() => handleMark('absent')}
          className={`attendance-btn ${
            status === 'absent' ? 'absent' : 'inactive'
          }`}
          title="Absent"
        >
          A
        </button>
        <button
          onClick={() => handleMark('late')}
          className={`attendance-btn ${
            status === 'late' ? 'late' : 'inactive'
          }`}
          title="Late"
        >
          L
        </button>
      </div>
    </div>
  );
});

export default StudentCard;
