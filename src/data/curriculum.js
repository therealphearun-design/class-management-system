import { classOptions } from './students';

export const TRACK_OPTIONS = [
  { value: 'science', label: 'Science Track (STEM)' },
  { value: 'social', label: 'Social Science Track (Humanities)' },
];

export const SHIFT_OPTIONS = [
  { value: 'Morning', label: 'Morning (07:00 - 11:00)' },
  { value: 'Afternoon', label: 'Afternoon (13:00 - 17:00)' },
];

export const PERIOD_DURATION_OPTIONS = [
  { value: '45', label: '45 Minutes' },
  { value: '50', label: '50 Minutes' },
];

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const commonCore = [
  { subject: 'Khmer Literature', periods: 3, focus: 'Basic' },
  { subject: 'History', periods: 2, focus: 'Basic' },
  { subject: 'Geography', periods: 2, focus: 'Basic' },
  { subject: 'Moral-Civics', periods: 2, focus: 'Basic' },
  { subject: 'Foreign Language', periods: 2, focus: 'Basic' },
  { subject: 'Earth Science', periods: 1, focus: 'Basic' },
  { subject: 'Physical Education & Sports', periods: 2, focus: 'Basic' },
  { subject: 'Life Skills / ICT', periods: 1, focus: 'Basic' },
];

const grade9And10Subjects = [
  { subject: 'Khmer Literature', periods: 6, focus: 'Core' },
  { subject: 'Mathematics', periods: 6, focus: 'Core' },
  { subject: 'Science (Physics/Chem/Bio/Earth)', periods: 6, focus: 'Core' },
  { subject: 'Social Studies (History/Geography/Moral)', periods: 6, focus: 'Core' },
  { subject: 'Foreign Language (English/French)', periods: 4, focus: 'Core' },
  { subject: 'Physical Education & Sports', periods: 2, focus: 'Core' },
  { subject: 'Life Skills / ICT', periods: 4, focus: 'Core' },
];

const scienceTrackSubjects = [
  { subject: 'Mathematics (Advanced)', periods: 7, focus: 'High' },
  { subject: 'Physics', periods: 4, focus: 'High' },
  { subject: 'Chemistry', periods: 4, focus: 'High' },
  { subject: 'Biology', periods: 4, focus: 'High' },
  ...commonCore,
];

const socialTrackSubjects = [
  { subject: 'Khmer Literature (Advanced)', periods: 6, focus: 'High' },
  { subject: 'History', periods: 4, focus: 'High' },
  { subject: 'Geography', periods: 4, focus: 'High' },
  { subject: 'Moral-Civics', periods: 4, focus: 'High' },
  { subject: 'Mathematics', periods: 3, focus: 'Basic' },
  { subject: 'Physics', periods: 2, focus: 'Basic' },
  { subject: 'Chemistry', periods: 2, focus: 'Basic' },
  { subject: 'Biology', periods: 2, focus: 'Basic' },
  { subject: 'Foreign Language', periods: 2, focus: 'Basic' },
  { subject: 'Earth Science', periods: 2, focus: 'Basic' },
  { subject: 'Physical Education & Sports', periods: 2, focus: 'Basic' },
  { subject: 'Life Skills / ICT', periods: 1, focus: 'Basic' },
];

export function getGradeFromClassCode(classCode) {
  const match = String(classCode || '').match(/^(\d{1,2})[A-F]/i);
  const parsed = match ? Number.parseInt(match[1], 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 9;
}

export function getCurriculumByClass(classCode, track = 'science') {
  const grade = getGradeFromClassCode(classCode);
  if (grade <= 10) {
    return {
      grade,
      track: null,
      totalPeriodsRange: [32, 34],
      subjects: grade9And10Subjects,
      notes: 'General Foundation / Bridge Year (MoEYS national curriculum).',
    };
  }

  if (track === 'social') {
    return {
      grade,
      track: 'Social Science',
      totalPeriodsRange: [34, 36],
      subjects: socialTrackSubjects,
      notes: 'Humanities focus: Law, Business, Management, Tourism, Arts.',
    };
  }

  return {
    grade,
    track: 'Science',
    totalPeriodsRange: [34, 36],
    subjects: scienceTrackSubjects,
    notes: 'STEM focus: Medicine, Engineering, IT, Architecture.',
  };
}

function toTimeString(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildTimeSlots(shift, periodMinutes, slotsPerDay = 6) {
  const startMinutes = shift === 'Afternoon' ? 13 * 60 : 7 * 60;
  const breakMinutes = 5;
  const slots = [];
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
  shift = 'Morning',
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
  const bacScienceSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Khmer Literature', 'History', 'Foreign Language'];
  const bacSocialSubjects = ['Khmer Literature', 'History', 'Geography', 'Moral-Civics', 'Mathematics', 'Foreign Language', 'Earth Science'];
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
