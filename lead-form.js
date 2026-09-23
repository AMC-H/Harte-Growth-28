// Contactformulier op index.html: de React-build rendert het formulier zonder verzendlogica.
// Dit script vult het aan met de velden van het oude video-formulier en post naar
// /.netlify/functions/send-video-lead (zelfde payload als voorheen).
(function () {
  var ENDPOINT = '/.netlify/functions/send-video-lead';
  var WA = 'https://wa.me/31634455762';
  var VIDEO_TOPIC = 'short-content';

  var FIELD_CLS = 'px-3.5 py-2.5 rounded-lg border border-hg-line bg-hg-surface text-hg-ink placeholder:text-hg-ink-faint focus:outline-none focus:border-hg-accent/50 focus:ring-1 focus:ring-hg-accent/30 transition';
  var SELECT_CLS = 'w-full appearance-none px-3.5 py-2.5 pr-10 rounded-lg border border-hg-line bg-hg-surface text-hg-ink focus:outline-none focus:border-hg-accent/50 focus:ring-1 focus:ring-hg-accent/30 transition cursor-pointer';
  var LABEL_CLS = 'font-mono text-[0.6rem] uppercase tracking-wider text-hg-ink-soft';
  var CHEVRON = '<div class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5" stroke="#5E6368" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';

  function selectField(id, name, label, options) {
    var opts = options.map(function (o) { return '<option>' + o + '</option>'; }).join('');
    return '<div class="flex flex-col gap-1"><label class="' + LABEL_CLS + '" for="' + id + '">' + label + '</label>' +
      '<div class="relative"><select id="' + id + '" name="' + name + '" class="' + SELECT_CLS + '" style="-webkit-appearance:none;-moz-appearance:none">' + opts + '</select>' + CHEVRON + '</div></div>';
  }

  function enhance(form) {
    if (form.dataset.enhanced) return;
    form.dataset.enhanced = '1';

    // Labels koppelen aan hun veld (ontbreekt in de build).
    Array.prototype.forEach.call(form.querySelectorAll('.flex.flex-col.gap-1'), function (wrap) {
      var label = wrap.querySelector('label');
      var field = wrap.querySelector('input, select, textarea');
      if (label && field && !field.id) {
        field.id = 'lf-' + field.name;
        label.setAttribute('for', field.id);
      }
    });

    var topic = form.querySelector('[name="onderwerp"]');
    var topicWrap = topic.closest('.flex.flex-col.gap-1');

    var video = document.createElement('div');
    video.className = 'flex flex-col gap-3';
    video.innerHTML =
      selectField('lf-materiaal', 'materiaal', 'Wat stuur je?', ["Foto's", 'Video', 'Allebei']) +
      selectField('lf-type', 'type', 'Waar is het van?', ['Woning', 'Airbnb-verhuur', "Auto's", 'Horeca', 'Product / webshop', 'Evenement', 'Anders']) +
      '<div class="flex flex-col gap-1"><label class="' + LABEL_CLS + '" for="lf-aantal">Hoeveelheid materiaal</label>' +
      '<input id="lf-aantal" name="aantalFotos" type="text" placeholder="Bijv. 6 foto\'s, of 2 clips van 30 sec" class="' + FIELD_CLS + '"></div>';
    topicWrap.parentNode.insertBefore(video, topicWrap.nextSibling);

    var trap = document.createElement('p');
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-9999px;';
    trap.innerHTML = '<label>Laat dit veld leeg: <input name="bot-field" tabindex="-1" autocomplete="off"></label>';
    form.appendChild(trap);

    function syncVideoFields() {
      // style.display, niet .hidden: Tailwinds .flex overschrijft [hidden] in deze build.
      video.style.display = topic.value === VIDEO_TOPIC ? '' : 'none';
    }
    topic.addEventListener('change', syncVideoFields);
    syncVideoFields();

    var status = document.createElement('div');
    status.setAttribute('role', 'alert');
    status.className = 'text-sm leading-relaxed';
    status.hidden = true;
    form.appendChild(status);

    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn.textContent;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var isVideo = topic.value === VIDEO_TOPIC;
      var topicLabel = topic.options[topic.selectedIndex].text;
      var note = form.bericht.value.trim();

      var data = {
        naam: form.naam.value.trim(),
        contact: form.contact.value.trim(),
        materiaal: isVideo ? form.materiaal.value : '',
        type: isVideo ? form.type.value : '',
        aantalFotos: isVideo ? form.aantalFotos.value.trim() : '',
        bericht: 'Onderwerp: ' + topicLabel + (note ? '\n\n' + note : ''),
        'bot-field': form['bot-field'].value
      };

      btn.disabled = true;
      btn.textContent = 'Versturen...';
      status.hidden = true;

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { if (!res.ok) throw new Error('status ' + res.status); })
        .then(function () {
          var done = document.createElement('div');
          done.setAttribute('role', 'status');
          done.tabIndex = -1;
          done.innerHTML = '<p class="text-lg font-bold mb-2">Aanvraag verstuurd.</p>' +
            '<p class="text-sm text-hg-ink-soft leading-relaxed">We reageren dezelfde dag. Bestanden kun je alvast sturen via een WeTransfer- of Google Drive-link.</p>';
          form.style.display = 'none';
          form.parentNode.insertBefore(done, form.nextSibling);
          done.focus();
        })
        .catch(function () {
          var text = encodeURIComponent('Hoi! Ik probeerde het formulier te versturen maar dat lukte niet. Mijn naam is ' + (data.naam || '...') + '.');
          status.innerHTML = '<p class="text-hg-ink">Versturen is niet gelukt. Je gegevens staan er nog, probeer het opnieuw of stuur ons direct een bericht.</p>' +
            '<a class="mt-2 inline-flex items-center gap-2 font-semibold text-hg-accent hover:underline" href="' + WA + '?text=' + text + '" target="_blank" rel="noopener">Stuur via WhatsApp</a>';
          status.hidden = false;
          btn.disabled = false;
          btn.textContent = btnLabel;
        });
    });
  }

  function find() {
    var form = document.getElementById('lead-form');
    if (form) { enhance(form); return true; }
    return false;
  }

  function start() {
    if (find()) return;
    var root = document.getElementById('root') || document.body;
    var mo = new MutationObserver(function () { if (find()) mo.disconnect(); });
    mo.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
