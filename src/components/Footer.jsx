export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-logo">AP</span>
        <span>© 2026 Yashaswi Alur Prasannakumar</span>
        <span className="footer-credit">
          Built with{' '}
          <a
            href="https://claude.com/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-claude"
          >
            Claude Code
          </a>
          {' · '}React on Vercel
        </span>
      </div>
    </footer>
  )
}
