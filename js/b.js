// Rapider — Option B runtime. Lenis (smooth scroll) only. Signature: scroll = one 24-hour shift.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const STATIC = root.classList.contains('static');
  const REDUCED = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  $('#yr').textContent = new Date().getFullYear();

  /* smooth scroll */
  let lenis = null;
  if (!REDUCED && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  window.H = { lenis }; // QA scripts jump with H.lenis
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -80 }); else t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  });

  /* mobile menu */
  const burger = $('.nav__burger'), sheet = $('#sheet');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); sheet.hidden = !open;
    burger.innerHTML = `<svg class="ic"><use href="#i-${open ? 'x' : 'menu'}"/></svg>`;
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) burger.click(); });

  /* word mask reveal */
  $$('.js-words').forEach((el) => {
    let i = 0;
    [...el.childNodes].forEach((n) => {
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
  });
  const once = (els, fn, margin = '0px 0px -10% 0px') => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { rootMargin: margin });
    els.forEach((el) => io.observe(el));
  };
  const visible = new Map();
  const watch = (el) => { visible.set(el, false); new IntersectionObserver((es) => es.forEach((e) => visible.set(e.target, e.isIntersecting))).observe(el); };
  const isOn = (el) => visible.get(el) && !document.hidden;
  if (!STATIC) {
    const h1 = $('.hero .js-words');
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => h1.classList.add('is-in'), 120));
    once($$('.js-words').filter((e) => e !== h1), (el) => el.classList.add('is-in'));
    once($$('.rv'), (el) => el.classList.add('is-in'));
  }

  /* live clocks: real local time */
  const nowEls = $$('.js-now'), nowHm = $$('.js-now-hm'), needle = $('#now');
  const tickNow = () => {
    const d = new Date(), h = d.getHours(), m = d.getMinutes();
    nowEls.forEach((e) => { e.textContent = `${pad(h)}:${pad(m)}:${pad(d.getSeconds())}`; });
    nowHm.forEach((e) => { e.textContent = `${pad(h)}:${pad(m)}`; });
    needle.style.setProperty('--now', ((h * 60 + m) / 1440).toFixed(4));
  };
  tickNow(); setInterval(tickNow, 1000);

  /* hero shift log: types in, then keeps working */
  const log = $('#log'), hero = $('.hero'); watch(hero);
  const POOL = [
    'Synced 42 Jira tickets → Notion roadmap',
    'Sent welcome email · employee handbook attached',
    'Call scheduled for #meeting_date via Google Meet',
    'Waiting · approval to update 12 invoices → Finance',
    'Answered 9 Slack questions from the sales team',
    'Updated kanban view · 31 tasks re-assigned',
    'Pulled 64 rows from PostgreSQL · report drafted',
  ];
  let pi = 0;
  const addLine = async (time, text, cls = '') => {
    const li = document.createElement('li'); li.className = `is-new is-typing ${cls}`;
    li.innerHTML = `<time>${time}</time><span></span>`; log.append(li);
    const sp = $('span', li);
    for (let c = 1; c <= text.length; c++) { sp.textContent = text.slice(0, c); await new Promise((r) => setTimeout(r, 14)); }
    li.classList.remove('is-typing');
    while (log.children.length > 6) log.firstElementChild.remove();
  };
  if (!REDUCED) {
    const seed = $$('li', log).map((li) => [$('time', li).textContent, $('span', li).textContent, li.className]);
    log.innerHTML = '';
    (async () => {
      await new Promise((r) => setTimeout(r, 900));
      for (const [t, s, c] of seed) { await addLine(t, s, c); await new Promise((r) => setTimeout(r, 260)); }
      setInterval(() => {
        if (!isOn(hero)) return;
        const d = new Date(), s = POOL[pi++ % POOL.length];
        addLine(`${pad(d.getHours())}:${pad(d.getMinutes())}`, s, /^Waiting/.test(s) ? 'is-wait' : '');
      }, 4200);
    })();
  }

  /* small live details in the feature list */
  const feats = $('.feats'); watch(feats);
  setInterval(() => {
    if (REDUCED || !isOn(feats)) return;
    $$('.js-cycle', feats).forEach((el, k) => setTimeout(() => {
      const opts = el.dataset.cycle.split('|'), n = (opts.indexOf(el.textContent) + 1) % opts.length;
      el.classList.add('is-out');
      setTimeout(() => { el.textContent = opts[n]; el.classList.remove('is-out'); }, 300);
    }, k * 700));
  }, 3000);
  let ago = 0;
  setInterval(() => { ago = (ago + 1) % 6; $$('.js-ago').forEach((e) => { e.textContent = ago ? `${ago}s ago` : 'just now'; }); }, 1000);

  /* phone: the conversation crosses the night */
  const msgs = $$('#chat > *');
  if (REDUCED) msgs.forEach((m) => m.classList.add('is-on'));
  else once([$('.phone')], () => msgs.forEach((m, i) => setTimeout(() => m.classList.add('is-on'), 300 + i * 700)), '0px 0px -25% 0px');

  /* ---------- the shift clock: scroll position → time of day ---------- */
  const anchors = $$('[data-time]');
  let tops = [];
  const measure = () => { tops = anchors.map((el) => [el.getBoundingClientRect().top + scrollY, +el.dataset.time]); };
  // ground colour across the shift (hours from 09:00 day 1 to 09:00 day 2)
  const TONE = [[9, [18, 19, 23]], [17, [18, 19, 23]], [21, [12, 13, 16]], [25, [8, 9, 11]], [29, [10, 10, 12]], [31.5, [19, 17, 14]], [33, [24, 19, 13]]];
  const tone = (t) => {
    for (let i = 1; i < TONE.length; i++) {
      if (t <= TONE[i][0]) {
        const [t0, a] = TONE[i - 1], [t1, b] = TONE[i], k = Math.max(0, (t - t0) / (t1 - t0));
        return a.map((v, j) => Math.round(v + (b[j] - v) * k));
      }
    }
    return TONE[TONE.length - 1][1];
  };
  const phase = (h) => (h >= 9 && h < 12 ? 'Team arrives' : h < 18 && h >= 12 ? 'Team at work' : h >= 18 && h < 21 ? 'Team signs off' : h >= 21 || h < 6 ? 'Night · Rapider only' : 'Dawn · handover');
  const clockEls = $$('.js-clock'), phaseEls = $$('.js-phase'), nav = $('#nav');
  let lastKey = '';
  const update = () => {
    const y = scrollY + innerHeight * 0.5;
    let t = tops[0] ? tops[0][1] : 9;
    for (let i = 0; i < tops.length; i++) {
      if (y >= tops[i][0]) {
        const next = tops[i + 1];
        t = next ? tops[i][1] + (next[1] - tops[i][1]) * Math.min(1, (y - tops[i][0]) / (next[0] - tops[i][0])) : tops[i][1];
      }
    }
    if (scrollY + innerHeight >= root.scrollHeight - 4) t = 33;
    const mins = Math.round((t * 60) / 5) * 5, h = Math.floor(mins / 60) % 24, m = mins % 60, key = `${h}:${m}`;
    if (key !== lastKey) {
      lastKey = key;
      clockEls.forEach((e) => { e.textContent = `${pad(h)}:${pad(m)}`; });
      phaseEls.forEach((e) => { e.textContent = phase(h); });
    }
    nav.style.setProperty('--p', ((t - 9) / 24).toFixed(4));
    const [r, g, b] = tone(t), c = `rgb(${r},${g},${b})`;
    document.body.style.backgroundColor = c; root.style.setProperty('--bg', c);
  };
  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } };
  measure(); update();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); update(); });
  addEventListener('load', () => { measure(); update(); });
  if (document.fonts) document.fonts.ready.then(() => { measure(); update(); });
})();
