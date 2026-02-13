import React, { useMemo, useState } from 'react';

import { HiOutlinePaperAirplane } from 'react-icons/hi';

import Badge from '../common/Badge';
import Button from '../common/Button';

const initialMessages = [
  {
    id: 1,
    audience: 'All Students',
    channel: 'SMS',
    subject: 'Attendance Reminder',
    body: 'Please check in before first period starts.',
    sentAt: '2026-02-12 07:30',
  },
  {
    id: 2,
    audience: 'Grade 10 Parents',
    channel: 'Email',
    subject: 'Parent Meeting',
    body: 'Meeting scheduled this Friday at 4:00 PM.',
    sentAt: '2026-02-11 16:00',
  },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [form, setForm] = useState({
    audience: 'All Students',
    channel: 'SMS',
    subject: '',
    body: '',
  });
  const [notification, setNotification] = useState(null);

  const stats = useMemo(() => ({
    total: messages.length,
    sms: messages.filter((m) => m.channel === 'SMS').length,
    email: messages.filter((m) => m.channel === 'Email').length,
  }), [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;

    const now = new Date();
    const sentAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg = {
      id: Date.now(),
      audience: form.audience,
      channel: form.channel,
      subject: form.subject.trim(),
      body: form.body.trim(),
      sentAt,
    };

    setMessages((prev) => [newMsg, ...prev]);
    setForm({ audience: 'All Students', channel: 'SMS', subject: '', body: '' });
    setNotification('Message sent successfully.');
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="rounded-lg px-4 py-3 text-sm bg-green-50 text-green-700 border border-green-200">
          {notification}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">SMS/Mail</h1>
        <p className="text-sm text-gray-500 mt-1">
          Send announcements and messages to students and parents.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Sent</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.sms}</p>
          <p className="text-xs text-gray-500 mt-1">SMS</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.email}</p>
          <p className="text-xs text-gray-500 mt-1">Email</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Compose Message</h2>
        <form onSubmit={sendMessage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.audience}
              onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option>All Students</option>
              <option>All Parents</option>
              <option>Grade 9 Students</option>
              <option>Grade 10 Parents</option>
              <option>Grade 11 Students</option>
              <option>Grade 12 Parents</option>
            </select>
            <select
              value={form.channel}
              onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option>SMS</option>
              <option>Email</option>
            </select>
          </div>

          <input
            value={form.subject}
            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
            placeholder="Subject"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="Write your message..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          <div className="flex justify-end">
            <Button type="submit" icon={HiOutlinePaperAirplane}>Send</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Messages</h2>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-800">{msg.subject}</p>
                <Badge variant={msg.channel === 'SMS' ? 'info' : 'success'}>{msg.channel}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">To: {msg.audience}</p>
              <p className="text-sm text-gray-600 mt-2">{msg.body}</p>
              <p className="text-xs text-gray-400 mt-2">Sent: {msg.sentAt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
