import React, { useMemo, useState } from 'react';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  HiOutlineBadgeCheck,
  HiOutlineDocumentDownload,
  HiOutlineMail,
  HiOutlinePlus,
} from 'react-icons/hi';

import { studentsData } from '../../data/students';
import Badge from '../common/Badge';
import Button from '../common/Button';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';

const currentStudents = studentsData.slice(0, 4).map((s) => s.name);
const initialCertificates = [
  {
    id: 1,
    studentName: currentStudents[0] || 'Student 1',
    certificateType: 'Achievement',
    issueDate: '2026-02-01',
    status: 'issued',
    grade: 'A',
    description: 'Excellence in Mathematics',
  },
  {
    id: 2,
    studentName: currentStudents[1] || 'Student 2',
    certificateType: 'Participation',
    issueDate: '2026-02-02',
    status: 'issued',
    grade: 'B+',
    description: 'Science Fair Participant',
  },
  {
    id: 3,
    studentName: currentStudents[2] || 'Student 3',
    certificateType: 'Merit',
    issueDate: '2026-02-05',
    status: 'pending',
    grade: 'A-',
    description: 'Academic Excellence',
  },
  {
    id: 4,
    studentName: currentStudents[3] || 'Student 4',
    certificateType: 'Completion',
    issueDate: '',
    status: 'draft',
    grade: 'A',
    description: 'Course Completion Certificate',
  },
];

const certificateTemplates = [
  { id: 1, name: 'Achievement Certificate', preview: 'AC', students: 45 },
  { id: 2, name: 'Participation Certificate', preview: 'PC', students: 78 },
  { id: 3, name: 'Merit Certificate', preview: 'MC', students: 23 },
  { id: 4, name: 'Completion Certificate', preview: 'CC', students: 156 },
  { id: 5, name: 'Sports Excellence', preview: 'SE', students: 34 },
];

