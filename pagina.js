/* Harte Growth, gedeelde code voor /diensten en /cases (pagina.js).
 * Menu, WhatsApp-knop, voortgangsbalk en de scroll-animaties (GSAP 3.13 + ScrollTrigger, zoals de homepage).
 * De HTML staat altijd in eindstand: alle begintoestanden worden hier gezet, pas als GSAP geladen is.
 * Zonder JS of GSAP, en bij prefers-reduced-motion, blijft alles gewoon staan.
 * Geen snap, geen pinning; alleen transform, opacity en clip-path (plus de hoogte van een FAQ-antwoord bij openen).
 */
(function () {
  'use strict';

  var toArray = function (l) { return Array.prototype.slice.call(l); };
  var counters = [];

  setupMenu();
  setupFab();
  var measureProgress = setupProgress();
  setupMotion();
  setupFaq();

  /* ---------- Voortgangsbalk: vulling, afspeelkop en actieve sectie ---------- */
  function setupProgress() {
    var links = toArray(document.querySelectorAll('.tl-clips a'));
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var fill = document.querySelector('.tl-fill');
    var head = document.querySelector('.tl-head');
    var nowEl = document.getElementById('tl-now');
    if (!links.length || sections.indexOf(null) > -1) return function () {};

    var tops = [], max = 1, active = -1, ticking = false;

    // de breedte per sectie staat vast in de HTML (--g / --gm); hier alleen posities meten
    function measure() {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      tops = sections.map(function (s) { return s.getBoundingClientRect().top + window.scrollY; });
      render();
    }
    function render() {
      ticking = false;
      var p = Math.min(1, Math.max(0, window.scrollY / max));
      fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      head.style.transform = 'translateX(' + (p * 100).toFixed(3) + '%)';
      var y = window.scrollY + window.innerHeight * 0.35, cur = 0;
      tops.forEach(function (t, i) { if (t <= y) cur = i; });
      if (p > 0.995) cur = sections.length - 1;
      if (cur === active) return;
      active = cur;
      links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      if (nowEl) nowEl.textContent = links[cur].textContent.trim();
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(render); } }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    document.addEventListener('toggle', measure, true); // FAQ open/dicht verandert de paginahoogte
    measure();
    return measure;
  }

  /* =====================================================================
     Beweging. gsap.matchMedia: desktop volledig, mobiel (<768px) lichter,
     reduced motion: niets (alles staat al in eindstand, tellers tonen het eindgetal).
     ===================================================================== */
  function setupMotion() {
    if (!window.gsap || !window.ScrollTrigger) return; // CDN niet geladen: eindstand blijft
    gsap.registerPlugin(ScrollTrigger);
    // Laadmoment alleen als er nog niets geschilderd is; anders zou de hero eerst zichtbaar zijn,
    // dan verdwijnen en opnieuw inkomen.
    var painted = performance.getEntriesByName && performance.getEntriesByName('first-contentful-paint').length > 0;
    var intro = !painted;
    var mm = gsap.matchMedia();
    mm.add({
      mobile: '(max-width: 767px)',
      wide: '(min-width: 1024px)',               // werkwijze: lijn (desktop) of 2x2 zonder lijn (tablet)
      motion: '(prefers-reduced-motion: no-preference)'
    }, function (ctx) {
      if (!ctx.conditions.motion) return;
      var m = ctx.conditions.mobile, d = m ? 0.5 : 1; // mobiel: halve afstanden
      var cleanups = [];
      heroMotion(m, d, intro); intro = false;       // intro één keer per pageload
      entriesMotion(d);
      stepsMotion(m);
      casesMotion(m);
      plansMotion(d);
      cleanups.push(flowMotion(m));
      return function () {
        counters.forEach(function (c) { c.finish(); });
        cleanups.forEach(function (fn) { if (fn) fn(); });
      };
    });
  }

  /* ---------- Tellers: de echte waarde staat in de HTML (en in een sr-only span); de teller is alleen beeld ---------- */
  function getCounter(el) {
    if (el._hgCounter !== undefined) return el._hgCounter;
    var final = el.textContent.trim();
    var m = final.match(/^([^\d<]*)(\d[\d.]*)(?:,(\d+))?(.*)$/);   // '<1 min' en '€0' tellen niet
    var value = m ? parseFloat(m[2].replace(/\./g, '') + (m[3] ? '.' + m[3] : '')) : 0;
    if (!value) return (el._hgCounter = null);
    var dec = m[3] ? m[3].length : 0, group = m[2].indexOf('.') > -1;
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = final;
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); vis.textContent = final;
    el.textContent = ''; el.appendChild(sr); el.appendChild(vis);
    var fmt = function (n) {
      return m[1] + n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: group }) + m[4];
    };
    var obj = { v: 0 }, tw = null;
    var api = {
      play: function (duration, delay) {
        if (tw) tw.kill();
        // vaste breedte = die van het eindgetal (tabelcijfers): tijdens het tellen verschuift er niets (CLS 0)
        vis.style.cssText = 'display:inline-block;white-space:nowrap';
        vis.style.width = vis.getBoundingClientRect().width + 'px';
        obj.v = 0; vis.textContent = fmt(0);
        tw = gsap.to(obj, {
          v: value, duration: duration || 1.2, delay: delay || 0, ease: 'power2.out',
          onUpdate: function () { vis.textContent = fmt(obj.v); },
          onComplete: function () { vis.textContent = final; }
        });
      },
      finish: function () { if (tw) tw.kill(); vis.textContent = final; }
    };
    counters.push(api);
    return (el._hgCounter = api);
  }

  /* ---------- 1. Hero: laadmoment, kantelend browserframe, telefoon met parallax ---------- */
  function heroMotion(m, d, intro) {
    var hero = document.getElementById('top');
    if (!hero) return;
    var frame = hero.querySelector('.hero-shot > .bframe');
    var phone = toArray(hero.querySelectorAll('.hero-phone, .hero-mini')); // diensten: telefoon, cases: kleine frames
    var proofNum = hero.querySelector('.proof strong');
    if (!frame) return;
    if (intro) {
      // Begintoestand staat meteen; het afspelen wacht tot de webfonts binnen zijn (max. 0,7 s). Anders
      // rendert GSAP elk frame en wordt de tussenstand van de font-wissel (één font wel, één niet) als
      // layout shift gemeten.
      var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
        .from(hero.querySelector('.hero-h'), { y: 22 * d, opacity: 0, duration: 0.5 }, 0)
        .from(hero.querySelector('.hero-copy .lede'), { y: 16 * d, opacity: 0, duration: 0.45 }, 0.1)
        .from(hero.querySelectorAll('.hero-copy .ctas > *'), { y: 12 * d, opacity: 0, duration: 0.4, stagger: 0.06 }, 0.18)
        .from(frame, { y: 40 * d, duration: 0.6 }, 0.12)
        .from(phone.length ? phone : {}, { xPercent: -30, autoAlpha: 0, duration: 0.45, stagger: 0.08 }, 0.45);
      var started = false;
      var go = function () {
        if (started) return;
        started = true;
        tl.play();
        var c = proofNum && getCounter(proofNum); // pas nu splitsen: geen DOM-wijziging vóór de fonts binnen zijn
        if (c) c.play(1.2, 0.25);
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
      setTimeout(go, 700);
    }
    if (m) return; // mobiel: geen kanteling, geen parallax (telefoon is daar ook verborgen)
    // het frame ligt iets achterover en vlakt af terwijl de hero uit beeld scrolt
    gsap.fromTo(frame, { rotationX: 8, transformPerspective: 1400, transformOrigin: '50% 100%' }, {
      rotationX: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: 0, end: 'bottom top', scrub: true }
    });
    // telefoon 15% sneller dan het frame: diepte
    if (!phone.length) return;
    gsap.to(phone, {
      y: function () { return -0.15 * (hero.offsetTop + hero.offsetHeight); }, ease: 'none',
      scrollTrigger: { trigger: hero, start: 0, end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });
  }

  /* ---------- 2. Instappen: kaarten gestaggerd, dan de actieprijs ---------- */
  function entriesMotion(d) {
    var wrap = document.querySelector('.entries');
    if (!wrap) return;
    var was = wrap.querySelector('.was');
    var tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    tl.from(wrap.querySelectorAll('.entry'), { y: 28 * d, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
    if (was) {
      // eerst staat €50, de rode streep trekt erdoorheen, dan verschijnt €35
      tl.from(was.parentNode.querySelector('strong'), { autoAlpha: 0, scale: 0.9, transformOrigin: '0% 70%', duration: 0.35, ease: 'back.out(2)' }, 0.95)
        .fromTo(was.querySelector('.strike'), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, 0.55);
    }
  }

  /* ---------- 3. Werkwijze: lijn loopt mee met de scroll, stappen lichten op als de lijn ze bereikt ---------- */
  function stepsMotion(m) {
    toArray(document.querySelectorAll('.steps-wrap')).forEach(function (wrap) { stepLine(wrap, m); });
  }
  function stepLine(wrap, m) {
    var line = wrap.querySelector('.steps-line'), fill = wrap.querySelector('.steps-fill');
    var steps = toArray(wrap.querySelectorAll('.step'));
    var imgs = steps.map(function (s) { return s.querySelector('.step-img img'); }).filter(Boolean);
    // gedimd = titel en nummer op halve kracht (blijft leesbaar, contrast >= 3:1); tekst eronder blijft staan
    var dims = steps.map(function (s) { return s.querySelectorAll('h3, .step-dot'); });
    var lit = steps.map(function () { return false; });
    gsap.set(dims, { opacity: 0.5 });
    if (imgs.length) gsap.set(imgs, { clipPath: 'inset(100% 0% 0% 0%)' });
    // eenmaal opgelicht blijft een stap aan: terugscrollen maakt niets leeg
    function light(i, instant) {
      if (lit[i]) return;
      lit[i] = true;
      gsap.to(dims[i], { opacity: 1, duration: instant ? 0 : 0.4 });
      var img = steps[i].querySelector('.step-img img');
      if (img) gsap.to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: instant ? 0 : 0.8, ease: 'power3.out' });
    }
    if (getComputedStyle(line).display === 'none') {
      // tablet (2x2, geen lijn): elke stap op zijn eigen moment
      steps.forEach(function (s, i) {
        ScrollTrigger.create({
          trigger: s, start: 'top 80%',
          onEnter: function () { light(i); },
          onRefresh: function (self) { if (self.progress > 0) light(i, true); }
        });
      });
      return;
    }
    var vertical = m;
    var at = [];
    function measure() {
      var r = line.getBoundingClientRect();
      at = steps.map(function (s) {
        var dr = s.querySelector('.step-dot').getBoundingClientRect();
        return vertical ? (dr.top + dr.height / 2 - r.top) / r.height : (dr.left + dr.width / 2 - r.left) / r.width;
      });
    }
    function check(p, instant) {
      if (p <= 0) return;
      at.forEach(function (t, i) { if (p >= t - 0.02) light(i, instant); });
    }
    var from = vertical ? { scaleY: 0 } : { scaleX: 0 };
    var to = vertical ? { scaleY: 1 } : { scaleX: 1 };
    to.ease = 'none';
    to.scrollTrigger = {
      trigger: line, start: vertical ? 'top 70%' : 'top 80%', end: vertical ? 'bottom 70%' : 'top 35%', scrub: vertical ? true : 0.4,
      onRefresh: function (self) { measure(); check(self.progress, true); },
      onUpdate: function (self) { check(self.progress); }
    };
    gsap.fromTo(fill, from, to);
  }

  /* ---------- 4. Resultaten: screenshot bladert mee in het frame, cijfers tellen op ---------- */
  function casesMotion(m) {
    toArray(document.querySelectorAll('.case .case-shot img')).forEach(function (img) {
      var shot = img.parentNode;
      gsap.fromTo(img, { y: 0 }, {
        y: function () { return -(img.offsetHeight - shot.offsetHeight) * (m ? 0.5 : 1); }, ease: 'none',
        scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: m ? true : 0.5, invalidateOnRefresh: true }
      });
    });
    toArray(document.querySelectorAll('.case-stats')).forEach(function (dl) {
      var cs = toArray(dl.querySelectorAll('dd')).map(getCounter).filter(Boolean);
      if (!cs.length) return;
      ScrollTrigger.create({
        trigger: dl, start: 'top bottom', once: true,
        onEnter: function () { cs.forEach(function (c) { c.play(1.2); }); }
      });
    });
  }

  /* ---------- 5. Maandelijks: pakketten gestaggerd, één lichtrondje rond de aanrader ---------- */
  function plansMotion(d) {
    var wrap = document.querySelector('.plans');
    if (!wrap) return;
    var glow = wrap.querySelector('.plan-glow');
    var tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    tl.from(wrap.querySelectorAll('.plan'), { y: 28 * d, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
    if (glow) {
      tl.set(glow, { opacity: 1 }, 0.5)
        .fromTo(glow.querySelector('i'), { rotation: 0 }, { rotation: 360, duration: 1.6, ease: 'power1.inOut' }, 0.5)
        .to(glow, { opacity: 0, duration: 0.5 }, 1.7);
    }
  }

  /* ---------- 6. Automation: een rood puntje loopt door de 7 stappen, elke stap licht op als het puntje er is ---------- */
  function flowMotion(m) {
    var wrap = document.querySelector('.flow-wrap');
    if (!wrap) return null;
    var line = wrap.querySelector('.flow-line'), dot = wrap.querySelector('.flow-dot');
    var items = toArray(wrap.querySelectorAll('.flow li'));
    var fills = items.map(function (li) { return li.querySelector('.fn i'); });
    var labels = items.map(function (li) { return li.querySelector('.fl'); });
    var at = [], len = 0, on = items.map(function () { return null; });
    // lijn precies van het eerste tot het laatste nummer (positie zetten, niet animeren)
    function measure() {
      line.style.cssText = '';
      var w = wrap.getBoundingClientRect();
      var c = items.map(function (li) {
        var r = li.querySelector('.fn').getBoundingClientRect();
        return m ? r.top + r.height / 2 - w.top : r.left + r.width / 2 - w.left;
      });
      len = c[c.length - 1] - c[0];
      line.style.cssText = m ? 'top:' + c[0] + 'px;bottom:auto;height:' + len + 'px' : 'left:' + c[0] + 'px;right:auto;width:' + len + 'px';
      at = c.map(function (x) { return (x - c[0]) / len; });
    }
    function state(i, v) {
      if (on[i] === v) return;
      on[i] = v;
      gsap.to(fills[i], { opacity: v ? 1 : 0, scale: v ? 1 : 0.6, duration: 0.25, overwrite: true });
      gsap.to(labels[i], { opacity: v ? 1 : 0.5, duration: 0.25, overwrite: true });
    }
    function update(p) { at.forEach(function (t, i) { state(i, p > 0 && p >= t - 0.01); }); }
    measure();
    ScrollTrigger.addEventListener('refreshInit', measure);
    gsap.set(fills, { opacity: 0, scale: 0.6 });
    gsap.set(labels, { opacity: 0.5 });
    var prop = m ? 'y' : 'x';
    var from = { x: 0, y: 0, opacity: 1 }, to = { ease: 'none' };
    to[prop] = function () { return len; };
    to.scrollTrigger = {
      trigger: wrap, start: m ? 'top 75%' : 'top 80%', end: m ? 'bottom 45%' : 'bottom 40%', scrub: m ? true : 0.3,
      invalidateOnRefresh: true,
      onRefresh: function (self) { update(self.progress); },
      onUpdate: function (self) { update(self.progress); }
    };
    gsap.fromTo(dot, from, to);
    return function () {
      ScrollTrigger.removeEventListener('refreshInit', measure);
      line.style.cssText = '';
      gsap.set(fills.concat(labels), { clearProps: 'opacity,transform' });
    };
  }

  /* ---------- 7. Vragen: antwoord schuift soepel open en dicht, + draait naar × (CSS) ---------- */
  function setupFaq() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    toArray(document.querySelectorAll('.qa')).forEach(function (qa) {
      var body = qa.querySelector('.qa-body');
      qa.querySelector('summary').addEventListener('click', function (e) {
        if (!window.gsap || reduce.matches || !body) return; // gewoon het standaardgedrag
        e.preventDefault();
        if (qa.open && !qa.classList.contains('is-closing')) {
          qa.classList.add('is-closing');
          gsap.to(body, {
            height: 0, duration: 0.3, ease: 'power2.inOut', overwrite: true,
            onComplete: function () { qa.open = false; qa.classList.remove('is-closing'); gsap.set(body, { clearProps: 'height' }); measureProgress(); }
          });
        } else {
          qa.classList.remove('is-closing');
          if (!qa.open) { qa.open = true; gsap.set(body, { height: 0 }); }
          gsap.to(body, {
            height: 'auto', duration: 0.35, ease: 'power2.out', overwrite: true,
            onComplete: function () { gsap.set(body, { clearProps: 'height' }); measureProgress(); }
          });
        }
      });
    });
  }

  /* ---------- WhatsApp-knop: weg bij input-focus op touch ---------- */
  function setupFab() {
    var fab = document.querySelector('.wa-fab');
    if (!fab) return;
    var coarse = window.matchMedia('(pointer: coarse)');
    document.addEventListener('focusin', function (e) {
      if (coarse.matches && e.target.matches('input, textarea, select')) fab.classList.add('is-tucked');
    });
    document.addEventListener('focusout', function () { fab.classList.remove('is-tucked'); });
  }

  /* ---------- Menu (onder 900px achter een knop) ---------- */
  function setupMenu() {
    var btn = document.querySelector('.menu-btn');
    var nav = document.getElementById('hdr-menu');
    if (!btn || !nav) return;
    var wide = window.matchMedia('(min-width: 900px)');
    function set(open, focusBtn) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (!open && focusBtn) btn.focus();
    }
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      set(open);
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) set(false, true); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    if (wide.addEventListener) wide.addEventListener('change', function () { if (wide.matches) set(false); });
  }
})();
