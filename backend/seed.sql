USE class_management;

INSERT INTO users (email, password_hash, role, full_name) VALUES
('admin.center@school.local', '$2a$10$replace_hash', 'admin', 'Admin Center'),
('teacher.math@school.local', '$2a$10$replace_hash', 'teacher', 'Math Teacher'),
('student.12a@school.local', '$2a$10$replace_hash', 'student', 'Student 12A');
