'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/* ===========================================================================
 * LIQUID CHROME LENS
 *
 * The hero shows the ORIGINAL photograph. A small, soft-edged region that
 * follows the cursor becomes polished liquid chrome. Nothing outside that
 * region is altered, and with no pointer the portrait is untouched and static.
 *
 * The 3D illusion comes from REFLECTION, not geometry: a baked low-frequency
 * facial height map supplies smooth normals, the reflected view vector samples
 * an analytic studio environment, and specular + Fresnel sit on top. There is
 * no mesh, no wireframe and no vertices.
 *
 * Loading order:
 *   1. container reserves its aspect ratio (no CLS)
 *   2. a server-rendered <img> paints the portrait immediately
 *   3. WebGL initialises asynchronously behind it
 *   4. the canvas cross-fades in, pixel-matched to the <img>
 * If WebGL is unavailable or a shader fails, the <img> simply remains - it IS
 * the fallback. The canvas is transparent outside the subject, so the panel's
 * themed CSS background shows through in both light and dark themes.
 * ==========================================================================*/

/**
 * Alpha-baked, downscaled derivative of public/wmremove-transformed.png.
 * That original declares colourType 6 but is fully opaque - its apparent
 * transparency is a checkerboard painted into RGB by a watermark tool. The
 * checkerboard was flood-filled into a real alpha channel offline:
 * 7.7 MB -> 260 KB. Because alpha is real there is NO runtime preprocessing.
 */
const PORTRAIT_SRC = '/portrait-hero.webp';
const PORTRAIT_W = 1152;
const PORTRAIT_H = 1717;

/**
 * Baked 192x286 facial height map (~40 KB), heavily low-passed offline.
 * Deriving normals from the photograph at runtime turns beard and hair into
 * "metal scratches"; a small blurred height field bilinearly filtered is
 * inherently smooth and encodes only broad structure - forehead, brow ridge,
 * eye sockets, nose bridge and tip, cheeks, lips, chin, jaw.
 * Loaded async: it gates only the chrome, never the portrait.
 */
const HEIGHT_SRC = '/portrait-height.png';
const HEIGHT_W = 192;
const HEIGHT_H = 286;

/* ---------------------------------------------------------------------------
 * TUNING
 * -------------------------------------------------------------------------*/
const TUNING = {
  /** Lens radius, height-normalised. Small: a local patch, never the head. */
  CURSOR_RADIUS: 0.125,
  /** Inner edge as a fraction of the radius. */
  CURSOR_FEATHER: 0.10,

  /* --- pointer as a physical disturbance ------------------------------- */
  /** Damped spring toward the pointer. The lag is what gives the liquid
   *  inertia instead of snapping to the cursor. */
  SPRING_K: 0.24,
  SPRING_DAMP: 0.70,
  /** Pointer speed (uv/frame) treated as "fast". Normalises u_speed to 0..1. */
  SPEED_REF: 0.022,
  /** How far the liquid trails behind the pointer at full speed. */
  DRAG_LAG: 0.032,
  /** Elongation along the direction of travel at full speed. */
  DRAG_STRETCH: 0.75,

  /** Chrome forms over ~220ms rather than popping into existence. */
  CHROME_ATTACK: 0.22,
  /** On leave the metal contracts and flows inward over this long. */
  CHROME_RELEASE_MS: 620,
  /** Radius spring. Overshoots slightly on enter, contracts on leave. */
  RADIUS_K: 0.20,
  RADIUS_DAMP: 0.62,
  /** Radius multiplier once the liquid has fully withdrawn. */
  RADIUS_COLLAPSED: 0.16,

  /* --- liquid surface --------------------------------------------------- */
  /** Multi-scale flow field. Advected by pointer motion only, so when the
   *  cursor stops the surface stops - it settles, it does not pulse. */
  FLOW_SCALE: 12.0,
  FLOW_ADVECT: 2.6,
  /** Height added inside the lens: the metal rises out of the skin. */
  LIQUID_LIFT: 0.17,
  /** Amplitude of the flowing surface waves. */
  LIQUID_WAVE: 0.30,
  /** Resting turbulence once settled (never fully zero, never pulsing). */
  TURB_REST: 0.12,
  TURB_EASE: 0.18,
  /** Damped ripple emitted on enter and on leave. */
  RIPPLE_FREQ: 52.0,
  RIPPLE_SPEED: 7.5,
  RIPPLE_FALLOFF: 13.0,
  RIPPLE_HEIGHT: 0.11,
  RIPPLE_DECAY: 0.87,
  /** How hard the liquid field chews up the boundary. */
  EDGE_DEFORM: 0.95,

  /** Surface shape. Normals come from the baked height map only. */
  NORMAL_STRENGTH: 13.0,
  /** Height-map gradient sample distance, in height-map texels. */
  NORMAL_SAMPLE: 1.25,

  /** Material. These are what make the metal bright; they are NOT scaled by
   *  the photograph. */
  REFLECTION_STRENGTH: 1.0,
  SPEC_SHARP_POWER: 90.0,
  SPEC_SHARP_WEIGHT: 0.85,
  SPEC_BROAD_POWER: 11.0,
  SPEC_BROAD_WEIGHT: 0.38,
  FRESNEL_STRENGTH: 0.55,

  /** Identity read-through. Deliberately small: the photo modulates the metal
   *  by only a few percent, so chrome stays equally bright over hair, beard,
   *  skin and hoodie. (The previous 0.75 made dark regions go black.) */
  IMAGE_READTHROUGH: 0.3,

  /** Refraction-like warp. Tiny: the face must not move. */
  DISTORTION: 0.006,

  /** Softness of the final liquid boundary. */
  EDGE_SOFTNESS: 0.26,
};

