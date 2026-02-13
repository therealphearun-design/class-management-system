import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { HiOutlinePlus, HiOutlineDocumentText } from 'react-icons/hi';

const assignments = [
  { id: 1, title: 'Algebra Problem Set', subject: 'Mathematics', dueDate: 'Dec 15, 2025', status: 'active', submissions: 28, total: 35 },
  { id: 2, title: 'Lab Report: Photosynthesis', subject: 'Science', dueDate: 'Dec 12, 2025', status: 'active', submissions: 32, total: 35 },
  { id: 3, title: 'Essay: Climate Change', subject: 'English', dueDate: 'Dec 10, 2025', status: 'completed', submissions: 35, total: 35 },
  { id: 4, title: 'World War II Research', subject: 'History', dueDate: 'Dec 8, 2025', status: 'completed', submissions: 33, total: 35 },
  { id: 5, title: 'Python Basics Project', subject: 'Computer Science', dueDate: 'Dec 20, 2025', status: 'active', submissions: 15, total: 35 },
  { id: 6, title: 'Geometry Worksheet', subject: 'Mathematics', dueDate: 'Dec 18, 2025', status: 'draft', submissions: 0, total: 35 },
];

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track assignments</p>
        </div>
        <Button icon={HiOutlinePlus}>New Assignment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-xl p-5 shadow-card hover:shadow-lg transition-all border border-transparent hover:border-primary-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
              </div>
              <Badge
                variant={
                  assignment.status === 'active'
                    ? 'success'
                    : assignment.status === 'completed'
                    ? 'info'
                    : 'neutral'
                }
              >
                {assignment.status}
              </Badge>
            </div>

            <h3 className="font-semibold text-gray-800 mb-1">{assignment.title}</h3>
            <p className="text-xs text-gray-400 mb-3">{assignment.subject}</p>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Submissions</span>
                <span className="font-medium text-gray-700">
                  {assignment.submissions}/{assignment.total}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary-500 rounded-full h-1.5 transition-all"
                  style={{
                    width: `${(assignment.submissions / assignment.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Due: {assignment.dueDate}</span>
              <button className="text-primary-600 font-medium hover:text-primary-700">
                View →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}