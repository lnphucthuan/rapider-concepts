// Rapider — Option A runtime. No libraries. Signature: the live desk (an agent run with human approvals).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const STATIC = document.documentElement.classList.contains('static');
  const REDUCED = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#yr').textContent = new Date().getFullYear();

  /* nav */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.nav__burger'), sheet = $('#sheet');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); sheet.hidden = !open;
    burger.innerHTML = `<svg class="ic"><use href="#i-${open ? 'x' : 'menu'}"/></svg>`;
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) burger.click(); });

  /* in-view helpers */
  const once = (els, fn, margin = '0px 0px -12% 0px') => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { rootMargin: margin });
    els.forEach((el) => io.observe(el));
  };
  const watch = (els, fn) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => fn(e.target, e.isIntersecting)));
    els.forEach((el) => io.observe(el));
  };
  if (!STATIC) once($$('.rv'), (el) => el.classList.add('is-in'));
  watch($$('.vig, .hub'), (el, on) => el.classList.toggle('in-view', on && !REDUCED));

  /* vignette: views (grid <-> kanban) */
  const views = $('[data-vig="views"]');
  let vt = 0;
  setInterval(() => {
    if (REDUCED || !views.classList.contains('in-view') || document.hidden) return;
    vt ^= 1; views.classList.toggle('is-kanban', !!vt);
    $$('.seg span', views).forEach((s, i) => s.classList.toggle('is-on', i === vt));
  }, 2800);

  /* vignette: sync */
  const states = ['Qualified', 'Contacted', 'Demo booked', 'Won'];
  let si = 0;
  setInterval(() => {
    const v = $('.vig--sync');
    if (REDUCED || !v.classList.contains('in-view') || document.hidden) return;
    si = (si + 1) % states.length;
    const ems = $$('.sv', v);
    ems[0].textContent = states[si]; ems[0].classList.add('is-flash');
    setTimeout(() => { ems[1].textContent = states[si]; ems[1].classList.add('is-flash'); }, 1100);
    setTimeout(() => ems.forEach((e) => e.classList.remove('is-flash')), 1900);
  }, 2400);

  /* hub lines: core -> each tool, with a travelling dot */
  const hub = $('.hub');
  const drawHub = () => {
    const svg = $('.hub__lines', hub), g = svg.querySelector('g');
    const r = hub.getBoundingClientRect(), W = r.width, H = r.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const cx = W / 2, cy = H / 2;
    g.innerHTML = $$('.hub__t', hub).map((t, i) => {
      const b = t.getBoundingClientRect(), x = b.left - r.left + b.width / 2, y = b.top - r.top + b.height / 2;
      const d = `M${cx} ${cy} C ${cx} ${(cy + y) / 2}, ${x} ${(cy + y) / 2}, ${x} ${y}`;
      const dot = REDUCED ? '' : `<circle r="3"><animateMotion dur="${2.6 + (i % 4) * 0.5}s" begin="${i * 0.35}s" repeatCount="indefinite" keyPoints="${i % 2 ? '0;1' : '1;0'}" keyTimes="0;1" calcMode="linear" path="${d}"/></circle>`;
      return `<path d="${d}"/>${dot}`;
    }).join('');
  };
  drawHub(); addEventListener('resize', drawHub);

  /* phone chat: messages arrive one by one */
  const msgs = $$('.chat .msg');
  if (STATIC || REDUCED) msgs.forEach((m) => m.classList.add('is-on'));
  else once([$('.phone')], () => msgs.forEach((m, i) => setTimeout(() => m.classList.add('is-on'), 250 + i * 650)), '0px 0px -25% 0px');

  /* stats count-up */
  const counts = $$('.cnt');
  if (!STATIC && !REDUCED) once(counts, (el) => {
    const to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now(), D = 1400;
    const f = (now) => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });

  /* ---------- the live desk ---------- */
  const desk = $('#desk'), main = $('.desk__main', desk), steps = $$('.step', desk), task = $('.task', desk);
  const taskText = $('#taskText'), FULL = taskText.textContent, status = $('#deskStatus'), sum = $('#deskSum');
  const cursor = $('#cursor'), kvTime = $('#kvTime'), kvAppr = $('#kvAppr');
  let visible = true, tok = 0, simMs = 0, approveNow = null;
  watch([desk], (_, on) => { visible = on; });
  const active = () => visible && !document.hidden;
  const CANCEL = Symbol('cancel');
  const sleep = (ms) => new Promise((res, rej) => {
    const my = tok; let left = ms, last = performance.now();
    (function tick() {
      if (my !== tok) return rej(CANCEL);
      const now = performance.now(); if (active()) { left -= now - last; simMs += (now - last) * 12; } last = now;
      kvTime.textContent = fmt(simMs);
      if (left <= 0) res(); else setTimeout(tick, 40);
    })();
  });
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const setStatus = (cls, text) => { status.className = 'pill' + (cls ? ' ' + cls : ''); status.lastElementChild.textContent = text; };
  const setStep = (i, st) => { steps[i].classList.remove('is-run', 'is-ask', 'is-done'); if (st) steps[i].classList.add('is-' + st); };

  const moveCursor = (el) => {
    const m = main.getBoundingClientRect(), b = el.getBoundingClientRect();
    cursor.style.transform = `translate(${b.left - m.left + b.width * 0.55}px, ${b.top - m.top + b.height * 0.55}px)`;
  };
  const parkCursor = () => { const m = main.getBoundingClientRect(); cursor.style.transition = 'none'; cursor.style.transform = `translate(${m.width - 60}px, ${m.height - 30}px)`; cursor.offsetWidth; cursor.style.transition = 'transform 1.1s cubic-bezier(.3,.7,.1,1), opacity .3s'; };

  const approval = async (i) => {
    const btn = $('.js-approve', steps[i]);
    let resolveClick;
    const clicked = new Promise((r) => { resolveClick = r; });
    approveNow = () => resolveClick('user');
    const auto = (async () => {
      await sleep(1700);
      parkCursor(); cursor.classList.add('is-on');
      await sleep(60); moveCursor(btn);
      await sleep(1250);
      btn.classList.add('is-press'); await sleep(160); btn.classList.remove('is-press');
      return 'auto';
    })();
    await Promise.race([clicked, auto]);
    approveNow = null;
    cursor.classList.remove('is-on');
  };

  const run = async () => {
    const my = ++tok; simMs = 0;
    steps.forEach((_, i) => setStep(i, null));
    sum.classList.remove('is-on'); task.classList.remove('is-sent'); kvAppr.textContent = '0 of 2';
    setStatus('', 'Running');
    taskText.textContent = '';
    try {
      await sleep(500);
      for (let c = 1; c <= FULL.length; c++) { taskText.textContent = FULL.slice(0, c); await sleep(FULL[c - 1] === ' ' ? 30 : 18); }
      task.classList.add('is-sent'); await sleep(400);
      let appr = 0;
      const plan = [1400, 2200, 'ask', 1300, 'ask'];
      for (let i = 0; i < plan.length; i++) {
        if (plan[i] === 'ask') {
          setStep(i, 'ask'); setStatus('is-wait', 'Waiting for approval');
          await approval(i);
          appr++; kvAppr.textContent = `${appr} of 2`; setStatus('', 'Running');
          setStep(i, 'done'); await sleep(450);
        } else { setStep(i, 'run'); await sleep(plan[i]); setStep(i, 'done'); await sleep(200); }
      }
      $('span', sum).textContent = `Done in ${fmt(simMs).replace(':', 'm ')}s · 2 approvals · 0 errors`;
      sum.classList.add('is-on'); setStatus('is-done', 'Completed');
      await sleep(7000);
      if (my === tok) run();
    } catch (e) { if (e !== CANCEL) throw e; }
  };

  desk.addEventListener('click', (e) => { if (e.target.closest('.js-approve') && approveNow) approveNow(); });
  $('#deskReplay').addEventListener('click', () => run());

  if (STATIC || REDUCED) {
    // poster frame: the moment that tells the story (agent waiting for a human)
    task.classList.add('is-sent'); setStep(0, 'done'); setStep(1, 'done'); setStep(2, 'ask');
    setStatus('is-wait', 'Waiting for approval'); kvTime.textContent = '1:48'; kvAppr.textContent = '0 of 2';
    $('#deskReplay').hidden = true;
  } else run();
})();
