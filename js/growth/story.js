/* De film: één master-tijdlijn, opgebouwd uit negen hoofdstukken.
 * Tijdseenheid = schermhoogte: een hoofdstuk van --len 2.2 duurt 2.2 eenheden. Zo valt elk hoofdstuk
 * precies samen met zijn <section> in de pagina (ScrollTrigger: top top -> bottom top).
 * Elk hoofdstuk krijgt `at(u)` (0..1 binnen het hoofdstuk) en `d(u)` (duur als deel van het hoofdstuk).
 * Objecten verdwijnen niet tussen hoofdstukken: ze verhuizen, krimpen of worden iets anders.
 */
import { CHAPTERS } from './layout.js';

// rustpunt per hoofdstuk (deel van het hoofdstuk): hier staat het beeld 'af', vóór de camera verder gaat.
// Gebruikt voor ankerlinks en voor de reduced-motion diavoorstelling.
export var HOLD = { origin: 0.4, create: 0.68, distribute: 0.74, attract: 0.78, capture: 0.78, operate: 0.86, convert: 0.93, learn: 0.97, reveal: 1 };

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
  var vars = qa('.var[data-v]'), varC = q('.var[data-v="C"]'), bestC = q('.var[data-v="C"] .v-best');
  var others = vars.filter(function (v) { return v !== varC; }), weak = qa('.var[data-weak]');
  var testNote = q('[data-ent="testNote"]');
  var chn = qa('.chn'), chnWin = qa('.chn[data-win]'), reels = q('.chn[data-c="0"]');
  var budgetNote = q('[data-ent="budgetNote"]');
  var reach = q('.reach'), reachN = q('.reach-n');
  var ptag = q('.ptag'), pts = [q('.pt-1'), q('.pt-2'), q('.pt-3')];
  var audNote = q('[data-ent="audNote"]');
  var lp = q('.lp'), lpHero = q('.lp-hero'), lpCta = q('.lp-cta'), lpForm = q('.lp-form'), lpFields = qa('.lp-f b'), lpSend = q('.lp-send'), lpUtm = q('.lp-utm');
  var lead = q('.lead');
  var os = q('.os'), osAv = q('.os-head .av'), osHead = q('.os-head'), status = q('.os-status');
  var steps = qa('.os-steps li');
  var osF = qa('.os-f'), fields = q('.os-fields'), chat = q('.os-chat'), msgs = qa('.os-chat .cm');
  var qualBox = q('.os-qual'), qual = qa('.os-qual li'), next = q('.os-next'), stNew = q('.st-new'), stOk = q('.st-ok');
  var board = q('.board'), deal = q('.deal'), dealS = qa('.deal-s span'), dealV = q('.deal-v');
  var varNew = q('.var-new');
  var tOrigin = q('.t-origin'), tRev = q('.t-big[data-t="convert"]');
  var tLearn = q('.t-learn'), tLearnLi = qa('.t-learn li'), labels = qa('.t-labels [data-st]'), tFinal = q('.t-final');

  // ---------- beginstand (alles in wereld-coördinaten) ----------
  S.sig.x = 0; S.sig.y = 0;
  place(src, L.src, { autoAlpha: 0, scale: 0.06 });
  vars.forEach(function (v) { place(v, L.src, { autoAlpha: 0, scale: 0.25 }); });
  gsap.set(vars, { '--win': 0, '--hot': 0 }); gsap.set(bestC, { autoAlpha: 0 });
  place(testNote, L.testNote, { autoAlpha: 0 });
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
  gsap.set(steps, { '--on': 0, '--cur': 0 });
  gsap.set([osHead, fields, chat, qualBox, next], { autoAlpha: 0 });
  gsap.set(osF, { autoAlpha: 0, x: -10, '--hot': 0 }); gsap.set(msgs, { autoAlpha: 0, y: 10 });
  gsap.set(qual, { autoAlpha: 0 }); gsap.set(stOk, { autoAlpha: 0 }); gsap.set(next, { y: 12 });
  var avW = worldOf(osAv, os, L.os), nextW = worldOf(next, os, L.os), chatW = worldOf(chat, os, L.os), statusW = worldOf(status, os, L.os);
  var fW = function (k) { return worldOf(q('.os-f[data-f="' + k + '"]'), os, L.os); };
  place(board, L.board, { autoAlpha: 0, scale: 0.97 });
  place(deal, nextW, { autoAlpha: 0, '--won': 0 });
  gsap.set(dealS.slice(1), { autoAlpha: 0 }); gsap.set(dealV, { autoAlpha: 0 });
  place(varNew, L.src, { autoAlpha: 0, scale: 0.3, '--win': 1 });
  gsap.set([tRev, tLearn, tFinal], { autoAlpha: 0 });
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

  // 02 CREATE: één bron wordt zes varianten; daarna valt het oog op de ene die het best werkt
  chapter('create', function (at, d) {
    tl.to(S, { gen: 1, duration: d(0.2) }, at(0.08));
    vars.forEach(function (v, i) {
      tl.to(v, { x: L.varCreate[i].x, y: L.varCreate[i].y, scale: 1, autoAlpha: 1, duration: d(0.16), ease: 'power2.out' }, at(0.1 + i * 0.045));
    });
    tl.to(testNote, { autoAlpha: 1, duration: d(0.06) }, at(0.42))
      .to(others, { autoAlpha: 0.4, duration: d(0.08) }, at(0.54))
      .to(varC, { '--win': 1, scale: 1.08, duration: d(0.06) }, at(0.54))
      .to(bestC, { autoAlpha: 1, duration: d(0.05) }, at(0.57));
    sig({ x: L.varCreate[2].x, y: L.varCreate[2].y }, d(0.12), at(0.5), { r: 6 });
    // naar Distribute: de varianten verhuizen mee en worden knooppunten
    tl.to(S, { gen: 0, duration: d(0.1) }, at(0.72))
      .to([testNote, bestC], { autoAlpha: 0, duration: d(0.06) }, at(0.72))
      .to(others, { autoAlpha: 1, duration: d(0.1) }, at(0.74))
      .to(S.cam, { path: 2, duration: d(0.3), ease: 'power2.inOut' }, at(0.72))
      .to(S, { rail: 2, duration: d(0.3) }, at(0.72))
      .to(src, { autoAlpha: 0.5, duration: d(0.2) }, at(0.75));
    vars.forEach(function (v, i) {
      tl.to(v, { x: L.varDist[i].x, y: L.varDist[i].y, scale: 0.5, duration: d(0.28), ease: 'power2.inOut' }, at(0.72));
    });
    sig(L.varDist[2], d(0.28), at(0.72));
  });

  // 03 DISTRIBUTE: het netwerk leeft; zwakke paden dimmen, winnaars krijgen budget
  chapter('distribute', function (at, d) {
    chn.forEach(function (c, i) {
      tl.to(c, { autoAlpha: 1, x: L.chn[i].x, y: L.chn[i].y, duration: d(0.1), ease: 'power2.out' }, at(0.02 + i * 0.025));
    });
    tl.to(S, { net: 1, duration: d(0.18) }, at(0.06))
      .to(S, { flow: 1, duration: d(0.14) }, at(0.12))
      .to(S, { prune: 1, duration: d(0.2) }, at(0.4))
      .to(weak, { autoAlpha: 0.3, duration: d(0.12) }, at(0.44))
      .to(S, { boost: 1, duration: d(0.22) }, at(0.54))
      .to(chnWin, { '--hot': 1, duration: d(0.1) }, at(0.58))
      .to(budgetNote, { autoAlpha: 1, duration: d(0.08) }, at(0.6))
      .to(budgetNote, { autoAlpha: 0, duration: d(0.08) }, at(0.84));
    sig(reelsDot, d(0.16), at(0.62), { r: 6 });
    tl.to(S.cam, { path: 3, duration: d(0.3), ease: 'power2.inOut' }, at(0.76))
      .to(S, { rail: 3, duration: d(0.3) }, at(0.76))
      .to(S, { crowd: 0.35, duration: d(0.26) }, at(0.74));
    sig(L.crowd.c, d(0.3), at(0.76), { r: 5, glow: 0.4 });
  });

  // 04 ATTRACT: eerst het bereik, daarna alleen nog die ene persoon
  chapter('attract', function (at, d) {
    tl.to(S, { crowd: 1, duration: d(0.42) }, at(0))
      .to(reach, { autoAlpha: 1, duration: d(0.08) }, at(0.04));
    var rc = counter(reachN, 128400, nl);
    tl.to(rc.target, Object.assign({ duration: d(0.34), ease: 'power1.out' }, rc.vars), at(0.05))
      .to(S, { flow: 0.3, duration: d(0.2) }, at(0.3))
      .to(reach, { autoAlpha: 0, duration: d(0.06) }, at(0.42))
      .to(S, { focus: 1, duration: d(0.18) }, at(0.44));
    sig(L.prospect, d(0.18), at(0.44), { r: 8, glow: 1 });
    tl.to(ptag, { autoAlpha: 1, duration: d(0.04) }, at(0.54))
      .to(pts[0], { autoAlpha: 1, duration: d(0.04) }, at(0.54))
      .to(pts[0], { autoAlpha: 0, duration: d(0.03) }, at(0.63))
      .to(pts[1], { autoAlpha: 1, duration: d(0.03) }, at(0.64))
      .to(pts[1], { autoAlpha: 0, duration: d(0.03) }, at(0.71))
      .to(pts[2], { autoAlpha: 1, duration: d(0.03) }, at(0.72));
    tl.to(S.cam, { path: 4, duration: d(0.3), ease: 'power2.inOut' }, at(0.8))
      .to(S, { rail: 4, duration: d(0.3) }, at(0.8))
      .to(S, { crowdOut: 0.75, duration: d(0.18) }, at(0.82))
      .to(ptag, { autoAlpha: 0, duration: d(0.06) }, at(0.84));
    sig(ctaW, d(0.3), at(0.8), { r: 7 });
  });

  // 05 CAPTURE: de landingspagina bouwt zich rond de tik; het formulier wordt een aanvraag met een naam
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
    sig(worldOf(lpSend, lp, L.lp), d(0.05), at(0.6));
    tl.to(lpSend, { scale: 0.92, duration: d(0.03), yoyo: true, repeat: 1 }, at(0.64))
      .to(lead, { autoAlpha: 1, x: L.lead.x, y: L.lead.y, scale: 1, duration: d(0.14), ease: 'power2.out' }, at(0.68))
      .to(lp, { autoAlpha: 0.35, duration: d(0.12) }, at(0.72));
    sig({ x: L.lead.x, y: L.lead.y }, d(0.14), at(0.68), { r: 6 });
    tl.to(S.cam, { path: 5, duration: d(0.28), ease: 'power2.inOut' }, at(0.82))
      .to(S, { rail: 5, duration: d(0.28) }, at(0.82))
      .to(lead, { x: avW.x + (lead.offsetWidth / 2 - 30), y: avW.y, duration: d(0.24), ease: 'power2.inOut' }, at(0.84));
    sig(avW, d(0.24), at(0.84));
  });

  // 06 OPERATE: HarteGrowth OS, stap voor stap. Per stap staat alleen dat deel op volle sterkte.
  //   1 Nieuwe aanvraag -> 2 Bron -> 3 AI-gesprek -> 4 Gekwalificeerd -> 5 Afspraak gepland
  chapter('operate', function (at, d) {
    var step = function (i, u) {
      if (i > 0) tl.to(steps[i - 1], { '--cur': 0, duration: d(0.02) }, at(u));
      tl.to(steps[i], { '--on': 1, '--cur': 1, duration: d(0.03) }, at(u));
    };
    var DIM = 0.3;
    tl.to(os, { autoAlpha: 1, scale: 1, duration: d(0.06), ease: 'power2.out' }, at(0))
      .to(lead, { autoAlpha: 0, duration: d(0.04) }, at(0.06));
    // 1 nieuwe aanvraag
    step(0, 0.08);
    tl.to(osHead, { autoAlpha: 1, duration: d(0.04) }, at(0.06));
    // 2 bron
    step(1, 0.2);
    tl.to(osHead, { autoAlpha: DIM, duration: d(0.04) }, at(0.2))
      .to(fields, { autoAlpha: 1, duration: d(0.02) }, at(0.2))
      .to(osF, { autoAlpha: 1, x: 0, duration: d(0.04), stagger: d(0.03) }, at(0.21));
    sig(fW('cre'), d(0.05), at(0.18), { r: 6 });
    // 3 AI-gesprek
    step(2, 0.34);
    tl.to(fields, { autoAlpha: DIM, duration: d(0.04) }, at(0.34))
      .to(chat, { autoAlpha: 1, duration: d(0.03) }, at(0.34));
    [0.37, 0.43, 0.49, 0.55, 0.61].forEach(function (u, i) { tl.to(msgs[i], { autoAlpha: 1, y: 0, duration: d(0.03), ease: 'power2.out' }, at(u)); });
    sig(chatW, d(0.05), at(0.32), { r: 5 });
    // 4 gekwalificeerd
    step(3, 0.68);
    tl.to(chat, { autoAlpha: DIM, duration: d(0.04) }, at(0.68))
      .to(osHead, { autoAlpha: 1, duration: d(0.04) }, at(0.68))
      .to(stNew, { autoAlpha: 0, duration: d(0.02) }, at(0.7))
      .to(stOk, { autoAlpha: 1, duration: d(0.02) }, at(0.7))
      .to(qualBox, { autoAlpha: 1, duration: d(0.02) }, at(0.71))
      .to(qual, { autoAlpha: 1, duration: d(0.02), stagger: d(0.02) }, at(0.71));
    sig(statusW, d(0.05), at(0.66), { r: 6 });
    // 5 afspraak gepland
    step(4, 0.79);
    tl.to([osHead, qualBox], { autoAlpha: DIM, duration: d(0.04) }, at(0.79))
      .to(next, { autoAlpha: 1, y: 0, duration: d(0.04) }, at(0.79));
    sig(nextW, d(0.04), at(0.77), { r: 6 });
    // naar Convert: de afspraak wordt een kaart op de pipeline
    tl.to(S.cam, { path: 6, duration: d(0.2), ease: 'power2.inOut' }, at(0.88))
      .to(S, { rail: 6, duration: d(0.2) }, at(0.88))
      .to(deal, { autoAlpha: 1, x: L.dealSlots[0].x, y: L.dealSlots[0].y, duration: d(0.2), ease: 'power2.inOut' }, at(0.88));
    sig({ x: L.dealSlots[0].x - (L.mobile ? 100 : 80), y: L.dealSlots[0].y - 20 }, d(0.2), at(0.88));
  });

  // 07 CONVERT: de kaart schuift van kolom naar kolom; bij "Klant" de omzet
  chapter('convert', function (at, d) {
    tl.to(board, { autoAlpha: 1, scale: 1, duration: d(0.1), ease: 'power2.out' }, at(0));
    [0.18, 0.34, 0.5, 0.64].forEach(function (u, i) {
      var p = L.dealSlots[i + 1];
      tl.to(deal, { x: p.x, y: p.y, duration: d(0.1), ease: 'power2.inOut' }, at(u))
        .to(dealS[i], { autoAlpha: 0, duration: d(0.04) }, at(u + 0.03))
        .to(dealS[i + 1], { autoAlpha: 1, duration: d(0.04) }, at(u + 0.05));
      sig({ x: p.x - (L.mobile ? 100 : 80), y: p.y - 20 }, d(0.1), at(u));
    });
    tl.to(dealV, { autoAlpha: 1, duration: d(0.04) }, at(0.55));
    var won = L.dealSlots[4];
    tl.set(S.burstAt, { x: won.x, y: won.y }, at(0.76))
      .to(deal, { '--won': 1, scale: 1.08, duration: d(0.06) }, at(0.78))
      .to(S, { burst: 1, duration: d(0.2), ease: 'power1.out' }, at(0.78))
      .to(tRev, { autoAlpha: 1, duration: d(0.06) }, at(0.8));
    sig(won, d(0.06), at(0.9), { r: 9, glow: 1 });
  });

  // 08 LEARN: de verkoop reist terug door het systeem; per station licht op wat werkte
  chapter('learn', function (at, d) {
    tl.to(tRev, { autoAlpha: 0, duration: d(0.05) }, at(0.02))
      .to(S, { trail: 1, duration: d(0.04) }, at(0))
      .to(tLearn, { autoAlpha: 1, duration: d(0.05) }, at(0.03))
      .to(S.cam, { reveal: 0.3, hop: 0.4, duration: d(0.1) }, at(0.02))
      .to(S.cam, { path: 1, duration: d(0.64), ease: 'power1.inOut' }, at(0.04));
    var arrive = function (k) { return 0.04 + (6 - k) / 5 * 0.64; };
    var hop = function (p, k) { var a = arrive(k + 1), b = arrive(k); sig(p, d(b - a), at(a), { r: 7, ease: 'power1.inOut' }); };
    hop(fW('lang'), 5);
    tl.to(q('.os-f[data-f="lang"]'), { '--hot': 1, duration: d(0.03) }, at(arrive(5) - 0.02))
      .to(tLearnLi[3], { autoAlpha: 1, duration: d(0.03) }, at(arrive(5)));
    hop(utmW, 4);
    tl.to(lpUtm, { autoAlpha: 1, '--hot': 1, duration: d(0.03) }, at(arrive(4) - 0.02))
      .to(tLearnLi[0], { autoAlpha: 1, duration: d(0.03) }, at(arrive(4)));
    hop(L.prospect, 3);
    tl.to(audNote, { autoAlpha: 1, '--hot': 1, duration: d(0.03) }, at(arrive(3) - 0.02))
      .to(tLearnLi[1], { autoAlpha: 1, duration: d(0.03) }, at(arrive(3)));
    hop(reelsDot, 2);
    tl.to([reels, varC], { '--hot': 1, duration: d(0.03) }, at(arrive(2) - 0.01))
      .to(tLearnLi[2], { autoAlpha: 1, duration: d(0.03) }, at(arrive(2)));
    hop(L.src, 1);
    tl.to(src, { autoAlpha: 1, '--hot': 1, duration: d(0.04) }, at(arrive(1) - 0.02))
      .to(tLearnLi[4], { autoAlpha: 1, duration: d(0.03) }, at(arrive(1)))
      .to(S.cam, { reveal: 0.06, hop: 1, duration: d(0.12) }, at(0.7))
      .to(S, { rail: 7, duration: d(0.16) }, at(0.66))
      .to(tLearn, { autoAlpha: 0, duration: d(0.05) }, at(0.77))
      .to(varNew, { autoAlpha: 1, x: L.varNew.x, y: L.varNew.y, scale: 1, duration: d(0.12), ease: 'power2.out' }, at(0.8))
      .to(S, { trail: 0, duration: d(0.1) }, at(0.88));
    sig(L.varNew, d(0.12), at(0.8), { r: 6 });
  });

  // 09 REVEAL: de camera trekt ver terug; de onderdelen krijgen één voor één hun naam
  chapter('reveal', function (at, d) {
    tl.to(S.cam, { reveal: 1, duration: d(0.4), ease: 'power2.inOut' }, at(0.02))
      .to(S, { loop: 1, duration: d(0.4), ease: 'power1.inOut' }, at(0.2));
    labels.forEach(function (el, i) { tl.to(el, { autoAlpha: 1, duration: d(0.04) }, at(0.26 + i * 0.06)); });
    sig({ x: 0, y: 0 }, d(0.2), at(0.6), { r: 10, glow: 1 });
    tl.to(tFinal, { autoAlpha: 1, duration: d(0.1) }, at(0.7));
  });

  tl.set({}, {}, t); // totale lengte = som van de hoofdstukken
  return { starts: starts, lens: lens, total: t };
}
