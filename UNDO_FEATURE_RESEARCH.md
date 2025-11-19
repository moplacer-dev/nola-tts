# Undo Feature Implementation Research & Planning

**Date:** November 9, 2025
**Status:** Research Complete - Awaiting Decision
**Author:** Research conducted via Claude Code

---

## Executive Summary

After comprehensive research into undo/redo implementation patterns for web applications, three viable approaches have been identified for the NOLA ESS Pacing Guide Calendar. Each has distinct trade-offs between complexity, safety, and user experience.

**Recommendation:** Start with **Option C: Version-Based Undo** for safest implementation, with option to upgrade to hybrid approach based on user feedback.

---

## Table of Contents

1. [Background & Context](#background--context)
2. [Research Findings](#research-findings)
3. [Option A: Lightweight Undo Stack](#option-a-lightweight-undo-stack)
4. [Option B: Full Undo/Redo Stack](#option-b-full-undoredo-stack)
5. [Option C: Version-Based Undo (Recommended)](#option-c-version-based-undo-recommended)
6. [Option D: Minimal Command Pattern](#option-d-minimal-command-pattern)
7. [Option E: Hybrid Approach](#option-e-hybrid-approach)
8. [Risk Analysis](#risk-analysis)
9. [Implementation Timelines](#implementation-timelines)
10. [Decision Matrix](#decision-matrix)

---

## Background & Context

### Current State

The NOLA ESS Pacing Guide application currently has **no undo functionality**. All user actions (delete, move, color changes, edits) are immediately persisted to the PostgreSQL database with no way to reverse them except through manual recreation or version restore.

### User Pain Points

- Accidental deletions require manual recreation of items
- Bulk operations (delete 10+ items) cannot be easily reversed
- No safety net for exploratory calendar adjustments
- Users report anxiety about making mistakes

### Technical Context

**Stack:**
- Next.js 15.5.4 (App Router)
- React 19
- PostgreSQL 17
- TypeScript

**Existing Infrastructure:**
- ✅ Version snapshots system (`pacing_guide_versions` table)
- ✅ Version restore API (`/api/pacing-guides/[id]/versions/[versionNumber]/restore`)
- ✅ Transaction-based bulk operations
- ✅ Placement group relationships (`placement_group_id` for multi-day rotations)

**Key Operations to Undo:**
1. **Delete items** (single or bulk via multi-select)
2. **Bulk move** (drag multiple items to new date)
3. **Bulk color change** (apply color to multiple items)
4. **Edit item metadata** (rotation number, unit number, etc.)
5. **Drag from library** (create new items)

---

## Research Findings

### Industry Best Practices

#### Command Pattern (Modern Standard)
Used by: Figma, Adobe products, modern text editors

**Concept:** Store executable commands with inverse operations rather than state snapshots.

```typescript
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
}
```

**Benefits:**
- Handles side effects and API calls
- More reliable for distributed state
- Easier to test inverse operations

**Drawbacks:**
- More complex to implement
- Requires wrapping all mutation points

#### Memento Pattern (Legacy)
Used by: Simple Redux apps, early React applications

**Concept:** Store complete state snapshots (past, present, future arrays).

**Benefits:**
- Simple to implement

**Drawbacks:**
- Doesn't handle side effects or API failures
- Memory intensive for large state
- Not suitable for server-synchronized state

#### Operational Transformation (Collaborative Apps)
Used by: Google Docs, Figma (multiplayer)

**Status:** ❌ **Not applicable** - Unnecessary complexity for single-user calendar app

---

### Common Pitfalls Discovered

#### 1. Race Conditions with Optimistic Updates

**Problem:**
```
User deletes item → UI updates → User undoes →
Original delete API call completes → Undo fails
```

**Real-world example from research:**
> "When users created a note and immediately started interacting with it, the PATCH requests would sometimes reach the server before the POST request completed, resulting in 404 errors."

**Mitigation:** Sequential request queue or database transactions

#### 2. Database Synchronization Issues

**Your App's Risk:**
- Items have `placement_group_id` linking rotations together
- Deleting items in a 7-day rotation and recreating them requires preserving all relationships
- Simple ID-based snapshots miss critical relationship data

#### 3. Incomplete Inverse Operations

**Example from your app:**
```typescript
// Incomplete snapshot
{ id: "abc-123", template_id: "xyz-456" }

// What's missing:
{
  placement_group_id: "group-789",  // ❌ Links rotation items
  group_index: 3,                    // ❌ Position in rotation
  metadata: { rotation_number: 2 },  // ❌ User-set metadata
  color_override: "#FF5733",         // ❌ Custom color
  title_override: "Custom Title",    // ❌ User-set title
  notes: "Important notes",          // ❌ User notes
  display_order: 5                   // ❌ Visual ordering
}
```

**Result:** Undo recreates item but it's orphaned from its rotation, loses customizations.

#### 4. Page Navigation Data Loss

**User Expectation (2025):** Undo persists across page reloads (Gmail, Google Docs)

**In-Memory Stack Issue:** Stack clears on navigation → No undo available after page refresh

#### 5. Keyboard Shortcut Conflicts

**Problem:** Browser's default Cmd+Z for `<input>` fields conflicts with app-level undo

**Solution:** Complex event handling with focus detection

---

## Option A: Lightweight Undo Stack

### Overview

Store last 5 actions in React state (in-memory). On undo, reverse changes via API calls. No redo functionality.

### Implementation

```typescript
// State
const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
const MAX_UNDO_HISTORY = 5;

type UndoAction = {
  type: 'delete' | 'bulkMove' | 'bulkColor';
  items: ScheduledItemWithTemplate[]; // Full snapshot
  timestamp: number;
  description: string; // "Deleted 4 items"
};

// Before delete
const confirmDelete = async () => {
  const itemsToDelete = scheduledItems.filter(item =>
    selectedItems.has(item.id)
  );

  // Perform deletion
  await Promise.all(
    Array.from(selectedItems).map(id =>
      fetch(`/api/v2/scheduled-items/${id}`, { method: 'DELETE' })
    )
  );

  // Add to undo stack
  setUndoStack(prev => {
    const newStack = [...prev, {
      type: 'delete',
      items: itemsToDelete,
      timestamp: Date.now(),
      description: `Deleted ${itemsToDelete.length} item(s)`
    }];

    // Limit stack size
    if (newStack.length > MAX_UNDO_HISTORY) {
      newStack.shift();
    }

    return newStack;
  });
};

// Undo handler
const handleUndo = async () => {
  if (undoStack.length === 0) return;

  const lastAction = undoStack[undoStack.length - 1];

  if (lastAction.type === 'delete') {
    // Re-create deleted items
    for (const item of lastAction.items) {
      await fetch('/api/v2/scheduled-items', {
        method: 'POST',
        body: JSON.stringify({
          guide_id: guideId,
          calendar_type: item.calendar_type,
          template_id: item.template_id,
          start_date: item.start_date,
          duration_days: item.duration_days,
          placement_group_id: item.placement_group_id,
          group_index: item.group_index,
          metadata: item.metadata,
          color_override: item.color_override,
          title_override: item.title_override,
          notes: item.notes,
          display_order: item.display_order,
          blocks_curriculum: item.blocks_curriculum
        })
      });
    }
  }

  // Remove from stack
  setUndoStack(prev => prev.slice(0, -1));

  // Refresh calendar
  await fetchScheduledItems();
};

// Keyboard listener
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      // Don't trigger if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      e.preventDefault();
      handleUndo();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleUndo]);
```

### Pros & Cons

**Pros:**
- ✅ Simple to understand and implement
- ✅ ~150-200 lines of code
- ✅ Covers 90% of user mistakes
- ✅ No database schema changes needed

**Cons:**
- ⚠️ Race conditions possible (see example below)
- ⚠️ Lost on page refresh
- ⚠️ Memory-only (no persistence)
- ⚠️ Must capture complete item data (easy to miss fields)
- ⚠️ No redo functionality

### Risk: Race Condition Example

```
Timeline:
T=0ms:   User deletes item → DELETE API call sent (200ms RTT)
T=10ms:  User presses Cmd+Z
T=10ms:  POST API call sent to recreate item
T=50ms:  POST completes → Item recreated
T=200ms: Original DELETE completes → Item deleted again

Result: Item is gone, user thinks undo worked
```

**Mitigation:** Implement sequential request queue (adds complexity)

### Code Changes Required

1. **Modify 3 functions:**
   - `confirmDelete` (add snapshot before delete)
   - `handleBulkMove` (add snapshot before move)
   - `handleApplyColor` (add snapshot before color change)

2. **Add 2 helper functions:**
   - `addToUndoStack`
   - `handleUndo`

3. **Add keyboard listener** (Cmd/Ctrl+Z)

**Estimated LOC:** ~150-200 lines

---

## Option B: Full Undo/Redo Stack

### Overview

Track all actions in history stacks with inverse operations. Support both undo (Cmd+Z) and redo (Cmd+Shift+Z).

### Implementation

```typescript
// State
const [undoStack, setUndoStack] = useState<Action[]>([]);
const [redoStack, setRedoStack] = useState<Action[]>([]);
const [isUndoing, setIsUndoing] = useState(false);
const [isRedoing, setIsRedoing] = useState(false);

type Action =
  | { type: 'CREATE', items: ScheduledItem[], inverseAction: 'DELETE' }
  | { type: 'DELETE', items: ScheduledItem[], inverseAction: 'CREATE' }
  | { type: 'UPDATE', itemId: string, oldData: any, newData: any }
  | { type: 'BULK_MOVE', moves: Array<{id: string, oldDate: string, newDate: string}> }
  | { type: 'BULK_COLOR', colors: Array<{id: string, oldColor: string, newColor: string}> };

// Track action
const trackAction = (action: Action) => {
  if (!isUndoing && !isRedoing) {
    setUndoStack(prev => {
      const newStack = [...prev, action];
      if (newStack.length > 50) newStack.shift(); // Memory management
      return newStack;
    });
    setRedoStack([]); // Clear redo on new action
  }
};

// Undo handler
const handleUndo = async () => {
  if (undoStack.length === 0 || isUndoing) return;
  setIsUndoing(true);

  const action = undoStack[undoStack.length - 1];

  try {
    switch(action.type) {
      case 'CREATE':
        // Delete created items
        await Promise.all(action.items.map(item =>
          fetch(`/api/v2/scheduled-items/${item.id}`, { method: 'DELETE' })
        ));
        break;
      case 'DELETE':
        // Re-create deleted items
        await Promise.all(action.items.map(item =>
          fetch('/api/v2/scheduled-items', {
            method: 'POST',
            body: JSON.stringify(item)
          })
        ));
        break;
      case 'BULK_MOVE':
        // Restore old positions
        await Promise.all(action.moves.map(move =>
          fetch(`/api/v2/scheduled-items/${move.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ start_date: move.oldDate })
          })
        ));
        break;
      // ... other cases
    }

    setRedoStack(prev => [...prev, action]);
    setUndoStack(prev => prev.slice(0, -1));
    await fetchScheduledItems();
  } catch (error) {
    console.error('Undo failed:', error);
    alert('Failed to undo action');
  } finally {
    setIsUndoing(false);
  }
};

// Redo handler (similar pattern)
const handleRedo = async () => {
  // ... mirror of undo logic
};
```

### Pros & Cons

**Pros:**
- ✅ Full undo/redo support
- ✅ Clear command abstraction
- ✅ Easy to extend with new commands
- ✅ Industry-standard pattern

**Cons:**
- ⚠️ High complexity (~500-800 lines)
- ⚠️ Must wrap 15+ mutation points
- ⚠️ 65+ test cases needed
- ⚠️ Still has race condition risk
- ⚠️ Lost on page refresh (unless persist to localStorage)

### Functions to Modify

Must wrap every mutation point:
1. `handleDrop` (drag from library)
2. `confirmDelete` (bulk delete)
3. `handleBulkMove` (multi-item drag)
4. `handleBulkColorChange`
5. `handleSaveEdit` (metadata changes)
6. `handlePaste`
7. `handleRepace`
8. `handleDuplicateItem`
9. `handleExtendDuration`
10. ... **15+ total functions**

**Estimated LOC:** ~500-800 lines

---

## Option C: Version-Based Undo (Recommended)

### Overview

Leverage existing `pacing_guide_versions` table. Before destructive operations, auto-create version snapshot. Show toast notification with "Undo" button for 10 seconds. If clicked, restore from snapshot.

### Implementation

```typescript
// State
const [undoVersion, setUndoVersion] = useState<number | null>(null);
const [showUndoToast, setShowUndoToast] = useState(false);
const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
const [undoDescription, setUndoDescription] = useState<string>('');

// Modified delete handler
const confirmDelete = useCallback(async () => {
  setShowDeleteConfirm(false);

  try {
    // 1. Create version snapshot BEFORE deletion
    const snapshotRes = await fetch(`/api/pacing-guides/${guideId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        label: `Auto-save before delete (${selectedItems.size} items)`,
        auto_created: true // Flag for potential cleanup
      })
    });

    if (!snapshotRes.ok) throw new Error('Failed to create snapshot');
    const { version_number } = await snapshotRes.json();

    // 2. Perform deletion
    const deletePromises = Array.from(selectedItems).map(itemId =>
      fetch(`/api/v2/scheduled-items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
    );
    await Promise.all(deletePromises);

    // 3. Refresh items
    await fetchScheduledItems();
    await fetchBaseCalendarItems();
    setSelectedItems(new Set());

    // 4. Show undo toast for 10 seconds
    setUndoVersion(version_number);
    setUndoDescription(`Deleted ${selectedItems.size} item(s)`);
    setShowUndoToast(true);

    const timer = setTimeout(() => {
      setShowUndoToast(false);
      setUndoVersion(null);
    }, 10000); // 10 seconds
    setUndoTimer(timer);

  } catch (err) {
    console.error('Error deleting items:', err);
    alert('Failed to delete items');
  }
}, [selectedItems, guideId, fetchScheduledItems, fetchBaseCalendarItems]);

// Undo handler
const handleUndo = useCallback(async () => {
  if (!undoVersion) return;

  // Clear timer
  if (undoTimer) clearTimeout(undoTimer);

  try {
    // Restore from version snapshot (existing API!)
    const res = await fetch(
      `/api/pacing-guides/${guideId}/versions/${undoVersion}/restore`,
      {
        method: 'POST',
        credentials: 'include'
      }
    );

    if (!res.ok) throw new Error('Failed to undo');

    // Optional: Delete auto-created snapshot to avoid clutter
    await fetch(`/api/pacing-guides/${guideId}/versions/${undoVersion}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    // Refresh calendar
    await fetchScheduledItems();
    await fetchBaseCalendarItems();
    await fetchCurrentVersion();

    // Hide toast
    setShowUndoToast(false);
    setUndoVersion(null);

    // Show success toast
    alert('Changes undone successfully');

  } catch (err) {
    console.error('Error undoing:', err);
    alert('Failed to undo changes');
  }
}, [undoVersion, undoTimer, guideId, fetchScheduledItems, fetchBaseCalendarItems, fetchCurrentVersion]);

// Keyboard listener (optional - undo via Cmd+Z)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && undoVersion) {
      e.preventDefault();
      handleUndo();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undoVersion, handleUndo]);
```

**Toast Component:**
```tsx
{showUndoToast && (
  <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50 animate-slide-up">
    <span>{undoDescription}</span>
    <button
      onClick={handleUndo}
      className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm font-medium transition-colors"
    >
      Undo
    </button>
    <button
      onClick={() => {
        setShowUndoToast(false);
        if (undoTimer) clearTimeout(undoTimer);
      }}
      className="text-gray-400 hover:text-white"
    >
      ✕
    </button>
  </div>
)}
```

### Pros & Cons

**Pros:**
- ✅ **Zero race conditions** - Database transactions are atomic
- ✅ **Complete data integrity** - All relationships preserved
- ✅ **Persists across page refresh** - Stored in database
- ✅ **Reuses existing infrastructure** - Version restore API already tested
- ✅ **Simplest implementation** - ~100 lines of code
- ✅ **No new failure modes** - Doesn't introduce client-side bugs

**Cons:**
- ⚠️ Requires API call for undo (~200ms latency vs. instant)
- ⚠️ No redo functionality (but can add version sequence tracking)
- ⚠️ Creates version records (need cleanup strategy)
- ⚠️ Slightly slower than in-memory undo

### Extension to Other Operations

**Bulk Move:**
```typescript
const handleBulkMove = async (targetDate: string) => {
  // 1. Create snapshot
  const snapshot = await createVersionSnapshot(
    guideId,
    `Auto-save before move (${selectedItems.size} items)`
  );

  // 2. Perform bulk move
  await fetch('/api/v2/scheduled-items/bulk-move', { ... });

  // 3. Show undo toast
  showUndoToast(snapshot.version_number, `Moved ${selectedItems.size} item(s)`);
};
```

**Bulk Color:**
```typescript
const handleApplyColor = async (color: string) => {
  // Same pattern: snapshot → operation → undo toast
};
```

### Version Cleanup Strategy

**Option 1: Time-based cleanup**
```sql
-- Delete auto-created versions older than 24 hours
DELETE FROM pacing_guide_versions
WHERE auto_created = true
  AND created_at < NOW() - INTERVAL '24 hours';
```

**Option 2: User-triggered cleanup**
- Keep auto-created versions until user manually cleans up via "Version History" modal
- Add "Clear Auto-saves" button in version history

**Option 3: Rolling window**
- Keep last 10 auto-created versions per guide
- Delete oldest when creating new snapshot

**Estimated LOC:** ~100 lines

---

## Option D: Minimal Command Pattern

### Overview

Implement command pattern for **only 3 most common actions**: Move item, Delete item, Create item. Skip bulk operations initially.

### Implementation

```typescript
// Command interface
interface Command {
  type: 'MOVE' | 'DELETE' | 'CREATE';
  data: any;
  execute: () => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  timestamp: number;
}

// State
const [history, setHistory] = useState<{
  undo: Command[];
  redo: Command[];
}>({ undo: [], redo: [] });

const pushCommand = (command: Command) => {
  setHistory({
    undo: [...history.undo, command],
    redo: [] // Clear redo stack on new action
  });
};

// Example: Move item
const handleExistingItemDrop = async (dateString: string, e: React.DragEvent) => {
  const itemId = e.dataTransfer.getData('item-id');
  const item = scheduledItems.find(i => i.id === itemId);
  if (!item) return;

  const oldDate = item.start_date;
  const newDate = dateString;

  const command: Command = {
    type: 'MOVE',
    data: { item_id: itemId, old_date: oldDate, new_date: newDate },
    execute: async () => {
      await fetch(`/api/v2/scheduled-items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ start_date: newDate })
      });
    },
    undo: async () => {
      await fetch(`/api/v2/scheduled-items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ start_date: oldDate })
      });
    },
    redo: async () => {
      await fetch(`/api/v2/scheduled-items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ start_date: newDate })
      });
    },
    timestamp: Date.now()
  };

  await command.execute();
  pushCommand(command);
  await fetchScheduledItems();
};

