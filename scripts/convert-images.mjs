// Generates .webp siblings for the photographic JPGs in public/.
// Originals are kept as <picture> fallbacks. Re-run after adding new photos:
//   node scripts/convert-images.mjs
import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const publicDir = fileURLToPath(new URL('../public', import.meta.url))

// Only photos that are actually referenced by the app. The favicon and any
// unreferenced JPGs are skipped on purpose.
const TARGETS = new Set([
  'APY_with_Paws.jpg',
  'pm-class-northeastern.jpg',
  'msig-ceo-award.jpg',
  'mit-rh-mentor.jpg',
  'mit-scm-session.jpg',
  'harvard-team.jpg',
  'mit-souvenir.jpg',
  'mit-rh-team.jpg',
])

const QUALITY = 80

let saved = 0
for (const file of await readdir(publicDir)) {
  if (!TARGETS.has(file)) continue
  const src = path.join(publicDir, file)
  const out = src.replace(/\.jpe?g$/i, '.webp')
  await sharp(src).webp({ quality: QUALITY }).toFile(out)
  const [a, b] = await Promise.all([stat(src), stat(out)])
  const pct = Math.round((1 - b.size / a.size) * 100)
  saved += a.size - b.size
  console.log(`${file.padEnd(28)} ${(a.size / 1024).toFixed(0)}KB -> ${(b.size / 1024).toFixed(0)}KB webp (-${pct}%)`)
}
console.log(`\nTotal saved: ${(saved / 1024).toFixed(0)}KB`)
