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
    accent: '#bca47a',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="5" height="14" rx="1" />
        <rect x="8" y="3" width="5" height="9" rx="1" />
        <rect x="14" y="3" width="4" height="6" rx="1" />
      </svg>
    ),
  },
  'Data & Analytics': {
    accent: '#7d9079',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 16 L7 11 L10 13 L18 4" />
        <path d="M14 4 L18 4 L18 8" />
      </svg>
    ),
  },
  'Supply Chain & Operations': {
    accent: '#6b8aa8',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7 L10 3 L17 7 L17 14 L10 18 L3 14 Z" />
        <path d="M3 7 L10 11 L17 7" />
        <path d="M10 11 L10 18" />
      </svg>
    ),
  },
  'Engineering & Technical': {
    accent: '#9d6f4e',
    glyph: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7 L7 10 L4 13" />
        <path d="M10 14 L16 14" />
        <rect x="1.5" y="3.5" width="17" height="13" rx="1.5" />
      </svg>
    ),
  },
}

// Inline line-icons for project case studies, keyed by project id.
// Replaces emoji (🥽 🏭 🚁 📋) so glyphs are consistent, themeable, and crisp.
const PROJECT_GLYPHS = {
  // Spidey Sense — haptic VR headset
  spidey: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="9" rx="3" />
      <path d="M9 17c0 1.5-1 2.5-2.5 2.5S4 18 4 16.5" />
      <path d="M15 17c0 1.5 1 2.5 2.5 2.5S20 18 20 16.5" />
      <circle cx="8" cy="12.5" r="1.4" />
      <circle cx="16" cy="12.5" r="1.4" />
    </svg>
  ),
  // Warehouse / smart factory
  warehouse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M3 21h18" />
      <rect x="7" y="13" width="4" height="4" />
      <rect x="13" y="13" width="4" height="4" />
    </svg>
  ),
  // UAV / quadcopter drone
  uav: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2.5" />
      <circle cx="19" cy="6" r="2.5" />
      <path d="M5 8.5v2.5h14V8.5" />
      <rect x="9.5" y="11" width="5" height="5" rx="1" />
      <path d="M12 16v3M9 21h6" />
    </svg>
  ),
  // PCT assessment framework — clipboard / checklist
  pct: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="18" rx="2" />
      <path d="M9 4V2.5h6V4" />
      <path d="M8 10l1.5 1.5L12 9" />
      <path d="M8 16l1.5 1.5L12 15" />
      <path d="M15 10.5h2M15 16.5h2" />
    </svg>
  ),
}

// Trophy — replaces the 🏆 emoji on award badges.
export const TrophyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4v1a4 4 0 0 0 3 3.8M17 6h3v1a4 4 0 0 1-3 3.8" />
    <path d="M12 13v3M9 20h6M10 20l.5-4h3l.5 4" />
  </svg>
)

// Renders a project's case-study glyph at the requested pixel size.
// Falls back to nothing if an unknown id is passed.
export const ProjectIcon = ({ id, size = 24 }) => {
  const glyph = PROJECT_GLYPHS[id]
  if (!glyph) return null
  return (
    <span
      className="project-glyph"
      style={{ display: 'inline-flex', width: size, height: size }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  )
}
