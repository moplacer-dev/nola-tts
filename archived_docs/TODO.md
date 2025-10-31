# NOLA ESS - Implementation TODO

## Current Status

### ✅ Completed Features

#### Pacing Guides
- [x] Database schema for pacing guides
- [x] Admin interface for managing pacing guides
- [x] PDF generation and download
- [x] User dashboard with pacing guide listing

#### Horizontal Lesson Plans (HLPs)
- [x] Database schema for HLPs, modules, sessions, and enrichments
- [x] HLP creation workflow (select modules)
- [x] HLP listing and viewing in dashboard
- [x] DOCX document generation and download
- [x] Complete table formatting with proper styling
- [x] Line break handling in Goals/Objectives fields
- [x] Export options modal for customizable document sections (2025-10-11)

---

## 🚧 Outstanding Tasks

### Priority 1: HLP Admin Interface ✅ COMPLETE (2025-10-11)

#### Admin Page for HLP Module Templates
**Status:** ✅ Fully implemented
**Date Completed:** October 11, 2025

**Implemented Features:**
1. **Admin Navigation** ✅
   - Added "HLP Module Templates" tab to admin section
   - Consistent with existing admin UI (User Management, Component Templates)
   - Tab navigation working across all admin pages

2. **Module Template Management** ✅
   - List page at `/admin/hlp-templates` with table view
   - Filters: Subject (Math/Science), Show/Hide inactive templates
   - Display columns: Module name, subject, grade level, session count (7/7), enrichment count, usage count, status
   - Create new module templates with modal
   - Activate/deactivate templates (soft delete)
   - Delete templates (hard delete with cascade to sessions/enrichments)

3. **Session Management** ✅
   - Detail page at `/admin/hlp-templates/[id]` with 3 sub-tabs
   - Sessions tab shows all 7 sessions with status indicators
   - Add/edit sessions with upsert logic (ON CONFLICT)
   - Session fields fully implemented:
     - Session number (1-7, validated)
     - Focus (required)
     - Goals/Objectives (required, supports `\n` for line breaks)
     - Materials (optional)
     - Teacher Prep (optional)
     - Assessments/PBA (optional)
   - Delete individual sessions
   - Visual indicator: Green (7/7 complete) vs Red (incomplete)

4. **Enrichment Management** ✅
   - Enrichments tab on detail page
   - Add/edit enrichments with auto-numbering
   - Enrichment fields:
     - Enrichment number (auto-incremented)
     - Title (required)
     - Description (required)
   - Delete individual enrichments
   - Upsert logic with ON CONFLICT

**Files Created:**
- ✅ `/app/admin/hlp-templates/page.tsx` - Main templates list page
- ✅ `/app/admin/hlp-templates/[id]/page.tsx` - Detail page with sessions/enrichments
- ✅ `/app/api/admin/hlp-templates/route.ts` - GET (list), POST (create)
- ✅ `/app/api/admin/hlp-templates/[id]/route.ts` - GET (detail), PATCH (update), DELETE
- ✅ `/app/api/admin/hlp-templates/[id]/sessions/route.ts` - POST (upsert), DELETE
- ✅ `/app/api/admin/hlp-templates/[id]/enrichments/route.ts` - POST (upsert), DELETE

**Files Modified:**
- ✅ `/app/admin/users/page.tsx` - Added HLP tab to navigation
- ✅ `/app/admin/components/page.tsx` - Added HLP tab to navigation

**Technical Implementation:**
- Uses `requireAdmin()` middleware for auth (consistent with existing admin routes)
- Uses `pool` from `@/lib/db` for database queries
- Upsert pattern with `ON CONFLICT` for sessions/enrichments
- Cascade delete on module template removal
- Usage count via LEFT JOIN to `hlp_selected_modules`
- Real-time validation and error handling

---

### Priority 2: Data Import & Validation

#### Import Missing Module Data from Excel
**Status:** Partial - some modules imported, others missing -- ✅ COMPLETE (2025-10-11)

**Recent Fixes:**
- ✅ Module "Geometric Packing v1.1" Session 1 added (2025-10-11)
  - Previously had sessions 2-7 only
  - Now complete with all 7 sessions

**Data Import Tasks:**
1. Review Excel spreadsheet for all module templates
2. Verify all modules have exactly 7 sessions
3. Import missing modules and sessions
4. Validate enrichments are complete

**Validation Script Needed:**
```sql
-- Check for modules with incomplete sessions
SELECT
  m.module_name,
  COUNT(s.id) as session_count
FROM hlp_module_templates m
LEFT JOIN hlp_template_sessions s ON s.template_id = m.id
GROUP BY m.id, m.module_name
HAVING COUNT(s.id) != 7
ORDER BY m.module_name;
```

