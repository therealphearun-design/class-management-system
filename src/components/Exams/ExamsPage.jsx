import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineDocumentDownload,
} from 'react-icons/hi';

import { ACCOUNT_ROLES, normalizeRole } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { classOptions } from '../../data/students';
import { examsAPI } from '../../services/api';
import Badge from '../common/Badge';
import Button from '../common/Button';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';

const examStatusColors = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ExamsPage() {
  const { user } = useAuth();
  const isTeacher = normalizeRole(user?.role) === ACCOUNT_ROLES.TEACHER;
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const response = await examsAPI.getAll();
      setExams(response.data);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Exam Name',
      accessor: 'name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <HiOutlineClipboardList className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-400">{row.subject}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Class',
      accessor: 'class',
      sortable: true,
    },
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (value) => `${value} mins`,
    },
    {
      header: 'Total Marks',
      accessor: 'totalMarks',
      sortable: true,
    },
    {
      header: 'Students',
      accessor: 'studentCount',
      render: (value) => (
        <div className="flex items-center gap-2">
          <HiOutlineUsers className="w-4 h-4 text-gray-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <Badge variant={examStatusColors[value]}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedExam(row);
            }}
          >
            View
          </Button>
          {row.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              icon={HiOutlineDocumentDownload}
              onClick={(e) => e.stopPropagation()}
            >
              Results
            </Button>
          )}
        </div>
      ),
    },
  ];

  const stats = [
    { label: 'Total Exams', value: exams.length, icon: HiOutlineClipboardList, color: 'bg-blue-500' },
    { label: 'Upcoming', value: exams.filter(e => e.status === 'scheduled').length, icon: HiOutlineCalendar, color: 'bg-yellow-500' },
    { label: 'Ongoing', value: exams.filter(e => e.status === 'ongoing').length, icon: HiOutlineClipboardList, color: 'bg-green-500' },
    { label: 'Completed', value: exams.filter(e => e.status === 'completed').length, icon: HiOutlineUsers, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isTeacher ? 'Exams List' : 'Exam Schedule'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isTeacher ? 'Manage examinations and results' : 'View your exam schedule and details'}
          </p>
        </div>
        {isTeacher && (
          <Button
            variant="primary"
            size="lg"
            icon={HiOutlinePlus}
            onClick={() => setShowCreateModal(true)}
          >
            Schedule Exam
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Exams table */}
      <DataTable
        columns={columns}
        data={exams}
        loading={loading}
        onRowClick={(row) => setSelectedExam(row)}
      />

      {/* Create Exam Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Exam"
      >
        <CreateExamForm onSuccess={() => {
          setShowCreateModal(false);
          loadExams();
        }} />
      </Modal>

      {/* View Exam Modal */}
      <Modal
        isOpen={selectedExam}
        onClose={() => setSelectedExam(null)}
        title={selectedExam?.name}
      >
        {selectedExam && <ExamDetails exam={selectedExam} isTeacher={isTeacher} />}
      </Modal>
    </div>
  );
}

function CreateExamForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    class: '',
    date: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await examsAPI.create(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create exam:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="exam-name" className="block text-sm font-medium text-gray-700 mb-1">
          Exam Name
        </label>
        <input
          id="exam-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="exam-subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select
            id="exam-subject"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select subject</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="History">History</option>
            <option value="Computer">Computer Science</option>
          </select>
        </div>

        <div>
          <label htmlFor="exam-class" className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            id="exam-class"
            required
            value={formData.class}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {classOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="exam-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="exam-date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="exam-duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            id="exam-duration"
            type="number"
            required
            min="15"
            step="15"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="exam-total-marks" className="block text-sm font-medium text-gray-700 mb-1">
            Total Marks
          </label>
          <input
            id="exam-total-marks"
            type="number"
            required
            min="1"
            value={formData.totalMarks}
            onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="exam-passing-marks" className="block text-sm font-medium text-gray-700 mb-1">
            Passing Marks
          </label>
          <input
            id="exam-passing-marks"
            type="number"
            required
            min="1"
            value={formData.passingMarks}
            onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSuccess()}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Schedule Exam
        </Button>
      </div>
    </form>
  );
}

function ExamDetails({ exam, isTeacher }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Subject</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{exam.subject}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Class</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{exam.class}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Date & Time</p>
          <p className="text-sm font-medium text-gray-800 mt-1">
            {new Date(exam.date).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{exam.duration} minutes</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total Marks</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{exam.totalMarks}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Passing Marks</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{exam.passingMarks}</p>
        </div>
      </div>

      {exam.status === 'completed' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Results Summary</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Score</span>
              <span className="text-lg font-bold text-gray-800">78.5%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Highest Score</span>
              <span className="text-lg font-bold text-green-600">98%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Pass Rate</span>
              <span className="text-lg font-bold text-green-600">85%</span>
            </div>
          </div>
        </div>
      )}

      {isTeacher ? (
        <div className="flex justify-end gap-3">
          <Button variant="secondary">Edit</Button>
          {exam.status === 'completed' && (
            <Button variant="primary" icon={HiOutlineDocumentDownload}>
              Download Results
            </Button>
          )}
          {exam.status === 'scheduled' && (
            <Button variant="success">Start Exam</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
