'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/* ===========================================================================
 * LIQUID CHROME LENS
 *
 * The hero portrait is the ORIGINAL PHOTOGRAPH, painted immediately as a
 * plain <img>. A WebGL canvas layers on top once it is ready and renders the
 * same photograph plus a small, soft-edged liquid-chrome region that follows
 * the cursor. Nothing outside that region is altered.
 *
 * Loading order is deliberate:
 *   1. container reserves its exact aspect ratio (no CLS)
 *   2. the <img> paints the portrait as soon as it downloads
 *   3. WebGL initialises asynchronously behind it
 *   4. the canvas cross-fades in, pixel-matched to the <img>
 * The user never sees a blank or black rectangle, and if WebGL fails or is
 * unavailable the <img> simply remains - it IS the fallback.
 *
 * Raw WebGL 1.0, one fullscreen quad, one shader, no dependencies.
 * ==========================================================================*/

/**
 * Alpha-baked, downscaled derivative of public/wmremove-transformed.png.
 *
 * The original declares colourType 6 (RGBA) but every pixel is alpha 255 - its
 * apparent transparency is a light-grey CHECKERBOARD painted into the RGB
 * channels by the watermark-removal tool. That checkerboard was flood-filled
 * from the border into a genuine alpha channel and the result written as WebP:
 * 7.7 MB -> 260 KB, 1152x1717, facial detail and blue rim lighting preserved.
 *
 * Because alpha is now real, there is NO runtime image preprocessing at all.
 */
const PORTRAIT_SRC = '/portrait-hero.webp';
const PORTRAIT_W = 1152;
const PORTRAIT_H = 1717;

/* ---------------------------------------------------------------------------
 * TUNING
 * -------------------------------------------------------------------------*/
const TUNING = {
  /** Base photograph level. 1.0 = the original image, untouched. */
  BASE_PHOTO: 1.0,

  /** Lens radius, height-normalised. Small on purpose: a local patch of the
   *  face, never the whole head. */
  CURSOR_RADIUS: 0.16,
  /** Inner edge as a fraction of the radius. Lower = softer feather, so the
   *  boundary never reads as an obvious circle. */
  CURSOR_FEATHER: 0.12,
  /** Pointer easing per frame (1.0 = instant). High: tracking must not lag. */
  CURSOR_SMOOTHING: 0.55,

  /** ATTACK: chrome appears essentially instantly under the cursor. */
  CHROME_ATTACK: 0.5,
  /** RELEASE: once the cursor moves on, the metal lingers and reconstructs
   *  back into the photograph over this long. */
  CHROME_RELEASE_MS: 1100,
  /** Cursor travel between trail samples. */
  TRAIL_SPACING: 0.03,

  CHROME_STRENGTH: 1.0,
  CHROME_REFLECTION_STRENGTH: 1.45,
  CHROME_SPECULAR_STRENGTH: 0.6,
  /** Refraction-like warp inside the lens. Tiny: the photograph must stay
   *  geometrically stable. */
  CHROME_DISTORTION: 0.007,
  /** How hard image-derived normals bend the reflection. Large on purpose:
   *  the luminance gradient across a few texels is only ~0.02, and this is
   *  what makes the reflection vector sweep the environment instead of
   *  sitting at R.y == 0 and returning a black void. */
  CHROME_NORMAL_STRENGTH: 9.0,
  CHROME_SPEC_POWER: 32.0,
  /** How much underlying photo luminance survives in the metal, so the
   *  feature under the lens stays recognisable. */
  CHROME_IMAGE_READTHROUGH: 0.75,
  /** Sobel sample radius, in source texels. Wide on purpose: a small radius
   *  picks up eyebrow and lash detail, which swings the normals violently and
   *  makes the metal read as scratchy filaments instead of a smooth surface.
   *  Three octaves are blended, weighted toward the widest. */
  SOBEL_RADIUS: 14.0,

  /** Reconstruction dissolve. Perturbation scales with (1 - raw) so the lens
   *  core stays a solid smooth surface and only the retreating edge breaks up. */
  DISSOLVE_SCALE: 20.0,
  DISSOLVE_AMOUNT: 0.85,
  DISSOLVE_EDGE: 0.26,
  /** Molten rim on the reconstruction boundary. An accent, not a glow. */
  RECONSTRUCT_RIM: 0.32,
};

/** Cover-fit: fraction of the excess height taken off the TOP. Must equal the
 *  <img> objectPosition below, or the canvas would jump when it fades in. */
