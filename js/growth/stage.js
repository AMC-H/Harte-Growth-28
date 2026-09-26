/* De persistente stage: camera, render-loop, wereld-canvas en Growth Signal-canvas.
 *
 * De tijdlijn (story.js) verandert alleen getallen in `state` en DOM-eigenschappen. Deze module tekent
 * elke frame wat daaruit volgt. Zo blijft er één bron van waarheid: scrollen = toestand, stage = weergave.
 */
import { camera, project, RING_ANGLES } from './layout.js';

var INK = '242,240,236', ACC = '255,59,48';

export function makeState() {
  return {
    cam: { path: 0, reveal: 0, hop: 1, zoom: 1 },
    sig: { x: 0, y: 0, a: 1, r: 7, glow: 0.6 },
    birth: 1,          // intro bij binnenkomst (los van de scrolltijdlijn)
    horizon: 0,        // 01: de lijn waaruit het systeem ontstaat
    gen: 0,            // 02: bron -> varianten
    net: 0, flow: 0, prune: 0, boost: 0,   // 03: distributienetwerk
    crowd: 0, focus: 0, crowdOut: 0,       // 04: publiek
    trail: 0,          // 08: spoor van het terugkerende signaal
    rail: 1, railA: 0, // de systeemrail langs de ring (1..7, 7 = rond)
    loop: 0,           // 09: de gesloten lus
    burst: 0, burstAt: { x: 0, y: 0 },
    time: 0
  };
}

// seeded random, zodat het publiek bij elke laadbeurt en na resize hetzelfde is
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// distributie: variant -> kanalen; winnaars krijgen budget
var EDGES = [[0, 0], [0, 1], [1, 0], [1, 4], [1, 1], [2, 0], [2, 4], [2, 2], [3, 2], [4, 1], [4, 3], [5, 3]];
var WIN_EDGES = { '1-4': 1, '2-0': 1, '2-4': 1 };
var WEAK_VARS = { 0: 1, 3: 1, 5: 1 };

