import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

// POST /api/admin/hlp-templates/:id/enrichments - Create or update enrichment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id: templateId } = await params;
    const body = await req.json();
    const { enrichment_number, title, description } = body;

    if (!enrichment_number || !title || !description) {
      return NextResponse.json(
        { error: 'Enrichment number, title, and description are required' },
        { status: 400 }
      );
    }

    // Upsert enrichment (insert or update if exists)
    const result = await pool.query(
      `INSERT INTO hlp_template_enrichments
       (template_id, enrichment_number, title, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (template_id, enrichment_number)
       DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description
       RETURNING *`,
      [templateId, enrichment_number, title, description]
    );

    return NextResponse.json({ enrichment: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating enrichment:', error);
    return NextResponse.json(
      { error: 'Failed to save enrichment' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hlp-templates/:id/enrichments/:enrichmentNumber
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id: templateId } = await params;
    const { searchParams } = new URL(req.url);
    const enrichmentNumber = searchParams.get('enrichment_number');

    if (!enrichmentNumber) {
      return NextResponse.json(
        { error: 'Enrichment number is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM hlp_template_enrichments WHERE template_id = $1 AND enrichment_number = $2 RETURNING *',
      [templateId, parseInt(enrichmentNumber)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Enrichment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting enrichment:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrichment' },
      { status: 500 }
    );
  }
}
