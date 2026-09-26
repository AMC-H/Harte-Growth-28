/* Wereldgeometrie en camera.
 * De hele stage leeft in één wereld-coördinatenstelsel. Zes stations liggen op een ring (de gesloten lus);
 * ORIGIN is het midden. De camera kijkt steeds naar een station en trekt aan het eind uit tot de hele
 * ring in beeld is. Alle posities komen hier vandaan, zodat DOM en canvas altijd samenvallen.
 */

export const CHAPTERS = ['origin', 'create', 'distribute', 'attract', 'capture', 'operate', 'convert', 'learn', 'reveal'];

// Station-index per hoofdstuk (0 = midden/origin, 1..6 = de ring)
export const STATION = { origin: 0, create: 1, distribute: 2, attract: 3, capture: 4, operate: 5, convert: 6 };

const DEG = Math.PI / 180;
export const RING_ANGLES = [-150, -90, -30, 30, 90, 150].map(function (a) { return a * DEG; }); // met de klok mee

export function makeLayout(mobile) {
  // Station = het stuk wereld dat de camera per hoofdstuk in beeld brengt. Mobiel: staand en kleiner,
  // zodat de interfaces op telefoonformaat leesbaar blijven.
  var S = mobile ? { w: 720, h: 860 } : { w: 1200, h: 760 };
  var R = mobile ? { x: 900, y: 1000 } : { x: 2300, y: 1400 };
  var st = [{ x: 0, y: 0 }].concat(RING_ANGLES.map(function (a) { return { x: R.x * Math.cos(a), y: R.y * Math.sin(a) }; }));
  var P = function (k, fx, fy) { return { x: st[k].x + fx * S.w, y: st[k].y + fy * S.h }; };

  var L = { mobile: mobile, S: S, R: R, st: st, P: P };

  // Ring-bounding box (voor de reveal)
  var maxX = 0, maxY = 0;
  st.forEach(function (p) { maxX = Math.max(maxX, Math.abs(p.x)); maxY = Math.max(maxY, Math.abs(p.y)); });
  L.ring = { w: 2 * (maxX + S.w / 2), h: 2 * (maxY + S.h / 2) };

  // ---- entiteiten (middelpunten in wereld-coördinaten) ----
  if (!mobile) {
    L.src = P(1, -0.34, 0);
    L.varCreate = [[-0.04, -0.23], [0.17, -0.23], [0.38, -0.23], [-0.04, 0.23], [0.17, 0.23], [0.38, 0.23]].map(function (f) { return P(1, f[0], f[1]); });
    L.testNote = P(1, 0.17, 0.47);
    L.varDist = [0, 1, 2, 3, 4, 5].map(function (i) { return P(2, -0.36, -0.36 + i * 0.144); });
    L.chn = [0, 1, 2, 3, 4].map(function (i) { return P(2, 0.3, -0.34 + i * 0.17); });
    L.budgetNote = P(2, -0.02, 0.46);
    L.crowd = { c: P(3, 0.02, 0.04), rx: 0.44 * S.w, ry: 0.36 * S.h };
    L.prospect = P(3, 0.16, 0.08);
    L.reach = P(3, -0.3, -0.36);
    L.audNote = P(3, -0.3, 0.42);
    L.lp = P(4, -0.12, 0);
    L.lead = P(4, 0.3, 0);
    L.os = P(5, 0, 0);
    L.board = P(6, 0, 0);
    L.boardSize = { w: 1140, h: 600 };
    L.varNew = P(1, -0.12, -0.3);
  } else {
    L.src = P(1, 0, -0.3);
    L.varCreate = [[-0.3, 0.11], [0, 0.11], [0.3, 0.11], [-0.3, 0.37], [0, 0.37], [0.3, 0.37]].map(function (f) { return P(1, f[0], f[1]); });
    L.testNote = P(1, 0, -0.06);
    L.varDist = [0, 1, 2, 3, 4, 5].map(function (i) { return P(2, -0.42 + i * 0.168, -0.33); });
    L.chn = [0, 1, 2, 3, 4].map(function (i) { return P(2, 0, 0.02 + i * 0.1); });
    L.budgetNote = P(2, 0, -0.12);
    L.crowd = { c: P(3, 0, 0.06), rx: 0.44 * S.w, ry: 0.34 * S.h };
    L.prospect = P(3, 0.12, 0.12);
    L.reach = P(3, 0, -0.38);
    L.audNote = P(3, 0, 0.44);
    L.lp = P(4, 0, -0.08);
    L.lead = P(4, 0, 0.42);
    L.os = P(5, 0, 0);
    L.board = P(6, 0, 0);
    L.boardSize = { w: 700, h: 840 };
    L.varNew = P(1, 0, -0.3);
  }

  // Pipeline-slots van de deal-kaart (moeten overeenkomen met growth.css .board)
  var B = L.board, BW = L.boardSize.w, BH = L.boardSize.h;
  L.dealSlots = [0, 1, 2, 3, 4].map(function (i) {
    if (!mobile) return { x: B.x - BW / 2 + 12 + (i + 0.5) * (BW - 24) / 5, y: B.y - BH / 2 + 64 + 40 + 10 + 43 };
    return { x: B.x + 90, y: B.y - BH / 2 + 64 + (i + 0.5) * (BH - 64) / 5 };
  });

  return L;
}

// Schermgebied waarin de camera een station inpast (rest is voor tekst, header en de WhatsApp-knop)
export function safeRect(L, vw, vh, hdr) {
  if (L.mobile) {
    var top = hdr + 8, bottom = Math.round(vh * 0.64);
    return { x: 12, y: top, w: vw - 24, h: bottom - top };
  }
  var left = Math.max(vw * 0.33, 380), right = vw - 96, t = hdr + 16, b = vh - 24;
  return { x: left, y: t, w: right - left, h: b - t };
}

var lerp = function (a, b, t) { return a + (b - a) * t; };

// Camera uit de toestand: path (station-index, mag fractioneel), reveal (0 = station, 1 = hele ring)
export function camera(L, cam, vw, vh, hdr) {
  var safe = safeRect(L, vw, vh, hdr);
  var p = Math.max(0, Math.min(6, cam.path));
  var i = Math.min(5, Math.floor(p)), f = p - i;
  var A = L.st[i], B = L.st[i + 1];
  var x = lerp(A.x, B.x, f), y = lerp(A.y, B.y, f);
  var sSt = Math.min(safe.w / L.S.w, safe.h / L.S.h);
  // onderweg even uitzoomen: je ziet waar je vandaan komt en waar je heen gaat
  var dip = 1 - 0.38 * Math.sin(Math.PI * f) * (cam.hop == null ? 1 : cam.hop);
  var sA = sSt * dip * (cam.zoom || 1);
  var sR = Math.min(safe.w / L.ring.w, safe.h / L.ring.h) * 0.94;
  var r = Math.max(0, Math.min(1, cam.reveal));
  var s = Math.exp(lerp(Math.log(sA), Math.log(sR), r));
  x = lerp(x, 0, r); y = lerp(y, 0, r);
  return { x: x, y: y, s: s, cx: safe.x + safe.w / 2, cy: safe.y + safe.h / 2, safe: safe };
}

export function project(c, p) { return { x: c.cx + (p.x - c.x) * c.s, y: c.cy + (p.y - c.y) * c.s }; }