export function createStage(L, opts) {
  var gsap = window.gsap;
  var motion = opts.motion;
  var root = document.querySelector('.stage');
  var world = root.querySelector('.w');
  var bg = root.querySelector('.st-bg'), sg = root.querySelector('.st-sig');
  var bgx = bg.getContext('2d'), sgx = sg.getContext('2d');
  var labels = Array.prototype.slice.call(root.querySelectorAll('.t-labels [data-st]'));
  var hdrEl = document.querySelector('.hdr');
  var state = makeState();
  var vw = 0, vh = 0, hdr = 0, dpr = 1, cam = null;

  var els = {
    src: root.querySelector('.src'),
    vars: Array.prototype.slice.call(root.querySelectorAll('.var[data-v]')),
    chn: Array.prototype.slice.call(root.querySelectorAll('.chn'))
  };

  // publiek: vaste deeltjes met bron-kanaal, doelpositie en vertraging
  var R = rng(7);
  var N = L.mobile ? 240 : 480;
  var weights = [0.36, 0.14, 0.1, 0.1, 0.3];
  var crowd = [];
  for (var i = 0; i < N; i++) {
    var u = R(), c = 0, acc = 0;
    for (var k = 0; k < 5; k++) { acc += weights[k]; if (u <= acc) { c = k; break; } }
    var ang = R() * Math.PI * 2, rad = Math.sqrt(R());
    crowd.push({
      c: c,
      tx: L.crowd.c.x + Math.cos(ang) * rad * L.crowd.rx,
      ty: L.crowd.c.y + Math.sin(ang) * rad * L.crowd.ry,
      d: R() * 0.55, ph: R() * 6.28, sz: 1 + R() * 1.4
    });
  }
  crowd[0].tx = L.prospect.x; crowd[0].ty = L.prospect.y; crowd[0].d = 0.1; crowd[0].sz = 2; // de prospect

  // stroomdeeltjes per distributierand
  var flows = EDGES.map(function () { var a = []; for (var j = 0; j < 9; j++) a.push(R()); return a; });

  var trail = [];

  function resize() {
    vw = window.innerWidth; vh = window.innerHeight; hdr = hdrEl ? hdrEl.offsetHeight : 0;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    [bg, sg].forEach(function (c) { c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr); });
    render(true);
  }

  var pos = function (el) { return { x: gsap.getProperty(el, 'x'), y: gsap.getProperty(el, 'y') }; };

  function bez(ax, ay, bx, by, t) {
    // kubische curve; desktop loopt horizontaal, mobiel verticaal
    var d = L.mobile ? (by - ay) * 0.5 : (bx - ax) * 0.5;
    var c1x = L.mobile ? ax : ax + d, c1y = L.mobile ? ay + d : ay;
    var c2x = L.mobile ? bx : bx - d, c2y = L.mobile ? by - d : by;
    var m = 1 - t;
    return {
      x: m * m * m * ax + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * bx,
      y: m * m * m * ay + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * by
    };
  }

  function ringPoint(a) { return { x: L.R.x * Math.cos(a), y: L.R.y * Math.sin(a) }; }

  function drawBg() {
    var s = cam.s;
    bgx.setTransform(1, 0, 0, 1, 0, 0);
    bgx.clearRect(0, 0, bg.width, bg.height);
    // diepteraster (parallax 0.55): laat de camera voelen zonder decoratie
    var k = 0.55, ss = s * k;
    var step = 90;
    while (step * ss < 26) step *= 2;
    while (step * ss > 56) step /= 2;
    var ox = cam.cx - cam.x * ss, oy = cam.cy - cam.y * ss;
    var x0 = Math.floor((0 - ox) / (step * ss)), x1 = Math.ceil((vw - ox) / (step * ss));
    var y0 = Math.floor((0 - oy) / (step * ss)), y1 = Math.ceil((vh - oy) / (step * ss));
    bgx.fillStyle = 'rgba(' + INK + ',.09)';
    for (var gx = x0; gx <= x1; gx++) {
      for (var gy = y0; gy <= y1; gy++) {
        bgx.fillRect((ox + gx * step * ss) * dpr, (oy + gy * step * ss) * dpr, 1.2 * dpr, 1.2 * dpr);
      }
    }

    // wereld-transform voor rail en lus (onder de interfaces)
    bgx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (cam.cx - cam.x * s), dpr * (cam.cy - cam.y * s));
    var a0 = RING_ANGLES[0];
    if (state.railA > 0.001) {
      var a1 = a0 + (Math.max(1, state.rail) - 1) * Math.PI / 3;
      bgx.strokeStyle = 'rgba(' + INK + ',' + (0.16 * state.railA).toFixed(3) + ')';
      bgx.lineWidth = 1.5 / s;
      bgx.beginPath(); bgx.ellipse(0, 0, L.R.x, L.R.y, 0, a0, a1); bgx.stroke();
    }
    if (state.loop > 0.001) {
      // spaken: data verbindt elk station met het midden
      bgx.strokeStyle = 'rgba(' + INK + ',' + (0.12 * state.loop).toFixed(3) + ')';
      bgx.lineWidth = 1 / s;
      for (var j = 1; j <= 6; j++) { bgx.beginPath(); bgx.moveTo(0, 0); bgx.lineTo(L.st[j].x, L.st[j].y); bgx.stroke(); }
      bgx.strokeStyle = 'rgba(' + ACC + ',' + (0.9 * Math.min(1, state.loop * 1.5)).toFixed(3) + ')';
      bgx.lineWidth = 3 / s;
      bgx.beginPath(); bgx.ellipse(0, 0, L.R.x, L.R.y, 0, a0, a0 + Math.PI * 2 * state.loop); bgx.stroke();
      if (state.loop >= 0.999 && motion) {
        // pakketjes die rond blijven gaan: het systeem draait
        bgx.fillStyle = 'rgba(' + ACC + ',1)';
        for (var q = 0; q < 10; q++) {
          var p = ringPoint(a0 + ((state.time * 0.08 + q / 10) % 1) * Math.PI * 2);
          bgx.beginPath(); bgx.arc(p.x, p.y, 4 / s, 0, Math.PI * 2); bgx.fill();
        }
      }
    }
  }

  function drawSig() {
    var s = cam.s, t = state.time;
    sgx.setTransform(1, 0, 0, 1, 0, 0);
    sgx.clearRect(0, 0, sg.width, sg.height);
    sgx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (cam.cx - cam.x * s), dpr * (cam.cy - cam.y * s));
    var px = 1 / s; // één schermpixel in wereld-eenheden

    // 01 horizon
    if (state.horizon > 0.001) {
      var hw = L.S.w * 0.7 * state.horizon;
      sgx.strokeStyle = 'rgba(' + INK + ',' + (0.35 * Math.min(1, state.horizon * 2)).toFixed(3) + ')';
      sgx.lineWidth = px;
      sgx.beginPath(); sgx.moveTo(-hw, 0); sgx.lineTo(hw, 0); sgx.stroke();
    }

    // 02 generatie: bron -> varianten
    if (state.gen > 0.001) {
      sgx.lineWidth = px;
      els.vars.forEach(function (v, i) {
        var b = pos(v);
        sgx.strokeStyle = 'rgba(' + INK + ',' + (0.28 * state.gen).toFixed(3) + ')';
        sgx.beginPath(); sgx.moveTo(L.src.x, L.src.y); sgx.lineTo(b.x, b.y); sgx.stroke();
        var f = ((t * 0.5 + i * 0.17) % 1);
        sgx.fillStyle = 'rgba(' + ACC + ',' + (0.9 * state.gen).toFixed(3) + ')';
        sgx.beginPath(); sgx.arc(L.src.x + (b.x - L.src.x) * f, L.src.y + (b.y - L.src.y) * f, 2.5 * px, 0, 6.283); sgx.fill();
      });
    }

    // 03 distributie: levend netwerk, zwakke paden verzwakken, winnaars krijgen verkeer
    if (state.net > 0.001) {
      EDGES.forEach(function (e, ei) {
        var a = pos(els.vars[e[0]]), b = L.chn[e[1]];
        var weak = WEAK_VARS[e[0]], win = WIN_EDGES[e[0] + '-' + e[1]];
        var al = state.net * (weak ? 1 - 0.85 * state.prune : 1) * (win ? 1 : 1 - 0.4 * state.boost);
        if (al < 0.01) return;
        var bx = b.x - (L.mobile ? 0 : 70), by = b.y - (L.mobile ? 22 : 0);
        sgx.strokeStyle = win ? 'rgba(' + ACC + ',' + (al * (0.3 + 0.5 * state.boost)).toFixed(3) + ')' : 'rgba(' + INK + ',' + (al * 0.22).toFixed(3) + ')';
        sgx.lineWidth = (1 + (win ? 2.5 * state.boost : 0)) * px;
        sgx.beginPath();
        var steps = 18;
        for (var z = 0; z <= steps; z++) { var q = bez(a.x, a.y, bx, by, z / steps); if (z) sgx.lineTo(q.x, q.y); else sgx.moveTo(q.x, q.y); }
        sgx.stroke();
        if (state.flow > 0.001) {
          var n = Math.round((3 + (win ? 6 * state.boost : 0)) * (weak ? 1 - state.prune : 1));
          sgx.fillStyle = win ? 'rgba(' + ACC + ',' + (state.flow * al).toFixed(3) + ')' : 'rgba(' + INK + ',' + (0.6 * state.flow * al).toFixed(3) + ')';
          for (var m = 0; m < n; m++) {
            var ft = (flows[ei][m] + t * (0.18 + (win ? 0.2 * state.boost : 0))) % 1;
            var fp = bez(a.x, a.y, bx, by, ft);
            sgx.beginPath(); sgx.arc(fp.x, fp.y, (win ? 3 : 2) * px, 0, 6.283); sgx.fill();
          }
        }
      });
    }

    // 04 publiek: verkeer uit de kanalen wordt een menigte; daarna één prospect
    if (state.crowd > 0.001) {
      var fadeAll = 1 - state.crowdOut;
      for (var ci = 1; ci < crowd.length; ci++) {
        var d = crowd[ci];
        var kk = Math.max(0, Math.min(1, (state.crowd - d.d * 0.55) / 0.45));
        if (kk <= 0) continue;
        var e3 = 1 - Math.pow(1 - kk, 3);
        var src = L.chn[d.c];
        var wob = motion ? 5 * kk : 0;
        var x = src.x + (d.tx - src.x) * e3 + Math.sin(t * 0.6 + d.ph) * wob;
        var y = src.y + (d.ty - src.y) * e3 + Math.cos(t * 0.5 + d.ph) * wob;
        var al2 = (0.2 + 0.45 * kk) * (1 - 0.82 * state.focus) * fadeAll;
        sgx.fillStyle = 'rgba(' + INK + ',' + al2.toFixed(3) + ')';
        sgx.fillRect(x - d.sz * px, y - d.sz * px, 2 * d.sz * px, 2 * d.sz * px);
      }
      if (state.focus > 0.001) {
        // ring rond de uitgekozen kijker
        sgx.strokeStyle = 'rgba(' + ACC + ',' + (state.focus * fadeAll).toFixed(3) + ')';
        sgx.lineWidth = 1.5 * px;
        sgx.beginPath(); sgx.arc(L.prospect.x, L.prospect.y, (26 - 8 * state.focus) * px + 6 * px, 0, 6.283); sgx.stroke();
      }
    }

    // 07 omzet: schokgolf rond de gewonnen deal
    if (state.burst > 0.001 && state.burst < 0.999) {
      var b0 = state.burstAt;
      for (var rr = 0; rr < 3; rr++) {
        var bb = Math.max(0, state.burst - rr * 0.15);
        if (bb <= 0) continue;
        sgx.strokeStyle = 'rgba(' + ACC + ',' + ((1 - bb) * 0.8).toFixed(3) + ')';
        sgx.lineWidth = (3 - rr) * px;
        sgx.beginPath(); sgx.arc(b0.x, b0.y, (30 + bb * 520) * px * (L.mobile ? 0.7 : 1), 0, 6.283); sgx.stroke();
      }
    }

    // 08 spoor van het terugkerende signaal
    var sig = state.sig;
    if (state.trail > 0.001) {
      var last = trail[trail.length - 1];
      if (!last || Math.hypot(last.x - sig.x, last.y - sig.y) > 6 * px) trail.push({ x: sig.x, y: sig.y });
      if (trail.length > 220) trail.shift();
      sgx.lineWidth = 3 * px; sgx.lineCap = 'round';
      for (var ti = 1; ti < trail.length; ti++) {
        sgx.strokeStyle = 'rgba(' + ACC + ',' + (state.trail * (ti / trail.length) * 0.85).toFixed(3) + ')';
        sgx.beginPath(); sgx.moveTo(trail[ti - 1].x, trail[ti - 1].y); sgx.lineTo(trail[ti].x, trail[ti].y); sgx.stroke();
      }
    } else if (trail.length) trail.length = 0;

    // het Growth Signal zelf (vaste schermgrootte, op elk zoomniveau leesbaar)
    var sa = sig.a * state.birth;
    if (sa > 0.001) {
      var pr = sig.r * px;
      if (motion) {
        var pulse = (t * 0.7) % 1;
        sgx.strokeStyle = 'rgba(' + ACC + ',' + ((1 - pulse) * 0.5 * sa).toFixed(3) + ')';
        sgx.lineWidth = 1.5 * px;
        sgx.beginPath(); sgx.arc(sig.x, sig.y, pr + pulse * 22 * px, 0, 6.283); sgx.stroke();
      }
      sgx.save();
      sgx.shadowColor = 'rgba(' + ACC + ',.9)';
      sgx.shadowBlur = 18 * sig.glow * dpr;
      sgx.fillStyle = 'rgba(' + ACC + ',' + sa.toFixed(3) + ')';
      sgx.beginPath(); sgx.arc(sig.x, sig.y, pr, 0, 6.283); sgx.fill();
      sgx.restore();
      sgx.fillStyle = 'rgba(255,255,255,' + (0.85 * sa).toFixed(3) + ')';
      sgx.beginPath(); sgx.arc(sig.x, sig.y, pr * 0.38, 0, 6.283); sgx.fill();
    }
  }

  var lastKey = '';
  function render(force) {
    if (!vw) return;
    cam = camera(L, state.cam, vw, vh, hdr);
    var key = cam.x.toFixed(1) + ',' + cam.y.toFixed(1) + ',' + cam.s.toFixed(4) + ',' + cam.cx + ',' + cam.cy;
    if (force || key !== lastKey) {
      lastKey = key;
      world.style.transform = 'translate3d(' + (cam.cx - cam.x * cam.s).toFixed(2) + 'px,' + (cam.cy - cam.y * cam.s).toFixed(2) + 'px,0) scale(' + cam.s.toFixed(5) + ')';
      if (state.cam.reveal > 0.01) {
        labels.forEach(function (el) {
          var k = +el.dataset.st, p = project(cam, L.st[k]);
          var out = project(cam, { x: L.st[k].x * 1.0, y: L.st[k].y + (L.st[k].y < 0 ? -1 : 1) * L.S.h * 0.62 });
          el.style.transform = 'translate3d(' + out.x.toFixed(1) + 'px,' + out.y.toFixed(1) + 'px,0) translate(-50%,-50%)';
          void p;
        });
      }
    }
    drawBg();
    drawSig();
  }

  function tick(time, dt) {
    if (motion) state.time += Math.min(dt, 50) / 1000;
    render(false);
  }

  window.addEventListener('resize', resize);
  resize();
  if (motion) gsap.ticker.add(tick);

  return {
    L: L, state: state, root: root, els: els,
    render: function () { render(true); },
    camera: function () { return cam; },
    destroy: function () {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', resize);
      world.style.transform = '';
      bgx.clearRect(0, 0, bg.width, bg.height); sgx.clearRect(0, 0, sg.width, sg.height);
    }
  };
}
