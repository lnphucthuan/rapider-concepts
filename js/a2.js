// Rapider — Option A v2 runtime. GSAP + ScrollTrigger + Lenis.
// Chapters: hero live desk · problem (pinned) · how it works (pinned 4 scenes) · watch · stacked cards · proof · CTA.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const STATIC = root.classList.contains('static');
  const REDUCED = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  const MOBILE = () => matchMedia('(max-width: 900px)').matches;
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
    scrollToY(t.getBoundingClientRect().top + scrollY - 64);
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

  /* ---------- text reveals ---------- */
  $$('.js-lines').forEach((el) => {
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
  if (!STATIC) {
    const h1 = $('.hero .js-lines');
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => h1.classList.add('is-in'), 100));
    once($$('.js-lines').filter((e) => e !== h1), (el) => el.classList.add('is-in'));
    once($$('.rv'), (el) => el.classList.add('is-in'));
  }

  /* ---------- 00 · the live desk (agent run with human approvals) ---------- */
  (() => {
    const desk = $('#desk'); if (!desk) return;
    const main = $('.desk__main', desk), steps = $$('.step', desk), task = $('.task', desk);
    const taskText = $('#taskText'), FULL = taskText.textContent, status = $('#deskStatus'), sum = $('#deskSum');
    const cursor = $('#cursor'), kvTime = $('#kvTime'), kvAppr = $('#kvAppr');
    let visible = true, tok = 0, simMs = 0, approveNow = null;
    new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; })).observe(desk);
    const active = () => visible && !document.hidden;
    const CANCEL = Symbol('cancel');
    const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const sleep = (ms) => new Promise((res, rej) => {
      const my = tok; let left = ms, last = performance.now();
      (function tick() {
        if (my !== tok) return rej(CANCEL);
        const now = performance.now(); if (active()) { left -= now - last; simMs += (now - last) * 12; } last = now;
        if (kvTime) kvTime.textContent = fmt(simMs);
        if (left <= 0) res(); else setTimeout(tick, 40);
      })();
    });
    const setStatus = (cls, text) => { status.className = 'pill' + (cls ? ' ' + cls : ''); status.lastElementChild.textContent = text; };
    const setStep = (i, st) => { steps[i].classList.remove('is-run', 'is-ask', 'is-done'); if (st) steps[i].classList.add('is-' + st); };
    const moveCursor = (el) => { const m = main.getBoundingClientRect(), b = el.getBoundingClientRect(); cursor.style.transform = `translate(${b.left - m.left + b.width * 0.55}px, ${b.top - m.top + b.height * 0.55}px)`; };
    const parkCursor = () => { const m = main.getBoundingClientRect(); cursor.style.transition = 'none'; cursor.style.transform = `translate(${m.width - 60}px, ${m.height - 30}px)`; cursor.offsetWidth; cursor.style.transition = 'transform 1.1s cubic-bezier(.3,.7,.1,1), opacity .3s'; };
    const approval = async (i) => {
      const btn = $('.js-approve', steps[i]);
      let resolveClick; const clicked = new Promise((r) => { resolveClick = r; });
      approveNow = () => resolveClick('user');
      const auto = (async () => {
        await sleep(1700); parkCursor(); cursor.classList.add('is-on');
        await sleep(60); moveCursor(btn); await sleep(1250);
        btn.classList.add('is-press'); await sleep(160); btn.classList.remove('is-press');
      })();
      await Promise.race([clicked, auto]);
      approveNow = null; cursor.classList.remove('is-on');
    };
    const run = async () => {
      const my = ++tok; simMs = 0;
      steps.forEach((_, i) => setStep(i, null));
      sum.classList.remove('is-on'); task.classList.remove('is-sent'); if (kvAppr) kvAppr.textContent = '0 of 2';
      setStatus('', 'Running'); taskText.textContent = '';
      try {
        await sleep(600);
        for (let c = 1; c <= FULL.length; c++) { taskText.textContent = FULL.slice(0, c); await sleep(FULL[c - 1] === ' ' ? 30 : 18); }
        task.classList.add('is-sent'); await sleep(400);
        let appr = 0;
        const plan = [1400, 2200, 'ask', 1300, 'ask'];
        for (let i = 0; i < plan.length; i++) {
          if (plan[i] === 'ask') {
            setStep(i, 'ask'); setStatus('is-wait', 'Waiting for approval');
            await approval(i);
            appr++; if (kvAppr) kvAppr.textContent = `${appr} of 2`; setStatus('', 'Running');
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
    if (REDUCED) {
      task.classList.add('is-sent'); setStep(0, 'done'); setStep(1, 'done'); setStep(2, 'ask');
      setStatus('is-wait', 'Waiting for approval'); if (kvTime) kvTime.textContent = '1:48';
      $('#deskReplay').hidden = true;
    } else run();
  })();

  /* ---------- helpers for the scenes ---------- */
  const drawHub = () => {
    const sc = $('.scene--hub'), svg = $('.hub__svg', sc), g = $('.hub__lines', sc), core = $('.hub__core', sc);
    const r = sc.getBoundingClientRect(); if (!r.width) return;
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    const cx = r.width / 2, cy = r.height / 2;
    const tiles = $$('.tile', sc);
    if (!g.children.length) {
      g.innerHTML = tiles.map((t, i) => '<path pathLength="1"/>' + (REDUCED ? '' : `<circle r="3.2"><animateMotion dur="${2.4 + (i % 4) * 0.45}s" begin="${i * 0.3}s" repeatCount="indefinite" keyPoints="${i % 2 ? '0;1' : '1;0'}" keyTimes="0;1" calcMode="linear"/></circle>`)).join('');
    }
    const paths = $$('path', g), motions = $$('animateMotion', g);
    tiles.forEach((t, i) => {
      // tile centre from its CSS position (% of the scene), so running transforms don't matter
      const x = (parseFloat(t.style.getPropertyValue('--x')) / 100) * r.width, y = (parseFloat(t.style.getPropertyValue('--y')) / 100) * r.height;
      const d = `M${cx} ${cy} C ${cx} ${(cy + y) / 2}, ${x} ${(cy + y) / 2}, ${x} ${y}`;
      paths[i].setAttribute('d', d);
      if (motions[i]) motions[i].setAttribute('path', d);
    });
  };
  const drawCtaBg = () => {
    const svg = $('.cta__bg'), g = svg.querySelector('g'); let out = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, x = 600 + Math.cos(a) * 760, y = 240 + Math.sin(a) * 420;
      out += `<path d="M600 240 C ${600 + Math.cos(a) * 200} ${240 + Math.sin(a) * 60}, ${x * 0.8 + 120} ${y * 0.8 + 48}, ${x} ${y}"/>`;
    }
    g.innerHTML = out;
  };
  drawCtaBg();
  $$('.flow__p').forEach((p) => p.setAttribute('pathLength', '1'));
  const recPos = (mode) => {
    const b = $('.board2'), W = b.clientWidth, cw = (W - 24) / 3;
    const counts = [0, 0, 0];
    return $$('.rec', b).map((r, i) => {
      if (mode === 'grid') { const j = i % 3, row = Math.floor(i / 3); return { left: j * (cw + 12) + 8, top: 8 + row * 58 }; }
      const c = +r.dataset.c, k = counts[c]++; return { left: c * (cw + 12) + 8, top: 40 + k * 54 };
    });
  };

  /* ---------- pinned chapters ---------- */
  const hsteps = $$('.hstep'), scenes = $$('.scene'), cap = $('.js-cap');
  const CAPS = ['Real-time sync', 'Automated workflows', 'Human-in-the-loop approval', 'Custom views'];
  let curStep = -1;
  const setStep = (p) => {
    const f = Math.min(3.999, Math.max(0, p * 4)), i = Math.floor(f);
    if (i !== curStep) {
      curStep = i;
      hsteps.forEach((s, k) => s.classList.toggle('is-on', k === i));
      cap.textContent = CAPS[i];
    }
    hsteps.forEach((s, k) => s.style.setProperty('--p', k < i ? 1 : k === i ? (f - i).toFixed(3) : 0));
    const appr = p > 0.69;
    $('.js-approve-btn').classList.toggle('is-done', appr);
    $('.js-approve-btn').textContent = appr ? 'Approved ✓' : 'Approve';
    $('.req .is-key').classList.toggle('is-done', appr);
    $('.js-mgr').textContent = appr ? 'approved ✓' : 'reviewing…';
    const kan = p > 0.8;
    $$('.seg2 span').forEach((s, k) => s.classList.toggle('is-on', kan ? k === 1 : k === 0));
  };

  // The sentence "Your data lives everywhere." splits open: the halves fly to opposite corners, the brackets open,
  // the work that falls between tools pours into the gap, then everything collapses into Rapider.
  const buildProblem = (withScroll) => {
    const stage = $('.problem__stage'), L = $('.ph--l'), R = $('.ph--r'), pl = $('.paren--l'), pr = $('.paren--r');
    const bubbles = $$('.bubbles li'), core = $('.core'), end = $('.problem__end');
    const W = () => stage.clientWidth, Hh = () => stage.clientHeight;
    const gap = () => (MOBILE() ? 0 : L.offsetHeight * 0.13);
    const sc = () => (MOBILE() ? 0.82 : 0.58);
    const startL = () => (MOBILE() ? { x: (W() - L.offsetWidth) / 2, y: Hh() / 2 - L.offsetHeight - 2 } : { x: W() / 2 - gap() - L.offsetWidth, y: (Hh() - L.offsetHeight) / 2 });
    const startR = () => (MOBILE() ? { x: (W() - R.offsetWidth) / 2, y: Hh() / 2 + 2 } : { x: W() / 2 + gap(), y: (Hh() - R.offsetHeight) / 2 });
    const endL = () => (MOBILE() ? { x: (W() - L.offsetWidth * sc()) / 2, y: Hh() * 0.06 } : { x: W() * 0.05, y: Hh() * 0.09 });
    const endR = () => (MOBILE() ? { x: (W() - R.offsetWidth * sc()) / 2, y: Hh() * 0.9 - R.offsetHeight * sc() } : { x: W() * 0.95 - R.offsetWidth * sc(), y: Hh() * 0.91 - R.offsetHeight * sc() });
    gsap.set([L, R], { transformOrigin: '0 0' });
    gsap.set([pl, pr], { xPercent: -50, yPercent: -54 });
    gsap.set(bubbles, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.set(core, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.set(end, { xPercent: -50, x: 0 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: withScroll ? { trigger: '.problem__pin', start: () => `top ${$('#nav').offsetHeight}px`, end: '+=260%', pin: true, scrub: 0.7, invalidateOnRefresh: true } : undefined,
      paused: !withScroll,
    });
    tl.fromTo(L, { x: () => startL().x, y: () => startL().y, scale: 1 }, { x: () => endL().x, y: () => endL().y, scale: sc, duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo(R, { x: () => startR().x, y: () => startR().y, scale: 1 }, { x: () => endR().x, y: () => endR().y, scale: sc, duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo(pl, { x: 0, opacity: 0, scale: 0.5 }, { x: () => -W() * 0.3, opacity: () => (MOBILE() ? 0 : 1), scale: 1, duration: 1, ease: 'power2.inOut' }, 0.05)
      .fromTo(pr, { x: 0, opacity: 0, scale: 0.5 }, { x: () => W() * 0.3, opacity: () => (MOBILE() ? 0 : 1), scale: 1, duration: 1, ease: 'power2.inOut' }, 0.05)
      .fromTo(bubbles, { opacity: 0, scale: 0.6, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, stagger: 0.09, ease: 'back.out(1.7)' }, 0.4)
      .to({}, { duration: 0.4 })
      .addLabel('collapse')
      .to(bubbles, { left: '50%', top: '50%', scale: 0.15, opacity: 0, duration: 0.6, stagger: 0.035, ease: 'power3.in' }, 'collapse')
      .to([pl, pr], { x: 0, scale: 0.4, duration: 0.55, ease: 'power3.in' }, 'collapse')
      .to([L, R, pl, pr], { opacity: 0, duration: 0.4, ease: 'power2.in' }, 'collapse+=.1')
      .fromTo(core, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, 'collapse+=.5')
      .fromTo(end, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 'collapse+=.75')
      .to({}, { duration: 0.4 });
    return tl;
  };

  const buildHow = (withScroll) => {
    const [s0, s1, s2, s3] = scenes;
    const tiles = $$('.tile', s0), fns = $$('.fn', s1), paths = $$('.flow__p', s1), req = $('.req', s2), cur = $('.cursor2', s2), btn = $('.js-approve-btn');
    const recs = $$('.rec', s3), cols = $$('.col2', s3), toast = $('.toast', s3);
    gsap.set(tiles, { xPercent: -50, yPercent: -50 });
    gsap.set($$('.fn', s1), { xPercent: -50, yPercent: -50 });
    gsap.set(toast, { xPercent: -50 });
    gsap.set(['.hub__core', '.sync'], { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.set(s0, { autoAlpha: 1 });
    const g = recPos('grid'); recs.forEach((r, i) => gsap.set(r, g[i]));
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: withScroll ? { trigger: '.how__pin', start: () => `top ${$('#nav').offsetHeight}px`, end: '+=420%', pin: true, scrub: 0.6, invalidateOnRefresh: true, onUpdate: (st) => setStep(st.progress), onRefresh: () => drawHub() } : undefined,
      paused: !withScroll,
      onUpdate: withScroll ? undefined : function () { setStep(this.progress()); },
    });
    // scene 0 · connect
    tl.fromTo(tiles, { opacity: 0, x: (i) => [-180, -60, 60, 180, -180, -60, 60, 180][i], y: (i) => (i < 4 ? -90 : 90), rotation: (i) => (i % 2 ? 14 : -12) }, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.45, stagger: 0.04, ease: 'power3.out' }, 0)
      .fromTo('.hub__core', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 0.05)
      .fromTo($$('.hub__lines path'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35, stagger: 0.02 }, 0.35)
      .fromTo('.sync', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.15 }, 0.7)
      // → scene 1 · decide
      .to(s0, { autoAlpha: 0, scale: 0.97, duration: 0.12 }, 0.94)
      .fromTo(s1, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 1.0)
      .fromTo(fns, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.18, stagger: 0.16, ease: 'power2.out' }, 1.05)
      .fromTo(paths, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.14, stagger: 0.16 }, 1.15)
      // → scene 2 · ask
      .to(s1, { autoAlpha: 0, scale: 0.97, duration: 0.12 }, 1.94)
      .fromTo(s2, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 2.0)
      .fromTo(req, { y: 60, opacity: 0, rotation: -2 }, { y: 0, opacity: 1, rotation: 0, duration: 0.3, ease: 'power3.out' }, 2.02)
      .fromTo(cur, { x: () => s2.clientWidth - 40, y: () => s2.clientHeight - 30, opacity: 0 }, { opacity: 1, duration: 0.05 }, 2.3)
      .to(cur, { x: () => { const a = btn.getBoundingClientRect(), s = s2.getBoundingClientRect(); return a.left - s.left + a.width * 0.5; }, y: () => { const a = btn.getBoundingClientRect(), s = s2.getBoundingClientRect(); return a.top - s.top + a.height * 0.55; }, duration: 0.35, ease: 'power2.inOut' }, 2.35)
      .to(btn, { scale: 0.93, duration: 0.03, yoyo: true, repeat: 1 }, 2.72)
      .to(cur, { opacity: 0, duration: 0.08 }, 2.86)
      // → scene 3 · act
      .to(s2, { autoAlpha: 0, scale: 0.97, duration: 0.12 }, 2.94)
      .fromTo(s3, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 3.0)
      .fromTo(recs, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.12, stagger: 0.03 }, 3.02)
      .to(cols, { opacity: 1, duration: 0.15 }, 3.22)
      .to(recs, { left: (i) => recPos('kanban')[i].left, top: (i) => recPos('kanban')[i].top, duration: 0.4, stagger: 0.03, ease: 'power2.inOut' }, 3.25)
      .fromTo(toast, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.12 }, 3.75)
      .to({}, { duration: 0.12 }, 3.88);
    return tl;
  };

  if (HAS_GSAP) {
    drawHub();
    if (REDUCED) {
      // still frames that tell the story
      buildProblem(false).progress(0.46);
      const how = buildHow(false); how.progress(0.62);
      $$('.hstep__body').forEach((b) => { b.style.gridTemplateRows = '1fr 1fr'; });
    } else {
      buildProblem(true);
      const how = buildHow(true);
      hsteps.forEach((s, i) => $('button', s).addEventListener('click', () => {
        const st = how.scrollTrigger; scrollToY(st.start + ((i + 0.55) / 4) * (st.end - st.start));
      }));

      /* stacked cards: the card underneath steps back */
      const cards = $$('.card');
      cards.forEach((c, i) => {
        if (i === cards.length - 1) return;
        gsap.to(c, { scale: 0.94, '--dim': 0.55, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom-=10%', end: () => `top ${$('#nav').offsetHeight + 60}px`, scrub: true } });
      });

      /* count-up */
      $$('.cnt').forEach((el) => {
        const to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '', o = { v: 0 };
        ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = pre + Math.round(o.v) + suf; } }) });
      });

      /* sticky CTA pill: after the hero, hidden at the CTA */
      const pill = $('#pill');
      ScrollTrigger.create({ trigger: '.how', start: 'top 70%', endTrigger: '#demo', end: 'top 85%', onToggle: (st) => pill.classList.toggle('is-on', st.isActive) });

      if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
      addEventListener('load', () => ScrollTrigger.refresh());
    }
  }

  /* ---------- phone conversation ---------- */
  const msgs = $$('#chat > *');
  if (REDUCED) msgs.forEach((m) => m.classList.add('is-on'));
  else once([$('.phone')], () => msgs.forEach((m, i) => setTimeout(() => m.classList.add('is-on'), 250 + i * 650)), '0px 0px -25% 0px');
})();
