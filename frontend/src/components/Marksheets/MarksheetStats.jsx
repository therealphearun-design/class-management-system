import React from 'react';

export default function MarksheetStats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-white rounded-xl p-4 shadow-card text-center">
        <p className="text-2xl font-bold text-gray-800">{stats.students}</p>
        <p className="text-xs text-gray-500 mt-1">Students in Scope</p>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-card text-center">
        <p className="text-2xl font-bold text-primary-600">{stats.avg}%</p>
        <p className="text-xs text-gray-500 mt-1">Average Score</p>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-card text-center">
        <p className="text-2xl font-bold text-green-600">{stats.passRate}%</p>
        <p className="text-xs text-gray-500 mt-1">Pass Rate</p>
      </div>
    </div>
  );
}
