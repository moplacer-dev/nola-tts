'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ComponentLibrary from '@/components/ComponentLibrary';
import EditComponentModal from '@/components/EditComponentModal';
import EditEventModal from '@/components/EditEventModal';
import ExportDropdown from '@/components/ExportDropdown';
import BulkAdjustModal from '@/components/BulkAdjustModal';

interface CalendarEvent {
  id: string;
  event_name: string;
  start_date: string;
  duration_days: number;
  event_type: string;
  is_base_event: boolean;
  color?: string;
  blocks_curriculum?: boolean;
}

interface ScheduledComponent {
  id: string;
  subject_calendar_id: string;
  component_key: string;
  subject: string;
  start_date: string;
  duration_days: number;
  title_override: string | null;
  order: number;
  notes: string | null;
  display_name: string;
  color: string;
  group_id?: string | null;
  display_order: number;
}

interface SubjectCalendar {
  id: string;
  subject: string;
  created_at: string;
}

interface PacingGuide {
  id: string;
  school_name: string;
  district_name: string;
  grade_level: string;
  first_day: string;
  last_day: string;
  calendars: SubjectCalendar[];
  events: CalendarEvent[];
  scheduled_components?: ScheduledComponent[];
}

interface Week {
  weekNumber: number;
  startDate: Date;
  days: Date[];
}

