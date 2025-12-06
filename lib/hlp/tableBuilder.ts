/**
 * Horizontal Lesson Plan - Table Builder
 *
 * Builds the HLP table programmatically using the docx library
 * New consolidated format: one cell per module/session with all content stacked vertically
 */

import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  AlignmentType,
  VerticalAlign,
  WidthType,
  HeightRule,
  BorderStyle,
  ShadingType,
} from 'docx';
import { ModuleWithData, DOCX_CONSTANTS, TemplateSession } from './types';
import { ExportOptions } from './generator';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format text consistently
 * 1. Return "N/A" if text is null or empty
 * 2. Split by semicolons (;)
 * 3. Capitalize first letter of each part
 * 4. Rejoin with "; "
 */
export function formatTextConsistently(text: string | null): string {
  if (!text || text.trim() === '') {
    return 'N/A';
  }

  const parts = text.split(';');
  const capitalizedParts = parts.map(part => {
    const trimmed = part.trim();
    if (trimmed.length === 0) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  });

  return capitalizedParts.filter(p => p.length > 0).join('; ');
}

/**
 * Format enrichments as numbered list with double line breaks
 * Format: "1. Title: Description\n\n2. Title: Description"
 */
export function formatEnrichments(enrichments: any[]): string {
  if (!enrichments || enrichments.length === 0) {
    return 'N/A';
  }

  return enrichments
    .map((e, index) => `${index + 1}. ${e.title}: ${e.description}`)
    .join('\n\n');
}

/**
 * Convert inches to DXA units (1 inch = 1440 DXA)
 */
function inchesToDxa(inches: number): number {
  return Math.round(inches * 1440);
}

/**
 * Convert inches to Twips (1 inch = 1440 twips)
 */
function inchesToTwips(inches: number): number {
  return Math.round(inches * 1440);
}

/**
 * Format objectives as separate lines
 * Splits by bullet character (•) since data already contains bullets
 */
function formatObjectivesAsLines(text: string | null): string[] {
  if (!text || text.trim() === '') {
    return [];
  }

  // Split by bullet character
  const parts = text.split('•');
  return parts
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => `• ${part}`); // Re-add bullet to each line
}

/**
 * Format PBA as separate lines
 * Splits at numbered items (1. 2. 3. etc.)
 */
function formatPBAAsLines(text: string | null): string[] {
  if (!text || text.trim() === '' || text === 'N/A') {
    return ['N/A'];
  }

  // Split before each number followed by a period (e.g., "1.", "2.", "3.")
  // Use regex to split while keeping the delimiter
  const parts = text.split(/(?=\d+\.\s)/);
  return parts
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

// ============================================
// CELL CREATION FUNCTIONS
// ============================================

/**
 * Create main header cell (merged, dark blue background)
 */
function createMainHeaderCell(columnCount: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'HORIZONTAL LESSON PLAN',
            font: DOCX_CONSTANTS.FONTS.HEADER,
            size: 14 * 2, // 14pt (docx uses half-points)
            bold: false,
            color: DOCX_CONSTANTS.COLORS.WHITE_TEXT,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    columnSpan: columnCount,
    shading: {
      type: ShadingType.CLEAR,
      fill: DOCX_CONSTANTS.COLORS.DARK_BLUE,
      color: DOCX_CONSTANTS.COLORS.DARK_BLUE,
    },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.TOP),
      bottom: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.BOTTOM),
      left: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.LEFT),
      right: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.RIGHT),
    },
  });
}

/**
 * Create module header cell (module name + session number, light blue background)
 */
function createModuleHeaderCell(moduleName: string, sessionNumber: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `${moduleName}: Session ${sessionNumber}`,
            font: DOCX_CONSTANTS.FONTS.HEADER,
            size: DOCX_CONSTANTS.FONT_SIZES.SESSION_HEADER * 2,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: 'DAE9F7',
      color: 'DAE9F7',
    },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.TOP),
      bottom: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.BOTTOM),
      left: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.LEFT),
      right: inchesToTwips(DOCX_CONSTANTS.CELL_MARGINS.RIGHT),
    },
  });
}

/**
 * Create consolidated session data cell with alternating background
 * Contains: Topic header (bold), bullet objectives, Materials:, Prep:, PBA:
 */