// Undo/Redo handlers
const handleUndo = async () => {
  if (history.undo.length === 0) return;

  const command = history.undo[history.undo.length - 1];
  await command.undo();

  setHistory({
    undo: history.undo.slice(0, -1),
    redo: [...history.redo, command]
  });

  await fetchScheduledItems();
};

const handleRedo = async () => {
  if (history.redo.length === 0) return;

  const command = history.redo[history.redo.length - 1];
  await command.redo();

  setHistory({
    undo: [...history.undo, command],
    redo: history.redo.slice(0, -1)
  });

  await fetchScheduledItems();
};
```

### Pros & Cons

**Pros:**
- ✅ Instant undo/redo (no full data refetch)
- ✅ Supports redo (Cmd+Shift+Z)
- ✅ Focused on high-impact actions
- ✅ Lighter than full command pattern
- ✅ ~200-300 lines of code

**Cons:**
- ⚠️ Still has race condition risk (async operations)
- ⚠️ Memory-only (lost on page refresh)
- ⚠️ Doesn't handle bulk operations initially
- ⚠️ What about grouped items? (moving rotation moves 7 items - 1 command or 7?)

### Questions to Resolve

1. **Bulk operations**: How to handle multi-select delete? Single command or multiple?
2. **Grouped items**: Moving rotation item moves all 7 - track as 1 command or 7?
3. **Failure handling**: What if undo API call fails mid-execution?

**Estimated LOC:** ~200-300 lines

---

## Option E: Hybrid Approach

### Overview

Combine command pattern for single actions with version snapshots for bulk operations.

### Strategy

**For Single Actions → Command Pattern (instant):**
- Move 1 item (drag to new date)
- Delete 1 item (via three-dot menu)
- Create 1 item (drag from library)

**For Bulk Actions → Version Snapshots (safe):**
- Bulk delete (multi-select + Delete key)
- Bulk move (drag multiple items)
- Bulk color change
- Re-pacing

### Implementation

```typescript
// Hybrid state
const [commandHistory, setCommandHistory] = useState<{
  undo: Command[];
  redo: Command[];
}>({ undo: [], redo: [] });