/** Studio environments sampled by the reflection vector, per theme. */
const ENV = {
  light: {
    low: [0.30, 0.34, 0.40],
    high: [0.84, 0.89, 0.97],
    band: [1.0, 1.0, 1.0],
    bounce: [0.34, 0.46, 0.70],
    specTint: [0.96, 0.98, 1.0],
    fresnelTint: [0.55, 0.68, 0.92],
  },
  dark: {
    low: [0.07, 0.085, 0.115],
    high: [0.36, 0.42, 0.54],
    band: [0.95, 0.97, 1.0],
    bounce: [0.17, 0.27, 0.48],
    specTint: [0.90, 0.94, 1.0],
    fresnelTint: [0.42, 0.57, 0.88],
  },
} as const;

/** Cover-fit: fraction of excess height taken off the TOP. Must match the
 *  <img> objectPosition, or the canvas would jump when it fades in. */
const CROP_TOP_BIAS = 0.2;
const CONTAINER_ASPECT = 3 / 4;
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
  uniform sampler2D u_height;
  uniform vec2 u_uvScale;
  uniform vec2 u_uvOffset;
  uniform vec2 u_cursor;
  uniform float u_amount;
  uniform float u_aspect;
  uniform float u_hasHeight;
  uniform vec2 u_velDir;     // normalised direction of travel
  uniform float u_speed;     // 0..1 normalised pointer speed
  uniform vec2 u_flow;       // flow field offset, advected by pointer motion
  uniform float u_turb;      // surface turbulence, decays as the liquid settles
  uniform float u_radiusF;   // radius multiplier (expands on enter, contracts on leave)
  uniform float u_rippleAmp;
  uniform float u_rippleT;
  uniform vec2 u_nStep;      // normal sampling step, in container uv

  uniform vec3 u_envLow;
  uniform vec3 u_envHigh;
  uniform vec3 u_envBand;
  uniform vec3 u_envBounce;
  uniform vec3 u_specTint;
  uniform vec3 u_fresnelTint;

  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  float hgt(vec2 uv) { return texture2D(u_height, uv).r; }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 fr = fract(p);
    vec2 u = fr * fr * (3.0 - 2.0 * fr);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm2(vec2 p) {
    return vnoise(p) * 0.62 + vnoise(p * 2.6 + vec2(13.1, 7.3)) * 0.38;
  }

  /* Interaction field. x = envelope (1 at the core, 0 outside), y = distance.
     The pointer is a physical disturbance: the field trails BEHIND the cursor
     by DRAG_LAG and elongates along the direction of travel by DRAG_STRETCH,
     both scaled by speed. Standing still it is compact; moving fast it
     stretches into the direction of motion. */
  vec2 fieldAt(vec2 uv) {
    vec2 q = uv - u_cursor;
    q.x *= u_aspect;
    float along = dot(q, u_velDir);
    vec2 perpV = q - along * u_velDir;
    float a2 = (along + u_speed * ${f(TUNING.DRAG_LAG)})
             / (1.0 + u_speed * ${f(TUNING.DRAG_STRETCH)});
    float dd = length(vec2(a2, length(perpV)));
    float rOut = ${f(TUNING.CURSOR_RADIUS)} * u_radiusF;
    float env = 1.0 - smoothstep(rOut * ${f(TUNING.CURSOR_FEATHER)}, rOut, dd);
    return vec2(env, dd);
  }

  float ringAt(float dd) {
    return sin(dd * ${f(TUNING.RIPPLE_FREQ)} - u_rippleT * ${f(TUNING.RIPPLE_SPEED)})
         * exp(-dd * ${f(TUNING.RIPPLE_FALLOFF)}) * u_rippleAmp;
  }

  /* The surface the chrome actually reflects: the baked facial height field
     PLUS the liquid displacement. Normals are taken from this sum, which is
     what makes the metal deform the face rather than sit on top of it. */
  float surfaceH(vec2 uv) {
    vec2 puv = u_uvOffset + uv * u_uvScale;
    float base = hgt(puv);
    vec2 fd = fieldAt(uv);
    float l = fbm2(uv * ${f(TUNING.FLOW_SCALE)} + u_flow);
    return base
         + fd.x * (${f(TUNING.LIQUID_LIFT)} + (l - 0.5) * ${f(TUNING.LIQUID_WAVE)} * u_turb)
         + ringAt(fd.y) * ${f(TUNING.RIPPLE_HEIGHT)};
  }

  /* Analytic studio environment. Broad coherent bands - a bright overhead
     strip, a cool bounce below, dark steel between - are what read as
     polished metal when swept across a curved normal field. Colours are
     supplied per theme, so light and dark are not hardcoded. */
  vec3 envSample(vec3 r) {
    float y = clamp(r.y, -1.0, 1.0);
    vec3 c = mix(u_envLow, u_envHigh, smoothstep(-0.85, 0.85, y));
    c += u_envBand   * exp(-pow((y - 0.36) / 0.19, 2.0));
    c += u_envBounce * exp(-pow((y + 0.36) / 0.28, 2.0));
    c *= 0.92 + 0.08 * cos(r.x * 4.0 + 1.2);
    return c;
  }

  void main() {
    vec2 puv = u_uvOffset + v_uv * u_uvScale;
    vec4 tex = texture2D(u_photo, puv);
    float subject = tex.a;

    // Liquid boundary. The velocity-stretched envelope is chewed up by the
    // same flow field that displaces the surface, plus the damped ripple, so
    // the edge is irregular and moving - never a radial-gradient circle.
    vec2 fd = fieldAt(v_uv);
    float cover = fd.x;
    float liquid = fbm2(v_uv * ${f(TUNING.FLOW_SCALE)} + u_flow);
    // Subtract-only, weighted by (1 - cover), and the ripple is windowed by
    // cover: both guarantee field <= 0 wherever cover == 0, so the liquid can
    // chew the boundary inward but can never leak outside the disturbance.
    float field = cover
                - liquid * ${f(TUNING.EDGE_DEFORM)} * (1.0 - cover)
                + ringAt(fd.y) * 0.35 * cover;
    // Subtracting keeps mask == 0 wherever env == 0, so nothing leaks out.
    float mask = smoothstep(0.0, ${f(TUNING.EDGE_SOFTNESS)}, field) * subject * u_amount;

    // Outside the lens: the untouched photograph, premultiplied.
    if (mask < 0.002 || u_hasHeight < 0.5) {
      gl_FragColor = vec4(tex.rgb * subject, subject);
      return;
    }

    // --- normals from the DISPLACED surface ---------------------------------
    // Face height + liquid lift + flow waves + ripple. Because the reflection
    // is derived from this, moving the pointer moves the surface, which moves
    // the normal, which moves the highlight across the facial geometry.
    float hR = surfaceH(v_uv + vec2(u_nStep.x, 0.0));
    float hL = surfaceH(v_uv - vec2(u_nStep.x, 0.0));
    float hD = surfaceH(v_uv + vec2(0.0, u_nStep.y));
    float hU = surfaceH(v_uv - vec2(0.0, u_nStep.y));
    vec3 N = normalize(vec3(
      -(hR - hL) * ${f(TUNING.NORMAL_STRENGTH)},
       (hD - hU) * ${f(TUNING.NORMAL_STRENGTH)},
       1.0
    ));

    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 R = reflect(-V, N);

    // --- material ----------------------------------------------------------
    vec3 env = envSample(R) * ${f(TUNING.REFLECTION_STRENGTH)};

    vec3 L1 = normalize(vec3(-0.34, 0.58, 0.74));
    vec3 L2 = normalize(vec3( 0.46, 0.22, 0.86));
    float sharp = pow(max(dot(N, normalize(L1 + V)), 0.0), ${f(TUNING.SPEC_SHARP_POWER)});
    float broad = pow(max(dot(N, normalize(L2 + V)), 0.0), ${f(TUNING.SPEC_BROAD_POWER)});
    float fres  = pow(1.0 - max(dot(N, V), 0.0), 5.0);

    vec3 chrome = env
                + vec3(1.0) * sharp * ${f(TUNING.SPEC_SHARP_WEIGHT)}
                + u_specTint * broad * ${f(TUNING.SPEC_BROAD_WEIGHT)}
                + u_fresnelTint * fres * ${f(TUNING.FRESNEL_STRENGTH)};

    // Identity read-through, deliberately weak and centred on 1.0 so the
    // photograph nudges the metal without ever determining whether it is
    // bright enough to see.
    vec2 warp = N.xy * ${f(TUNING.DISTORTION)} * mask;
    float under = lum(texture2D(u_photo, puv + warp).rgb);
    float shade = 0.80 + 0.40 * under;
    chrome *= mix(1.0, shade, ${f(TUNING.IMAGE_READTHROUGH)});

    chrome = clamp(chrome, 0.0, 1.0);

    vec3 outc = mix(tex.rgb, chrome, mask);
    gl_FragColor = vec4(outc * subject, subject);
  }
