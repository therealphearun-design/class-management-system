export const ACCOUNT_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  TEACHER: 'teacher',
};

export const ROLE_LABELS = {
  [ACCOUNT_ROLES.ADMIN]: 'Admin Center',
  [ACCOUNT_ROLES.STUDENT]: 'Student',
  [ACCOUNT_ROLES.TEACHER]: 'Teacher',
};

export const ROLE_CAPABILITIES = {
  [ACCOUNT_ROLES.ADMIN]: [
    'Full system access and configuration',
    'View and manage all student information',
    'Manage staff operations and academic modules',
    'View reports, messages, and records',
  ],
  [ACCOUNT_ROLES.STUDENT]: [
    'View dashboard and personal overview',
    'Check schedule, exams, and marksheets',
    'View assignments',
    'Use calendar and profile',
  ],
  [ACCOUNT_ROLES.TEACHER]: [
    'Create homework and practical assignments',
    'Take and update attendance records',
    'Manage exam schedule entries',
    'Use schedule, calendar, and profile',
  ],
};

const roleAliases = {
  admin: ACCOUNT_ROLES.ADMIN,
  administrator: ACCOUNT_ROLES.ADMIN,
  student: ACCOUNT_ROLES.STUDENT,
  teacher: ACCOUNT_ROLES.TEACHER,
};

export function normalizeRole(role) {
  const key = String(role || '').trim().toLowerCase();
  // Fail closed to least-privileged role when role is missing/invalid.
  return roleAliases[key] || ACCOUNT_ROLES.STUDENT;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)];
}

export function getRoleHomePath(_role) {
  return '/dashboard';
}
