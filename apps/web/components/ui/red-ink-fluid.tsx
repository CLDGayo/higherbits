"use client";

// Red ink billowing in still water — real-time GPU fluid simulation.
// Stable-fluids solver (semi-Lagrangian advection + vorticity confinement +
// buoyant sinking + Jacobi pressure projection) with two dye emitters at the
// top of the frame, matching macro footage of ink dropped into black water.
//
// higherbits.dev / CodeSandbox studio contract:
//   - exports `Component` (zero props) + a default export
//   - self-contained: imports only from "react"
//   - survives StrictMode / HMR double-mounts by building a FRESH canvas +
//     GL context each mount and fully tearing down on unmount

import { useEffect, useRef } from "react";

const VERT = `
precision highp float;
attribute vec2 a_pos;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = a_pos * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG_CLEAR = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

const FRAG_SPLAT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

const FRAG_ADVECT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = dissipation * texture2D(uSource, coord);
}`;

const FRAG_DIVERGENCE = `
precision mediump float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const FRAG_CURL = `
precision mediump float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`;

const FRAG_VORTICITY = `
precision highp float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

// Ink is denser than water: pull velocity down where dye is thick, with a
// touch of horizontal shear so plumes mushroom instead of dropping straight.
const FRAG_BUOYANCY = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform float dt;
uniform float sink;
uniform float time;
void main () {
  float d = texture2D(uDye, vUv).r;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.y -= sink * d * dt;
  velocity.x += sin(vUv.y * 9.0 + time * 0.4) * d * dt * 6.0;
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

const FRAG_PRESSURE = `
precision mediump float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const FRAG_GRADIENT_SUBTRACT = `
precision mediump float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

// Density -> color ramp tuned against the reference footage:
// black water -> deep crimson -> red -> pink-lit billow rims, with darkened
// interior folds, gradient-based rim light, and particulate sparkle.
const FRAG_DISPLAY = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform vec2 texelSize;
uniform float uTime;

float hash21 (vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 ramp (float d) {
  // deep crimson core; only the thinnest rims lift toward lit pink
  vec3 c = vec3(0.0);
  c = mix(c, vec3(0.20, 0.0, 0.015), smoothstep(0.0, 0.28, d));
  c = mix(c, vec3(0.50, 0.015, 0.05), smoothstep(0.22, 0.7, d));
  c = mix(c, vec3(0.80, 0.05, 0.10), smoothstep(0.6, 1.15, d));
  c = mix(c, vec3(0.95, 0.14, 0.20), smoothstep(1.1, 1.7, d));
  c = mix(c, vec3(1.0, 0.34, 0.38),  smoothstep(1.7, 2.4, d));
  return c;
}

void main () {
  float d = texture2D(uDye, vUv).r;

  float dl = texture2D(uDye, vUv - vec2(texelSize.x, 0.0)).r;
  float dr = texture2D(uDye, vUv + vec2(texelSize.x, 0.0)).r;
  float db = texture2D(uDye, vUv - vec2(0.0, texelSize.y)).r;
  float dt2 = texture2D(uDye, vUv + vec2(0.0, texelSize.y)).r;
  vec2 grad = vec2(dr - dl, dt2 - db);
  float edge = length(grad);

  vec3 col = ramp(d);

  // top-lit rims: boost where density falls off, strongest on upper edges
  float rim = smoothstep(0.02, 0.30, edge) * smoothstep(0.05, 0.5, d);
  float topLight = clamp(grad.y * -3.0, 0.0, 1.0) * 0.5 + 0.5;
  col += vec3(1.0, 0.28, 0.32) * rim * topLight * 0.4;

  // self-shadowed folds carve dark crevices between billows
  col *= 1.0 - 0.4 * smoothstep(0.8, 0.15, d) * step(0.05, d);
  col *= 1.0 - 0.25 * smoothstep(1.4, 2.3, d);

  // suspended particulate glints
  vec2 cell = floor(vUv / texelSize * 0.35);
  float h = hash21(cell);
  float tw = 0.5 + 0.5 * sin(uTime * (1.0 + h * 3.0) + h * 43.0);
  col += vec3(1.0, 0.7, 0.72) * step(0.997, h) * tw * smoothstep(0.2, 0.9, d) * 0.35;

  // vignette to sell the macro-tank look
  float v = 1.0 - 0.4 * smoothstep(0.45, 1.15, length(vUv - vec2(0.5, 0.55)) * 1.35);
  col *= v;

  gl_FragColor = vec4(col, 1.0);
}`;

const SIM_RES = 160;
const DYE_RES = 640;
const PRESSURE_ITERATIONS = 24;
const PRESSURE_DECAY = 0.8;
const CURL_STRENGTH = 18.0;
const SINK_FORCE = 175.0;
const VELOCITY_DECAY = 0.34; // exp decay rates per second
const DYE_DECAY = 0.15;

type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
};

type DoubleFBO = { read: FBO; write: FBO; swap: () => void };

type Program = { program: WebGLProgram; uniforms: any };

export function Component() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    }) as WebGL2RenderingContext | null;

    const floatExt =
      gl &&
      (gl.getExtension("EXT_color_buffer_float") ||
        gl.getExtension("EXT_color_buffer_half_float"));

    if (!gl || !floatExt) {
      // No float render targets -> leave the black backdrop rather than crash.
      return () => { host.removeChild(canvas); };
    }

    let destroyed = false;
    let raf = 0;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("red-ink-fluid shader error:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const makeProgram = (fragSrc: string): Program => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
      gl.bindAttribLocation(p, 0, "a_pos");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.warn("red-ink-fluid link error:", gl.getProgramInfoLog(p));
      }
      const uniforms: Record<string, WebGLUniformLocation> = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i)!;
        uniforms[info.name] = gl.getUniformLocation(p, info.name)!;
      }
      return { program: p, uniforms };
    };

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const blit = (target: FBO | null) => {
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const createFBO = (w: number, h: number): FBO => {
      const texture = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture, fbo, width: w, height: h,
        texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    };

    const createDoubleFBO = (w: number, h: number): DoubleFBO => {
      let read = createFBO(w, h);
      let write = createFBO(w, h);
      return {
        get read() { return read; },
        get write() { return write; },
        swap() { const t = read; read = write; write = t; },
      } as DoubleFBO;
    };

    const progClear = makeProgram(FRAG_CLEAR);
    const progSplat = makeProgram(FRAG_SPLAT);
    const progAdvect = makeProgram(FRAG_ADVECT);
    const progDivergence = makeProgram(FRAG_DIVERGENCE);
    const progCurl = makeProgram(FRAG_CURL);
    const progVorticity = makeProgram(FRAG_VORTICITY);
    const progBuoyancy = makeProgram(FRAG_BUOYANCY);
    const progPressure = makeProgram(FRAG_PRESSURE);
    const progGradient = makeProgram(FRAG_GRADIENT_SUBTRACT);
    const progDisplay = makeProgram(FRAG_DISPLAY);

    let velocity: DoubleFBO, dye: DoubleFBO, pressure: DoubleFBO;
    let divergence: FBO, curl: FBO;
    let simReady = false;
    let warmed = false;

    const getRes = (base: number) => {
      const a = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);
      return a >= 1
        ? { w: Math.round(base * a), h: base }
        : { w: base, h: Math.round(base / a) };
    };

    const initSim = () => {
      const sim = getRes(SIM_RES);
      const dy = getRes(DYE_RES);
      velocity = createDoubleFBO(sim.w, sim.h);
      pressure = createDoubleFBO(sim.w, sim.h);
      divergence = createFBO(sim.w, sim.h);
      curl = createFBO(sim.w, sim.h);
      dye = createDoubleFBO(dy.w, dy.h);
      simReady = true;
      warmed = false; // re-pour the tank after every (re)size
    };

    const resize = () => {
      // Skip until the host actually has layout — a pre-layout 0/1px read makes
      // getRes() produce an enormous mismatched-aspect texture that fails FBO alloc.
      if (host.clientWidth < 4 || host.clientHeight < 4) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(4, Math.floor(host.clientWidth * dpr));
      const h = Math.max(4, Math.floor(host.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      initSim();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const useProg = (p: Program) => gl.useProgram(p.program);

    const splat = (
      target: DoubleFBO, x: number, y: number,
      r: number, g: number, b: number, radius: number,
    ) => {
      useProg(progSplat);
      gl.uniform2f(progSplat.uniforms.texelSize, target.read.texelSizeX, target.read.texelSizeY);
      gl.uniform1i(progSplat.uniforms.uTarget, target.read.attach(0));
      gl.uniform1f(progSplat.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(progSplat.uniforms.point, x, y);
      gl.uniform3f(progSplat.uniforms.color, r, g, b);
      gl.uniform1f(progSplat.uniforms.radius, radius);
      blit(target.write);
      target.swap();
    };

    // pointer stirring
    const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, down: false, moved: false };
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      pointer.dx = x - pointer.x;
      pointer.dy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
    };
    const onDown = (e: PointerEvent) => { pointer.down = true; onPointer(e); pointer.dx = 0; pointer.dy = 0; };
    const onUp = () => { pointer.down = false; };
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    let last = performance.now();
    let time = 0;

    const step = (dt: number) => {
      const simTexel: [number, number] = [velocity.read.texelSizeX, velocity.read.texelSizeY];

      useProg(progCurl);
      gl.uniform2f(progCurl.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progCurl.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      useProg(progVorticity);
      gl.uniform2f(progVorticity.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progVorticity.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(progVorticity.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(progVorticity.uniforms.curl, CURL_STRENGTH);
      gl.uniform1f(progVorticity.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      useProg(progBuoyancy);
      gl.uniform2f(progBuoyancy.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progBuoyancy.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(progBuoyancy.uniforms.uDye, dye.read.attach(1));
      gl.uniform1f(progBuoyancy.uniforms.dt, dt);
      gl.uniform1f(progBuoyancy.uniforms.sink, SINK_FORCE);
      gl.uniform1f(progBuoyancy.uniforms.time, time);
      blit(velocity.write);
      velocity.swap();

      useProg(progDivergence);
      gl.uniform2f(progDivergence.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progDivergence.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      useProg(progClear);
      gl.uniform2f(progClear.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progClear.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(progClear.uniforms.value, PRESSURE_DECAY);
      blit(pressure.write);
      pressure.swap();

      useProg(progPressure);
      gl.uniform2f(progPressure.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progPressure.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(progPressure.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      useProg(progGradient);
      gl.uniform2f(progGradient.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progGradient.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(progGradient.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      useProg(progAdvect);
      gl.uniform2f(progAdvect.uniforms.texelSize, simTexel[0], simTexel[1]);
      gl.uniform1i(progAdvect.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(progAdvect.uniforms.uSource, velocity.read.attach(0));
      gl.uniform1f(progAdvect.uniforms.dt, dt);
      gl.uniform1f(progAdvect.uniforms.dissipation, Math.exp(-VELOCITY_DECAY * dt));
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(progAdvect.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(progAdvect.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(progAdvect.uniforms.dissipation, Math.exp(-DYE_DECAY * dt));
      blit(dye.write);
      dye.swap();
    };

    const emit = (dt: number) => {
      // two ink streams entering from the top, matching the footage: they pulse,
      // bloom into round mushroom heads, then sink through the tank.
      const emitters = [
        { x: 0.30 + 0.015 * Math.sin(time * 0.5), y: 0.97, phase: 1.0 },
        { x: 0.63 + 0.02 * Math.sin(time * 0.4 + 2.0), y: 0.99, phase: 3.7 },
      ];
      for (const e of emitters) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.7 + e.phase);
        const surge = Math.max(0, Math.sin(time * 0.15 + e.phase * 2.0));
        // gate emission so the streams throb rather than pour continuously
        const gate = Math.pow(pulse, 1.5);
        const amount = (0.7 * gate + 1.3 * surge * surge) * dt * 5.0;
        const vx = 55 * Math.sin(time * 1.1 + e.phase) * dt;
        const vy = -(150 + 120 * gate) * dt;
        splat(velocity, e.x, e.y, vx, vy, 0, 0.008);
        splat(dye, e.x, e.y, amount, 0, 0, 0.006); // fat soft head -> mushroom bloom
      }

      if (pointer.moved) {
        const f = Math.min(0.06, Math.hypot(pointer.dx, pointer.dy));
        const scale = pointer.down ? 900 : 320;
        splat(velocity, pointer.x, pointer.y, pointer.dx * scale, pointer.dy * scale, 0, 0.0025);
        if (pointer.down && f > 0.001) splat(dye, pointer.x, pointer.y, f * 10, 0, 0, 0.0015);
        pointer.moved = false;
      }
    };

    const frame = (now: number) => {
      if (destroyed) return;
      if (!simReady) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      if (!warmed) {
        warmed = true;
        // pre-roll so the first visible frame already shows established plumes
        for (let i = 0; i < 70; i++) {
          time += 1 / 60;
          step(1 / 60);
          emit(1 / 60);
        }
      }
      const dt = Math.min((now - last) / 1000, 1 / 40);
      last = now;
      time += dt;

      step(dt);
      emit(dt);

      useProg(progDisplay);
      gl.uniform2f(progDisplay.uniforms.texelSize, dye.read.texelSizeX, dye.read.texelSizeY);
      gl.uniform1i(progDisplay.uniforms.uDye, dye.read.attach(0));
      gl.uniform1f(progDisplay.uniforms.uTime, time);
      blit(null);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      host.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 300,
        background: "#000",
        overflow: "hidden",
        borderRadius: "inherit",
        cursor: "crosshair",
      }}
    />
  );
}

export default Component;
