'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-0 cursor-pointer hover:opacity-80 transition-opacity">
            {/* Teal Accent Bar */}
            <div className="w-1 h-8 bg-[#0D9488] rounded-full mr-3"></div>
            {/* Logo Text */}
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">
              NOLA.ess
            </h1>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/documents"
              className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              My Documents
            </Link>
            {session?.user?.role === 'admin' && (
              <Link
                href="/admin/users"
                className="bg-[#9333EA] hover:bg-[#7928CA] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
