## Sample CSV Data

This folder contains fake sample data aligned to the current MySQL schema.

Files:

- `students.csv`
  Imports directly into the `students` table and now includes `email`, `login_password`, and `current_address`.
- `student_users.csv`
  Imports student login accounts into the `users` table using hashed passwords linked to `students.csv`.
- `student_login_reference.csv`
  Human-readable reference file for testing student logins with email and first password.
- `staff_users.csv`
  Imports staff login accounts into the `users` table.
- `staff_login_reference.csv`
  Human-readable reference file for testing staff logins with email and password.
- `teachers.csv`
  Imports staff profile records into the `teachers` table after the user accounts exist.
- `import_sample_data.sql`
  Example MySQL script for loading all CSV files.

- `npm run import:sample-data`
  Preferred project command for importing the CSV files through the backend `.env` database configuration.

Notes:

- All sample teacher accounts use the same bcrypt password hash already used in `seed.sql`.
- The matching plain-text password is `Admin1234`.
- Student login CSVs are generated to match the student records, so the fake user data is explicitly connected to the CSV sample set.
- Student login email format is `<full-name>.<class>@school.edu`.
- Student first password format is `<last-name><DDMMYYYY>`.
- `students.csv` is now the readable source for those student login details plus address data used by lookup.
- `student_users.csv` stores the bcrypt hashes used for import.
- `student_login_reference.csv` is the easiest file to check when you want to test whether a student can log in.
- `teachers.csv` uses `email` so the import can map each teacher profile to its `users.id`.
- Update the file paths inside `import_sample_data.sql` before running it.
- The backend import command does not need manual path editing and is the recommended way to get fully login-ready sample data.
