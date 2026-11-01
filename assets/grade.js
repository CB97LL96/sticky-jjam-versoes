'use strict';
// fundo da landing: uma grade lilás que ondula como gelatina perto do mouse, com pontinhos que trocam de cor em ondas lentas
(function () {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('grade');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const GAP = 44, R = 130;
  // lilás, roxo, rosa e um toque de verde slime fluorescente
  const PAL = [[183, 154, 242], [166, 91, 255], [255, 122, 200], [122, 59, 230], [242, 154, 235], [176, 255, 24], [166, 91, 255], [183, 154, 242]];
  const lerp = (a, b, t) => a + (b - a) * t;
  const colorAt = (p) => { const n = PAL.length - 1, f = Math.max(0, Math.min(0.999, p)) * n, i = Math.floor(f), t = f - i; return [lerp(PAL[i][0], PAL[i + 1][0], t), lerp(PAL[i][1], PAL[i + 1][1], t), lerp(PAL[i][2], PAL[i + 1][2], t)]; };
  let W = 0, H = 0, cols = 0, rows = 0, dpr = 1, dx, dy, vx, vy, T = 0, mx = -1e4, my = -1e4, paused = false, hidden = false;
  let ripples = [], kick = [];

  function init() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GAP) + 3; rows = Math.ceil(H / GAP) + 3;
    dx = new Float32Array(cols * rows); dy = new Float32Array(cols * rows); vx = new Float32Array(cols * rows); vy = new Float32Array(cols * rows);
    draw();
  }
  let par1 = 0, par2 = 0;
  const readScroll = () => { const y = window.scrollY || 0; par1 = -((y * 0.35) % GAP); par2 = -((y * 0.14) % (GAP * 3)); };
  const bx = (i) => (i - 1) * GAP, by = (j) => (j - 1) * GAP + par1;

  function step() {
    T += 1 / 60;
    readScroll();
    for (const r of ripples) r.t += 1 / 60;
    ripples = ripples.filter((r) => r.t < 1.7);
    kick = kick.filter((k) => (k.t += 1 / 60) < 0.6);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i, x = bx(i), y = by(j);
      let tx = 0, ty = 0;
      let ddx = x - mx, ddy = y - my, d = Math.hypot(ddx, ddy);
      if (d < R * 3) { const f = Math.exp(-(d * d) / (2 * R * R)) * 20; tx += ddx / (d + 1) * f; ty += ddy / (d + 1) * f; }   // empurra os nós para fora do cursor, como uma lente de gelatina
      for (const r of ripples) { const rx = x - r.x, ry = y - r.y, rd = Math.hypot(rx, ry), ring = Math.exp(-Math.pow(rd - r.t * 420, 2) / (2 * 48 * 48)) * 26 * (1 - r.t / 1.7); tx += rx / (rd + 1) * ring; ty += ry / (rd + 1) * ring; }
      for (const q of kick) { const rx = x - q.x, ry = y - q.y, rd = Math.hypot(rx, ry), f = Math.exp(-(rd * rd) / (2 * 110 * 110)) * q.a * (1 - q.t / 0.6); tx += rx / (rd + 1) * f; ty += ry / (rd + 1) * f; }
      vx[k] += (tx - dx[k]) * 0.05; vy[k] += (ty - dy[k]) * 0.05;   // mola mole: volta devagar
      vx[k] *= 0.86; vy[k] *= 0.86; dx[k] += vx[k]; dy[k] += vy[k];
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(190,168,240,0.16)';
    ctx.beginPath();
    for (let j = 0; j < rows; j++) { for (let i = 0; i < cols; i++) { const k = j * cols + i, X = bx(i) + dx[k], Y = by(j) + dy[k]; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } }
    for (let i = 0; i < cols; i++) { for (let j = 0; j < rows; j++) { const k = j * cols + i, X = bx(i) + dx[k], Y = by(j) + dy[k]; if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } }
    ctx.stroke();
    // pontinhos nos cruzamentos: a cor passa em ondas diagonais lentas; perto do mouse crescem
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i, x = bx(i), y = by(j), X = x + dx[k], Y = y + dy[k];
      const w = Math.sin((x + y) * 0.0042 - T * 0.65) * 0.5 + 0.5, w2 = Math.sin(x * 0.0031 - y * 0.0027 + T * 0.4) * 0.5 + 0.5;
      const c = colorAt(w * 0.7 + w2 * 0.3);
      const near = Math.min(1, Math.hypot(dx[k], dy[k]) / 18);
      ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(0.22 + near * 0.3).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(X, Y, 1.3 + near * 1.6, 0, 6.2832); ctx.fill();
    }
  }

  addEventListener('resize', (() => { let w = 0, h = 0; return () => { if (innerWidth !== w || Math.abs(innerHeight - h) > 140) { w = innerWidth; h = innerHeight; init(); } }; })());
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; });
  addEventListener('pointerleave', () => { mx = my = -1e4; });
  addEventListener('pointerdown', (e) => { if (!still && !paused) ripples.push({ x: e.clientX, y: e.clientY, t: 0 }); });
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; });
  addEventListener('scroll', () => { if (still || paused) { readScroll(); draw(); } }, { passive: true });
  // a janela de download e as notinhas empurram a grade quando se mexem
  window.JJ = {
    poke: (x, y) => { if (!still && !paused) ripples.push({ x, y, t: 0 }); },
    push: (x, y, sp) => { if (!still && !paused) kick.push({ x, y, a: Math.min(26, 6 + sp * 1.2), t: 0 }); },
    setPaused: (p) => { paused = p; if (p) { mx = my = -1e4; } },
    still,
  };
  init();
  (function loop() { requestAnimationFrame(loop); if (hidden || still || paused) return; step(); draw(); })();
})();
