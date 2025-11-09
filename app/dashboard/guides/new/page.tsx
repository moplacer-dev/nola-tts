'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ExtractedEvent } from '@/lib/pdf-calendar-extractor';

type WizardStep = 1 | 2 | 3;

export default function NewGuidePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [guideId, setGuideId] = useState<string>('');

  // School Information (Step 1)
  const [formData, setFormData] = useState({
    grade_level: '7',
    school_name: '',
    district_name: '',
    first_day: '',
    last_day: '',
  });

  // PDF Upload (Step 2)
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'pdf' | 'manual' | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const [extractionNotes, setExtractionNotes] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Step 1: Create pacing guide with school info
  const handleStep1Submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/pacing-guides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create pacing guide');
      }

      const guide = await response.json();
      setGuideId(guide.id);

      // Move to Step 2
      setCurrentStep(2);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  // Handle PDF file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setPdfFile(file);
      setError('');
    }
  };

  // Step 2: Upload and extract PDF
  const handlePDFUpload = async () => {
    if (!pdfFile || !guideId) return;

    setError('');
    setIsExtracting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pdf', pdfFile);

      const response = await fetch(`/api/pacing-guides/${guideId}/import-calendar`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();

        // Handle rate limit errors with helpful message
        if (response.status === 429) {
          const errorMessage = `${data.error || 'Rate limit reached'}\n\n${data.details || ''}\n\n💡 ${data.suggestion || 'Please try again later.'}`;
          throw new Error(errorMessage);
        }

        throw new Error(data.error || 'Failed to extract calendar events');
      }

      const result = await response.json();
      setExtractedEvents(result.events);
      setExtractionNotes(result.extraction_notes || '');

      // Auto-select all extracted events by default
      setSelectedEvents(new Set(result.events.map((_: any, i: number) => i)));

      // Move to Step 3 (Review) - then Step 4 will be auto-populate
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsExtracting(false);
    }
  };

  // Skip to manual building (redirect to calendar view)
  const handleSkipToManual = () => {
    router.push(`/dashboard/guides/${guideId}`);
  };

  // Step 3: Add selected events to calendar
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const toggleEventSelection = (index: number) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEvents(newSelected);
  };

  const toggleAllEvents = () => {
    if (selectedEvents.size === extractedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(extractedEvents.map((_, i) => i)));
    }
  };

  const updateEvent = (index: number, field: keyof ExtractedEvent, value: any) => {
    const updatedEvents = [...extractedEvents];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    setExtractedEvents(updatedEvents);
  };

  const removeEvent = (index: number) => {
    setExtractedEvents(extractedEvents.filter((_, i) => i !== index));
    selectedEvents.delete(index);
  };

  const handleAddEventsToCalendar = async () => {
    setError('');
    setIsSaving(true);

    try {
      const eventsToAdd = Array.from(selectedEvents).map(i => extractedEvents[i]);

      // DEBUG: Log what we're about to send
      console.log('=== DEBUG: Starting to add events to calendar ===');
      console.log(`Total selected events: ${selectedEvents.size}`);
      console.log(`Events to add: ${eventsToAdd.length}`);
      console.log('Event details:', eventsToAdd.map((e, i) => ({
        index: i,
        name: e.event_name,
        date: e.start_date,
        type: e.event_type,
        duration: e.duration_days,
        color: e.suggested_color,
        blocks_curriculum: e.blocks_curriculum
      })));

      // Create base calendar events directly (V2)
      // We use a dedicated endpoint for AI-extracted events that respects exact duration
      const response = await fetch(`/api/pacing-guides/${guideId}/add-extracted-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: eventsToAdd
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add events');
      }

      const result = await response.json();
      console.log(`=== SUCCESS: ${result.count} events saved to database ===`);

      // Redirect to calendar view
      router.push(`/dashboard/guides/${guideId}`);
    } catch (err) {
      console.error('=== ERROR: Failed to add events ===', err);
      setError(err instanceof Error ? err.message : 'Failed to add events');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Create New Pacing Guide
              </h2>
              <p className="text-gray-600 mt-1">
                {currentStep === 1 && 'Enter your school information'}
                {currentStep === 2 && 'Upload your school calendar or build manually'}
                {currentStep === 3 && 'Review and confirm extracted events'}
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

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-[#9333EA]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${currentStep >= 1 ? 'bg-[#9333EA] text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">School Info</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-[#9333EA]' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${currentStep >= 2 ? 'text-[#9333EA]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${currentStep >= 2 ? 'bg-[#9333EA] text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Calendar Setup</span>
            </div>
            {uploadMethod === 'pdf' && (
              <>
                <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-[#9333EA]' : 'bg-gray-200'}`} />
                <div className={`flex items-center ${currentStep >= 3 ? 'text-[#9333EA]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${currentStep >= 3 ? 'bg-[#9333EA] text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Review Events</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Step 1: School Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Grade Level
                </label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900"
                >
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                </select>
              </div>

              <div>
                <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  School Name
                </label>
                <input
                  id="school_name"
                  name="school_name"
                  type="text"
                  value={formData.school_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900"
                  placeholder="Enter school name"
                />
              </div>

              <div>
                <label htmlFor="district_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  District Name <span className="text-gray-500 text-xs font-normal">(optional)</span>
                </label>
                <input
                  id="district_name"
                  name="district_name"
                  type="text"
                  value={formData.district_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900"
                  placeholder="Enter district name (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_day" className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Day of School
                  </label>
                  <input
                    id="first_day"
                    name="first_day"
                    type="date"
                    value={formData.first_day}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="last_day" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Day of School
                  </label>
                  <input
                    id="last_day"
                    name="last_day"
                    type="date"
                    value={formData.last_day}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Calendar Setup */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How would you like to set up your calendar?
              </h3>
              <p className="text-gray-600">
                Upload a PDF of your school calendar for automatic extraction, or build manually
              </p>
            </div>

            {/* Upload PDF Option - Centered */}
            <div className="max-w-2xl mx-auto">
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#9333EA] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Upload PDF Calendar</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Let AI automatically extract events from your school calendar
                  </p>

                  <div className="space-y-4">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      id="pdf-upload"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Upload button */}
                    <button
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                      className="w-full px-4 py-2 border-2 border-[#9333EA] text-[#9333EA] font-medium rounded-md hover:bg-purple-50 transition-colors"
                    >
                      Choose PDF File
                    </button>

                    {pdfFile && (
                      <>
                        <div className="text-sm text-gray-700">
                          Selected: {pdfFile.name}
                        </div>
                        <button
                          onClick={handlePDFUpload}
                          disabled={isExtracting}
                          className="w-full px-4 py-2 bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExtracting ? 'Extracting Events...' : 'Extract Calendar Events'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mt-6 whitespace-pre-line">
                {error}
              </div>
            )}

            {/* Build Manually Button - Lower Right */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSkipToManual}
                className="px-4 py-2 border-2 border-[#9333EA] text-[#9333EA] font-medium rounded-md hover:bg-purple-50 transition-colors"
              >
                Build Manually
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Extracted Events */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Extracted {extractedEvents.length} Calendar Events
                </h3>
                <p className="text-sm text-gray-600">
                  Review, edit, and select which events to add to your calendar
                </p>
                {extractionNotes && (
                  <div className="mt-3 text-sm bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded">
                    <strong>Note:</strong> {extractionNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 pl-6 pr-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                        <input
                          type="checkbox"
                          checked={selectedEvents.size === extractedEvents.length}
                          onChange={toggleAllEvents}
                          className="rounded border-gray-300 text-[#9333EA] focus:ring-[#9333EA]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-48">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {extractedEvents.map((event, index) => (
                      <tr key={index} className={selectedEvents.has(index) ? 'bg-purple-50' : 'hover:bg-gray-50'}>
                        <td className="py-3 pl-6 pr-3">
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(index)}
                            onChange={() => toggleEventSelection(index)}
                            className="rounded border-gray-300 text-[#9333EA] focus:ring-[#9333EA]"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={event.event_name}
                            onChange={(e) => updateEvent(index, 'event_name', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#9333EA] text-gray-900"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="date"
                            value={event.start_date}
                            onChange={(e) => updateEvent(index, 'start_date', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#9333EA] text-gray-900 font-sans"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            min="1"
                            value={event.duration_days}
                            onChange={(e) => updateEvent(index, 'duration_days', parseInt(e.target.value))}
                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#9333EA] text-gray-900"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end items-center">
              <button
                onClick={handleAddEventsToCalendar}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Adding Events...' : selectedEvents.size > 0 ? `Add ${selectedEvents.size} Events & Continue` : 'Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
