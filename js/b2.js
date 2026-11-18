// Rapider — Option B v2 runtime. GSAP + ScrollTrigger + Lenis.
// The page is one day with Rapider: a shift clock maps scroll to time, the sky tint follows the hour (always light),
// and the night shift is a pinned scene where one task card travels Connect → Decide → Ask → Act.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const STATIC = root.classList.contains('static');
  const REDUCED = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  const MOBILE = () => matchMedia('(max-width: 900px)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (h) => { const m = Math.round(h * 60) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger);
  if (!REDUCED && window.Lenis && HAS_GSAP) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.H = { lenis };
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' }));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    scrollToY(t.getBoundingClientRect().top + scrollY - 70);
  });

  /* ---------- menu ---------- */
  const burger = $('.nav__burger'), sheet = $('#sheet');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); sheet.hidden = !open;
    burger.innerHTML = `<svg class="ic"><use href="#i-${open ? 'x' : 'menu'}"/></svg>`;
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) burger.click(); });

  /* ---------- text reveals (words, recursing into <em>) ---------- */
  const split = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 1) { if (n.tagName === 'EM') walk(n); return; }
        if (n.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
          w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      });
    };
    walk(el);
  };
  $$('.js-lines').forEach(split);
  $$('.st-line').forEach((l) => { const s = document.createElement('span'); while (l.firstChild) s.append(l.firstChild); l.append(s); });
  const once = (els, fn, margin = '0px 0px -10% 0px') => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { rootMargin: margin });
    els.forEach((el) => io.observe(el));
  };
  if (!STATIC) {
    const h1 = $('.hero .js-lines');
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => h1.classList.add('is-in'), 100));
    once($$('.js-lines').filter((e) => e !== h1), (el) => el.classList.add('is-in'));
    once($$('.rv'), (el) => el.classList.add('is-in'));
    once([$('.statement')], () => $$('.st-line').forEach((l, i) => setTimeout(() => l.classList.add('is-in'), i * 220)), '0px 0px -20% 0px');
    once([$('.pains')], () => $$('.pain').forEach((p, i) => setTimeout(() => p.classList.add('is-in'), 150 + i * 120)), '0px 0px -15% 0px');
  }

  /* ---------- the visitor's real time on the 24h ruler ---------- */
  const needle = $('#now');
  const tickNow = () => {
    const d = new Date(), h = d.getHours(), m = d.getMinutes();
    $$('.js-now').forEach((e) => { e.textContent = `${pad(h)}:${pad(m)}`; });
    needle.style.setProperty('--now', ((h * 60 + m) / 1440).toFixed(4));
  };
  tickNow(); setInterval(tickNow, 15000);

  /* ---------- logos marquee: duplicate once for a seamless loop ---------- */
  const mrow = $('.marquee__row');
  [...mrow.children].forEach((li) => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelector('.logo').removeAttribute('role'); c.querySelector('.logo').removeAttribute('aria-label'); mrow.append(c); });

  /* ---------- shift clock: scroll → time of day → sky tint ---------- */
  const SKY = [[9, [246, 240, 228]], [12, [247, 246, 241]], [16, [245, 241, 233]], [18, [244, 233, 227]], [20, [236, 233, 241]], [23, [228, 232, 241]], [27, [225, 230, 240]], [30.5, [240, 230, 228]], [32.5, [247, 233, 222]], [34, [247, 243, 235]]];
  const skyAt = (t) => {
    for (let i = 1; i < SKY.length; i++) if (t <= SKY[i][0]) {
      const [t0, a] = SKY[i - 1], [t1, b] = SKY[i], k = Math.max(0, (t - t0) / (t1 - t0));
      return a.map((v, j) => Math.round(v + (b[j] - v) * k));
    }
    return SKY[SKY.length - 1][1];
  };
  const phase = (h) => (h < 12 ? 'Team arrives' : h < 18 ? 'Team at work' : h < 20 ? 'Team signs off' : h < 30.5 ? 'Night · Rapider only' : h < 33 ? 'Dawn · handover' : 'Team is back');
  const anchors = $$('[data-time]');
  let tops = [], pinTime = null, lastKey = '';
  const measure = () => { tops = anchors.map((el) => [el.getBoundingClientRect().top + scrollY, +el.dataset.time]); };
  const clockEls = $$('.js-clock'), phaseEl = $('.js-phase'), clockBar = $('.clock');
  const renderClock = () => {
    let t;
    if (pinTime != null) t = pinTime;
    else {
      const y = scrollY + innerHeight * 0.5;
      t = tops.length ? tops[0][1] : 9;
      for (let i = 0; i < tops.length; i++) if (y >= tops[i][0]) {
        const nx = tops[i + 1];
        t = nx ? tops[i][1] + (nx[1] - tops[i][1]) * Math.min(1, (y - tops[i][0]) / (nx[0] - tops[i][0])) : tops[i][1];
      }
    }
    const key = hm(t);
    if (key !== lastKey) { lastKey = key; clockEls.forEach((e) => { e.textContent = key; }); phaseEl.textContent = phase(t); }
    clockBar.style.setProperty('--p', Math.min(1, Math.max(0, (t - 9) / 25)).toFixed(3));
    const [r, g, b] = skyAt(t), c = `rgb(${r},${g},${b})`;
    document.body.style.backgroundColor = c; root.style.setProperty('--sky', c);
  };

  /* ---------- night shift scene ---------- */
  const STOPS = [18.08, 21.67, 26.23, 32.78];
  const stations = $$('.station'), card = $('.jcard'), big = $('.js-big'), line = $('.js-night-phase'), track = $('.track');
  const rows = [0, 1, 2, 3].map((i) => $(`.js-r${i}`));
  const jtime = $('.js-jtime'), jstatus = $('.js-jstatus'), jbtn = $('.js-jbtn'), appr = $('.js-appr');
  const STATUS = ['Synced from Google Sheets', 'Qualified · ready to update', 'Waiting · your team is asleep', 'Done before 9'];
  let lastS = -1;
  const renderNight = (p) => {
    const h = 18 + p * (32.78 - 18);
    big.textContent = hm(h);
    let s = 0; STOPS.forEach((st, i) => { if (h >= st - 0.01) s = i; });
    // continuous position between stops
    let f = 0;
    for (let i = 0; i < STOPS.length - 1; i++) if (h >= STOPS[i]) f = i + Math.min(1, (h - STOPS[i]) / (STOPS[i + 1] - STOPS[i]));
    if (h < STOPS[0]) f = 0;
    const ease = (x) => { const i = Math.floor(x), k = x - i, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; return i + e; };
    const fe = Math.min(3, ease(f));
    if (!MOBILE()) {
      const tr = track.getBoundingClientRect(), stg = card.parentElement.getBoundingClientRect(), colW = tr.width / 4;
      card.style.left = `${tr.left - stg.left + fe * colW}px`;
    } else card.style.left = '';
    track.style.setProperty('--p', Math.min(1, (fe + 0.5) / 4).toFixed(3));
    jtime.textContent = hm(h);
    const done = h >= 32.7;
    if (s !== lastS || String(done) !== card.dataset.done) {
      lastS = s; card.dataset.done = done;
      stations.forEach((el, i) => { el.classList.toggle('is-on', i === s); el.classList.toggle('is-past', i < s); });
      rows.forEach((r, i) => r.classList.toggle('is-on', i <= s));
      jstatus.textContent = STATUS[s];
      jbtn.classList.toggle('is-wait', s === 2 && !done);
      jbtn.classList.toggle('is-done', done);
      jbtn.textContent = done ? 'Approved ✓' : 'Approve';
      appr.textContent = done ? 'Approved by Manager · 08:47' : 'Waiting for Manager';
    }
    line.textContent = h < 19.5 ? 'Your team goes home.' : h < 25 ? 'Rapider keeps working.' : h < 31.5 ? 'It waits for a human before it changes anything.' : 'Approved at 08:47. Done before 9.';
  };

  if (HAS_GSAP && !REDUCED) {
    /* hero: floating task cards drift on scroll and follow the pointer a little */
    const tasks = $$('.task');
    gsap.from(tasks, { opacity: 0, y: 30, scale: 0.9, duration: 1.1, stagger: 0.08, delay: 0.5, ease: 'power3.out' });
    tasks.forEach((t) => {
      const d = parseFloat(getComputedStyle(t).getPropertyValue('--d')) || 1;
      gsap.to(t, { yPercent: -60 * d - 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(t, { y: '+=8', duration: 2.2 + d, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    const fl = $('.float');
    addEventListener('pointermove', (e) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      gsap.to(fl, { x: x * 22, y: y * 14, duration: 1.2, ease: 'power3.out' });
    }, { passive: true });

    /* build: each panel tilts in, the one underneath steps back */
    const panels = $$('.panel');
    panels.forEach((p, i) => {
      if (i > 0) gsap.fromTo(p, { rotation: 2.5, y: 80 }, { rotation: 0, y: 0, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: () => `top ${$('#nav').offsetHeight + 120}px`, scrub: true } });
      if (i < panels.length - 1) gsap.to(p, { scale: 0.94, '--dim': 0.5, ease: 'none', scrollTrigger: { trigger: panels[i + 1], start: 'top bottom', end: () => `top ${$('#nav').offsetHeight + 40}px`, scrub: true } });
    });

    /* night shift: pinned, scroll = hours */
    ScrollTrigger.create({
      trigger: '.night__pin', start: () => `top ${$('#nav').offsetHeight}px`, end: '+=380%', pin: true, invalidateOnRefresh: true,
      onUpdate: (st) => { renderNight(st.progress); pinTime = 18 + st.progress * (32.78 - 18); renderClock(); },
      onLeave: () => { pinTime = null; }, onLeaveBack: () => { pinTime = null; },
      onRefresh: (st) => renderNight(st.progress),
    });

    /* stats count-up */
    $$('.cnt').forEach((el) => {
      const to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '', o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = pre + Math.round(o.v) + suf; } }) });
    });

    /* the sun rises behind the CTA */
    gsap.fromTo('.sun', { yPercent: 18, scale: 0.8 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    /* sticky pill */
    const pill = $('#pill');
    ScrollTrigger.create({ trigger: '.problem', start: 'top 70%', endTrigger: '#demo', end: 'top 80%', onToggle: (st) => pill.classList.toggle('is-on', st.isActive) });

    ScrollTrigger.addEventListener('refresh', () => { measure(); renderClock(); });
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    renderNight(0.55); // poster frame: the agent waiting for a human at 02:14
  }

  measure(); renderClock();
  let q = false;
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; renderClock(); }); } }, { passive: true });
  addEventListener('resize', () => { measure(); renderClock(); });

  /* phone conversation */
  const msgs = $$('#chat > *');
  if (REDUCED) msgs.forEach((m) => m.classList.add('is-on'));
  else once([$('.phone')], () => msgs.forEach((m, i) => setTimeout(() => m.classList.add('is-on'), 250 + i * 650)), '0px 0px -25% 0px');
})();
