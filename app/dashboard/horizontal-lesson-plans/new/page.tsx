'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ModuleTemplate {
  id: string;
  module_name: string;
  subject: string | null;
  grade_level: string | null;
  session_count: number;
  enrichment_count: number;
}

export default function NewHLPPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [subject, setSubject] = useState('');

  // Module library state
  const [modules, setModules] = useState<ModuleTemplate[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'authenticated') {
      fetchModules();
    }
  }, [status, router]);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/horizontal-lesson-plans/modules');
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules);
      } else {
        setError('Failed to load modules');
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModuleIds((prev) => {
      if (prev.includes(moduleId)) {
        return prev.filter((id) => id !== moduleId);
      } else {
        if (prev.length >= 10) {
          setError('Maximum 10 modules allowed');
          return prev;
        }
        setError('');
        return [...prev, moduleId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!schoolName.trim()) {
      setError('School name is required');
      return;
    }
    if (!teacherName.trim()) {
      setError('Teacher name is required');
      return;
    }
    if (!schoolYear.trim()) {
      setError('School year is required');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (selectedModuleIds.length === 0) {
      setError('Please select at least one module');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create HLP
      const response = await fetch('/api/horizontal-lesson-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name: schoolName,
          teacher_name: teacherName,
          school_year: schoolYear,
          subject: subject,
          selected_module_ids: selectedModuleIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create HLP');
      }

      const data = await response.json();

      // Redirect to documents page
      router.push('/dashboard/documents?tab=hlps');
    } catch (err) {
      console.error('Error creating HLP:', err);
      setError(err instanceof Error ? err.message : 'Failed to create Horizontal Lesson Plan');
      setIsSubmitting(false);
    }
  };

  // Filter modules by search query
  const filteredModules = modules.filter((module) =>
    module.module_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Create Horizontal Lesson Plan
              </h2>
              <p className="text-gray-600 mt-1">
                Select up to 10 curriculum modules for your lesson plan
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* School Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">School Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  School Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Jefferson Elementary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Teacher Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Ms. Johnson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  School Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="2025-2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Science, Math, etc."
                />
              </div>
            </div>
          </div>

          {/* Module Selection Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Select Modules ({selectedModuleIds.length}/10)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose curriculum modules to include in your lesson plan
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Module List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              {filteredModules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No modules found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredModules.map((module) => (
                    <label
                      key={module.id}
                      className="flex items-start p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModuleIds.includes(module.id)}
                        onChange={() => handleModuleToggle(module.id)}
                        className="mt-1 h-4 w-4 text-[#9333EA] focus:ring-[#9333EA] border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">
                          {module.module_name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {module.session_count} sessions • {module.enrichment_count} enrichments
                          {module.subject && ` • ${module.subject}`}
                          {module.grade_level && ` • Grade ${module.grade_level}`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || selectedModuleIds.length === 0}
              className="bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium py-2.5 px-8 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Horizontal Lesson Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
