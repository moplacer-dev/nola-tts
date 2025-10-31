# Multi-Drag Implementation Plan

## Overview
Enable dragging multiple selected components at once while maintaining their relative spacing and properly handling weekends/blocked dates.

---

## Current State Analysis

### What's Already Working ✅
- Single component drag/drop (page.tsx:1068-1109)
- Multi-select with visual feedback (darker borders, shadow)
- Selection state management (`selectedComponents` Set)
- `addSchoolDays()` helper function for date calculations
- Social Studies components have no `group_id` (independent)

### What Needs Building 🔨
- Detect when dragging a selected component with multiple selections
- Visual ghost preview showing all selected components
- Calculate relative spacing between components
- Update all components' dates on drop
- Error handling for partial failures

---

## Implementation Strategy

### Phase A: Drag Detection & State (1 hour)
Update `onDragStart` to detect multi-drag scenario and prepare state.

### Phase B: Visual Ghost Preview (2 hours)
Show ghost indicators for all selected components being dragged.

### Phase C: Drop Logic with Relative Spacing (2 hours)
Calculate new dates for all components, maintaining their relative positions.

### Phase D: Error Handling & Testing (1 hour)
Handle edge cases, blocked dates, and API failures gracefully.

**Total Time: 6 hours**

---

## Detailed Implementation

### Phase A: Drag Detection & State

#### Current Code (page.tsx:1068-1105)
```typescript
onDragStart={(e) => {
  e.dataTransfer.setData('existing-component', JSON.stringify(component));

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
```

#### Updated Code
```typescript
onDragStart={(e) => {
  // Check if dragging a selected component with multiple selections
  if (selectedComponents.has(component.id) && selectedComponents.size > 1) {
    // MULTI-DRAG MODE
    const selectedComponentsData = scheduledComponents
      .filter(c => selectedComponents.has(c.id))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    // Store all selected components for drop handling
    e.dataTransfer.setData('multi-drag-components', JSON.stringify(selectedComponentsData));

    // Create visual drag image showing count
    const dragImg = document.createElement('div');
    dragImg.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 12px 16px;
      background-color: white;
      border: 2px solid #6366F1;
      border-radius: 8px;
      color: #1f2937;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    dragImg.textContent = `Moving ${selectedComponents.size} components`;
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 0, 0);
    setTimeout(() => document.body.removeChild(dragImg), 0);

    // Set state to show ghost previews
    setDraggedComponent({
      duration: 0, // Not used for multi-drag
      isExisting: true,
      multiDragComponents: selectedComponentsData.map(c => ({
        start_date: c.start_date,
        duration_days: c.duration_days
      }))
    });
  } else if (component.group_id) {
    // Existing group drag logic (ELA rotation, etc.)
    // ... keep existing code
  } else {
    // Single component drag
    e.dataTransfer.setData('existing-component', JSON.stringify(component));
    setDraggedComponent({ duration: component.duration_days, isExisting: true });
  }
}}
```

#### State Type Update
```typescript
const [draggedComponent, setDraggedComponent] = useState<{
  duration: number;
  isExisting: boolean;
  groupComponents?: Array<{ start_date: string; duration_days: number }>;
  multiDragComponents?: Array<{ start_date: string; duration_days: number }>; // NEW
} | null>(null);
```

---

### Phase B: Visual Ghost Preview

#### Current Ghost Logic (page.tsx:~850)
```typescript
const shouldShowGhost = (date: Date): boolean => {
  if (!draggedComponent || !draggedComponent.isExisting) return false;

  // Show ghost for single component OR group components
  // ... existing logic
};
```

#### Updated Ghost Logic
```typescript
const shouldShowGhost = (date: Date): boolean => {
  if (!draggedComponent || !draggedComponent.isExisting) return false;

  // MULTI-DRAG: Show ghosts for all selected components
  if (draggedComponent.multiDragComponents) {
    return draggedComponent.multiDragComponents.some(comp => {
      const compDate = new Date(comp.start_date);
      // Check if date matches any of the component dates
      // (This is simplified - actual logic will handle multi-day components)
      return date.toDateString() === compDate.toDateString();
    });
  }

  // Single component ghost
  if (draggedComponent.groupComponents) {
    // ... existing group logic
  }

  // ... existing single component logic
};
```

#### Ghost Preview Refinement
To show exactly which cells will be affected:

