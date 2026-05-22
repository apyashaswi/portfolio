export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="mode-toggle" title={mode === 'explorer' ? 'Switch to Recruiter Mode' : 'Switch to Explorer Mode'}>
      <button
        className={`mode-btn${mode === 'explorer' ? ' active' : ''}`}
        onClick={() => setMode('explorer')}
      >
        Explorer
      </button>
      <button
        className={`mode-btn${mode === 'recruiter' ? ' active' : ''}`}
        onClick={() => setMode('recruiter')}
      >
        Recruiter
      </button>
    </div>
  )
}
