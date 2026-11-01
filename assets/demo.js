'use strict';
// landing: notas de geleia de verdade (o mesmo motor do app), a mesa interativa, a janela de download arrastável e o logo mole
(function () {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const L = window.JELLY;
  const PX = 2;

  // ------------------------------------------------------------ o desenho das notas (copiado do app: clean, jjam e slime)
  const MODE_RECIPE = {
    tech: { glitter: 0, drops: 0, drips: 0, grain: 0, iri: 0, pills: 0, accent: 0.18, topGlow: 0.18, shineFreq: 0, dot: 0,
      rim: 0.55, rimWidth: 1.6, edgeLight: 0.75, spec: 1.0, sharp: 55, square: 0.6, growth: 0.08, gooey: 0, shadow: 0.22, shadowBlur: 16, bubbles: 0, swirl: 0,
      goo: 0, wet: 0, rimGlow: 0.3, thick: 0.15, caustic: 0, bloom: 0, softbox: 0.35, subTint: 0.5 },
    jam: { aCenter: 0.62, aMid: 0.7, aEdge: 0.86, thick: 0.18, subsurface: 0.75, topGlow: 0.3 },
    game: { grain: 0, iri: 0.08, glitter: 5, shineSoft: 0, shineFreq: 0.9, pills: 1, softbox: 0, bloom: 0, goo: 0, wet: 0, caustic: 0 },
  };
  const FL = Object.fromEntries(L.FLAVORS.map((f) => [f.id, f]));
  let MODE = 'tech'; // tech (clean, padrão) | jam | game (slime)
  let layerN = 0;
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  function postit(c, w, h, seed) {
    const [light, base, deep] = c;
    let sd = (seed * 9301 + 49297) % 233280 || 7;
    const r = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
    const y0 = h + 4, parts = [];
    const blob = (cx, cy, rr, k) => {
      const pts = 7, out = [];
      for (let i = 0; i < pts; i++) { const a = (i / pts) * Math.PI * 2, q = rr * (1 + (r() - 0.5) * k); out.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * (0.92 + r() * 0.1)]); }
      let d = `M${((out[0][0] + out[pts - 1][0]) / 2).toFixed(1)} ${((out[0][1] + out[pts - 1][1]) / 2).toFixed(1)}`;
      for (let i = 0; i < pts; i++) { const p0 = out[i], p1 = out[(i + 1) % pts]; d += `Q${p0[0].toFixed(1)} ${p0[1].toFixed(1)} ${((p0[0] + p1[0]) / 2).toFixed(1)} ${((p0[1] + p1[1]) / 2).toFixed(1)}`; }
      return d + 'Z';
    };
    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? 34 + r() * (w * 0.3) : w * 0.55 + r() * (w * 0.3), big = i === 0 ? 1 : 0.7;
      const len = (22 + r() * 14) * big, rb = (8.5 + r() * 3) * big, hw = rb * (1.8 + r() * 0.5), sk = (r() - 0.5) * 4;
      parts.push(`<path d="M${x - hw - 6} ${y0 - 2}C${x - hw} ${y0} ${x - rb * 0.7 + sk} ${y0 + len * 0.45} ${x - rb * 0.85 + sk} ${y0 + len - rb}A${rb} ${rb * 1.05} 0 1 0 ${x + rb * 0.85 + sk} ${y0 + len - rb}C${x + rb * 0.7 + sk} ${y0 + len * 0.45} ${x + hw} ${y0} ${x + hw + 6} ${y0 - 2}Z"/>`
        + `<ellipse class="hl" cx="${x - rb * 0.35 + sk}" cy="${y0 + len - rb * 0.95}" rx="${rb * 0.26}" ry="${rb * 0.38}"/>`);
    }
    const side = r() < 0.5;
    const dots = [[side ? w + 7 : -7, h * (0.5 + r() * 0.3), 11 + r() * 3], [w * (0.35 + r() * 0.15), h + 30 + r() * 8, 5 + r() * 2], [side ? w + 24 + r() * 5 : -24 - r() * 5, h * (0.3 + r() * 0.15), 3.6 + r() * 1.4]];
    for (const [x, y, rr] of dots) parts.push(`<path d="${blob(x, y, rr, 0.22)}"/><circle class="hl" cx="${(x - rr * 0.32).toFixed(1)}" cy="${(y - rr * 0.38).toFixed(1)}" r="${(rr * 0.28).toFixed(1)}"/>`);
    return `<div class="tile" style="--pl:${light};--pb:${base};--pd:${deep}"></div>`
      + `<svg class="tile-goo" width="${w + 60}" height="${h + 60}" viewBox="-20 -20 ${w + 60} ${h + 60}" style="left:-20px;top:-20px;--pl:${light};--pb:${base};--pd:${deep}">${parts.join('')}</svg>`;
  }

  function pixelate(svg, w, colors, token, box) {
    const full = Number((svg.match(/width="([\d.]+)"/) || [])[1]);
    const M = (full - w) / 2;
    const fh = Number((svg.match(/height="([\d.]+)"/) || [])[1]);
    const img = new Image();
    img.onload = () => {
      if (box._tok !== token) return;
      const cw = Math.ceil(full / PX), ch = Math.ceil(fh / PX);
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, cw, ch);
      const im = ctx.getImageData(0, 0, cw, ch);
      const d = im.data;
      const out = [1, 3, 5].map((i) => parseInt(colors[2].slice(i, i + 2), 16) * 0.45 + parseInt(colors[1].slice(i, i + 2), 16) * 0.55);
      const solid = new Uint8Array(cw * ch);
      for (let i = 0; i < cw * ch; i++) {
        const a = d[i * 4 + 3];
        if (a < 70) { d[i * 4 + 3] = 0; continue; }
        solid[i] = 1;
        d[i * 4 + 3] = Math.min(255, Math.round(a / 32) * 32 + 56);
        for (let k = 0; k < 3; k++) d[i * 4 + k] = Math.min(255, Math.round((d[i * 4 + k] * 0.86 + 36) / 22) * 22);
      }
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        if (!solid[i]) continue;
        if (x === 0 || y === 0 || x === cw - 1 || y === ch - 1 || !solid[i - 1] || !solid[i + 1] || !solid[i - cw] || !solid[i + cw]) {
          d[i * 4] = out[0]; d[i * 4 + 1] = out[1]; d[i * 4 + 2] = out[2]; d[i * 4 + 3] = 225;
        }
      }
      ctx.putImageData(im, 0, 0);
      c.style.cssText = `position:absolute;left:${-M}px;top:${-M}px;width:${cw * PX}px;height:${ch * PX}px;image-rendering:pixelated;pointer-events:none`;
      box.replaceChildren(c);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
  }

  // pinta o corpo da nota (a "pele") para o tamanho e o sabor dela
  function skinOf(el, mode) {
    const box = $(':scope > .skin', el);
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!box || !w || !h) return;
    const flavor = el.dataset.flavor || 'lavanda';
    const key = [w, h, flavor, mode].join('|');
    if (el._key === key) return;
    el._key = key;
    const colors = FL[flavor].colors;
    const tk = L.tokens(colors, L.recipe);
    el.style.setProperty('--c1', tk.c1); el.style.setProperty('--c2', tk.c2); el.style.setProperty('--base', tk.light);
    el.style.setProperty('--ink', tk.ink); el.style.setProperty('--muted', tk.muted); el.style.setProperty('--deep', tk.deep);
    el.style.setProperty('--w', w + 'px'); el.style.setProperty('--h', h + 'px');
    el.dataset.look = mode;
    const seed = el._seed || (el._seed = hash(el.id || String(Math.random())) % 997);
    box._tok = (box._tok || 0) + 1;
    if (mode === 'tech') { el.style.setProperty('--tshadow', 'none'); box.innerHTML = postit(colors, w, h, seed); return; }
    L.setRecipe(Object.assign({}, L.recipe, MODE_RECIPE[mode] || {}));
    el.style.setProperty('--tshadow', mode === 'jam' ? L.glowOf(colors) : 'none');
    const out = L.drawJelly('j' + (++layerN), colors, w, h, seed);
    if (mode === 'game') pixelate(out.svg, w, colors, box._tok, box);
    else box.innerHTML = out.svg;
  }
  const ro = 'ResizeObserver' in window ? new ResizeObserver((es) => { for (const e of es) skinOf(e.target, e.target.dataset.fixed || MODE); }) : null;
  function track(el) { if (ro) ro.observe(el); skinOf(el, el.dataset.fixed || MODE); }
  function skinAll() { for (const el of $$('.jn')) { el._key = ''; skinOf(el, el.dataset.fixed || MODE); } }

  // ------------------------------------------------------------ janela de download: arrasta com mola, inclina e desliza
  function movable(el, bound) {
    if (!el || !fine) return;
    el.classList.add('movable');
    let x = 0, y = 0, vx = 0, vy = 0, rot = 0, rv = 0, sc = 1, sv = 0, sq = 0, down = false, tx = 0, ty = 0, gx = 0, gy = 0, pid = null, running = false, lastPoke = 0, sx0 = 0, sy0 = 0, moved = false, tgt = null;
    const bounds = () => { const m = 8; return { x0: m - el.offsetLeft, x1: bound.clientWidth - m - el.offsetLeft - el.offsetWidth, y0: m - el.offsetTop, y1: bound.clientHeight - m - el.offsetTop - el.offsetHeight }; };
    const paint = () => {
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(rot + (parseFloat(el.dataset.r) || 0)).toFixed(2)}deg) scale(${(sc * (1 + sq)).toFixed(4)}, ${(sc * (1 - sq)).toFixed(4)})`;
      el.style.setProperty('--lift', clamp((sc - 1) * 40, 0, 1).toFixed(2));
    };
    const tick = () => {
      const b = bounds(), px = x, py = y;
      if (down) { x += (tx - x) * 0.32; y += (ty - y) * 0.32; } else { x += vx; y += vy; vx *= 0.92; vy *= 0.92; }
      if (x < b.x0) { x = b.x0; vx = Math.abs(vx) * 0.45; } else if (x > b.x1) { x = b.x1; vx = -Math.abs(vx) * 0.45; }
      if (y < b.y0) { y = b.y0; vy = Math.abs(vy) * 0.45; } else if (y > b.y1) { y = b.y1; vy = -Math.abs(vy) * 0.45; }
      const dx = x - px, dy = y - py;
      if (down) { vx = dx; vy = dy; }
      rv += (clamp(dx * 0.9, -7, 7) - rot) * 0.14; rv *= 0.8; rot += rv;
      sv += ((down ? 1.028 : 1) - sc) * 0.16; sv *= 0.78; sc += sv;
      const sp = Math.hypot(dx, dy);
      sq += ((clamp(sp * 0.0035, 0, 0.05) * (Math.abs(dx) > Math.abs(dy) ? 1 : -1)) - sq) * 0.2;
      paint();
      const now = performance.now();
      if (sp > 1.2 && now - lastPoke > 50 && window.JJ && window.JJ.push) { lastPoke = now; const r = el.getBoundingClientRect(); window.JJ.push(r.left + r.width / 2, r.top + r.height / 2, sp); }
      if (!down && Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05 && Math.abs(rot) < 0.02 && Math.abs(rv) < 0.02 && Math.abs(sc - 1) < 0.0008 && Math.abs(sv) < 0.0008 && Math.abs(sq) < 0.0008) { sc = 1; rot = 0; sq = 0; paint(); running = false; return; }
      requestAnimationFrame(tick);
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('a, button, input')) return;
      down = true; moved = false; tgt = e.target; sx0 = e.clientX; sy0 = e.clientY; pid = e.pointerId; el.setPointerCapture(pid); el.classList.add('held');
      gx = e.clientX - x; gy = e.clientY - y; tx = x; ty = y; vx = vy = 0; kick();
    });
    el.addEventListener('pointermove', (e) => { if (!down || e.pointerId !== pid) return; tx = e.clientX - gx; ty = e.clientY - gy; if (Math.abs(e.clientX - sx0) + Math.abs(e.clientY - sy0) > 4) moved = true; });
    const up = (e) => {
      if (!down || (e && e.pointerId !== pid)) return;
      down = false; el.classList.remove('held');
      if (!moved && tgt && tgt.closest && tgt.closest('#logo-svg') && window.LOGO) window.LOGO.splat(); // clique no logo (sem arrastar)
      kick();
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    addEventListener('resize', () => { const b = bounds(); x = clamp(x, b.x0, b.x1); y = clamp(y, b.y0, b.y1); paint(); });
  }

  // ------------------------------------------------------------ logo mole: ondula com o mouse, acompanha o cursor e espirra no clique
  (function logo() {
    const svg = $('#logo-svg');
    if (!svg) return;
    const wob = $('#lgwob feDisplacementMap', svg), turb = $('#lgwob feTurbulence', svg), root = svg.firstElementChild;
    if (!wob || !root) return;
    root.setAttribute('filter', 'url(#lgwob)');
    svg.style.transformOrigin = '50% 55%';
    const blur = $('#lgwob feGaussianBlur', svg);
    let amp = 0, av = 0, hover = false, rx = 0, ry = 0, tr = { x: 0, y: 0 }, sc = 1, sv = 0, sq = 0, qv = 0, running = false, lastX = 0, lastY = 0, speed = 0, t = 0;
    // cremoso: molas moles e bem amortecidas, tudo sobe e desce devagar, com o volume preservado (achata em um eixo e estica no outro)
    const loop = () => {
      t += 0.016;
      const target = hover ? 4.5 + Math.min(9, speed * 0.3) : 0;
      av += (target - amp) * 0.04; av *= 0.9; amp += av;
      speed *= 0.95;
      rx += (tr.y - rx) * 0.055; ry += (tr.x - ry) * 0.055;
      sv += ((hover ? 1.02 : 1) - sc) * 0.05; sv *= 0.88; sc += sv;
      qv += (0 - sq) * 0.05; qv *= 0.9; sq += qv;
      wob.setAttribute('scale', Math.max(0, amp).toFixed(2));
      turb.setAttribute('baseFrequency', (0.0085 + Math.sin(t * 0.7) * 0.0022 + amp * 0.0004).toFixed(4));
      if (blur) blur.setAttribute('stdDeviation', (0.9 + Math.max(0, amp) * 0.07).toFixed(2));
      svg.style.transform = `perspective(800px) rotateX(${(-rx).toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(sc * (1 + sq)).toFixed(4)}, ${(sc * (1 - sq)).toFixed(4)})`;
      if (!hover && Math.abs(amp) < 0.04 && Math.abs(av) < 0.03 && Math.abs(rx) < 0.04 && Math.abs(ry) < 0.04 && Math.abs(sc - 1) < 0.001 && Math.abs(sv) < 0.001 && Math.abs(sq) < 0.001 && Math.abs(qv) < 0.001) { wob.setAttribute('scale', '0'); if (blur) blur.setAttribute('stdDeviation', '0.9'); svg.style.transform = ''; running = false; return; }
      requestAnimationFrame(loop);
    };
    const go = () => { if (!running && !still) { running = true; requestAnimationFrame(loop); } };
    svg.addEventListener('pointerenter', () => { hover = true; go(); });
    svg.addEventListener('pointerleave', () => { hover = false; tr = { x: 0, y: 0 }; go(); });
    svg.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      tr = { x: clamp(((e.clientX - r.left) / r.width - 0.5) * 18, -9, 9), y: clamp(((e.clientY - r.top) / r.height - 0.5) * 12, -6, 6) };
      speed = Math.max(speed, Math.hypot(e.clientX - lastX, e.clientY - lastY)); lastX = e.clientX; lastY = e.clientY; go();
    });
    window.LOGO = { splat() { if (still) return; av += 7; qv += 0.03; sv -= 0.025; go(); if (window.JJ && window.JJ.poke) { const r = svg.getBoundingClientRect(); window.JJ.poke(r.left + r.width / 2, r.top + r.height / 2); } } };
  })();


  // ------------------------------------------------------------ nota editável + janela do Notion simulada (os dois lados editam o mesmo documento)
  (function sync() {
    const nB = $('#n-blocks'), wB = $('#w-blocks'), nT = $('#n-title'), wT = $('#w-title');
    if (!nB || !wB) return;
    const doc = { title: 'ideias para hoje', blocks: [
      { t: 'h', x: 'o que fazer' }, { t: 'todo', x: 'testar a landing', c: false }, { t: 'todo', x: 'marcar a reunião', c: true },
      { t: 'b', x: 'escreva aqui e olhe a janela ao lado ✧' }] };
    const stN = $('#n-st'), stW = $('#w-st'), link = $('#link');
    let timer = 0, busyT = 0;
    const MARK = (t, c, cls, n) => t === 'todo' ? `<button class="${cls}" type="button" role="checkbox" aria-checked="${!!c}" aria-label="tarefa" tabindex="-1"></button>` : t === 'b' ? '<span class="bul" aria-hidden="true">•</span>' : t === 'n' ? `<b class="num" aria-hidden="true">${n}.</b>` : '';

    // desenha um editor (ed = 'n' nota, 'w' notion) a partir do documento
    function render(root, ck) {
      root.innerHTML = '';
      let num = 0;
      doc.blocks.forEach((b, i) => {
        const el = document.createElement('div');
        num = b.t === 'n' ? num + 1 : 0;
        const f = b.f || {};
        el.className = 'blk' + (b.c ? ' done' : '') + (f.b ? ' fb' : '') + (f.i ? ' fi' : '') + (f.u ? ' fu' : ''); el.dataset.t = b.t; el.dataset.i = i;
        const mk = MARK(b.t, b.c, ck, num);
        el.innerHTML = (mk ? `<span class="mk">${mk}</span>` : '') + `<div class="tx" contenteditable="true" spellcheck="false" data-ph="${b.t === 'h' ? 'título' : 'digite algo ou / para comandos'}"></div>`;
        $('.tx', el).textContent = b.x;
        root.appendChild(el);
      });
    }
    const ckClass = (root) => (root === nB ? 'ck' : 'ckn');
    const renderAll = (only) => {
      const dn = !only || only === 'n', dw = !only || only === 'w'; // só redesenha o lado pedido (o outro está sendo editado)
      if (dn) render(nB, 'ck'); if (dw) render(wB, 'ckn');
      if (dn && document.activeElement !== nT) nT.textContent = doc.title;
      if (dw && document.activeElement !== wT) wT.textContent = doc.title;
      $('#w-side').textContent = '📝 ' + (doc.title || 'Sem título');
      $('#w-crumb').textContent = 'meu espaço / notas / ' + (doc.title || 'Sem título');
    };
    function status(busy) {
      for (const [el, a, b] of [[stN, 'sincronizando…', 'sincronizado agora'], [stW, 'salvando…', 'editado agora']]) { el.textContent = busy ? a : b; el.classList.toggle('busy', busy); }
      link.classList.toggle('busy', busy);
    }
    // depois de editar num lado, o outro lado atualiza (com o aviso de sincronização)
    function changed(from) {
      status(true); clearTimeout(busyT);
      clearTimeout(timer);
      timer = setTimeout(() => { renderAll(from === 'n' ? 'w' : 'n'); busyT = setTimeout(() => status(false), 650); }, 380);
    }
    const focusBlock = (root, i, end) => {
      const tx = $(`.blk[data-i="${i}"] .tx`, root); if (!tx) return;
      tx.focus(); const r = document.createRange(), sel = getSelection();
      r.selectNodeContents(tx); r.collapse(!end); sel.removeAllRanges(); sel.addRange(r);
    };
    const caret = (tx) => { const sel = getSelection(); if (!sel.rangeCount || !tx.contains(sel.anchorNode)) return tx.textContent.length; const r = sel.getRangeAt(0).cloneRange(); r.selectNodeContents(tx); r.setEnd(sel.anchorNode, sel.anchorOffset); return r.toString().length; };

    function wire(root, who) {
      const idx = (e) => { const b = e.target.closest('.blk'); return b ? Number(b.dataset.i) : -1; };
      root.addEventListener('input', (e) => {
        const i = idx(e); if (i < 0) return; const b = doc.blocks[i]; const tx = e.target; let v = tx.textContent;
        // atalhos de markdown, como no Notion
        const m = /^(\[\] |\[ \] |- |\* |# |1\. )/.exec(v);
        if (m && b.t !== 'h') { b.t = m[1][0] === '[' ? 'todo' : m[1][0] === '#' ? 'h' : m[1][0] === '1' ? 'n' : 'b'; b.c = false; b.x = v.slice(m[1].length); render(root, ckClass(root)); focusBlock(root, i, false); changed(who); return; }
        b.x = v; changed(who);
      });
      root.addEventListener('keydown', (e) => {
        const i = idx(e); if (i < 0 || !e.target.classList.contains('tx')) return; const b = doc.blocks[i];
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const pos = caret(e.target), before = b.x.slice(0, pos), after = b.x.slice(pos);
          if ((b.t === 'todo' || b.t === 'b' || b.t === 'n') && !b.x) { b.t = 'p'; render(root, ckClass(root)); focusBlock(root, i, true); changed(who); return; }
          b.x = before;
          doc.blocks.splice(i + 1, 0, { t: b.t === 'todo' || b.t === 'b' || b.t === 'n' ? b.t : 'p', x: after, c: false, f: b.f ? Object.assign({}, b.f) : undefined });
          render(root, ckClass(root)); focusBlock(root, i + 1, false); changed(who);
        } else if (e.key === 'Backspace' && caret(e.target) === 0 && !getSelection().toString()) {
          e.preventDefault();
          if (b.t !== 'p') { b.t = 'p'; b.c = false; render(root, ckClass(root)); focusBlock(root, i, false); changed(who); return; }
          if (i > 0) { const prev = doc.blocks[i - 1], len = prev.x.length; prev.x += b.x; doc.blocks.splice(i, 1); render(root, ckClass(root)); focusBlock(root, i - 1, true); const r = getSelection(); r.removeAllRanges(); const tx = $(`.blk[data-i="${i - 1}"] .tx`, root), rg = document.createRange(), node = tx.firstChild; if (node) { rg.setStart(node, Math.min(len, node.length)); rg.collapse(true); r.addRange(rg); } changed(who); }
        } else if (e.key === 'ArrowUp' && i > 0 && caret(e.target) === 0) { e.preventDefault(); focusBlock(root, i - 1, true); }
        else if (e.key === 'ArrowDown' && i < doc.blocks.length - 1 && caret(e.target) >= b.x.length) { e.preventDefault(); focusBlock(root, i + 1, false); }
      });
      root.addEventListener('click', (e) => {
        const c = e.target.closest('[role=checkbox]'); if (!c) return; const i = idx(e); if (i < 0) return;
        doc.blocks[i].c = !doc.blocks[i].c; render(root, ckClass(root)); changed(who);
      });
      root.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text') || '').replace(/\n+/g, ' ')); });
    }
    const tbar = $('#tbar');
    if (tbar) {
      tbar.addEventListener('pointerdown', (e) => e.preventDefault()); // não tira o foco do texto
      tbar.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'mic') { e.preventDefault(); return; } // o microfone só funciona no app
        const blk = document.activeElement && document.activeElement.closest ? document.activeElement.closest('#n-blocks .blk') : null; if (!blk) return;
        const i = Number(blk.dataset.i), d = doc.blocks[i], a = b.dataset.a;
        if (a === 'b' || a === 'i' || a === 'u') { d.f = d.f || {}; d.f[a] = !d.f[a]; }
        else { const want = a === 'b-list' ? 'b' : a; d.t = d.t === want ? 'p' : want; d.c = false; }
        render(nB, 'ck'); focusBlock(nB, i, true); changed('n');
      });
    }
    wire(nB, 'n'); wire(wB, 'w');
    for (const [el, who] of [[nT, 'n'], [wT, 'w']]) {
      el.addEventListener('input', () => { doc.title = el.textContent; changed(who); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); focusBlock(who === 'n' ? nB : wB, 0, false); } });
      el.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text') || '').replace(/\n+/g, ' ')); });
    }
    renderAll(); status(false);
  })();

  // ------------------------------------------------------------ mesa de notas
  const desk = $('#desk');
  let zTop = 10;
  function dragNote(n) {
    let sx = 0, sy = 0, ox = 0, oy = 0, drag = false, pid = null, dx = 0, dy = 0;
    n.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button, input, a, .sw')) return;
      drag = true; pid = e.pointerId; n.setPointerCapture(pid); sx = e.clientX; sy = e.clientY;
      ox = parseFloat(n.style.getPropertyValue('--dx')) || 0; oy = parseFloat(n.style.getPropertyValue('--dy')) || 0;
      n.style.zIndex = ++zTop; n.classList.add('held');
    });
    n.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== pid) return;
      const d = desk.getBoundingClientRect();
      dx = ox + e.clientX - sx; dy = oy + e.clientY - sy;
      dx = clamp(dx, -n.offsetLeft - 30, d.width - n.offsetLeft - n.offsetWidth + 30);
      dy = clamp(dy, -n.offsetTop - 30, d.height - n.offsetTop - n.offsetHeight + 30);
      n.style.setProperty('--dx', dx + 'px'); n.style.setProperty('--dy', dy + 'px');
    });
    const up = (e) => { if (!drag || e.pointerId !== pid) return; drag = false; n.classList.remove('held'); wobble(n); };
    n.addEventListener('pointerup', up); n.addEventListener('pointercancel', up);
  }
  function wobble(n) { if (still) return; n.classList.remove('drop'); void n.offsetWidth; n.classList.add('drop'); setTimeout(() => n.classList.remove('drop'), 560); }

  const toast = $('#toast'); let lastDeleted = null, toastTimer = 0;
  function showToast(n) {
    lastDeleted = n; toast.hidden = false; toast.classList.add('on'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('on'); setTimeout(() => { toast.hidden = true; }, 300); lastDeleted = null; }, 6000);
  }
  $('#undo').addEventListener('click', () => { if (lastDeleted) { lastDeleted.hidden = false; zTop++; lastDeleted.style.zIndex = zTop; skinOf(lastDeleted, MODE); wobble(lastDeleted); lastDeleted = null; toast.classList.remove('on'); setTimeout(() => { toast.hidden = true; }, 300); } });

  const sideLater = [];
  function setupNote(n) {
    n.insertAdjacentHTML('afterbegin', '<div class="skin" aria-hidden="true"></div>');
    if (n.classList.contains('novo')) { // só as notas novas (criadas pelo atalho) podem ser apagadas; as da mesa ficam
      const x = document.createElement('button');
      x.className = 'x'; x.type = 'button'; x.setAttribute('aria-label', 'apagar esta nota'); x.textContent = '×';
      x.addEventListener('click', () => { n.hidden = true; showToast(n); });
      n.appendChild(x);
    }
    dragNote(n); track(n);
    sideLater.push(n);
  }
  for (const n of $$('.jn', desk)) setupNote(n);
  { const en = $('#ed-note'); if (en) { en.insertAdjacentHTML('afterbegin', '<div class="skin" aria-hidden="true"></div>'); track(en); } }

  // checklists de verdade
  desk.addEventListener('click', (e) => {
    const b = e.target.closest('.ck');
    if (!b) return;
    const on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', String(on)); b.closest('li').classList.toggle('done', on);
    const st = b.closest('.jn').querySelector('.syncst');
    if (st) { st.textContent = 'sincronizando…'; st.classList.add('busy'); setTimeout(() => { st.textContent = 'sincronizado agora'; st.classList.remove('busy'); }, 900); }
  });

  // três visuais
  function setMode(m) {
    MODE = m;
    for (const b of $$('[data-m]')) b.setAttribute('aria-pressed', String(b.dataset.m === m));
    desk.dataset.mode = m; document.body.dataset.mode = m;
    skinAll();
    for (const n of $$('.jn', desk)) wobble(n);
    for (const t of $$('.aba')) tabLook(t);
  }
  for (const b of $$('[data-m]')) b.addEventListener('click', () => setMode(b.dataset.m));

  // sabores: clicar numa bolinha muda a cor da própria nota
  const sw = $('#swatches');
  if (sw) {
    for (const f of L.FLAVORS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.title = f.name; b.setAttribute('aria-label', f.name); b.style.setProperty('--sw', f.colors[1]); b.style.setProperty('--sw2', f.colors[0]);
      b.addEventListener('click', () => { const n = sw.closest('.jn'); n.dataset.flavor = f.id; n._key = ''; skinOf(n, MODE); wobble(n); });
      sw.appendChild(b);
    }
  }

  // voz para texto (de mentirinha, só para mostrar): ouve, organiza em tópicos e escreve
  const mic = $('#mic');
  if (mic) {
    const out = $('#voz-out'), vs = $('#voz-st'); let busy = false;
    mic.addEventListener('click', () => {
      if (busy) return; busy = true; mic.classList.add('rec'); out.innerHTML = ''; vs.textContent = 'ouvindo…'; vs.classList.add('busy');
      setTimeout(() => { mic.classList.remove('rec'); vs.textContent = 'organizando em tópicos…'; }, 1700);
      const items = ['ligar para a gráfica', 'revisar o roteiro', 'comprar café'];
      setTimeout(() => {
        vs.classList.remove('busy'); vs.textContent = 'pronto ✿';
        items.forEach((t, i) => setTimeout(() => { const li = document.createElement('li'); li.textContent = t; out.appendChild(li); const n = mic.closest('.jn'); }, i * 380));
        setTimeout(() => { busy = false; }, 1400);
      }, 2500);
    });
  }

  // tags
  for (const c of $$('.chip', desk)) c.addEventListener('click', () => c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')));

  // desligar animações (de verdade, para a página toda)
  const tg = $('#noanim');
  if (tg) tg.addEventListener('change', () => { document.body.classList.toggle('no-anim', tg.checked); if (window.JJ && window.JJ.setPaused) window.JJ.setPaused(tg.checked); });

  // atalho: nota nova (botão ou ctrl/cmd + shift + J)
  const TITLES = ['nova nota', 'ideia solta', 'lembrete', 'rascunho'];
  let spawned = 0;
  function spawn() {
    const f = L.FLAVORS[Math.floor(Math.random() * L.FLAVORS.length)];
    const n = document.createElement('article');
    n.className = 'jn novo appear'; n.id = 'sp' + (++spawned); n.dataset.flavor = f.id; n.style.setProperty('--r', (Math.random() * 3 - 1.5).toFixed(1) + 'deg');
    n.style.width = (180 + Math.random() * 60) + 'px'; n.style.zIndex = ++zTop;
    n.innerHTML = `<div class="jb"><h3>${TITLES[spawned % TITLES.length]} ✿</h3><p class="mut">escreva aqui ✧･ﾟ</p></div>`;
    const d = desk.getBoundingClientRect();
    if (getComputedStyle(desk).display !== 'flex') { n.style.left = (6 + Math.random() * 60) + '%'; n.style.top = (52 + Math.random() * 30) + '%'; }
    desk.appendChild(n); setupNote(n); addSide(n, true); setTimeout(() => n.classList.remove('appear'), 700);
  }
  const nb = $('#nova'); if (nb) nb.addEventListener('click', spawn);
  addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') { e.preventDefault(); spawn(); } });


  // botões laterais da nota, como no app: + (nota nova), encostar no canto e ⋯ (cores)
  const SVG_DOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h11M12 7l5 5-5 5M20 5v14"/></svg>';
  let openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener('pointerdown', (e) => { if (openMenu && !e.target.closest('.menu, .lbtns')) closeMenu(); });
  function addSide(n, canDock) {
    const box = document.createElement('div');
    box.className = 'lbtns';
    box.innerHTML = '<button type="button" data-a="new" aria-label="nota nova" title="nota nova">+</button>'
      + (canDock ? `<button type="button" data-a="dock" aria-label="encostar no canto" title="encostar no canto">${SVG_DOCK}</button>` : '')
      + '<button type="button" data-a="more" aria-label="cores da nota" title="cores da nota">⋯</button>';
    n.appendChild(box);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'new') spawn();
      else if (b.dataset.a === 'dock') dockNote(n);
      else if (b.dataset.a === 'more') {
        closeMenu();
        const m = document.createElement('div'); m.className = 'menu'; m.innerHTML = '<b>cor da nota</b><div class="grid"></div>';
        for (const f of L.FLAVORS) {
          const c = document.createElement('button'); c.type = 'button'; c.className = 'sw'; c.title = f.name; c.setAttribute('aria-label', f.name); c.style.setProperty('--sw', f.colors[1]); c.style.setProperty('--sw2', f.colors[0]);
          c.addEventListener('click', () => { n.dataset.flavor = f.id; n._key = ''; skinOf(n, n.dataset.fixed || MODE); wobble(n); closeMenu(); });
          $('.grid', m).appendChild(c);
        }
        n.appendChild(m); openMenu = m;
        m.style.left = '-12px'; m.style.top = (n.offsetHeight + 6) + 'px';
      }
    });
  }

  // encostar no canto: a nota vira uma aba na beirada da janela; passar o mouse puxa a nota, clicar na aba traz de volta
  const rail = document.createElement('div'); rail.id = 'rail'; rail.style.cssText = 'position:absolute;right:calc((100% - 100vw) / 2);top:0;bottom:0;width:46px;pointer-events:none;z-index:7';
  desk.appendChild(rail);
  let dockedN = 0;
  function dockNote(n) {
    if (n.classList.contains('docked')) return;
    closeMenu();
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'aba docked-tab'; t.style.pointerEvents = 'auto'; t.style.right = '0'; t.style.top = (150 + (dockedN++) * 148) + 'px';
    const title = ($('.tt', n) || $('h3', n) || { textContent: 'nota' }).textContent.trim();
    const emo = ($('.ibtn', n) || { textContent: '✧' }).textContent;
    t.innerHTML = `<em aria-hidden="true">${emo}</em><span></span>`; $('span', t).textContent = title; t.setAttribute('aria-label', 'nota encostada: ' + title);
    rail.appendChild(t);
    n.style.setProperty('--ty', (parseFloat(t.style.top) - 40) + 'px');
    n.classList.add('docked'); n._tab = t;
    tabColors(t, n.dataset.flavor); tabLook(t);
    bindTab(t, n, () => undockNote(n));
    wobble(t);
  }
  function undockNote(n) {
    const t = n._tab; if (!t) return;
    n.classList.remove('docked', 'out'); t.remove(); n._tab = null; dockedN = Math.max(0, dockedN - 1);
    // as outras abas sobem para ocupar o lugar
    $$('.docked-tab', rail).forEach((x, i) => { x.style.top = (150 + i * 148) + 'px'; });
    $$('.jn.docked', desk).forEach((x, i) => x.style.setProperty('--ty', (150 + i * 148 - 40) + 'px'));
    wobble(n);
  }
  function tabColors(t, flavor) {
    const tk = L.tokens(FL[flavor].colors, L.recipe);
    for (const [k, v] of [['--c1', tk.c1], ['--c2', tk.c2], ['--base', tk.light], ['--deep', tk.deep], ['--ink', tk.ink]]) t.style.setProperty(k, v);
  }
  function bindTab(tab, note, onClick) {
    let hold = 0, off = 0;
    const open = () => { clearTimeout(off); clearTimeout(hold); hold = setTimeout(() => { note.classList.add('out'); tab.classList.add('on'); skinOf(note, MODE); }, 140); };
    const close = () => { clearTimeout(hold); clearTimeout(off); off = setTimeout(() => { note.classList.remove('out'); tab.classList.remove('on'); }, 380); };
    for (const el of [tab, note]) { el.addEventListener('pointerenter', open); el.addEventListener('pointerleave', close); }
    tab.addEventListener('focus', open); tab.addEventListener('blur', close);
    tab.addEventListener('click', onClick);
  }

  // aba do canto: passar o mouse puxa a nota para fora; tirar o mouse, ela some (igual ao app)
  let tabN = 0;
  function jamTabSvg(id, H) {
    const u = 't' + (++tabN);
    const W = 46, h = [...String(id)].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 7);
    const w1 = ((h % 7) - 3) * 0.7, w2 = (((h >> 3) % 7) - 3) * 0.7, w3 = (((h >> 6) % 7) - 3) * 0.7;
    const d = `M${W} 0L26 0C13 0 7 6 7 17C7 ${H * 0.28} ${5 + w1} ${H * 0.34} ${6 + w2} ${H * 0.5}C${7 + w3} ${H * 0.66} 8 ${H * 0.78} 7 ${H - 17}C7 ${H - 6} 13 ${H} 26 ${H}L${W} ${H}Z`;
    return `<svg class="jbg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="${u}c"><path d="${d}"/></clipPath>
      <linearGradient id="${u}g" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" style="stop-color:rgb(var(--c1));stop-opacity:.62"/><stop offset=".55" style="stop-color:rgb(var(--c1));stop-opacity:.28"/><stop offset="1" style="stop-color:rgb(var(--c2));stop-opacity:.6"/></linearGradient>
      <filter id="${u}b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter></defs>
      <path d="${d}" style="fill:var(--base)"/><path d="${d}" fill="url(#${u}g)"/>
      <g clip-path="url(#${u}c)"><path d="${d}" fill="none" style="stroke:rgb(var(--c1));stroke-opacity:.55" stroke-width="12" filter="url(#${u}b)"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3.5" filter="url(#${u}b)" transform="translate(2 3)"/></g>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/></svg>`;
  }
  function tabLook(t) {
    const old = $('.jbg', t); if (old) old.remove();
    const px = $('.px', t); if (px) px.remove();
    if (MODE === 'jam') t.insertAdjacentHTML('afterbegin', jamTabSvg(t.id, t.offsetHeight || 132));
    if (MODE === 'game') t.insertAdjacentHTML('afterbegin', '<i class="px"></i>');
  }
  // duas abas fixas na tela: "mexe aqui!" (água) e "baixar" (jjam); passar o mouse puxa a nota, tirar o mouse esconde
  for (const [ta, pe] of [['#aba', '#peek'], ['#aba2', '#peek2']]) {
    const tab = $(ta), peek = $(pe);
    if (!tab || !peek) continue;
    peek.insertAdjacentHTML('afterbegin', '<div class="skin" aria-hidden="true"></div>'); track(peek);
    tabColors(tab, peek.dataset.flavor);
    bindTab(tab, peek, () => { peek.classList.toggle('out'); tab.classList.toggle('on', peek.classList.contains('out')); });
    tabLook(tab);
  }

  // ------------------------------------------------------------ notas fixas da página (download) e arrastar o vidro
  for (const n of $$('.jn[data-fixed]')) { n.insertAdjacentHTML('afterbegin', '<div class="skin" aria-hidden="true"></div>'); track(n); }
  movable($('#logo-note'), $('#hero'));
  movable($('#hero-note'), $('#hero'));

  const go = $('#go');
  const goVis = () => { if (go) go.classList.toggle('gone', (window.scrollY || 0) > 40); };
  addEventListener('scroll', goVis, { passive: true }); goVis();
  if (go) go.addEventListener('click', () => { const t = $('#pratica'); if (t) t.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const n of $$('.jn')) { n._key = ''; skinOf(n, n.dataset.fixed || MODE); } });
  for (const n of sideLater) addSide(n, !n.classList.contains('peek'));
  { const en = $('#ed-note'); if (en) addSide(en, false); }
  setMode('tech');
})();
