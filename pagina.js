/* Harte Growth, gedeelde code voor de pagina's in de nieuwe stijl (pagina.js): diensten, cases, blog,
 * groeiscan, contact en over ons, in NL, EN en ES.
 * Menu, WhatsApp-knop, voortgangsbalk en de scroll-animaties (GSAP 3.13 + ScrollTrigger, zoals de homepage).
 * De HTML staat altijd in eindstand: alle begintoestanden worden hier gezet, pas als GSAP geladen is.
 * Zonder JS of GSAP, en bij prefers-reduced-motion, blijft alles gewoon staan.
 * Geen snap, geen pinning; alleen transform, opacity en clip-path (plus de hoogte van een FAQ-antwoord bij openen).
 */
(function () {
  'use strict';

  var toArray = function (l) { return Array.prototype.slice.call(l); };
  var counters = [];
  var LANG = (document.documentElement.lang || 'nl').slice(0, 2).toLowerCase();
  if (['nl', 'en', 'es'].indexOf(LANG) < 0) LANG = 'nl';
  // teksten die dit script zelf schrijft, per taal van de pagina
  var TXT = {
    nl: {
      months: ['jan.', 'feb.', 'mrt.', 'apr.', 'mei', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
      play: 'Speel video af: ', yt: 'Bekijk op YouTube', ytVideo: 'YouTube-video',
      posts: function (n) { return n + (n === 1 ? ' artikel' : ' artikelen'); },
      sending: 'Versturen...', required: 'Vul de verplichte velden in.', email: 'Vul een geldig e-mailadres in.',
      fail: 'Versturen is niet gelukt. Je gegevens staan er nog. Probeer het opnieuw, of stuur ons direct een bericht via ',
      waFail: 'Hoi Harte Growth, het formulier lukte niet, dus ik stuur het zo. Mijn naam is ',
      scanBtn: 'Aanvraag verstuurd ✓', scanOk: function (e) { return 'Bedankt! We nemen je site binnen 1 werkdag door en mailen het rapport naar ' + e + '.'; },
      contactBtn: 'Bericht verzonden ✓', contactOk: function (e) { return 'Bedankt! We reageren binnen 1 werkdag op ' + e + '.'; }
    },
    en: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      play: 'Play video: ', yt: 'Watch on YouTube', ytVideo: 'YouTube video',
      posts: function (n) { return n + (n === 1 ? ' article' : ' articles'); },
      sending: 'Sending...', required: 'Please fill in the required fields.', email: 'Please enter a valid email address.',
      fail: "Sending didn't work. Your details are still here. Try again, or message us directly on ",
      waFail: "Hi Harte Growth, the form didn't work, so I'm sending it this way. My name is ",
      scanBtn: 'Request sent ✓', scanOk: function (e) { return "Thanks! We'll review your site within 1 working day and email the report to " + e + '.'; },
      contactBtn: 'Message sent ✓', contactOk: function (e) { return "Thanks! We'll reply to " + e + ' within 1 working day.'; }
    },
    es: {
      months: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'],
      play: 'Reproducir vídeo: ', yt: 'Ver en YouTube', ytVideo: 'Vídeo de YouTube',
      posts: function (n) { return n + (n === 1 ? ' artículo' : ' artículos'); },
      sending: 'Enviando...', required: 'Rellena los campos obligatorios.', email: 'Introduce un correo electrónico válido.',
      fail: 'No se ha podido enviar. Tus datos siguen aquí. Inténtalo de nuevo o escríbenos directamente por ',
      waFail: 'Hola Harte Growth, el formulario no funcionó, así que os lo envío por aquí. Me llamo ',
      scanBtn: 'Solicitud enviada ✓', scanOk: function (e) { return '¡Gracias! Revisamos tu web en 1 día laborable y te enviamos el informe a ' + e + '.'; },
      contactBtn: 'Mensaje enviado ✓', contactOk: function (e) { return '¡Gracias! Te respondemos en 1 día laborable en ' + e + '.'; }
    }
  }[LANG];

  setupMenu();
  setupFab();
  var measureProgress = setupProgress();
  setupMotion();
  setupFaq();
  setupVideos();
  setupChips();
  setupFacade();
  setupForms();

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
    // notatie volgt de taal van de pagina: NL/ES 12,4K en 4.000; EN 12.4K en 4,000
    var en = (document.documentElement.lang || 'nl').slice(0, 2) === 'en';
    var DEC = en ? '.' : ',', GRP = en ? ',' : '.';
    var re = en ? /^([^\d<]*)(\d[\d,]*)(?:\.(\d+))?(.*)$/ : /^([^\d<]*)(\d[\d.]*)(?:,(\d+))?(.*)$/;
    var m = final.match(re);   // '<1 min' en '€0' tellen niet
    var value = m ? parseFloat(m[2].split(GRP).join('') + (m[3] ? '.' + m[3] : '')) : 0;
    if (!value) return (el._hgCounter = null);
    var dec = m[3] ? m[3].length : 0, group = m[2].indexOf(GRP) > -1;
    var loc = en ? 'en-GB' : (document.documentElement.lang === 'es' ? 'de-DE' : 'nl-NL'); // de-DE: zelfde tekens als ES, groepeert ook 4 cijfers
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = final;
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); vis.textContent = final;
    el.textContent = ''; el.appendChild(sr); el.appendChild(vis);
    var fmt = function (n) {
      return m[1] + n.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: group }) + m[4];
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
    if (intro) {
      // Begintoestand staat meteen; het afspelen wacht tot de webfonts binnen zijn (max. 0,7 s). Anders
      // rendert GSAP elk frame en wordt de tussenstand van de font-wissel (één font wel, één niet) als
      // layout shift gemeten.
      var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      var add = function (targets, vars, at) { // alleen wat op deze pagina bestaat
        var list = toArray(targets && targets.length !== undefined ? targets : [targets]).filter(Boolean);
        if (list.length) tl.from(list, vars, at);
      };
      add(hero.querySelector('.hero-h'), { y: 22 * d, opacity: 0, duration: 0.5 }, 0);
      add(hero.querySelector('.hero-copy .lede'), { y: 16 * d, opacity: 0, duration: 0.45 }, 0.1);
      add(hero.querySelectorAll('.hero-copy .ctas > *'), { y: 12 * d, opacity: 0, duration: 0.4, stagger: 0.06 }, 0.18);
      add(hero.querySelectorAll('.hero-ticks li'), { y: 10 * d, opacity: 0, duration: 0.35, stagger: 0.06 }, 0.22);
      add(frame, { y: 40 * d, duration: 0.6 }, 0.12);
      add(hero.querySelector('.form-card'), { y: 30 * d, opacity: 0, duration: 0.6 }, 0.14);
      add(phone, { xPercent: -30, autoAlpha: 0, duration: 0.45, stagger: 0.08 }, 0.45);
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
    if (m || !frame) return; // mobiel: geen kanteling, geen parallax (telefoon is daar ook verborgen)
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

  /* =====================================================================
     Blog: filters (artikelen en video's), videostrook en click-to-load video.
     Zonder JS: alle artikelen zichtbaar, de filters verborgen, video's zijn gewone links naar YouTube.
     ===================================================================== */
  function nlDate(iso) { // datum in de taal van de pagina: 24 sep. 2026 / 24 Sep 2026 / 24 sept. 2026
    var p = String(iso).slice(0, 10).split('-');
    return (+p[2]) + ' ' + TXT.months[+p[1] - 1] + ' ' + p[0];
  }
  function escHtml(t) {
    return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // filterknoppen: data-target wijst naar de lijst; kaarten dragen data-cats of data-platform
  function setupChips() {
    toArray(document.querySelectorAll('.chips[data-target]')).forEach(function (bar) {
      var list = document.getElementById(bar.dataset.target);
      if (!list) return;
      bar.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        toArray(bar.querySelectorAll('.chip')).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var f = btn.dataset.filter;
        list.dispatchEvent(new CustomEvent('hg:filter', { detail: f }));
        if (list.id === 'vgrid') return; // de videostrook tekent zichzelf opnieuw (zie setupVideos)
        var shown = 0;
        toArray(list.children).forEach(function (card) {
          var on = f === 'all' || (' ' + (card.dataset.cats || '') + ' ').indexOf(' ' + f + ' ') > -1;
          card.hidden = !on;
          if (on) shown++;
        });
        var count = document.getElementById('post-count');
        if (count) count.textContent = TXT.posts(shown);
        measureProgress();
      });
    });
  }

  // videostrook: nieuwste 6 (per platform te filteren). Start met de data in de pagina, daarna verse data van
  // /api/videos. Lukt dat niet, dan blijft de laatst bekende data staan: nooit leeg, nooit een foutmelding.
  function setupVideos() {
    var sec = document.getElementById('algoritmes');
    var grid = document.getElementById('vgrid');
    if (!sec || !grid) return;
    var data = null, filter = 'all';
    try { data = JSON.parse(document.getElementById('videos-data').textContent); } catch (e) { data = null; }
    function card(v) {
      var watch = 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.videoId);
      var t = escHtml(v.title);
      var thumb = /^https:\/\/i\d?\.ytimg\.com\//.test(v.thumbnail) ? v.thumbnail : 'https://i.ytimg.com/vi/' + encodeURIComponent(v.videoId) + '/hqdefault.jpg';
      return '<article class="vcard" data-platform="' + escHtml(v.platform) + '">' +
        '<a class="vthumb" href="' + watch + '" target="_blank" rel="noopener" data-video="' + escHtml(v.videoId) + '" data-title="' + t + '" aria-label="' + escHtml(TXT.play) + t + '">' +
        '<img src="' + escHtml(thumb) + '" width="480" height="360" loading="lazy" decoding="async" alt=""><span class="vplay" aria-hidden="true"></span></a>' +
        '<p class="vmeta"><span>' + escHtml(v.channel) + '</span> · <time datetime="' + escHtml(String(v.published).slice(0, 10)) + '">' + nlDate(v.published) + '</time></p>' +
        '<h3 class="vtitle">' + t + '</h3>' +
        '<a class="vyt" href="' + watch + '" target="_blank" rel="noopener">' + TXT.yt + '</a></article>';
    }
    // platformknop verbergen als er minder dan 3 video's van dat platform zijn
    function syncChips() {
      toArray(document.querySelectorAll('.chips[data-target="vgrid"] .chip')).forEach(function (b) {
        var f = b.dataset.filter;
        if (f === 'all') return;
        var n = data.items.filter(function (v) { return v.platform === f; }).length;
        b.hidden = n < 3;
        if (b.hidden && filter === f) { filter = 'all'; }
      });
    }
    function render() {
      if (!data || !data.items || !data.items.length) return; // de statische kaarten blijven staan
      syncChips();
      var list = data.items.filter(function (v) { return /^[\w-]{11}$/.test(v.videoId) && (filter === 'all' || v.platform === filter); })
        .sort(function (a, b) { return a.published < b.published ? 1 : -1; }).slice(0, 6);
      if (!list.length) return;
      grid.innerHTML = list.map(card).join('');
    }
    grid.addEventListener('hg:filter', function (e) { filter = e.detail; render(); });
    if (window.fetch && sec.dataset.src) {
      fetch(sec.dataset.src, { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.items && d.items.length) { data = d; render(); } })
        .catch(function () { /* laatst bekende data blijft */ });
    }
  }

  // click-to-load: pas na de klik een iframe van youtube-nocookie.com, daarvoor alleen een thumbnail
  function setupFacade() {
    // kapotte thumbnail: rustig donker vlak in plaats van een gebroken-afbeelding-icoon
    document.addEventListener('error', function (e) {
      var img = e.target;
      if (img && img.tagName === 'IMG' && img.closest && img.closest('.vthumb')) img.style.visibility = 'hidden';
    }, true);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.vthumb[data-video]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return; // nieuwe tab: gewoon naar YouTube
      var id = a.dataset.video;
      if (!/^[\w-]{11}$/.test(id)) return;
      e.preventDefault();
      var box = document.createElement('div');
      box.className = 'vplayer';
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = a.dataset.title || TXT.ytVideo;
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      box.appendChild(f);
      a.replaceWith(box);
      f.focus();
    });
  }

  /* =====================================================================
     Formulieren: groeiscan (send-lead) en contact (send-contact). De taal van de pagina gaat mee in de payload.
     Zonder JS posten ze gewoon naar de function.
     ===================================================================== */
  function setupForms() {
    toArray(document.querySelectorAll('.scan-example')).forEach(function (b) {
      b.addEventListener('click', function () {
        var input = document.getElementById('groeiscanUrl');
        if (input) { input.value = b.dataset.url || ''; input.focus(); }
      });
    });
    wireForm('groeiscanForm', '/.netlify/functions/send-lead', ['url', 'name', 'email', 'company'], {
      extra: { consent: true }, okBtn: TXT.scanBtn, ok: TXT.scanOk, event: 'groeiscan_request_submit', formName: 'groeiscan'
    });
    wireForm('contactForm', '/.netlify/functions/send-contact', ['name', 'email', 'company', 'url', 'message'], {
      extra: {}, okBtn: TXT.contactBtn, ok: TXT.contactOk, event: 'contact_form_submit', formName: 'contact'
    });
  }
  function wireForm(id, endpoint, fields, o) {
    var form = document.getElementById(id);
    if (!form || !window.fetch) return;
    var btn = form.querySelector('button[type="submit"]');
    var status = form.querySelector('.form-status');
    var label = btn.textContent;
    function say(html, cls) { status.className = 'form-status' + (cls ? ' ' + cls : ''); status.innerHTML = html; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // eigen controle (novalidate): melding in de taal van de pagina, focus op het eerste lege veld
      var bad = toArray(form.querySelectorAll('[required]')).filter(function (el) { return !el.value.trim(); })[0];
      if (bad) { say(escHtml(TXT.required), 'is-err'); bad.focus(); return; }
      var mail = form.querySelector('[type="email"]');
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) { say(escHtml(TXT.email), 'is-err'); mail.focus(); return; }
      var data = { lang: LANG, page: location.pathname, referrer: document.referrer || '' };
      fields.forEach(function (f) { data[f] = form.elements[f] ? form.elements[f].value.trim() : ''; });
      Object.keys(o.extra).forEach(function (k) { data[k] = o.extra[k]; });
      var hp = form.elements['bot-field'];
      if (hp) data['bot-field'] = hp.value;
      btn.disabled = true;
      btn.textContent = TXT.sending;
      say('');
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) { if (!res.ok) throw new Error('status ' + res.status); })
        .then(function () {
          form.reset();
          btn.textContent = o.okBtn;
          say(escHtml(o.ok(data.email)), 'is-ok');
          if (window.hgTrack) window.hgTrack(o.event, { page_path: location.pathname, form_name: o.formName, language: LANG });
        })
        .catch(function () {
          var wa = 'https://wa.me/31634455762?text=' + encodeURIComponent(TXT.waFail + (data.name || '...') + '.');
          say(escHtml(TXT.fail) + '<a href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a>.', 'is-err');
          btn.disabled = false;
          btn.textContent = label;
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
