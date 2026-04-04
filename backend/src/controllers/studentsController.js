const bcrypt = require('bcryptjs');

const pool = require('../config/db');

function normalizeGender(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'female' ? 'female' : 'male';
}

function normalizeClassCode(value) {
  return String(value || '').trim().toUpperCase();
}

function splitClassCode(value) {
  const classCode = normalizeClassCode(value);
  const match = classCode.match(/^(\d+)([A-Z]+)$/);
  if (!match) return null;
  return {
    classCode,
    className: classCode,
    section: match[2],
  };
}

function normalizeDateOfBirth(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function makeStudentCode() {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CMS${stamp}${random}`;
}

function makeStudentEmail(fullName, classCode) {
  const slug = String(fullName || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');
  const classSuffix = String(classCode || 'class').toLowerCase();
  return slug && classSuffix ? `${slug}.${classSuffix}@school.edu` : '';
}

function cleanText(value, maxLen = 255) {
  return String(value || '').trim().slice(0, maxLen);
}

function buildStudentPassword(fullName, dob) {
  const lastName = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-1)[0]
    ?.toLowerCase() || 'student';
  const parts = String(dob || '').trim().split('-');
  if (parts.length !== 3) return '';
  return `${lastName}${parts[2]}${parts[1]}${parts[0]}`;
}

function mapStudentRow(row) {
  const classCode = row.class_name || '';
  return {
    id: row.id,
    studentId: row.student_code,
    student_code: row.student_code,
    name: row.full_name,
    full_name: row.full_name,
    class: classCode,
    class_name: classCode,
    section: row.section,
    shift: 'Both',
    gender: row.gender,
    dateOfBirth: row.dob,
    dob: row.dob,
    email: row.email || makeStudentEmail(row.full_name, classCode),
    currentAddress: row.current_address || '',
    current_address: row.current_address || '',
    userId: row.user_id || null,
    hasAccount: Boolean(row.user_id && (row.email || makeStudentEmail(row.full_name, classCode)) && row.dob),
    status: 'active',
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || row.created_at || null,
  };
}

function normalizeStudentPayload(payload = {}) {
  const fullName = String(payload.full_name ?? payload.name ?? '').trim();
  const requestedStudentCode = String(payload.student_code ?? payload.studentId ?? '').trim();
  const classInput = payload.class_name ?? payload.class ?? '';
  const classParts = splitClassCode(classInput);
  const gender = normalizeGender(payload.gender);
  const dob = normalizeDateOfBirth(payload.dob ?? payload.dateOfBirth);
  const email = cleanText(payload.email, 150).toLowerCase();
  const currentAddress = cleanText(payload.current_address ?? payload.currentAddress, 255);

  if (!fullName) {
    return { error: 'Student name is required.' };
  }

  if (!classParts) {
    return { error: 'A valid class code such as 7A or 12B is required.' };
  }

  if (!dob) {
    return { error: 'Date of birth is required so the student can receive a login password.' };
  }

  return {
    studentCode: requestedStudentCode || makeStudentCode(),
    fullName,
    className: classParts.className,
    section: classParts.section,
    gender,
    dob,
    email,
    currentAddress,
  };
}

function isDuplicateKeyError(error) {
  return error?.code === 'ER_DUP_ENTRY';
}

async function getAllStudents(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, student_code, full_name, class_name, section, gender, dob, created_at
              , user_id, email, current_address
       FROM students
       ORDER BY class_name ASC, full_name ASC`
    );
    return res.status(200).json(rows.map(mapStudentRow));
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch students',
      error: error?.message || 'Unknown error',
    });
  }
}

async function getStudentById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, student_code, full_name, class_name, section, gender, dob, created_at
              , user_id, email, current_address
       FROM students
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.status(200).json(mapStudentRow(rows[0]));
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch student',
      error: error?.message || 'Unknown error',
    });
  }
}

