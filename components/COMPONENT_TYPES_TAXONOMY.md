# Component Types Taxonomy

This document catalogs all component types in the pacing guide system and their distinct behaviors.

## Component Type Categories

### 1. **Simple Single-Day Components**
**Behavior**: When placed, creates one calendar item that can be moved/edited/deleted individually.

**Editing**: Standard editing - change title, date, duration, color individually.

**Deletion**: Deletes only the single instance.

**Examples**:
- **Base Calendar** (39 components):
  - Breaks: Winter Break (5d), Spring Break (5d), Thanksgiving Break (3d)
  - Federal Holidays: Labor Day, Election Day, Veterans Day, MLK Day, Presidents' Day, Memorial Day, Juneteenth
  - Cultural Holidays: Three Kings Day, Valentine's Day, St. Patrick's Day, Cinco de Mayo, Mother's Day, Father's Day, Mardi Gras, Halloween, Earth Day
  - Heritage Months: Black History Month, Women's History Month, Hispanic Heritage Month
  - School Events: Professional Development, Testing Window (3d), Early Dismissal, Parent-Teacher Conferences (2d), School Assembly, Field Trip, Teacher Planning Day, Report Cards
  - General: No School, Half Day, Star Orientation (2d), First Day for Students, First Day for Staff, Teacher In-Service Day, Last Day for Students, Last Day for Staff

- **ELA** (6 components):
  - L!L Make-Up (1d)
  - L!L ReadingScape (1d)
  - L!L M.O.Y. Assessment (1d)
  - L!L E.O.Y. Assessment (1d)
  - L!L Writing Project / Word Training (1d)
  - PAR Assessment (1d)
  - TOSCRF-2 (1d)
  - TWS-5 (1d)
  - Data Conference (1d)

- **Math** (5 components):
  - IPL Whole Class (2d)
  - STEPS Placement Assessment (1d)
  - Early Finishers IPLs (1d)
  - Benchmark (2d)
  - Flex Day (1d)

- **Science** (7 components):
  - Benchmark (2d)
  - Blended Science # (4d)
  - Module Orientation (3d)
  - Pear Assessment (1d)
  - Discovery Day (1d)
  - Standard #: District Resources (3d)
  - Testing Window (1d)

- **Social Studies** (24 components):
  - Through Industrialism: Units 1-10 (1d each)
  - Through Modern Times: Units 1-10 (1d each)
  - Quiz: Unit #, Lesson # (1d)
  - Assessment: Unit # (1d)
  - Unit #, Lesson # (1d)
  - Flex Day (1d)

---

### 2. **Multi-Day Components (Basic)**
**Behavior**: When placed, automatically creates multiple consecutive days, all linked by a `group_id`. Moving one day moves all days in the group.

**Editing**: Edit any day - changes to title, date, or duration affect all days in the group.

**Deletion**: **Fixed!** Deleting one day now deletes all days in the multi-day component (asks for confirmation first).

**Metadata Structure**:
```json
{
  "is_multi": true,
  "sub_components": [
    { "title": "Day 1 Title", "duration": 1 },
    { "title": "Day 2 Title", "duration": 1 },
    ...
  ]
}
```

**Examples**:
- **ELA**:
  - **L!L Startup** (3 days): Creates "L!L Startup Lesson 1", "L!L Startup Lesson 2", "L!L Startup Lesson 3"
  - **Group 1 & 2 WT** (2 days): Creates "Group 1: WT / Group 2: WT" on both days

- **Math** (39 IPL units, updated format 2025-10-30):
  - **IPL: Equations** (5 days): "IPL: Equations\nL1-L2 & STEPS", "IPL: Equations\nL3-L4 & STEPS", "IPL: Equations\nL5-L6 & STEPS", "IPL: Equations\nL7-L8 & STEPS", "IPL: Equations\nCulminating Activity"
  - **IPL: Properties of Real Numbers** (5 days): "IPL: Properties...\nL1-L2 & STEPS", "IPL: Properties...\nL3-L4 & STEPS", "IPL: Properties...\nL5-L6 & STEPS", "IPL: Properties...\nL7 & STEPS", "IPL: Properties...\nCulminating Activity"
  - **IPL: Linear Equations & Graphing** (5 days)
  - **IPL: Exponents** (3 days)
  - **IPL: Operations w/ Fractions I** (6 days)
  - **IPL: Special Equations** (3 days)
  - **IPL: Units** (3 days)
  - **IPL: Systems of Equations** (3 days)
  - **IPL: Functions** (3 days)
  - **IPL: Integers** (4 days)
  - **IPL: Intro to Decimals** (3 days)
  - **IPL: Decimal Operations** (3 days)
  - **IPL: Intro to Fractions** (5 days)
  - **IPL: Operations w/ Fractions II** (4 days)
  - **IPL: Real Number System** (4 days)
  - **IPL: Ratios & Percents** (4 days)
  - **IPL: Transformations** (4 days)
  - **IPL: Angles** (4 days)
  - **IPL: Angle Relationships** (3 days)
  - **IPL: Triangles** (5 days)
  - **IPL: Polygons** (6 days)
  - **IPL: Circles** (4 days)
  - **IPL: Prisms and Pyramids** (5 days)
  - **IPL: Inequalities** (4 days)
  - **IPL: Absolute Value** (3 days)
  - **IPL: Radicals** (4 days)
  - **IPL: Matrices** (3 days)
  - **IPL: Polynomials** (4 days)
  - **IPL: Quadratics** (4 days)
  - **IPL: Factoring** (4 days)
  - **IPL: Exponential Equations** (3 days)
  - **IPL: Sets** (3 days)
  - **IPL: Data Graphs I** (4 days)
  - **IPL: Data Graphs II** (3 days)
  - **IPL: Logic and Sequence** (3 days)
  - **IPL: Probability** (4 days)
  - **IPL: Accuracy** (3 days)
  - **IPL: Graphing Calculators** (2 days)
  - **IPL: Calculators** (2 days)

