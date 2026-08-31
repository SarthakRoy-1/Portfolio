'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/* ===========================================================================
 * LIQUID CHROME FACIAL WIREFRAME
 *
 * Raw WebGL 1.0. Two passes on a single canvas:
 *   PASS 1  fullscreen quad  -> heavily graded portrait substrate (identity)
 *   PASS 2  triangular mesh  -> dark chrome surface + wireframe edges + vertices
 *
 * The photograph is the SOURCE (identity + depth information).
 * The mesh is the PRODUCT. The cursor is the LIGHT. The background is darkness.
 * ==========================================================================*/

const PORTRAIT_SRC = '/wmremove-transformed.png';

/* ---------------------------------------------------------------------------
 * ASSET-SPECIFIC TUNING
 *
 * FACE_REGION was measured off `public/wmremove-transformed.png`
 * (1696x2528, RGBA colourType 6) after the cover-fit crop below, and is
 * expressed in CONTAINER UV (u right, v down, both 0..1).
 *
 * >>> If the portrait asset or the container aspect ratio changes, THIS BLOCK
 * >>> is what needs retuning. Nothing else in the file is asset-dependent.
 * -------------------------------------------------------------------------*/
const FACE_REGION = {
  /** VERIFIED: this PNG declares colourType 6 (RGBA) but every pixel is
   *  alpha 255. What looks like transparency is a light-grey CHECKERBOARD
   *  baked into the RGB channels by the watermark-removal tool. The alpha
   *  channel therefore carries no silhouette and must not be used as a mask.
   *  The subject is recovered instead by flood-filling that checkerboard
   *  inward from the image border (see `analyze`). */
  BG_LUMA_MIN: 0.7,
  BG_SAT_MAX: 0.14,

  /** Soft face oval, supplying broad head volume.
   *  Deliberately NOT a distance transform over a silhouette: the subject is
   *  cropped at the bottom frame edge, so an interior distance field would
   *  peak in the torso and invent a domed "head". */
  FACE_MASK_CENTER: [0.5, 0.457] as [number, number],
  FACE_MASK_RADIUS: [0.3, 0.29] as [number, number],
  /** Eye centres, for eye-contour feature weighting. */
  EYE_LEFT: [0.376, 0.389] as [number, number],
  EYE_RIGHT: [0.618, 0.389] as [number, number],
  /** Horizontal anatomical bands (container v). */
  FEATURE_BANDS: {
    brow: 0.329,
    eye: 0.389,
    nose: 0.474,
    lip: 0.552,
    jaw: 0.647,
    chin: 0.703,
  },
  /** Fraction of the excess crop height removed from the TOP.
   *  0.2 keeps the face and sheds hoodie from the bottom. */
  CROP_TOP_BIAS: 0.2,
};

const TUNING = {
  /* --- photo substrate -------------------------------------------------- */
  /** A faint identity substrate, NOT a greyscale photograph.
   *  Lower this if the result still reads as a normal photo. */
  PHOTO_GRADE: 0.32,

  /* --- depth reconstruction --------------------------------------------- */
  /** Broad volume stays subordinate to facial relief. */
  VOLUME_W: 0.3,
  RELIEF_W: 0.7,
  NORMAL_STRENGTH: 0.16,

  /* --- mesh -------------------------------------------------------------- */
  MESH_COLUMNS_DESKTOP: 68,
  MESH_COLUMNS_MOBILE: 40,
  /** Deterministic hash jitter, as a fraction of one cell. Enough that the
   *  lattice never reads as a mathematical grid. */
  JITTER: 0.24,
  RELAX_ITERATIONS: 3,
  RELAX_STEP: 0.28,
  RELAX_MAX: 0.48,

  /* --- cursor light ------------------------------------------------------ */
  CURSOR_RADIUS: 0.5,
  /** Clip-space vertex displacement: sub-pixel to ~1px.
   *  Reduce toward 0 if the face ever reads as unstable. */
  DISPLACE: 0.004,
  /** Faint always-on wireframe so the hero reads as a mesh at rest. */
  ENERGY_FLOOR: 0.34,

  /* --- dark chrome ------------------------------------------------------- */
  SPECULAR_SHARP: 60.0,
  SPECULAR_BROAD: 16.0,
  FRESNEL_STRENGTH: 0.7,
  /** Visual hierarchy: edges > specular > filled surface > vertex accents. */
  SURFACE_STRENGTH: 0.34,
  EDGE_STRENGTH: 1.0,
  POINT_STRENGTH: 1.35,
  /** Hard ceiling so additive edges/points cannot bloom. */
  CLAMP_MAX: 0.92,
};

/** Preprocessing field resolution (matches the 3:4 container). */
const FIELD_W = 256;
const FIELD_H = 341;
const CONTAINER_ASPECT = 3 / 4;

const TRAIL_N = 6;
const TRAIL_DECAY_MS = 520;
/** Resting key light, used before and after cursor interaction. */
const DEFAULT_LIGHT: [number, number] = [0.38, 0.34];
const LIGHT_HEIGHT = 0.55;
const VERTEX_STRIDE = 9;

/** GLSL float literal. */
const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