const statusColors = {
  issued: 'success',
  pending: 'warning',
  draft: 'neutral',
};

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState('issued');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [certificates, setCertificates] = useState(initialCertificates);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    studentName: '',
    certificateType: 'Achievement',
    grade: 'A',
    description: '',
    status: 'draft',
  });

  const clearNotification = () => {
    setTimeout(() => setNotification(null), 2500);
  };

  const issueCertificate = (id) => {
    setCertificates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          status: 'issued',
          issueDate: c.issueDate || format(new Date(), 'yyyy-MM-dd'),
        };
      })
    );
    setNotification({ type: 'success', message: 'Certificate issued successfully.' });
    clearNotification();
  };

  const issueAllPending = () => {
    setCertificates((prev) =>
      prev.map((c) => {
        if (c.status !== 'pending') return c;
        return {
          ...c,
          status: 'issued',
          issueDate: c.issueDate || format(new Date(), 'yyyy-MM-dd'),
        };
      })
    );
    setNotification({ type: 'success', message: 'All pending certificates have been issued.' });
    clearNotification();
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const studentName = formData.studentName.trim();
    const description = formData.description.trim();
    if (!studentName || !description) return;

    const newCertificate = {
      id: Date.now(),
      studentName,
      certificateType: formData.certificateType,
      issueDate: formData.status === 'issued' ? format(new Date(), 'yyyy-MM-dd') : '',
      status: formData.status,
      grade: formData.grade,
      description,
    };

    setCertificates((prev) => [newCertificate, ...prev]);
    setShowCreateModal(false);
    setFormData({
      studentName: '',
      certificateType: 'Achievement',
      grade: 'A',
      description: '',
      status: 'draft',
    });
    setNotification({ type: 'success', message: 'Certificate created successfully.' });
    clearNotification();
  };

  const stats = useMemo(() => {
    const issued = certificates.filter((c) => c.status === 'issued').length;
    const pending = certificates.filter((c) => c.status === 'pending').length;
    const draft = certificates.filter((c) => c.status === 'draft').length;
    return {
      total: certificates.length,
      issued,
      pending,
      draft,
    };
  }, [certificates]);

  const columns = [
    {
      header: 'Student',
      accessor: 'studentName',
      sortable: true,
    },
    {
      header: 'Certificate Type',
      accessor: 'certificateType',
      sortable: true,
    },
    {
      header: 'Issue Date',
      accessor: 'issueDate',
      sortable: true,
      render: (value) => (value ? format(new Date(value), 'dd MMM yyyy') : '-'),
    },
    {
      header: 'Grade',
      accessor: 'grade',
    },
    {
      header: 'Description',
      accessor: 'description',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <Badge variant={statusColors[value] || 'neutral'}>
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
            variant="ghost"
            size="sm"
            icon={HiOutlineDocumentDownload}
            onClick={() => {
              setNotification({ type: 'success', message: `Prepared PDF for ${row.studentName}.` });
              clearNotification();
            }}
          >
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={HiOutlineMail}
            onClick={() => {
              setNotification({ type: 'success', message: `Email queued for ${row.studentName}.` });
              clearNotification();
            }}
          >
            Email
          </Button>
          {row.status !== 'issued' && (
            <Button variant="success" size="sm" onClick={() => issueCertificate(value)}>
              Issue
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filteredCertificates = certificates.filter((c) => c.status === activeTab);

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and issue student certificates
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={HiOutlinePlus}
          onClick={() => setShowCreateModal(true)}
        >
          Create Certificate
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
          <span className="text-xs text-green-600 mt-2 block">Up 12% this month</span>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card">
          <p className="text-sm text-gray-500">Issued</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.issued}</p>
          <span className="text-xs text-gray-500 mt-2 block">Completed certificates</span>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          <span className="text-xs text-gray-500 mt-2 block">Requires action</span>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card">
          <p className="text-sm text-gray-500">Draft</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.draft}</p>
          <span className="text-xs text-green-600 mt-2 block">Up 8% this month</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Certificate Templates</h2>
          <Button variant="secondary" size="sm" icon={HiOutlinePlus}>
            New Template
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {certificateTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedTemplate(template)}
              className={`
                bg-white border rounded-xl p-4 cursor-pointer transition-all
                ${selectedTemplate?.id === template.id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300'
                }
              `}
            >
              <div className="text-xl font-bold mb-3 text-primary-700">{template.preview}</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {template.name}
              </h3>
              <p className="text-xs text-gray-400">
                {template.students} issued
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {['issued', 'pending', 'draft'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`
                pb-3 px-1 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {certificates.filter((c) => c.status === tab).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <DataTable
        columns={columns}
        data={filteredCertificates}
        searchable={true}
        filterable={false}
        exportable={true}
      />

      {stats.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <HiOutlineBadgeCheck className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {stats.pending} certificates pending approval
                </p>
                <p className="text-xs text-yellow-600 mt-0.5">
                  Review and issue certificates to students
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setActiveTab('pending')}>
                Review All
              </Button>
              <Button variant="success" size="sm" onClick={issueAllPending}>
                Issue All
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Certificate"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="cert-student" className="block text-sm font-medium text-gray-700 mb-1">
              Student Name
            </label>
            <input
              id="cert-student"
              value={formData.studentName}
              list="student-options"
              onChange={(e) => setFormData((prev) => ({ ...prev, studentName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <datalist id="student-options">
              {studentsData.map((student) => (
                <option key={student.id} value={student.name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cert-type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="cert-type"
                value={formData.certificateType}
                onChange={(e) => setFormData((prev) => ({ ...prev, certificateType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Achievement">Achievement</option>
                <option value="Participation">Participation</option>
                <option value="Merit">Merit</option>
                <option value="Completion">Completion</option>
              </select>
            </div>
            <div>
              <label htmlFor="cert-grade" className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <input
                id="cert-grade"
                value={formData.grade}
                onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cert-status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="cert-status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
            </select>
          </div>

          <div>
            <label htmlFor="cert-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="cert-desc"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
