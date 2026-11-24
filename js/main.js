/* ============================================================
   Arranque de la presentación + demostración interactiva
   ============================================================ */
(function () {
  const sinc = (x) => (Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));

  /* ---------- Demostración: x(t) = 3cos(2π f0 t) reconstruida con sincs ---------- */
  function iniciarDemo() {
    const cv = document.getElementById('demo-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;

    const inFs = document.getElementById('ctl-fs');
    const inT = document.getElementById('ctl-T');
    const inF0 = document.getElementById('ctl-f0');
    const outFs = document.getElementById('out-fs');
    const outT = document.getElementById('out-T');
    const outF0 = document.getElementById('out-f0');
    const info = document.getElementById('demo-info');

    const A = 3, T0 = -2, T1 = 2, N = 800;
    const col = {
      fondo: '#16181d', rejilla: '#2a2e38', eje: '#8892a6', texto: '#9aa3b5',
      azul: '#4aa3ff', naranja: '#ff9a3c', amarillo: '#ffe14d', verde: '#7ddc7d'
    };

    function dibujar() {
      const fs = +inFs.value, Tm = +inT.value, f0 = +inF0.value;
      outFs.textContent = fs.toFixed(2) + ' Hz';
      outT.textContent = '±' + Tm.toFixed(2) + ' s';
      outF0.textContent = f0.toFixed(2) + ' Hz';

      const Ts = 1 / fs;
      const kmax = Math.floor(Tm / Ts + 1e-9);
      const tk = [], vk = [];
      for (let k = -kmax; k <= kmax; k++) {
        tk.push(k * Ts);
        vk.push(A * Math.cos(2 * Math.PI * f0 * k * Ts));
      }

      // señales sobre la ventana [T0, T1]
      const ts = new Float64Array(N + 1), xs = new Float64Array(N + 1), xr = new Float64Array(N + 1), er = new Float64Array(N + 1);
      let emax = 0;
      for (let i = 0; i <= N; i++) {
        const t = T0 + ((T1 - T0) * i) / N;
        let s = 0;
        for (let j = 0; j < tk.length; j++) s += vk[j] * sinc((t - tk[j]) / Ts);
        ts[i] = t;
        xs[i] = A * Math.cos(2 * Math.PI * f0 * t);
        xr[i] = s;
        er[i] = xs[i] - xr[i];
        emax = Math.max(emax, Math.abs(er[i]));
      }

      // energías (regla del trapecio)
      const dt = (T1 - T0) / N;
      let Ee = 0, Ex = 0;
      for (let i = 0; i < N; i++) {
        Ee += 0.5 * (er[i] * er[i] + er[i + 1] * er[i + 1]) * dt;
        Ex += 0.5 * (xs[i] * xs[i] + xs[i + 1] * xs[i + 1]) * dt;
      }

      // ----- dibujo -----
      ctx.fillStyle = col.fondo;
      ctx.fillRect(0, 0, W, H);

      const L = 60, R = 20;
      const X = (t) => L + ((t - T0) / (T1 - T0)) * (W - L - R);

      function panel(top, bot, ymax, etiquetaY) {
        const Y = (y) => top + ((ymax - y) / (2 * ymax)) * (bot - top);
        // rejilla vertical y etiquetas de tiempo
        ctx.strokeStyle = col.rejilla; ctx.lineWidth = 1;
        ctx.fillStyle = col.texto; ctx.font = '15px Segoe UI, Arial'; ctx.textAlign = 'center';
        for (let t = T0; t <= T1 + 1e-9; t += 0.5) {
          ctx.beginPath(); ctx.moveTo(X(t), top); ctx.lineTo(X(t), bot); ctx.stroke();
          ctx.fillText(String(t), X(t), bot + 18);
        }
        ctx.strokeStyle = col.eje; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(W - R, Y(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X(0), top); ctx.lineTo(X(0), bot); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillStyle = col.texto;
        ctx.fillText(ymax.toFixed(1), L - 8, Y(ymax) + 12);
        ctx.fillText((-ymax).toFixed(1), L - 8, Y(-ymax));
        ctx.fillText('0', L - 8, Y(0) + 5);
        ctx.save(); ctx.translate(16, (top + bot) / 2); ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center'; ctx.fillText(etiquetaY, 0, 0); ctx.restore();
        return Y;
      }

      function linea(Y, datos, color, ancho, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(dash || []);
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const px = X(ts[i]), py = Y(datos[i]);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }

      // panel superior: x(t), x_r(t) y muestras
      const Yt = panel(14, 330, 4.4, 'x(t), x_r(t)');
      linea(Yt, xs, col.azul, 3.2);
      linea(Yt, xr, col.naranja, 2.6, [9, 6]);
      let visibles = 0;
      for (let j = 0; j < tk.length; j++) if (tk[j] >= T0 && tk[j] <= T1) visibles++;
      if (visibles <= 90) {
        ctx.fillStyle = col.amarillo;
        for (let j = 0; j < tk.length; j++) {
          if (tk[j] < T0 || tk[j] > T1) continue;
          ctx.beginPath(); ctx.arc(X(tk[j]), Yt(vk[j]), 5, 0, 2 * Math.PI); ctx.fill();
        }
      }
      // límites de las muestras si se truncan dentro de la ventana
      if (Tm < T1) {
        ctx.strokeStyle = col.verde; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5;
        [-Tm, Tm].forEach((t) => { ctx.beginPath(); ctx.moveTo(X(t), 14); ctx.lineTo(X(t), 330); ctx.stroke(); });
        ctx.setLineDash([]);
      }
      // leyenda
      ctx.font = '15px Segoe UI, Arial'; ctx.textAlign = 'left';
      ctx.fillStyle = col.azul; ctx.fillText('x(t)', L + 10, 34);
      ctx.fillStyle = col.naranja; ctx.fillText('x_r(t)', L + 60, 34);
      ctx.fillStyle = col.amarillo; ctx.fillText('muestras', L + 125, 34);

      // panel inferior: error
      const em = Math.max(0.5, emax * 1.15);
      const Ye = panel(380, 530, em, 'e(t)');
      linea(Ye, er, col.verde, 2.4);
      ctx.fillStyle = col.verde; ctx.textAlign = 'left'; ctx.font = '15px Segoe UI, Arial';
      ctx.fillText('e(t) = x(t) − x_r(t)', L + 10, 398);

      // ----- información -----
      const B = f0;
      const cumple = fs > 2 * B;
      const m = Math.round(f0 / fs);
      const fa = Math.abs(f0 - m * fs);
      let html = '';
      html += 'Ts = <b>' + Ts.toFixed(3) + ' s</b> · fs = <b>' + fs.toFixed(2) + ' Hz</b><br>';
      html += 'B = ' + B.toFixed(2) + ' Hz → 2B = ' + (2 * B).toFixed(2) + ' Hz<br>';
      html += 'fs &gt; 2B: ' + (cumple ? '<span class="ok">sí se cumple</span>' : '<span class="mal">no se cumple (aliasing)</span>') + '<br>';
      html += 'Muestras usadas: <b>' + tk.length + '</b><br>';
      html += 'Energía del error: <b>' + Ee.toPrecision(3) + '</b> (' + (100 * Ee / Ex).toFixed(2) + ' % de la energía de x)';
      if (!cumple) {
        html += '<br>Con infinitas muestras se reconstruiría una cosenoidal de <b>' + fa.toFixed(2) + ' Hz</b>.';
      }
      info.innerHTML = html;
    }

    [inFs, inT, inF0].forEach((i) => i.addEventListener('input', dibujar));

    function caso(fs, T, f0) {
      inFs.value = fs; inT.value = T; inF0.value = f0; dibujar();
    }
    document.getElementById('caso1').addEventListener('click', () => caso(4, 6, 1));
    document.getElementById('caso2').addEventListener('click', () => caso(1.41, 6, 1));
    document.getElementById('caso3').addEventListener('click', () => caso(4, 0.5, 1));

    dibujar();
  }

  /* ---------- Arranque ---------- */
  function arrancar() {
    // 1. fórmulas
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        macros: {
          '\\Ts': 'T_s',
          '\\fs': 'f_s',
          '\\sinc': '\\operatorname{sinc}',
          '\\rect': '\\operatorname{rect}',
          '\\TF': '\\overset{F}{\\longleftrightarrow}'
        },
        throwOnError: false
      });
    }
    // 2. gráficas y demostración
    if (window.dibujarGraficas) window.dibujarGraficas();
    iniciarDemo();

    // 3. reveal.js
    Reveal.initialize({
      width: 1280,
      height: 720,
      margin: 0.04,
      hash: true,
      slideNumber: 'c/t',
      transition: 'fade',
      transitionSpeed: 'fast',
      center: false,
      controls: true,
      progress: true,
      plugins: [RevealNotes]
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
