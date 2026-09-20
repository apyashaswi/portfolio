/**
 * Geometry for Liquid Glass Infinity — the braided lemniscate and its tube.
 *
 * Extracted from the factory because it is pure: no closure state, no
 * renderer, nothing to dispose. Kept separate so the main module is about
 * wiring and interaction rather than parametric surfaces.
 */
import * as THREE from 'three';

export const A = 1.38, B = 0.33, R0 = 0.30;

/** 3D lemniscate, braided so the strands pass over/under instead of
 *  self-intersecting. A true intersection gives degenerate normals and muddy
 *  refraction at the exact focal point of the composition. */
export class Lemniscate extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const s = t * Math.PI * 2;
    return target.set(A * Math.cos(s), A * Math.sin(s) * Math.cos(s), B * Math.sin(s));
  }
}

export function makeCurve() {
  const c = new Lemniscate();
  c.arcLengthDivisions = 4000;   // default 200 quantises a tube this fine
  return c;
}

/** Swells at the lobes, pinches where the strands braid past each other. */
export const radiusAt = p => R0 * (0.72 + 0.28 * Math.min(1, p.length() / A));

/** Sweeps the tube by hand rather than via TubeGeometry, because the radius
 *  varies along the curve and the Frenet frames are needed anyway. */
export function buildTube(curve, tubular, radial, closed = true) {
  // `closed` matters: a stroke that does not return to its start gets the
  // wrong frames if the sweep is told to wrap. And a curve may carry its own
  // radiusAt(u) — the monogram varies thickness ALONG the stroke (calligraphic
  // taper, and nothing across a pen lift), which a position-based radius
  // cannot express.
  const frames = curve.computeFrenetFrames(tubular, closed);
  const byParam = typeof curve.radiusAt === 'function';
  // Radius per ring, kept so the index pass can DROP spans that are
  // effectively zero-thickness. Shrinking a tube to sub-pixel is not enough to
  // hide it: the rings still emit triangles, and the material's rim term lights
  // them as a hairline. The pen lifts in the monogram showed up exactly that
  // way. Not emitting the quads is what actually removes them.
  const ring = new Float32Array(tubular + 1);
  const pos = [], nrm = [], uv = [], idx = [];
  const P = new THREE.Vector3(), V = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular;
    curve.getPointAt(u, P);
    const N = frames.normals[i], Bn = frames.binormals[i];
    const r = byParam ? curve.radiusAt(u, P) : radiusAt(P);
    ring[i] = r;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      V.set(N.x * ca + Bn.x * sa, N.y * ca + Bn.y * sa, N.z * ca + Bn.z * sa);
      pos.push(P.x + V.x * r, P.y + V.y * r, P.z + V.z * r);
      nrm.push(V.x, V.y, V.z);
      uv.push(u, j / radial);
    }
  }
  const HAIR = 1e-3;   // below this a span contributes nothing but artefacts
  for (let i = 0; i < tubular; i++) {
    if (ring[i] < HAIR && ring[i + 1] < HAIR) continue;
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
