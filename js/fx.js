// Shared micro-interactions for the Rapider directions. Needs GSAP. Call FX.init({ cursor: 'volt' | 'cross' }).
//  - custom cursor with context labels (data-cursor="Play"), hidden on touch
//  - magnetic buttons (.btn, [data-magnetic])
//  - label roll on buttons; data-alt gives a second line with the brand's voice
//  - text scramble on hover ([data-scramble]) for mono labels
//  - 3D tilt with glare ([data-tilt="6"])
window.FX = (() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]static\b/.test(location.search);

  const cursor = (theme) => {
    if (!FINE || REDUCED) return;
    document.documentElement.classList.add('has-cur', 'cur-' + theme);
    const c = document.createElement('div');
    c.className = 'cur cur--' + theme;
    c.innerHTML = theme === 'cross'
      ? '<i class="cur__h"></i><i class="cur__v"></i><b class="cur__ring"></b><span class="cur__lbl"></span><span class="cur__xy"></span>'
      : '<b class="cur__ring"></b><i class="cur__dot"></i><span class="cur__lbl"></span>';
    document.body.append(c);
    const lbl = c.querySelector('.cur__lbl'), xy = c.querySelector('.cur__xy');
    const mx = gsap.quickTo(c, 'x', { duration: 0.18, ease: 'power3.out' }), my = gsap.quickTo(c, 'y', { duration: 0.18, ease: 'power3.out' });
    // Is the ground under the pointer dark (or brand blue)? Then the cursor turns light, so it never disappears.
    const darkCache = new WeakMap();
    const isDark = (el) => {
      if (!el || el === document.documentElement) return false;
      if (darkCache.has(el)) return darkCache.get(el);
      let n = el, res = false;
      while (n && n !== document.documentElement) {
        if (n.hasAttribute && n.hasAttribute('data-cursor-dark')) { res = true; break; }
        if (n.tagName === 'VIDEO' || n.tagName === 'IMG') { res = true; break; }
        const bg = getComputedStyle(n).backgroundColor, m = bg.match(/rgba?\(([^)]+)\)/);
        if (m) { const [r, g, b, a = 1] = m[1].split(',').map(Number); if (a > 0.5) { res = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45; break; } }
        n = n.parentElement;
      }
      darkCache.set(el, res); return res;
    };
    let lx = -100, ly = -100, last = null;
    const look = (target) => {
      if (target === last) return; last = target;
      const t = target && target.closest ? target.closest('a, button, input, label, select, textarea, [data-cursor]') : null;
      c.classList.toggle('is-hover', !!t);
      const text = t ? t.getAttribute('data-cursor') || '' : '';
      c.classList.toggle('has-lbl', !!text); lbl.textContent = text;
      c.classList.toggle('on-dark', isDark(target));
    };
    addEventListener('pointermove', (e) => {
      lx = e.clientX; ly = e.clientY; mx(lx); my(ly);
      c.classList.remove('is-out'); // any movement brings it back (mouseenter on document is not reliable)
      if (xy) xy.textContent = `${String(Math.round(lx)).padStart(4, '0')} · ${String(Math.round(ly + scrollY)).padStart(5, '0')}`;
      look(e.target);
    }, { passive: true });
    // the page also moves under a still mouse (scroll, pinned scenes): re-check what is under it
    let pend = false;
    addEventListener('scroll', () => { if (pend || lx < 0) return; pend = true; requestAnimationFrame(() => { pend = false; look(document.elementFromPoint(lx, ly)); }); }, { passive: true });
    addEventListener('resize', () => { last = null; });
    addEventListener('pointerdown', () => c.classList.add('is-down'));
    addEventListener('pointerup', () => c.classList.remove('is-down'));
    document.documentElement.addEventListener('mouseleave', () => c.classList.add('is-out'));
    addEventListener('blur', () => c.classList.add('is-out'));
  };

  const magnetic = () => {
    if (!FINE || REDUCED) return;
    $$('.btn, [data-magnetic]').forEach((el) => {
      if (el.closest('[data-no-magnet]')) return;
      const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }), qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.12); qy((e.clientY - r.top - r.height / 2) * 0.2); });
      el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  };

  const roll = () => {
    $$('.btn').forEach((b) => {
      if (b.querySelector(".roll") || b.hasAttribute("data-no-roll")) return;
      const nodes = [...b.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
      const spanLbl = b.querySelector(':scope > span:not(.ff):not(.roll)');
      const src = nodes.length ? nodes : spanLbl ? [spanLbl] : [];
      if (!src.length) return;
      const text = src.map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
      const alt = b.getAttribute('data-alt') || text;
      const r = document.createElement('span'); r.className = 'roll';
      r.innerHTML = `<span class="roll__a">${text}</span><span class="roll__b" aria-hidden="true">${alt}</span>`;
      src[0].replaceWith(r); src.slice(1).forEach((n) => n.remove());
    });
  };

  const scramble = () => {
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·+—';
    $$('[data-scramble]').forEach((el) => {
      const final = el.textContent; let raf = 0;
      const host = el.closest('a, button, [data-scramble-host]') || el;
      host.addEventListener('pointerenter', () => {
        if (REDUCED) return; cancelAnimationFrame(raf); let f = 0;
        const step = () => {
          f++;
          el.textContent = final.split('').map((ch, i) => (ch === ' ' ? ' ' : i < f / 2 ? ch : CH[Math.floor(Math.random() * CH.length)])).join('');
          if (f / 2 < final.length) raf = requestAnimationFrame(step); else el.textContent = final;
        };
        step();
      });
    });
  };

  const tilt = () => {
    if (!FINE || REDUCED) return;
    $$('[data-tilt]').forEach((el) => {
      const max = +el.dataset.tilt || 6;
      const glare = document.createElement('i'); glare.className = 'glare'; el.append(glare);
      gsap.set(el, { transformPerspective: 1100, transformStyle: 'preserve-3d' });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * max); ry(px * max);
        glare.style.background = `radial-gradient(600px circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,.35), transparent 45%)`;
        glare.style.opacity = 1;
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); glare.style.opacity = 0; });
    });
  };

  /* ---------- scroll that stays smooth on phones ---------- */
  const TOUCH = !FINE;
  // The address bar showing/hiding resizes the viewport on phones; never re-lay the page for that.
  if (window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });

  // Pinned scene. Desktop: a normal ScrollTrigger pin. Touch: the browser holds it with position: sticky.
  // A ScrollTrigger pin is moved by JS one frame after the finger scrolls, so on phones it lags and then snaps
  // ("thump"); sticky runs on the compositor together with the finger. Spread the result into scrollTrigger vars.
  //   FX.pin('.race__pin', { top: () => navH, len: 2 })  // len = scroll length in screen heights
  const pin = (target, o = {}) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    const top = () => (typeof o.top === 'function' ? o.top() : o.top || 0);
    if (!TOUCH) return { trigger: el, start: () => `top ${top()}px`, end: `+=${Math.round((o.len || 1) * 100)}%`, pin: true, anticipatePin: 1 };
    const wrap = document.createElement('div'); wrap.className = 'stk';
    el.parentNode.insertBefore(wrap, el); wrap.append(el);
    let len = 0;
    const size = () => { len = Math.round((o.len || 1) * innerHeight); el.style.position = 'sticky'; el.style.top = top() + 'px'; wrap.style.height = el.offsetHeight + len + 'px'; };
    size(); if (window.ScrollTrigger) ScrollTrigger.addEventListener('refreshInit', size);
    return { trigger: wrap, start: () => `top ${top()}px`, end: () => `+=${len}` };
  };

  // Scroll progress arrives in steps on phones (native scroll events). Ease the value instead of jumping to it.
  //   const go = FX.smooth(render); ... onUpdate: (st) => go(st.progress)
  const smooth = (render, d = 0.35) => {
    const o = { p: 0 };
    const q = gsap.quickTo(o, 'p', { duration: d, ease: 'power2.out', onUpdate: () => render(o.p) });
    return (p, now) => { if (now) { o.p = p; q.tween && q.tween.pause(); render(p); } else q(p); };
  };

  // Pause every CSS animation (pulses, spinners, marquees) in sections that are off screen, and let JS loops ask
  // FX.on(el) before they do work.
  const vis = new WeakMap();
  const watch = () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { vis.set(e.target, e.isIntersecting); e.target.classList.toggle('is-off', !e.isIntersecting); }), { rootMargin: '15% 0px' });
    $$('main > section, body > section, footer, .hero').forEach((s) => io.observe(s));
    return io;
  };
  let io;
  const on = (el) => { const s = el && el.closest('section, footer, .hero'); if (!s) return true; if (!vis.has(s)) { if (!io) io = watch(); io.observe(s); return true; } return vis.get(s); };

  return { init(o = {}) { roll(); scramble(); magnetic(); tilt(); if (o.cursor) cursor(o.cursor); io = io || watch(); }, pin, smooth, on, REDUCED, FINE, TOUCH };
})();
