"use client";

// Red ink blooming in black water — WebGL fragment shader, no textures, no deps.
// Written for the higherbits.dev / CodeSandbox studio contract:
//   - exports `Component` (zero props) + a default export
//   - self-contained: imports only from "react"
//   - survives StrictMode / HMR double-mounts by building a FRESH canvas each
//     mount (a reused canvas returns a lost GL context and renders blank)

import { useEffect, useRef, useState } from "react";

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;      // 0..1, -1 when idle
uniform vec3  u_color;
uniform float u_intensity;
uniform float u_interactive;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++){ v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;           // aspect correct
  p *= 3.0;

  float t = u_time * 0.08;

  // Cursor swirl
  if (u_interactive > 0.5 && u_mouse.x >= 0.0){
    vec2 m = u_mouse; m.x *= u_res.x / u_res.y; m *= 3.0;
    float md = distance(p, m);
    p += normalize(p - m + 1e-4) * exp(-md * 2.0) * 0.9;
  }

  // Domain warping -> billowing smoke
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - vec2(0.0, t)));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * t));
  float base = fbm(p + 4.0 * r);

  // Top-weighted turbulent density -> separated ink clumps with black gaps
  float vert = smoothstep(-0.1, 0.7, uv.y);
  float dens = smoothstep(0.42, 0.72, base + vert * 0.32 - 0.32) * u_intensity;

  // Color ramp: shadow red -> ink -> pink highlight
  vec3 c1 = u_color * 0.22;
  vec3 c2 = u_color;
  vec3 c3 = mix(u_color, vec3(1.0, 0.45, 0.5), 0.55);
  vec3 col = mix(c1, c2, smoothstep(0.1, 0.55, dens));
  col = mix(col, c3, smoothstep(0.65, 1.0, dens));

  // Glittery particulate
  float sp = pow(noise(p * 40.0 + t * 4.0), 8.0);
  col += sp * dens * vec3(1.0, 0.7, 0.7) * 0.7;

  col *= smoothstep(0.0, 0.15, dens);   // fade thin edges into black
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("RedInkBloom shader:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export const Component = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Clear any stray canvas left by StrictMode / HMR, then build a fresh one.
    mount.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;";
    mount.appendChild(canvas);

    const gl =
      (canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
      }) as WebGLRenderingContext | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const prog = gl.createProgram();
    if (!prog) {
      setWebglSupported(false);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("RedInkBloom link:", gl.getProgramInfoLog(prog));
      setWebglSupported(false);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), // fullscreen triangle
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uColor = gl.getUniformLocation(prog, "u_color");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");
    const uInteractive = gl.getUniformLocation(prog, "u_interactive");

    gl.uniform3fv(uColor, [0.85, 0.04, 0.07]); // deep ink red
    gl.uniform1f(uIntensity, 1);
    gl.uniform1f(uInteractive, 1);

    const mouse = { x: -1, y: -1 };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1 - (e.clientY - rect.top) / rect.height; // gl y is up
    };
    const onLeave = () => {
      mouse.x = -1;
      mouse.y = -1;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = performance.now();
    let raf = 0;
    const render = (now: number) => {
      const t = (now - start) / 1000;
      gl.uniform1f(uTime, reduce ? 8 : t); // reduced-motion: one calm frame
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: 500,
        overflow: "hidden",
        background:
          "radial-gradient(120% 80% at 50% 0%, #4a0206 0%, #1a0002 45%, #000 100%)",
      }}
    >
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      {!webglSupported && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            color: "rgba(255,255,255,0.6)",
            font: "14px/1.5 system-ui, sans-serif",
          }}
        >
          WebGL was blocked by the preview (too many reloads). Refresh the
          browser to see the ink.
        </div>
      )}
    </div>
  );
};

export default Component;
