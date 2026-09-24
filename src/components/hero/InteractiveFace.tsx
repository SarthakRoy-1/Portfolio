'use client';

import { useEffect, useRef, useState } from 'react';

/* ===========================================================================
 * ROBOTIC REVEAL — THERMAL EROSION (boundary-fidelity pass)
 *
 * Same model as before, unchanged in concept: RESISTANCE is a fixed
 * multi-octave noise field baked once at mount; EROSION is a per-cell
 * accumulator that only ever grows, near wherever the cursor has dwelled.
 * A cell reveals once erosion exceeds resistance there. This pass only
 * touches how that boundary is rendered, not the model itself:
 *
 *   - The grid is ~2.9x denser (280x373 vs. the previous 140x187) so the
 *     edge holds up at 2x inspection instead of reading as blocky. Cost is
 *     kept flat by only ever rebuilding the small dirty rectangle around the
 *     cursor's current heat footprint each frame (a fixed-size region
 *     regardless of grid resolution), not the whole grid - the one exception
 *     is the single full-grid pass on first load and on resize.
 *   - The resistance field is three fixed noise layers (macro / medium /
 *     fine), each sized and scaled relative to the burn radius (see
 *     RESISTANCE_LAYERS) and baked once, so the boundary carries real detail
 *     at three scales instead of one smooth wobble. The erosion field itself
 *     is untouched - this only changes where "erosion > resistance" lands.
 *   - The reveal, glow and char bands are all narrower in field-units than
 *     before, so they hug the actual zero-crossing instead of reading as a
 *     wide outline.
 *   - The char band no longer paints a flat brown - it samples the
 *     portrait's own pixels (captured once, at grid resolution, right after
 *     it loads) and darkens/warms THAT color, so the scorched edge is always
 *     some darker, warmer version of whatever was actually there (hair,
 *     skin, beard), not a decal.
 *   - The glow is now small and biased to sit almost entirely on the
 *     still-human side of the boundary, fading out within a cell or two of
 *     the reveal - the robot's own pixels are never recolored.
 *   - Edge realism (writeCell): a windowed scallop offset (EDGE_DETAIL_*)
 *     shapes where the edge lands - rounded bites + short cusps at two
 *     sizes, unevenly strong along the edge - without touching the
 *     resistance field or the interior. The scorch is thickest at the cut,
 *     varies in width along it, grades into skin through a soft halo and
 *     blackens toward the cut; a cast shadow of the remaining skin (the one place the
 *     robot's pixels are darkened, source-atop so it never leaves the
 *     robot) makes the skin read as having thickness.
 *   - BURNING THROUGH (writeCell/advanceBurn), all derived from the same
 *     field - nothing is an overlay: (1) the DRAWN field burnVis chases the
 *     true field (erosion - resistance), so the core opens on the first frame
 *     and the rim keeps developing for a few tenths of a second (char forming,
 *     thin skin peeling back, some pieces outlasting their neighbours); the
 *     final state is exactly the true field's. (2) Past the contour the skin
 *     thins out over a per-location span as a scorched film instead of
 *     stopping at a line (the contour, mask = 0.5, does not move, so opening
 *     size is unchanged). (3) Sparse secondary pockets near the front: HOLES
 *     burn through slightly ahead of it (leaving a thin bridge), SURVIVORS
 *     outlast it and disappear as the burn progresses. (4) Scorch: solid dark
 *     core (variable width) -> soft halo, blackening toward the cut; sparse
 *     lifted "curl" lips catch the light; still-burning cells glow faintly.
 *   - STRUCTURE (writeCell): sparse long SHEETS (tapered, curving remnants
 *     that stay attached at their base, found by sampling noise where the
 *     burn normal meets the contour, sheared by a slow curvature) and FOLDS
 *     (thin flaps lying along the boundary behind a gap). Lifted parts are
 *     thin (a little dark robot shows through), their outlines get the lip
 *     treatment, and a CAVITY layer darkens the robot beside them. Together
 *     with the cast shadow of the remaining skin this gives depth. All of it
 *     is visual: it never touches the erosion field, so the underlying
 *     contour is exactly what deposition and resistance decide.
 *   - INTERACTION: IDLE -> BURNING -> EXPOSED -> RESTORING -> IDLE. A click
 *     with nothing exposed burns at the click over ~1s; a click with anything
 *     exposed restores over ~0.8s (the erosion field is scaled back to zero,
 *     each cell at its own pace, and everything is reset). Dwell and click
 *     heat reach a direction-dependent distance (ANISO_*), so a stationary or
 *     clicked burn never converges on a circle.
 *   - (Removed: velocity-elongated footprints. Oriented per-sample ellipses
 *     built from a noisy segment/dt velocity read as stamps; the swept path
 *     itself now supplies the elongation.)
 *
 * INPUT PIPELINE (raw pointer -> heat):
 * depositPath() is the one place heat is deposited from real input. Heat
 * along a moved segment is a function of DISTANCE TRAVELLED as well as time:
 * a segment is charged max(elapsedTime, length / equivalent-speed), so a
 * fast flick deposits exactly as much heat per pixel of path as a slow one
 * instead of ~nothing (a purely time-budgeted deposit is sub-threshold
 * everywhere the cursor didn't linger, which is what produced isolated
 * "islands" at dwell points). The segment is subdivided into stamps no
 * farther apart than a fraction of the burn radius, so consecutive stamps
 * overlap and sum to one continuous scalar field - there is no per-stamp
 * threshold, the threshold is applied once, to the accumulated field.
 * A stationary cursor (zero-length segment) is pure time-based dwell.
 * Every pointermove reads all event.getCoalescedEvents() samples (falling
 * back to the event itself), in order, from the RAW client coordinates.
 *
 * COMPOSITING: there is exactly one mask (eraseCanvas, alpha = reveal
 * amount m per cell). The same canvas is drawn twice with the same
 * transform - human x (1 - m) via destination-out, robot x m via
 * destination-in - and the two premultiplied layers are summed, so
 *   result = background + human*(1-m) + robot*m
 * Where m = 1 but the robot PNG is transparent the result is the page
 * background; the human is never restored by a transparent robot pixel, and
 * the robot never shows where m = 0.
 * ==========================================================================*/

const PORTRAIT_SRC = '/portrait-hero.png';
const ROBOT_SRC = '/Terminator-final-2.png';
const OBJECT_POSITION_X = 0.5;
const OBJECT_POSITION_Y = 0.2;

const GRID_W = 280;
const GRID_H = Math.round((GRID_W * 4) / 3);

