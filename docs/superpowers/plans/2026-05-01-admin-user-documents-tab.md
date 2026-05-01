# Admin User Documents Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "User Documents" admin tab where an admin can pick any user and see that user's pacing guides and horizontal lesson plans (HLPs).

**Architecture:** Two new admin-only list endpoints (`/api/admin/pacing-guides`, `/api/admin/horizontal-lesson-plans`) accept a `userId` query param and reuse the SQL from the existing user-scoped list endpoints, swapping the `WHERE user_id = $1` source from the session to the query string. A new admin page (`/admin/user-documents`) loads the user list (existing `/api/admin/users`), lets the admin pick a user, and fetches both new endpoints in parallel to render two stacked read-only tables. Detail/editor views are out of scope; this MVP is list-only.

**Tech Stack:** Next.js 15.5.4 App Router, next-auth, pg (raw SQL via `lib/db.ts`), Tailwind CSS. No test framework is wired up; verification is manual via dev server and `curl`.

**Out of scope (deferred):** Read-only detail views of guides/HLPs, admin-side document export, search/sort/pagination, edit-as-admin.

---

## File Structure

**Create:**
- `components/admin/AdminTabs.tsx` — shared tab nav component used by all four admin pages. Owns the active-state logic (matches `usePathname` against each tab's `href`).
- `app/api/admin/pacing-guides/route.ts` — `GET` handler returning a target user's pacing guides. Admin-gated via `requireAdmin()`.
- `app/api/admin/horizontal-lesson-plans/route.ts` — `GET` handler returning a target user's HLPs. Admin-gated via `requireAdmin()`.
- `app/admin/user-documents/page.tsx` — the new admin tab page. Renders user picker + two read-only tables.

**Modify:**
- `app/admin/users/page.tsx:104-128` — replace inline tab nav with `<AdminTabs />`.
- `app/admin/components/page.tsx` — same swap (lines around `Admin Navigation Tabs` comment, near 130-152).
- `app/admin/hlp-templates/page.tsx` — same swap (around lines 132-152).

**Why a shared `AdminTabs` component:** The tab nav is currently copy-pasted three times. Adding a fourth tab to three places (and any future tab to four places) is exactly the kind of duplication that bites. One small component beats four manually-synced copies.

---

## Pre-flight

- [ ] **Step 0a: Confirm dev server runs**

```bash
cd /Users/moriahplacer/Desktop/mo.vault.2/pacing.guide.3/nola-ess-app
npm run dev
```

Expected: Next.js boots on `http://localhost:3000`. Log in as an admin user. Verify `/admin/users` renders and the existing three tabs (User Management, Component Templates, HLP Module Templates) all work. Stop the server before continuing — restart per task as needed.

- [ ] **Step 0b: Capture existing API responses for later comparison**

```bash
# Log in via the browser first to get a session cookie, copy it, then:
curl -s -b "next-auth.session-token=<COOKIE>" http://localhost:3000/api/pacing-guides | head -c 500
curl -s -b "next-auth.session-token=<COOKIE>" http://localhost:3000/api/horizontal-lesson-plans | head -c 500
```

Save both responses. The new admin endpoints must return the same row shape (just for a different user).

---

## Task 1: Extract shared `AdminTabs` component and add new tab

**Files:**
- Create: `components/admin/AdminTabs.tsx`
- Modify: `app/admin/users/page.tsx:104-128`
- Modify: `app/admin/components/page.tsx` (the `{/* Admin Navigation Tabs */}` block near line 130)
- Modify: `app/admin/hlp-templates/page.tsx` (the same block near line 132)

This task is a pure refactor plus one new tab entry. After this task, all four admin tabs render correctly and the new tab links to `/admin/user-documents`, which 404s until Task 4. That is acceptable mid-task.

- [ ] **Step 1.1: Create the shared component**

Create `components/admin/AdminTabs.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/users', label: 'User Management' },
  { href: '/admin/components', label: 'Component Templates' },
  { href: '/admin/hlp-templates', label: 'HLP Module Templates' },
  { href: '/admin/user-documents', label: 'User Documents' },
] as const;

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-8">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  isActive
                    ? 'border-b-2 border-[#9333EA] text-[#9333EA] py-4 px-1 text-sm font-medium'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium'
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
```

- [ ] **Step 1.2: Replace the tab nav in `app/admin/users/page.tsx`**

In `app/admin/users/page.tsx`:
1. Add to imports: `import AdminTabs from '@/components/admin/AdminTabs';`
2. Replace the entire block from `{/* Admin Navigation Tabs */}` through its closing `</div>` (currently lines 104-128) with: `<AdminTabs />`

- [ ] **Step 1.3: Replace the tab nav in `app/admin/components/page.tsx`**

Same swap as Step 1.2 for the equivalent block in this file.

- [ ] **Step 1.4: Replace the tab nav in `app/admin/hlp-templates/page.tsx`**

Same swap as Step 1.2 for the equivalent block in this file.

- [ ] **Step 1.5: Verify in the browser**

```bash
npm run dev
```

Open `http://localhost:3000/admin/users` (logged in as admin). Verify:
- All four tabs render: User Management, Component Templates, HLP Module Templates, User Documents.
- The active tab shows the purple underline; the others do not.
- Clicking each existing tab navigates and switches the active state correctly.
- Clicking "User Documents" navigates to `/admin/user-documents` and 404s. (Expected; fixed in Task 4.)

- [ ] **Step 1.6: Lint**

```bash
npm run lint
```

Expected: no new warnings or errors.

- [ ] **Step 1.7: Commit**

```bash
git add components/admin/AdminTabs.tsx app/admin/users/page.tsx app/admin/components/page.tsx app/admin/hlp-templates/page.tsx
git commit -m "refactor(admin): extract AdminTabs shared component, add User Documents tab"
```

---

## Task 2: Admin API — list pacing guides for any user

**Files:**
- Create: `app/api/admin/pacing-guides/route.ts`

The endpoint mirrors the SELECT in `app/api/pacing-guides/route.ts:45-63` but takes `userId` from the query string and gates with `requireAdmin()`.

- [ ] **Step 2.1: Create the route**

Create `app/api/admin/pacing-guides/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * GET /api/admin/pacing-guides?userId=<uuid>
 *
 * Admin-only: list all pacing guides belonging to the specified user.
 * Returns the same shape as GET /api/pacing-guides for the user-scoped view.
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT
        pg.id,
        pg.school_name,
        pg.district_name,
        pg.grade_level,
        pg.first_day,
        pg.last_day,
        pg.created_at,
        pg.updated_at,
        MAX(v.version_number) as current_version,
        MAX(v.created_at) as last_repaced_at
       FROM pacing_guides pg
       LEFT JOIN pacing_guide_versions v ON pg.id = v.guide_id
       WHERE pg.user_id = $1
       GROUP BY pg.id, pg.school_name, pg.district_name, pg.grade_level, pg.first_day, pg.last_day, pg.created_at, pg.updated_at
       ORDER BY pg.created_at DESC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching pacing guides for user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pacing guides' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2.2: Verify with curl — happy path**

Pick a non-admin user with at least one guide. From the browser as admin, copy the session cookie. Then:

```bash
# Replace USER_UUID with a target user's id from /api/admin/users
curl -s -b "next-auth.session-token=<COOKIE>" \
  "http://localhost:3000/api/admin/pacing-guides?userId=USER_UUID" | head -c 500
```

Expected: JSON array of guide rows; same shape as the response captured in Step 0b for that user (when logged in as them).

- [ ] **Step 2.3: Verify with curl — unauthorized (non-admin)**

Log in as a non-admin (`ess` role) user, copy that session cookie:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -b "next-auth.session-token=<COOKIE>" \
  "http://localhost:3000/api/admin/pacing-guides?userId=USER_UUID"
```

Expected: `403`.

- [ ] **Step 2.4: Verify with curl — missing userId**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -b "next-auth.session-token=<COOKIE>" \
  "http://localhost:3000/api/admin/pacing-guides"
```

Expected: `400`.

- [ ] **Step 2.5: Commit**

```bash
git add app/api/admin/pacing-guides/route.ts
git commit -m "feat(admin): add GET /api/admin/pacing-guides for read-only cross-user list"
```

---

## Task 3: Admin API — list HLPs for any user

**Files:**
- Create: `app/api/admin/horizontal-lesson-plans/route.ts`

Mirrors the SELECT in `app/api/horizontal-lesson-plans/route.ts:155-172` and the response shape (`HLPListResponse` from `lib/hlp/types`).

- [ ] **Step 3.1: Create the route**

Create `app/api/admin/horizontal-lesson-plans/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';
import { HLPListItem, HLPListResponse } from '@/lib/hlp/types';

/**
 * GET /api/admin/horizontal-lesson-plans?userId=<uuid>
 *
 * Admin-only: list all HLPs belonging to the specified user.
 * Returns the same shape as GET /api/horizontal-lesson-plans for the user-scoped view.
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT
        h.id,
        h.school_name,
        h.teacher_name,
        h.school_year,
        h.subject,
        h.created_at,
        COUNT(sm.id) as module_count,
        ARRAY_AGG(m.module_name ORDER BY sm.module_number) as module_names
      FROM horizontal_lesson_plans h
      LEFT JOIN hlp_selected_modules sm ON h.id = sm.hlp_id
      LEFT JOIN hlp_module_templates m ON sm.template_id = m.id
      WHERE h.user_id = $1
      GROUP BY h.id, h.school_name, h.teacher_name, h.school_year, h.subject, h.created_at
      ORDER BY h.created_at DESC`,
      [userId]
    );

    const hlps: HLPListItem[] = result.rows.map((row: any) => ({
      id: row.id,
      school_name: row.school_name,
      teacher_name: row.teacher_name,
      school_year: row.school_year,
      subject: row.subject,
      module_count: parseInt(row.module_count),
      module_names: row.module_names || [],
      created_at: new Date(row.created_at),
    }));

    const response: HLPListResponse = { hlps };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching HLPs for user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Horizontal Lesson Plans' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3.2: Verify with curl — happy path, unauthorized, missing param**

Repeat the three curl checks from Steps 2.2-2.4 against `/api/admin/horizontal-lesson-plans`.

Expected: 200 (admin + valid userId), 403 (non-admin), 400 (missing userId).

- [ ] **Step 3.3: Commit**

```bash
git add app/api/admin/horizontal-lesson-plans/route.ts
git commit -m "feat(admin): add GET /api/admin/horizontal-lesson-plans for read-only cross-user list"
```

---

## Task 4: Build the User Documents page

**Files:**
- Create: `app/admin/user-documents/page.tsx`

The page mirrors `app/admin/users/page.tsx` for auth/loading scaffolding, uses `<AdminTabs />`, and renders:
1. A user picker (select dropdown of all users from `/api/admin/users`).
2. When a user is selected: parallel fetches to the two new admin endpoints, then two stacked read-only tables.
3. Empty states when the selected user has no guides or no HLPs.

- [ ] **Step 4.1: Create the page**

Create `app/admin/user-documents/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AdminTabs from '@/components/admin/AdminTabs';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface PacingGuide {
  id: string;
  school_name: string;
  district_name: string;
  grade_level: string;
  first_day: string;
  last_day: string;
  created_at: string;
  current_version: number | null;
  last_repaced_at: string | null;
}

interface HLP {
  id: string;
  school_name: string;
  teacher_name: string;
  school_year: string;
  subject: string;
  module_count: number;
  module_names: string[];
  created_at: string;
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUserDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [guides, setGuides] = useState<PacingGuide[]>([]);
  const [hlps, setHlps] = useState<HLP[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth gate — match the pattern in app/admin/users/page.tsx
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      void loadUsers();
    }
  }, [status, session, router]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadDocs(userId: string) {
    setLoadingDocs(true);
    setError(null);
    setGuides([]);
    setHlps([]);
    try {
      const [guidesRes, hlpsRes] = await Promise.all([
        fetch(`/api/admin/pacing-guides?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/admin/horizontal-lesson-plans?userId=${encodeURIComponent(userId)}`),
      ]);
      if (!guidesRes.ok) throw new Error('Failed to load pacing guides');
      if (!hlpsRes.ok) throw new Error('Failed to load horizontal lesson plans');
      const guidesData = await guidesRes.json();
      const hlpsData = await hlpsRes.json();
      setGuides(guidesData);
      setHlps(hlpsData.hlps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  }

  function handleUserChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedUserId(id);
    if (id) void loadDocs(id);
    else { setGuides([]); setHlps([]); }
  }

  if (status === 'loading' || loadingUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header />
        <AdminTabs />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'admin') return null;

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Documents</h1>
          <p className="mt-1 text-sm text-gray-600">
            Read-only view of any user's pacing guides and horizontal lesson plans.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <label htmlFor="user-picker" className="block text-sm font-medium text-gray-700 mb-2">
            Select user
          </label>
          <select
            id="user-picker"
            value={selectedUserId}
            onChange={handleUserChange}
            className="block w-full max-w-md border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
          >
            <option value="">— Pick a user —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-sm">
            {error}
          </div>
        )}

        {loadingDocs && (
          <p className="text-gray-600 text-sm">Loading documents…</p>
        )}

        {!loadingDocs && selectedUser && (
          <>
            {/* Pacing Guides */}
            <section className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pacing Guides ({guides.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Owned by {selectedUser.name}
                </p>
              </div>
              {guides.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">No pacing guides.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guides.map((g) => (
                      <tr key={g.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{g.school_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{g.district_name || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{g.grade_level}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(g.first_day)} – {formatDate(g.last_day)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(g.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* HLPs */}
            <section className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Horizontal Lesson Plans ({hlps.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Owned by {selectedUser.name}
                </p>
              </div>
              {hlps.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">No horizontal lesson plans.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hlps.map((h) => (
                      <tr key={h.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{h.school_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.teacher_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.school_year}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {h.module_count} ({h.module_names.filter(Boolean).join(', ') || '—'})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(h.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Verify in the browser — empty state**

```bash
npm run dev
```

As admin, navigate to `/admin/user-documents`. Verify:
- Page renders with all four tabs and the "User Documents" tab active.
- The user picker is populated with all users.
- Before selecting a user, no tables show.

- [ ] **Step 4.3: Verify in the browser — happy path**

Pick a user who has at least one pacing guide. Verify:
- Two sections render: "Pacing Guides (N)" and "Horizontal Lesson Plans (M)".
- Counts match what that user sees on `/dashboard/documents` when logged in as them. (Spot-check by logging in as that user in a different browser/incognito window.)
- All rows are visible and rendered with no Edit/Delete/Generate actions.

- [ ] **Step 4.4: Verify in the browser — user with no docs**

Switch to a user with zero guides and zero HLPs. Verify both sections show their empty-state message and counts read `(0)`.

- [ ] **Step 4.5: Verify in the browser — non-admin can't reach the page**

Log out, log in as a non-admin (`ess` role), and visit `/admin/user-documents` directly. Expected: redirects to `/dashboard` (matches existing `app/admin/users/page.tsx` behavior at line 32).

- [ ] **Step 4.6: Lint and typecheck**

```bash
npm run lint
npx tsc --noEmit
```

Expected: no new warnings or errors.

- [ ] **Step 4.7: Commit**

```bash
git add app/admin/user-documents/page.tsx
git commit -m "feat(admin): add User Documents page for read-only cross-user document view"
```

---

## Final verification

- [ ] **Step F.1: End-to-end smoke test**

```bash
npm run dev
```

As admin:
1. Navigate `/admin/users` → all four tabs render, User Management active.
2. Click each tab in turn. Each loads, active state moves correctly.
3. On User Documents, pick three different users in succession. For each, verify counts match what that user sees on their own `/dashboard/documents`.
4. Open browser devtools → Network. When picking a user, verify exactly two requests fire in parallel: `GET /api/admin/pacing-guides?userId=...` and `GET /api/admin/horizontal-lesson-plans?userId=...`. Both return 200.

- [ ] **Step F.2: Build**

```bash
npm run build
```

Expected: build succeeds with no new warnings beyond what was present before this work.

- [ ] **Step F.3: Final review**

Confirm:
- The four files in the "Create" section above all exist.
- No leftover inline tab navs in any of the four admin pages — they all use `<AdminTabs />`.
- No edit/delete/export controls accidentally rendered in `/admin/user-documents`.
- The two new endpoints both 403 for non-admins and 400 when `userId` is missing.

---

## Notes for follow-up work (out of scope)

- **Read-only detail views.** The existing `/dashboard/guides/[id]/page.tsx` is a 1198-line editor. A future task could add a `?view=admin` mode that disables mutation handlers and hides edit toolbars, plus a sibling read-only HLP detail view (since none exists today). Once that's in, the admin tables can link rows into those views.
- **Admin-side document download.** The HLP `generate` endpoint produces a docx for the logged-in owner. A small admin variant could let an admin download a copy without becoming the owner.
- **Filters / search / pagination.** The user picker is fine for tens-of-users-scale (current state). At hundreds, swap for a typeahead and add server-side pagination on the document lists.
