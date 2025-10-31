# Component Creation Guide

This guide explains all the different ways to create new component templates in the pacing guide system.

## Overview

Component templates can be created in **4 different ways**, each with different behaviors when placed on the calendar.

---

## Option 1: Simple Single-Day Component

**Use When**: You need a component that represents a single, standalone event.

### Database Structure
```sql
INSERT INTO component_templates (
  component_key,
  subject,
  display_name,
  default_duration_days,
  color,
  description,
  is_active
) VALUES (
  'ela_my_component',
  'ela',
  'My Component Name',
  1,
  '#9333EA',
  'Description of what this component does',
  true
);
```

### Behavior
- **Placement**: Creates ONE calendar item
- **Editing**: User can change title, date, duration, color individually
- **Deletion**: Deletes only that single instance
- **Moving**: Moves only that single instance

### Example Use Cases
- Assessments (PAR Assessment, TOSCRF-2)
- Single-day events (Field Trip, Assembly)
- Holidays (MLK Day, Valentine's Day)

---

## Option 2: Simple Multi-Day Component

**Use When**: You need a component that spans multiple consecutive days with predefined labels for each day.

### Database Structure
```sql
INSERT INTO component_templates (
  component_key,
  subject,
  display_name,
  default_duration_days,
  color,
  description,
  metadata,
  is_active
) VALUES (
  'ela_my_multiday',
  'ela',
  'My Multi-Day Component',
  3,
  '#9333EA',
  'Description - creates 3 consecutive days',
  jsonb_build_object(
    'is_multi', true,
    'sub_components', jsonb_build_array(
      jsonb_build_object('title', 'Day 1 Label', 'duration', 1),
      jsonb_build_object('title', 'Day 2 Label', 'duration', 1),
      jsonb_build_object('title', 'Day 3 Label', 'duration', 1)
    )
  ),
  true
);
```

### Metadata Explanation
- `is_multi: true` - Flags this as a multi-day component
- `sub_components` - Array of objects, one per day
  - `title` - What appears on the calendar for that specific day
  - `duration` - Almost always `1` (one day per sub-component)

### Behavior
- **Placement**: Creates MULTIPLE calendar items, all linked by a `group_id`
- **Editing**: Changes to date/duration affect all days in the group
- **Deletion**: Deleting one day deletes ALL days in the group (with confirmation)
- **Moving**: Moving one day moves ALL days in the group together

### Example Use Cases
- **L!L Startup** (3 days): Lesson 1, Lesson 2, Lesson 3
- **Group 1 & 2 WT** (2 days): Both days show "Group 1: WT / Group 2: WT"
- **IPL Units** (3-6 days): Different lessons on each day with culminating activity

### Real Example
```sql
-- L!L Startup (3 days)
metadata = {
  "is_multi": true,
  "sub_components": [
    { "title": "L!L Startup Lesson 1", "duration": 1 },
    { "title": "L!L Startup Lesson 2", "duration": 1 },
    { "title": "L!L Startup Lesson 3", "duration": 1 }
  ]
}
```

---

## Option 3: Multi-Day with Special Group Editing (Rotation Pattern)

**Use When**: You need a multi-day component where users can update a "rotation number" across all days.

### Database Structure
Same as Option 2, but with a special title pattern in sub_components:

```sql
INSERT INTO component_templates (
  component_key,
  subject,
  display_name,
  default_duration_days,
  color,
  description,
  metadata,
  is_active
) VALUES (
  'math_my_rotation',
  'math',
  'My Module Rotation',
  7,
  '#9333EA',
  'Seven-day module rotation - creates sessions R#, S1 through R#, S7',
  jsonb_build_object(
    'is_multi', true,
    'sub_components', jsonb_build_array(
      jsonb_build_object('title', 'R#, S1', 'duration', 1),
      jsonb_build_object('title', 'R#, S2', 'duration', 1),
      jsonb_build_object('title', 'R#, S3', 'duration', 1),
      jsonb_build_object('title', 'R#, S4', 'duration', 1),
      jsonb_build_object('title', 'R#, S5', 'duration', 1),
      jsonb_build_object('title', 'R#, S6', 'duration', 1),
      jsonb_build_object('title', 'R#, S7', 'duration', 1)
    )
  ),
  true
);
```

### Special Title Pattern
- **Format**: `R[#\d]+, S\d+`
- **Example**: `R#, S1`, `R#, S2`, ..., `R#, S7`
- The `#` is a placeholder that gets replaced when user edits

### Behavior
- **Placement**: Creates multiple calendar items with rotation/session pattern
- **Editing**: Special "Rotation Number" field appears in edit modal
  - Changing rotation # from `#` to `1` updates ALL days: `R#, S1` → `R1, S1`, `R#, S2` → `R1, S2`, etc.
- **Deletion**: Deleting one day deletes ALL days in the rotation
- **Moving**: Moving one day moves ALL days together

### How It Works
1. EditComponentModal detects pattern: `/^R[#\d]+, S\d+$/`
2. Shows "Rotation Number" input field instead of regular title editor
3. When user enters a number, sets `update_group_rotation: true` flag
4. API updates all components in the group with the new rotation number

### Example Use Cases
- **Math Module Rotation** (10 days): R#, S1-S7 + Diagnostic Days
- **Science Module Rotation** (7 days): R#, S1-S7

---

## Option 4: Multi-Day with Special Group Editing (TT/WW Pattern)

**Use When**: You need a 2-day component where users can update unit/lesson numbers across both days.

### Database Structure
```sql
INSERT INTO component_templates (
  component_key,
  subject,
  display_name,
  default_duration_days,
  color,
  description,
  metadata,
  is_active
) VALUES (
  'ela_my_ttww_block',
  'ela',
  'My TT/WW Block',
  2,
  '#DC2626',
  'Description - alternating TT and WW pattern',
  jsonb_build_object(
    'is_multi', true,
    'sub_components', jsonb_build_array(
      jsonb_build_object('title', 'L!L Unit #, Lesson #\nGroup 1: TT / Group 2: WT', 'duration', 1),
      jsonb_build_object('title', 'L!L Unit #, Lesson #\nGroup 1: WT / Group 2: TT', 'duration', 1)
    )
  ),
  true
);
```

### Special Title Pattern
- **Format**: `L!L Unit [#\d]+, Lesson [#\d]+\n...`
- **Example**: `L!L Unit #, Lesson #\nGroup 1: TT / Group 2: WT`
- The `#` placeholders get replaced when user edits
- Everything after `\n` is preserved (the group assignments)

### Behavior
- **Placement**: Creates 2 calendar items with alternating TT/WW pattern
- **Editing**: Special "Unit Number" and "Lesson Number" fields appear in edit modal
  - Changing unit/lesson updates BOTH days while preserving group assignments
  - Example: Unit `#` → `5`, Lesson `#` → `12` updates both days to show "L!L Unit 5, Lesson 12"
- **Deletion**: Deleting one day deletes BOTH days in the block
- **Moving**: Moving one day moves BOTH days together

### How It Works
1. EditComponentModal detects pattern: `/^L!L Unit [#\d]+, Lesson [#\d]+\n/`
2. Shows "Unit Number" and "Lesson Number" input fields
3. When user enters numbers, sets `update_group_ttww: true` flag
4. API updates all components in the group with new unit/lesson while preserving the group assignments (everything after `\n`)

### Example Use Cases
- **TT/WW Lesson Block**: Alternating Text Training and Word Work
- **Any component with alternating group patterns**

---

## Quick Reference Table

| Component Type | Metadata | Title Pattern | Edit Behavior | Use When |
|---------------|----------|---------------|---------------|----------|
| **Simple Single-Day** | None | Any | Standard editor | Single event |
| **Simple Multi-Day** | `is_multi: true` + sub_components | Any | Standard editor | Multiple fixed days |
| **Rotation Multi-Day** | `is_multi: true` + sub_components | `R#, S1` format | Rotation # editor | Sessions with rotation numbers |
| **TT/WW Multi-Day** | `is_multi: true` + sub_components | `L!L Unit #, Lesson #\n...` | Unit/Lesson editors | Alternating patterns |

---

## Step-by-Step: Creating a New Component

### Method 1: Using SQL Directly

```sql
-- Simple single-day
INSERT INTO component_templates (component_key, subject, display_name, default_duration_days, color, description, is_active)
VALUES ('ela_my_simple', 'ela', 'My Component', 1, '#9333EA', 'Description', true);

-- Multi-day
INSERT INTO component_templates (component_key, subject, display_name, default_duration_days, color, description, metadata, is_active)
VALUES (
  'ela_my_multi',
  'ela',
  'My Multi-Day',
  3,
  '#9333EA',
  'Creates 3 days',
  '{"is_multi": true, "sub_components": [{"title": "Day 1", "duration": 1}, {"title": "Day 2", "duration": 1}, {"title": "Day 3", "duration": 1}]}',
  true
);
```

### Method 2: Using the Application

1. Go to the Component Library in the app
2. Click "+ Create" button
3. Fill in the form:
   - Subject (base, ela, math, science, social_studies)
   - Display Name (what shows in library)
   - Duration (number of days)
   - Color (hex code like #9333EA)
   - Description (optional)
4. Component is created as a simple single-day component
5. For multi-day: Must add via SQL with metadata

---

## Best Practices

### Naming Conventions
- **component_key**: `{subject}_{descriptive_name}` (snake_case)
  - Examples: `ela_startup`, `math_ipl_equations`, `base_winter_break`
- **display_name**: Human-readable name shown in library
  - Examples: "L!L Startup", "IPL: Equations", "Winter Break"

### Colors
- Use distinct colors for different component categories
- Hex format: `#RRGGBB`
- Common colors:
  - Purple/Violet: `#9333EA`, `#8B5CF6`
  - Red: `#DC2626`, `#EF4444`
  - Orange: `#F97316`, `#F59E0B`
  - Green: `#10B981`, `#22C55E`
  - Blue: `#3B82F6`, `#06B6D4`

### Duration
- Set `default_duration_days` to match the number of sub_components
- For multi-day: Duration = length of sub_components array

### Descriptions
- Clear and concise
- Mention if it creates multiple days
- Include lesson details if applicable

---

## Common Patterns

### Pattern: Weekly Rotation (5 days)
```json
{
  "is_multi": true,
  "sub_components": [
    { "title": "Monday Activity", "duration": 1 },
    { "title": "Tuesday Activity", "duration": 1 },
    { "title": "Wednesday Activity", "duration": 1 },
    { "title": "Thursday Activity", "duration": 1 },
    { "title": "Friday Activity", "duration": 1 }
  ]
}
```

### Pattern: Lesson Sequence with Culminating Activity
```json
{
  "is_multi": true,
  "sub_components": [
    { "title": "Unit X: L1 & L2\nSTEPS", "duration": 1 },
    { "title": "Unit X: L3 & L4\nSTEPS", "duration": 1 },
    { "title": "Unit X: Culminating Activity", "duration": 1 }
  ]
}
```

### Pattern: Alternating Groups
```json
{
  "is_multi": true,
  "sub_components": [
    { "title": "Group A Activity / Group B Rest", "duration": 1 },
    { "title": "Group A Rest / Group B Activity", "duration": 1 }
  ]
}
```

---

## Important Implementation Details

### Display Order (Reordering Components)

**⚠️ CRITICAL**: When creating components, you **must** set the `display_order` field properly, or components won't be reorderable in cells.

#### How Display Order Works

Each component in a cell (same `subject_calendar_id` and `start_date`) needs a unique, sequential `display_order`:
- First component: `display_order = 1`
- Second component: `display_order = 2`
- Third component: `display_order = 3`
- etc.

#### Automatic Calculation

The API automatically calculates the next available `display_order` when creating components:

```typescript
// Get the next display_order for this cell
const displayOrderResult = await pool.query(
  `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
   FROM scheduled_components
   WHERE subject_calendar_id = $1 AND start_date = $2`,
  [subject_calendar_id, start_date]
);
const nextDisplayOrder = displayOrderResult.rows[0].next_order;
```

#### Why This Matters

- **Without proper display_order**: Up/down arrow buttons won't work (400 errors)
- **With proper display_order**: Components can be reordered smoothly

#### Database Default

The `display_order` column has a default value of `1`, but this should **never** be relied upon. Always calculate and set it explicitly in the INSERT statement.

---

## Language!Live Component Pattern

### Understanding Level 1 vs Level 2

Language!Live uses a two-level system:

**Level 1**: Students significantly below grade level
- Focus: Foundational skills (phonics, decoding, spelling)
- Components include basic paragraph writing, simple narratives

**Level 2**: Students approaching grade level
- Focus: Advanced skills (morphology, complex comprehension, literary analysis)
- Components include argumentative writing, literary analysis

### TT/WT Rotation Pattern

Most L!L units use an alternating pattern:

**Text Training (TT)**: Teacher-directed instruction (45 min)
- Reading comprehension
- Vocabulary
- Grammar
- Writing

**Word Training (WT)**: Student-directed online work (45 min)
- Phonics and word analysis
- Sight word practice
- Spelling practice

### 90-Minute Implementation

In a classroom with both Level 1 and Level 2 students:

**Period 1 (45 min)**:
- Level 1 students → TT with teacher
- Level 2 students → WT independently online

**Period 2 (45 min)**:
- Level 1 students → WT independently online
- Level 2 students → TT with teacher

This is why components show: `Level 1: TT\nLevel 2: WT` and then rotate.

### L!L Component Naming

When creating new Language!Live components, follow this pattern:

**display_name**: Short, library-friendly name
- Example: "L!L Unit #, Lesson #"

**title (in sub_components)**: Full descriptive title with rotation
- Example: "L!L Unit #, L1\nLevel 1: TT\nLevel 2: WT"

**component_key**: Unique identifier
- Pattern: `ela_lil_[descriptive_name]`
- Example: `ela_lil_unit_pretest`

---

## Troubleshooting

### Component doesn't appear in library
- Check `is_active` is `true`
- Refresh the page
- Check subject matches the calendar you're viewing

### Multi-day component creates wrong number of days
- Verify `default_duration_days` matches length of `sub_components` array
- Check metadata JSON syntax is valid

### Special editor doesn't appear
- Verify title pattern matches exactly:
  - Rotation: `R#, S1` format
  - TT/WW: `L!L Unit #, Lesson #\n...` format
- Check component has `group_id` (automatically added on creation)

### Colors don't persist when moving
- This has been fixed! All components now use custom drag images
- If still having issues, check browser console for errors

### Up/down arrows don't work (400 errors)
- **FIXED**: Components now automatically get proper `display_order` values
- If you added components manually via SQL, run this to fix:
  ```sql
  -- Re-sequence display_order for all components
  WITH ranked_components AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY subject_calendar_id, start_date
        ORDER BY COALESCE(display_order, 999999), id ASC
      ) as new_order
    FROM scheduled_components
  )
  UPDATE scheduled_components sc
  SET display_order = rc.new_order
  FROM ranked_components rc
  WHERE sc.id = rc.id;
  ```

### Component appears but can't be edited
- Check that the component exists in `component_templates` table
- Verify `component_key` matches exactly
- Check for typos in metadata JSON
