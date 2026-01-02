'use client';

import { SessionProvider } from 'next-auth/react';
import FeedbackButton from '@/components/FeedbackButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <FeedbackButton />
    </SessionProvider>
  );
}
