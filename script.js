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
