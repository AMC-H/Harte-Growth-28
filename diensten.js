/* Harte Growth, diensten.
 * Gewone verkooppagina: geen scroll-film. Deze file doet alleen:
 * menu, WhatsApp-knop, de voortgangsbalk in de header (met sectienamen) en één keer de verbindingslijn van de werkwijze.
 * Zonder JS werkt alles; de balk blijft dan stil staan en de lijn is meteen zichtbaar (.js ontbreekt).
 */
(function () {
  'use strict';

  var toArray = function (l) { return Array.prototype.slice.call(l); };

  setupMenu();
  setupFab();
  setupProgress();
  setupReveal();

  /* ---------- Voortgangsbalk: vulling, afspeelkop en actieve sectie ---------- */
  function setupProgress() {
    var links = toArray(document.querySelectorAll('.tl-clips a'));
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var fill = document.querySelector('.tl-fill');
    var head = document.querySelector('.tl-head');
    var nowEl = document.getElementById('tl-now');
    if (!links.length || sections.indexOf(null) > -1) return;

    var tops = [], max = 1, active = -1, ticking = false;

    // elk blok in de balk zo breed als zijn sectie lang is
    function measure() {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      tops = sections.map(function (s) { return s.getBoundingClientRect().top + window.scrollY; });
      sections.forEach(function (s, i) {
        var next = i + 1 < sections.length ? tops[i + 1] : document.documentElement.scrollHeight;
        links[i].parentNode.style.flexGrow = String(Math.max(1, next - tops[i]));
      });
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
    measure();
  }

  /* ---------- Werkwijze: de verbindingslijn trekt één keer door ---------- */
  function setupReveal() {
    var steps = document.querySelector('.steps');
    if (!steps) return;
    if (!('IntersectionObserver' in window)) { steps.classList.add('is-in'); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { steps.classList.add('is-in'); io.disconnect(); }
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(steps);
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