---

### 3. **Multi-Day Components with Special Group Editing (Rotation Sessions)**
**Behavior**: Creates multiple consecutive days linked by `group_id`, BUT with special editing behavior for rotation numbers.

**Editing**: When editing ONE day:
- Has a special "Rotation Number" field in the edit modal
- Changing the rotation number updates **ALL** days in the rotation (e.g., R# → R1 updates all 7 or 10 sessions)
- Pattern: `R[#\d]+, S\d+` (e.g., "R#, S1", "R1, S2")

**Deletion**: **Fixed!** Deleting one day deletes all days in the rotation.

**Special API Behavior**: Uses `update_group_rotation` flag to trigger group-wide update.

**Examples**:
- **Math**:
  - **Module Rotation** (10 days): R#, S1 through R#, S7 + 2 Diagnostic Days + Pear Assessment

- **Science**:
  - **Module Rotation** (7 days): R#, S1 through R#, S7

---

### 4. **Multi-Day Components with Special Group Editing (TT/WW Lesson Blocks)**
**Behavior**: Creates 2 consecutive days linked by `group_id`, with special editing for unit/lesson numbers.

**Editing**: When editing ONE day:
- Has special "Unit Number" and "Lesson Number" fields in the edit modal
- Changing unit/lesson updates **BOTH** days in the block
- Pattern: `L!L Unit [#\d]+, Lesson [#\d]+\n...` (e.g., "L!L Unit #, Lesson #\nGroup 1: TT / Group 2: WT")

**Deletion**: **Fixed!** Deleting one day deletes both days in the block.

**Special API Behavior**: Uses `update_group_ttww` flag to trigger group-wide update.

**Examples**:
- **ELA**:
  - **TT/WW Lesson Block** (2 days):
    - Day 1: "L!L Unit #, Lesson #\nGroup 1: TT / Group 2: WT"
    - Day 2: "L!L Unit #, Lesson #\nGroup 1: WT / Group 2: TT"

---

## Summary Statistics

**Total Component Templates**: 127
- **Base Calendar**: 39 components (all single-day or simple multi-day)
- **ELA**: 11 components (6 single, 2 basic multi-day, 1 special TT/WW, 2 newly added)
- **Math**: 45 components (5 single, 39 multi-day IPLs, 1 special rotation)
- **Science**: 8 components (7 single, 1 special rotation)
- **Social Studies**: 24 components (all single-day)

## Key Behaviors by Type

| Type | Placement | Moving | Editing | Deletion | Special Features |
|------|-----------|--------|---------|----------|-----------------|
| **Simple Single-Day** | 1 calendar item | Move individually | Edit individually | Delete individually | None |
| **Basic Multi-Day** | Multiple linked items | Move all together | Edit all dates/duration together | Delete all together | Shared group_id |
| **Rotation Multi-Day** | Multiple linked items | Move all together | Special rotation # editor | Delete all together | `update_group_rotation` flag |
| **TT/WW Multi-Day** | 2 linked items | Move both together | Special unit/lesson editor | Delete both together | `update_group_ttww` flag |

## Implementation Details

### Database Schema
```sql
-- scheduled_components table
- group_id: UUID (links multi-day components together)
- title_override: TEXT (custom title, or NULL to use template default)
- color_override: VARCHAR (custom color, or NULL to use template default)
```

### API Endpoints

**PATCH /api/scheduled-components/[id]**
- Regular update: Updates single component
- With `update_group_rotation`: Updates all rotation sessions in group
- With `update_group_ttww`: Updates all TT/WW days in group
- Returns computed `color` field (COALESCE of override and template)

**DELETE /api/scheduled-components/[id]**
- Frontend handles group deletion (fetches all components with same group_id and deletes them)

### Frontend Drag & Drop

All draggable components now have custom drag images that preserve their color during dragging.

## Future Considerations

1. **Potential new component types** could include:
   - Repeating components (e.g., "Every Monday")
   - Conditional components (e.g., "If testing, skip this")
   - Parent-child dependencies

2. **Edit modal enhancements** for:
   - Bulk editing of multiple selected components
   - Copy/paste components across dates
   - Component templates customization per user