const TUNING = {
  /** Cursor influence radius, as a fraction of container width. */
  BURN_RADIUS_FRAC: 0.18,
  /** Erosion units/second added at the cursor's exact center; falls off
   *  smoothly to 0 at BURN_RADIUS_FRAC. */
  BURN_RATE: 1.3,
  /** Resistance = mean + three fixed noise layers (see RESISTANCE_LAYERS),
   *  clamped to this range. The max stays below TRAVEL_CENTER_EROSION so the
   *  centerline of any path always opens whatever the noise does. */
  RESISTANCE_MEAN: 0.5,
  RESISTANCE_MIN: 0.1,
  RESISTANCE_MAX: 0.86,
  /** Boundary irregularity, in the units the boundary is judged in. Near a
   *  path's edge the erosion field falls off at ~1/R per unit distance, so a
   *  resistance offset of d moves the boundary by ~d*R: `sigma` is therefore
   *  both the std-dev of that layer's resistance AND how far, as a fraction
   *  of the burn radius R, it typically shifts the edge.
   *    wavelength - feature size, as a multiple of R
   *    angle      - lattice rotation, so no two layers share an axis
   *    warp       - domain warp of the lookup, in wavelengths, so the lattice
   *                 of the value noise never shows
   *  macro  ~10% R: broad undulations   medium ~5% R: lobes, tongues, notches
   *  fine   ~2% R: edge breakup
   *  Fixed seeds, baked once - the same place always has the same material. */
  RESISTANCE_LAYERS: [
    { wavelength: 1.15, sigma: 0.1, seed: 1337, angle: 0.55, warp: 0.5 },
    { wavelength: 0.36, sigma: 0.05, seed: 7919, angle: 1.9, warp: 0.6 },
    { wavelength: 0.1, sigma: 0.022, seed: 104729, angle: 2.65, warp: 0.8 },
  ],
  /** Half-width of the human/robot alpha transition, in erosion-field units
   *  (~= fraction of R). Kept small so fine breakup in the field survives
   *  into the rendered edge instead of being blurred away. */
  EDGE_SOFTNESS: 0.012,
  /** Thin warm highlight right at the boundary, biased onto the still-human
   *  side so it never recolors the robot itself. */
  GLOW_BAND: 0.045,
  GLOW_INTENSITY: 0.26,
  /** Narrow scorched band, hugging the boundary from the human side. */
  CHAR_BAND: 0.05,
  CHAR_INTENSITY: 0.92,
  /** How much the char band darkens the portrait's own local color. */
  CHAR_DARKEN: 0.38,
  /** How far that darkened local color is pulled toward a warm brown. */
  CHAR_WARM_MIX: 0.3,
  /** Soft darkening that fades out over this multiple of the char band, so
   *  skin grades into the scorch instead of stopping at a line. */
  CHAR_HALO_SPAN: 4.5,
  CHAR_HALO_INTENSITY: 0.36,
  /** How far the innermost edge of the char is pulled toward charcoal. */
  CHAR_BLACKEN: 0.88,
  /** Shadow cast onto the robot by the thickness of the skin edge: a narrow
   *  near-black band just inside the opening. */
  /** DEPTH: the remaining skin (including thin fragments) casts a soft shadow
   *  onto the robot beneath it - offset down-right (light from the upper
   *  left), blurred - so wherever skin overhangs or hangs beside the opening
   *  the cavity under it is dark, and the darkness follows each fragment's
   *  own shape instead of a uniform rim. Sizes are fractions of the
   *  container width. Visual only: it darkens robot pixels, never moves the
   *  mask. */
  SHADOW_OFFSET_X: 0.012,
  SHADOW_OFFSET_Y: 0.018,
  SHADOW_BLUR: 0.016,
  SHADOW_ALPHA: 0.72,
  /** THINNING SKIN (skin side of the cut): a band, up to THIN_PRE_WIDTH wide in
   *  field units, where the skin turns translucent (up to THIN_PRE_MAX of the
   *  robot showing through, over the dark cavity) and browns - present only
   *  in some stretches, absent in others. Ends at the cut, where the mask is
   *  exactly 0.5 as before. */
  THIN_PRE_MAX: 0.42,
  THIN_PRE_WIDTH: 0.12,
  /** How much the scorch varies stretch to stretch: 1 = as strong as
   *  configured, CHAR_VARIATION_MIN = nearly absent. */
  CHAR_VARIATION_MIN: 0.2,
  /** CURLED LIPS (sparse): the skin edge is a thin lighter cross-section
   *  (LIP_EDGE_*), with an abrupt near-black underside just past it. */
  LIP_EDGE_WIDTH: 0.04,
  LIP_EDGE_ALPHA: 0.6,
  LIP_UNDERSIDE_WIDTH: 0.05,
  /** DIRECTIONAL TEAR STRUCTURES - derived from the burn's own geometry.
   *  The erosion gradient gives the local normal; noise is sampled at the
   *  point where that normal meets the contour, so every cell along one
   *  normal sees the same value and the features are elongated along it:
   *  TONGUES (skin projecting into the opening as narrow, pointed strips) and
   *  TEARS (narrow wedge-shaped notches cut back into the skin). Both are
   *  sparse (only the noise peaks). AMP is in field units, windowed by
   *  DIRECTIONAL_WINDOW; feature widths are CELL * R. */
  TONGUE_CELL: 0.07,
  TONGUE_AMP: 0.28,
  TONGUE_THRESHOLD: 0.6,
  TEAR_CELL: 0.09,
  TEAR_AMP: 0.31,
  TEAR_THRESHOLD: 0.54,
  DIRECTIONAL_WINDOW: 0.18,
  /** Below this erosion gradient (per grid cell) the normal is unreliable
   *  (flat top of a stamp), so no directional features are made there. */
  DIRECTIONAL_MIN_GRADIENT: 0.004,
  /** LONG SHEETS - the remaining skin peels into elongated, tapered, curving
   *  remnants that stay attached to the skin at their base. Same construction
   *  as the tongues (noise sampled where the burn normal meets the contour, so
   *  each sheet runs along its normal), but:
   *    - the lookup point is SHEARED in proportion to distance along the
   *      normal, by a slowly varying curvature, so sheets curve;
   *    - the threshold RISES with distance, so a sheet is widest at its
   *      attachment and tapers to a point, and how far it reaches depends on
   *      how strong the noise peak is (variable length);
   *    - they are sparse (high threshold) and much longer (SHEET_AMP with a
   *      wide SHEET_WINDOW; LENGTH is the distance over which the threshold
   *      rises by TAPER, in units of R).
   *  Where a sheet covers robot it is a visual fragment: it lifts, so a little
   *  of the (dark) robot shows through it (SHEET_LIFT_ALPHA) and its outline
   *  gets the curled-lip treatment. It never touches the erosion field. */
  SHEET_CELL: 0.15,
  SHEET_THRESHOLD: 0.66,
  SHEET_TAPER: 0.32,
  SHEET_LENGTH: 0.34,
  SHEET_AMP: 0.26,
  SHEET_WINDOW: 0.24,
  SHEET_CURVE: 0.75,
  SHEET_LIFT_ALPHA: 0.3,
  /** FOLDS - a long thin flap of skin lying roughly ALONG the boundary, a
   *  little way out from it (FOLD_OFFSET, in field units), separated from the
   *  main skin by a dark gap. Sparse, long (FOLD_CELL * R along the edge),
   *  thin (FOLD_WIDTH), tapering at both ends where the noise falls off. */
  FOLD_CELL: 0.5,
  FOLD_THRESHOLD: 0.64,
  FOLD_OFFSET: 0.09,
  FOLD_WIDTH: 0.05,
  FOLD_MARGIN: 0.06,
  /** CAVITY - dark on the robot right beside a lifted sheet or fold (the
   *  space it lifted away from), decaying over CAVITY_REACH. Strength follows
   *  the sheet / fold strength, so it is deep only where they are. */
  CAVITY_ALPHA: 0.66,
  CAVITY_REACH: 0.2,
  /** BURN-FRONT DETAIL - shapes where the edge lands, separate from (and not
   *  touching) the resistance field. A small deterministic offset is added to
   *  the field only within ~EDGE_DETAIL_WINDOW of the contour, so the
   *  interior, the opening's overall size and path connectivity are
   *  unaffected. Same units as the resistance layers (offset d moves the edge
   *  ~d*R). Two weighted-Voronoi "scallop" layers - rounded bites separated
   *  by short cusps, the way burned material actually recedes - at a medium
   *  and a fine size (cell size as a multiple of R), scaled by a slow noise
   *  so some stretches recede more than their neighbours. */
  EDGE_DETAIL_MEDIUM_CELL: 0.15,
  EDGE_DETAIL_MEDIUM_AMP: 0.035,
  EDGE_DETAIL_FINE_CELL: 0.1,
  EDGE_DETAIL_FINE_AMP: 0.011,
  EDGE_DETAIL_WINDOW: 0.09,
  /** Cells farther than this from the contour never evaluate the detail. */
  EDGE_DETAIL_REACH: 0.3,
  /** SKIN THINNING - past the contour the skin does not vanish at a line: it
   *  thins out over a per-location span (0 = abrupt, THIN_SPAN = long thin
   *  tongue), scorched to a dark film. The contour itself (mask = 0.5) does
   *  not move, so the opening's size is unchanged. */
  THIN_SPAN: 0.028,
  THIN_CHAR_ALPHA: 0.95,
  /** Curling: the glow is a dim ember along most of the edge and a bright
   *  lifted lip along sparse stretches (multiplier = BASE + GAIN * curl). */
  CURL_GLOW_BASE: 0.2,
  CURL_GLOW_GAIN: 0.25,
  /** SECONDARY POCKETS (near the front only): sparse weighted-Voronoi sites,
   *  each either a HOLE (skin burns through slightly ahead of the front,
   *  leaving a thin bridge that goes when the front arrives) or a SURVIVOR
   *  (a strip of skin that outlasts the front, then disappears as the burn
   *  progresses). Probabilities are per site, so most of the edge has none.
   *  AMP is in field units (~ fraction of R that the site shifts the edge). */
  POCKET_CELL: 0.26,
  POCKET_HOLE_PROB: 0.16,
  POCKET_SURVIVOR_PROB: 0.18,
  POCKET_HOLE_AMP: 0.11,
  POCKET_SURVIVOR_AMP: 0.07,
  POCKET_RADIUS_SQ: 0.16,
  POCKET_WINDOW: 0.16,
  /** BURN PROGRESSION - the drawn edge does not jump to the erosion field; it
   *  chases it. Each cell's visual field g follows the true field f at a rate
   *  BURN_PROGRESS_RATE * (slow per-location factor) per second, and never
   *  trails by more than BURN_LAG_MAX. Cells well inside the opening or well
   *  outside it (beyond +-BURN_SETTLE_ZONE) have nothing left to animate and
   *  snap. So the core opens on the first frame and the rim keeps developing
   *  - char forming, thin skin peeling back, fragments lasting a little longer
   *  than their neighbours - for a few tenths of a second. The final state is
   *  exactly the erosion field's; reduced-motion snaps straight to it. */
  BURN_PROGRESS_RATE: 7,
  BURN_LAG_MAX: 0.08,
  BURN_SETTLE_ZONE: 0.3,
  BURN_SETTLE_EPS: 0.004,
  /** Still-burning cells (visual field behind the true one) glow like embers;
   *  it fades as they settle. */
  EMBER_SPAN: 0.06,
  EMBER_INTENSITY: 0.1,
  /** Deposit spacing along a pointer path, as a fraction of the burn
   *  radius. Consecutive stamps overlap by 80%, so the summed field is
   *  smooth (no visible stamp boundaries) whatever the pointer speed. */
  DEPOSIT_SPACING_FRAC: 0.2,
  /** Hard cap on stamps per path segment - bounds CPU for a pathological
   *  pointer jump. Spacing widens past this instead of work growing. The
   *  container is < ~1000px across, so this never binds in practice. */
  MAX_INTERP_STEPS: 64,
  /** Erosion left on the exact centerline by ONE pass of the cursor,
   *  independent of how fast it moved. Above RESISTANCE_MAX (with room for
   *  the edge softness), so the centerline of any path always opens and the
   *  irregular edge comes from the resistance field, not from gaps. */
  TRAVEL_CENTER_EROSION: 0.95,
  /** Erosion at the exact center from the very first deposit on contact
   *  (no time has elapsed yet, so this is a fixed budget). Opens a clearly
   *  visible, localized region on the spot (~3.5-4k px at the forehead/eye;
   *  low-resistance stretches such as the cheeks open more, since the size
   *  follows the local material); dwelling then widens it. Affects only the
   *  first deposit - not path strength, burn radius or resistance. */
  FIRST_CONTACT_CENTER_EROSION: 0.85,
  /** DWELL / CLICK SHAPE - a stationary or clicked burn must not converge on a
   *  circle. Heat placed by dwell and click (never by first contact or travel)
   *  reaches a direction-dependent distance: the falloff radius is scaled by a
   *  smooth periodic noise of the angle around the anchor (seeded by the
   *  anchor's position, so a given spot always burns the same way). AMP is
   *  the largest fractional change of reach. */
  ANISO_AMP: 0.42,
  ANISO_FREQ: 1.15,
  /** CLICK BURN (no exposure yet): a click ignites the WHOLE face. A burn
   *  front spreads from the click position through the same erosion field as
   *  hover - the same resistance noise ragged-ens its edge, and the same
   *  tongues / tears / sheets / scorch play out along it - until every cell
   *  of the portrait is burnt through. It takes CLICK_BURN_MS; the drawn edge
   *  then catches up (BURN_PROGRESS_RATE). The front's soft edge is
   *  CLICK_FRONT_BAND burn radii wide (a hover stamp's edge is 1 radius), and
   *  its reach varies with direction by up to CLICK_FRONT_ANISO so it is not a
   *  circle. */
  CLICK_BURN_MS: 1700,
  CLICK_FRONT_BAND: 0.75,
  CLICK_FRONT_ANISO: 0.3,
  /** CLICK RESTORE (exposure exists): the burnt area closes back over about
   *  this long (a partial hover burn scales its erosion field back to zero,
   *  each cell at its own slightly different pace; a whole-face click burn
   *  runs its front backwards, inward from the edges). */
  RESTORE_MS: 1500,
};

/** Interaction state. IDLE: no exposure. BURNING: heat is being delivered or
 *  the drawn edge is still catching up. EXPOSED: robot visible, settled.
 *  RESTORING: a click is closing the skin back over the opening. */
type BurnState = 'IDLE' | 'BURNING' | 'EXPOSED' | 'RESTORING';

/** Shape of the dev-only window.__faceDebug object (see the effect). */
type FaceDebug = {
  gridW: number;
  gridH: number;
  field: Float32Array;
  erosion: Float32Array;
  resistance: Float32Array;
  mask: Uint8ClampedArray;
  state?: () => string;
};

const WARM_BROWN: [number, number, number] = [58, 32, 18];
const CHARCOAL: [number, number, number] = [16, 9, 6];
const LIP_TAN: [number, number, number] = [232, 196, 160];
const LIP_UNDERSIDE: [number, number, number] = [8, 5, 4];
const CAVITY_SHADE: [number, number, number] = [6, 3, 3];

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic lattice hash for value noise - same seed every mount, so
 *  the resistance field is fixed (not regenerated per frame or per visit). */
