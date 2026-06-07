// Bakes a small tiling grayscale-noise PNG to replace the live SVG feTurbulence
// paper-grain in styles.css. A static tiled PNG composites far cheaper than a
// full-viewport SVG filter + mix-blend on every scroll/repaint.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SIZE = 220
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'grain.png')

const buf = Buffer.alloc(SIZE * SIZE * 4)
for (let i = 0; i < SIZE * SIZE; i++) {
  const v = (Math.random() * 255) | 0
  buf[i * 4] = v
  buf[i * 4 + 1] = v
  buf[i * 4 + 2] = v
  buf[i * 4 + 3] = 255
}

await sharp(buf, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(out)

console.log('wrote', out)
