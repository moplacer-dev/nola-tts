import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { ModuleTemplateWithCounts, ModuleLibraryResponse } from '@/lib/hlp/types';

/**
 * GET /api/horizontal-lesson-plans/modules
 *
 * Fetch module library with optional filtering
 * Query params:
 *   - subject (optional): Filter by subject
 *   - grade_level (optional): Filter by grade level
 *
 * Returns: Array of module templates with session/enrichment counts
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const gradeLevel = searchParams.get('grade_level');

    // Build dynamic query
    let query = `
      SELECT
        m.id,
        m.module_name,
        m.subject,
        m.grade_level,
        m.is_active,
        m.created_at,
        m.updated_at,
        COUNT(DISTINCT s.id) as session_count,
        COUNT(DISTINCT e.id) as enrichment_count
      FROM hlp_module_templates m
      LEFT JOIN hlp_template_sessions s ON m.id = s.template_id
      LEFT JOIN hlp_template_enrichments e ON m.id = e.template_id
      WHERE m.is_active = true
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add subject filter if provided
    if (subject) {
      query += ` AND m.subject = $${paramIndex}`;
      queryParams.push(subject);
      paramIndex++;
    }

    // Add grade level filter if provided
    if (gradeLevel) {
      query += ` AND m.grade_level = $${paramIndex}`;
      queryParams.push(gradeLevel);
      paramIndex++;
    }

    query += `
      GROUP BY m.id, m.module_name, m.subject, m.grade_level, m.is_active, m.created_at, m.updated_at
      ORDER BY m.module_name ASC
    `;

    // Execute query
    const result = await pool.query(query, queryParams);

    // Map results to typed interface
    const modules: ModuleTemplateWithCounts[] = result.rows.map((row: any) => ({
      id: row.id,
      module_name: row.module_name,
      subject: row.subject,
      grade_level: row.grade_level,
      is_active: row.is_active,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      session_count: parseInt(row.session_count),
      enrichment_count: parseInt(row.enrichment_count),
    }));

    const response: ModuleLibraryResponse = { modules };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching module library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module library' },
      { status: 500 }
    );
  }
}
