'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AdminTabs from '@/components/admin/AdminTabs';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface PacingGuide {
  id: string;
  school_name: string;
  district_name: string;
  grade_level: string;
  first_day: string;
  last_day: string;
  created_at: string;
}

interface HLP {
  id: string;
  school_name: string;
  teacher_name: string;
  school_year: string;
  subject: string;
  module_count: number;
  module_names: string[];
  created_at: string;
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function safeFilenamePart(value: string | null | undefined): string {
  if (!value) return 'unknown';
  return value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'unknown';
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminUserDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const activeUserIdRef = useRef<string>('');

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [guides, setGuides] = useState<PacingGuide[]>([]);
  const [hlps, setHlps] = useState<HLP[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      void loadUsers();
    }
  }, [status, session, router]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadDocs(userId: string) {
    activeUserIdRef.current = userId;
    setLoadingDocs(true);
    setError(null);
    setGuides([]);
    setHlps([]);
    try {
      const [guidesRes, hlpsRes] = await Promise.all([
        fetch(`/api/admin/pacing-guides?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/admin/horizontal-lesson-plans?userId=${encodeURIComponent(userId)}`),
      ]);
      if (activeUserIdRef.current !== userId) return;
      if (!guidesRes.ok) throw new Error('Failed to load pacing guides');
      if (!hlpsRes.ok) throw new Error('Failed to load horizontal lesson plans');
      const guidesData = await guidesRes.json();
      const hlpsData = await hlpsRes.json();
      if (activeUserIdRef.current !== userId) return;
      setGuides(guidesData);
      setHlps(hlpsData.hlps);
    } catch (e) {
      if (activeUserIdRef.current !== userId) return;
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      if (activeUserIdRef.current === userId) {
        setLoadingDocs(false);
      }
    }
  }

  async function exportGuideJson(guide: PacingGuide) {
    try {
      const res = await fetch(`/api/admin/pacing-guides/${guide.id}`);
      if (!res.ok) throw new Error('Failed to fetch pacing guide');
      const data = await res.json();
      const filename = `pacing-guide-${safeFilenamePart(guide.school_name)}-grade${safeFilenamePart(guide.grade_level)}.json`;
      downloadJson(filename, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export pacing guide');
    }
  }

  async function exportHlpJson(hlp: HLP) {
    try {
      const res = await fetch(`/api/admin/horizontal-lesson-plans/${hlp.id}`);
      if (!res.ok) throw new Error('Failed to fetch horizontal lesson plan');
      const data = await res.json();
      const filename = `hlp-${safeFilenamePart(hlp.school_name)}-${safeFilenamePart(hlp.teacher_name)}-${safeFilenamePart(hlp.subject)}.json`;
      downloadJson(filename, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export horizontal lesson plan');
    }
  }

  function handleUserChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedUserId(id);
    if (id) {
      void loadDocs(id);
    } else {
      setGuides([]);
      setHlps([]);
    }
  }

  if (status === 'loading' || loadingUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header />
        <AdminTabs />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'admin') return null;

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Documents</h1>
          <p className="mt-1 text-sm text-gray-600">
            Read-only view of any user&apos;s pacing guides and horizontal lesson plans.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <label htmlFor="user-picker" className="block text-sm font-medium text-gray-700 mb-2">
            Select user
          </label>
          <select
            id="user-picker"
            value={selectedUserId}
            onChange={handleUserChange}
            className="block w-full max-w-md border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
          >
            <option value="">— Pick a user —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-sm">
            {error}
          </div>
        )}

        {loadingDocs && (
          <p className="text-gray-600 text-sm">Loading documents…</p>
        )}

        {!loadingDocs && selectedUser && (
          <>
            {/* Pacing Guides */}
            <section className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pacing Guides ({guides.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Owned by {selectedUser.name}
                </p>
              </div>
              {guides.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">No pacing guides.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guides.map((g) => (
                      <tr key={g.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{g.school_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{g.district_name || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{g.grade_level}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(g.first_day)} – {formatDate(g.last_day)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(g.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => exportGuideJson(g)}
                            className="text-[#9333EA] hover:text-[#7928CA] cursor-pointer"
                          >
                            Export JSON
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* HLPs */}
            <section className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Horizontal Lesson Plans ({hlps.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Owned by {selectedUser.name}
                </p>
              </div>
              {hlps.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">No horizontal lesson plans.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hlps.map((h) => (
                      <tr key={h.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{h.school_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.teacher_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.school_year}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {h.module_count} ({h.module_names.filter(Boolean).join(', ') || '—'})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(h.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => exportHlpJson(h)}
                            className="text-[#9333EA] hover:text-[#7928CA] cursor-pointer"
                          >
                            Export JSON
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
