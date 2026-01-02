'use client';

import Header from '@/components/Header';
import FeedbackButton from '@/components/FeedbackButton';
import { SessionProvider } from 'next-auth/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Header />
      {children}
      <FeedbackButton />
    </SessionProvider>
  );
}
