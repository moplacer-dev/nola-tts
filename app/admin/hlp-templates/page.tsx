'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import AdminTabs from '@/components/admin/AdminTabs';

interface HLPTemplate {
  id: string;
  module_name: string;
  subject: string | null;
  grade_level: string | null;
  is_active: boolean;
  session_count: number;
  enrichment_count: number;
  usage_count: number;
  created_at: string;
}

export default function AdminHLPTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<HLPTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchTemplates();
    }
  }, [status, session, router]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/hlp-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (templateId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/hlp-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        alert('Failed to update template status');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template status');
    }
  };

  const handleDelete = async (templateId: string, moduleName: string) => {
    if (!confirm(`Are you sure you want to delete "${moduleName}"? This will also delete all sessions and enrichments.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/hlp-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (filterSubject !== 'all' && template.subject !== filterSubject) {
      return false;
    }
    if (!showInactive && !template.is_active) {
      return false;
    }
    return true;
  });

  const subjectCounts = {
    all: templates.length,
    Math: templates.filter((t) => t.subject === 'Math').length,
    Science: templates.filter((t) => t.subject === 'Science').length,
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HLP Module Templates</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage horizontal lesson plan module templates with sessions and enrichments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#9333EA] hover:bg-[#7928CA] text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            + Create Module
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
            >
              <option value="all">All Subjects ({subjectCounts.all})</option>
              <option value="Math">Math ({subjectCounts.Math})</option>
              <option value="Science">Science ({subjectCounts.Science})</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
            />
            <label htmlFor="showInactive" className="text-sm font-medium text-gray-700 cursor-pointer">
              Show inactive templates
            </label>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrichments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No templates found
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {template.module_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {template.session_count}/7
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {template.enrichment_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {template.usage_count} HLPs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          template.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/hlp-templates/${template.id}`}
                        className="text-[#9333EA] hover:text-[#7928CA] mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggleActive(template.id, template.is_active)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {template.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredTemplates.length} of {templates.length} templates
          {!showInactive && templates.filter(t => !t.is_active).length > 0 && (
            <span className="ml-2">
              ({templates.filter(t => !t.is_active).length} inactive hidden)
            </span>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateModuleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}

// Create Module Modal Component
function CreateModuleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [moduleName, setModuleName] = useState('');
  const [subject, setSubject] = useState('Math');
  const [gradeLevel, setGradeLevel] = useState('7');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/hlp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_name: moduleName,
          subject,
          grade_level: gradeLevel,
          is_active: true,
        }),
      });

      if (response.ok) {
        const { template } = await response.json();
        // Redirect to edit page to add sessions
        window.location.href = `/admin/hlp-templates/${template.id}`;
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create module');
      }
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-gray-300 pointer-events-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Module Template</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Name *
              </label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
              >
                <option value="Math">Math</option>
                <option value="Science">Science</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
              >
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#9333EA] hover:bg-[#7928CA] text-white rounded-md disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create & Add Sessions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
