# Edit Component Modal - Start Date Issue

**Date:** October 14, 2025
**Status:** 🔍 ISSUE IDENTIFIED - Solution Needed
**Priority:** Medium - Affects user experience but has workaround (drag-and-drop still works)

---

## 📋 Table of Contents
1. [The Problem](#the-problem)
2. [Current Behavior](#current-behavior)
3. [Root Cause Analysis](#root-cause-analysis)
4. [Technical Details](#technical-details)
5. [Proposed Solutions](#proposed-solutions)
6. [Decision Needed](#decision-needed)

---

## The Problem

**User Report:**
> "When I click on a component (any of the system components), the Start Date in the Edit Component modal always shows today's actual date, not the date that the component is actually placed. When I try to set a date and click Save Changes, the component just disappears."

**Impact:**
- Users cannot reliably edit component properties without accidentally moving components
- Components "disappear" (moved to today's date, outside visible calendar range)
- Confusing UX - displayed date doesn't match component's actual position

---

## Current Behavior

### What Happens Now

1. **User clicks on a scheduled component** on the pacing guide calendar
2. **Edit Component modal opens** with these fields:
   - Title (or Rotation Number / Unit-Lesson for grouped components)
   - **Start Date** ← Shows today's date (WRONG!)
   - Duration (school days)
   - Color
3. **User tries to edit something** (e.g., change color or duration)
4. **User clicks "Save Changes"**
5. **Component disappears** from its original location
6. **Component moved to today's date** (which may be outside visible calendar range)

### Example Scenario

**Setup:**
- School year: October 6, 2025 - June 5, 2026
- User places "Orientation Week" component on October 6, 2025
- Today's date: October 14, 2025
- User viewing: October 2025 calendar

**Steps:**
1. User clicks "Orientation Week" component (start_date: 2025-10-06)
2. Modal opens showing:
   - Title: "Orientation Week"
   - Start Date: **2025-10-14** ← Should show 2025-10-06!
   - Duration: 5 days
   - Color: Purple
3. User changes duration to 4 days
4. User clicks "Save Changes"
5. Component disappears from October 6
6. Component now positioned at October 14 (today)

**Result:** Component accidentally moved, not just edited!

---

## Root Cause Analysis

### File: `components/EditComponentModal.tsx`

#### Issue 1: State Initialization

**Lines 37, 55:**
```typescript
const [startDate, setStartDate] = useState('');

useEffect(() => {
  if (component) {
    setStartDate(component.start_date || '');
    // ... other fields
  }
}, [component]);
```

**Problem:**
- HTML `<input type="date">` with empty value defaults to **today's date** in the browser
- If `component.start_date` is undefined/null/empty, the field shows today
- The actual `component.start_date` value IS set correctly from the database
- But the visual display defaults to today when value is falsy

#### Issue 2: Always Sending start_date in Updates

**Lines 115-117:**
```typescript
// Always include duration and start_date
updates.duration_days = duration;
updates.start_date = startDate;
```

**Problem:**
- Even if user only wants to change color or duration, `start_date` is ALWAYS sent
- If the date field shows today's date (due to Issue 1), it sends today's date to API
- API updates the component's start_date to today
- Component moves to today's position on calendar

#### Issue 3: Frontend State Update Bug

**File: `app/dashboard/guides/[id]/page.tsx` (Line 456)**

```typescript
} else {
  // Single component update
  setScheduledComponents(scheduledComponents.map(c =>
    c.id === editingComponent.id
      ? { ...c, ...updates }  // ← Blindly merges updates
      : c
  ));
}
```

**Problem:**
- Frontend updates local state with whatever was sent in `updates`
- If `updates.start_date` is today's date, the component moves in the UI immediately
- No validation that the date change was intentional

---

## Technical Details

### Files Involved

1. **`components/EditComponentModal.tsx`**
   - Purpose: UI modal for editing component properties
   - Lines of interest: 37 (state), 55 (useEffect), 115-117 (save), 236-247 (date input)

2. **`app/dashboard/guides/[id]/page.tsx`**
   - Purpose: Main pacing guide page with calendar grid
   - Lines of interest: 430-460 (handleSaveComponent), 913 (onClick to open modal)

3. **`app/api/scheduled-components/[id]/route.ts`**
   - Purpose: API endpoint for updating components
   - Lines of interest: 146-159 (field validation), 174-186 (UPDATE query)

### Database Schema

```sql
-- scheduled_components table
CREATE TABLE scheduled_components (
  id UUID PRIMARY KEY,
  subject_calendar_id UUID REFERENCES subject_calendars(id),
  component_key VARCHAR(255),
  subject VARCHAR(50),
  start_date DATE NOT NULL,  -- ← The critical field
  duration_days INTEGER NOT NULL,
  title_override TEXT,
  "order" INTEGER,
  notes TEXT,
  group_id UUID,
  color_override VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Point:** `start_date` is NOT NULL - it must always have a value. This is correct because components must be positioned somewhere on the calendar.

### Component Positioning Logic

Components are positioned on the calendar grid using:

**File: `app/dashboard/guides/[id]/page.tsx` (Lines 196-201)**
```typescript
return scheduledComponents.filter((component) => {
  const componentStart = new Date(component.start_date);
  // Calculate end date by adding school days only
  const componentEnd = addSchoolDays(componentStart, component.duration_days - 1);

  // Check if date falls within the range and is a school day
  // ... (filters by selected subject and date range)
});
```

**Key Point:** `start_date` determines component position. Changing it = moving the component.

---

## Proposed Solutions

### ✅ Option 1: Remove Start Date Field from Modal (RECOMMENDED)

**Rationale:**
- Components are positioned via **drag-and-drop** (which updates start_date automatically)
- Users don't need to manually edit dates - they just drag components to where they want them
- Having an editable date field is redundant and causes confusion
- Duration can still be edited without needing to edit start_date

**Changes needed:**
1. Remove the Start Date input field from the modal UI
2. Remove `startDate` from state variables
3. Do NOT include `start_date` in updates object when saving
4. Keep drag-and-drop functionality (which already updates start_date correctly)

**Pros:**
- ✅ Prevents accidental component moves
- ✅ Cleaner, simpler UI
- ✅ Matches user mental model (drag to position, modal to configure)
- ✅ No risk of date field bugs

**Cons:**
- ❌ Users cannot type a date to move component (must drag)
- ❌ No quick way to move component to specific date without calendar navigation

**Implementation:**
- Remove lines 37, 55, 117, 236-247 from EditComponentModal.tsx
- Update handleSave to exclude start_date from updates
- Test rotation sessions and TT/WW blocks to ensure they still work

---

### ⚠️ Option 2: Make Start Date Read-Only

**Rationale:**
- Show users the component's position date for reference
- Prevent editing to avoid accidental moves
- Keep date visible for context

**Changes needed:**
1. Add `disabled` or `readOnly` attribute to date input
2. Style it to look informational (not editable)
3. Do NOT include `start_date` in updates

**Pros:**
- ✅ Users can see the date for reference
- ✅ Prevents accidental moves
- ✅ Clear that positioning is done via drag-and-drop

**Cons:**
- ❌ Field takes up space but isn't useful
- ❌ Might confuse users ("Why can't I edit this?")

**Implementation:**
```tsx
<input
  type="date"
  value={startDate}
  disabled
  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
/>
<p className="text-xs text-gray-500 mt-1">
  To change the start date, drag the component on the calendar
</p>
```

---

### ⚠️ Option 3: Fix the Date Display and Make It Editable

**Rationale:**
- Some users might want to type a specific date
- Provides flexibility for power users

**Changes needed:**
1. Debug why `component.start_date` isn't displaying correctly
2. Add validation to ensure date is within school year range
3. Add confirmation modal: "This will move the component. Continue?"
4. Update frontend to re-render calendar after date change

**Pros:**
- ✅ Maximum flexibility
- ✅ Allows precise date entry without dragging

**Cons:**
- ❌ More complex implementation
- ❌ Requires validation and confirmation flows
- ❌ Still risks accidental moves
- ❌ Duplicates functionality (drag vs type)

**Implementation complexity:** High

---

### ❌ Option 4: Separate "Move" from "Edit"

**Rationale:**
- Edit modal only edits properties (title, duration, color)
- Separate "Move Component" action with date picker
- Clear separation of concerns

**Changes needed:**
1. Remove start_date from edit modal
2. Add separate "Move to Date" button/action in component context menu
3. Create new modal or date picker for moving

**Pros:**
- ✅ Crystal clear UX
- ✅ No accidental moves
- ✅ Power users get date picker for precise positioning

**Cons:**
- ❌ Requires new UI components
- ❌ More implementation work
- ❌ Might be overkill for drag-and-drop calendar

**Implementation complexity:** High

---

## Decision Needed

**Recommended approach:** **Option 1 - Remove Start Date Field from Modal**

**Why?**
1. **Simplest solution** - Remove code rather than add complexity
2. **Matches user mental model** - Drag to position, modal to configure
3. **Prevents the bug** - Can't accidentally move if field doesn't exist
4. **Cleaner UX** - Less clutter, less confusion
5. **Aligns with existing interaction pattern** - Drag-and-drop is already the primary positioning method

**Alternative if date reference is valuable:** **Option 2 - Read-Only Date**
- Only if user feedback indicates they want to see the date for reference
- Adds minimal complexity while showing information

---

## Implementation Checklist

### If Option 1 (Remove Field) is chosen:

**File: `components/EditComponentModal.tsx`**
- [ ] Remove `const [startDate, setStartDate] = useState('');` (line 37)
- [ ] Remove `setStartDate(component.start_date || '');` from useEffect (line 55)
- [ ] Remove `updates.start_date = startDate;` from handleSave (line 117)
- [ ] Remove the entire Start Date input section (lines 236-247)
- [ ] Test: Edit component title → Should save without moving
- [ ] Test: Edit component duration → Should expand/shrink in place
- [ ] Test: Edit component color → Should change color only
- [ ] Test: Rotation session edit → Should update rotation number without moving
- [ ] Test: TT/WW block edit → Should update unit/lesson without moving

**File: `app/dashboard/guides/[id]/page.tsx`**
- [ ] Verify handleSaveComponent correctly handles updates without start_date
- [ ] Test: Drag component to new date → Should still work
- [ ] Test: After editing, component stays in original position

---

## Notes

- The drag-and-drop functionality already handles start_date updates correctly
- Components with `group_id` (rotation sessions, TT/WW blocks) need special handling
- Duration changes work correctly and don't move the component
- Color changes work correctly and don't move the component
- Only start_date changes move the component (which is by design)

---

**Last Updated:** October 14, 2025
**Next Action:** User to decide on solution approach
**Related Files:**
- `components/EditComponentModal.tsx`
- `app/dashboard/guides/[id]/page.tsx`
- `app/api/scheduled-components/[id]/route.ts`
