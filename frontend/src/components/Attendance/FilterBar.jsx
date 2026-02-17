import React from 'react';

import { format, addDays, subDays } from 'date-fns';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCalendar,
  HiOutlineViewGrid,
  HiOutlineViewList,
} from 'react-icons/hi';

import { useAttendanceContext } from '../../context/AttendanceContext';
import { classOptions, subjectOptions, sectionOptions, shiftOptions } from '../../data/students';
import { useFilteredStudents } from '../../hooks/useAttendance';
import Button from '../common/Button';
import Select from '../common/Select';

export default function FilterBar() {
  const {
    currentDate,
    selectedClass,
    selectedSubject,
    selectedSection,
    selectedShift,
    viewMode,
    isSubmitting,
    setDate,
    setFilter,
    setViewMode,
    submitAttendance,
  } = useAttendanceContext();
  const { filteredStudents } = useFilteredStudents();

  return (
    <div className="space-y-4">
      {/* Top row: Title + Date + View toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>

        <div className="flex items-center gap-3">
          {/* Date navigation */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
            <button
              onClick={() => setDate(subDays(currentDate, 1))}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <HiOutlineChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex items-center gap-2 px-2">
              <HiOutlineCalendar className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Today {format(currentDate, 'dd MMM yyyy')}
              </span>
            </div>

            <button
              onClick={() => setDate(addDays(currentDate, 1))}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <HiOutlineChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <HiOutlineViewList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <HiOutlineViewGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Filters + Take Attendance */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select
            options={classOptions}
            value={selectedClass}
            onChange={(val) => setFilter('selectedClass', val)}
          />
          <Select
            options={subjectOptions}
            value={selectedSubject}
            onChange={(val) => setFilter('selectedSubject', val)}
          />
          <Select
            options={sectionOptions}
            value={selectedSection}
            onChange={(val) => setFilter('selectedSection', val)}
          />
          <Select
            options={shiftOptions}
            value={selectedShift}
            onChange={(val) => setFilter('selectedShift', val)}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onClick={() => submitAttendance(filteredStudents.map((s) => s.id))}
        >
          {isSubmitting ? 'Submitting...' : 'Take Attendance'}
        </Button>
      </div>
    </div>
  );
}
