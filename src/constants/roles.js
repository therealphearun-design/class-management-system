export const ACCOUNT_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
};

export const ROLE_LABELS = {
  [ACCOUNT_ROLES.STUDENT]: 'Student',
  [ACCOUNT_ROLES.TEACHER]: 'Teacher',
};

export const ROLE_CAPABILITIES = {
  [ACCOUNT_ROLES.STUDENT]: [
    'View dashboard and personal overview',
    'Check schedule, exams, and marksheets',
    'View assignments and tasks',
    'Use messages, calendar, and profile',
  ],
  [ACCOUNT_ROLES.TEACHER]: [
    'All student account capabilities',
    'Manage attendance and student records',
    'Issue certificates',
    'View reports and analytics',
  ],
};

const roleAliases = {
  student: ACCOUNT_ROLES.STUDENT,
  teacher: ACCOUNT_ROLES.TEACHER,
};

export function normalizeRole(role) {
  const key = String(role || '').trim().toLowerCase();
  return roleAliases[key] || ACCOUNT_ROLES.TEACHER;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)];
}

export function getRoleHomePath(_role) {
  return '/dashboard';
}