const CROP_TOP_BIAS = 0.2;
const CONTAINER_ASPECT = 3 / 4;
/** Trail length. Each point costs one fragment uniform vector. */
const TRAIL_N = 16;
const MAX_DPR = 2;

const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

/* ===========================================================================
 * SHADERS
 * ==========================================================================*/

const VS = `
  attribute vec2 a_pos;
  attribute vec2 a_uv;
  varying vec2 v_uv;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
    v_uv = a_uv;
  }
`;

const FS = `
  precision highp float;
  varying vec2 v_uv;

  uniform sampler2D u_photo;
  uniform vec2 u_uvScale;
  uniform vec2 u_uvOffset;
  uniform vec2 u_texel;
  /** xy = cursor in container UV, z = strength (1 = fresh, 0 = reconstructed). */
  uniform vec3 u_trail[${TRAIL_N}];
  uniform float u_aspect;

  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  float L(vec2 uv) { return lum(texture2D(u_photo, uv).rgb); }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 fr = fract(p);
    vec2 u = fr * fr * (3.0 - 2.0 * fr);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  /* Sobel over photo luminance. v grows downward, so screen-up is -r.y. */
  vec2 lumaGrad(vec2 uv, vec2 r) {
    float tl = L(uv + vec2(-r.x, -r.y));
    float tt = L(uv + vec2( 0.0, -r.y));
    float tr = L(uv + vec2( r.x, -r.y));
    float ll = L(uv + vec2(-r.x,  0.0));
    float rr = L(uv + vec2( r.x,  0.0));
    float bl = L(uv + vec2(-r.x,  r.y));
    float bb = L(uv + vec2( 0.0,  r.y));
    float br = L(uv + vec2( r.x,  r.y));
    float gx = (tr + 2.0 * rr + br) - (tl + 2.0 * ll + bl);
    float gy = (tl + 2.0 * tt + tr) - (bl + 2.0 * bb + br);
    return vec2(gx, gy) * 0.125;
  }

  /* Analytic dark studio environment. Deep near-black almost everywhere with
     one NARROW bright streak: wide dark areas between sharp highlights are
     what make metal read as polished chrome rather than flat grey. */
  vec3 envSample(vec3 r) {
    float y = clamp(r.y, -1.0, 1.0);
    vec3 c = mix(vec3(0.004, 0.005, 0.010),
                 vec3(0.028, 0.038, 0.062),
                 smoothstep(-0.7, 0.8, y));
    c += vec3(0.70, 0.78, 0.95) * exp(-pow((y - 0.26) / 0.20, 2.0));
    c += vec3(0.13, 0.17, 0.27) * exp(-pow((y + 0.38) / 0.24, 2.0));
    c *= 0.82 + 0.18 * cos(r.x * 5.0);
    return c;
  }

  void main() {
    vec2 puv = u_uvOffset + v_uv * u_uvScale;
    vec4 tex = texture2D(u_photo, puv);
    float subject = tex.a;

    // The ORIGINAL photograph, composited over the near-black panel.
    vec3 base = tex.rgb * subject * ${f(TUNING.BASE_PHOTO)};

    // Localized lens. Each trail sample contributes a soft, aspect-corrected
    // radial falloff and the strongest wins. Fresh samples sit at full
    // strength (instant attack); older ones fade over CHROME_RELEASE_MS, so
    // the metal lingers behind the cursor and reconstructs into the photo.
    float raw = 0.0;
    for (int i = 0; i < ${TRAIL_N}; i++) {
      if (u_trail[i].z > 0.0) {
        vec2 d = v_uv - u_trail[i].xy;
        d.x *= u_aspect;
        float g = 1.0 - smoothstep(
          ${f(TUNING.CURSOR_RADIUS)} * ${f(TUNING.CURSOR_FEATHER)},
          ${f(TUNING.CURSOR_RADIUS)},
          length(d)
        );
        raw = max(raw, g * u_trail[i].z);
      }
    }

    // Reconstruction: decaying regions break up along a noise field instead of
    // fading flatly. The perturbation is weighted by (1.0 - raw) so the lens
    // core stays solid, and SUBTRACTING (rather than thresholding) guarantees
    // mask == 0 wherever raw == 0, so nothing can leak outside the lens.
    float nz = vnoise(v_uv * ${f(TUNING.DISSOLVE_SCALE)}) * 0.7
             + vnoise(v_uv * ${f(TUNING.DISSOLVE_SCALE)} * 2.7) * 0.3;
    float perturbed = raw - nz * ${f(TUNING.DISSOLVE_AMOUNT)} * (1.0 - raw);
    float mask = smoothstep(0.0, ${f(TUNING.DISSOLVE_EDGE)}, perturbed);
    mask *= subject * ${f(TUNING.CHROME_STRENGTH)};

    // Everything outside the lens is the untouched photograph. The early out
    // also keeps the 16 Sobel taps off the vast majority of pixels.
    if (mask < 0.002) {
      gl_FragColor = vec4(base, 1.0);
      return;
    }

    // Three octaves weighted toward the widest, so the metal follows broad
    // facial relief (brow ridge, nose, cheek) and not individual hairs.
    vec2 r1 = u_texel * ${f(TUNING.SOBEL_RADIUS)};
    vec2 grad = lumaGrad(puv, r1)       * 0.25
              + lumaGrad(puv, r1 * 2.0) * 0.35
              + lumaGrad(puv, r1 * 4.0) * 0.40;

    vec3 N = normalize(vec3(
      -grad.x * ${f(TUNING.CHROME_NORMAL_STRENGTH)} / u_aspect,
       grad.y * ${f(TUNING.CHROME_NORMAL_STRENGTH)},
       1.0
    ));

    // Very subtle refraction: the lens bends what it sits on, it does not
    // move the face.
    vec2 warp = N.xy * ${f(TUNING.CHROME_DISTORTION)} * mask;
    float under = lum(texture2D(u_photo, puv + warp).rgb);

    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 R = reflect(-V, N);
    vec3 env = envSample(R);

    vec3 Ldir = normalize(vec3(0.35, 0.45, 0.90));
    vec3 H = normalize(Ldir + V);
    float spec = pow(max(dot(N, H), 0.0), ${f(TUNING.CHROME_SPEC_POWER)});
    float fres = pow(1.0 - max(dot(N, V), 0.0), 5.0);

    vec3 chrome = vec3(0.014, 0.017, 0.024)
                + env * ${f(TUNING.CHROME_REFLECTION_STRENGTH)}
                + vec3(0.88, 0.92, 1.00) * spec * ${f(TUNING.CHROME_SPECULAR_STRENGTH)}
                + vec3(0.20, 0.27, 0.42) * fres * 0.40;

    // Let the photograph read through the metal so the feature under the lens
    // stays identifiable, while keeping the material dark.
    chrome *= (1.0 - ${f(TUNING.CHROME_IMAGE_READTHROUGH)})
            + ${f(TUNING.CHROME_IMAGE_READTHROUGH)} * (0.55 + 0.75 * under);

    // Molten rim along the reconstruction boundary only. Scaled by (1 - raw)
    // so the fresh lens under the cursor stays clean and the rim appears only
    // where the metal is actually retreating.
    float rim = mask * (1.0 - mask) * 4.0 * (1.0 - raw);
    chrome += vec3(0.40, 0.50, 0.72) * rim * ${f(TUNING.RECONSTRUCT_RIM)};

    chrome = clamp(chrome, 0.0, 1.0);

    gl_FragColor = vec4(mix(base, chrome, mask), 1.0);
  }
`;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/* ===========================================================================
 * COMPONENT
 * ==========================================================================*/

