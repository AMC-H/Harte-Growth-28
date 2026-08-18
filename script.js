document.addEventListener('DOMContentLoaded', () => {

  // HEADER SCROLL
  const header = document.querySelector('header');
  const progressLine = document.querySelector('.progress-line');
  function onScroll(){
    if(header) header.classList.toggle('scrolled', window.scrollY > 20);
    if(progressLine){
      const h = document.documentElement;
      const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      progressLine.style.width = pct + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});

  // MOBILE NAV
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeBtn');
  const mnav = document.getElementById('mnav');
  if(menuBtn && mnav){
    menuBtn.addEventListener('click', () => mnav.classList.add('open'));
    if(closeBtn) closeBtn.addEventListener('click', () => mnav.classList.remove('open'));
    mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mnav.classList.remove('open')));
  }

  // ACTIVE NAV
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a, .mnav a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === path || (path === '' && href === 'index.html')) a.classList.add('active');
    // handle blog subpages as blog nav
    if(path.startsWith('blog-') && href === 'blog.html') a.classList.add('active');
  });

  // SPLIT HEADINGS INTO WORDS (for line-by-line scroll reveal)
  document.querySelectorAll('.split-lines').forEach(el => {
    // wrap each word in a span if not already
    if(el.dataset.split) return;
    el.dataset.split = '1';
    el.innerHTML = el.innerHTML.split('\n').map(line => {
      const words = line.trim().split(/\s+/).map(w => `<span class="word">${w}</span>`).join(' ');
      return `<span class="line">${words}</span>`;
    }).join(' ');
  });

  // REVEAL
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.1, rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.reveal, .stagger, .split-lines').forEach(el => io.observe(el));

  // FAQ
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if(!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; });
      if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  // MAGNETIC BUTTONS
  if(window.matchMedia('(min-width:900px) and (pointer:fine)').matches){
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width/2) * .25;
        const y = (e.clientY - r.top - r.height/2) * .25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
    });
  }

  // ROTATING HERO WORD
  const swap = document.querySelector('.rotate');
  if(swap){
    const words = (swap.dataset.words || 'aanvragen,klanten,omzet').split(',');
    let i = 0, j = 0, del = false;
    function tick(){
      const w = words[i];
      swap.textContent = w.substring(0, j);
      if(!del && j < w.length){ j++; setTimeout(tick, 80); }
      else if(del && j > 0){ j--; setTimeout(tick, 40); }
      else{
        if(!del){ del = true; setTimeout(tick, 1800); }
        else { del = false; i = (i+1) % words.length; setTimeout(tick, 220); }
      }
    }
    tick();
  }

  // GOOGLE MOCK TYPEWRITER
  const gq = document.querySelector('.g-bar .q');
  if(gq){
    const target = gq.dataset.query || "airconditioning installateur costa blanca";
    let idx = 0;
    function typeIt(){
      if(idx <= target.length){
        gq.innerHTML = target.substring(0, idx) + '<span class="cursor"></span>';
        idx++; setTimeout(typeIt, 55);
      }
    }
    const gio = new IntersectionObserver((entries) => {
      if(entries[0].isIntersecting){ typeIt(); gio.disconnect(); }
    }, {threshold:.3});
    const mock = document.querySelector('.google-mock');
    if(mock) gio.observe(mock);
  }

  // WHATSAPP SIMULATION
  const wa = document.querySelector('.wa-mock .wa-body');
  if(wa){
    const messages = [
      {t:'in', text:'Hoi! Ik zag jullie op Google. Kunnen jullie installeren in Moraira?', time:'14:22'},
      {t:'typing'},
      {t:'out', text:'Hallo! Zeker, we werken door heel de Costa Blanca. Deze week donderdag rond 10 uur bellen?', time:'14:23'},
      {t:'in', text:'Top, dan bel ik dan!', time:'14:24'}
    ];
    let mi = 0;
    function nextMsg(){
      if(mi >= messages.length) return;
      const m = messages[mi];
      if(m.t === 'typing'){
        const div = document.createElement('div');
        div.className = 'wa-msg wa-in';
        div.innerHTML = '<span class="wa-typing"><span></span><span></span><span></span></span>';
        wa.appendChild(div);
        setTimeout(() => { div.remove(); mi++; nextMsg(); }, 1500);
      } else {
        const div = document.createElement('div');
        div.className = 'wa-msg ' + (m.t === 'in' ? 'wa-in' : 'wa-out');
        div.innerHTML = m.text + ' <span class="wa-time">'+m.time+'</span>';
        wa.appendChild(div);
        wa.scrollTop = wa.scrollHeight;
        mi++;
        setTimeout(nextMsg, 1300);
      }
    }
    const waIo = new IntersectionObserver((entries) => {
      if(entries[0].isIntersecting){ nextMsg(); waIo.disconnect(); }
    }, {threshold:.3});
    waIo.observe(wa);
  }

  // PARALLAX HERO BG WORDS
  const heroBg = document.querySelector('.hero-bg-words');
  if(heroBg){
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY, 800);
      heroBg.style.transform = `translateY(${y*0.4}px)`;
    }, {passive:true});
  }

  // HORIZONTAL SCROLL PIN — services section
  const hScrollOuter = document.querySelector('.h-scroll-outer');
  const hScrollTrack = document.querySelector('.h-scroll-track');
  if(hScrollOuter && hScrollTrack && window.matchMedia('(min-width:900px)').matches){
    function updateHScroll(){
      const rect = hScrollOuter.getBoundingClientRect();
      const total = hScrollOuter.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      const trackWidth = hScrollTrack.scrollWidth;
      const viewportWidth = window.innerWidth;
      const maxTranslate = trackWidth - viewportWidth + 80;
      hScrollTrack.style.transform = `translateX(${-progress * maxTranslate}px)`;
    }
    window.addEventListener('scroll', updateHScroll, {passive:true});
    window.addEventListener('resize', updateHScroll);
    updateHScroll();
  }

  // TIMELINE FILL ON SCROLL
  const timeline = document.querySelector('.timeline-fill');
  if(timeline){
    const steps = timeline.querySelectorAll('.tl-step');
    const fillPseudo = timeline; // ::after
    function updateTL(){
      const rect = timeline.getBoundingClientRect();
      const viewH = window.innerHeight;
      // Progress: from when top enters viewport (60%) to when bottom exits (top 20%)
      const start = viewH * 0.6;
      const end = -rect.height + viewH * 0.4;
      const prog = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      const totalH = rect.height - 80;
      timeline.style.setProperty('--tl-fill', (prog * totalH) + 'px');
      // step activation
      steps.forEach((s, idx) => {
        const sRect = s.getBoundingClientRect();
        s.classList.toggle('reached', sRect.top < viewH * 0.55);
      });
    }
    // inject actual style rule using CSS var for ::after height
    const styleEl = document.createElement('style');
    styleEl.textContent = '.timeline-fill::after{height:var(--tl-fill,0px)!important;}';
    document.head.appendChild(styleEl);
    window.addEventListener('scroll', updateTL, {passive:true});
    updateTL();
  }

  // PARALLAX FOR ANY [data-parallax] element
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if(parallaxEls.length){
    function updateParallax(){
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || .2;
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if(inView){
          const center = rect.top + rect.height/2 - window.innerHeight/2;
          el.style.transform = `translateY(${center * -speed}px)`;
        }
      });
    }
    window.addEventListener('scroll', updateParallax, {passive:true});
    updateParallax();
  }

  // GROWTH STORY — curve draws progressief mee met scroll, cijfers en stappen in sync
  const growthStory = document.querySelector('.growth-story');
  const growthScroller = document.querySelector('.growth-scroller');
  const growthPath = document.getElementById('growthPath');
  const growthPoint = document.getElementById('growthPoint');
  const growthMetrics = document.querySelectorAll('.growth-metrics .mn');
  const growthSteps = document.querySelectorAll('.gs-step');
  if(growthStory && growthScroller && growthPath){
    const pathLength = growthPath.getTotalLength();
    growthPath.style.strokeDasharray = pathLength;
    growthPath.style.strokeDashoffset = pathLength;
    // geen CSS transition — we sturen de offset direct via scroll
    if(growthPoint){ growthPoint.style.transition = 'opacity .3s ease'; growthPoint.style.opacity = 0; }

    const targets = Array.from(growthMetrics).map(el => ({
      el,
      target: parseFloat(el.dataset.target),
      decimals: parseInt(el.dataset.decimal || 0),
      suffix: el.dataset.suffix || ''
    }));

    function ease(p){ return 1 - Math.pow(1 - p, 2.2); }

    function updateGrowth(){
      const rect = growthScroller.getBoundingClientRect();
      const vh = window.innerHeight;
      // start als top van scroller viewport-midden bereikt, klaar als bottom viewport-midden voorbij is
      const startAt = vh * 0.6;
      const endAt = vh * 0.25;
      const total = rect.height - (startAt - endAt);
      const passed = startAt - rect.top;
      let progress = Math.max(0, Math.min(1, passed / total));

      // curve
      growthPath.style.strokeDashoffset = pathLength * (1 - progress);
      if(growthPoint){ growthPoint.style.opacity = progress > 0.95 ? 1 : 0; }

      // cijfers
      const eased = ease(progress);
      targets.forEach(t => {
        const cur = t.target * eased;
        t.el.textContent = (t.decimals ? cur.toFixed(t.decimals).replace('.', ',') : Math.round(cur).toLocaleString('nl-NL')) + t.suffix;
      });

      // stappen: activeer als hun midden boven viewport-midden komt
      growthSteps.forEach(step => {
        const sr = step.getBoundingClientRect();
        const mid = sr.top + sr.height / 2;
        if(mid < vh * 0.55) step.classList.add('reached');
        else step.classList.remove('reached');
      });
    }

    let gsTicking = false;
    function onGsScroll(){
      if(gsTicking) return;
      gsTicking = true;
      requestAnimationFrame(() => { updateGrowth(); gsTicking = false; });
    }
    window.addEventListener('scroll', onGsScroll, {passive: true});
    window.addEventListener('resize', updateGrowth);
    updateGrowth();
  }

  // BOOKING WIDGET — day + time picker → e-mail via Netlify Function
  const bookDays = document.getElementById('bookDays');
  const bookTimes = document.getElementById('bookTimes');
  const bookForm = document.getElementById('bookForm');
  const bookStatus = document.getElementById('bookStatus');
  if(bookDays && bookTimes && bookForm){
    const dayNames = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
    const monthNames = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
    // Weekdagen die als 'vol' worden getoond (0=zo, 1=ma, ... 6=za)
    const FULL_WEEKDAYS = new Set([4, 5]); // donderdag en vrijdag
    const days = [];
    const cur = new Date();
    cur.setDate(cur.getDate() + 1);
    // Toon 8 werkdagen (inclusief 'vol'-dagen); weekenden altijd overslaan
    while(days.length < 8){
      const d = cur.getDay();
      if(d !== 0 && d !== 6){
        days.push({
          label: dayNames[d],
          num: cur.getDate(),
          mon: monthNames[cur.getMonth()],
          full: FULL_WEEKDAYS.has(d)
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    const times = ['10:00','11:00','14:00','15:00','16:00'];
    let selDay = null, selTime = null;

    days.forEach(d => {
      const btn = document.createElement('button');
      btn.className = 'day-btn' + (d.full ? ' full' : '');
      btn.type = 'button';
      btn.disabled = d.full;
      const badge = d.full ? '<span class="dfull">vol</span>' : '';
      btn.innerHTML = '<span class="dname">'+d.label+'</span><span class="dnum">'+d.num+'</span><span class="dmon">'+d.mon+'</span>'+badge;
      if(!d.full){
        btn.addEventListener('click', () => {
          document.querySelectorAll('.day-btn.active').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selDay = d;
          bookTimes.classList.add('active');
          updateBookStatus();
        });
      }
      bookDays.appendChild(btn);
    });

    times.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'time-btn';
      btn.type = 'button';
      btn.textContent = t;
      btn.addEventListener('click', () => {
        if(!selDay) return;
        document.querySelectorAll('.time-btn.active').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selTime = t;
        bookForm.classList.add('active');
        updateBookStatus();
      });
      bookTimes.appendChild(btn);
    });

    function updateBookStatus(){
      if(!bookStatus) return;
      if(selDay && selTime){
        bookStatus.innerHTML = 'Gekozen moment: <b>'+selDay.label+' '+selDay.num+' '+selDay.mon+' om '+selTime+'</b> — vul je gegevens in';
      } else if(selDay){
        bookStatus.innerHTML = 'Gekozen dag: <b>'+selDay.label+' '+selDay.num+' '+selDay.mon+'</b> — kies nu een tijd';
      }
    }

    bookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if(!selDay || !selTime){ return; }
      const submitBtn = bookForm.querySelector('button[type=submit]');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Versturen...';

      const payload = {
        name: bookForm.querySelector('[name=name]').value.trim(),
        company: bookForm.querySelector('[name=company]').value.trim(),
        contact: bookForm.querySelector('[name=contact]').value.trim(),
        day: selDay.label + ' ' + selDay.num + ' ' + selDay.mon,
        time: selTime
      };

      try {
        const res = await fetch('/.netlify/functions/send-booking', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('send failed');
        bookForm.reset();
        submitBtn.innerHTML = 'Verzonden ✓';
        if(bookStatus){
          bookStatus.innerHTML = '<b style="color:#4ade80;">Bedankt!</b> We bevestigen je gesprek zo snel mogelijk via ' + payload.contact.replace(/</g,'&lt;');
        }
      } catch(err){
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
        if(bookStatus){
          bookStatus.innerHTML = '<b style="color:#ff5c56;">Verzenden lukte niet.</b> Probeer opnieuw of app ons via de knop rechtsonder.';
        }
      }
    });
  }

  // CANVAS BG (only home & main pages — subtle)
  const canvas = document.querySelector('.bg-canvas');
  if(canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const ctx = canvas.getContext('2d');
    let W, H, dots = [];
    function resize(){
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const count = Math.min(50, Math.floor(window.innerWidth * window.innerHeight / 30000));
      dots = [];
      for(let i=0;i<count;i++){
        dots.push({
          x: Math.random()*W, y: Math.random()*H,
          vx: (Math.random()-.5)*.2*devicePixelRatio,
          vy: (Math.random()-.5)*.2*devicePixelRatio,
          r: (Math.random()*1.2+.4)*devicePixelRatio
        });
      }
    }
    function loop(){
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<dots.length;i++){
        for(let j=i+1;j<dots.length;j++){
          const dx = dots[i].x-dots[j].x, dy = dots[i].y-dots[j].y;
          const d = Math.sqrt(dx*dx+dy*dy);
          if(d < 130*devicePixelRatio){
            ctx.strokeStyle = `rgba(255,77,26,${(1 - d/(130*devicePixelRatio))*.12})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(dots[i].x,dots[i].y); ctx.lineTo(dots[j].x,dots[j].y); ctx.stroke();
          }
        }
      }
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if(d.x < 0) d.x = W; if(d.x > W) d.x = 0;
        if(d.y < 0) d.y = H; if(d.y > H) d.y = 0;
        ctx.fillStyle = 'rgba(180,180,190,.35)';
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    window.addEventListener('resize', resize);
    resize(); loop();
  }
});

// =============== GROEISCAN ===============
(function(){
  const scanForm = document.getElementById('scanForm');
  if(!scanForm) return;

  // Taal detecteren via <html lang>
  const LANG = (document.documentElement.lang || 'nl').slice(0,2).toLowerCase();
  const L = ['nl','en','es'].includes(LANG) ? LANG : 'nl';

  // i18n dictionary voor alle scan-strings
  const T = {
    nl: {
      statusConnecting: 'Verbinden met Google Lighthouse...',
      statusReady: 'Rapport klaar.',
      cycle: [
        {cat:'seo', text:'SEO-signalen ophalen...'},
        {cat:'seo', text:'Titel, meta en headings uitlezen'},
        {cat:'perf', text:'Snelheid meten in echte browser'},
        {cat:'perf', text:'Grootste elementen doorlopen'},
        {cat:'mobile', text:'Mobiele viewport testen'},
        {cat:'mobile', text:'Tik-doelen en tekstgrootte checken'},
        {cat:'tech', text:'Technische audits draaien'},
        {cat:'tech', text:'Structured data lezen'}
      ],
      errRate: 'Even geduld: er zijn nu net veel scans tegelijk. Wacht 30 seconden en probeer opnieuw.',
      errNoResult: 'Deze URL kon niet worden gescand. Meestal betekent dit dat de site niet bereikbaar is vanaf Google, of dat er een IP-blokkade staat. Probeer een andere URL.',
      errCrash: 'De scan crashte op deze specifieke site. Vaak helpt: probeer een dieper-liggende pagina (bijv. /diensten in plaats van alleen jouwsite.nl), of probeer over 2 minuten opnieuw. Sommige sites zijn zwaarder om te scannen.',
      errApi: (code) => 'Google gaf een fout terug (' + code + '). Probeer over een minuut opnieuw.',
      errGeneric: (msg) => 'De scan kon niet worden uitgevoerd: ' + msg + '. Check of de URL klopt en probeer opnieuw.',
      gateError: 'Vul je naam en een geldig e-mailadres in, en vink de toestemming aan.',
      scoreLabels: { seo:'SEO', performance:'Snelheid', accessibility:'Mobiel + toegankelijk', 'best-practices':'Techniek' },
      findingItems: {
        'document-title': {label:'Titel-tag', hint:'De titel-tag is wat Google in de zoekresultaten toont en zwaar meeweegt.'},
        'meta-description': {label:'Meta beschrijving', hint:'De omschrijving onder je titel in Google. Overtuigt bezoekers om te klikken.'},
        'html-has-lang': {label:'Taalcode', hint:'Google weet dan zeker in welke taal je site is (belangrijk voor NL/ES).'},
        'viewport': {label:'Mobiele viewport', hint:'Zonder dit toont je site op mobiel te breed of onleesbaar.'},
        'image-alt': {label:'Alt-teksten bij afbeeldingen', hint:'Voor Google en voor bezoekers die geen beelden zien.'},
        'link-text': {label:'Klikbare linkteksten', hint:'"Klik hier" of "meer info" vertelt Google niets. Beschrijvende linkteksten wel.'},
        'is-on-https': {label:'HTTPS beveiliging', hint:'Zonder slotje in de browser waarschuwt Google én verlies je vertrouwen.'},
        'first-contentful-paint': {label:'Eerste zichtbaar', hint:'Hoe snel je bezoeker iets ziet gebeuren op je site.'},
        'largest-contentful-paint': {label:'Grootste element geladen', hint:'Wanneer het belangrijkste element (heldenafbeelding/heading) staat.'},
        'cumulative-layout-shift': {label:'Layout-verspringing', hint:'Als knoppen tijdens laden verspringen, verlies je clicks en vertrouwen.'},
        'total-blocking-time': {label:'Blokkeertijd', hint:'Hoe lang je site niet reageert op tikken/klikken tijdens laden.'},
        'structured-data': {label:'Structured data', hint:'Vertelt Google exact wat voor bedrijf je bent (bedrijf, product, review, etc.).'},
        'color-contrast': {label:'Kleurcontrast', hint:'Tekst moet leesbaar zijn voor iedereen, ook slechtziend of buiten in de zon.'},
        'tap-targets': {label:'Tik-doelen op mobiel', hint:'Knoppen te klein of te dicht op elkaar = mobiele bezoekers klikken verkeerd.'},
        'font-size': {label:'Tekstgrootte mobiel', hint:'Als tekst zoom-in nodig heeft, verlies je 60% van je bezoek.'}
      },
      findingBadges: { ok:'ok', warn:'kan beter', bad:'fix nodig' },
      whatWeSaw: 'Wat we zagen'
    },
    en: {
      statusConnecting: 'Connecting to Google Lighthouse...',
      statusReady: 'Report ready.',
      cycle: [
        {cat:'seo', text:'Fetching SEO signals...'},
        {cat:'seo', text:'Reading title, meta and headings'},
        {cat:'perf', text:'Measuring speed in a real browser'},
        {cat:'perf', text:'Analysing largest elements'},
        {cat:'mobile', text:'Testing mobile viewport'},
        {cat:'mobile', text:'Checking tap targets and text size'},
        {cat:'tech', text:'Running technical audits'},
        {cat:'tech', text:'Reading structured data'}
      ],
      errRate: 'Please wait: many scans are running right now. Wait 30 seconds and try again.',
      errNoResult: 'This URL could not be scanned. Usually this means the site is not reachable from Google, or there is an IP block. Try a different URL.',
      errCrash: 'The scan crashed on this specific site. Often helps: try a deeper page (e.g. /services instead of just yoursite.com), or try again in 2 minutes. Some sites are heavier to scan.',
      errApi: (code) => 'Google returned an error (' + code + '). Try again in a minute.',
      errGeneric: (msg) => 'The scan could not be completed: ' + msg + '. Check the URL and try again.',
      gateError: 'Fill in your name and a valid email, and tick the consent box.',
      scoreLabels: { seo:'SEO', performance:'Speed', accessibility:'Mobile + accessible', 'best-practices':'Tech' },
      findingItems: {
        'document-title': {label:'Title tag', hint:'The title tag is what Google shows in search results and weighs heavily.'},
        'meta-description': {label:'Meta description', hint:'The description below your title in Google. Convinces visitors to click.'},
        'html-has-lang': {label:'Language code', hint:'Google knows for sure what language your site is in (important for multiple markets).'},
        'viewport': {label:'Mobile viewport', hint:'Without this, your site shows too wide or unreadable on mobile.'},
        'image-alt': {label:'Alt text on images', hint:'For Google and for visitors who cannot see images.'},
        'link-text': {label:'Clickable link text', hint:'"Click here" or "more info" tells Google nothing. Descriptive link text does.'},
        'is-on-https': {label:'HTTPS security', hint:'Without the padlock in the browser, Google warns visitors and you lose trust.'},
        'first-contentful-paint': {label:'First paint', hint:'How quickly your visitor sees something happen on your site.'},
        'largest-contentful-paint': {label:'Largest element loaded', hint:'When the most important element (hero image/heading) is in place.'},
        'cumulative-layout-shift': {label:'Layout shift', hint:'If buttons jump during load, you lose clicks and trust.'},
        'total-blocking-time': {label:'Blocking time', hint:'How long your site does not respond to taps/clicks during load.'},
        'structured-data': {label:'Structured data', hint:'Tells Google exactly what kind of business you are (company, product, review, etc.).'},
        'color-contrast': {label:'Colour contrast', hint:'Text must be readable for everyone, also visually impaired or in bright sun.'},
        'tap-targets': {label:'Mobile tap targets', hint:'Buttons too small or too close together = mobile visitors mis-tap.'},
        'font-size': {label:'Mobile font size', hint:'If text needs zoom-in, you lose 60% of your mobile traffic.'}
      },
      findingBadges: { ok:'ok', warn:'could be better', bad:'needs fix' },
      whatWeSaw: 'What we saw'
    },
    es: {
      statusConnecting: 'Conectando con Google Lighthouse...',
      statusReady: 'Informe listo.',
      cycle: [
        {cat:'seo', text:'Obteniendo señales SEO...'},
        {cat:'seo', text:'Leyendo título, meta y encabezados'},
        {cat:'perf', text:'Midiendo velocidad en navegador real'},
        {cat:'perf', text:'Analizando elementos más grandes'},
        {cat:'mobile', text:'Probando viewport móvil'},
        {cat:'mobile', text:'Comprobando objetivos táctiles y tamaño de texto'},
        {cat:'tech', text:'Ejecutando auditorías técnicas'},
        {cat:'tech', text:'Leyendo datos estructurados'}
      ],
      errRate: 'Un momento: hay muchos escaneos a la vez. Espera 30 segundos e inténtalo de nuevo.',
      errNoResult: 'No se pudo escanear esta URL. Normalmente significa que Google no puede alcanzar la web, o que hay un bloqueo por IP. Prueba con otra URL.',
      errCrash: 'El escaneo falló en esta web específica. Suele ayudar: prueba una página más profunda (p.ej. /servicios en lugar de solo tuweb.es), o inténtalo dentro de 2 minutos. Algunas webs son más pesadas.',
      errApi: (code) => 'Google devolvió un error (' + code + '). Inténtalo dentro de un minuto.',
      errGeneric: (msg) => 'No se pudo completar el escaneo: ' + msg + '. Comprueba la URL e inténtalo de nuevo.',
      gateError: 'Rellena tu nombre y un email válido, y marca la casilla de consentimiento.',
      scoreLabels: { seo:'SEO', performance:'Velocidad', accessibility:'Móvil + accesible', 'best-practices':'Técnica' },
      findingItems: {
        'document-title': {label:'Etiqueta title', hint:'La etiqueta title es lo que Google muestra en los resultados y pondera mucho.'},
        'meta-description': {label:'Meta descripción', hint:'La descripción bajo tu título en Google. Convence a los visitantes para hacer clic.'},
        'html-has-lang': {label:'Código de idioma', hint:'Google sabe con certeza en qué idioma está tu web (importante para varios mercados).'},
        'viewport': {label:'Viewport móvil', hint:'Sin esto, tu web se muestra demasiado ancha o ilegible en móvil.'},
        'image-alt': {label:'Alt-texts en imágenes', hint:'Para Google y para quienes no pueden ver imágenes.'},
        'link-text': {label:'Textos de enlace descriptivos', hint:'"Haz clic aquí" o "más info" no dice nada a Google. Textos descriptivos sí.'},
        'is-on-https': {label:'Seguridad HTTPS', hint:'Sin el candado en el navegador, Google avisa y pierdes confianza.'},
        'first-contentful-paint': {label:'Primer pintado', hint:'Con qué rapidez tu visitante ve algo suceder en tu web.'},
        'largest-contentful-paint': {label:'Elemento más grande cargado', hint:'Cuándo aparece el elemento más importante (imagen hero/encabezado).'},
        'cumulative-layout-shift': {label:'Cambio de diseño', hint:'Si los botones saltan al cargar, pierdes clics y confianza.'},
        'total-blocking-time': {label:'Tiempo de bloqueo', hint:'Cuánto tiempo tu web no responde a toques/clics durante la carga.'},
        'structured-data': {label:'Datos estructurados', hint:'Le dice a Google exactamente qué tipo de negocio eres (empresa, producto, reseña, etc.).'},
        'color-contrast': {label:'Contraste de color', hint:'El texto debe ser legible para todos, también con baja visión o al sol.'},
        'tap-targets': {label:'Objetivos táctiles móvil', hint:'Botones demasiado pequeños o juntos = los visitantes móviles se equivocan.'},
        'font-size': {label:'Tamaño de fuente móvil', hint:'Si hace falta zoom, pierdes el 60% del tráfico móvil.'}
      },
      findingBadges: { ok:'ok', warn:'mejorable', bad:'a corregir' },
      whatWeSaw: 'Lo que vimos'
    }
  }[L];

  // === Deep-SEO strings (los van T om edits klein te houden) ===
  const TD = ({
    nl: {
      section: 'Diepere SEO-check (live-parse van je HTML)',
      badges: { ok:'ok', warn:'kan beter', bad:'fix nodig', missing:'ontbreekt' },
      items: {
        titleLen:      { label:'Titel-lengte',            hint:'Titel moet 30–60 tekens zijn voor optimale weergave in Google.' },
        descLen:       { label:'Meta-beschrijving lengte',hint:'120–160 tekens werkt het best in de zoekresultaten.' },
        canonical:     { label:'Canonical URL',           hint:'Vertelt Google welke URL de originele is (voorkomt duplicate content).' },
        hreflang:      { label:'Hreflang tags',           hint:'Nodig als je meerdere talen hebt (NL/EN/ES). Anders concurreren je vertalingen met elkaar.' },
        og:            { label:'Open Graph (social)',     hint:'Zorgt dat je site er goed uitziet als iemand hem deelt op WhatsApp, LinkedIn of Facebook.' },
        jsonld:        { label:'Structured data (JSON-LD)', hint:'Vertelt Google exact wat voor bedrijf, product of dienst dit is. Verhoogt kans op rich results.' },
        h1:            { label:'H1 hoofdkop',             hint:'Precies één H1 per pagina. Vertelt Google én bezoeker waar de pagina over gaat.' },
        imgAlt:        { label:'Alt-teksten op afbeeldingen', hint:'Beschrijvende alt-teksten helpen Google Images en toegankelijkheid.' },
        wordCount:     { label:'Content-omvang',          hint:'Onder de 300 woorden ziet Google als "dunne content". Hoe meer relevante uitleg, hoe beter.' },
        robots:        { label:'robots.txt aanwezig',     hint:'Standaard bestand dat zoekmachines eerst opzoeken. Ontbreekt: minder professioneel signaal.' },
        sitemap:       { label:'sitemap.xml aanwezig',    hint:'Kaart van alle pagina\'s. Zonder sitemap moet Google alles zelf ontdekken.' }
      }
    },
    en: {
      section: 'Deeper SEO check (live parse of your HTML)',
      badges: { ok:'ok', warn:'could be better', bad:'needs fix', missing:'missing' },
      items: {
        titleLen:      { label:'Title length',            hint:'Title should be 30–60 characters for optimal display in Google.' },
        descLen:       { label:'Meta description length', hint:'120–160 characters works best in search results.' },
        canonical:     { label:'Canonical URL',           hint:'Tells Google which URL is the original (prevents duplicate content).' },
        hreflang:      { label:'Hreflang tags',           hint:'Required if you have multiple languages (NL/EN/ES). Otherwise your translations compete.' },
        og:            { label:'Open Graph (social)',     hint:'Makes your site look right when shared on WhatsApp, LinkedIn or Facebook.' },
        jsonld:        { label:'Structured data (JSON-LD)', hint:'Tells Google exactly what business, product or service this is. Increases rich results chance.' },
        h1:            { label:'H1 heading',              hint:'Exactly one H1 per page. Tells Google and visitors what the page is about.' },
        imgAlt:        { label:'Image alt text',          hint:'Descriptive alt text helps Google Images and accessibility.' },
        wordCount:     { label:'Content depth',           hint:'Under 300 words Google considers "thin content". More relevant explanation is better.' },
        robots:        { label:'robots.txt present',      hint:'Standard file search engines look for first. Missing = less professional signal.' },
        sitemap:       { label:'sitemap.xml present',     hint:'Map of all your pages. Without a sitemap Google has to discover everything itself.' }
      }
    },
    es: {
      section: 'Análisis SEO profundo (parseo en vivo de tu HTML)',
      badges: { ok:'ok', warn:'mejorable', bad:'a corregir', missing:'falta' },
      items: {
        titleLen:      { label:'Longitud del título',     hint:'El título debe tener 30–60 caracteres para mostrarse bien en Google.' },
        descLen:       { label:'Longitud meta descripción', hint:'120–160 caracteres funciona mejor en resultados.' },
        canonical:     { label:'URL canónica',            hint:'Indica a Google cuál es la URL original (evita contenido duplicado).' },
        hreflang:      { label:'Etiquetas hreflang',      hint:'Necesarias si tienes varios idiomas (NL/EN/ES). Sin ellas tus traducciones compiten entre sí.' },
        og:            { label:'Open Graph (social)',     hint:'Hace que tu web se vea bien cuando se comparte en WhatsApp, LinkedIn o Facebook.' },
        jsonld:        { label:'Datos estructurados (JSON-LD)', hint:'Indica a Google exactamente qué tipo de negocio, producto o servicio es. Aumenta rich results.' },
        h1:            { label:'Encabezado H1',           hint:'Exactamente un H1 por página. Dice a Google y visitantes de qué trata la página.' },
        imgAlt:        { label:'Alt-text en imágenes',    hint:'Alt descriptivo ayuda a Google Images y a accesibilidad.' },
        wordCount:     { label:'Profundidad de contenido', hint:'Por debajo de 300 palabras Google lo ve como "contenido pobre". Más explicación relevante es mejor.' },
        robots:        { label:'robots.txt presente',     hint:'Archivo estándar que buscan los buscadores. Falta = señal menos profesional.' },
        sitemap:       { label:'sitemap.xml presente',    hint:'Mapa de todas tus páginas. Sin él, Google tiene que descubrirlo todo por su cuenta.' }
      }
    }
  })[L];

  // Zet de HTML-analyse van seo-deep om in dezelfde finding-vorm als de Lighthouse-findings
  function extractDeepFindings(d){
    const B = TD.badges;
    const I = TD.items;
    const out = [];
    const push = (key, cls, value) => {
      const it = I[key];
      if(!it) return;
      const icon = cls === 'good' ? '✓' : cls === 'warn' ? '!' : cls === 'bad' ? '✕' : 'i';
      const priority = cls === 'bad' ? 0 : cls === 'warn' ? 1 : 2;
      out.push({ cls, icon, label: it.label, hint: it.hint, value, priority });
    };

    // Titel
    if(!d.title) push('titleLen', 'bad', B.missing);
    else if(d.titleLen < 30 || d.titleLen > 60) push('titleLen', 'warn', d.titleLen + ' ' + (L==='es'?'car.':'chars'));
    else push('titleLen', 'good', d.titleLen + ' ' + (L==='es'?'car.':'chars'));

    // Meta description
    if(!d.description) push('descLen', 'bad', B.missing);
    else if(d.descLen < 80 || d.descLen > 170) push('descLen', 'warn', d.descLen + ' ' + (L==='es'?'car.':'chars'));
    else push('descLen', 'good', d.descLen + ' ' + (L==='es'?'car.':'chars'));

    // Canonical
    push('canonical', d.canonicalOk ? 'good' : 'warn', d.canonicalOk ? B.ok : B.missing);

    // Hreflang — alleen tonen als er meerdere talen zijn (>1 taal-versie op site)
    // We tonen dit altijd om multilingual awareness te wekken
    if(d.hreflangCount >= 2) push('hreflang', 'good', d.hreflangCount + ' ' + (L==='nl'?'talen':L==='es'?'idiomas':'languages'));
    else if(d.hreflangCount === 1) push('hreflang', 'warn', '1 ' + (L==='nl'?'taal':L==='es'?'idioma':'language'));
    else push('hreflang', 'warn', B.missing);

    // Open Graph
    push('og', d.ogOk ? 'good' : 'warn', d.ogOk ? B.ok : (L==='nl'?'incompleet':L==='es'?'incompleto':'incomplete'));

    // JSON-LD
    if(d.jsonldTypes && d.jsonldTypes.length){
      const uniq = [...new Set(d.jsonldTypes)].slice(0,3).join(', ');
      push('jsonld', 'good', uniq);
    } else {
      push('jsonld', 'warn', B.missing);
    }

    // H1
    if(d.h1Count === 1) push('h1', 'good', '1 H1');
    else if(d.h1Count === 0) push('h1', 'bad', B.missing);
    else push('h1', 'warn', d.h1Count + ' H1s');

    // Image alt
    if(d.imgTotal === 0) { /* niks tonen als geen images */ }
    else if(d.imgNoAlt === 0) push('imgAlt', 'good', d.imgTotal + ' ok');
    else {
      const ratio = d.imgNoAlt / d.imgTotal;
      const cls = ratio > 0.3 ? 'bad' : 'warn';
      push('imgAlt', cls, d.imgNoAlt + '/' + d.imgTotal + ' ' + (L==='nl'?'zonder alt':L==='es'?'sin alt':'no alt'));
    }

    // Word count
    if(d.wordCount < 200) push('wordCount', 'bad', d.wordCount + ' ' + (L==='nl'?'woorden':L==='es'?'palabras':'words'));
    else if(d.wordCount < 400) push('wordCount', 'warn', d.wordCount + ' ' + (L==='nl'?'woorden':L==='es'?'palabras':'words'));
    else push('wordCount', 'good', d.wordCount + ' ' + (L==='nl'?'woorden':L==='es'?'palabras':'words'));

    // robots.txt
    push('robots', d.robotsOk ? 'good' : 'warn', d.robotsOk ? B.ok : B.missing);

    // sitemap.xml (in robots gedeclareerd of gevonden op /sitemap.xml)
    const sitemapPresent = d.sitemapOk || !!d.robotsSitemap;
    push('sitemap', sitemapPresent ? 'good' : 'warn', sitemapPresent ? B.ok : B.missing);

    out.sort((a,b) => a.priority - b.priority);
    return out;
  }

  // Leads worden verzonden via Netlify Function (/.netlify/functions/send-lead) die Resend gebruikt.

  const scanUrl = document.getElementById('scanUrl');
  const scanSubmit = document.getElementById('scanSubmit');
  const scanPanel = document.getElementById('scanPanel');
  const scanRunning = document.getElementById('scanRunning');
  const scanResults = document.getElementById('scanResults');
  const scanError = document.getElementById('scanError');
  const scanErrorMsg = document.getElementById('scanErrorMsg');
  const scanErrorRetry = document.getElementById('scanErrorRetry');
  const vizDomain = document.getElementById('vizDomain');
  const vizStatus = document.getElementById('vizStatus');
  const radarLabels = document.querySelectorAll('.rl');
  const resultDomain = document.getElementById('resultDomain');
  const resultTime = document.getElementById('resultTime');
  const scanScores = document.getElementById('scanScores');
  const scanVerdict = document.getElementById('scanVerdict');
  const scanFindings = document.getElementById('scanFindings');
  const scanWhatsapp = document.getElementById('scanWhatsapp');
  const scanRestart = document.getElementById('scanRestart');

  // Gate elements
  const scanGate = document.getElementById('scanGate');
  const gateForm = document.getElementById('gateForm');
  const gateName = document.getElementById('gateName');
  const gateEmail = document.getElementById('gateEmail');
  const gateCompany = document.getElementById('gateCompany');
  const gateConsent = document.getElementById('gateConsent');
  const gateSubmit = document.getElementById('gateSubmit');
  const gateBack = document.getElementById('gateBack');
  const gateError = document.getElementById('gateError');

  const LEAD_KEY = 'hg_scan_lead_v1';
  function getSavedLead(){
    try { return JSON.parse(localStorage.getItem(LEAD_KEY) || 'null'); } catch(_) { return null; }
  }
  function saveLead(lead){
    try { localStorage.setItem(LEAD_KEY, JSON.stringify(lead)); } catch(_){}
  }
  function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e||'').trim()); }

  let pendingUrl = null;
  let currentLead = getSavedLead();

  // Example clicks
  document.querySelectorAll('.scan-example').forEach(b => {
    b.addEventListener('click', () => { scanUrl.value = b.dataset.url; scanForm.dispatchEvent(new Event('submit', {cancelable:true})); });
  });

  scanErrorRetry && scanErrorRetry.addEventListener('click', () => runScan(scanUrl.value));
  scanRestart && scanRestart.addEventListener('click', () => {
    scanPanel.hidden = true;
    scanResults.hidden = true;
    scanRunning.hidden = false;
    scanUrl.value = '';
    scanUrl.focus();
    window.scrollTo({top:0, behavior:'smooth'});
  });

  scanForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = normalizeUrl(scanUrl.value);
    if(!url){ scanUrl.focus(); return; }
    // Gate wordt ALTIJD getoond zodat we bij elke scan een lead-notificatie krijgen.
    pendingUrl = url;
    showGate();
  });

  function showGate(){
    scanPanel.hidden = true;
    scanGate.hidden = false;
    gateError.hidden = true;
    // Pre-fill bekende gegevens voor terugkerende bezoekers (consent moeten ze wel opnieuw geven)
    if(currentLead){
      if(currentLead.name && !gateName.value) gateName.value = currentLead.name;
      if(currentLead.email && !gateEmail.value) gateEmail.value = currentLead.email;
      if(currentLead.company && !gateCompany.value) gateCompany.value = currentLead.company;
    }
    gateConsent.checked = false;
    setTimeout(() => scanGate.scrollIntoView({behavior:'smooth', block:'start'}), 80);
    setTimeout(() => {
      // Focus eerste lege veld
      if(!gateName.value) gateName.focus();
      else if(!gateEmail.value) gateEmail.focus();
      else gateConsent.focus();
    }, 350);
  }
  function hideGate(){
    scanGate.hidden = true;
  }

  gateBack && gateBack.addEventListener('click', () => {
    hideGate();
    pendingUrl = null;
    scanUrl.focus();
    window.scrollTo({top:0, behavior:'smooth'});
  });

  gateForm && gateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    gateError.hidden = true;
    const lead = {
      name: gateName.value.trim(),
      email: gateEmail.value.trim(),
      company: gateCompany.value.trim() || null,
      url: pendingUrl,
      consent: !!gateConsent.checked,
      ts: new Date().toISOString()
    };
    if(!lead.name || !validEmail(lead.email) || !lead.consent){
      gateError.hidden = false;
      gateError.textContent = T.gateError;
      return;
    }
    gateSubmit.disabled = true;
    // Lead-mail wordt niet meer bij gate-submit verzonden.
    // De definitieve mail (lead-info + scan-scores) volgt via send-report bij scan-success,
    // of via send-lead als fallback bij scan-fail.
    saveLead(lead);
    currentLead = lead;
    gateSubmit.disabled = false;
    hideGate();
    runScan(pendingUrl);
  });

  function normalizeUrl(raw){
    let u = (raw || '').trim();
    if(!u) return null;
    if(!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { new URL(u); return u; } catch(_) { return null; }
  }

  function setStatus(text){ if(vizStatus) vizStatus.textContent = text; }
  function activateLabel(cat){
    radarLabels.forEach(l => {
      if(l.dataset.cat === cat){ l.classList.remove('done'); l.classList.add('active'); }
      else if(l.classList.contains('active')){ l.classList.remove('active'); l.classList.add('done'); }
    });
  }
  function finishAllLabels(){
    radarLabels.forEach(l => { l.classList.remove('active'); l.classList.add('done'); });
  }
  function resetLabels(){
    radarLabels.forEach(l => l.classList.remove('active','done'));
  }

  // Statussen die roteren tijdens de wacht op de API
  const statusCycle = T.cycle;
  let cycleTimer = null;
  function startStatusCycle(){
    let i = 0;
    setStatus(statusCycle[0].text);
    activateLabel(statusCycle[0].cat);
    cycleTimer = setInterval(() => {
      i = (i + 1) % statusCycle.length;
      setStatus(statusCycle[i].text);
      activateLabel(statusCycle[i].cat);
    }, 2400);
  }
  function stopStatusCycle(){
    if(cycleTimer){ clearInterval(cycleTimer); cycleTimer = null; }
  }

  async function runScan(rawUrl){
    const url = normalizeUrl(rawUrl);
    if(!url){
      scanUrl.focus();
      return;
    }

    // UI reset
    scanPanel.hidden = false;
    scanRunning.hidden = false;
    scanResults.hidden = true;
    scanError.hidden = true;
    scanSubmit.disabled = true;
    const host = new URL(url).host.replace(/^www\./,'');
    if(vizDomain) vizDomain.textContent = host;
    resetLabels();
    setStatus(T.statusConnecting);

    // Scroll naar panel
    setTimeout(() => scanPanel.scrollIntoView({behavior:'smooth', block:'start'}), 100);

    await wait(600);
    startStatusCycle();

    // Scan gaat via onze eigen Netlify Function. Key blijft daar server-side, nooit publiek.
    const endpoint = `/.netlify/functions/scan?url=${encodeURIComponent(url)}`;

    try {
      const res = await fetch(endpoint);
      if(res.status === 429){
        throw new Error('RATE_LIMIT');
      }
      if(!res.ok) throw new Error(`API_${res.status}`);
      const data = await res.json();
      const lh = data.lighthouseResult;
      if(!lh) throw new Error('NO_RESULT');

      stopStatusCycle();
      finishAllLabels();
      setStatus(T.statusReady);
      await wait(700);

      renderResults(url, host, lh);
    } catch(err){
      stopStatusCycle();
      scanError.hidden = false;
      scanRunning.hidden = true;
      let msg;
      if(err.message === 'RATE_LIMIT'){
        msg = T.errRate;
      } else if(err.message === 'NO_RESULT' || (err.message && err.message.startsWith('API_400'))){
        msg = T.errNoResult;
      } else if(err.message && (err.message.startsWith('API_5') || err.message.startsWith('API_502'))){
        msg = T.errCrash;
      } else if(err.message && err.message.startsWith('API_')){
        msg = T.errApi(err.message.replace('API_','code '));
      } else {
        msg = T.errGeneric(err.message || 'unknown');
      }
      scanErrorMsg.textContent = msg;
      // Fallback: als de scan crashed maar we hebben wel een lead, stuur toch een notificatie naar Alain
      if(currentLead && currentLead.email){
        fetch('/.netlify/functions/send-lead', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name: currentLead.name,
            email: currentLead.email,
            company: currentLead.company || '',
            url,
            consent: currentLead.consent,
            referrer: document.referrer || '',
            'bot-field': ''
          })
        }).catch(e => console.warn('[lead-fallback] failed:', e));
      }
    } finally {
      scanSubmit.disabled = false;
    }
  }

  function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  function renderResults(url, host, lh){
    scanRunning.hidden = true;
    scanResults.hidden = false;

    resultDomain.textContent = host;
    resultTime.textContent = new Date().toLocaleTimeString('nl-NL', {hour:'2-digit', minute:'2-digit'});

    // Scores
    const cats = lh.categories;
    const scores = [
      { key:'seo', label:T.scoreLabels.seo, score: cats.seo ? cats.seo.score : null },
      { key:'performance', label:T.scoreLabels.performance, score: cats.performance ? cats.performance.score : null },
      { key:'accessibility', label:T.scoreLabels.accessibility, score: cats.accessibility ? cats.accessibility.score : null },
      { key:'best-practices', label:T.scoreLabels['best-practices'], score: cats['best-practices'] ? cats['best-practices'].score : null }
    ];

    scanScores.innerHTML = scores.map(s => scoreCard(s)).join('');
    // Anim rings
    requestAnimationFrame(() => {
      document.querySelectorAll('.score-card').forEach(card => {
        const fg = card.querySelector('.fg');
        const pct = parseFloat(card.dataset.pct);
        const c = 2 * Math.PI * 40;
        fg.style.strokeDasharray = c;
        fg.style.strokeDashoffset = c;
        setTimeout(() => { fg.style.strokeDashoffset = c * (1 - pct/100); }, 100);
      });
    });

    // Verdict (dynamisch op basis van scores per categorie)
    const avg = Math.round(scores.filter(s => s.score !== null).reduce((a,s) => a + s.score, 0) / scores.filter(s => s.score !== null).length * 100);
    const verdict = buildVerdict(avg, host, scores);
    scanVerdict.innerHTML = verdict.html;

    // Findings
    scanFindings.innerHTML = extractFindings(lh).map(findingCard).join('');

    // Diepere SEO-check (parallel, non-blocking) — voegt hreflang/JSON-LD/OG/alt/robots-checks toe.
    fetch('/.netlify/functions/seo-deep?url=' + encodeURIComponent(url))
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if(!data || data.error || !data.ok) return;
        const extra = extractDeepFindings(data);
        if(!extra.length) return;
        scanFindings.insertAdjacentHTML('beforeend',
          `<div class="finding-section-label">${TD.section}</div>` + extra.map(findingCard).join('')
        );
      })
      .catch(err => console.warn('[seo-deep] failed:', err));

    // WhatsApp handoff
    const waMsg = buildWhatsappMsg(host, url, scores, avg);
    scanWhatsapp.href = `https://wa.me/31634455762?text=${encodeURIComponent(waMsg)}`;

    // GA4 conversie: succesvolle groeiscan (geen persoonsgegevens meegegeven)
    if(window.hgTrack){ window.hgTrack('growth_scan_submit', { page_path: location.pathname, form_name: 'growth_scan', lang: L }); }

    // Rapport-mail naar klant (met kopie naar Alain). Non-blocking. Taal wordt meegestuurd.
    if(currentLead && currentLead.email){
      const findings = extractFindings(lh).slice(0, 6);
      fetch('/.netlify/functions/send-report', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          lang: L,
          name: currentLead.name,
          email: currentLead.email,
          company: currentLead.company || '',
          url,
          scores,
          avg,
          findings,
          verdict: {
            head: verdict.headText,
            body: verdict.bodyText,
            ctaLabel: verdict.ctaLabel,
            ctaMode: verdict.ctaMode
          }
        })
      }).catch(err => console.warn('[send-report] failed:', err));
    }
  }

  function scoreCard(s){
    const pct = s.score === null ? 0 : Math.round(s.score * 100);
    const cls = pct >= 90 ? 'good' : pct >= 50 ? 'mid' : 'bad';
    return `<div class="score-card ${cls}" data-pct="${pct}">
      <div class="score-ring">
        <svg viewBox="0 0 100 100">
          <circle class="bg" cx="50" cy="50" r="40"/>
          <circle class="fg" cx="50" cy="50" r="40"/>
        </svg>
        <div class="score-num">${pct}</div>
      </div>
      <div class="score-label">${s.label}</div>
    </div>`;
  }

  // Verdict-templates per taal
  const V = {
    nl: {
      cats: {
        seo:{label:'SEO', weak:'Google snapt onvoldoende waar je site over gaat'},
        perf:{label:'snelheid', weak:'je site is te langzaam en verliest bezoekers voor Google je heeft geplaatst'},
        acc:{label:'mobiel + toegankelijkheid', weak:'mobiele bezoekers en Google botsen tegen hindernissen'},
        bp:{label:'techniek', weak:'onder de motorkap missen basale zaken'}
      },
      growth: {
        head: (h) => `Google vertrouwt <em>${h}</em>. Maar dat is nog geen bereik.`,
        body: (avg, sl) => `Score ${avg}/100 (${sl}). Technisch is er weinig aan te merken. Vanaf hier speelt een andere vraag: geef je Google, Instagram en TikTok genoeg om je aan de juiste mensen te tonen? Elk platform kijkt naar andere signalen. Google beloont diepte en versheid van content, Instagram beloont bewijs dat er iemand achter zit, TikTok beslist in de eerste drie seconden of een video verder mag. Wie hier consequent op inspeelt groeit. Wie dat aan het toeval overlaat blijft op dezelfde plek staan.`,
        cta: 'Vraag hoe wij hier naar kijken'
      },
      focus: {
        head: (w) => `Fundament staat. Op <em>${w.label}</em> houden de platforms je tegen.`,
        body: (avg, sl, w) => `Score ${avg}/100 (${sl}). Drie van de vier categorieën zijn in orde. Maar ${w.weak}. En juist daar letten Google en de socials op voordat ze je verder tonen. Alle content die je hierna maakt vecht tegen die ene rem. De vraag is niet meer of dit gefixt moet worden, maar wat de meest logische eerste stap is voor jouw markt.`,
        cta: 'Vraag wat de eerste stap is'
      },
      balanced: {
        head: () => `Meerdere kleine gaten, die <em>samen bezoek kosten</em>.`,
        body: (avg, sl, w) => `Score ${avg}/100 (${sl}). Geen enkele categorie is een ramp, maar Google, Instagram en TikTok werken met optellingen van signalen. Als op meerdere fronten iets net niet klopt (vooral ${w.label} op ${w.value}) telt dat op tot een lagere ranking of minder bereik. Wat Google positief scoort ziet Instagram niet, en andersom. Weten waar elk platform op let is precies waar wij dagelijks mee bezig zijn.`,
        cta: 'Vraag onze lezing van dit rapport'
      },
      leak: {
        head: (h) => `De platforms staan nu <em>tegen</em> ${h}, niet met.`,
        body: (avg, sl, weakList) => `Score ${avg}/100 (${sl}). Op meerdere fronten (${weakList}) missen basale signalen die Google en de socials verwachten. Bezoekers komen wel, maar de platforms zien dat mensen snel wegklikken en concluderen: deze site geeft niet wat mensen zoeken. Dat maakt elke euro aan promotie duurder dan nodig. De volgorde waarin je dit aanpakt bepaalt of het over 3 weken beter gaat of over 3 maanden.`,
        cta: 'Vraag advies over de volgorde'
      },
      rebuild: {
        head: () => `Dit kan niet met méér verkeer worden opgelost.`,
        body: (avg, sl) => `Score ${avg}/100 (${sl}). Fundamentele issues op meerdere plekken. Elk platform, van Google tot TikTok, kijkt of een bezoeker een fatsoenlijke ervaring krijgt. Ze houden niet van sites die traag laden, crashen, of onleesbaar zijn op mobiel. Zolang dit fundament niet klopt, houden de algorithms je op afstand, hoeveel content je ook maakt of hoeveel ads je ook draait. De vraag is niet óf dit opnieuw moet, maar hoe je onderscheidt wie het écht kan bouwen en wie niet.`,
        cta: 'Vraag onze eerlijke lezing'
      }
    },
    en: {
      cats: {
        seo:{label:'SEO', weak:'Google does not understand what your site is about'},
        perf:{label:'speed', weak:'your site is too slow and loses visitors before Google places you'},
        acc:{label:'mobile + accessibility', weak:'mobile visitors and Google hit obstacles'},
        bp:{label:'tech', weak:'basic things are missing under the hood'}
      },
      growth: {
        head: (h) => `Google trusts <em>${h}</em>. But that is not yet reach.`,
        body: (avg, sl) => `Score ${avg}/100 (${sl}). Technically there is little to complain about. From here a different question matters: are you giving Google, Instagram and TikTok enough to show you to the right people? Each platform looks at different signals. Google rewards depth and freshness of content, Instagram rewards proof that a real person is behind it, TikTok decides in the first three seconds whether a video goes further. Those who consistently play into this grow. Those who leave it to chance stay in the same place.`,
        cta: 'Ask how we look at this'
      },
      focus: {
        head: (w) => `Foundation is solid. On <em>${w.label}</em> the platforms hold you back.`,
        body: (avg, sl, w) => `Score ${avg}/100 (${sl}). Three of the four categories are in order. But ${w.weak}. And that is exactly what Google and the socials watch before showing you further. All content you make from now on fights against that one brake. The question is no longer whether this needs fixing, but what the most logical first step is for your market.`,
        cta: 'Ask what the first step is'
      },
      balanced: {
        head: () => `Multiple small gaps that <em>together cost visits</em>.`,
        body: (avg, sl, w) => `Score ${avg}/100 (${sl}). No single category is a disaster, but Google, Instagram and TikTok work with sums of signals. If things are just not right on multiple fronts (especially ${w.label} at ${w.value}) it adds up to a lower ranking or less reach. What Google scores positively Instagram does not see, and vice versa. Knowing what each platform looks at is exactly what we do every day.`,
        cta: 'Ask for our reading of this report'
      },
      leak: {
        head: (h) => `The platforms are currently <em>against</em> ${h}, not with.`,
        body: (avg, sl, weakList) => `Score ${avg}/100 (${sl}). On multiple fronts (${weakList}) basic signals Google and the socials expect are missing. Visitors do come in, but the platforms see that people quickly click away and conclude: this site does not give what people are looking for. That makes every euro in promotion more expensive than needed. The order in which you tackle this determines whether it is better in 3 weeks or in 3 months.`,
        cta: 'Ask for advice on the order'
      },
      rebuild: {
        head: () => `More traffic will not solve this.`,
        body: (avg, sl) => `Score ${avg}/100 (${sl}). Fundamental issues on multiple fronts. Every platform, from Google to TikTok, checks whether a visitor gets a decent experience. They do not like sites that load slowly, crash, or are unreadable on mobile. As long as this foundation is not right, the algorithms keep you at a distance, no matter how much content you make or how many ads you run. The question is not whether this needs a rebuild, but how you distinguish who can really build it from who cannot.`,
        cta: 'Ask for our honest reading'
      }
    },
    es: {
      cats: {
        seo:{label:'SEO', weak:'Google no entiende bien de qué trata tu web'},
        perf:{label:'velocidad', weak:'tu web es demasiado lenta y pierde visitas antes de que Google te posicione'},
        acc:{label:'móvil + accesibilidad', weak:'los visitantes móviles y Google chocan con obstáculos'},
        bp:{label:'técnica', weak:'faltan cosas básicas bajo el capó'}
      },
      growth: {
        head: (h) => `Google confía en <em>${h}</em>. Pero eso todavía no es alcance.`,
        body: (avg, sl) => `Puntuación ${avg}/100 (${sl}). Técnicamente hay poco que objetar. A partir de aquí importa otra pregunta: ¿das a Google, Instagram y TikTok suficiente para mostrarte a las personas adecuadas? Cada plataforma mira señales distintas. Google premia la profundidad y la frescura del contenido, Instagram premia la prueba de que hay alguien detrás, TikTok decide en los primeros tres segundos si un vídeo sigue. Quien juega esto con constancia crece. Quien lo deja al azar se queda en el mismo sitio.`,
        cta: 'Pregunta cómo lo vemos'
      },
      focus: {
        head: (w) => `La base está. En <em>${w.label}</em> las plataformas te frenan.`,
        body: (avg, sl, w) => `Puntuación ${avg}/100 (${sl}). Tres de las cuatro categorías están bien. Pero ${w.weak}. Y justamente ahí miran Google y las redes antes de mostrarte más. Todo el contenido que hagas desde ahora lucha contra ese freno. La pregunta ya no es si hay que arreglarlo, sino cuál es el primer paso más lógico para tu mercado.`,
        cta: 'Pregunta cuál es el primer paso'
      },
      balanced: {
        head: () => `Varios huecos pequeños que <em>juntos cuestan visitas</em>.`,
        body: (avg, sl, w) => `Puntuación ${avg}/100 (${sl}). Ninguna categoría es un desastre, pero Google, Instagram y TikTok trabajan con sumas de señales. Si en varios frentes algo no está del todo bien (especialmente ${w.label} en ${w.value}) suma a un ranking más bajo o menos alcance. Lo que Google puntúa bien Instagram no lo ve, y al revés. Saber qué mira cada plataforma es exactamente lo que hacemos a diario.`,
        cta: 'Pide nuestra lectura del informe'
      },
      leak: {
        head: (h) => `Las plataformas ahora están <em>en contra</em> de ${h}, no a favor.`,
        body: (avg, sl, weakList) => `Puntuación ${avg}/100 (${sl}). En varios frentes (${weakList}) faltan señales básicas que Google y las redes esperan. Los visitantes llegan, pero las plataformas ven que la gente se va rápido y concluyen: esta web no da lo que buscan. Eso hace que cada euro en promoción cueste más de lo necesario. El orden en que abordas esto decide si mejora en 3 semanas o en 3 meses.`,
        cta: 'Pide consejo sobre el orden'
      },
      rebuild: {
        head: () => `Más tráfico no resolverá esto.`,
        body: (avg, sl) => `Puntuación ${avg}/100 (${sl}). Problemas fundamentales en varios frentes. Cada plataforma, desde Google hasta TikTok, comprueba si un visitante tiene una experiencia decente. No les gustan las webs lentas, que se caen o ilegibles en móvil. Mientras esta base no esté bien, los algoritmos te mantienen a distancia, por mucho contenido que hagas o anuncios que pongas. La pregunta no es si hay que rehacer esto, sino cómo distinguir a quien puede construirlo bien de quien no.`,
        cta: 'Pide nuestra lectura honesta'
      }
    }
  }[L];

  // Genereer een dynamische verdict-tekst op basis van de daadwerkelijke scores per categorie.
  function buildVerdict(avg, host, scores){
    const s = (k) => {
      const item = scores.find(x => x.key === k);
      return item && item.score !== null ? Math.round(item.score * 100) : null;
    };
    const seoV = s('seo'), perfV = s('performance'), accV = s('accessibility'), bpV = s('best-practices');

    const cats = [
      { key:'seo', label:V.cats.seo.label, value:seoV, weak:V.cats.seo.weak },
      { key:'perf', label:V.cats.perf.label, value:perfV, weak:V.cats.perf.weak },
      { key:'acc', label:V.cats.acc.label, value:accV, weak:V.cats.acc.weak },
      { key:'bp', label:V.cats.bp.label, value:bpV, weak:V.cats.bp.weak }
    ].filter(c => c.value !== null);

    const weakest = cats.slice().sort((a,b) => a.value - b.value)[0];
    const strongCount = cats.filter(c => c.value >= 85).length;
    const weakCount = cats.filter(c => c.value < 50).length;
    const scoresLine = cats.map(c => `${c.label} ${c.value}`).join(', ');

    let head, body, ctaLabel, ctaMode;

    if(avg >= 85 && weakCount === 0){
      head = V.growth.head(host);
      body = V.growth.body(avg, scoresLine);
      ctaLabel = V.growth.cta;
      ctaMode = 'growth';
    } else if(avg >= 70 && strongCount >= 2 && weakest.value < 65){
      head = V.focus.head(weakest);
      body = V.focus.body(avg, scoresLine, weakest);
      ctaLabel = V.focus.cta;
      ctaMode = 'fix';
    } else if(avg >= 60){
      head = V.balanced.head();
      body = V.balanced.body(avg, scoresLine, weakest);
      ctaLabel = V.balanced.cta;
      ctaMode = 'fix';
    } else if(avg >= 40){
      const weakList = cats.filter(c => c.value < 60).map(c => c.label).join(', ');
      head = V.leak.head(host);
      body = V.leak.body(avg, scoresLine, weakList);
      ctaLabel = V.leak.cta;
      ctaMode = 'fix';
    } else {
      head = V.rebuild.head();
      body = V.rebuild.body(avg, scoresLine);
      ctaLabel = V.rebuild.cta;
      ctaMode = 'rebuild';
    }

    return {
      html: `<h3>${head}</h3><p>${body}</p>`,
      headText: head.replace(/<[^>]+>/g,''),
      bodyText: body.replace(/<[^>]+>/g,''),
      ctaLabel,
      ctaMode
    };
  }

  function verdictText(avg, host, scores){
    return buildVerdict(avg, host, scores).html;
  }

  function extractFindings(lh){
    const audits = lh.audits || {};
    const items = Object.keys(T.findingItems).map(id => ({ id, label: T.findingItems[id].label, hint: T.findingItems[id].hint }));

    const out = [];
    for(const it of items){
      const a = audits[it.id];
      if(!a) continue;
      let cls, icon, value;
      if(a.score === null){
        if(!a.displayValue) continue;
        cls = 'good'; icon = 'i'; value = a.displayValue;
      } else if(a.score >= 0.9){
        cls = 'good'; icon = '✓'; value = a.displayValue || T.findingBadges.ok;
      } else if(a.score >= 0.5){
        cls = 'warn'; icon = '!'; value = a.displayValue || T.findingBadges.warn;
      } else {
        cls = 'bad'; icon = '✕'; value = a.displayValue || T.findingBadges.bad;
      }
      out.push({cls, icon, label: it.label, hint: it.hint, value, priority: a.score === null ? 3 : (a.score < 0.5 ? 0 : a.score < 0.9 ? 1 : 2)});
    }
    out.sort((a,b) => a.priority - b.priority);
    return out.slice(0, 10);
  }

  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function findingCard(f){
    return `<div class="finding ${escapeHtml(f.cls)}">
      <div class="finding-icon">${escapeHtml(f.icon)}</div>
      <div><h4>${escapeHtml(f.label)}</h4><p>${escapeHtml(f.hint)}</p></div>
      <div class="finding-value">${escapeHtml(f.value)}</div>
    </div>`;
  }

  function buildWhatsappMsg(host, url, scores, avg){
    const scoreLines = scores.map(s => `${s.label}: ${s.score === null ? 'n.v.t.' : Math.round(s.score*100) + '/100'}`).join('\n');
    const who = currentLead ? `${currentLead.name}${currentLead.company ? ' van ' + currentLead.company : ''}` : 'ik';
    const contactLine = currentLead ? `\n(bereikbaar via ${currentLead.email})` : '';
    return `Hallo Harte Growth, ${who} heeft net de gratis groeiscan gedaan voor ${host}.

Overall score: ${avg}/100

${scoreLines}

Kunnen we bespreken wat de eerste stappen zouden zijn?

(URL: ${url})${contactLine}`;
  }
})();

// =============== CONTACT FORM → send-contact function ===============
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  const submitBtn = document.getElementById('contactSubmit');
  const status = document.getElementById('contactStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Versturen...';
    status.textContent = 'Wij ontvangen je bericht en reageren binnen 1 werkdag.';
    status.style.color = '';

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      url: form.url.value.trim(),
      message: form.message.value.trim()
    };

    try {
      const res = await fetch('/.netlify/functions/send-contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      if(!res.ok) throw new Error('send failed');
      // Success state
      form.reset();
      submitBtn.textContent = 'Bericht verzonden ✓';
      status.textContent = 'Bedankt! We reageren binnen 1 werkdag op ' + data.email + '.';
      status.style.color = '#4ade80';
      // GA4 conversie: succesvol contactformulier (geen persoonsgegevens meegegeven)
      if(window.hgTrack){ window.hgTrack('contact_form_submit', { page_path: location.pathname, form_name: 'contact' }); }
    } catch(err){
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Verstuur bericht <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      status.textContent = 'Verzenden lukte niet. Probeer opnieuw of app ons via de knop rechtsonder.';
      status.style.color = '#ff5c56';
    }
  });
})();
