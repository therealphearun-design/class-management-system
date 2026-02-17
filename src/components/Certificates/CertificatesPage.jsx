import React, { useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';
import {
  HiOutlineBadgeCheck,
  HiOutlineDocumentDownload,
  HiOutlineMail,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi';

import { studentsData } from '../../data/students';
import { certificatesAPI, studentsAPI } from '../../services/api';
import Badge from '../common/Badge';
import Button from '../common/Button';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';

const LOCAL_CERTIFICATES_KEY = 'certificates_local_v2';
const LOCAL_STUDENTS_KEY = 'students_local_v2';

const CERTIFICATE_TYPES = ['Achievement', 'Participation', 'Merit', 'Completion', 'Sports Excellence'];
const CERTIFICATE_STATUSES = ['issued', 'pending', 'draft'];

const statusColors = {
  issued: 'success',
  pending: 'warning',
  draft: 'neutral',
};

const readLocalList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalCertificates = (items) => {
  try {
    localStorage.setItem(LOCAL_CERTIFICATES_KEY, JSON.stringify(items));
  } catch {
    // Ignore offline storage errors.
  }
};

const mergeUniqueById = (items) => {
  const map = new Map();
  items.forEach((item) => map.set(String(item.id), item));
  return Array.from(map.values());
};

const makeStudentEmail = (name) => {
  const slug = String(name || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');
  return `${slug || 'student'}@class.local`;
};

const normalizeStudent = (student) => ({
  ...student,
  section: student.section || 'A',
  shift: student.shift || 'Morning',
  email: student.email || makeStudentEmail(student.name),
});

const normalizeCertificate = (certificate, studentsById) => {
  const student = studentsById.get(String(certificate.studentId)) || null;
  const status = CERTIFICATE_STATUSES.includes(certificate.status) ? certificate.status : 'draft';

  return {
    id: certificate.id ?? `local-${Date.now()}`,
    studentId: certificate.studentId ?? student?.id ?? null,
    studentName: certificate.studentName || student?.name || 'Unknown Student',
    classCode: certificate.classCode || student?.class || '',
    section: certificate.section || student?.section || '',
    shift: certificate.shift || student?.shift || '',
    studentEmail: certificate.studentEmail || student?.email || makeStudentEmail(certificate.studentName || student?.name),
    certificateType: certificate.certificateType || 'Achievement',
    issueDate: certificate.issueDate || '',
    status,
    grade: certificate.grade || '-',
    description: certificate.description || '',
    createdAt: certificate.createdAt || new Date().toISOString(),
  };
};

const toPdfSafeText = (value) => String(value ?? '')
  .replace(/[^\x20-\x7E]/g, '?')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

const buildTextCommand = (text, fontSize, x, y) => (
  `BT /F1 ${fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${toPdfSafeText(text)}) Tj ET`
);

const buildCenteredTextCommand = (text, fontSize, y, pageWidth) => {
  const roughTextWidth = Math.max(0, String(text).length * fontSize * 0.5);
  const x = (pageWidth - roughTextWidth) / 2;
  return buildTextCommand(text, fontSize, x, y);
};

const wrapPdfText = (text, fontSize, maxWidth) => {
  const normalized = String(text || '').trim().replace(/\s+/g, ' ');
  if (!normalized) return ['-'];

  const maxChars = Math.max(10, Math.floor(maxWidth / (fontSize * 0.5)));
  const words = normalized.split(' ');
  const lines = [];
  let current = '';

  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }

    const candidate = `${current} ${word}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines;
};

function createCertificatePdfBlob(certificate) {
  const pageWidth = 595.28; // A4 portrait width in points

  let issueDateLabel = '-';
  if (certificate.issueDate) {
    const parsedDate = new Date(certificate.issueDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      issueDateLabel = format(parsedDate, 'dd MMMM yyyy');
    }
  }

  const studentName = certificate.studentName || 'Student Name';
  const classLabel = `${certificate.classCode || '-'} ${certificate.section || ''}`.trim();
  const shiftLabel = certificate.shift || '-';
  const gradeLabel = certificate.grade || '-';
  const certificateType = certificate.certificateType || 'Certificate';
  const description = certificate.description || '-';
  const nameFontSize = Math.max(22, Math.min(30, 340 / Math.max(1, String(studentName).length * 0.5)));
  const detailLines = wrapPdfText(`Description: ${description}`, 11, 430);

  const lines = [
    '0.78 0.58 0.16 RG 3 w 28 28 539.28 785.89 re S',
    '0.78 0.58 0.16 RG 1.2 w 45 45 505.28 751.89 re S',
    buildCenteredTextCommand('CLASS MANAGEMENT SCHOOL', 24, 750, pageWidth),
    buildCenteredTextCommand('OFFICIAL STUDENT CERTIFICATE', 15, 720, pageWidth),
    buildCenteredTextCommand('This certificate is proudly presented to', 13, 660, pageWidth),
    buildCenteredTextCommand(studentName, nameFontSize, 610, pageWidth),
    buildCenteredTextCommand(
      `for ${certificateType.toLowerCase()} and outstanding performance.`,
      14,
      570,
      pageWidth
    ),
    buildCenteredTextCommand(
      `Class: ${classLabel}   Shift: ${shiftLabel}   Grade: ${gradeLabel}`,
      12,
      540,
      pageWidth
    ),
    buildTextCommand(`Issue Date: ${issueDateLabel}`, 11, 80, 460),
    buildTextCommand('School Principal', 11, 90, 250),
    buildTextCommand('Class Teacher', 11, 410, 250),
    '0 G 1 w 80 265 m 230 265 l S',
    '0 G 1 w 365 265 m 515 265 l S',
  ];
  detailLines.forEach((line, index) => {
    lines.splice(9 + index, 0, buildTextCommand(line, 11, 80, 500 - (index * 16)));
  });

  const contentStream = lines.join('\n');
  const streamObject = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    streamObject,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export default function CertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('issued');
  const [students, setStudents] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    certificateType: 'Achievement',
    grade: 'A',
    description: '',
    status: 'draft',
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 2800);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const localStudents = readLocalList(LOCAL_STUDENTS_KEY).map(normalizeStudent);
      let mergedStudents;
      try {
        const response = await studentsAPI.getAll();
        const apiStudents = Array.isArray(response?.data) ? response.data : [];
        mergedStudents = mergeUniqueById([...localStudents, ...(apiStudents.length > 0 ? apiStudents : studentsData)]);
      } catch {
        mergedStudents = mergeUniqueById([...localStudents, ...studentsData]);
      }

      const normalizedStudents = mergedStudents.map(normalizeStudent);
      setStudents(normalizedStudents);

      const studentsById = new Map(normalizedStudents.map((s) => [String(s.id), s]));
      const localCertificates = readLocalList(LOCAL_CERTIFICATES_KEY)
        .map((item) => normalizeCertificate(item, studentsById));

      try {
        const response = await certificatesAPI.getAll();
        const apiCertificates = (Array.isArray(response?.data) ? response.data : [])
          .map((item) => normalizeCertificate(item, studentsById));
        const merged = mergeUniqueById([...apiCertificates, ...localCertificates]);
        setCertificates(merged);
      } catch {
        setCertificates(localCertificates);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const persistCertificates = (nextCertificates) => {
    setCertificates(nextCertificates);
    saveLocalCertificates(nextCertificates);
  };

  const certificateTemplates = useMemo(
    () => CERTIFICATE_TYPES.map((type, index) => ({
      id: index + 1,
      name: `${type} Certificate`,
      preview: type
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      students: certificates.filter((c) => c.certificateType === type).length,
      type,
    })),
    [certificates]
  );

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

  const filteredCertificates = useMemo(() => {
    const base = certificates.filter((c) => c.status === activeTab);
    if (!selectedTemplate) return base;
    return base.filter((c) => c.certificateType === selectedTemplate.type);
  }, [activeTab, certificates, selectedTemplate]);

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === String(formData.studentId)) || null,
    [formData.studentId, students]
  );
  const classFilterOptions = useMemo(() => {
    const classes = Array.from(new Set(students.map((student) => String(student.class || '').trim()).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right));
    return [{ value: 'all', label: 'All classes' }, ...classes.map((item) => ({ value: item, label: item }))];
  }, [students]);

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return students.filter((student) => {
      const matchesClass = studentClassFilter === 'all' || student.class === studentClassFilter;
      if (!matchesClass) return false;
      if (!query) return true;
      return String(student.name || '').toLowerCase().includes(query);
    });
  }, [students, studentClassFilter, studentSearch]);

  const issueCertificate = async (id) => {
    const target = certificates.find((certificate) => String(certificate.id) === String(id));
    if (!target) return;

    const next = certificates.map((certificate) => {
      if (String(certificate.id) !== String(id)) return certificate;
      return {
        ...certificate,
        status: 'issued',
        issueDate: certificate.issueDate || format(new Date(), 'yyyy-MM-dd'),
      };
    });

    persistCertificates(next);

    try {
      await certificatesAPI.issue(id);
      notify('success', `Certificate issued for ${target.studentName}.`);
    } catch {
      try {
        const updated = next.find((certificate) => String(certificate.id) === String(id));
        await certificatesAPI.update(id, updated);
        notify('success', `Certificate issued for ${target.studentName}.`);
      } catch {
        notify('success', `Certificate issued locally for ${target.studentName} (API unavailable).`);
      }
    }
  };

  const issueAllPending = async () => {
    const pendingCertificates = certificates.filter((c) => c.status === 'pending');
    if (pendingCertificates.length === 0) {
      notify('error', 'No pending certificates found.');
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const next = certificates.map((certificate) =>
      certificate.status === 'pending'
        ? { ...certificate, status: 'issued', issueDate: certificate.issueDate || today }
        : certificate
    );

    persistCertificates(next);

    try {
      await Promise.all(
        pendingCertificates.map((certificate) =>
          certificatesAPI.issue(certificate.id).catch(() => certificatesAPI.update(certificate.id, {
            ...certificate,
            status: 'issued',
            issueDate: certificate.issueDate || today,
          }))
        )
      );
      notify('success', 'All pending certificates have been issued.');
    } catch {
      notify('success', 'Pending certificates issued locally (API unavailable).');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const description = formData.description.trim();

    if (!selectedStudent) {
      notify('error', 'Please select a student.');
      return;
    }

    if (!description) {
      notify('error', 'Description is required.');
      return;
    }

    setIsSaving(true);

    const payload = {
      id: `local-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      classCode: selectedStudent.class,
      section: selectedStudent.section,
      shift: selectedStudent.shift,
      studentEmail: selectedStudent.email,
      certificateType: formData.certificateType,
      issueDate: formData.status === 'issued' ? format(new Date(), 'yyyy-MM-dd') : '',
      status: formData.status,
      grade: formData.grade.trim() || '-',
      description,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await certificatesAPI.create(payload);
      const created = response?.data && typeof response.data === 'object' ? response.data : payload;
      const normalized = normalizeCertificate(created, new Map(students.map((s) => [String(s.id), s])));
      persistCertificates([normalized, ...certificates]);
      notify('success', 'Certificate created successfully.');
    } catch {
      persistCertificates([payload, ...certificates]);
      notify('success', 'Certificate created locally (API unavailable).');
    } finally {
      setIsSaving(false);
      setShowCreateModal(false);
      setStudentClassFilter('all');
      setStudentSearch('');
      setFormData({
        studentId: '',
        certificateType: 'Achievement',
        grade: 'A',
        description: '',
        status: 'draft',
      });
    }
  };

  const downloadCertificate = async (certificate) => {
    try {
      const response = await certificatesAPI.download(certificate.id);
      if (response?.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificate.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        notify('success', `Downloaded certificate for ${certificate.studentName}.`);
        return;
      }
    } catch {
      // Fallback to local download below.
    }

    const blob = createCertificatePdfBlob(certificate);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${certificate.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    notify('success', `Downloaded local PDF certificate for ${certificate.studentName}.`);
  };

  const sendCertificateEmail = async (certificate) => {
    try {
      await certificatesAPI.sendEmail(certificate.id);
      notify('success', `Email sent for ${certificate.studentName}.`);
      return;
    } catch {
      const subject = encodeURIComponent(`Certificate: ${certificate.certificateType}`);
      const body = encodeURIComponent(
        `Hello ${certificate.studentName},\n\nYour ${certificate.certificateType} certificate is ready.\nGrade: ${certificate.grade}\nStatus: ${certificate.status}\nIssue Date: ${certificate.issueDate || '-'}\n\nRegards,\nClass Management`
      );
      const targetEmail = certificate.studentEmail || makeStudentEmail(certificate.studentName);
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
      notify('success', `Opened email draft for ${certificate.studentName}.`);
    }
  };

  const deleteCertificate = async (id) => {
    const certificate = certificates.find((item) => String(item.id) === String(id));
    if (!certificate) return;
    if (!window.confirm(`Delete certificate for ${certificate.studentName}?`)) return;

    const next = certificates.filter((item) => String(item.id) !== String(id));
    persistCertificates(next);

    try {
      await certificatesAPI.delete(id);
      notify('success', `Deleted certificate for ${certificate.studentName}.`);
    } catch {
      notify('success', `Deleted locally for ${certificate.studentName} (API unavailable).`);
    }
  };

  const columns = [
    {
      header: 'Student',
      accessor: 'studentName',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-800">{value}</p>
          <p className="text-xs text-gray-400">
            {row.classCode || '-'} | {row.section || '-'} | {row.shift || '-'}
          </p>
        </div>
      ),
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
      sortable: true,
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (value) => <span className="line-clamp-2">{value || '-'}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
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
            onClick={() => downloadCertificate(row)}
          >
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={HiOutlineMail}
            onClick={() => sendCertificateEmail(row)}
          >
            Email
          </Button>
          {row.status !== 'issued' && (
            <Button variant="success" size="sm" onClick={() => issueCertificate(value)}>
              Issue
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            icon={HiOutlineTrash}
            onClick={() => deleteCertificate(value)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

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
            Real certificate workflow with student records, issuing, download, and email.
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
          <span className="text-xs text-gray-500 mt-2 block">All certificates</span>
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
          <span className="text-xs text-gray-500 mt-2 block">Not issued yet</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Certificate Templates</h2>
          {selectedTemplate ? (
            <Button variant="secondary" size="sm" onClick={() => setSelectedTemplate(null)}>
              Clear Template Filter
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {certificateTemplates.map((template) => (
            <button
              type="button"
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`
                bg-white border rounded-xl p-4 cursor-pointer transition-all text-left
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
                {template.students} records
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {CERTIFICATE_STATUSES.map((tab) => (
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
        loading={loading}
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
        onClose={() => !isSaving && setShowCreateModal(false)}
        title="Create Certificate"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="cert-class-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              id="cert-class-filter"
              value={studentClassFilter}
              onChange={(e) => {
                const nextClass = e.target.value;
                setStudentClassFilter(nextClass);
                setFormData((prev) => {
                  if (!prev.studentId) return prev;
                  const selected = students.find((student) => String(student.id) === String(prev.studentId));
                  if (!selected) return { ...prev, studentId: '' };
                  const stillVisible = nextClass === 'all' || selected.class === nextClass;
                  return stillVisible ? prev : { ...prev, studentId: '' };
                });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {classFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cert-student-search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Student
            </label>
            <input
              id="cert-student-search"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Type student name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="cert-student" className="block text-sm font-medium text-gray-700 mb-1">
              Student ({visibleStudents.length})
            </label>
            <select
              id="cert-student"
              value={formData.studentId}
              onChange={(e) => setFormData((prev) => ({ ...prev, studentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select student</option>
              {visibleStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.class} {student.section} ({student.shift})
                </option>
              ))}
            </select>
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
                {CERTIFICATE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
