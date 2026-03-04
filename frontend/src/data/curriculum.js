import { classOptions } from './students';

export const TRACK_OPTIONS = [
  { value: 'science', label: 'Science Stream (MoEYS)' },
  { value: 'social', label: 'Social Science Stream (MoEYS)' },
];

export const SHIFT_OPTIONS = [
  { value: 'Both', label: 'Both Shifts (07:00 - 17:00)' },
];

export const PERIOD_DURATION_OPTIONS = [
  { value: '50', label: '50 Minutes (MoEYS Standard)' },
  { value: '45', label: '45 Minutes' },
];

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const grade7To10Subjects = [
  { subject: 'Khmer Language & Literature', periods: 6, focus: 'Core' },
  { subject: 'Mathematics', periods: 6, focus: 'Core' },
  { subject: 'Science (Physics/Chem/Bio/Earth)', periods: 6, focus: 'Core' },
  { subject: 'Social Studies (History/Geography/Moral)', periods: 6, focus: 'Core' },
  { subject: 'Foreign Language (English/French)', periods: 4, focus: 'Core' },
  { subject: 'Physical Education & Sports', periods: 2, focus: 'Core' },
  { subject: 'Life Skills / ICT', periods: 4, focus: 'Core' },
];

const scienceTrackSubjects = [
  { subject: 'Khmer Language & Literature', periods: 4, focus: 'Core' },
  { subject: 'Mathematics (Advanced)', periods: 7, focus: 'High' },
  { subject: 'Physics', periods: 4, focus: 'High' },
  { subject: 'Chemistry', periods: 4, focus: 'High' },
  { subject: 'Biology', periods: 4, focus: 'High' },
  { subject: 'Earth & Environmental Science', periods: 2, focus: 'Core' },
  { subject: 'Foreign Language', periods: 3, focus: 'Core' },
  { subject: 'History', periods: 2, focus: 'Basic' },
  { subject: 'Physical Education & Sports', periods: 1, focus: 'Basic' },
  { subject: 'Life Skills / ICT', periods: 1, focus: 'Basic' },
];

const socialTrackSubjects = [
  { subject: 'Khmer Language & Literature (Advanced)', periods: 6, focus: 'High' },
  { subject: 'History', periods: 5, focus: 'High' },
  { subject: 'Geography', periods: 5, focus: 'High' },
  { subject: 'Civics and Morality', periods: 4, focus: 'High' },
  { subject: 'Mathematics', periods: 4, focus: 'Core' },
  { subject: 'Foreign Language', periods: 4, focus: 'Core' },
  { subject: 'Earth & Environmental Science', periods: 2, focus: 'Core' },
  { subject: 'Physical Education & Sports', periods: 1, focus: 'Basic' },
  { subject: 'Life Skills / ICT', periods: 1, focus: 'Basic' },
];