export default function GuideViewPage() {
  const router = useRouter();
  const params = useParams();
  const [guide, setGuide] = useState<PacingGuide | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('base');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [scheduledComponents, setScheduledComponents] = useState<ScheduledComponent[]>([]);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<{
    duration: number;
    isExisting: boolean;
    groupComponents?: Array<{ start_date: string; duration_days: number }>;
  } | null>(null);
  const [editingComponent, setEditingComponent] = useState<ScheduledComponent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());

  // Helper functions for selection
  const isSelected = (componentId: string) => selectedComponents.has(componentId);

  const toggleSelection = (componentId: string, ctrlKey: boolean = false) => {
    const newSelection = new Set(selectedComponents);

    if (ctrlKey) {
      // Add to selection (Cmd/Ctrl+Click)
      if (newSelection.has(componentId)) {
        newSelection.delete(componentId);
      } else {
        newSelection.add(componentId);
      }
    } else {
      // Single select (replace selection)
      if (newSelection.size === 1 && newSelection.has(componentId)) {
        // Clicking selected item deselects it
        newSelection.clear();
      } else {
        newSelection.clear();
        newSelection.add(componentId);
      }
    }

    setSelectedComponents(newSelection);
  };

  const clearSelection = () => setSelectedComponents(new Set());

  const handleBulkDelete = async () => {
    if (selectedComponents.size === 0) return;

    const confirmMessage = `Delete ${selectedComponents.size} component${selectedComponents.size !== 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduled-components/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component_ids: Array.from(selectedComponents)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete components');
      }

      // Refresh guide data
      await fetchGuide();

      // Clear selection
      clearSelection();

      // Success is visually obvious - no alert needed
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete components. Please try again.');
    }
  };

  const fetchGuide = async () => {
    try {
      const response = await fetch(`/api/pacing-guides/${params.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch guide');
      }

      const data = await response.json();
      setGuide(data);

      // Calculate weeks
      const calculatedWeeks = calculateWeeks(data.first_day, data.last_day);
      setWeeks(calculatedWeeks);

      // Fetch scheduled components
      if (data.scheduled_components) {
        setScheduledComponents(data.scheduled_components);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuide();
  }, [params.id]);

  // Keyboard shortcuts for selection actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace - Delete selected components
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponents.size > 0) {
        // Don't trigger if user is typing in an input field
        if ((e.target as HTMLElement).tagName === 'INPUT' ||
            (e.target as HTMLElement).tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        handleBulkDelete();
      }

      // Escape - Clear selection
      if (e.key === 'Escape' && selectedComponents.size > 0) {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponents]);

  // Calculate weeks between first and last day of school
  const calculateWeeks = (firstDay: string, lastDay: string): Week[] => {
    const start = new Date(firstDay);
    const end = new Date(lastDay);
    const weeks: Week[] = [];

    // Find the Monday of the first week (or use start date if it's a Monday)
    let currentWeekStart = new Date(start);
    const dayOfWeek = currentWeekStart.getDay();

    // Adjust to Monday (0 = Sunday, 1 = Monday)
    if (dayOfWeek !== 1) {
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
      currentWeekStart.setDate(currentWeekStart.getDate() + daysUntilMonday);
    }

    let weekNumber = 1;

    while (currentWeekStart <= end) {
      const days: Date[] = [];

      // Generate Monday through Friday for this week
      for (let i = 0; i < 5; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + i);
        days.push(day);
      }

      weeks.push({
        weekNumber,
        startDate: new Date(currentWeekStart),
        days,
      });

      // Move to next Monday
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }

    return weeks;
  };

  // Helper function to add school days (skipping weekends)
  const addSchoolDays = (startDate: Date, numDays: number): Date => {
    const result = new Date(startDate);
    let daysAdded = 0;

    // Add days AFTER the start date (don't count start date in the loop)
    while (daysAdded < numDays) {
      result.setDate(result.getDate() + 1); // Move to next day first
      const dayOfWeek = result.getDay();
      // Only count Mon-Fri (1-5)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }

    return result;
  };

  // Helper function to check if a date is a school day (Mon-Fri)
  const isSchoolDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday (0) or Saturday (6)
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!guide) return [];

    return guide.events.filter((event) => {
      const eventStart = new Date(event.start_date);
      // Calculate end date by adding school days only
      const eventEnd = addSchoolDays(eventStart, event.duration_days - 1);

      // Check if date falls within the range and is a school day
      return isSchoolDay(date) && date >= eventStart && date <= eventEnd;
    });
  };

  // Get scheduled components for a specific date and subject
  const getComponentsForDate = (date: Date): ScheduledComponent[] => {
    if (!guide) return [];

    const currentCalendar = guide.calendars.find(cal => cal.subject === selectedSubject);
    if (!currentCalendar) return [];

    return scheduledComponents.filter((component) => {
      const componentStart = new Date(component.start_date);
      // Calculate end date by adding school days only
      const componentEnd = addSchoolDays(componentStart, component.duration_days - 1);

      // Check if date falls within the range and is a school day
      return component.subject_calendar_id === currentCalendar.id &&
             isSchoolDay(date) &&
             date >= componentStart &&
             date <= componentEnd;
    });
  };

  // Check if a date has a blocked curriculum event (only for subject calendars, not base)
  const isBlockedCurriculumDate = (date: Date): boolean => {
    if (!guide || selectedSubject === 'base') return false;

    const events = getEventsForDate(date);
    return events.some(event => event.blocks_curriculum === true);
  };

  // Handle component drop
  const handleDrop = async (date: Date, e: React.DragEvent) => {
    e.preventDefault();

    try {
      // Check if we're moving an existing component
      const existingComponentData = e.dataTransfer.getData('existing-component');

      if (existingComponentData) {
        // Moving an existing component (only for subject calendars, not base)
        const existingComponent = JSON.parse(existingComponentData);

        // Check if this component is part of a group (multi-component)
        if (existingComponent.group_id) {
          // Moving a grouped component - delete old and recreate at new location
          // This ensures it re-applies the template logic (skipping blocked dates)
          const groupComponents = scheduledComponents.filter(
            c => c.group_id === existingComponent.group_id
          );

          // Store the component info we need to recreate it
          const componentKey = existingComponent.component_key;
          const subjectCalendarId = existingComponent.subject_calendar_id;
          const subject = existingComponent.subject;

          // Delete all components in the group
          const deletePromises = groupComponents.map(component =>
            fetch(`/api/scheduled-components/${component.id}`, { method: 'DELETE' })
          );

          const deleteResponses = await Promise.all(deletePromises);

          if (!deleteResponses.every(r => r.ok)) {
            throw new Error('Failed to delete group components');
          }

          // Remove from state immediately
          setScheduledComponents(scheduledComponents.filter(c => c.group_id !== existingComponent.group_id));

          // Recreate the component at the new location (this will use POST logic with blocked date skipping)
          const response = await fetch('/api/scheduled-components', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject_calendar_id: subjectCalendarId,
              component_key: componentKey,
              subject: subject,
              start_date: formatDate(date),
              duration_days: 1, // Not used for multi-component templates
              title_override: null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            // If this is a blocked curriculum date error, show the specific message
            if (errorData.blocked_dates) {
              alert(errorData.message);
              // Re-fetch to restore the deleted components if creation failed
              await fetchGuide();
              return;
            }
            throw new Error('Failed to recreate group component');
          }

          const newComponents = await response.json();
          const componentsToAdd = Array.isArray(newComponents) ? newComponents : [newComponents];

          // Add the new components to state
          setScheduledComponents(prev => [...prev, ...componentsToAdd]);
        } else {
          // Single component move
          const response = await fetch(`/api/scheduled-components/${existingComponent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              start_date: formatDate(date),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            // If this is a blocked curriculum date error, show the specific message
            if (errorData.blocked_dates) {
              alert(errorData.message);
              return;
            }
            throw new Error('Failed to move component');
          }

          const updatedComponent = await response.json();

          // Update in state - use the full updated component from API to preserve all fields including color
          setScheduledComponents(scheduledComponents.map(c =>
            c.id === updatedComponent.id
              ? updatedComponent
              : c
          ));
        }
      } else {
        // Adding a new component from the library
        const componentData = e.dataTransfer.getData('component');
        if (!componentData) return;

        const template = JSON.parse(componentData);

        // BASE CALENDAR: Create calendar event (syncs across all calendars)
        if (selectedSubject === 'base') {
          // Determine if this event should block curriculum scheduling by default
          const shouldBlockCurriculum = (name: string): boolean => {
            const lowerName = name.toLowerCase();
            const blockingKeywords = [
              'break', 'winter break', 'spring break', 'thanksgiving',
              'no school', 'half day', 'holiday',
              'labor day', 'mlk', 'martin luther king', 'veterans day', 'memorial day',
              'presidents', 'juneteenth', 'election day',
              'first day for students', 'last day for students'
            ];
            return blockingKeywords.some(keyword => lowerName.includes(keyword));
          };

          const response = await fetch('/api/calendar-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pacing_guide_id: guide?.id,
              event_name: template.display_name,
              event_type: 'other', // Default type, user can edit
              start_date: formatDate(date),
              duration_days: template.default_duration_days,
              color: template.color, // Use template color
              blocks_curriculum: shouldBlockCurriculum(template.display_name),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create calendar event');
          }

          // Refresh the entire guide to show the new event on all calendars
          await fetchGuide();
        } else {
          // SUBJECT CALENDAR: Create scheduled component
          const currentCalendar = guide?.calendars.find(cal => cal.subject === selectedSubject);

          if (!currentCalendar) {
            alert('No calendar found for this subject');
            return;
          }

          // Create scheduled component
          const response = await fetch('/api/scheduled-components', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject_calendar_id: currentCalendar.id,
              component_key: template.component_key,
              subject: template.subject,
              start_date: formatDate(date),
              duration_days: template.default_duration_days,
              title_override: null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            // If this is a blocked curriculum date error, show the specific message
            if (errorData.blocked_dates) {
              alert(errorData.message);
              return;
            }
            throw new Error('Failed to schedule component');
          }

          const newComponent = await response.json();

          // Handle both single component and multi-component responses
          const componentsToAdd = Array.isArray(newComponent) ? newComponent : [newComponent];

          console.log('[FRONTEND] Received components from API:', componentsToAdd);
          console.log('[FRONTEND] First component color:', componentsToAdd[0]?.color);

          // API now returns display_name and color from template, so we can use the response directly
          setScheduledComponents([...scheduledComponents, ...componentsToAdd]);
        }
      }
    } catch (err) {
      console.error('Error dropping component:', err);
      alert('Failed to schedule component');
    }
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Handle component edit save
  const handleSaveComponent = async (updates: any) => {
    if (!editingComponent) return;

    const response = await fetch(`/api/scheduled-components/${editingComponent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update component');
    }

    const result = await response.json();

    // Check if this was a group rotation update (returns array) or single update (returns object)
    if (Array.isArray(result)) {
      // Group rotation update - update all components in the returned array
      const updatedIds = new Set(result.map((c: any) => c.id));
      setScheduledComponents(scheduledComponents.map(c =>
        updatedIds.has(c.id)
          ? result.find((updated: any) => updated.id === c.id)
          : c
      ));
    } else {
      // Single component update - use full result from API (not partial updates)
      setScheduledComponents(scheduledComponents.map(c =>
        c.id === editingComponent.id
          ? result  // Use complete component data from database
          : c
      ));
    }
  };

  // Handle component delete
  const handleDeleteComponent = async () => {
    if (!editingComponent) return;

    // If this component is part of a group (multi-day component), delete all in the group
    if (editingComponent.group_id) {
      const confirmMessage = `Delete all days in this multi-day component?`;
      if (!confirm(confirmMessage)) return;

      // Get all components in the group
      const groupComponents = scheduledComponents.filter(c => c.group_id === editingComponent.group_id);

      // Delete all components in the group
      const deletePromises = groupComponents.map(component =>
        fetch(`/api/scheduled-components/${component.id}`, { method: 'DELETE' })
      );

      const responses = await Promise.all(deletePromises);

      if (!responses.every(r => r.ok)) {
        throw new Error('Failed to delete all components in group');
      }

      // Remove all group components from state
      setScheduledComponents(scheduledComponents.filter(c => c.group_id !== editingComponent.group_id));
    } else {
      // Single component delete
      const response = await fetch(`/api/scheduled-components/${editingComponent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete component');
      }

      // Remove from state
      setScheduledComponents(scheduledComponents.filter(c => c.id !== editingComponent.id));
    }
  };

  // Handle event edit save
  const handleSaveEvent = async (updates: any) => {
    if (!editingEvent) return;

    const response = await fetch(`/api/calendar-events/${editingEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update event');
    }

    // Refresh the entire guide to update events on all calendars
    await fetchGuide();
  };

  // Handle event delete
  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    const response = await fetch(`/api/calendar-events/${editingEvent.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete event');
    }

    // Refresh the entire guide to update all calendars
    await fetchGuide();
  };

  // Handle PDF export
  const handleExport = async (type: 'current' | 'all-separate' | 'all-combined' | 'excel') => {
    try {
      if (type === 'current') {
        // Export current subject only
        const response = await fetch(
          `/api/pacing-guides/${params.id}/export/pdf?subject=${selectedSubject}`,
          { method: 'POST' }
        );

        if (!response.ok) throw new Error('Failed to export PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${guide?.school_name}-${selectedSubject}-pacing-guide.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (type === 'all-combined') {
        // Export all subjects in one PDF
        const response = await fetch(
          `/api/pacing-guides/${params.id}/export/pdf?subject=all`,
          { method: 'POST' }
        );

        if (!response.ok) throw new Error('Failed to export PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${guide?.school_name}-all-pacing-guides.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (type === 'all-separate') {
        // Export all subjects as separate PDFs in a ZIP
        const response = await fetch(
          `/api/pacing-guides/${params.id}/export/zip`,
          { method: 'POST' }
        );

        if (!response.ok) throw new Error('Failed to export ZIP');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${guide?.school_name}-pacing-guides.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (type === 'excel') {
        // Export as Excel workbook
        const response = await fetch(
          `/api/pacing-guides/${params.id}/export/excel`,
          { method: 'POST' }
        );

        if (!response.ok) throw new Error('Failed to export Excel');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${guide?.school_name}-pacing-guides.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    }
  };

  // Format date for display (e.g., "8/6")
  const formatDateDisplay = (date: Date): string => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Check if a cell should show ghost preview
  const shouldShowGhost = (cellDate: Date): boolean => {
    if (!dragOverCell || !draggedComponent) return false;

    // Parse the cell key to get week and day index
    const match = dragOverCell.match(/week-(\d+)-day-(\d+)/);
    if (!match) return false;

    const weekNum = parseInt(match[1]);
    const dayIdx = parseInt(match[2]);

    // Find the corresponding week and date
    const week = weeks.find(w => w.weekNumber === weekNum);
    if (!week || !week.days[dayIdx]) return false;

    const dragOverDate = week.days[dayIdx];

    // For grouped components being re-placed, show simple duration-based preview
    // (Exact placement will be calculated on drop, accounting for blocked dates)
    if (draggedComponent.groupComponents && draggedComponent.groupComponents.length > 0) {
      // Calculate total template duration (number of sub-components)
      const templateDuration = draggedComponent.groupComponents.length;

      // Show ghost for N school days starting from drag-over date
      const ghostEnd = addSchoolDays(dragOverDate, templateDuration - 1);
      return isSchoolDay(cellDate) && cellDate >= dragOverDate && cellDate <= ghostEnd;
    }

    // Single component ghost preview
    const ghostEnd = addSchoolDays(dragOverDate, draggedComponent.duration - 1);
    return isSchoolDay(cellDate) && cellDate >= dragOverDate && cellDate <= ghostEnd;
  };

  const subjectLabels: Record<string, string> = {
    base: 'Base Calendar',
    ela: 'ELA',
    math: 'Math',
    science: 'Science',
    social_studies: 'Social Studies',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || 'Guide not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-96">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            {guide.school_name} - Grade {guide.grade_level}
          </h2>
          <p className="text-gray-600 mt-0.5">
            {guide.district_name} • {formatDateDisplay(new Date(guide.first_day))} - {formatDateDisplay(new Date(guide.last_day))}
          </p>
        </div>

        {/* Subject Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <nav className="flex space-x-8">
              {guide.calendars.map((calendar) => (
                <button
                  key={calendar.id}
                  onClick={() => setSelectedSubject(calendar.subject)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedSubject === calendar.subject
                      ? 'border-[#9333EA] text-[#9333EA]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {subjectLabels[calendar.subject]}
                </button>
              ))}
            </nav>
            <div className="pb-4 flex items-center gap-3">
              {selectedSubject !== 'base' && (
                <button
                  onClick={() => setBulkAdjustOpen(true)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Adjust Schedule
                </button>
              )}
              <ExportDropdown
                currentSubject={selectedSubject}
                guideId={guide.id}
                onExport={handleExport}
              />
            </div>
          </div>
        </div>

        {/* Mini Floating Selection Badge */}
        {selectedComponents.size > 0 && (
          <div className="fixed top-20 right-6 z-50 bg-white border-2 border-gray-300 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedComponents.size} ✓
            </span>
            <div className="flex items-center gap-1 border-l pl-2">
              <button
                onClick={() => clearSelection()}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                title="Clear selection"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => handleBulkDelete()}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
                title="Delete selected (Del/Backspace)"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto"
          onClick={(e) => {
            // Clear selection when clicking empty calendar space
            if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'TD') {
              clearSelection();
            }
          }}
        >
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: '100px' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Week
                </th>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <th
                    key={day}
                    className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.weekNumber}>
                  <td className="border border-gray-200 px-4 py-3 bg-gray-50 align-top">
                    <div className="text-sm font-semibold text-gray-900">
                      Week {week.weekNumber}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatDateDisplay(week.startDate)}
                    </div>
                  </td>
                  {week.days.map((day, dayIndex) => {
                    const events = getEventsForDate(day);
                    const components = getComponentsForDate(day);
                    const isBeforeStart = day < new Date(guide.first_day);
                    const isAfterEnd = day > new Date(guide.last_day);
                    const isBlockedDate = isBlockedCurriculumDate(day);
                    const cellKey = `week-${week.weekNumber}-day-${dayIndex}`;
                    const isDragOver = dragOverCell === cellKey;
                    const showGhost = shouldShowGhost(day);

                    return (
                      <td
                        key={dayIndex}
                        className={`border px-2 py-2 align-top min-h-24 transition-colors ${
                          isBeforeStart || isAfterEnd
                            ? 'bg-gray-200 border-gray-300'
                            : isDragOver
                            ? 'bg-purple-50 border-purple-400 border-2'
                            : showGhost
                            ? 'bg-purple-100 border-purple-300'
                            : 'bg-white border-gray-200'
                        }`}
                        onDragOver={(e) => {
                          if (!isBeforeStart && !isAfterEnd && !isBlockedDate) {
                            e.preventDefault();
                            setDragOverCell(cellKey);
                          }
                        }}
                        onDragLeave={() => {
                          setDragOverCell(null);
                        }}
                        onDrop={(e) => {
                          if (!isBeforeStart && !isAfterEnd && !isBlockedDate) {
                            setDragOverCell(null);
                            handleDrop(day, e);
                          }
                        }}
                      >
                        <div className={`text-xs mb-2 ${isBeforeStart || isAfterEnd || isBlockedDate ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDateDisplay(day)}
                        </div>
                        {!isBeforeStart && !isAfterEnd && (
                          <div className="space-y-1">
                            {events.map((event) => {
                              // Use lighter colors for base events on subject calendars
                              const isBaseCalendar = selectedSubject === 'base';
                              const isInteractive = isBaseCalendar; // Only interactive on Base Calendar
                              const eventColor = event.color || '#6B7280';

                              return (
                                <div
                                  key={event.id}
                                  onClick={() => isInteractive && setEditingEvent(event)}
                                  className={`group relative text-xs px-2 py-1 rounded border ${
                                    isInteractive ? 'cursor-pointer hover:opacity-75 transition-opacity' : 'border-dashed'
                                  }`}
                                  style={{
                                    backgroundColor: isBaseCalendar ? `${eventColor}40` : `${eventColor}20`,
                                    borderColor: eventColor,
                                    color: '#1f2937',
                                  }}
                                >
                                  {event.event_name}
                                  {isInteractive && (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete "${event.event_name}"? This will remove it from all calendars.`)) {
                                          try {
                                            const response = await fetch(`/api/calendar-events/${event.id}`, {
                                              method: 'DELETE',
                                            });
                                            if (response.ok) {
                                              fetchGuide(); // Refresh to update all calendars
                                            } else {
                                              alert('Failed to delete event');
                                            }
                                          } catch (error) {
                                            console.error('Error deleting event:', error);
                                            alert('Failed to delete event');
                                          }
                                        }
                                      }}
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 text-[10px] font-bold leading-none"
                                      title="Delete event"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            {components.map((component, compIndex) => (
                              <div
                                key={component.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('existing-component', JSON.stringify(component));
                                  e.dataTransfer.effectAllowed = 'move';

                                  // Create custom drag image with color
                                  const dragImg = document.createElement('div');
                                  dragImg.style.cssText = `
                                    position: absolute;
                                    top: -1000px;
                                    padding: 8px 12px;
                                    background-color: ${component.color}40;
                                    border: 2px solid ${component.color};
                                    border-radius: 6px;
                                    color: #1f2937;
                                    font-size: 14px;
                                    font-weight: 500;
                                    white-space: nowrap;
                                  `;
                                  dragImg.textContent = component.title_override || component.display_name;
                                  document.body.appendChild(dragImg);
                                  e.dataTransfer.setDragImage(dragImg, 0, 0);
                                  setTimeout(() => document.body.removeChild(dragImg), 0);

                                  // If component is part of a group, include all group members
                                  if (component.group_id) {
                                    const groupMembers = scheduledComponents
                                      .filter(c => c.group_id === component.group_id)
                                      .map(c => ({ start_date: c.start_date, duration_days: c.duration_days }));

                                    setDraggedComponent({
                                      duration: component.duration_days,
                                      isExisting: true,
                                      groupComponents: groupMembers
                                    });
                                  } else {
                                    setDraggedComponent({ duration: component.duration_days, isExisting: true });
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggedComponent(null);
                                  setDragOverCell(null);
                                }}
                                onClick={(e) => {
                                  // Prevent selection when clicking three-dot menu or reorder buttons
                                  if (!(e.target as HTMLElement).closest('.component-menu') &&
                                      !(e.target as HTMLElement).closest('button')) {
                                    toggleSelection(component.id, e.ctrlKey || e.metaKey);
                                  }
                                }}
                                className={`
                                  group relative text-xs px-2 py-1 rounded border cursor-pointer
                                  hover:opacity-75 transition-all whitespace-pre-line
                                  ${isSelected(component.id) ? 'shadow-lg' : ''}
                                `}
                                style={{
                                  backgroundColor: `${component.color}20`,
                                  borderColor: component.color,
                                  borderWidth: isSelected(component.id) ? '3px' : '1px',
                                  filter: isSelected(component.id) ? 'brightness(0.85)' : 'none',
                                  color: '#1f2937',
                                }}
                              >
                                {component.title_override || component.display_name}

                                {/* Three-dot menu - visible on hover or when selected */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent component selection
                                    setEditingComponent(component);
                                  }}
                                  className={`
                                    component-menu absolute top-1 right-1 w-5 h-5 rounded
                                    hover:bg-gray-200 flex items-center justify-center
                                    transition-opacity
                                    ${isSelected(component.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                  `}
                                  title="Edit component"
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                                    <circle cx="8" cy="2.5" r="1.5"/>
                                    <circle cx="8" cy="8" r="1.5"/>
                                    <circle cx="8" cy="13.5" r="1.5"/>
                                  </svg>
                                </button>

                                {/* Reorder buttons - only show when there are multiple components in cell */}
                                {components.length > 1 && (
                                  <div className="absolute -top-1 -left-1 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Up arrow */}
                                    {compIndex > 0 && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const response = await fetch(`/api/scheduled-components/${component.id}/reorder`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ direction: 'up' }),
                                            });
                                            if (response.ok) {
                                              fetchGuide(); // Refresh the guide to show new order
                                            }
                                          } catch (error) {
                                            console.error('Error reordering:', error);
                                          }
                                        }}
                                        className="w-4 h-4 bg-gray-600 text-white rounded-sm flex items-center justify-center hover:bg-gray-700 text-[10px] leading-none mb-0.5"
                                        title="Move up"
                                      >
                                        ▲
                                      </button>
                                    )}
                                    {/* Down arrow */}
                                    {compIndex < components.length - 1 && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const response = await fetch(`/api/scheduled-components/${component.id}/reorder`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ direction: 'down' }),
                                            });
                                            if (response.ok) {
                                              fetchGuide(); // Refresh the guide to show new order
                                            }
                                          } catch (error) {
                                            console.error('Error reordering:', error);
                                          }
                                        }}
                                        className="w-4 h-4 bg-gray-600 text-white rounded-sm flex items-center justify-center hover:bg-gray-700 text-[10px] leading-none"
                                        title="Move down"
                                      >
                                        ▼
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Component Library */}
      <ComponentLibrary
        subject={selectedSubject}
        guideId={guide.id}
        onDragStart={(duration) => setDraggedComponent({ duration, isExisting: false })}
        onDragEnd={() => {
          setDraggedComponent(null);
          setDragOverCell(null);
        }}
        onTemplateSaved={fetchGuide}
      />

      {/* Edit Component Modal */}
      <EditComponentModal
        component={editingComponent}
        isOpen={!!editingComponent}
        onClose={() => setEditingComponent(null)}
        onSave={handleSaveComponent}
        onDelete={handleDeleteComponent}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Bulk Adjust Modal */}
      <BulkAdjustModal
        isOpen={bulkAdjustOpen}
        onClose={() => setBulkAdjustOpen(false)}
        guideId={guide.id}
        currentSubject={selectedSubject}
        schoolYear={{
          first_day: guide.first_day,
          last_day: guide.last_day,
        }}
        onSuccess={async () => {
          await fetchGuide();
          setBulkAdjustOpen(false);
        }}
      />
    </div>
  );
}
