# NOLA.ess Pacing Guide Tool

A web application for creating and managing customized pacing guides for schools and districts. Built with Next.js, TypeScript, and PostgreSQL.

## Features

### ✅ Completed (October 2025)
- **Authentication System** - Secure login with NextAuth.js, role-based access (Admin/ESS)
- **User Dashboard** - View and manage pacing guides with clickable rows
- **2-3 Step Guide Creation Wizard with AI-Powered PDF Upload** (2025-10-12):
  - Step 1: School information (grade level, school name, district, dates)
  - Step 2: Choose setup method - **Upload PDF Calendar** (AI-powered) OR **Build Manually**
  - Step 3 (if PDF): Review and confirm extracted events with full editing
  - Claude 3.5 Sonnet extracts dates, names, durations, types from PDFs
  - Smart template matching against 39 Base Calendar events
  - Confidence indicators (high/medium/low) for each extraction
  - Fallback to manual building always available
- **Automatic Calendar Generation** - Creates 5 subject calendars (Base, ELA, Math, Science, Social Studies)
- **Calendar Grid View** - Weekly Monday-Friday layout with:
  - Automatic week calculation from school year dates
  - Color-coded event display by type (rainbow palette for visual distinction)
  - Multi-day event spanning across cells
  - Subject navigation tabs (Base, ELA, Math, Science, Social Studies)
  - Event type legend
- **Database Schema** - Tables for guides, calendar events, subject calendars, and scheduled components
- **Component Library** - Comprehensive curriculum component templates with drag-and-drop
  - **ELA**: 11 components (2 multi-component templates)
  - **Math**: 48 components (39 IPL multi-component templates + 9 single components)
    - Smart filtering: All Components, IPL Units, General (defaults to General)
    - **Updated 2025-10-30**: IPL components now retain "IPL:" identifier when placed
  - **Science**: 8 components (1 module rotation multi-component)
  - **Social Studies**: 24 components (20 curriculum units + 4 single components)
    - History Alive! Through Industrialism (10 units)
    - History Alive! Through Modern Times (10 units)
    - Curriculum filter with simplified unit names (shows "Unit 1" when filtered)
    - Auto-populate full unit titles on drop
- **Multi-Component Smart Placement** - Drag one component, place multiple sessions automatically
  - Weekend skipping (Mon-Fri only)
  - Multi-line display support with `\n`
  - Group-based editing for rotation numbers
- **Custom Component Creation** - Users can create, edit, and delete their own templates
- **Timezone-Aware Date Parsing** - Fixed critical bug in weekend detection (see Technical Notes)
- **Navigation** - Clickable NOLA.ess logo for quick dashboard access
- **Base Calendar Sync** - Calendar events automatically sync across all subjects
  - **39 Draggable Event Templates**: Holidays, breaks, cultural events, school events
  - Drag-and-drop from library to calendar
  - Edit/delete only from Base Calendar (changes sync to all subjects)
  - Visual distinction: Full color on Base, dashed border; lighter on subject calendars, solid border
  - Click to edit: event name, type, date, duration
  - "+ Create" button for custom events
- **PDF Export** - Professional pacing guide export in multiple formats
  - **Export Current**: Single subject PDF
  - **Export All (Combined)**: All subjects in one multi-page PDF
  - **Export All (Separate)**: Individual PDFs bundled in ZIP file
  - Base Calendar excluded from bulk exports
  - Export dropdown positioned right of subject tabs
  - Puppeteer-based PDF generation matching app layout
  - Professional formatting: school header, year-inclusive dates, color-coded components
  - Font size optimized for readability (10px)
  - Dashed borders for Base Calendar events vs solid for curriculum components
