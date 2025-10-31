'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface Template {
  id: string;
  module_name: string;
  subject: string | null;
  grade_level: string | null;
  is_active: boolean;
}

interface Session {
  id: string;
  session_number: number;
  focus: string;
  objectives: string;
  materials: string | null;
  teacher_prep: string | null;
  assessments: string | null;
}

interface Enrichment {
  id: string;
  enrichment_number: number;
  title: string;
  description: string;
}

export default function EditHLPTemplatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrichments, setEnrichments] = useState<Enrichment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'sessions' | 'enrichments'>('info');

  // Refs for scrolling
  const sessionFormRef = useRef<HTMLDivElement>(null);
  const enrichmentFormRef = useRef<HTMLDivElement>(null);

  // Module info state
  const [moduleName, setModuleName] = useState('');
  const [subject, setSubject] = useState('Math');
  const [gradeLevel, setGradeLevel] = useState('7');

  // Session editing state
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState({
    session_number: 1,
    focus: '',
    objectives: '',
    materials: '',
    teacher_prep: '',
    assessments: '',
  });

  // Enrichment editing state
  const [editingEnrichment, setEditingEnrichment] = useState<number | null>(null);
  const [enrichmentForm, setEnrichmentForm] = useState({
    enrichment_number: 1,
    title: '',
    description: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchTemplate();
    }
  }, [status, session, router]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/hlp-templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
        setModuleName(data.template.module_name);
        setSubject(data.template.subject || 'Math');
        setGradeLevel(data.template.grade_level || '7');
        setSessions(data.sessions || []);
        setEnrichments(data.enrichments || []);
      } else {
        alert('Failed to fetch template');
        router.push('/admin/hlp-templates');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Failed to fetch template');
      router.push('/admin/hlp-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModule = async () => {
    try {
      const response = await fetch(`/api/admin/hlp-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_name: moduleName,
          subject,
          grade_level: gradeLevel,
        }),
      });

      if (response.ok) {
        alert('Module updated successfully');
        fetchTemplate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update module');
      }
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Failed to update module');
    }
  };

  const handleSaveSession = async () => {
    try {
      const response = await fetch(`/api/admin/hlp-templates/${templateId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      });

      if (response.ok) {
        alert('Session saved successfully');
        setEditingSession(null);
        setSessionForm({
          session_number: 1,
          focus: '',
          objectives: '',
          materials: '',
          teacher_prep: '',
          assessments: '',
        });
        fetchTemplate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session');
    }
  };

  const handleDeleteSession = async (sessionNumber: number) => {
    if (!confirm(`Delete Session ${sessionNumber}?`)) return;

    try {
      const response = await fetch(
        `/api/admin/hlp-templates/${templateId}/sessions?session_number=${sessionNumber}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchTemplate();
      } else {
        alert('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const handleSaveEnrichment = async () => {
    try {
      const response = await fetch(`/api/admin/hlp-templates/${templateId}/enrichments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichmentForm),
      });

      if (response.ok) {
        alert('Enrichment saved successfully');
        setEditingEnrichment(null);
        setEnrichmentForm({
          enrichment_number: 1,
          title: '',
          description: '',
        });
        fetchTemplate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save enrichment');
      }
    } catch (error) {
      console.error('Error saving enrichment:', error);
      alert('Failed to save enrichment');
    }
  };

  const handleDeleteEnrichment = async (enrichmentNumber: number) => {
    if (!confirm(`Delete Enrichment ${enrichmentNumber}?`)) return;

    try {
      const response = await fetch(
        `/api/admin/hlp-templates/${templateId}/enrichments?enrichment_number=${enrichmentNumber}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchTemplate();
      } else {
        alert('Failed to delete enrichment');
      }
    } catch (error) {
      console.error('Error deleting enrichment:', error);
      alert('Failed to delete enrichment');
    }
  };

  const startEditSession = (sessionNumber: number) => {
    const existing = sessions.find((s) => s.session_number === sessionNumber);
    if (existing) {
      setSessionForm({
        session_number: existing.session_number,
        focus: existing.focus,
        objectives: existing.objectives,
        materials: existing.materials || '',
        teacher_prep: existing.teacher_prep || '',
        assessments: existing.assessments || '',
      });
    } else {
      setSessionForm({
        session_number: sessionNumber,
        focus: '',
        objectives: '',
        materials: '',
        teacher_prep: '',
        assessments: '',
      });
    }
    setEditingSession(sessionNumber);

    // Scroll to the form after state updates
    setTimeout(() => {
      sessionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const startEditEnrichment = (enrichmentNumber?: number) => {
    if (enrichmentNumber) {
      const existing = enrichments.find((e) => e.enrichment_number === enrichmentNumber);
      if (existing) {
        setEnrichmentForm({
          enrichment_number: existing.enrichment_number,
          title: existing.title,
          description: existing.description,
        });
      }
    } else {
      // New enrichment
      const nextNumber = enrichments.length > 0
        ? Math.max(...enrichments.map(e => e.enrichment_number)) + 1
        : 1;
      setEnrichmentForm({
        enrichment_number: nextNumber,
        title: '',
        description: '',
      });
    }
    setEditingEnrichment(enrichmentNumber || -1);

    // Scroll to the form after state updates
    setTimeout(() => {
      enrichmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

  if (session?.user?.role !== 'admin' || !template) {
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
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Component Templates
            </Link>
            <Link
              href="/admin/hlp-templates"
              className="border-b-2 border-[#9333EA] text-[#9333EA] py-4 px-1 text-sm font-medium"
            >
              HLP Module Templates
            </Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/admin/hlp-templates"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Templates
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{template.module_name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Edit module template, sessions, and enrichments
          </p>
        </div>

        {/* Sub Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'info'
                  ? 'border-[#9333EA] text-[#9333EA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Module Info
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'sessions'
                  ? 'border-[#9333EA] text-[#9333EA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sessions ({sessions.length}/7)
            </button>
            <button
              onClick={() => setActiveTab('enrichments')}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'enrichments'
                  ? 'border-[#9333EA] text-[#9333EA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Enrichments ({enrichments.length})
            </button>
          </nav>
        </div>

        {/* Module Info Tab */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Information</h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
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
              <button
                onClick={handleUpdateModule}
                className="px-4 py-2 bg-[#9333EA] hover:bg-[#7928CA] text-white rounded-md"
              >
                Save Module Info
              </button>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Sessions (7 Required)</h2>
              </div>

              {/* Session List */}
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const session = sessions.find((s) => s.session_number === num);
                  return (
                    <div
                      key={num}
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">Session {num}</h3>
                          {session ? (
                            <div className="mt-2 text-sm text-gray-600">
                              <p><strong>Focus:</strong> {session.focus}</p>
                              <p className="mt-1">
                                <strong>Objectives:</strong>{' '}
                                {session.objectives.substring(0, 100)}
                                {session.objectives.length > 100 && '...'}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-red-600">Not configured</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditSession(num)}
                            className="text-[#9333EA] hover:text-[#7928CA] text-sm"
                          >
                            {session ? 'Edit' : 'Add'}
                          </button>
                          {session && (
                            <button
                              onClick={() => handleDeleteSession(num)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Edit Form */}
            {editingSession !== null && (
              <div ref={sessionFormRef} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Edit Session {editingSession}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Focus *
                    </label>
                    <input
                      type="text"
                      value={sessionForm.focus}
                      onChange={(e) => setSessionForm({ ...sessionForm, focus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goals/Objectives * (use \n for line breaks)
                    </label>
                    <textarea
                      value={sessionForm.objectives}
                      onChange={(e) => setSessionForm({ ...sessionForm, objectives: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Materials
                    </label>
                    <textarea
                      value={sessionForm.materials}
                      onChange={(e) => setSessionForm({ ...sessionForm, materials: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher Prep
                    </label>
                    <textarea
                      value={sessionForm.teacher_prep}
                      onChange={(e) => setSessionForm({ ...sessionForm, teacher_prep: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessments (PBA)
                    </label>
                    <textarea
                      value={sessionForm.assessments}
                      onChange={(e) => setSessionForm({ ...sessionForm, assessments: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveSession}
                      className="px-4 py-2 bg-[#9333EA] hover:bg-[#7928CA] text-white rounded-md"
                    >
                      Save Session
                    </button>
                    <button
                      onClick={() => setEditingSession(null)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enrichments Tab */}
        {activeTab === 'enrichments' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Enrichments</h2>
                <button
                  onClick={() => startEditEnrichment()}
                  className="px-4 py-2 bg-[#9333EA] hover:bg-[#7928CA] text-white rounded-md"
                >
                  + Add Enrichment
                </button>
              </div>

              {/* Enrichment List */}
              {enrichments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No enrichments yet</p>
              ) : (
                <div className="space-y-3">
                  {enrichments.map((enrichment) => (
                    <div
                      key={enrichment.id}
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            Enrichment {enrichment.enrichment_number}: {enrichment.title}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600">
                            {enrichment.description.substring(0, 150)}
                            {enrichment.description.length > 150 && '...'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditEnrichment(enrichment.enrichment_number)}
                            className="text-[#9333EA] hover:text-[#7928CA] text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEnrichment(enrichment.enrichment_number)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enrichment Edit Form */}
            {editingEnrichment !== null && (
              <div ref={enrichmentFormRef} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingEnrichment === -1 ? 'Add' : 'Edit'} Enrichment
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enrichment Number *
                    </label>
                    <input
                      type="number"
                      value={enrichmentForm.enrichment_number}
                      onChange={(e) =>
                        setEnrichmentForm({ ...enrichmentForm, enrichment_number: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={enrichmentForm.title}
                      onChange={(e) => setEnrichmentForm({ ...enrichmentForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={enrichmentForm.description}
                      onChange={(e) => setEnrichmentForm({ ...enrichmentForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEnrichment}
                      className="px-4 py-2 bg-[#9333EA] hover:bg-[#7928CA] text-white rounded-md"
                    >
                      Save Enrichment
                    </button>
                    <button
                      onClick={() => setEditingEnrichment(null)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