```typescript
const getMultiDragGhostDates = (): Set<string> => {
  if (!draggedComponent?.multiDragComponents) return new Set();

  const ghostDates = new Set<string>();

  draggedComponent.multiDragComponents.forEach(comp => {
    let currentDate = comp.start_date;

    // Add all dates this component occupies
    for (let i = 0; i < comp.duration_days; i++) {
      ghostDates.add(currentDate);
      if (i < comp.duration_days - 1) {
        // Move to next school day
        currentDate = addSchoolDays(
          new Date(currentDate),
          1,
          new Set() // Don't skip blocked dates for ghost
        ).toISOString().split('T')[0];
      }
    }
  });

  return ghostDates;
};

// Then in shouldShowGhost:
const shouldShowGhost = (date: Date): boolean => {
  if (!draggedComponent || !draggedComponent.isExisting) return false;

  if (draggedComponent.multiDragComponents) {
    const ghostDates = getMultiDragGhostDates();
    const dateString = date.toISOString().split('T')[0];
    return ghostDates.has(dateString);
  }

  // ... existing logic
};
```

---

### Phase C: Drop Logic with Relative Spacing

#### Key Challenge
Maintain relative spacing between components while accounting for weekends/blocked dates.

**Example:**
```
Original:
  Mon Sep 2: Component A (start)
  Tue Sep 3: Component B (+1 school day)
  Wed Sep 4: Component C (+2 school days)

Drag to Mon Sep 9:
  Mon Sep 9: Component A (new start)
  Tue Sep 10: Component B (+1 school day)
  Wed Sep 11: Component C (+2 school days)
```

**BUT if there's a blocked date:**
```
Original:
  Mon Sep 2: Component A
  Tue Sep 3: Component B (+1 school day)
  Wed Sep 4: Component C (+2 school days)

Drag to Fri Sep 6 (with Labor Day Mon Sep 9):
  Fri Sep 6: Component A (new start)
  Tue Sep 10: Component B (+1 school day, skip weekend + Labor Day)
  Wed Sep 11: Component C (+2 school days from A)
```

#### Calculate Relative Offsets
```typescript
const calculateRelativeOffsets = (components: ScheduledComponent[]) => {
  // Sort by start_date
  const sorted = [...components].sort((a, b) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const baseDate = new Date(sorted[0].start_date);

  return sorted.map(comp => {
    const compDate = new Date(comp.start_date);

    // Calculate school days between base and this component
    let schoolDaysOffset = 0;
    let currentDate = new Date(baseDate);

    while (currentDate < compDate) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        schoolDaysOffset++;
      }
    }

    return {
      component: comp,
      schoolDaysOffset: schoolDaysOffset
    };
  });
};
```

