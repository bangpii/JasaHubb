/*
 * PaperBackground — permukaan kertas remuk, dirender dengan WebGL (ogl).
 *
 * Kertas remuk adalah height field, bukan color field: lipatannya hanya terlihat
 * karena menangkap cahaya. Shader ini membangun ridged fBm height field, memperoleh
 * surface normal dari finite differences, lalu menyalakan normal itu terhadap satu
 * arah cahaya tetap. Hasilnya relief sungguhan yang bisa diganti warna dari tema.
 *
 * Permukaan statis: kertas remuk tidak bergerak, jadi tidak ada loop rAF —
 * gambar sekali saat mount, lalu hanya saat resize / prop berubah (ganti tema).
 */
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

import './PaperBackground.css';

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [1, 1, 1];
};

const vertex = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform vec3 uPaperColor;
uniform vec3 uCreaseColor;
uniform float uScale;
uniform float uStrength;
uniform float uFocus;
uniform float uFiber;
uniform float uSeed;
uniform float uCrease;
uniform float uAmbient;
uniform float uDetailLimit;

out vec4 fragColor;

const int OCTAVES = 4;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.y, fy.y));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

float ridges(vec2 p, float seed, float freqBase, float sharp) {
  float value = 0.0;
  float amp = 0.5;
  float freq = freqBase;
  float prev = 1.0;
  for (int i = 0; i < OCTAVES; i++) {
    float n = 1.0 - abs(cnoise(p * freq + seed));
    n = pow(n, sharp);
    n *= prev;
    n *= 1.0 - smoothstep(uDetailLimit, uDetailLimit * 2.0, freq);
    prev = n;
    value += n * amp;
    freq *= 2.03;
    amp *= 0.55;
  }
  return value;
}

float height(vec2 p) {
  float h = ridges(p, uSeed, 1.0, 2.0);
  h += 0.80 * ridges(p + vec2(7.3, -4.1), uSeed + 11.7, 1.37, 2.0);
  h += 0.66 * ridges(p + vec2(-3.1, 6.8), uSeed + 41.5, 2.10, 2.5);
  h += 0.34 * ridges(p + vec2(4.7, 1.9), uSeed + 63.1, 4.20, 3.0);
  h += 0.16 * cnoise(p * 0.22 + vec2(-2.6, 5.2));
  return h;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = gl_FragCoord.xy / uResolution - 0.5;
  vec2 screen = uv * vec2(aspect, 1.0);
  vec2 p = screen * uScale;

  float e = uScale / uResolution.y;
  float h  = height(p);
  float hx = height(p + vec2(e, 0.0));
  float hy = height(p + vec2(0.0, e));

  vec2 grad = vec2(hx - h, hy - h) / e;

  vec3 n = normalize(vec3(
    -grad.x * uStrength,
    -grad.y * uStrength,
    1.0
  ));

  vec3 lightDir = normalize(vec3(-0.52, 0.66, 0.55));
  float diffuse = clamp(dot(n, lightDir), 0.0, 1.0);

  float shade = uAmbient + (1.0 - uAmbient) * diffuse;

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float sheen = pow(clamp(dot(reflect(-lightDir, n), viewDir), 0.0, 1.0), 6.0);
  shade += sheen * 0.16;

  vec3 color = mix(uCreaseColor, uPaperColor, min(shade, 1.2));

  float crease = smoothstep(2.10, 3.30, length(grad) * uStrength);
  color = mix(color, uCreaseColor, crease * uCrease);

  vec2 gp = gl_FragCoord.xy / uResolution.y;
  float grain = cnoise(gp * 110.0) * 0.5 + cnoise(gp * 260.0) * 0.5;
  color *= 1.0 + grain * uFiber;

  float r = length(screen) / (0.5 * length(vec2(aspect, 1.0)));
  float relief = mix(uFocus, 1.0, smoothstep(0.08, 0.95, r));
  color = mix(uPaperColor, color, relief);

  fragColor = vec4(color, 1.0);
}
`;

const PAPER = {
  paperColor: '#F4F1EA',
  creaseColor: '#C4B69A',
  scale: 4.5,
  strength: 0.075,
  focus: 0.4,
  fiber: 0.026,
  crease: 0.8,
  ambient: 0.55,
  seed: 0
};

const PaperBackground = ({ className = '', style = undefined }) => {
  const containerRef = useRef(null);
  const settingsRef = useRef(null);
  const wakeRef = useRef(() => {});

  useEffect(() => {
    settingsRef.current = PAPER;
    wakeRef.current();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: false,
        antialias: false,
        depth: false
      });
    } catch {
      return undefined;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const uniforms = {
      uResolution: { value: [1, 1] },
      uPaperColor: { value: hexToRgb(PAPER.paperColor) },
      uCreaseColor: { value: hexToRgb(PAPER.creaseColor) },
      uScale: { value: PAPER.scale },
      uStrength: { value: PAPER.strength },
      uFocus: { value: PAPER.focus },
      uFiber: { value: PAPER.fiber },
      uSeed: { value: PAPER.seed },
      uCrease: { value: PAPER.crease },
      uAmbient: { value: PAPER.ambient },
      uDetailLimit: { value: 1 }
    };

    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex,
        fragment,
        uniforms,
        depthTest: false,
        depthWrite: false
      })
    });

    let raf = 0;

    const draw = () => {
      const s = settingsRef.current;
      if (!s) return;
      const { clientWidth, clientHeight } = container;
      if (clientWidth > 0 && clientHeight > 0) renderer.setSize(clientWidth, clientHeight);
      uniforms.uResolution.value = [canvas.width, canvas.height];
      uniforms.uPaperColor.value = hexToRgb(s.paperColor);
      uniforms.uCreaseColor.value = hexToRgb(s.creaseColor);
      uniforms.uScale.value = s.scale;
      uniforms.uStrength.value = s.strength;
      uniforms.uFocus.value = s.focus;
      uniforms.uFiber.value = s.fiber;
      uniforms.uSeed.value = s.seed;
      uniforms.uCrease.value = s.crease;
      uniforms.uAmbient.value = s.ambient;
      uniforms.uDetailLimit.value = canvas.height / (70.0 * s.scale);
      renderer.render({ scene: mesh });
    };

    const wake = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        draw();
      });
    };
    wakeRef.current = wake;

    const resizeObserver = new ResizeObserver(wake);
    resizeObserver.observe(container);
    wake();

    return () => {
      wakeRef.current = () => {};
      resizeObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`paper-bg ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
};

export default PaperBackground;
