// Helper script to generate Social Studies components with is_multi pattern
// Run this to see the output, then copy into seed-components.js

const throughModernTimes = [
  {
    unit: 1,
    name: 'Forming a New Nation',
    color: '#DC2626',
    lessons: [
      { name: 'Setting the Stage', days: 1 },
      { name: 'Lesson 1', days: 3 },
      { name: 'Lesson 2', days: 3 },
      { name: 'Lesson 3', days: 3 },
    ]
  },
  {
    unit: 2,
    name: 'Launching the New Republic',
    color: '#EF4444',
    lessons: [
      { name: 'Lesson 4', days: 3 },
      { name: 'Lesson 5', days: 3 },
      { name: 'Lesson 6', days: 3 },
      { name: 'Lesson 7', days: 4 },
    ]
  },
  {
    unit: 3,
    name: 'An Expanding Nation',
    color: '#F97316',
    lessons: [
      { name: 'Lesson 8', days: 3 },
      { name: 'Lesson 9', days: 3 },
      { name: 'Lesson 10', days: 3 },
    ]
  },
  {
    unit: 4,
    name: 'Americans in the Mid-1800s',
    color: '#F59E0B',
    lessons: [
      { name: 'Lesson 11', days: 3 },
      { name: 'Lesson 12', days: 3 },
      { name: 'Lesson 13', days: 3 },
    ]
  },
  {
    unit: 5,
    name: 'The Union Challenged',
    color: '#84CC16',
    lessons: [
      { name: 'Lesson 14', days: 3 },
      { name: 'Lesson 15', days: 4 },
      { name: 'Lesson 16', days: 3 },
    ]
  },
  {
    unit: 6,
    name: 'Migration and Industry',
    color: '#10B981',
    lessons: [
      { name: 'Lesson 17', days: 3 },
      { name: 'Lesson 18', days: 3 },
      { name: 'Lesson 19', days: 3 },
    ]
  },
  {
    unit: 7,
    name: 'A Modern Nation Emerges',
    color: '#14B8A6',
    lessons: [
      { name: 'Lesson 20', days: 4 },
      { name: 'Lesson 21', days: 4 },
      { name: 'Lesson 22', days: 3 },
      { name: 'Lesson 23', days: 3 },
    ]
  },
  {
    unit: 8,
    name: 'World War II and The Cold War',
    color: '#0891B2',
    lessons: [
      { name: 'Lesson 24', days: 4 },
      { name: 'Lesson 25', days: 3 },
      { name: 'Lesson 26', days: 3 },
      { name: 'Lesson 27', days: 4 },
      { name: 'Lesson 28', days: 4 },
    ]
  },
  {
    unit: 9,
    name: 'Moving Toward Today',
    color: '#6366F1',
    lessons: [
      { name: 'Lesson 29', days: 4 },
      { name: 'Lesson 30', days: 4 },
      { name: 'Lesson 31', days: 3 },
      { name: 'Lesson 32', days: 3 },
      { name: 'Lesson 33', days: 3 },
    ]
  },
];

