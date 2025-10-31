import { anthropic } from './anthropic';
import { extractText } from 'unpdf';

export interface ExtractedEvent {
  event_name: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD for multi-day events
  duration_days: number;
  event_type: string; // 'holiday' | 'break' | 'school_event' | 'testing' | 'other'
  suggested_color: string; // hex color
  blocks_curriculum: boolean;
  confidence: 'high' | 'medium' | 'low';
  matched_template?: string; // component_key if matched
}

export interface ExtractionResult {
  events: ExtractedEvent[];
  total_found: number;
  extraction_notes?: string;
}

/**
 * Extract calendar events from PDF using Anthropic Claude
 * Extracts text from PDF using unpdf, then sends text to Claude for analysis
 */
export async function extractEventsFromPDF(
  pdfBuffer: Buffer,
  schoolYearStart: string, // YYYY-MM-DD
  schoolYearEnd: string,   // YYYY-MM-DD
): Promise<ExtractionResult> {

  // Step 1: Extract text from PDF using unpdf
  console.log(`Extracting text from PDF (${pdfBuffer.length} bytes)...`);

  let pdfText: string;
  try {
    // unpdf expects Uint8Array, not Buffer
    const uint8Array = new Uint8Array(pdfBuffer);
    const extractionResult = await extractText(uint8Array);

    // unpdf returns { totalPages: number, text: string[] }
    // Join all page texts with newlines
    pdfText = extractionResult.text.join('\n\n');

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('IMAGE_BASED_PDF');
    }

    console.log(`Extracted ${pdfText.length} characters from ${extractionResult.totalPages} pages`);
  } catch (error) {
    console.error('Error extracting text from PDF:', error);

    // Check if it's an image-based PDF
    if (error instanceof Error && error.message === 'IMAGE_BASED_PDF') {
      throw new Error('This PDF appears to be image-based (scanned). To use this feature, the PDF must contain selectable text.\n\nTo convert your PDF:\n1. Open the PDF in Adobe Acrobat\n2. Go to Tools → Scan & OCR → Enhance → Scanned Document\n3. Save the enhanced PDF\n4. Upload the new file\n\nAlternatively, you can skip this step and build your calendar manually.');
    }

    throw new Error('Failed to extract text from PDF. The file may be corrupted or image-only.');
  }

  // Step 2: Send extracted TEXT to Claude for analysis
  console.log(`Sending extracted text to Claude for analysis...`);

  // Build the prompt for Claude
  const prompt = `Extract ONLY schedule-blocking events from this school district calendar text for the school year ${schoolYearStart} to ${schoolYearEnd}.

CALENDAR TEXT:
${pdfText}

CRITICAL: Extract ONLY events that significantly impact curriculum instruction time. Be selective and focus on schedule changes.

**Events TO Extract (Schedule-Blocking Only):**

1. **School Closures & Breaks:**
   - Any day labeled "School Closed", "No School", "Closed"
   - Multi-day breaks: Winter Break, Spring Break, Thanksgiving Break, Mardi Gras Break
   - Federal holidays when school is closed: Labor Day, MLK Day, Presidents Day, Memorial Day, Election Day, Veterans Day, Juneteenth
   - Three Kings Day (if school closed)

2. **First/Last Days:**
   - First Day of School (Students)
   - Last Day of School (Students)

3. **Testing Windows (CRITICAL):**
   - State testing windows/weeks (e.g., "State Testing Window", "LEAP Testing", "Assessment Week")
   - Only multi-day testing periods that block regular instruction
   - NOT individual classroom tests or quizzes

4. **Professional Development (Students Absent):**
   - ONLY PD days when students are NOT in school
   - Teacher Work Days when students are absent
   - In-Service Days when students are absent

5. **Early Dismissal Days:**
   - Early Release Days
   - Half Days
   - Modified schedule days with early dismissal

6. **Major School-Wide Events:**
   - Parent-Teacher Conferences (if they block regular instruction)
   - School-wide assemblies or events that cancel classes

**Events to SKIP (Do NOT Extract):**

❌ **Recurring Staff Meetings:**
   - Weekly/monthly meetings (e.g., "CareTeam meeting", "Leadership Team Meeting", "NJTSS Meeting", "PBIS Meeting")
   - PD during school hours (students still attend)

❌ **Grade-Specific Events:**
   - "6th grade" anything (unless school-wide closure)
   - Grade-level field trips
   - Grade-level SEL or assemblies

❌ **Cultural/Awareness Days:**
   - Black History Month, Hispanic Heritage Month, Women's History Month
   - Valentine's Day, Pi Day, Earth Day, Nurses' Day
   - Breast Cancer Awareness Month
   - ANY awareness day/month that doesn't close school

❌ **Administrative Events:**
   - Marking period begins/ends
   - Report card distribution
   - Lesson plans due
   - Household surveys
   - Student of the Month announcements

❌ **Optional/After School Events:**
   - After school programs
   - Optional evening events (e.g., "Trunk or Treat", "Thanksgiving Dinner & Movie")
   - Back to School Night (evening)
   - Picture Day
   - Team Pictures

❌ **Minor Schedule Notes:**
   - "PD 90 minutes" (students still in school)
   - Daylight Savings
   - Emergency Plans Due

For each schedule-blocking event found, extract:
- Event name (exactly as it appears, but simplified if verbose)
- Start date (YYYY-MM-DD format)
- Duration in days (count carefully for multi-day events)
- Event type classification
- All extracted events should have blocks_curriculum: true (since we're only extracting schedule-blocking events)
- Confidence level (high for clear dates, medium for inferred dates)

QUALITY OVER QUANTITY: Extract 15-30 major events, NOT 100+. Be highly selective.

Return ONLY valid JSON in this exact format:
{
  "events": [
    {
      "event_name": "Labor Day",
      "start_date": "2024-09-02",
      "duration_days": 1,
      "event_type": "holiday",
      "suggested_color": "#232323",
      "blocks_curriculum": true,
      "confidence": "high"
    },
    {
      "event_name": "Winter Break",
      "start_date": "2024-12-23",
      "duration_days": 10,
      "event_type": "break",
      "suggested_color": "#232323",
      "blocks_curriculum": true,
      "confidence": "high"
    },
    {
      "event_name": "State Testing Window",
      "start_date": "2025-04-15",
      "duration_days": 5,
      "event_type": "testing",
      "suggested_color": "#232323",
      "blocks_curriculum": true,
      "confidence": "high"
    }
  ],
  "extraction_notes": "Extracted 15 schedule-blocking events. Skipped recurring meetings, grade-specific events, and awareness days."
}

**Event Type Classification:**
- "holiday" - Federal holidays when school is closed
- "break" - Multi-day breaks (3+ days): Winter, Spring, Thanksgiving, Mardi Gras
- "testing" - State testing windows only (multi-day periods)
- "professional_dev" - PD days when students are absent
- "early_dismissal" - Early release/half days
- "school_event" - First/last day of school, major conferences

**Color for ALL Base Calendar Events:**
- ALL events use: #232323 (dark gray)
- This distinguishes base calendar events from curriculum components

Use YYYY-MM-DD format for all dates. Set confidence to "high" for explicit dates, "medium" for inferred. No markdown formatting, just valid JSON.`;

  try {
    // Retry logic with exponential backoff
    let lastError;
    const maxRetries = 3;
    const baseDelay = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 16384, // Increased to handle larger calendars
          temperature: 0.1, // Low temperature for consistent extraction
          messages: [
            {
              role: 'user',
              content: prompt, // Sending TEXT, not document
            },
          ],
        });

        // Check if response was truncated due to token limit
        if (response.stop_reason === 'max_tokens') {
          throw new Error('Calendar extraction incomplete: The PDF contains too many events and the response was truncated. Please try:\n1. Using a PDF with fewer pages\n2. Extracting events in smaller batches\n3. Building your calendar manually');
        }

        // Parse Claude's response
        const messageContent = response.content[0];
        if (messageContent.type !== 'text') {
          throw new Error('Unexpected response type from Claude');
        }

        // Extract JSON from response (might be wrapped in markdown)
        let jsonText = messageContent.text.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
        }

        // Clean up common JSON issues
        // Remove trailing commas before closing braces/brackets
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

        // Remove any text before the first { or after the last }
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }

        // Attempt to repair truncated JSON by closing open structures
        // Check if JSON appears incomplete (no closing brace or array)
        const openBraces = (jsonText.match(/{/g) || []).length;
        const closeBraces = (jsonText.match(/}/g) || []).length;
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;

        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          console.warn('JSON appears truncated. Attempting repair...');
          // Remove any incomplete event at the end (partial object)
          const lastCompleteEvent = jsonText.lastIndexOf('},');
          if (lastCompleteEvent !== -1) {
            jsonText = jsonText.substring(0, lastCompleteEvent + 1);
            // Close the events array and root object
            jsonText += '\n  ]\n}';
          }
        }

        let result: ExtractionResult;
        try {
          result = JSON.parse(jsonText);
        } catch (parseError) {
          // Log more context for debugging
          console.error('JSON Parse Error. Response length:', jsonText.length);
          console.error('First 1000 chars:', jsonText.substring(0, 1000));
          console.error('Last 1000 chars:', jsonText.substring(Math.max(0, jsonText.length - 1000)));

          throw new Error(`Failed to parse JSON from Claude response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. The calendar extraction may be incomplete. Try using a shorter PDF or building your calendar manually.`);
        }

        console.log(`Successfully extracted ${result.events?.length || 0} events from PDF`);

        // Success - return the result
        return {
          events: result.events || [],
          total_found: result.events?.length || 0,
          extraction_notes: result.extraction_notes,
        };

      } catch (error: unknown) {
        lastError = error;

        // Check if it's a rate limit error
        const err = error as { status?: number; message?: string; error?: { type?: string } };
        const isRateLimit = err.status === 429 ||
                           err.message?.includes('rate_limit') ||
                           err.error?.type === 'rate_limit_error';

        // If it's a rate limit and we have retries left, wait and retry
        if (isRateLimit && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`Rate limit hit. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }

        // If it's not a rate limit error, or we're out of retries, throw
        throw error;
      }
    }

    // If we exhausted all retries, throw the last error
    throw lastError;

  } catch (error) {
    console.error('Error extracting events from PDF:', error);
    throw new Error(`Failed to extract calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Match extracted events to existing Base Calendar templates
 */
export function matchEventToTemplate(
  eventName: string,
  existingTemplates: Array<{ component_key: string; display_name: string; color: string }>
): { matched_template?: string; suggested_color: string } {

  const normalizedEventName = eventName.toLowerCase().trim();

  // Exact and fuzzy matching logic
  for (const template of existingTemplates) {
    const templateName = template.display_name.toLowerCase();

    // Exact match
    if (normalizedEventName === templateName) {
      return {
        matched_template: template.component_key,
        suggested_color: template.color,
      };
    }

    // Fuzzy match (contains)
    if (normalizedEventName.includes(templateName) || templateName.includes(normalizedEventName)) {
      return {
        matched_template: template.component_key,
        suggested_color: template.color,
      };
    }

    // Keyword matching for common variations
    const keywords = [
      { keys: ['labor day'], template: 'base_labor_day' },
      { keys: ['thanksgiving'], template: 'base_thanksgiving' },
      { keys: ['winter break', 'christmas'], template: 'base_winter_break' },
      { keys: ['spring break'], template: 'base_spring_break' },
      { keys: ['mlk', 'martin luther king'], template: 'base_mlk_day' },
      { keys: ['presidents'], template: 'base_presidents_day' },
      { keys: ['memorial day'], template: 'base_memorial_day' },
      { keys: ['testing', 'test window'], template: 'base_testing_window' },
      { keys: ['parent', 'conference'], template: 'base_parent_teacher_conferences' },
      { keys: ['professional development', 'pd day'], template: 'base_professional_development' },
    ];

    for (const { keys, template: templateKey } of keywords) {
      if (keys.some(key => normalizedEventName.includes(key)) && template.component_key === templateKey) {
        return {
          matched_template: template.component_key,
          suggested_color: template.color,
        };
      }
    }
  }

  // No match found - return default color
  return {
    matched_template: undefined,
    suggested_color: '#232323', // dark gray for all base calendar events
  };
}
