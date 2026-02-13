import React, { useMemo, useState } from 'react';

import {
  PERIOD_DURATION_OPTIONS,
  SHIFT_OPTIONS,
  TRACK_OPTIONS,
  generateOfficialTimetable,
  generatePratTimetable,
  getGradeFromClassCode,
  scheduleClassOptions,
} from '../../data/curriculum';
import Select from '../common/Select';

function subjectClassName(subject) {
  const palette = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-green-100 text-green-700 border-green-200',
    'bg-orange-100 text-orange-700 border-orange-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-teal-100 text-teal-700 border-teal-200',
  ];
  let hash = 0;
  for (let i = 0; i < subject.length; i += 1) {
    hash = (hash + subject.charCodeAt(i)) % palette.length;
  }
  return palette[hash];
}

export default function SchedulePage() {
  const [selectedClass, setSelectedClass] = useState('12A');
  const [track, setTrack] = useState('science');
  const [shift, setShift] = useState('Morning');
  const [periodMinutes, setPeriodMinutes] = useState('45');
  const [includePrat, setIncludePrat] = useState(true);

  const grade = useMemo(() => getGradeFromClassCode(selectedClass), [selectedClass]);
  const trackEnabled = grade >= 11;

  const scheduleData = useMemo(
    () =>
      generateOfficialTimetable({
        classCode: selectedClass,
        track,
        shift,
        periodMinutes: Number(periodMinutes),
      }),
    [selectedClass, track, shift, periodMinutes]
  );

  const pratData = useMemo(() => generatePratTimetable(track), [track]);
  const extraHours = includePrat ? pratData.weeklyHoursRange : [0, 0];
  const totalMinHours = Number((scheduleData.officialHours + extraHours[0]).toFixed(1));
  const totalMaxHours = Number((scheduleData.officialHours + extraHours[1]).toFixed(1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Class Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cambodian public school model: Monday-Saturday, 45-50 minute periods, with optional Prat classes.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Select
          options={scheduleClassOptions}
          value={selectedClass}
          onChange={setSelectedClass}
          className="w-full"
        />
        <Select
          options={SHIFT_OPTIONS}
          value={shift}
          onChange={setShift}
          className="w-full"
        />
        <Select
          options={PERIOD_DURATION_OPTIONS}
          value={periodMinutes}
          onChange={setPeriodMinutes}
          className="w-full"
        />
        <Select
          options={TRACK_OPTIONS}
          value={track}
          onChange={setTrack}
          className="w-full"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 border border-gray-200 rounded-lg">
          <input
            type="checkbox"
            checked={includePrat}
            onChange={(e) => setIncludePrat(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Include Prat (Extra Class)
        </label>
      </div>

      {!trackEnabled && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          Grade {grade} uses the national general foundation curriculum (no track selection yet).
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-xs text-gray-500">Official Weekly Periods</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{scheduleData.weeklyPeriods}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-xs text-gray-500">Official Hours/Week</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{scheduleData.officialHours}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-xs text-gray-500">Extra (Prat) Hours/Week</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {includePrat ? `${extraHours[0]}-${extraHours[1]}` : '0'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-xs text-gray-500">Total Study Load/Week</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {includePrat ? `${totalMinHours}-${totalMaxHours}` : scheduleData.officialHours}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">
          Curriculum Basis - Grade {grade}{scheduleData.track ? ` (${scheduleData.track} Track)` : ''}
        </h2>
        <p className="text-sm text-gray-600">{scheduleData.notes}</p>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                {scheduleData.days.map((day) => (
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
              {scheduleData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">
                    {row.time}
                  </td>
                  {scheduleData.dayKeys.map((day) => (
                    <td key={day} className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          subjectClassName(row[day])
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

      {includePrat && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Prat (Extra Class) Plan</h2>
          <p className="text-sm text-gray-600">
            Recommended extra class block: <span className="font-medium">{pratData.timeRange}</span>
            {' '}focused on Bac II subjects.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {pratData.focusSubjects.map((subject) => (
              <span
                key={subject}
                className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border ${subjectClassName(subject)}`}
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
