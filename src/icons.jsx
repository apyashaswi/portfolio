// Simple Icons CDN helpers.
// https://cdn.simpleicons.org/{slug}            → official brand color SVG
// https://cdn.simpleicons.org/{slug}/{hex}      → recolored SVG (hex without #)

export const simpleIconUrl = (slug, hex) =>
  hex ? `https://cdn.simpleicons.org/${slug}/${hex}` : `https://cdn.simpleicons.org/${slug}`

// Slugs whose brand color is too dark/desaturated to read on a dark background.
// We render these with a light override.
const LIGHT_OVERRIDE = new Set(['unity', 'ros', 'apple', 'github', 'openai'])

export const skillIconUrl = (slug) =>
  LIGHT_OVERRIDE.has(slug) ? simpleIconUrl(slug, 'e8e4f5') : simpleIconUrl(slug)

// Map skill label → Simple Icons slug (or null if it's a concept / not a tool).
export const SKILL_ICONS = {
  // Program & Project Management
  'Scrum / Agile': null,
  'Azure DevOps': 'azuredevops',
  'Sprint Planning': null,
  'Change Management': null,
  'Stakeholder Communication': null,
  'Risk Management': null,
  'Roadmapping': null,
  'Prosci / ADKAR': null,

  // Data & Analytics
  'Microsoft Fabric': null,
  'Power BI': 'powerbi',
  'Python (Pandas, NumPy, sklearn)': 'python',
  'SQL': null,
  'Machine Learning': null,
  'LLMs & LangGraph': 'langchain',
  'Time Series Analysis': null,
  'Data Pipelines & ETL': 'apacheairflow',

  // Supply Chain & Operations — all concepts
  'Strategic Sourcing': null,
  'Should-Cost Modeling': null,
  'Vendor Evaluation': null,
  'Process Optimization': null,
  'Demand Forecasting': null,
  'ERP Systems': null,
  'ROI Analysis': null,
  'Quality Control': null,

  // Engineering & Technical
  'MATLAB': null,
  'ROS': 'ros',
  'Unity 3D': 'unity',
  'Google Cloud / Vertex AI': 'googlecloud',
  'Microsoft Azure': 'microsoftazure',
  'C++': 'cplusplus',
  'REST APIs': null,
  'Apache Airflow': 'apacheairflow',

  // Project tags (additional tools used in PROJECTS)
  'ESP32': 'espressif',
  'Bluetooth LE': 'bluetooth',
  'Meta Quest 3': 'meta',
  'Kafka': 'apachekafka',
  'LangGraph': 'langchain',
  'Python': 'python',
}

// Returns slug for any label, falling back to a normalized lookup (lowercase,
// trim, strip parenthetical) so casual mismatches still resolve.
export const lookupIcon = (label) => {
  if (SKILL_ICONS[label] !== undefined) return SKILL_ICONS[label]
  const cleaned = label.replace(/\s*\([^)]*\)\s*/g, '').trim()
  return SKILL_ICONS[cleaned] ?? null
}

// Per-category accent + inline SVG glyph used for concept-skills (no brand logo).
// Glyphs are simple 20x20 line icons matching the category theme.
export const CATEGORY_META = {
  'Program & Project Management': {
    accent: '#8b83e4',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="5" height="14" rx="1" />
        <rect x="8" y="3" width="5" height="9" rx="1" />
        <rect x="14" y="3" width="4" height="6" rx="1" />
      </svg>
    ),
  },
  'Data & Analytics': {
    accent: '#2bb088',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 16 L7 11 L10 13 L18 4" />
        <path d="M14 4 L18 4 L18 8" />
      </svg>
    ),
  },
  'Supply Chain & Operations': {
    accent: '#e89f6b',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7 L10 3 L17 7 L17 14 L10 18 L3 14 Z" />
        <path d="M3 7 L10 11 L17 7" />
        <path d="M10 11 L10 18" />
      </svg>
    ),
  },
  'Engineering & Technical': {
    accent: '#d4b35a',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7 L7 10 L4 13" />
        <path d="M10 14 L16 14" />
        <rect x="1.5" y="3.5" width="17" height="13" rx="1.5" />
      </svg>
    ),
  },
}
