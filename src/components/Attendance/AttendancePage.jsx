import React from 'react';
import FilterBar from './FilterBar';
import StudentCard from './StudentCard';
import StudentListItem from './StudentListItem';
import { useAttendanceContext } from '../../context/AttendanceContext';
import { useFilteredStudents, useAttendanceStats } from '../../hooks/useAttendance';
import Button from '../common/Button';
import { HiOutlineCheckCircle } from 'react-icons/hi';

export default function AttendancePage() {
  const { viewMode, markAllPresent, notification } = useAttendanceContext();
  const { filteredStudents, groupedStudents } = useFilteredStudents();
  const stats = useAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-bounce
            ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
          `}
        >
          <HiOutlineCheckCircle className="w-5 h-5" />
          {notification.message}
        </div>
      )}

      <FilterBar />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center border-b-4 border-attendance-present">
          <p className="text-2xl font-bold text-attendance-present">{stats.present}</p>
          <p className="text-xs text-gray-500 mt-1">Present</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center border-b-4 border-attendance-absent">
          <p className="text-2xl font-bold text-attendance-absent">{stats.absent}</p>
          <p className="text-xs text-gray-500 mt-1">Absent</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center border-b-4 border-attendance-late">
          <p className="text-2xl font-bold text-attendance-late">{stats.late}</p>
          <p className="text-xs text-gray-500 mt-1">Late</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-gray-400">{stats.unmarked}</p>
          <p className="text-xs text-gray-500 mt-1">Unmarked</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="success"
          size="sm"
          onClick={() => markAllPresent(filteredStudents.map((s) => s.id))}
        >
          Mark All Present
        </Button>
        <span className="text-sm text-gray-400">
          {filteredStudents.length} students found
        </span>
      </div>

      {/* Student Grid/List grouped by letter */}
      {Object.keys(groupedStudents).length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-card text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700">No Students Found</h3>
          <p className="text-sm text-gray-400 mt-2">
            Try adjusting the filters to find students.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedStudents).map(([letter, students]) => (
            <section key={letter}>
              {/* Letter header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center font-bold text-sm">
                  {letter}
                </div>
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">
                  {students.length} students
                </span>
              </div>

              {/* Grid view */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {students.map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                </div>
              ) : (
                /* List view */
                <div className="space-y-2">
                  {students.map((student) => (
                    <StudentListItem key={student.id} student={student} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}