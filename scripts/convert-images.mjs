// Generates .webp siblings for the photographic JPGs in public/, plus a set
// of narrower widths for srcset. Originals are kept as <picture> fallbacks.
// Re-run after adding new photos:
//   node scripts/convert-images.mjs
//
// Every photo here is authored at 1200-1600px but displayed at 289-396px on
// desktop and ~334px on a phone -- 4.8x to 5.5x more pixels than any screen
// uses. WIDTHS covers 1x and 2x for each real display size:
//   hero 396 (331 mobile) | about 1024 (334 mobile) | highlights 289 (334)
// A width is skipped when the source is already that size or smaller, so
// nothing is ever upscaled.
//
// Also writes src/image-manifest.json, so <Picture> knows which widths exist
// for a given photo rather than guessing and risking a 404 in the srcset.
import sharp from 'sharp'
import { readdir, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const publicDir = fileURLToPath(new URL('../public', import.meta.url))

// Only photos that are actually referenced by the app. The favicon and any
// unreferenced JPGs are skipped on purpose.
const TARGETS = new Set([
  'APY_with_Paws.jpg',
  'pm-class-northeastern.jpg',
  'msig-ceo-award.jpg',
  'msig-cohort.jpg',
  'msig-induction.jpg',
  'msig-roundtable.jpg',
  'njx-hackathon.jpg',
  'mit-rh-mentor.jpg',
  'mit-scm-session.jpg',
  'harvard-team.jpg',
  'mit-souvenir.jpg',
  'mit-rh-team.jpg',
])

const QUALITY = 80
const WIDTHS = [400, 800, 1200]

let saved = 0
const manifest = {}

for (const file of await readdir(publicDir)) {
  if (!TARGETS.has(file)) continue
  const src = path.join(publicDir, file)
  const base = file.replace(/\.jpe?g$/i, '')
  const out = src.replace(/\.jpe?g$/i, '.webp')

  const meta = await sharp(src).metadata()
  await sharp(src).webp({ quality: QUALITY }).toFile(out)
  const [a, b] = await Promise.all([stat(src), stat(out)])
  saved += a.size - b.size
  const pct = Math.round((1 - b.size / a.size) * 100)

  // narrower variants, never upscaled
  const made = []
  for (const w of WIDTHS) {
    if (meta.width && w >= meta.width) continue
    const target = path.join(publicDir, `${base}-${w}.webp`)
    await sharp(src).resize({ width: w }).webp({ quality: QUALITY }).toFile(target)
    const t = await stat(target)
    made.push(`${w}w ${(t.size / 1024).toFixed(0)}KB`)
  }
  manifest[`/${file}`] = {
    full: meta.width ?? null,
    widths: WIDTHS.filter(w => !meta.width || w < meta.width),
  }
  console.log(
    `${file.padEnd(28)} ${(a.size / 1024).toFixed(0)}KB -> ${(b.size / 1024).toFixed(0)}KB webp (-${pct}%)` +
    (made.length ? `  +[${made.join(', ')}]` : '  (no smaller variants needed)')
  )
}

const manifestPath = fileURLToPath(new URL('../src/image-manifest.json', import.meta.url))
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`\nmanifest -> src/image-manifest.json (${Object.keys(manifest).length} photos)`)
console.log(`\nTotal saved: ${(saved / 1024).toFixed(0)}KB`)
