const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess',
});

const componentTemplates = [
  // BASE CALENDAR COMPONENTS (39)
  // All base calendar events use #6B7280 (lighter gray) for consistency
  // Breaks
  {
    component_key: 'base_winter_break',
    subject: 'base',
    display_name: 'Winter Break',
    default_duration_days: 5,
    color: '#6B7280',
    description: 'Winter holiday break',
  },
  {
    component_key: 'base_spring_break',
    subject: 'base',
    display_name: 'Spring Break',
    default_duration_days: 5,
    color: '#6B7280',
    description: 'Spring break',
  },
  {
    component_key: 'base_thanksgiving_break',
    subject: 'base',
    display_name: 'Thanksgiving Break',
    default_duration_days: 3,
    color: '#6B7280',
    description: 'Thanksgiving break',
  },

  // Federal Holidays
  {
    component_key: 'base_labor_day',
    subject: 'base',
    display_name: 'Labor Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Labor Day - federal holiday',
  },
  {
    component_key: 'base_columbus_day',
    subject: 'base',
    display_name: 'Columbus Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Columbus Day - federal holiday',
  },
  {
    component_key: 'base_election_day',
    subject: 'base',
    display_name: 'Election Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Election Day',
  },
  {
    component_key: 'base_veterans_day',
    subject: 'base',
    display_name: "Veterans Day",
    default_duration_days: 1,
    color: '#6B7280',
    description: "Veterans Day - federal holiday",
  },
  {
    component_key: 'base_mlk_day',
    subject: 'base',
    display_name: 'Martin Luther King Jr. Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'MLK Day - federal holiday',
  },
  {
    component_key: 'base_presidents_day',
    subject: 'base',
    display_name: "Presidents' Day",
    default_duration_days: 1,
    color: '#6B7280',
    description: "Presidents' Day - federal holiday",
  },
  {
    component_key: 'base_memorial_day',
    subject: 'base',
    display_name: 'Memorial Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Memorial Day - federal holiday',
  },
  {
    component_key: 'base_juneteenth',
    subject: 'base',
    display_name: 'Juneteenth',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Juneteenth - federal holiday',
  },

  // Cultural Holidays
  {
    component_key: 'base_three_kings_day',
    subject: 'base',
    display_name: 'Three Kings Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Three Kings Day / Epiphany',
  },
  {
    component_key: 'base_valentines_day',
    subject: 'base',
    display_name: "Valentine's Day",
    default_duration_days: 1,
    color: '#6B7280',
    description: "Valentine's Day celebration",
  },
  {
    component_key: 'base_st_patricks_day',
    subject: 'base',
    display_name: "St. Patrick's Day",
    default_duration_days: 1,
    color: '#6B7280',
    description: "St. Patrick's Day",
  },
  {
    component_key: 'base_cinco_de_mayo',
    subject: 'base',
    display_name: 'Cinco de Mayo',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Cinco de Mayo celebration',
  },
  {
    component_key: 'base_mothers_day',
    subject: 'base',
    display_name: "Mother's Day",
    default_duration_days: 1,
    color: '#6B7280',
    description: "Mother's Day",
  },
  {
    component_key: 'base_fathers_day',
    subject: 'base',
    display_name: "Father's Day",
    default_duration_days: 1,
    color: '#6B7280',
    description: "Father's Day",
  },
  {
    component_key: 'base_mardi_gras',
    subject: 'base',
    display_name: 'Mardi Gras',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Mardi Gras celebration',
  },
  {
    component_key: 'base_halloween',
    subject: 'base',
    display_name: 'Halloween',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Halloween celebration',
  },
  {
    component_key: 'base_earth_day',
    subject: 'base',
    display_name: 'Earth Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Earth Day (April 22)',
  },

  // Heritage/Awareness Months & Events
  {
    component_key: 'base_black_history_month',
    subject: 'base',
    display_name: 'Black History Month',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Black History Month (February)',
  },
  {
    component_key: 'base_womens_history_month',
    subject: 'base',
    display_name: "Women's History Month",
    default_duration_days: 1,
    color: '#6B7280',
    description: "Women's History Month (March)",
  },
  {
    component_key: 'base_hispanic_heritage_month',
    subject: 'base',
    display_name: 'Hispanic Heritage Month',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Hispanic Heritage Month (Sept 15 - Oct 15)',
  },

  // School Events
  {
    component_key: 'base_professional_development',
    subject: 'base',
    display_name: 'Professional Development',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Staff professional development day',
  },
  {
    component_key: 'base_testing_window',
    subject: 'base',
    display_name: 'Testing Window',
    default_duration_days: 3,
    color: '#6B7280',
    description: 'District or state testing period',
  },
  {
    component_key: 'base_early_dismissal',
    subject: 'base',
    display_name: 'Early Dismissal',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Half day / early dismissal',
  },
  {
    component_key: 'base_parent_teacher_conferences',
    subject: 'base',
    display_name: 'Parent-Teacher Conferences',
    default_duration_days: 2,
    color: '#6B7280',
    description: 'Parent-teacher conference days',
  },
  {
    component_key: 'base_school_assembly',
    subject: 'base',
    display_name: 'School Assembly',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'School-wide assembly or event',
  },
  {
    component_key: 'base_field_trip',
    subject: 'base',
    display_name: 'Field Trip',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'School field trip',
  },
  {
    component_key: 'base_teacher_planning_day',
    subject: 'base',
    display_name: 'Teacher Planning Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Teacher planning/workday',
  },
  {
    component_key: 'base_report_cards',
    subject: 'base',
    display_name: 'Report Cards',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Report card distribution',
  },

  // General
  {
    component_key: 'base_no_school',
    subject: 'base',
    display_name: 'No School',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'No school day',
  },
  {
    component_key: 'base_half_day',
    subject: 'base',
    display_name: 'Half Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Half day of instruction',
  },
  {
    component_key: 'base_star_orientation',
    subject: 'base',
    display_name: 'Star Orientation',
    default_duration_days: 2,
    color: '#6B7280',
    description: 'Star orientation program',
  },
  {
    component_key: 'base_first_day_students',
    subject: 'base',
    display_name: 'First Day for Students',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'First day of school for students',
  },
  {
    component_key: 'base_first_day_staff',
    subject: 'base',
    display_name: 'First Day for Staff',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'First day for staff',
  },
  {
    component_key: 'base_teacher_inservice',
    subject: 'base',
    display_name: 'Teacher In-Service Day',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Teacher in-service day',
  },
  {
    component_key: 'base_last_day_students',
    subject: 'base',
    display_name: 'Last Day for Students',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Last day of school for students',
  },
  {
    component_key: 'base_last_day_staff',
    subject: 'base',
    display_name: 'Last Day for Staff',
    default_duration_days: 1,
    color: '#6B7280',
    description: 'Last day for staff',
  },

  // COMMON OPENING COMPONENTS (8 total - 2 per subject)
  // ELA Opening Components
  {
    component_key: 'ela_welcome_video',
    subject: 'ela',
    display_name: 'Star Academy Welcome Video',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Star Academy welcome video for beginning of year',
  },
  {
    component_key: 'ela_rules_procedures',
    subject: 'ela',
    display_name: 'Establish Rapport & Classroom Procedures',
    default_duration_days: 1,
    color: '#6366F1',
    description: 'Establish classroom rapport and procedures',
  },

  // Math Opening Components
  {
    component_key: 'math_welcome_video',
    subject: 'math',
    display_name: 'Star Academy Welcome Video',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Star Academy welcome video for beginning of year',
  },
  {
    component_key: 'math_rules_procedures',
    subject: 'math',
    display_name: 'Establish Rapport & Classroom Procedures',
    default_duration_days: 1,
    color: '#6366F1',
    description: 'Establish classroom rapport and procedures',
  },

  // Science Opening Components
  {
    component_key: 'science_welcome_video',
    subject: 'science',
    display_name: 'Star Academy Welcome Video',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Star Academy welcome video for beginning of year',
  },
  {
    component_key: 'science_rules_procedures',
    subject: 'science',
    display_name: 'Establish Rapport & Classroom Procedures',
    default_duration_days: 1,
    color: '#6366F1',
    description: 'Establish classroom rapport and procedures',
  },

  // ========================================
  // ELA COMPONENTS - LANGUAGE! LIVE (19)
  // ========================================

  // SETUP & ADMINISTRATIVE (4)
  {
    component_key: 'ela_lil_roster_students',
    subject: 'ela',
    display_name: 'L!L: Roster Students',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Administrative setup day - roster students into Language!Live online platform, create student accounts, and verify login credentials',
  },
  {
    component_key: 'ela_lil_benchmark_grouping',
    subject: 'ela',
    display_name: 'L!L: Benchmark Grouping',
    default_duration_days: 1,
    color: '#6366F1',
    description: 'Analyze BOY benchmark results and group students into Level 1 or Level 2 instruction based on PAR2, TOSCRF-2, and TWS-5 scores. Level 1 = significantly below grade level; Level 2 = approaching grade level',
  },
  {
    component_key: 'ela_lil_startup',
    subject: 'ela',
    display_name: 'L!L Startup',
    default_duration_days: 3,
    color: '#D97706',
    description: 'Language!Live program startup (Week 1 of pacing guide). Introduces students to the program structure, online components, and classroom routines. Includes avatar creation, Sight Word Game introduction, classroom procedures, and level placement confirmation',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'L!L Startup Lesson 1', duration: 1 },
        { title: 'L!L Startup Lesson 2', duration: 1 },
        { title: 'L!L Startup Lesson 3', duration: 1 },
      ],
    },
  },
  {
    component_key: 'ela_data_conference',
    subject: 'ela',
    display_name: 'Data Conference',
    default_duration_days: 1,
    color: '#0891B2',
    description: 'Teacher-directed data review session. Teacher logs into L!L dashboard to review student Word Training progress, analyze Practice Activity results, assign additional activities (Power Pass, Content Mastery), provide feedback on recordings, and monitor pacing. Typically occurs mid-unit and end-of-unit',
  },

  // CORE INSTRUCTION (3)
  {
    component_key: 'ela_language_live_unit',
    subject: 'ela',
    display_name: 'Language! Live Unit (Lessons 1-10, 2 Days)',
    default_duration_days: 22,
    color: '#DC2626',
    description: 'Complete L!L unit: 10 lessons (2 days each) + 2 data conferences = 22 days total. Each lesson includes Text Training (teacher-directed, 45 min) and Word Training (online, 45 min).\n\n90-Min Model: Level 1 students do TT while Level 2 does WT, then rotate.\n\nSub-components show rotation pattern',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'L!L Unit #, L1\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L1\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #, L2\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L2\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #\nLevel 1: WT\nLevel 2: WT\nData Conference', duration: 1 },
        { title: 'L!L Unit #, L3\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L3\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #, L4\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L4\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #, L5\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L5\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #\nLevel 1: WT\nLevel 2: WT\nData Conference', duration: 1 },
        { title: 'L!L Unit #, L6\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L6\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #, L7\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L7\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #, L8\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L8\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #, L9\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L9\nLevel 1: WT\nLevel 2: TT', duration: 1 },
        { title: 'L!L Unit #, L10\nLevel 1: TT\nLevel 2: WT', duration: 1 },
        { title: 'L!L Unit #, L10\nLevel 1: WT\nLevel 2: TT', duration: 1 },
      ],
    },
  },
  {
    component_key: 'ela_language_live_unit_single',
    subject: 'ela',
    display_name: 'Language! Live Unit (Lessons 1-10, Single Day)',
    default_duration_days: 10,
    color: '#EF4444',
    description: 'Complete L!L unit: 10 lessons (1 day each). Both levels complete Text Training (teacher-directed) AND Word Training (online) in the same day. Use for accelerated pacing, single-level classrooms, or 90-min blocks where both components can be completed daily',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'L!L Unit #, L1\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L2\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L3\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L4\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L5\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L6\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L7\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L8\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L9\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
        { title: 'L!L Unit #, L10\nLevel 1: TT & WT\nLevel 2: WT & TT', duration: 1 },
      ],
    },
  },
  {
    component_key: 'ela_tt_ww_block',
    subject: 'ela',
    display_name: 'L!L Unit #, Lesson #',
    default_duration_days: 1,
    color: '#F97316',
    description: 'Language!Live Text Training and Word Work lesson (single day). Flexible component for makeup lessons, custom pacing, or scheduling individual lessons',
  },

  // SUPPORT & ENRICHMENT (3)
  {
    component_key: 'ela_lil_makeup',
    subject: 'ela',
    display_name: 'L!L Make-Up',
    default_duration_days: 1,
    color: '#F59E0B',
    description: 'Language!Live make-up session for missed instruction',
  },
  {
    component_key: 'ela_lil_readingscape',
    subject: 'ela',
    display_name: 'L!L ReadingScape',
    default_duration_days: 1,
    color: '#FBBF24',
    description: 'Language!Live ReadingScape session - online wide reading opportunities for independent practice and fluency building',
  },
  {
    component_key: 'ela_flex_day',
    subject: 'ela',
    display_name: 'Flex Day',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Flexible ELA instruction day - use for review, reteaching, enrichment, or catching up on pacing',
  },

  // WRITING PROJECTS (1)
  {
    component_key: 'ela_lil_writing_project',
    subject: 'ela',
    display_name: 'L!L Writing Project',
    default_duration_days: 5,
    color: '#EA580C',
    description: 'Language!Live Writing Project (5-10 lessons). Can be taught at end of unit, during the 3-week unit, or as scheduled.\n\nLevel 1: Basic Paragraph, Shared Scientific Research, Problem and Solution, Firsthand and Secondhand Accounts, Compare and Contrast Fairy Tales, Thematic Literature, Argument, Career Documents\n\nLevel 2: Informational, Cause and Effect, Narrative, Argument, Compare and Contrast (Thematic Literature), Compare and Contrast (Fiction and Nonfiction), Literary Analysis, Career Documents',
  },

  // BENCHMARK ASSESSMENTS (3)
  {
    component_key: 'ela_lil_boy_benchmark',
    subject: 'ela',
    display_name: 'BOY Benchmark:\nPAR2, TOSCRF-2, TWS-5',
    default_duration_days: 1,
    color: '#22C55E',
    description: 'Beginning-of-Year comprehensive benchmark (Benchmark 1). Includes: Grade-Level PAR2 (Paragraph Analysis & Reading), TOSCRF-2 (Test of Silent Contextual Reading Fluency), and TWS-5 (Test of Written Spelling). Used for initial level placement (Level 1 vs Level 2)',
  },
  {
    component_key: 'ela_lil_moy_benchmark',
    subject: 'ela',
    display_name: 'MOY Benchmark:\nPAR2, TOSCRF-2, TWS-5',
    default_duration_days: 1,
    color: '#84CC16',
    description: 'Mid-of-Year comprehensive benchmark (Benchmark 2). Includes: Grade-Level PAR2 (Paragraph Analysis & Reading), TOSCRF-2 (Test of Silent Contextual Reading Fluency), and TWS-5 (Test of Written Spelling). Administered mid-year to track progress',
  },
  {
    component_key: 'ela_lil_eoy_benchmark',
    subject: 'ela',
    display_name: 'EOY Benchmark:\nPAR2, TOSCRF-2, TWS-5',
    default_duration_days: 1,
    color: '#65A30D',
    description: 'End-of-Year comprehensive benchmark (Benchmark 3). Includes: Grade-Level PAR2 (Paragraph Analysis & Reading), TOSCRF-2 (Test of Silent Contextual Reading Fluency), and TWS-5 (Test of Written Spelling). Final assessment to measure year-long growth',
  },

  // UNIT ASSESSMENTS (2)
  {
    component_key: 'ela_lil_unit_pretest',
    subject: 'ela',
    display_name: 'L!L Unit Pre-Test',
    default_duration_days: 1,
    color: '#10B981',
    description: 'Unit Pre-Test administered before beginning a new unit to establish baseline knowledge. Optional but recommended for data-driven instruction',
  },
  {
    component_key: 'ela_lil_unit_formative',
    subject: 'ela',
    display_name: 'L!L Unit Post-Test/Formative',
    default_duration_days: 1,
    color: '#059669',
    description: 'Unit Formative Assessment - REQUIRED at the end of each unit. Tests comprehension, vocabulary, grammar, and writing skills covered in the unit. Students must complete this to progress to the next unit',
  },

  // STANDALONE ASSESSMENT COMPONENTS (3)
  {
    component_key: 'ela_par_assessment',
    subject: 'ela',
    display_name: 'PAR Assessment',
    default_duration_days: 1,
    color: '#22C55E',
    description: 'Paragraph Analysis & Reading assessment (standalone). Note: This is included in BOY/MOY/EOY Benchmarks; use this component only when administering PAR separately',
  },
  {
    component_key: 'ela_toscrf2',
    subject: 'ela',
    display_name: 'TOSCRF-2',
    default_duration_days: 1,
    color: '#10B981',
    description: 'Test of Silent Contextual Reading Fluency (standalone). Note: This is included in BOY/MOY/EOY Benchmarks; use this component only when administering TOSCRF-2 separately',
  },
  {
    component_key: 'ela_tws5',
    subject: 'ela',
    display_name: 'TWS-5',
    default_duration_days: 1,
    color: '#059669',
    description: 'Test of Written Spelling - 5th Edition (standalone). Note: This is included in BOY/MOY/EOY Benchmarks; use this component only when administering TWS-5 separately',
  },

  // OPTIONAL TOOLS (2)
  {
    component_key: 'ela_lil_assign_practice',
    subject: 'ela',
    display_name: 'L!L: Assign Practice Activities',
    default_duration_days: 1,
    color: '#0891B2',
    description: 'Teacher assigns online Practice Activities. Options include Vocabulary Practice, Text Training activities, Power Pass (remedial), and Content Mastery (grade-level reinforcement). Use this component to schedule dedicated time for assigning differentiated practice',
  },
  {
    component_key: 'ela_state_testing_prep',
    subject: 'ela',
    display_name: 'State Testing Prep',
    default_duration_days: 1,
    color: '#3B82F6',
    description: 'State assessment preparation (LEAP, STAAR, etc.). Use for test-taking strategies, practice tests, or focused review before state testing windows',
  },

  // MATH COMPONENTS (47 - includes 2 common opening)
  {
    component_key: 'math_ipl_orientation',
    subject: 'math',
    display_name: 'IPL Orientation',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'IPL program orientation for beginning of year',
  },
  {
    component_key: 'math_ipl_whole_class',
    subject: 'math',
    display_name: 'IPL Whole Class',
    default_duration_days: 2,
    color: '#3B82F6',
    description: 'Two-day IPL whole class instruction',
  },
  {
    component_key: 'math_steps_placement',
    subject: 'math',
    display_name: 'STEPS Placement Assessment',
    default_duration_days: 1,
    color: '#10B981',
    description: 'STEPS placement assessment',
  },
  {
    component_key: 'math_early_finishers_ipl',
    subject: 'math',
    display_name: 'Early Finishers IPLs',
    default_duration_days: 1,
    color: '#F59E0B',
    description: 'Early finishers IPL activities',
  },
  {
    component_key: 'math_benchmark',
    subject: 'math',
    display_name: 'Benchmark',
    default_duration_days: 2,
    color: '#EF4444',
    description: 'Math benchmark assessment',
  },
  {
    component_key: 'math_flex_day',
    subject: 'math',
    display_name: 'Flex Day',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Flexible math instruction day',
  },
  {
    component_key: 'math_ipl_equations',
    subject: 'math',
    display_name: 'IPL: Equations',
    default_duration_days: 5,
    color: '#EF4444',
    description: 'Five-day IPL Equations unit - creates lessons 1-8 plus culminating activity',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Equations\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Equations\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Equations\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Equations\nL7-L8 & STEPS', duration: 1 },
        { title: 'IPL: Equations\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_properties',
    subject: 'math',
    display_name: 'IPL: Properties of Real Numbers',
    default_duration_days: 5,
    color: '#F97316',
    description: 'Five-day IPL Properties of Real Numbers unit - creates lessons 1-7 plus culminating activity',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Properties of Real Numbers\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Properties of Real Numbers\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Properties of Real Numbers\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Properties of Real Numbers\nL7 & STEPS', duration: 1 },
        { title: 'IPL: Properties of Real Numbers\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_linear',
    subject: 'math',
    display_name: 'IPL: Linear Equations & Graphing',
    default_duration_days: 5,
    color: '#F59E0B',
    description: 'Five-day IPL Linear Equations & Graphing unit - creates lessons 1-7 plus culminating activity',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Linear Equations & Graphing\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Linear Equations & Graphing\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Linear Equations & Graphing\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Linear Equations & Graphing\nL7 & STEPS', duration: 1 },
        { title: 'IPL: Linear Equations & Graphing\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_exponents',
    subject: 'math',
    display_name: 'IPL: Exponents',
    default_duration_days: 3,
    color: '#EAB308',
    description: 'Three-day IPL Exponents unit',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Exponents\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Exponents\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Exponents\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_fractions1',
    subject: 'math',
    display_name: 'IPL: Operations w/ Fractions I',
    default_duration_days: 6,
    color: '#84CC16',
    description: 'Six-day IPL Operations with Fractions I unit',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Operations w/ Fractions I\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions I\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions I\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions I\nL7-L8 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions I\nL9 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions I\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_special_equations',
    subject: 'math',
    display_name: 'IPL: Special Equations',
    default_duration_days: 3,
    color: '#22C55E',
    description: 'Three-day IPL Special Equations unit',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Special Equations\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Special Equations\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Special Equations\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_units',
    subject: 'math',
    display_name: 'IPL: Units',
    default_duration_days: 3,
    color: '#10B981',
    description: 'Three-day IPL Units unit',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Units\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Units\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Units\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_systems',
    subject: 'math',
    display_name: 'IPL: Systems of Equations',
    default_duration_days: 3,
    color: '#14B8A6',
    description: 'Three-day IPL Systems of Equations unit',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Systems of Equations\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Systems of Equations\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Systems of Equations\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_functions',
    subject: 'math',
    display_name: 'IPL: Functions',
    default_duration_days: 3,
    color: '#06B6D4',
    description: 'Three-day IPL Functions unit',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Functions\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Functions\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Functions\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_integers',
    subject: 'math',
    display_name: 'IPL: Integers',
    default_duration_days: 4,
    color: '#0EA5E9',
    description: 'Four-day IPL Integers unit (6 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Integers\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Integers\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Integers\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Integers\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_intro_decimals',
    subject: 'math',
    display_name: 'IPL: Intro to Decimals',
    default_duration_days: 3,
    color: '#3B82F6',
    description: 'Three-day IPL Intro to Decimals unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Intro to Decimals\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Intro to Decimals\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Intro to Decimals\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_decimal_operations',
    subject: 'math',
    display_name: 'IPL: Decimal Operations',
    default_duration_days: 3,
    color: '#6366F1',
    description: 'Three-day IPL Decimal Operations unit (4 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Decimal Operations\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Decimal Operations\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Decimal Operations\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_intro_fractions',
    subject: 'math',
    display_name: 'IPL: Intro to Fractions',
    default_duration_days: 5,
    color: '#8B5CF6',
    description: 'Five-day IPL Intro to Fractions unit (7 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Intro to Fractions\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Intro to Fractions\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Intro to Fractions\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Intro to Fractions\nL7 & STEPS', duration: 1 },
        { title: 'IPL: Intro to Fractions\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_fractions2',
    subject: 'math',
    display_name: 'IPL: Operations w/ Fractions II',
    default_duration_days: 4,
    color: '#A855F7',
    description: 'Four-day IPL Operations with Fractions II unit (5 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Operations w/ Fractions II\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions II\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions II\nL5 & STEPS', duration: 1 },
        { title: 'IPL: Operations w/ Fractions II\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_real_number_system',
    subject: 'math',
    display_name: 'IPL: Real Number System',
    default_duration_days: 4,
    color: '#C084FC',
    description: 'Four-day IPL Real Number System unit (6 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Real Number System\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Real Number System\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Real Number System\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Real Number System\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_ratios_percents',
    subject: 'math',
    display_name: 'IPL: Ratios & Percents',
    default_duration_days: 4,
    color: '#D946EF',
    description: 'Four-day IPL Ratios & Percents unit (6 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Ratios & Percents\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Ratios & Percents\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Ratios & Percents\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Ratios & Percents\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_transformations',
    subject: 'math',
    display_name: 'IPL: Transformations',
    default_duration_days: 4,
    color: '#EC4899',
    description: 'Four-day IPL Transformations unit (5 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Transformations\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Transformations\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Transformations\nL5 & STEPS', duration: 1 },
        { title: 'IPL: Transformations\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_angles',
    subject: 'math',
    display_name: 'IPL: Angles',
    default_duration_days: 4,
    color: '#F43F5E',
    description: 'Four-day IPL Angles unit (5 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Angles\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Angles\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Angles\nL5 & STEPS', duration: 1 },
        { title: 'IPL: Angles\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_angle_relationships',
    subject: 'math',
    display_name: 'IPL: Angle Relationships',
    default_duration_days: 3,
    color: '#FB7185',
    description: 'Three-day IPL Angle Relationships unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Angle Relationships\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Angle Relationships\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Angle Relationships\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_triangles',
    subject: 'math',
    display_name: 'IPL: Triangles',
    default_duration_days: 5,
    color: '#FCA5A5',
    description: 'Five-day IPL Triangles unit (7 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Triangles\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Triangles\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Triangles\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Triangles\nL7 & STEPS', duration: 1 },
        { title: 'IPL: Triangles\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_polygons',
    subject: 'math',
    display_name: 'IPL: Polygons',
    default_duration_days: 6,
    color: '#FCD34D',
    description: 'Six-day IPL Polygons unit (9 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Polygons\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Polygons\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Polygons\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Polygons\nL7-L8 & STEPS', duration: 1 },
        { title: 'IPL: Polygons\nL9 & STEPS', duration: 1 },
        { title: 'IPL: Polygons\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_circles',
    subject: 'math',
    display_name: 'IPL: Circles',
    default_duration_days: 4,
    color: '#FDE047',
    description: 'Four-day IPL Circles unit (5 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Circles\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Circles\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Circles\nL5 & STEPS', duration: 1 },
        { title: 'IPL: Circles\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_prisms_pyramids',
    subject: 'math',
    display_name: 'IPL: Prisms and Pyramids',
    default_duration_days: 5,
    color: '#A3E635',
    description: 'Five-day IPL Prisms and Pyramids unit (7 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Prisms and Pyramids\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Prisms and Pyramids\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Prisms and Pyramids\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Prisms and Pyramids\nL7 & STEPS', duration: 1 },
        { title: 'IPL: Prisms and Pyramids\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_inequalities',
    subject: 'math',
    display_name: 'IPL: Inequalities',
    default_duration_days: 4,
    color: '#4ADE80',
    description: 'Four-day IPL Inequalities unit (5 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Inequalities\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Inequalities\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Inequalities\nL5 & STEPS', duration: 1 },
        { title: 'IPL: Inequalities\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_absolute_value',
    subject: 'math',
    display_name: 'IPL: Absolute Value',
    default_duration_days: 3,
    color: '#34D399',
    description: 'Three-day IPL Absolute Value unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Absolute Value\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Absolute Value\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Absolute Value\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_radicals',
    subject: 'math',
    display_name: 'IPL: Radicals',
    default_duration_days: 4,
    color: '#2DD4BF',
    description: 'Four-day IPL Radicals unit (5 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Radicals\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Radicals\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Radicals\nL5 & STEPS', duration: 1 },
        { title: 'IPL: Radicals\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_matrices',
    subject: 'math',
    display_name: 'IPL: Matrices',
    default_duration_days: 3,
    color: '#22D3EE',
    description: 'Three-day IPL Matrices unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Matrices\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Matrices\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Matrices\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_polynomials',
    subject: 'math',
    display_name: 'IPL: Polynomials',
    default_duration_days: 4,
    color: '#38BDF8',
    description: 'Four-day IPL Polynomials unit (6 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Polynomials\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Polynomials\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Polynomials\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Polynomials\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_quadratics',
    subject: 'math',
    display_name: 'IPL: Quadratics',
    default_duration_days: 4,
    color: '#60A5FA',
    description: 'Four-day IPL Quadratics unit (5 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Quadratics\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Quadratics\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Quadratics\nL5 & STEPS', duration: 1 },
        { title: 'IPL: Quadratics\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_factoring',
    subject: 'math',
    display_name: 'IPL: Factoring',
    default_duration_days: 4,
    color: '#818CF8',
    description: 'Four-day IPL Factoring unit (6 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Factoring\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Factoring\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Factoring\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Factoring\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_exponential_equations',
    subject: 'math',
    display_name: 'IPL: Exponential Equations',
    default_duration_days: 3,
    color: '#A78BFA',
    description: 'Three-day IPL Exponential Equations unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Exponential Equations\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Exponential Equations\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Exponential Equations\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_sets',
    subject: 'math',
    display_name: 'IPL: Sets',
    default_duration_days: 3,
    color: '#C4B5FD',
    description: 'Three-day IPL Sets unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Sets\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Sets\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Sets\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_data_graphs1',
    subject: 'math',
    display_name: 'IPL: Data Graphs I',
    default_duration_days: 4,
    color: '#E879F9',
    description: 'Four-day IPL Data Graphs I unit (6 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Data Graphs I\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Data Graphs I\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Data Graphs I\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Data Graphs I\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_data_graphs2',
    subject: 'math',
    display_name: 'IPL: Data Graphs II',
    default_duration_days: 3,
    color: '#F0ABFC',
    description: 'Three-day IPL Data Graphs II unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Data Graphs II\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Data Graphs II\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Data Graphs II\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_logic_sequence',
    subject: 'math',
    display_name: 'IPL: Logic and Sequence',
    default_duration_days: 3,
    color: '#F9A8D4',
    description: 'Three-day IPL Logic and Sequence unit (4 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Logic and Sequence\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Logic and Sequence\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Logic and Sequence\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_probability',
    subject: 'math',
    display_name: 'IPL: Probability',
    default_duration_days: 4,
    color: '#FBB6CE',
    description: 'Four-day IPL Probability unit (6 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Probability\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Probability\nL3-L4 & STEPS', duration: 1 },
        { title: 'IPL: Probability\nL5-L6 & STEPS', duration: 1 },
        { title: 'IPL: Probability\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_accuracy',
    subject: 'math',
    display_name: 'IPL: Accuracy',
    default_duration_days: 3,
    color: '#FBBF24',
    description: 'Three-day IPL Accuracy unit (3 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Accuracy\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Accuracy\nL3 & STEPS', duration: 1 },
        { title: 'IPL: Accuracy\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_graphing_calculators',
    subject: 'math',
    display_name: 'IPL: Graphing Calculators',
    default_duration_days: 2,
    color: '#FDE68A',
    description: 'Two-day IPL Graphing Calculators unit (2 lessons)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Graphing Calculators\nL1-L2 & STEPS', duration: 1 },
        { title: 'IPL: Graphing Calculators\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_ipl_calculators',
    subject: 'math',
    display_name: 'IPL: Calculators',
    default_duration_days: 2,
    color: '#BEF264',
    description: 'Two-day IPL Calculators unit (1 lesson)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'IPL: Calculators\nL1 & STEPS', duration: 1 },
        { title: 'IPL: Calculators\nCulminating Activity', duration: 1 },
      ],
    },
  },
  {
    component_key: 'math_module_rotation',
    subject: 'math',
    display_name: 'Module Rotation',
    default_duration_days: 10,
    color: '#86EFAC',
    description: 'Ten-day module rotation - creates sessions R#, S1-S7 with diagnostic days',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'R#, S1', duration: 1 },
        { title: 'R#, S2', duration: 1 },
        { title: 'R#, S3', duration: 1 },
        { title: 'R#, S4', duration: 1 },
        { title: 'Diagnostic Day 1', duration: 1 },
        { title: 'R#, S5', duration: 1 },
        { title: 'R#, S6', duration: 1 },
        { title: 'R#, S7', duration: 1 },
        { title: 'Diagnostic Day 2', duration: 1 },
        { title: 'Pear Assessment / Diagnostic Day', duration: 1 },
      ],
    },
  },

  // SCIENCE COMPONENTS (10 - includes 2 common opening)
  {
    component_key: 'science_benchmark',
    subject: 'science',
    display_name: 'Benchmark',
    default_duration_days: 2,
    color: '#10B981',
    description: 'Science benchmark assessment',
  },
  {
    component_key: 'science_blended_science',
    subject: 'science',
    display_name: 'Blended Science #',
    default_duration_days: 4,
    color: '#8B5CF6',
    description: 'Four-day blended science instruction',
  },
  {
    component_key: 'science_module_orientation',
    subject: 'science',
    display_name: 'Module Orientation',
    default_duration_days: 3,
    color: '#14B8A6',
    description: 'Three-day module orientation',
  },
  {
    component_key: 'science_pear_assessment',
    subject: 'science',
    display_name: 'Pear Assessment',
    default_duration_days: 1,
    color: '#F59E0B',
    description: 'PEAR science assessment',
  },
  {
    component_key: 'science_discovery_day',
    subject: 'science',
    display_name: 'Discovery Day',
    default_duration_days: 1,
    color: '#3B82F6',
    description: 'Hands-on discovery learning day',
  },
  {
    component_key: 'science_standard_district',
    subject: 'science',
    display_name: 'Standard #: District Resources',
    default_duration_days: 3,
    color: '#06B6D4',
    description: 'Three-day district resource instruction',
  },
  {
    component_key: 'science_testing_window',
    subject: 'science',
    display_name: 'Testing Window',
    default_duration_days: 1,
    color: '#EF4444',
    description: 'Science testing window',
  },
  {
    component_key: 'science_module_rotation',
    subject: 'science',
    display_name: 'Module Rotation',
    default_duration_days: 7,
    color: '#A855F7',
    description: 'Seven-day module rotation - creates sessions R#, S1 through R#, S7',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'R#, S1', duration: 1 },
        { title: 'R#, S2', duration: 1 },
        { title: 'R#, S3', duration: 1 },
        { title: 'R#, S4', duration: 1 },
        { title: 'R#, S5', duration: 1 },
        { title: 'R#, S6', duration: 1 },
        { title: 'R#, S7', duration: 1 },
      ],
    },
  },
  {
    component_key: 'science_flex_day',
    subject: 'science',
    display_name: 'Flex Day',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Flexible science instruction day',
  },

  // ========================================
  // SOCIAL STUDIES COMPONENTS (173 total)
  // ========================================
  // - General/Opening: 6 components
  // - Through Modern Times (8th): 34 components
  // - Through Industrialism (7th): 51 components
  // - World Through 1750 (6th): 82 components
  // ========================================

  // GENERAL COMPONENTS (6)
  // Opening components (2)
  {
    component_key: 'ss_welcome_video',
    subject: 'social_studies',
    display_name: 'Star Academy Welcome Video',
    default_duration_days: 1,
    color: '#8B5CF6',
    description: 'Star Academy welcome video for beginning of year',
  },
  {
    component_key: 'ss_rules_procedures',
    subject: 'social_studies',
    display_name: 'Establish Rapport & Classroom Procedures',
    default_duration_days: 1,
    color: '#6366F1',
    description: 'Establish classroom rapport and procedures',
  },

  {
    component_key: 'ss_quiz',
    subject: 'social_studies',
    display_name: 'Quiz: Unit #, Lesson #',
    default_duration_days: 1,
    color: '#EC4899',
    description: 'Unit and lesson quiz',
  },
  {
    component_key: 'ss_assessment',
    subject: 'social_studies',
    display_name: 'Assessment: Unit #',
    default_duration_days: 1,
    color: '#EF4444',
    description: 'Unit assessment',
  },
  {
    component_key: 'ss_unit_lesson',
    subject: 'social_studies',
    display_name: 'Unit #, Lesson #',
    default_duration_days: 1,
    color: '#F59E0B',
    description: 'Standard unit and lesson instruction',
  },
  {
    component_key: 'ss_flex_day',
    subject: 'social_studies',
    display_name: 'Flex Day',
    default_duration_days: 1,
    color: '#14B8A6',
    description: 'Flexible instruction day',
  },

  // ========================================
  // THROUGH MODERN TIMES (8th Grade) - 9 unit components
  // Each unit uses is_multi pattern to automatically skip weekends/breaks
  // ========================================

  // Unit 1: Forming a New Nation
  {
    component_key: 'ss_modern_u1',
    subject: 'social_studies',
    display_name: 'Unit 1: Forming a New Nation',
    default_duration_days: 10,
    color: '#DC2626',
    description: 'Unit 1: Forming a New Nation - 4 lessons (10 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 1, Setting the Stage', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 3', duration: 1 },
        { title: 'Unit 1, Lesson 3', duration: 1 },
        { title: 'Unit 1, Lesson 3', duration: 1 },
      ],
    },
  },

  // Unit 2: Launching the New Republic
  {
    component_key: 'ss_modern_u2',
    subject: 'social_studies',
    display_name: 'Unit 2: Launching the New Republic',
    default_duration_days: 13,
    color: '#EF4444',
    description: 'Unit 2: Launching the New Republic - 4 lessons (13 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 7', duration: 1 },
        { title: 'Unit 2, Lesson 7', duration: 1 },
        { title: 'Unit 2, Lesson 7', duration: 1 },
        { title: 'Unit 2, Lesson 7', duration: 1 },
      ],
    },
  },

  // Unit 3: An Expanding Nation
  {
    component_key: 'ss_modern_u3',
    subject: 'social_studies',
    display_name: 'Unit 3: An Expanding Nation',
    default_duration_days: 9,
    color: '#F97316',
    description: 'Unit 3: An Expanding Nation - 3 lessons (9 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 3, Lesson 8', duration: 1 },
        { title: 'Unit 3, Lesson 8', duration: 1 },
        { title: 'Unit 3, Lesson 8', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 10', duration: 1 },
        { title: 'Unit 3, Lesson 10', duration: 1 },
        { title: 'Unit 3, Lesson 10', duration: 1 },
      ],
    },
  },

  // Unit 4: Americans in the Mid-1800s
  {
    component_key: 'ss_modern_u4',
    subject: 'social_studies',
    display_name: 'Unit 4: Americans in the Mid-1800s',
    default_duration_days: 9,
    color: '#F59E0B',
    description: 'Unit 4: Americans in the Mid-1800s - 3 lessons (9 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 4, Lesson 11', duration: 1 },
        { title: 'Unit 4, Lesson 11', duration: 1 },
        { title: 'Unit 4, Lesson 11', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 13', duration: 1 },
        { title: 'Unit 4, Lesson 13', duration: 1 },
        { title: 'Unit 4, Lesson 13', duration: 1 },
      ],
    },
  },

  // Unit 5: The Union Challenged
  {
    component_key: 'ss_modern_u5',
    subject: 'social_studies',
    display_name: 'Unit 5: The Union Challenged',
    default_duration_days: 10,
    color: '#84CC16',
    description: 'Unit 5: The Union Challenged - 3 lessons (10 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 5, Lesson 14', duration: 1 },
        { title: 'Unit 5, Lesson 14', duration: 1 },
        { title: 'Unit 5, Lesson 14', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
      ],
    },
  },

  // Unit 6: Migration and Industry
  {
    component_key: 'ss_modern_u6',
    subject: 'social_studies',
    display_name: 'Unit 6: Migration and Industry',
    default_duration_days: 9,
    color: '#10B981',
    description: 'Unit 6: Migration and Industry - 3 lessons (9 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 6, Lesson 17', duration: 1 },
        { title: 'Unit 6, Lesson 17', duration: 1 },
        { title: 'Unit 6, Lesson 17', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
      ],
    },
  },

  // Unit 7: A Modern Nation Emerges
  {
    component_key: 'ss_modern_u7',
    subject: 'social_studies',
    display_name: 'Unit 7: A Modern Nation Emerges',
    default_duration_days: 14,
    color: '#14B8A6',
    description: 'Unit 7: A Modern Nation Emerges - 4 lessons (14 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 7, Lesson 20', duration: 1 },
        { title: 'Unit 7, Lesson 20', duration: 1 },
        { title: 'Unit 7, Lesson 20', duration: 1 },
        { title: 'Unit 7, Lesson 20', duration: 1 },
        { title: 'Unit 7, Lesson 21', duration: 1 },
        { title: 'Unit 7, Lesson 21', duration: 1 },
        { title: 'Unit 7, Lesson 21', duration: 1 },
        { title: 'Unit 7, Lesson 21', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 23', duration: 1 },
        { title: 'Unit 7, Lesson 23', duration: 1 },
        { title: 'Unit 7, Lesson 23', duration: 1 },
      ],
    },
  },

  // Unit 8: World War II and The Cold War
  {
    component_key: 'ss_modern_u8',
    subject: 'social_studies',
    display_name: 'Unit 8: World War II and The Cold War',
    default_duration_days: 18,
    color: '#0891B2',
    description: 'Unit 8: World War II and The Cold War - 5 lessons (18 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 8, Lesson 24', duration: 1 },
        { title: 'Unit 8, Lesson 24', duration: 1 },
        { title: 'Unit 8, Lesson 24', duration: 1 },
        { title: 'Unit 8, Lesson 24', duration: 1 },
        { title: 'Unit 8, Lesson 25', duration: 1 },
        { title: 'Unit 8, Lesson 25', duration: 1 },
        { title: 'Unit 8, Lesson 25', duration: 1 },
        { title: 'Unit 8, Lesson 26', duration: 1 },
        { title: 'Unit 8, Lesson 26', duration: 1 },
        { title: 'Unit 8, Lesson 26', duration: 1 },
        { title: 'Unit 8, Lesson 27', duration: 1 },
        { title: 'Unit 8, Lesson 27', duration: 1 },
        { title: 'Unit 8, Lesson 27', duration: 1 },
        { title: 'Unit 8, Lesson 27', duration: 1 },
        { title: 'Unit 8, Lesson 28', duration: 1 },
        { title: 'Unit 8, Lesson 28', duration: 1 },
        { title: 'Unit 8, Lesson 28', duration: 1 },
        { title: 'Unit 8, Lesson 28', duration: 1 },
      ],
    },
  },

  // Unit 9: Moving Toward Today
  {
    component_key: 'ss_modern_u9',
    subject: 'social_studies',
    display_name: 'Unit 9: Moving Toward Today',
    default_duration_days: 17,
    color: '#6366F1',
    description: 'Unit 9: Moving Toward Today - 5 lessons (17 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 9, Lesson 29', duration: 1 },
        { title: 'Unit 9, Lesson 29', duration: 1 },
        { title: 'Unit 9, Lesson 29', duration: 1 },
        { title: 'Unit 9, Lesson 29', duration: 1 },
        { title: 'Unit 9, Lesson 30', duration: 1 },
        { title: 'Unit 9, Lesson 30', duration: 1 },
        { title: 'Unit 9, Lesson 30', duration: 1 },
        { title: 'Unit 9, Lesson 30', duration: 1 },
        { title: 'Unit 9, Lesson 31', duration: 1 },
        { title: 'Unit 9, Lesson 31', duration: 1 },
        { title: 'Unit 9, Lesson 31', duration: 1 },
        { title: 'Unit 9, Lesson 32', duration: 1 },
        { title: 'Unit 9, Lesson 32', duration: 1 },
        { title: 'Unit 9, Lesson 32', duration: 1 },
        { title: 'Unit 9, Lesson 33', duration: 1 },
        { title: 'Unit 9, Lesson 33', duration: 1 },
        { title: 'Unit 9, Lesson 33', duration: 1 },
      ],
    },
  },

  // ========================================
  // THROUGH INDUSTRIALISM (7th Grade) - 10 unit components
  // Each unit uses is_multi pattern to automatically skip weekends/breaks
  // ========================================

  // Unit 1: Foundations of History
  {
    component_key: 'ss_industrialism_u1',
    subject: 'social_studies',
    display_name: 'Unit 1: Foundations of History',
    default_duration_days: 8,
    color: '#DC2626',
    description: 'Unit 1: Foundations of History - 4 lessons (8 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 1, Unit Opener', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 2: America Before and After Colonization
  {
    component_key: 'ss_industrialism_u2',
    subject: 'social_studies',
    display_name: 'Unit 2: America Before and After Colonization',
    default_duration_days: 14,
    color: '#EF4444',
    description: 'Unit 2: America Before and After Colonization - 6 lessons (14 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 2, Unit Opener', duration: 1 },
        { title: 'Unit 2, Lesson 3', duration: 1 },
        { title: 'Unit 2, Lesson 3', duration: 1 },
        { title: 'Unit 2, Lesson 3', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 3: Revolution in the Colonies
  {
    component_key: 'ss_industrialism_u3',
    subject: 'social_studies',
    display_name: 'Unit 3: Revolution in the Colonies',
    default_duration_days: 11,
    color: '#F97316',
    description: 'Unit 3: Revolution in the Colonies - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 3, Unit Opener', duration: 1 },
        { title: 'Unit 3, Lesson 7', duration: 1 },
        { title: 'Unit 3, Lesson 7', duration: 1 },
        { title: 'Unit 3, Lesson 7', duration: 1 },
        { title: 'Unit 3, Lesson 8', duration: 1 },
        { title: 'Unit 3, Lesson 8', duration: 1 },
        { title: 'Unit 3, Lesson 8', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 4: Forming a New Nation
  {
    component_key: 'ss_industrialism_u4',
    subject: 'social_studies',
    display_name: 'Unit 4: Forming a New Nation',
    default_duration_days: 11,
    color: '#F59E0B',
    description: 'Unit 4: Forming a New Nation - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 4, Unit Opener', duration: 1 },
        { title: 'Unit 4, Lesson 10', duration: 1 },
        { title: 'Unit 4, Lesson 10', duration: 1 },
        { title: 'Unit 4, Lesson 10', duration: 1 },
        { title: 'Unit 4, Lesson 11', duration: 1 },
        { title: 'Unit 4, Lesson 11', duration: 1 },
        { title: 'Unit 4, Lesson 11', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 5: Launching the New Republic
  {
    component_key: 'ss_industrialism_u5',
    subject: 'social_studies',
    display_name: 'Unit 5: Launching the New Republic',
    default_duration_days: 14,
    color: '#84CC16',
    description: 'Unit 5: Launching the New Republic - 6 lessons (14 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 5, Unit Opener', duration: 1 },
        { title: 'Unit 5, Lesson 13', duration: 1 },
        { title: 'Unit 5, Lesson 13', duration: 1 },
        { title: 'Unit 5, Lesson 13', duration: 1 },
        { title: 'Unit 5, Lesson 14', duration: 1 },
        { title: 'Unit 5, Lesson 14', duration: 1 },
        { title: 'Unit 5, Lesson 14', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 6: An Expanding Nation
  {
    component_key: 'ss_industrialism_u6',
    subject: 'social_studies',
    display_name: 'Unit 6: An Expanding Nation',
    default_duration_days: 11,
    color: '#10B981',
    description: 'Unit 6: An Expanding Nation - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 6, Unit Opener', duration: 1 },
        { title: 'Unit 6, Lesson 17', duration: 1 },
        { title: 'Unit 6, Lesson 17', duration: 1 },
        { title: 'Unit 6, Lesson 17', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 7: Americans in the Mid-1800s
  {
    component_key: 'ss_industrialism_u7',
    subject: 'social_studies',
    display_name: 'Unit 7: Americans in the Mid-1800s',
    default_duration_days: 11,
    color: '#14B8A6',
    description: 'Unit 7: Americans in the Mid-1800s - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 7, Unit Opener', duration: 1 },
        { title: 'Unit 7, Lesson 20', duration: 1 },
        { title: 'Unit 7, Lesson 20', duration: 1 },
        { title: 'Unit 7, Lesson 20', duration: 1 },
        { title: 'Unit 7, Lesson 21', duration: 1 },
        { title: 'Unit 7, Lesson 21', duration: 1 },
        { title: 'Unit 7, Lesson 21', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 8: The Union Challenged
  {
    component_key: 'ss_industrialism_u8',
    subject: 'social_studies',
    display_name: 'Unit 8: The Union Challenged',
    default_duration_days: 11,
    color: '#0891B2',
    description: 'Unit 8: The Union Challenged - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 8, Unit Opener', duration: 1 },
        { title: 'Unit 8, Lesson 23', duration: 1 },
        { title: 'Unit 8, Lesson 23', duration: 1 },
        { title: 'Unit 8, Lesson 23', duration: 1 },
        { title: 'Unit 8, Lesson 24', duration: 1 },
        { title: 'Unit 8, Lesson 24', duration: 1 },
        { title: 'Unit 8, Lesson 24', duration: 1 },
        { title: 'Unit 8, Lesson 25', duration: 1 },
        { title: 'Unit 8, Lesson 25', duration: 1 },
        { title: 'Unit 8, Lesson 25', duration: 1 },
        { title: 'Unit 8, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 9: Migration and Industry
  {
    component_key: 'ss_industrialism_u9',
    subject: 'social_studies',
    display_name: 'Unit 9: Migration and Industry',
    default_duration_days: 11,
    color: '#6366F1',
    description: 'Unit 9: Migration and Industry - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 9, Unit Opener', duration: 1 },
        { title: 'Unit 9, Lesson 26', duration: 1 },
        { title: 'Unit 9, Lesson 26', duration: 1 },
        { title: 'Unit 9, Lesson 26', duration: 1 },
        { title: 'Unit 9, Lesson 27', duration: 1 },
        { title: 'Unit 9, Lesson 27', duration: 1 },
        { title: 'Unit 9, Lesson 27', duration: 1 },
        { title: 'Unit 9, Lesson 28', duration: 1 },
        { title: 'Unit 9, Lesson 28', duration: 1 },
        { title: 'Unit 9, Lesson 28', duration: 1 },
        { title: 'Unit 9, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 10: A Modern Nation Emerges
  {
    component_key: 'ss_industrialism_u10',
    subject: 'social_studies',
    display_name: 'Unit 10: A Modern Nation Emerges',
    default_duration_days: 11,
    color: '#8B5CF6',
    description: 'Unit 10: A Modern Nation Emerges - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 10, Unit Opener', duration: 1 },
        { title: 'Unit 10, Lesson 29', duration: 1 },
        { title: 'Unit 10, Lesson 29', duration: 1 },
        { title: 'Unit 10, Lesson 29', duration: 1 },
        { title: 'Unit 10, Lesson 30', duration: 1 },
        { title: 'Unit 10, Lesson 30', duration: 1 },
        { title: 'Unit 10, Lesson 30', duration: 1 },
        { title: 'Unit 10, Lesson 31', duration: 1 },
        { title: 'Unit 10, Lesson 31', duration: 1 },
        { title: 'Unit 10, Lesson 31', duration: 1 },
        { title: 'Unit 10, Unit Closer', duration: 1 },
      ],
    },
  },

  // ========================================
  // WORLD THROUGH 1750 (6th Grade) - 16 unit components
  // Each unit uses is_multi pattern to automatically skip weekends/breaks
  // ========================================

  // Unit 1: Foundations of History
  {
    component_key: 'ss_world1750_u1',
    subject: 'social_studies',
    display_name: 'Unit 1: Foundations of History',
    default_duration_days: 11,
    color: '#DC2626',
    description: 'Unit 1: Foundations of History - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 1, Unit Opener', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 1', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 2', duration: 1 },
        { title: 'Unit 1, Lesson 3', duration: 1 },
        { title: 'Unit 1, Lesson 3', duration: 1 },
        { title: 'Unit 1, Lesson 3', duration: 1 },
        { title: 'Unit 1, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 2: The Rise of Civilization
  {
    component_key: 'ss_world1750_u2',
    subject: 'social_studies',
    display_name: 'Unit 2: The Rise of Civilization',
    default_duration_days: 17,
    color: '#EF4444',
    description: 'Unit 2: The Rise of Civilization - 7 lessons (17 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 2, Unit Opener', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 4', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 5', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 6', duration: 1 },
        { title: 'Unit 2, Lesson 7', duration: 1 },
        { title: 'Unit 2, Lesson 7', duration: 1 },
        { title: 'Unit 2, Lesson 7', duration: 1 },
        { title: 'Unit 2, Lesson 8', duration: 1 },
        { title: 'Unit 2, Lesson 8', duration: 1 },
        { title: 'Unit 2, Lesson 8', duration: 1 },
        { title: 'Unit 2, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 3: Ancient Egypt and Kush
  {
    component_key: 'ss_world1750_u3',
    subject: 'social_studies',
    display_name: 'Unit 3: Ancient Egypt and Kush',
    default_duration_days: 11,
    color: '#F97316',
    description: 'Unit 3: Ancient Egypt and Kush - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 3, Unit Opener', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 9', duration: 1 },
        { title: 'Unit 3, Lesson 10', duration: 1 },
        { title: 'Unit 3, Lesson 10', duration: 1 },
        { title: 'Unit 3, Lesson 10', duration: 1 },
        { title: 'Unit 3, Lesson 11', duration: 1 },
        { title: 'Unit 3, Lesson 11', duration: 1 },
        { title: 'Unit 3, Lesson 11', duration: 1 },
        { title: 'Unit 3, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 4: Ancient India
  {
    component_key: 'ss_world1750_u4',
    subject: 'social_studies',
    display_name: 'Unit 4: Ancient India',
    default_duration_days: 11,
    color: '#F59E0B',
    description: 'Unit 4: Ancient India - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 4, Unit Opener', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 12', duration: 1 },
        { title: 'Unit 4, Lesson 13', duration: 1 },
        { title: 'Unit 4, Lesson 13', duration: 1 },
        { title: 'Unit 4, Lesson 13', duration: 1 },
        { title: 'Unit 4, Lesson 14', duration: 1 },
        { title: 'Unit 4, Lesson 14', duration: 1 },
        { title: 'Unit 4, Lesson 14', duration: 1 },
        { title: 'Unit 4, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 5: Ancient China
  {
    component_key: 'ss_world1750_u5',
    subject: 'social_studies',
    display_name: 'Unit 5: Ancient China',
    default_duration_days: 11,
    color: '#84CC16',
    description: 'Unit 5: Ancient China - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 5, Unit Opener', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 15', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Lesson 16', duration: 1 },
        { title: 'Unit 5, Lesson 17', duration: 1 },
        { title: 'Unit 5, Lesson 17', duration: 1 },
        { title: 'Unit 5, Lesson 17', duration: 1 },
        { title: 'Unit 5, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 6: Ancient Greece
  {
    component_key: 'ss_world1750_u6',
    subject: 'social_studies',
    display_name: 'Unit 6: Ancient Greece',
    default_duration_days: 14,
    color: '#10B981',
    description: 'Unit 6: Ancient Greece - 6 lessons (14 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 6, Unit Opener', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 18', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Lesson 19', duration: 1 },
        { title: 'Unit 6, Lesson 20', duration: 1 },
        { title: 'Unit 6, Lesson 20', duration: 1 },
        { title: 'Unit 6, Lesson 20', duration: 1 },
        { title: 'Unit 6, Lesson 21', duration: 1 },
        { title: 'Unit 6, Lesson 21', duration: 1 },
        { title: 'Unit 6, Lesson 21', duration: 1 },
        { title: 'Unit 6, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 7: Ancient Rome
  {
    component_key: 'ss_world1750_u7',
    subject: 'social_studies',
    display_name: 'Unit 7: Ancient Rome',
    default_duration_days: 14,
    color: '#14B8A6',
    description: 'Unit 7: Ancient Rome - 6 lessons (14 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 7, Unit Opener', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 22', duration: 1 },
        { title: 'Unit 7, Lesson 23', duration: 1 },
        { title: 'Unit 7, Lesson 23', duration: 1 },
        { title: 'Unit 7, Lesson 23', duration: 1 },
        { title: 'Unit 7, Lesson 24', duration: 1 },
        { title: 'Unit 7, Lesson 24', duration: 1 },
        { title: 'Unit 7, Lesson 24', duration: 1 },
        { title: 'Unit 7, Lesson 25', duration: 1 },
        { title: 'Unit 7, Lesson 25', duration: 1 },
        { title: 'Unit 7, Lesson 25', duration: 1 },
        { title: 'Unit 7, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 8: Europe During Medieval Times
  {
    component_key: 'ss_world1750_u8',
    subject: 'social_studies',
    display_name: 'Unit 8: Europe During Medieval Times',
    default_duration_days: 11,
    color: '#0891B2',
    description: 'Unit 8: Europe During Medieval Times - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 8, Unit Opener', duration: 1 },
        { title: 'Unit 8, Lesson 26', duration: 1 },
        { title: 'Unit 8, Lesson 26', duration: 1 },
        { title: 'Unit 8, Lesson 26', duration: 1 },
        { title: 'Unit 8, Lesson 27', duration: 1 },
        { title: 'Unit 8, Lesson 27', duration: 1 },
        { title: 'Unit 8, Lesson 27', duration: 1 },
        { title: 'Unit 8, Lesson 28', duration: 1 },
        { title: 'Unit 8, Lesson 28', duration: 1 },
        { title: 'Unit 8, Lesson 28', duration: 1 },
        { title: 'Unit 8, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 9: The Middle East During Medieval Times
  {
    component_key: 'ss_world1750_u9',
    subject: 'social_studies',
    display_name: 'Unit 9: The Middle East During Medieval Times',
    default_duration_days: 8,
    color: '#6366F1',
    description: 'Unit 9: The Middle East During Medieval Times - 4 lessons (8 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 9, Unit Opener', duration: 1 },
        { title: 'Unit 9, Lesson 29', duration: 1 },
        { title: 'Unit 9, Lesson 29', duration: 1 },
        { title: 'Unit 9, Lesson 29', duration: 1 },
        { title: 'Unit 9, Lesson 30', duration: 1 },
        { title: 'Unit 9, Lesson 30', duration: 1 },
        { title: 'Unit 9, Lesson 30', duration: 1 },
        { title: 'Unit 9, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 10: The Culture and Kingdoms of West Africa
  {
    component_key: 'ss_world1750_u10',
    subject: 'social_studies',
    display_name: 'Unit 10: The Culture and Kingdoms of West Africa',
    default_duration_days: 14,
    color: '#8B5CF6',
    description: 'Unit 10: The Culture and Kingdoms of West Africa - 6 lessons (14 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 10, Unit Opener', duration: 1 },
        { title: 'Unit 10, Lesson 31', duration: 1 },
        { title: 'Unit 10, Lesson 31', duration: 1 },
        { title: 'Unit 10, Lesson 31', duration: 1 },
        { title: 'Unit 10, Lesson 32', duration: 1 },
        { title: 'Unit 10, Lesson 32', duration: 1 },
        { title: 'Unit 10, Lesson 32', duration: 1 },
        { title: 'Unit 10, Lesson 33', duration: 1 },
        { title: 'Unit 10, Lesson 33', duration: 1 },
        { title: 'Unit 10, Lesson 33', duration: 1 },
        { title: 'Unit 10, Lesson 34', duration: 1 },
        { title: 'Unit 10, Lesson 34', duration: 1 },
        { title: 'Unit 10, Lesson 34', duration: 1 },
        { title: 'Unit 10, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 11: Imperial China
  {
    component_key: 'ss_world1750_u11',
    subject: 'social_studies',
    display_name: 'Unit 11: Imperial China',
    default_duration_days: 11,
    color: '#EC4899',
    description: 'Unit 11: Imperial China - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 11, Unit Opener', duration: 1 },
        { title: 'Unit 11, Lesson 35', duration: 1 },
        { title: 'Unit 11, Lesson 35', duration: 1 },
        { title: 'Unit 11, Lesson 35', duration: 1 },
        { title: 'Unit 11, Lesson 36', duration: 1 },
        { title: 'Unit 11, Lesson 36', duration: 1 },
        { title: 'Unit 11, Lesson 36', duration: 1 },
        { title: 'Unit 11, Lesson 37', duration: 1 },
        { title: 'Unit 11, Lesson 37', duration: 1 },
        { title: 'Unit 11, Lesson 37', duration: 1 },
        { title: 'Unit 11, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 12: Pre-Feudal Japan
  {
    component_key: 'ss_world1750_u12',
    subject: 'social_studies',
    display_name: 'Unit 12: Pre-Feudal Japan',
    default_duration_days: 8,
    color: '#F43F5E',
    description: 'Unit 12: Pre-Feudal Japan - 4 lessons (8 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 12, Unit Opener', duration: 1 },
        { title: 'Unit 12, Lesson 38', duration: 1 },
        { title: 'Unit 12, Lesson 38', duration: 1 },
        { title: 'Unit 12, Lesson 38', duration: 1 },
        { title: 'Unit 12, Lesson 39', duration: 1 },
        { title: 'Unit 12, Lesson 39', duration: 1 },
        { title: 'Unit 12, Lesson 39', duration: 1 },
        { title: 'Unit 12, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 13: Civilizations of the Americas
  {
    component_key: 'ss_world1750_u13',
    subject: 'social_studies',
    display_name: 'Unit 13: Civilizations of the Americas',
    default_duration_days: 11,
    color: '#FB923C',
    description: 'Unit 13: Civilizations of the Americas - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 13, Unit Opener', duration: 1 },
        { title: 'Unit 13, Lesson 40', duration: 1 },
        { title: 'Unit 13, Lesson 40', duration: 1 },
        { title: 'Unit 13, Lesson 40', duration: 1 },
        { title: 'Unit 13, Lesson 41', duration: 1 },
        { title: 'Unit 13, Lesson 41', duration: 1 },
        { title: 'Unit 13, Lesson 41', duration: 1 },
        { title: 'Unit 13, Lesson 42', duration: 1 },
        { title: 'Unit 13, Lesson 42', duration: 1 },
        { title: 'Unit 13, Lesson 42', duration: 1 },
        { title: 'Unit 13, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 14: The Medieval World, 1200-1490
  {
    component_key: 'ss_world1750_u14',
    subject: 'social_studies',
    display_name: 'Unit 14: The Medieval World, 1200-1490',
    default_duration_days: 8,
    color: '#FBBF24',
    description: 'Unit 14: The Medieval World, 1200-1490 - 4 lessons (8 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 14, Unit Opener', duration: 1 },
        { title: 'Unit 14, Lesson 43', duration: 1 },
        { title: 'Unit 14, Lesson 43', duration: 1 },
        { title: 'Unit 14, Lesson 43', duration: 1 },
        { title: 'Unit 14, Lesson 44', duration: 1 },
        { title: 'Unit 14, Lesson 44', duration: 1 },
        { title: 'Unit 14, Lesson 44', duration: 1 },
        { title: 'Unit 14, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 15: Europe's Renaissance and Reformation
  {
    component_key: 'ss_world1750_u15',
    subject: 'social_studies',
    display_name: 'Unit 15: Europe\'s Renaissance and Reformation',
    default_duration_days: 11,
    color: '#A3E635',
    description: 'Unit 15: Europe\'s Renaissance and Reformation - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 15, Unit Opener', duration: 1 },
        { title: 'Unit 15, Lesson 45', duration: 1 },
        { title: 'Unit 15, Lesson 45', duration: 1 },
        { title: 'Unit 15, Lesson 45', duration: 1 },
        { title: 'Unit 15, Lesson 46', duration: 1 },
        { title: 'Unit 15, Lesson 46', duration: 1 },
        { title: 'Unit 15, Lesson 46', duration: 1 },
        { title: 'Unit 15, Lesson 47', duration: 1 },
        { title: 'Unit 15, Lesson 47', duration: 1 },
        { title: 'Unit 15, Lesson 47', duration: 1 },
        { title: 'Unit 15, Unit Closer', duration: 1 },
      ],
    },
  },

  // Unit 16: Europe Enters the Modern Age
  {
    component_key: 'ss_world1750_u16',
    subject: 'social_studies',
    display_name: 'Unit 16: Europe Enters the Modern Age',
    default_duration_days: 11,
    color: '#34D399',
    description: 'Unit 16: Europe Enters the Modern Age - 5 lessons (11 days total)',
    metadata: {
      is_multi: true,
      sub_components: [
        { title: 'Unit 16, Unit Opener', duration: 1 },
        { title: 'Unit 16, Lesson 48', duration: 1 },
        { title: 'Unit 16, Lesson 48', duration: 1 },
        { title: 'Unit 16, Lesson 48', duration: 1 },
        { title: 'Unit 16, Lesson 49', duration: 1 },
        { title: 'Unit 16, Lesson 49', duration: 1 },
        { title: 'Unit 16, Lesson 49', duration: 1 },
        { title: 'Unit 16, Lesson 50', duration: 1 },
        { title: 'Unit 16, Lesson 50', duration: 1 },
        { title: 'Unit 16, Lesson 50', duration: 1 },
        { title: 'Unit 16, Unit Closer', duration: 1 },
      ],
    },
  },

];

async function seedComponents() {
  const client = await pool.connect();

  try {
    console.log('Starting component template seed...');

    // Check if components already exist
    const existingCount = await client.query('SELECT COUNT(*) FROM component_templates');

    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`Found ${existingCount.rows[0].count} existing components.`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        readline.question('Delete and reseed? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('Seed cancelled.');
        return;
      }

      await client.query('DELETE FROM component_templates');
      console.log('Deleted existing components.');
    }

    // Insert all component templates
    for (const component of componentTemplates) {
      await client.query(
        `INSERT INTO component_templates
         (component_key, subject, display_name, default_duration_days, color, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          component.component_key,
          component.subject,
          component.display_name,
          component.default_duration_days,
          component.color,
          component.description,
          JSON.stringify(component.metadata || {}),
        ]
      );
    }

    console.log(`✓ Successfully seeded ${componentTemplates.length} component templates!`);

    // Show summary by subject
    const summary = await client.query(
      `SELECT subject, COUNT(*) as count
       FROM component_templates
       GROUP BY subject
       ORDER BY subject`
    );

    console.log('\nComponents by subject:');
    summary.rows.forEach((row) => {
      console.log(`  ${row.subject}: ${row.count}`);
    });

  } catch (error) {
    console.error('Error seeding components:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedComponents();
