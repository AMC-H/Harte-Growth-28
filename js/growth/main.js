/* HarteGrowth homepage: animatic van het groeisysteem.
 *
 * Modules:
 *   layout.js  wereldgeometrie (ring met stations) + camera
 *   stage.js   persistente stage: camera op de DOM-wereld, wereld-canvas, Growth Signal-canvas
 *   story.js   één master-tijdlijn, negen hoofdstukken
 *   chrome.js  header-tijdlijn/tijdcode, ankers, menu, WhatsApp-knop
 *
 * Scroll stuurt alleen de voortgang van de master-tijdlijn. Met prefers-reduced-motion blijft de stage
 * staan zonder beweging: per hoofdstuk springt hij naar het rustbeeld (geen scrub, geen deeltjesstroom).
 * Zonder GSAP blijft een gewone tekstpagina over (de stage staat dan uit via CSS).
 */
import { makeLayout } from './layout.js';
import { createStage } from './stage.js';
import { buildStory, HOLD } from './story.js';
import { setupChrome, setupTimeline } from './chrome.js';

var chrome = setupChrome();
var gsap = window.gsap, ST = window.ScrollTrigger;

if (gsap && ST) {
  gsap.registerPlugin(ST);
  if (window.ScrollToPlugin) gsap.registerPlugin(window.ScrollToPlugin);
  ST.config({ ignoreMobileResize: true });
  run();
}

function run() {
  var root = document.documentElement;
  var story = document.getElementById('story');
  var sections = Array.prototype.slice.call(story.querySelectorAll(':scope > .ch'));
  var rests = null;
  var killTimeline = setupTimeline(chrome, function () { return rests; });
  void killTimeline;

  var mm = gsap.matchMedia();
  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)',
    mobile: '(max-width: 767px)'
  }, function (ctx) {
    var reduce = ctx.conditions.reduce, mobile = ctx.conditions.mobile;
    root.classList.toggle('reduce', !!reduce);
    var L = makeLayout(mobile);
    var stage = createStage(L, { motion: !reduce });
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    var marks = buildStory(tl, stage, sections);

    // rustpunten (scrollpositie) per hoofdstuk + de Scan-sectie, voor ankerlinks en de tijdlijn
    function measure() {
      var H = story.offsetHeight;
      rests = sections.map(function (sec) {
        var tt = marks.starts[sec.id] + HOLD[sec.id] * marks.lens[sec.id];
        return tt / marks.total * H;
      });
      rests.push(document.getElementById('scan').offsetTop);
    }

    // CTA: de stage dimt (nooit naar zwart) zodat de Scan leesbaar is; het systeem blijft zichtbaar
    var dim = stage.root.querySelector('.fx-dim');

    if (!reduce) {
      ST.create({
        trigger: story, start: 'top top', end: 'bottom top',
        scrub: mobile ? true : 0.8, animation: tl,
        onRefresh: measure
      });
      gsap.fromTo(dim, { opacity: 0 }, { opacity: 0.55, ease: 'none', scrollTrigger: { trigger: '#scan', start: 'top 90%', end: 'top 30%', scrub: true } });
      if (window.scrollY < window.innerHeight * 0.4) intro(stage);
    } else {
      // diavoorstelling zonder beweging: per hoofdstuk het rustbeeld
      var show = function (i) {
        var sec = sections[i];
        tl.seek(marks.starts[sec.id] + HOLD[sec.id] * marks.lens[sec.id], false);
        stage.render();
      };
      sections.forEach(function (sec, i) {
        ST.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: function (self) { if (self.isActive) show(i); } });
      });
      ST.create({ trigger: '#scan', start: 'top 60%', onToggle: function (self) { dim.style.opacity = self.isActive ? '0.55' : '0'; } });
      ST.create({ start: 0, end: 'max', onRefresh: measure });
      show(0);
    }
    // ondertitels: alleen die van het actieve hoofdstuk staat in beeld
    var caps = sections.map(function (sec) { return sec.querySelector('.cap'); });
    sections.forEach(function (sec, i) {
      ST.create({
        trigger: sec, start: 'top 20%', end: 'bottom 20%',
        onToggle: function (self) { caps[i].classList.toggle('is-on', self.isActive); }
      });
    });
    root.classList.add('stage-ready');

    return function () {
      stage.destroy();
      root.classList.remove('stage-ready', 'reduce');
      caps.forEach(function (c) { c.classList.remove('is-on'); });
    };
  });
}

// Binnenkomst: sluiter opent, het signaal ontstaat (los van de scrolltijdlijn, alleen bij beweging)
function intro(stage) {
  var r = stage.root;
  var S = stage.state;
  gsap.timeline()
    .set(r.querySelectorAll('.fx-bar'), { scaleY: 1 })
    .set(S, { birth: 0 })
    .set(r.querySelector('.t-origin-in'), { autoAlpha: 0, y: 16 })
    .to(r.querySelectorAll('.fx-bar'), { scaleY: 0, duration: 1.3, ease: 'expo.inOut' }, 0.15)
    .to(S, { birth: 1, duration: 0.9, ease: 'power2.out' }, 0.7)
    .to(r.querySelector('.t-origin-in'), { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.0);
}
