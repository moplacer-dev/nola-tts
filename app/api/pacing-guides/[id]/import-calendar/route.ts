import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { extractEventsFromPDF, matchEventToTemplate } from '@/lib/pdf-calendar-extractor';
import { validateAnthropicConfig } from '@/lib/anthropic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate Anthropic API key is configured
    try {
      validateAnthropicConfig();
    } catch (error) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    const { id: guideId } = await params;

    // Verify the pacing guide belongs to this user
    const guideCheck = await pool.query(
      'SELECT id, first_day, last_day FROM pacing_guides WHERE id = $1 AND user_id = $2',
      [guideId, session.user.id]
    );

    if (guideCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pacing guide not found or unauthorized' },
        { status: 404 }
      );
    }

    const guide = guideCheck.rows[0];

    // Get the uploaded PDF file
    const formData = await req.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Extract events using AI
    let extractionResult;
    try {
      extractionResult = await extractEventsFromPDF(
        pdfBuffer,
        guide.first_day,
        guide.last_day
      );
    } catch (error: any) {
      // Handle rate limit errors with a user-friendly message
      if (error.message?.includes('rate_limit') || error.status === 429) {
        console.error('Rate limit error after retries:', error);
        return NextResponse.json(
          {
            error: 'AI service temporarily unavailable',
            details: 'The AI service is experiencing high demand. We attempted to retry your request automatically, but the service is still busy. Please wait 1-2 minutes and try again.',
            suggestion: 'You can also build your calendar manually by clicking "Skip & Build Manually"',
            retryAfter: 60, // seconds
          },
          { status: 429 }
        );
      }

      // Handle other API errors
      if (error.message?.includes('Failed to extract')) {
        return NextResponse.json(
          {
            error: 'PDF processing failed',
            details: error.message || 'Unable to extract calendar events from the PDF. The format may not be supported.',
            suggestion: 'Try a different PDF or build your calendar manually by clicking "Skip & Build Manually"',
          },
          { status: 500 }
        );
      }

      // Re-throw other errors
      throw error;
    }

    // Fetch existing Base Calendar templates for matching
    const templatesResult = await pool.query(
      `SELECT component_key, display_name, color
       FROM component_templates
       WHERE subject = 'base' AND is_active = true`
    );

    const templates = templatesResult.rows;

    // Match extracted events to templates and enhance data
    const enhancedEvents = extractionResult.events.map((event) => {
      const match = matchEventToTemplate(event.event_name, templates);

      return {
        ...event,
        matched_template: match.matched_template || event.matched_template,
        suggested_color: match.suggested_color || event.suggested_color,
      };
    });

    return NextResponse.json({
      success: true,
      events: enhancedEvents,
      total_found: extractionResult.total_found,
      extraction_notes: extractionResult.extraction_notes,
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to process PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
