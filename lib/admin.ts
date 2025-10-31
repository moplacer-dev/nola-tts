import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

/**
 * Check if the current user has admin role
 * Returns the session if user is admin, throws error if not
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  return session;
}

/**
 * Check if user is admin (for client-side checks)
 */
export function isAdmin(role?: string): boolean {
  return role === 'admin';
}
