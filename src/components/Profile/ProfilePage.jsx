import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({});

  const valueFor = (field, fallback = '') => {
    if (Object.prototype.hasOwnProperty.call(formData, field)) {
      return formData[field];
    }
    return user?.[field] || fallback;
  };

  const textValue = (field, fallback = '') => String(valueFor(field, fallback) || '');
  const avatar = textValue('avatar').trim();
  const profileSeed = valueFor('email') || valueFor('name') || 'user';
  const previewAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileSeed}`;

  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file.' });
      e.target.value = '';
      return;
    }

    const maxSizeBytes = 700 * 1024;
    if (file.size > maxSizeBytes) {
      setMessage({ type: 'error', text: 'Image size must be 700KB or less for reliable saving.' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange('avatar', String(reader.result || ''));
      setMessage({ type: 'success', text: 'Profile picture selected. Click Save Profile.' });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateProfile({
        name: textValue('name').trim(),
        email: textValue('email').trim(),
        role: textValue('role').trim() || 'Teacher',
        phone: textValue('phone').trim(),
        avatar: textValue('avatar').trim(),
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
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your own account information.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={valueFor('name', 'User')} src={previewAvatar} size="lg" />
          <div>
            <p className="text-lg font-semibold text-gray-800">{valueFor('name', 'User')}</p>
            <p className="text-sm text-gray-500">{valueFor('email', 'No email')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={textValue('name')}
                onChange={(e) => onChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={textValue('email')}
                onChange={(e) => onChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                id="profile-role"
                type="text"
                value={textValue('role')}
                onChange={(e) => onChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="profile-phone"
                type="text"
                value={textValue('phone')}
                onChange={(e) => onChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-avatar" className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL
            </label>
            <input
              id="profile-avatar"
              type="url"
              value={textValue('avatar')}
              onChange={(e) => onChange('avatar', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor="profile-avatar-upload" className="block text-sm font-medium text-gray-700 mb-1">
              Upload From Device
            </label>
            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-md file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="text-xs text-gray-500 mt-1">Accepted: image files (max 700KB)</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
