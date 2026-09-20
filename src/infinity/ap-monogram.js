/**
 * The AP monogram as a single continuous 3D stroke.
 *
 * The site's own mark is handwritten — .nav-logo and .footer-monogram are both
 * var(--font-hand), which is Caveat — so this is drawn the way a pen draws it
 * rather than extruded from letterform outlines. That also means it feeds the
 * existing tube builder directly: no text geometry, no bundled font, and the
 * glass material, travelling graticule and sparkle reveal all work untouched.
 *
 * Four strokes — the A's vee, the A's crossbar, the P's stem, the P's bowl —
 * joined into ONE curve by "lift" segments where the pen leaves the paper.
 * A lift is still geometry, it just has ~zero radius, so it is invisible while
 * keeping the whole mark a single curve. That matters: the particle system,
 * the proxy mesh and the shard grid all sample one curve, and splitting the
 * mark into four meshes would have meant changing all three.
 *
 * Radius is never exactly zero — a zero-radius sweep collapses every ring
 * vertex onto the centreline and the normals go degenerate. EPS keeps it
 * sub-pixel instead.
 */
import * as THREE from 'three';

export const A = 1.38, B = 0.33, R0 = 0.30;

// The ring normals are the unit sweep vector and stay valid however small the
// radius is, so this can go genuinely sub-pixel. At 0.0015 the lifts still
// caught a specular highlight and drew visible hairlines between the strokes.
const EPS = 0.00008;
const PEN = 0.132;       // stroke half-thickness at its fattest

// z varies slightly so the strokes sit at different depths and the glass has
// something to refract, rather than reading as a flat cutout.
// Short strokes read chunky at the same thickness as long ones, because the
// taper peaks mid-stroke regardless of how long the stroke is. The crossbar
// is the obvious victim.
const WEIGHT = [1.0, 0.66, 0.98, 0.92];

const STROKES = [
  // A — the vee, one stroke down-up-down
  [[-1.50, -0.60, 0.05], [-1.22, -0.05, 0.02], [-0.98, 0.52, -0.03],
   [-0.90, 0.60, -0.04], [-0.80, 0.44, -0.03], [-0.58, -0.10, 0.01], [-0.34, -0.60, 0.05]],
  // A — the crossbar, laid in front so it never intersects the vee
  [[-1.22, -0.10, 0.14], [-1.00, -0.06, 0.16], [-0.76, -0.09, 0.16], [-0.56, -0.05, 0.14]],
  // P — the stem
  [[0.30, 0.60, -0.04], [0.24, 0.20, 0.00], [0.18, -0.20, 0.03], [0.12, -0.62, 0.05]],
  // P — the bowl
  [[0.30, 0.60, -0.04], [0.66, 0.62, -0.06], [0.90, 0.44, -0.04],
   [0.86, 0.20, 0.00], [0.56, 0.10, 0.03], [0.26, 0.12, 0.04]],
];

const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);

/**
 * Concatenates the strokes and the lifts between them into one curve, and
 * remembers which spans are lifts so the radius can vanish over them.
 */
export class MonogramCurve extends THREE.Curve {
  constructor() {
    super();
    this.segments = [];

    const add = (pts, isLift, weight = 1) => {
      const c = new THREE.CatmullRomCurve3(pts.map(v3), false, 'catmullrom', 0.5);
      this.segments.push({ curve: c, isLift, length: c.getLength(), weight });
    };

    STROKES.forEach((pts, i) => {
      if (i > 0) {
        // the lift: a short arc from the end of the last stroke to the start
        // of this one, bowed out in +z so it never passes through the mark
        const from = STROKES[i - 1][STROKES[i - 1].length - 1];
        const to = pts[0];
        // bowed AWAY from the camera, not toward it — a lift arced into +z
        // sits in front of the mark and its highlight is what made the
        // hairlines visible in the first place
        const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + 0.06,
                     Math.min(from[2], to[2]) - 0.55];
        add([from, mid, to], true, 0);
      }
      add(pts, false, WEIGHT[i] ?? 1);
    });

    this.total = this.segments.reduce((s, x) => s + x.length, 0);
  }

  /** t in 0..1 over the whole mark, distributed by arc length. */
  _locate(t) {
    let d = THREE.MathUtils.clamp(t, 0, 1) * this.total;
    for (const seg of this.segments) {
      if (d <= seg.length || seg === this.segments[this.segments.length - 1]) {
        return { seg, local: seg.length > 0 ? THREE.MathUtils.clamp(d / seg.length, 0, 1) : 0 };
      }
      d -= seg.length;
    }
    const seg = this.segments[this.segments.length - 1];
    return { seg, local: 1 };
  }

  getPoint(t, target = new THREE.Vector3()) {
    const { seg, local } = this._locate(t);
    return target.copy(seg.curve.getPointAt(local));
  }

  /**
   * Calligraphic: fat through the middle of a stroke, tapering to a point at
   * each end the way a pen lifts, and effectively nothing across a lift.
   */
  radiusAt(t) {
    const { seg, local } = this._locate(t);
    if (seg.isLift) return EPS;
    // Only a gentle pen-lift at the ends. The first pass used a 0.22 floor
    // and the strokes came out needle-thin at both tips — the mark read as
    // claws rather than handwriting.
    const taper = Math.pow(Math.sin(Math.PI * local), 0.38);
    return EPS + PEN * seg.weight * (0.62 + 0.38 * taper);
  }
}

export function makeCurve() {
  const c = new MonogramCurve();
  c.arcLengthDivisions = 4000;   // default 200 quantises a tube this fine
  return c;
}

/** Kept for API parity with the lemniscate; the curve carries its own radius. */
export const radiusAt = p => R0 * (0.72 + 0.28 * Math.min(1, p.length() / A));

export { buildTube } from './ig-geometry.js';