export function getGradeFromClassCode(classCode) {
  const match = String(classCode || '').match(/^(\d{1,2})[A-F]/i);
  const parsed = match ? Number.parseInt(match[1], 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 7;
}

export function getCurriculumByClass(classCode, track = 'science') {
  const grade = getGradeFromClassCode(classCode);
  if (grade <= 10) {
    return {
      grade,
      track: null,
      totalPeriodsRange: [30, 30],
      subjects: grade7To10Subjects,
      notes:
        'General foundation curriculum. MoEYS baseline uses 30 national-curriculum periods/week at secondary level (plus local life-skills blocks where applicable).',
    };
  }

  if (track === 'social') {
    return {
      grade,
      track: 'Social Science',
      totalPeriodsRange: [32, 32],
      subjects: socialTrackSubjects,
      notes:
        'MoEYS social-science stream focus: Khmer, History, Geography, Civics and supporting Mathematics/Foreign Language.',
    };
  }

  return {
    grade,
    track: 'Science',
    totalPeriodsRange: [32, 32],
    subjects: scienceTrackSubjects,
    notes:
      'MoEYS science stream focus: Mathematics, Physics, Chemistry, Biology and supporting Khmer/Foreign Language subjects.',
  };
}

function toTimeString(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildTimeSlots(shift, periodMinutes, slotsPerDay = 6) {
  const breakMinutes = 5;
  const slots = [];
  if (shift === 'Both') {
    const morningStart = 7 * 60;
    const afternoonStart = 13 * 60;
    let cursor = morningStart;
    for (let i = 0; i < 3; i += 1) {
      const end = cursor + periodMinutes;
      slots.push(`${toTimeString(cursor)} - ${toTimeString(end)}`);
      cursor = end + breakMinutes;
    }
    cursor = afternoonStart;
    for (let i = 0; i < 3; i += 1) {
      const end = cursor + periodMinutes;
      slots.push(`${toTimeString(cursor)} - ${toTimeString(end)}`);
      cursor = end + breakMinutes;
    }
    return slots;
  }

  const startMinutes = shift === 'Afternoon' ? 13 * 60 : 7 * 60;
  let cursor = startMinutes;
  for (let i = 0; i < slotsPerDay; i += 1) {
    const end = cursor + periodMinutes;
    slots.push(`${toTimeString(cursor)} - ${toTimeString(end)}`);
    cursor = end + (i === slotsPerDay - 1 ? 0 : breakMinutes);
  }
  return slots;
}

function expandSubjects(subjects) {
  const list = [];
  subjects.forEach((item) => {
    for (let i = 0; i < item.periods; i += 1) {
      list.push(item.subject);
    }
  });
  return list;
}

export function generateOfficialTimetable({
  classCode,
  track = 'science',
  shift = 'Both',
  periodMinutes = 45,
  curriculumOverride = null,
}) {
  const defaultCurriculum = getCurriculumByClass(classCode, track);
  const curriculum = curriculumOverride || defaultCurriculum;
  const [minPeriods] = defaultCurriculum.totalPeriodsRange;
  const slotsPerDay = 6;
  const weeklySlots = DAY_KEYS.length * slotsPerDay;
  const overridePeriods = Array.isArray(curriculum?.subjects)
    ? curriculum.subjects.reduce((sum, item) => sum + (Number(item.periods) || 0), 0)
    : 0;
  const targetPeriods = curriculumOverride ? Math.max(overridePeriods, 1) : minPeriods;

  const expanded = expandSubjects(curriculum.subjects);
  const subjectQueue = [...expanded];
  while (subjectQueue.length < targetPeriods) {
    subjectQueue.push('Revision / Guided Study');
  }
  while (subjectQueue.length < weeklySlots) {
    subjectQueue.push('Self-Study / Club');
  }

  const times = buildTimeSlots(shift, periodMinutes, slotsPerDay);
  const rows = times.map((time, idx) => {
    const row = { time };
    DAY_KEYS.forEach((key, dayIdx) => {
      const index = dayIdx * slotsPerDay + idx;
      row[key] = subjectQueue[index] || 'Self-Study / Club';
    });
    return row;
  });

  const officialHours = Number(((targetPeriods * periodMinutes) / 60).toFixed(1));

  return {
    ...curriculum,
    rows,
    days: DAY_LABELS,
    dayKeys: DAY_KEYS,
    slotsPerDay,
    weeklyPeriods: targetPeriods,
    officialHours,
  };
}

export function generatePratTimetable(track = 'science') {
  const bacScienceSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Khmer Language & Literature',
    'Foreign Language',
  ];
  const bacSocialSubjects = [
    'Khmer Language & Literature',
    'History',
    'Geography',
    'Civics and Morality',
    'Mathematics',
    'Foreign Language',
  ];
  const focus = track === 'social' ? bacSocialSubjects : bacScienceSubjects;

  return {
    timeRange: '13:00 - 17:00',
    focusSubjects: focus,
    weeklyHoursRange: [12, 18],
  };
}

export const scheduleClassOptions = [
  ...classOptions.filter((item) => item.value),
];
