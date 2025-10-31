# Multi-Select Implementation Plan

## Overview
Implement multi-select functionality for calendar components with an intuitive click-to-select UX pattern and three-dot menu for actions.

---

## UX Design

### Interaction Model

**CURRENT (to be changed):**
- Click component → Opens edit modal
- No selection mechanism

**NEW:**
- Click component → Select/deselect component (toggle selection)
- Click three-dot icon (⋮) → Opens edit modal with actions
- Cmd/Ctrl+Click → Add to selection (multi-select)
- Shift+Click → Range select (future enhancement)
- Click empty space → Clear selection
- Drag component → Move (when not in selection mode, OR drag all selected)

### Visual Design

**Unselected Component:**
```
┌────────────────────────┐
│ Unit 1, Lesson 1    ⋮  │ ← Three-dot menu on right
│ (3 days)               │
└────────────────────────┘
```

**Selected Component:**
```
┌────────────────────────┐
│ Unit 1, Lesson 1    ⋮  │ ← Blue border/highlight
│ (3 days)               │ ← Slightly different background
└────────────────────────┘
```

**Multiple Selected:**
```
Selected: 3 components

┌────────────────────────┐ ← Selected
│ Unit 1, Lesson 1    ⋮  │
└────────────────────────┘

┌────────────────────────┐ ← Unselected
│ Unit 1, Lesson 2    ⋮  │
└────────────────────────┘

┌────────────────────────┐ ← Selected
│ Unit 1, Lesson 3    ⋮  │
└────────────────────────┘
```

### Bulk Actions Toolbar

When 1+ components selected, show floating toolbar:

```
┌─────────────────────────────────────────────────────────┐
│  ☑ 3 selected   [Copy] [Delete] [Clear Selection]      │
└─────────────────────────────────────────────────────────┘
```

Position: Fixed to top of calendar view (below subject tabs)

---

## Implementation Phases

### Phase 1: Click-to-Select + Three-Dot Menu
**Complexity: ⭐⭐ (Easy-Medium)**
**Time Estimate: 2-3 hours**
**Priority: HIGH** (Foundation for everything else)

#### 1.1 State Management
**File:** `app/dashboard/guides/[id]/page.tsx:70`

```typescript
// Add new state
const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());

// Helper functions
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
```

#### 1.2 Update Component Rendering
**File:** `app/dashboard/guides/[id]/page.tsx:893`

**BEFORE:**
```typescript
onClick={() => setEditingComponent(component)}
className="group relative text-xs px-2 py-1 rounded border cursor-pointer hover:opacity-75 transition-opacity whitespace-pre-line"
```

**AFTER:**
```typescript
onClick={(e) => {
  // Prevent selection when clicking three-dot menu
  if (!(e.target as HTMLElement).closest('.component-menu')) {
    toggleSelection(component.id, e.ctrlKey || e.metaKey);
  }
}}
className={`
  group relative text-xs px-2 py-1 rounded border cursor-pointer
  hover:opacity-75 transition-all whitespace-pre-line
  ${isSelected(component.id)
    ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50'
    : ''
  }
`}
```

#### 1.3 Add Three-Dot Menu Icon
**File:** `app/dashboard/guides/[id]/page.tsx:901`

**ADD INSIDE COMPONENT DIV (after title):**
```typescript
{/* Three-dot menu - visible on hover or when selected */}
<button
  onClick={(e) => {
    e.stopPropagation(); // Prevent component selection
    setEditingComponent(component);
  }}
  className="component-menu absolute top-1 right-1 w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
  title="Edit component"
>
  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
    <circle cx="8" cy="2.5" r="1.5"/>
    <circle cx="8" cy="8" r="1.5"/>
    <circle cx="8" cy="13.5" r="1.5"/>
  </svg>
</button>
```

#### 1.4 Update Drag Behavior
**File:** `app/dashboard/guides/[id]/page.tsx:851`

**MODIFY onDragStart:**
```typescript
onDragStart={(e) => {
  // If dragging a selected component, prepare to drag all selected
  if (selectedComponents.has(component.id) && selectedComponents.size > 1) {
    // Multi-drag (Phase 3)
    e.dataTransfer.setData('selected-components', JSON.stringify(Array.from(selectedComponents)));
    // ... (implement in Phase 3)
  } else {
    // Single drag (existing behavior)
    e.dataTransfer.setData('existing-component', JSON.stringify(component));
    // ... (keep existing code)
  }
}}
```

