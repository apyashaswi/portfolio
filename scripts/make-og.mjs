// Generates public/og-card.png — a 1200x630 social-share card in the
// portfolio's editorial cardstock palette. Run: node scripts/make-og.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'public', 'og-card.png')

const BG = '#2c2620'
const OAT = '#bca47a'
const INK = '#f0e2c5'
const INK_SOFT = '#d6c9ad'
const INK_MUTED = '#b3a48c'

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="${OAT}" stroke-opacity="0.35" stroke-width="1"/>
  <g font-family="Consolas, 'Courier New', monospace">
    <text x="80" y="120" fill="${OAT}" font-size="22" letter-spacing="6">EDITION '26 &#183; PORTFOLIO</text>
  </g>
  <line x1="80" y1="150" x2="200" y2="150" stroke="${OAT}" stroke-width="1.5"/>
  <g font-family="Georgia, 'Times New Roman', serif">
    <text x="78" y="260" fill="${INK}" font-size="86" font-weight="600">Yashaswi</text>
    <text x="78" y="350" fill="${INK_SOFT}" font-size="58" font-style="italic">Alur Prasannakumar<tspan fill="${OAT}">.</tspan></text>
    <text x="80" y="448" fill="${INK_MUTED}" font-size="30">Program Manager &#183; Data &amp; AI &#183; Researcher</text>
  </g>
  <line x1="80" y1="500" x2="1120" y2="500" stroke="${OAT}" stroke-opacity="0.25" stroke-width="1"/>
  <g font-family="Consolas, 'Courier New', monospace">
    <text x="80" y="548" fill="${INK_MUTED}" font-size="20" letter-spacing="2">MS ENGINEERING MANAGEMENT, NORTHEASTERN '26 &#183; MIT REALITY HACK WINNER</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png().toFile(out)
console.log('Wrote', out)
