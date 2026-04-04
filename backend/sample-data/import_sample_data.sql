USE class_management;

-- For fully login-ready sample data, prefer:
--   cd backend
--   npm run import:sample-data
-- The SQL script below loads CSV records only and does not generate bcrypt student passwords.

-- Update these paths before running.
-- Example:
-- SET @students_csv = 'C:/Users/ASUS TUF/Desktop/Program/class-management-system/backend/sample-data/students.csv';
-- SET @student_users_csv = 'C:/Users/ASUS TUF/Desktop/Program/class-management-system/backend/sample-data/student_users.csv';
-- SET @staff_users_csv = 'C:/Users/ASUS TUF/Desktop/Program/class-management-system/backend/sample-data/staff_users.csv';
-- SET @teachers_csv = 'C:/Users/ASUS TUF/Desktop/Program/class-management-system/backend/sample-data/teachers.csv';

SET @students_csv = 'C:/path/to/class-management-system/backend/sample-data/students.csv';
SET @student_users_csv = 'C:/path/to/class-management-system/backend/sample-data/student_users.csv';
SET @staff_users_csv = 'C:/path/to/class-management-system/backend/sample-data/staff_users.csv';
SET @teachers_csv = 'C:/path/to/class-management-system/backend/sample-data/teachers.csv';

-- Make sure `students.email`, `students.current_address`, and `students.user_id`
-- already exist before using this SQL file. The project command
-- `npm run import:sample-data` handles that automatically.

LOAD DATA LOCAL INFILE @students_csv
INTO TABLE students
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(student_code, full_name, class_name, section, gender, @dob, email, @login_password, current_address)
SET dob = NULLIF(@dob, '');

LOAD DATA LOCAL INFILE @staff_users_csv
INTO TABLE users
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(email, password_hash, role, full_name, gender);

LOAD DATA LOCAL INFILE @student_users_csv
INTO TABLE users
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(email, password_hash, role, full_name, gender, @student_code);

UPDATE students s
INNER JOIN users u ON u.email = s.email
SET s.user_id = u.id
WHERE s.user_id IS NULL OR s.user_id <> u.id;

DROP TEMPORARY TABLE IF EXISTS teachers_import;
CREATE TEMPORARY TABLE teachers_import (
  email VARCHAR(150) NOT NULL,
  employee_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  gender ENUM('male', 'female') NOT NULL,
  department VARCHAR(80) NOT NULL,
  subject_name VARCHAR(80) NOT NULL,
  phone VARCHAR(40) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

LOAD DATA LOCAL INFILE @teachers_csv
INTO TABLE teachers_import
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(email, employee_code, full_name, gender, department, subject_name, phone, is_active);

INSERT INTO teachers (
  user_id,
  employee_code,
  full_name,
  gender,
  department,
  subject_name,
  phone,
  is_active
)
SELECT
  users.id,
  teachers_import.employee_code,
  teachers_import.full_name,
  teachers_import.gender,
  teachers_import.department,
  teachers_import.subject_name,
  NULLIF(teachers_import.phone, ''),
  teachers_import.is_active
FROM teachers_import
INNER JOIN users ON users.email = teachers_import.email;

DROP TEMPORARY TABLE teachers_import;
