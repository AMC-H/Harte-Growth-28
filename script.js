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

  // BOOKING WIDGET — day + time picker → WhatsApp
  const bookDays = document.getElementById('bookDays');
  const bookTimes = document.getElementById('bookTimes');
  const bookForm = document.getElementById('bookForm');
  const bookStatus = document.getElementById('bookStatus');
  if(bookDays && bookTimes && bookForm){
    const dayNames = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
    const monthNames = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
    const days = [];
    const cur = new Date();
    cur.setDate(cur.getDate() + 1);
    while(days.length < 6){
      const d = cur.getDay();
      if(d !== 0 && d !== 6){
        days.push({ label: dayNames[d], num: cur.getDate(), mon: monthNames[cur.getMonth()] });
      }
      cur.setDate(cur.getDate() + 1);
    }
    const times = ['10:00','11:00','14:00','15:00','16:00'];
    let selDay = null, selTime = null;

    days.forEach(d => {
      const btn = document.createElement('button');
      btn.className = 'day-btn';
      btn.type = 'button';
      btn.innerHTML = '<span class="dname">'+d.label+'</span><span class="dnum">'+d.num+'</span><span class="dmon">'+d.mon+'</span>';
      btn.addEventListener('click', () => {
        document.querySelectorAll('.day-btn.active').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selDay = d;
        bookTimes.classList.add('active');
        updateBookStatus();
      });
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

    bookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if(!selDay || !selTime){ return; }
      const name = bookForm.querySelector('[name=name]').value;
      const company = bookForm.querySelector('[name=company]').value;
      const contact = bookForm.querySelector('[name=contact]').value;
      const msg = 'Hallo Harte Growth, ik wil graag een kennismakingscall plannen op ' + selDay.label + ' ' + selDay.num + ' ' + selDay.mon + ' om ' + selTime + '. Ik ben ' + name + ' van ' + company + '. Bereikbaar via ' + contact + '.';
      window.location = 'https://wa.me/31634455762?text=' + encodeURIComponent(msg);
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
    // Als lead al bekend: direct scannen
    if(currentLead && currentLead.email){
      runScan(url);
    } else {
      pendingUrl = url;
      showGate();
    }
  });

  function showGate(){
    scanPanel.hidden = true;
    scanGate.hidden = false;
    gateError.hidden = true;
    setTimeout(() => scanGate.scrollIntoView({behavior:'smooth', block:'start'}), 80);
    setTimeout(() => gateName.focus(), 350);
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
      gateError.textContent = 'Vul je naam en een geldig e-mailadres in, en vink de toestemming aan.';
      return;
    }
    gateSubmit.disabled = true;
    // Verstuur naar Netlify Function → Resend (non-blocking: als het faalt gaat scan door)
    try {
      await fetch('/.netlify/functions/send-lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          company: lead.company || '',
          url: lead.url,
          consent: lead.consent,
          referrer: document.referrer || '',
          'bot-field': ''
        })
      });
    } catch(err){
      console.warn('[lead-mail] verzenden mislukt:', err);
    }
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
  const statusCycle = [
    { cat:'seo',    text:'SEO-signalen ophalen...' },
    { cat:'seo',    text:'Titel, meta en headings uitlezen' },
    { cat:'perf',   text:'Snelheid meten in echte browser' },
    { cat:'perf',   text:'Grootste elementen doorlopen' },
    { cat:'mobile', text:'Mobiele viewport testen' },
    { cat:'mobile', text:'Tik-doelen en tekstgrootte checken' },
    { cat:'tech',   text:'Technische audits draaien' },
    { cat:'tech',   text:'Structured data lezen' }
  ];
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
    setStatus('Verbinden met Google Lighthouse...');

    // Scroll naar panel
    setTimeout(() => scanPanel.scrollIntoView({behavior:'smooth', block:'start'}), 100);

    await wait(600);
    startStatusCycle();

    // Google PageSpeed API-key. Beperkt tot hartegrowth.netlify.app + hartegrowth.com via HTTP-referrer restrictions in Google Cloud Console.
    const API_KEY = 'AIzaSyCX90ioFgQaID9Ek2BflrcsrDrroQ7odss';
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&category=seo&category=accessibility&category=best-practices&strategy=mobile${keyParam}`;

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
      setStatus('Rapport klaar.');
      await wait(700);

      renderResults(url, host, lh);
    } catch(err){
      stopStatusCycle();
      scanError.hidden = false;
      scanRunning.hidden = true;
      let msg;
      if(err.message === 'RATE_LIMIT'){
        msg = 'Even geduld: er zijn nu net veel scans tegelijk. Wacht 30 seconden en probeer opnieuw. (De site kan meer scans aan zodra we de API-verhoging inschakelen.)';
      } else if(err.message === 'NO_RESULT' || (err.message && err.message.startsWith('API_400'))){
        msg = 'Deze URL kon niet worden gescand. Meestal betekent dit dat de site niet bereikbaar is vanaf Google, of dat er een IP-blokkade staat. Probeer een andere URL.';
      } else if(err.message && err.message.startsWith('API_')){
        msg = 'Google gaf een fout terug (' + err.message.replace('API_','code ') + '). Probeer over een minuut opnieuw.';
      } else {
        msg = 'De scan kon niet worden uitgevoerd: ' + (err.message || 'onbekende fout') + '. Check of de URL klopt en probeer opnieuw.';
      }
      scanErrorMsg.textContent = msg;
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
      { key:'seo', label:'SEO', score: cats.seo ? cats.seo.score : null },
      { key:'performance', label:'Snelheid', score: cats.performance ? cats.performance.score : null },
      { key:'accessibility', label:'Mobiel + toegankelijk', score: cats.accessibility ? cats.accessibility.score : null },
      { key:'best-practices', label:'Techniek', score: cats['best-practices'] ? cats['best-practices'].score : null }
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

    // Verdict
    const avg = Math.round(scores.filter(s => s.score !== null).reduce((a,s) => a + s.score, 0) / scores.filter(s => s.score !== null).length * 100);
    scanVerdict.innerHTML = verdictText(avg, host);

    // Findings
    scanFindings.innerHTML = extractFindings(lh).map(findingCard).join('');

    // WhatsApp handoff
    const waMsg = buildWhatsappMsg(host, url, scores, avg);
    scanWhatsapp.href = `https://wa.me/31634455762?text=${encodeURIComponent(waMsg)}`;
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

  function verdictText(avg, host){
    let head, body;
    if(avg >= 85){
      head = `<h3><em>${host}</em> staat er sterk voor.</h3>`;
      body = `<p>Score ${avg}/100. Weinig laaghangend fruit meer, wat wij zouden doen: focus verleggen naar content en zichtbaarheid buiten je eigen site (links, reviews, lokale rankings, ads op koopintentie).</p>`;
    } else if(avg >= 65){
      head = `<h3>Redelijk fundament, <em>ruimte om te winnen</em>.</h3>`;
      body = `<p>Score ${avg}/100. De basis staat, maar er zit rek in. Onze inschatting: 2 tot 4 gerichte fixes brengen je naar 85+, en dat merkt Google. Zie de bevindingen hieronder voor waar we zouden beginnen.</p>`;
    } else if(avg >= 40){
      head = `<h3>Er lekt <em>meer</em> dan je denkt.</h3>`;
      body = `<p>Score ${avg}/100. Je site werkt technisch, maar Google én bezoekers krijgen niet wat ze nodig hebben. Meestal is dit binnen 2 tot 3 weken te fixen zonder complete herbouw. Grote impact op vindbaarheid en conversie.</p>`;
    } else {
      head = `<h3>Deze site kost je nu <em>omzet</em>.</h3>`;
      body = `<p>Score ${avg}/100. Fundamentele issues met SEO, snelheid of mobiel. In deze staat is elke euro die je nu aan ads besteedt half weggegooid. We zouden starten bij een nieuwe basis, niet bij lappenwerk.</p>`;
    }
    return head + body;
  }

  function extractFindings(lh){
    const audits = lh.audits || {};
    const items = [
      { id:'document-title', label:'Titel-tag', hint:'De <title> is wat Google in de zoekresultaten toont en zwaar meeweegt.' },
      { id:'meta-description', label:'Meta beschrijving', hint:'De omschrijving onder je titel in Google. Overtuigt bezoekers om te klikken.' },
      { id:'html-has-lang', label:'Taalcode', hint:'Google weet dan zeker in welke taal je site is (belangrijk voor NL/ES).' },
      { id:'viewport', label:'Mobiele viewport', hint:'Zonder dit toont je site op mobiel te breed of onleesbaar.' },
      { id:'image-alt', label:'Alt-teksten bij afbeeldingen', hint:'Voor Google en voor bezoekers die geen beelden zien.' },
      { id:'link-text', label:'Klikbare linkteksten', hint:'"Klik hier" of "meer info" vertelt Google niets. Beschrijvende linkteksten wel.' },
      { id:'is-on-https', label:'HTTPS beveiliging', hint:'Zonder slotje in de browser waarschuwt Google én verlies je vertrouwen.' },
      { id:'first-contentful-paint', label:'Eerste zichtbaar', hint:'Hoe snel je bezoeker iets ziet gebeuren op je site.' },
      { id:'largest-contentful-paint', label:'Grootste element geladen', hint:'Wanneer het belangrijkste element (heldenafbeelding/heading) staat.' },
      { id:'cumulative-layout-shift', label:'Layout-verspringing', hint:'Als knoppen tijdens laden verspringen, verlies je clicks en vertrouwen.' },
      { id:'total-blocking-time', label:'Blokkeertijd', hint:'Hoe lang je site niet reageert op tikken/klikken tijdens laden.' },
      { id:'structured-data', label:'Structured data', hint:'Vertelt Google exact wat voor bedrijf je bent (bedrijf, product, review, etc.).' },
      { id:'color-contrast', label:'Kleurcontrast', hint:'Tekst moet leesbaar zijn voor iedereen, ook slechtziend of buiten in de zon.' },
      { id:'tap-targets', label:'Tik-doelen op mobiel', hint:'Knoppen te klein of te dicht op elkaar = mobiele bezoekers klikken verkeerd.' },
      { id:'font-size', label:'Tekstgrootte mobiel', hint:'Als tekst zoom-in nodig heeft, verlies je 60% van je bezoek.' }
    ];

    const out = [];
    for(const it of items){
      const a = audits[it.id];
      if(!a) continue;
      let cls, icon, value;
      if(a.score === null){
        // score-less audit → skip unless it has displayValue
        if(!a.displayValue) continue;
        cls = 'good'; icon = 'i'; value = a.displayValue;
      } else if(a.score >= 0.9){
        cls = 'good'; icon = '✓'; value = a.displayValue || 'ok';
      } else if(a.score >= 0.5){
        cls = 'warn'; icon = '!'; value = a.displayValue || 'kan beter';
      } else {
        cls = 'bad'; icon = '✕'; value = a.displayValue || 'fix nodig';
      }
      out.push({cls, icon, label: it.label, hint: it.hint, value, priority: a.score === null ? 3 : (a.score < 0.5 ? 0 : a.score < 0.9 ? 1 : 2)});
    }

    // Sorteer: slechtste eerst
    out.sort((a,b) => a.priority - b.priority);
    return out.slice(0, 10);
  }

  function findingCard(f){
    return `<div class="finding ${f.cls}">
      <div class="finding-icon">${f.icon}</div>
      <div><h4>${f.label}</h4><p>${f.hint}</p></div>
      <div class="finding-value">${f.value}</div>
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