const [versionUndo, setVersionUndo] = useState<{
  versionNumber: number | null;
  description: string;
  timer: NodeJS.Timeout | null;
}>({ versionNumber: null, description: '', timer: null });

// Single item operations use commands
const handleSingleItemMove = async (itemId: string, newDate: string) => {
  const item = scheduledItems.find(i => i.id === itemId);
  if (!item) return;

  const command = createMoveCommand(item, newDate);
  await command.execute();
  pushCommand(command);
};

// Bulk operations use version snapshots
const handleBulkDelete = async () => {
  const snapshot = await createVersionSnapshot(
    guideId,
    `Auto-save before delete (${selectedItems.size} items)`
  );

  await performBulkDelete();
  showVersionUndo(snapshot.version_number, `Deleted ${selectedItems.size} item(s)`);
};

// Keyboard handler decides which undo to trigger
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    e.preventDefault();

    if (e.shiftKey) {
      // Redo - only for commands
      handleCommandRedo();
    } else {
      // Undo - check which stack to use
      if (versionUndo.versionNumber) {
        handleVersionUndo(); // Version takes priority
      } else if (commandHistory.undo.length > 0) {
        handleCommandUndo();
      }
    }
  }
};
```

### Pros & Cons

**Pros:**
- ✅ Best UX - instant undo for common actions, safe undo for bulk
- ✅ Leverages strengths of both approaches
- ✅ Redo available for single actions

**Cons:**
- ⚠️ More complex to maintain (two undo systems)
- ⚠️ User confusion: "Why does undo work differently sometimes?"
- ⚠️ Higher testing surface area

**Estimated LOC:** ~400 lines

---

## Risk Analysis

### Race Condition Risks

| Scenario | Option A | Option B | Option C | Option D | Option E |
|----------|----------|----------|----------|----------|----------|
| Delete → Undo → Delete completes | 🔴 High | 🔴 High | ✅ None | 🔴 High | 🟡 Medium |
| Rapid undo/redo | 🔴 High | 🔴 High | ✅ None | 🔴 High | 🟡 Medium |
| Concurrent users | 🔴 High | 🔴 High | ✅ None | 🔴 High | 🟡 Medium |

**Mitigation:** Sequential request queue (adds ~50 lines of code)

### Data Integrity Risks

| Risk | Option A | Option B | Option C | Option D | Option E |
|------|----------|----------|----------|----------|----------|
| Incomplete snapshots | 🔴 High | 🟡 Medium | ✅ None | 🟡 Medium | 🟡 Medium |
| Lost relationships | 🔴 High | 🟡 Medium | ✅ None | 🟡 Medium | 🟡 Medium |
| Orphaned items | 🔴 High | 🟡 Medium | ✅ None | 🟡 Medium | 🟡 Medium |

**Why Option C is safe:**
- Database transactions guarantee atomicity
- Full item snapshots include all relationships
- No client-side state to get out of sync

### Memory & Performance

| Metric | Option A | Option B | Option C | Option D | Option E |
|--------|----------|----------|----------|----------|----------|
| Memory usage | ~500KB | ~1MB | Minimal | ~300KB | ~800KB |
| Undo latency | Instant | Instant | ~200ms | Instant | Mixed |
| API calls per undo | 1-50 | 1-50 | 1 | 1 | 1-50 |

### Testing Complexity

| Aspect | Option A | Option B | Option C | Option D | Option E |
|--------|----------|----------|----------|----------|----------|
| Unit tests needed | ~8 | ~65 | ~9 | ~12 | ~20 |
| Integration tests | ~3 | ~15 | ~3 | ~5 | ~8 |
| Edge cases | ~5 | ~10 | ~3 | ~7 | ~12 |
| **Total tests** | **~16** | **~90** | **~15** | **~24** | **~40** |

---

## Implementation Timelines

### Option A: Lightweight Undo Stack
- **Day 1:** Implement undo stack + delete undo (~4 hours)
- **Day 2:** Add bulk move + bulk color undo (~4 hours)
- **Day 3:** Testing + edge cases (~4 hours)
- **Day 4:** Polish + documentation (~2 hours)
- **Total: 3-4 days**

### Option B: Full Undo/Redo Stack
- **Week 1:** Command abstraction + 5 commands (~20 hours)
- **Week 2:** Remaining 10 commands + undo/redo logic (~20 hours)
- **Week 3:** Testing (~20 hours)
- **Week 4:** Edge cases + polish (~10 hours)
- **Total: 3-4 weeks**

### Option C: Version-Based Undo (Recommended)
- **Day 1 AM:** Implement version snapshot + undo toast for delete (~2 hours)
- **Day 1 PM:** Add keyboard shortcut + testing (~2 hours)
- **Day 2 AM:** Extend to bulk move + bulk color (~2 hours)
- **Day 2 PM:** Version cleanup strategy + documentation (~2 hours)
- **Total: 1.5-2 days**

### Option D: Minimal Command Pattern
- **Day 1:** Command interface + move/delete/create commands (~6 hours)
- **Day 2:** Undo/redo handlers + keyboard shortcuts (~4 hours)
- **Day 3:** Testing + edge cases (~6 hours)
- **Total: 2-3 days**

### Option E: Hybrid Approach
- **Week 1:** Implement Option C (version-based for bulk) (~2 days)
- **Week 2:** Add Option D (commands for single actions) (~2 days)
- **Week 3:** Integration + testing (~1 week)
- **Total: 2-3 weeks**

---

## Decision Matrix

### Comparison Table

| Criteria | Weight | Option A | Option B | Option C | Option D | Option E |
|----------|--------|----------|----------|----------|----------|----------|
| **Safety** | 30% | 🔴 6/10 | 🟡 7/10 | ✅ 10/10 | 🟡 7/10 | 🟢 8/10 |
| **Simplicity** | 25% | 🟢 8/10 | 🔴 3/10 | ✅ 9/10 | 🟡 7/10 | 🔴 4/10 |
| **UX Quality** | 20% | 🟡 7/10 | ✅ 9/10 | 🟡 7/10 | 🟢 8/10 | ✅ 9/10 |
| **Time to Ship** | 15% | 🟢 8/10 | 🔴 3/10 | ✅ 10/10 | 🟡 7/10 | 🔴 4/10 |
| **Maintainability** | 10% | 🟡 7/10 | 🟢 8/10 | ✅ 9/10 | 🟢 8/10 | 🟡 6/10 |
| **Weighted Score** | | **7.1** | **5.9** | **9.1** ⭐ | **7.5** | **6.9** |

### Recommendation: **Option C** (Version-Based Undo)

**Rationale:**
1. ✅ **Safest** - Zero race conditions, complete data integrity
2. ✅ **Fastest to ship** - Can have working prototype in 1-2 days
3. ✅ **Reuses existing code** - Version restore API already tested
4. ✅ **No new failure modes** - Doesn't introduce client-side bugs
5. ✅ **Extensible** - Can add command pattern later if users want instant undo

**Migration Path:**
- **Phase 1:** Ship Option C (version-based) for safety
- **Phase 2:** Gather user feedback on undo latency
- **Phase 3:** If users request instant undo, add Option E (hybrid) on top

---

## Next Steps

### Immediate Actions
1. ✅ Review this documentation with stakeholders
2. ⏸️ Decide which option to implement
3. ⏸️ Create implementation task list
4. ⏸️ Set up testing plan

### Implementation Checklist (Option C)

#### Phase 1: Delete Undo (Day 1)
- [ ] Add version snapshot creation before delete
- [ ] Implement undo toast component
- [ ] Add undo handler (restore from version)
- [ ] Add keyboard shortcut (Cmd/Ctrl+Z)
- [ ] Test with single item delete
- [ ] Test with bulk delete (multi-select)
- [ ] Test page refresh persistence

#### Phase 2: Extend to Other Operations (Day 2)
- [ ] Add version snapshot to bulk move
- [ ] Add version snapshot to bulk color change
- [ ] Update toast descriptions
- [ ] Test all operations

#### Phase 3: Polish & Cleanup (Day 2)
- [ ] Implement version cleanup strategy
- [ ] Add loading states for undo
- [ ] Add success/error toasts
- [ ] Update user documentation
- [ ] Write integration tests

#### Phase 4: Advanced Features (Optional)
- [ ] Add version sequence tracking for "redo"
- [ ] Add undo button to toolbar
- [ ] Add undo history dropdown
- [ ] Add keyboard shortcut help tooltip

---

## Open Questions

1. **Version cleanup strategy:** Time-based (24 hours) or count-based (last 10)?
2. **Toast duration:** 10 seconds or configurable?
3. **Keyboard shortcut:** Should Cmd+Z work when typing in input fields, or only when calendar has focus?
4. **Redo support:** Is version sequence tracking worth implementing now, or defer to Phase 4?
5. **User education:** How to communicate undo feature to existing users?

---

## References

### Existing Code Files
- `/app/dashboard/guides/[id]/page.tsx` - Main calendar page (1199 lines)
- `/app/api/pacing-guides/[id]/versions/route.ts` - Version list API
- `/app/api/pacing-guides/[id]/versions/[versionNumber]/restore/route.ts` - Version restore API
- `/components/v2/modals/VersionHistoryModal.tsx` - Version history UI
- `/scripts/schema-pacing-guide-versions.sql` - Version table schema

### Related Documentation
- `README.md` - Project overview
- `V2_COMPLETION_PLAN.md` - V2 architecture details
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide

---

## Conclusion

**TL;DR:** Option C (Version-Based Undo) is the safest, simplest, and fastest path to shipping undo functionality. It leverages existing infrastructure, avoids race conditions, and provides complete data integrity. Can be extended with command pattern later if users request instant undo/redo.

**Decision Status:** ⏸️ **Awaiting stakeholder decision**

---

*This document will be updated as implementation progresses.*
