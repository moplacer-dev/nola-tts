/**
 * ComponentLibrary - Library of draggable component templates
 *
 * V2 Component - Displays templates filtered by subject with:
 * - Search bar
 * - Dynamic category filter (database-driven, no hardcoded categories)
 * - Expandable/collapsible sections
 * - Drag source for templates
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ComponentTemplate, Subject } from '@/types/v2';
import { LibraryCard } from './LibraryCard';
import { cn } from '@/lib/utils';

interface ComponentLibraryProps {
  subject: Subject;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function ComponentLibrary({
  subject,
  onDragStart,
  onDragEnd
}: ComponentLibraryProps) {
  const [templates, setTemplates] = useState<ComponentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch templates for this subject and reset category filter
  useEffect(() => {
    fetchTemplates();
    setCategoryFilter('all'); // Reset filter when subject changes
  }, [subject]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v2/component-templates?subject=${subject}`, {
        credentials: 'include' // Include session cookies
      });

      if (!res.ok) {
        console.error('Failed to fetch templates:', res.status, res.statusText);
        setTemplates([]);
        return;
      }

      const data = await res.json();
      console.log(`✅ Loaded ${data.templates?.length || 0} templates for ${subject}`);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get available categories dynamically from templates (database-driven)
  const categories = useMemo(() => {
    // Extract unique categories from templates (filter out nulls/empties)
    const uniqueCategories: string[] = Array.from(
      new Set(
        templates
          .map(t => t.category)
          .filter((c): c is string => c != null && c.trim() !== '')
      )
    ).sort();

    // Custom label mapping for specific categories
    const labelMap: Record<string, string> = {
      'Modules': 'Module', // Math and Science use singular "Module"
    };

    // Build category options
    return [
      { value: 'all', label: 'All' },
      ...uniqueCategories.map(cat => ({
        value: cat,
        label: labelMap[cat] || cat // Use mapped label if exists, otherwise use category as-is
      }))
    ];
  }, [templates, subject]);

  // Filter templates by category and search (database-driven, no hardcoded logic)
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply category filter (simple database field matching)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.display_name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, categoryFilter, searchQuery]);

  // Group by category (optional, for better organization)
  const groupedTemplates = useMemo(() => {
    const systemTemplates = filteredTemplates.filter(t => t.is_system);
    const customTemplates = filteredTemplates.filter(t => !t.is_system);

    return { systemTemplates, customTemplates };
  }, [filteredTemplates]);

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-gray-900">
          Component Library
          <span className="ml-2 text-sm text-gray-500">
            ({filteredTemplates.length})
          </span>
        </h3>
        <button className="text-gray-600 hover:text-gray-900">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3">
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-sm text-gray-900 placeholder-gray-500"
          />

          {/* Category filters */}
          {categories.length > 1 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    categoryFilter === cat.value
                      ? 'bg-[#9333EA] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              Loading templates...
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No templates found
            </div>
          )}

          {/* System templates */}
          {!isLoading && groupedTemplates.systemTemplates.length > 0 && (
            <div className="space-y-2">
              {groupedTemplates.systemTemplates.map(template => (
                <LibraryCard
                  key={template.id}
                  template={template}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ))}
            </div>
          )}

          {/* Custom templates (if any) */}
          {!isLoading && groupedTemplates.customTemplates.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                Custom Templates
              </h4>
              <div className="space-y-2">
                {groupedTemplates.customTemplates.map(template => (
                  <LibraryCard
                    key={template.id}
                    template={template}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
