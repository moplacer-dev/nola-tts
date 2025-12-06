/**
 * Horizontal Lesson Plan - DOCX Generator
 *
 * Generates complete Word documents programmatically
 * Matches exact formatting from Flask implementation
 */

import { Document, Paragraph, TextRun, Packer, AlignmentType, PageOrientation, ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, HorizontalPositionAlign, VerticalPositionAlign, TextWrappingType, TextWrappingSide } from 'docx';
import { DOCXGenerationData } from './types';
import { buildHLPTable } from './tableBuilder';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load the Star Academy logo image
 * Returns the image buffer or null if not found
 */
function loadLogoImage(): Buffer | null {
  try {
    // Try multiple possible paths for the logo
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'star-academy-logo.png'),
      path.join(process.cwd(), 'nola-ess-app', 'public', 'star-academy-logo.png'),
      '/app/public/star-academy-logo.png', // Render deployment path
    ];

    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        console.log('🔵 [Generator] Found logo at:', logoPath);
        return fs.readFileSync(logoPath);
      }
    }

    console.warn('🟡 [Generator] Logo not found at any expected path');
    return null;
  } catch (error) {
    console.error('🔴 [Generator] Error loading logo:', error);
    return null;
  }
}

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

/**
 * Create logo paragraph with the Star Academy logo positioned at top-right
 * Uses floating positioning to place logo in top-right corner
 */
function createLogoParagraph(logoBuffer: Buffer): Paragraph {
  return new Paragraph({
    children: [
      new ImageRun({
        type: 'png',
        data: logoBuffer,
        transformation: {
          width: 107, // ~1.07 inches at 100 DPI (matching screenshot)
          height: 32, // ~0.32 inches at 100 DPI (matching screenshot)
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.MARGIN,
            align: HorizontalPositionAlign.RIGHT,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PARAGRAPH,
            offset: 0,
          },
          wrap: {
            type: TextWrappingType.SQUARE,
            side: TextWrappingSide.LEFT,
          },
          margins: {
            top: 0,
            bottom: 0,
            left: 114300, // ~0.125 inch margin on left of image
            right: 0,
          },
        },
      }),
    ],
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

  // Load logo image
  console.log('🔵 [Generator] Loading logo image...');
  const logoBuffer = loadLogoImage();

  // Create document header
  console.log('🔵 [Generator] Creating header paragraph...');
  const headerParagraph = createHeaderParagraph(data);

  // Build section children array (logo + header + table)
  const sectionChildren: any[] = [];

  // Add logo paragraph if logo was loaded successfully
  if (logoBuffer) {
    console.log('🔵 [Generator] Adding logo to document...');
    sectionChildren.push(createLogoParagraph(logoBuffer));
  } else {
    console.log('🟡 [Generator] Skipping logo (not found)');
  }

  // Add header and table
  sectionChildren.push(headerParagraph);

  // Build HLP table
  console.log('🔵 [Generator] Building HLP table...');
  try {
    const table = buildHLPTable(sortedModules, exportOptions);
    console.log('🔵 [Generator] Table built successfully');

    sectionChildren.push(table);

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
          children: sectionChildren,
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