export function InteractiveFace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  /** Flips once the canvas has drawn a frame, so it can cross-fade in over
   *  the <img>. One state update for the whole lifetime of the component. */
  const [ready, setReady] = useState(false);

  // All pointer state lives in refs: moving the mouse never re-renders React.
  const target = useRef<[number, number]>([0.5, 0.45]);
  const smooth = useRef<[number, number]>([0.5, 0.45]);
  const active = useRef(false);
  const attack = useRef(0);
  const trail = useRef<{ x: number; y: number; t: number }[]>([]);

  useEffect(() => {
    // Every browser API below is reached only here, after client mount.
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let glCtx: WebGLRenderingContext | null = null;
    try {
      glCtx = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      }) as WebGLRenderingContext | null;
    } catch {
      glCtx = null;
    }
    // No WebGL: the <img> underneath simply stays visible.
    if (!glCtx) return;
    const gl: WebGLRenderingContext = glCtx;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const shaders: WebGLShader[] = [];
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

    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    let program: WebGLProgram | null = null;
    if (vs && fs) {
      program = gl.createProgram();
      if (program) {
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error('InteractiveFace: program link failed', gl.getProgramInfoLog(program));
          gl.deleteProgram(program);
          program = null;
        }
      }
    }
    // Shader failure must never blank the hero: leave the <img> showing.
    if (!program) {
      shaders.forEach((s) => gl.deleteShader(s));
      return;
    }
    const prog: WebGLProgram = program;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const aUv = gl.getAttribLocation(prog, 'a_uv');
    const uPhoto = gl.getUniformLocation(prog, 'u_photo');
    const uUvScale = gl.getUniformLocation(prog, 'u_uvScale');
    const uUvOffset = gl.getUniformLocation(prog, 'u_uvOffset');
    const uTexel = gl.getUniformLocation(prog, 'u_texel');
    const uTrail = gl.getUniformLocation(prog, 'u_trail');
    const uAspect = gl.getUniformLocation(prog, 'u_aspect');
    const trailData = new Float32Array(TRAIL_N * 3);

    const photoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, photoTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let uvScale: [number, number] = [1, 1];
    let uvOffset: [number, number] = [0, 0];
    let texel: [number, number] = [1 / PORTRAIT_W, 1 / PORTRAIT_H];
    let loaded = false;
    let revealed = false;
    let aspect = CONTAINER_ASPECT;
    let disposed = false;
    let onScreen = true;
    let running = false;
    let raf = 0;

    const requestRender = () => {
      // document.hidden is checked here, not only in the visibilitychange
      // handler, so a pointer event cannot restart the loop in a hidden tab.
      if (disposed || !onScreen || document.hidden || running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
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

    // Same URL as the <img>, so this is served straight from cache and adds
    // no extra network request.
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => {
      if (disposed) return;
      const srcAspect = img.naturalWidth / img.naturalHeight;
      if (srcAspect < CONTAINER_ASPECT) {
        const visibleV = srcAspect / CONTAINER_ASPECT;
        uvScale = [1, visibleV];
        uvOffset = [0, (1 - visibleV) * CROP_TOP_BIAS];
      } else {
        const visibleU = CONTAINER_ASPECT / srcAspect;
        uvScale = [visibleU, 1];
        uvOffset = [(1 - visibleU) * 0.5, 0];
      }
      texel = [1 / img.naturalWidth, 1 / img.naturalHeight];

      gl.bindTexture(gl.TEXTURE_2D, photoTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      loaded = true;
      resize();
      requestRender();
    };
    img.src = PORTRAIT_SRC;

    function frame() {
      if (disposed) return;
      const now = performance.now();

      const ease = reduceMotion ? 1 : TUNING.CURSOR_SMOOTHING;
      smooth.current[0] += (target.current[0] - smooth.current[0]) * ease;
      smooth.current[1] += (target.current[1] - smooth.current[1]) * ease;

      attack.current += ((active.current ? 1 : 0) - attack.current) *
        (reduceMotion ? 1 : TUNING.CHROME_ATTACK);

      const pts = trail.current;
      if (active.current && pts.length) {
        const head = pts[pts.length - 1];
        head.x = smooth.current[0];
        head.y = smooth.current[1];
        head.t = now;
      }
      while (pts.length && now - pts[0].t >= TUNING.CHROME_RELEASE_MS) pts.shift();

      let decaying = false;
      for (let i = 0; i < TRAIL_N; i++) {
        const p = pts[pts.length - 1 - i];
        if (p) {
          let k = clamp(1 - (now - p.t) / TUNING.CHROME_RELEASE_MS, 0, 1);
          k = k * k * (3 - 2 * k);
          if (active.current && i === 0) k = attack.current;
          else if (k > 0.001) decaying = true;
          trailData[i * 3] = p.x;
          trailData[i * 3 + 1] = p.y;
          trailData[i * 3 + 2] = k;
        } else {
          trailData[i * 3] = -1;
          trailData[i * 3 + 1] = -1;
          trailData[i * 3 + 2] = 0;
        }
      }

      gl.clearColor(0.0196, 0.0196, 0.0235, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (loaded) {
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(aUv);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, photoTex);
        gl.uniform1i(uPhoto, 0);
        gl.uniform2f(uUvScale, uvScale[0], uvScale[1]);
        gl.uniform2f(uUvOffset, uvOffset[0], uvOffset[1]);
        gl.uniform2f(uTexel, texel[0], texel[1]);
        gl.uniform3fv(uTrail, trailData);
        gl.uniform1f(uAspect, aspect);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Reveal the canvas only once it holds a real frame, so the swap from
        // <img> to canvas is seamless and never shows a black rectangle.
        // Guarded: exactly one React state update for the whole lifetime.
        if (!revealed) {
          revealed = true;
          setReady(true);
        }
      }

      // Nothing animates on its own. The loop runs only while the pointer is
      // easing, the attack is ramping, or the trail is reconstructing.
      const moving =
        Math.abs(target.current[0] - smooth.current[0]) > 0.0004 ||
        Math.abs(target.current[1] - smooth.current[1]) > 0.0004 ||
        (active.current && attack.current < 0.999) ||
        decaying;

      if (moving) raf = requestAnimationFrame(frame);
      else running = false;
    }

    const toUv = (e: PointerEvent): [number, number] | null => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return [
        clamp((e.clientX - rect.left) / rect.width, 0, 1),
        clamp((e.clientY - rect.top) / rect.height, 0, 1),
      ];
    };

    const advanceTrail = () => {
      const pts = trail.current;
      const head = pts[pts.length - 1];
      if (!head) {
        pts.push({ x: smooth.current[0], y: smooth.current[1], t: performance.now() });
        return;
      }
      const dx = (smooth.current[0] - head.x) * aspect;
      const dy = smooth.current[1] - head.y;
      if (dx * dx + dy * dy >= TUNING.TRAIL_SPACING * TUNING.TRAIL_SPACING) {
        // Freeze the current head; it now reconstructs on its own.
        pts.push({ x: smooth.current[0], y: smooth.current[1], t: performance.now() });
        if (pts.length > TRAIL_N) pts.shift();
      }
    };

    const begin = (p: [number, number]) => {
      if (!active.current) {
        smooth.current[0] = p[0];
        smooth.current[1] = p[1];
        trail.current.push({ x: p[0], y: p[1], t: performance.now() });
        if (trail.current.length > TRAIL_N) trail.current.shift();
      }
      active.current = true;
      target.current[0] = p[0];
      target.current[1] = p[1];
      requestRender();
    };

    const onMove = (e: PointerEvent) => {
      // On touch, only track with the finger down; a stray hover must not latch.
      if (e.pointerType !== 'mouse' && !active.current) return;
      const p = toUv(e);
      if (!p) return;
      if (!active.current) begin(p);
      else {
        target.current[0] = p[0];
        target.current[1] = p[1];
        advanceTrail();
        requestRender();
      }
    };
    const onDown = (e: PointerEvent) => { const p = toUv(e); if (p) begin(p); };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const p = toUv(e);
      if (p) begin(p);
    };
    const onLeave = () => {
      // Restamp the head so it begins its delayed reconstruction from now,
      // rather than snapping away with the pointer.
      const pts = trail.current;
      if (pts.length) pts[pts.length - 1].t = performance.now();
      active.current = false;
      attack.current = 0;
      requestRender();
    };

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointerup', onLeave);
    container.addEventListener('pointercancel', onLeave);
    container.addEventListener('pointerenter', onEnter);
    container.addEventListener('pointerleave', onLeave);

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen) requestRender();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(container);

    const onVisibility = () => { if (document.hidden) stop(); else requestRender(); };
    document.addEventListener('visibilitychange', onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => {
      disposed = true;
      stop();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerup', onLeave);
      container.removeEventListener('pointercancel', onLeave);
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
      ro.disconnect();
      img.onload = null;
      gl.deleteBuffer(quad);
      gl.deleteTexture(photoTex);
      gl.deleteProgram(prog);
      shaders.forEach((s) => gl.deleteShader(s));
      // No WEBGL_lose_context: the browser lifecycle destroys the context.
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hero-portrait"
      className="relative w-full max-w-[400px] aspect-[3/4] mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-border bg-[#050506]"
    >
      {/* Paints immediately and is also the permanent fallback if WebGL is
          unavailable or shader compilation fails. objectPosition must match
          CROP_TOP_BIAS so the canvas is pixel-aligned when it fades in. */}
      <Image
        src={PORTRAIT_SRC}
        alt="Sarthak Roy"
        width={PORTRAIT_W}
        height={PORTRAIT_H}
        priority
        unoptimized
        sizes="(max-width: 1024px) 400px, 33vw"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: '50% 20%' }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full block touch-none transition-opacity duration-300 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
