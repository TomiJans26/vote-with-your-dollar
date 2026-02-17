// Issue definitions for belief profile onboarding
// leftLabel = the -2 end (left-leaning view), rightLabel = the +2 end (right-leaning view)
export const ISSUE_CATEGORIES = [
  {
    id: 'social',
    name: 'Social Issues',
    emoji: '🤝',
    description: 'How people live, love, and relate to each other',
    issues: [
      { id: 'abortion', name: 'Abortion / Reproductive Rights', description: 'Where do you stand?', leftLabel: 'Pro-Choice', rightLabel: 'Pro-Life' },
      { id: 'lgbtq_rights', name: 'LGBTQ+ Rights', description: 'Where do you stand?', leftLabel: 'Expand Protections', rightLabel: 'Traditional Values' },
      { id: 'racial_justice', name: 'Racial Justice / Equity', description: 'Where do you stand?', leftLabel: 'Systemic Reform', rightLabel: 'Individual Merit' },
      { id: 'immigration', name: 'Immigration', description: 'Where do you stand?', leftLabel: 'Open Pathways', rightLabel: 'Secure Borders' },
      { id: 'religious_liberty', name: 'Religious Liberty', description: 'Where do you stand?', leftLabel: 'Separation of Church & State', rightLabel: 'Protect Religious Expression' },
      { id: 'death_penalty', name: 'Death Penalty', description: 'Where do you stand?', leftLabel: 'Abolish', rightLabel: 'Keep / Expand' },
    ],
  },
  {
    id: 'economic',
    name: 'Economic Issues',
    emoji: '💰',
    description: 'Jobs, wages, and how the economy works for people',
    issues: [
      { id: 'workers_rights', name: "Workers' Rights / Labor Unions", description: 'Where do you stand?', leftLabel: 'Strengthen Unions', rightLabel: 'Free Market' },
      { id: 'minimum_wage', name: 'Minimum Wage / Living Wage', description: 'Where do you stand?', leftLabel: 'Raise It', rightLabel: 'Let Market Decide' },
      { id: 'corporate_tax', name: 'Corporate Tax Policy', description: 'Where do you stand?', leftLabel: 'Tax More', rightLabel: 'Tax Less' },
      { id: 'free_trade', name: 'Free Trade vs Protectionism', description: 'Where do you stand?', leftLabel: 'Free Trade', rightLabel: 'America First' },
    ],
  },
  {
    id: 'environment',
    name: 'Environment',
    emoji: '🌍',
    description: 'Our planet, climate, and the natural world',
    issues: [
      { id: 'climate_change', name: 'Climate Change / Carbon Emissions', description: 'Where do you stand?', leftLabel: 'Urgent Action', rightLabel: 'Not a Priority' },
      { id: 'renewable_energy', name: 'Renewable Energy', description: 'Where do you stand?', leftLabel: 'Invest Heavily', rightLabel: 'All Energy Sources' },
      { id: 'environmental_regulations', name: 'Environmental Regulations', description: 'Where do you stand?', leftLabel: 'More Regulation', rightLabel: 'Less Regulation' },
      { id: 'animal_rights', name: 'Animal Rights / Welfare', description: 'Where do you stand?', leftLabel: 'Stronger Protections', rightLabel: 'Current Laws Fine' },
    ],
  },
  {
    id: 'safety',
    name: 'Safety & Security',
    emoji: '🛡️',
    description: 'How we keep communities and the country safe',
    issues: [
      { id: 'gun_control', name: 'Gun Control / 2nd Amendment', description: 'Where do you stand?', leftLabel: 'More Gun Control', rightLabel: 'Protect Gun Rights' },
      { id: 'military_spending', name: 'Military / Defense Spending', description: 'Where do you stand?', leftLabel: 'Reduce Spending', rightLabel: 'Increase Spending' },
      { id: 'police_reform', name: 'Police Reform / Criminal Justice', description: 'Where do you stand?', leftLabel: 'Major Reform', rightLabel: 'Back the Blue' },
      { id: 'drug_policy', name: 'Drug Policy / Legalization', description: 'Where do you stand?', leftLabel: 'Legalize & Treat', rightLabel: 'Strict Enforcement' },
    ],
  },
  {
    id: 'health_education',
    name: 'Health & Education',
    emoji: '🏥',
    description: 'Healthcare access and how we educate the next generation',
    issues: [
      { id: 'universal_healthcare', name: 'Universal Healthcare', description: 'Where do you stand?', leftLabel: 'Healthcare for All', rightLabel: 'Private Market' },
      { id: 'education_funding', name: 'Education Funding', description: 'Where do you stand?', leftLabel: 'Fund Public Schools', rightLabel: 'School Choice' },
      { id: 'student_debt', name: 'Student Debt', description: 'Where do you stand?', leftLabel: 'Forgive Loans', rightLabel: 'Personal Responsibility' },
      { id: 'vaccine_policy', name: 'Vaccine Policy', description: 'Where do you stand?', leftLabel: 'Mandate for Safety', rightLabel: 'Personal Choice' },
    ],
  },
];

// Flat list of all issues
export const ALL_ISSUES = ISSUE_CATEGORIES.flatMap(cat => cat.issues);

// Stance labels
export const STANCE_LABELS = [
  { value: -2, label: 'Strongly Oppose' },
  { value: -1, label: 'Oppose' },
  { value: 0, label: 'Neutral' },
  { value: 1, label: 'Support' },
  { value: 2, label: 'Strongly Support' },
];

// Importance levels
export const IMPORTANCE_LEVELS = [
  { value: 0, label: "Don't Care", color: 'gray', bgClass: 'bg-gray-200 text-gray-600' },
  { value: 1, label: 'Somewhat', color: 'yellow', bgClass: 'bg-yellow-200 text-yellow-800' },
  { value: 2, label: 'Very Important', color: 'orange', bgClass: 'bg-orange-200 text-orange-800' },
  { value: 3, label: '🚫 DEAL BREAKER', color: 'red', bgClass: 'bg-red-500 text-white font-bold' },
];
