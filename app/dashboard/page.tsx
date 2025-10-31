'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Background grid pattern */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full stroke-gray-200"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="200"
            height="200"
            x="50%"
            y="-1"
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" strokeWidth="0" />
      </svg>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-16 py-12">
        <div className="grid grid-cols-2 gap-x-8">
          <div className="max-w-xl">
            {/* Welcome Message */}
            <div className="mb-12">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Good and great day, team NolaEd!
              </h2>
              <p className="text-gray-600 text-lg">
                Select a document type below to get started.
              </p>
            </div>

            {/* Action Cards */}
            <div className="space-y-6">
              <Link href="/dashboard/guides/new" className="block">
                <div className="group cursor-pointer bg-white border border-gray-200 rounded-lg p-6 hover:border-[#9333EA] hover:shadow-md transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#9333EA] transition-colors">
                    Create Pacing Guide
                  </h3>
                  <p className="text-sm text-gray-600">
                    Build subject-specific curriculum calendars with drag-and-drop components for the entire school year.
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/horizontal-lesson-plans/new" className="block">
                <div className="group cursor-pointer bg-white border border-gray-200 rounded-lg p-6 hover:border-[#9333EA] hover:shadow-md transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#9333EA] transition-colors">
                    Create Horizontal Lesson Plan
                  </h3>
                  <p className="text-sm text-gray-600">
                    Generate professional lesson planning documents with Star Academy curriculum modules.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Image Tiles */}
          <div className="grid grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
              <div className="relative">
                <img
                  src="/IMG_7073.jpg"
                  alt="NOLA.ess classroom"
                  className="aspect-[4/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-2xl ring-1 ring-white/10 ring-inset"
                />
              </div>
              <div className="relative">
                <img
                  src="/IMG_8554.jpg"
                  alt="NOLA.ess classroom"
                  className="aspect-[4/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-2xl ring-1 ring-white/10 ring-inset"
                />
              </div>
              <div className="relative">
                <img
                  src="/IMG_4643.jpg"
                  alt="NOLA.ess classroom"
                  className="aspect-[4/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-2xl ring-1 ring-white/10 ring-inset"
                />
              </div>
            </div>

            {/* Column 2 - Offset/Staggered */}
            <div className="space-y-6 pt-12">
              <div className="relative">
                <img
                  src="/IMG_9697.jpg"
                  alt="NOLA.ess classroom"
                  className="aspect-[4/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-2xl ring-1 ring-white/10 ring-inset"
                />
              </div>
              <div className="relative">
                <img
                  src="/IMG_1784.jpg"
                  alt="NOLA.ess classroom"
                  className="aspect-[4/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-2xl ring-1 ring-white/10 ring-inset"
                />
              </div>
              <div className="relative">
                <img
                  src="/IMG_0938.jpg"
                  alt="NOLA.ess classroom"
                  className="aspect-[4/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-2xl ring-1 ring-white/10 ring-inset"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