`;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/* ===========================================================================
 * COMPONENT
 * ==========================================================================*/

export function InteractiveFace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  /** Flips once the canvas holds a real frame. One state update, ever. */
  const [ready, setReady] = useState(false);

  // All pointer state lives in refs: moving the mouse never re-renders React.
  const target = useRef<[number, number]>([0.5, 0.45]);
  const smooth = useRef<[number, number]>([0.5, 0.45]);
  const active = useRef(false);
  const amount = useRef(0);
  const posVel = useRef<[number, number]>([0, 0]);
  const velDir = useRef<[number, number]>([1, 0]);
  const speed = useRef(0);
  const radiusF = useRef(0.35);
  const radiusVel = useRef(0);
  const turb = useRef(TUNING.TURB_REST);
  const flow = useRef<[number, number]>([0, 0]);
  const rippleAmp = useRef(0);
  const rippleT = useRef(0);

  useEffect(() => {
    // Every browser API below is reached only here, after client mount.
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let glCtx: WebGLRenderingContext | null = null;
    try {
      glCtx = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      }) as WebGLRenderingContext | null;
    } catch {
      glCtx = null;
    }
    if (!glCtx) return; // <img> underneath stays visible
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
    if (!program) {
      shaders.forEach((s) => gl.deleteShader(s));
      return; // hero keeps showing the photograph
    }
    const prog: WebGLProgram = program;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW,
    );

    const loc = {
      pos: gl.getAttribLocation(prog, 'a_pos'),
      uv: gl.getAttribLocation(prog, 'a_uv'),
      photo: gl.getUniformLocation(prog, 'u_photo'),
      height: gl.getUniformLocation(prog, 'u_height'),
      uvScale: gl.getUniformLocation(prog, 'u_uvScale'),
      uvOffset: gl.getUniformLocation(prog, 'u_uvOffset'),
      cursor: gl.getUniformLocation(prog, 'u_cursor'),
      amount: gl.getUniformLocation(prog, 'u_amount'),
      aspect: gl.getUniformLocation(prog, 'u_aspect'),
      hasHeight: gl.getUniformLocation(prog, 'u_hasHeight'),
      velDir: gl.getUniformLocation(prog, 'u_velDir'),
      speed: gl.getUniformLocation(prog, 'u_speed'),
      flow: gl.getUniformLocation(prog, 'u_flow'),
      turb: gl.getUniformLocation(prog, 'u_turb'),
      radiusF: gl.getUniformLocation(prog, 'u_radiusF'),
      rippleAmp: gl.getUniformLocation(prog, 'u_rippleAmp'),
      rippleT: gl.getUniformLocation(prog, 'u_rippleT'),
      nStep: gl.getUniformLocation(prog, 'u_nStep'),
      envLow: gl.getUniformLocation(prog, 'u_envLow'),
      envHigh: gl.getUniformLocation(prog, 'u_envHigh'),
      envBand: gl.getUniformLocation(prog, 'u_envBand'),
      envBounce: gl.getUniformLocation(prog, 'u_envBounce'),
      specTint: gl.getUniformLocation(prog, 'u_specTint'),
      fresnelTint: gl.getUniformLocation(prog, 'u_fresnelTint'),
    };

    const makeTex = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    const photoTex = makeTex();
    const heightTex = makeTex();

    let uvScale: [number, number] = [1, 1];
    let uvOffset: [number, number] = [0, 0];
    let photoLoaded = false;
    let heightLoaded = false;
    let revealed = false;
    let aspect = CONTAINER_ASPECT;
    let isDark = document.documentElement.classList.contains('dark');
    let disposed = false;
    let onScreen = true;
    let running = false;
    let raf = 0;
    let lastT = 0;

    const requestRender = () => {
      // document.hidden checked here, not only in the visibilitychange
      // handler, so a pointer event cannot restart the loop in a hidden tab.
      if (disposed || !onScreen || document.hidden || running) return;
      running = true;
      lastT = 0;
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

    // Same URL as the <img>: served from cache, no extra request.
    const photo = new window.Image();
    photo.decoding = 'async';
    photo.onload = () => {
      if (disposed) return;
      const srcAspect = photo.naturalWidth / photo.naturalHeight;
      if (srcAspect < CONTAINER_ASPECT) {
        const visibleV = srcAspect / CONTAINER_ASPECT;
        uvScale = [1, visibleV];
        uvOffset = [0, (1 - visibleV) * CROP_TOP_BIAS];
      } else {
        const visibleU = CONTAINER_ASPECT / srcAspect;
        uvScale = [visibleU, 1];
        uvOffset = [(1 - visibleU) * 0.5, 0];
      }
      gl.bindTexture(gl.TEXTURE_2D, photoTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);
      photoLoaded = true;
      resize();
      requestRender();
    };
    photo.src = PORTRAIT_SRC;

    const height = new window.Image();
    height.decoding = 'async';
    height.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, heightTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, height);
      heightLoaded = true;
      requestRender();
    };
    height.src = HEIGHT_SRC;

    function frame(now: number) {
      if (disposed) return;
      const dt = lastT ? Math.min(now - lastT, 100) : 16.7;
      lastT = now;

      const prevX = smooth.current[0];
      const prevY = smooth.current[1];

      if (reduceMotion) {
        // Static localized transformation: no springs, no flow, no ripple.
        smooth.current[0] = target.current[0];
        smooth.current[1] = target.current[1];
        amount.current = active.current ? 1 : 0;
        radiusF.current = active.current ? 1 : TUNING.RADIUS_COLLAPSED;
        turb.current = 0;
        rippleAmp.current = 0;
        speed.current = 0;
      } else {
        // Damped spring toward the pointer: the liquid carries inertia and
        // lags slightly instead of snapping to the cursor.
        if (active.current) {
          posVel.current[0] += (target.current[0] - smooth.current[0]) * TUNING.SPRING_K;
          posVel.current[1] += (target.current[1] - smooth.current[1]) * TUNING.SPRING_K;
        }
        posVel.current[0] *= TUNING.SPRING_DAMP;
        posVel.current[1] *= TUNING.SPRING_DAMP;
        smooth.current[0] += posVel.current[0];
        smooth.current[1] += posVel.current[1];

        // Velocity drives direction, stretch and turbulence.
        const dx = smooth.current[0] - prevX;
        const dy = smooth.current[1] - prevY;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 1e-5) {
          velDir.current[0] = dx / mag;
          velDir.current[1] = dy / mag;
        }
        const sNorm = clamp(mag / TUNING.SPEED_REF, 0, 1);
        speed.current += (sNorm - speed.current) * 0.25;

        // Flow is advected ONLY by pointer motion, so a stationary cursor
        // means a stationary surface: the liquid settles, it never pulses.
        flow.current[0] -= dx * TUNING.FLOW_ADVECT * TUNING.FLOW_SCALE;
        flow.current[1] -= dy * TUNING.FLOW_ADVECT * TUNING.FLOW_SCALE;

        turb.current +=
          (Math.max(speed.current, TUNING.TURB_REST) - turb.current) * TUNING.TURB_EASE;

        if (active.current) {
          // Enter: a spring that overshoots slightly, so the metal grows out
          // of the skin and settles rather than popping in at full size.
          radiusVel.current += (1 - radiusF.current) * TUNING.RADIUS_K;
          radiusVel.current *= TUNING.RADIUS_DAMP;
          radiusF.current += radiusVel.current;
          amount.current += (1 - amount.current) * TUNING.CHROME_ATTACK;
        } else {
          // Leave: the radius is driven by the release timeline rather than a
          // spring, so the liquid takes the full CHROME_RELEASE_MS to flow
          // inward. A spring here collapsed it in ~100ms, which read as a
          // plain cut rather than a withdrawal.
          amount.current -= dt / TUNING.CHROME_RELEASE_MS;
          const a = clamp(amount.current, 0, 1);
          const ae = a * a * (3 - 2 * a);
          radiusVel.current = 0;
          radiusF.current = TUNING.RADIUS_COLLAPSED + (1 - TUNING.RADIUS_COLLAPSED) * ae;
        }

        rippleAmp.current *= TUNING.RIPPLE_DECAY;
        rippleT.current += dt * 0.001;
      }

      // Snap the asymptotic tail so the loop stops once the formation is
      // visually complete instead of spinning on invisible convergence.
      if (amount.current > 0.995) amount.current = 1;
      amount.current = clamp(amount.current, 0, 1);
      const eased = amount.current * amount.current * (3 - 2 * amount.current);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (photoLoaded) {
        const env = isDark ? ENV.dark : ENV.light;
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(loc.pos);
        gl.vertexAttribPointer(loc.pos, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(loc.uv);
        gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 16, 8);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, photoTex);
        gl.uniform1i(loc.photo, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, heightTex);
        gl.uniform1i(loc.height, 1);

        gl.uniform2f(loc.uvScale, uvScale[0], uvScale[1]);
        gl.uniform2f(loc.uvOffset, uvOffset[0], uvOffset[1]);
        gl.uniform2f(loc.cursor, smooth.current[0], smooth.current[1]);
        gl.uniform1f(loc.amount, eased);
        gl.uniform1f(loc.aspect, aspect);
        gl.uniform1f(loc.hasHeight, heightLoaded ? 1 : 0);
        gl.uniform2f(loc.velDir, velDir.current[0], velDir.current[1]);
        gl.uniform1f(loc.speed, speed.current);
        gl.uniform2f(loc.flow, flow.current[0], flow.current[1]);
        gl.uniform1f(loc.turb, turb.current);
        gl.uniform1f(loc.radiusF, Math.max(radiusF.current, 0.01));
        gl.uniform1f(loc.rippleAmp, rippleAmp.current);
        gl.uniform1f(loc.rippleT, rippleT.current);
        gl.uniform2f(
          loc.nStep,
          (TUNING.NORMAL_SAMPLE / HEIGHT_W) / uvScale[0],
          (TUNING.NORMAL_SAMPLE / HEIGHT_H) / uvScale[1],
        );
        gl.uniform3fv(loc.envLow, env.low as unknown as number[]);
        gl.uniform3fv(loc.envHigh, env.high as unknown as number[]);
        gl.uniform3fv(loc.envBand, env.band as unknown as number[]);
        gl.uniform3fv(loc.envBounce, env.bounce as unknown as number[]);
        gl.uniform3fv(loc.specTint, env.specTint as unknown as number[]);
        gl.uniform3fv(loc.fresnelTint, env.fresnelTint as unknown as number[]);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        if (!revealed) {
          revealed = true;
          setReady(true);
        }
      }

      // Nothing animates on its own: the loop runs only while the spring, the
      // radius, the turbulence or the ripple are still settling.
      const settled =
        Math.abs(posVel.current[0]) < 2e-5 &&
        Math.abs(posVel.current[1]) < 2e-5 &&
        Math.abs(target.current[0] - smooth.current[0]) < 4e-4 &&
        Math.abs(target.current[1] - smooth.current[1]) < 4e-4 &&
        Math.abs(radiusVel.current) < 2e-4 &&
        Math.abs(radiusF.current - 1) < 5e-3 &&
        Math.abs(turb.current - TUNING.TURB_REST) < 1.2e-2 &&
        rippleAmp.current < 0.02 &&
        amount.current >= 1;
      const moving = active.current ? !settled : amount.current > 0;

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

    const emitRipple = () => { rippleAmp.current = 1; rippleT.current = 0; };

    const begin = (p: [number, number]) => {
      if (!active.current) {
        // Enter: the surface is disturbed at the contact point and the metal
        // grows outward from it rather than popping in as a finished circle.
        smooth.current[0] = p[0];
        smooth.current[1] = p[1];
        posVel.current[0] = 0;
        posVel.current[1] = 0;
        radiusF.current = 0.3;
        radiusVel.current = 0;
        emitRipple();
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
      if (p) begin(p);
    };
    const onDown = (e: PointerEvent) => { const p = toUv(e); if (p) begin(p); };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const p = toUv(e);
      if (p) begin(p);
    };
    const onLeave = () => {
      // Leave: one last disturbance, then the liquid loses energy, contracts
      // and flows inward before the photograph returns exactly.
      if (active.current) emitRipple();
      active.current = false;
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

    // Theme changes swap the reflection environment without a React re-render
    // and without tearing down the GL context.
    const themeObserver = new MutationObserver(() => {
      const next = document.documentElement.classList.contains('dark');
      if (next !== isDark) {
        isDark = next;
        requestRender();
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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
      themeObserver.disconnect();
      photo.onload = null;
      height.onload = null;
      gl.deleteBuffer(quad);
      gl.deleteTexture(photoTex);
      gl.deleteTexture(heightTex);
      gl.deleteProgram(prog);
      shaders.forEach((s) => gl.deleteShader(s));
      // No WEBGL_lose_context: the browser lifecycle destroys the context.
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hero-portrait"
      /* Themed panel background. Both the <img> and the canvas are transparent
         outside the subject, so this is what surrounds the portrait - a light
         card in light theme, a dark one in dark theme. Never a black box. */
      className="relative w-full max-w-[400px] aspect-[3/4] mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-border bg-gradient-to-b from-[#eef2f8] to-[#dde5f0] shadow-lg shadow-slate-900/10 dark:from-[#0c1016] dark:to-[#070a0f] dark:shadow-none"
    >
      {/* Paints immediately and is the permanent fallback if WebGL is
          unavailable or a shader fails. objectPosition must match
          CROP_TOP_BIAS so the canvas is aligned when it fades in. */}
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