#### 1.5 Clear Selection on Empty Click
**File:** `app/dashboard/guides/[id]/page.tsx:750` (calendar container)

```typescript
onClick={(e) => {
  // Clear selection when clicking empty calendar space
  if (e.target === e.currentTarget) {
    clearSelection();
  }
}}
```

---

### Phase 2: Bulk Delete
**Complexity: ⭐⭐ (Easy-Medium)**
**Time Estimate: 1-2 hours**
**Priority: HIGH** (Immediate user value)

#### 2.1 Bulk Actions Toolbar Component
**File:** `app/dashboard/guides/[id]/page.tsx:650` (before calendar rendering)

```typescript
{/* Bulk Actions Toolbar */}
{selectedComponents.size > 0 && (
  <div className="sticky top-16 z-20 bg-blue-100 border-b border-blue-300 px-4 py-2 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-blue-900">
        ☑ {selectedComponents.size} component{selectedComponents.size !== 1 ? 's' : ''} selected
      </span>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => handleBulkDelete()}
        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Delete
      </button>

      <button
        onClick={() => clearSelection()}
        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
      >
        Clear Selection
      </button>
    </div>
  </div>
)}
```

#### 2.2 Bulk Delete Handler
**File:** `app/dashboard/guides/[id]/page.tsx:200`

```typescript
const handleBulkDelete = async () => {
  if (!confirm(`Delete ${selectedComponents.size} component(s)?`)) {
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

    // Show success message
    alert(`Successfully deleted ${selectedComponents.size} component(s)`);
  } catch (error) {
    console.error('Bulk delete error:', error);
    alert('Failed to delete components. Please try again.');
  }
};
```