#### Updated handleDrop Function
```typescript
const handleDrop = async (date: Date, e: React.DragEvent) => {
  e.preventDefault();

  try {
    // Check for multi-drag data
    const multiDragData = e.dataTransfer.getData('multi-drag-components');

    if (multiDragData) {
      // MULTI-DRAG DROP HANDLING
      const components = JSON.parse(multiDragData);

      // Calculate relative offsets from first component
      const offsetData = calculateRelativeOffsets(components);

      // Get blocked dates
      const blockedDatesResult = await fetch(`/api/pacing-guides/${guide?.id}/blocked-dates`);
      const blockedDates = new Set<string>(await blockedDatesResult.json());

      // Calculate new dates for each component
      const newStartDate = formatDateForDB(date);
      const updates = offsetData.map(({ component, schoolDaysOffset }) => {
        const newDate = addSchoolDays(newStartDate, schoolDaysOffset, blockedDates);
        return {
          id: component.id,
          start_date: newDate
        };
      });

      // Update all components in a single API call
      const response = await fetch(`/api/scheduled-components/bulk-move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Failed to move components');
      }

      // Refresh guide
      await fetchGuide();

      // Clear selection
      clearSelection();

      return;
    }

    // Check for existing single component data
    const existingComponentData = e.dataTransfer.getData('existing-component');

    if (existingComponentData) {
      // ... existing single component drop logic
    }

    // ... rest of existing drop logic
  } catch (error) {
    console.error('Drop error:', error);
    alert('Failed to move component(s). Please try again.');
  }
};
```

---

### Phase D: Bulk Move API Endpoint

**File:** `app/api/scheduled-components/bulk-move/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// PATCH - Bulk move scheduled components
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { updates } = await req.json();
    // updates = [{ id: 'comp-1', start_date: '2024-09-09' }, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify all components belong to calendars owned by this user
    const componentIds = updates.map(u => u.id);

    const verifyQuery = `
      SELECT sc.id
      FROM scheduled_components sc
      JOIN subject_calendars cal ON sc.subject_calendar_id = cal.id
      JOIN pacing_guides pg ON cal.pacing_guide_id = pg.id
      WHERE sc.id = ANY($1) AND pg.user_id = $2
    `;

    const verifyResult = await pool.query(verifyQuery, [componentIds, session.user.id]);

    if (verifyResult.rows.length !== componentIds.length) {
      return NextResponse.json(
        { error: 'One or more components not found or unauthorized' },
        { status: 403 }
      );
    }

    // Update all components in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const update of updates) {
        await client.query(
          'UPDATE scheduled_components SET start_date = $1 WHERE id = $2',
          [update.start_date, update.id]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        updated_count: updates.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk move error:', error);
    return NextResponse.json(
      { error: 'Failed to move components' },
      { status: 500 }
    );
  }
}
```

---

## Edge Cases & Error Handling

### 1. Not Enough Space
**Problem:** Selected components span 10 days, but only 5 school days available at drop location.

**Solution:**
```typescript
// Before making API call, validate there's enough space
const validateDropLocation = (dropDate: Date, componentsData: any[]) => {
  // Calculate total school days needed
  const lastComponent = componentsData[componentsData.length - 1];
  const lastOffset = calculateSchoolDaysOffset(componentsData[0].start_date, lastComponent.start_date);
  const totalDaysNeeded = lastOffset + lastComponent.duration_days;

  // Calculate available school days from drop date to end of school year
  const availableDays = calculateSchoolDaysUntil(dropDate, new Date(guide.last_day));

  if (availableDays < totalDaysNeeded) {
    throw new Error(`Not enough space: need ${totalDaysNeeded} school days, only ${availableDays} available`);
  }
};
```

### 2. Blocked Date Collision
**Problem:** One of the components would land on a blocked date.

**Solution:** `addSchoolDays()` already handles this - it skips blocked dates automatically!

### 3. Partial API Failure
**Problem:** Database transaction fails halfway through updates.

**Solution:** Transaction rollback in API endpoint ensures all-or-nothing update.

### 4. Dragging Across Subjects
**Problem:** Components from different subjects selected (shouldn't happen with current UI).

**Solution:**
```typescript
// Validate all selected components are from the same subject
if (multiDragData) {
  const components = JSON.parse(multiDragData);
  const subjects = new Set(components.map(c => c.subject));

  if (subjects.size > 1) {
    alert('Cannot move components from different subjects together');
    return;
  }
}
```

---

## Testing Plan

### Manual Testing Checklist

#### Basic Multi-Drag
- [ ] Select 2 components → Drag to new date → Both move with spacing maintained
- [ ] Select 5 components → Drag to new date → All move correctly
- [ ] Drag image shows "Moving X components"

#### Ghost Preview
- [ ] Ghost indicators appear on original dates when dragging
- [ ] Ghost indicators match number of days each component occupies
- [ ] Ghosts disappear after drop

#### Relative Spacing
- [ ] Components 1 day apart stay 1 school day apart after move
- [ ] Components 5 days apart stay 5 school days apart after move
- [ ] Weekend in original spacing → weekend in new spacing

#### Weekend/Blocked Date Handling
- [ ] Drag across weekend → Components skip weekend correctly
- [ ] Drag to date before blocked date → Components skip blocked date
- [ ] Drag to Friday → Monday components land on Tuesday (skip weekend)

#### Edge Cases
- [ ] Select 1 component → Drag works like before (single drag)
- [ ] Drag to date with insufficient space → Shows error
- [ ] Drag while one component is ELA rotation (has group_id) → Prevents drag
- [ ] Cancel drag (press Esc) → Nothing changes

#### Error Scenarios
- [ ] Network error during API call → Shows error, doesn't partial update
- [ ] Drag to invalid date → Shows error
- [ ] Simultaneous edits by different users → Handles gracefully

#### Selection Integration
- [ ] After successful drag → Selection clears
- [ ] After failed drag → Selection remains
- [ ] Drag unselected component while others selected → Only drags one

---

## Known Pitfalls & How to Avoid

### Pitfall 1: Date Format Confusion
**Issue:** JavaScript Date objects are UTC, database dates are local YYYY-MM-DD.

**Solution:** Always use `formatDateForDB()` helper and parse with local timezone:
```typescript
const formatDateForDB = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
```

### Pitfall 2: Ghost Preview Performance
**Issue:** Recalculating ghost positions on every render can lag.

**Solution:** Memoize ghost date calculations:
```typescript
const ghostDates = useMemo(() => {
  if (!draggedComponent?.multiDragComponents) return new Set();
  return getMultiDragGhostDates();
}, [draggedComponent]);
```

### Pitfall 3: Stale Blocked Dates
**Issue:** Blocked dates might change during drag operation.

**Solution:** Fetch blocked dates on drop, not on drag start.

### Pitfall 4: Transaction Timeout
**Issue:** Updating 20+ components might timeout.

**Solution:** Use batch updates with PostgreSQL:
```sql
UPDATE scheduled_components AS sc SET
  start_date = u.start_date
