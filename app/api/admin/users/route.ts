import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/users
 * List all users in the system
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const result = await pool.query(
      `SELECT
        id,
        email,
        name,
        role,
        created_at,
        updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    // Validation
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, password, role' },
        { status: 400 }
      );
    }

    if (!['admin', 'ess'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "ess"' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email, name, passwordHash, role]
    );

    return NextResponse.json({
      message: 'User created successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
