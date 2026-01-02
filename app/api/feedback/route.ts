import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { type, description, email } = body;

    // Validate required fields
    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['Bug', 'Feedback', 'Question'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Use session email as fallback
    const submitterEmail = email || session?.user?.email || '';

    // Get today's date in YYYY-MM-DD format for Airtable
    const today = new Date().toISOString().split('T')[0];

    // Send to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_FEEDBACK_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                'Type': type,
                'Description': description.trim(),
                'Email': submitterEmail,
                'App': 'NOLA.ess',
                'Date Received': today,
                'Status': 'New',
              },
            },
          ],
        }),
      }
    );

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
