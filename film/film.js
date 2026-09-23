/* Harte Growth, de film.
 * Opbouw: elke <section class="chapter"> heeft een .scene (vaste beeldlaag) en een .copy (echte tekst).
 * In filmmodus krijgt elke scène drie scroll-gekoppelde delen:
 *   in    -> .scene-in vervaagt erin terwijl het hoofdstuk binnenschuift
 *   bouw  -> de scène-tijdlijn scrubt terwijl de tekst vast staat (sticky)
 *   uit   -> .scene vervaagt weg terwijl het volgende hoofdstuk binnenkomt
 * In/uit zitten op verschillende elementen, zodat ze elkaar nooit overschrijven.
 * Zonder JS of met prefers-reduced-motion blijft alles statisch: CSS toont het eindbeeld.
 */
(function () {
  'use strict';

  var FILM_SECONDS = 70;   // lengte van de "film" voor de tijdcode
  var FPS = 25;
  var REST_OFFSET = 0.06;  // rustpunt ligt 6% van een scherm vóór het einde van de bouw

  var root = document.documentElement;
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.tl-clips a'));
  var tcEl = document.getElementById('tc');
  var nowEl = document.getElementById('tl-now');
  var fill = document.querySelector('.tl-fill');
  var head = document.querySelector('.tl-head');

  setupFab();

  if (!window.gsap || !window.ScrollTrigger) return; // CDN niet geladen: statische versie blijft staan

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- Scènes: per hoofdstuk een functie die de bouw-tijdlijn vult ---------- */
  var SCENES = {};

  // 1. Opening: het beeld opent als een film, daarna schuift de camera langzaam in.
  SCENES.opening = function (tl, s) {
    tl.fromTo(s.q('.room'), { scale: 1 }, { scale: 1.08, duration: 1 }, 0)
      .fromTo(s.q('.crop-l, .crop-r'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 0.3)
      .fromTo(s.q('.crop-label'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.5);
  };

  function openingIntro(s) {
    var copy = s.chapter.querySelectorAll('.copy > *');
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.set(s.q('.bar'), { scaleY: 1 })
      .fromTo(s.q('.room'), { autoAlpha: 0.15 }, { autoAlpha: 1, duration: 1.4, ease: 'power1.inOut' }, 0.35)
      .to(s.q('.bar'), { scaleY: 0, duration: 1.2, ease: 'expo.inOut' }, 0.2)
      .from(s.q('.mon-meta, .corner'), { autoAlpha: 0, duration: 0.4, stagger: 0.05 }, 1.1)
      .from(copy, { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 0.45);
    return tl;
  }

  /* ---------- Filmmodus ---------- */
  var film = null; // { rests: [], contactStart, max }

  var mm = gsap.matchMedia();
  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 767px)'
  }, function (ctx) {
    if (!ctx.conditions.motion) return;
    var mobile = ctx.conditions.mobile;
    root.classList.add('film-on');

    var builds = {};
    chapters.forEach(function (chapter) {
      var id = chapter.id;
      var scene = chapter.querySelector('.scene');
      var inner = scene.querySelector('.scene-in');
      var s = {
        chapter: chapter, scene: scene, inner: inner, mobile: mobile,
        q: function (sel) { return scene.querySelectorAll(sel); }
      };

      if (id !== 'opening') {
        gsap.fromTo(inner, { autoAlpha: 0, scale: 0.97 }, {
          autoAlpha: 1, scale: 1, ease: 'none',
          scrollTrigger: { trigger: chapter, start: 'top 75%', end: 'top 20%', scrub: true }
        });
      }
      if (id !== 'contact') {
        gsap.fromTo(scene, { autoAlpha: 1 }, {
          autoAlpha: 0, ease: 'none',
          scrollTrigger: { trigger: chapter, start: 'bottom 75%', end: 'bottom 25%', scrub: true }
        });
      }

      if (SCENES[id]) {
        var tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: chapter, start: 'top top', end: 'bottom bottom',
            scrub: mobile ? true : 0.6
          }
        });
        SCENES[id](tl, s);
        // bouw eindigt op 90%, zodat het rustpunt een af beeld laat zien
        tl.set({}, {}, tl.duration() / 0.9);
        builds[id] = tl.scrollTrigger;
      }

      if (id === 'opening' && window.scrollY < window.innerHeight * 0.5) openingIntro(s);
    });

    ScrollTrigger.create({
      start: 0, end: 'max',
      onRefresh: function (self) { measure(builds); update(self); },
      onUpdate: update,
      snap: {
        snapTo: snapTo,
        duration: { min: 0.25, max: 1.1 },
        delay: 0.12,
        ease: 'power2.inOut'
      }
    });

    return function () {
      root.classList.remove('film-on');
      film = null;
    };
  });

  function measure(builds) {
    var vh = window.innerHeight;
    var max = ScrollTrigger.maxScroll(window);
    var hdr = document.querySelector('.hdr').offsetHeight;
    var rests = chapters.map(function (ch) {
      if (ch.id === 'opening') return 0;
      if (ch.id === 'contact') return Math.min(max, ch.offsetTop - hdr);
      var st = builds[ch.id];
      return st ? st.end - vh * REST_OFFSET : ch.offsetTop;
    });
    var contact = document.getElementById('contact');
    film = {
      rests: rests,
      max: max,
      contactStart: contact ? Math.min(max, contact.offsetTop - hdr) - 2 : Infinity
    };
    // clipbreedtes op de tijdlijn volgen de echte scrolllengte per hoofdstuk
    chapters.forEach(function (ch, i) {
      var li = links[i] && links[i].parentNode;
      if (!li) return;
      var next = chapters[i + 1] ? chapters[i + 1].offsetTop : max + vh;
      var len = Math.max(next - ch.offsetTop - (chapters[i + 1] ? 0 : vh), vh * 0.4);
      li.style.flexGrow = String(len);
    });
  }

  function snapTo(value, self) {
    if (!film || !film.max) return value;
    var y = value * film.max;
    if (y >= film.contactStart) return value; // contact: vrij scrollen, formulier nooit laten verspringen
    var rests = film.rests;
    var vh = window.innerHeight;
    var nearest = rests.reduce(function (a, b) { return Math.abs(b - y) < Math.abs(a - y) ? b : a; });
    var target = nearest;
    if (Math.abs(nearest - y) > vh * 0.08) {
      var dir = self && self.direction ? self.direction : 1;
      if (dir > 0) target = rests.filter(function (r) { return r > y; })[0];
      else target = rests.filter(function (r) { return r < y; }).pop();
      if (target === undefined) target = nearest;
    }
    return Math.max(0, Math.min(1, target / film.max));
  }

  /* ---------- Tijdcode + tijdlijn ---------- */
  var lastFrame = -1;
  var lastActive = -1;
  function update(self) {
    var p = self.progress || 0;
    fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    head.style.transform = 'translateX(' + (p * 100).toFixed(3) + '%)';

    var frame = Math.round(p * FILM_SECONDS * FPS);
    if (frame !== lastFrame) {
      lastFrame = frame;
      tcEl.textContent = timecode(frame);
    }

    var y = window.scrollY + window.innerHeight * 0.5;
    var active = 0;
    chapters.forEach(function (ch, i) { if (ch.offsetTop <= y) active = i; });
    if (active !== lastActive) {
      lastActive = active;
      links.forEach(function (a, i) {
        if (i === active) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
      if (nowEl && links[active]) nowEl.textContent = links[active].textContent.trim();
    }
  }

  function timecode(frame) {
    var ff = frame % FPS;
    var total = Math.floor(frame / FPS);
    var ss = total % 60, mm = Math.floor(total / 60) % 60, hh = Math.floor(total / 3600);
    return [hh, mm, ss, ff].map(function (n) { return n < 10 ? '0' + n : String(n); }).join(':');
  }

  /* ---------- Hoofdstukmarkeringen: springen naar het rustpunt ---------- */
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      var target = chapters[i];
      if (!target) return;
      var heading = target.querySelector('h1, h2');
      if (!film) return; // statisch: gewone anker-sprong
      e.preventDefault();
      var y = film.rests[i];
      var dist = Math.abs(window.scrollY - y) / window.innerHeight;
      gsap.to(window, {
        scrollTo: { y: y, autoKill: true },
        duration: Math.min(1.8, 0.5 + dist * 0.18),
        ease: 'power2.inOut',
        onComplete: function () { if (heading) heading.focus({ preventScroll: true }); }
      });
      history.replaceState(null, '', '#' + target.id);
    });
  });

  // Direct binnenkomen op /film/#media: naar het rustpunt van dat hoofdstuk.
  window.addEventListener('load', function () {
    if (!film || !location.hash) return;
    var i = chapters.findIndex(function (ch) { return '#' + ch.id === location.hash; });
    if (i > 0) window.scrollTo(0, film.rests[i]);
  });

  /* ---------- WhatsApp-knop: weg als het toetsenbord open is ---------- */
  function setupFab() {
    var fab = document.querySelector('.wa-fab');
    if (!fab) return;
    var coarse = window.matchMedia('(pointer: coarse)');
    document.addEventListener('focusin', function (e) {
      if (coarse.matches && e.target.matches('input, textarea, select')) fab.classList.add('is-tucked');
    });
    document.addEventListener('focusout', function () { fab.classList.remove('is-tucked'); });
  }
})();
