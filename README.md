# NOLA ESS Pacing Guide Application

A comprehensive pacing guide and calendar management system designed for Educational Support Specialists (ESS) to create, manage, and export academic calendars for multiple subjects.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Component System](#component-system)
- [Recent Updates](#recent-updates)
- [Documentation](#documentation)

---

## Overview

The NOLA ESS Pacing Guide Application helps educators create structured academic calendars with:
- **Subject-specific calendars** (ELA, Math, Science, Social Studies)
- **Base calendar events** (holidays, breaks, professional development)
- **Pre-built curriculum components** aligned with Language!Live and other programs
- **Multi-day component expansion** with intelligent date skipping
- **Export capabilities** (PDF)
- **Versioning and re-pacing** for flexible calendar adjustments

---

## Features

### 📅 Calendar Management
- Create pacing guides with flexible start/end dates
- Manage multiple subject calendars in one unified view
- **Drag-and-drop** component placement from library
- **Multi-select** with Cmd/Ctrl+Click for bulk operations
- Visual week-by-week view with color-coded components
- Intelligent weekend and blocked date handling (auto-skip for multi-day components)
- **Re-pacing**: Shift entire calendars forward/backward while respecting blocked dates
- **Versioning**: Save snapshots of calendars and restore previous versions

### 🧩 Component System (V2)

The V2 architecture introduces a flexible **template expansion system** that supports four expansion types:

#### Expansion Types
1. **Single Day** (`single`) - Traditional 1-day components
2. **Multi-Sequence** (`multi_sequence`) - Named parts that expand sequentially (e.g., "Lesson 1", "Lesson 2")
3. **Multi-Rotation** (`multi_rotation`) - Session-based rotation (e.g., "Session 1 of 8", "Session 2 of 8")
4. **Multi-Grouped** (`multi_grouped`) - Grouped items with repeat patterns (e.g., "Unit 1, Day 1" × 3 times)

#### Component Features
- **180+ pre-built templates** across all subjects
- **Metadata fields**: Support for rotation numbers, unit numbers, lesson numbers, standards
- **Title overrides**: Customize display names while preserving template link
- **Color overrides**: Change colors for specific instances
- **Grouped editing**: Update metadata across all related items
- **Weekend/break skipping**: Multi-day components automatically avoid blocked dates

### 📚 Curriculum Components

- **ELA**: Language!Live modules with multi-day expansion
- **Math**: IPL units and STEPS integration
- **Science**: Module rotations and PEAR assessments
- **Social Studies**: History Alive! curriculum units (Modern, Industrialism, World 1750)
- **Base Calendar**: Holidays, breaks, professional development, school events

### 🎨 UI/UX Features
- **Component Library**: Filter by category, search by name
- **Multi-select**: Click to select, Cmd/Ctrl+Click to add to selection
- **Bulk actions**: Delete, change color, move multiple components at once
- **Keyboard shortcuts**: Delete/Backspace to remove, Escape to clear selection
- **Three-dot menu**: Edit individual component titles and metadata
- **Extend feature**: "Repeat for X Days" to duplicate components
- **Drag preview**: Visual feedback showing component color during drag

### 📊 Export & Versioning
- **PDF Export**: Professional formatted documents with muted colors (30% opacity)
- **Versioning**: Save calendar snapshots with auto-generated version labels
- **Re-pacing**: Shift calendars by X school days while respecting weekends/holidays

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with JSONB support
- **Authentication**: NextAuth.js
- **PDF Generation**: Puppeteer with custom HTML/CSS rendering
- **UI Components**: Custom components with Radix UI primitives

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd nola-ess-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:
   ```env
   DATABASE_URL=postgresql://localhost/nola_ess
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up the database**

   Create the database:
   ```bash
   createdb nola_ess
   ```

   Run V2 schema:
   ```bash
   psql -d nola_ess -f scripts/schema-v2.sql
   ```

5. **Create an admin user**
   ```bash
   node scripts/create-admin.js
   ```

   Follow the prompts to create your admin account.

6. **Seed V2 component templates**
   ```bash
   node scripts/migrate-templates-to-v2.js
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open the application**

   Navigate to `http://localhost:3000`

---

## Architecture

### V2 System Design

The V2 architecture uses a **unified data model** that simplifies the original V1 multi-table approach:

#### V1 → V2 Migration
- ❌ **V1**: 4 separate tables (`component_templates`, `scheduled_components`, `calendar_events`, `subject_calendars`)
- ✅ **V2**: 2 core tables (`component_templates_v2`, `scheduled_items_v2`)

#### Key Improvements
1. **Template Expansion**: Components expand on placement rather than storage
2. **Unified Scheduled Items**: One table for all calendar items (base events + curriculum)
3. **Flexible Metadata**: JSONB fields support any component type
4. **Placement Groups**: Grouped items share a UUID for batch operations
5. **Version Snapshots**: JSONB snapshots for calendar versioning

---

## Database Schema

### Core Tables

#### `users`
```sql
- id (UUID, primary key)
- name (VARCHAR)
- email (VARCHAR, unique)
- password (VARCHAR, hashed)
- created_at (TIMESTAMP)
```

#### `pacing_guides`
```sql
- id (UUID, primary key)
- user_id (UUID, FK → users.id)
- school_name (VARCHAR)
- district_name (VARCHAR)
- grade_level (VARCHAR: '7' or '8')
- first_day (DATE)
- last_day (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `component_templates_v2`
```sql
- id (UUID, primary key)
- component_key (VARCHAR, unique) - Stable identifier
- subject (VARCHAR) - 'base', 'ela', 'math', 'science', 'social_studies'
- display_name (VARCHAR) - User-facing name
- description (TEXT) - Optional usage notes
- color (VARCHAR) - Hex color code
- expansion_type (VARCHAR) - 'single', 'multi_sequence', 'multi_rotation', 'multi_grouped'
- expansion_config (JSONB) - Configuration for multi-day expansion
- default_duration_days (INTEGER) - Total days when expanded
- metadata_fields (TEXT[]) - Array of metadata field names
- category (VARCHAR) - For library filtering
- is_system (BOOLEAN) - System template vs custom
- is_active (BOOLEAN) - Active/archived status
- user_id (UUID, FK → users.id, nullable) - For custom templates
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `scheduled_items_v2`
```sql
- id (UUID, primary key)
- guide_id (UUID, FK → pacing_guides.id)
- calendar_type (VARCHAR) - 'base', 'ela', 'math', 'science', 'social_studies'
- template_id (UUID, FK → component_templates_v2.id, nullable)
- component_key (VARCHAR) - Denormalized for performance
- start_date (DATE)
- duration_days (INTEGER)
- title_override (VARCHAR, nullable) - Custom title
- color_override (VARCHAR, nullable) - Custom color
- metadata (JSONB) - {rotation: "1", unit: "3", lesson: "2", etc.}
- blocks_curriculum (BOOLEAN) - For base calendar events
- source (VARCHAR) - 'manual', 'pdf_extraction', 'library'
- placement_group_id (UUID) - Groups related items
- group_index (INTEGER, nullable) - Position within group
- display_order (INTEGER) - Order within same date
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `pacing_guide_versions`
```sql
- id (UUID, primary key)
- guide_id (UUID, FK → pacing_guides.id)
- version_number (INTEGER) - Auto-incrementing per guide
- version_label (VARCHAR) - Auto-generated description
- snapshot_data (JSONB) - Full snapshot of scheduled_items_v2
- created_at (TIMESTAMP)
- created_by (UUID, FK → users.id)
```

---

## Component System

### Template Expansion Examples

#### Single Day
```json
{
  "expansion_type": "single",
  "default_duration_days": 1
}
```
Expands to: 1 item on the drop date

#### Multi-Sequence
```json
{
  "expansion_type": "multi_sequence",
  "expansion_config": {
    "items": [
      {"title": "Lesson 1", "days": 1},
      {"title": "Lesson 2", "days": 1},
      {"title": "Lesson 3", "days": 1}
    ]
  },
  "default_duration_days": 3
}
```
Expands to: 3 items ("Lesson 1", "Lesson 2", "Lesson 3") starting on drop date

#### Multi-Rotation
```json
{
  "expansion_type": "multi_rotation",
  "expansion_config": {
    "sessions": 8,
    "days_per_session": 1
  },
  "default_duration_days": 8,
  "metadata_fields": ["rotation_number"]
}
```
Expands to: 8 items ("Session 1 of 8", "Session 2 of 8", etc.)

#### Multi-Grouped
```json
{
  "expansion_type": "multi_grouped",
  "expansion_config": {
    "items": [
      {"title": "Day 1", "days": 1, "repeat": 3},
      {"title": "Day 2", "days": 1, "repeat": 3}
    ]
  },
  "default_duration_days": 6,
  "metadata_fields": ["unit_number"]
}
```
Expands to: 6 items (Day 1 × 3, then Day 2 × 3)

### Metadata Field Substitution

Templates can include placeholders in titles:
- `{rotation}` → Replaced with rotation_number from metadata
- `{unit}` → Replaced with unit_number from metadata
- `{lesson}` → Replaced with lesson_number from metadata
- `{standard}` → Replaced with standard_code from metadata

Example:
```
Template: "Unit {unit}, Lesson {lesson}"
Metadata: {"unit": "3", "lesson": "2"}
Result: "Unit 3, Lesson 2"
```

---

## Recent Updates

### November 2024: V2 Migration Complete

**Major Architectural Changes:**
- ✅ Migrated from 4-table V1 system to 2-table V2 system
- ✅ Implemented template expansion system with 4 expansion types
- ✅ Added versioning system with JSONB snapshots
- ✅ Implemented re-pacing with intelligent date shifting
- ✅ Migrated PDF export to V2 with professional styling
- ✅ Updated all admin pages to V2 API
- ✅ Removed all V1 code and database tables

**New Features:**
- **Re-pacing**: Shift calendars forward/backward by X school days
- **Versioning**: Auto-generated version snapshots with restore capability
- **Extend Feature**: "Repeat for X Days" to duplicate components
- **Grouped Metadata Editing**: Update unit/rotation numbers across all related items
- **PDF Export V2**: Portrait layout, 30% color opacity, thin borders, professional typography

**UI/UX Polish:**
- Consistent purple (#9333EA) and teal (#14B8A6) color scheme
- Standardized button sizes (text-sm, py-2, px-4)
- Cleaned up admin tables (hidden unnecessary columns)
- Made District Name optional in Create Guide wizard
- Removed redundant "Back to Dashboard" links

---

## Documentation

### Current Documentation
- **[V2 Completion Plan](../V2_COMPLETION_PLAN.md)** - Current implementation status
- **[Future Re-pacing Enhancements](../FUTURE_REPACING_ENHANCEMENTS.md)** - Planned improvements
- **[V2 Schema README](./scripts/V2_SCHEMA_README.md)** - Database schema details

### Archived Documentation
- **[V2 Rebuild Plan](./archived_docs/V2_REBUILD_PROJECT_PLAN.md)** - Original V2 design
- **[V2 Refinements Plan](./archived_docs/V2_REFINEMENTS_PLAN.md)** - Feature refinements
- **[V2 Component Types](./archived_docs/V2_COMPONENT_TYPES.md)** - Expansion type documentation
- **[Multi-Select Implementation](./archived_docs/MULTI_SELECT_IMPLEMENTATION_PLAN.md)** - Phase 1 & 2 complete
- **[Multi-Drag Implementation Plan](./archived_docs/MULTI_DRAG_IMPLEMENTATION_PLAN.md)** - Completed feature

---

## API Routes

### V2 API Structure

```
/api/v2/
├── component-templates/          # Component template CRUD
│   ├── GET    - List templates (filter by subject)
│   ├── POST   - Create custom template
│   ├── [id]/
│   │   ├── PATCH  - Update template
│   │   └── DELETE - Delete template
├── scheduled-items/              # Scheduled item CRUD
│   ├── GET    - List items (filter by guide_id, calendar_type)
│   ├── POST   - Create items (drag from library, expands template)
│   ├── count/ - GET count by component_key
│   ├── [id]/
│   │   ├── PATCH  - Update single item
│   │   └── DELETE - Delete single item
│   ├── bulk-update-color/
│   │   └── PATCH  - Update color for multiple items
│   └── bulk-move/
│       └── PATCH  - Move multiple items to new date
└── admin/
    └── component-templates/      # Admin template management
        ├── GET    - List all templates
        ├── POST   - Create system template
        ├── [id]/
        │   ├── PATCH  - Update template
        │   └── DELETE - Delete template

/api/pacing-guides/
├── GET    - List user's guides
├── POST   - Create new guide
├── [id]/
│   ├── GET    - Get guide details with scheduled_items
│   ├── DELETE - Delete guide
│   ├── bulk-adjust/
│   │   └── POST   - Re-pace calendar (shift dates)
│   ├── import-calendar/
│   │   └── POST   - AI calendar extraction from PDF
│   ├── add-extracted-events/
│   │   └── POST   - Add PDF-extracted events
│   └── export/
│       └── pdf/
│           └── GET - Export calendar as PDF
```

---

## Color Coding System

Components use a coordinated color scheme for easy visual identification:

| Category | Colors | Hex Codes |
|----------|--------|-----------|
| Setup/Admin | Purple | #8B5CF6, #6366F1 |
| Core Instruction | Red | #DC2626, #EF4444, #F97316 |
| Support/Enrichment | Orange/Amber | #F59E0B, #FBBF24, #D97706 |
| Writing | Deep Orange | #EA580C |
| Benchmarks | Green | #22C55E, #84CC16, #65A30D |
| Unit Assessments | Teal | #10B981, #059669 |
| Optional Tools | Cyan/Blue | #0891B2, #3B82F6 |

---

## Contributing

To add new features or fix bugs:

1. Create a new branch from `main`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a pull request

---

## Support

For questions or issues:
- Check the V2 Completion Plan for current status
- Review database schema in `scripts/schema-v2.sql`
- Check API route documentation in `/app/api/v2/`

---

## License

Proprietary - All rights reserved

---

## Project Structure

```
nola-ess-app/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── v2/                   # V2 API endpoints
│   │   │   ├── component-templates/
│   │   │   ├── scheduled-items/
│   │   │   └── admin/
│   │   └── pacing-guides/        # Guide management
│   ├── dashboard/                # Dashboard pages
│   │   ├── guides/
│   │   │   ├── [id]/            # Calendar view page
│   │   │   └── new/             # Create guide wizard
│   │   ├── documents/           # Documents page
│   │   └── admin/               # Admin pages
│   └── auth/                     # Authentication pages
├── components/                   # React components
│   ├── v2/                       # V2 components
│   │   ├── calendar/
│   │   ├── library/
│   │   └── modals/
│   ├── ComponentLibrary.tsx      # Main library component
│   └── Header.tsx                # App header
├── lib/                          # Utility functions
│   ├── v2/                       # V2 utilities
│   │   ├── template-expansion.ts
│   │   └── date-utils.ts
│   ├── db.ts                     # Database connection
│   └── auth.ts                   # Authentication config
├── scripts/                      # Database scripts
│   ├── schema-v2.sql             # V2 database schema
│   ├── migrate-templates-to-v2.js
│   ├── create-admin.js
│   └── cleanup-v1-tables.sql     # V1 cleanup (run on production)
├── types/                        # TypeScript types
│   └── v2.ts                     # V2 type definitions
├── archived_v1_code/             # Archived V1 code (not deployed)
└── archived_docs/                # Archived documentation (not deployed)
```

---

**Built with ❤️ for Educational Support Specialists**
