/* Alles rond de film: header-tijdlijn met tijdcode, ankerlinks naar rustpunten, menu en WhatsApp-knop.
 * Overgenomen uit film.js (zelfde gedrag), alleen losgemaakt van de oude scène-opbouw.
 */
var FILM_SECONDS = 90, FPS = 25;
// Oude homepage-ankers blijven werken (links van buitenaf, bladwijzers)
var ALIASES = {
  media: 'create', werkwijze: 'create', voorbeeld: 'create', fundament: 'capture', verkeer: 'attract',
  opvolging: 'operate', prijs: 'scan', prijzen: 'scan', contact: 'scan', faq: 'scan'
};

export function setupChrome() {
  setupMenu();
  setupFab();
  return { rests: null };
}

export function setupTimeline(chrome, getRests) {
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var targets = Array.prototype.slice.call(document.querySelectorAll('#story > .ch, #scan'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.tl-clips a'));
  var tcEl = document.getElementById('tc'), nowEl = document.getElementById('tl-now');
  var fill = document.querySelector('.tl-fill'), head = document.querySelector('.tl-head');
  var root = document.documentElement;
  var lastFrame = -1, lastActive = -1;

  function sizeClips() {
    var max = ST.maxScroll(window);
    targets.forEach(function (el, i) {
      var li = links[i] && links[i].parentNode;
      if (!li) return;
      var next = targets[i + 1] ? targets[i + 1].offsetTop : max + window.innerHeight;
      li.style.flexGrow = String(Math.max(next - el.offsetTop, window.innerHeight * 0.5));
    });
  }
  function update(self) {
    var p = self.progress || 0;
    root.classList.toggle('has-scrolled', window.scrollY > 8);
    fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    head.style.transform = 'translateX(' + (p * 100).toFixed(3) + '%)';
    var frame = Math.round(p * FILM_SECONDS * FPS);
    if (frame !== lastFrame) { lastFrame = frame; tcEl.textContent = timecode(frame); }
    var y = window.scrollY + window.innerHeight * 0.5, active = 0;
    targets.forEach(function (el, i) { if (el.offsetTop <= y) active = i; });
    if (active !== lastActive) {
      lastActive = active;
      links.forEach(function (a, i) { if (i === active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      if (nowEl && links[active]) nowEl.textContent = links[active].textContent.trim();
    }
  }
  var st = ST.create({ start: 0, end: 'max', onRefresh: function (self) { sizeClips(); update(self); }, onUpdate: update });

  function targetFor(hash) {
    var id = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (!id) return null;
    id = ALIASES[id] || id;
    var el = document.getElementById(id);
    if (!el) return null;
    return { el: el, id: id, index: targets.indexOf(el) };
  }
  function jumpTo(t, smooth) {
    var rests = getRests();
    var y = t.index >= 0 && rests ? rests[t.index] : t.el.getBoundingClientRect().top + window.scrollY;
    y = Math.max(0, Math.min(ST.maxScroll(window), y));
    var heading = t.el.querySelector('h1, h2');
    var done = function () { if (heading) heading.focus({ preventScroll: true }); };
    if (!smooth || !gsap.plugins || !window.ScrollToPlugin) { window.scrollTo(0, y); done(); return; }
    var dist = Math.abs(window.scrollY - y) / window.innerHeight;
    gsap.to(window, { scrollTo: { y: y, autoKill: true }, duration: Math.min(2.2, 0.6 + dist * 0.12), ease: 'power2.inOut', onComplete: done });
  }
  function onClick(e) {
    var a = e.target.closest && e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!a) return;
    var t = targetFor(a.getAttribute('href').replace(/^\//, ''));
    if (!t) return;
    e.preventDefault();
    jumpTo(t, !root.classList.contains('reduce'));
    history.replaceState(null, '', '#' + t.id);
  }
  document.addEventListener('click', onClick);
  function onLoad() {
    if (!location.hash) return;
    var t = targetFor(location.hash);
    if (t && t.index !== 0) jumpTo(t, false);
  }
  if (document.readyState === 'complete') setTimeout(onLoad, 50); else window.addEventListener('load', onLoad, { once: true });

  return function () { st.kill(); document.removeEventListener('click', onClick); };
}

function timecode(frame) {
  var ff = frame % FPS, total = Math.floor(frame / FPS);
  var ss = total % 60, mm = Math.floor(total / 60) % 60, hh = Math.floor(total / 3600);
  return [hh, mm, ss, ff].map(function (n) { return n < 10 ? '0' + n : String(n); }).join(':');
}

function setupMenu() {
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('hdr-menu');
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
  document.addEventListener('click', function (e) { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false); });
  var onWide = function () { if (wide.matches) set(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
}

function setupFab() {
  var fab = document.querySelector('.wa-fab'), scan = document.getElementById('scan');
  if (!fab) return;
  var coarse = window.matchMedia('(pointer: coarse)'), narrow = window.matchMedia('(max-width: 767px)');
  document.addEventListener('focusin', function (e) { if (coarse.matches && e.target.matches('input, textarea, select')) fab.classList.add('is-tucked'); });
  document.addEventListener('focusout', function () { fab.classList.remove('is-tucked'); });
  if (!scan) return;
  var sync = function () {
    var r = scan.getBoundingClientRect();
    fab.classList.toggle('is-away', narrow.matches && r.top < window.innerHeight * 0.85 && r.bottom > 0);
  };
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
}
