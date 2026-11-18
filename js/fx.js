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
    addEventListener('pointermove', (e) => {
      mx(e.clientX); my(e.clientY);
      if (xy) xy.textContent = `${String(Math.round(e.clientX)).padStart(4, '0')} · ${String(Math.round(e.clientY + scrollY)).padStart(5, '0')}`;
      const t = e.target.closest('a, button, input, label, select, textarea, [data-cursor]');
      c.classList.toggle('is-hover', !!t);
      const text = t ? t.getAttribute('data-cursor') || '' : '';
      c.classList.toggle('has-lbl', !!text); lbl.textContent = text;
    }, { passive: true });
    addEventListener('pointerdown', () => c.classList.add('is-down'));
    addEventListener('pointerup', () => c.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => c.classList.add('is-out'));
    document.addEventListener('mouseenter', () => c.classList.remove('is-out'));
  };

  const magnetic = () => {
    if (!FINE || REDUCED) return;
    $$('.btn, [data-magnetic]').forEach((el) => {
      if (el.closest('[data-no-magnet]')) return;
      const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, .45)' }), qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, .45)' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.22); qy((e.clientY - r.top - r.height / 2) * 0.35); });
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

  return { init(o = {}) { roll(); scramble(); magnetic(); tilt(); if (o.cursor) cursor(o.cursor); }, REDUCED, FINE };
})();