const throughIndustrialism = [
  {
    unit: 1,
    name: 'Foundations of History',
    color: '#DC2626',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 1', days: 3 },
      { name: 'Lesson 2', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 2,
    name: 'America Before and After Colonization',
    color: '#EF4444',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 3', days: 3 },
      { name: 'Lesson 4', days: 3 },
      { name: 'Lesson 5', days: 3 },
      { name: 'Lesson 6', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 3,
    name: 'Revolution in the Colonies',
    color: '#F97316',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 7', days: 3 },
      { name: 'Lesson 8', days: 3 },
      { name: 'Lesson 9', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 4,
    name: 'Forming a New Nation',
    color: '#F59E0B',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 10', days: 3 },
      { name: 'Lesson 11', days: 3 },
      { name: 'Lesson 12', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 5,
    name: 'Launching the New Republic',
    color: '#84CC16',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 13', days: 3 },
      { name: 'Lesson 14', days: 3 },
      { name: 'Lesson 15', days: 3 },
      { name: 'Lesson 16', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 6,
    name: 'An Expanding Nation',
    color: '#10B981',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 17', days: 3 },
      { name: 'Lesson 18', days: 3 },
      { name: 'Lesson 19', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 7,
    name: 'Americans in the Mid-1800s',
    color: '#14B8A6',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 20', days: 3 },
      { name: 'Lesson 21', days: 3 },
      { name: 'Lesson 22', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 8,
    name: 'The Union Challenged',
    color: '#0891B2',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 23', days: 3 },
      { name: 'Lesson 24', days: 3 },
      { name: 'Lesson 25', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 9,
    name: 'Migration and Industry',
    color: '#6366F1',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 26', days: 3 },
      { name: 'Lesson 27', days: 3 },
      { name: 'Lesson 28', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 10,
    name: 'A Modern Nation Emerges',
    color: '#8B5CF6',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 29', days: 3 },
      { name: 'Lesson 30', days: 3 },
      { name: 'Lesson 31', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
];

const throughWorld1750 = [
  {
    unit: 1,
    name: 'Foundations of History',
    color: '#DC2626',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 1', days: 3 },
      { name: 'Lesson 2', days: 3 },
      { name: 'Lesson 3', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 2,
    name: 'The Rise of Civilization',
    color: '#EF4444',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 4', days: 3 },
      { name: 'Lesson 5', days: 3 },
      { name: 'Lesson 6', days: 3 },
      { name: 'Lesson 7', days: 3 },
      { name: 'Lesson 8', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 3,
    name: 'Ancient Egypt and Kush',
    color: '#F97316',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 9', days: 3 },
      { name: 'Lesson 10', days: 3 },
      { name: 'Lesson 11', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 4,
    name: 'Ancient India',
    color: '#F59E0B',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 12', days: 3 },
      { name: 'Lesson 13', days: 3 },
      { name: 'Lesson 14', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 5,
    name: 'Ancient China',
    color: '#84CC16',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 15', days: 3 },
      { name: 'Lesson 16', days: 3 },
      { name: 'Lesson 17', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 6,
    name: 'Ancient Greece',
    color: '#10B981',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 18', days: 3 },
      { name: 'Lesson 19', days: 3 },
      { name: 'Lesson 20', days: 3 },
      { name: 'Lesson 21', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 7,
    name: 'Ancient Rome',
    color: '#14B8A6',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 22', days: 3 },
      { name: 'Lesson 23', days: 3 },
      { name: 'Lesson 24', days: 3 },
      { name: 'Lesson 25', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 8,
    name: 'Europe During Medieval Times',
    color: '#0891B2',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 26', days: 3 },
      { name: 'Lesson 27', days: 3 },
      { name: 'Lesson 28', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 9,
    name: 'The Middle East During Medieval Times',
    color: '#6366F1',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 29', days: 3 },
      { name: 'Lesson 30', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 10,
    name: 'The Culture and Kingdoms of West Africa',
    color: '#8B5CF6',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 31', days: 3 },
      { name: 'Lesson 32', days: 3 },
      { name: 'Lesson 33', days: 3 },
      { name: 'Lesson 34', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 11,
    name: 'Imperial China',
    color: '#EC4899',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 35', days: 3 },
      { name: 'Lesson 36', days: 3 },
      { name: 'Lesson 37', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 12,
    name: 'Pre-Feudal Japan',
    color: '#F43F5E',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 38', days: 3 },
      { name: 'Lesson 39', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 13,
    name: 'Civilizations of the Americas',
    color: '#FB923C',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 40', days: 3 },
      { name: 'Lesson 41', days: 3 },
      { name: 'Lesson 42', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 14,
    name: 'The Medieval World, 1200-1490',
    color: '#FBBF24',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 43', days: 3 },
      { name: 'Lesson 44', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 15,
    name: 'Europe\'s Renaissance and Reformation',
    color: '#A3E635',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 45', days: 3 },
      { name: 'Lesson 46', days: 3 },
      { name: 'Lesson 47', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
  {
    unit: 16,
    name: 'Europe Enters the Modern Age',
    color: '#34D399',
    lessons: [
      { name: 'Unit Opener', days: 1 },
      { name: 'Lesson 48', days: 3 },
      { name: 'Lesson 49', days: 3 },
      { name: 'Lesson 50', days: 3 },
      { name: 'Unit Closer', days: 1 },
    ]
  },
];

function generateComponent(curriculumKey, unit) {
  const totalDays = unit.lessons.reduce((sum, lesson) => sum + lesson.days, 0);

  const subComponents = [];
  unit.lessons.forEach(lesson => {
    for (let i = 0; i < lesson.days; i++) {
      subComponents.push({ title: `Unit ${unit.unit}, ${lesson.name}`, duration: 1 });
    }
  });

  return `  {
    component_key: '${curriculumKey}_u${unit.unit}',
    subject: 'social_studies',
    display_name: 'Unit ${unit.unit}: ${unit.name}',
    default_duration_days: ${totalDays},
    color: '${unit.color}',
    description: 'Unit ${unit.unit}: ${unit.name} - ${unit.lessons.length} lessons (${totalDays} days total)',
    metadata: {
      is_multi: true,
      sub_components: [
${subComponents.map(sc => `        { title: '${sc.title}', duration: ${sc.duration} },`).join('\n')}
      ],
    },
  },`;
}

console.log('  // ========================================');
console.log('  // THROUGH MODERN TIMES (8th Grade) - 9 unit components');
console.log('  // Each unit uses is_multi pattern to automatically skip weekends/breaks');
console.log('  // ========================================\n');

throughModernTimes.forEach(unit => {
  console.log(`  // Unit ${unit.unit}: ${unit.name}`);
  console.log(generateComponent('ss_modern', unit));
  console.log('');
});

console.log('  // ========================================');
console.log('  // THROUGH INDUSTRIALISM (7th Grade) - 10 unit components');
console.log('  // Each unit uses is_multi pattern to automatically skip weekends/breaks');
console.log('  // ========================================\n');

throughIndustrialism.forEach(unit => {
  console.log(`  // Unit ${unit.unit}: ${unit.name}`);
  console.log(generateComponent('ss_industrialism', unit));
  console.log('');
});

console.log('  // ========================================');
console.log('  // WORLD THROUGH 1750 (6th Grade) - 16 unit components');
console.log('  // Each unit uses is_multi pattern to automatically skip weekends/breaks');
console.log('  // ========================================\n');

throughWorld1750.forEach(unit => {
  console.log(`  // Unit ${unit.unit}: ${unit.name}`);
  console.log(generateComponent('ss_world1750', unit));
  console.log('');
});