function makeHash(seed: number) {
  const rng = mulberry32(seed);
  const table = new Float32Array(8192);
  for (let i = 0; i < table.length; i++) table[i] = rng();
  return (x: number, y: number) => {
    const h = (((x * 374761393) ^ (y * 668265263)) >>> 0) % table.length;
    return table[h];
  };
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function valueNoise2D(hash: (x: number, y: number) => number, x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smoothstep(0, 1, xf);
  const v = smoothstep(0, 1, yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Bakes the fixed resistance field: RESISTANCE_MEAN plus one independently
 *  seeded, rotated, domain-warped noise layer per RESISTANCE_LAYERS entry
 *  (macro / medium / fine), each normalized to exactly its configured
 *  std-dev so its size relative to the burn radius is what TUNING says, not
 *  an accident of the noise function. Deterministic: same values every mount.
 *  `cellsPerR` is the burn radius in grid cells; wavelengths scale with it. */
function buildResistance(cellsPerR: number) {
  const count = GRID_W * GRID_H;
  const out = new Float32Array(count).fill(TUNING.RESISTANCE_MEAN);

  // One slow warp field shared by every layer (2 lookups per cell, not 2 per
  // layer). Each layer scales it to its own wavelength below.
  const warpHash = makeHash(4242);
  const warpWavelength = cellsPerR * 0.9;
  const warpX = new Float32Array(count);
  const warpY = new Float32Array(count);
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const i = gy * GRID_W + gx;
      warpX[i] = (valueNoise2D(warpHash, gx / warpWavelength + 11.3, gy / warpWavelength + 4.7) - 0.5) * 2;
      warpY[i] = (valueNoise2D(warpHash, gx / warpWavelength + 37.1, gy / warpWavelength + 19.9) - 0.5) * 2;
    }
  }

  const layer = new Float32Array(count);
  for (const spec of TUNING.RESISTANCE_LAYERS) {
    const hash = makeHash(spec.seed);
    const cos = Math.cos(spec.angle);
    const sin = Math.sin(spec.angle);
    const wavelength = spec.wavelength * cellsPerR;
    let sum = 0;
    let sumSq = 0;
    for (let gy = 0; gy < GRID_H; gy++) {
      for (let gx = 0; gx < GRID_W; gx++) {
        const i = gy * GRID_W + gx;
        // Position in wavelength units, warped, then rotated onto this
        // layer's own lattice axes.
        const px = gx / wavelength + warpX[i] * spec.warp;
        const py = gy / wavelength + warpY[i] * spec.warp;
        const n = valueNoise2D(hash, px * cos - py * sin, px * sin + py * cos);
        layer[i] = n;
        sum += n;
        sumSq += n * n;
      }
    }
    const mean = sum / count;
    const std = Math.sqrt(Math.max(1e-9, sumSq / count - mean * mean));
    const gain = spec.sigma / std;
    for (let i = 0; i < count; i++) out[i] += (layer[i] - mean) * gain;
  }

  for (let i = 0; i < count; i++) {
    out[i] = Math.min(TUNING.RESISTANCE_MAX, Math.max(TUNING.RESISTANCE_MIN, out[i]));
  }
  return out;
}

/** Deterministic, lazily-evaluated burn-front detail (see EDGE_DETAIL_* in
 *  TUNING). Only cells near a contour are ever asked for a value, so nothing
 *  is baked up front and mount cost stays flat. `relief` is a signed offset
 *  added to the erosion-minus-resistance field (positive = the edge recedes
 *  there); `thickness` is a slow ~0.6-1.5 multiplier for the scorch and
 *  scorch bands, so their width varies along the edge instead of being
 *  uniform. */
function makeEdgeDetail(cellsPerR: number) {
  const hMed = makeHash(9001);
  const hFine = makeHash(9002);
  const hWarp = makeHash(9003);
  const hMod = makeHash(9004);
  const hThick = makeHash(9005);
  const medCell = TUNING.EDGE_DETAIL_MEDIUM_CELL * cellsPerR;
  const fineCell = TUNING.EDGE_DETAIL_FINE_CELL * cellsPerR;

  /** Weighted Voronoi F1^2 in cell units: jittered feature points with random
   *  weights, so the scallops differ in size and are never a lattice. Squared
   *  distances throughout - F1^2 is what the scallop needs, so no sqrt. */
  const voronoiSq = (hash: (x: number, y: number) => number, px: number, py: number) => {
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    let best = 1e9;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx;
        const cy = iy + dy;
        const ox = px - (cx + 0.15 + 0.7 * hash(cx * 4, cy));
        const oy = py - (cy + 0.15 + 0.7 * hash(cx * 4 + 1, cy));
        const w = 0.65 + 0.7 * hash(cx * 4 + 2, cy);
        const d2 = (ox * ox + oy * oy) / (w * w);
        if (d2 < best) best = d2;
      }
    }
    return best;
  };

  /** -F1^2: smooth rounded bites (F1^2 has zero slope at each feature point)
   *  meeting at short cusps along the Voronoi ridges. The lookup is warped by
   *  a slow noise so cells are irregular blobs rather than straight-sided
   *  polygons. */
  const scallop = (hash: (x: number, y: number) => number, gx: number, gy: number, cell: number) => {
    const wx = (valueNoise2D(hWarp, gx / (cell * 2.3) + 5.1, gy / (cell * 2.3) + 1.7) - 0.5) * 0.9;
    const wy = (valueNoise2D(hWarp, gx / (cell * 2.3) + 17.9, gy / (cell * 2.3) + 9.3) - 0.5) * 0.9;
    return -voronoiSq(hash, gx / cell + wx, gy / cell + wy);
  };

  // Per-layer mean/std from a coarse sample of the grid, so AMP means "std-dev
  // in field units" regardless of the noise function's natural range.
  const stats = (hash: (x: number, y: number) => number, cell: number) => {
    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let gy = 0; gy < GRID_H; gy += 3) {
      for (let gx = 0; gx < GRID_W; gx += 3) {
        const v = scallop(hash, gx, gy, cell);
        sum += v;
        sumSq += v * v;
        n++;
      }
    }
    const mean = sum / n;
    return { mean, std: Math.sqrt(Math.max(1e-9, sumSq / n - mean * mean)) };
  };
  const medStats = stats(hMed, medCell);
  const fineStats = stats(hFine, fineCell);

  const hPocket = makeHash(9006);
  const hCurl = makeHash(9007);
  const hThin = makeHash(9008);
  const pocketCell = TUNING.POCKET_CELL * cellsPerR;
  const hTongue = makeHash(9009);
  const hTear = makeHash(9010);
  const hCharVar = makeHash(9011);
  const tongueCell = TUNING.TONGUE_CELL * cellsPerR;
  const tearCell = TUNING.TEAR_CELL * cellsPerR;
  const hSheet = makeHash(9013);
  const hFold = makeHash(9014);
  const hCurve = makeHash(9015);
  const sheetCell = TUNING.SHEET_CELL * cellsPerR;
  const foldCell = TUNING.FOLD_CELL * cellsPerR;
  const curveCell = 0.55 * cellsPerR;

  /** Sparse secondary pockets: only the nearest weighted-Voronoi site
   *  matters, and only some sites are active (HOLE: positive offset - the
   *  edge recedes there, so skin burns through a little ahead of the front;
   *  SURVIVOR: negative - a strip of skin outlasts the front). Inactive sites
   *  contribute nothing, so most of the edge has no pocket at all. The
   *  bump is a smooth blob, so a pocket is one connected feature, not a
   *  scatter of pixels. */
  const pocketAt = (gx: number, gy: number) => {
    const wx = (valueNoise2D(hWarp, gx / (pocketCell * 2.3) + 23.7, gy / (pocketCell * 2.3) + 3.3) - 0.5) * 0.9;
    const wy = (valueNoise2D(hWarp, gx / (pocketCell * 2.3) + 41.1, gy / (pocketCell * 2.3) + 13.9) - 0.5) * 0.9;
    const px = gx / pocketCell + wx;
    const py = gy / pocketCell + wy;
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    let best = 1e9;
    let gate = 1;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx;
        const cy = iy + dy;
        const ox = px - (cx + 0.15 + 0.7 * hPocket(cx * 4, cy));
        const oy = py - (cy + 0.15 + 0.7 * hPocket(cx * 4 + 1, cy));
        const w = 0.6 + 0.8 * hPocket(cx * 4 + 2, cy);
        const d2 = (ox * ox + oy * oy) / (w * w);
        if (d2 < best) {
          best = d2;
          gate = hPocket(cx * 4 + 3, cy);
        }
      }
    }
    const bump = smoothstep(TUNING.POCKET_RADIUS_SQ, 0, best);
    if (gate < TUNING.POCKET_HOLE_PROB) return TUNING.POCKET_HOLE_AMP * bump;
    if (gate < TUNING.POCKET_HOLE_PROB + TUNING.POCKET_SURVIVOR_PROB) return -TUNING.POCKET_SURVIVOR_AMP * bump;
    return 0;
  };

  const reliefCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const thicknessCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const pocketCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const thinCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const curlCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const charVarCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const dirCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const sheetCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const foldCache = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const curveCache = new Float32Array(GRID_W * GRID_H).fill(NaN);

  // Raw noise for sheets (short tangential wavelength), folds (long) and
  // curvature (slow, signed). All pure functions of grid position; cached and
  // bilinearly sampled at the contour-projected point.
  const sheetRaw = (gx: number, gy: number) => {
    const wx = (valueNoise2D(hWarp, gx / (sheetCell * 3.3) + 71.3, gy / (sheetCell * 3.3) + 11.7) - 0.5) * 1.3;
    const wy = (valueNoise2D(hWarp, gx / (sheetCell * 3.3) + 83.9, gy / (sheetCell * 3.3) + 29.1) - 0.5) * 1.3;
    const qx = gx / sheetCell + wx;
    const qy = gy / sheetCell + wy;
    const n = 0.62 * valueNoise2D(hSheet, qx, qy) + 0.38 * valueNoise2D(hSheet, qx * 0.45 + 5.5, qy * 0.45 + 2.1);
    // Mixed value noise sits around 0.5 and seldom passes 0.75: stretch it so
    // its peaks reach 1 and thresholds/tapers mean what they say.
    return Math.max(0, Math.min(1, (n - 0.34) / 0.42));
  };
  const foldRaw = (gx: number, gy: number) => {
    const wx = (valueNoise2D(hWarp, gx / (foldCell * 1.6) + 91.1, gy / (foldCell * 1.6) + 3.3) - 0.5) * 0.9;
    const wy = (valueNoise2D(hWarp, gx / (foldCell * 1.6) + 17.7, gy / (foldCell * 1.6) + 47.5) - 0.5) * 0.9;
    const qx = gx / foldCell + wx;
    const qy = gy / foldCell + wy;
    const n = 0.65 * valueNoise2D(hFold, qx, qy) + 0.35 * valueNoise2D(hFold, qx * 0.5 + 9.3, qy * 0.5 + 4.7);
    return Math.max(0, Math.min(1, (n - 0.34) / 0.42));
  };
  const curveRaw = (gx: number, gy: number) => (valueNoise2D(hCurve, gx / curveCell + 2.7, gy / curveCell + 8.1) - 0.5) * 2;
  const cellAt = (cache: Float32Array, raw: (gx: number, gy: number) => number, gx: number, gy: number) => {
    const i = gy * GRID_W + gx;
    let v = cache[i];
    if (v !== v) {
      v = raw(gx, gy);
      cache[i] = v;
    }
    return v;
  };
  const bilerp = (cache: Float32Array, raw: (gx: number, gy: number) => number, px: number, py: number) => {
    const cx = Math.max(0, Math.min(GRID_W - 1.001, px));
    const cy = Math.max(0, Math.min(GRID_H - 1.001, py));
    const x0 = Math.floor(cx);
    const y0 = Math.floor(cy);
    const fx = cx - x0;
    const fy = cy - y0;
    return (
      cellAt(cache, raw, x0, y0) * (1 - fx) * (1 - fy) +
      cellAt(cache, raw, x0 + 1, y0) * fx * (1 - fy) +
      cellAt(cache, raw, x0, y0 + 1) * (1 - fx) * fy +
      cellAt(cache, raw, x0 + 1, y0 + 1) * fx * fy
    );
  };

  let warmIndex = 0;

  const api = {
    /** Fills the caches for the next few ms of cells (row-major), returning
     *  true once every cell is done. The values are deterministic, so warming
     *  early only moves the cost off the first-contact event - it never
     *  changes a result. Lazy evaluation in relief()/thickness() remains the
     *  fallback if the cursor arrives before warming finishes. */
    warm(budgetMs: number) {
      const end = performance.now() + budgetMs;
      const total = GRID_W * GRID_H;
      while (warmIndex < total) {
        const gx = warmIndex % GRID_W;
        const gy = (warmIndex - gx) / GRID_W;
        api.relief(warmIndex, gx, gy);
        api.thickness(warmIndex, gx, gy);
        api.pocket(warmIndex, gx, gy);
        api.thin(warmIndex, gx, gy);
        api.curl(warmIndex, gx, gy);
        api.charVar(warmIndex, gx, gy);
        api.dirCell(gx, gy);
        api.sheetWarm(gx, gy);
        warmIndex++;
        if ((warmIndex & 31) === 0 && performance.now() > end) return false;
      }
      return true;
    },
    relief(i: number, gx: number, gy: number) {
      let v = reliefCache[i];
      if (v !== v) {
        const med = (scallop(hMed, gx, gy, medCell) - medStats.mean) / medStats.std;
        const fine = (scallop(hFine, gx, gy, fineCell) - fineStats.mean) / fineStats.std;
        // Some stretches erode harder than others.
        const mod = 0.35 + 0.65 * smoothstep(0.25, 0.75, valueNoise2D(hMod, gx / (0.55 * cellsPerR) + 3.1, gy / (0.55 * cellsPerR) + 8.7));
        v = mod * (TUNING.EDGE_DETAIL_MEDIUM_AMP * med + TUNING.EDGE_DETAIL_FINE_AMP * fine);
        reliefCache[i] = v;
      }
      return v;
    },
    thickness(i: number, gx: number, gy: number) {
      let v = thicknessCache[i];
      if (v !== v) {
        v = 0.6 + 0.9 * valueNoise2D(hThick, gx / (0.3 * cellsPerR) + 2.3, gy / (0.3 * cellsPerR) + 6.1);
        thicknessCache[i] = v;
      }
      return v;
    },
    pocket(i: number, gx: number, gy: number) {
      let v = pocketCache[i];
      if (v !== v) {
        v = pocketAt(gx, gy);
        pocketCache[i] = v;
      }
      return v;
    },
    /** 0..1: how far this stretch of skin thins out before it vanishes
     *  (a slow, medium-scale factor so some stretches are abrupt and others
     *  leave long thin tongues). */
    thin(i: number, gx: number, gy: number) {
      let v = thinCache[i];
      if (v !== v) {
        v = smoothstep(0.3, 0.75, valueNoise2D(hThin, gx / (0.22 * cellsPerR) + 4.4, gy / (0.22 * cellsPerR) + 9.1));
        thinCache[i] = v;
      }
      return v;
    },
    /** CHAR_VARIATION_MIN..1: how strongly this stretch is scorched, so the
     *  rim is heavy in places and nearly absent in others. */
    charVar(i: number, gx: number, gy: number) {
      let v = charVarCache[i];
      if (v !== v) {
        const n = smoothstep(0.25, 0.75, valueNoise2D(hCharVar, gx / (0.4 * cellsPerR) + 6.6, gy / (0.4 * cellsPerR) + 2.2));
        v = TUNING.CHAR_VARIATION_MIN + (1 - TUNING.CHAR_VARIATION_MIN) * n;
        charVarCache[i] = v;
      }
      return v;
    },
    /** Directional tear structures at a CONTOUR point (px,py, in grid
     *  cells): negative = a tongue of skin projecting into the opening,
     *  positive = a tear cutting back into the skin, 0 = neither. Both are
     *  sparse peaks of a smooth noise. Called with the cell's projection onto
     *  the contour along the burn normal, so it is constant along each normal
     *  and the resulting features are elongated strips / wedges. Not cached:
     *  the projection moves as the burn does. */
    directional(px: number, py: number) {
      // Bilinear sample of the cached field (the noise is a pure function of
      // grid position; only WHERE it is sampled moves with the burn).
      const cx = Math.max(0, Math.min(GRID_W - 1.001, px));
      const cy = Math.max(0, Math.min(GRID_H - 1.001, py));
      const x0 = Math.floor(cx);
      const y0 = Math.floor(cy);
      const fx = cx - x0;
      const fy = cy - y0;
      const v00 = api.dirCell(x0, y0);
      const v10 = api.dirCell(x0 + 1, y0);
      const v01 = api.dirCell(x0, y0 + 1);
      const v11 = api.dirCell(x0 + 1, y0 + 1);
      return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
    },
    /** Sheet / fold / curvature noise sampled at a (continuous) contour point. */
    sheet(px: number, py: number) {
      return bilerp(sheetCache, sheetRaw, px, py);
    },
    fold(px: number, py: number) {
      return bilerp(foldCache, foldRaw, px, py);
    },
    curve(px: number, py: number) {
      return bilerp(curveCache, curveRaw, px, py);
    },
    sheetWarm(gx: number, gy: number) {
      cellAt(sheetCache, sheetRaw, gx, gy);
      cellAt(foldCache, foldRaw, gx, gy);
      cellAt(curveCache, curveRaw, gx, gy);
    },
    /** Cached raw tongue/tear value at one grid cell (lazy; also filled by
     *  warm()). */
    dirCell(gx: number, gy: number) {
      const i = gy * GRID_W + gx;
      let v = dirCache[i];
      if (v !== v) {
        v = api.directionalRaw(gx, gy);
        dirCache[i] = v;
      }
      return v;
    },
    directionalRaw(px: number, py: number) {
      // Warped lookup + two mixed scales, so features are unevenly spaced and
      // sized rather than a regular comb along the contour.
      const wx = (valueNoise2D(hWarp, px / (tongueCell * 3.1) + 31.3, py / (tongueCell * 3.1) + 7.7) - 0.5) * 1.3;
      const wy = (valueNoise2D(hWarp, px / (tongueCell * 3.1) + 53.9, py / (tongueCell * 3.1) + 21.1) - 0.5) * 1.3;
      const qx = px / tongueCell + wx;
      const qy = py / tongueCell + wy;
      const tn = 0.62 * valueNoise2D(hTongue, qx, qy) + 0.38 * valueNoise2D(hTongue, qx * 0.47 + 9.1, qy * 0.47 + 3.3);
      const ex = px / tearCell + wx * 0.8;
      const ey = py / tearCell + wy * 0.8;
      const en = 0.62 * valueNoise2D(hTear, ex + 13.7, ey + 5.9) + 0.38 * valueNoise2D(hTear, ex * 0.5 + 27.4, ey * 0.5 + 11.6);
      const tongue = smoothstep(TUNING.TONGUE_THRESHOLD, 0.92, tn);
      const tear = smoothstep(TUNING.TEAR_THRESHOLD, 0.94, en);
      return TUNING.TEAR_AMP * tear - TUNING.TONGUE_AMP * tongue;
    },
    /** 0..1, sparse: where the scorched lip lifts and catches the light. */
    curl(i: number, gx: number, gy: number) {
      let v = curlCache[i];
      if (v !== v) {
        v = smoothstep(0.55, 0.82, valueNoise2D(hCurl, gx / (0.11 * cellsPerR) + 1.9, gy / (0.11 * cellsPerR) + 7.3));
        curlCache[i] = v;
      }
      return v;
    },
  };
  return api;
}

