'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;
  varying vec2 v_texCoord;

  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_theme; 
  uniform vec3 u_trail[20];

  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 st) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
      for (int i = 0; i < 4; ++i) {
          v += a * noise(st);
          st = rot * st * 2.0 + shift;
          a *= 0.5;
      }
      return v;
  }

  float grid(vec2 uv, float scale) {
      vec2 p = uv * scale;
      vec2 f = fract(p);
      float e1 = smoothstep(0.0, 0.05, f.x) * smoothstep(1.0, 0.95, f.x);
      float e2 = smoothstep(0.0, 0.05, f.y) * smoothstep(1.0, 0.95, f.y);
      float e3 = smoothstep(0.0, 0.03, abs(f.x - f.y));
      return 1.0 - (e1 * e2 * e3);
  }

  float lum(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec2 uv = v_texCoord;
    vec2 texel = 1.0 / u_resolution;
    vec4 baseColor = texture2D(u_image, uv);
    
    float subjectMask = baseColor.a;
    
    // Normal estimation from luminance
    float lC = lum(baseColor.rgb);
    float lR = lum(texture2D(u_image, uv + vec2(texel.x, 0.0)).rgb);
    float lL = lum(texture2D(u_image, uv - vec2(texel.x, 0.0)).rgb);
    float lU = lum(texture2D(u_image, uv - vec2(0.0, texel.y)).rgb);
    float lD = lum(texture2D(u_image, uv + vec2(0.0, texel.y)).rgb);
    
    float dx = lR - lL;
    float dy = lD - lU; // y points down in UV space visually for the face
    
    float depthStrength = 20.0;
    vec3 normal = normalize(vec3(dx * depthStrength, dy * depthStrength, 1.0));
    
    // Metallic Lighting
    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float diffuse = max(dot(normal, lightDir), 0.0);
    vec3 halfVector = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfVector), 0.0), 16.0);
    
    vec3 metalBase = mix(vec3(0.1, 0.12, 0.15), vec3(0.05, 0.06, 0.08), u_theme);
    vec3 silverDiffuse = vec3(0.6, 0.65, 0.7) * diffuse;
    vec3 specularHigh = vec3(0.9, 0.95, 1.0) * specular * 1.5;
    
    // Topology Distortion
    vec2 noiseUV = uv * 5.0 + vec2(u_time * 0.1);
    float n = fbm(noiseUV);
    vec2 warpedUV = uv + normal.xy * 0.03 + n * 0.01;
    
    float primaryMesh = grid(warpedUV, 50.0);
    float secondaryMesh = grid(warpedUV + vec2(0.01), 120.0);
    float microMesh = grid(warpedUV + vec2(0.02), 250.0);
    
    float mesh = max(primaryMesh, secondaryMesh * 0.5);
    mesh = max(mesh, microMesh * 0.2);
    
    float edgeStrength = length(vec2(dx, dy)) * 4.0;
    float density = smoothstep(0.0, 0.4, edgeStrength + lC * 0.3 + n * 0.2);
    mesh *= density;
    
    vec3 metalSurface = metalBase + silverDiffuse + specularHigh;
    vec3 topologyColor = mix(metalSurface, vec3(0.8, 0.9, 1.0) + specularHigh, mesh * 0.7);
    
    // Glowing Eye
    vec2 eyePosition = vec2(0.55, 0.44); // Adjusted for typical portrait centering
    float aspect = u_resolution.x / u_resolution.y;
    vec2 eyeVec = uv - eyePosition;
    eyeVec.x *= aspect;
    float eyeDist = length(eyeVec);
    float eyeGlow = exp(-eyeDist * 18.0);
    float eyeCore = exp(-eyeDist * 50.0);
    vec3 cyan = vec3(0.0, 0.8, 1.0);
    vec3 eyeColor = eyeGlow * cyan + eyeCore * vec3(1.0);
    
    // Organic Reveal
    float trailReveal = 0.0;
    for (int i = 0; i < 20; i++) {
        if (u_trail[i].z > 0.0) {
            vec2 dVec = uv - u_trail[i].xy;
            dVec.x *= aspect;
            float d = length(dVec);
            
            float boundaryNoise = fbm(uv * 12.0 - vec2(u_time * 0.2));
            float organicRadius = 0.12 + boundaryNoise * 0.08;
            
            float reveal = smoothstep(organicRadius, organicRadius - 0.08, d);
            trailReveal = max(trailReveal, reveal * u_trail[i].z);
        }
    }
    
    float finalReveal = trailReveal * subjectMask;
    
    vec3 finalMetallic = topologyColor + eyeColor * finalReveal;
    vec3 finalColor = mix(baseColor.rgb, finalMetallic, finalReveal);
    
    gl_FragColor = vec4(finalColor, baseColor.a);
  }
