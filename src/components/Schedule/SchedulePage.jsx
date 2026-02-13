import React from 'react';

const schedule = [
  { time: '08:00 - 08:45', mon: 'Mathematics', tue: 'English', wed: 'Science', thu: 'History', fri: 'Computer' },
  { time: '08:45 - 09:30', mon: 'English', tue: 'Mathematics', wed: 'History', thu: 'Science', fri: 'Mathematics' },
  { time: '09:45 - 10:30', mon: 'Science', tue: 'Computer', wed: 'Mathematics', thu: 'English', fri: 'English' },
  { time: '10:30 - 11:15', mon: 'History', tue: 'Science', wed: 'English', thu: 'Computer', fri: 'Science' },
  { time: '11:30 - 12:15', mon: 'Computer', tue: 'History', wed: 'Computer', thu: 'Mathematics', fri: 'History' },
  { time: '12:15 - 01:00', mon: 'Sports', tue: 'Arts', wed: 'Sports', thu: 'Arts', fri: 'Sports' },
];

const subjectColors = {
  Mathematics: 'bg-blue-100 text-blue-700 border-blue-200',
  English: 'bg-green-100 text-green-700 border-green-200',
  Science: 'bg-purple-100 text-purple-700 border-purple-200',
  History: 'bg-orange-100 text-orange-700 border-orange-200',
  Computer: 'bg-pink-100 text-pink-700 border-pink-200',
  Sports: 'bg-teal-100 text-teal-700 border-teal-200',
  Arts: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Class Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">Weekly timetable for Class 10-A</p>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <th
                    key={day}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedule.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">
                    {row.time}
                  </td>
                  {['mon', 'tue', 'wed', 'thu', 'fri'].map((day) => (
                    <td key={day} className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          subjectColors[row[day]] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {row[day]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}