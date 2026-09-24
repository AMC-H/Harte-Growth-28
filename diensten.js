/* Harte Growth, diensten.
 * Zelfde opbouw als de homepage (film.js): hoofdstukken met echte tekst, een vaste stage die met de scroll
 * meeloopt, tijdlijn + tijdcode in de header. Hier is de stage één montagetijdlijn (het Growth System):
 * elk hoofdstuk vult zijn eigen spoor, bij Export schuiven de sporen samen tot één master.
 * Zonder JS of met reduced motion: statisch; per hoofdstuk het eindbeeld boven de tekst.
 * Stage-slot en het event 'stage:progress': zie diensten-stage-README.md.
 */
(function () {
  'use strict';

  var FILM_SECONDS = 90, FPS = 25;
  var REST_OFFSET = 0.06;
  var FILM_IDS = ['systeem', 'media', 'fundament', 'verkeer', 'opvolging', 'export'];
  var TRACK_IDS = ['media', 'fundament', 'verkeer', 'opvolging'];

  var root = document.documentElement;
  var chapters = toArray(document.querySelectorAll('.chapter'));
  var links = toArray(document.querySelectorAll('.tl-clips a'));
  var tcEl = document.getElementById('tc');
  var nowEl = document.getElementById('tl-now');
  var fill = document.querySelector('.tl-fill');
  var head = document.querySelector('.tl-head');
  var slot = document.querySelector('.stage-slot');

  setupFab();
  setupMenu();
  setupMore();

  if (!window.gsap || !window.ScrollTrigger) return; // CDN niet geladen: statische versie blijft staan
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });
  setupSlot();

  function toArray(l) { return Array.prototype.slice.call(l); }
  function visible(el) { return el.offsetParent !== null; }

  /* ---------- Stage-opbouw per hoofdstuk ---------- */
  var film = null;
  var mm = gsap.matchMedia();
  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)',
    mobile: '(max-width: 767px)'
  }, function (ctx) {
    if (!ctx.conditions.motion) {
      staticStages(true);
      return function () { staticStages(false); };
    }
    var mobile = ctx.conditions.mobile;
    root.classList.add('film-on');

    var gs = document.querySelector('.dstage .gs');
    var q = function (sel) { return toArray(gs.querySelectorAll(sel)); };
    var builds = {};

    function trackBuild(tid) {
      return function (tl) {
        var track = gs.querySelector('[data-track="' + tid + '"]');
        var clips = toArray(track.querySelectorAll('.gs-clip')).filter(visible);
        var gap = gs.querySelector('.gs-gap[data-to="' + tid + '"]');
        // verbindingslijnen: dit spoor wordt gevoed door het vorige (mobiel: statisch)
        // beginstand expliciet zetten: een fromTo met stagger rendert alleen het eerste element direct
        if (gap) { gsap.set(gap.children, { scaleY: 0 }); tl.to(gap.children, { scaleY: 1, duration: 0.15, stagger: 0.04, ease: 'power2.out' }, 0); }
        gsap.set(clips, { scaleX: 0, autoAlpha: 0 });
        tl.to(track.querySelector('.gs-name'), { color: '#F2F0EC', duration: 0.1 }, 0.05)
          .to(clips, { scaleX: 1, autoAlpha: 1, duration: 0.12, stagger: 0.6 / clips.length, ease: 'power2.out' }, 0.15);
      };
    }
    var BUILD = {
      systeem: function (tl) {
        // setup: lege sporen, alleen de playhead gaat lopen (zie hieronder)
        tl.set({}, {}, 1);
      },
      media: trackBuild('media'),
      fundament: trackBuild('fundament'),
      verkeer: trackBuild('verkeer'),
      opvolging: trackBuild('opvolging'),
      export: function (tl) {
        var master = gs.querySelector('.gs-master');
        var win = gs.querySelector('.gs-export');
        // sporen zakken in de master; ze zijn al weg voordat ze elkaar raken
        tl.to(q('.gs-tracks > *'), {
          y: function (i, el) { return (master.offsetTop - el.offsetTop) * 0.5; },
          duration: 0.3, stagger: 0.03, ease: 'power2.in'
        }, 0)
          .to(q('.gs-tracks > *'), { autoAlpha: 0, duration: 0.14, stagger: 0.03 }, 0.02)
          .fromTo(master, { autoAlpha: 0, scaleX: 0 }, { autoAlpha: 1, scaleX: 1, duration: 0.15, transformOrigin: 'left center' }, 0.25)
          .fromTo(win, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.35)
          .fromTo(win.querySelector('.xwin-fill'), { scaleX: 0 }, { scaleX: 1, duration: 0.4 }, 0.45)
          .to(win.querySelector('.st-busy'), { autoAlpha: 0, duration: 0.02 }, 0.86)
          .to(win.querySelector('.st-done'), { autoAlpha: 1, duration: 0.02 }, 0.87);
      }
    };
    // beginstand: sporen leeg, master en export nog niet in beeld
    gsap.set(q('.st-done'), { autoAlpha: 0 });

    FILM_IDS.forEach(function (id) {
      var chapter = document.getElementById(id);
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: chapter, start: id === 'systeem' ? 'top top' : mobile ? 'top 90%' : 'top 45%', end: 'bottom bottom',
          // mobiel: het rustpunt is de bovenkant van het hoofdstuk, dus de opbouw begint eerder
          scrub: mobile ? true : 0.6, invalidateOnRefresh: true,
          onUpdate: function (self) { emitProgress(id, self.progress); }
        }
      });
      BUILD[id](tl);
      tl.set({}, {}, tl.duration() / 0.9); // bouw klaar op 90%: het rustpunt toont een af beeld
      builds[id] = tl.scrollTrigger;
    });

    // playhead loopt over het hele Growth System (systeem t/m export), met lichte smoothing
    var gsHead = gs.querySelector('.gs-head span');
    var lane = gs.querySelector('.gs-lane');
    var headTo = gsap.quickTo(gsHead, 'x', { duration: 0.3, ease: 'power2.out' });
    ScrollTrigger.create({
      trigger: '#systeem', start: 'top top', endTrigger: '#export', end: 'bottom bottom',
      onUpdate: function (self) { headTo(self.progress * lane.offsetWidth); }
    });

    // stage weg voordat het aanbod komt
    gsap.fromTo('.dstage', { autoAlpha: 1 }, {
      autoAlpha: 0, ease: 'none',
      scrollTrigger: { trigger: '#aanbod', start: 'top 85%', end: 'top 45%', scrub: true }
    });

    // automation: knooppunten lichten één voor één op
    var flow = document.querySelector('#automation .flow');
    if (flow) {
      var nodes = toArray(flow.querySelectorAll('.fnode'));
      var ffill = flow.querySelector('.flow-fill');
      ScrollTrigger.create({
        trigger: flow, start: 'top 80%', end: 'bottom 45%',
        onUpdate: function (self) {
          var p = self.progress;
          ffill.style.transform = (mobile ? 'scaleY(' : 'scaleX(') + p.toFixed(3) + ')';
          nodes.forEach(function (n, i) { n.classList.toggle('on', p >= i / (nodes.length - 1) - 0.001); });
        }
      });
    }

    // afsluiting: de tijdlijn rendert af en vaagt rustig weg
    var sr = document.querySelector('#start .start-render');
    if (sr) {
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '#start', start: 'top 90%', end: 'bottom bottom', scrub: true }
      })
        .fromTo(sr.querySelector('.xwin-fill'), { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, 0)
        .fromTo(sr.querySelector('.st-busy'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.02 }, 0.6)
        .fromTo(sr.querySelector('.st-done'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.61)
        .to(sr, { autoAlpha: 0, duration: 0.2 }, 0.8);
    }

    // mobiel: stage dimt licht zolang er een tekstblok in beeld is
    if (mobile) {
      var dimEl = document.querySelector('.stage-dim');
      var bodies = toArray(document.querySelectorAll('.copy-body'));
      var dims = bodies.map(function () { return 0; });
      var applyDim = function () { dimEl.style.opacity = (Math.max.apply(null, dims) * 0.3).toFixed(3); };
      bodies.forEach(function (body, i) {
        ScrollTrigger.create({
          trigger: body, start: 'top bottom', end: 'bottom top',
          onUpdate: function (self) {
            var p = self.progress;
            dims[i] = p < 0.18 ? p / 0.18 : p > 0.82 ? (1 - p) / 0.18 : 1;
            applyDim();
          },
          onLeave: function () { dims[i] = 0; applyDim(); },
          onLeaveBack: function () { dims[i] = 0; applyDim(); }
        });
      });
    }

    // geen snap; rustpunten alleen voor markeringen en ankerlinks
    ScrollTrigger.create({ start: 0, end: 'max', onRefresh: function () { measure(builds, mobile); } });

    return function () {
      root.classList.remove('film-on');
      film = null;
    };
  });

  // tijdcode, afspeelkop en actief hoofdstuk: in beide modi
  ScrollTrigger.create({
    start: 0, end: 'max',
    onRefresh: function (self) { sizeClips(); update(self); },
    onUpdate: update
  });

  function measure(builds, mobile) {
    var vh = window.innerHeight;
    var max = ScrollTrigger.maxScroll(window);
    var hdr = document.querySelector('.hdr').offsetHeight;
    film = {
      max: max,
      rests: chapters.map(function (ch) {
        if (ch.id === 'systeem') return 0;
        if (ch.classList.contains('plain')) return Math.min(max, ch.offsetTop - hdr);
        if (mobile) return ch.offsetTop; // mobiel: het tekstblok staat dan onderin in beeld
        var st = builds[ch.id];
        return st ? st.end - vh * REST_OFFSET : ch.offsetTop;
      })
    };
  }

  function sizeClips() {
    var vh = window.innerHeight, max = ScrollTrigger.maxScroll(window);
    chapters.forEach(function (ch, i) {
      var li = links[i] && links[i].parentNode;
      if (!li) return;
      var next = chapters[i + 1] ? chapters[i + 1].offsetTop : max + vh;
      li.style.flexGrow = String(Math.max(next - ch.offsetTop - (chapters[i + 1] ? 0 : vh), vh * 0.4));
    });
  }

  var lastFrame = -1, lastActive = -1;
  function update(self) {
    var p = self.progress || 0;
    fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    head.style.transform = 'translateX(' + (p * 100).toFixed(3) + '%)';
    var frame = Math.round(p * FILM_SECONDS * FPS);
    if (frame !== lastFrame) { lastFrame = frame; tcEl.textContent = timecode(frame); }
    var y = window.scrollY + window.innerHeight * 0.5, active = 0;
    chapters.forEach(function (ch, i) { if (ch.offsetTop <= y) active = i; });
    if (active !== lastActive) {
      lastActive = active;
      links.forEach(function (a, i) { if (i === active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      if (nowEl && links[active]) nowEl.textContent = links[active].textContent.trim();
    }
  }
  function timecode(frame) {
    var ff = frame % FPS, total = Math.floor(frame / FPS);
    return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60, ff]
      .map(function (n) { return n < 10 ? '0' + n : String(n); }).join(':');
  }

  /* ---------- Ankerlinks: soepel naar het rustpunt ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !film) return; // statisch: de browser springt zelf
    var id = a.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    var i = chapters.indexOf(el);
    if (i < 0) return;
    e.preventDefault();
    var y = Math.max(0, film.rests[i]);
    var heading = el.querySelector('h1, h2');
    gsap.to(window, {
      scrollTo: { y: y, autoKill: true },
      duration: Math.min(1.8, 0.5 + Math.abs(window.scrollY - y) / window.innerHeight * 0.18),
      ease: 'power2.inOut',
      onComplete: function () { if (heading) heading.focus({ preventScroll: true }); }
    });
    history.replaceState(null, '', '#' + id);
  });
  window.addEventListener('load', function () {
    if (!film || !location.hash) return;
    var i = chapters.indexOf(document.getElementById(location.hash.slice(1)));
    if (i > 0) window.scrollTo(0, film.rests[i]);
  });

  /* ---------- Reduced motion: per hoofdstuk het eindbeeld van de stage boven de tekst ---------- */
  function staticStages(on) {
    var master = document.querySelector('.dstage .gs');
    if (!master) return;
    toArray(document.querySelectorAll('.gs-static')).forEach(function (sc) {
      var inner = sc.querySelector('.scene-in');
      inner.innerHTML = '';
      sc.classList.remove('filled');
      if (!on) return;
      var id = sc.closest('.chapter').id;
      var clone = master.cloneNode(true);
      applyUpto(clone, id);
      inner.appendChild(clone);
      sc.classList.add('filled');
    });
    // de hero toont de 'setup': lege sporen (zonder JS blijft hij het complete eindbeeld tonen)
    applyUpto(master, on ? 'systeem' : 'export');
  }
  function applyUpto(gs, id) {
    var reached = FILM_IDS.indexOf(id);
    TRACK_IDS.forEach(function (tid) {
      var on = FILM_IDS.indexOf(tid) <= reached;
      toArray(gs.querySelectorAll('[data-track="' + tid + '"] .gs-clip')).forEach(function (c) { c.style.visibility = on ? '' : 'hidden'; });
      var gap = gs.querySelector('.gs-gap[data-to="' + tid + '"]');
      if (gap) gap.style.visibility = on ? '' : 'hidden';
    });
    var done = id === 'export';
    [gs.querySelector('.gs-master'), gs.querySelector('.gs-export')].forEach(function (el) { if (el) el.style.display = done ? '' : 'none'; });
  }

  /* ---------- Stage-slot: optionele asset (video, framereeks, module) + 'stage:progress' ---------- */
  function emitProgress(chapter, progress) {
    if (!slot) return;
    slot.dispatchEvent(new CustomEvent('stage:progress', { bubbles: true, detail: { chapter: chapter, progress: progress } }));
  }
  function setupSlot() {
    if (!slot || !slot.dataset.assetSrc) return; // leeg: de DOM/SVG-versie blijft
    var type = slot.dataset.assetType || 'video';
    var src = slot.dataset.assetSrc;
    var order = FILM_IDS;
    // totale voortgang 0-1 over alle stage-hoofdstukken, voor assets die één tijdlijn hebben
    var overall = function (d) { return (order.indexOf(d.chapter) + d.progress) / order.length; };
    var show = function (el) { el.className = 'stage-asset'; slot.innerHTML = ''; slot.appendChild(el); };
    if (type === 'video') {
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = src;
      v.addEventListener('loadedmetadata', function () {
        show(v);
        slot.addEventListener('stage:progress', function (e) {
          var t = overall(e.detail) * (v.duration - 1 / 30);
          if (!v.seeking && Math.abs(v.currentTime - t) > 1 / 60) v.currentTime = t;
        });
      }, { once: true });
    } else if (type === 'frames') {
      // src bevat {i} (bv. /media/stage/frame-{i}.webp), data-asset-count = aantal frames
      var count = Number(slot.dataset.assetCount || 0);
      if (!count) return;
      var cv = document.createElement('canvas'), ctx2 = cv.getContext('2d'), imgs = [];
      var load = function (i) { if (imgs[i]) return; var im = new Image(); im.src = src.replace('{i}', String(i).padStart(4, '0')); imgs[i] = im; };
      for (var i = 0; i < count; i += 4) load(i);          // eerst elk 4e frame, daarna de rest
      imgs[0].addEventListener('load', function () { show(cv); cv.width = 0; }, { once: true });
      window.addEventListener('load', function () { for (var j = 0; j < count; j++) load(j); });
      slot.addEventListener('stage:progress', function (e) {
        var n = Math.min(count - 1, Math.round(overall(e.detail) * (count - 1)));
        var im = imgs[n] && imgs[n].complete ? imgs[n] : imgs[n - (n % 4)];
        if (!im || !im.complete) return;
        if (cv.width !== im.naturalWidth) { cv.width = im.naturalWidth; cv.height = im.naturalHeight; }
        ctx2.drawImage(im, 0, 0);
      });
    } else if (type === 'module') {
      // eigen renderer (bv. later een 3D-canvas): default export function (slot) { ... luister naar stage:progress ... }
      import(src).then(function (m) { if (m && typeof m.default === 'function') { slot.innerHTML = ''; m.default(slot); } });
    }
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

  /* ---------- Lees meer: op mobiel dicht, op desktop open ---------- */
  function setupMore() {
    var mq = window.matchMedia('(max-width: 767px)');
    var all = document.querySelectorAll('details.more');
    var apply = function () { Array.prototype.forEach.call(all, function (d) { if (mq.matches) d.removeAttribute('open'); else d.setAttribute('open', ''); }); };
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
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
