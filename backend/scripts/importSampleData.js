require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const pool = require('../src/config/db');

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  const [headerLine, ...lines] = raw.split(/\r?\n/);
  const parseLine = (line) =>
    (line.match(/(?:^|,)(\"(?:[^\"]|\"\")*\"|[^,]*)/g) || [])
      .map((part) => part.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
  const headers = parseLine(headerLine);

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = parseLine(line);
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index] ?? '';
        return acc;
      }, {});
    });
}

function normalizeTeacherStream(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['science', 'science department', 'ict department'].includes(normalized)) {
    return 'Science';
  }

  if (
    [
      'social',
      'social studies department',
      'language department',
      'physical education department',
      'academic affairs',
    ].includes(normalized)
  ) {
    return 'Social';
  }

  return String(value || '').trim() || 'Science';
}

function slugifyName(value) {
  return String(value || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');
}

function buildStudentEmail(fullName, classCode) {
  const slug = slugifyName(fullName);
  const classSuffix = String(classCode || 'class').trim().toLowerCase();
  return slug && classSuffix ? `${slug}.${classSuffix}@school.edu` : '';
}

function buildStudentPassword(fullName, dob) {
  const parts = String(dob || '').trim().split('-');
  if (parts.length !== 3) {
    throw new Error(`Student ${fullName} is missing a valid date of birth for login creation.`);
  }

  const nameParts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  const lastName = (nameParts[nameParts.length - 1] || 'student').toLowerCase();
  return `${lastName}${parts[2]}${parts[1]}${parts[0]}`;
}

async function ensureStudentColumns(connection) {
  const [[emailColumn]] = await connection.query(
    "SELECT 1 AS found FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'email' LIMIT 1"
  );
  if (!emailColumn) {
    await connection.query('ALTER TABLE students ADD COLUMN email VARCHAR(150) NULL UNIQUE');
  }

  const [[addressColumn]] = await connection.query(
    "SELECT 1 AS found FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'current_address' LIMIT 1"
  );
  if (!addressColumn) {
    await connection.query('ALTER TABLE students ADD COLUMN current_address VARCHAR(255) NULL');
  }

  const [[userIdColumn]] = await connection.query(
    "SELECT 1 AS found FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'user_id' LIMIT 1"
  );
  if (!userIdColumn) {
    await connection.query('ALTER TABLE students ADD COLUMN user_id INT NULL UNIQUE');
  }
}

async function importStudents(connection, rows) {
  for (const row of rows) {
    await connection.query(
      `INSERT INTO students (student_code, full_name, class_name, section, gender, dob, email, current_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         class_name = VALUES(class_name),
         section = VALUES(section),
         gender = VALUES(gender),
         dob = VALUES(dob),
         email = VALUES(email),
         current_address = VALUES(current_address)`,
      [
        row.student_code,
        row.full_name,
        row.class_name,
        row.section,
        row.gender,
        row.dob || null,
        row.email || buildStudentEmail(row.full_name, row.class_name),
        row.current_address || null,
      ]
    );

    await connection.query(
      'UPDATE students SET email = ?, current_address = ? WHERE student_code = ?',
      [
        row.email || buildStudentEmail(row.full_name, row.class_name),
        row.current_address || null,
        row.student_code,
      ]
    );
  }
}

async function importStudentUsers(connection, studentRows, userRows) {
  const usersByCode = new Map(
    userRows.map((row) => [String(row.student_code || '').trim(), row])
  );

  for (const row of studentRows) {
    const email = row.email || buildStudentEmail(row.full_name, row.class_name);
    const userRow = usersByCode.get(String(row.student_code || '').trim());
    const passwordHash =
      userRow?.password_hash ||
      await bcrypt.hash(row.login_password || buildStudentPassword(row.full_name, row.dob), 10);

    await connection.query(
      `INSERT INTO users (email, password_hash, role, full_name, gender, must_change_password)
       VALUES (?, ?, 'student', ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         full_name = VALUES(full_name),
         gender = VALUES(gender),
         must_change_password = VALUES(must_change_password)`,
      [email, passwordHash, row.full_name, row.gender || 'male']
    );

    const [[user]] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!user) {
      throw new Error(`No matching user account found for student email: ${email}`);
    }

    await connection.query(
      'UPDATE students SET user_id = ?, email = ? WHERE student_code = ?',
      [user.id, email, row.student_code]
    );
  }
}

async function importStaffUsers(connection, rows) {
  for (const row of rows) {
    await connection.query(
      `INSERT INTO users (email, password_hash, role, full_name, gender)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         full_name = VALUES(full_name),
         gender = VALUES(gender)`,
      [row.email, row.password_hash, row.role, row.full_name, row.gender]
    );
  }
}

async function importTeachers(connection, rows) {
  for (const row of rows) {
    const [[user]] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [row.email]
    );

    if (!user) {
      throw new Error(`No matching user account found for teacher email: ${row.email}`);
    }

    await connection.query(
      `INSERT INTO teachers (
         user_id,
         employee_code,
         full_name,
         gender,
         department,
         subject_name,
         phone,
         is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         gender = VALUES(gender),
         department = VALUES(department),
         subject_name = VALUES(subject_name),
         phone = VALUES(phone),
         is_active = VALUES(is_active)`,
      [
        user.id,
        row.employee_code,
        row.full_name,
        row.gender,
        normalizeTeacherStream(row.department || row.stream),
        row.subject_name,
        row.phone || null,
        Number(row.is_active || 1),
      ]
    );
  }
}

async function main() {
  const sampleDataDir = path.join(__dirname, '..', 'sample-data');
  const students = readCsv(path.join(sampleDataDir, 'students.csv'));
  const studentUsersPath = path.join(sampleDataDir, 'student_users.csv');
  const studentUsers = fs.existsSync(studentUsersPath) ? readCsv(studentUsersPath) : [];
  const staffUsers = readCsv(path.join(sampleDataDir, 'staff_users.csv'));
  const teachers = readCsv(path.join(sampleDataDir, 'teachers.csv'));

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureStudentColumns(connection);
    await importStudents(connection, students);
    await importStudentUsers(connection, students, studentUsers);
    await importStaffUsers(connection, staffUsers);
    await importTeachers(connection, teachers);
    await connection.commit();

    console.log(
      `Imported ${students.length} students, ${staffUsers.length} staff users, and ${teachers.length} teacher profiles.`
    );
  } catch (error) {
    await connection.rollback();
    console.error('Sample data import failed:', error.message || error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
