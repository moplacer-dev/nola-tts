'use client';

/**
 * V2 Calendar Page - Main integration of all V2 components
 *
 * This page wires together:
 * - CalendarGrid (Phase 4)
 * - ComponentLibrary (Phase 5)
 * - SubjectTabs (Phase 5)
 * - BulkActionToolbar (Phase 5)
 * - PasteBanner (Phase 5)
 * - V2 API endpoints (Phase 3)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CalendarGrid } from '@/components/v2/calendar/CalendarGrid';
import { ComponentLibrary } from '@/components/v2/library/ComponentLibrary';
import { SubjectTabs } from '@/components/v2/toolbar/SubjectTabs';
import { BulkActionToolbar } from '@/components/v2/toolbar/BulkActionToolbar';
import { EditItemModal } from '@/components/v2/modals/EditItemModal';
import { ColorPickerModal } from '@/components/v2/modals/ColorPickerModal';
import { RepaceModal } from '@/components/v2/modals/RepaceModal';
import {
  Subject,
  ScheduledItemWithTemplate,
  ComponentTemplate,
  CreateScheduledItemsRequest,
  UpdateScheduledItemRequest,
  ScheduledItemMetadata
} from '@/types/v2';

// PacingGuide interface (from V1 system)
interface PacingGuide {
  id: string;
  school_name: string;
  district_name: string;
  grade_level: string;
  first_day: string;
  last_day: string;
}

/**
 * Format Date to YYYY-MM-DD string
 */
function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "August 21, 2025")
 */
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Parse date string to Date (handles both YYYY-MM-DD and ISO 8601 formats)
 *
 * IMPORTANT: Always parses as local timezone to avoid timezone shift bugs
 *
 * BUG FIX (2025-01-16): Previously, dates from the database (UTC ISO 8601)
 * were being converted to local Date objects using `new Date(string)`, which
 * caused timezone shifts. For example, "2025-09-29T00:00:00.000Z" in CDT (UTC-5)
 * would become 2025-09-28 19:00:00, causing `formatDateForDB` to return "2025-09-28".
 *
 * This caused bulk drag operations to place items on the wrong dates (one day earlier),
 * and if that date was a weekend, the item would "disappear" from the calendar.
 *
 * Solution: Extract year/month/day from UTC values, then create a local Date object
 * with those values, ensuring dates remain consistent across timezones.
 */
