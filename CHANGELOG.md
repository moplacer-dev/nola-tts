# Changelog

All notable changes to the NOLA ESS Pacing Guide Application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed - Social Studies Component Overhaul (is_multi Pattern)
Complete redesign of Social Studies curriculum components using `metadata.is_multi` pattern for automatic weekend and break handling, matching Math, ELA, and Science behavior.

#### All Three Curricula Converted
**History Alive! The US Through Modern Times** (8th Grade) - 9 unit components
- 109 total instructional days across 9 units
- Auto-expands into individual 1-day sub-components
- Covers Forming a New Nation through Moving Toward Today

**History Alive! The US Through Industrialism** (7th Grade) - 10 unit components
- 113 total instructional days across 10 units
- Auto-expands into individual 1-day sub-components
- Covers Foundations of History through A Modern Nation Emerges

**History Alive! The World Through 1750** (6th Grade) - 16 unit components
- 182 total instructional days across 16 units (teachers can adjust pacing as needed)
- Auto-expands into individual 1-day sub-components
- Covers ancient civilizations through the Age of Exploration

#### Component Structure Philosophy
**Previous Approach:** 173 individual lesson/opener/closer components requiring manual weekend/break management
**New Approach:** 35 unit components with `is_multi` pattern that auto-skip weekends and blocked dates

**Key Benefits:**
1. **Automatic Weekend/Break Skipping** - Uses `addSchoolDays()` to intelligently skip non-instructional days
2. **Clean Calendar View** - Shows daily progression (e.g., "Unit 1, Lesson 1", "Unit 1, Lesson 1", "Unit 1, Lesson 1")
3. **Consistent Behavior** - Matches existing Math Module Rotation, ELA L!L Units, and Science Module Rotation patterns
4. **Teacher Flexibility** - Individual days can still be adjusted after placement
5. **Easier Maintenance** - 35 components instead of 173

#### Component Naming Convention
- **Through Modern Times:** `ss_modern_u1` through `ss_modern_u9`
- **Through Industrialism:** `ss_industrialism_u1` through `ss_industrialism_u10`
- **World Through 1750:** `ss_world1750_u1` through `ss_world1750_u16`

#### Default Pacing Structure
Each unit component expands into 1-day sub-components:
- **Unit Openers:** 1 day
- **Standard Lessons:** 3 days each (can include 2-4 day variations)
- **Unit Closers:** 1 day
- **Display Names:** Concise format (e.g., "Unit 1, Lesson 4" or "Unit 2, Unit Opener")

#### General Components Retained (6)
- Star Academy Welcome Video
- Establish Rapport & Classroom Procedures
- Quiz: Unit #, Lesson #
- Assessment: Unit #
- Unit #, Lesson # (custom component)
- Flex Day