`;

type TrailPoint = { x: number; y: number; timestamp: number };
const MAX_TRAIL = 20;
const DECAY_TIME = 800;

export function InteractiveFace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  
  const targetMouse = useRef({ x: 0.5, y: 0.5 });
  const currentMouse = useRef({ x: 0.5, y: 0.5 });
  const isInteracting = useRef(false);
  const trail = useRef<TrailPoint[]>([]);
  const rafRef = useRef<number>();
  const isReducedMotion = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    isReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vShader || !fShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const positions = new Float32Array([
      -1.0, -1.0,  0.0, 1.0,
       1.0, -1.0,  1.0, 1.0,
      -1.0,  1.0,  0.0, 0.0,
       1.0,  1.0,  1.0, 0.0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const texLoc = gl.getAttribLocation(program, 'a_texCoord');

    const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texLoc);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uTheme = gl.getUniformLocation(program, 'u_theme');
    const uTrail = gl.getUniformLocation(program, 'u_trail');

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const img = new Image();
    img.src = '/wmremove-transformed.png';
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      resize();
    };

    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    let startTime = performance.now();
    const trailData = new Float32Array(MAX_TRAIL * 3);

    const render = (time: number) => {
      if (isInteracting.current) {
        currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * 0.2;
        currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * 0.2;
        
        trail.current.push({ x: currentMouse.current.x, y: currentMouse.current.y, timestamp: time });
        if (trail.current.length > MAX_TRAIL * 2) {
            trail.current.shift();
        }
      }

      const activePoints = trail.current.filter(p => time - p.timestamp < DECAY_TIME);
      const recentPoints = activePoints.slice(-MAX_TRAIL);

      for (let i = 0; i < MAX_TRAIL; i++) {
        if (i < recentPoints.length) {
          const p = recentPoints[i];
          const age = time - p.timestamp;
          let intensity = 1.0 - (age / DECAY_TIME);
          intensity = Math.max(0, intensity * intensity);
          trailData[i * 3] = p.x;
          trailData[i * 3 + 1] = p.y;
          trailData[i * 3 + 2] = intensity;
        } else {
          trailData[i * 3] = -1.0;
          trailData[i * 3 + 1] = -1.0;
          trailData[i * 3 + 2] = 0.0;
        }
      }

      gl.uniform3fv(uTrail, trailData);
      gl.uniform1f(uTime, isReducedMotion.current ? 0 : (time - startTime) * 0.001);
      gl.uniform1f(uTheme, resolvedTheme === 'dark' ? 1.0 : 0.0);

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(texture);
    };
  }, [resolvedTheme]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isReducedMotion.current) return;
    if (!canvasRef.current) return;
    
    if (e.pointerType === 'mouse') {
        isInteracting.current = true;
    }
    
    if (!isInteracting.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    targetMouse.current = { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      isInteracting.current = true;
      handlePointerMove(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      isInteracting.current = false;
    }
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      isInteracting.current = true;
    }
  };

  const handlePointerLeave = () => {
    isInteracting.current = false;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-[400px] aspect-[3/4] mx-auto lg:max-w-none rounded-2xl overflow-hidden shadow-2xl border border-border bg-surface"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover touch-none block"
      />
    </div>
  );
}