---

### Priority 3: Error Handling Improvements -- ✅ COMPLETE (2025-10-11)

#### Better Validation Error Messages
**Current Issue:** When module has incomplete sessions, error returns 500 but message not clear to user

**Improvements Needed:**
1. Frontend error display for document generation failures
2. Pre-generation validation before allowing download
3. Warning indicators on HLP cards if modules are incomplete
4. Admin validation warnings for incomplete module templates

**Files to Modify:**
- `/app/dashboard/documents/page.tsx` - Add error state display
- `/app/api/horizontal-lesson-plans/[id]/generate/route.ts` - Already has validation, needs better frontend integration

---

### Priority 4: Nice-to-Have Enhancements

#### HLP Features
- [ ] Bulk import module templates from Excel/CSV
- [ ] Duplicate module template functionality
- [ ] Search/filter module templates by subject/grade
- [ ] Preview module template before adding to HLP
- [ ] Module template versioning (v1.1, v1.2, etc.)

#### Document Generation
- [x] ~~Customizable export sections~~ ✅ COMPLETE (2025-10-11) - Users can now select which sections to include
- [ ] Custom header/footer options
- [ ] Configurable table styling
- [ ] Multiple export formats (PDF support)
- [ ] Save document generation history

#### User Experience
- [ ] Copy existing HLP as template for new one
- [ ] Share HLP with other users
- [ ] Print-friendly view before download
- [ ] Undo/redo for HLP creation

---

## Development Notes

### Recent Features (2025-10-11)

#### Export Options Modal
**Status:** ✅ Fully implemented
**Date:** October 11, 2025

Users can now customize which sections are included in exported HLP documents before generation:

**Features:**
- Modal appears when clicking "Download" button on Documents page
- 6 configurable sections with checkboxes (all checked by default):
  - Focus
  - Goals/Objectives
  - Material List
  - Teacher Prep
  - PBA/Assessments
  - Enrichments
- Session headers and main header always included (structural elements)
- Backward compatible - defaults to showing all sections

**Implementation:**
- Frontend: Export options modal in `/app/dashboard/documents/page.tsx`
- API: Query parameter handling in `/app/api/horizontal-lesson-plans/[id]/generate/route.ts`
- Generator: Optional parameters in `/lib/hlp/generator.ts` and `/lib/hlp/tableBuilder.ts`
- Conditional row creation based on user selections
- All parameters default to `true` for backward compatibility

**Use Case:** Teachers who don't use certain sections (e.g., PBA if they have their own assessment system, or Enrichments if not applicable) can now exclude them for cleaner documents.

### Recent Bug Fixes
- **Line Break Handling:** Fixed TextRun creation to properly handle `\n` characters by conditionally adding break property only when needed (not setting to 0)
- **Document Generation:** Resolved 500 errors caused by invalid TextRun objects with only break property and no text

### Debug Logging
Added comprehensive logging to track document generation:
- 🟣 Purple = API route steps
- 🔵 Blue = Generator steps
- 🟢 Green = Table builder steps
- 🟡 Yellow = Cell creation with text details
- 🔴 Red = Errors

Logs can be removed once stable or converted to debug mode.

---

## Database Schema Reference

### HLP Tables
- `horizontal_lesson_plans` - Main HLP records
- `hlp_module_templates` - Reusable module templates
- `hlp_template_sessions` - 7 sessions per module
- `hlp_template_enrichments` - Enrichments per module
- `hlp_selected_modules` - Junction table linking HLPs to modules

### Key Constraints
- Each module template must have exactly 7 sessions (enforced in API, should add DB constraint)
- Session numbers must be 1-7
- Enrichment numbers are sequential per module
- HLPs can have 1-10 modules

---

## Next Session Priorities

1. ~~**Create HLP Admin Interface**~~ ✅ COMPLETE (2025-10-11)

2. ~~**Implement Export Options**~~ ✅ COMPLETE (2025-10-11)

3. **Import Complete Module Data** (now highest priority)
   - ~~Fix Geometric Packing v1.1 (add Session 1)~~ ✅ COMPLETE (2025-10-11)
   - Verify all other modules have complete sessions
   - Import any other missing modules from Excel

4. **Add Validation Warnings** -- DEFER
   - Show incomplete module warnings in admin
   - Prevent HLP creation with incomplete modules

5. **Clean Up Debug Logging** -- DEFER
   - Remove or conditionally enable verbose logs
   - Keep error logging for production
