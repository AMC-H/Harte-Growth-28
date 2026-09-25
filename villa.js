/* Harte Growth, scène 3 (Fundament): cinematische villa-tour in WebGL uit fotorealistische stills.
 * Vier beelden langs één route (zee -> zwembad -> pui -> binnen). Per beeld een langzame push-in naar een
 * focuspunt; tussen twee beelden een 'doorvlieg'-overgang: inzoomen, radiale bewegingsonscherpte, overvloeien.
 * Daarbovenop filmkorrel, vignet en een lichte kleurschifting bij snel scrollen.
 * film.js zet de voortgang (0..1) vanuit de GSAP-scrubtijdlijn; hier dempt hij zacht naar die waarde.
 * Er wordt alleen gerenderd zolang de scène in beeld is (start/stop).
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

// focus = punt in het beeld (0..1, van linksboven) waar de push-in naartoe gaat; zoom = hoe ver
export const SHOTS = [
  { src: '/media/villa/villa-1.png', focus: [0.5, 0.46], zoom: 0.28 },  // vanaf zee op de villa
  { src: '/media/villa/villa-2.png', focus: [0.5, 0.5], zoom: 0.24 },   // aan het zwembad, op de pui af
  { src: '/media/villa/villa-3.png', focus: [0.5, 0.52], zoom: 0.22 },  // op het dek, door de open pui
  { src: '/media/villa/villa-4.png', focus: [0.5, 0.5], zoom: 0.1 }     // binnen, uitzicht op zee
];

const frag = `
precision highp float;
uniform sampler2D uA, uB;
uniform vec2 uRes, uSizeA, uSizeB, uFocA, uFocB;
uniform float uZoomA, uZoomB, uMix, uBlur, uTime, uVel;
varying vec2 vUv;

vec2 cover(vec2 uv, vec2 size) { // object-fit: cover
  float rs = uRes.x / uRes.y, ri = size.x / size.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
vec3 shot(sampler2D t, vec2 uv, vec2 size, vec2 foc, float zoom, float blur) {
  vec2 c = cover(uv, size);
  c = foc + (c - foc) / (1.0 + zoom);                 // push-in naar het focuspunt
  vec2 dir = c - foc;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 10; i++) {                       // radiale bewegingsonscherpte
    col += texture2D(t, foc + dir * (1.0 - blur * float(i) / 10.0)).rgb;
  }
  return col / 10.0;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  float m = smoothstep(0.0, 1.0, uMix);
  vec3 col = mix(shot(uA, vUv, uSizeA, uFocA, uZoomA, uBlur * uMix), shot(uB, vUv, uSizeB, uFocB, uZoomB, uBlur * (1.0 - uMix)), m);
  float ca = uVel * 0.004;                            // kleurschifting bij snel scrollen
  if (ca > 0.0002) {
    vec2 o = vec2(ca, 0.0);
    col.r = mix(col.r, mix(shot(uA, vUv + o, uSizeA, uFocA, uZoomA, 0.0), shot(uB, vUv + o, uSizeB, uFocB, uZoomB, 0.0), m).r, 0.8);
  }
  col = pow(col, vec3(0.97)) * vec3(1.03, 1.0, 0.96); // licht warm
  float v = smoothstep(1.15, 0.35, length((vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
  col *= mix(0.72, 1.0, v);                            // vignet
  col += (hash(vUv * uRes + fract(uTime) * 91.7) - 0.5) * 0.045; // korrel
  gl_FragColor = vec4(col, 1.0);
}`;

export function createVilla(canvas, opts = {}) {
  const mobile = !!opts.mobile;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const loader = new THREE.TextureLoader();
  let dirty = true;
  const shots = SHOTS.map(function (s) {
    const size = new THREE.Vector2(16, 9);
    const tex = loader.load(s.src, function (t) { size.set(t.image.width, t.image.height); dirty = true; if (!running) frame(); });
    tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    return { tex: tex, size: size, focus: new THREE.Vector2(s.focus[0], 1 - s.focus[1]), zoom: s.zoom };
  });
  const u = {
    uA: { value: shots[0].tex }, uB: { value: shots[1].tex },
    uRes: { value: new THREE.Vector2(1, 1) }, uSizeA: { value: shots[0].size }, uSizeB: { value: shots[1].size },
    uFocA: { value: shots[0].focus }, uFocB: { value: shots[1].focus },
    uZoomA: { value: 0 }, uZoomB: { value: 0 }, uMix: { value: 0 }, uBlur: { value: 0 }, uTime: { value: 0 }, uVel: { value: 0 }
  };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: u, fragmentShader: frag,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
  })));

  // voortgang -> beeldpaar, push-in en overgang. T = deel van elk segment dat overgang is.
  const n = shots.length, T = 0.34;
  function apply(p) {
    const x = Math.min(0.99999, Math.max(0, p)) * (n - 1);
    const i = Math.floor(x), f = x - i;
    const A = shots[i], B = shots[Math.min(n - 1, i + 1)];
    const t = Math.max(0, (f - (1 - T)) / T);          // 0..1 in de overgang
    const hold = Math.min(1, f / (1 - T));              // 0..1 in de push-in
    u.uA.value = A.tex; u.uSizeA.value = A.size; u.uFocA.value = A.focus;
    u.uB.value = B.tex; u.uSizeB.value = B.size; u.uFocB.value = B.focus;
    u.uZoomA.value = A.zoom * hold + t * t * 0.9;       // A: push-in, versnelt in de overgang (je vliegt erin)
    u.uZoomB.value = (1 - t) * (1 - t) * 0.35;          // B: komt van dichtbij terug naar ruim
    u.uMix.value = t;
    u.uBlur.value = 0.14 * Math.sin(Math.PI * t) + 0.015;
  }

  const cur = { p: 0, target: 0 };
  const clock = new THREE.Clock();
  let running = false, raf = 0, w = 0, h = 0, tick = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (Math.round(r.width) === w && Math.round(r.height) === h) return;
    w = Math.round(r.width); h = Math.round(r.height);
    renderer.setSize(w, h, false);
    u.uRes.value.set(w, h); dirty = true;
  }
  function frame() {
    const prev = cur.p;
    cur.p += (cur.target - cur.p) * 0.09;                // demping: de camera glijdt naar de scrollpositie
    if (Math.abs(cur.target - cur.p) < 0.0004) cur.p = cur.target;
    u.uVel.value += (Math.min(1, Math.abs(cur.p - prev) * 60) - u.uVel.value) * 0.2;
    u.uTime.value = clock.getElapsedTime();
    resize(); apply(cur.p);
    renderer.render(scene, camera); dirty = false;
  }
  function loop() {
    if (!running) return;
    if (!mobile || (tick++ & 1) === 0) frame();         // mobiel: 30 fps
    raf = requestAnimationFrame(loop);
  }
  resize(); apply(0);
  window.addEventListener('resize', resize);

  return {
    setProgress(p, jump) { cur.target = p; if (jump) { cur.p = p; if (!running) frame(); } },
    start() { if (running) return; running = true; clock.start(); loop(); },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { frame(); },
    snapshot(type, q) { frame(); return canvas.toDataURL(type || 'image/webp', q || 0.82); },
    dispose() { running = false; cancelAnimationFrame(raf); renderer.dispose(); }
  };
}