/** Draws `img` into `ctx` filling [0,0,w,h] the way CSS object-fit: cover +
 *  object-position `${px*100}% ${py*100}%` would. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  naturalW: number,
  naturalH: number,
  w: number,
  h: number,
  px: number,
  py: number
) {
  const scale = Math.max(w / naturalW, h / naturalH);
  const drawW = naturalW * scale;
  const drawH = naturalH * scale;
  const dx = (w - drawW) * px;
  const dy = (h - drawH) * py;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

export function InteractiveFace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let cancelled = false;
    let raf = 0;
    let active = false;
    // A pointer already resting over the portrait when the page loads makes
    // the browser emit a synthetic pointer event with zero movement. That is
    // not the visitor touching the face, so the hero stays intact until the
    // first real movement (programmatic events count as real: only browsers
    // synthesize the zero-movement kind).
    let pointerArmed = false;
    const armedBy = (e: PointerEvent) => {
      if (!pointerArmed && (!e.isTrusted || e.movementX !== 0 || e.movementY !== 0)) pointerArmed = true;
      return pointerArmed;
    };
    // Set by onMove; consumed by the next rAF so a frame that already
    // painted movement doesn't also get a redundant dwell top-up + repaint.
    let movedThisFrame = false;
    // The position/time heat has been fully deposited through. Both the
    // pointer handlers and the per-frame dwell top-up advance this same
    // clock, so real elapsed time is only ever spent once - no double
    // counting between event-driven and frame-driven deposits.
    let lastX = 0;
    let lastY = 0;
    let lastDepositTime = 0;
    // Union of every grid cell touched since the last canvas upload, so a
    // whole burst of coalesced/interpolated deposits costs one putImageData
    // call instead of one per deposit point.
    let dirtyMinGx = Infinity;
    let dirtyMaxGx = -Infinity;
    let dirtyMinGy = Infinity;
    let dirtyMaxGy = -Infinity;
    let width = 0;
    let height = 0;

    const CELL_COUNT = GRID_W * GRID_H;
    const resistance = buildResistance(TUNING.BURN_RADIUS_FRAC * GRID_W);
    const CELLS_PER_R = TUNING.BURN_RADIUS_FRAC * GRID_W;
    const edgeDetail = makeEdgeDetail(CELLS_PER_R);
    const erosion = new Float32Array(CELL_COUNT);

    // The DRAWN field, per cell: chases (erosion - resistance) over time, so
    // the rim develops instead of jumping to its final shape. Starts equal to
    // the true field of an unburnt cell. Everything visual (mask, char, glow,
    // shadow) is derived from this, never from erosion directly.
    const burnVis = new Float32Array(CELL_COUNT);
    for (let i = 0; i < CELL_COUNT; i++) burnVis[i] = -resistance[i];
    // 1 = burnVis has not yet reached its target for this cell.
    const burnPending = new Uint8Array(CELL_COUNT);
    let pendingCount = 0;
    // False until any heat has ever been deposited: until then there is no
    // opening, so the depth shadow pass is skipped entirely.
    let anyBurn = false;
    // Interaction state machine (see BurnState) and what it needs.
    let burnState: BurnState = 'IDLE';
    // Number of cells whose TRUE field is >= 0 (robot exposed there).
    let exposedCount = 0;
    // Bounding box of every cell heat has ever reached - restoration only
    // has to visit these.
    let heatMinGx = Infinity;
    let heatMaxGx = -Infinity;
    let heatMinGy = Infinity;
    let heatMaxGy = -Infinity;
    // Click burn: 1 while the front is still spreading, 0 once it has covered
    // the whole face; chargeU is its 0..1 progress.
    let chargeRemaining = 0;
    let chargeU = 0;
    let lastChargeTime = 0;
    // Click-burn front. Each cell's distance and direction from the click are
    // tabulated once per click, so a frame is table lookups only.
    // frontActive stays true until that burn has been fully restored.
    const FRONT_ANGLES = 96;
    const FRONT_PEAK = 1.15; // the erosion cap (see depositHeat)
    const frontDist = new Float32Array(CELL_COUNT);
    const frontAng = new Uint8Array(CELL_COUNT);
    const frontScale = new Float32Array(FRONT_ANGLES);
    let frontActive = false;
    let frontBand = 0;
    let frontTotal = 0; // reach at which the plateau covers every cell in play
    // Where the burn started and where the restoration starts. Independent:
    // each is captured from its OWN click, and the front tables are rebuilt
    // around whichever phase is starting, so neither can leak into the other.
    let burnOrigin: { x: number; y: number } | null = null;
    let restoreOrigin: { x: number; y: number } | null = null;
    // Lowest scale the erosion field reaches before the last exposed cell
    // closes (computed when a restore starts; see startRestore).
    let restoreSMin = 0.3;
    // Restoration bookkeeping.
    let restoreStart = 0;
    const restoreSnapshot = new Float32Array(GRID_W * GRID_H);
    // After a restore the pointer is usually still over the face; don't start
    // burning again until it actually moves.
    let suppressDwell = false;
    const hAniso = makeHash(9012);
    // Bounding box of cells that may be pending (reset when none are).
    let animMinGx = Infinity;
    let animMaxGx = -Infinity;
    let animMinGy = Infinity;
    let animMaxGy = -Infinity;
    // Time burnVis was last advanced to; 0 = idle (next advance gets one
    // nominal frame instead of however long the page sat still).
    let lastAdvanceTime = 0;

    // Cells whose drawn field changed since their pixels were last rebuilt.
    const touchedCells = new Uint8Array(CELL_COUNT);

    // THE erosion mask: alpha = reveal amount m. The only mask in the
    // system - it removes the human (destination-out) and reveals the robot
    // (destination-in) in renderFrame().
    const eraseCanvas = document.createElement('canvas');
    eraseCanvas.width = GRID_W;
    eraseCanvas.height = GRID_H;
    const eraseCtx = eraseCanvas.getContext('2d')!;
    const eraseData = eraseCtx.createImageData(GRID_W, GRID_H);

    // Offscreen viewport-sized layer holding human x (1 - m); sized in
    // sizeSurfaces() to match the visible canvas.
    const humanLayer = document.createElement('canvas');
    const humanCtx = humanLayer.getContext('2d')!;

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = GRID_W;
    glowCanvas.height = GRID_H;
    const glowCtx = glowCanvas.getContext('2d')!;
    const glowData = glowCtx.createImageData(GRID_W, GRID_H);

    const charCanvas = document.createElement('canvas');
    charCanvas.width = GRID_W;
    charCanvas.height = GRID_H;
    const charCtx = charCanvas.getContext('2d')!;
    const charData = charCtx.createImageData(GRID_W, GRID_H);

    // Dark on the robot beside lifted sheets and folds (drawn source-atop, so
    // it only darkens robot pixels that exist).
    const cavityCanvas = document.createElement('canvas');
    cavityCanvas.width = GRID_W;
    cavityCanvas.height = GRID_H;
    const cavityCtx = cavityCanvas.getContext('2d')!;
    const cavityData = cavityCtx.createImageData(GRID_W, GRID_H);

    // The portrait's own colors, sampled once at grid resolution, so the char
    // band can darken/warm whatever was actually there (hair, skin, beard)
    // instead of painting a flat, unrelated color over it.
    let portraitSample: Uint8ClampedArray | null = null;

    const portraitImg = new Image();
    const robotImg = new Image();
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === 2 && !cancelled) {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = GRID_W;
        sampleCanvas.height = GRID_H;
        const sctx = sampleCanvas.getContext('2d')!;
        drawCover(sctx, portraitImg, portraitImg.naturalWidth, portraitImg.naturalHeight, GRID_W, GRID_H, OBJECT_POSITION_X, OBJECT_POSITION_Y);
        portraitSample = sctx.getImageData(0, 0, GRID_W, GRID_H).data;

        setReady(true);
        measure();
        rebuildMasksFull();
        renderFrame();
        warmEdgeDetail();
      }
    };

    // Pre-computes the (deterministic) burn-front detail in ~5ms slices so the
    // first contact doesn't pay for it. Independent of the interaction loop.
    let warmTimer = 0;
    const warmEdgeDetail = () => {
      warmTimer = 0;
      if (cancelled) return;
      if (!edgeDetail.warm(5)) warmTimer = window.setTimeout(warmEdgeDetail, 16);
    };
    portraitImg.onload = onLoad;
    robotImg.onload = onLoad;
    portraitImg.src = PORTRAIT_SRC;
    robotImg.src = ROBOT_SRC;

    const ctx = canvas.getContext('2d')!;

    /** Sizes the visible canvas and the offscreen human layer identically
     *  (same pixel size, same CSS-unit transform), so the two layers always
     *  register exactly. */
    const sizeSurfaces = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.max(1, Math.round(width * dpr));
      const ph = Math.max(1, Math.round(height * dpr));
      canvas.width = pw;
      canvas.height = ph;
      humanLayer.width = pw;
      humanLayer.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      humanCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const measure = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      sizeSurfaces();
    };

    /** Recomputes one cell's erase/glow/char bytes at index `i`
     *  (== gy*GRID_W+gx). A pure function of the DRAWN field burnVis[i], the
     *  local erosion gradient, the cached deterministic detail and (for char)
     *  the sampled portrait color; erosion - resistance is read only to know
     *  whether the cell is still burning (ember). Reading from the skin side
     *  of the burn front:
     *    intact skin -> thinning, translucent skin (some stretches) ->
     *    scorched edge (or, on sparse stretches, a curled lip: lighter
     *    cross-section over a near-black underside) -> [contour, mask 0.5] ->
     *    remnants that thin out -> gone (robot).
     *  Directional tongues and tears displace this field along the burn
     *  normal; depth (the cavity under overhanging skin) comes from the cast
     *  shadow in renderFrame. All of it hangs off the same field. */
    const writeCell = (i: number) => {
      const fieldRaw = burnVis[i];
      const di = i * 4;

      // Fast path: beyond REACH of any contour every stage is constant (deep
      // skin: nothing; deep inside the opening: skin fully gone) and no detail
      // term reaches this far, so skip all of the stage math. Most cells in a
      // burn's footprint are here.
      if (fieldRaw <= -TUNING.EDGE_DETAIL_REACH || fieldRaw >= TUNING.EDGE_DETAIL_REACH) {
        eraseData.data[di + 3] = fieldRaw > 0 ? 255 : 0;
        glowData.data[di + 3] = 0;
        charData.data[di + 3] = 0;
        cavityData.data[di + 3] = 0;
        return;
      }

      const gx = i % GRID_W;
      const gy = (i - gx) / GRID_W;

      let field = fieldRaw;
      let thick = 1;
      let span = TUNING.EDGE_SOFTNESS;
      let curl = 0;
      let thinN = 0;
      let charVar = 1;
      let lift = 0; // 0..1: how much this cell belongs to a lifted sheet / fold
      let cavStrength = 0; // 0..1: sheet / fold strength driving the cavity
      if (fieldRaw > -TUNING.EDGE_DETAIL_REACH && fieldRaw < TUNING.EDGE_DETAIL_REACH) {
        const w1 = fieldRaw / TUNING.EDGE_DETAIL_WINDOW;
        field = fieldRaw + edgeDetail.relief(i, gx, gy) * Math.exp(-w1 * w1);
        // Sparse secondary pockets (holes / survivors) - mostly 0.
        const pocket = edgeDetail.pocket(i, gx, gy);
        if (pocket !== 0) {
          const w2 = fieldRaw / TUNING.POCKET_WINDOW;
          field += pocket * Math.exp(-w2 * w2);
        }
        // Directional tongues / tears: sample noise where this cell's burn
        // normal meets the contour, so features run along the normal.
        if (Math.abs(fieldRaw) < TUNING.DIRECTIONAL_WINDOW * 1.9) {
          const sx = (gx > 0 ? 1 : 0) + (gx < GRID_W - 1 ? 1 : 0);
          const sy = (gy > 0 ? 1 : 0) + (gy < GRID_H - 1 ? 1 : 0);
          const ex = (erosion[gx < GRID_W - 1 ? i + 1 : i] - erosion[gx > 0 ? i - 1 : i]) / sx;
          const ey = (erosion[gy < GRID_H - 1 ? i + GRID_W : i] - erosion[gy > 0 ? i - GRID_W : i]) / sy;
          const g2 = ex * ex + ey * ey;
          if (g2 > TUNING.DIRECTIONAL_MIN_GRADIENT * TUNING.DIRECTIONAL_MIN_GRADIENT) {
            const gm = Math.sqrt(g2);
            const nx = ex / gm;
            const ny = ey / gm;
            // Signed distance (cells) to the contour along the normal; the
            // gradient points into the opening, so inside cells step back.
            const d = Math.max(-16, Math.min(16, fieldRaw / gm));
            const pcx = gx - d * nx;
            const pcy = gy - d * ny;
            const wd = fieldRaw / TUNING.DIRECTIONAL_WINDOW;
            field += edgeDetail.directional(pcx, pcy) * Math.exp(-wd * wd);

            // Long curling sheets: sample sheet noise at the contour point
            // SHEARED along the tangent by (curvature * distance), so the
            // strip bends; the threshold rises with distance past the
            // contour, so it tapers and ends at a length set by its peak.
            const kappa = edgeDetail.curve(pcx, pcy) * TUNING.SHEET_CURVE;
            const sheetNoise = edgeDetail.sheet(pcx - ny * kappa * d, pcy + nx * kappa * d);
            const lengthCells = TUNING.SHEET_LENGTH * CELLS_PER_R;
            const tsh = TUNING.SHEET_THRESHOLD;
            let sheet = (sheetNoise - tsh - (TUNING.SHEET_TAPER * (d > 0 ? d : 0)) / lengthCells) / (1 - tsh);
            sheet = sheet < 0 ? 0 : sheet > 1 ? 1 : sheet;
            sheet = sheet * sheet * (3 - 2 * sheet);
            const ws = fieldRaw / TUNING.SHEET_WINDOW;
            field -= TUNING.SHEET_AMP * sheet * Math.exp(-ws * ws);
            const sheet0 = Math.max(0, Math.min(1, (sheetNoise - tsh) / (1 - tsh)));

            // Folds: a thin flap of skin a little way out from the contour
            // and running along it, with a gap (dark cavity) behind it.
            const foldNoise = edgeDetail.fold(pcx, pcy);
            const fold0 = Math.max(0, Math.min(1, (foldNoise - TUNING.FOLD_THRESHOLD) / (1 - TUNING.FOLD_THRESHOLD)));
            let fold = 0;
            if (fold0 > 0) {
              const wf = (fieldRaw - TUNING.FOLD_OFFSET) / TUNING.FOLD_WIDTH;
              fold = fold0 * Math.exp(-wf * wf);
              field -= (TUNING.FOLD_OFFSET + TUNING.FOLD_MARGIN) * fold;
            }
            // Only the free part of a sheet lifts: near the cut and beyond it,
            // never the intact skin it is attached to.
            lift = Math.max(sheet, fold) * smoothstep(-0.07, -0.01, fieldRaw);
            cavStrength = Math.max(sheet0 * 0.85, fold0);
          }
        }
        thick = edgeDetail.thickness(i, gx, gy);
        span += TUNING.THIN_SPAN * edgeDetail.thin(i, gx, gy);
        thinN = edgeDetail.thin(i, gx, gy);
        curl = edgeDetail.curl(i, gx, gy);
        charVar = edgeDetail.charVar(i, gx, gy);
      }

      // Sheet and fold outlines are curled edges: lighter cross-section over
      // a near-black underside (the existing lip treatment).
      if (lift > 0.05) curl = Math.max(curl, Math.min(1, lift * 1.6));

      // THE mask. The contour (m = 0.5) sits exactly where it always did.
      // Skin side: in some stretches the skin turns translucent before the
      // cut (a thinning band); burnt side: what remains thins out over `span`.
      const cut = smoothstep(-TUNING.EDGE_SOFTNESS, 0, field);
      let m: number;
      if (field < 0) {
        const pre = TUNING.THIN_PRE_MAX * thinN * smoothstep(-TUNING.THIN_PRE_WIDTH, -TUNING.EDGE_SOFTNESS, field);
        // A lifted sheet / fold is thin: some of the dark robot shows through.
        m = Math.max(0.5 * cut + pre * (1 - cut), TUNING.SHEET_LIFT_ALPHA * lift);
      } else {
        m = 0.5 + 0.5 * smoothstep(0, span, field);
      }
      const ed = eraseData.data;
      ed[di] = 255;
      ed[di + 1] = 255;
      ed[di + 2] = 255;
      ed[di + 3] = m * 255;

      // Glow: a faint ember along the edge, plus extra heat while the cell is
      // still burning. Peaks just before the cut (skin side).
      const glowBand = Math.max(0, 1 - Math.abs(field) / TUNING.GLOW_BAND);
      const glowSide = smoothstep(-TUNING.GLOW_BAND * 0.9, TUNING.GLOW_BAND * 0.1, field);
      const ember = smoothstep(0, TUNING.EMBER_SPAN, erosion[i] - resistance[i] - fieldRaw);
      // Scaled by the portrait's own alpha so the warm edge can only exist on
      // human pixels, never as a smudge over transparent page background.
      const humanA = portraitSample ? portraitSample[di + 3] / 255 : 1;
      // Also gated by how much skin is still there (1 - m): the glow is additive
      // and could otherwise leave a warm smudge over page background where the
      // skin is gone and the robot is transparent.
      const skinLeft = Math.min(1, (1 - m) * 3);
      const glowA = Math.min(
        1,
        glowBand * glowSide * (TUNING.GLOW_INTENSITY * (TUNING.CURL_GLOW_BASE + TUNING.CURL_GLOW_GAIN * curl) + TUNING.EMBER_INTENSITY * ember) * humanA * skinLeft
      );
      const gd = glowData.data;
      gd[di] = 255;
      gd[di + 1] = 150;
      gd[di + 2] = 60;
      gd[di + 3] = glowA * 255;

      // Char: scorch that is strong in some stretches and nearly absent in
      // others (charVar), lighter where the edge is a curled lip, colored from
      // the cell's own portrait pixel (darkened + warmed) and pulled toward
      // charcoal where densest. In the thinning band the skin just browns.
      const skinDepth = -field; // > 0 = distance into intact skin
      const coreW = TUNING.CHAR_BAND * thick;
      // A lifted sheet keeps its skin colour: the scorch is suppressed on it and
      // its outline gets the lip treatment (lighter edge, dark underside) instead.
      const scorchK = charVar * (1 - 0.8 * curl) * (1 - 0.75 * lift);
      const core = smoothstep(coreW, coreW * 0.4, skinDepth);
      const halo = smoothstep(coreW * TUNING.CHAR_HALO_SPAN, 0, skinDepth);
      const tint = 0.34 * thinN * smoothstep(-TUNING.THIN_PRE_WIDTH, -TUNING.EDGE_SOFTNESS, field);
      const film = TUNING.THIN_CHAR_ALPHA * smoothstep(-coreW * 0.5, 0.01, field);
      let cA = Math.max(core * TUNING.CHAR_INTENSITY * scorchK, halo * TUNING.CHAR_HALO_INTENSITY * scorchK, tint, film);
      const blacken = core * core * TUNING.CHAR_BLACKEN * scorchK;
      let cr = WARM_BROWN[0];
      let cg = WARM_BROWN[1];
      let cb = WARM_BROWN[2];
      if (portraitSample) {
        const dr = portraitSample[di] * TUNING.CHAR_DARKEN;
        const dg = portraitSample[di + 1] * TUNING.CHAR_DARKEN;
        const db = portraitSample[di + 2] * TUNING.CHAR_DARKEN;
        cr = dr + (WARM_BROWN[0] - dr) * TUNING.CHAR_WARM_MIX;
        cg = dg + (WARM_BROWN[1] - dg) * TUNING.CHAR_WARM_MIX;
        cb = db + (WARM_BROWN[2] - db) * TUNING.CHAR_WARM_MIX;
      }
      cr += (CHARCOAL[0] - cr) * blacken;
      cg += (CHARCOAL[1] - cg) * blacken;
      cb += (CHARCOAL[2] - cb) * blacken;

      // Curled lip (sparse): the skin edge is a thin lighter cross-section,
      // then an abrupt near-black underside just past the cut.
      if (curl > 0) {
        const lipEdge =
          curl *
          smoothstep(-TUNING.LIP_EDGE_WIDTH, -TUNING.LIP_EDGE_WIDTH * 0.4, field) *
          (1 - smoothstep(-TUNING.LIP_EDGE_WIDTH * 0.4, 0.003, field));
        if (lipEdge > 0) {
          cr += (LIP_TAN[0] - cr) * lipEdge;
          cg += (LIP_TAN[1] - cg) * lipEdge;
          cb += (LIP_TAN[2] - cb) * lipEdge;
          cA = cA * (1 - 0.85 * lipEdge) + TUNING.LIP_EDGE_ALPHA * lipEdge;
        }
        const lipUnder = curl * smoothstep(-0.003, 0.002, field) * (1 - smoothstep(0, TUNING.LIP_UNDERSIDE_WIDTH, field));
        if (lipUnder > 0) {
          cr += (LIP_UNDERSIDE[0] - cr) * lipUnder;
          cg += (LIP_UNDERSIDE[1] - cg) * lipUnder;
          cb += (LIP_UNDERSIDE[2] - cb) * lipUnder;
          cA = Math.max(cA, 0.92 * lipUnder);
        }
      }
      const cd = charData.data;
      cd[di] = cr;
      cd[di + 1] = cg;
      cd[di + 2] = cb;
      cd[di + 3] = cA * 255;

      // Cavity: the space a lifted sheet / fold lifted away from, on the robot
      // beside it. Gated by the mask so it exists only where robot shows.
      const cavityA = TUNING.CAVITY_ALPHA * cavStrength * smoothstep(TUNING.CAVITY_REACH, 0, field) * Math.max(m, lift);
      const cv = cavityData.data;
      cv[di] = CAVITY_SHADE[0];
      cv[di + 1] = CAVITY_SHADE[1];
      cv[di + 2] = CAVITY_SHADE[2];
      cv[di + 3] = cavityA * 255;
    };

    /** Moves the drawn field toward the true one for the real time elapsed
     *  since the last call (one nominal frame if the burn was idle), and marks
     *  every cell that changed for a pixel rebuild. Cells far from any contour
     *  have nothing left to animate and snap; the rest chase at
     *  BURN_PROGRESS_RATE * a slow per-location factor, never trailing by more
     *  than BURN_LAG_MAX. Deterministic: same deposits + same elapsed times ->
     *  same frames. Under reduced motion everything snaps. */
    const advanceBurn = (now: number) => {
      if (pendingCount === 0) {
        lastAdvanceTime = 0;
        return;
      }
      const dt = lastAdvanceTime ? Math.min(0.1, Math.max(0, (now - lastAdvanceTime) / 1000)) : 1 / 60;
      lastAdvanceTime = Math.max(lastAdvanceTime, now);

      let chMinGx = Infinity;
      let chMaxGx = -Infinity;
      let chMinGy = Infinity;
      let chMaxGy = -Infinity;
      for (let gy = animMinGy; gy <= animMaxGy; gy++) {
        const row = gy * GRID_W;
        for (let gx = animMinGx; gx <= animMaxGx; gx++) {
          const i = row + gx;
          if (!burnPending[i]) continue;
          const target = erosion[i] - resistance[i];
          let g = burnVis[i];
          if (reducedMotion || target > TUNING.BURN_SETTLE_ZONE || target < -TUNING.BURN_SETTLE_ZONE) {
            g = target;
          } else {
            const k = TUNING.BURN_PROGRESS_RATE * edgeDetail.thickness(i, gx, gy);
            g += ((target - g) * (k * dt)) / (1 + k * dt);
            const floor = target - TUNING.BURN_LAG_MAX;
            if (g < floor) g = floor;
            if (target - g < TUNING.BURN_SETTLE_EPS) g = target;
          }
          if (g === target) {
            burnPending[i] = 0;
            pendingCount--;
          }
          if (g !== burnVis[i]) {
            burnVis[i] = g;
            touchedCells[i] = 1;
            if (gx < chMinGx) chMinGx = gx;
            if (gx > chMaxGx) chMaxGx = gx;
            if (gy < chMinGy) chMinGy = gy;
            if (gy > chMaxGy) chMaxGy = gy;
          }
        }
      }
      if (pendingCount === 0) {
        animMinGx = Infinity;
        animMaxGx = -Infinity;
        animMinGy = Infinity;
        animMaxGy = -Infinity;
        lastAdvanceTime = 0;
      }
      if (chMinGx <= chMaxGx) {
        if (chMinGx < dirtyMinGx) dirtyMinGx = chMinGx;
        if (chMaxGx > dirtyMaxGx) dirtyMaxGx = chMaxGx;
        if (chMinGy < dirtyMinGy) dirtyMinGy = chMinGy;
        if (chMaxGy > dirtyMaxGy) dirtyMaxGy = chMaxGy;
      }
    };

    /** Full-grid rebuild - only on first load and on resize. */
    const rebuildMasksFull = () => {
      for (let i = 0; i < CELL_COUNT; i++) writeCell(i);
      eraseCtx.putImageData(eraseData, 0, 0);
      glowCtx.putImageData(glowData, 0, 0);
      charCtx.putImageData(charData, 0, 0);
      cavityCtx.putImageData(cavityData, 0, 0);
    };

    /** Rebuilds only the given cell rectangle and uploads just that dirty
     *  region - the erosion field only ever changes near the cursor, so
     *  cells outside this box already hold correct pixels from a previous
     *  frame. Keeps per-frame cost independent of total grid resolution. */
    const rebuildMasksRegion = (minGx: number, maxGx: number, minGy: number, maxGy: number) => {
      // The dirty rectangle of a long diagonal path is mostly untouched
      // cells - only recompute the ones deposit actually changed.
      for (let gy = minGy; gy <= maxGy; gy++) {
        const rowStart = gy * GRID_W;
        for (let gx = minGx; gx <= maxGx; gx++) {
          const i = rowStart + gx;
          if (touchedCells[i]) {
            touchedCells[i] = 0;
            writeCell(i);
          }
        }
      }
      const rw = maxGx - minGx + 1;
      const rh = maxGy - minGy + 1;
      eraseCtx.putImageData(eraseData, 0, 0, minGx, minGy, rw, rh);
      glowCtx.putImageData(glowData, 0, 0, minGx, minGy, rw, rh);
      charCtx.putImageData(charData, 0, 0, minGx, minGy, rw, rh);
      cavityCtx.putImageData(cavityData, 0, 0, minGx, minGy, rw, rh);
    };

    /** result = human*(1-m) + robot*m, both scaled by the SAME eraseCanvas.
     *  Nothing is composited "behind" anything: each layer is multiplied by
     *  its own share of the mask in isolation, then the two are summed
     *  (premultiplied 'lighter' == exact lerp where both are opaque). A
     *  transparent robot pixel under m=1 therefore yields page background,
     *  and can never let the human back in. */
    const renderFrame = () => {
      if (loaded < 2 || width < 1 || height < 1) return;

      // Sampling state is set before ANY draw, every frame - context state
      // persists, so setting it after the first drawCover made frame 1 use
      // different resampling than every later frame.
      for (const c of [ctx, humanCtx]) {
        c.imageSmoothingEnabled = true;
        c.imageSmoothingQuality = 'high';
      }

      // Layer 1 (offscreen): human x (1 - m).
      humanCtx.globalCompositeOperation = 'source-over';
      humanCtx.clearRect(0, 0, width, height);
      drawCover(humanCtx, portraitImg, portraitImg.naturalWidth, portraitImg.naturalHeight, width, height, OBJECT_POSITION_X, OBJECT_POSITION_Y);
      // source-atop: the scorch can only land on opaque human pixels.
      humanCtx.globalCompositeOperation = 'source-atop';
      humanCtx.drawImage(charCanvas, 0, 0, width, height);
      humanCtx.globalCompositeOperation = 'destination-out';
      humanCtx.drawImage(eraseCanvas, 0, 0, width, height);
      humanCtx.globalCompositeOperation = 'source-over';

      // Layer 2 (visible canvas): robot x m.
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      drawCover(ctx, robotImg, robotImg.naturalWidth, robotImg.naturalHeight, width, height, OBJECT_POSITION_X, OBJECT_POSITION_Y);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(eraseCanvas, 0, 0, width, height);

      // DEPTH: the skin that remains (layer 1, thin fragments included) casts
      // a soft shadow onto the robot beneath it, so the cavity under any
      // overhanging or hanging skin is dark and follows that skin's own shape.
      // The skin layer is drawn far off-canvas with the shadow offset
      // compensating, so ONLY its shadow lands; source-atop keeps it on
      // existing robot pixels (transparent areas stay page background). Drawn
      // before the skin is added, so it darkens the robot, never the skin.
      if (anyBurn && TUNING.SHADOW_ALPHA > 0) {
        const dpr = canvas.width / width;
        const FAR = 4000;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.shadowColor = `rgba(4,2,2,${TUNING.SHADOW_ALPHA})`;
        ctx.shadowBlur = TUNING.SHADOW_BLUR * width * dpr;
        ctx.shadowOffsetX = (FAR + TUNING.SHADOW_OFFSET_X * width) * dpr;
        ctx.shadowOffsetY = TUNING.SHADOW_OFFSET_Y * width * dpr;
        ctx.drawImage(humanLayer, -FAR, 0, width, height);
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      // Cavity beside lifted sheets / folds (robot pixels only).
      if (anyBurn) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.drawImage(cavityCanvas, 0, 0, width, height);
      }

      // Sum the layers.
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(humanLayer, 0, 0, width, height);
      // Then the (human-confined) edge glow.
      ctx.drawImage(glowCanvas, 0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    };

    /** Adds one smoothstep heat stamp centered on (x,y) and marks the cells it
     *  changed. It does NOT upload to the mask canvases - a whole path is many
     *  stamps but costs one putImageData via flushDirty(). `amount` is
     *  time-equivalent seconds: erosion added at a cell is
     *  BURN_RATE * falloff(distance) * amount. With `aniso` the reach depends
     *  on the direction from the anchor (dwell and click only), so repeated
     *  deposits at one spot grow into an irregular shape, not a circle. */
    const depositHeat = (x: number, y: number, amount: number, aniso = false) => {
      if (amount <= 0) return;
      const radiusPx = TUNING.BURN_RADIUS_FRAC * width;
      const maxReachPx = aniso ? radiusPx * (1 + TUNING.ANISO_AMP) : radiusPx;
      const cgx = (x / width) * GRID_W;
      const cgy = (y / height) * GRID_H;
      const reachGx = (maxReachPx / width) * GRID_W;
      const reachGy = (maxReachPx / height) * GRID_H;
      const minGx = Math.max(0, Math.floor(cgx - reachGx));
      const maxGx = Math.min(GRID_W - 1, Math.ceil(cgx + reachGx));
      const minGy = Math.max(0, Math.floor(cgy - reachGy));
      const maxGy = Math.min(GRID_H - 1, Math.ceil(cgy + reachGy));
      if (minGx > maxGx || minGy > maxGy) return;

      // Reach as a function of angle, tabulated once per stamp: smooth
      // periodic noise sampled around a circle, offset by the anchor.
      const ANGLES = 96;
      let reachByAngle: Float32Array | null = null;
      if (aniso) {
        reachByAngle = new Float32Array(ANGLES);
        const ax = (x / width) * 17.3;
        const ay = (y / height) * 23.7;
        const F = TUNING.ANISO_FREQ;
        for (let a = 0; a < ANGLES; a++) {
          const th = (a / ANGLES) * Math.PI * 2;
          const c = Math.cos(th) * F;
          const sn = Math.sin(th) * F;
          const n = 0.65 * valueNoise2D(hAniso, c + ax, sn + ay) + 0.35 * valueNoise2D(hAniso, c * 2.1 + ax + 7.3, sn * 2.1 + ay + 3.1);
          reachByAngle[a] = radiusPx * (1 + TUNING.ANISO_AMP * Math.max(-1, Math.min(1, (n - 0.5) * 4)));
        }
      }

      let touched = false;
      for (let gy = minGy; gy <= maxGy; gy++) {
        const oy = (gy / GRID_H) * height - y;
        for (let gx = minGx; gx <= maxGx; gx++) {
          const ox = (gx / GRID_W) * width - x;
          const dist = Math.hypot(ox, oy);
          let reach = radiusPx;
          if (reachByAngle) {
            const a = Math.round(((Math.atan2(oy, ox) + Math.PI) / (Math.PI * 2)) * ANGLES) % ANGLES;
            reach = reachByAngle[a];
          }
          const falloff = smoothstep(reach, 0, dist);
          if (falloff <= 0) continue;
          const idx = gy * GRID_W + gx;
          const prev = erosion[idx];
          const next = Math.min(1.15, prev + TUNING.BURN_RATE * falloff * amount);
          if (next !== prev) {
            erosion[idx] = next;
            if (prev < resistance[idx] && next >= resistance[idx]) exposedCount++;
            // The true field moved; the drawn field will follow (advanceBurn).
            if (!burnPending[idx]) {
              burnPending[idx] = 1;
              pendingCount++;
            }
            touched = true;
          }
        }
      }
      if (touched) {
        anyBurn = true;
        if (burnState === 'IDLE') burnState = 'BURNING';
        if (minGx < animMinGx) animMinGx = minGx;
        if (maxGx > animMaxGx) animMaxGx = maxGx;
        if (minGy < animMinGy) animMinGy = minGy;
        if (maxGy > animMaxGy) animMaxGy = maxGy;
        if (minGx < heatMinGx) heatMinGx = minGx;
        if (maxGx > heatMaxGx) heatMaxGx = maxGx;
        if (minGy < heatMinGy) heatMinGy = minGy;
        if (maxGy > heatMaxGy) heatMaxGy = maxGy;
      }
    };

    /** Uploads whatever depositHeat() touched since the last flush, once.
     *  Returns whether anything changed (i.e. whether a repaint is due). */
    const flushDirty = () => {
      if (dirtyMinGx > dirtyMaxGx || dirtyMinGy > dirtyMaxGy) return false;
      rebuildMasksRegion(dirtyMinGx, dirtyMaxGx, dirtyMinGy, dirtyMaxGy);
      dirtyMinGx = Infinity;
      dirtyMaxGx = -Infinity;
      dirtyMinGy = Infinity;
      dirtyMaxGy = -Infinity;
      return true;
    };

    /** Deposits heat along the RAW pointer path (lastX,lastY) -> (toX,toY).
     *  A moved segment is charged max(elapsed time, length * amountPerPx),
     *  where amountPerPx makes one pass leave TRAVEL_CENTER_EROSION on the
     *  centerline (the falloff integrates to exactly one burn radius across
     *  the path, so amountPerPx = TRAVEL_CENTER_EROSION / (BURN_RATE * R)) -
     *  i.e. heat follows distance travelled, not how long the cursor
     *  happened to spend there. That charge is spread over stamps spaced at
     *  most DEPOSIT_SPACING_FRAC * R apart, so they overlap into one smooth
     *  field. A zero-length segment is a pure time-based dwell. Time only
     *  ever adds (a stalled/negative delta cannot drop a segment). */
    const depositPath = (toX: number, toY: number, toTime: number) => {
      const fromX = lastX;
      const fromY = lastY;
      const rawDt = lastDepositTime ? (toTime - lastDepositTime) / 1000 : 0;
      const dt = Math.max(0, Math.min(0.05, rawDt));
      const segX = toX - fromX;
      const segY = toY - fromY;
      const distance = Math.hypot(segX, segY);

      lastX = toX;
      lastY = toY;
      lastDepositTime = toTime;

      // Nothing new may burn while the skin is closing back over the opening
      // (the pointer position is still tracked above).
      if (burnState === 'RESTORING') return;

      if (distance < 1e-3) {
        if (!suppressDwell) depositHeat(toX, toY, dt, true);
        return;
      }

      const radiusPx = TUNING.BURN_RADIUS_FRAC * width;
      const amountPerPx = TUNING.TRAVEL_CENTER_EROSION / (TUNING.BURN_RATE * radiusPx);
      const amount = Math.max(dt, distance * amountPerPx);
      // Spacing widens (rather than work growing) for a pathological jump.
      const spacing = Math.max(1, radiusPx * TUNING.DEPOSIT_SPACING_FRAC, distance / TUNING.MAX_INTERP_STEPS);
      const steps = Math.max(1, Math.ceil(distance / spacing));
      const stepAmount = amount / steps;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        depositHeat(fromX + segX * t, fromY + segY * t, stepAmount);
      }
    };

    /** The front's value at cell i for a front of reach R: a plateau at the
     *  erosion cap inside (reach - band), a smoothstep edge across the band,
     *  0 beyond. Reach depends on the cell's direction from the click. */
    const frontValue = (i: number, R: number) => {
      const reach = R * frontScale[frontAng[i]];
      const d = frontDist[i];
      if (d >= reach) return 0;
      return FRONT_PEAK * smoothstep(reach, reach - frontBand, d);
    };

    /** Tabulates every cell's distance / direction from (x, y) and the reach
     *  at which the plateau covers every cell that matters (all of them, or
     *  only those burnt in `only` when given). */
    const prepareFront = (x: number, y: number, only?: Float32Array) => {
      const radiusPx = TUNING.BURN_RADIUS_FRAC * width;
      const amp = TUNING.CLICK_FRONT_ANISO;
      frontBand = radiusPx * TUNING.CLICK_FRONT_BAND;
      // Reach as a function of direction: the dwell/click anisotropy noise,
      // seeded by the click position, at the front's own (weaker) amplitude.
      const ax = (x / width) * 17.3;
      const ay = (y / height) * 23.7;
      const F = TUNING.ANISO_FREQ;
      for (let a = 0; a < FRONT_ANGLES; a++) {
        const th = (a / FRONT_ANGLES) * Math.PI * 2;
        const c = Math.cos(th) * F;
        const sn = Math.sin(th) * F;
        const n = 0.65 * valueNoise2D(hAniso, c + ax, sn + ay) + 0.35 * valueNoise2D(hAniso, c * 2.1 + ax + 7.3, sn * 2.1 + ay + 3.1);
        frontScale[a] = 1 + amp * Math.max(-1, Math.min(1, (n - 0.5) * 4));
      }
      for (let gy = 0; gy < GRID_H; gy++) {
        const oy = (gy / GRID_H) * height - y;
        for (let gx = 0; gx < GRID_W; gx++) {
          const ox = (gx / GRID_W) * width - x;
          const i = gy * GRID_W + gx;
          frontDist[i] = Math.hypot(ox, oy);
          frontAng[i] = Math.round(((Math.atan2(oy, ox) + Math.PI) / (Math.PI * 2)) * FRONT_ANGLES) % FRONT_ANGLES;
        }
      }
      // The exact reach at which the plateau has passed every cell in play
      // (in its own direction), so no time is spent sweeping empty space.
      let need = 0;
      for (let i = 0; i < CELL_COUNT; i++) {
        if (only && only[i] <= 0) continue;
        const r = (frontDist[i] + frontBand) / frontScale[frontAng[i]];
        if (r > need) need = r;
      }
      frontTotal = need;
      frontActive = true;
    };

    /** Raises the erosion field to the front of reach R (never lowers it) and
     *  marks the cells that changed, exactly as depositHeat does. */
    const depositFront = (R: number) => {
      let minGx = GRID_W;
      let maxGx = -1;
      let minGy = GRID_H;
      let maxGy = -1;
      for (let gy = 0; gy < GRID_H; gy++) {
        const row = gy * GRID_W;
        for (let gx = 0; gx < GRID_W; gx++) {
          const i = row + gx;
          const prev = erosion[i];
          if (prev >= FRONT_PEAK) continue;
          const v = frontValue(i, R);
          if (v <= prev) continue;
          erosion[i] = v;
          if (prev < resistance[i] && v >= resistance[i]) exposedCount++;
          if (!burnPending[i]) {
            burnPending[i] = 1;
            pendingCount++;
          }
          if (gx < minGx) minGx = gx;
          if (gx > maxGx) maxGx = gx;
          if (gy < minGy) minGy = gy;
          if (gy > maxGy) maxGy = gy;
        }
      }
      if (maxGx < 0) return;
      anyBurn = true;
      if (burnState === 'IDLE') burnState = 'BURNING';
      if (minGx < animMinGx) animMinGx = minGx;
      if (maxGx > animMaxGx) animMaxGx = maxGx;
      if (minGy < animMinGy) animMinGy = minGy;
      if (maxGy > animMaxGy) animMaxGy = maxGy;
      if (minGx < heatMinGx) heatMinGx = minGx;
      if (maxGx > heatMaxGx) heatMaxGx = maxGx;
      if (minGy < heatMinGy) heatMinGy = minGy;
      if (maxGy > heatMaxGy) heatMaxGy = maxGy;
    };

    /** Click burn: advances the front by the real time elapsed (all the way
     *  under reduced motion). */
    const deliverCharge = (now: number) => {
      if (chargeRemaining <= 0) return;
      const dt = lastChargeTime ? Math.min(0.1, Math.max(0, (now - lastChargeTime) / 1000)) : 1 / 60;
      lastChargeTime = now;
      chargeU = reducedMotion ? 1 : Math.min(1, chargeU + dt / (TUNING.CLICK_BURN_MS / 1000));
      depositFront(frontTotal * chargeU);
      if (chargeU >= 1) {
        chargeRemaining = 0;
        lastChargeTime = 0;
      }
    };

    /** IDLE -> BURNING: a click with nothing exposed starts a front at the
     *  click position that spreads over the whole face, through the same
     *  field as hover. */
    const startClickBurn = (x: number, y: number) => {
      burnOrigin = { x, y };
      restoreOrigin = null;
      prepareFront(burnOrigin.x, burnOrigin.y);
      chargeRemaining = 1;
      chargeU = 0;
      lastChargeTime = 0;
      suppressDwell = false;
      burnState = 'BURNING';
    };

    /** BURNING | EXPOSED -> RESTORING: freeze the erosion field as a
     *  snapshot and start scaling it back to zero. */
    const startRestore = (now: number, x: number, y: number) => {
      burnState = 'RESTORING';
      chargeRemaining = 0;
      lastChargeTime = 0;
      suppressDwell = true;
      restoreSnapshot.set(erosion);
      restoreStart = now;
      // Exposure only exists while a cell's scale is above resistance/erosion,
      // so scaling all the way from 1 to 0 would waste half the time where
      // nothing visibly changes. Find where the LAST exposed cell closes and
      // spend the motion between there and 1.
      let sMin = 1;
      for (let gy = heatMinGy; gy <= heatMaxGy; gy++) {
        for (let gx = heatMinGx; gx <= heatMaxGx; gx++) {
          const i = gy * GRID_W + gx;
          const e = erosion[i];
          if (e > 0 && e >= resistance[i]) sMin = Math.min(sMin, resistance[i] / e);
        }
      }
      restoreSMin = sMin;
      if (frontActive) {
        // A whole-face burn is restored by a front of its own, spreading from
        // THIS click - not from wherever the burn began.
        burnOrigin = null;
        restoreOrigin = { x, y };
        prepareFront(restoreOrigin.x, restoreOrigin.y, restoreSnapshot);
      }
      // The drawn field is driven directly while restoring: nothing may still
      // be "catching up".
      for (let gy = heatMinGy; gy <= heatMaxGy; gy++) {
        for (let gx = heatMinGx; gx <= heatMaxGx; gx++) burnPending[gy * GRID_W + gx] = 0;
      }
      pendingCount = 0;
      animMinGx = Infinity;
      animMaxGx = -Infinity;
      animMinGy = Infinity;
      animMaxGy = -Infinity;
      lastAdvanceTime = 0;
    };

    /** One frame of restoration: every cell's erosion is its snapshot scaled
     *  by (1 - progress * its own pace), the drawn field follows it directly,
     *  so the contour closes back in irregularly - the same detail systems
     *  (tongues, tears, sheets, scorch) play out in reverse. On the last frame
     *  everything is reset to the untouched state. */
    const stepRestore = (now: number) => {
      const u = reducedMotion ? Infinity : Math.max(0, (now - restoreStart) / 1000) / (TUNING.RESTORE_MS / 1000);
      // The slowest cell (pace 0.9) is finished at u = 1 / 0.9.
      const done = u >= 1 / 0.9;
      // Whole-face burn: the restoring front spreads out from the restore
      // click (eased both ends) and lowers the erosion it passes over.
      let frontR = 0;
      if (frontActive) {
        const uf = Math.min(1, u * 0.9);
        frontR = frontTotal * (uf * uf * (3 - 2 * uf));
      }
      let chMinGx = Infinity;
      let chMaxGx = -Infinity;
      let chMinGy = Infinity;
      let chMaxGy = -Infinity;
      for (let gy = heatMinGy; gy <= heatMaxGy; gy++) {
        const row = gy * GRID_W;
        for (let gx = heatMinGx; gx <= heatMaxGx; gx++) {
          const i = row + gx;
          const snap = restoreSnapshot[i];
          if (snap === 0 && erosion[i] === 0) continue;
          let e = 0;
          if (!done && frontActive) {
            e = Math.max(0, snap - frontValue(i, frontR));
          } else if (!done) {
            // Each cell runs at its own pace. First 80% of its run: scale from
            // 1 down to where exposure ends (the visible closing); last 20%:
            // the scorch and thin skin fade the rest of the way out.
            const pu = u * (0.9 + 0.35 * ((edgeDetail.thickness(i, gx, gy) - 0.6) / 0.9));
            const sc = pu <= 0.8 ? 1 - (1 - restoreSMin) * (pu / 0.8) : restoreSMin * (1 - (pu - 0.8) / 0.2);
            e = snap * Math.max(0, sc);
          }
          const g = e - resistance[i];
          if (e === erosion[i] && g === burnVis[i]) continue;
          erosion[i] = e;
          burnVis[i] = g;
          touchedCells[i] = 1;
          if (gx < chMinGx) chMinGx = gx;
          if (gx > chMaxGx) chMaxGx = gx;
          if (gy < chMinGy) chMinGy = gy;
          if (gy > chMaxGy) chMaxGy = gy;
        }
      }
      if (chMinGx <= chMaxGx) {
        if (chMinGx < dirtyMinGx) dirtyMinGx = chMinGx;
        if (chMaxGx > dirtyMaxGx) dirtyMaxGx = chMaxGx;
        if (chMinGy < dirtyMinGy) dirtyMinGy = chMinGy;
        if (chMaxGy > dirtyMaxGy) dirtyMaxGy = chMaxGy;
      }
      if (done) {
        // Back to a pristine face: no exposure, no transient scorch, no
        // fragments, no burn progress, no shadow pass.
        exposedCount = 0;
        heatMinGx = Infinity;
        heatMaxGx = -Infinity;
        heatMinGy = Infinity;
        heatMaxGy = -Infinity;
        anyBurn = false;
        frontActive = false;
        burnOrigin = null;
        restoreOrigin = null;
        burnState = 'IDLE';
      }
    };

    const refreshState = () => {
      if (burnState === 'RESTORING') return;
      if (pendingCount > 0 || chargeRemaining > 0) burnState = 'BURNING';
      else burnState = exposedCount > 0 ? 'EXPOSED' : 'IDLE';
    };

    const step = (time: number) => {
      raf = 0;
      if (burnState === 'RESTORING') {
        stepRestore(time);
      } else {
        if (active && !reducedMotion && !suppressDwell) {
          if (movedThisFrame) {
            // onMove already deposited and painted this frame's movement.
            movedThisFrame = false;
          } else {
            // Zero-length target: the stationary-dwell top-up. It spends the
            // time since lastDepositTime, which onMove/onEnter keep current.
            depositPath(lastX, lastY, time);
          }
        }
        deliverCharge(time);
        advanceBurn(time);
      }
      if (flushDirty()) renderFrame();
      refreshState();
      // Keep going while something is still happening; stops by itself once
      // the pointer is idle (or restored) and the burn has settled.
      if ((active && !reducedMotion && !suppressDwell) || pendingCount > 0 || chargeRemaining > 0 || burnState === 'RESTORING') {
        raf = requestAnimationFrame(step);
      }
    };

    const ensureLoop = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !armedBy(e)) return;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const x = Math.min(width, Math.max(0, e.clientX - rect.left));
      const y = Math.min(height, Math.max(0, e.clientY - rect.top));
      lastX = x;
      lastY = y;
      lastDepositTime = e.timeStamp;
      active = true;
      // Nothing new may burn while the skin is closing back over the opening.
      if (burnState === 'RESTORING') return;
      suppressDwell = false;
      // First contact must be visible on this exact event, not the next
      // animation frame - no time has elapsed to spend yet, so this one
      // deposit uses a fixed budget instead.
      depositHeat(x, y, TUNING.FIRST_CONTACT_CENTER_EROSION / TUNING.BURN_RATE);
      advanceBurn(e.timeStamp);
      flushDirty();
      renderFrame();
      refreshState();
      if (!reducedMotion) ensureLoop();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !armedBy(e)) return;
      // Pointer already over the container when the page loaded: no
      // pointerenter will ever fire, so treat the first move as contact.
      if (!active) {
        onEnter(e);
        return;
      }
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      // Real movement lifts the post-restore dwell hold.
      if (burnState !== 'RESTORING') suppressDwell = false;
      // Coalesced events carry every raw sample the OS delivered between
      // animation frames (a fast flick can be many), not just the last one.
      const coalesced = e.getCoalescedEvents?.();
      const samples = coalesced && coalesced.length ? coalesced : [e];
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const x = Math.min(width, Math.max(0, s.clientX - rect.left));
        const y = Math.min(height, Math.max(0, s.clientY - rect.top));
        depositPath(x, y, s.timeStamp);
      }
      advanceBurn(e.timeStamp);
      // Paint on the event itself: input -> pixels with no extra frame of
      // latency, and independent of whether a rAF is currently being served.
      if (flushDirty()) renderFrame();
      refreshState();
      movedThisFrame = true;
      if (!reducedMotion) ensureLoop();
    };

    /** Click / tap (any pointer type). Robot exposed (however it got there:
     *  hover, stationary cursor or an earlier click): restore. Nothing
     *  exposed: burn at the click position. Ignored mid-restore. */
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (burnState === 'RESTORING') return;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const x = Math.min(width, Math.max(0, e.clientX - rect.left));
      const y = Math.min(height, Math.max(0, e.clientY - rect.top));
      if (exposedCount > 0) {
        startRestore(e.timeStamp, x, y);
        stepRestore(e.timeStamp);
      } else {
        startClickBurn(x, y);
        deliverCharge(e.timeStamp);
        advanceBurn(e.timeStamp);
      }
      flushDirty();
      renderFrame();
      refreshState();
      ensureLoop();
    };

    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      active = false;
    };

    // Uses contentRect rather than getBoundingClientRect() - immune to any
    // ancestor CSS transform (the hero entrance animation translates the
    // wrapper around this component), so canvas sizing can't be thrown off
    // by anything other than an actual layout-box resize.
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      sizeSurfaces();
      renderFrame();
    });
    ro.observe(container);

    // Dev-only inspection surface (absent from production builds): exposes the
    // grid-resolution data that actually decides what is shown, so tests can
    // measure the true exposure instead of inferring it from rendered pixels
    // (which the cast shadow, scorch and sheets all alter by design).
    //   field: the DRAWN erosion-minus-resistance field (>= 0 = burnt through)
    //   mask:  the actual mask bytes (alpha 0..255; >= 128 = exposed)
    const debugWindow = window as unknown as { __faceDebug?: FaceDebug };
    if (process.env.NODE_ENV !== 'production') {
      debugWindow.__faceDebug = { gridW: GRID_W, gridH: GRID_H, field: burnVis, erosion, resistance, mask: eraseData.data, state: () => burnState };
    }

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointerenter', onEnter);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('pointercancel', onLeave);

    return () => {
      cancelled = true;
      if (debugWindow.__faceDebug) delete debugWindow.__faceDebug;
      ro.disconnect();
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointercancel', onLeave);
      if (raf) cancelAnimationFrame(raf);
      if (warmTimer) clearTimeout(warmTimer);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      id="hero-portrait"
      className="relative w-full max-w-[400px] aspect-[3/4] mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-border shadow-lg shadow-slate-900/10 dark:shadow-none"
    >
      <canvas ref={canvasRef} role="img" aria-label="Sarthak Roy" className="absolute inset-0 w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 animate-pulse bg-surface-secondary" aria-hidden="true" />
      )}
    </div>
  );
}
