/* ==========================================================================
   Harte Growth — Analytics
   Google Analytics 4 (G-CTTE9ELR2N) + Microsoft Clarity (xxr37zcdrf)
   AVG-compliant: geen enkele 3rd-party script wordt geladen vóór toestemming.
   Consent Mode v2 default = alles denied.
   ========================================================================== */
(function(){
  'use strict';

  var GA_ID       = 'G-CTTE9ELR2N';
  var CLARITY_ID  = 'xxr37zcdrf';
  var CONSENT_KEY = 'hg_consent_v1';

  /* ---------- Consent Mode v2: default denied (register vóór eventuele script-load) ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
  });

  /* ---------- State: hebben we scripts al geladen deze pageload? ---------- */
  var gaLoaded = false;
  var clarityLoaded = false;

  function loadGA(){
    if (gaLoaded) return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true, send_page_view: true });
  }

  function loadClarity(){
    if (clarityLoaded) return;
    clarityLoaded = true;
    (function(c,l,a,r,i,t,y){
      c[a] = c[a] || function(){ (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    /* Clarity ontvangt meteen ná load de consent-status via applyConsent */
  }

  /* ---------- Consent state helpers ---------- */
  function saveConsent(state){
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(state)); } catch(e){}
  }
  function readConsent(){
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); }
    catch(e){ return null; }
  }
  function applyConsent(state){
    var analytics = state.analytics ? 'granted' : 'denied';
    var marketing = state.marketing ? 'granted' : 'denied';

    /* 1. Update Consent Mode signalen (voor GA — als geladen straks worden events legitiem) */
    gtag('consent', 'update', {
      'analytics_storage': analytics,
      'ad_storage': marketing,
      'ad_user_data': marketing,
      'ad_personalization': marketing
    });

    /* 2. Scripts ALLEEN laden als analytics-consent verleend. Zonder consent geen script-tag,
          geen request naar Google/Microsoft servers, geen IP-lek. */
    if (state.analytics) {
      loadGA();
      loadClarity();
      if (typeof window.clarity === 'function') {
        window.clarity('consentv2', { ad_Storage: marketing, analytics_Storage: analytics });
      }
    }
  }

  /* ---------- Bij pageload: bewaarde keuze toepassen, anders NIETS laden ---------- */
  var stored = readConsent();
  if (stored) applyConsent(stored);
  /* Geen stored consent = geen script-laden. Punt. */

  /* ---------- Publieke tracker (voor form-events uit script.js) ----------
     Werkt alleen als GA geladen is (dus na consent). Anders no-op. */
  window.hgTrack = function(eventName, params){
    if (typeof window.gtag === 'function' && gaLoaded) {
      window.gtag('event', eventName, params || {});
    }
  };

  /* ---------- Auto-tracking van klikken (WhatsApp / tel / mail) — no-op zonder consent ---------- */
  document.addEventListener('click', function(e){
    if (!gaLoaded) return;
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var loc  = a.closest('footer') ? 'footer'
             : a.closest('header') ? 'header'
             : a.closest('.wa-float') || a.classList.contains('wa-float') ? 'float'
             : 'body';
    if (/^https?:\/\/(?:api\.whatsapp\.com|wa\.me|whatsapp\.com)/i.test(href) || /wa-float/.test(a.className)) {
      window.hgTrack('whatsapp_click', { link_location: loc, page_path: location.pathname });
    } else if (href.indexOf('tel:') === 0) {
      window.hgTrack('phone_click', { link_location: loc, page_path: location.pathname });
    } else if (href.indexOf('mailto:') === 0) {
      window.hgTrack('email_click', { link_location: loc, page_path: location.pathname });
    }
  }, { passive: true });

  /* ==========================================================================
     Cookie banner UI (huisstijl-conform, alleen shown als geen keuze bewaard)
     ========================================================================== */
  var LANG = (document.documentElement.lang || 'nl').slice(0,2).toLowerCase();
  var T = {
    nl: {
      body: 'We plaatsen alleen analytische cookies (GA4 + Clarity), en alleen als jij dat wilt. <a href="/privacy" style="color:#ff4d1a;">Privacy</a> · <a href="/cookies" style="color:#ff4d1a;">Cookies</a>',
      accept: 'Accepteren',
      decline: 'Weigeren',
      prefs: 'Meer opties',
      analytics_label: 'Analyse (GA4 + Clarity)',
      save: 'Bewaar'
    },
    en: {
      body: 'We use analytics cookies only (GA4 + Clarity), and only if you say yes. <a href="/privacy" style="color:#ff4d1a;">Privacy</a> · <a href="/cookies" style="color:#ff4d1a;">Cookies</a>',
      accept: 'Accept',
      decline: 'Decline',
      prefs: 'More options',
      analytics_label: 'Analytics (GA4 + Clarity)',
      save: 'Save'
    },
    es: {
      body: 'Usamos solo cookies analíticas (GA4 + Clarity), y solo si tú aceptas. <a href="/privacy" style="color:#ff4d1a;">Privacidad</a> · <a href="/cookies" style="color:#ff4d1a;">Cookies</a>',
      accept: 'Aceptar',
      decline: 'Rechazar',
      prefs: 'Más opciones',
      analytics_label: 'Analítica (GA4 + Clarity)',
      save: 'Guardar'
    }
  }[LANG] || null;
  if (!T) return;

  function buildBanner(){
    if (document.getElementById('hg-cookie-banner')) return document.getElementById('hg-cookie-banner');
    var wrap = document.createElement('div');
    wrap.id = 'hg-cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Cookies');
    wrap.innerHTML =
      '<div class="hg-cc-inner">' +
        '<p class="hg-cc-body">' + T.body + '</p>' +
        '<div class="hg-cc-actions">' +
          '<button type="button" class="hg-cc-btn hg-cc-btn-ghost" data-hg="decline">' + T.decline + '</button>' +
          '<button type="button" class="hg-cc-btn hg-cc-btn-primary" data-hg="accept">' + T.accept + '</button>' +
        '</div>' +
        '<button type="button" class="hg-cc-more" data-hg="prefs">' + T.prefs + '</button>' +
        '<div class="hg-cc-prefs" hidden>' +
          '<label class="hg-cc-toggle">' +
            /* GDPR: default unchecked */
            '<input type="checkbox" id="hg-cc-analytics">' +
            '<span>' + T.analytics_label + '</span>' +
          '</label>' +
          '<button type="button" class="hg-cc-btn hg-cc-btn-primary" data-hg="save">' + T.save + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function(e){
      var b = e.target.closest('[data-hg]');
      if (!b) return;
      var action = b.getAttribute('data-hg');
      if (action === 'accept') decide({ analytics: true, marketing: false });
      else if (action === 'decline') decide({ analytics: false, marketing: false });
      else if (action === 'prefs') {
        wrap.querySelector('.hg-cc-prefs').hidden = false;
        b.style.display = 'none';
      }
      else if (action === 'save') decide({
        analytics: !!wrap.querySelector('#hg-cc-analytics').checked,
        marketing: false
      });
    });
    return wrap;
  }
  function decide(state){
    saveConsent(state);
    applyConsent(state);
    var b = document.getElementById('hg-cookie-banner');
    if (b) b.remove();
  }
  function showBannerIfNeeded(){
    if (readConsent()) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildBanner);
    } else {
      buildBanner();
    }
  }
  showBannerIfNeeded();

  /* ---------- API om later opnieuw te openen (bijv. via footer-link) ---------- */
  window.hgOpenCookiePrefs = function(){
    try { localStorage.removeItem(CONSENT_KEY); } catch(e){}
    if (document.getElementById('hg-cookie-banner')) return;
    var b = buildBanner();
    b.querySelector('.hg-cc-prefs').hidden = false;
  };

})();
