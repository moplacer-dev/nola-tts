# PDF Extraction Issues - Troubleshooting Log

## Problem
Need to extract calendar events from PDF files and send to OpenAI for processing.

## Attempts & Failures

### Attempt 1: pdf.js-extract
**Error:** `Module not found: Can't resolve 'canvas'`
**Why it failed:**
- pdf.js-extract requires the `canvas` package (native Node.js module)
- Canvas doesn't work with Next.js webpack bundling
- Causes build and runtime errors

### Attempt 2: pdf-parse
**Error:** Import issues and still canvas-related problems
**Why it failed:**
- Still had dependency issues with Next.js
- Requires complex webpack configuration
- Not designed for modern ES modules

### Attempt 3: pdfjs-dist (Mozilla's official library)
**Error:** `TypeError: Object.defineProperty called on non-object`
**Why it failed:**
- pdfjs-dist is designed for browser environments
- Has issues running in Node.js server context
- Complex initialization requirements for server-side use

## Root Cause
All client-side PDF libraries (pdf.js, pdfjs-dist, pdf-parse) struggle in Next.js server-side API routes because:
1. They're built for browsers or pure Node.js, not Next.js hybrid environment
2. Canvas dependencies don't bundle well with webpack
3. ES module vs CommonJS conflicts
4. Server-side rendering complications

## Solution: Send PDF Directly to OpenAI

**Why this is better:**
- No PDF parsing libraries needed
- No canvas dependencies
- OpenAI handles the extraction
- Simpler, more reliable code
- One less thing to maintain

**Implementation:**
Use OpenAI's File API or convert PDF to base64 and send directly to GPT-4 with vision capabilities.

## Lessons Learned
1. When a third-party service (OpenAI) can handle the complex work (PDF parsing), USE IT
2. Don't fight with bundlers and dependencies when there's a simpler path
3. Server-side PDF processing in Next.js is unnecessarily complicated
4. Always check if the LLM can handle the file format natively before trying to parse it yourself

---

# PRE-DEPLOYMENT REVIEW - CRITICAL ISSUES FOUND
**Review Date:** 2025-10-12
**Status:** 🚨 NOT READY FOR DEPLOYMENT - CRITICAL BLOCKERS

## 🚨 CRITICAL ISSUE #1: Solution NOT Implemented

**Status:** ⚠️ HIGHEST PRIORITY - BLOCKS PRODUCTION DEPLOYMENT

**Problem:**
The documented solution above (send PDF directly to OpenAI) was **NEVER IMPLEMENTED**.

**Current State:**
- `lib/pdf-calendar-extractor.ts:35` still uses `pdfjs-dist` dynamic import
- Code still tries to parse PDF locally before sending to OpenAI
- Dependencies `canvas` and `pdfjs-dist` still in package.json (lines 14, 24)
- Webpack workarounds in `next.config.ts` (lines 7-26) are band-aids

**Why This Will Fail in Production:**
1. Canvas is a native Node.js addon that doesn't bundle properly
2. Webpack config workarounds are fragile and may break
3. Server-side rendering will have issues
4. The error documented above WILL occur at runtime

**Files That Need Changes:**
- `lib/pdf-calendar-extractor.ts` - Lines 31-62 (remove pdfjs logic, add base64 conversion)
- `package.json` - Remove lines 14 & 24 (canvas & pdfjs-dist)
- `next.config.ts` - Remove/simplify webpack config (lines 7-26)

**Recommended Implementation:**
```typescript
// In lib/pdf-calendar-extractor.ts
export async function extractEventsFromPDF(
  pdfBuffer: Buffer,
  schoolYearStart: string,
  schoolYearEnd: string,
): Promise<ExtractionResult> {

  // Convert PDF to base64 for OpenAI
  const base64Pdf = pdfBuffer.toString('base64');
  const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

  console.log(`Sending PDF (${pdfBuffer.length} bytes) to OpenAI for analysis`);

  // Send directly to OpenAI with vision
  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // or gpt-4-vision-preview
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract all calendar events from this school district calendar PDF for ${schoolYearStart} to ${schoolYearEnd}...`
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl }
          }
        ]
      }
    ],
    max_tokens: 2048,
    temperature: 0.1,
  });

  // Parse response...
}
```

---

## 🚨 CRITICAL ISSUE #2: TypeScript Build Error

**Status:** 🔴 BUILD BLOCKER - CANNOT DEPLOY

**Error Message:**
```
Type error: Route "app/api/admin/component-templates/[id]/route.ts" has an invalid "DELETE" export:
  Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

**Problem:**
Next.js 15 requires dynamic route params to be `Promise` objects. Current code uses synchronous params.

**Location:** `app/api/admin/component-templates/[id]/route.ts`

**Broken Code:**
```typescript
// Line 9-11: PATCH function
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ WRONG
) {
  const templateId = params.id;  // ❌ WRONG

// Line 104-106: DELETE function
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ WRONG
) {
  const templateId = params.id;  // ❌ WRONG
```

**Required Fix:**
```typescript
// Line 9-11: PATCH function
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ CORRECT
) {
  const { id: templateId } = await params;  // ✅ CORRECT

// Line 104-106: DELETE function
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ CORRECT
) {
  const { id: templateId } = await params;  // ✅ CORRECT
```

**Impact:**
- Build fails with `npm run build`
- Cannot deploy to production
- Quick fix - 5 minutes

---

## 📋 Other Issues Found

### Issue #3: Obsolete Dependencies
**File:** `package.json`
- `canvas@3.2.0` (line 14) - only needed for pdfjs-dist
- `pdfjs-dist@5.4.296` (line 24) - should be removed once fix #1 is implemented
- These add ~50MB to node_modules and cause build complexity

