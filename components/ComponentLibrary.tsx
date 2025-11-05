'use client';

import { useEffect, useState } from 'react';
import CustomComponentModal from './CustomComponentModal';
import CreateEventModal from './CreateEventModal';

interface ComponentTemplate {
  id: string;
  component_key: string;
  subject: string;
  display_name: string;
  default_duration_days: number;
  color: string;
  description: string;
  user_id: string | null;
}

interface ComponentLibraryProps {
  subject: string;
  guideId?: string;
  onDragStart?: (duration: number) => void;
  onDragEnd?: () => void;
  onTemplateSaved?: () => void;
}

export default function ComponentLibrary({ subject, guideId, onDragStart, onDragEnd, onTemplateSaved }: ComponentLibraryProps) {
  const [components, setComponents] = useState<ComponentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ComponentTemplate | null>(null);
  const [filter, setFilter] = useState<string>('school');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Categorize base calendar events
  const categorizeBaseEvent = (componentKey: string) => {
    const holidays = [
      // Federal holidays
      'base_labor_day', 'base_election_day', 'base_veterans_day',
      'base_mlk_day', 'base_presidents_day', 'base_memorial_day', 'base_juneteenth',
      // Cultural holidays
      'base_three_kings_day', 'base_valentines_day', 'base_st_patricks_day',
      'base_cinco_de_mayo', 'base_mothers_day', 'base_fathers_day', 'base_mardi_gras',
      'base_halloween', 'base_earth_day', 'base_black_history_month',
      'base_womens_history_month', 'base_hispanic_heritage_month'
    ];

    if (holidays.includes(componentKey)) return 'holidays';
    return 'school'; // Everything else: breaks, school events, general
  };

  // Filter components based on selected filter (for Base, Social Studies, and Math)
  const filteredComponents = subject === 'base'
    ? components.filter(c => {
        // Apply category filter
        const matchesFilter = filter === 'all' || categorizeBaseEvent(c.component_key) === filter;
        // Apply search filter
        const matchesSearch = c.display_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
    : subject === 'social_studies'
    ? components.filter(c => {
        // Apply category filter based on component_key prefix
        let matchesFilter = true;
        if (filter === 'industrialism') matchesFilter = c.component_key.startsWith('ss_industrialism_');
        else if (filter === 'modern') matchesFilter = c.component_key.startsWith('ss_modern_');
        else if (filter === 'world1750') matchesFilter = c.component_key.startsWith('ss_world1750_');
        else if (filter === 'other') matchesFilter = !c.component_key.startsWith('ss_industrialism_') && !c.component_key.startsWith('ss_modern_') && !c.component_key.startsWith('ss_world1750_');
        // Apply search filter
        const matchesSearch = c.display_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
    : subject === 'math'
    ? components.filter(c => {
        // Apply category filter
        let matchesFilter = true;
        if (filter === 'all') matchesFilter = true;
        else if (filter === 'ipl') matchesFilter = c.display_name.startsWith('IPL:');
        else if (filter === 'other') matchesFilter = !c.display_name.startsWith('IPL:');
        // Apply search filter
        const matchesSearch = c.display_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
    : components.filter(c => c.display_name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Natural sort function for alphanumeric sorting (handles "Unit 1" vs "Unit 10" correctly)
  const naturalSort = (a: ComponentTemplate, b: ComponentTemplate) => {
    // For Social Studies, sort by component_key which has a logical structure
    if (subject === 'social_studies') {
      // Extract unit/lesson numbers from component_key for proper sorting
      // e.g., ss_world1750_u1_l1, ss_world1750_u10_l1
      const aKey = a.component_key;
      const bKey = b.component_key;

      // Parse curriculum prefix (ss_modern_, ss_industrialism_, ss_world1750_)
      const aParts = aKey.split('_');
      const bParts = bKey.split('_');

      // Compare curriculum first (modern vs industrialism vs world1750)
      if (aParts[1] !== bParts[1]) {
        return aParts[1].localeCompare(bParts[1]);
      }

      // For curriculum-specific components, extract unit and lesson numbers
      const aUnitMatch = aKey.match(/u(\d+)/);
      const bUnitMatch = bKey.match(/u(\d+)/);

      if (aUnitMatch && bUnitMatch) {
        const aUnit = parseInt(aUnitMatch[1]);
        const bUnit = parseInt(bUnitMatch[1]);

        // Compare units numerically
        if (aUnit !== bUnit) {
          return aUnit - bUnit;
        }

        // Within same unit, sort by: opener < lessons < closer
        const getOrder = (key: string) => {
          if (key.includes('opener')) return 0;
          if (key.includes('setting_stage')) return 0;
          if (key.includes('closer')) return 999;

          // Extract lesson number
          const lessonMatch = key.match(/l(\d+)/);
          if (lessonMatch) {
            return parseInt(lessonMatch[1]);
          }
          return 500; // fallback
        };

        return getOrder(aKey) - getOrder(bKey);
      }

      // For general components (ss_welcome_video, ss_flex_day, etc.), use display name
      return a.display_name.localeCompare(b.display_name);
    }

    // For other subjects, use display name with natural sort
    return a.display_name.localeCompare(b.display_name, undefined, { numeric: true, sensitivity: 'base' });
  };

  const systemComponents = filteredComponents.filter(c => c.user_id === null).sort(naturalSort);
  const customComponents = filteredComponents.filter(c => c.user_id !== null).sort(naturalSort);

  useEffect(() => {
    fetchComponents();
    // Reset filter and search when switching subjects
    if (subject === 'base') {
      setFilter('school');
    } else {
      setFilter('other');
    }
    setSearchQuery('');
  }, [subject]);

  const fetchComponents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v2/component-templates?subject=${subject}`);

      if (!response.ok) {
        throw new Error('Failed to fetch components');
      }

      const data = await response.json();
      setComponents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustom = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEditCustom = (template: ComponentTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDeleteCustom = async (template: ComponentTemplate) => {
    // Fetch instance count
    const countResponse = await fetch(`/api/v2/scheduled-items/count?component_key=${template.component_key}`);
    const countData = await countResponse.json();
    const count = countData.count || 0;

    const message = count > 0
      ? `Delete "${template.display_name}"? It's used in ${count} place${count !== 1 ? 's' : ''}. Those instances will remain on calendars as standalone components.`
      : `Delete "${template.display_name}"?`;

    if (!confirm(message)) return;

    try {
      const response = await fetch(`/api/v2/component-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Refresh components list
      fetchComponents();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template');
    }
  };

  const handleModalSave = () => {
    fetchComponents();
    onTemplateSaved?.();
  };

  const handleCreateEvent = async (eventData: {
    event_name: string;
    event_type: string;
    start_date: string;
    duration_days: number;
  }) => {
    if (!guideId) {
      throw new Error('Guide ID is required');
    }

    const response = await fetch('/api/v2/scheduled-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guide_id: guideId,
        calendar_type: 'base',
        start_date: eventData.start_date,
        duration_days: eventData.duration_days,
        title_override: eventData.event_name,
        blocks_curriculum: true,
        source: 'manual',
        ...eventData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create event');
    }

    // Refresh the parent guide to show the new event
    onTemplateSaved?.();
  };

  // Special handling for base calendar - show draggable event templates
  if (subject === 'base') {
    if (isLoading) {
      return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="text-sm text-gray-600">Loading event templates...</div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-40">
          <div className="max-w-full mx-auto">
            {/* Header with Collapse Button */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Base Calendar Events</h3>
                <span className="text-xs text-gray-600">
                  {systemComponents.length} events • Sync across all calendars
                </span>
                {/* Base Calendar Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm font-medium border-2 border-gray-400 rounded px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-[#9333EA]"
                >
                  <option value="all">All Events</option>
                  <option value="school">School-Specific Events</option>
                  <option value="holidays">Holidays</option>
                </select>
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm font-medium border-2 border-gray-400 rounded px-3 py-0 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9333EA] focus:border-[#9333EA] w-44"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateEventModalOpen(true)}
                  className="px-3 py-1 text-xs font-medium text-white bg-[#9333EA] hover:bg-[#7E22CE] rounded transition-colors"
                >
                  + Create
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
                >
                  {isExpanded ? '▼' : '▲'}
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
              <>
                <div className="px-4 py-4 max-h-56 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {systemComponents.map((component) => (
                      <div
                        key={component.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('component', JSON.stringify(component));
                          e.dataTransfer.effectAllowed = 'copy';

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
                          dragImg.textContent = component.display_name;
                          document.body.appendChild(dragImg);
                          e.dataTransfer.setDragImage(dragImg, 0, 0);
                          setTimeout(() => document.body.removeChild(dragImg), 0);

                          onDragStart?.(component.default_duration_days);
                        }}
                        onDragEnd={onDragEnd}
                        className="group relative border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow cursor-move bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {subject !== 'base' && (
                                <div
                                  className="w-3 h-3 rounded flex-shrink-0"
                                  style={{ backgroundColor: component.color }}
                                />
                              )}
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {component.display_name}
                              </h5>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {component.default_duration_days}d
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-600 text-center">
                    💡 Drag events onto the calendar. Changes sync across all subject calendars.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onSave={handleCreateEvent}
          guideId={guideId || ''}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-sm text-gray-600">Loading components...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-40">
        <div className="max-w-full mx-auto">
          {/* Header with Collapse Button */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-gray-900">Component Library</h3>
              <span className="text-xs text-gray-600">
                {systemComponents.length} system • {customComponents.length} custom
              </span>
              {/* Social Studies Filter */}
              {subject === 'social_studies' && (
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm font-medium border-2 border-gray-400 rounded px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-[#9333EA]"
                >
                  <option value="industrialism">Through Industrialism</option>
                  <option value="modern">Through Modern Times</option>
                  <option value="world1750">World Through 1750</option>
                  <option value="other">General</option>
                </select>
              )}
              {/* Math Filter */}
              {subject === 'math' && (
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm font-medium border-2 border-gray-400 rounded px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-[#9333EA]"
                >
                  <option value="all">All Components</option>
                  <option value="ipl">IPL Units</option>
                  <option value="other">General</option>
                </select>
              )}
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm font-medium border-2 border-gray-400 rounded px-3 py-0 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9333EA] focus:border-[#9333EA] w-44"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateCustom}
                className="px-3 py-1 text-xs font-medium text-white bg-[#9333EA] hover:bg-[#7E22CE] rounded transition-colors"
              >
                + Create
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? '▼' : '▲'}
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {isExpanded && (
            <>
              <div className="px-4 py-4 max-h-56 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {/* All Components in One Grid */}
                  {filteredComponents.map((component) => {
                    const isCustom = component.user_id !== null;

                    return (
                      <div
                        key={component.id}
                        className="group relative border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow cursor-move bg-white"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('component', JSON.stringify(component));

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
                          dragImg.textContent = component.display_name;
                          document.body.appendChild(dragImg);
                          e.dataTransfer.setDragImage(dragImg, 0, 0);
                          setTimeout(() => document.body.removeChild(dragImg), 0);

                          onDragStart?.(component.default_duration_days);
                        }}
                        onDragEnd={() => {
                          onDragEnd?.();
                        }}
                      >
                        {/* Edit/Delete Buttons (only for custom components) */}
                        {isCustom && (
                          <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCustom(component);
                              }}
                              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 text-xs"
                              title="Edit template"
                            >
                              ✎
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustom(component);
                              }}
                              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                              title="Delete template"
                            >
                              ×
                            </button>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {subject !== 'base' && (
                                <div
                                  className="w-3 h-3 rounded flex-shrink-0"
                                  style={{ backgroundColor: component.color }}
                                />
                              )}
                              <h5 className="text-sm font-medium text-gray-900 truncate whitespace-pre-line">
                                {component.display_name}
                              </h5>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {component.default_duration_days}d
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Hint */}
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-600 text-center">
                  💡 Drag components onto the calendar to schedule them
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Component Modal */}
      <CustomComponentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleModalSave}
        template={editingTemplate}
        currentSubject={subject}
      />
    </>
  );
}