async function createStudent(req, res) {
  const connection = await pool.getConnection();
  try {
    const normalized = normalizeStudentPayload(req.body);
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const email = normalized.email || makeStudentEmail(normalized.fullName, normalized.className);
    const passwordHash = await bcrypt.hash(buildStudentPassword(normalized.fullName, normalized.dob), 10);

    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO users (email, password_hash, role, full_name, gender, must_change_password)
       VALUES (?, ?, 'student', ?, ?, 0)`,
      [email, passwordHash, normalized.fullName, normalized.gender]
    );

    const [result] = await connection.query(
      `INSERT INTO students (student_code, full_name, class_name, section, gender, dob, user_id, email, current_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalized.studentCode,
        normalized.fullName,
        normalized.className,
        normalized.section,
        normalized.gender,
        normalized.dob,
        userResult.insertId,
        email,
        normalized.currentAddress || null,
      ]
    );

    await connection.commit();

    const [rows] = await connection.query(
      `SELECT id, student_code, full_name, class_name, section, gender, dob, created_at
              , user_id, email, current_address
       FROM students
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json(mapStudentRow(rows[0]));
  } catch (error) {
    await connection.rollback();
    const message = isDuplicateKeyError(error)
      ? 'Student code or login email already exists. Please try again.'
      : 'Failed to create student';
    return res.status(isDuplicateKeyError(error) ? 409 : 500).json({
      message,
      error: error?.message || 'Unknown error',
    });
  } finally {
    connection.release();
  }
}

async function updateStudent(req, res) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const normalized = normalizeStudentPayload(req.body);
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const [existingRows] = await connection.query(
      'SELECT id, user_id, email FROM students WHERE id = ? LIMIT 1',
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const email = normalized.email || makeStudentEmail(normalized.fullName, normalized.className);
    const passwordHash = await bcrypt.hash(buildStudentPassword(normalized.fullName, normalized.dob), 10);

    await connection.beginTransaction();

    let userId = existingRows[0].user_id;
    if (userId) {
      await connection.query(
        `UPDATE users
         SET email = ?, password_hash = ?, role = 'student', full_name = ?, gender = ?, must_change_password = 0
         WHERE id = ?`,
        [email, passwordHash, normalized.fullName, normalized.gender, userId]
      );
    } else {
      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, role, full_name, gender, must_change_password)
         VALUES (?, ?, 'student', ?, ?, 0)`,
        [email, passwordHash, normalized.fullName, normalized.gender]
      );
      userId = userResult.insertId;
    }

    await connection.query(
      `UPDATE students
       SET student_code = ?, full_name = ?, class_name = ?, section = ?, gender = ?, dob = ?, user_id = ?, email = ?, current_address = ?
       WHERE id = ?`,
      [
        normalized.studentCode,
        normalized.fullName,
        normalized.className,
        normalized.section,
        normalized.gender,
        normalized.dob,
        userId,
        email,
        normalized.currentAddress || null,
        id,
      ]
    );

    await connection.commit();

    const [rows] = await connection.query(
      `SELECT id, student_code, full_name, class_name, section, gender, dob, created_at
              , user_id, email, current_address
       FROM students
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return res.status(200).json(mapStudentRow(rows[0]));
  } catch (error) {
    await connection.rollback();
    const message = isDuplicateKeyError(error)
      ? 'Student code or login email already exists. Please use different student details.'
      : 'Failed to update student';
    return res.status(isDuplicateKeyError(error) ? 409 : 500).json({
      message,
      error: error?.message || 'Unknown error',
    });
  } finally {
    connection.release();
  }
}

async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete student',
      error: error?.message || 'Unknown error',
    });
  }
}

async function bulkCreateStudents(req, res) {
  const connection = await pool.getConnection();
  try {
    const items = Array.isArray(req.body?.students) ? req.body.students : [];
    if (items.length === 0) {
      return res.status(400).json({ message: 'students array is required' });
    }

    const normalizedItems = [];
    for (const item of items) {
      const normalized = normalizeStudentPayload(item);
      if (normalized.error) {
        return res.status(400).json({ message: normalized.error });
      }
      normalizedItems.push(normalized);
    }

    await connection.beginTransaction();

    const createdIds = [];
    for (const item of normalizedItems) {
      const email = item.email || makeStudentEmail(item.fullName, item.className);
      const passwordHash = await bcrypt.hash(buildStudentPassword(item.fullName, item.dob), 10);

      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, role, full_name, gender, must_change_password)
         VALUES (?, ?, 'student', ?, ?, 0)`,
        [email, passwordHash, item.fullName, item.gender]
      );

      const [studentResult] = await connection.query(
        `INSERT INTO students (student_code, full_name, class_name, section, gender, dob, user_id, email, current_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.studentCode,
          item.fullName,
          item.className,
          item.section,
          item.gender,
          item.dob,
          userResult.insertId,
          email,
          item.currentAddress || null,
        ]
      );

      createdIds.push(studentResult.insertId);
    }

    await connection.commit();

    const [rows] = await connection.query(
      `SELECT id, student_code, full_name, class_name, section, gender, dob, created_at
              , user_id, email, current_address
       FROM students
       WHERE id IN (?)
       ORDER BY id ASC`,
      [createdIds]
    );

    return res.status(201).json({
      message: 'Students created successfully',
      items: rows.map(mapStudentRow),
    });
  } catch (error) {
    await connection.rollback();
    const message = isDuplicateKeyError(error)
      ? 'One or more student IDs or login emails already exist.'
      : 'Failed to create students';
    return res.status(isDuplicateKeyError(error) ? 409 : 500).json({
      message,
      error: error?.message || 'Unknown error',
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  bulkCreateStudents,
  createStudent,
  deleteStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
};
