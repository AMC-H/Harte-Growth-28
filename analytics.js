/* ==========================================================================
   Harte Growth — Analytics
   Google Analytics 4 (G-CTTE9ELR2N) + Microsoft Clarity (xxr37zcdrf)
   Consent Mode v2 · standaard alles denied tot bezoeker kiest.
   ========================================================================== */
(function(){
  'use strict';

  var GA_ID       = 'G-CTTE9ELR2N';
  var CLARITY_ID  = 'xxr37zcdrf';
  var CONSENT_KEY = 'hg_consent_v1';

  /* ---------- Consent Mode v2: default denied, vóór GA laadt ---------- */
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

  /* ---------- GA4 loader (Consent Mode zorgt dat er niks getrackt wordt tot granted) ---------- */
  (function(){
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true, send_page_view: true });
  })();

  /* ---------- Microsoft Clarity loader (Consent v2 zorgt voor gating) ---------- */
  (function(c,l,a,r,i,t,y){
    c[a] = c[a] || function(){ (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
  /* start denied — pas na consent granted worden er cookies gezet */
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });

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
    gtag('consent', 'update', {
      'analytics_storage': analytics,
      'ad_storage': marketing,
      'ad_user_data': marketing,
      'ad_personalization': marketing
    });
    window.clarity('consentv2', {
      ad_Storage: marketing,
      analytics_Storage: analytics
    });
  }

  /* ---------- Bij pageload: bewaarde keuze toepassen, anders banner tonen ---------- */
  var stored = readConsent();
  if (stored) applyConsent(stored);

  /* ---------- Publieke tracker (voor form-events uit script.js) ---------- */
  window.hgTrack = function(eventName, params){
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  };

  /* ---------- Auto-tracking van klikken (WhatsApp / tel / mail) ---------- */
  document.addEventListener('click', function(e){
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
     Cookie banner UI  (huisstijl-conform, alleen shown als geen keuze bewaard)
     ========================================================================== */
  var LANG = (document.documentElement.lang || 'nl').slice(0,2).toLowerCase();
  var T = {
    nl: {
      title: 'Cookies',
      body: 'We gebruiken alleen technische cookies. Met jouw toestemming ook cookies voor Google Analytics en Microsoft Clarity, waarmee we anoniem meten wat werkt op de site. Geen advertentiecookies.',
      accept: 'Alles accepteren',
      decline: 'Alles weigeren',
      prefs: 'Voorkeuren',
      analytics_label: 'Analyse (GA4 + Clarity)',
      marketing_label: 'Marketing (uit — we gebruiken dit niet)',
      save: 'Bewaar keuze',
      manage: 'Cookies beheren'
    },
    en: {
      title: 'Cookies',
      body: 'We use technical cookies only. With your consent also cookies for Google Analytics and Microsoft Clarity, so we can anonymously measure what works on the site. No advertising cookies.',
      accept: 'Accept all',
      decline: 'Decline all',
      prefs: 'Preferences',
      analytics_label: 'Analytics (GA4 + Clarity)',
      marketing_label: 'Marketing (off — we do not use this)',
      save: 'Save choice',
      manage: 'Manage cookies'
    },
    es: {
      title: 'Cookies',
      body: 'Usamos solo cookies técnicas. Con tu consentimiento también cookies de Google Analytics y Microsoft Clarity para medir de forma anónima qué funciona en el sitio. Sin cookies publicitarias.',
      accept: 'Aceptar todo',
      decline: 'Rechazar todo',
      prefs: 'Preferencias',
      analytics_label: 'Analítica (GA4 + Clarity)',
      marketing_label: 'Marketing (desactivado — no lo usamos)',
      save: 'Guardar elección',
      manage: 'Gestionar cookies'
    }
  }[LANG] || null;
  if (!T) return;

  function buildBanner(){
    if (document.getElementById('hg-cookie-banner')) return document.getElementById('hg-cookie-banner');
    var wrap = document.createElement('div');
    wrap.id = 'hg-cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', T.title);
    wrap.innerHTML =
      '<div class="hg-cc-inner">' +
        '<div class="hg-cc-text">' +
          '<div class="hg-cc-title">' + T.title + '</div>' +
          '<p class="hg-cc-body">' + T.body + '</p>' +
        '</div>' +
        '<div class="hg-cc-actions">' +
          '<button type="button" class="hg-cc-btn hg-cc-btn-ghost" data-hg="prefs">' + T.prefs + '</button>' +
          '<button type="button" class="hg-cc-btn hg-cc-btn-ghost" data-hg="decline">' + T.decline + '</button>' +
          '<button type="button" class="hg-cc-btn hg-cc-btn-primary" data-hg="accept">' + T.accept + '</button>' +
        '</div>' +
        '<div class="hg-cc-prefs" hidden>' +
          '<label class="hg-cc-toggle">' +
            '<input type="checkbox" id="hg-cc-analytics" checked>' +
            '<span>' + T.analytics_label + '</span>' +
          '</label>' +
          '<label class="hg-cc-toggle hg-cc-disabled">' +
            '<input type="checkbox" id="hg-cc-marketing" disabled>' +
            '<span>' + T.marketing_label + '</span>' +
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
      else if (action === 'prefs') wrap.querySelector('.hg-cc-prefs').hidden = false;
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
