const generateAvatar = (name) => {
  const seed = name.replace(/\s/g, '');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

export const studentsData = [
  // Class 10A - Section A
  { id: 1, name: 'Sok Mesa', avatar: generateAvatar('Mesa'), class: '10A', section: 'A', rollNo: 1 },
  { id: 2, name: 'Chan Sreyneang', avatar: generateAvatar('Sreyneang'), class: '10A', section: 'A', rollNo: 2 },
  { id: 3, name: 'Keo Rattanak', avatar: generateAvatar('Rattanak'), class: '10A', section: 'A', rollNo: 3 },
  { id: 4, name: 'Vannak Boramy', avatar: generateAvatar('Boramy'), class: '10A', section: 'A', rollNo: 4 },
  { id: 5, name: 'Seng Piseth', avatar: generateAvatar('Piseth'), class: '10A', section: 'A', rollNo: 5 },
  { id: 6, name: 'Ngeth Sophea', avatar: generateAvatar('Sophea'), class: '10A', section: 'A', rollNo: 6 },
  { id: 7, name: 'Chea Voleak', avatar: generateAvatar('Voleak'), class: '10A', section: 'A', rollNo: 7 },
  { id: 8, name: 'Ros Saravuth', avatar: generateAvatar('Saravuth'), class: '10A', section: 'A', rollNo: 8 },
  { id: 9, name: 'Lim Heng', avatar: generateAvatar('Heng'), class: '10A', section: 'A', rollNo: 9 },
  { id: 10, name: 'Ouk Sreyroth', avatar: generateAvatar('Sreyroth'), class: '10A', section: 'A', rollNo: 10 },
  { id: 11, name: 'Phan Sovann', avatar: generateAvatar('Sovann'), class: '10A', section: 'A', rollNo: 11 },
  { id: 12, name: 'Pheng Samnang', avatar: generateAvatar('Samnang'), class: '10A', section: 'A', rollNo: 12 },

  // Class 10A - Section B
  { id: 13, name: 'Tith Makara', avatar: generateAvatar('Makara'), class: '10A', section: 'B', rollNo: 1 },
  { id: 14, name: 'Chhay Kunthea', avatar: generateAvatar('Kunthea'), class: '10A', section: 'B', rollNo: 2 },
  { id: 15, name: 'Soun Davin', avatar: generateAvatar('Davin'), class: '10A', section: 'B', rollNo: 3 },
  { id: 16, name: 'Khuon Socheata', avatar: generateAvatar('Socheata'), class: '10A', section: 'B', rollNo: 4 },
  { id: 17, name: 'Meas Reasmey', avatar: generateAvatar('Reasmey'), class: '10A', section: 'B', rollNo: 5 },
  { id: 18, name: 'Yim Channary', avatar: generateAvatar('Channary'), class: '10A', section: 'B', rollNo: 6 },
  { id: 19, name: 'Thon Sopheak', avatar: generateAvatar('Sopheak'), class: '10A', section: 'B', rollNo: 7 },
  { id: 20, name: 'Eam Virak', avatar: generateAvatar('Virak'), class: '10A', section: 'B', rollNo: 8 },
  { id: 21, name: 'Luy Monivea', avatar: generateAvatar('Monivea'), class: '10A', section: 'B', rollNo: 9 },
  { id: 22, name: 'Bun Thoeun', avatar: generateAvatar('Thoeun'), class: '10A', section: 'B', rollNo: 10 },
  { id: 23, name: 'Sinat Rithy', avatar: generateAvatar('Rithy'), class: '10A', section: 'B', rollNo: 11 },
  { id: 24, name: 'Dy Panha', avatar: generateAvatar('Panha'), class: '10A', section: 'B', rollNo: 12 },
  { id: 25, name: 'Noun Sreypov', avatar: generateAvatar('Sreypov'), class: '10A', section: 'B', rollNo: 13 },

  // Class 10B - Section A
  { id: 26, name: 'Hem Raksmey', avatar: generateAvatar('Raksmey'), class: '10B', section: 'A', rollNo: 1 },
  { id: 27, name: 'Korm Dara', avatar: generateAvatar('Dara'), class: '10B', section: 'A', rollNo: 2 },
  { id: 28, name: 'Long Kiri', avatar: generateAvatar('Kiri'), class: '10B', section: 'A', rollNo: 3 },
  { id: 29, name: 'Mao Somnang', avatar: generateAvatar('Somnang'), class: '10B', section: 'A', rollNo: 4 },
  { id: 30, name: 'Pech Sreyda', avatar: generateAvatar('Sreyda'), class: '10B', section: 'A', rollNo: 5 },
  { id: 31, name: 'Seang Leng', avatar: generateAvatar('Leng'), class: '10B', section: 'A', rollNo: 6 },
  { id: 32, name: 'Um Phalla', avatar: generateAvatar('Phalla'), class: '10B', section: 'A', rollNo: 7 },
  { id: 33, name: 'Van Chitra', avatar: generateAvatar('Chitra'), class: '10B', section: 'A', rollNo: 8 },
  { id: 34, name: 'Yun Sokha', avatar: generateAvatar('Sokha'), class: '10B', section: 'A', rollNo: 9 },
  { id: 35, name: 'Yos Bophal', avatar: generateAvatar('Bophal'), class: '10B', section: 'A', rollNo: 10 },
  { id: 36, name: 'Te Vanney', avatar: generateAvatar('Vanney'), class: '10B', section: 'A', rollNo: 11 },
  { id: 37, name: 'Suos Thyda', avatar: generateAvatar('Thyda'), class: '10B', section: 'A', rollNo: 12 },

  // Class 9A - Section A
  { id: 38, name: 'Nou Kanha', avatar: generateAvatar('Kanha'), class: '9A', section: 'A', rollNo: 1 },
  { id: 39, name: 'Loy Seyha', avatar: generateAvatar('Seyha'), class: '9A', section: 'A', rollNo: 2 },
  { id: 40, name: 'Prum Vandy', avatar: generateAvatar('Vandy'), class: '9A', section: 'A', rollNo: 3 },
  { id: 41, name: 'Samath Vichet', avatar: generateAvatar('Vichet'), class: '9A', section: 'A', rollNo: 4 },
  { id: 42, name: 'Chhem Sreymom', avatar: generateAvatar('Sreymom'), class: '9A', section: 'A', rollNo: 5 },
  { id: 43, name: 'Srun Tola', avatar: generateAvatar('Tola'), class: '9A', section: 'A', rollNo: 6 },
  { id: 44, name: 'Khiev Phearith', avatar: generateAvatar('Phearith'), class: '9A', section: 'A', rollNo: 7 },
  { id: 45, name: 'Uy Chandara', avatar: generateAvatar('Chandara'), class: '9A', section: 'A', rollNo: 8 },
  { id: 46, name: 'Sao Malis', avatar: generateAvatar('Malis'), class: '9A', section: 'A', rollNo: 9 },
  { id: 47, name: 'Heng Sovath', avatar: generateAvatar('Sovath'), class: '9A', section: 'A', rollNo: 10 },
  { id: 48, name: 'Prom Samon', avatar: generateAvatar('Samon'), class: '9A', section: 'A', rollNo: 11 },
  { id: 49, name: 'Khat Sitha', avatar: generateAvatar('Sitha'), class: '9A', section: 'A', rollNo: 12 },
  { id: 50, name: 'In Sorya', avatar: generateAvatar('Sorya'), class: '9A', section: 'A', rollNo: 13 },
];

export const classOptions = [
  { value: '', label: 'Select Class' },
  { value: '10A', label: 'Class 10-A' },
  { value: '10B', label: 'Class 10-B' },
  { value: '9A', label: 'Class 9-A' },
  { value: '9B', label: 'Class 9-B' },
  { value: '8A', label: 'Class 8-A' },
];

export const subjectOptions = [
  { value: '', label: 'Select Subject' },
  { value: 'khmer', label: 'Khmer Literature' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'history', label: 'History' },
  { value: 'computer', label: 'Computer Science' },
];

export const sectionOptions = [
  { value: '', label: 'Select Section' },
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
];