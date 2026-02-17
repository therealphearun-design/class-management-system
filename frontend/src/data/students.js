const gradeLevels = [9, 10, 11, 12];
const classSections = ['A', 'B', 'C', 'D', 'E', 'F'];
const studentsPerShift = 30;
const studyShifts = ['Morning', 'Afternoon'];

const firstNames = [
  'Sok', 'Chan', 'Keo', 'Vannak', 'Seng', 'Ngeth', 'Chea', 'Ros', 'Lim', 'Ouk',
  'Phan', 'Pheng', 'Tith', 'Chhay', 'Soun', 'Khuon', 'Meas', 'Yim', 'Thon', 'Eam',
];

const lastNames = [
  'Mesa', 'Sreyneang', 'Rattanak', 'Boramy', 'Piseth', 'Sophea', 'Voleak', 'Saravuth', 'Heng', 'Sreyroth',
  'Sovann', 'Samnang', 'Makara', 'Kunthea', 'Davin', 'Socheata', 'Reasmey', 'Channary', 'Sopheak', 'Virak',
];

const generateAvatar = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
const classCodes = gradeLevels.flatMap((grade) =>
  classSections.map((section) => `${grade}${section}`)
);

export const studentsData = classCodes.flatMap((classCode) => {
  const sectionMatch = String(classCode).match(/\d+([A-F])/i);
  const section = sectionMatch ? sectionMatch[1].toUpperCase() : 'A';
  const classIndex = classCodes.indexOf(classCode);

  return studyShifts.flatMap((shift, shiftIdx) =>
    Array.from({ length: studentsPerShift }, (_, idx) => {
      const rollNo = idx + 1;
      const serial =
        classIndex * studyShifts.length * studentsPerShift +
        shiftIdx * studentsPerShift +
        idx;
      const firstName = firstNames[serial % firstNames.length];
      const lastName = lastNames[Math.floor(serial / firstNames.length) % lastNames.length];
      const name = `${firstName} ${lastName}`;
      const id = serial + 1;

      return {
        id,
        name,
        avatar: generateAvatar(`${classCode}-${shift}-${rollNo}-${id}`),
        class: classCode,
        section,
        shift,
        rollNo,
      };
    })
  );
});

export const classOptions = [
  { value: '', label: 'Select Class' },
  ...classCodes.map((code) => ({ value: code, label: code })),
];

export const subjectOptions = [
  { value: '', label: 'Select Subject' },
  { value: 'khmer', label: 'Khmer Literature' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'earth-science', label: 'Earth Science' },
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'moral-civics', label: 'Moral-Civics' },
  { value: 'social-studies', label: 'Social Studies' },
  { value: 'foreign-language', label: 'Foreign Language' },
  { value: 'computer', label: 'Computer Science' },
  { value: 'physical-education', label: 'Physical Education & Sports' },
  { value: 'life-skills-ict', label: 'Life Skills / ICT' },
];

export const shiftOptions = [
  { value: '', label: 'Select Shift' },
  ...studyShifts.map((shift) => ({ value: shift, label: shift })),
];

export const sectionOptions = [
  { value: '', label: 'Select Section' },
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
  { value: 'D', label: 'Section D' },
  { value: 'E', label: 'Section E' },
  { value: 'F', label: 'Section F' },
];
