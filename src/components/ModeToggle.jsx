export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="mode-toggle" role="group" aria-label="View mode">
      <button
        className={`mode-btn${mode === 'explorer' ? ' active' : ''}`}
        aria-pressed={mode === 'explorer'}
        onClick={() => setMode('explorer')}
      >
        Explorer
      </button>
      <button
        className={`mode-btn${mode === 'recruiter' ? ' active' : ''}`}
        aria-pressed={mode === 'recruiter'}
        onClick={() => setMode('recruiter')}
      >
        Recruiter
      </button>
    </div>
  )
}