function parseDateFromDB(dateString: string): Date {
  // For YYYY-MM-DD format (from calendar cells), parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // For ISO 8601 format from PostgreSQL (e.g., "2025-07-21T00:00:00.000Z")
  // Extract date parts and create as local date to avoid timezone shifts
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    // Use UTC methods to extract the date parts, then create local date
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(year, month, day);
  }

  // Fallback: try basic parsing
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function CalendarViewV2() {
  const params = useParams();
  const router = useRouter();
  const guideId = params.id as string;

  // Core state
  const [guide, setGuide] = useState<PacingGuide | null>(null);
  const [scheduledItems, setScheduledItems] = useState<ScheduledItemWithTemplate[]>([]);
  const [baseCalendarItems, setBaseCalendarItems] = useState<ScheduledItemWithTemplate[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('ela');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection and interaction state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledItemWithTemplate | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRepaceModal, setShowRepaceModal] = useState(false);

  // Fetch guide data
  useEffect(() => {
    fetchGuide();
  }, [guideId]);

  // Fetch base calendar items (for blocked dates) when guide is loaded
  useEffect(() => {
    if (guide) {
      fetchBaseCalendarItems();
    }
  }, [guideId, guide]);

  // Fetch scheduled items when subject changes
  useEffect(() => {
    if (guide) {
      fetchScheduledItems();
    }
  }, [guideId, selectedSubject, guide]);

  /**
   * Fetch guide information
   */
  const fetchGuide = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pacing-guides/${guideId}`, {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to fetch guide');
      }

      const data = await res.json();
      setGuide(data);
    } catch (err) {
      console.error('Error fetching guide:', err);
      setError('Failed to load pacing guide');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch scheduled items for current subject
   */
  const fetchScheduledItems = async () => {
    try {
      const res = await fetch(
        `/api/v2/scheduled-items?guide_id=${guideId}&calendar_type=${selectedSubject}`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch scheduled items');
      }

      const data = await res.json();
      setScheduledItems(data.items || []);
    } catch (err) {
      console.error('Error fetching scheduled items:', err);
      setError('Failed to load scheduled items');
    }
  };

  /**
   * Fetch base calendar items (for blocked dates calculation)
   */
  const fetchBaseCalendarItems = async () => {
    try {
      const res = await fetch(
        `/api/v2/scheduled-items?guide_id=${guideId}&calendar_type=base`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch base calendar items');
      }

      const data = await res.json();
      setBaseCalendarItems(data.items || []);
    } catch (err) {
      console.error('Error fetching base calendar items:', err);
      // Don't set error state - base calendar is not critical
    }
  };

  /**
   * Get blocked dates from base calendar
   */
  const blockedDates = useMemo(() => {
    const blocked = new Set<string>();

    // Get base calendar items that block curriculum
    baseCalendarItems
      .filter(item => item.blocks_curriculum)
      .forEach(item => {
        let currentDate = new Date(item.start_date);

        // Add all dates in the event's duration
        for (let i = 0; i < item.duration_days; i++) {
          const dateString = formatDateForDB(currentDate);
          blocked.add(dateString);

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

    return blocked;
  }, [baseCalendarItems]);

  /**
   * Filter items by current subject
   * On subject calendars, also include base calendar items for context
   */
  const filteredItems = useMemo(() => {
    if (selectedSubject === 'base') {
      // Base calendar view: Only show base items
      return scheduledItems;
    } else {
      // Subject calendar view: Show subject items AND base items (for context)
      const subjectItems = scheduledItems;
      const combined = [...subjectItems, ...baseCalendarItems];

      // Deduplicate by item.id to avoid React key conflicts
      // This can happen if items are refetched or during subject switching
      const seen = new Set<string>();
      const deduped = combined.filter(item => {
        if (seen.has(item.id)) {
          console.warn('⚠️ Duplicate item found and removed:', item.id, item.display_name);
          return false;
        }
        seen.add(item.id);
        return true;
      });

      return deduped;
    }
  }, [scheduledItems, baseCalendarItems, selectedSubject]);

  /**
   * Handle drag from library (create new items)
   */
  const handleLibraryDrop = async (dateString: string, e: React.DragEvent) => {
    e.preventDefault();

    const templateId = e.dataTransfer.getData('template-id');
    const templateData = e.dataTransfer.getData('template');

    if (!templateId || !guide) {
      return;
    }

    try {
      // Parse template data to get metadata fields
      let template: ComponentTemplate | null = null;
      try {
        template = JSON.parse(templateData);
      } catch (err) {
        console.error('Failed to parse template data:', err);
      }

      // Build metadata object (for rotation_number, unit_number, etc.)
      const metadata: ScheduledItemMetadata = {};

      // For now, default rotation_number to 1 if needed
      if (template?.metadata_fields?.includes('rotation_number')) {
        metadata.rotation_number = 1;
      }

      // Create request
      const request: CreateScheduledItemsRequest = {
        guide_id: guideId,
        calendar_type: selectedSubject,
        template_id: templateId,
        start_date: dateString,
        metadata
      };

      const res = await fetch('/api/v2/scheduled-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('API error creating items:', errorData);
        throw new Error(errorData.error || 'Failed to create items');
      }

      // Refresh items
      await fetchScheduledItems();

      // Clear selection
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error creating scheduled items:', err);
      alert(err instanceof Error ? err.message : 'Failed to create items');
    }
  };

  /**
   * Handle drag of existing item (move to new date)
   */
  const handleExistingItemDrop = async (dateString: string, e: React.DragEvent) => {
    e.preventDefault();

    const itemId = e.dataTransfer.getData('item-id');

    if (!itemId) return;

    try {
      // Update item's start_date
      const request: UpdateScheduledItemRequest = {
        start_date: dateString
      };

      const res = await fetch(`/api/v2/scheduled-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update item');
      }

      // Refresh items
      await fetchScheduledItems();
    } catch (err) {
      console.error('Error updating scheduled item:', err);
      alert(err instanceof Error ? err.message : 'Failed to move item');
    }
  };

  /**
   * Handle multi-drag (move multiple selected items to consecutive dates)
   */
  const handleMultiDragDrop = async (dateString: string, e: React.DragEvent) => {
    e.preventDefault();

    const multiDragData = e.dataTransfer.getData('multi-drag');
    if (!multiDragData) return;

    try {
      const items: ScheduledItemWithTemplate[] = JSON.parse(multiDragData);

      // Calculate new dates for each item (consecutive school days)
      const targetDate = parseDateFromDB(dateString);
      let currentDate = new Date(targetDate); // Create explicit copy to avoid mutation
      const updates: Array<{ id: string; start_date: string }> = [];

      for (const item of items) {
        updates.push({
          id: item.id,
          start_date: formatDateForDB(currentDate)
        });

        // Move to next school day (skips weekends and blocked dates)
        currentDate = addSchoolDays(currentDate, 1, blockedDates);
      }

      // Call bulk-move API
      const res = await fetch('/api/v2/scheduled-items/bulk-move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to move items');
      }

      // Refresh items
      await fetchScheduledItems();

      // Clear selection
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error in multi-drag:', err);
      alert(err instanceof Error ? err.message : 'Failed to move components');
    }
  };

  /**
   * Unified drop handler (determines if library, existing item, or multi-drag)
   */
  const handleDrop = async (dateString: string, e: React.DragEvent) => {
    const templateId = e.dataTransfer.getData('template-id');
    const itemId = e.dataTransfer.getData('item-id');
    const multiDragData = e.dataTransfer.getData('multi-drag');

    if (multiDragData) {
      await handleMultiDragDrop(dateString, e);
    } else if (templateId) {
      await handleLibraryDrop(dateString, e);
    } else if (itemId) {
      await handleExistingItemDrop(dateString, e);
    }

    setIsDragging(false);
  };

  /**
   * Handle drag over (allow drop)
   */
  const handleDragOver = (dateString: string, e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * Handle item selection
   */
  const handleSelectItem = (itemId: string, ctrlKey: boolean) => {
    const newSelection = new Set(selectedItems);

    if (ctrlKey) {
      // Multi-select: toggle item
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
    } else {
      // Single select
      if (newSelection.size === 1 && newSelection.has(itemId)) {
        // Deselect if already selected
        newSelection.clear();
      } else {
        // Replace selection
        newSelection.clear();
        newSelection.add(itemId);
      }
    }

    setSelectedItems(newSelection);
  };

  /**
   * Handle delete selected items
   */
  const handleDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedItems.size} item(s)?`
    );

    if (!confirmDelete) return;

    try {
      // Delete each selected item
      const deletePromises = Array.from(selectedItems).map(itemId =>
        fetch(`/api/v2/scheduled-items/${itemId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );

      await Promise.all(deletePromises);

      // Refresh items
      await fetchScheduledItems();

      // Clear selection
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error deleting items:', err);
      alert('Failed to delete items');
    }
  };

  /**
   * Clear selection
   */
  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  /**
   * Handle bulk color change - opens color picker modal
   */
  const handleBulkColorChange = () => {
    if (selectedItems.size === 0) return;
    setShowColorPicker(true);
  };

  /**
   * Apply selected color to all selected items
   */
  const handleApplyColor = async (color: string) => {
    try {
      const res = await fetch('/api/v2/scheduled-items/bulk-update-color', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          item_ids: Array.from(selectedItems),
          color_override: color
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update colors');
      }

      // Refresh items
      await fetchScheduledItems();

      // Clear selection
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error changing colors:', err);
      alert(err instanceof Error ? err.message : 'Failed to change colors');
    }
  };

  /**
   * Handle subject change
   */
  const handleSubjectChange = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedItems(new Set()); // Clear selection on subject change
  };

  /**
   * Handle PDF export
   */
  const handleExportPDF = async () => {
    try {
      const res = await fetch(
        `/api/pacing-guides/${guideId}/export/pdf?subject=${selectedSubject}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${guide?.school_name || 'pacing-guide'}-${selectedSubject}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  /**
   * Handle re-pacing calendar
   */
  const handleRepace = async (subject: string, daysToShift: number, startFromDate?: string) => {
    try {
      const res = await fetch(`/api/pacing-guides/${guideId}/bulk-adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject,
          days_to_shift: daysToShift,
          start_from_date: startFromDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to re-pace calendar');
      }

      // Show success message with version info
      alert(
        `✅ Successfully re-paced ${data.affected_count} items!\n\n` +
        `${data.version_label}\n\n` +
        (data.warnings && data.warnings.length > 0
          ? `Warnings:\n${data.warnings.join('\n')}`
          : '')
      );

      // Refresh calendar data
      await fetchScheduledItems();
    } catch (err) {
      console.error('Error re-pacing calendar:', err);
      alert(err instanceof Error ? err.message : 'Failed to re-pace calendar');
    }
  };

  /**
   * Add school days to a date (skips weekends and blocked dates)
   */
  function addSchoolDays(startDate: Date, daysToAdd: number, blockedDates: Set<string>): Date {
    let currentDate = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < daysToAdd) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      const dateString = formatDateForDB(currentDate);

      // Skip weekends (0 = Sunday, 6 = Saturday) and blocked dates
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !blockedDates.has(dateString)) {
        daysAdded++;
      }
    }

    return currentDate;
  }

  /**
   * Create duplicate items on consecutive school days
   */
  async function createDuplicates(
    originalItemId: string,
    count: number,
    overrides: UpdateScheduledItemRequest
  ) {
    // Get original item
    const originalItem = scheduledItems.find(item => item.id === originalItemId) ||
                         baseCalendarItems.find(item => item.id === originalItemId);

    if (!originalItem) {
      throw new Error('Original item not found');
    }

    if (!originalItem.template_id) {
      throw new Error('Cannot extend items without a template');
    }

    let currentDate = parseDateFromDB(originalItem.start_date);

    for (let i = 0; i < count; i++) {
      // Calculate next school day
      currentDate = addSchoolDays(currentDate, 1, blockedDates);

      // Check if exceeds last_day
      if (currentDate > lastDay) {
        console.warn(`Cannot create duplicate ${i + 1} - exceeds last day of school`);
        break;
      }

      // Create duplicate item
      // IMPORTANT: Use same placement_group_id so all duplicates can be updated together
      const duplicateRequest: CreateScheduledItemsRequest = {
        guide_id: originalItem.guide_id,
        calendar_type: originalItem.calendar_type,
        template_id: originalItem.template_id,
        start_date: formatDateForDB(currentDate),
        metadata: overrides.metadata || originalItem.metadata,
        placement_group_id: originalItem.placement_group_id || undefined // Use original's group ID
      };

      const res = await fetch('/api/v2/scheduled-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(duplicateRequest)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to create duplicate ${i + 1}: ${errorData.error}`);
      }
    }
  }

  /**
   * Handle save from EditItemModal (with optional extend/repeat)
   */
  const handleSaveItem = async (
    updates: UpdateScheduledItemRequest,
    repeatDays?: number
  ) => {
    if (!editingItem) return;

    try {
      // 1. Update original item
      // NOTE: If metadata changes and item has placement_group_id,
      // the API will update ALL items in the group automatically
      // Titles with placeholders (e.g., "R{rotation}, S3") are substituted dynamically on display
      const res = await fetch(`/api/v2/scheduled-items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        throw new Error('Failed to update item');
      }

      // 2. Create duplicates if repeatDays > 1
      if (repeatDays && repeatDays > 1) {
        await createDuplicates(editingItem.id, repeatDays - 1, updates);
      }

      // 3. Refresh calendar
      await fetchScheduledItems();
      await fetchBaseCalendarItems(); // In case it was a base calendar item

      // 4. Close modal
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving item:', err);
      alert(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pacing guide...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !guide) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-900 font-semibold mb-2">Failed to Load Guide</p>
          <p className="text-gray-600 mb-4">{error || 'Guide not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const firstDay = parseDateFromDB(guide.first_day);
  const lastDay = parseDateFromDB(guide.last_day);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {guide.school_name} - Grade {guide.grade_level}
            </h1>
            <p className="text-sm text-gray-600">
              {guide.district_name && `${guide.district_name} • `}
              {formatDateForDisplay(guide.first_day)} to {formatDateForDisplay(guide.last_day)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRepaceModal(true)}
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-sm font-medium py-2 px-4 rounded-md transition-colors bg-transparent"
            >
              Re-Pace Calendar
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Subject tabs */}
      <div className="bg-white border-b border-gray-200 px-6 shadow-sm">
        <SubjectTabs
          activeSubject={selectedSubject}
          onSubjectChange={handleSubjectChange}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main calendar area */}
        <div className="flex-1 overflow-auto p-6">
          <CalendarGrid
            firstDay={firstDay}
            lastDay={lastDay}
            items={filteredItems}
            blockedDates={blockedDates}
            selectedItems={selectedItems}
            viewingCalendar={selectedSubject}
            onSelectItem={handleSelectItem}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onEditItem={setEditingItem}
          />
        </div>

        {/* Right sidebar - Component Library */}
        <div className="w-72 bg-gray-50 border-l border-gray-200 overflow-y-auto p-4">
          <ComponentLibrary
            subject={selectedSubject}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />
        </div>
      </div>

      {/* Bulk action toolbar (conditional) */}
      {selectedItems.size > 0 && (
        <BulkActionToolbar
          selectedCount={selectedItems.size}
          onDelete={handleDelete}
          onChangeColor={handleBulkColorChange}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Edit Item Modal (Phase 7 - Extend Feature) */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          blockedDates={blockedDates}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
        />
      )}

      {/* Color Picker Modal (Phase 7 - Bulk Color Change) */}
      {showColorPicker && (
        <ColorPickerModal
          selectedCount={selectedItems.size}
          onClose={() => setShowColorPicker(false)}
          onConfirm={handleApplyColor}
        />
      )}

      {/* Re-pace Modal */}
      <RepaceModal
        isOpen={showRepaceModal}
        onClose={() => setShowRepaceModal(false)}
        onRepace={handleRepace}
        currentSubject={selectedSubject}
      />
    </div>
  );
}
