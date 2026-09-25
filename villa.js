/* Harte Growth, scène 3 (Fundament): een villa aan de Costa Blanca in WebGL.
 * Alles wordt in code opgebouwd (geen modellen of textures): witte kubistische villa, infinity pool,
 * teakdek, palmen, bougainville, pijnbomen op de heuvels en de zee bij gouden uur.
 * De camera volgt één pad (zee -> zwembad -> door de pui naar binnen -> omkijken naar zee).
 * film.js zet de voortgang (0..1) vanuit de scrub-tijdlijn; de camera dempt daar zacht naartoe.
 * Er wordt alleen gerenderd zolang de scène in beeld is (start/stop).
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const SUN_DIR = new THREE.Vector3(0.35, 0.16, 1).normalize(); // laag boven zee, achter de camera bij de aanvliegroute
const C = {
  zenith: new THREE.Color('#3f76bd'), horizon: new THREE.Color('#ffb46e'), sun: new THREE.Color('#ffd9a0'),
  wall: '#f3eee6', wallShade: '#e9e2d7', stone: '#e6dccb', teak: '#9c6d45', oak: '#b88a5c',
  glass: '#7f98a6', frame: '#2a2d30', water: '#1aa6b8', leaf: '#4d7a3a', trunk: '#7b5e45',
  pine: '#3f5f36', earth: '#bf9e72', scrub: '#6b7a42', bouga: '#c2336f', cushion: '#f1ece2'
};

export function createVilla(canvas, opts = {}) {
  const mobile = !!opts.mobile;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.horizon.clone().lerp(new THREE.Color('#c9d6e6'), 0.45), 45, 420);
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 3000);

  const uniforms = { uTime: { value: 0 }, uSun: { value: SUN_DIR } };
  const skyGLSL = `
    uniform vec3 uSun;
    vec3 skyColor(vec3 d) {
      float h = clamp(d.y, -0.2, 1.0);
      vec3 zen = vec3(${C.zenith.r.toFixed(3)}, ${C.zenith.g.toFixed(3)}, ${C.zenith.b.toFixed(3)});
      vec3 hor = vec3(${C.horizon.r.toFixed(3)}, ${C.horizon.g.toFixed(3)}, ${C.horizon.b.toFixed(3)});
      vec3 col = mix(hor, zen, pow(max(h, 0.0), 0.38));
      float s = max(dot(d, uSun), 0.0);
      col += vec3(1.0, 0.72, 0.42) * pow(s, 8.0) * 0.55;   // gloed rond de zon
      col += vec3(1.0, 0.92, 0.75) * smoothstep(0.9993, 0.9997, s) * 8.0; // zonneschijf
      return col;
    }`;

  // ---------- Lucht ----------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: skyGLSL + 'varying vec3 vDir; void main(){ gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  }));
  scene.add(sky);

  // omgeving voor reflecties (glas, water) uit dezelfde lucht
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(sky.clone());
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;

  // ---------- Licht ----------
  scene.add(new THREE.HemisphereLight('#bcd6f0', '#b89a74', 0.9));
  const sun = new THREE.DirectionalLight('#ffd6a6', 3.1);
  sun.position.copy(SUN_DIR).multiplyScalar(80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 25, bottom: -25, near: 1, far: 200 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun);

  const mat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, o));
  const M = {
    wall: mat(C.wall, { roughness: 0.95 }), shade: mat(C.wallShade), stone: mat(C.stone, { roughness: 0.9 }),
    teak: mat(C.teak, { roughness: 0.7 }), oak: mat(C.oak, { roughness: 0.6 }), frame: mat(C.frame, { roughness: 0.4, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.04, metalness: 0.9, transparent: true, opacity: 0.32, envMapIntensity: 1.2 }),
    cushion: mat(C.cushion), leaf: mat(C.leaf, { side: THREE.DoubleSide, roughness: 0.8 }), trunk: mat(C.trunk),
    bouga: mat(C.bouga, { flatShading: true }), bougaLeaf: mat('#3f6b33', { flatShading: true }), pine: mat(C.pine, { flatShading: true })
  };
  const box = (w, h, d, m, x, y, z, parent = scene, shadow = true) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z); b.castShadow = shadow; b.receiveShadow = true; parent.add(b); return b;
  };

  // ---------- Terrein: plateau met de villa, heuvels erachter, helling naar zee ----------
  const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise = (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, z) => noise(x, z) * 0.6 + noise(x * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, z * 4.3) * 0.12;
  function height(x, z) {
    const plateau = Math.abs(x) < 26 && z > -16 && z < 17;
    let h;
    if (z < -16) h = (-16 - z) * 0.42 + fbm(x * 0.03, z * 0.03) * 22 * Math.min(1, (-16 - z) / 30); // heuvels achter
    else if (z > 17) h = -Math.min(16, Math.pow((z - 17) / 7, 1.5) * 3 + (z - 17) * 0.25) + (fbm(x * 0.35, z * 0.35) - 0.4) * 2.2 * Math.max(0, 1 - (z - 17) / 14); // rotskust naar zee
    else h = -0.25;
    if (!plateau && z >= -16 && z <= 17) h = -0.25 - Math.min(10, (Math.abs(x) - 26) * 0.35) + fbm(x * 0.06, z * 0.06) * 2 - Math.max(0, z) * 0.15 * Math.min(1, (Math.abs(x) - 26) / 20);
    return h + (plateau ? 0 : (fbm(x * 0.2, z * 0.2) - 0.5) * 1.2);
  }
  const terrGeo = new THREE.PlaneGeometry(700, 520, mobile ? 120 : 200, mobile ? 90 : 160);
  terrGeo.rotateX(-Math.PI / 2);
  const tp = terrGeo.attributes.position, tcol = [];
  const cEarth = new THREE.Color(C.earth), cScrub = new THREE.Color(C.scrub), cRock = new THREE.Color('#cdb99b');
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i) - 60; // terrein iets naar achter
    const y = height(x, z);
    tp.setXYZ(i, x, y, z);
    const t = THREE.MathUtils.clamp(fbm(x * 0.08, z * 0.08) * 1.5 - 0.25, 0, 1);
    const c = cEarth.clone().lerp(cScrub, t);
    if (z > 17.5) c.lerp(cRock, 0.85);                                            // kale rots aan de kust
    if (y < -4.5 && y > -7) c.lerp(new THREE.Color('#8f8676'), 0.5);           // natte rand bij de waterlijn
    tcol.push(c.r, c.g, c.b);
  }
  terrGeo.setAttribute('color', new THREE.Float32BufferAttribute(tcol, 3));
  terrGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  // ---------- Zee ----------
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1), new THREE.ShaderMaterial({
    uniforms: Object.assign({ uCam: { value: camera.position } }, uniforms), fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: skyGLSL + `
      uniform float uTime; uniform vec3 uCam; varying vec3 vW;
      float w(vec2 p){ return sin(p.x*0.09+uTime*0.6)*0.5 + sin(p.y*0.13-uTime*0.8)*0.35 + sin((p.x+p.y)*0.31+uTime*1.3)*0.15 + sin((p.x-p.y)*0.83-uTime*1.9)*0.08; }
      void main(){
        vec2 p = vW.xz; float e = 0.6;
        vec3 n = normalize(vec3(-(w(p+vec2(e,0.0))-w(p-vec2(e,0.0)))*0.45, 1.0, -(w(p+vec2(0.0,e))-w(p-vec2(0.0,e)))*0.45));
        vec3 v = normalize(uCam - vW);
        vec3 r = reflect(-v, n); r.y = abs(r.y);
        float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 deep = vec3(0.02, 0.22, 0.36);
        vec3 refl = skyColor(r) * vec3(0.7, 0.88, 1.12);                                // koeler: water blijft blauw
        vec3 col = mix(deep, refl, fres * 0.7);
        col += vec3(0.0, 0.08, 0.1) * (1.0 - fres);
        col += vec3(1.0, 0.8, 0.55) * pow(max(dot(r, uSun), 0.0), 180.0) * 3.5;       // zonnepad op het water
        float d = length(uCam.xz - vW.xz);
        col = mix(col, skyColor(normalize(vec3(vW.x - uCam.x, 0.001, vW.z - uCam.z))), smoothstep(500.0, 1800.0, d) * 0.8); // naar de horizon
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -6;
  scene.add(sea);

  // ---------- Villa ----------
  const villa = new THREE.Group(); scene.add(villa);
  // benedenverdieping: zijwanden, achterwand, pui aan de zeekant (z = -2.5)
  box(18.6, 0.35, 10, M.stone, 0, -0.1, -7, villa);            // vloerplaat
  box(0.4, 3.4, 2.4, M.wall, -9.1, 1.7, -10.5, villa);          // zijwand links, dicht stuk achter
  box(0.4, 3.4, 1.0, M.wall, -9.1, 1.7, -3.0, villa);           // en voor
  { // glazen pui in de linkergevel: bij het omdraaien kijk je naar buiten
    const z0 = -9.3, z1 = -3.5;
    box(0.04, 3.2, z1 - z0, M.glass, -9.1, 1.72, (z0 + z1) / 2, villa, false);
    for (let i = 0; i <= 3; i++) box(0.09, 3.2, 0.07, M.frame, -9.1, 1.72, z0 + (z1 - z0) * i / 3, villa, false);
  }
  box(0.4, 3.4, 9.4, M.wall, 9.1, 1.7, -7, villa);              // zijwand rechts
  box(18.6, 3.4, 0.4, M.wall, 0, 1.7, -11.6, villa);            // achterwand
  box(3.2, 3.4, 0.45, M.wall, -7.6, 1.7, -2.5, villa);          // dicht stuk voorgevel links
  box(20.6, 0.42, 11.6, M.wall, 0, 3.6, -7.2, villa);           // dak met overstek (schaduw op het dek)
  box(20.6, 0.1, 11.6, M.shade, 0, 3.36, -7.2, villa, false);    // onderkant overstek
  // bovenverdieping, verspringend, met eigen overstek
  box(11, 3, 7.4, M.wall, -2.2, 5.3, -8.4, villa);
  box(13, 0.4, 9, M.wall, -2.2, 7.0, -8.1, villa);
  box(0.12, 1.1, 7.4, M.glass, 3.3, 4.4, -8.4, villa, false);  // glazen balustrade dakterras
  // puien: glas met dunne kozijnen; opening in het midden (de camera loopt erdoorheen)
  const pane = (x0, x1, z, y0 = 0.1, y1 = 3.35) => {
    box(x1 - x0, y1 - y0, 0.04, M.glass, (x0 + x1) / 2, (y0 + y1) / 2, z, villa, false);
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 2.4))) box(0.07, y1 - y0, 0.09, M.frame, x, (y0 + y1) / 2, z, villa, false);
    box(x1 - x0, 0.07, 0.09, M.frame, (x0 + x1) / 2, y1, z, villa, false);
  };
  pane(-6, -1.4, -2.5); pane(1.4, 8.9, -2.5);
  box(0.07, 3.25, 0.09, M.frame, -1.4, 1.72, -2.5, villa, false); box(0.07, 3.25, 0.09, M.frame, 1.4, 1.72, -2.5, villa, false);
  pane(-7.6, 3.2, -4.72, 3.9, 6.7);                            // bovenverdieping, zeekant

  // interieur: eikenvloer, kleed, bank, salontafel, kunst, hanglamp, warm licht
  const room = new THREE.Group(); villa.add(room);
  box(17.6, 0.04, 8.8, M.oak, 0, 0.1, -7, room, false);
  box(6.4, 0.02, 3.6, mat('#d8c9ae'), -0.5, 0.13, -8.2, room, false);
  box(4.2, 0.45, 1.1, M.cushion, -0.5, 0.45, -10.1, room);        // bank zitting
  box(4.2, 0.75, 0.3, M.cushion, -0.5, 0.75, -10.6, room);        // rug
  box(1.1, 0.45, 2.3, M.cushion, -3.0, 0.45, -9.2, room);         // chaise
  box(1.6, 0.36, 0.9, mat('#3a3431', { roughness: 0.5 }), -0.5, 0.3, -8.2, room); // salontafel
  box(3.2, 1.9, 0.05, mat('#c86f4a'), -0.5, 2.1, -11.35, room, false);            // schilderij
  box(1.4, 1.9, 0.05, mat('#3f6d86'), 2.4, 2.1, -11.35, room, false);
  box(2.6, 0.9, 0.5, mat('#2f2a27', { roughness: 0.5 }), 5.6, 0.55, -11.1, room); // dressoir
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffcf8a', emissiveIntensity: 2.2 }));
  lamp.position.set(-0.5, 2.55, -8.2); room.add(lamp);
  box(0.02, 0.75, 0.02, M.frame, -0.5, 3.0, -8.2, room, false);
  const warm = new THREE.PointLight('#ffc27a', 14, 12, 1.6); warm.position.set(-0.5, 2.3, -8); room.add(warm);
  box(2.6, 0.08, 1.1, mat('#8a6444', { roughness: 0.5 }), -6.2, 0.78, -6.3, room);          // eettafel
  box(0.1, 0.74, 0.9, M.frame, -7.3, 0.4, -6.3, room); box(0.1, 0.74, 0.9, M.frame, -5.1, 0.4, -6.3, room);
  for (let i = 0; i < 4; i++) box(0.5, 0.9, 0.5, M.cushion, -7 + (i % 2) * 1.6, 0.46, -6.3 + (i < 2 ? -0.95 : 0.95), room);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), M.bougaLeaf); plant.position.set(-7.5, 0.9, -10.6); room.add(plant);
  box(0.6, 0.6, 0.6, mat('#d9cdb9'), -7.5, 0.4, -10.6, room);

  // ---------- Terras, dek en infinity pool ----------
  box(20, 0.3, 3.6, M.teak, 0, -0.1, -0.7);                       // teakdek voor de pui
  box(1.6, 0.3, 7.6, M.stone, -9.2, -0.1, 4.8);                    // rand links
  box(5.2, 0.3, 7.6, M.stone, 10.4, -0.1, 4.8);                    // rand rechts (ligbedden)
  box(20, 0.3, 1.2, M.stone, 0, -0.1, 9.2);                        // infinity-rand zeekant (lager, gladde steen)
  box(16.8, 1.3, 0.3, M.stone, 0, -0.9, 1.05);                     // bak voorwand
  box(16.8, 0.3, 7.4, mat('#9fd6db'), 0, -1.45, 4.8, scene, false); // bodem
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(16.8, 7.6, 1, 1), new THREE.ShaderMaterial({
    uniforms: Object.assign({ uCam: { value: camera.position } }, uniforms), transparent: true, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: skyGLSL + `
      uniform float uTime; uniform vec3 uCam; varying vec3 vW;
      float c(vec2 p){ // lichtnet op de bodem (caustics, benaderd)
        float t = uTime * 0.7; vec2 q = p * 1.7;
        float a = sin(q.x + sin(q.y * 1.3 + t)) + sin(q.y * 1.1 - sin(q.x * 0.9 - t * 1.2));
        return pow(abs(sin(a * 1.6)), 6.0);
      }
      void main(){
        vec2 p = vW.xz;
        vec3 n = normalize(vec3(sin(p.x*2.1+uTime*1.4)*0.04, 1.0, cos(p.y*2.6-uTime*1.1)*0.04));
        vec3 v = normalize(uCam - vW);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 water = vec3(0.07, 0.62, 0.70) + c(p) * vec3(0.35, 0.45, 0.4);
        vec3 col = mix(water, skyColor(reflect(-v, n)), fres * 0.9);
        gl_FragColor = vec4(col, 0.93);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, -0.12, 4.8); scene.add(pool);

  // ligbedden + parasol
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); g.position.set(10.4, 0.05, 2.4 + i * 2.2); scene.add(g);
    box(0.9, 0.2, 2.1, M.teak, 0, 0.3, 0, g);
    box(0.85, 0.12, 1.4, M.cushion, 0, 0.46, 0.3, g);
    const back = box(0.85, 0.12, 0.8, M.cushion, 0, 0.72, -0.85, g); back.rotation.x = -0.9;
  }
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.6, 12, 1, true), mat('#efe6d6', { side: THREE.DoubleSide }));
  umbrella.position.set(11.9, 2.5, 4.6); umbrella.castShadow = true; scene.add(umbrella);
  box(0.06, 2.5, 0.06, M.frame, 11.9, 1.2, 4.6);

  // ---------- Palmen ----------
  const frondGeo = (() => { // blad: smal, gebogen, met punt
    const g = new THREE.PlaneGeometry(0.9, 3.4, 2, 10); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + 1.7, t = y / 3.4, w = Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * 0.35);
      p.setXYZ(i, p.getX(i) * w, y, -Math.pow(t, 2) * 1.5 + Math.abs(p.getX(i)) * 0.2);
    }
    g.computeVertexNormals(); return g;
  })();
  function palm(x, z, hgt, lean, rot) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector3(Math.sin(t * 1.4) * lean, t * hgt, 0)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.2, 7), M.trunk); trunk.castShadow = true; g.add(trunk);
    const top = curve.getPoint(1);
    for (let i = 0; i < 11; i++) {
      const f = new THREE.Mesh(frondGeo, M.leaf); f.position.copy(top);
      f.rotation.set(-0.5 - (i % 2) * 0.35, (i / 11) * Math.PI * 2, 0, 'YXZ'); f.rotateX(-0.9);
      f.castShadow = true; g.add(f);
    }
    return g;
  }
  const palms = [palm(-11.6, 3.2, 8.5, 1.2, 0.3), palm(13.8, -1.5, 9.5, -1.4, 2.1), palm(-10.2, 8.8, 6.8, 0.8, 4.2), palm(14.5, 9.5, 7.4, -0.9, 1.1)];

  // bougainville tegen de zijgevel
  for (let i = 0; i < (mobile ? 10 : 22); i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + hash(i, 3) * 0.45, 0), i % 3 ? M.bouga : M.bougaLeaf);
    b.position.set(9.5 + hash(i, 1) * 0.6, 0.4 + hash(i, 2) * 3.2, -3.2 - hash(i, 4) * 3.5); b.castShadow = true; scene.add(b);
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v3 = new THREE.Vector3();
  // rotsblokken langs de waterlijn
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mat('#a39a8a', { flatShading: true, roughness: 1 }), mobile ? 30 : 60);
  for (let i = 0; i < rocks.count; i++) {
    const x = (hash(i, 23) - 0.5) * 160, z = 21 + hash(i, 29) * 7, s = 0.35 + Math.pow(hash(i, 31), 2) * 1.3;
    const e = new THREE.Euler(hash(i, 37) * 3, hash(i, 41) * 3, hash(i, 43) * 3);
    m4.compose(v3.set(x, Math.max(height(x, z), -6.4) + s * 0.3, z), q.setFromEuler(e), sc.set(s * 1.4, s * 0.8, s));
    rocks.setMatrixAt(i, m4);
  }
  q.identity(); rocks.receiveShadow = true; scene.add(rocks);

  // mediterrane tuin tussen zwembad en kust: grind, lavendel/rozemarijn en agaves
  const gravel = new THREE.Mesh(new THREE.PlaneGeometry(52, 7.2), mat('#d8ccb4', { roughness: 1 }));
  gravel.rotation.x = -Math.PI / 2; gravel.position.set(0, -0.22, 13.4); gravel.receiveShadow = true; scene.add(gravel);
  const shrubs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat('#7f8f6a', { roughness: 1 }), mobile ? 26 : 48);
  for (let i = 0; i < shrubs.count; i++) {
    const x = (hash(i, 51) - 0.5) * 48, z = 10.6 + hash(i, 53) * 5.6, s = 0.35 + hash(i, 57) * 0.45;
    m4.compose(v3.set(x, -0.2 + s * 0.45, z), q, sc.set(s * 1.3, s * 0.8, s * 1.3)); shrubs.setMatrixAt(i, m4);
  }
  shrubs.castShadow = true; shrubs.receiveShadow = true; scene.add(shrubs);
  const lav = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat('#8a7bb0', { flatShading: true }), mobile ? 14 : 26);
  for (let i = 0; i < lav.count; i++) {
    const x = (hash(i, 61) - 0.5) * 40, z = 11 + hash(i, 67) * 4.5, s = 0.28 + hash(i, 71) * 0.2;
    m4.compose(v3.set(x, -0.1 + s * 0.4, z), q, sc.set(s * 1.4, s, s * 1.4)); lav.setMatrixAt(i, m4);
  }
  scene.add(lav);
  const agaveGeo = new THREE.ConeGeometry(0.12, 1.3, 4); agaveGeo.translate(0, 0.65, 0);
  const agave = new THREE.InstancedMesh(agaveGeo, mat('#7a9a8c', { flatShading: true }), mobile ? 40 : 84);
  for (let k = 0, n = 0; k < 7; k++) {
    const cx = [-15, -6, 4, 13, 18, -19, 22][k], cz = [12.5, 15.2, 14.6, 12.2, 15.8, 15.6, 12.8][k];
    for (let j = 0; j < 12 && n < agave.count; j++, n++) {
      const e = new THREE.Euler(0.5 + hash(k, j) * 0.5, (j / 12) * Math.PI * 2, 0, 'YXZ');
      m4.compose(v3.set(cx, -0.2, cz), q.setFromEuler(e), sc.set(1, 0.8 + hash(j, k) * 0.5, 1)); agave.setMatrixAt(n, m4);
    }
  }
  q.identity(); agave.castShadow = true; scene.add(agave);

  // parasoldennen (Pinus pinea) en struiken op de heuvels, instanced
  const N = mobile ? 160 : 360;
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), mat('#3d5a31', { roughness: 0.9 }), N);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.2, 1, 5), M.trunk, N);
  const bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat('#5b6b3e', { roughness: 1 }), N);
  for (let i = 0, n = 0; n < N && i < 8000; i++) {
    const x = (hash(i, 7) - 0.5) * 420, z = -14 - hash(i, 9) * 190;
    if (Math.abs(x) < 28 && z > -24) continue;
    if (fbm(x * 0.04, z * 0.04) < 0.42) continue; // in groepjes, niet overal
    const s = 0.8 + hash(i, 11) * 0.8, y = height(x, z);
    m4.compose(v3.set(x, y + 3.2 * s, z), q, sc.set(2.6 * s, 0.95 * s, 2.6 * s)); crowns.setMatrixAt(n, m4);
    m4.compose(v3.set(x, y + 1.5 * s, z), q, sc.set(s, 3.2 * s, s)); stems.setMatrixAt(n, m4);
    const bx = x + (hash(i, 13) - 0.5) * 14, bz = z + (hash(i, 17) - 0.5) * 14, bs = 0.6 + hash(i, 19);
    m4.compose(v3.set(bx, height(bx, bz) + 0.3, bz), q, sc.set(bs * 1.3, bs * 0.7, bs * 1.3)); bushes.setMatrixAt(n, m4);
    n++;
  }
  [crowns, stems, bushes].forEach(function (m) { m.receiveShadow = true; scene.add(m); });
  // een paar dennen dichtbij de villa, die wel schaduw werpen
  [[-19, -9, 1.2], [21, -12, 1.35], [-24, 6, 1.0], [26, 2, 1.1]].forEach(function (t) {
    const g = new THREE.Group(); g.position.set(t[0], height(t[0], t[1]), t[1]); scene.add(g);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 4.6 * t[2], 6), M.trunk); st.position.y = 2.3 * t[2]; st.rotation.z = 0.08; st.castShadow = true; g.add(st);
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), mat('#3d5a31', { roughness: 0.9 })); cr.scale.set(3.2 * t[2], 1.1 * t[2], 3.2 * t[2]); cr.position.y = 4.9 * t[2]; cr.castShadow = true; g.add(cr);
  });

  // ---------- Camerapad ----------
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const posCurve = new THREE.CatmullRomCurve3([P(38, 3, 64), P(20, 5, 34), P(-4, 1.2, 13), P(0, 1.55, 1.2), P(0.1, 1.6, -4.6), P(0, 1.6, -6.4)], false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3([P(-2, 1, -6), P(0, 1.8, -3), P(0.5, 1.2, -3), P(-0.4, 1.4, -9), P(-3.5, 1.3, -10.5), P(-10, 1.4, -5), P(0, 1.0, 30)], false, 'centripetal');
  const cur = { p: 0, target: 0 };
  const tmpT = new THREE.Vector3();
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function place(p, time) {
    const e = THREE.MathUtils.clamp(p, 0, 1);
    const k = e * 0.18 + ease(e) * 0.82; // zachte aanloop en uitloop
    posCurve.getPoint(k, camera.position);
    tgtCurve.getPoint(Math.min(1, k * 1.02), tmpT);
    // lichte 'handheld' beweging, alleen buiten
    const sway = (1 - THREE.MathUtils.smoothstep(k, 0.55, 0.75)) * 0.12;
    camera.position.x += Math.sin(time * 0.6) * sway; camera.position.y += Math.sin(time * 0.9 + 1) * sway * 0.5;
    camera.lookAt(tmpT);
    camera.fov = THREE.MathUtils.lerp(38, 55, THREE.MathUtils.smoothstep(k, 0.55, 0.85)) * (camera.aspect < 1 ? 1.4 : 1); // binnen en staand: breder
    camera.updateProjectionMatrix();
  }

  // ---------- Afspelen ----------
  const clock = new THREE.Clock();
  let running = false, raf = 0, w = 0, h = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (Math.round(r.width) === w && Math.round(r.height) === h) return;
    w = Math.round(r.width); h = Math.round(r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function frame() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    cur.p += (cur.target - cur.p) * 0.08; // demping: de camera 'glijdt' naar de scrollpositie
    if (Math.abs(cur.target - cur.p) < 0.0005) cur.p = cur.target;
    resize();
    place(cur.p, t);
    renderer.render(scene, camera);
  }
  let tick = 0;
  function loop() { // mobiel: 30 fps is genoeg en spaart de accu
    if (!running) return;
    if (!mobile || (tick++ & 1) === 0) frame();
    raf = requestAnimationFrame(loop);
  }

  place(0, 0); resize(); renderer.render(scene, camera);
  window.addEventListener('resize', resize);

  return {
    setProgress(p, jump) { cur.target = p; if (jump) { cur.p = p; if (!running) frame(); } },
    start() { if (running) return; running = true; clock.start(); loop(); },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { frame(); },
    snapshot(type, quality) { frame(); return canvas.toDataURL(type || 'image/webp', quality || 0.82); },
    dispose() { running = false; cancelAnimationFrame(raf); renderer.dispose(); pmrem.dispose(); }
  };
}
