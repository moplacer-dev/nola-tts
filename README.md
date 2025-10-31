# NOLA ESS Pacing Guide Application

A comprehensive pacing guide and calendar management system designed for Educational Support Specialists (ESS) to create, manage, and export academic calendars for multiple subjects.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Component Library](#component-library)
- [Database Management](#database-management)
- [Recent Updates](#recent-updates)
- [Documentation](#documentation)

---

## Overview

The NOLA ESS Pacing Guide Application helps educators create structured academic calendars with:
- **Subject-specific calendars** (ELA, Math, Science, Social Studies)
- **Base calendar events** (holidays, breaks, professional development)
- **Pre-built curriculum components** aligned with Language!Live and other programs
- **Export capabilities** (PDF, DOCX, CSV, Excel)
- **Multi-level access** (district, school, classroom levels)

---

## Features

### 📅 Calendar Management
- Create pacing guides with flexible start/end dates
- Manage multiple subject calendars in one guide
- Drag-and-drop component placement with multi-select support
- Visual week-by-week view with color-coded components
- Intelligent weekend and blocked date handling (auto-skip for multi-day components)
- Click-to-select with keyboard shortcuts for fast editing

### 📚 Curriculum Components
- **162 pre-built components** across all subjects
- **ELA (23 components)**: Fully aligned with Language!Live Program Guide
  - Level 1 & Level 2 instruction support
  - Word Training (WT) & Text Training (TT) components
  - Benchmark assessments (BOY, MOY, EOY)
  - Unit pre/post tests
  - Writing projects
- **Math (48 components)**: IPL units with STEPS integration
- **Science (11 components)**: Module rotations and PEAR assessments
- **Social Studies (41 components)**: History Alive! curriculum units
  - Through Modern Times (9 units)
  - Through Industrialism (10 units)
  - World Through 1750 (16 units)
- **Base Calendar (39 components)**: Holidays, breaks, professional development

### 🎨 Component Features
- Color-coded categories for easy visual identification
- Multi-day components with intelligent weekend/break skipping
- **Multi-select**: Click to select, Cmd/Ctrl+Click to add to selection
- **Keyboard shortcuts**: Delete/Backspace to remove, Escape to clear selection
- **Bulk actions**: Delete multiple components at once via floating badge
- Reorderable components within cells (up/down arrows)
- Title overrides and custom notes
- Component duplication and bulk adjustments

### 📊 Export & Sharing
- **PDF Export**: Professional formatted documents
- **DOCX Export**: Editable Microsoft Word documents
- **CSV Export**: Data import for other systems
- **Excel Export**: Full spreadsheet with formulas

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **PDF Generation**: jsPDF
- **Document Export**: docx, xlsx, papaparse
- **UI Components**: shadcn/ui, Radix UI

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

   Run migrations (in order):
   ```bash
   psql -d nola_ess -f scripts/schema-component-templates.sql
   psql -d nola_ess -f scripts/schema-calendar-events.sql
   psql -d nola_ess -f scripts/add-metadata-column.sql
   psql -d nola_ess -f scripts/add-group-id-column.sql
   psql -d nola_ess -f scripts/add-display-order.sql
   psql -d nola_ess -f scripts/add-color-override.sql
   ```

5. **Seed component templates**
   ```bash
   node scripts/seed-components.js
   ```

   When prompted "Delete and reseed? (yes/no):", type `yes`

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**

   Navigate to `http://localhost:3000`

---

## Component Library

### Understanding Component Types

Components can be **simple** (single-day) or **multi-day** (grouped). See [Component Creation Guide](./components/COMPONENT_CREATION_GUIDE.md) for detailed information.

### ELA Components (Language!Live Aligned)

#### Setup & Administrative (4)
- **L!L: Roster Students** - Setup student accounts in online platform
- **L!L: Benchmark Grouping** - Sort students into Level 1 or Level 2
- **L!L Startup** (3 days) - Week 1 program introduction
- **Data Conference** - Teacher dashboard review and practice activity assignment

#### Core Instruction (3)
- **Language! Live Unit (Lessons 1-10, 2 Days)** (22 days) - Full unit with TT/WT rotation
- **Language! Live Unit (Lessons 1-10, Single Day)** (10 days) - Accelerated pacing
- **L!L Unit #, Lesson #** - Flexible single lesson

#### Benchmark Assessments (3)
- **BOY Benchmark: PAR2, TOSCRF-2, TWS-5** - Beginning of year placement
- **MOY Benchmark: PAR2, TOSCRF-2, TWS-5** - Mid-year progress check
- **EOY Benchmark: PAR2, TOSCRF-2, TWS-5** - End of year growth measure

#### Unit Assessments (2)
- **L!L Unit Pre-Test** - Baseline knowledge check
- **L!L Unit Post-Test/Formative** - Required unit completion assessment

#### Writing & Support (5)
- **L!L Writing Project** (5-10 days) - 8 project types per level
- **L!L Make-Up** - Missed instruction recovery
- **L!L ReadingScape** - Online wide reading
- **Flex Day** - Review, reteaching, enrichment
- **State Testing Prep** - Test preparation (LEAP, STAAR, etc.)

#### Optional Tools (1)
- **L!L: Assign Practice Activities** - Vocabulary, Power Pass, Content Mastery

### Understanding Language!Live Levels

**Level 1**: Students significantly below grade level
- Focus: Foundational phonics, basic decoding, consonant/vowel sounds

**Level 2**: Students approaching grade level
- Focus: Morphology, complex text comprehension, syllable types

**90-Minute Model**:
- Level 1 students: TT (teacher-directed) while Level 2 does WT (online)
- Then rotate: Level 1 does WT while Level 2 does TT

---

## Database Management

### Seeding Components

To add or update component templates:

1. Edit `scripts/seed-components.js`
2. Run the seeder:
   ```bash
   node scripts/seed-components.js
   ```

### Key Tables

- **component_templates**: Pre-built curriculum components
- **pacing_guides**: User-created calendars
- **subject_calendars**: Subject-specific calendars (ELA, Math, etc.)
- **scheduled_components**: Components placed on calendars
- **calendar_events**: Base calendar events (holidays, breaks)

### Component Metadata

Components use JSON metadata for advanced features:
```json
{
  "is_multi": true,
  "sub_components": [
    { "title": "Lesson 1", "duration": 1 },
    { "title": "Lesson 2", "duration": 1 }
  ]
}
```

---

## Recent Updates

### October 2024: Social Studies & Multi-Select Features

**Social Studies Component Overhaul:**
- Converted 173 individual components → 41 unit components (using `is_multi` pattern)
- **Through Modern Times**: 9 units (109 instructional days)
- **Through Industrialism**: 10 units (113 instructional days)
- **World Through 1750**: 16 units (182 instructional days)
- Components now automatically skip weekends and blocked dates (like Math/ELA/Science)
- Maintained concise display names (e.g., "Unit 1, Lesson 2") for clean calendar view
- Each unit expands into daily sub-components that can be moved independently

**Multi-Select Functionality:**
- **Click-to-select**: Click any component to select, click again to deselect
- **Multi-select**: Cmd/Ctrl+Click to add multiple components to selection
- **Visual feedback**: Selected components show darker border + shadow elevation
- **Mini floating badge**: Shows selection count with quick-access delete button
- **Keyboard shortcuts**:
  - Delete/Backspace: Delete selected components
  - Escape: Clear selection
- **Bulk delete**: Remove multiple components at once with single confirmation
- Three-dot menu (⋮) for editing individual components

**UX Improvements:**
- Removed cluttered red X delete button
- Streamlined component actions (three-dot menu + reorder arrows)
- Single confirmation dialog (no more double popups)
- Components use their own colors when selected (not generic blue)

---

### October 2024: ELA Component Overhaul

**What Changed:**
- Updated all 23 ELA components to align with Language!Live Program Guide 2022
- Changed terminology from "Group 1/Group 2" to "Level 1/Level 2"
- Added comprehensive benchmark assessments (BOY, MOY, EOY)
- Separated Writing Projects from Word Training
- Enhanced component descriptions with usage guidance

**New Components Added:**
1. L!L: Roster Students
2. L!L: Benchmark Grouping
3. BOY/MOY/EOY Comprehensive Benchmarks (3 total)
4. L!L Unit Pre-Test
5. L!L Unit Post-Test/Formative
6. L!L: Assign Practice Activities
7. State Testing Prep

**Components Replaced:**
- ❌ L!L M.O.Y. Assessment → ✅ MOY Benchmark (comprehensive)
- ❌ L!L E.O.Y. Assessment → ✅ EOY Benchmark (comprehensive)
- ❌ L!L Writing Project / Word Training → ✅ L!L Writing Project (separate)

**Bug Fixes:**
- Fixed reorder functionality for newly added components
- Components now properly assigned sequential `display_order` values
- Up/down arrows work correctly in all cells

**Alignment Score**: 85% alignment with L!L Program Guide

---

## Documentation

- **[Component Creation Guide](./components/COMPONENT_CREATION_GUIDE.md)** - How to create new components
- **[Multi-Select Implementation](./MULTI_SELECT_IMPLEMENTATION_PLAN.md)** - Phase 1 & 2 complete
- **[Multi-Drag Implementation Plan](./MULTI_DRAG_IMPLEMENTATION_PLAN.md)** - Upcoming feature (Phase 3)
- **API Documentation** - Available in `/app/api/` route files
- **Database Schema** - See `/scripts/schema-*.sql` files

---

## Color Coding System

Components use a coordinated color scheme for easy identification:

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
- Check the Component Creation Guide
- Review database schema files
- Check API route documentation in `/app/api/`

---

## License

Proprietary - All rights reserved

---

## Project Structure

```
nola-ess-app/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   ├── dashboard/           # Dashboard pages
│   └── auth/                # Authentication pages
├── components/              # React components
│   ├── ComponentLibrary.tsx
│   ├── EditComponentModal.tsx
│   └── COMPONENT_CREATION_GUIDE.md
├── lib/                     # Utility functions
│   ├── db.ts               # Database connection
│   └── auth.ts             # Authentication config
├── scripts/                 # Database scripts
│   ├── seed-components.js  # Component seeder
│   └── schema-*.sql        # Database schemas
└── public/                  # Static assets
```

---

**Built with ❤️ for Educational Support Specialists**
