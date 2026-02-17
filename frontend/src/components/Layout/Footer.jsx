import React from 'react';

import { FaTelegramPlane } from 'react-icons/fa';
import { HiChevronRight } from 'react-icons/hi';

const moduleLinks = [
  'Dashboard Overview',
  'Attendance Management',
  'Student Records',
  'Assignments',
  'Exams',
  'Certificates',
  'Reports & Calendar',
];

const studentAccess = [
  'Dashboard, Schedule, and Calendar',
  'Assignments, Exams, and Marksheets',
  'Messages and To Do List',
  'Profile management',
];

const teacherAccess = [
  'All student account features',
  'Attendance management',
  'Student records management',
  'Certificates and Reports',
];
const supportLinks = ['Telegram Admin Center', 'System Feedback', 'Technical Issue Tracking', 'Release Updates'];

export default function Footer() {
  return (
    <footer className="mt-8 bg-[#27406c] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <section>
          <h3 className="text-2xl font-semibold mb-3">Project Modules</h3>
          <ul className="space-y-2 text-sm">
            {moduleLinks.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <HiChevronRight className="mt-0.5 w-4 h-4 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-3">User Access</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-sky-300 mb-1.5">Student Account</p>
              <ul className="space-y-1">
                {studentAccess.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sky-300 mb-1.5">Teacher Account</p>
              <ul className="space-y-1">
                {teacherAccess.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            {supportLinks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-3">Project Contact</h3>
          <div className="space-y-1 text-sky-300 font-semibold">
            <p>Class Management System</p>
            <p>Information Technology Engineering</p>
            <p>Phnom Penh, Cambodia</p>
          </div>
          <div className="mt-5 space-y-1.5 text-base font-semibold">
            <p>Support : Telegram Admin Center</p>
            <p>Environment : Web Application</p>
            <p>E-mail : class.management@local</p>
            <p>
              Website : <span className="text-blue-400">Class Management Portal</span>
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://t.me/+I9OUYneewiA0NTc1"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-md bg-[#33a8df] flex items-center justify-center"
              aria-label="Open Telegram support"
            >
              <FaTelegramPlane className="w-6 h-6" />
            </a>
          </div>
        </section>
      </div>
    </footer>
  );
}
