// Issue definitions for belief profile onboarding
export const ISSUE_CATEGORIES = [
  {
    id: 'social',
    name: 'Social Issues',
    emoji: '🤝',
    description: 'How people live, love, and relate to each other',
    issues: [
      { id: 'abortion', name: 'Abortion / Reproductive Rights', description: 'Access to abortion and reproductive healthcare services' },
      { id: 'lgbtq_rights', name: 'LGBTQ+ Rights', description: 'Equal rights and protections for LGBTQ+ individuals' },
      { id: 'racial_justice', name: 'Racial Justice / Equity', description: 'Policies addressing racial inequality and systemic racism' },
      { id: 'immigration', name: 'Immigration', description: 'Pathways to citizenship, border policy, and refugee resettlement' },
      { id: 'religious_liberty', name: 'Religious Liberty', description: 'Protections for religious expression and conscience' },
      { id: 'death_penalty', name: 'Death Penalty', description: 'Use of capital punishment in the justice system' },
    ],
  },
  {
    id: 'economic',
    name: 'Economic Issues',
    emoji: '💰',
    description: 'Jobs, wages, and how the economy works for people',
    issues: [
      { id: 'workers_rights', name: "Workers' Rights / Labor Unions", description: 'Collective bargaining, union protections, and worker safety' },
      { id: 'minimum_wage', name: 'Minimum Wage / Living Wage', description: 'Federal and state minimum wage levels' },
      { id: 'corporate_tax', name: 'Corporate Tax Policy', description: 'Tax rates and loopholes for large corporations' },
      { id: 'free_trade', name: 'Free Trade vs Protectionism', description: 'International trade agreements and tariff policy' },
    ],
  },
  {
    id: 'environment',
    name: 'Environment',
    emoji: '🌍',
    description: 'Our planet, climate, and the natural world',
    issues: [
      { id: 'climate_change', name: 'Climate Change / Carbon Emissions', description: 'Reducing greenhouse gases and addressing global warming' },
      { id: 'renewable_energy', name: 'Renewable Energy', description: 'Investment in solar, wind, and clean energy sources' },
      { id: 'environmental_regulations', name: 'Environmental Regulations', description: 'EPA rules, pollution limits, and conservation policy' },
      { id: 'animal_rights', name: 'Animal Rights / Welfare', description: 'Protections for animals in farming, testing, and wildlife' },
    ],
  },
  {
    id: 'safety',
    name: 'Safety & Security',
    emoji: '🛡️',
    description: 'How we keep communities and the country safe',
    issues: [
      { id: 'gun_control', name: 'Gun Control / 2nd Amendment', description: 'Firearm regulations, background checks, and gun rights' },
      { id: 'military_spending', name: 'Military / Defense Spending', description: 'Federal defense budget and military priorities' },
      { id: 'police_reform', name: 'Police Reform / Criminal Justice', description: 'Policing practices, sentencing reform, and incarceration' },
      { id: 'drug_policy', name: 'Drug Policy / Legalization', description: 'Cannabis legalization, drug scheduling, and treatment vs. criminalization' },
    ],
  },
  {
    id: 'health_education',
    name: 'Health & Education',
    emoji: '🏥',
    description: 'Healthcare access and how we educate the next generation',
    issues: [
      { id: 'universal_healthcare', name: 'Universal Healthcare', description: 'Government-funded healthcare for all citizens' },
      { id: 'education_funding', name: 'Education Funding', description: 'Public school funding, teacher pay, and school choice' },
      { id: 'student_debt', name: 'Student Debt', description: 'College affordability and student loan forgiveness' },
      { id: 'vaccine_policy', name: 'Vaccine Policy', description: 'Vaccine mandates, public health requirements, and personal choice' },
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
