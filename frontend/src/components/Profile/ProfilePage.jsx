import React, { useState } from 'react';

import {
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineUser,
} from 'react-icons/hi';

import { ACCOUNT_ROLES, ROLE_CAPABILITIES, ROLE_LABELS, normalizeRole } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { generateAvatarByGender, normalizeGender } from '../../utils/avatar';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Modal from '../common/Modal';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image.'));
    image.src = src;
  });
}

async function buildAvatarFromEditor(src, scale, offsetX, offsetY) {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not prepare image editor.');
  }

  const safeScale = Number.isFinite(scale) ? Math.max(scale, 1) : 1;
  const scaledWidth = image.width * safeScale;
  const scaledHeight = image.height * safeScale;
  const baseX = (size - scaledWidth) / 2;
  const baseY = (size - scaledHeight) / 2;

  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, baseX + offsetX, baseY + offsetY, scaledWidth, scaledHeight);

  return canvas.toDataURL('image/jpeg', 0.92);
}

function formatClassLabel(classCode, section) {
  const baseClass = String(classCode || '').trim();
  const baseSection = String(section || '').trim();
  if (!baseClass) return baseSection;
  if (!baseSection) return baseClass;

  const normalizedClass = baseClass.toUpperCase();
  const normalizedSection = baseSection.toUpperCase();
  if (normalizedClass.endsWith(normalizedSection)) {
    return baseClass;
  }

  return `${baseClass} ${baseSection}`.trim();
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="mt-3 break-all text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title, summary }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--moeys-gold)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      {summary ? <p className="mt-2 text-sm leading-6 text-slate-500">{summary}</p> : null}
    </div>
  );
}

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({});
  const [avatarEditor, setAvatarEditor] = useState(null);
  const [isApplyingAvatar, setIsApplyingAvatar] = useState(false);

  const valueFor = (field, fallback = '') => {
    if (Object.prototype.hasOwnProperty.call(formData, field)) {
      return formData[field];
    }
    return user?.[field] || fallback;
  };

  const textValue = (field, fallback = '') => String(valueFor(field, fallback) || '');
  const avatar = textValue('avatar').trim();
  const gender = normalizeGender(valueFor('gender'), 'male');
  const profileSeed = valueFor('email') || valueFor('name') || 'user';
  const previewAvatar = avatar || generateAvatarByGender(profileSeed, gender);
  const currentRole = normalizeRole(valueFor('role') || user?.role);
  const roleCapabilities = ROLE_CAPABILITIES[currentRole] || [];
  const isStudent = currentRole === ACCOUNT_ROLES.STUDENT;
  const classLabel = formatClassLabel(textValue('class'), textValue('section'));

  const profileCards = [
    { icon: HiOutlineMail, label: 'Email', value: textValue('email') },
    { icon: HiOutlinePhone, label: 'Phone', value: textValue('phone') || 'Not added yet' },
    { icon: HiOutlineUser, label: 'Gender', value: gender === 'female' ? 'Female' : 'Male' },
    { icon: HiOutlineShieldCheck, label: 'Account Role', value: ROLE_LABELS[currentRole] },
    ...(isStudent
      ? [
          { icon: HiOutlineAcademicCap, label: 'Class', value: classLabel || 'Not assigned' },
          { icon: HiOutlineCalendar, label: 'Date of Birth', value: textValue('dateOfBirth') || 'Not added yet' },
        ]
      : []),
  ];

  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file.' });
      event.target.value = '';
      return;
    }

    const maxSizeBytes = 6000 * 1024;
    if (file.size > maxSizeBytes) {
      setMessage({ type: 'error', text: 'Image size must be 6000KB or less for reliable saving.' });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarEditor({
        src: String(reader.result || ''),
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
      setMessage({ type: 'success', text: 'Profile picture selected. Adjust it before saving.' });
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleApplyAvatar = async () => {
    if (!avatarEditor?.src) return;

    setIsApplyingAvatar(true);
    try {
      const nextAvatar = await buildAvatarFromEditor(
        avatarEditor.src,
        avatarEditor.scale,
        avatarEditor.offsetX,
        avatarEditor.offsetY
      );
      onChange('avatar', nextAvatar);
      setAvatarEditor(null);
      setMessage({ type: 'success', text: 'Profile picture updated. Click Save Profile to keep it.' });
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Could not apply image changes.' });
    } finally {
      setIsApplyingAvatar(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateProfile({
        name: textValue('name').trim(),
        email: textValue('email').trim(),
        role: normalizeRole(valueFor('role')),
        phone: textValue('phone').trim(),
        gender,
        avatar: textValue('avatar').trim(),
        dateOfBirth: textValue('dateOfBirth').trim(),
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.warning || 'Profile updated successfully.' });
        setFormData({});
      } else {
        setMessage({ type: 'error', text: result.error || 'Unable to update profile.' });
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Unable to update profile.' });
    }

    setIsSaving(false);
    setTimeout(() => setMessage(null), 3200);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef4ff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--moeys-gold)]">
              Account Center
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Profile and account settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Keep your information accurate, maintain a professional profile photo, and review the permissions attached to your school account.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Account Role</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{ROLE_LABELS[currentRole]}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Email</p>
                <p className="mt-2 truncate text-base font-semibold text-slate-900">{textValue('email')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Profile Status</p>
                <p className="mt-2 text-base font-semibold text-emerald-700">Active</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <Avatar name={valueFor('name', 'User')} src={previewAvatar} size="xl" className="h-24 w-24 ring-4 ring-slate-100" />
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{valueFor('name', 'User')}</h2>
              <p className="mt-1 text-sm text-slate-500">{textValue('email', 'No email')}</p>
              <span className="mt-3 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {ROLE_LABELS[currentRole]} Account
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Phone</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{textValue('phone') || 'Not added yet'}</p>
              </div>
              {isStudent && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Class</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{classLabel || 'Not assigned'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              eyebrow="Profile Overview"
              title="Current account information"
              summary="This section gives a quick summary of the information currently attached to your account."
            />
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {profileCards.map((card) => (
                <InfoCard key={`${card.label}-${card.value}`} icon={card.icon} label={card.label} value={card.value} />
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              eyebrow="Edit Details"
              title="Update profile information"
              summary="Make changes below, review the preview on the right, and save when everything looks correct."
            />

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field id="profile-name" label="Name">
                  <input
                    id="profile-name"
                    type="text"
                    value={textValue('name')}
                    onChange={(e) => onChange('name', e.target.value)}
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field id="profile-email" label="Email">
                  <input
                    id="profile-email"
                    type="email"
                    value={textValue('email')}
                    onChange={(e) => onChange('email', e.target.value)}
                    readOnly={isStudent}
                    className={`${inputClassName} ${isStudent ? 'cursor-not-allowed bg-slate-50 text-slate-500' : ''}`}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field id="profile-phone" label="Phone">
                  <input
                    id="profile-phone"
                    type="text"
                    value={textValue('phone')}
                    onChange={(e) => onChange('phone', e.target.value)}
                    className={inputClassName}
                    placeholder="Add your phone number"
                  />
                </Field>

                <Field id="profile-role" label="Role">
                  <select
                    id="profile-role"
                    value={normalizeRole(valueFor('role'))}
                    onChange={(e) => onChange('role', e.target.value)}
                    disabled
                    className={`${inputClassName} cursor-not-allowed bg-slate-50 text-slate-500`}
                  >
                    <option value={ACCOUNT_ROLES.ADMIN}>{ROLE_LABELS[ACCOUNT_ROLES.ADMIN]}</option>
                    <option value={ACCOUNT_ROLES.STUDENT}>{ROLE_LABELS[ACCOUNT_ROLES.STUDENT]}</option>
                    <option value={ACCOUNT_ROLES.TEACHER}>{ROLE_LABELS[ACCOUNT_ROLES.TEACHER]}</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field id="profile-gender" label="Gender">
                  <select
                    id="profile-gender"
                    value={gender}
                    onChange={(e) => onChange('gender', e.target.value)}
                    className={inputClassName}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </Field>

                {isStudent ? (
                  <Field id="profile-dob" label="Date of Birth">
                    <input
                      id="profile-dob"
                      type="date"
                      value={textValue('dateOfBirth')}
                      onChange={(e) => onChange('dateOfBirth', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>

              <Field id="profile-avatar" label="Avatar URL">
                <input
                  id="profile-avatar"
                  type="url"
                  value={textValue('avatar')}
                  onChange={(e) => onChange('avatar', e.target.value)}
                  className={inputClassName}
                  placeholder="https://..."
                />
              </Field>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4">
                <Field id="profile-avatar-upload" label="Upload From Device">
                  <input
                    id="profile-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700 hover:file:bg-slate-200"
                  />
                </Field>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Accepted: image files up to 6000KB. You will be able to reposition and zoom the image before saving.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={isSaving}>
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              eyebrow="Live Preview"
              title="How your profile appears"
              summary="Preview your current presentation before committing any changes."
            />

            <div className="mt-5 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
              <div className="flex items-center gap-4">
                <Avatar name={valueFor('name', 'User')} src={previewAvatar} size="xl" className="h-20 w-20 ring-4 ring-white shadow-md" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{valueFor('name', 'User')}</h3>
                  <p className="mt-1 text-sm text-slate-500">{textValue('email') || 'No email'}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moeys-gold)]">
                    {ROLE_LABELS[currentRole]}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Phone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{textValue('phone') || 'Not added yet'}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Gender</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{gender === 'female' ? 'Female' : 'Male'}</p>
                </div>
                {isStudent && (
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Academic Details</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {classLabel || 'No class'}{textValue('dateOfBirth') ? ` | ${textValue('dateOfBirth')}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              eyebrow="Permissions"
              title="Account capabilities"
              summary="These are the actions currently available to your account inside the portal."
            />

            <div className="mt-5 flex flex-wrap gap-2">
              {roleCapabilities.map((capability) => (
                <span
                  key={capability}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Modal
        isOpen={Boolean(avatarEditor)}
        onClose={() => !isApplyingAvatar && setAvatarEditor(null)}
        title="Adjust Profile Picture"
        maxWidth="max-w-2xl"
        preventClose={isApplyingAvatar}
      >
        {avatarEditor && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Move and zoom the image until it fits the framing you want, then apply it to your profile preview.
            </p>

            <div className="flex justify-center">
              <div className="relative h-72 w-72 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner">
                <img
                  src={avatarEditor.src}
                  alt="Avatar preview"
                  className="absolute left-1/2 top-1/2 h-full w-full max-w-none select-none object-cover"
                  style={{
                    transform: `translate(calc(-50% + ${avatarEditor.offsetX}px), calc(-50% + ${avatarEditor.offsetY}px)) scale(${avatarEditor.scale})`,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field id="avatar-zoom" label="Zoom">
                <input
                  id="avatar-zoom"
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={avatarEditor.scale}
                  onChange={(e) => setAvatarEditor((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                  className="w-full"
                />
              </Field>

              <Field id="avatar-x" label="Left / Right">
                <input
                  id="avatar-x"
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={avatarEditor.offsetX}
                  onChange={(e) => setAvatarEditor((prev) => ({ ...prev, offsetX: Number(e.target.value) }))}
                  className="w-full"
                />
              </Field>

              <Field id="avatar-y" label="Up / Down">
                <input
                  id="avatar-y"
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={avatarEditor.offsetY}
                  onChange={(e) => setAvatarEditor((prev) => ({ ...prev, offsetY: Number(e.target.value) }))}
                  className="w-full"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAvatarEditor(null)} disabled={isApplyingAvatar}>
                Cancel
              </Button>
              <Button type="button" onClick={handleApplyAvatar} loading={isApplyingAvatar}>
                Apply Image
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
