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
        <nav aria-label="Admin sections" className="flex gap-8">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
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
