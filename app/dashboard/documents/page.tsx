'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PacingGuide {
  id: string;
  school_name: string;
  district_name: string;
  grade_level: '7' | '8' | '9';
  first_day: string;
  last_day: string;
  created_at: string;
  current_version: number | null;
  last_repaced_at: string | null;
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

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Initialize tab state - will be updated from URL on client side
  const [activeTab, setActiveTab] = useState<'pacing-guides' | 'hlps'>('pacing-guides');

  // Update tab from URL query params on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'hlps') {
        setActiveTab('hlps');
      }
    }
  }, []);
  const [guides, setGuides] = useState<PacingGuide[]>([]);
  const [hlps, setHlps] = useState<HLP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Export options modal state
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedHlpId, setSelectedHlpId] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState({
    includeFocus: true,
    includeGoals: true,
    includeMaterials: true,
    includeTeacherPrep: true,
    includePBA: true,
    includeEnrichments: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'authenticated') {
      fetchGuides();
      fetchHLPs();
    }
  }, [status, router]);

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/pacing-guides');
      if (response.ok) {
        const data = await response.json();
        setGuides(data);
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHLPs = async () => {
    try {
      const response = await fetch('/api/horizontal-lesson-plans');
      if (response.ok) {
        const data = await response.json();
        setHlps(data.hlps);
      }
    } catch (error) {
      console.error('Error fetching HLPs:', error);
    }
  };

  const handleGenerateHLP = async (hlpId: string, options = exportOptions) => {
    setIsGenerating(hlpId);
    try {
      // Build query string with export options
      const params = new URLSearchParams({
        include_focus: options.includeFocus.toString(),
        include_goals: options.includeGoals.toString(),
        include_materials: options.includeMaterials.toString(),
        include_teacher_prep: options.includeTeacherPrep.toString(),
        include_pba: options.includePBA.toString(),
        include_enrichments: options.includeEnrichments.toString(),
      });

      const response = await fetch(`/api/horizontal-lesson-plans/${hlpId}/generate?${params}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'HLP.docx';

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating HLP:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(null);
      setShowExportOptions(false);
    }
  };

  const handleOpenExportOptions = (hlpId: string) => {
    setSelectedHlpId(hlpId);
    setShowExportOptions(true);
  };

  const handleConfirmExport = () => {
    if (selectedHlpId) {
      handleGenerateHLP(selectedHlpId, exportOptions);
    }
  };

  const handleDeleteGuide = async (guideId: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to delete the pacing guide for ${schoolName}? This will permanently delete all calendars and components.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/pacing-guides/${guideId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pacing guide');
      }

      // Refresh list
      fetchGuides();
    } catch (error) {
      console.error('Error deleting pacing guide:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleDeleteHLP = async (hlpId: string, hlpName: string) => {
    if (!confirm(`Are you sure you want to delete the lesson plan for ${hlpName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/horizontal-lesson-plans/${hlpId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete HLP');
      }

      // Refresh list
      fetchHLPs();
    } catch (error) {
      console.error('Error deleting HLP:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            My Documents
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your pacing guides and horizontal lesson plans
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pacing-guides')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pacing-guides'
                  ? 'border-[#9333EA] text-[#9333EA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pacing Guides
            </button>
            <button
              onClick={() => setActiveTab('hlps')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'hlps'
                  ? 'border-[#9333EA] text-[#9333EA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Horizontal Lesson Plans
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'pacing-guides' ? (
          <>
            {/* Create Button */}
            {guides.length > 0 && (
              <div className="mb-6 flex justify-end">
                <Link href="/dashboard/guides/new">
                  <button className="bg-[#9333EA] hover:bg-[#7c2bc9] text-white text-sm font-medium py-2.5 px-5 rounded-md transition-colors">
                    + Create Pacing Guide
                  </button>
                </Link>
              </div>
            )}

            {/* Pacing Guides Content */}
            {guides.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pacing guides yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first pacing guide
                  </p>
                  <Link href="/dashboard/guides/new">
                    <button className="bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium py-2.5 px-6 rounded-md transition-colors">
                      + Create Pacing Guide
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        District
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Re-paced
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guides.map((guide) => (
                      <tr key={guide.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/dashboard/guides/${guide.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {guide.school_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {guide.district_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {guide.grade_level}th
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(guide.first_day).toLocaleDateString()} -{' '}
                          {new Date(guide.last_day).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {guide.current_version !== null ? (
                            <span className="text-purple-600 font-medium">
                              Version {guide.current_version}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {guide.last_repaced_at ? (
                            new Date(guide.last_repaced_at).toLocaleDateString()
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(guide.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/dashboard/guides/${guide.id}`}
                            className="text-[#9333EA] hover:text-[#7c2bc9] font-medium mr-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGuide(guide.id, guide.school_name);
                            }}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* HLP Tab */
          <>
            {/* Create Button */}
            {hlps.length > 0 && (
              <div className="mb-6 flex justify-end">
                <Link href="/dashboard/horizontal-lesson-plans/new">
                  <button className="bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium py-2.5 px-6 rounded-md transition-colors">
                    + Create Horizontal Lesson Plan
                  </button>
                </Link>
              </div>
            )}

            {/* HLP Content */}
            {hlps.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No horizontal lesson plans yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first horizontal lesson plan
                  </p>
                  <Link href="/dashboard/horizontal-lesson-plans/new">
                    <button className="bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium py-2.5 px-6 rounded-md transition-colors">
                      + Create Horizontal Lesson Plan
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modules
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hlps.map((hlp) => (
                      <tr key={hlp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {hlp.school_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {hlp.teacher_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {hlp.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {hlp.school_year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="max-w-xs truncate" title={hlp.module_names.join(', ')}>
                            {hlp.module_count} module{hlp.module_count !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(hlp.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenExportOptions(hlp.id)}
                            disabled={isGenerating === hlp.id}
                            className="text-[#9333EA] hover:text-[#7c2bc9] font-medium mr-4 disabled:text-gray-400"
                          >
                            {isGenerating === hlp.id ? 'Generating...' : 'Download'}
                          </button>
                          <button
                            onClick={() => handleDeleteHLP(hlp.id, hlp.school_name)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-gray-300 pointer-events-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Export Options</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose which sections to include in your document:
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeFocus}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, includeFocus: e.target.checked })
                  }
                  className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Focus</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeGoals}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, includeGoals: e.target.checked })
                  }
                  className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Goals/Objectives</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMaterials}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, includeMaterials: e.target.checked })
                  }
                  className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Material List</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTeacherPrep}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, includeTeacherPrep: e.target.checked })
                  }
                  className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Teacher Prep</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includePBA}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, includePBA: e.target.checked })
                  }
                  className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">PBA/Assessments</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeEnrichments}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, includeEnrichments: e.target.checked })
                  }
                  className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Enrichments</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExportOptions(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                className="px-4 py-2 bg-[#9333EA] hover:bg-[#7928CA] text-white rounded-md"
              >
                Generate Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
