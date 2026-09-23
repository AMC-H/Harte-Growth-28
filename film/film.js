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

  // 2. Media: losse foto's vallen in de bak, schuiven op de tijdlijn, krijgen cuts, tekst en geluid,
  //    en spelen af als afgewerkte 9:16-video in het programmascherm.
  var media = { video: null, hasVideo: false, t0: 0.64, span: 0.3 };

  SCENES.media = function (tl, s) {
    var only = s.mobile ? ':not(.is-extra)' : '';
    var shots = toArray(s.q('.shot' + only));
    var clips = toArray(s.q('.clip' + only));
    var frames = toArray(s.q('.pf' + only));
    var edit = s.scene.querySelector('.edit');
    var lane = s.scene.querySelector('.lane-v1');
    var narrow = function () { return edit.offsetWidth < 600; };

    // Doelpositie van elke foto: het miniatuurtje van zijn clip op V1, relatief aan .edit.
    function delta(i) {
      var from = offsetIn(shots[i], edit);
      var to = offsetIn(clips[i].querySelector('.clip-thumb'), edit);
      return { x: to.x - from.x, y: to.y - from.y, scale: to.h / from.h };
    }

    tl.fromTo(shots, { yPercent: -140, autoAlpha: 0, rotation: 0 }, {
        yPercent: 0, autoAlpha: 1,
        rotation: function (i, el) { return s.mobile ? 0 : Number(el.dataset.r || 0); },
        duration: 0.12, stagger: 0.02, ease: 'power2.out'
      }, 0)
      .fromTo(clips, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0.01 }, 0)
      .fromTo(s.q('.cut'), { scaleY: 0 }, { scaleY: 0, duration: 0.01 }, 0)
      .fromTo(s.q('.title-clip'), { scaleX: 0 }, { scaleX: 0, duration: 0.01 }, 0)
      .fromTo(s.q('.title-clip span'), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0.01 }, 0)
      .fromTo(s.q('.wave'), { scaleX: 0 }, { scaleX: 0, duration: 0.01 }, 0)
      .fromTo(s.q('.edit-head'), { x: 0, autoAlpha: 0 }, { x: 0, autoAlpha: 0, duration: 0.01 }, 0)
      .fromTo(frames, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0.01 }, 0);

    // foto's naar de tijdlijn, één voor één
    shots.forEach(function (shot, i) {
      var at = 0.22 + i * (0.26 / shots.length);
      tl.to(shot, {
        x: function () { return delta(i).x; },
        y: function () { return delta(i).y; },
        scale: function () { return delta(i).scale; },
        rotation: 0, duration: 0.08, ease: 'power2.inOut'
      }, at)
        .to(shot, { autoAlpha: 0, duration: 0.015 }, at + 0.08)
        .to(clips[i], { autoAlpha: 1, duration: 0.015 }, at + 0.075);
    });

    tl.to(s.q('.bin .edit-label'), { autoAlpha: 0.35, duration: 0.05 }, 0.48)
      .to(toArray(s.q('.cut')).filter(visible), { scaleY: 1, duration: 0.04, stagger: 0.012, ease: 'back.out(3)' }, 0.5)
      .to(s.q('.title-clip'), { scaleX: 1, duration: 0.06, ease: 'power2.out' }, 0.56)
      .to(s.q('.title-clip span'), { autoAlpha: 1, duration: 0.02 }, 0.61)
      .to(s.q('.wave'), { scaleX: 1, duration: 0.08, ease: 'power1.out' }, 0.56)
      .to(s.q('.edit-head'), { autoAlpha: 1, duration: 0.02 }, 0.6)
      .to(s.q('.edit-head'), { x: function () { return lane.offsetWidth; }, duration: media.span, ease: 'none' }, media.t0);

    // smal scherm: tijdlijn dimt, resultaat komt als laag erover
    tl.fromTo(s.q('.edit-main'), { autoAlpha: 1 }, {
      autoAlpha: function () { return narrow() ? 0.3 : 1; }, duration: 0.06
    }, 0.6)
      .fromTo(s.q('.program'), { autoAlpha: function () { return narrow() ? 0 : 1; }, scale: function () { return narrow() ? 0.9 : 1; } }, {
        autoAlpha: 1, scale: 1, duration: 0.06, ease: 'power2.out'
      }, 0.6);

    // programmascherm: elk shot verschijnt zodra de afspeelkop over zijn clip gaat
    var lens = clips.map(function (c) { return Number(c.dataset.len || 2); });
    var total = lens.reduce(function (a, b) { return a + b; }, 0);
    var acc = 0;
    frames.forEach(function (f, i) {
      var at = media.t0 + media.span * (acc / total);
      var dur = media.span * (lens[i] / total);
      acc += lens[i];
      tl.to(f, { autoAlpha: 1, duration: 0.01 }, at)
        .fromTo(f.querySelector('svg'), { scale: 1.12 }, { scale: 1, duration: dur, ease: 'none' }, at);
      var cap = f.querySelector('.pf-cap');
      if (cap) tl.fromTo(cap, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.03, ease: 'power2.out' }, at + 0.01);
    });

    // echte video (film/media/result.mp4) scrubt mee over hetzelfde stuk
    tl.eventCallback('onUpdate', function () {
      if (!media.hasVideo || !media.video.duration) return;
      var p = (tl.time() - media.t0) / media.span;
      p = Math.max(0, Math.min(1, p));
      var t = p * (media.video.duration - 0.05);
      if (Math.abs(media.video.currentTime - t) > 1 / 30) media.video.currentTime = t;
    });
  };

  // 3. Fundament: eerst het wireframe, dan de echte onderdelen in leesvolgorde, als laatste de WhatsApp-knop.
  SCENES.fundament = function (tl, s) {
    var blocks = toArray(s.q('.wb')).filter(visible);
    var wfs = blocks.map(function (b) { return b.querySelector('.wf'); });
    // wat er per blok verschijnt, in leesvolgorde (op mobiel staat de foto bovenaan)
    var byOrder = blocks.slice().sort(function (a, b) {
      return (a.offsetTop - b.offsetTop) || (a.offsetLeft - b.offsetLeft);
    });
    var parts = [];
    byOrder.forEach(function (b) {
      if (b.classList.contains('wb-hero')) parts.push.apply(parts, toArray(b.querySelectorAll('.br-h, .ln, .br-btn')));
      else parts.push(b.querySelector('.fill'));
    });
    var wa = s.scene.querySelector('.br-wa');

    tl.fromTo(s.q('.br-url'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0)
      .fromTo(wfs, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.08, stagger: 0.03, ease: 'power2.out' }, 0.02)
      .fromTo(parts, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.07, stagger: 0.045, ease: 'power2.out' }, 0.3)
      .to(wfs, { autoAlpha: 0, duration: 0.06, stagger: 0.04 }, 0.36)
      .fromTo(wa, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.07, ease: 'back.out(2.6)' }, 0.84)
      .to(wa, { scale: 1.12, duration: 0.03, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0.92);
  };

  function loadMediaVideo() {
    var video = document.querySelector('video[data-slot="media-result"]');
    if (!video || !window.fetch) return;
    var src = video.dataset.src;
    fetch(src, { method: 'HEAD' }).then(function (res) {
      var type = res.headers.get('content-type') || '';
      if (!res.ok || type.indexOf('video') === -1) return;
      video.preload = 'auto';
      video.addEventListener('loadedmetadata', function () {
        if (!isFinite(video.duration) || !video.duration) return; // kapot of streamend bestand: tekening blijft
        video.hidden = false;
        media.video = video;
        media.hasVideo = true;
        video.closest('.program-frame').classList.add('has-video');
        if (!root.classList.contains('film-on')) {
          // statische versie: gewoon afspeelbaar met bediening
          video.controls = true;
          video.removeAttribute('tabindex');
          video.setAttribute('aria-label', 'Voorbeeldvideo');
          video.closest('.scene').removeAttribute('aria-hidden');
        } else {
          // iOS toont pas beelden na een eerste play()
          var p = video.play();
          if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
        }
        ScrollTrigger.update();
      }, { once: true });
      video.src = src;
      video.load();
    }).catch(function () {});
  }

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

  /* ---------- Hulpjes ---------- */
  function toArray(list) { return Array.prototype.slice.call(list); }
  function visible(el) { return el.offsetParent !== null; }
  // positie + maat van el binnen ancestor, zonder transforms (offset-keten)
  function offsetIn(el, ancestor) {
    var x = 0, y = 0, node = el;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (el instanceof SVGElement) {
      var r = el.getBoundingClientRect(), a = ancestor.getBoundingClientRect();
      var k = ancestor.offsetWidth / a.width || 1; // corrigeer voor schaal van de scène
      return { x: (r.left - a.left) * k, y: (r.top - a.top) * k, w: r.width * k, h: r.height * k };
    }
    while (node && node !== ancestor) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
    return { x: x, y: y, w: w, h: h };
  }

  loadMediaVideo();

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
            scrub: mobile ? true : 0.6,
            invalidateOnRefresh: true
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
