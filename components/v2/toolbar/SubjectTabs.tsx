/**
 * SubjectTabs - Tab navigation for switching between calendar subjects
 *
 * V2 Component - Displays tabs for:
 * - Base Calendar
 * - ELA
 * - Math
 * - Science
 * - Social Studies
 */

'use client';

import { Subject } from '@/types/v2';
import { cn } from '@/lib/utils';

interface SubjectTabsProps {
  activeSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
}

interface Tab {
  value: Subject;
  label: string;
  color: string;
}

const SUBJECT_TABS: Tab[] = [
  { value: 'base', label: 'Base Calendar', color: 'text-gray-700' },
  { value: 'ela', label: 'ELA', color: 'text-blue-600' },
  { value: 'math', label: 'Math', color: 'text-green-600' },
  { value: 'science', label: 'Science', color: 'text-purple-600' },
  { value: 'social_studies', label: 'Social Studies', color: 'text-red-600' }
];

export function SubjectTabs({
  activeSubject,
  onSubjectChange
}: SubjectTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-4 px-4" aria-label="Subject tabs">
        {SUBJECT_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onSubjectChange(tab.value)}
            className={cn(
              'relative py-3 px-4 font-medium text-sm transition-colors',
              'hover:text-gray-900',
              activeSubject === tab.value
                ? `${tab.color} border-b-2 border-current`
                : 'text-gray-500'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