#### Color Coding by Unit
Progressive color scheme across units for visual organization:
- **Early Units** (1-3): Red spectrum (#DC2626 → #F97316)
- **Mid Units** (4-7): Yellow-Green spectrum (#F59E0B → #14B8A6)
- **Late Units** (8-10): Blue-Purple spectrum (#0891B2 → #8B5CF6)
- **Extended Units** (11-16, World Through 1750 only): Purple-Orange spectrum

#### Technical Implementation
```javascript
{
  component_key: 'ss_modern_u1',
  display_name: 'Unit 1: Forming a New Nation',
  default_duration_days: 10,
  metadata: {
    is_multi: true,
    sub_components: [
      { title: 'Unit 1, Setting the Stage', duration: 1 },
      { title: 'Unit 1, Lesson 1', duration: 1 },
      { title: 'Unit 1, Lesson 1', duration: 1 },
      { title: 'Unit 1, Lesson 1', duration: 1 },
      // ... continues for all 10 days
    ]
  }
}
```

### Component Count Update
- **Previous Total:** 294 components
- **New Social Studies Total:** 41 components (was 173)
- **Overall New Total:** 162 components

**Breakdown by Subject:**
- Base: 39 components
- ELA: 23 components
- Math: 48 components
- Science: 11 components
- Social Studies: 41 components (6 general + 35 curriculum units)

### Added (Documentation)
- Comprehensive README.md with project overview, setup instructions, and component documentation
- Enhanced COMPONENT_CREATION_GUIDE.md with Language!Live patterns and display_order documentation

---

## [1.2.0] - 2024-10-30

### Added - ELA Component Overhaul

#### New Components (9)
1. **L!L: Roster Students** (#8B5CF6) - Administrative setup for student accounts
2. **L!L: Benchmark Grouping** (#6366F1) - Sort students into Level 1 vs Level 2 based on assessment results
3. **BOY Benchmark: PAR2, TOSCRF-2, TWS-5** (#22C55E) - Beginning-of-Year comprehensive benchmark
4. **MOY Benchmark: PAR2, TOSCRF-2, TWS-5** (#84CC16) - Mid-of-Year comprehensive benchmark
5. **EOY Benchmark: PAR2, TOSCRF-2, TWS-5** (#65A30D) - End-of-Year comprehensive benchmark
6. **L!L Unit Pre-Test** (#10B981) - Optional baseline knowledge assessment
7. **L!L Unit Post-Test/Formative** (#059669) - Required unit completion assessment
8. **L!L: Assign Practice Activities** (#0891B2) - Schedule time for assigning differentiated practice
9. **State Testing Prep** (#3B82F6) - Preparation for state assessments (LEAP, STAAR, etc.)

#### Enhanced Components
- **L!L Startup** - Updated description to clarify Week 1 program introduction activities
- **Data Conference** - Enhanced description explaining dashboard review and practice assignment
- **Language! Live Unit (2 Days)** - Added detailed 90-min model explanation
- **Language! Live Unit (Single Day)** - Clarified accelerated pacing use cases
- **L!L Writing Project** - Separated from Word Training; now lists all 8 project types per level
- **L!L Make-Up** - Enhanced for clarity
- **L!L ReadingScape** - Added description of wide reading opportunities
- **Flex Day** - Clarified use cases
- **All Unit Components** - Changed "Group 1/Group 2" to "Level 1/Level 2" terminology

#### Color Coordination
Implemented cohesive color scheme for visual clarity:
- **Purple** (#8B5CF6, #6366F1) - Setup/Administrative
- **Red** (#DC2626, #EF4444, #F97316) - Core Instruction
- **Orange/Amber** (#F59E0B, #FBBF24, #D97706) - Support/Enrichment
- **Deep Orange** (#EA580C) - Writing Projects
- **Green** (#22C55E, #84CC16, #65A30D) - Comprehensive Benchmarks
- **Teal** (#10B981, #059669) - Unit Assessments
- **Cyan/Blue** (#0891B2, #3B82F6) - Optional Tools

### Changed

#### Terminology Updates
- ❌ "Group 1" → ✅ "Level 1" (students significantly below grade level)
- ❌ "Group 2" → ✅ "Level 2" (students approaching grade level)
- Updated all component sub_components to reflect new terminology

#### Component Replacements
- ❌ **L!L M.O.Y. Assessment** (removed - too generic)
  - ✅ Replaced with **MOY Benchmark: PAR2, TOSCRF-2, TWS-5** (comprehensive)
- ❌ **L!L E.O.Y. Assessment** (removed - too generic)
  - ✅ Replaced with **EOY Benchmark: PAR2, TOSCRF-2, TWS-5** (comprehensive)
- ❌ **L!L Writing Project / Word Training** (removed - confusing combination)
  - ✅ Replaced with **L!L Writing Project** (separate, with all 8 types listed)

#### Component Descriptions
- Enhanced all 19 ELA components with detailed usage instructions
- Added Language!Live Program Guide alignment information
- Clarified 90-minute implementation model
- Added Level 1 vs Level 2 differentiation

### Fixed

#### Reorder Functionality (Critical Fix)
**Issue**: Up/down arrow buttons returned 400 errors when trying to reorder newly added components

**Root Cause**: Components weren't being assigned proper `display_order` values on creation. All components defaulted to `display_order = 1`, making them un-reorderable.

**Solution**:
- Updated `/api/scheduled-components/route.ts` POST endpoint
- Added automatic `display_order` calculation for both single and multi-component creation:
  ```typescript
  const displayOrderResult = await pool.query(
    `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
     FROM scheduled_components
     WHERE subject_calendar_id = $1 AND start_date = $2`,
    [subject_calendar_id, start_date]
  );
  ```
- Each new component now gets sequential display_order: 1, 2, 3, etc.
- Reorder API can now properly swap positions

**Files Changed**:
- `app/api/scheduled-components/route.ts` (lines 169-192, 241-256)

### Documentation

#### New Files
- **README.md** - Comprehensive project documentation
  - Installation instructions
  - Component library overview
  - Tech stack details
  - Database setup guide
  - Recent updates summary
  - Color coding system
  - Project structure

#### Updated Files
- **components/COMPONENT_CREATION_GUIDE.md**
  - Added "Important Implementation Details" section
  - Added "Display Order (Reordering Components)" explanation
  - Added "Language!Live Component Pattern" section
  - Added troubleshooting for display_order issues
  - Added SQL fix for manually-added components

### Alignment

**Language!Live Program Guide Alignment: 85%**

#### Strengths
- ✅ All required assessments (TOSCRF-2, TWS-5, PAR2) implemented
- ✅ BOY/MOY/EOY benchmark structure matches program guide
- ✅ Dual-component structure (TT/WT) properly implemented
- ✅ Writing projects component created
- ✅ Support components (Make-Up, Flex, ReadingScape) aligned

#### Gaps Identified
- ⚠️ Writing project types are generic (not 8 separate components)
- ⚠️ Unit Pre-Test is optional but recommended
- ⚠️ Vocabulary Checkpoints not standalone components (embedded in lessons)

---

## [1.1.0] - 2024-09-15

### Added
- Multi-day component support with group_id linking
- Component reordering with up/down arrows
- Drag-and-drop component placement
- Weekend and blocked curriculum date handling

### Changed
- Improved calendar visual layout
- Enhanced component library organization

---

## [1.0.0] - 2024-08-01

### Added
- Initial release
- Base calendar management
- ELA, Math, Science, Social Studies subject calendars
- Component library system
- PDF, DOCX, CSV, Excel export capabilities
- User authentication with NextAuth
- PostgreSQL database integration

---

## Component Count by Version

| Version | Total | Base | ELA | Math | Science | Social Studies |
|---------|-------|------|-----|------|---------|----------------|
| 1.3.0   | 294   | 39   | 23  | 48   | 11      | 173            |
| 1.2.0   | 149   | 39   | 19  | 47   | 10      | 26             |
| 1.1.0   | 140   | 39   | 13  | 47   | 10      | 26             |
| 1.0.0   | 135   | 35   | 13  | 47   | 10      | 26             |

---

## Notes

### Version Numbering
- **Major (X.0.0)**: Breaking changes, major feature additions
- **Minor (1.X.0)**: New features, component updates, non-breaking changes
- **Patch (1.1.X)**: Bug fixes, documentation updates, minor tweaks

### Component Updates
ELA component updates in v1.2.0 represent the most significant component library change since initial release, with a complete overhaul to align with the Language!Live Program Guide 2022.

---

[Unreleased]: https://github.com/yourorg/nola-ess-app/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/yourorg/nola-ess-app/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yourorg/nola-ess-app/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourorg/nola-ess-app/releases/tag/v1.0.0
