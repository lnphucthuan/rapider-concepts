// Rapider — Direction A runtime (Rapid-er · Loopsii/Ramp school). GSAP + ScrollTrigger + Lenis.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const STATIC = root.classList.contains('static');
  const REDUCED = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = () => matchMedia('(max-width: 900px)').matches;
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- scroll engine ---------- */
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!REDUCED && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.H = { lenis };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const t = document.querySelector(a.getAttribute('href')); if (!t) return;
    e.preventDefault();
    const y = t.getBoundingClientRect().top + scrollY - 70;
    lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' });
  });

  /* ---------- micro: announcement, nav, menus, toast ---------- */
  $('.announce__x').addEventListener('click', () => { $('#announce').classList.add('is-closed'); setTimeout(() => ScrollTrigger.refresh(), 600); });
  if (window.FX) FX.init({ cursor: 'volt' });
  const T0 = performance.now();

  /* ---------- preloader: a stopwatch start (once per session) ---------- */
  const intro = new Promise((done) => {
    if (!root.classList.contains('is-pre')) return done();
    try { sessionStorage.setItem('rp-a-intro', '1'); } catch (e) {}
    if (lenis) lenis.stop();
    const t = $('#preT'), bar = $('#preBar'), msg = $('#preDone'), d = $('#preD'), o = { v: 0 };
    const real = Math.min(1.4, Math.max(0.6, performance.now() / 1000));
    d.textContent = real.toFixed(2);
    gsap.timeline({ onComplete: () => { root.classList.remove('is-pre'); if (lenis) lenis.start(); done(); } })
      .to(o, { v: real, duration: 1.1, ease: 'power2.out', onUpdate: () => { t.textContent = o.v.toFixed(2); } })
      .to(bar, { width: '100%', duration: 1.1, ease: 'power2.out' }, 0)
      .to(msg, { opacity: 1, y: 0, duration: 0.4 }, '+=.05')
      .to('.pre__wipe', { yPercent: -250, duration: 0.7, ease: 'power3.inOut' }, '+=.55')
      .to('#pre', { yPercent: -100, duration: 0.7, ease: 'power3.inOut' }, '<.12');
  });

  const nav = $('#nav');
  const stuck = () => nav.classList.toggle('is-stuck', scrollY > 10);
  addEventListener('scroll', stuck, { passive: true }); stuck();
  $$('.menu__item').forEach((m) => {
    const b = $('button', m);
    const set = (v) => b.setAttribute('aria-expanded', String(v));
    m.addEventListener('mouseenter', () => set(true)); m.addEventListener('mouseleave', () => set(false));
    m.addEventListener('focusin', () => set(true)); m.addEventListener('focusout', (e) => { if (!m.contains(e.relatedTarget)) set(false); });
  });
  // mobile menu: a simple sheet built from the menu links
  const burger = $('.burger');
  const sheet = document.createElement('div');
  sheet.className = 'msheet'; sheet.hidden = true;
  sheet.innerHTML = '<a href="#features">Products</a><a href="#agent">Solutions</a><a href="#pricing">Pricing</a><a href="#proof">Customers</a><a class="btn" href="#cta">Book a demo <span class="ff">»</span></a>';
  nav.append(sheet);
  burger.addEventListener('click', () => {
    const open = sheet.hidden; sheet.hidden = !open; burger.setAttribute('aria-expanded', String(open));
    requestAnimationFrame(() => sheet.classList.toggle('is-open', open));
    burger.innerHTML = `<svg class="ic"><use href="#i-${open ? 'x' : 'menu'}"/></svg>`;
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) burger.click(); });
  const toast = $('#toastx'); let tt;
  const say = (html) => { toast.innerHTML = html; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2200); };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); } catch (e) {} say(`Copied <b>${b.dataset.copy}</b>`); }));
  $$('form.email').forEach((f) => f.addEventListener('submit', () => {
    const v = $('input', f).value.trim();
    const secs = ((performance.now() - T0) / 1000).toFixed(1);
    say(v ? `Done in ${secs}s. That was <b>rapid-er</b> — an engineer will write to ${v.replace(/[<>&"]/g, '')}` : 'Add your work email first — it takes two seconds');
  }));
  // personality: the email placeholder cycles through people who'd use it
  $$('form.email input').forEach((inp) => {
    const P = ["What's your work email?", 'ops@yourcompany.com', 'revops@yourcompany.com', 'cto@yourcompany.com'];
    let k = 0; setInterval(() => { if (document.activeElement !== inp && !inp.value) { k = (k + 1) % P.length; inp.placeholder = P[k]; } }, 2600);
  });

  /* ---------- text reveals ---------- */
  const split = (el) => {
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) { if (!n.classList.contains('er')) walk(n); return; }
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((p) => {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.append(' '); return; }
        const w = document.createElement('span'); w.className = 'w';
        const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
        w.append(s); frag.append(w);
      });
      n.replaceWith(frag);
    });
    walk(el);
  };
  $$('.rv-lines').forEach(split);
  const once = (els, fn, margin = '0px 0px -12% 0px') => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { rootMargin: margin });
    els.forEach((el) => io.observe(el));
  };
  const seen = (el, fn) => new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting))).observe(el);
  if (!STATIC) {
    const h1 = $('.hero .rv-lines');
    // hero: one calm sequence — stage settles, then sidebar, table rows (wiped in from the left), approval card, ticker, small assets
    // (power3/expo ease-outs only, 8–28 px of travel, no overshoot, no rotation)
    gsap.set('.stage', { opacity: 0, y: 28 });
    gsap.set('.app__side a, .app__drawer > *, .ticker > span', { opacity: 0, y: 8 });
    gsap.set('.tbl tbody tr', { clipPath: 'inset(0 100% 0 0)' });
    gsap.set('.float--slack', { opacity: 0, y: 14 });
    Promise.all([document.fonts ? document.fonts.ready : 0, intro]).then(() => {
      setTimeout(() => h1.classList.add('is-in'), 60);
      gsap.timeline({ delay: 0.2, defaults: { ease: 'power3.out' } })
        .to('.stage', { opacity: 1, y: 0, duration: 1.1 })
        .to('.app__side a', { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, 0.3)
        .to('.tbl tbody tr', { clipPath: 'inset(0 0% 0 0)', duration: 0.85, stagger: 0.07, ease: 'expo.out', clearProps: 'clipPath' }, 0.4)
        .to('.app__drawer > *', { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, 0.6)
        .to('.ticker > span', { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }, 0.85)
        .to('.float--slack', { opacity: 1, y: 0, duration: 0.9, onComplete: () => gsap.to('.float--slack', { y: -4, duration: 4.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }) }, 1.2);
    });
    once($$('.rv-lines').filter((e) => e !== h1), (el) => el.classList.add('is-in'));
    once($$('.rv'), (el) => el.classList.add('is-in'));
  }

  /* ---------- stopwatch + speed-reactive type ---------- */
  const sw = $('#sw'), t0 = performance.now();
  const tick = () => { const ms = performance.now() - t0, s = Math.floor(ms / 1000); sw.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}.${pad(Math.floor((ms % 1000) / 10))}`; requestAnimationFrame(tick); };
  if (!REDUCED) requestAnimationFrame(tick);
  if (lenis) {
    let sl = 0, wd = 100;
    gsap.ticker.add(() => {
      const v = Math.min(70, Math.abs(lenis.velocity || 0));
      sl += (-(v / 70) * 9 - sl) * 0.12; wd += (100 + (v / 70) * 16 - wd) * 0.12;
      root.style.setProperty('--slnt', sl.toFixed(2)); root.style.setProperty('--wdth', wd.toFixed(1));
    });
  }

  /* ---------- hero: the agent console runs (sample data) ---------- */
  (() => {
    const rows = $$('#rows tr'), feed = $('#feed'), btn = $('#approveBtn'), req = $('#req'), toastCard = $('#toast');
    const nums = $$('.ticker b');
    let visible = true, approved = false, running = false;
    seen($('#stage'), (v) => { visible = v; });
    const wait = (ms) => new Promise((r) => { const go = () => (visible && !document.hidden ? setTimeout(r, ms) : setTimeout(go, 300)); go(); });
    const setChip = (tr, cls, txt) => { const c = $('.chip', tr); c.className = 'chip ' + cls; c.textContent = txt; tr.classList.add('is-flash'); setTimeout(() => tr.classList.remove('is-flash'), 700); };
    const log = (txt) => { const d = new Date(); const li = document.createElement('li'); li.className = 'is-new'; li.innerHTML = `<span>${pad(d.getHours())}:${pad(d.getMinutes())}</span>${txt}`; feed.append(li); while (feed.children.length > 4) feed.firstElementChild.remove(); };
    const vals = nums.map(() => ({ v: 0 }));
    const count = (k) => nums.forEach((b, i) => {
      const to = +b.dataset.n * k, dec = +(b.dataset.d || 0), o = vals[i];
      if (k === 0.55) o.v = 0;
      gsap.to(o, { v: to, duration: 1.2, ease: 'power2.out', onUpdate: () => { b.textContent = dec ? o.v.toFixed(1) : fmt(o.v); } });
    });
    const approve = async () => {
      if (approved) return; approved = true;
      btn.classList.add('is-press'); setTimeout(() => btn.classList.remove('is-press'), 140);
      btn.classList.add('is-load'); await wait(900);
      btn.classList.remove('is-load'); btn.classList.add('is-done'); $('.lbl', btn).textContent = 'Approved ✓'; req.classList.add('is-done');
      $('.chip', req).className = 'chip chip--ok'; $('.chip', req).textContent = 'Approved';
      log('Sarah K. approved · writing to Salesforce');
      await wait(700); toastCard.classList.add('is-on'); count(1);
      rows.slice(0, 2).forEach((r) => { $('td:last-child', r).textContent = 'Synced ✓'; });
    };
    btn.addEventListener('click', approve);
    const run = async () => {
      if (running) return; running = true;
      for (;;) {
        approved = false; toastCard.classList.remove('is-on'); req.classList.remove('is-done');
        btn.classList.remove('is-done', 'is-load'); $('.lbl', btn).textContent = 'Approve';
        $('.chip', req).className = 'chip chip--wait'; $('.chip', req).textContent = 'Needs approval';
        setChip(rows[2], 'chip--run', 'Enriching'); setChip(rows[3], 'chip--run', 'Enriching'); setChip(rows[4], 'chip--new', 'New'); setChip(rows[5], 'chip--new', 'New');
        rows.forEach((r, i) => { $('td:last-child', r).textContent = i < 2 ? 'Update CRM' : i < 4 ? 'Web lookup' : 'Queue'; });
        nums.forEach((b) => { b.textContent = '0'; }); count(0.55);
        await wait(1600); setChip(rows[2], 'chip--ok', 'Qualified'); log('Kite &amp; Co · 51–200 · qualified');
        await wait(900); setChip(rows[3], 'chip--ok', 'Qualified'); setChip(rows[4], 'chip--run', 'Enriching'); log('Atlas Freight · 1k+ · qualified');
        await wait(1100); setChip(rows[4], 'chip--ok', 'Qualified'); setChip(rows[5], 'chip--run', 'Enriching');
        await wait(1000); setChip(rows[5], 'chip--ok', 'Qualified'); log('Asked Sarah K. for approval');
        await wait(2600); await approve();
        await wait(5200);
      }
    };
    if (REDUCED) { rows.forEach((r) => setChip(r, 'chip--ok', 'Qualified')); nums.forEach((b) => { b.textContent = b.dataset.d ? b.dataset.n : fmt(+b.dataset.n); }); }
    else setTimeout(run, 1200);
  })();

  /* ---------- chaos → order (pinned) ---------- */
  (() => {
    const wins = $$('.win'), core = $('.order__core'), ring = $('.order__ring'), dots = $$('.order__ring > span');
    const a = $('.chaos__a'), b = $('.chaos__b'), sa = $('.chaos__sa'), sb = $('.chaos__sb');
    gsap.set(wins, { xPercent: -50, yPercent: -50, rotation: (i, el) => +el.style.getPropertyValue('--r') });
    gsap.set([core, ring], { scale: 0.6, opacity: 0 });
    gsap.set(b, { opacity: 0.18 });
    const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: REDUCED, scrollTrigger: REDUCED ? undefined : { trigger: '.chaos__pin', start: () => `top ${nav.offsetHeight}px`, end: '+=220%', pin: true, scrub: 0.6 } });
    tl.to(wins, { x: (i) => (i % 2 ? 14 : -14), y: (i) => (i % 3 ? -10 : 12), rotation: (i, el) => +el.style.getPropertyValue('--r') * 1.6, duration: 0.6, ease: 'sine.inOut' })
      .to(wins, { left: '50%', top: '52%', scale: 0.18, opacity: 0, rotation: 0, duration: 0.7, stagger: 0.05, ease: 'power3.in' }, 0.6)
      .to(a, { opacity: 0.25, duration: 0.3 }, 0.9)
      .to(b, { opacity: 1, duration: 0.3 }, 0.95)
      .to(sa, { opacity: 0, duration: 0.2 }, 0.9)
      .to(sb, { opacity: 1, duration: 0.3 }, 1.05)
      .to([core, ring], { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }, 1.05)
      .from(dots, { scale: 0, duration: 0.3, stagger: 0.04, ease: 'power3.out' }, 1.2)
      .to({}, { duration: 0.35 });
    if (REDUCED) tl.progress(1);
    if (!REDUCED) gsap.to(ring, { rotation: 360, duration: 60, repeat: -1, ease: 'none' }), gsap.to(dots, { rotation: -360, duration: 60, repeat: -1, ease: 'none' });
  })();

  /* ---------- calculator ---------- */
  (() => {
    const team = $('#team'), hrs = $('#hrs'), teamV = $('#teamV'), hrsV = $('#hrsV');
    const out = $('#hoursBack'), fte = $('#fte'), picked = $('#picked'), bar = $('#resBar');
    const chips = $$('.chips input');
    const o = { v: 0 };
    const paint = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100);
    const bump = (el) => { el.classList.add('is-bump'); setTimeout(() => el.classList.remove('is-bump'), 160); };
    const calc = () => {
      paint(team); paint(hrs);
      teamV.textContent = team.value; hrsV.textContent = hrs.value;
      const n = chips.filter((c) => c.checked).length, share = n / chips.length;
      const total = +team.value * +hrs.value * 4.33 * share * 0.7;
      picked.textContent = `${n} of ${chips.length}`;
      bar.style.width = `${Math.round(share * 70)}%`;
      gsap.to(o, { v: total, duration: 0.6, ease: 'power3.out', onUpdate: () => { out.textContent = fmt(o.v); fte.textContent = (o.v / 160).toFixed(1); } });
      const q = $('#quip');
      if (q) q.textContent = total < 40 ? 'A long lunch, every week. Start small.' : total < 160 ? "That's a whole team's Friday, every month." : total < 800 ? `That's ${Math.round(total / 160)} people back on real work.` : 'That\'s a department. Rapid-er, indeed.';
    };
    [team, hrs].forEach((r) => r.addEventListener('input', () => { calc(); bump(r === team ? teamV : hrsV); }));
    chips.forEach((c) => c.addEventListener('change', calc));
    calc();
  })();

  /* ---------- race (pinned) ---------- */
  (() => {
    const day = $('#day'), oldFill = $('#oldFill'), newFill = $('#newFill'), oldPct = $('#oldPct'), newPct = $('#newPct'), live = $('#live');
    const ms = $$('.ms'), legend = $$('.race__legend li');
    const render = (p) => {
      const d = Math.round(p * 120);
      day.textContent = pad(d, 3);
      const o = d / 120, n = Math.min(1, d / 60);
      oldFill.style.setProperty('--p', o.toFixed(3)); newFill.style.setProperty('--p', (n * 0.5).toFixed(3));
      oldPct.textContent = d >= 120 ? 'Launched' : `${Math.round(o * 100)}%`;
      newPct.textContent = d >= 60 ? 'Live · still working' : `${Math.round(n * 100)}%`;
      live.classList.toggle('is-on', d >= 60);
      ms.forEach((m) => m.classList.toggle('is-on', d >= +m.dataset.d));
      const s = d >= 60 ? 3 : d >= 45 ? 2 : d >= 24 ? 1 : 0;
      legend.forEach((l, i) => l.classList.toggle('is-on', i === s));
    };
    if (REDUCED) render(0.7);
    else { render(0); ScrollTrigger.create({ trigger: '.race__pin', start: () => `top ${nav.offsetHeight}px`, end: '+=200%', pin: true, onUpdate: (st) => render(st.progress) }); }
  })();

  /* ---------- feature cards: small live demos ---------- */
  (() => {
    // views: grid ⇄ kanban (auto when visible, and on hover)
    const v = $('.fui--views'), cards = $$('.bc', v), seg = $$('.seg span', v);
    const place = (kan) => {
      const W = v.querySelector('.board').clientWidth, cw = (W - 20) / 3, counts = [0, 0, 0];
      cards.forEach((c, i) => {
        if (kan) { const col = +c.dataset.c, k = counts[col]++; c.style.left = `${col * (cw + 10) + 7}px`; c.style.top = `${36 + k * 48}px`; }
        else { const j = i % 3, row = Math.floor(i / 3); c.style.left = `${j * (cw + 10)}px`; c.style.top = `${row * 50}px`; }
      });
      v.classList.toggle('is-kanban', kan); seg.forEach((s, i) => s.classList.toggle('is-on', kan ? i === 1 : i === 0));
    };
    let kan = false, vis = false; place(false);
    seen(v, (x) => { vis = x; });
    v.closest('.fcard').addEventListener('mouseenter', () => { kan = !kan; place(kan); });
    if (!REDUCED) setInterval(() => { if (vis && !document.hidden) { kan = !kan; place(kan); } }, 3200);
    addEventListener('resize', () => place(kan));
    // sync: values update on both sides
    const st = $$('.fui--sync .js-st'), ago = $('.fui--sync .js-ago'), states = ['Qualified', 'Contacted', 'Demo booked', 'Won'];
    let si = 0, sec = 0;
    if (!REDUCED) setInterval(() => {
      sec++; ago.textContent = sec % 4 ? `${sec % 4}s ago` : 'just now';
      if (sec % 4 === 0) { si = (si + 1) % states.length; st[0].textContent = states[si]; st[0].classList.add('is-flash'); setTimeout(() => { st[1].textContent = states[si]; st[1].classList.add('is-flash'); }, 700); setTimeout(() => st.forEach((e) => e.classList.remove('is-flash')), 1500); }
    }, 1000);
    // builder: the prompt types, then the new step appears
    const b = $('.fui--build'), pr = $('#prompt'), TXT = pr.textContent;
    const typeIt = async () => {
      for (;;) {
        b.classList.remove('is-built'); pr.textContent = '';
        for (let i = 1; i <= TXT.length; i++) { pr.textContent = TXT.slice(0, i); await new Promise((r) => setTimeout(r, 38)); }
        await new Promise((r) => setTimeout(r, 500)); b.classList.add('is-built');
        await new Promise((r) => setTimeout(r, 3800));
      }
    };
    if (REDUCED) b.classList.add('is-built'); else once([b], typeIt);
  })();

  /* ---------- videos play only when on screen ---------- */
  $$('video').forEach((v) => { v.muted = true; new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !REDUCED) v.play().catch(() => {}); else v.pause(); }), { rootMargin: '120px' }).observe(v); });

  /* ---------- the calculator slides over the chaos scene ---------- */
  if (!REDUCED) gsap.to(['.order', '.chaos__t', '.chaos__sub'], { scale: 0.92, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.calc', start: 'top bottom', end: 'top 20%', scrub: true } });

  /* ---------- night shift: card opens into the screen, the night passes ---------- */
  (() => {
    const fr = $('#cineFrame'), clock = $('#cineClock'), pops = $$('.pops li'), lines = $$('.cine__t > span');
    const hm = (h) => { const m = Math.round(h * 60) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
    const render = (p) => {
      const open = Math.min(1, p / 0.28);
      fr.style.setProperty('--in-y', `${(1 - open) * (MOBILE() ? 8 : 14)}%`); fr.style.setProperty('--in-x', `${(1 - open) * (MOBILE() ? 4 : 18)}%`);
      fr.style.setProperty('--in-r', `${(1 - open) * 36}px`); fr.style.setProperty('--vs', (1.18 - open * 0.18).toFixed(3));
      const h = 18 + Math.max(0, Math.min(1, (p - 0.2) / 0.75)) * 14.05;
      clock.textContent = hm(h);
      pops.forEach((li) => li.classList.toggle('is-on', h >= +li.dataset.t));
      lines.forEach((l, i) => l.classList.toggle('is-in', p > 0.08 + i * 0.1));
    };
    if (REDUCED) { render(1); return; }
    gsap.set(lines, { yPercent: 40, opacity: 0 });
    ScrollTrigger.create({ trigger: '.cine__pin', start: 'top top', end: '+=220%', pin: true, onUpdate: (st) => {
      render(st.progress);
      lines.forEach((l) => gsap.to(l, { yPercent: l.classList.contains('is-in') ? 0 : 40, opacity: l.classList.contains('is-in') ? 1 : 0, duration: 0.6, overwrite: 'auto' }));
    } });
    render(0);
  })();

  /* ---------- fast-forward wipe + comparatives marquee follow your scroll ---------- */
  if (!REDUCED) {
    gsap.fromTo('.ffwipe span', { xPercent: -45 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.ffwipe', start: 'top bottom', end: 'bottom top', scrub: true } });
    const row = $('.comp__row'); let x = 0, dir = 1;
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity || 0 : 0; if (Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1;
      x -= (0.6 + Math.min(14, Math.abs(v) * 0.35)) * dir;
      const w = row.scrollWidth / 2; if (x <= -w) x += w; if (x > 0) x -= w;
      row.style.transform = `translateX(${x}px) skewX(${Math.max(-6, Math.min(6, -v * 0.15))}deg)`;
    });
    // easter egg: a fast scroll gets noticed (once)
    let noticed = false;
    if (lenis) lenis.on('scroll', ({ velocity }) => { if (!noticed && Math.abs(velocity) > 80) { noticed = true; say('Whoa — that was a <b>rapid-er</b> scroll.'); } });
  }

  /* ---------- sample agent: approve from your phone (real footage) ---------- */
  (() => {
    const b1 = $('.bub--1'), b2 = $('#bub2'), b3 = $('#bub3'), btn = $('#phoneApprove'); let done = false;
    const approve = () => {
      if (done) return; done = true;
      btn.classList.add('is-load');
      setTimeout(() => { btn.classList.remove('is-load'); btn.classList.add('is-done'); btn.textContent = 'Approved ✓'; b2.classList.add('is-on'); }, 800);
      setTimeout(() => b3.classList.add('is-on'), 1700);
    };
    btn.addEventListener('click', approve);
    if (REDUCED) { [b1, b2, b3].forEach((b) => b.classList.add('is-on')); return; }
    once([$('.shot')], () => { setTimeout(() => b1.classList.add('is-on'), 300); setTimeout(approve, 3600); }, '0px 0px -25% 0px');
  })();

  /* ---------- CTA opens like an iris ---------- */
  if (!REDUCED) gsap.fromTo('.cta', { clipPath: 'circle(12% at 50% 55%)' }, { clipPath: 'circle(150% at 50% 55%)', ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'top 15%', scrub: true } });

  /* ---------- footer: how long you took ---------- */
  once([$('.foot__lap')], () => {
    const s = Math.round((performance.now() - T0) / 1000);
    $('#lapT').textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    const o = { v: 0 }; gsap.to(o, { v: Math.floor(s / 1.5), duration: 1.2, ease: 'power2.out', onUpdate: () => { $('#lapN').textContent = fmt(o.v); } });
  }, '0px');

  /* ---------- counters ---------- */
  $$('.cnt').forEach((el) => {
    if (REDUCED) return;
    const to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '', o = { v: 0 };
    el.textContent = pre + '0' + suf;
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = pre + Math.round(o.v) + suf; } }) });
  });

  /* ---------- pricing toggle ---------- */
  (() => {
    const bill = $('.bill'), btns = $$('button', bill), knob = $('.bill__knob', bill), prices = $$('.plan__p b[data-m]');
    const move = (b) => { bill.style.setProperty('--kw', `${b.offsetWidth}px`); bill.style.setProperty('--kx', `${b.offsetLeft - 4}px`); };
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); move(b);
      prices.forEach((p, i) => { p.classList.add('is-flip'); setTimeout(() => { p.textContent = '$' + p.dataset[b.dataset.b]; p.classList.remove('is-flip'); }, 180 + i * 60); });
    }));
    requestAnimationFrame(() => move(btns[0]));
    addEventListener('resize', () => move(btns.find((b) => b.getAttribute('aria-pressed') === 'true')));
  })();

  /* ---------- CTA mosaic: fast-forward tiles ---------- */
  (() => {
    const m = $('.mosaic'), cta = $('.cta');
    const COLORS = ['#d7ff3f', '#c4e3f3', '#ffa587', '#bcd6ae', '#f4d29c', '#d6ccf5', '#ebe7dc', '#ebe7dc', '#ebe7dc'];
    const build = () => {
      const cell = innerWidth < 600 ? 56 : 90, cols = Math.ceil(cta.clientWidth / cell), rows = Math.ceil(cta.clientHeight / cell);
      m.style.setProperty('--cols', cols); m.style.setProperty('--cell', `${cell}px`);
      m.innerHTML = '';
      for (let i = 0; i < cols * rows; i++) {
        const t = document.createElement('i'), r = Math.random();
        t.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        if (r < 0.18) t.className = 's1'; else if (r < 0.3) t.className = 's2'; else if (r < 0.4) t.className = 's3'; else if (r < 0.48) t.className = 's4';
        m.append(t);
      }
      return cols;
    };
    const cols = build();
    if (REDUCED) return;
    const tiles = $$('i', m);
    gsap.from(tiles, { scaleX: 0, duration: 0.8, ease: 'expo.out', stagger: { each: 0.012, grid: [Math.ceil(tiles.length / cols), cols], from: 'start', axis: 'x' }, scrollTrigger: { trigger: cta, start: 'top 70%' } });
    cta.addEventListener('pointermove', (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.parentElement === m && !el.dataset.busy) {
        el.dataset.busy = 1;
        gsap.fromTo(el, { scaleX: 0.2 }, { scaleX: 1, duration: 0.6, ease: 'expo.out', onComplete: () => { delete el.dataset.busy; } });
      }
    });
  })();

  // triggers were created out of page order (the night scene sits before the race): sort, then measure
  ScrollTrigger.sort(); ScrollTrigger.refresh();
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