/* ===========================================================================
 * SHADERS
 * ==========================================================================*/

const PHOTO_VS = `
  attribute vec2 a_pos;
  attribute vec2 a_uv;
  varying vec2 v_uv;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
    v_uv = a_uv;
  }
`;

const PHOTO_FS = `
  precision mediump float;
  varying vec2 v_uv;

  uniform sampler2D u_image;
  uniform sampler2D u_mask;
  uniform vec2 u_uvScale;
  uniform vec2 u_uvOffset;
  uniform float u_grade;

  void main() {
    vec2 uv = u_uvOffset + v_uv * u_uvScale;
    vec4 tex = texture2D(u_image, uv);
    // Subject mask is CPU-derived: this PNG's alpha channel is uniformly
    // opaque and its RGB background is a baked checkerboard.
    float subject = texture2D(u_mask, v_uv).r;

    float l = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

    // Saturation suppression so the hoodie's blue LED strips do not survive
    // the grade as bright structure.
    float mx = max(max(tex.r, tex.g), tex.b);
    float mn = min(min(tex.r, tex.g), tex.b);
    float sat = mx > 0.001 ? (mx - mn) / mx : 0.0;
    l *= 1.0 - sat * 0.6;

    // Crush blacks, then suppress midtones so only upper structure survives.
    l = pow(clamp(l, 0.0, 1.0), 1.7);
    l *= smoothstep(0.02, 0.55, l);

    vec3 col = vec3(l) * vec3(0.80, 0.87, 1.0);

    // Vignette: fade to black before the frame edge.
    vec2 d = (v_uv - 0.5) * vec2(1.0, 1.12);
    col *= 1.0 - smoothstep(0.28, 0.70, length(d));

    col *= u_grade * subject;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const MESH_VS = `
  precision highp float;

  attribute vec2 a_pos;
  attribute vec2 a_uv;
  attribute vec3 a_normal;
  attribute float a_feature;
  attribute float a_mask;

  uniform vec3 u_trail[${TRAIL_N}];
  uniform float u_energy;
  uniform float u_ambient;
  uniform float u_displace;
  uniform float u_aspect;
  uniform float u_pointSize;

  varying vec3 v_normal;
  varying vec2 v_uv;
  varying float v_feature;
  varying float v_field;
  varying float v_mask;

  void main() {
    // Localized cursor influence. Aspect-corrected so the falloff is circular
    // on screen, squared for a physical-looking rolloff.
    float cursorField = 0.0;
    for (int i = 0; i < ${TRAIL_N}; i++) {
      if (u_trail[i].z > 0.0) {
        vec2 d = a_uv - u_trail[i].xy;
        d.x *= u_aspect;
        float t = 1.0 - smoothstep(0.0, ${f(TUNING.CURSOR_RADIUS)}, length(d));
        cursorField = max(cursorField, t * t * u_trail[i].z);
      }
    }
    cursorField *= u_energy;

    // Displacement follows ONLY the cursor field, never the ambient floor, so
    // the resting geometry is exactly the base geometry.
    vec2 p = a_pos + a_normal.xy * cursorField * u_displace;

    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = u_pointSize;

    v_normal = a_normal;
    v_uv = a_uv;
    v_feature = a_feature;
    v_field = max(cursorField, u_ambient);
    v_mask = a_mask;
  }
