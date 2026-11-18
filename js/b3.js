// Rapider — Direction B runtime (Blueprint · Heron school). GSAP + ScrollTrigger + Lenis.
// Isometric drawings are generated here, so every line can be drawn in on scroll.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const STATIC = root.classList.contains('static');
  const REDUCED = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = () => matchMedia('(max-width: 900px)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- scroll engine ---------- */
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!REDUCED && window.Lenis) { lenis = new Lenis({ lerp: 0.1 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  window.H = { lenis };
  const navH = () => $('#nav').offsetHeight;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href').length < 2) return;
    const t = document.querySelector(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); const y = t.getBoundingClientRect().top + scrollY - 60;
    lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' });
  });

  if (window.FX) FX.init({ cursor: 'cross' });

  /* ---------- preloader: the plotter (once per session) ---------- */
  const intro = new Promise((done) => {
    if (!root.classList.contains('is-pre')) return done();
    try { sessionStorage.setItem('rp-b-intro', '1'); } catch (e) {}
    if (lenis) lenis.stop();
    const lis = $$('.pre__log li'), pct = $('#prePct'), bar = $('#preBar'), mark = $('.pre__mark text'), o = { v: 0 };
    gsap.set(mark, { strokeDasharray: 1400, strokeDashoffset: 1400 });
    const tl = gsap.timeline({ onComplete: () => { root.classList.remove('is-pre'); if (lenis) lenis.start(); done(); } });
    tl.to(mark, { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut' }, 0)
      .to(o, { v: 100, duration: 1.7, ease: 'power1.inOut', onUpdate: () => { pct.textContent = String(Math.round(o.v)).padStart(2, '0') + '%'; bar.style.width = o.v + '%'; } }, 0);
    lis.forEach((li, i) => tl.call(() => li.classList.add('is-on'), null, 0.12 + i * 0.19));
    tl.to(mark, { fill: 'var(--ink)', duration: 0.3 }, 1.6)
      .call(() => { const w = $('.pre__log em.wait'); w.textContent = 'YOU'; w.style.color = 'var(--you)'; }, null, 1.75)
      .to('.pre__scan', { top: '-4%', duration: 0.6, ease: 'power2.inOut' }, 2.05)
      .to('#pre', { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'power2.inOut' }, 2.05);
  });

  /* ---------- micro: nav, menu, toast, copy ---------- */
  $$('.nc--drop').forEach((m) => { const b = $('button', m); m.addEventListener('mouseenter', () => b.setAttribute('aria-expanded', 'true')); m.addEventListener('mouseleave', () => b.setAttribute('aria-expanded', 'false')); });
  const menuBtn = $('.nav__menu'), msheet = $('.msheet');
  menuBtn.addEventListener('click', () => { const open = msheet.hidden; msheet.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.textContent = open ? 'Close' : 'Menu'; if (lenis) open ? lenis.stop() : lenis.start(); });
  msheet.addEventListener('click', (e) => { if (e.target.closest('a')) menuBtn.click(); });
  const toast = $('#toastx'); let tt;
  const say = (html) => { toast.innerHTML = html; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2400); };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); } catch (e) {} say(`Copied <b>${b.dataset.copy}</b>`); }));

  /* ---------- text reveals ---------- */
  $$('.rv-lines').forEach((el) => {
    let i = 0;
    [...el.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((p) => { if (!p) return; if (/^\s+$/.test(p)) { frag.append(' '); return; } const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++); w.append(s); frag.append(w); });
      n.replaceWith(frag);
    });
  });
  const once = (els, fn, margin = '0px 0px -12% 0px') => { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { rootMargin: margin }); els.forEach((el) => io.observe(el)); };
  if (!STATIC) {
    const h1 = $('.hero .rv-lines');
    Promise.all([document.fonts ? document.fonts.ready : 0, intro]).then(() => setTimeout(() => h1.classList.add('is-in'), 900));
    once($$('.rv-lines').filter((e) => e !== h1), (el) => el.classList.add('is-in'));
    once($$('.rv'), (el) => el.classList.add('is-in'));
  }

  /* ---------- isometric drawing kit ---------- */
  const C30 = Math.cos(Math.PI / 6);
  const iso = (svg, u, ox, oy) => {
    const P = (x, y, z) => [ox + (x - y) * C30 * u, oy + (x + y) * 0.5 * u - z * u];
    const add = (tag, attrs, parent = svg) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); parent.append(el); return el; };
    const pts = (a) => a.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
    const g = (cls = '') => add('g', { class: cls });
    const poly = (a, cls, parent) => add('polygon', { points: pts(a), class: cls, pathLength: 1 }, parent);
    const line = (a, b, cls, parent) => add('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), class: cls, pathLength: 1 }, parent);
    const path = (d, cls, parent) => add('path', { d, class: cls, pathLength: 1 }, parent);
    const text = (p, s, cls = '', anchor = 'start', parent) => { const t = add('text', { x: p[0].toFixed(1), y: p[1].toFixed(1), class: cls, 'text-anchor': anchor }, parent); t.textContent = s; return t; };
    const box = (x, y, z, w, d, h, o = {}) => {
      const gr = g('box ' + (o.cls || ''));
      poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'side ' + (o.edge || ''), gr);
      poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], 'side2 ' + (o.edge || ''), gr);
      poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], (o.top || 'top') + ' ' + (o.edge || ''), gr);
      if (o.img) add('image', { href: o.img, x: (P(x + w / 2, y + d / 2, z + h)[0] - 9).toFixed(1), y: (P(x + w / 2, y + d / 2, z + h)[1] - 9).toFixed(1), width: 18, height: 18, class: 'icon' }, gr);
      return gr;
    };
    return { P, add, g, poly, line, path, text, box };
  };
  const callout = (k, from, to, n, title, sub) => {
    const gr = k.g('callout');
    k.path(`M${from[0].toFixed(1)} ${from[1].toFixed(1)} L${(to[0] - 30).toFixed(1)} ${to[1].toFixed(1)} L${to[0].toFixed(1)} ${to[1].toFixed(1)}`, 'dash', gr);
    k.add('rect', { x: to[0], y: to[1] - 11, width: 22, height: 22, class: 'num' }, gr);
    k.text([to[0] + 11, to[1] + 4], n, 'num-t', 'middle', gr);
    k.text([to[0] + 32, to[1] - 1], title, '', 'start', gr);
    k.text([to[0] + 32, to[1] + 14], sub, 't-ai', 'start', gr);
    return gr;
  };

  /* hero: exploded system drawing — data → agent → approvals → actions */
  const drawHero = (svg) => {
    svg.innerHTML = '';
    const m = MOBILE(), u = m ? 15 : 19, ox = m ? 600 : 470, oy = m ? 330 : 318;
    const k = iso(svg, u, ox, oy);
    const Z = [0, 4.2, 8.4, 12.6], S = 9;
    const layers = [];
    // vertical guides
    const guides = k.g('guides');
    [[0, 0], [S, 0], [S, S], [0, S]].forEach(([x, y]) => k.line(k.P(x, y, 0.3), k.P(x, y, Z[3]), 'dash', guides));
    // 01 data
    let L = k.g('layer'); layers.push(L);
    L.append(k.box(0, 0, Z[0], S, S, 0.3));
    [[1, 1, 1.4, null, 'sheet'], [4.2, 1, 0.9, 'assets/tools/salesforce.png'], [6.9, 1.2, 0.7, 'assets/tools/gdrive.png'], [1, 4.4, 1.1, 'assets/tools/slack.png'], [4.4, 4.6, 1.8, 'assets/tools/postgres.png'], [6.9, 4.4, 1.2, 'assets/tools/notion.png'], [2.4, 7, 0.8, 'assets/tools/jira.png']].forEach(([x, y, h, img]) => L.append(k.box(x, y, Z[0] + 0.3, 1.5, 1.5, h, { img })));
    // 02 agent
    L = k.g('layer'); layers.push(L);
    L.append(k.box(0, 0, Z[1], S, S, 0.3));
    L.append(k.box(3, 3, Z[1] + 0.3, 3, 3, 1.5, { top: 'ai-fill', edge: 'ai' }));
    for (let i = 0; i < 4; i++) { k.line(k.P(3.4 + i * 0.75, 3, Z[1] + 0.9), k.P(3.4 + i * 0.75, 2.2, Z[1] + 0.3), 'ai', L); k.line(k.P(6, 3.4 + i * 0.75, Z[1] + 0.9), k.P(6.8, 3.4 + i * 0.75, Z[1] + 0.3), 'ai', L); }
    // 03 approvals
    L = k.g('layer'); layers.push(L);
    L.append(k.box(0, 0, Z[2], S, S, 0.3));
    L.append(k.box(2.2, 2.6, Z[2] + 0.3, 0.9, 0.9, 1.9));
    L.append(k.box(5.4, 5.2, Z[2] + 0.3, 0.9, 0.9, 1.9));
    L.append(k.box(4.6, 1.6, Z[2] + 0.3, 2.6, 1.7, 0.15, { top: 'top' }));
    const ck = k.P(5.5, 2.2, Z[2] + 0.45), ck2 = k.P(5.9, 2.7, Z[2] + 0.45), ck3 = k.P(6.8, 1.9, Z[2] + 0.45);
    k.path(`M${ck[0]} ${ck[1]} L${ck2[0]} ${ck2[1]} L${ck3[0]} ${ck3[1]}`, 'you', L).style.strokeWidth = '2.6';
    // 04 actions
    L = k.g('layer'); layers.push(L);
    L.append(k.box(0, 0, Z[3], S, S, 0.3));
    L.append(k.box(1.2, 3.6, Z[3] + 0.3, 5.6, 1, 0.5));
    const a1 = k.P(6.8, 4.1, Z[3] + 0.8), a2 = k.P(8.6, 4.1, Z[3] + 0.8);
    k.path(`M${a1[0]} ${a1[1]} L${a2[0]} ${a2[1]} M${a2[0] - 10} ${a2[1] - 9} L${a2[0]} ${a2[1]} L${a2[0] - 13} ${a2[1] + 2}`, 'ai', L);
    L.append(k.box(1.4, 6.4, Z[3] + 0.3, 2.2, 1.4, 0.3)); L.append(k.box(4.6, 6.4, Z[3] + 0.3, 2.2, 1.4, 0.3));
    L.append(k.box(1.6, 1, Z[3] + 0.3, 1.4, 1.4, 0.8));
    // callouts (right) and pen notes (left)
    const cx = m ? 820 : 760, items = [['04', 'Actions', 'updates · messages · reports'], ['03', 'Approvals', 'a person signs off'], ['02', 'Rapider agent', 'reads · decides · drafts'], ['01', 'Your data', 'sheets · CRM · chat · databases']];
    const calls = [3, 2, 1, 0].map((li, i) => callout(k, k.P(S, 0, Z[li] + 0.15), [cx, k.P(S, 0, Z[li])[1] - 18], ...items[i]));
    const pen = k.g('penL');
    const pc = k.P(2.65, 3.05, Z[2] + 1.4);
    k.path(`M${pc[0] - 30} ${pc[1] + 4} C ${pc[0] - 34} ${pc[1] - 30}, ${pc[0] + 30} ${pc[1] - 34}, ${pc[0] + 34} ${pc[1] - 6} C ${pc[0] + 38} ${pc[1] + 22}, ${pc[0] - 22} ${pc[1] + 34}, ${pc[0] - 32} ${pc[1] + 8}`, 'hu', pen);
    k.path(`M${pc[0] - 38} ${pc[1] + 14} C ${pc[0] - 90} ${pc[1] + 40}, ${pc[0] - 150} ${pc[1] + 40}, ${pc[0] - 200} ${pc[1] + 30}`, 'hu', pen);
    if (!m) k.text([pc[0] - 430, pc[1] + 40], '2nd approver above $10k ✓', 't-hu', 'start', pen);
    // height dimension (right of the pen note, left of the stack)
    const dm = k.g('dim'); const d0 = k.P(0, S, 0), d1 = k.P(0, S, Z[3] + 0.3), dx = 22;
    k.line([d0[0] - dx, d0[1]], [d1[0] - dx, d1[1]], 'ai', dm); k.line([d0[0] - dx - 6, d0[1]], [d0[0] - dx + 6, d0[1]], 'ai', dm); k.line([d1[0] - dx - 6, d1[1]], [d1[0] - dx + 6, d1[1]], 'ai', dm);
    k.text([d0[0] - dx - 10, (d0[1] + d1[1]) / 2 + 40], '24/7', 't-ai', 'end', dm);
    return { layers, calls, pen, dm, guides };
  };

  const drawSmall = (svg, kind) => {
    svg.innerHTML = '';
    const big = ['connect', 'decide', 'ask', 'act'].includes(kind);
    const k = big ? iso(svg, 21, 150, 52) : iso(svg, 14, 150, 64);
    const keys = [];
    if (kind === 'copy') {
      k.box(0, 0, 0, 6, 4, 0.3); k.box(2.4, 3.2, 1.8, 6, 4, 0.3);
      for (let i = 0; i < 3; i++) { k.line(k.P(0.8, 0.8 + i, 0.31), k.P(4.6, 0.8 + i, 0.31), 'dash'); }
      const a = k.P(3, 2, 0.4), b = k.P(5.4, 5.4, 2.1); keys.push(k.path(`M${a[0]} ${a[1]} C ${a[0] + 40} ${a[1] - 10}, ${b[0] + 30} ${b[1] + 20}, ${b[0]} ${b[1]}`, 'ai'));
      keys.push(k.text([b[0] + 14, b[1] - 6], 'ctrl+c · ctrl+v', 't-ai'));
    } else if (kind === 'split') {
      k.box(0, 0, 0, 2, 2, 1.5); k.box(5, 0, 0, 2, 2, 1); k.box(2.5, 5, 0, 2, 2, 2);
      const a = k.P(1, 1, 0.8), b = k.P(6, 1, 0.5), c = k.P(3.5, 6, 1);
      k.line(a, b, 'dash'); k.line(b, c, 'dash'); k.line(c, a, 'dash');
      const mx = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      keys.push(k.path(`M${mx[0] - 7} ${mx[1] - 7} L${mx[0] + 7} ${mx[1] + 7} M${mx[0] + 7} ${mx[1] - 7} L${mx[0] - 7} ${mx[1] + 7}`, 'hu'));
      keys.push(k.text([c[0] + 30, c[1] + 26], 'which one is right?', 't-hu'));
    } else if (kind === 'stairs') {
      for (let i = 0; i < 5; i++) k.box(i * 1.5, 0, 0, 1.3, 3, 0.6 + i * 0.75);
      ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'].forEach((q, i) => k.text(k.P(i * 1.5 + 0.6, 3.6, 0), q, '', 'middle'));
      const a = k.P(0.6, 1.5, 1.4), b = k.P(6.6, 1.5, 4.6); keys.push(k.line(a, b, 'hu'));
      keys.push(k.text([b[0] + 6, b[1] - 6], 'still in backlog', 't-hu'));
    } else if (kind === 'gate') {
      k.box(0, 2, 0, 2, 2, 1.5); k.box(6, 2, 0, 2, 2, 1.1);
      const g0 = k.P(3.6, 1.6, 0), g1 = k.P(3.6, 1.6, 2), g2 = k.P(3.6, 4.4, 2), g3 = k.P(3.6, 4.4, 0);
      keys.push(k.path(`M${g0[0]} ${g0[1]} L${g1[0]} ${g1[1]} L${g2[0]} ${g2[1]} L${g3[0]} ${g3[1]}`, 'hu dash'));
      const a = k.P(2, 3, 0.8), b = k.P(6, 3, 0.6); keys.push(k.path(`M${a[0]} ${a[1]} L${b[0]} ${b[1]} M${b[0] - 12} ${b[1] - 3} L${b[0]} ${b[1]} L${b[0] - 6} ${b[1] - 12}`, 'ai'));
      keys.push(k.text([g1[0] + 8, g1[1] - 10], 'no one asked', 't-hu'));
    } else if (kind === 'connect') {
      k.box(3, 3, 0, 2.4, 2.4, 1.6, { top: 'ai-fill', edge: 'k' });
      [[0, 0], [6.6, 0], [0, 6.6], [6.6, 6.6]].forEach(([x, y]) => k.box(x, y, 0, 1.4, 1.4, 0.9));
      [[0.7, 0.7], [7.3, 0.7], [0.7, 7.3], [7.3, 7.3]].forEach(([x, y]) => keys.push(k.line(k.P(x, y, 0.9), k.P(4.2, 4.2, 1.6), 'dash k')));
    } else if (kind === 'decide') {
      k.box(0, 3, 0, 1.8, 1.8, 1);
      const d = [k.P(4, 3.9, 0), k.P(4.9, 3, 0), k.P(5.8, 3.9, 0), k.P(4.9, 4.8, 0)]; keys.push(k.poly(d, 'k'));
      k.box(7.4, 0.6, 0, 1.6, 1.6, 0.9); k.box(7.4, 5.6, 0, 1.6, 1.6, 0.9);
      keys.push(k.line(k.P(1.8, 3.9, 0.5), d[0], 'k')); keys.push(k.line(d[1], k.P(7.4, 1.4, 0.4), 'k')); keys.push(k.line(d[3], k.P(7.4, 6.4, 0.4), 'k'));
      keys.push(k.text(k.P(4.9, 3.9, 0), 'if > $10k', 't-ai', 'middle'));
    } else if (kind === 'ask') {
      k.box(1, 3, 0, 1, 1, 2.6);
      k.box(4, 1.5, 0, 4, 3, 0.2);
      for (let i = 0; i < 2; i++) k.line(k.P(4.6, 2.2 + i * 0.8, 0.21), k.P(7, 2.2 + i * 0.8, 0.21), 'dash');
      const a = k.P(6, 3.9, 0.25), b = k.P(6.4, 4.3, 0.25), c = k.P(7.4, 3.6, 0.25); const ck = k.path(`M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${c[0]} ${c[1]}`, 'you k'); ck.style.strokeWidth = '2.6'; keys.push(ck);
      keys.push(k.text([k.P(1, 3, 2.6)[0], k.P(1, 3, 2.6)[1] - 12], 'you', 't-hu', 'middle'));
    } else if (kind === 'act') {
      k.box(0.6, 3, 0, 2.2, 2.2, 1.4, { top: 'ai-fill', edge: 'k' });
      [[6, 0.4], [6, 3.2], [6, 6]].forEach(([x, y]) => { k.box(x, y, 0, 2.6, 1.4, 0.3); keys.push(k.line(k.P(2.8, 4.1, 0.7), k.P(x, y + 0.7, 0.3), 'k')); });
      keys.push(k.text(k.P(7.3, 7.4, 0), 'records · SMS · views', '', 'middle'));
    } else if (kind === 'cta') {
      const k2 = iso(svg, 15, 1010, 150);
      [0, 3, 6, 9].forEach((z) => k2.box(0, 0, z, 9, 9, 0.25, { top: 'top' }));
      const k3 = iso(svg, 11, 170, 230);
      [0, 2.5].forEach((z) => k3.box(0, 0, z, 7, 7, 0.25, { top: 'top' }));
    }
    return keys;
  };

  // stroke-draw helper
  const drawIn = (els, opts = {}) => {
    const shapes = els.flatMap((e) => (e.matches && e.matches('g') ? $$('polygon,line,path', e) : [e])).filter((e) => e.getAttribute && e.getAttribute('pathLength'));
    gsap.set(shapes, { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 });
    return gsap.to(shapes, { strokeDashoffset: 0, fillOpacity: 1, duration: opts.d || 0.9, stagger: opts.s || 0.01, ease: 'power2.inOut', delay: opts.delay || 0, paused: opts.paused });
  };

  /* ---------- hero ---------- */
  const heroSvg = $('#isoHero');
  let H0 = drawHero(heroSvg);
  const hstamp = $('.stamp--hero'), htb = $('.hero .tblock');
  if (REDUCED) { /* drawn as is */ } else {
    gsap.set($$('text, image, .callout rect', heroSvg), { opacity: 0 });
    gsap.set([hstamp, htb], { opacity: 0 });
    const tl = gsap.timeline({ delay: 0.2, paused: true });
    intro.then(() => tl.play());
    H0.layers.forEach((L, i) => tl.add(drawIn([L], { d: 0.8, s: 0.004 }), i * 0.32));
    tl.add(drawIn([H0.guides], { d: 0.6 }), 0.1)
      .to($$('.layer image', heroSvg), { opacity: 1, duration: 0.4, stagger: 0.04 }, 0.9)
      .add(drawIn(H0.calls, { d: 0.5, s: 0.03 }), 1.2)
      .to($$('.callout text, .callout rect', heroSvg), { opacity: 1, duration: 0.3, stagger: 0.03 }, 1.4)
      .add(drawIn([H0.dm], { d: 0.4 }), 1.4).to($$('.dim text', heroSvg), { opacity: 1, duration: 0.3 }, 1.6)
      .add(drawIn([H0.pen], { d: 0.6, s: 0.15 }), 1.9).to($$('.penL text', heroSvg), { opacity: 1, duration: 0.5 }, 2.3)
      .fromTo(hstamp, { opacity: 0, scale: 1.9, rotation: -22 }, { opacity: 1, scale: 1, rotation: -9, duration: 0.32, ease: 'power4.in' }, 2.7)
      .to(htb, { opacity: 1, duration: 0.4 }, 2.9);
  }
  // cursor coordinates (micro)
  const cx = $('#cx'), cy = $('#cy'), hd = $('#heroDraw');
  hd.addEventListener('pointermove', (e) => { const r = hd.getBoundingClientRect(); cx.textContent = String(Math.round(e.clientX - r.left)).padStart(4, '0'); cy.textContent = String(Math.round(e.clientY - r.top)).padStart(4, '0'); });
  let lastM = MOBILE();
  addEventListener('resize', () => { if (MOBILE() !== lastM) { lastM = MOBILE(); H0 = drawHero(heroSvg); } });

  /* ---------- clients carousel ---------- */
  (() => {
    const row = $('#clRow'), n = row.children.length; let i = 0;
    const per = () => (MOBILE() ? 2 : 5), go = (d) => { i = (i + d + (n - per() + 1)) % (n - per() + 1); row.style.transform = `translateX(${-(i * 100) / per()}%)`; };
    $('#clNext').addEventListener('click', () => go(1)); $('#clPrev').addEventListener('click', () => go(-1));
    if (!REDUCED) setInterval(() => { if (!document.hidden) go(1); }, 3600);
  })();

  /* ---------- problems + way drawings ---------- */
  $$('[data-iso]').forEach((svg) => { svg._keys = drawSmall(svg, svg.dataset.iso); });
  if (!REDUCED) {
    once($$('.pcell .iso'), (svg) => drawIn([...svg.children], { d: 1, s: 0.02 }));
    $$('.pcell').forEach((c) => c.addEventListener('mouseenter', () => { const svg = $('.iso', c); gsap.fromTo(svg._keys, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }); }));
  }
  drawSmall($('#isoCta'), 'cta');

  /* ---------- statement sequence (pinned) with framed footage ---------- */
  (() => {
    const L = $$('.state__l'), ul = $('.pen-ul path'), st = $('.s-you .stamp');
    const F = $$('.fig__f'), scan = $('.fig__scan'), cap = $('#figCap'), tc = $('#figTc');
    const CAPS = ['Fig. 01 — AI drafts the spec and the first version', 'Fig. 02 — an engineer reviews every line', 'Fig. 03 — you sign off; nothing ships before'];
    gsap.set(ul, { attr: { pathLength: 1 }, strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(st, { opacity: 0, scale: 1.8, rotation: -20 });
    let curF = 0;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, paused: REDUCED, scrollTrigger: REDUCED ? undefined : { trigger: '.state__pin', start: () => `top ${navH()}px`, end: '+=240%', pin: true, scrub: 0.6,
      onUpdate: (s) => { const f = Math.floor(s.progress * 90 * 25); tc.textContent = `TC 00:00:${String(Math.floor(f / 25)).padStart(2, '0')}:${String(f % 25).padStart(2, '0')}`; const i = s.progress < 0.36 ? 0 : s.progress < 0.68 ? 1 : 2; if (i !== curF) { curF = i; cap.textContent = CAPS[i]; } } } });
    const wipe = (i, at) => {
      tl.fromTo(F[i], { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.45, ease: 'none' }, at)
        .fromTo(scan, { top: '0%', opacity: 1 }, { top: '100%', opacity: 1, duration: 0.45, ease: 'none' }, at)
        .set(scan, { opacity: 0 }, at + 0.46);
    };
    tl.fromTo(L[0], { opacity: 0, yPercent: -20 }, { opacity: 1, yPercent: -50, duration: 0.5 })
      .to(L[0], { opacity: 0, yPercent: -90, duration: 0.4 }, '+=.4')
      .fromTo(L[1], { opacity: 0, yPercent: -10 }, { opacity: 1, yPercent: -50, duration: 0.5 }, '<.1');
    wipe(1, tl.duration() - 0.5);
    tl.to(ul, { strokeDashoffset: 0, duration: 0.4, ease: 'none' })
      .to(L[1], { opacity: 0, yPercent: -90, duration: 0.4 }, '+=.3')
      .fromTo(L[2], { opacity: 0, yPercent: -10 }, { opacity: 1, yPercent: -50, duration: 0.5 }, '<.1');
    wipe(2, tl.duration() - 0.5);
    tl.to(st, { opacity: 1, scale: 1, rotation: -9, duration: 0.25, ease: 'power4.in' })
      .to({}, { duration: 0.4 });
    if (REDUCED) { L.forEach((l, i) => { l.style.opacity = i === 2 ? 1 : 0; }); gsap.set(st, { opacity: 1, scale: 1, rotation: -9 }); F.forEach((f) => { f.style.clipPath = 'inset(0 0 0 0)'; }); cap.textContent = CAPS[2]; }
  })();

  /* ---------- engineer's notes: a review layer you can switch on ---------- */
  (() => {
    const btn = $('#notesBtn'); if (!btn) return;
    let layer = [];
    const clear = () => { layer.forEach((n) => n.remove()); layer = []; };
    const draw = () => {
      clear();
      $$('[data-note]').forEach((el, k) => {
        const r = el.getBoundingClientRect(); if (!r.width) return;
        const at = el.dataset.noteAt || 'br', top = r.top + scrollY, left = r.left + scrollX;
        const n = document.createElement('div'); n.className = 'rnote';
        Object.assign(n.style, { left: `${left - 10}px`, top: `${top - 8}px`, width: `${r.width + 20}px`, height: `${r.height + 16}px` });
        const w = r.width + 20, h = r.height + 16;
        const d = k % 2 ? `M8 ${h - 4} C ${w * 0.3} ${h + 2}, ${w * 0.7} ${h - 8}, ${w - 6} ${h - 2}` : `M${w * 0.05} ${h * 0.5} C ${w * 0.02} ${-h * 0.12}, ${w * 0.98} ${-h * 0.1}, ${w * 0.98} ${h * 0.48} C ${w * 0.99} ${h * 1.1}, ${w * 0.06} ${h * 1.08}, ${w * 0.03} ${h * 0.42}`;
        n.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path pathLength="1" d="${d}"/></svg><p>${el.dataset.note}</p>`;
        const p = n.querySelector('p');
        if (at === 'tr') Object.assign(p.style, { right: '-8px', top: '-30px' });
        else if (at === 'tl') Object.assign(p.style, { left: '0', top: '-30px' });
        else Object.assign(p.style, { right: '0', top: `${h + 4}px` });
        document.body.append(n); layer.push(n);
        gsap.fromTo(n.querySelector('path'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, delay: 0.05 * k, ease: 'power2.inOut' });
        gsap.fromTo(p, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.8, delay: 0.3 + 0.05 * k, ease: 'none' });
      });
    };
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', String(on));
      if (on) { draw(); say('Engineer\'s notes on · <b>red pen</b> = a human checked it'); } else clear();
    });
    addEventListener('resize', () => { if (btn.getAttribute('aria-pressed') === 'true') draw(); });
    ScrollTrigger.addEventListener('refresh', () => { if (btn.getAttribute('aria-pressed') === 'true') draw(); });
  })();

  /* ---------- scan transition: a scanner line reveals each major section ---------- */
  if (!REDUCED) $$('[data-scan]').forEach((sec) => {
    const line = document.createElement('i'); line.className = 'scanline'; sec.append(line);
    gsap.fromTo(sec, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', ease: 'none', scrollTrigger: { trigger: sec, start: 'top 92%', end: 'top 12%', scrub: true,
      onUpdate: (s) => { line.style.top = `${s.progress * 100}%`; line.style.opacity = s.progress > 0 && s.progress < 1 ? 1 : 0; } } });
  });

  /* ---------- videos play only when on screen ---------- */
  $$('video').forEach((v) => { v.muted = true; new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !REDUCED) v.play().catch(() => {}); else v.pause(); }), { rootMargin: '120px' }).observe(v); });

  /* ---------- signatures write themselves ---------- */
  if (REDUCED) $$('.note').forEach((n) => n.classList.add('is-in')); else once($$('.note'), (n) => n.classList.add('is-in'), '0px 0px -20% 0px');

  /* ---------- introduction: the blueprint builds (pinned) ---------- */
  (() => {
    const sheet = $('#sheet'), app = $('.draw-app', sheet), erd = $('.draw-erd', sheet);
    const lines = [...$$('.bp .ln', app)], erdL = [...$$('.erd .ln', erd)], notes = [...$$('.ai-note > *, .erd text, .erd-t', sheet)];
    const pen = [...$$('.pen .pn', sheet)], hw = $$('.hwc', sheet), stamp = $('.stamp--sheet', sheet);
    [...lines, ...erdL, ...pen].forEach((l) => l.setAttribute('pathLength', '1'));
    const cap = $('#capT'), sno = $('#sheetNo'), tbHu = $('#tbHu'), tbYou = $('#tbYou');
    const CAPS = ['AI drafts the screens from your requirements.', 'AI drafts the data model from your Sheets and CRM.', 'Rapider engineers check every line — in red pen.', 'You approve. Nothing ships without your signature.', 'Built. Your digital employee goes live and keeps working 24/7.'];
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(lines, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, stagger: 0.02, ease: 'power2.inOut' })
      .fromTo($$('.bp .ph', app), { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.02 }, '-=.5').addLabel('erd')
      .fromTo(erdL, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, stagger: 0.04, ease: 'power2.inOut' }, 'erd')
      .fromTo(notes, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.015 }, 'erd+=.3').addLabel('pen')
      .fromTo(pen, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.15, ease: 'power1.inOut' }, 'pen')
      .fromTo(hw, { attr: { width: 0 } }, { attr: { width: 340 }, duration: 0.8, stagger: 0.3, ease: 'none' }, 'pen+=.3').addLabel('stamp')
      .fromTo(stamp, { opacity: 0, scale: 1.9, rotation: -22 }, { opacity: 1, scale: 1, rotation: -9, duration: 0.3, ease: 'power4.in' }, 'stamp').addLabel('end');
    let cur = -1;
    const stage = (s) => {
      if (s === cur) return; cur = s;
      cap.textContent = CAPS[s]; sno.textContent = `${String(Math.min(s + 1, 4)).padStart(2, '0')} / 04`;
      tbHu.textContent = s >= 2 ? 'Rapider engineers' : '—'; tbYou.textContent = s >= 3 ? 'You' : '—';
      sheet.classList.toggle('is-built', s >= 4);
      gsap.fromTo(cap, { opacity: 0.2, y: 6 }, { opacity: 1, y: 0, duration: 0.4 });
    };
    const L = () => [0, tl.labels.erd, tl.labels.pen, tl.labels.stamp, tl.labels.end, tl.labels.end];
    const map = (p) => { const seg = p * 5, i = Math.min(4, Math.floor(seg)), f = seg - i, l = L(); return [l[i] + (l[i + 1] - l[i]) * f, i]; };
    if (REDUCED || MOBILE()) { tl.progress(1); stage(3); }
    else { stage(0); ScrollTrigger.create({ trigger: '.intro__pin', start: () => `top ${navH()}px`, end: '+=320%', pin: true, onUpdate: (st) => { const [t, i] = map(st.progress); tl.time(t); stage(i); } }); }
  })();

  /* ---------- run natively: approve in the widget (micro) ---------- */
  (() => {
    const btn = $('#wApprove'), req = btn.closest('.wm--req'); let done = false;
    const approve = () => { if (done) return; done = true; btn.textContent = 'Approved'; req.classList.add('is-done'); $('.crm__rows .is-hl span:last-child').textContent = 'Qualified'; say('Approved · <b>186 records</b> updated in Salesforce'); };
    btn.addEventListener('click', approve);
    if (!REDUCED) once([$('#widget')], () => setTimeout(approve, 4200), '0px 0px -30% 0px');
  })();

  /* ---------- built to work the way you do (pinned stepper) ---------- */
  (() => {
    const cols = $$('.wcol'), bar = $('#wbar'), T = $('#wbT'), D = $('#wbD');
    const STEPS = [['Connect', 'Instantly sync your data across all connected tools, ensuring that your entire team has access to the latest information at all times.'], ['Decide', 'Automate repetitive tasks with triggers, streamlining processes like data updates, notifications, and task assignments with ease.'], ['Ask', 'Collaborate smoothly with your team by sharing views, making updates, and leaving feedback in real time, all within Rapider.'], ['Act', 'Tailor your data with flexible views, from grid to kanban, making it easier to visualize and manage every aspect of your workflow.']];
    let cur = -1;
    const set = (i) => {
      if (i === cur) return; cur = i;
      cols.forEach((c, k) => c.classList.toggle('is-on', k === i));
      bar.style.setProperty('--s', i); T.textContent = STEPS[i][0]; D.textContent = STEPS[i][1];
      const svg = $('.iso', cols[i]);
      if (svg._keys && !REDUCED) gsap.fromTo(svg._keys.filter((e) => e.getAttribute('pathLength')), { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.06 });
      svg._keys && svg._keys.filter((e) => e.tagName !== 'text').forEach((e) => e.classList.add('ai'));
    };
    if (REDUCED || MOBILE()) { cols.forEach((c) => c.classList.add('is-on')); }
    else { set(0); ScrollTrigger.create({ trigger: '.way__pin', start: () => `top ${navH()}px`, end: '+=240%', pin: true, onUpdate: (st) => set(Math.min(3, Math.floor(st.progress * 4))) }); }
  })();

  /* ---------- phone, BOM ticks, counters ---------- */
  const msgs = $$('#chat > *');
  if (REDUCED) msgs.forEach((m) => m.classList.add('is-on'));
  else once([$('.phone')], () => msgs.forEach((m, i) => setTimeout(() => m.classList.add('is-on'), 250 + i * 600)), '0px 0px -25% 0px');
  const ticks = $$('.tick');
  if (REDUCED) ticks.forEach((t) => t.classList.add('is-on'));
  else once([$('.bom')], () => ticks.forEach((t, i) => setTimeout(() => t.classList.add('is-on'), 200 + i * 140)), '0px 0px -25% 0px');
  $$('.bom tr').forEach((r) => r.addEventListener('mouseenter', () => { const t = $('.tick', r); if (!t) return; t.classList.remove('is-on'); requestAnimationFrame(() => t.classList.add('is-on')); }));
  $$('.cnt').forEach((el) => {
    if (REDUCED) return;
    const to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '', o = { v: 0 };
    el.textContent = pre + '0' + suf;
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = pre + Math.round(o.v) + suf; } }) });
  });

  /* ---------- pricing toggle ---------- */
  const bBtns = $$('.bill button'), prices = $$('.spec__p b[data-m]');
  bBtns.forEach((b) => b.addEventListener('click', () => {
    bBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    prices.forEach((p, i) => { p.classList.add('is-flip'); setTimeout(() => { p.textContent = '$' + p.dataset[b.dataset.b]; p.classList.remove('is-flip'); }, 170 + i * 60); });
  }));

  /* ---------- CTA: book → stamped ---------- */
  $('#ctaBtn').addEventListener('click', () => {
    const s = $('#ctaStamp'), box = $('#ctaBox');
    $('.sigline').classList.add('is-signed');
    s.classList.remove('is-on'); void s.offsetWidth; s.classList.add('is-on');
    setTimeout(() => { box.classList.add('is-shake'); setTimeout(() => box.classList.remove('is-shake'), 320); }, 420);
    say('Request received · an engineer will <b>call you within 24h</b>');
  });

  // triggers were created out of page order (the night scene sits before the race): sort, then measure
  ScrollTrigger.sort(); ScrollTrigger.refresh();
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
