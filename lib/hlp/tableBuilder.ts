/**
 * Horizontal Lesson Plan - Table Builder
 *
 * Builds the 45-row table programmatically using the docx library
 * Matches exact formatting from Flask implementation
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
import { ModuleWithData, DOCX_CONSTANTS, TABLE_LABELS } from './types';
import { ExportOptions } from './generator';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format text consistently per Flask implementation
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
            size: DOCX_CONSTANTS.FONT_SIZES.MAIN_HEADER * 2, // docx uses half-points
            bold: true,
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
 * Create label cell (column 0, grey background)
 * Handles line breaks (\n) by converting them to proper Word line breaks
 */
function createLabelCell(text: string): TableCell {
  // Split text by newlines and create TextRun objects with breaks
  const textParts = text.split('\n');
  const children: (TextRun)[] = [];

  textParts.forEach((part, index) => {
    // Add the text part with break before it (except for first part)
    const runOptions: any = {
      text: part,
      font: DOCX_CONSTANTS.FONTS.HEADER,
      size: DOCX_CONSTANTS.FONT_SIZES.LABEL * 2,
      bold: true,
    };

    // Only add break property if we need it (not on first line)
    if (index > 0) {
      runOptions.break = 1;
    }

    children.push(new TextRun(runOptions));
  });

  return new TableCell({
    children: [
      new Paragraph({
        children: children,
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: DOCX_CONSTANTS.COLORS.LIGHT_GREY,
      color: DOCX_CONSTANTS.COLORS.LIGHT_GREY,
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
 * Create session header cell (module name + session number, grey background)
 * Handles line breaks (\n) by converting them to proper Word line breaks
 */
function createSessionHeaderCell(moduleName: string, sessionNumber: number): TableCell {
  const text = `${moduleName}:\nSession ${sessionNumber}`;

  // Split text by newlines and create TextRun objects with breaks
  const textParts = text.split('\n');
  const children: (TextRun)[] = [];

  textParts.forEach((part, index) => {
    // Add the text part with break before it (except for first part)
    const runOptions: any = {
      text: part,
      font: DOCX_CONSTANTS.FONTS.HEADER,
      size: DOCX_CONSTANTS.FONT_SIZES.SESSION_HEADER * 2,
      bold: true,
    };

    // Only add break property if we need it (not on first line)
    if (index > 0) {
      runOptions.break = 1;
    }

    children.push(new TextRun(runOptions));
  });

  return new TableCell({
    children: [
      new Paragraph({
        children: children,
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: DOCX_CONSTANTS.COLORS.LIGHT_GREY,
      color: DOCX_CONSTANTS.COLORS.LIGHT_GREY,
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
 * Create enrichment header cell (module name + "Enrichments", grey background)
 * Handles line breaks (\n) by converting them to proper Word line breaks
 */
function createEnrichmentHeaderCell(moduleName: string): TableCell {
  const text = `${moduleName}:\nEnrichments`;

  // Split text by newlines and create TextRun objects with breaks
  const textParts = text.split('\n');
  const children: (TextRun)[] = [];

  textParts.forEach((part, index) => {
    // Add the text part with break before it (except for first part)
    const runOptions: any = {
      text: part,
      font: DOCX_CONSTANTS.FONTS.HEADER,
      size: DOCX_CONSTANTS.FONT_SIZES.SESSION_HEADER * 2,
      bold: true,
    };

    // Only add break property if we need it (not on first line)
    if (index > 0) {
      runOptions.break = 1;
    }

    children.push(new TextRun(runOptions));
  });

  return new TableCell({
    children: [
      new Paragraph({
        children: children,
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: DOCX_CONSTANTS.COLORS.LIGHT_GREY,
      color: DOCX_CONSTANTS.COLORS.LIGHT_GREY,
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
 * Create data cell (white background, Times New Roman)
 * Handles line breaks (\n) by converting them to proper Word line breaks
 */
function createDataCell(text: string): TableCell {
  console.log('🟡 [TableBuilder] Creating data cell with text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

  // Split text by newlines and create TextRun objects with breaks
  const textParts = text.split('\n');
  console.log(`🟡 [TableBuilder] Text has ${textParts.length} parts after splitting by newline`);

  const children: (TextRun)[] = [];

  textParts.forEach((part, index) => {
    console.log(`🟡 [TableBuilder] Creating TextRun for part ${index}: "${part.substring(0, 50)}..."`);

    // Add the text part with break before it (except for first part)
    const runOptions: any = {
      text: part,
      font: DOCX_CONSTANTS.FONTS.DATA,
      size: DOCX_CONSTANTS.FONT_SIZES.DATA * 2,
    };

    // Only add break property if we need it (not on first line)
    if (index > 0) {
      runOptions.break = 1;
      console.log(`🟡 [TableBuilder] Adding break: 1 to part ${index}`);
    }

    try {
      children.push(new TextRun(runOptions));
      console.log(`🟡 [TableBuilder] Successfully created TextRun for part ${index}`);
    } catch (error) {
      console.error(`🔴 [TableBuilder] ERROR creating TextRun for part ${index}:`, error);
      console.error(`🔴 [TableBuilder] runOptions was:`, JSON.stringify(runOptions, null, 2));
      throw error;
    }
  });

  return new TableCell({
    children: [
      new Paragraph({
        children: children,
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: DOCX_CONSTANTS.COLORS.WHITE_BG,
      color: DOCX_CONSTANTS.COLORS.WHITE_BG,
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
 * Create session header row (Module:\nSection)
 */
function createSessionHeaderRow(modules: ModuleWithData[], sessionNumber: number): TableRow {
  const cells: TableCell[] = [
    createLabelCell(TABLE_LABELS.MODULE_SECTION),
    ...modules.map(module => createSessionHeaderCell(module.template.module_name, sessionNumber)),
  ];

  return new TableRow({ children: cells });
}

/**
 * Create session data row (Focus, Goals, Materials, Teacher Prep, PBA)
 */
function createSessionDataRow(
  label: string,
  modules: ModuleWithData[],
  sessionNumber: number,
  field: 'focus' | 'objectives' | 'materials' | 'teacher_prep' | 'assessments'
): TableRow {
  const cells: TableCell[] = [
    createLabelCell(label),
    ...modules.map(module => {
      const session = module.sessions.find(s => s.session_number === sessionNumber);
      const text = session?.[field] || null;
      return createDataCell(formatTextConsistently(text));
    }),
  ];

  return new TableRow({ children: cells });
}

/**
 * Create enrichment header row
 */
function createEnrichmentHeaderRow(modules: ModuleWithData[]): TableRow {
  const cells: TableCell[] = [
    createLabelCell(TABLE_LABELS.MODULE_SECTION),
    ...modules.map(module => createEnrichmentHeaderCell(module.template.module_name)),
  ];

  return new TableRow({ children: cells });
}

/**
 * Create enrichment data row
 */
function createEnrichmentDataRow(modules: ModuleWithData[]): TableRow {
  const cells: TableCell[] = [
    createLabelCell(TABLE_LABELS.ACTIVITIES),
    ...modules.map(module => {
      const formattedEnrichments = formatEnrichments(module.enrichments);
      return createDataCell(formattedEnrichments);
    }),
  ];

  return new TableRow({ children: cells });
}

// ============================================
// MAIN TABLE BUILDER
// ============================================

/**
 * Build complete HLP table (up to 45 rows, depending on export options)
 *
 * Structure:
 * - Row 0: Main header (merged) - always included
 * - Rows 1-42: 7 sessions × up to 6 rows each (conditional)
 *   - Session N header (Module:\nSection) - always included
 *   - Focus - conditional
 *   - Goals - conditional
 *   - Material List - conditional
 *   - Teacher Prep - conditional
 *   - PBA - conditional
 * - Rows 43-44: Enrichments (conditional)
 *   - Enrichment header
 *   - Activities
 */
export function buildHLPTable(modules: ModuleWithData[], exportOptions: ExportOptions = {}): Table {
  console.log('🟢 [TableBuilder] Building HLP table with export options:', exportOptions);

  // Default all options to true for backward compatibility
  const options = {
    includeFocus: exportOptions.includeFocus !== false,
    includeGoals: exportOptions.includeGoals !== false,
    includeMaterials: exportOptions.includeMaterials !== false,
    includeTeacherPrep: exportOptions.includeTeacherPrep !== false,
    includePBA: exportOptions.includePBA !== false,
    includeEnrichments: exportOptions.includeEnrichments !== false,
  };

  const columnCount = 1 + modules.length; // 1 label column + N module columns
  const rows: TableRow[] = [];

  // Row 0: Main header (always included)
  console.log('🟢 [TableBuilder] Creating main header row...');
  rows.push(createMainHeaderRow(columnCount));

  // Rows 1-42: 7 sessions × up to 6 rows each
  for (let sessionNum = 1; sessionNum <= DOCX_CONSTANTS.SESSIONS_PER_MODULE; sessionNum++) {
    console.log(`🟢 [TableBuilder] Creating rows for session ${sessionNum}...`);

    // Session header is always included
    rows.push(createSessionHeaderRow(modules, sessionNum));

    // Conditionally include each section
    if (options.includeFocus) {
      console.log(`🟢 [TableBuilder]   Creating FOCUS row for session ${sessionNum}...`);
      rows.push(createSessionDataRow(TABLE_LABELS.FOCUS, modules, sessionNum, 'focus'));
    }

    if (options.includeGoals) {
      console.log(`🟢 [TableBuilder]   Creating GOALS row for session ${sessionNum}...`);
      rows.push(createSessionDataRow(TABLE_LABELS.GOALS, modules, sessionNum, 'objectives'));
    }

    if (options.includeMaterials) {
      console.log(`🟢 [TableBuilder]   Creating MATERIALS row for session ${sessionNum}...`);
      rows.push(createSessionDataRow(TABLE_LABELS.MATERIAL_LIST, modules, sessionNum, 'materials'));
    }

    if (options.includeTeacherPrep) {
      console.log(`🟢 [TableBuilder]   Creating TEACHER PREP row for session ${sessionNum}...`);
      rows.push(createSessionDataRow(TABLE_LABELS.TEACHER_PREP, modules, sessionNum, 'teacher_prep'));
    }

    if (options.includePBA) {
      console.log(`🟢 [TableBuilder]   Creating PBA row for session ${sessionNum}...`);
      rows.push(createSessionDataRow(TABLE_LABELS.PBA, modules, sessionNum, 'assessments'));
    }
  }

  // Enrichments (conditional)
  if (options.includeEnrichments) {
    console.log('🟢 [TableBuilder] Creating enrichment header row...');
    rows.push(createEnrichmentHeaderRow(modules));

    console.log('🟢 [TableBuilder] Creating enrichment data row...');
    rows.push(createEnrichmentDataRow(modules));
  } else {
    console.log('🟢 [TableBuilder] Skipping enrichments (includeEnrichments = false)');
  }

  console.log('🟢 [TableBuilder] All rows created successfully, building Table object...');

  // Create table with proper column widths
  const table = new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.AUTO,
    },
    columnWidths: [
      inchesToDxa(DOCX_CONSTANTS.COLUMN_WIDTH_LABEL), // Label column: 1.2 inches
      ...modules.map(() => inchesToDxa(DOCX_CONSTANTS.COLUMN_WIDTH_MODULE)), // Module columns: 2.0 inches each
    ],
    alignment: AlignmentType.CENTER,
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
