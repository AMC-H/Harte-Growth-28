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

  // CINEMATIC SCROLL-SCRUB STATEMENT (video-like scrub without a video file)
  const cinematic = document.querySelector('.cinematic');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(cinematic && !reduceMotion){
    const cText = cinematic.querySelector('.cinematic-text');
    const cSub = cinematic.querySelector('.cinematic-sub');
    function updateCinematic(){
      const rect = cinematic.getBoundingClientRect();
      const total = cinematic.offsetHeight - window.innerHeight;
      let progress = total > 0 ? -rect.top / total : 0;
      progress = Math.max(0, Math.min(1, progress));
      const pText = Math.max(0, Math.min(1, progress / 0.4));
      const pSub = Math.max(0, Math.min(1, (progress - 0.15) / 0.4));
      if(cText){
        cText.style.opacity = pText;
        cText.style.filter = `blur(${(1 - pText) * 7}px)`;
        cText.style.transform = `scale(${0.9 + pText * 0.1})`;
      }
      if(cSub){
        cSub.style.opacity = pSub;
        cSub.style.transform = `translateY(${(1 - pSub) * 22}px)`;
      }
    }
    window.addEventListener('scroll', updateCinematic, {passive:true});
    window.addEventListener('resize', updateCinematic);
    updateCinematic();
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
        t.el.textContent = (t.decimals ? cur.toFixed(t.decimals).replace('.', document.documentElement.lang === 'en' ? '.' : ',') : Math.round(cur).toLocaleString('nl-NL')) + t.suffix;
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
        ctx.fillStyle = 'rgba(23,20,15,.22)';
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    window.addEventListener('resize', resize);
    resize(); loop();
  }
});

// =============== GROEISCAN AANVRAGEN → send-lead function ===============
(function(){
  const form = document.getElementById('groeiscanForm');
  if(!form) return;

  document.querySelectorAll('.scan-example').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('groeiscanUrl');
      if(input) input.value = btn.dataset.url || '';
    });
  });

  const submitBtn = document.getElementById('groeiscanSubmit');
  const status = document.getElementById('groeiscanStatus');
  const LANG = (document.documentElement.lang || 'nl').slice(0,2).toLowerCase();
  const L = ['nl','en','es'].includes(LANG) ? LANG : 'nl';
  const T = {
    nl: { sending:'Versturen...', okBtn:'Aanvraag verstuurd ✓', ok:(e)=>`Bedankt! We nemen ${e ? 'je site' : 'de site'} binnen 1 werkdag door en mailen je het rapport op ${e}.`, fail:'Verzenden lukte niet. Probeer opnieuw of app ons via de knop rechtsonder.' },
    en: { sending:'Sending...', okBtn:'Request sent ✓', ok:(e)=>`Thanks! We'll review your site within 1 business day and email the report to ${e}.`, fail:'Sending failed. Try again or message us via WhatsApp.' },
    es: { sending:'Enviando...', okBtn:'Solicitud enviada ✓', ok:(e)=>`¡Gracias! Revisaremos tu web en 1 día laborable y te enviaremos el informe a ${e}.`, fail:'No se pudo enviar. Inténtalo de nuevo o escríbenos por WhatsApp.' }
  }[L];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      url: form.url.value.trim(),
      consent: true,
      referrer: document.referrer || ''
    };
    submitBtn.disabled = true;
    submitBtn.textContent = T.sending;
    status.textContent = '';
    status.style.color = '';

    try {
      const res = await fetch('/.netlify/functions/send-lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      if(!res.ok) throw new Error('send failed');
      form.reset();
      submitBtn.textContent = T.okBtn;
      status.textContent = T.ok(data.email);
      status.style.color = 'var(--green)';
      if(window.hgTrack){ window.hgTrack('groeiscan_request_submit', { page_path: location.pathname, form_name: 'groeiscan' }); }
    } catch(err){
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Vraag de groeiscan aan <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      status.textContent = T.fail;
      status.style.color = '#ff5c56';
    }
  });
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
