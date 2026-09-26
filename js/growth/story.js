/* De film: één master-tijdlijn, opgebouwd uit negen hoofdstukken.
 * Tijdseenheid = schermhoogte: een hoofdstuk van --len 2.2 duurt 2.2 eenheden. Zo valt elk hoofdstuk
 * precies samen met zijn <section> in de pagina (ScrollTrigger: top top -> bottom top).
 * Elk hoofdstuk krijgt `at(u)` (0..1 binnen het hoofdstuk) en `d(u)` (duur als deel van het hoofdstuk).
 * Objecten verdwijnen niet tussen hoofdstukken: ze verhuizen, krimpen of worden iets anders.
 */
import { CHAPTERS } from './layout.js';

// rustpunt per hoofdstuk (deel van het hoofdstuk): hier staat het beeld 'af', vóór de camera verder gaat.
// Gebruikt voor ankerlinks en voor de reduced-motion diavoorstelling.
export var HOLD = { origin: 0.4, create: 0.68, distribute: 0.74, attract: 0.78, capture: 0.78, operate: 0.8, convert: 0.93, learn: 0.97, reveal: 1 };

export function buildStory(tl, stage, sections) {
  var gsap = window.gsap;
  var L = stage.L, S = stage.state, root = stage.root;
  var q = function (sel) { return root.querySelector(sel); };
  var qa = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

  // ---------- helpers ----------
  function place(el, p, extra) { gsap.set(el, Object.assign({ xPercent: -50, yPercent: -50, x: p.x, y: p.y }, extra || {})); }
  // wereldpositie van een kind binnen een entiteit (entiteit op schaal 1 op positie `at`)
  function worldOf(child, ent, at) {
    var x = 0, y = 0, n = child;
    while (n && n !== ent) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: at.x - ent.offsetWidth / 2 + x + child.offsetWidth / 2, y: at.y - ent.offsetHeight / 2 + y + child.offsetHeight / 2 };
  }
  function counter(el, to, fmt) {
    var o = { v: 0 };
    return { target: o, vars: { v: to, onUpdate: function () { el.textContent = fmt(o.v); } } };
  }
  var nl = function (n) { return Math.round(n).toLocaleString('nl-NL'); };
  var sig = function (p, dur, at, extra) { tl.to(S.sig, Object.assign({ x: p.x, y: p.y, duration: dur, ease: 'power2.inOut' }, extra || {}), at); };

  // ---------- elementen ----------
  var src = q('.src'), rec = q('.src .rec');
  var vars = qa('.var[data-v]'), varC = q('.var[data-v="C"]');
  var bars = qa('.var[data-v] .v-bar i'), vals = qa('.var[data-v] .v-val');
  var weak = qa('.var[data-weak]'), stops = qa('.var[data-weak] .v-stop'), winV = qa('.var[data-win]');
  var testNote = q('[data-ent="testNote"]');
  var chn = qa('.chn'), chnN = qa('.chn .chn-n'), chnWin = qa('.chn[data-win]'), reels = q('.chn[data-c="0"]');
  var budgetNote = q('[data-ent="budgetNote"]');
  var reach = q('.reach'), reachN = q('.reach-n');
  var ptag = q('.ptag'), pts = [q('.pt-1'), q('.pt-2'), q('.pt-3')];
  var audNote = q('[data-ent="audNote"]');
  var lp = q('.lp'), lpHero = q('.lp-hero'), lpCta = q('.lp-cta'), lpForm = q('.lp-form'), lpFields = qa('.lp-f b'), lpSend = q('.lp-send'), lpUtm = q('.lp-utm');
  var lead = q('.lead');
  var os = q('.os'), osHead = q('.os-head'), osAv = q('.os-head .av'), osParts = qa('.os-top, .os-nav, .os-head');
  var osF = qa('.os-f'), msgs = qa('.os-chat .cm'), aiA = qa('.os-ai .ai-a'), osH = qa('.os-chat .os-h, .os-ai .os-h');
  var qual = qa('.os-qual li'), qualBox = q('.os-qual'), next = q('.os-next');
  var scoreN = q('.score-n'), scoreRing = q('.sc-fg'), revN = qa('.rev-n');
  var board = q('.board'), deal = q('.deal'), dealS = qa('.deal-s span'), dealV = q('.deal-v');
  var varNew = q('.var-new');
  var tOrigin = q('.t-origin'), tBig = function (k) { return q('.t-big[data-t="' + k + '"]'); };
  var tLearn = q('.t-learn'), tLearnLi = qa('.t-learn li'), labels = qa('.t-labels [data-st]'), tFinal = q('.t-final');

  // ---------- beginstand (alles in wereld-coördinaten) ----------
  S.sig.x = 0; S.sig.y = 0;
  place(src, L.src, { autoAlpha: 0, scale: 0.06 });
  vars.forEach(function (v) { place(v, L.src, { autoAlpha: 0, scale: 0.25 }); });
  place(testNote, L.testNote, { autoAlpha: 0 });
  gsap.set(bars, { scaleX: 0 }); gsap.set(vals, { autoAlpha: 0 }); gsap.set(stops, { autoAlpha: 0 });
  gsap.set(vars, { '--win': 0, '--hot': 0 });
  chn.forEach(function (c, i) { place(c, L.chn[i], { autoAlpha: 0, x: L.chn[i].x + (L.mobile ? 0 : 60), y: L.chn[i].y + (L.mobile ? 24 : 0), '--hot': 0 }); });
  place(budgetNote, L.budgetNote, { autoAlpha: 0 });
  place(reach, L.reach, { autoAlpha: 0 });
  place(ptag, { x: L.prospect.x, y: L.prospect.y + 46 }, { autoAlpha: 0 });
  gsap.set(pts, { autoAlpha: 0 });
  place(audNote, L.audNote, { autoAlpha: 0, '--hot': 0 });
  place(lp, L.lp, { autoAlpha: 0 });
  var ctaW = worldOf(lpCta, lp, L.lp);
  gsap.set(lp, { scale: 0.08, transformOrigin: (ctaW.x - L.lp.x + lp.offsetWidth / 2) + 'px ' + (ctaW.y - L.lp.y + lp.offsetHeight / 2) + 'px' });
  gsap.set(lpForm, { autoAlpha: 0, y: 40 });
  gsap.set(lpFields, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set(lpUtm, { autoAlpha: 0, '--hot': 0 });
  var formW = { x: L.lp.x, y: L.lp.y + lp.offsetHeight * 0.18 };
  place(lead, formW, { autoAlpha: 0, scale: 0.6 });
  place(os, L.os, { autoAlpha: 0, scale: 0.96 });
  gsap.set(osF, { autoAlpha: 0, x: -10, '--hot': 0 }); gsap.set(msgs, { autoAlpha: 0, y: 10 }); gsap.set(aiA, { autoAlpha: 0, x: 10 });
  gsap.set(qual, { autoAlpha: 0 }); gsap.set(next, { autoAlpha: 0, y: 10 }); gsap.set(osH, { autoAlpha: 0 });
  gsap.set(scoreRing, { strokeDashoffset: 100 });
  var avW = worldOf(osAv, os, L.os), nextW = worldOf(next, os, L.os);
  var fW = function (k) { return worldOf(q('.os-f[data-f="' + k + '"]'), os, L.os); };
  place(board, L.board, { autoAlpha: 0, scale: 0.97 });
  place(deal, nextW, { autoAlpha: 0, '--won': 0 });
  gsap.set(dealS.slice(1), { autoAlpha: 0 });
  place(varNew, L.src, { autoAlpha: 0, scale: 0.3, '--win': 1 });
  gsap.set([tBig('attract'), tBig('capture'), tBig('convert'), tBig('learn'), tLearn, tFinal], { autoAlpha: 0 });
  gsap.set(tLearnLi, { autoAlpha: 0.18 });
  gsap.set(labels, { autoAlpha: 0 });

  var utmW = worldOf(lpUtm, lp, L.lp);
  var recW = worldOf(rec, src, L.src);
  var reelsDot = { x: L.chn[0].x - (L.mobile ? 0 : 70), y: L.chn[0].y - (L.mobile ? 22 : 0) };

  // ---------- hoofdstukken ----------
  var t = 0, starts = {}, lens = {};
  sections.forEach(function (sec) { lens[sec.id] = parseFloat(getComputedStyle(sec).getPropertyValue('--len')) || 2; });
  function chapter(id, fn) {
    var t0 = t, len = lens[id];
    starts[id] = t0;
    var at = function (u) { return t0 + u * len; };
    var d = function (u) { return u * len; };
    fn(at, d);
    t += len;
  }

  // 01 ORIGIN: het signaal ontstaat, de horizon trekt open, de camera vertrekt naar het content-station
  chapter('origin', function (at, d) {
    tl.to(S, { horizon: 1, duration: d(0.45), ease: 'power2.out' }, at(0.04))
      .to(S.sig, { glow: 1, r: 9, duration: d(0.3) }, at(0.08))
      .to(tOrigin, { autoAlpha: 0, y: -40, scale: 1.05, duration: d(0.22), ease: 'power1.in' }, at(0.5))
      .to(S, { horizon: 0, duration: d(0.25) }, at(0.66))
      .to(S, { railA: 1, duration: d(0.3) }, at(0.66))
      .to(S.cam, { path: 1, duration: d(0.4), ease: 'power2.inOut' }, at(0.6));
    sig(L.src, d(0.36), at(0.6), { r: 8 });
    tl.to(src, { autoAlpha: 1, scale: 1, duration: d(0.16), ease: 'power2.out' }, at(0.84));
    sig(recW, d(0.1), at(0.9), { r: 5, glow: 0.6 });
  });

  // 02 CREATE: één bron wordt zes varianten; ze worden getest
  chapter('create', function (at, d) {
    tl.to(S, { gen: 1, duration: d(0.2) }, at(0.08));
    vars.forEach(function (v, i) {
      tl.to(v, { x: L.varCreate[i].x, y: L.varCreate[i].y, scale: 1, autoAlpha: 1, duration: d(0.16), ease: 'power2.out' }, at(0.1 + i * 0.045));
    });
    tl.to(testNote, { autoAlpha: 1, duration: d(0.06) }, at(0.42))
      .to(bars, { scaleX: 1, duration: d(0.22), stagger: d(0.015), ease: 'power1.out' }, at(0.42))
      .to(vals, { autoAlpha: 1, duration: d(0.06), stagger: d(0.015) }, at(0.5))
      .to(winV, { '--win': 1, duration: d(0.06) }, at(0.62));
    sig({ x: L.varCreate[2].x, y: L.varCreate[2].y }, d(0.14), at(0.56), { r: 6 });
    // naar Distribute: de varianten verhuizen mee en worden knooppunten
    tl.to(S, { gen: 0, duration: d(0.1) }, at(0.72))
      .to(testNote, { autoAlpha: 0, duration: d(0.06) }, at(0.72))
      .to(S.cam, { path: 2, duration: d(0.3), ease: 'power2.inOut' }, at(0.72))
      .to(S, { rail: 2, duration: d(0.3) }, at(0.72))
      .to(src, { autoAlpha: 0.5, duration: d(0.2) }, at(0.75));
    vars.forEach(function (v, i) {
      tl.to(v, { x: L.varDist[i].x, y: L.varDist[i].y, scale: 0.5, duration: d(0.28), ease: 'power2.inOut' }, at(0.72));
    });
    sig(L.varDist[2], d(0.28), at(0.72));
  });

  // 03 DISTRIBUTE: het netwerk leeft; zwakke paden stoppen, winnaars krijgen budget
  chapter('distribute', function (at, d) {
    chn.forEach(function (c, i) {
      tl.to(c, { autoAlpha: 1, x: L.chn[i].x, y: L.chn[i].y, duration: d(0.1), ease: 'power2.out' }, at(0.02 + i * 0.025));
    });
    tl.to(S, { net: 1, duration: d(0.18) }, at(0.06))
      .to(S, { flow: 1, duration: d(0.14) }, at(0.12));
    var totals = [48200, 9300, 6400, 3100, 31900];
    chnN.forEach(function (el, i) {
      var c = counter(el, totals[i], nl);
      tl.to(c.target, Object.assign({ duration: d(0.75), ease: 'power1.in' }, c.vars), at(0.15));
    });
    tl.to(S, { prune: 1, duration: d(0.2) }, at(0.4))
      .to(weak, { autoAlpha: 0.3, duration: d(0.12) }, at(0.44))
      .to(stops, { autoAlpha: 1, duration: d(0.08) }, at(0.48))
      .to(S, { boost: 1, duration: d(0.22) }, at(0.54))
      .to(chnWin, { '--hot': 1, duration: d(0.1) }, at(0.58))
      .to(budgetNote, { autoAlpha: 1, duration: d(0.08) }, at(0.6))
      .to(budgetNote, { autoAlpha: 0, duration: d(0.08) }, at(0.84));
    sig(reelsDot, d(0.16), at(0.62), { r: 6 });
    // naar Attract: verkeer uit de kanalen wordt publiek
    tl.to(S.cam, { path: 3, duration: d(0.3), ease: 'power2.inOut' }, at(0.76))
      .to(S, { rail: 3, duration: d(0.3) }, at(0.76))
      .to(S, { crowd: 0.35, duration: d(0.26) }, at(0.74));
    sig(L.crowd.c, d(0.3), at(0.76), { r: 5, glow: 0.4 });
  });

  // 04 ATTRACT: groot bereik, dan één kijker die bezoeker en prospect wordt
  chapter('attract', function (at, d) {
    tl.to(S, { crowd: 1, duration: d(0.42) }, at(0))
      .to(reach, { autoAlpha: 1, duration: d(0.08) }, at(0.04));
    var rc = counter(reachN, 128400, nl);
    tl.to(rc.target, Object.assign({ duration: d(0.4), ease: 'power1.out' }, rc.vars), at(0.05))
      .to(S, { flow: 0.3, duration: d(0.2) }, at(0.3))
      .to(S, { focus: 1, duration: d(0.18) }, at(0.44))
      .to(tBig('attract'), { autoAlpha: 1, duration: d(0.06) }, at(0.5))
      .to(tBig('attract'), { autoAlpha: 0, duration: d(0.06) }, at(0.76));
    sig(L.prospect, d(0.18), at(0.44), { r: 8, glow: 1 });
    tl.to(ptag, { autoAlpha: 1, duration: d(0.04) }, at(0.54))
      .to(pts[0], { autoAlpha: 1, duration: d(0.04) }, at(0.54))
      .to(pts[0], { autoAlpha: 0, duration: d(0.03) }, at(0.63))
      .to(pts[1], { autoAlpha: 1, duration: d(0.03) }, at(0.64))
      .to(pts[1], { autoAlpha: 0, duration: d(0.03) }, at(0.71))
      .to(pts[2], { autoAlpha: 1, duration: d(0.03) }, at(0.72))
      .to(audNote, { autoAlpha: 1, duration: d(0.06) }, at(0.6));
    // naar Capture: de prospect (het signaal) gaat mee, het publiek blijft gedimd achter
    tl.to(S.cam, { path: 4, duration: d(0.3), ease: 'power2.inOut' }, at(0.8))
      .to(S, { rail: 4, duration: d(0.3) }, at(0.8))
      .to(S, { crowdOut: 0.75, duration: d(0.18) }, at(0.82))
      .to(ptag, { autoAlpha: 0, duration: d(0.06) }, at(0.84));
    sig(ctaW, d(0.3), at(0.8), { r: 7 });
  });

  // 05 CAPTURE: de landingspagina bouwt zich rond de tik; aandacht wordt een aanvraag met een naam
  chapter('capture', function (at, d) {
    tl.to(lp, { autoAlpha: 1, scale: 1, duration: d(0.14), ease: 'power2.out' }, at(0))
      .to(lpCta, { scale: 0.92, duration: d(0.03), yoyo: true, repeat: 1 }, at(0.15))
      .to(S.sig, { r: 12, duration: d(0.03), yoyo: true, repeat: 1 }, at(0.15))
      .to(lpHero, { autoAlpha: 0.25, y: -20, duration: d(0.08) }, at(0.2))
      .to(lpForm, { autoAlpha: 1, y: 0, duration: d(0.08), ease: 'power2.out' }, at(0.22));
    var fieldAt = [0.3, 0.38, 0.46, 0.54];
    lpFields.forEach(function (f, i) {
      var p = worldOf(f.parentNode, lp, L.lp);
      sig(p, d(0.05), at(fieldAt[i] - 0.05), { r: 6 });
      tl.to(f, { clipPath: 'inset(0% 0% 0% 0%)', duration: d(0.06), ease: 'steps(12)' }, at(fieldAt[i]));
    });
    var sendW = worldOf(lpSend, lp, L.lp);
    sig(sendW, d(0.05), at(0.6));
    tl.to(lpSend, { scale: 0.92, duration: d(0.03), yoyo: true, repeat: 1 }, at(0.64))
      .to(lpUtm, { autoAlpha: 1, duration: d(0.05) }, at(0.64))
      .to(lead, { autoAlpha: 1, x: L.lead.x, y: L.lead.y, scale: 1, duration: d(0.14), ease: 'power2.out' }, at(0.68))
      .to(lp, { autoAlpha: 0.45, duration: d(0.12) }, at(0.72))
      .to(tBig('capture'), { autoAlpha: 1, duration: d(0.05) }, at(0.72))
      .to(tBig('capture'), { autoAlpha: 0, duration: d(0.05) }, at(0.86));
    var leadAv = { x: L.lead.x - (L.mobile ? 0 : 0), y: L.lead.y };
    sig(leadAv, d(0.14), at(0.68), { r: 6 });
    // naar Operate: de lead verhuist naar het OS en wordt het hoofd van het leadrecord
    tl.to(S.cam, { path: 5, duration: d(0.28), ease: 'power2.inOut' }, at(0.82))
      .to(S, { rail: 5, duration: d(0.28) }, at(0.82))
      .to(lead, { x: avW.x + (lead.offsetWidth / 2 - 30), y: avW.y, duration: d(0.24), ease: 'power2.inOut' }, at(0.84));
    sig(avW, d(0.24), at(0.84));
  });

  // 06 OPERATE: het HarteGrowth OS vult het record; AI doet zichtbaar werk
  chapter('operate', function (at, d) {
    tl.to(os, { autoAlpha: 1, scale: 1, duration: d(0.07), ease: 'power2.out' }, at(0))
      .to(lead, { autoAlpha: 0, duration: d(0.04) }, at(0.05))
      .to(osH, { autoAlpha: 1, duration: d(0.04) }, at(0.06));
    osF.forEach(function (f, i) { tl.to(f, { autoAlpha: 1, x: 0, duration: d(0.04) }, at(0.1 + i * 0.05)); });
    tl.to(aiA[0], { autoAlpha: 1, x: 0, duration: d(0.04) }, at(0.14))
      .to(aiA[1], { autoAlpha: 1, x: 0, duration: d(0.04) }, at(0.27));
    [0.2, 0.3, 0.38, 0.46, 0.54].forEach(function (u, i) { tl.to(msgs[i], { autoAlpha: 1, y: 0, duration: d(0.04), ease: 'power2.out' }, at(u)); });
    tl.to(aiA[2], { autoAlpha: 1, x: 0, duration: d(0.04) }, at(0.48));
    qual.forEach(function (li, i) { tl.to(li, { autoAlpha: 1, duration: d(0.03) }, at(0.5 + i * 0.04)); });
    var sc = counter(scoreN, 86, function (v) { return String(Math.round(v)); });
    tl.to(sc.target, Object.assign({ duration: d(0.14) }, sc.vars), at(0.56))
      .to(scoreRing, { strokeDashoffset: 14, duration: d(0.14) }, at(0.56))
      .to(aiA[3], { autoAlpha: 1, x: 0, duration: d(0.04) }, at(0.68))
      .to(next, { autoAlpha: 1, y: 0, duration: d(0.05) }, at(0.72))
      .to(aiA[4], { autoAlpha: 1, x: 0, duration: d(0.04) }, at(0.74));
    sig(worldOf(q('.os-ai'), os, L.os), d(0.1), at(0.12), { r: 5 });
    sig(nextW, d(0.08), at(0.7), { r: 6 });
    // naar Convert: de lead wordt een deal-kaart op de pipeline
    tl.to(S.cam, { path: 6, duration: d(0.24), ease: 'power2.inOut' }, at(0.84))
      .to(S, { rail: 6, duration: d(0.24) }, at(0.84))
      .to(deal, { autoAlpha: 1, x: L.dealSlots[0].x, y: L.dealSlots[0].y, duration: d(0.24), ease: 'power2.inOut' }, at(0.84));
    sig({ x: L.dealSlots[0].x - (L.mobile ? 100 : 80), y: L.dealSlots[0].y - 20 }, d(0.24), at(0.84));
  });

  // 07 CONVERT: NIEUW -> GEKWALIFICEERD -> AFSPRAAK -> KANS -> GEWONNEN, en de omzet
  chapter('convert', function (at, d) {
    tl.to(board, { autoAlpha: 1, scale: 1, duration: d(0.1), ease: 'power2.out' }, at(0));
    [0.18, 0.34, 0.5, 0.64].forEach(function (u, i) {
      var p = L.dealSlots[i + 1];
      tl.to(deal, { x: p.x, y: p.y, duration: d(0.1), ease: 'power2.inOut' }, at(u))
        .to(dealS[i], { autoAlpha: 0, duration: d(0.04) }, at(u + 0.03))
        .to(dealS[i + 1], { autoAlpha: 1, duration: d(0.04) }, at(u + 0.05));
      sig({ x: p.x - (L.mobile ? 100 : 80), y: p.y - 20 }, d(0.1), at(u));
    });
    var won = L.dealSlots[4];
    tl.set(S.burstAt, { x: won.x, y: won.y }, at(0.76))
      .to(deal, { '--won': 1, scale: 1.08, duration: d(0.06) }, at(0.78))
      .to(S, { burst: 1, duration: d(0.2), ease: 'power1.out' }, at(0.78))
      .to(tBig('convert'), { autoAlpha: 1, scale: 1, duration: d(0.06) }, at(0.8));
    revN.forEach(function (el) {
      var o = { v: 38200 };
      tl.to(o, { v: 43000, duration: d(0.12), onUpdate: function () { el.textContent = '€ ' + nl(o.v); } }, at(0.8));
    });
    sig(won, d(0.06), at(0.9), { r: 9, glow: 1 });
  });

  // 08 LEARN: de omzet reist terug door het systeem en leert; er ontstaat een nieuw creatief
  chapter('learn', function (at, d) {
    tl.to(tBig('convert'), { autoAlpha: 0, duration: d(0.05) }, at(0.02))
      .to(S, { trail: 1, duration: d(0.04) }, at(0))
      .to(tLearn, { autoAlpha: 1, duration: d(0.05) }, at(0.03))
      .to(S.cam, { reveal: 0.3, hop: 0.4, duration: d(0.1) }, at(0.02))
      .to(S.cam, { path: 1, duration: d(0.64), ease: 'power1.inOut' }, at(0.04));
    // aankomst per station (camera-pad loopt 6 -> 1)
    var arrive = function (k) { return 0.04 + (6 - k) / 5 * 0.64; };
    var hop = function (p, k) { var a = arrive(k + 1), b = arrive(k); sig(p, d(b - a), at(a), { r: 7, ease: 'power1.inOut' }); };
    hop(fW('cre'), 5);
    tl.to(osF, { '--hot': 1, duration: d(0.03), stagger: d(0.01) }, at(arrive(5) - 0.02))
      .to([tLearnLi[0], tLearnLi[4]], { autoAlpha: 1, duration: d(0.03) }, at(arrive(5)));
    hop(utmW, 4);
    tl.to(lpUtm, { '--hot': 1, duration: d(0.03) }, at(arrive(4) - 0.01))
      .to(tLearnLi[1], { autoAlpha: 1, duration: d(0.03) }, at(arrive(4)));
    hop(L.prospect, 3);
    tl.to(audNote, { '--hot': 1, duration: d(0.03) }, at(arrive(3) - 0.01))
      .to(tLearnLi[2], { autoAlpha: 1, duration: d(0.03) }, at(arrive(3)));
    hop(reelsDot, 2);
    tl.to([reels, varC], { '--hot': 1, duration: d(0.03) }, at(arrive(2) - 0.01))
      .to(tLearnLi[3], { autoAlpha: 1, duration: d(0.03) }, at(arrive(2)));
    hop(L.src, 1);
    tl.to(src, { autoAlpha: 1, '--hot': 1, duration: d(0.04) }, at(arrive(1) - 0.02))
      .to(tLearnLi[5], { autoAlpha: 1, duration: d(0.03) }, at(arrive(1)))
      .to(S.cam, { reveal: 0.06, hop: 1, duration: d(0.12) }, at(0.7))
      // de lus sluit: de rail loopt door van Sales terug naar Content
      .to(S, { rail: 7, duration: d(0.16) }, at(0.66))
      .to(varNew, { autoAlpha: 1, x: L.varNew.x, y: L.varNew.y, scale: 1, duration: d(0.12), ease: 'power2.out' }, at(0.74))
      .to(tBig('learn'), { autoAlpha: 1, duration: d(0.05) }, at(0.84))
      .to(S, { trail: 0, duration: d(0.1) }, at(0.88));
    sig(L.varNew, d(0.12), at(0.74), { r: 6 });
  });

  // 09 REVEAL: de camera trekt ver terug; alles was één systeem
  chapter('reveal', function (at, d) {
    tl.to(tBig('learn'), { autoAlpha: 0, duration: d(0.05) }, at(0.02))
      .to(tLearn, { autoAlpha: 0, duration: d(0.08) }, at(0.04))
      .to(S.cam, { reveal: 1, duration: d(0.45), ease: 'power2.inOut' }, at(0.02))
      .to(S, { loop: 1, duration: d(0.35), ease: 'power1.inOut' }, at(0.18))
      .to(labels, { autoAlpha: 1, duration: d(0.06), stagger: d(0.025) }, at(0.4));
    sig({ x: 0, y: 0 }, d(0.3), at(0.34), { r: 10, glow: 1 });
    tl.to(tFinal, { autoAlpha: 1, duration: d(0.12) }, at(0.6));
  });

  tl.set({}, {}, t); // totale lengte = som van de hoofdstukken
  return { starts: starts, lens: lens, total: t };
}
