import React from 'react';

import Avatar from '../common/Avatar';

const marksData = [
  { id: 1, name: 'Amanda Kherr', math: 92, science: 88, english: 95, history: 78, computer: 90 },
  { id: 2, name: 'Angel Johnson', math: 85, science: 92, english: 80, history: 88, computer: 95 },
  { id: 3, name: 'Alexander Kherr', math: 78, science: 82, english: 90, history: 92, computer: 88 },
  { id: 4, name: 'Austin Kherr', math: 95, science: 90, english: 85, history: 80, computer: 92 },
  { id: 5, name: 'Aada Kherr', math: 88, science: 85, english: 92, history: 90, computer: 78 },
  { id: 6, name: 'Babak Kherr', math: 72, science: 78, english: 82, history: 85, computer: 90 },
  { id: 7, name: 'Baha Johnson', math: 90, science: 95, english: 88, history: 82, computer: 85 },
];

function getGradeColor(score) {
  if (score >= 90) return 'text-green-600 bg-green-50';
  if (score >= 80) return 'text-blue-600 bg-blue-50';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function MarksheetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Marksheets</h1>
        <p className="text-sm text-gray-500 mt-1">Mid-term examination results</p>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Math</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Science</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">English</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">History</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Computer</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marksData.map((student) => {
                const total = student.math + student.science + student.english + student.history + student.computer;
                const avg = (total / 5).toFixed(1);
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={student.name}
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name.replace(/\s/g, '')}`}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-700">{student.name}</span>
                      </div>
                    </td>
                    {[student.math, student.science, student.english, student.history, student.computer].map(
                      (score, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getGradeColor(score)}`}>
                            {score}
                          </span>
                        </td>
                      )
                    )}
                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getGradeColor(avg)}`}>
                        {avg}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}