#### 2.3 Bulk Delete API Endpoint
**File:** `app/api/scheduled-components/bulk/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// DELETE - Bulk delete scheduled components
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { component_ids } = await req.json();

    if (!Array.isArray(component_ids) || component_ids.length === 0) {
      return NextResponse.json(
        { error: 'component_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify all components belong to calendars owned by this user
    const verifyQuery = `
      SELECT sc.id
      FROM scheduled_components sc
      JOIN subject_calendars cal ON sc.subject_calendar_id = cal.id
      JOIN pacing_guides pg ON cal.pacing_guide_id = pg.id
      WHERE sc.id = ANY($1) AND pg.user_id = $2
    `;

    const verifyResult = await pool.query(verifyQuery, [component_ids, session.user.id]);

    if (verifyResult.rows.length !== component_ids.length) {
      return NextResponse.json(
        { error: 'One or more components not found or unauthorized' },
        { status: 403 }
      );
    }

    // Delete all components in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const deleteResult = await client.query(
        'DELETE FROM scheduled_components WHERE id = ANY($1) RETURNING id',
        [component_ids]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        deleted_count: deleteResult.rows.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete components' },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: Copy/Paste
**Complexity: ⭐⭐⭐ (Medium)**
**Time Estimate: 3-4 hours**
**Priority: MEDIUM** (High user value, moderate complexity)

#### 3.1 Clipboard State
**File:** `app/dashboard/guides/[id]/page.tsx:70`

```typescript
const [copiedComponents, setCopiedComponents] = useState<ScheduledComponent[]>([]);
const [showPastePrompt, setShowPastePrompt] = useState(false);
const [pasteStartDate, setPasteStartDate] = useState('');
```

#### 3.2 Copy Handler
**File:** `app/dashboard/guides/[id]/page.tsx:220`

```typescript
const handleCopy = () => {
  const componentsToCopy = scheduledComponents.filter(c =>
    selectedComponents.has(c.id)
  );

  // Sort by start_date to maintain order
  componentsToCopy.sort((a, b) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  setCopiedComponents(componentsToCopy);

  // Show success feedback
  alert(`Copied ${componentsToCopy.length} component(s)`);
};
```

#### 3.3 Paste Handler
**File:** `app/dashboard/guides/[id]/page.tsx:240`

```typescript
const handlePaste = async (startDate: string) => {
  if (copiedComponents.length === 0) return;

  try {
    // Calculate date offsets from original positions
    const baseDate = new Date(copiedComponents[0].start_date);
    const newBaseDate = new Date(startDate);

    const componentsToCreate = copiedComponents.map(comp => {
      const originalDate = new Date(comp.start_date);
      const dayOffset = Math.floor(
        (originalDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const newDate = new Date(newBaseDate);
      newDate.setDate(newDate.getDate() + dayOffset);

      return {
        subject_calendar_id: comp.subject_calendar_id,
        component_key: comp.component_key,
        subject: comp.subject,
        start_date: newDate.toISOString().split('T')[0],
        duration_days: comp.duration_days,
        title_override: comp.title_override,
        color_override: comp.color_override,
        notes: comp.notes
      };
    });

    const response = await fetch('/api/scheduled-components/bulk-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ components: componentsToCreate })
    });

    if (!response.ok) {
      throw new Error('Failed to paste components');
    }

    // Refresh guide
    await fetchGuide();

    // Clear selection and paste prompt
    setShowPastePrompt(false);
    clearSelection();

    alert(`Successfully pasted ${componentsToCreate.length} component(s)`);
  } catch (error) {
    console.error('Paste error:', error);
    alert('Failed to paste components. Please try again.');
  }
};
```

#### 3.4 Add Copy/Paste Buttons to Toolbar
**File:** `app/dashboard/guides/[id]/page.tsx:650` (update toolbar)

```typescript
<button
  onClick={() => handleCopy()}
  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
>
  Copy
</button>

{copiedComponents.length > 0 && (
  <button
    onClick={() => setShowPastePrompt(true)}
    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
  >
    Paste ({copiedComponents.length})
  </button>
)}
```

#### 3.5 Paste Date Prompt Modal
**File:** `app/dashboard/guides/[id]/page.tsx:1050` (after other modals)

```typescript
{/* Paste Prompt Modal */}
{showPastePrompt && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Paste Components</h3>

      <p className="text-sm text-gray-600 mb-4">
        Pasting {copiedComponents.length} component(s). Choose the start date:
      </p>

      <input
        type="date"
        value={pasteStartDate}
        onChange={(e) => setPasteStartDate(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-4"
      />

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShowPastePrompt(false)}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => handlePaste(pasteStartDate)}
          disabled={!pasteStartDate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Paste
        </button>
      </div>
    </div>
  </div>
)}
```

#### 3.6 Bulk Create API Endpoint
**File:** `app/api/scheduled-components/bulk-create/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// POST - Bulk create scheduled components
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { components } = await req.json();

    if (!Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: 'components must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify all calendars belong to this user
    const calendarIds = [...new Set(components.map(c => c.subject_calendar_id))];

    const verifyQuery = `
      SELECT cal.id
      FROM subject_calendars cal
      JOIN pacing_guides pg ON cal.pacing_guide_id = pg.id
      WHERE cal.id = ANY($1) AND pg.user_id = $2
    `;

    const verifyResult = await pool.query(verifyQuery, [calendarIds, session.user.id]);

    if (verifyResult.rows.length !== calendarIds.length) {
      return NextResponse.json(
        { error: 'One or more calendars not found or unauthorized' },
        { status: 403 }
      );
    }

    // Insert all components in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const createdComponents = [];

      for (const comp of components) {
        // Get next display_order for this date
        const displayOrderResult = await client.query(
          `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
           FROM scheduled_components
           WHERE subject_calendar_id = $1 AND start_date = $2`,
          [comp.subject_calendar_id, comp.start_date]
        );
        const nextDisplayOrder = displayOrderResult.rows[0].next_order;

        const result = await client.query(
          `INSERT INTO scheduled_components
           (subject_calendar_id, component_key, subject, start_date, duration_days,
            title_override, color_override, notes, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            comp.subject_calendar_id,
            comp.component_key,
            comp.subject,
            comp.start_date,
            comp.duration_days,
            comp.title_override,
            comp.color_override,
            comp.notes,
            nextDisplayOrder
          ]
        );

        createdComponents.push(result.rows[0]);
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        created_count: createdComponents.length,
        components: createdComponents
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk create error:', error);
    return NextResponse.json(
      { error: 'Failed to create components' },
      { status: 500 }
    );
  }
}
```

#### 3.7 Keyboard Shortcuts
**File:** `app/dashboard/guides/[id]/page.tsx:110`

```typescript
// Add keyboard event listener
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl+C - Copy
    if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedComponents.size > 0) {
      e.preventDefault();
      handleCopy();
    }

    // Cmd/Ctrl+V - Paste
    if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedComponents.length > 0) {
      e.preventDefault();
      setShowPastePrompt(true);
    }

    // Delete key - Delete selected
    if (e.key === 'Delete' && selectedComponents.size > 0) {
      e.preventDefault();
      handleBulkDelete();
    }

    // Escape - Clear selection
    if (e.key === 'Escape') {
      clearSelection();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedComponents, copiedComponents]);
```

---

### Phase 4: Bulk Move/Drag (Optional)
**Complexity: ⭐⭐⭐⭐ (Hard)**
**Time Estimate: 6-8 hours**
**Priority: LOW** (Copy/paste covers most use cases)

**Deferred:** This is complex and may have edge cases with blocked dates, weekends, etc. Recommend implementing only if users specifically request it after using copy/paste.

---

## Testing Plan

### Phase 1 Tests
- [ ] Click component selects it (visual feedback shows)
- [ ] Click selected component deselects it
- [ ] Cmd/Ctrl+Click adds to selection
- [ ] Three-dot menu opens edit modal
- [ ] Three-dot menu doesn't trigger selection
- [ ] Clicking empty space clears selection
- [ ] Drag still works for single components

### Phase 2 Tests
- [ ] Bulk delete removes all selected components
- [ ] Confirmation dialog appears before delete
- [ ] Delete fails gracefully if backend error
- [ ] Toolbar appears when components selected
- [ ] Toolbar shows correct count
- [ ] Clear selection button works

### Phase 3 Tests
- [ ] Copy stores components to clipboard state
- [ ] Paste prompt shows when paste button clicked
- [ ] Pasted components maintain relative spacing
- [ ] Pasted components appear on correct dates
- [ ] Pasted components skip weekends/blocked dates
- [ ] Cmd+C and Cmd+V keyboard shortcuts work
- [ ] Delete key deletes selected components
- [ ] Escape key clears selection

---

## Migration Notes

### Breaking Changes
**NONE** - This is purely additive functionality

### User Communication
- Add tooltip on components: "Click to select, drag to move"
- Add help text in toolbar: "Cmd/Ctrl+C to copy, Cmd/Ctrl+V to paste, Delete to remove"
- Consider adding a "What's New" modal on first load

### Rollback Plan
- All changes are in frontend (page.tsx) and new API endpoints
- Can disable feature by removing toolbar and selection state
- Database schema unchanged (no migrations needed)

---

## Success Metrics

### User Adoption
- % of users who use multi-select feature
- Average # of components selected per session
- Bulk delete vs. individual delete usage

### Productivity Gains
- Time to delete 10 components: Before vs. After
- Time to duplicate a unit: Before vs. After
- User satisfaction survey responses

### Error Rates
- Failed bulk operations
- Support tickets related to selection

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Get approval on UX design (click-to-select + three-dot menu)
3. ⏳ Implement Phase 1 (2-3 hours)
4. ⏳ User testing of Phase 1
5. ⏳ Implement Phase 2 (1-2 hours)
6. ⏳ User testing of Phase 2
7. ⏳ Implement Phase 3 (3-4 hours)
8. ⏳ Final QA and deployment

**Total Estimated Time: 6-9 hours for Phases 1-3**

---

## Questions for Review

1. **Three-dot menu visibility:** Always visible or only on hover?
   - Recommendation: Visible on hover + when component is selected

2. **Multi-drag:** Should dragging a selected component drag all selected?
   - Recommendation: Defer to Phase 4 (low priority)

3. **Cross-subject selection:** Can users select components from different subjects?
   - Recommendation: Allow it (copy/paste could work cross-subject)

4. **Visual feedback for copy:** Show "Copied!" toast notification?
   - Recommendation: Yes, use browser's native alert() or add toast library

5. **Paste behavior:** Should it auto-skip weekends/blocked dates?
   - Recommendation: Yes, use same addSchoolDays() logic as initial placement
