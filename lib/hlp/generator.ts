/**
 * Horizontal Lesson Plan - DOCX Generator
 *
 * Generates complete Word documents programmatically
 * Matches exact formatting from Flask implementation
 */

import { Document, Paragraph, TextRun, Packer, AlignmentType, PageOrientation } from 'docx';
import { DOCXGenerationData } from './types';
import { buildHLPTable } from './tableBuilder';

/**
 * Create document header paragraph with school information
 *
 * Format: "SCHOOL: [name]    SUBJECT: [subject]    TEACHER: [name]    SCHOOL YEAR: [year]"
 * All on one line with bold labels
 */
function createHeaderParagraph(data: DOCXGenerationData): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: 'SCHOOL: ', bold: true }),
      new TextRun({ text: data.hlp.school_name }),
      new TextRun({ text: '    SUBJECT: ', bold: true }),
      new TextRun({ text: data.hlp.subject }),
      new TextRun({ text: '    TEACHER: ', bold: true }),
      new TextRun({ text: data.hlp.teacher_name }),
      new TextRun({ text: '    SCHOOL YEAR: ', bold: true }),
      new TextRun({ text: data.hlp.school_year }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: {
      after: 200, // Add space after header before table
    },
  });
}

export interface ExportOptions {
  includeFocus?: boolean;
  includeGoals?: boolean;
  includeMaterials?: boolean;
  includeTeacherPrep?: boolean;
  includePBA?: boolean;
  includeEnrichments?: boolean;
}

/**
 * Generate complete DOCX document
 *
 * @param data - HLP data with modules, sessions, and enrichments
 * @param exportOptions - Optional settings to control which sections to include
 * @returns Buffer containing DOCX file
 */
export async function generateHLPDocument(
  data: DOCXGenerationData,
  exportOptions: ExportOptions = {}
): Promise<Buffer> {
  console.log('🔵 [Generator] Starting document generation...');

  // Validate data
  if (!data.hlp) {
    throw new Error('HLP data is required');
  }

  if (!data.modules || data.modules.length === 0) {
    throw new Error('At least one module is required');
  }

  if (data.modules.length > 10) {
    throw new Error('Maximum 10 modules allowed');
  }

  // Verify all modules have 7 sessions
  for (const moduleData of data.modules) {
    if (moduleData.sessions.length !== 7) {
      throw new Error(
        `Module "${moduleData.template.module_name}" has ${moduleData.sessions.length} sessions, expected 7`
      );
    }
  }

  console.log(`🔵 [Generator] Validated ${data.modules.length} modules`);

  // Sort modules by module_number to ensure correct order
  const sortedModules = [...data.modules].sort((a, b) => a.module_number - b.module_number);

  // Create document header
  console.log('🔵 [Generator] Creating header paragraph...');
  const headerParagraph = createHeaderParagraph(data);

  // Build HLP table
  console.log('🔵 [Generator] Building HLP table...');
  try {
    const table = buildHLPTable(sortedModules, exportOptions);
    console.log('🔵 [Generator] Table built successfully');

    // Create document
    console.log('🔵 [Generator] Creating Document object...');
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 360,    // 0.25 inches (1 inch = 1440 twips)
                right: 360,  // 0.25 inches
                bottom: 360, // 0.25 inches
                left: 360,   // 0.25 inches
              },
              pageNumbers: {
                start: 1,
                formatType: 'decimal',
              },
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
            },
          },
          children: [headerParagraph, table],
        },
      ],
    });
    console.log('🔵 [Generator] Document object created');

    // Generate buffer
    console.log('🔵 [Generator] Packing document to buffer...');
    const buffer = await Packer.toBuffer(doc);
    console.log(`🔵 [Generator] Document packed successfully (${buffer.length} bytes)`);

    return buffer;
  } catch (error) {
    console.error('🔴 [Generator] Error during generation:', error);
    console.error('🔴 [Generator] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack',
      name: error instanceof Error ? error.name : 'Unknown',
    });
    throw error;
  }
}

/**
 * Generate filename for HLP document
 *
 * Format: "[SchoolName]_[Subject]_HLP.docx"
 * Removes spaces and special characters for safe filenames
 */
export function generateFilename(data: DOCXGenerationData): string {
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '');

  const schoolName = sanitize(data.hlp.school_name);
  const subject = sanitize(data.hlp.subject);

  return `${schoolName}_${subject}_HLP.docx`;
}
