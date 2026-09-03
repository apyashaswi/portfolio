// Editorial sign-off — the back leaf of the journal.
// A quiet closing line, a handwritten monogram, and a magazine colophon.
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-closing">Thank you for reading.</p>

        <div className="footer-grid">
          <div className="footer-sign">
            <span className="footer-monogram" aria-hidden="true">AP</span>
            <span className="footer-name">Yashaswi Alur Prasannakumar</span>
            <span className="footer-copy">© 2026 &middot; Boston, Massachusetts</span>
          </div>

          <div className="footer-colophon">
            <span className="footer-colophon-label">Colophon</span>
            <p>
              Set in <em>Fraunces</em>, <em>Newsreader</em> &amp;{' '}
              <em>IBM&nbsp;Plex&nbsp;Mono</em>.
            </p>
            <p>
              Built with{' '}
              <a
                href="https://claude.com/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-claude"
              >
                Claude&nbsp;Code
              </a>
              . React, deployed on Vercel.
            </p>
          </div>
        </div>

        <div className="footer-edition">
          <span>Yashaswi Alur Prasannakumar — Portfolio 2026</span>
        </div>
      </div>
    </footer>
  )
}