function createConsolidatedSessionCell(
  session: TemplateSession | undefined,
  options: {
    includeFocus: boolean;
    includeGoals: boolean;
    includeMaterials: boolean;
    includeTeacherPrep: boolean;
    includePBA: boolean;
  },
  columnIndex: number
): TableCell {
  // Alternating background: odd columns (0, 2, 4...) get F2F2F2, even columns (1, 3, 5...) get white
  const bgColor = columnIndex % 2 === 0 ? 'F2F2F2' : DOCX_CONSTANTS.COLORS.WHITE_BG;
  const paragraphs: Paragraph[] = [];

  // 1. Focus/Topic as bold header with colon
  if (options.includeFocus) {
    const focusText = session?.focus || 'N/A';
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${focusText}:`,
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
            bold: true,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 60 },
      })
    );
  }

  // 2. Goals/Objectives as bullet points
  if (options.includeGoals) {
    const objectives = formatObjectivesAsLines(session?.objectives || null);
    if (objectives.length > 0) {
      objectives.forEach((objective, index) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: objective,
                font: DOCX_CONSTANTS.FONTS.DATA,
                size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
              }),
            ],
            alignment: AlignmentType.LEFT,
            // Add extra spacing after last objective
            spacing: { after: index === objectives.length - 1 ? 120 : 20 },
          })
        );
      });
    }
  }

  // 3. Materials with bold label
  if (options.includeMaterials) {
    const materialsText = formatTextConsistently(session?.materials || null);
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Materials: ',
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
            bold: true,
          }),
          new TextRun({
            text: materialsText,
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
      })
    );
  }

  // 4. Teacher Prep with bold label
  if (options.includeTeacherPrep) {
    const prepText = formatTextConsistently(session?.teacher_prep || null);
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Prep: ',
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
            bold: true,
          }),
          new TextRun({
            text: prepText,
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
      })
    );
  }

  // 5. PBA with bold label - each numbered item on its own line
  if (options.includePBA) {
    const pbaLines = formatPBAAsLines(session?.assessments || null);

    // First line includes the "PBA:" label
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PBA: ',
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
            bold: true,
          }),
          new TextRun({
            text: pbaLines[0] || 'N/A',
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 20 },
      })
    );

    // Remaining lines as separate paragraphs
    for (let i = 1; i < pbaLines.length; i++) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: pbaLines[i],
              font: DOCX_CONSTANTS.FONTS.DATA,
              size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 20 },
        })
      );
    }
  }

  // If no paragraphs were added, add a placeholder
  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'N/A',
            font: DOCX_CONSTANTS.FONTS.DATA,
            size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
          }),
        ],
        alignment: AlignmentType.LEFT,
      })
    );
  }

  return new TableCell({
    children: paragraphs,
    shading: {
      type: ShadingType.CLEAR,
      fill: bgColor,
      color: bgColor,
    },
    verticalAlign: VerticalAlign.TOP,
    margins: {
      top: inchesToTwips(0.05),
      bottom: inchesToTwips(0.05),
      left: inchesToTwips(0.08),
      right: inchesToTwips(0.08),
    },
  });
}

// ============================================
// ROW CREATION FUNCTIONS
// ============================================

/**
 * Create main header row (row 0)
 */
function createMainHeaderRow(columnCount: number): TableRow {
  return new TableRow({
    children: [createMainHeaderCell(columnCount)],
    height: {
      value: inchesToDxa(DOCX_CONSTANTS.HEADER_ROW_HEIGHT),
      rule: HeightRule.EXACT,
    },
  });
}

/**
 * Create session header row with module names
 */
function createSessionHeaderRow(modules: ModuleWithData[], sessionNumber: number): TableRow {
  const cells: TableCell[] = modules.map(module =>
    createModuleHeaderCell(module.template.module_name, sessionNumber)
  );

  return new TableRow({ children: cells });
}

/**
 * Create consolidated session data row
 * Each cell contains all session content for that module
 */
function createConsolidatedSessionRow(
  modules: ModuleWithData[],
  sessionNumber: number,
  options: {
    includeFocus: boolean;
    includeGoals: boolean;
    includeMaterials: boolean;
    includeTeacherPrep: boolean;
    includePBA: boolean;
  }
): TableRow {
  const cells: TableCell[] = modules.map((module, columnIndex) => {
    const session = module.sessions.find(s => s.session_number === sessionNumber);
    return createConsolidatedSessionCell(session, options, columnIndex);
  });

  return new TableRow({ children: cells });
}

// ============================================
// MAIN TABLE BUILDER
// ============================================

/**
 * Build complete HLP table with consolidated format
 *
 * New Structure:
 * - Row 0: Main header (merged across all columns)
 * - For each session (1-7):
 *   - Header row: Module names with session number (grey background)
 *   - Data row: Consolidated content for each module (white background)
 *
 * No more label column - all content is self-contained in each cell
 */
export function buildHLPTable(modules: ModuleWithData[], exportOptions: ExportOptions = {}): Table {
  console.log('🟢 [TableBuilder] Building HLP table with consolidated format...');

  // Default all options to true for backward compatibility
  const options = {
    includeFocus: exportOptions.includeFocus !== false,
    includeGoals: exportOptions.includeGoals !== false,
    includeMaterials: exportOptions.includeMaterials !== false,
    includeTeacherPrep: exportOptions.includeTeacherPrep !== false,
    includePBA: exportOptions.includePBA !== false,
    includeEnrichments: exportOptions.includeEnrichments !== false,
  };

  const columnCount = modules.length; // No label column anymore
  const rows: TableRow[] = [];

  // Row 0: Main header (always included)
  console.log('🟢 [TableBuilder] Creating main header row...');
  rows.push(createMainHeaderRow(columnCount));

  // Create rows for each session
  for (let sessionNum = 1; sessionNum <= DOCX_CONSTANTS.SESSIONS_PER_MODULE; sessionNum++) {
    console.log(`🟢 [TableBuilder] Creating rows for session ${sessionNum}...`);

    // Session header row (module names)
    rows.push(createSessionHeaderRow(modules, sessionNum));

    // Consolidated data row
    rows.push(createConsolidatedSessionRow(modules, sessionNum, options));
  }

  console.log('🟢 [TableBuilder] All rows created successfully, building Table object...');

  // Calculate equal percentage width for each column
  const columnWidthPercent = Math.floor(100 / modules.length);

  // Create table with equal column widths using percentages
  const table = new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: modules.map(() => columnWidthPercent * 50), // Convert to fifths of a percent (docx format)
    alignment: AlignmentType.CENTER,
    layout: 'fixed' as any, // Fixed table layout ensures equal column widths
    // Table Grid style with borders
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    },
  });

  console.log('🟢 [TableBuilder] Table built successfully!');
  return table;
}
