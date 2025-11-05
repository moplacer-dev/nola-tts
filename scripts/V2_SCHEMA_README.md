# V2 Database Schema Setup

This directory contains the SQL scripts for creating and testing the V2 database schema.

## Files

- **schema-v2.sql** - Creates V2 tables (component_templates_v2, scheduled_items_v2)
- **test-schema-v2.sql** - Comprehensive test suite to verify schema installation
- **V2_SCHEMA_README.md** - This file

## Prerequisites

- PostgreSQL 14+ installed
- Existing NOLA ESS database with V1 tables
- `psql` command-line tool available
- Database connection configured in `.env.local`

## Installation Steps

### Step 1: Backup Your Database

**IMPORTANT:** Always backup before running migrations!

```bash
# Export entire database
pg_dump -d nola_ess > backup-$(date +%Y%m%d-%H%M%S).sql

# Or just backup V1 tables
pg_dump -d nola_ess -t component_templates -t scheduled_components -t calendar_events > backup-v1-tables.sql
```

### Step 2: Apply V2 Schema

```bash
# Navigate to scripts directory
cd nola-ess-app/scripts

# Run schema creation
psql -d nola_ess -f schema-v2.sql
```

**Expected output:**
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
... (multiple CREATE statements)
INSERT 0 1
INSERT 0 1
... (sample data inserts)
```

**If you see errors:**
- Check that database exists: `psql -d nola_ess -c "\dt"`
- Check that V1 tables exist (they should remain untouched)
- Ensure you have CREATE TABLE permissions

### Step 3: Verify Installation

```bash
# Run test suite
psql -d nola_ess -f test-schema-v2.sql
```

**Expected output:**
```
==========================================
Testing V2 Schema Installation
==========================================

1. Checking if V2 tables exist...
          table_name          |  status
-------------------------------+-----------
 component_templates_v2        | ✓ EXISTS
 scheduled_items_v2            | ✓ EXISTS

2. Checking indexes...
... (12+ indexes listed)

3. Checking constraints...
... (constraints listed)

... (all tests should pass with ✓)

==========================================
V2 Schema Test Complete
==========================================
```

**If any tests fail:**
- Review the error messages
- Check constraints with: `\d component_templates_v2` and `\d scheduled_items_v2`
- Ensure foreign keys reference existing tables

### Step 4: Verify V1 Tables Unchanged

```bash
# Check that old tables still exist
psql -d nola_ess -c "SELECT COUNT(*) FROM component_templates;"
psql -d nola_ess -c "SELECT COUNT(*) FROM scheduled_components;"
psql -d nola_ess -c "SELECT COUNT(*) FROM calendar_events;"
```

All counts should match what you had before. V2 installation does NOT modify V1 tables.

## What Gets Created

### Tables

**component_templates_v2**
- 162 component templates (after Phase 2 migration)
- 4 sample test templates included
- Columns: id, component_key, subject, display_name, expansion_type, expansion_config, metadata_fields, etc.

**scheduled_items_v2**
- Currently empty (will be populated during user data migration in Phase 10)
- Columns: id, guide_id, calendar_type, template_id, start_date, duration_days, placement_group_id, metadata, etc.

### Indexes

**component_templates_v2 indexes:**
- idx_templates_v2_subject (for filtering by subject)
- idx_templates_v2_category (for library categorization)
- idx_templates_v2_system (for system vs custom templates)
- idx_templates_v2_key (for lookups by component_key)

**scheduled_items_v2 indexes:**
- idx_items_v2_guide (for fetching guide's items)
- idx_items_v2_calendar_type (for calendar filtering)
- idx_items_v2_date (for date-based queries)
- idx_items_v2_template (for template references)
- idx_items_v2_group (for grouped components)
- idx_items_v2_guide_calendar (composite for common query)
- idx_items_v2_guide_date (composite for calendar view)
- idx_items_v2_date_display (for stacking order)

### Sample Data

4 test templates are inserted for testing:
- `test_flex_day` - Single-day ELA component
- `test_science_rotation` - Multi-rotation Science component (7 days)
- `test_ss_unit` - Multi-sequence Social Studies unit (10 days)
- `test_winter_break` - Base calendar event (10 days, blocks curriculum)

## Manual Verification Queries

```sql
-- Check tables exist
\dt *_v2

-- View component templates
SELECT component_key, subject, display_name, expansion_type
FROM component_templates_v2
ORDER BY subject, component_key;

-- View scheduled items (should be empty initially)
SELECT COUNT(*) FROM scheduled_items_v2;

-- Check indexes
\di *_v2*

-- Check constraints
SELECT conname, contype FROM pg_constraint
WHERE conrelid = 'component_templates_v2'::regclass;

-- Test JSONB queries
SELECT component_key, expansion_config->>'sessions' as sessions
FROM component_templates_v2
WHERE expansion_type = 'multi_rotation';
```

## Rollback Instructions

If you need to remove V2 tables:

```bash
# Connect to database
psql -d nola_ess

# Drop V2 tables (this is safe - V1 tables unaffected)
DROP TABLE IF EXISTS scheduled_items_v2 CASCADE;
DROP TABLE IF EXISTS component_templates_v2 CASCADE;

# Verify V1 tables still exist
\dt

# Restore from backup if needed
psql -d nola_ess < backup-YYYYMMDD-HHMMSS.sql
```

## Troubleshooting

### Error: "relation already exists"

V2 tables already exist. Either:
1. Drop them first: `DROP TABLE scheduled_items_v2, component_templates_v2 CASCADE;`
2. Or skip to next phase if intentionally re-running

### Error: "permission denied"

You don't have CREATE TABLE permissions. Either:
1. Connect as superuser: `psql -U postgres -d nola_ess`
2. Or grant permissions: `GRANT CREATE ON DATABASE nola_ess TO your_user;`

### Error: "database does not exist"

Create the database first:
```bash
createdb nola_ess
# Then re-run schema-v2.sql
```

### Test failures

If `test-schema-v2.sql` shows failures:
1. Check error messages carefully
2. Verify foreign key references exist (`users`, `pacing_guides` tables)
3. Ensure you have sample data in `pacing_guides` table
4. Some tests skip if no data exists (marked with ⚠)

## Next Steps

Once V2 schema is installed and tested:

1. ✅ Phase 1 complete (Database Schema)
2. ➡️ Proceed to **Phase 2: Migrate Component Templates**
   - Run `node scripts/migrate-templates-to-v2.js`
   - This will convert 162 existing templates to V2 structure

## Questions?

Review the main project plan: `/V2_REBUILD_PROJECT_PLAN.md`

Section: "Phase 1: Database Foundation"
