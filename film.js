/* Harte Growth, de film.
 * Opbouw: elke <section class="chapter"> heeft een .scene (vaste beeldlaag) en een .copy (echte tekst).
 * In filmmodus krijgt elke scène drie scroll-gekoppelde delen:
 *   in    -> .scene-in vervaagt erin terwijl het hoofdstuk binnenschuift
 *   bouw  -> de scène-tijdlijn scrubt terwijl de tekst vast staat (sticky)
 *   uit   -> .scene vervaagt weg vóórdat het volgende hoofdstuk verschijnt (na elkaar, nooit over
 *            elkaar heen: er is geen snap, dus elke tussenstand moet er goed uitzien)
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
  fillPrice();
  setupForm();
  setupMenu();

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

    // echte video (/media/result.mp4) scrubt mee over hetzelfde stuk
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

    tl.fromTo(s.q('.br-url'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0)
      .fromTo(wfs, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.06, stagger: 0.02, ease: 'power2.out' }, 0)
      .fromTo(parts, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.07, stagger: 0.045, ease: 'power2.out' }, 0.3)
      .to(wfs, { autoAlpha: 0, duration: 0.06, stagger: 0.04 }, 0.36)
      .fromTo(wa, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.07, ease: 'back.out(2.6)' }, 0.84)
      .to(wa, { scale: 1.12, duration: 0.03, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0.92);
  };

  // 4. Verkeer: jouw resultaat klimt van onder naar boven, de lijn loopt op. Illustratie, geen cijfers.
  //    In de HTML staat jouw resultaat al bovenaan (eindbeeld); de animatie start het onderaan.
  SCENES.verkeer = function (tl, s) {
    var rows = toArray(s.q('.res')).filter(visible);
    var you = rows[0];
    var others = rows.slice(1);
    var step = function () { return rows[1].offsetTop - rows[0].offsetTop; };

    tl.fromTo(s.q('.serp-q'), { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0)
      .fromTo(rows, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, stagger: 0.03 }, 0.06)
      .fromTo(you, { y: function () { return step() * others.length; } }, { y: 0, duration: 0.5, ease: 'power2.inOut' }, 0.2)
      .fromTo(s.q('.chart'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.2)
      .fromTo(s.q('.chart-cover'), { scaleX: 1 }, { scaleX: 0, duration: 0.6, ease: 'power1.inOut' }, 0.28);

    // de anderen schuiven één plek omlaag op het moment dat jij ze passeert (onderste eerst)
    others.forEach(function (row, i) {
      var passAt = 0.2 + 0.5 * ((others.length - 1 - i) + 0.5) / others.length;
      tl.fromTo(row, { y: function () { return -step(); } }, { y: 0, duration: 0.1, ease: 'power2.inOut' }, passAt - 0.05);
    });
  };

  // 5. Opvolging: bericht komt binnen, 'typt...', automatisch antwoord, klant reageert, samenvatting schuift uit.
  SCENES.opvolging = function (tl, s) {
    var msgs = toArray(s.q('.msg'));
    var typing = s.scene.querySelector('.typing');
    var pop = function (el, at) {
      tl.fromTo(el, { autoAlpha: 0, scale: 0.85, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.06, ease: 'back.out(2)' }, at);
    };

    tl.fromTo(s.q('.phone'), { y: 30 }, { y: 0, duration: 0.1, ease: 'power2.out' }, 0)
      .fromTo(s.q('.ph-day'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.04);
    pop(msgs[0], 0.05);
    tl.fromTo(typing, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.16)
      .to(typing.children, { y: -4, duration: 0.025, ease: 'sine.inOut', yoyo: true, repeat: 5, stagger: 0.012 }, 0.18)
      .to(typing, { autoAlpha: 0, duration: 0.02 }, 0.34);
    pop(msgs[1], 0.34);
    pop(msgs[2], 0.54);
    tl.fromTo(s.q('.summary'), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.1, ease: 'power3.out' }, 0.7)
      .fromTo(s.q('.summary dl > div'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.03 }, 0.78);
  };

  // 6. Prijs: exportvenster vult zich, oude prijs wordt doorgestreept, render loopt vol.
  SCENES.prijs = function (tl, s) {
    tl.fromTo(s.q('.export'), { scale: 0.96, y: 16 }, { scale: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0)
      .fromTo(s.q('.ex-rows > div'), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.06, stagger: 0.05, ease: 'power2.out' }, 0.1)
      .fromTo(s.q('.ex-was'), { '--strike': 0 }, { '--strike': 1, duration: 0.06 }, 0.42)
      .fromTo(s.q('.ex-price b'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.06, ease: 'back.out(2.4)', transformOrigin: 'left center' }, 0.47)
      .fromTo(s.q('.ex-busy'), { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, 0.55)
      .fromTo(s.q('.ex-done'), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0.01 }, 0.55)
      .fromTo(s.q('.ex-fill'), { scaleX: 0 }, { scaleX: 1, duration: 0.32, ease: 'power1.inOut' }, 0.55)
      .to(s.q('.ex-busy'), { autoAlpha: 0, duration: 0.02 }, 0.87)
      .to(s.q('.ex-done'), { autoAlpha: 1, duration: 0.02 }, 0.88);
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

  // Intro bij binnenkomst: de sluiter gaat open en het licht komt op. De tekst staat er meteen
  // (niet animeren: dat vertraagt de eerste zichtbare inhoud).
  function openingIntro(s) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.set(s.q('.bar'), { scaleY: 1 })
      .set(s.q('.room'), { autoAlpha: 0.15 })
      .set(s.q('.mon-meta, .corner'), { autoAlpha: 0 })
      .call(function () { root.classList.remove('intro'); })
      .to(s.q('.room'), { autoAlpha: 1, duration: 1.4, ease: 'power1.inOut' }, 0.35)
      .to(s.q('.bar'), { scaleY: 0, duration: 1.2, ease: 'expo.inOut' }, 0.2)
      .to(s.q('.mon-meta, .corner'), { autoAlpha: 1, duration: 0.4, stagger: 0.05 }, 1.1);
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
  var film = null; // { rests: [], max }

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

      if (id === 'contact') {
        // 7. Contact: het beeld uit de opening komt terug, de sluiter gaat helemaal dicht en het podium
        //    verdwijnt. Klaar vóór het rustpunt, zodat formulier en FAQ daarna alleen in beeld staan.
        gsap.timeline({
          defaults: { ease: 'none' },
          // loopt terwijl Contact van onderaf binnenkomt; klaar voordat de tekst het beeld bereikt
          scrollTrigger: { trigger: chapter, start: 'top bottom', end: 'top 65%', scrub: true }
        })
          .fromTo(inner, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0)
          .fromTo(s.q('.bar'), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power2.in' }, 0.1)
          // al vervagen terwijl de sluiter dichtgaat: nooit een vol zwart vlak als je hier stopt
          .to(inner, { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, 0.3);
      } else if (id !== 'opening') {
        gsap.fromTo(inner, { autoAlpha: 0, scale: 0.97 }, {
          autoAlpha: 1, scale: 1, ease: 'none',
          // komt pas op als de vorige scène weg is (die is klaar bij 'bottom 45%' = deze 'top 45%')
          scrollTrigger: { trigger: chapter, start: 'top 45%', end: 'top 15%', scrub: true }
        });
      }
      if (id !== 'contact') {
        // vóór Contact sneller weg: daar neemt de sluitende sluiter het beeld over
        var beforeContact = chapter.nextElementSibling && chapter.nextElementSibling.id === 'contact';
        gsap.fromTo(scene, { autoAlpha: 1 }, {
          autoAlpha: 0, ease: 'none',
          scrollTrigger: {
            trigger: chapter, scrub: true,
            start: beforeContact ? 'bottom bottom' : 'bottom 75%',
            end: beforeContact ? 'bottom 90%' : 'bottom 45%'
          }
        });
      }

      if (SCENES[id]) {
        var tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            // de opbouw begint al tijdens het invaden, zodat een scène nooit als lege huls in beeld staat
            trigger: chapter, start: id === 'opening' ? 'top top' : 'top 45%', end: 'bottom bottom',
            scrub: mobile ? true : 0.6,
            invalidateOnRefresh: true
          }
        });
        SCENES[id](tl, s);
        // bouw eindigt op 90%, zodat het rustpunt een af beeld laat zien
        tl.set({}, {}, tl.duration() / 0.9);
        builds[id] = tl.scrollTrigger;
      }

      if (id === 'opening') {
        if (window.scrollY < window.innerHeight * 0.5) openingIntro(s);
        else root.classList.remove('intro'); // halverwege de pagina binnengekomen: geen intro
      }
    });

    // Geen automatische snap: de bezoeker bepaalt zelf waar hij stopt, zoals bij een video.
    // De rustpunten zijn er alleen voor de tijdlijn-markeringen en ankerlinks.
    ScrollTrigger.create({
      start: 0, end: 'max',
      onRefresh: function () { measure(builds); }
    });

    return function () {
      root.classList.remove('film-on', 'intro');
      film = null;
    };
  });

  // Tijdcode, afspeelkop en actief hoofdstuk volgen de scrollpositie in beide modi
  // (ook bij reduced motion: het is een voortgangsindicator, geen decoratieve beweging).
  ScrollTrigger.create({
    start: 0, end: 'max',
    onRefresh: function (self) { sizeClips(); update(self); },
    onUpdate: update
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
    film = { rests: rests, max: max };
  }

  // clipbreedtes op de tijdlijn volgen de echte scrolllengte per hoofdstuk
  function sizeClips() {
    var vh = window.innerHeight;
    var max = ScrollTrigger.maxScroll(window);
    chapters.forEach(function (ch, i) {
      var li = links[i] && links[i].parentNode;
      if (!li) return;
      var next = chapters[i + 1] ? chapters[i + 1].offsetTop : max + vh;
      var len = Math.max(next - ch.offsetTop - (chapters[i + 1] ? 0 : vh), vh * 0.4);
      li.style.flexGrow = String(len);
    });
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

  /* ---------- Ankerlinks (tijdlijn, menu, oude homepage-ankers): naar het juiste hoofdstuk ---------- */
  // Oude ankers van de vorige homepage blijven werken (links van buitenaf, bladwijzers).
  var ALIASES = { werkwijze: 'media', voorbeeld: 'media', prijzen: 'prijs' };

  function targetFor(hash) {
    var id = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (!id) return null;
    id = ALIASES[id] || id;
    var el = document.getElementById(id);
    if (!el) return null;
    var i = chapters.indexOf(el);
    return { el: el, id: id, index: i };
  }

  function scrollYFor(t) {
    if (t.index >= 0) return film.rests[t.index];
    // iets binnen een hoofdstuk (bv. #faq in Contact): net onder de header
    var hdr = document.querySelector('.hdr').offsetHeight;
    return t.el.getBoundingClientRect().top + window.scrollY - hdr - 16;
  }

  function jumpTo(t, smooth) {
    var heading = t.index >= 0 ? t.el.querySelector('h1, h2') : t.el.querySelector('h2, h3') || t.el;
    var y = Math.max(0, scrollYFor(t));
    var done = function () { if (heading) heading.focus({ preventScroll: true }); };
    if (!smooth) { window.scrollTo(0, y); return; }
    var dist = Math.abs(window.scrollY - y) / window.innerHeight;
    gsap.to(window, {
      scrollTo: { y: y, autoKill: true },
      duration: Math.min(1.8, 0.5 + dist * 0.18),
      ease: 'power2.inOut',
      onComplete: done
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!a || !film) return; // statisch: de browser springt zelf (aliassen staan als id in de HTML)
    var t = targetFor(a.getAttribute('href').replace(/^\//, ''));
    if (!t) return;
    e.preventDefault();
    jumpTo(t, true);
    history.replaceState(null, '', '#' + t.id);
  });

  // Direct binnenkomen op /#media (of een oud anker zoals /#prijzen): naar het rustpunt.
  window.addEventListener('load', function () {
    if (!film || !location.hash) return;
    var t = targetFor(location.hash);
    if (t && t.index !== 0) jumpTo(t, false);
  });

  /* ---------- Formulier: zelfde velden en functie als het oude formulier op de homepage ---------- */
  function setupForm() {
    var form = document.getElementById('lead-form');
    if (!form || !window.fetch) return; // zonder fetch post het formulier gewoon naar de function
    var done = document.getElementById('lead-done');
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        naam: form.naam.value.trim(),
        contact: form.contact.value.trim(),
        materiaal: form.materiaal.value,
        type: form.type.value,
        aantalFotos: form.aantalFotos.value.trim(),
        bericht: form.bericht.value.trim(),
        'bot-field': form['bot-field'].value
      };
      btn.disabled = true;
      btn.textContent = 'Versturen...';
      status.hidden = true;

      fetch('/.netlify/functions/send-video-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { if (!res.ok) throw new Error('status ' + res.status); })
        .then(function () {
          form.hidden = true;
          done.hidden = false;
          done.focus();
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        })
        .catch(function () {
          var text = encodeURIComponent('Hoi! Het formulier lukte niet, dus ik stuur het zo. Mijn naam is ' + (data.naam || '...') + '.');
          status.innerHTML = '<p>Versturen is niet gelukt. Je gegevens staan er nog. Probeer het opnieuw, of stuur ons direct een bericht.</p>' +
            '<p><a class="link" href="https://wa.me/31634455762?text=' + text + '" target="_blank" rel="noopener">Stuur via WhatsApp</a></p>';
          status.hidden = false;
          btn.disabled = false;
          btn.textContent = label;
        });
    });
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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) set(false, true);
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    var onWide = function () { if (wide.matches) set(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  }

  /* ---------- Prijs: één bron (de tekst in hoofdstuk Prijs), overgenomen in het exportvenster ---------- */
  function fillPrice() {
    var now = document.querySelector('[data-price]');
    var was = document.querySelector('[data-price-was]');
    Array.prototype.forEach.call(document.querySelectorAll('[data-price-copy]'), function (el) {
      var src = el.getAttribute('data-price-copy') === 'was' ? was : now;
      if (src) el.textContent = src.textContent.trim();
      else if (el.getAttribute('data-price-copy') === 'was') el.remove();
    });
  }

  /* ---------- WhatsApp-knop: weg als het toetsenbord open is ---------- */
  function setupFab() {
    var fab = document.querySelector('.wa-fab');
    if (!fab) return;
    var coarse = window.matchMedia('(pointer: coarse)');
    document.addEventListener('focusin', function (e) {
      if (coarse.matches && e.target.matches('input, textarea, select')) fab.classList.add('is-tucked');
    });
    document.addEventListener('focusout', function () { fab.classList.remove('is-tucked'); });

    // Mobiel: zolang Contact (formulier + FAQ, over de volle breedte) in beeld is, gaat de knop opzij,
    // anders dekt hij de rechterkant van velden af. WhatsApp blijft bereikbaar via de links in Contact.
    var contact = document.getElementById('contact');
    if (!contact) return;
    var narrow = window.matchMedia('(max-width: 767px)');
    var band = document.querySelector('.stage-band');
    var lastK = 1;
    var sync = function () {
      var r = contact.getBoundingClientRect();
      var inView = r.top < window.innerHeight * 0.85 && r.bottom > 0;
      fab.classList.toggle('is-away', narrow.matches && inView);
      // beeldband (mobiel): onderrand volgt de bovenkant van Contact zodra die de band bereikt
      if (band && narrow.matches) {
        var top = band.getBoundingClientRect().top, h = band.offsetHeight || 1;
        var k = Math.max(0, Math.min(1, (r.top - top) / h));
        if (k !== lastK) { band.style.transform = k === 1 ? '' : 'scaleY(' + k.toFixed(4) + ')'; lastK = k; }
      }
    };
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
})();
