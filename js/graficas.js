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
    tam = tam || 17;
    if (t.indexOf('\\(') >= 0) {            // texto con LaTeX -> lo dibuja KaTeX
      const w = 240, a = ancla || 'middle';
      const x0 = a === 'start' ? x : a === 'end' ? x - w : x - w / 2;
      const fo = el('foreignObject', { x: x0, y: y - tam * 1.05, width: w, height: tam * 1.8 }, svg);
      const d = document.createElement('div');
      d.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      d.style.cssText = 'font-size:' + tam + 'px;line-height:1.3;white-space:nowrap;color:' + (color || C.texto) +
        ';text-align:' + (a === 'middle' ? 'center' : a === 'end' ? 'right' : 'left');
      d.textContent = t;
      fo.appendChild(d);
      return fo;
    }
    const e = el('text', {
      x: x, y: y, fill: color || C.texto, 'text-anchor': a2(ancla),
      'font-size': tam, 'font-family': 'Segoe UI, system-ui, Arial, sans-serif'
    }, svg);
    e.textContent = t;
    return e;
  }
  function a2(a) { return a || 'middle'; }

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


  let uid = 0;

  /* Leyenda en HTML debajo de la gráfica (para saber qué es cada línea) */
  function leyenda(cont, items) {
    const d = document.createElement('div');
    d.className = 'gleyenda';
    items.forEach((it) => {
      const s = document.createElement('span');
      s.className = 'gl';
      const sw = document.createElement('i');
      sw.className = 'sw ' + (it.tipo || 'linea');
      sw.style.setProperty('--c', it.c);
      if (it.o) sw.style.opacity = it.o;
      s.appendChild(sw);
      const t = document.createElement('span');
      t.textContent = it.t;
      s.appendChild(t);
      d.appendChild(s);
    });
    cont.appendChild(d);
  }

  /* Gráfica general */
  function plot(cont, cfg) {
    const W = cfg.w || 600, H = cfg.h || 290;
    const L = 34, R = 26, T = 18, B = 38;
    const [x0, x1] = cfg.x, [y0, y1] = cfg.y;
    const X = (x) => L + ((x - x0) / (x1 - x0)) * (W - L - R);
    const Y = (y) => T + ((y1 - y) / (y1 - y0)) * (H - T - B);
    const id = 'g' + (uid++);

    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'gráfica' }, cont);
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: id + 'f', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: C.eje }, mk);

    if (cfg.titulo) {
      const tt = document.createElement('div');
      tt.className = 'gtit';
      tt.textContent = cfg.titulo;
      cont.insertBefore(tt, svg);
    }

    // panel de fondo
    el('rect', { x: 1, y: 1, width: W - 2, height: H - 2, rx: 14, fill: '#20232b', stroke: '#343947', 'stroke-width': 1.5 }, svg);

    // rejilla suave
    (cfg.marcas || []).forEach((m) => {
      el('line', { x1: X(m.x), y1: Y(y1), x2: X(m.x), y2: Y(y0), stroke: '#2e3340', 'stroke-width': 1, 'stroke-dasharray': '3 6' }, svg);
    });
    (cfg.gridY || []).forEach((v) => {
      el('line', { x1: X(x0), y1: Y(v), x2: X(x1), y2: Y(v), stroke: '#2e3340', 'stroke-width': 1, 'stroke-dasharray': '3 6' }, svg);
    });

    // rectángulos (filtros, ventanas)
    (cfg.rects || []).forEach((r) => {
      el('rect', {
        x: X(r.x0), y: Y(r.y1), width: X(r.x1) - X(r.x0), height: Y(r.y0) - Y(r.y1),
        fill: r.color, 'fill-opacity': r.relleno || 0.1, stroke: r.color, 'stroke-width': 2.5,
        'stroke-dasharray': r.dash || '9 6', rx: 4
      }, svg);
    });

    // ejes con flecha
    el('line', { x1: X(x0) + 6, y1: Y(0), x2: X(x1) - 3, y2: Y(0), stroke: C.eje, 'stroke-width': 1.8, 'marker-end': 'url(#' + id + 'f)' }, svg);
    const hayY = cfg.ejeY !== false && x0 < 0 && x1 > 0;
    if (hayY) {
      el('line', { x1: X(0), y1: Y(y0), x2: X(0), y2: Y(y1) + 2, stroke: C.eje, 'stroke-width': 1.4, 'marker-end': 'url(#' + id + 'f)' }, svg);
    }
    if (cfg.xlab) texto(svg, X(x1) - 8, Y(0) - 12, cfg.xlab, C.gris, 'end', 19);
    if (cfg.ylab && hayY) texto(svg, X(0) + 12, Y(y1) + 18, cfg.ylab, C.gris, 'start', 19);

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
      if ((s.ancho || 3) >= 3.5 && !s.dash) {          // halo suave en las líneas principales
        el('path', { d: d, fill: 'none', stroke: s.color, 'stroke-width': (s.ancho || 3) + 7, 'stroke-opacity': 0.13, 'stroke-linejoin': 'round' }, svg);
      }
      el('path', {
        d: d, fill: 'none', stroke: s.color, 'stroke-width': s.ancho || 3,
        'stroke-dasharray': s.dash || 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        'stroke-opacity': s.opacidad || 1
      }, svg);
    });

    // impulsos (flechas)
    (cfg.flechas || []).forEach((p) => {
      const c = p.color || C.azul, o = p.o || 1, ya = Y(p.y), xa = X(p.x);
      el('line', { x1: xa, y1: Y(0), x2: xa, y2: ya + 8, stroke: c, 'stroke-width': 4, 'stroke-opacity': o }, svg);
      el('path', { d: 'M' + (xa - 8) + ',' + (ya + 13) + ' L' + xa + ',' + (ya - 2) + ' L' + (xa + 8) + ',' + (ya + 13) + ' Z', fill: c, 'fill-opacity': o }, svg);
    });

    // tallos (muestras)
    (cfg.tallos || []).forEach((p) => {
      el('line', { x1: X(p.x), y1: Y(0), x2: X(p.x), y2: Y(p.y), stroke: p.color || C.amarillo, 'stroke-width': 2, 'stroke-opacity': 0.7 }, svg);
    });

    // puntos (con aro)
    (cfg.puntos || []).forEach((p) => {
      const c = p.color || C.amarillo, r = p.r || 5.5;
      el('circle', { cx: X(p.x), cy: Y(p.y), r: r + 4, fill: c, 'fill-opacity': 0.22 }, svg);
      el('circle', { cx: X(p.x), cy: Y(p.y), r: r, fill: c, stroke: '#1b1d23', 'stroke-width': 1.5 }, svg);
    });

    // marcas en el eje
    (cfg.marcas || []).forEach((m) => {
      el('line', { x1: X(m.x), y1: Y(0) - 5, x2: X(m.x), y2: Y(0) + 5, stroke: C.eje, 'stroke-width': 1.8 }, svg);
      if (m.t) texto(svg, X(m.x), H - 10, m.t, C.gris, 'middle', cfg.marcaTam || 20);
    });

    // etiquetas libres (en coordenadas de datos)
    (cfg.etiquetas || []).forEach((e) => {
      texto(svg, X(e.x), Y(e.y), e.t, e.color || C.texto, e.ancla || 'middle', e.tam || 21);
    });

    if (cfg.leyenda) leyenda(cont, cfg.leyenda);
    return svg;
  }

  /* ---------- Espectros: réplicas, filtro, solape ---------- */
  function espectro(cont, modo, fs, B) {
    const xr = fs * 1.62;
    const series = [];
    if (modo === 'solape') {
      const cols = { '-1': C.verde, '0': C.azul, '1': C.rojo };
      [-1, 0, 1].forEach((k) => {
        series.push({ pts: [[k * fs - B, 0], [k * fs, 1], [k * fs + B, 0]], color: cols[k], ancho: 2.5, relleno: 0.28 });
      });
      series.push({ f: (f) => tri(f, -fs, B) + tri(f, 0, B) + tri(f, fs, B), color: C.amarillo, ancho: 3.5, n: 600 });
    } else {
      [-1, 0, 1].forEach((k) => {
        series.push({
          pts: [[k * fs - B, 0], [k * fs, 1], [k * fs + B, 0]],
          color: C.azul, ancho: 2.5, relleno: k === 0 ? 0.55 : 0.2, opacidad: k === 0 ? 1 : 0.6
        });
      });
    }
    const cfg = {
      x: [-xr, xr], y: [-0.18, 1.4], series: series, xlab: '\\(f\\)',
      marcas: [
        { x: 0, t: '0' }, { x: fs, t: '\\(f_s\\)' }, { x: -fs, t: '\\(-f_s\\)' }, { x: B, t: '\\(B\\)' }, { x: -B, t: '\\(-B\\)' }
      ],
      titulo: modo === 'replicas' ? '\\(X_m(f)=f_s\\sum_{k}X(f-kf_s)\\)'
        : modo === 'filtro' ? '\\(Y(f)=X_m(f)\\,H(f)\\)'
          : '\\(f_s\\lt2B\\): las réplicas se solapan'
    };
    if (modo === 'replicas') {
      cfg.leyenda = [
        { c: C.azul, tipo: 'caja', o: 0.9, t: 'espectro original \\(X(f)\\), ancho \\(2B\\)' },
        { c: C.azul, tipo: 'caja', o: 0.35, t: 'réplicas centradas en \\(\\pm f_s\\)' }
      ];
    }
    if (modo === 'filtro') {
      cfg.rects = [{ x0: -fs / 2, x1: fs / 2, y0: 0, y1: 1.25, color: C.naranja, relleno: 0.12 }];
      cfg.etiquetas = [{ x: fs / 2 + 0.06, y: 1.3, t: '\\(H(f)=T_s\\)', color: C.naranja, ancla: 'start' }];
      cfg.leyenda = [
        { c: C.azul, tipo: 'caja', o: 0.9, t: 'copia central: se conserva' },
        { c: C.azul, tipo: 'caja', o: 0.35, t: 'réplicas: se eliminan' },
        { c: C.naranja, tipo: 'dash', t: 'filtro ideal \\(H(f)\\), corta en \\(\\pm f_s/2\\)' }
      ];
    }
    if (modo === 'solape') {
      cfg.etiquetas = [{ x: 0, y: 1.26, t: 'se suman y se confunden', color: C.amarillo }];
      cfg.leyenda = [
        { c: C.verde, tipo: 'caja', t: 'réplica en \\(-f_s\\)' },
        { c: C.azul, tipo: 'caja', t: 'espectro original' },
        { c: C.rojo, tipo: 'caja', t: 'réplica en \\(+f_s\\)' },
        { c: C.amarillo, tipo: 'linea', t: 'suma: lo que recibe el filtro' }
      ];
    }
    plot(cont, cfg);
  }

  const Tsm = (n) => '\\(' + (n === 1 ? '' : n) + 'T_s\\)';

  /* ---------- Definición de cada gráfica ---------- */
  const G = {
    'espectro-replicas': (c) => espectro(c, 'replicas', 3, 1),
    'espectro-filtro': (c) => espectro(c, 'filtro', 3, 1),
    'espectro-solape': (c) => espectro(c, 'solape', 1.6, 1),

    'sinc-ceros': (c) => {
      const puntos = [{ x: 0, y: 1, color: C.naranja, r: 7 }];
      const marcas = [];
      for (let k = -4; k <= 4; k++) {
        if (k !== 0) puntos.push({ x: k, y: 0, color: C.texto, r: 5 });
        marcas.push({ x: k, t: k === 0 ? '0' : (k === -1 ? '\\(-T_s\\)' : k === 1 ? '\\(T_s\\)' : '\\(' + k + 'T_s\\)') });
      }
      plot(c, {
        x: [-4.6, 4.6], y: [-0.4, 1.35], titulo: '\\(h(t)=\\mathrm{sinc}(t/T_s)\\)', xlab: '\\(t\\)', marcaTam: 16,
        series: [{ f: sinc, color: C.azul, ancho: 3.5, n: 700, relleno: 0.12 }],
        puntos: puntos, marcas: marcas,
        leyenda: [
          { c: C.naranja, tipo: 'punto', t: 'vale 1 en \\(t=0\\)' },
          { c: C.texto, tipo: 'punto', t: 'vale 0 en \\(\\pm T_s,\\pm2T_s,\\dots\\)' }
        ]
      });
    },

    'interp2': (c) => plot(c, {
      x: [-4.6, 4.6], y: [-0.5, 1.4], titulo: 'dos muestras: \\(x(0)=1\\) y \\(x(T_s)=0{,}6\\)', xlab: '\\(t\\)', marcaTam: 17,
      series: [
        { f: sinc, color: C.azul, ancho: 2.5, opacidad: 0.9 },
        { f: (t) => 0.6 * sinc(t - 1), color: C.naranja, ancho: 2.5, dash: '9 6' },
        { f: (t) => sinc(t) + 0.6 * sinc(t - 1), color: C.amarillo, ancho: 4.5 }
      ],
      tallos: [{ x: 0, y: 1, color: C.texto }, { x: 1, y: 0.6, color: C.texto }],
      puntos: [{ x: 0, y: 1, color: C.texto, r: 7 }, { x: 1, y: 0.6, color: C.texto, r: 7 }],
      marcas: [{ x: -2, t: '\\(-2T_s\\)' }, { x: -1, t: '\\(-T_s\\)' }, { x: 0, t: '0' }, { x: 1, t: '\\(T_s\\)' }, { x: 2, t: '\\(2T_s\\)' }, { x: 3, t: '\\(3T_s\\)' }],
      leyenda: [
        { c: C.azul, t: 'sinc de la muestra \\(x(0)=1\\)' },
        { c: C.naranja, tipo: 'dash', t: 'sinc de la muestra \\(x(T_s)=0{,}6\\)' },
        { c: C.amarillo, t: 'suma: \\(x_r(t)\\)' },
        { c: C.texto, tipo: 'punto', t: 'muestras' }
      ]
    }),

    'alias-t': (c) => {
      const puntos = [];
      for (let n = 0; n <= 4; n++) puntos.push({ x: n / 4, y: Math.cos(Math.PI * n / 2), color: C.amarillo, r: 7 });
      plot(c, {
        x: [0, 1], y: [-1.5, 1.5], titulo: '\\(f_s=4\\) Hz: dos señales, mismas muestras', xlab: '\\(t\\)', ejeY: false, marcaTam: 17,
        series: [
          { f: (t) => Math.cos(2 * Math.PI * t), color: C.azul, ancho: 3.5 },
          { f: (t) => Math.cos(2 * Math.PI * 3 * t), color: C.naranja, ancho: 3, dash: '10 6' }
        ],
        puntos: puntos,
        marcas: [{ x: 0, t: '0' }, { x: 0.25, t: '1/4' }, { x: 0.5, t: '1/2' }, { x: 0.75, t: '3/4' }, { x: 1, t: '1' }],
        leyenda: [
          { c: C.azul, t: '\\(\\cos(2\\pi t)\\), 1 Hz' },
          { c: C.naranja, tipo: 'dash', t: '\\(\\cos(2\\pi\\cdot3t)\\), 3 Hz' },
          { c: C.amarillo, tipo: 'punto', t: 'muestras (las mismas)' }
        ]
      });
    },

    'ejemplo-perfecto': (c) => {
      const Ts = 0.25;
      const x = (t) => 3 * Math.cos(2 * Math.PI * t);
      const xr = reconstruir(x, Ts, 60);
      const puntos = [];
      for (let k = -4; k <= 8; k++) puntos.push({ x: k * Ts, y: x(k * Ts), color: C.amarillo, r: 6 });
      plot(c, {
        x: [-1, 2], y: [-4, 4], titulo: '\\(x(t)=3\\cos(2\\pi t),\\ T_s=\\tfrac14\\)', xlab: '\\(t\\)', ylab: '\\(x\\)',
        series: [
          { f: x, color: C.azul, ancho: 4 },
          { f: xr, color: C.naranja, ancho: 2.5, dash: '9 6', n: 600 }
        ],
        puntos: puntos, tallos: puntos,
        marcas: [{ x: -1, t: '−1' }, { x: 0, t: '0' }, { x: 1, t: '1' }, { x: 2, t: '2' }],
        leyenda: [
          { c: C.azul, t: 'señal original \\(x(t)\\)' },
          { c: C.naranja, tipo: 'dash', t: 'reconstruida \\(x_r(t)\\)' },
          { c: C.amarillo, tipo: 'punto', t: 'muestras' }
        ]
      });
    },

    'ejemplo-alias': (c) => {
      const Ts = 1 / Math.sqrt(2);
      const x = (t) => 3 * Math.cos(2 * Math.PI * t);
      const xr = reconstruir(x, Ts, 90);
      const puntos = [];
      for (let k = -3; k <= 5; k++) puntos.push({ x: k * Ts, y: x(k * Ts), color: C.amarillo, r: 6 });
      plot(c, {
        x: [-1, 3], y: [-4, 4], titulo: '\\(T_s=\\tfrac{1}{\\sqrt2},\\ f_s\\approx1{,}41\\text{ Hz}\\)', xlab: '\\(t\\)',
        series: [
          { f: x, color: C.azul, ancho: 3.5 },
          { f: xr, color: C.naranja, ancho: 3, dash: '9 6', n: 700 }
        ],
        puntos: puntos, tallos: puntos,
        marcas: [{ x: -1, t: '−1' }, { x: 0, t: '0' }, { x: 1, t: '1' }, { x: 2, t: '2' }, { x: 3, t: '3' }],
        leyenda: [
          { c: C.azul, t: 'original, 1 Hz' },
          { c: C.naranja, tipo: 'dash', t: 'reconstruida, 0,414 Hz' },
          { c: C.amarillo, tipo: 'punto', t: 'muestras' }
        ]
      });
    },

    /* Error por truncamiento: solo 5 muestras */
    'truncar': (c) => {
      const Ts = 0.25;
      const x = (t) => 3 * Math.cos(2 * Math.PI * t);
      const xr = reconstruir(x, Ts, 2);
      const puntos = [];
      for (let k = -2; k <= 2; k++) puntos.push({ x: k * Ts, y: x(k * Ts), color: C.amarillo, r: 6.5 });
      plot(c, {
        x: [-1.5, 1.5], y: [-4, 4], titulo: '\\(x_r(t)\\) con solo 5 muestras', xlab: '\\(t\\)',
        rects: [{ x0: -0.5, x1: 0.5, y0: -4, y1: 4, color: C.verde, relleno: 0.06, dash: '4 7' }],
        series: [
          { f: x, color: C.azul, ancho: 3.5 },
          { f: xr, color: C.naranja, ancho: 3, dash: '9 6', n: 600 },
          { f: (t) => x(t) - xr(t), color: C.rojo, ancho: 2.2, n: 600 }
        ],
        puntos: puntos, tallos: puntos,
        marcas: [{ x: -1, t: '−1' }, { x: -0.5, t: '−1/2' }, { x: 0, t: '0' }, { x: 0.5, t: '1/2' }, { x: 1, t: '1' }],
        leyenda: [
          { c: C.azul, t: 'señal \\(x(t)\\)' },
          { c: C.naranja, tipo: 'dash', t: 'reconstruida \\(x_r(t)\\)' },
          { c: C.rojo, t: 'error \\(e(t)\\)' },
          { c: C.amarillo, tipo: 'punto', t: 'las 5 muestras usadas' }
        ]
      });
    },

    /* Interpolación lineal (une las muestras con rectas) */
    'lineal': (c) => {
      const Ts = 0.25;
      const x = (t) => 3 * Math.cos(2 * Math.PI * t);
      const pts = [], puntos = [];
      for (let k = 0; k <= 4; k++) { pts.push([k * Ts, x(k * Ts)]); puntos.push({ x: k * Ts, y: x(k * Ts), color: C.amarillo, r: 6.5 }); }
      plot(c, {
        x: [-0.1, 1.1], y: [-4, 4], titulo: 'interpolación lineal, \\(T_s=\\tfrac14\\)', xlab: '\\(t\\)', ejeY: false,
        series: [
          { f: x, color: C.azul, ancho: 3.5 },
          { pts: pts, color: C.verde, ancho: 3 }
        ],
        puntos: puntos,
        marcas: [{ x: 0, t: '0' }, { x: 0.25, t: '1/4' }, { x: 0.5, t: '1/2' }, { x: 0.75, t: '3/4' }, { x: 1, t: '1' }],
        leyenda: [
          { c: C.azul, t: 'señal \\(x(t)\\)' },
          { c: C.verde, t: 'une las muestras con rectas' },
          { c: C.amarillo, tipo: 'punto', t: 'muestras' }
        ]
      });
    },

    /* Filtro de la interpolación lineal: sinc^2 frente al ideal */
    'sinc2-f': (c) => plot(c, {
      x: [-1.6, 1.6], y: [-0.15, 1.3], titulo: 'filtro de la interpolación lineal', xlab: '\\(f\\)', marcaTam: 18,
      rects: [],
      series: [
        { pts: [[-1.6, 0], [-0.5, 0], [-0.5, 1], [0.5, 1], [0.5, 0], [1.6, 0]], color: C.naranja, ancho: 3, dash: '9 6', relleno: 0.1 },
        { f: (f) => sinc(f) * sinc(f), color: C.azul, ancho: 3.8, n: 600, relleno: 0.18 }
      ],
      puntos: [{ x: 0.5, y: 0.405, color: C.amarillo, r: 6 }],
      etiquetas: [{ x: 0.58, y: 0.52, t: '\\(0{,}4\\) en \\(f_s/2\\)', color: C.amarillo, ancla: 'start', tam: 19 }],
      marcas: [{ x: -1, t: '\\(-f_s\\)' }, { x: -0.5, t: '\\(-f_s/2\\)' }, { x: 0.5, t: '\\(f_s/2\\)' }, { x: 1, t: '\\(f_s\\)' }],
      leyenda: [
        { c: C.naranja, tipo: 'dash', t: 'filtro ideal' },
        { c: C.azul, t: '\\(T_s\\,\\mathrm{sinc}^2(fT_s)\\) (en unidades de \\(T_s\\))' }
      ]
    }),

    /* Ejercicio: x(t)=4cos(pi t), fs = 2 Hz */
    'ejercicio-esp': (c) => {
      const fl = [], mar = [];
      [-0.5, 0.5].forEach((f) => fl.push({ x: f, y: 1, color: C.azul }));
      [-2.5, -1.5, 1.5, 2.5].forEach((f) => fl.push({ x: f, y: 1, color: C.azul, o: 0.4 }));
      [-2.5, -1.5, -1, -0.5, 0.5, 1, 1.5, 2.5].forEach((f) => mar.push({ x: f, t: String(f).replace('.', ',').replace('-', '−') }));
      plot(c, {
        x: [-3.2, 3.2], y: [-0.18, 1.5], titulo: 'espectro muestreado, \\(f_s=2\\) Hz', xlab: '\\(f\\) (Hz)', marcaTam: 16,
        rects: [{ x0: -1, x1: 1, y0: 0, y1: 1.3, color: C.naranja, relleno: 0.12 }],
        flechas: fl, marcas: mar,
        etiquetas: [{ x: 1.08, y: 1.38, t: '\\(H(f)=\\tfrac12\\)', color: C.naranja, ancla: 'start', tam: 19 }],
        leyenda: [
          { c: C.azul, tipo: 'caja', o: 0.9, t: 'espectro de \\(x(t)\\): impulsos en \\(\\pm0{,}5\\) Hz' },
          { c: C.azul, tipo: 'caja', o: 0.4, t: 'réplicas cada \\(f_s=2\\) Hz' },
          { c: C.naranja, tipo: 'dash', t: 'filtro ideal \\(H(f)\\)' }
        ]
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
