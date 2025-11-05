/**
 * GET /api/v2/component-templates
 *
 * List component templates from library (filtered by subject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { GetComponentTemplatesResponse } from '@/types/v2';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    // Build query
    let query = 'SELECT * FROM component_templates_v2 WHERE is_system = true';
    const params: string[] = [];

    if (subject) {
      query += ' AND subject = $1';
      params.push(subject);
    }

    query += ' ORDER BY category, display_name';

    const result = await pool.query(query, params);

    const response: GetComponentTemplatesResponse = {
      templates: result.rows,
      count: result.rows.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get component templates error:', error);
    return NextResponse.json(
      { error: 'Failed to get component templates' },
      { status: 500 }
    );
  }
}
