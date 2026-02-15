import React, { useMemo, useState } from 'react';

import { ACCOUNT_ROLES, normalizeRole } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import {
  PERIOD_DURATION_OPTIONS,
  SHIFT_OPTIONS,
  TRACK_OPTIONS,
  generateOfficialTimetable,
  generatePratTimetable,
  getCurriculumByClass,
  getGradeFromClassCode,
  scheduleClassOptions,
} from '../../data/curriculum';
import Select from '../common/Select';

const CURRICULUM_STORAGE_KEY = 'curriculum_overrides_v1';
const SCHEDULE_TABLE_STORAGE_KEY = 'schedule_table_overrides_v1';

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
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isTeacher = role === ACCOUNT_ROLES.TEACHER;

  const [selectedClass, setSelectedClass] = useState('12A');
  const [track, setTrack] = useState('science');
  const [shift, setShift] = useState('Morning');
  const [periodMinutes, setPeriodMinutes] = useState('45');
  const [includePrat, setIncludePrat] = useState(true);
  const [isEditingCurriculum, setIsEditingCurriculum] = useState(false);
  const [curriculumDraft, setCurriculumDraft] = useState(null);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [tableDraftRows, setTableDraftRows] = useState(null);

  const grade = useMemo(() => getGradeFromClassCode(selectedClass), [selectedClass]);
  const trackEnabled = grade >= 11;
  const curriculumKey = `${selectedClass}-${trackEnabled ? track : 'general'}`;

  const readSavedCurriculumMap = () => {
    try {
      const raw = localStorage.getItem(CURRICULUM_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const savedCurriculumMap = readSavedCurriculumMap();

  const curriculumOverride = savedCurriculumMap[curriculumKey] || null;
  const tableKey = `${curriculumKey}-${shift}-${periodMinutes}`;

  const readSavedTableMap = () => {
    try {
      const raw = localStorage.getItem(SCHEDULE_TABLE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const savedTableMap = readSavedTableMap();

  const scheduleData = useMemo(
    () =>
      generateOfficialTimetable({
        classCode: selectedClass,
        track,
        shift,
        periodMinutes: Number(periodMinutes),
        curriculumOverride,
      }),
    [selectedClass, track, shift, periodMinutes, curriculumOverride]
  );

  const pratData = useMemo(() => generatePratTimetable(track), [track]);
  const extraHours = includePrat ? pratData.weeklyHoursRange : [0, 0];
  const totalMinHours = Number((scheduleData.officialHours + extraHours[0]).toFixed(1));
  const totalMaxHours = Number((scheduleData.officialHours + extraHours[1]).toFixed(1));
  const savedRowsOverride = Array.isArray(savedTableMap[tableKey]) ? savedTableMap[tableKey] : null;
  const renderedRows = isEditingTable && tableDraftRows ? tableDraftRows : (savedRowsOverride || scheduleData.rows);
  const editableSubjects = useMemo(() => {
    const set = new Set();
    scheduleData.rows.forEach((row) => {
      scheduleData.dayKeys.forEach((day) => set.add(row[day]));
    });
    set.add('Self-Study / Club');
    set.add('Revision / Guided Study');
    return Array.from(set);
  }, [scheduleData.rows, scheduleData.dayKeys]);

  const startEditCurriculum = () => {
    const baseCurriculum = curriculumOverride || getCurriculumByClass(selectedClass, track);
    setCurriculumDraft({
      notes: baseCurriculum.notes || '',
      subjects: (baseCurriculum.subjects || []).map((subject, idx) => ({
        id: `${subject.subject}-${idx}`,
        subject: subject.subject,
        periods: String(subject.periods),
      })),
    });
    setIsEditingCurriculum(true);
  };

  const saveCurriculum = () => {
    if (!curriculumDraft) return;
    const cleanedSubjects = curriculumDraft.subjects
      .map((item) => ({
        subject: item.subject.trim(),
        periods: Number(item.periods),
        focus: 'Custom',
      }))
      .filter((item) => item.subject && Number.isFinite(item.periods) && item.periods > 0);

    if (!cleanedSubjects.length) {
      return;
    }

    const payload = {
      grade,
      track: trackEnabled ? (track === 'social' ? 'Social Science' : 'Science') : null,
      totalPeriodsRange: [cleanedSubjects.reduce((sum, item) => sum + item.periods, 0), cleanedSubjects.reduce((sum, item) => sum + item.periods, 0)],
      subjects: cleanedSubjects,
      notes: curriculumDraft.notes.trim() || 'Teacher customized curriculum.',
    };

    const nextMap = {
      ...savedCurriculumMap,
      [curriculumKey]: payload,
    };
    localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(nextMap));
    setIsEditingCurriculum(false);
  };

  const resetCurriculum = () => {
    const nextMap = { ...savedCurriculumMap };
    delete nextMap[curriculumKey];
    localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(nextMap));
    setIsEditingCurriculum(false);
  };

  const startEditTable = () => {
    setTableDraftRows((savedRowsOverride || scheduleData.rows).map((row) => ({ ...row })));
    setIsEditingTable(true);
  };

  const saveTable = () => {
    if (!tableDraftRows) return;
    const nextMap = {
      ...savedTableMap,
      [tableKey]: tableDraftRows.map((row) => ({ ...row })),
    };
    localStorage.setItem(SCHEDULE_TABLE_STORAGE_KEY, JSON.stringify(nextMap));
    setIsEditingTable(false);
  };

  const resetTable = () => {
    const nextMap = { ...savedTableMap };
    delete nextMap[tableKey];
    localStorage.setItem(SCHEDULE_TABLE_STORAGE_KEY, JSON.stringify(nextMap));
    setIsEditingTable(false);
    setTableDraftRows(null);
  };

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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Curriculum Basis - Grade {grade}{scheduleData.track ? ` (${scheduleData.track} Track)` : ''}
          </h2>
          {isTeacher && (
            <div className="flex items-center gap-2">
              {!isEditingCurriculum ? (
                <>
                  <button
                    type="button"
                    onClick={startEditCurriculum}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    Edit Curriculum
                  </button>
                  {curriculumOverride && (
                    <button
                      type="button"
                      onClick={resetCurriculum}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Reset
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={saveCurriculum}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCurriculum(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {isEditingCurriculum && curriculumDraft ? (
          <div className="space-y-3 mb-3">
            <textarea
              value={curriculumDraft.notes}
              onChange={(e) => setCurriculumDraft((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              placeholder="Curriculum notes"
            />
            <div className="space-y-2">
              {curriculumDraft.subjects.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={item.subject}
                    onChange={(e) =>
                      setCurriculumDraft((prev) => ({
                        ...prev,
                        subjects: prev.subjects.map((subject) =>
                          subject.id === item.id ? { ...subject, subject: e.target.value } : subject
                        ),
                      }))
                    }
                    className="col-span-8 text-sm border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Subject name"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.periods}
                    onChange={(e) =>
                      setCurriculumDraft((prev) => ({
                        ...prev,
                        subjects: prev.subjects.map((subject) =>
                          subject.id === item.id ? { ...subject, periods: e.target.value } : subject
                        ),
                      }))
                    }
                    className="col-span-3 text-sm border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Periods"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCurriculumDraft((prev) => ({
                        ...prev,
                        subjects: prev.subjects.filter((subject) => subject.id !== item.id),
                      }))
                    }
                    className="col-span-1 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setCurriculumDraft((prev) => ({
                  ...prev,
                  subjects: [
                    ...prev.subjects,
                    { id: `${Date.now()}`, subject: '', periods: '1' },
                  ],
                }))
              }
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
            >
              Add Subject
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{scheduleData.notes}</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {isTeacher && (
          <div className="px-4 pt-4 pb-2 flex items-center justify-end gap-2">
            {!isEditingTable ? (
              <>
                <button
                  type="button"
                  onClick={startEditTable}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Edit Schedule Table
                </button>
                {savedRowsOverride && (
                  <button
                    type="button"
                    onClick={resetTable}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Reset Table
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={saveTable}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                >
                  Save Table
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTable(false);
                    setTableDraftRows(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
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
              {renderedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">
                    {row.time}
                  </td>
                  {scheduleData.dayKeys.map((day) => (
                    <td key={day} className="px-4 py-3">
                      {isTeacher && isEditingTable ? (
                        <select
                          value={row[day]}
                          onChange={(e) =>
                            setTableDraftRows((prev) =>
                              prev.map((line, rowIndex) =>
                                rowIndex === idx ? { ...line, [day]: e.target.value } : line
                              )
                            )
                          }
                          className="w-full min-w-[180px] text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
                        >
                          {editableSubjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            subjectClassName(row[day])
                          }`}
                        >
                          {row[day]}
                        </span>
                      )}
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