`;

const MESH_FS = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec2 v_uv;
  varying float v_feature;
  varying float v_field;
  varying float v_mask;

  uniform vec3 u_light;
  // Must match the vertex shader's precision: u_aspect is shared, and GLSL ES
  // refuses to link when a shared uniform's precision differs between stages.
  uniform highp float u_aspect;
  uniform float u_colorScale;
  uniform float u_alphaScale;

  void main() {
    vec3 N = normalize(v_normal);
    vec3 V = vec3(0.0, 0.0, 1.0);

    // The cursor is a real point light sitting above the surface.
    vec3 P = vec3(v_uv.x * u_aspect, -v_uv.y, 0.0);
    vec3 Lp = vec3(u_light.x * u_aspect, -u_light.y, u_light.z);
    vec3 L = normalize(Lp - P);
    vec3 H = normalize(L + V);

    float ndh = max(dot(N, H), 0.0);
    float sharp = pow(ndh, ${f(TUNING.SPECULAR_SHARP)});
    float broad = pow(ndh, ${f(TUNING.SPECULAR_BROAD)}) * 0.45;
    float fres = pow(1.0 - max(dot(N, V), 0.0), 5.0) * ${f(TUNING.FRESNEL_STRENGTH)};

    // Analytic dark environment: one restrained bright reflection band.
    vec3 R = reflect(-V, N);
    float band = smoothstep(0.05, 0.45, R.y) * (1.0 - smoothstep(0.45, 0.95, R.y));
    vec3 env = vec3(0.30, 0.36, 0.46) * band * 0.7;

    vec3 chrome = vec3(0.78, 0.85, 1.0);

    // Dark steel floor so an edge still reads as METAL where no specular
    // lands. Without it the wireframe is black except at pinpoint highlights
    // and reads as glitter rather than topology. u_colorScale keeps the
    // filled surface far darker than the edges.
    vec3 col = vec3(0.085, 0.10, 0.135)
             + chrome * sharp
             + chrome * broad
             + vec3(0.34, 0.42, 0.58) * fres
             + env;

    col *= u_colorScale;
    col = min(col, vec3(${f(TUNING.CLAMP_MAX)}));

    // Anatomy gates visibility: hair, beard and hoodie stay near-black.
    float anat = clamp(0.04 + v_feature, 0.0, 1.0);
    float alpha = clamp(v_field * v_mask * anat * u_alphaScale, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ===========================================================================
 * CPU PREPROCESSING
 * ==========================================================================*/

type Fields = {
  depth: Float32Array;
  feature: Float32Array;
  mask: Float32Array;
  /** Feature-weighted gradient magnitude; vertices relax onto its maxima. */
  ridge: Float32Array;
};

type MeshData = {
  vertices: Float32Array;
  triIndices: Uint16Array;
  edgeIndices: Uint16Array;
  vertexCount: number;
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function smootherstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

const gauss = (x: number, c: number, w: number) => {
  const t = (x - c) / w;
  return Math.exp(-t * t);
};

/** Deterministic, frame-stable hash. */
function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** Separable box blur, in place. Result ends up back in `src`. */
function boxBlur(src: Float32Array, w: number, h: number, r: number, passes: number) {
  const tmp = new Float32Array(src.length);
  const inv = 1 / (2 * r + 1);

  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += src[row + clamp(i, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = acc * inv;
        acc += src[row + clamp(x + r + 1, 0, w - 1)] - src[row + clamp(x - r, 0, w - 1)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += tmp[clamp(i, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        src[y * w + x] = acc * inv;
        acc +=
          tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
      }
    }
  }
  return src;
}

function sample(arr: Float32Array, u: number, v: number) {
  const x = clamp(u * (FIELD_W - 1), 0, FIELD_W - 1.001);
  const y = clamp(v * (FIELD_H - 1), 0, FIELD_H - 1.001);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, FIELD_W - 1);
  const y1 = Math.min(y0 + 1, FIELD_H - 1);
  const fx = x - x0;
  const fy = y - y0;
  const a = arr[y0 * FIELD_W + x0];
  const b = arr[y0 * FIELD_W + x1];
  const c = arr[y1 * FIELD_W + x0];
  const d = arr[y1 * FIELD_W + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/**
 * Turn the portrait into depth / feature-weight / subject-mask / ridge fields.
 * Runs exactly once, when the image loads.
 */
function analyze(
  img: HTMLImageElement,
  uvOffset: [number, number],
  uvScale: [number, number],
): Fields | null {
  const cv = document.createElement('canvas');
  cv.width = FIELD_W;
  cv.height = FIELD_H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Draw through the same cover-fit crop the shaders use, so fields, photo
  // pass and mesh all share one framing.
  ctx.drawImage(
    img,
    uvOffset[0] * img.width,
    uvOffset[1] * img.height,
    uvScale[0] * img.width,
    uvScale[1] * img.height,
    0,
    0,
    FIELD_W,
    FIELD_H,
  );

  const data = ctx.getImageData(0, 0, FIELD_W, FIELD_H).data;
  const n = FIELD_W * FIELD_H;

  // --- subject mask -------------------------------------------------------
  // The alpha channel is uniformly opaque, so the silhouette is recovered by
  // flood-filling the baked checkerboard inward from the border. Flood fill
  // (rather than a plain threshold) means bright neutral pixels INSIDE the
  // face - a nose specular, say - are never mistaken for background.
  const bgCandidate = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx > 0.001 ? (mx - mn) / mx : 0;
    bgCandidate[i] =
      mx > FACE_REGION.BG_LUMA_MIN && sat < FACE_REGION.BG_SAT_MAX ? 1 : 0;
  }

  const mask = new Float32Array(n);
  mask.fill(1);
  const seen = new Uint8Array(n);
  const stack: number[] = [];

  const seed = (i: number) => {
    if (!seen[i] && bgCandidate[i]) {
      seen[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < FIELD_W; x++) {
    seed(x);
    seed((FIELD_H - 1) * FIELD_W + x);
  }
  for (let y = 0; y < FIELD_H; y++) {
    seed(y * FIELD_W);
    seed(y * FIELD_W + FIELD_W - 1);
  }
  while (stack.length) {
    const i = stack.pop() as number;
    mask[i] = 0;
    const x = i % FIELD_W;
    const y = (i - x) / FIELD_W;
    if (x > 0) seed(i - 1);
    if (x < FIELD_W - 1) seed(i + 1);
    if (y > 0) seed(i - FIELD_W);
    if (y < FIELD_H - 1) seed(i + FIELD_W);
  }

  // Erode a few pixels to eat the anti-aliased cut-out halo, which is bright
  // enough to survive the grade as a glowing outline, then feather so the
  // silhouette does not read as a hard stencil.
  const eroded = new Float32Array(n);
  for (let pass = 0; pass < 3; pass++) {
    eroded.set(mask);
    for (let y = 1; y < FIELD_H - 1; y++) {
      for (let x = 1; x < FIELD_W - 1; x++) {
        const i = y * FIELD_W + x;
        if (
          mask[i - 1] === 0 ||
          mask[i + 1] === 0 ||
          mask[i - FIELD_W] === 0 ||
          mask[i + FIELD_W] === 0
        ) {
          eroded[i] = 0;
        }
      }
    }
    mask.set(eroded);
  }
  boxBlur(mask, FIELD_W, FIELD_H, 2, 1);

  // --- luminance ----------------------------------------------------------
  const luma = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;

    let l = 0.299 * r + 0.587 * g + 0.114 * b;

    // Blue-LED / saturation suppression: saturated pixels must not become
    // artificial depth structure.
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx > 0.001 ? (mx - mn) / mx : 0;
    const blueDom = clamp((b - Math.max(r, g)) * 2.5, 0, 1);
    l *= 1 - clamp(sat * 0.55 + blueDom * 0.85, 0, 1);

    luma[i] = l * mask[i];
  }

  // Kill hair / beard / pore noise; keep brow, eye, nose, cheek, lip, jaw.
  boxBlur(luma, FIELD_W, FIELD_H, 3, 3);

  const [fcx, fcy] = FACE_REGION.FACE_MASK_CENTER;
  const [frx, fry] = FACE_REGION.FACE_MASK_RADIUS;
  const [elx, ely] = FACE_REGION.EYE_LEFT;
  const [erx, ery] = FACE_REGION.EYE_RIGHT;
  const B = FACE_REGION.FEATURE_BANDS;

  const faceMask = new Float32Array(n);
  const volume = new Float32Array(n);
  const feature = new Float32Array(n);

  for (let y = 0; y < FIELD_H; y++) {
    const v = y / (FIELD_H - 1);
    for (let x = 0; x < FIELD_W; x++) {
      const u = x / (FIELD_W - 1);
      const i = y * FIELD_W + x;

      const du = (u - fcx) / frx;
      const dv = (v - fcy) / fry;
      const d = Math.sqrt(du * du + dv * dv);

      // Wide falloff so the mesh dissolves gradually instead of ending on a
      // visible oval boundary.
      const fm = 1 - smootherstep(0.55, 1.4, d);
      faceMask[i] = fm;
      // Broad, low-frequency volume, deliberately gentle so it never reads as
      // a smooth chrome bust.
      volume[i] = Math.pow(Math.max(0, 1 - d * d), 0.6) * fm;

      // Anatomical bands.
      let anat =
        1.0 * gauss(v, B.brow, 0.03) +
        1.1 * gauss(v, B.eye, 0.03) +
        0.85 * gauss(v, B.nose, 0.035) +
        1.0 * gauss(v, B.lip, 0.03) +
        0.7 * gauss(v, B.jaw, 0.04) +
        0.6 * gauss(v, B.chin, 0.035);

      // Nose bridge: vertical ridge between brow and nose tip.
      anat +=
        0.6 *
        gauss(u, 0.5, 0.045) *
        smootherstep(B.brow - 0.03, B.eye, v) *
        (1 - smootherstep(B.nose, B.nose + 0.06, v));

      // Eye contours.
      anat +=
        0.9 *
        (gauss(u, elx, 0.075) * gauss(v, ely, 0.045) +
          gauss(u, erx, 0.075) * gauss(v, ery, 0.045));

      // A solid base across the whole face oval so the mesh describes the
      // entire face, with the bands adding emphasis on top. `fm` is what
      // keeps hair, beard and hoodie dark.
      feature[i] = fm * clamp(0.55 + anat * 0.45, 0, 1);
    }
  }

  // Normalize relief inside the face so RELIEF_W stays meaningful.
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < n; i++) {
    if (faceMask[i] > 0.3) {
      if (luma[i] < lo) lo = luma[i];
      if (luma[i] > hi) hi = luma[i];
    }
  }
  const span = hi - lo > 1e-4 ? hi - lo : 1;

  const depth = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const relief = clamp((luma[i] - lo) / span, 0, 1) * faceMask[i];
    depth[i] = TUNING.VOLUME_W * volume[i] + TUNING.RELIEF_W * relief;
  }
  boxBlur(depth, FIELD_W, FIELD_H, 2, 1);

  // Ridge field: where blurred luminance changes fastest, weighted by anatomy.
  // Relaxing vertices toward its maxima lands them on real facial contours.
  const ridge = new Float32Array(n);
  for (let y = 0; y < FIELD_H; y++) {
    for (let x = 0; x < FIELD_W; x++) {
      const i = y * FIELD_W + x;
      const gx =
        luma[y * FIELD_W + clamp(x + 1, 0, FIELD_W - 1)] -
        luma[y * FIELD_W + clamp(x - 1, 0, FIELD_W - 1)];
      const gy =
        luma[clamp(y + 1, 0, FIELD_H - 1) * FIELD_W + x] -
        luma[clamp(y - 1, 0, FIELD_H - 1) * FIELD_W + x];
      ridge[i] = Math.sqrt(gx * gx + gy * gy) * feature[i];
    }
  }
  boxBlur(ridge, FIELD_W, FIELD_H, 2, 1);

  return { depth, feature, mask, ridge };
}

/**
 * Offset-row triangular lattice: culled to the subject, deterministically
 * jittered, then relaxed onto facial contours.
 */
function buildMesh(fields: Fields, cols: number): MeshData {
  const cellW = 1 / cols;
  // Row height chosen so triangles are equilateral in SCREEN space.
  const rowH = cellW * CONTAINER_ASPECT * (Math.sqrt(3) / 2);
  const rows = Math.ceil(1 / rowH) + 1;
  const nCols = cols + 2;
  const count = (rows + 1) * nCols;

  const ux = new Float32Array(count);
  const vy = new Float32Array(count);

  for (let r = 0; r <= rows; r++) {
    const offset = r % 2 === 1 ? cellW * 0.5 : 0;
    for (let c = 0; c < nCols; c++) {
      const i = r * nCols + c;
      const jx = (hash2(c, r) - 0.5) * 2 * TUNING.JITTER * cellW;
      const jy = (hash2(c + 37.1, r + 11.7) - 0.5) * 2 * TUNING.JITTER * rowH;
      ux[i] = c * cellW - cellW * 0.5 + offset + jx;
      vy[i] = r * rowH + jy;
    }
  }

  // Relax toward ridge maxima so edges settle on brow, eyelids, nose bridge,
  // lips and jaw rather than forming a mathematical lattice.
  const origU = Float32Array.from(ux);
  const origV = Float32Array.from(vy);
  const eu = 2 / FIELD_W;
  const ev = 2 / FIELD_H;
  const maxU = TUNING.RELAX_MAX * cellW;
  const maxV = TUNING.RELAX_MAX * rowH;

  for (let it = 0; it < TUNING.RELAX_ITERATIONS; it++) {
    for (let i = 0; i < count; i++) {
      const u = ux[i];
      const v = vy[i];
      const w = sample(fields.feature, u, v);
      if (w < 0.05) continue;

      const gu = sample(fields.ridge, u + eu, v) - sample(fields.ridge, u - eu, v);
      const gv = sample(fields.ridge, u, v + ev) - sample(fields.ridge, u, v - ev);
      const len = Math.sqrt(gu * gu + gv * gv);
      if (len < 1e-7) continue;

      const step = TUNING.RELAX_STEP * w;
      let nu = u + (gu / len) * step * cellW;
      let nv = v + (gv / len) * step * rowH;

      // Never drift far from the lattice: the topology must stay coherent.
      const du = nu - origU[i];
      const dv = nv - origV[i];
      if (Math.abs(du) > maxU) nu = origU[i] + Math.sign(du) * maxU;
      if (Math.abs(dv) > maxV) nv = origV[i] + Math.sign(dv) * maxV;

      ux[i] = nu;
      vy[i] = nv;
    }
  }

  // Interleaved: pos(2) uv(2) normal(3) feature(1) mask(1)
  const vertices = new Float32Array(count * VERTEX_STRIDE);
  const maskAt = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const u = ux[i];
    const v = vy[i];

    // Depth gradient per unit UV.
    const gu = (sample(fields.depth, u + eu, v) - sample(fields.depth, u - eu, v)) / (2 * eu);
    const gv = (sample(fields.depth, u, v + ev) - sample(fields.depth, u, v - ev)) / (2 * ev);

    // Screen space is x in [0, aspect], y in [0, 1]; surface point is
    // (u, -v, depth), so v grows downward while world y grows up.
    let nx = (-gu / CONTAINER_ASPECT) * TUNING.NORMAL_STRENGTH;
    let ny = gv * TUNING.NORMAL_STRENGTH;
    let nz = 1;
    const inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    nx *= inv;
    ny *= inv;
    nz *= inv;

    const m = sample(fields.mask, u, v);
    maskAt[i] = m;

    const o = i * VERTEX_STRIDE;
    vertices[o] = u * 2 - 1;
    vertices[o + 1] = 1 - v * 2;
    vertices[o + 2] = u;
    vertices[o + 3] = v;
    vertices[o + 4] = nx;
    vertices[o + 5] = ny;
    vertices[o + 6] = nz;
    vertices[o + 7] = sample(fields.feature, u, v);
    vertices[o + 8] = m;
  }

  const tris: number[] = [];
  const edgeSet = new Set<number>();

  const addEdge = (a: number, b: number) => {
    edgeSet.add(a < b ? a * count + b : b * count + a);
  };
  const addTri = (a: number, b: number, c: number) => {
    // Cull only where the whole triangle is off-subject; boundary triangles
    // are kept so the silhouette stays clean.
    if (maskAt[a] < 0.5 && maskAt[b] < 0.5 && maskAt[c] < 0.5) return;
    tris.push(a, b, c);
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < nCols - 1; c++) {
      const a = r * nCols + c;
      const b = a + 1;
      const d = (r + 1) * nCols + c;
      const e = d + 1;
      if (r % 2 === 0) {
        addTri(a, d, b); // next row shifted right
        addTri(d, e, b);
      } else {
        addTri(a, e, b); // next row shifted left
        addTri(a, d, e);
      }
    }
  }

  const edgeIndices = new Uint16Array(edgeSet.size * 2);
  let ei = 0;
  edgeSet.forEach((key) => {
    edgeIndices[ei++] = Math.floor(key / count);
    edgeIndices[ei++] = key % count;
  });

  return {
    vertices,
    triIndices: Uint16Array.from(tris),
    edgeIndices,
    vertexCount: count,
  };
}

/* ===========================================================================
 * COMPONENT
 * ==========================================================================*/

export function InteractiveFace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  // All interaction state lives in refs: pointer movement never re-renders.
  const target = useRef<[number, number]>([DEFAULT_LIGHT[0], DEFAULT_LIGHT[1]]);
  const smooth = useRef<[number, number]>([DEFAULT_LIGHT[0], DEFAULT_LIGHT[1]]);
  const light = useRef<[number, number]>([DEFAULT_LIGHT[0], DEFAULT_LIGHT[1]]);
  const active = useRef(false);
  const energy = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const glCtx = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!glCtx) {
      setFailed(true);
      return;
    }
    // Declared non-nullable so narrowing survives into the hoisted frame().
    const gl: WebGLRenderingContext = glCtx;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const mobileMQ = window.matchMedia('(max-width: 767px)');

    const shaders: WebGLShader[] = [];
    const programs: WebGLProgram[] = [];
    const buffers: WebGLBuffer[] = [];

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('InteractiveFace: shader compile failed', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      shaders.push(sh);
      return sh;
    };

    const link = (vsSrc: string, fsSrc: string) => {
      const vs = compile(gl.VERTEX_SHADER, vsSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const p = gl.createProgram();
      if (!p) return null;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('InteractiveFace: program link failed', gl.getProgramInfoLog(p));
        gl.deleteProgram(p);
        return null;
      }
      programs.push(p);
      return p;
    };

    const photoProg = link(PHOTO_VS, PHOTO_FS);
    const meshProg = link(MESH_VS, MESH_FS);
    if (!photoProg || !meshProg) {
      programs.forEach((p) => gl.deleteProgram(p));
      shaders.forEach((s) => gl.deleteShader(s));
      setFailed(true);
      return;
    }

    const attrib = (loc: number, size: number, stride: number, offset: number) => {
      if (loc < 0) return;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    };

    /* --- photo pass ------------------------------------------------------ */
    const quad = gl.createBuffer();
    if (quad) buffers.push(quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      // clip xy, container uv (v down)
      new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW,
    );

    const pPos = gl.getAttribLocation(photoProg, 'a_pos');
    const pUv = gl.getAttribLocation(photoProg, 'a_uv');
    const uImage = gl.getUniformLocation(photoProg, 'u_image');
    const uMask = gl.getUniformLocation(photoProg, 'u_mask');
    const uUvScale = gl.getUniformLocation(photoProg, 'u_uvScale');
    const uUvOffset = gl.getUniformLocation(photoProg, 'u_uvOffset');
    const uGrade = gl.getUniformLocation(photoProg, 'u_grade');

    /* --- mesh pass ------------------------------------------------------- */
    const mPos = gl.getAttribLocation(meshProg, 'a_pos');
    const mUv = gl.getAttribLocation(meshProg, 'a_uv');
    const mNormal = gl.getAttribLocation(meshProg, 'a_normal');
    const mFeature = gl.getAttribLocation(meshProg, 'a_feature');
    const mMask = gl.getAttribLocation(meshProg, 'a_mask');

    const uTrail = gl.getUniformLocation(meshProg, 'u_trail');
    const uEnergy = gl.getUniformLocation(meshProg, 'u_energy');
    const uAmbient = gl.getUniformLocation(meshProg, 'u_ambient');
    const uDisplace = gl.getUniformLocation(meshProg, 'u_displace');
    const uAspect = gl.getUniformLocation(meshProg, 'u_aspect');
    const uPointSize = gl.getUniformLocation(meshProg, 'u_pointSize');
    const uLight = gl.getUniformLocation(meshProg, 'u_light');
    const uColorScale = gl.getUniformLocation(meshProg, 'u_colorScale');
    const uAlphaScale = gl.getUniformLocation(meshProg, 'u_alphaScale');

    /* --- texture ---------------------------------------------------------- */
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // CPU-derived subject mask, uploaded once preprocessing completes.
    const maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      1,
      1,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uploadMask = (m: Float32Array) => {
      const bytes = new Uint8Array(m.length);
      for (let i = 0; i < m.length; i++) bytes[i] = Math.round(clamp(m[i], 0, 1) * 255);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        FIELD_W,
        FIELD_H,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        bytes,
      );
    };

    /* --- mutable state ---------------------------------------------------- */
    let vbo: WebGLBuffer | null = null;
    let triIbo: WebGLBuffer | null = null;
    let edgeIbo: WebGLBuffer | null = null;
    let triCount = 0;
    let edgeCount = 0;
    let vertCount = 0;
    let meshReady = false;
    let fields: Fields | null = null;
    let aspect = CONTAINER_ASPECT;
    let dpr = 1;
    let disposed = false;
    let visible = true;
    let running = false;
    let raf = 0;

    let uvScale: [number, number] = [1, 1];
    let uvOffset: [number, number] = [0, 0];

    const trailPts: { x: number; y: number; t: number }[] = [];
    const trailData = new Float32Array(TRAIL_N * 3);
    const lightData = new Float32Array(3);

    const requestRender = () => {
      if (disposed || !visible || running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
    };

    /* --- sizing ------------------------------------------------------------ */
    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      aspect = rect.width / rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
      requestRender();
    };

    /* --- mesh -------------------------------------------------------------- */
    const rebuildMesh = () => {
      if (!fields) return;
      const cols = mobileMQ.matches
        ? TUNING.MESH_COLUMNS_MOBILE
        : TUNING.MESH_COLUMNS_DESKTOP;
      const mesh = buildMesh(fields, cols);

      if (!vbo) {
        vbo = gl.createBuffer();
        if (vbo) buffers.push(vbo);
      }
      if (!triIbo) {
        triIbo = gl.createBuffer();
        if (triIbo) buffers.push(triIbo);
      }
      if (!edgeIbo) {
        edgeIbo = gl.createBuffer();
        if (edgeIbo) buffers.push(edgeIbo);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triIbo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.triIndices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeIbo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.edgeIndices, gl.STATIC_DRAW);

      triCount = mesh.triIndices.length;
      edgeCount = mesh.edgeIndices.length;
      vertCount = mesh.vertexCount;
      meshReady = true;
      requestRender();
    };

    /* --- asset -------------------------------------------------------------- */
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => {
      if (disposed) return;

      // Cover-fit: match width, crop height, biased toward the top so the face
      // is kept and hoodie is shed. Shared by fields, photo pass and mesh.
      const srcAspect = img.width / img.height;
      if (srcAspect < CONTAINER_ASPECT) {
        const visibleV = srcAspect / CONTAINER_ASPECT;
        uvScale = [1, visibleV];
        uvOffset = [0, (1 - visibleV) * FACE_REGION.CROP_TOP_BIAS];
      } else {
        const visibleU = CONTAINER_ASPECT / srcAspect;
        uvScale = [visibleU, 1];
        uvOffset = [(1 - visibleU) * 0.5, 0];
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      fields = analyze(img, uvOffset, uvScale);
      if (fields) {
        uploadMask(fields.mask);
        rebuildMesh();
      }
      requestRender();
    };
    img.onerror = () => {
      if (!disposed) setFailed(true);
    };
    img.src = PORTRAIT_SRC;

    /* --- trail --------------------------------------------------------------- */
    const pushTrail = (x: number, y: number, t: number) => {
      const last = trailPts[trailPts.length - 1];
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        if (dx * dx + dy * dy < 0.0004) return; // sample on real movement only
      }
      trailPts.push({ x, y, t });
      if (trailPts.length > TRAIL_N) trailPts.shift();
    };

    /* --- draw helper ---------------------------------------------------------- */
    const drawPart = (
      ibo: WebGLBuffer | null,
      mode: number,
      count: number,
      colorScale: number,
      alphaScale: number,
      additive: boolean,
    ) => {
      if (!ibo || count === 0) return;
      gl.blendFunc(gl.SRC_ALPHA, additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(uColorScale, colorScale);
      gl.uniform1f(uAlphaScale, alphaScale);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.drawElements(mode, count, gl.UNSIGNED_SHORT, 0);
    };

    /* --- frame ---------------------------------------------------------------- */
    function frame(now: number) {
      if (disposed) return;

      if (!reduceMotion && coarse && !active.current) {
        // Touch device with no touch yet: an extremely slow autonomous light so
        // the hero is never visually dead. Light only, never deformation.
        const t = now * 0.001;
        target.current[0] = 0.5 + 0.2 * Math.sin(t * 0.21);
        target.current[1] = 0.46 + 0.14 * Math.sin(t * 0.29 + 1.1);
        pushTrail(target.current[0], target.current[1], now);
      }

      const ease = reduceMotion ? 1 : 0.18;
      smooth.current[0] += (target.current[0] - smooth.current[0]) * ease;
      smooth.current[1] += (target.current[1] - smooth.current[1]) * ease;

      const lightTarget = active.current || coarse ? smooth.current : DEFAULT_LIGHT;
      const lEase = reduceMotion ? 1 : 0.06;
      light.current[0] += (lightTarget[0] - light.current[0]) * lEase;
      light.current[1] += (lightTarget[1] - light.current[1]) * lEase;

      const energyTarget = reduceMotion ? 0 : active.current ? 1 : coarse ? 0.7 : 0;
      energy.current += (energyTarget - energy.current) * 0.08;

      // Newest slot always tracks the smoothed cursor exactly.
      trailData[0] = smooth.current[0];
      trailData[1] = smooth.current[1];
      trailData[2] = 1;
      for (let i = 1; i < TRAIL_N; i++) {
        const p = trailPts[trailPts.length - i];
        if (p) {
          const k = Math.max(0, 1 - (now - p.t) / TRAIL_DECAY_MS);
          trailData[i * 3] = p.x;
          trailData[i * 3 + 1] = p.y;
          trailData[i * 3 + 2] = k * k * 0.8;
        } else {
          trailData[i * 3] = -1;
          trailData[i * 3 + 1] = -1;
          trailData[i * 3 + 2] = 0;
        }
      }

      gl.clearColor(0.0196, 0.0196, 0.0235, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);

      // PASS 1 - graded portrait substrate
      gl.useProgram(photoProg);
      gl.disable(gl.BLEND);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      attrib(pPos, 2, 16, 0);
      attrib(pUv, 2, 16, 8);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uImage, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.uniform1i(uMask, 1);
      gl.uniform2f(uUvScale, uvScale[0], uvScale[1]);
      gl.uniform2f(uUvOffset, uvOffset[0], uvOffset[1]);
      gl.uniform1f(uGrade, TUNING.PHOTO_GRADE);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // PASS 2 - dark chrome facial mesh
      if (meshReady && vbo) {
        gl.useProgram(meshProg);
        gl.enable(gl.BLEND);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        const S = VERTEX_STRIDE * 4;
        attrib(mPos, 2, S, 0);
        attrib(mUv, 2, S, 8);
        attrib(mNormal, 3, S, 16);
        attrib(mFeature, 1, S, 28);
        attrib(mMask, 1, S, 32);

        gl.uniform3fv(uTrail, trailData);
        gl.uniform1f(uEnergy, energy.current);
        gl.uniform1f(uAmbient, TUNING.ENERGY_FLOOR);
        gl.uniform1f(uDisplace, reduceMotion ? 0 : TUNING.DISPLACE);
        gl.uniform1f(uAspect, aspect);
        gl.uniform1f(uPointSize, Math.max(1, Math.round(dpr)));

        lightData[0] = light.current[0];
        lightData[1] = light.current[1];
        lightData[2] = LIGHT_HEIGHT;
        gl.uniform3fv(uLight, lightData);

        // Hierarchy: dark filled surface, brighter edges, sharp vertex accents.
        drawPart(triIbo, gl.TRIANGLES, triCount, TUNING.SURFACE_STRENGTH, 0.5, false);
        drawPart(edgeIbo, gl.LINES, edgeCount, TUNING.EDGE_STRENGTH, 1.0, true);

        // Vertices are accents only - kept small and dim so the mesh reads as
        // topology rather than glitter.
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.uniform1f(uColorScale, TUNING.POINT_STRENGTH);
        gl.uniform1f(uAlphaScale, 0.2);
        gl.drawArrays(gl.POINTS, 0, vertCount);
      }

      // Settle: stop the loop entirely when nothing is changing.
      const settling =
        Math.abs(target.current[0] - smooth.current[0]) > 0.0005 ||
        Math.abs(target.current[1] - smooth.current[1]) > 0.0005 ||
        Math.abs(lightTarget[0] - light.current[0]) > 0.0005 ||
        Math.abs(lightTarget[1] - light.current[1]) > 0.0005 ||
        Math.abs(energyTarget - energy.current) > 0.002 ||
        (coarse && !reduceMotion);

      if (settling && !reduceMotion) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    /* --- pointer -------------------------------------------------------------- */
    const toUv = (e: PointerEvent): [number, number] | null => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return [
        clamp((e.clientX - rect.left) / rect.width, 0, 1),
        clamp((e.clientY - rect.top) / rect.height, 0, 1),
      ];
    };

    const onMove = (e: PointerEvent) => {
      if (reduceMotion) return;
      const p = toUv(e);
      if (!p) return;
      target.current[0] = p[0];
      target.current[1] = p[1];
      active.current = true;
      pushTrail(p[0], p[1], performance.now());
      requestRender();
    };
    const onEnter = () => {
      if (reduceMotion) return;
      active.current = true;
      requestRender();
    };
    const onLeave = () => {
      active.current = false;
      requestRender();
    };

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerdown', onMove);
    container.addEventListener('pointerenter', onEnter);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('pointercancel', onLeave);

    /* --- lifecycle ------------------------------------------------------------- */
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) requestRender();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(container);

    const onVisibility = () => {
      if (document.hidden) stop();
      else requestRender();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onMobileChange = () => rebuildMesh();
    mobileMQ.addEventListener('change', onMobileChange);

    resize();

    return () => {
      disposed = true;
      stop();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerdown', onMove);
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointercancel', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      mobileMQ.removeEventListener('change', onMobileChange);
      io.disconnect();
      ro.disconnect();
      img.onload = null;
      img.onerror = null;
      buffers.forEach((b) => gl.deleteBuffer(b));
      programs.forEach((p) => gl.deleteProgram(p));
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteTexture(texture);
      gl.deleteTexture(maskTex);
      // No WEBGL_lose_context: the normal browser lifecycle destroys the context.
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[400px] aspect-[3/4] mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-border bg-[#050506]"
    >
      {failed ? (
        <>
          <Image
            src={PORTRAIT_SRC}
            alt="Sarthak Roy"
            fill
            sizes="(max-width: 1024px) 400px, 33vw"
            className="object-cover grayscale contrast-125 brightness-[0.32] saturate-0"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 45%, rgba(5,5,6,0) 30%, rgba(5,5,6,0.85) 72%, #050506 100%)',
            }}
          />
        </>
      ) : (
        <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      )}
    </div>
  );
}