**Action:** Remove after PDF extraction is fixed

### Issue #4: Webpack Config Workarounds
**File:** `next.config.ts` (lines 7-26)
- Complex canvas/fs fallbacks for client-side
- Server external packages configuration
- All workarounds for problematic dependencies

**Action:** Simplify or remove after dependencies are cleaned up

### Issue #5: ESLint Disabled During Builds
**File:** `next.config.ts` (line 5)
```typescript
eslint: {
  ignoreDuringBuilds: true,
}
```
**Impact:** Hides potential code quality issues
**Action:** Fix linting issues and re-enable

### Issue #6: No Git Repository
**Environment:** Working directory not under version control
**Impact:**
- No deployment rollback capability
- No change history
- Risky for production deployments

**Action:** Initialize git and commit all files

### Issue #7: Debug Logging in Production Code
**File:** Multiple locations (HLP generation, PDF extraction)
**Impact:** Noisy logs, potential performance impact
**Action:** Remove or gate behind debug flag

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

**Must Fix Before Deploy:**
- [ ] Fix TypeScript build error (Issue #2) - app/api/admin/component-templates/[id]/route.ts
- [ ] Implement direct PDF → OpenAI (Issue #1) - lib/pdf-calendar-extractor.ts
- [ ] Test PDF extraction with real school district calendars
- [ ] Verify `npm run build` passes without errors
- [ ] Test OpenAI rate limiting behavior with retries

**Should Fix Before Deploy:**
- [ ] Remove canvas & pdfjs-dist dependencies (Issue #3)
- [ ] Simplify next.config.ts webpack config (Issue #4)
- [ ] Initialize git repository (Issue #6)
- [ ] Clean up debug console.log statements (Issue #7)
- [ ] Re-enable ESLint and fix issues (Issue #5)

**Environment Validation:**
- [ ] OPENAI_API_KEY configured on deployment platform
- [ ] DATABASE_URL configured
- [ ] NEXTAUTH_SECRET and NEXTAUTH_URL configured
- [ ] Test authentication flow in production

---

## 🚀 DEPLOYMENT SEQUENCE

**Phase 1: Fix Build Blockers (Required)**
1. Fix TypeScript error in admin component templates route (5 min)
2. Run `npm run build` to verify

**Phase 2: Implement PDF Solution (Required)**
1. Update lib/pdf-calendar-extractor.ts with base64 approach (30 min)
2. Test with sample PDFs locally
3. Verify OpenAI API responds correctly
4. Test rate limiting and error handling
5. Run `npm run build` again

**Phase 3: Cleanup (Recommended)**
1. Remove obsolete dependencies from package.json
2. Simplify next.config.ts
3. Remove debug logging
4. Initialize git and commit

**Phase 4: Deploy**
1. Set environment variables on hosting platform
2. Deploy application
3. Test PDF upload feature in production
4. Monitor logs for errors
5. Test with various PDF formats

---

## 📝 Testing Plan for PDF Extraction

**Test Cases:**
1. **Valid PDF** - School district calendar with clear dates
2. **Image-only PDF** - Scanned calendar (no text layer)
3. **Large PDF** - 10MB file (current limit)
4. **Multi-page PDF** - Calendar spanning 20+ pages
5. **Rate Limit** - Multiple uploads in quick succession
6. **Invalid File** - Non-PDF file upload
7. **Corrupted PDF** - Malformed PDF file
8. **Empty PDF** - Blank pages

**Success Criteria:**
- Extraction completes in <30 seconds
- Accurate event detection (>90% accuracy)
- Proper error messages for failures
- Rate limit retry logic works
- No server crashes

---

## 🔍 Code Review Summary

**Files Reviewed:**
- ✅ lib/pdf-calendar-extractor.ts (extraction logic)
- ✅ app/api/pacing-guides/[id]/import-calendar/route.ts (upload API)
- ✅ app/dashboard/guides/new/page.tsx (frontend)
- ✅ lib/openai.ts (OpenAI config)
- ✅ next.config.ts (webpack config)
- ✅ package.json (dependencies)
- ✅ app/api/admin/component-templates/[id]/route.ts (build error)

**What Works Well:**
- OpenAI client properly configured with retry logic
- Error handling with user-friendly messages
- Rate limit detection and exponential backoff
- Frontend validation (file type, size)
- Multi-step wizard UI for guide creation
- Environment variable validation

**What Needs Work:**
- PDF parsing approach (switch to direct OpenAI)
- TypeScript build error (Next.js 15 params)
- Dependency cleanup
- Build configuration simplification

---

## 💡 Additional Recommendations

### Frontend Improvements
- Add progress bar during PDF extraction (can take 20-30 seconds)
- Show estimated time: "Usually takes 20-30 seconds"
- Consider increasing file size limit from 10MB to 20MB
- Add file preview before upload

### Error Handling
- Add retry button for failed extractions
- Save partial results if extraction times out
- Log failed PDFs for debugging
- Add analytics for extraction success rate

### Performance
- Consider caching extracted events
- Add queue system for multiple uploads
- Implement background job processing
- Monitor OpenAI API costs

### Security
- Validate PDF content before sending to OpenAI
- Sanitize extracted event data
- Rate limit per user (not just per request)
- Add file scan for malware

---

## 📞 Support & Resources

**OpenAI API Docs:**
- Vision API: https://platform.openai.com/docs/guides/vision
- File uploads: https://platform.openai.com/docs/api-reference/files

**Next.js 15 Docs:**
- Dynamic routes: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Params handling: https://nextjs.org/docs/app/building-your-application/upgrading/version-15

**Contact:**
For questions about this review, refer to implementation notes above.
