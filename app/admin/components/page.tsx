'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import CreateComponentModal from '@/components/admin/CreateComponentModal';
import EditComponentModal from '@/components/admin/EditComponentModal';

interface ComponentTemplate {
  id: string;
  component_key: string;
  subject: string;
  display_name: string;
  default_duration_days: number;
  color: string;
  description: string | null;
  is_active: boolean;
  user_id: string | null;
  metadata: any;
  created_at: string;
  creator_name: string;
  usage_count: number;
}

export default function AdminComponentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<ComponentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all'); // all, system, user
  const [showInactive, setShowInactive] = useState(false); // Hide inactive by default
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentTemplate | null>(null);

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
      const response = await fetch('/api/v2/admin/component-templates');
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
      const response = await fetch(`/api/v2/admin/component-templates/${templateId}`, {
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

  const filteredTemplates = templates.filter((template) => {
    if (filterSubject !== 'all' && template.subject !== filterSubject) {
      return false;
    }
    if (filterType === 'system' && template.user_id !== null) {
      return false;
    }
    if (filterType === 'user' && template.user_id === null) {
      return false;
    }
    // Hide inactive templates unless showInactive is true
    if (!showInactive && !template.is_active) {
      return false;
    }
    return true;
  });

  const subjectCounts = {
    all: templates.length,
    base: templates.filter((t) => t.subject === 'base').length,
    ela: templates.filter((t) => t.subject === 'ela').length,
    math: templates.filter((t) => t.subject === 'math').length,
    science: templates.filter((t) => t.subject === 'science').length,
    social_studies: templates.filter((t) => t.subject === 'social_studies').length,
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

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <Link
              href="/admin/users"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              User Management
            </Link>
            <Link
              href="/admin/components"
              className="border-b-2 border-[#9333EA] text-[#9333EA] py-4 px-1 text-sm font-medium"
            >
              Component Templates
            </Link>
            <Link
              href="/admin/hlp-templates"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              HLP Module Templates
            </Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Component Templates</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage system component templates across all subjects
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#9333EA] hover:bg-[#7928CA] text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            + Create Component
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
              <option value="base">Base ({subjectCounts.base})</option>
              <option value="ela">ELA ({subjectCounts.ela})</option>
              <option value="math">Math ({subjectCounts.math})</option>
              <option value="science">Science ({subjectCounts.science})</option>
              <option value="social_studies">Social Studies ({subjectCounts.social_studies})</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
            >
              <option value="all">All Templates</option>
              <option value="system">System Only</option>
              <option value="user">User-Created Only</option>
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
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creator
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
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No templates found
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: template.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.display_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {template.subject.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {template.default_duration_days}d
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {template.creator_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {template.usage_count} uses
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
                      <button
                        onClick={() => setEditingComponent(template)}
                        className="text-[#9333EA] hover:text-[#7928CA] mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleToggleActive(template.id, template.is_active)
                        }
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
        <CreateComponentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTemplates();
          }}
        />
      )}

      {editingComponent && (
        <EditComponentModal
          component={editingComponent}
          onClose={() => setEditingComponent(null)}
          onSuccess={() => {
            setEditingComponent(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}
