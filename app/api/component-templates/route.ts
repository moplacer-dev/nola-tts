import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET - Fetch component templates (optionally filtered by subject)
// Returns both system templates and user's custom templates
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    let query = `
      SELECT id, component_key, subject, display_name, default_duration_days, color, description, user_id
      FROM component_templates
      WHERE is_active = true
        AND (user_id IS NULL OR user_id = $1)
    `;

    const params: any[] = [session.user.id];

    if (subject) {
      params.push(subject);
      query += ` AND subject = $${params.length}`;
    }

    query += ` ORDER BY display_name ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching component templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component templates' },
      { status: 500 }
    );
  }
}

// POST - Create a new custom component template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { display_name, subject, default_duration_days, color } = await req.json();

    // Validation
    if (!display_name || !subject || !default_duration_days || !color) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subject (no Base calendar custom components)
    const validSubjects = ['ela', 'math', 'science', 'social_studies'];
    if (!validSubjects.includes(subject)) {
      return NextResponse.json(
        { error: 'Invalid subject. Custom components only allowed for ELA, Math, Science, Social Studies' },
        { status: 400 }
      );
    }

    // Validate duration
    if (default_duration_days < 1 || default_duration_days > 50) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 50 days' },
        { status: 400 }
      );
    }

    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Must be hex code (e.g., #9333EA)' },
        { status: 400 }
      );
    }

    // Check for duplicate name (per user per subject)
    const duplicateCheck = await pool.query(
      `SELECT id FROM component_templates
       WHERE user_id = $1 AND subject = $2 AND LOWER(display_name) = LOWER($3)`,
      [session.user.id, subject, display_name]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have a component with this name for this subject' },
        { status: 400 }
      );
    }

    // Generate component_key (sanitized name + timestamp)
    const sanitized = display_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const component_key = `custom_${sanitized}_${Date.now()}`;

    // Insert new custom template
    const result = await pool.query(
      `INSERT INTO component_templates
       (component_key, subject, display_name, default_duration_days, color, user_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, component_key, subject, display_name, default_duration_days, color, user_id`,
      [component_key, subject, display_name, default_duration_days, color, session.user.id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating component template:', error);
    return NextResponse.json(
      { error: 'Failed to create component template' },
      { status: 500 }
    );
  }
}