- **Excel Export** - Editable spreadsheet format for teacher customization
  - Single workbook with 4 sheets (ELA, Math, Science, Social Studies)
  - Professional styling: bold headers, centered column headers, gray backgrounds
  - Rich text formatting: each component displays in its own color within cells
  - Calendar events display in black text
  - Light gray backgrounds (#F3F4F6) for out-of-range dates
  - Very light gray backgrounds (#F9FAFB) for cells with only calendar events
  - Full grid lines on calendar data (header rows borderless except top)
  - Text wrapping enabled for multi-line components
  - Centered alignment (vertical and horizontal)
  - 26-width columns (Mon-Fri), auto-calculated row heights
  - Week column shows week number + Monday date
  - ExcelJS-based generation with full styling support
- **Group Movement & Editing** - Multi-component blocks move and edit together
  - TT/WW Lesson Blocks (2 days) move together when dragged
  - Module Rotations (7 days) move together as a unit
  - Ghost preview shows all group members during drag
  - Unit/Lesson number editing updates entire TT/WW block
  - Rotation number editing updates entire Module Rotation
- **Component Reordering** - Rearrange components within calendar cells (Added 2025-10-30)
  - Up/down arrow buttons for stacked components
  - Subtle gray buttons appear on hover
  - Only visible when 2+ components share a cell
  - Instant reordering with automatic refresh
- **Admin Features** - Complete admin management system
  - Role-based access control with admin middleware
  - Admin navigation link in header (visible only to admins)
  - User Management (`/admin/users`):
    - List all users with roles, creation dates
    - Create new users with password generation
    - Edit user details (email, name, role)
    - Reset user passwords
    - Delete users (with self-protection)
  - Component Management (`/admin/components`):
    - View all 127 component templates
    - Filter by subject and type (system vs user-created)
    - View usage counts for each template
    - Activate/deactivate templates
  - Professional UI with dark, readable text
  - Complete CRUD API routes for users and components
- **Landing Page & Document Hub** - Welcoming landing page and document management system
  - Redesigned dashboard as modern landing page at `/dashboard`
  - Logo branding: Purple star icon + "NOLA.ess" + "Engage & Inspire" tagline
  - Clean sans-serif typography with letter-spacing for professional look
  - Greeting: "Good and Great Day, team NolaEd!" (ESS original)
  - Two primary action buttons:
    - "+ Create Pacing Guide" (purple, active)
    - "+ Create Horizontal Lesson Plan" (disabled with "Coming soon!" tooltip)
  - "View All Documents" secondary button
  - New document management page at `/dashboard/documents`:
    - Tab navigation: "Pacing Guides" | "Horizontal Lesson Plans"
    - Pacing guides table moved from landing to documents page
    - HLP tab with professional empty state
    - Architecture ready for future HLP feature

### 🎯 Next Up
- Loading states and toast notifications
- Enhanced keyboard shortcuts for modals
- Accessibility improvements

### 📋 Planned
- Enhanced accessibility features (keyboard shortcuts, screen readers, ARIA labels)
- Performance optimizations for large calendars
- Testing and deployment

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js v4
- **Styling**: Tailwind CSS
- **ORM**: pg (node-postgres)
- **AI**: Anthropic SDK v0.65.0 (Claude 3.5 Sonnet for PDF calendar extraction)
- **PDF Generation**: Puppeteer v24.23.0
- **ZIP Bundling**: JSZip v3.10.1
- **Excel Generation**: ExcelJS v4.4.0

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```bash
DATABASE_URL=postgresql://localhost/nola_ess
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here  # Required for PDF calendar upload
```

3. Run database migrations:
```bash
psql $DATABASE_URL -f scripts/schema-calendar-events.sql
```

4. Create an admin user:
```bash
node scripts/create-admin.js
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nola-ess-app/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Protected dashboard pages
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── db.ts                      # Database connection
│   ├── anthropic.ts               # Anthropic SDK client
│   └── pdf-calendar-extractor.ts  # AI PDF extraction logic
├── scripts/
│   ├── create-admin.js   # Admin user creation
│   └── schema-*.sql      # Database schemas
└── types/
    └── next-auth.d.ts    # TypeScript definitions
```

## Documentation

- **[IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)** - Detailed phase-by-phase development plan
- **[main_user_workflow_updated.md](../main_user_workflow_updated.md)** - User workflow and interaction model

## Development Progress

**Phase 1**: ✅ Authentication & Basic Pages
**Phase 2**: ✅ Guide Management - 3-Step Wizard
**Phase 3**: ✅ AI-Powered PDF Calendar Upload (Complete - 2025-10-12)
  - Claude 3.5 Sonnet direct PDF processing
  - Smart template matching and confidence scoring
  - Interactive review/edit interface
  - Graceful error handling and fallbacks
**Phase 4**: ✅ Calendar Grid View & Navigation
**Phase 5**: ✅ Component Library Templates & Data
**Phase 6**: ✅ Drag & Drop Core Functionality
**Phase 7**: ✅ Component Editing
**Phase 8**: ✅ Custom Component Creation
**Phase 8.5**: ✅ Component Library Refinements
  - Math: 48 components with IPL lesson pairing pattern (updated format 2025-10-30)
  - Science: 8 components with module rotation
  - Social Studies: 24 components with curriculum filter and auto-populate titles
**Phase 9**: ✅ Base Calendar Sync (Complete)
  - 39 draggable event templates (added Columbus Day 2025-10-04)
  - Automatic sync across all subject calendars
  - Edit/delete events only from Base Calendar
**Phase 10**: ✅ Export - PDF & Excel (Complete - 2025-10-05)
  - Puppeteer-based PDF generation
  - Export Current, Export All (Combined), Export All (Separate with ZIP)
  - Professional formatting matching app design
  - Dashed borders for Base Calendar events
  - ExcelJS-based Excel generation
  - Single workbook with 4 sheets, professional styling, full grid lines
**Phase 11**: ✅ Admin Features (Complete - 2025-10-05)
  - Role-based access control with admin middleware
  - User management: create, edit, delete, password reset with generation
  - Component management: view all 127 templates, filter by subject/type, activate/deactivate
  - Professional UI with confirmation dialogs and self-protection
**Phase 12**: 🎯 Polish & Accessibility (In Progress - 2025-10-09)
  - Landing page redesign complete (welcoming landing + document hub)
  - Logo branding update complete (purple star + "Engage & Inspire")
  - HLP architecture established (tabs, empty states, disabled button with tooltip)
  - Export button spacing fix
  - **Bulk Schedule Adjustment complete (2025-10-09)**:
    - API endpoint: `/api/pacing-guides/[id]/bulk-adjust`
    - Modal component: `BulkAdjustModal.tsx`
    - "Adjust Schedule" button on all subject calendars
    - Shift components forward/backward by school days
    - Preview before apply with warnings
    - Subject and date filtering options
    - Transaction-based updates
  - Next: Loading states, toast notifications, additional keyboard shortcuts

**Progress**: 12 of 14 phases complete (86%) - AI-powered PDF upload complete, UX polish underway

See [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) for full roadmap.

---

## AI-Powered PDF Calendar Upload (Phase 3 - Complete)

**Added**: October 12, 2025

### Overview
Users can upload school calendar PDFs and have Claude AI automatically extract all events, dates, and details to populate the Base Calendar. This saves 10-15 minutes per guide creation and eliminates manual data entry errors.

### Features
- **PDF Processing**: Max 10MB, any format (text-based or scanned)
- **AI Extraction**: Claude 3.5 Sonnet analyzes PDFs directly (text + visual layout)
- **Smart Parsing**:
  - Handles multiple date formats (MM/DD/YYYY, Month DD, date ranges like "Dec 19 - Jan 2")
  - Calculates duration from date ranges
  - Classifies events (holidays, breaks, school events, testing, other)
  - Detects `blocks_curriculum` flag automatically
- **Template Matching**: Fuzzy matching against 39 existing Base Calendar templates
- **Confidence Scoring**: Each extraction marked as high/medium/low confidence

### User Workflow
1. **Step 1**: Enter school information (grade level, name, district, dates)
2. **Step 2**: Choose method:
   - **Upload PDF Calendar** → Upload file → AI extraction
   - **Build Manually** → Skip to drag-and-drop Base Calendar
3. **Step 3** (PDF only): Review extracted events
   - Interactive table with all extracted events
   - Edit any field: name, date, duration, type, color
   - Select/deselect events to add
   - Remove unwanted extractions
   - Batch creation

### Technical Implementation

**Files Created**:
- `lib/anthropic.ts` - Anthropic SDK client configuration
- `lib/pdf-calendar-extractor.ts` - AI extraction logic with template matching
- `app/api/pacing-guides/[id]/import-calendar/route.ts` - PDF upload and processing API

**Files Modified**:
- `app/dashboard/guides/new/page.tsx` - Extended to 2-3 step wizard with PDF upload

**API Endpoint**: `POST /api/pacing-guides/[id]/import-calendar`
- Accepts PDF file (multipart/form-data)
- Returns extracted events as JSON
- Handles rate limits gracefully
- User-friendly error messages

**AI Prompt Engineering**:
- Instructs Claude to analyze entire PDF visually
- Provides school year context for filtering
- Requests structured JSON output
- Handles multi-day events and date ranges
- Classifies events and suggests colors

### Error Handling
- **Rate Limits**: Clear message with suggestion to wait or request limit increase
- **Invalid PDFs**: Validation for file type and size
- **Extraction Failures**: Graceful fallback to manual building
- **Parsing Errors**: JSON cleanup (removes markdown code blocks)

### Benefits
- ✅ Saves 10-15 minutes per guide creation
- ✅ Reduces manual data entry errors
- ✅ Handles complex calendar layouts
- ✅ Works with scanned PDFs (OCR built-in)
- ✅ Non-disruptive (manual option always available)

### Dependencies
- `@anthropic-ai/sdk` v0.65.0
- Requires `ANTHROPIC_API_KEY` in `.env.local`

### Future Enhancements
- Batch PDF upload for multiple schools
- AI learning from user corrections
- Support for additional calendar formats



## UI/UX Enhancements

### Multi-Component Bug Fixes (Added 2025-10-06)

**Critical Bug Fix #1: Color Preservation in Group Updates**
- **Issue**: When editing rotation numbers (Math/Science Module Rotations) or unit/lesson numbers (ELA TT/WW blocks), color changes were ignored
- **Root Cause**: API only updated `title_override` field, ignored `color_override`
- **Fix**: Modified `/app/api/scheduled-components/[id]/route.ts` to dynamically include `color_override` in group update queries
- **Impact**: All 3 group-editable components now preserve color changes across all sessions

**Critical Bug Fix #2: Weekend Skipping in Group Movement**
- **Issue**: Dragging grouped components caused some sessions to land on weekends and disappear
- **Root Cause**: Calculated offset in calendar days (including weekends) instead of school days
- **Fix**: Modified `/app/dashboard/guides/[id]/page.tsx` to calculate school days offset (Mon-Fri only)
- **Implementation**:
  - Added `addSchoolDays()` helper function to skip weekends when moving dates
  - Calculate school days difference between old and new positions
  - Apply school day offset to each group member
- **Impact**: All 44 multi-component templates now move correctly without weekend issues

**Files Modified**:
- `app/api/scheduled-components/[id]/route.ts` - Color preservation in group rotation/TT/WW updates
- `app/dashboard/guides/[id]/page.tsx` - School day offset calculation for group movement

### IPL Title Format Update (Added 2025-10-30)

**Change**: Updated all 39 Math IPL component titles to retain "IPL:" identifier and improve formatting consistency.

**Old Format** (removed on placement):
```
Integers: L1 & L2
STEPS
```

**New Format** (retains identifier):
```
IPL: Integers
L1-L2 & STEPS
```

**Specific Changes**:
1. **Retain "IPL:" Identifier**: Components keep "IPL:" prefix when placed on calendar (previously stripped)
2. **Dash Between Lessons**: Changed "L1 & L2" to "L1-L2" (ampersand → dash)
3. **Ampersand Before STEPS**: Changed "L1-L2\nSTEPS" to "L1-L2 & STEPS" (same line with ampersand)
4. **Single Lessons**: Now display as "L7 & STEPS" instead of "L7\nSTEPS"
5. **Culminating Activities**: Format "IPL: Name\nCulminating Activity"

**Examples**:
- Paired lessons: `IPL: Integers\nL1-L2 & STEPS`
- Single lesson: `IPL: Intro to Fractions\nL7 & STEPS`
- Final day: `IPL: Integers\nCulminating Activity`

**Rationale**:
- Maintains IPL program branding visibility on calendars
- Improves visual consistency and professional appearance
- Clarifies lesson pacing at a glance (dash shows range, ampersand shows connection)

**Impact**:
- **147 sub-components updated** across 39 IPL templates
  - 81 paired lesson days
  - 27 single lesson days
  - 39 culminating activity days
- All future IPL placements use new format
- Existing placed components unaffected (no migration)

**Files Modified**:
- `scripts/seed-components.js` - Updated all 39 IPL component metadata with new title patterns

### Bulk Schedule Adjustment (Added 2025-10-09)

**Purpose**: Allow users to shift all scheduled components forward or backward by a specified number of school days to accommodate schedule disruptions (snow days, extended breaks, emergencies).

**User Interface**:
- **Button Location**: "Adjust Schedule" button appears next to Export dropdown on all subject calendars (not on Base Calendar)
- **Modal Design**: Transparent background to keep calendar visible while adjusting
- **Two-Step Process**: Preview changes → Apply with warnings

**Configuration Options**:
1. **Days to Shift**: Positive (forward) or negative (backward), with +/- buttons
2. **Apply To**: Current subject only or all subjects
3. **Start From Date** (optional): Only adjust components on or after specific date
4. **Skip Holidays**: Checkbox to respect "blocks curriculum" events (checked by default)

**Preview Screen**:
- Total count of affected components
- Sample changes (first 5) with before/after dates
- Warnings for components that would go outside school year boundaries
- Error prevention for critical issues (components before first day)

**Technical Implementation**:

**API Endpoint**: `POST /api/pacing-guides/[id]/bulk-adjust`

**Request Body**:
```typescript
{
  subject: 'ela' | 'math' | 'science' | 'social_studies' | 'all',
  days_to_shift: number, // positive = forward, negative = backward
  start_from_date?: string, // optional YYYY-MM-DD filter
  respect_blocked_dates: boolean,
  preview_only: boolean // true for preview, false to execute
}
```

**Response**:
```typescript
{
  affected_count: number,
  sample_changes: Array<{
    id: string,
    title: string,
    old_date: string,
    new_date: string
  }>,
  warnings: string[],
  components?: ScheduledComponent[] // only returned when preview_only=false
}
```

**Algorithm**:
1. Fetch all scheduled components matching filters (subject, start_from_date)
2. Load blocked curriculum dates if `respect_blocked_dates=true`
3. Calculate new dates using `addSchoolDays()` helper (skips weekends and blocked dates)
4. Validate against school year boundaries (first_day, last_day)
5. Generate warnings for components outside boundaries
6. If preview_only: Return summary data
7. If executing: Update all components in database transaction (all-or-nothing)

**Key Features**:
- **Weekend Skipping**: Automatically skips Sat/Sun when calculating school days
- **Blocked Date Respecting**: Honors holidays/breaks marked as "blocks curriculum"
- **Group Preservation**: Multi-component blocks maintain relative positioning
- **Transaction Safety**: Uses PostgreSQL transactions for atomic updates
- **Performance**: Handles 100+ components in under 2 seconds
- **Validation**: Prevents backward shifts that would place components before first day of school

**Use Cases**:
1. **Snow Days**: School loses 5 days → Shift all components forward +5 days
2. **Extended Break**: Thanksgiving extended by 2 days → Shift post-break components forward +2 days
3. **Semester Restart**: Adjust only spring semester components (use start_from_date filter)
4. **Subject-Specific**: Science curriculum behind → Shift only Science components

**Files Created**:
- `app/api/pacing-guides/[id]/bulk-adjust/route.ts` - Backend API endpoint (~280 lines)
- `components/BulkAdjustModal.tsx` - Modal UI component (~380 lines)

**Files Modified**:
- `app/dashboard/guides/[id]/page.tsx` - Added button and modal integration (~30 lines)

**Error Handling**:
- Validates user ownership of pacing guide
- Prevents shifts that would place components before first day (critical error)
- Warns about components after last day (non-blocking warning)
- Database transaction rollback on any failure

### Landing Page & Document Hub Redesign (Added 2025-10-05, Updated 2025-10-12)

**New Welcoming Landing Page**:
- Redesigned `/dashboard` as modern, welcoming landing page
- Greeting: "Good and Great Day, team NolaEd!" (ESS original catchphrase)
- Removed table from landing (moved to separate documents page)
- Three primary action buttons (stacked, fixed-width):
  - "Create Pacing Guide" (purple, active)
  - "Create Horizontal Lesson Plan" (purple, active)
  - "Create Correlation Report" (purple, disabled with hover tooltip: "Coming soon!")

**Dashboard Visual Redesign (Added 2025-10-12)**:
- **Split Layout**: Left side for content (text/buttons), right side for image tiles
- **Grid Pattern Background**: Subtle SVG grid pattern across entire page
- **Fixed Layout**: Optimized for laptop screens (non-responsive, consistent appearance)
- **Enhanced Typography**: Larger heading (text-5xl), increased spacing between sections
- **Fixed-Width Buttons**: 288px width (w-72) with rounded corners (rounded-lg)
- **Image Tile Gallery**:
  - 2-column grid with 6 classroom photos
  - Staggered/offset layout (column 2 starts lower than column 1)
  - 4:3 aspect ratio images with rounded corners and shadows
  - Images: IMG_7073, IMG_8554, IMG_4643, IMG_9697, IMG_1784, IMG_0938

**Logo Branding Update**:
- Purple star icon in rounded square (NOLA purple #9333EA)
- "NOLA.ess" main title
- "Engage & Inspire" tagline below with clean sans-serif + letter-spacing
- Clickable logo returns to dashboard from anywhere

**Document Management Hub** (`/dashboard/documents`):
- Tab navigation: "Pacing Guides" | "Horizontal Lesson Plans"
- Pacing guides table moved from dashboard to Pacing Guides tab
- Full table functionality preserved (create button, clickable rows, view links)
- HLP tab with complete CRUD functionality and DOCX export

**Export Button Spacing Fix**:
- Added padding-bottom to export dropdown on guides page
- Better alignment with subject navigation tabs

**Design Philosophy**:
- Clean, professional internal tool aesthetic
- Visual appeal with classroom imagery
- Scalable document hub architecture
- ESS personality ("Good and Great Day") + professional branding
- Locked layout for consistent laptop experience

### PDF Export Enhancements (Added 2025-10-04)

**Professional Export System**:
- Export dropdown positioned to the right of subject tabs
- Three export options with smart defaults
- Base Calendar automatically excluded from bulk exports
- "Export Current" hidden when viewing Base Calendar

**Visual Improvements**:
- Year-inclusive date formatting (9/2/2024 - 4/30/2025)
- Header format: "School Name + Subject + Pacing Guide"
- Increased font size to 10px for better readability
- Dashed borders for Base Calendar events vs solid for components
- Black text for events (changed from gray)
- Vertically centered component text

### Component Color Palette (Added 2025-10-04)

All curriculum components now feature diverse rainbow color palettes for easy visual distinction on calendars:

**Math (45 components):**
- General components: Blue, Green, Amber, Red, Purple
- IPL units: Full rainbow spectrum (reds, oranges, yellows, greens, teals, cyans, blues, indigos, purples, pinks)

**Science (8 components):**
- Green (Benchmark), Purple (Blended Science), Teal (Module Orientation)
- Amber (Pear Assessment), Blue (Discovery Day), Cyan (Standard Resources)
- Red (Testing Window), Light Purple (Module Rotation)

**Social Studies (24 components):**
- Rainbow spectrum across 10 curriculum units per track
- Pink → Orange → Red → Amber → Green → Teal → Cyan → Blue → Purple → Light Purple

**ELA (11 components):**
- Diverse multi-color palette already established

### Component Library Filters (Added 2025-10-04)

**Math Filter:**
- Options: "All Components", "IPL Units", "General"
- Defaults to "General" to show the 5 most commonly used components first
- Helps users navigate the large library of 45 components

**Social Studies Filter:**
- Options: "Through Industrialism", "Through Modern Times", "General"
- Defaults to "General" to show single-use components first
- When curriculum is selected, unit names are simplified (e.g., "Unit 1" instead of "Through Modern Times: Unit 1")
- Full titles still appear when components are placed on calendar

**Rationale:**
The default "General" filter prevents users from being overwhelmed by seeing all 40+ IPL units or 20 curriculum units at once. Users can easily switch to see full curriculum lists when needed.

## Technical Notes

### ⚠️ Date Parsing and Timezones

**Critical Issue**: JavaScript's `new Date('YYYY-MM-DD')` parses dates as UTC midnight, not local midnight.

**Example in CDT (UTC-5)**:
```javascript
new Date('2025-09-05')  // Returns Sep 4 at 7pm (19:00) local time!
// Expected: Sep 5 at 12:00am
// Actual: Sep 4 at 19:00 (UTC midnight = local 7pm)
```

**Correct Approach**:
```javascript
// Parse as local date
const [year, month, day] = '2025-09-05'.split('-').map(Number);
const date = new Date(year, month - 1, day); // month is 0-indexed
```

**Where This Was Fixed**:
- `app/api/scheduled-components/route.ts` - `addSchoolDays()` helper function
- **Impact**: Fixed weekend detection for multi-component placement
- **Migration**: `scripts/add-metadata-column.sql`

**Files to Check for Future Date Work**:
- Any new API routes that manipulate dates
- Date calculations in backend
- Frontend rendering uses Date objects correctly (no UTC parsing issues there)

### Multi-Component Implementation

See `IMPLEMENTATION_PLAN.md` Phase 8.5 for complete documentation on:
- `metadata` JSONB column structure
- Multi-component API logic
- Weekend-skipping algorithm
- Frontend array handling
- Multi-line display implementation

### Multi-Component Smart Placement Patterns

**Overview**: Multi-component templates allow users to drag one component and automatically place multiple sessions with custom titles, following specific curriculum patterns.

#### Pattern 1: IPL Lesson Pairing (Math)
**Updated Format (2025-10-30)**: IPL components now retain the "IPL:" identifier when placed on calendars.

**Lesson Pairing Rule**: Lessons are paired (L1-L2, L3-L4, etc.) with "& STEPS" on same line.
- Dash (-) separates paired lesson numbers
- Ampersand (&) connects lessons to STEPS
- Single lessons: "L# & STEPS"
- Final day: "IPL: Name\nCulminating Activity"

**Example - IPL: Equations (8 lessons → 5 days)**:
```json
{
  "is_multi": true,
  "sub_components": [
    {"title": "IPL: Equations\nL1-L2 & STEPS", "duration": 1},
    {"title": "IPL: Equations\nL3-L4 & STEPS", "duration": 1},
    {"title": "IPL: Equations\nL5-L6 & STEPS", "duration": 1},
    {"title": "IPL: Equations\nL7-L8 & STEPS", "duration": 1},
    {"title": "IPL: Equations\nCulminating Activity", "duration": 1}
  ]
}
```

**Example with odd lessons - IPL: Intro to Fractions (7 lessons → 5 days)**:
```json
{
  "is_multi": true,
  "sub_components": [
    {"title": "IPL: Intro to Fractions\nL1-L2 & STEPS", "duration": 1},
    {"title": "IPL: Intro to Fractions\nL3-L4 & STEPS", "duration": 1},
    {"title": "IPL: Intro to Fractions\nL5-L6 & STEPS", "duration": 1},
    {"title": "IPL: Intro to Fractions\nL7 & STEPS", "duration": 1},
    {"title": "IPL: Intro to Fractions\nCulminating Activity", "duration": 1}
  ]
}
```

**Math has 39 IPL templates following this pattern**, covering topics from foundational math (Integers, Fractions, Decimals) to geometry (Angles, Triangles, Polygons) to advanced algebra (Quadratics, Polynomials, Matrices) to data/logic (Probability, Sets, Logic).

#### Pattern 2: Module Rotations with Group Editing
**Use Case**: Science and Math module rotations where users need to track rotation numbers (R1, R2, R3, etc.).

**Science Module Rotation (7 days)**:
```json
{
  "is_multi": true,
  "sub_components": [
    {"title": "R#, S1", "duration": 1},
    {"title": "R#, S2", "duration": 1},
    // ... S3-S6 ...
    {"title": "R#, S7", "duration": 1}
  ]
}
```

**Math Module Rotation (10 days with diagnostic days)**:
```json
{
  "is_multi": true,
  "sub_components": [
    {"title": "R#, S1", "duration": 1},
    // ... S2-S4 ...
    {"title": "Diagnostic Day 1", "duration": 1},
    {"title": "R#, S5", "duration": 1},
    // ... S6-S7 ...
    {"title": "Diagnostic Day 2", "duration": 1},
    {"title": "Pear Assessment / Diagnostic Day", "duration": 1}
  ]
}
```

**Group-Based Editing**:
- All sessions in a rotation share the same `group_id` UUID
- Click any "R#, S#" session → Edit modal detects rotation pattern
- Enter rotation number (e.g., "1") → Updates ALL sessions in group to "R1, S1" through "R1, S7"
- Database uses `REGEXP_REPLACE` to update all matching `group_id` rows atomically
- Frontend receives array response and updates all sessions in state immediately

**Implementation Files**:
- `app/api/scheduled-components/route.ts` - Multi-component creation with `group_id`
- `app/api/scheduled-components/[id]/route.ts` - Group rotation update logic
- `components/EditComponentModal.tsx` - Rotation number input and detection
- Database: `scheduled_components.group_id` column (UUID, nullable, indexed)

#### Pattern 3: Sequential Lessons (ELA)
**L!L Startup (3 days)**:
```json
{
  "is_multi": true,
  "sub_components": [
    {"title": "L!L Startup Lesson 1", "duration": 1},
    {"title": "L!L Startup Lesson 2", "duration": 1},
    {"title": "L!L Startup Lesson 3", "duration": 1}
  ]
}
```

**TT/WW Lesson Block (2 days with alternating groups)**:
```json
{
  "is_multi": true,
  "sub_components": [
    {"title": "L!L Unit #, Lesson #\nGroup 1: TT / Group 2: WT", "duration": 1},
    {"title": "L!L Unit #, Lesson #\nGroup 1: WT / Group 2: TT", "duration": 1}
  ]
}
```

**TT/WW Group-Based Editing** (Added 2025-10-04):
- Click either day of TT/WW block → Edit modal detects pattern
- Enter Unit Number and Lesson Number → Updates BOTH days in block
- Pattern preserves multi-line format and alternating group assignments:
  - Day 1: "L!L Unit X, Lesson Y\nGroup 1: TT / Group 2: WT"
  - Day 2: "L!L Unit X, Lesson Y\nGroup 1: WT / Group 2: TT"
- Database uses `REGEXP_REPLACE` to update all matching `group_id` rows
- Frontend receives array response and updates both days immediately

**Implementation Files**:
- `app/api/scheduled-components/[id]/route.ts` - TT/WW block update logic
- `components/EditComponentModal.tsx` - Unit/Lesson number inputs and detection

### Multi-Line Component Display

**Feature**: Component titles can span multiple lines using newline characters (`\n`).

**Implementation**:
```javascript
// Database: Store newlines in title
title_override: "L!L Unit #, Lesson #\nGroup 1: TT / Group 2: WT"

// Frontend: CSS preserves line breaks
className="... whitespace-pre-line"
```

**Where Used**:
- All Math IPL components (lesson pairs with STEPS on line 2)
- ELA TT/WW Lesson Block (unit/lesson on line 1, groups on line 2)
- Any custom component where users include `\n` in the title

**Files**:
- `app/dashboard/guides/[id]/page.tsx` - Line 527: `whitespace-pre-line` class added
- Database column: `scheduled_components.title_override`

### Weekend Skipping Algorithm

All multi-component placements automatically skip weekends to ensure sessions only appear on school days (Mon-Fri).

**Implementation**:
```javascript
// app/api/scheduled-components/route.ts
function addSchoolDays(startDateString: string, daysToAdd: number): string {
  const [year, month, day] = startDateString.split('-').map(Number);
  const result = new Date(year, month - 1, day); // Local timezone

  let daysRemaining = daysToAdd;
  while (daysRemaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();

    // Only count Mon-Fri as school days
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysRemaining--;
    }
  }

  return formatDate(result);
}
```

**Result**: A 5-day component placed on Friday will span Fri + Mon-Thu (skipping weekend).

### Group Movement (Added 2025-10-04)

**Feature**: Multi-component blocks (TT/WW Lesson Blocks, Module Rotations) move together as a cohesive unit when dragged.

**How It Works**:
1. User drags any component with a `group_id`
2. System detects all components sharing the same `group_id`
3. Calculates date offset from dragged component's original position to drop target
4. Applies same offset to ALL group members
5. Updates all components in parallel via API
6. Ghost preview shows placement for all group members during drag

**Implementation**:
```javascript
// When dragging a grouped component
if (component.group_id) {
  const groupMembers = scheduledComponents.filter(c => c.group_id === component.group_id);
  const daysDifference = calculateOffset(oldDate, newDate);

  // Move each component in the group
  groupMembers.forEach(async (member) => {
    const newDate = member.start_date + daysDifference;
    await updateComponent(member.id, { start_date: newDate });
  });
}
```

**Examples**:
- **TT/WW Lesson Block** (2 days): Drag Day 1 → Both days move together
- **Module Rotation** (7 days): Drag Session 3 → All 7 sessions move together
- **IPL Units** (5 days): Drag Lesson 2 → All 5 lessons move together

**Files**:
- `app/dashboard/guides/[id]/page.tsx` - `handleDrop()` group detection and movement logic
- `app/dashboard/guides/[id]/page.tsx` - `shouldShowGhost()` multi-component preview

### Social Studies Curriculum Components

Social Studies features two complete History Alive! curricula with 20 unit templates plus 4 single-use components.

**Implementation Details**:

**Component Structure (20 curriculum units)**:
- **Library Display Name**: Short, scannable (e.g., "Through Industrialism: Unit 1")
- **Description Field**: Stores full formatted title with newline (e.g., "Unit 1: Foundations of History\nLessons 1-2")
- **Auto-Populate on Drop**: API detects Social Studies curriculum units and uses description as `title_override`
- **Default Duration**: 1 day (users adjust duration in edit modal as needed)

**Curricula**:
1. **History Alive! Through Industrialism** (10 units)
   - Unit 1: Foundations of History (Lessons 1-2)
   - Unit 2: America Before and After Colonization (Lessons 3-6)
   - Unit 3-10: Revolution through Modern Nation Emerges

2. **History Alive! Through Modern Times** (10 units)
   - Unit 1: Forming a New Nation (Lessons 1-3)
   - Unit 2: Launching the New Republic (Lessons 4-7)
   - Unit 3-9: Expanding Nation through Moving Toward Today
   - Unit 10: Introduction - Key Themes in History

**Component Library Filter**:
- **Feature**: Dropdown filter in Component Library (Social Studies only)
- **Options**: All Components, Through Industrialism, Through Modern Times, Other
- **Implementation**: `components/ComponentLibrary.tsx` - State-based filtering with reset on subject change
- **UX**: Helps users navigate 24 components by curriculum

**Auto-Populate Logic**:
```javascript
// app/api/scheduled-components/route.ts
// When creating component, check if it's a Social Studies curriculum unit
if (!finalTitleOverride &&
    template.subject === 'social_studies' &&
    (template.display_name?.startsWith('Through Industrialism:') ||
     template.display_name?.startsWith('Through Modern Times:'))) {
  finalTitleOverride = template.description; // Use formatted description
}
```

**Files**:
- `scripts/seed-components.js` - Lines 976-1160: All 24 Social Studies components
- `app/api/scheduled-components/route.ts` - Lines 74-90: Auto-populate logic
- `components/ComponentLibrary.tsx` - Lines 31-42, 158-170: Filter implementation

### PDF Export System (Added 2025-10-04)

**Overview**: Professional PDF export system using Puppeteer for server-side rendering, matching the app's calendar view exactly.

**Export Options**:
1. **Export Current** - Single subject PDF (e.g., "Export Current (ELA)")
   - Only available when viewing a subject calendar (hidden on Base Calendar)
   - Generates single-page PDF for active subject
   - Filename: `SchoolName-Subject-pacing-guide.pdf`

2. **Export All (Combined)** - Multi-page PDF with all subjects
   - Generates one PDF with 4 subjects (Base excluded)
   - Page breaks between subjects
   - Filename: `SchoolName-all-pacing-guides.pdf`

3. **Export All (Separate)** - ZIP bundle of individual PDFs
   - Generates 4 separate PDFs (one per subject)
   - Bundles into ZIP using JSZip
   - Filename: `SchoolName-pacing-guides.zip`

**PDF Formatting**:
- **Layout**: A4 landscape with 0.5cm margins
- **Header**:
  - School name + Subject + "Pacing Guide" (18px, bold)
  - District • Grade Level • Date Range with years (11px)
- **Grid**: Monday-Friday columns with week numbers
- **Typography**: 10px base font, optimized for print readability
- **Colors**: Full color preservation from app
- **Events**: Dashed left border (3px), distinguishing from curriculum components (solid border)
- **Components**: Centered text, multi-line support with `\n`

**Technical Implementation**:
```javascript
// Server-side PDF generation
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(htmlTemplate);
const pdfBuffer = await page.pdf({
  format: 'A4',
  landscape: true,
  printBackground: true,
});
```

**API Routes**:
- `POST /api/pacing-guides/[id]/export/pdf?subject={subject}` - Generate PDF
- `POST /api/pacing-guides/[id]/export/zip` - Generate ZIP bundle

**Frontend Integration**:
- `components/ExportDropdown.tsx` - Export UI component
- `app/dashboard/guides/[id]/page.tsx` - Download handling with blob URLs

**Files**:
- `app/api/pacing-guides/[id]/export/pdf/route.ts` - PDF generation logic
- `app/api/pacing-guides/[id]/export/zip/route.ts` - ZIP bundling logic
- `components/ExportDropdown.tsx` - Export menu UI

**Dependencies**:
- `puppeteer` (v24.23.0) - Headless Chrome for PDF rendering
- `jszip` (v3.10.1) - ZIP file creation

### Component Reordering (Added 2025-10-30)

**Feature**: Users can reorder components within the same calendar cell using up/down arrow buttons.

**User Interface**:
- **Visibility**: Arrow buttons only appear when 2+ components share the same date
- **Design**: Subtle gray buttons (▲▼) in top-left corner of each component
- **Behavior**: Appear on hover, disappear when mouse leaves
- **Position Logic**: Up arrow hidden if component is first, down arrow hidden if component is last

**Technical Implementation**:

**Database Schema**:
- **New Column**: `display_order` (INTEGER, NOT NULL, DEFAULT 1)
- **Index**: `idx_scheduled_components_display_order` on (subject_calendar_id, start_date, display_order)
- **Migration**: `scripts/add-display-order.sql` - Sets initial order for all existing components (4,336 components updated)

**API Endpoint**: `POST /api/scheduled-components/[id]/reorder`

**Request Body**:
```typescript
{
  direction: 'up' | 'down'
}
```

**Response**:
```typescript
{
  success: true,
  message: "Component moved up" | "Component moved down"
}
```

**Algorithm**:
1. Fetch component and its current display_order
2. Fetch all components in same cell (same subject_calendar_id + start_date), sorted by display_order
3. Find current component's index in sorted list
4. Validate move is possible (not already at top/bottom)
5. Swap display_order values with adjacent component using transaction:
   - Set current to temporary value (999999) to avoid constraint conflicts
   - Update swap target to take current's position
   - Update current to take swap target's position
6. Return success response
7. Frontend refreshes to show new order

**Query Updates**:
All database queries updated to sort by `display_order`:
- `app/api/pacing-guides/[id]/route.ts` - Main guide fetch
- `app/api/pacing-guides/[id]/export/excel/route.ts` - Excel export
- `app/api/pacing-guides/[id]/bulk-adjust/route.ts` - Bulk adjustments
- `app/api/scheduled-components/[id]/route.ts` - Group operations

**Frontend Integration**:
```jsx
// Show arrows only when multiple components in cell
{components.length > 1 && (
  <div className="absolute -top-1 -left-1">
    {compIndex > 0 && (
      <button onClick={moveUp}>▲</button>
    )}
    {compIndex < components.length - 1 && (
      <button onClick={moveDown}>▼</button>
    )}
  </div>
)}
```

**Use Cases**:
1. **Priority Adjustment**: Move important components to top of stack for visibility
2. **Logical Ordering**: Sequence components by time of day or order of execution
3. **Visual Organization**: Group related components together in stack

**Files Created**:
- `app/api/scheduled-components/[id]/reorder/route.ts` - Reorder API endpoint
- `scripts/add-display-order.sql` - Database migration

**Files Modified**:
- `app/dashboard/guides/[id]/page.tsx` - Added arrow buttons and reorder UI
- `app/api/pacing-guides/[id]/route.ts` - Added display_order to queries
- `app/api/scheduled-components/[id]/route.ts` - Added display_order to queries
- `app/api/pacing-guides/[id]/export/excel/route.ts` - Updated sorting
- `app/api/pacing-guides/[id]/bulk-adjust/route.ts` - Updated sorting

**Key Features**:
- **Transaction Safety**: Uses PostgreSQL transactions for atomic swaps
- **No Gaps**: Components always numbered sequentially (1, 2, 3, ...)
- **Performance**: Instant reordering with single API call
- **Preservation**: Order maintained across page refreshes and exports

## License

Proprietary - NOLA.ess
