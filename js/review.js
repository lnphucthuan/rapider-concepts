// Review mode for the Rapider concept pages. Click anything to pin a note; notes stay in this browser.
// "Copy for Claude" exports a Markdown report (this page or all pages) that can be pasted back into the chat.
// Open any page with ?review to start in review mode. No data leaves the browser.
(() => {
  if (window.__rvLoaded) return; window.__rvLoaded = true;
  const PAGE = location.pathname.replace(/\/index\.html$/, '/');
  const KEY = 'rp-review:' + PAGE;
  const TAGS = { love: 'Love', change: 'Change', bug: 'Bug', ask: 'Question' };
  const DIMS = ['Wow factor', 'Brand personality', 'Detail & assets', 'Motion & micro-interactions', 'Mobile'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let S = Object.assign({ notes: [], overall: {}, seq: 0 }, load());
  const save = () => { S.title = document.title; S.url = location.origin + PAGE; S.at = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const doc = document.documentElement;
  const maxScroll = () => Math.max(1, doc.scrollHeight - innerHeight);

  /* ---------- UI shell (shadow DOM so page CSS can't touch it) ---------- */
  const host = document.createElement('div');
  host.id = 'rv-host'; host.setAttribute('data-lenis-prevent', '');
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
  :host{all:initial}*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}
  textarea{font:inherit;color:#111;width:100%;border:1px solid #d4d4d8;border-radius:10px;padding:10px;resize:vertical;min-height:84px;outline:0}
  textarea:focus{border-color:#111;box-shadow:0 0 0 3px rgba(17,17,17,.12)}
  .fab,.bar,.pop,.panel,.tip{pointer-events:auto}
  .fab{position:fixed;left:16px;bottom:16px;display:flex;align-items:center;gap:9px;height:46px;padding:0 18px 0 14px;border-radius:999px;background:#111;color:#fff;font-weight:650;font-size:14px;box-shadow:0 12px 30px -8px rgba(0,0,0,.45);transition:transform .25s}
  .fab:hover{transform:translateY(-2px)} .fab svg{width:18px;height:18px}
  .fab b{min-width:20px;height:20px;border-radius:99px;background:#ff3b6b;color:#fff;font-size:12px;display:grid;place-items:center;padding:0 6px}
  .fab b:empty{display:none}
  .bar{position:fixed;left:16px;bottom:16px;display:none;align-items:center;gap:6px;padding:6px;border-radius:16px;background:#111;color:#fff;box-shadow:0 16px 40px -10px rgba(0,0,0,.5);max-width:calc(100vw - 32px)}
  .on .bar{display:flex} .on .fab{display:none}
  .bar .st{display:flex;align-items:center;gap:8px;padding:0 10px 0 8px;font-size:13px;font-weight:600;white-space:nowrap}
  .bar .st i{width:8px;height:8px;border-radius:50%;background:#ff3b6b;box-shadow:0 0 0 0 rgba(255,59,107,.6);animation:p 1.6s infinite}
  @keyframes p{70%{box-shadow:0 0 0 8px rgba(255,59,107,0)}100%{box-shadow:0 0 0 0 rgba(255,59,107,0)}}
  .bar button{height:34px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:600;background:#27272a;white-space:nowrap}
  .bar button:hover{background:#3f3f46} .bar button.go{background:#fff;color:#111}
  .bar button b{margin-left:6px;background:#ff3b6b;border-radius:99px;padding:1px 7px;font-size:11px}
  .tip{position:fixed;left:16px;bottom:74px;max-width:300px;padding:12px 14px;border-radius:14px;background:#fff;color:#111;font-size:13px;line-height:1.45;box-shadow:0 14px 40px -10px rgba(0,0,0,.4);display:none}
  .on .tip.show{display:block}
  .hl{position:fixed;display:none;border:2px solid #ff3b6b;background:rgba(255,59,107,.08);border-radius:4px;pointer-events:none}
  .hl b{position:absolute;left:-2px;top:-23px;background:#ff3b6b;color:#fff;font:600 11px ui-monospace,Menlo,monospace;padding:2px 7px;border-radius:5px;white-space:nowrap;max-width:60vw;overflow:hidden;text-overflow:ellipsis}
  .pins{position:fixed;inset:0;pointer-events:none}
  .pin{position:fixed;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);display:none;pointer-events:auto;box-shadow:0 6px 16px rgba(0,0,0,.35);border:2px solid #fff}
  .pin span{display:block;transform:rotate(45deg);color:#fff;font:700 12px/24px system-ui;text-align:center}
  .t-love{background:#0d9f5f}.t-change{background:#e8590c}.t-bug{background:#d6336c}.t-ask{background:#3b5bdb}
  .pin.done{opacity:.45}
  .pin:hover::after{content:attr(data-t);position:absolute;left:34px;top:-6px;transform:rotate(45deg);transform-origin:0 0;white-space:nowrap}
  .pop{position:fixed;width:min(320px,calc(100vw - 24px));padding:14px;border-radius:16px;background:#fff;color:#111;box-shadow:0 24px 60px -12px rgba(0,0,0,.45);display:none;border:1px solid #e4e4e7}
  .pop h4{margin:0 0 4px;font-size:13px;font-weight:700} .pop .on-el{font:500 11px ui-monospace,Menlo,monospace;color:#71717a;margin-bottom:10px;display:flex;gap:8px;align-items:center;justify-content:space-between}
  .pop .on-el span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pop .up{flex:none;padding:3px 8px;border-radius:7px;background:#f4f4f5;font-size:11px;font-weight:600}
  .tags{display:flex;gap:6px;margin:0 0 10px;flex-wrap:wrap}
  .tags button{padding:6px 11px;border-radius:99px;background:#f4f4f5;font-size:12.5px;font-weight:600}
  .tags button.sel{color:#fff}.tags .love.sel{background:#0d9f5f}.tags .change.sel{background:#e8590c}.tags .bug.sel{background:#d6336c}.tags .ask.sel{background:#3b5bdb}
  .row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
  .btn{height:36px;padding:0 14px;border-radius:10px;font-size:13px;font-weight:650;background:#f4f4f5}
  .btn.pri{background:#111;color:#fff}.btn.pri:hover{background:#27272a}.btn:hover{background:#e4e4e7}
  .panel{position:fixed;top:0;right:0;bottom:0;width:390px;max-width:100vw;background:#fff;color:#111;display:flex;flex-direction:column;box-shadow:-24px 0 60px -20px rgba(0,0,0,.35);transform:translateX(105%);visibility:hidden;transition:transform .35s cubic-bezier(.2,.7,.1,1),visibility 0s .35s}
  .panel.open{transform:none;visibility:visible;transition:transform .35s cubic-bezier(.2,.7,.1,1)}
  .ph{padding:16px 16px 0}.ph h3{margin:0;font-size:16px}.ph p{margin:2px 0 0;font-size:12px;color:#71717a}
  .x{position:absolute;right:12px;top:12px;width:32px;height:32px;border-radius:10px;font-size:18px}.x:hover{background:#f4f4f5}
  .tabs{display:flex;gap:4px;padding:12px 16px 0;border-bottom:1px solid #e4e4e7}
  .tabs button{padding:8px 12px;font-size:13px;font-weight:650;color:#71717a;border-bottom:2px solid transparent;margin-bottom:-1px}
  .tabs button.sel{color:#111;border-color:#111}
  .body{flex:1;overflow:auto;padding:12px 16px}
  .empty{padding:28px 8px;text-align:center;color:#71717a;font-size:13.5px;line-height:1.5}
  .note{display:grid;grid-template-columns:28px 1fr;gap:4px 10px;padding:12px 0;border-bottom:1px solid #f1f1f3}
  .note.done .tx{text-decoration:line-through;color:#a1a1aa}
  .note .n{width:26px;height:26px;border-radius:50%;color:#fff;font:700 12px/26px system-ui;text-align:center}
  .note .tg{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#71717a}
  .note .tx{margin:2px 0 4px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
  .note .ctx{font-size:11.5px;color:#71717a}.note .ctx em{font-style:normal;color:#d97706}
  .acts{grid-column:2;display:flex;gap:4px;margin-top:6px}
  .acts button{padding:4px 9px;border-radius:8px;background:#f4f4f5;font-size:12px;font-weight:600}.acts button:hover{background:#e4e4e7}
  .sec{display:flex;align-items:center;gap:10px;width:100%;padding:11px 8px;border-radius:10px;text-align:left;font-size:14px;font-weight:550}
  .sec:hover{background:#f4f4f5}.sec i{font:600 11px ui-monospace,Menlo,monospace;color:#a1a1aa;font-style:normal;width:22px}.sec b{margin-left:auto;font-size:11px;color:#fff;background:#ff3b6b;border-radius:99px;padding:1px 7px}
  .dim{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;padding:9px 0;border-bottom:1px solid #f1f1f3;font-size:13.5px;font-weight:600}
  .stars{display:flex;gap:2px}.stars button{width:26px;height:26px;border-radius:7px;background:#f4f4f5;font-size:12px;font-weight:700;color:#71717a}
  .stars button.sel{background:#111;color:#fff}
  .lab{display:block;margin:14px 0 6px;font-size:12.5px;font-weight:700}
  .verd{display:flex;gap:6px}.verd button{flex:1;padding:9px 6px;border-radius:10px;background:#f4f4f5;font-size:13px;font-weight:650}.verd button.sel{background:#111;color:#fff}
  .foot{padding:12px 16px 16px;border-top:1px solid #e4e4e7;display:grid;gap:8px}
  .foot .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.foot .btn{width:100%}
  .foot small{font-size:11.5px;color:#71717a;line-height:1.4}
  .ok{color:#0d9f5f;font-weight:700}
  @media(max-width:640px){.panel{top:auto;height:78vh;width:100%;transform:translateY(105%);border-radius:18px 18px 0 0}.panel.open{transform:none}.bar .st span{display:none}.fab span{display:none}.fab{padding:0 14px}}
  </style>
  <div id="app">
    <button class="fab" id="fab" aria-label="Open feedback mode"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H9l-5 4z"/></svg><span>Feedback</span><b id="fabN"></b></button>
    <div class="bar" id="bar"><div class="st"><i></i><span>Review mode — click anything</span></div><button id="bNotes">Notes<b id="bN">0</b></button><button id="bSec">Sections</button><button class="go" id="bDone">Done</button></div>
    <div class="tip" id="tip"></div>
    <div class="hl" id="hl"><b></b></div>
    <div class="pins" id="pins"></div>
    <div class="pop" id="pop" role="dialog" aria-label="Add a note"></div>
    <aside class="panel" id="panel" aria-label="Feedback"></aside>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const app = $('#app');

  /* ---------- helpers ---------- */
  const cssPath = (el) => {
    const parts = [];
    const q = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/[^\w-]/g, '\\$&'));
    while (el && el.nodeType === 1 && el !== doc) {
      if (el.id && document.querySelectorAll('#' + q(el.id)).length === 1) { parts.unshift('#' + q(el.id)); break; }
      let p = el.tagName.toLowerCase();
      const par = el.parentElement;
      if (par) { const same = [...par.children].filter((c) => c.tagName === el.tagName); if (same.length > 1) p += `:nth-of-type(${same.indexOf(el) + 1})`; }
      parts.unshift(p); el = par;
    }
    return parts.join(' > ');
  };
  const find = (sel) => { try { return sel ? document.querySelector(sel) : null; } catch (e) { return null; } };
  const label = (el) => {
    const t = clean(el.innerText || el.getAttribute('aria-label') || el.alt || '').slice(0, 38);
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : cls ? '.' + cls : ''}${t ? ' · ' + t : ''}`;
  };
  const sectionName = (el) => {
    const s = el.closest('section, footer, header');
    if (!s) return 'Page';
    const lab = s.getAttribute('aria-labelledby'); let h = lab && document.getElementById(lab);
    h = h || s.querySelector('h1, h2');
    const t = clean(h && h.textContent) || s.id || (typeof s.className === 'string' && s.className.split(' ')[0]) || s.tagName.toLowerCase();
    return t.slice(0, 64);
  };
  const TEXTY = 'h1,h2,h3,h4,p,li,button,a,figcaption,blockquote,label,td,th,dt,dd,summary';
  const pick = (t, exact) => {
    if (!t || t === doc || t === document.body) return null;
    let el = t.nodeType === 1 ? t : t.parentElement;
    if (!el) return null;
    const svg = el.closest && el.closest('svg');
    if (svg && svg !== el && !exact) el = svg;
    if (!exact && el.tagName !== 'svg') {
      // split words, spans inside headings, labels inside buttons: select the whole text block instead
      if (/^(SPAN|B|I|EM|STRONG|SMALL|CODE|TIME|MARK|U|ABBR)$/.test(el.tagName) || getComputedStyle(el).display === 'inline') {
        const blk = el.parentElement && el.parentElement.closest(TEXTY);
        if (blk) el = blk;
        else while (el.parentElement && el.parentElement !== document.body && getComputedStyle(el).display === 'inline') el = el.parentElement;
      }
    }
    return el && el !== document.body ? el : null;
  };
  const fromEvent = (e) => { const p = e.composedPath ? e.composedPath() : [e.target]; if (p.includes(host)) return null; return pick(p[0], e.altKey); };

  /* ---------- state ---------- */
  let active = false, hoverEl = null, draft = null, tab = 'notes', raf = 0;
  const cache = new Map();

  const setActive = (v) => {
    active = v; app.classList.toggle('on', v); doc.classList.toggle('rv-on', v);
    try { sessionStorage.setItem('rp-review-on', v ? '1' : ''); } catch (e) {}
    if (!v) { closePop(); closePanel(); $('#hl').style.display = 'none'; cancelAnimationFrame(raf); $('#pins').innerHTML = ''; cache.clear(); }
    else { renderPins(); loop(); showTip(); }
  };
  const showTip = () => {
    const tip = $('#tip'); if (sessionStorage.getItem('rp-review-tip')) return;
    tip.innerHTML = '<b>Click anything</b> on the page to leave a note — a headline, a button, an image, a whole section. Hold <b>Alt</b> to pick a tiny element exactly, or use <b>▲ Bigger</b>. Your notes stay on this device; open <b>Notes → Copy all pages</b> when you are done and paste them to Claude.';
    tip.classList.add('show'); try { sessionStorage.setItem('rp-review-tip', '1'); } catch (e) {}
    setTimeout(() => tip.classList.remove('show'), 9000);
  };

  /* ---------- pins ---------- */
  const renderPins = () => {
    const box = $('#pins'); box.innerHTML = '';
    S.notes.forEach((n, i) => {
      const d = document.createElement('div'); d.className = `pin t-${n.tag}${n.done ? ' done' : ''}`; d.dataset.id = n.id; d.dataset.t = clean(n.text).slice(0, 50);
      d.innerHTML = `<span>${i + 1}</span>`; d.addEventListener('click', (e) => { e.stopPropagation(); openPanel('notes'); flash(n.id); });
      box.append(d);
    });
    updateCounts();
  };
  const updateCounts = () => { const n = S.notes.length; $('#fabN').textContent = n || ''; $('#bN').textContent = n; };
  const resolve = (n) => {
    let el = cache.get(n.id);
    if (!el || !el.isConnected) { el = find(n.sel); if (el) cache.set(n.id, el); else cache.delete(n.id); }
    return el;
  };
  const loop = () => {
    if (!active) return;
    const pins = root.querySelectorAll('.pin');
    pins.forEach((d) => {
      const n = S.notes.find((x) => x.id === +d.dataset.id); if (!n) return;
      const el = resolve(n);
      if (!el) { d.style.display = 'none'; return; }
      const r = el.getBoundingClientRect();
      const vis = r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
      if (!vis) { d.style.display = 'none'; return; }
      const x = Math.min(innerWidth - 16, Math.max(16, r.left + n.x * r.width)), y = Math.min(innerHeight - 16, Math.max(16, r.top + n.y * r.height));
      d.style.display = 'block'; d.style.left = x + 'px'; d.style.top = y + 'px';
    });
    if (hoverEl && !draft) place($('#hl'), hoverEl);
    raf = requestAnimationFrame(loop);
  };
  const place = (hl, el) => {
    if (!el || !el.isConnected) { hl.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    hl.style.display = 'block'; hl.style.left = r.left + 'px'; hl.style.top = r.top + 'px'; hl.style.width = r.width + 'px'; hl.style.height = r.height + 'px';
    const b = hl.firstElementChild; b.textContent = label(el); b.style.top = r.top < 26 ? 'auto' : '-23px'; b.style.bottom = r.top < 26 ? '-23px' : 'auto';
  };

  /* ---------- page events (capture, so the page does not react) ---------- */
  addEventListener('pointermove', (e) => { if (!active || draft) return; hoverEl = fromEvent(e); if (!hoverEl) $('#hl').style.display = 'none'; }, { passive: true });
  addEventListener('click', (e) => {
    if (!active) return;
    const el = fromEvent(e); if (!el) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const r = el.getBoundingClientRect();
    openPop({ el, cx: e.clientX, cy: e.clientY, x: Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width))), y: Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(1, r.height))), tag: 'change', text: '' });
  }, true);
  ['submit', 'dblclick', 'contextmenu'].forEach((t) => addEventListener(t, (e) => { if (active && !(e.composedPath && e.composedPath().includes(host))) { e.preventDefault(); e.stopPropagation(); } }, true));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && active) { if (draft) closePop(); else if ($('#panel').classList.contains('open')) closePanel(); else setActive(false); } });
  addEventListener('resize', () => { if (draft) closePop(); });

  /* ---------- popover ---------- */
  function openPop(d) {
    draft = d; const pop = $('#pop');
    const edit = d.id != null;
    pop.innerHTML = `<h4>${edit ? 'Edit note' : 'New note'}</h4>
      <div class="on-el"><span id="onEl">${esc(label(d.el))}</span><button class="up" id="up" title="Select the parent element">▲ Bigger</button></div>
      <div class="tags">${Object.entries(TAGS).map(([k, v]) => `<button class="${k}${d.tag === k ? ' sel' : ''}" data-tag="${k}">${v}</button>`).join('')}</div>
      <textarea id="txt" placeholder="What works, what feels off, what you would change…">${esc(d.text)}</textarea>
      <div class="row">${edit ? '<button class="btn" id="del">Delete</button>' : ''}<button class="btn" id="cancel">Cancel</button><button class="btn pri" id="save">Save note</button></div>`;
    pop.style.display = 'block';
    const w = Math.min(320, innerWidth - 24), h = pop.offsetHeight;
    pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, d.cx + 14)) + 'px';
    pop.style.top = Math.max(12, Math.min(innerHeight - h - 12, d.cy + 14)) + 'px';
    place($('#hl'), d.el);
    pop.querySelectorAll('[data-tag]').forEach((b) => b.addEventListener('click', () => { draft.tag = b.dataset.tag; pop.querySelectorAll('[data-tag]').forEach((x) => x.classList.toggle('sel', x === b)); }));
    $('#up').addEventListener('click', () => { const p = draft.el.parentElement; if (p && p !== document.body) { draft.el = p; $('#onEl').textContent = label(p); place($('#hl'), p); } });
    $('#cancel').addEventListener('click', closePop);
    if (edit) $('#del').addEventListener('click', () => { S.notes = S.notes.filter((n) => n.id !== d.id); save(); closePop(); renderPins(); renderPanel(); });
    $('#save').addEventListener('click', commit);
    const t = $('#txt'); t.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') commit(); });
    setTimeout(() => t.focus(), 30);
  }
  function commit() {
    const text = $('#txt').value.trim(); if (!text) { $('#txt').focus(); return; }
    const d = draft;
    const data = { tag: d.tag, text, sel: cssPath(d.el), snippet: clean(d.el.innerText || d.el.alt || '').slice(0, 90), label: label(d.el), section: sectionName(d.el), x: +d.x.toFixed(3), y: +d.y.toFixed(3) };
    if (d.id != null) Object.assign(S.notes.find((n) => n.id === d.id), data, { sel: cssPath(d.el) });
    else S.notes.push(Object.assign({ id: ++S.seq, sy: Math.round(scrollY), pct: +(scrollY / maxScroll()).toFixed(4), vw: innerWidth, vh: innerHeight, t: Date.now() }, data));
    save(); cache.clear(); closePop(); renderPins(); renderPanel();
  }
  function closePop() { draft = null; const p = $('#pop'); p.style.display = 'none'; p.innerHTML = ''; $('#hl').style.display = 'none'; }

  /* ---------- panel ---------- */
  const go = (y) => { y = Math.max(0, y); window.H && window.H.lenis ? window.H.lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: 'smooth' }); };
  const goNote = (n) => { const same = Math.abs(innerWidth - n.vw) / n.vw < 0.03; go(same ? n.sy : n.pct * maxScroll()); };
  const flash = (id) => { const li = root.querySelector(`.note[data-id="${id}"]`); if (li) { li.scrollIntoView({ block: 'center' }); li.animate([{ background: '#fff3bf' }, { background: 'transparent' }], { duration: 1400 }); } };
  const openPanel = (t) => { if (t) tab = t; $('#panel').classList.add('open'); renderPanel(); };
  const closePanel = () => $('#panel').classList.remove('open');
  const sections = () => [...document.querySelectorAll('section, footer')].filter((s) => s.getBoundingClientRect().height > 60 || s.offsetHeight > 60).map((s) => ({ el: s, name: sectionName(s) }));
  const noteCountIn = (name) => S.notes.filter((n) => n.section === name).length;

  function renderPanel() {
    const p = $('#panel'); if (!p.classList.contains('open')) return;
    const keep = p.querySelector('.body') ? p.querySelector('.body').scrollTop : 0;
    let body = '';
    if (tab === 'notes') {
      body = S.notes.length ? S.notes.map((n, i) => `<div class="note ${n.done ? 'done' : ''}" data-id="${n.id}"><span class="n t-${n.tag}">${i + 1}</span><div><span class="tg">${TAGS[n.tag]}</span><p class="tx">${esc(n.text)}</p><div class="ctx">${esc(n.section)}${find(n.sel) ? '' : ' · <em>element changed</em>'}</div></div><div class="acts"><button data-a="go">Go to</button><button data-a="edit">Edit</button><button data-a="done">${n.done ? 'Reopen' : 'Done'}</button></div></div>`).join('')
        : '<div class="empty"><b>No notes yet.</b><br>Click anything on the page — a headline, a button, a picture — to pin a note to it.</div>';
    } else if (tab === 'sections') {
      body = sections().map((s, i) => `<button class="sec" data-i="${i}"><i>${String(i + 1).padStart(2, '0')}</i>${esc(s.name)}${noteCountIn(s.name) ? `<b>${noteCountIn(s.name)}</b>` : ''}</button>`).join('');
    } else {
      const o = S.overall;
      body = DIMS.map((d) => `<div class="dim"><span>${d}</span><div class="stars" data-d="${esc(d)}">${[1, 2, 3, 4, 5].map((k) => `<button class="${o[d] === k ? 'sel' : ''}" data-v="${k}">${k}</button>`).join('')}</div></div>`).join('')
        + `<label class="lab">Verdict for this page</label><div class="verd">${['Keep', 'Revise', 'Drop'].map((v) => `<button class="${o.verdict === v ? 'sel' : ''}" data-verdict="${v}">${v}</button>`).join('')}</div>`
        + `<label class="lab" for="gen">What still feels generic?</label><textarea id="gen">${esc(o.generic || '')}</textarea>`
        + `<label class="lab" for="keep">What should I keep for sure?</label><textarea id="keep">${esc(o.keep || '')}</textarea>`;
    }
    p.innerHTML = `<div class="ph"><h3>Feedback · ${esc(document.title.replace(/^Rapider\s*—\s*/, ''))}</h3><p>${S.notes.length} note${S.notes.length === 1 ? '' : 's'} · saved on this device only</p><button class="x" id="px" aria-label="Close">×</button></div>
      <div class="tabs">${[['notes', 'Notes'], ['sections', 'Sections'], ['overall', 'Overall']].map(([k, v]) => `<button class="${tab === k ? 'sel' : ''}" data-tab="${k}">${v}</button>`).join('')}</div>
      <div class="body">${body}</div>
      <div class="foot"><div class="two"><button class="btn pri" id="copyThis">Copy this page</button><button class="btn pri" id="copyAll">Copy all pages</button></div><div class="two"><button class="btn" id="dl">Download .md</button><button class="btn" id="clear">Clear this page</button></div><small id="msg">Paste the copied text into the chat with Claude and the notes become the next to-do list.</small></div>`;
    p.querySelector('.body').scrollTop = keep;
    $('#px').addEventListener('click', closePanel);
    p.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; renderPanel(); }));
    p.querySelectorAll('.note').forEach((li) => { const n = S.notes.find((x) => x.id === +li.dataset.id);
      li.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.a === 'go') goNote(n);
        else if (b.dataset.a === 'done') { n.done = !n.done; save(); renderPins(); renderPanel(); }
        else { const el = find(n.sel); if (!el) return; goNote(n); setTimeout(() => { const r = el.getBoundingClientRect(); openPop({ el, id: n.id, cx: Math.max(20, r.left + n.x * r.width), cy: Math.max(20, r.top + n.y * r.height), x: n.x, y: n.y, tag: n.tag, text: n.text }); }, 700); }
      })); });
    p.querySelectorAll('.sec').forEach((b) => b.addEventListener('click', () => { const s = sections()[+b.dataset.i]; if (s) go(s.el.getBoundingClientRect().top + scrollY - 64); }));
    p.querySelectorAll('.stars').forEach((st) => st.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.overall[st.dataset.d] = +b.dataset.v; save(); renderPanel(); })));
    p.querySelectorAll('[data-verdict]').forEach((b) => b.addEventListener('click', () => { S.overall.verdict = b.dataset.verdict; save(); renderPanel(); }));
    const g = p.querySelector('#gen'), k = p.querySelector('#keep');
    if (g) g.addEventListener('input', () => { S.overall.generic = g.value; save(); });
    if (k) k.addEventListener('input', () => { S.overall.keep = k.value; save(); });
    $('#copyThis').addEventListener('click', () => copy(report([S]), 'Copied this page'));
    $('#copyAll').addEventListener('click', () => copy(report(allStates()), 'Copied all pages'));
    $('#dl').addEventListener('click', () => { const b = new Blob([report(allStates())], { type: 'text/markdown' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'rapider-feedback.md'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    const cl = $('#clear'); let armed = false;
    cl.addEventListener('click', () => { if (!armed) { armed = true; cl.textContent = 'Really clear?'; setTimeout(() => { armed = false; if (cl.isConnected) cl.textContent = 'Clear this page'; }, 3000); return; } S.notes = []; S.overall = {}; save(); renderPins(); renderPanel(); });
  }

  /* ---------- export ---------- */
  const allStates = () => {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('rp-review:')) { const v = JSON.parse(localStorage.getItem(k)); if (v && k !== KEY) out.push(v); } } } catch (e) {}
    out.push(S); return out.filter((s) => (s.notes && s.notes.length) || (s.overall && Object.keys(s.overall).length)).sort((a, b) => String(a.url).localeCompare(String(b.url)));
  };
  const report = (states) => {
    const L = [`# Rapider concept feedback`, `Exported ${new Date().toLocaleString()} · viewport ${innerWidth}×${innerHeight} @${devicePixelRatio}x · ${navigator.userAgent.replace(/\s*\(.*?\)\s*/g, ' ').slice(0, 80)}`, ''];
    if (!states.length) L.push('_No notes yet._');
    states.forEach((st) => {
      L.push(`## ${clean((st.title || '').replace(/^Rapider\s*—\s*/, '')) || 'Page'}  \n${st.url || ''}`, '');
      const o = st.overall || {};
      if (Object.keys(o).length) {
        L.push('### Overall');
        DIMS.forEach((d) => { if (o[d]) L.push(`- ${d}: ${o[d]}/5`); });
        if (o.verdict) L.push(`- Verdict: **${o.verdict}**`);
        if (clean(o.generic)) L.push(`- Still feels generic: ${clean(o.generic)}`);
        if (clean(o.keep)) L.push(`- Keep for sure: ${clean(o.keep)}`);
        L.push('');
      }
      if ((st.notes || []).length) {
        L.push('### Notes');
        st.notes.forEach((n, i) => {
          L.push(`${i + 1}. **[${TAGS[n.tag] || n.tag}]${n.done ? ' (done)' : ''}** ${n.text.replace(/\n+/g, ' / ')}`);
          L.push(`   - Section: ${n.section} · scroll ${Math.round(n.pct * 100)}% (y=${n.sy}, ${n.vw}×${n.vh})`);
          L.push(`   - Element: \`${n.label}\` — selector \`${n.sel}\``);
          if (n.snippet) L.push(`   - Text there: “${n.snippet}”`);
        });
        L.push('');
      }
    });
    return L.join('\n');
  };
  const copy = async (text, ok) => {
    const msg = $('#msg');
    try { await navigator.clipboard.writeText(text); msg.innerHTML = `<span class="ok">✓ ${ok}.</span> Paste it into the chat with Claude.`; }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select(); try { document.execCommand('copy'); msg.innerHTML = `<span class="ok">✓ ${ok}.</span> Paste it into the chat with Claude.`; } catch (e2) { msg.textContent = 'Copy failed — use Download .md instead.'; } ta.remove(); }
  };

  /* ---------- wire up ---------- */
  $('#fab').addEventListener('click', () => setActive(true));
  $('#bDone').addEventListener('click', () => setActive(false));
  $('#bNotes').addEventListener('click', () => { const p = $('#panel'); p.classList.contains('open') && tab === 'notes' ? closePanel() : openPanel('notes'); });
  $('#bSec').addEventListener('click', () => { const p = $('#panel'); p.classList.contains('open') && tab === 'sections' ? closePanel() : openPanel('sections'); });
  const style = document.createElement('style');
  style.textContent = 'html.rv-on, html.rv-on *{cursor:crosshair !important} html.rv-on .cur{display:none !important}';
  document.head.append(style);
  const mount = () => { document.body.append(host); updateCounts(); const q = /[?&]review\b/.test(location.search); let was = false; try { was = !!sessionStorage.getItem('rp-review-on'); } catch (e) {} if (q || was) setActive(true); };
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  window.RV = { open: () => setActive(true), close: () => setActive(false), state: () => S };
})();