FROM (VALUES
  ('id1', '2024-09-09'),
  ('id2', '2024-09-10'),
  ...
) AS u(id, start_date)
WHERE sc.id = u.id;
```

### Pitfall 5: Visual Jank During Drag
**Issue:** Ghost preview flickers or appears/disappears.

**Solution:** Use CSS transitions and stable state updates:
```typescript
// Debounce dragOver events
const debouncedSetDragOverCell = useMemo(
  () => debounce(setDragOverCell, 50),
  []
);
```

---

## Rollback Plan

If bugs are discovered after deployment:

1. **Quick Disable:** Add feature flag to `page.tsx`:
   ```typescript
   const MULTI_DRAG_ENABLED = false; // Set to false to disable

   if (MULTI_DRAG_ENABLED && selectedComponents.has(component.id) && selectedComponents.size > 1) {
     // Multi-drag logic
   }
   ```

2. **Revert to Single Drag:** Remove multi-drag checks, keep existing behavior:
   - Remove `multiDragComponents` from state
   - Remove multi-drag detection in `onDragStart`
   - Remove ghost preview logic for multi-drag
   - Users can still drag one at a time

3. **Database Safety:** No schema changes required - rollback is purely frontend.

---

## Success Metrics

### User Experience
- Dragging 5 components feels as smooth as dragging 1
- Ghost preview clearly shows what will happen
- No UI lag or flickering during drag

### Technical Performance
- API call completes in < 1 second for 10 components
- Ghost calculations don't impact frame rate
- Transaction succeeds 99.9% of the time

### Bug Rate
- Zero data loss bugs (partial updates)
- < 1% edge case errors (invalid drops)
- All errors show clear user messages

---

## Implementation Order (For Tomorrow)

1. ✅ **Start Fresh:** Review this plan, coffee in hand
2. ⏰ **Phase A** (1 hour): Update drag detection and state
3. ⏰ **Phase B** (2 hours): Implement ghost preview
4. ⏰ **Phase C** (2 hours): Build drop logic and API endpoint
5. ⏰ **Phase D** (1 hour): Test edge cases and error handling
6. 🎉 **Demo:** Show off the polished multi-drag feature!

**Total: 6 hours** (with breaks)

---

## Questions to Answer Tomorrow

Before starting implementation:

1. Should we limit max number of components that can be dragged at once? (e.g., max 20)
2. Should dragging across subjects be allowed? (Currently: same subject only)
3. What happens if user drags but doesn't have sufficient space? (Show warning before or after?)
4. Should ghost preview show component titles or just colored blocks?
5. After successful drag, should selection clear or remain?

**Recommended Answers:**
1. Yes - limit to 25 components (API timeout concern)
2. No - keep same subject only (simpler UX)
3. Show warning before drop attempt (validate on dragOver)
4. Just colored blocks (titles clutter the preview)
5. Clear selection (drag operation complete)

---

## Final Thoughts

This is a **high-impact feature** that will make your app feel incredibly polished. The key to success is:

✅ **Thorough testing** - Test every edge case
✅ **Clear error messages** - Tell users what went wrong and why
✅ **Performance monitoring** - Make sure it's smooth for 10+ components
✅ **Graceful degradation** - If something fails, fail safely

You've got a solid foundation with multi-select already working. Tomorrow we'll build on that foundation and create something really special! 🚀

---

## Appendix: Visual Mockups

### Drag Start
```
[User clicks and drags Component 2]

Component 1: Selected (darker border)
Component 2: Selected + Being Dragged
Component 3: Selected (darker border)

Drag Image: "Moving 3 components"
```

### During Drag
```
Original location shows ghosts:
┌────────────┐  ┌────────────┐  ┌────────────┐
│ [Ghost 1]  │  │ [Ghost 2]  │  │ [Ghost 3]  │
└────────────┘  └────────────┘  └────────────┘
     ↓               ↓               ↓
     (Faded, purple tint, dashed border)

Drop location shows hover highlight:
     ↓
┌────────────┐
│ DROP HERE  │ ← Purple background
└────────────┘
```

### After Drop
```
New location:
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Component 1│  │ Component 2│  │ Component 3│
└────────────┘  └────────────┘  └────────────┘
   Sep 9           Sep 10          Sep 11

Selection: Cleared
Floating badge: Hidden
```
