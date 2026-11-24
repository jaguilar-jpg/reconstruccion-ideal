/* ============================================================
   Gráficas SVG generadas con JavaScript (sin librerías).
   Cada <div class="graf" data-g="nombre"></div> se rellena aquí.
   Todas usan la misma sinc de clase: sinc(x) = sin(πx)/(πx)
   ============================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    azul: '#4aa3ff', amarillo: '#ffe14d', naranja: '#ff9a3c', verde: '#7ddc7d',
    rojo: '#ff6b6b', gris: '#9aa3b5', texto: '#e8eaf0', eje: '#8892a6', fondo: '#1b1d23'
  };

  const sinc = (x) => (Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
  const tri = (f, c, B) => Math.max(0, 1 - Math.abs(f - c) / B);

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function texto(svg, x, y, t, color, ancla, tam) {
    const e = el('text', {
      x: x, y: y, fill: color || C.texto, 'text-anchor': ancla || 'middle',
      'font-size': tam || 17, 'font-family': 'Segoe UI, system-ui, Arial, sans-serif'
    }, svg);
    e.textContent = t;
    return e;
  }

  /* Reconstrucción con sincs: x_r(t) = Σ x(kTs) sinc((t - kTs)/Ts) */
  function reconstruir(x, Ts, K) {
    const muestras = [];
    for (let k = -K; k <= K; k++) muestras.push({ t: k * Ts, v: x(k * Ts) });
    return (t) => {
      let s = 0;
      for (let i = 0; i < muestras.length; i++) s += muestras[i].v * sinc((t - muestras[i].t) / Ts);
      return s;
    };
  }

  /* Gráfica general */
  function plot(cont, cfg) {
    const W = cfg.w || 600, H = cfg.h || 290;
    const L = 30, R = 22, T = cfg.titulo ? 34 : 16, B = 36;
    const [x0, x1] = cfg.x, [y0, y1] = cfg.y;
    const X = (x) => L + ((x - x0) / (x1 - x0)) * (W - L - R);
    const Y = (y) => T + ((y1 - y) / (y1 - y0)) * (H - T - B);

    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.titulo || 'gráfica' }, cont);

    if (cfg.titulo) texto(svg, L + 4, 22, cfg.titulo, C.texto, 'start', 18);

    // ejes
    el('line', { x1: X(x0), y1: Y(0), x2: X(x1), y2: Y(0), stroke: C.eje, 'stroke-width': 1.8 }, svg);
    if (cfg.ejeY !== false && x0 < 0 && x1 > 0) {
      el('line', { x1: X(0), y1: Y(y1), x2: X(0), y2: Y(y0), stroke: C.eje, 'stroke-width': 1.4 }, svg);
    }

    // rectángulos (filtros, ventanas)
    (cfg.rects || []).forEach((r) => {
      el('rect', {
        x: X(r.x0), y: Y(r.y1), width: X(r.x1) - X(r.x0), height: Y(r.y0) - Y(r.y1),
        fill: r.color, 'fill-opacity': r.relleno || 0.1, stroke: r.color, 'stroke-width': 2.5,
        'stroke-dasharray': r.dash || '9 6', rx: 3
      }, svg);
    });

    // series
    (cfg.series || []).forEach((s) => {
      let pts = s.pts;
      if (!pts) {
        pts = [];
        const n = s.n || 480;
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n;
          pts.push([x, s.f(x)]);
        }
      }
      const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
      if (s.relleno) {
        el('path', {
          d: d + ' L' + X(pts[pts.length - 1][0]).toFixed(1) + ',' + Y(0) + ' L' + X(pts[0][0]).toFixed(1) + ',' + Y(0) + ' Z',
          fill: s.color, 'fill-opacity': s.relleno, stroke: 'none'
        }, svg);
      }
      el('path', {
        d: d, fill: 'none', stroke: s.color, 'stroke-width': s.ancho || 3,
        'stroke-dasharray': s.dash || 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        'stroke-opacity': s.opacidad || 1
      }, svg);
    });

    // tallos (muestras)
    (cfg.tallos || []).forEach((p) => {
      el('line', { x1: X(p.x), y1: Y(0), x2: X(p.x), y2: Y(p.y), stroke: p.color || C.amarillo, 'stroke-width': 2 }, svg);
    });

    // puntos
    (cfg.puntos || []).forEach((p) => {
      el('circle', { cx: X(p.x), cy: Y(p.y), r: p.r || 5.5, fill: p.color || C.amarillo }, svg);
    });

    // marcas en el eje
    (cfg.marcas || []).forEach((m) => {
      el('line', { x1: X(m.x), y1: Y(0) - 4, x2: X(m.x), y2: Y(0) + 4, stroke: C.eje, 'stroke-width': 1.6 }, svg);
      if (m.t) texto(svg, X(m.x), H - 10, m.t, C.gris, 'middle', 16);
    });

    // etiquetas libres (en coordenadas de datos)
    (cfg.etiquetas || []).forEach((e) => {
      texto(svg, X(e.x), Y(e.y), e.t, e.color || C.texto, e.ancla || 'middle', e.tam || 17);
    });

    return svg;
  }

  /* ---------- Espectros: réplicas, filtro, solape ---------- */
  function espectro(cont, modo, fs, B) {
    const xr = fs * 1.62;
    const series = [];
    if (modo === 'solape') {
      const cols = { '-1': C.verde, '0': C.azul, '1': C.rojo };
      [-1, 0, 1].forEach((k) => {
        series.push({
          pts: [[k * fs - B, 0], [k * fs, 1], [k * fs + B, 0]],
          color: cols[k], ancho: 2.5, relleno: 0.28
        });
      });
      series.push({
        f: (f) => tri(f, -fs, B) + tri(f, 0, B) + tri(f, fs, B),
        color: C.amarillo, ancho: 3.5, n: 600
      });
    } else {
      [-1, 0, 1].forEach((k) => {
        series.push({
          pts: [[k * fs - B, 0], [k * fs, 1], [k * fs + B, 0]],
          color: C.azul, ancho: 2.5, relleno: k === 0 ? 0.55 : 0.22, opacidad: k === 0 ? 1 : 0.75
        });
      });
    }
    const cfg = {
      x: [-xr, xr], y: [-0.18, 1.35], series: series,
      marcas: [
        { x: 0, t: '0' }, { x: fs, t: 'fs' }, { x: -fs, t: '−fs' }, { x: B, t: 'B' }, { x: -B, t: '−B' }
      ],
      titulo: modo === 'replicas' ? 'X_m(f) = fs · Σ X(f − k·fs)'
        : modo === 'filtro' ? 'Y(f) = X_m(f) · H(f)'
          : 'fs < 2B: las réplicas se solapan'
    };
    if (modo === 'filtro') {
      cfg.rects = [{ x0: -fs / 2, x1: fs / 2, y0: 0, y1: 1.2, color: C.naranja, relleno: 0.12 }];
      cfg.etiquetas = [{ x: fs / 2 + 0.05, y: 1.25, t: 'H(f) = Ts', color: C.naranja, ancla: 'start' }];
    }
    if (modo === 'solape') {
      cfg.etiquetas = [
        { x: 0, y: 1.2, t: 'se suman y se confunden', color: C.amarillo }
      ];
    }
    plot(cont, cfg);
  }

  /* ---------- Definición de cada gráfica ---------- */
  const G = {
    'rect-t': (c) => plot(c, {
      x: [-2, 2], y: [-0.3, 1.45], titulo: 's(t) = A · rect_T(t)',
      series: [{ pts: [[-2, 0], [-0.5, 0], [-0.5, 1], [0.5, 1], [0.5, 0], [2, 0]], color: C.azul, ancho: 4 }],
      marcas: [{ x: -0.5, t: '−T/2' }, { x: 0.5, t: 'T/2' }],
      etiquetas: [{ x: -0.62, y: 1, t: 'A', color: C.amarillo, ancla: 'end' }]
    }),

    'sinc-f': (c) => plot(c, {
      x: [-5, 5], y: [-0.4, 1.3], titulo: 'S(f) = A·T·sinc(fT)',
      series: [{ f: sinc, color: C.naranja, ancho: 3.5, n: 700 }],
      marcas: [
        { x: -3, t: '−3/T' }, { x: -2, t: '−2/T' }, { x: -1, t: '−1/T' }, { x: 1, t: '1/T' }, { x: 2, t: '2/T' }, { x: 3, t: '3/T' }
      ],
      etiquetas: [{ x: 0.35, y: 1.16, t: 'A·T', color: C.amarillo, ancla: 'start' }]
    }),

    'sinc-t': (c) => plot(c, {
      x: [-5, 5], y: [-0.4, 1.3], titulo: 'S(t) = A·T·sinc(tT)',
      series: [{ f: sinc, color: C.naranja, ancho: 3.5, n: 700 }],
      marcas: [
        { x: -2, t: '−2/T' }, { x: -1, t: '−1/T' }, { x: 1, t: '1/T' }, { x: 2, t: '2/T' }
      ],
      etiquetas: [{ x: 0.35, y: 1.16, t: 'A·T', color: C.amarillo, ancla: 'start' }]
    }),

    'rect-f': (c) => plot(c, {
      x: [-2, 2], y: [-0.3, 1.45], titulo: 's(−f) = A · rect_T(f)',
      series: [{ pts: [[-2, 0], [-0.5, 0], [-0.5, 1], [0.5, 1], [0.5, 0], [2, 0]], color: C.azul, ancho: 4 }],
      marcas: [{ x: -0.5, t: '−T/2' }, { x: 0.5, t: 'T/2' }],
      etiquetas: [{ x: -0.62, y: 1, t: 'A', color: C.amarillo, ancla: 'end' }]
    }),

    'tri-copias': (c) => {
      const copia = (k, color, dash) => ({ pts: [[3 * k, 0], [3 * k + 1, 1], [3 * k + 2, 0]], color: color, ancho: 3.5, dash: dash });
      plot(c, {
        x: [-1, 9], y: [-0.3, 1.4], titulo: 'x(t) ∗ Σ δ(t − k·t₀)',
        series: [copia(0, C.azul), copia(1, C.naranja), copia(2, C.naranja)],
        marcas: [{ x: 0, t: '0' }, { x: 3, t: 't₀' }, { x: 6, t: '2t₀' }]
      });
    },

    'espectro-replicas': (c) => espectro(c, 'replicas', 3, 1),
    'espectro-filtro': (c) => espectro(c, 'filtro', 3, 1),
    'espectro-solape': (c) => espectro(c, 'solape', 1.6, 1),

    'sinc-ceros': (c) => {
      const puntos = [{ x: 0, y: 1, color: C.naranja, r: 7 }];
      const marcas = [];
      for (let k = -4; k <= 4; k++) {
        if (k !== 0) puntos.push({ x: k, y: 0, color: C.texto, r: 5 });
        marcas.push({ x: k, t: k === 0 ? '0' : (k === 1 ? 'Ts' : k === -1 ? '−Ts' : k + 'Ts') });
      }
      plot(c, {
        x: [-4.6, 4.6], y: [-0.4, 1.3], titulo: 'h(t) = sinc(t/Ts)',
        series: [{ f: sinc, color: C.azul, ancho: 3.5, n: 700 }],
        puntos: puntos, marcas: marcas
      });
    },

    'interp2': (c) => plot(c, {
      x: [-4.6, 4.6], y: [-0.5, 1.35], titulo: 'dos muestras: x(0) = 1 y x(Ts) = 0,6',
      series: [
        { f: sinc, color: C.azul, ancho: 2.5, opacidad: 0.8 },
        { f: (t) => 0.6 * sinc(t - 1), color: C.naranja, ancho: 2.5, dash: '9 6' },
        { f: (t) => sinc(t) + 0.6 * sinc(t - 1), color: C.amarillo, ancho: 4.5 }
      ],
      puntos: [{ x: 0, y: 1, color: C.texto, r: 7 }, { x: 1, y: 0.6, color: C.texto, r: 7 }],
      marcas: [{ x: -2, t: '−2Ts' }, { x: -1, t: '−Ts' }, { x: 0, t: '0' }, { x: 1, t: 'Ts' }, { x: 2, t: '2Ts' }, { x: 3, t: '3Ts' }]
    }),

    'alias-t': (c) => {
      const puntos = [];
      for (let n = 0; n <= 4; n++) puntos.push({ x: n / 4, y: Math.cos(Math.PI * n / 2), color: C.amarillo, r: 7 });
      plot(c, {
        x: [0, 1], y: [-1.5, 1.5], titulo: 'fs = 4 Hz: cos(2πt) y cos(2π·3t)',
        series: [
          { f: (t) => Math.cos(2 * Math.PI * t), color: C.azul, ancho: 3.5 },
          { f: (t) => Math.cos(2 * Math.PI * 3 * t), color: C.naranja, ancho: 3, dash: '10 6' }
        ],
        puntos: puntos, ejeY: false,
        marcas: [{ x: 0, t: '0' }, { x: 0.25, t: '1/4' }, { x: 0.5, t: '1/2' }, { x: 0.75, t: '3/4' }, { x: 1, t: '1' }]
      });
    },

    'ejemplo-perfecto': (c) => {
      const Ts = 0.25;
      const x = (t) => 3 * Math.cos(2 * Math.PI * t);
      const xr = reconstruir(x, Ts, 60);
      const puntos = [];
      for (let k = -4; k <= 8; k++) puntos.push({ x: k * Ts, y: x(k * Ts), color: C.amarillo, r: 6 });
      plot(c, {
        x: [-1, 2], y: [-4, 4], titulo: 'x(t) = 3cos(2πt), Ts = 1/4',
        series: [
          { f: x, color: C.azul, ancho: 4 },
          { f: xr, color: C.naranja, ancho: 2.5, dash: '9 6', n: 600 }
        ],
        puntos: puntos,
        marcas: [{ x: -1, t: '−1' }, { x: 0, t: '0' }, { x: 1, t: '1' }, { x: 2, t: '2' }]
      });
    },

    'ejemplo-alias': (c) => {
      const Ts = 1 / Math.sqrt(2);
      const x = (t) => 3 * Math.cos(2 * Math.PI * t);
      const xr = reconstruir(x, Ts, 90);
      const puntos = [];
      for (let k = -3; k <= 5; k++) puntos.push({ x: k * Ts, y: x(k * Ts), color: C.amarillo, r: 6 });
      plot(c, {
        x: [-1, 3], y: [-4, 4], titulo: 'Ts = 1/√2 (fs ≈ 1,41 Hz)',
        series: [
          { f: x, color: C.azul, ancho: 3.5 },
          { f: xr, color: C.naranja, ancho: 3, dash: '9 6', n: 700 }
        ],
        puntos: puntos,
        marcas: [{ x: -1, t: '−1' }, { x: 0, t: '0' }, { x: 1, t: '1' }, { x: 2, t: '2' }, { x: 3, t: '3' }]
      });
    }
  };

  window.dibujarGraficas = function () {
    document.querySelectorAll('.graf[data-g]').forEach((c) => {
      const f = G[c.dataset.g];
      if (f && !c.firstChild) f(c);
    });
  };
})();
