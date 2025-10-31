# Social Studies Component Update Instructions

## Summary
We're converting 173 individual lesson components into 35 unit components that use the `is_multi` pattern to automatically skip weekends and breaks (like Math, ELA, and Science already do).

## What Changes
- **Old:** 173 components (individual lessons, openers, closers)
- **New:** 41 components (6 general + 35 unit components with `is_multi`)

## New Structure
Each unit component expands into 1-day sub-components:
- Through Modern Times: 9 units
- Through Industrialism: 10 units
- World Through 1750: 16 units

## Steps to Complete

### 1. Expand the Generator Script
Add Through Industrialism and World Through 1750 data to `scripts/generate-ss-components.js`

### 2. Generate the Complete Output
```bash
cd nola-ess-app
node scripts/generate-ss-components.js > scripts/new-ss-components.txt
```

### 3. Replace in seed-components.js
Open `scripts/seed-components.js` and:
1. Find line ~1530 (after Unit 1 of Through Modern Times)
2. Delete everything from there until line ~2920 (the `];` closing bracket)
3. Paste the contents of `new-ss-components.txt`
4. Verify the file ends with `];` properly

### 4. Test
```bash
node scripts/seed-components.js
# Should see: social_studies: 41
```

### 5. Update ComponentLibrary.tsx Filter
The filter logic is already updated to use `component_key` prefixes, so it should work automatically.

## Through Industrialism Data

Each unit needs:
- unit number
- name
- color
- lessons array with {name, days}

**Example for Unit 1:**
```javascript
{
  unit: 1,
  name: 'Foundations of History',
  color: '#DC2626',
  lessons: [
    { name: 'Unit Opener', days: 1 },
    { name: 'Lesson 1', days: 2 },
    { name: 'Lesson 2', days: 2 },
    { name: 'Unit Closer', days: 1 },
  ]
}
```

## World Through 1750 Data

Same structure, 16 units total.

## Final Component Count
- Base: 39
- ELA: 23
- Math: 48
- Science: 11
- Social Studies: **41** (was 173)
- **Total: 162** (was 294)

## Benefits
✅ Auto-skips weekends/breaks
✅ Clean, concise calendar view
✅ Consistent with other subjects
✅ Easier to maintain
✅ Teachers can still adjust individual days after placement
