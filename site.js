/* ============================================================================
   site.js — everything every page shares.

   Five layers, in dependency order:
     A.math   numerics and easings
     A.phys   the physics itself: eigenvalues, normal modes, reflection
              coefficients, Fourier coefficients, diffraction. Pure functions,
              checked in Node by verify-site.mjs before any page is trusted.
     A.svg    SVG and canvas construction helpers for the demos
     A.ui     sliders, buttons and readouts, styled by styles.css
     runtime  theme, reveal, the table of contents, and one rAF loop that
              hands every visible demo a 0 -> 1 scroll progress value

   The file is written so it can also be evaluated in Node with a stub window,
   which is how the physics gets unit-tested away from the browser.
   ========================================================================= */
(function (A) {
  'use strict';

  var hasDOM = typeof document !== 'undefined';

  /* ==================================================================== math */

  var M = A.math = {};

  M.TAU = Math.PI * 2;
  M.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  M.lerp = function (a, b, t) { return a + (b - a) * t; };
  M.inv = function (v, a, b) { return b === a ? 0 : (v - a) / (b - a); };
  M.map = function (v, a, b, c, d) { return M.lerp(c, d, M.clamp(M.inv(v, a, b), 0, 1)); };

  /* Carve a sub-range out of a 0..1 progress value, so one scene can stage
     several beats in sequence. */
  M.beat = function (p, a, b) { return M.clamp((p - a) / (b - a), 0, 1); };

  M.easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  M.easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  M.easeIn = function (t) { return t * t * t; };
  M.smooth = function (t) { return t * t * (3 - 2 * t); };

  /* Deterministic PRNG (mulberry32): the same scroll position draws the same
     frame, which is what makes the screenshots in the harness comparable. */
  M.rng = function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  M.sinc = function (x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; };
  M.hypot = function (a, b) { return Math.sqrt(a * a + b * b); };

  /* Simpson's rule. Every integral on this site is evaluated with it rather
     than quoted, so a demo and the prose can never disagree. */
  M.integrate = function (f, a, b, n) {
    n = n || 2000;
    if (n % 2) n++;
    var h = (b - a) / n, s = f(a) + f(b), i;
    for (i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  };

  M.C = {
    h: 6.62607015e-34, hbar: 1.054571817e-34, c: 2.99792458e8,
    kB: 1.380649e-23, e: 1.602176634e-19, me: 9.1093837015e-31, g: 9.80665
  };

  /* Approximate visible-spectrum colour for a wavelength in nm, so the
     double-slit demo is drawn in the colour of the light it models. */
  M.wavelengthRGB = function (nm) {
    var r = 0, g = 0, b = 0, a = 1;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    else { return 'rgba(120,134,143,0.35)'; }
    if (nm < 420) a = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700) a = 0.3 + 0.7 * (780 - nm) / 80;
    var f = function (c) { return Math.round(255 * Math.pow(Math.max(0, Math.min(1, c)) * a, 0.8)); };
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  };

  /* ==================================================================== phys */
  /* Nothing here is a fitted curve or a traced illustration: every demo drives
     its picture from these functions, and verify-site.mjs checks them against
     the closed-form answers the pages derive. */

  var P = A.phys = {};

  /* Eigenvalues and eigenvectors of [[a,b],[c,d]], real case.
     lambda^2 - (a+d) lambda + (ad - bc) = 0, then back-substitute. */
  P.eig2 = function (a, b, c, d) {
    var tr = a + d, det = a * d - b * c;
    var disc = tr * tr - 4 * det;
    if (disc < -1e-12) return { real: false, lambda: [], vec: [], trace: tr, det: det, disc: disc };
    var s = Math.sqrt(Math.max(0, disc));
    var l1 = (tr + s) / 2, l2 = (tr - s) / 2;
    var vecFor = function (l) {
      /* (A - lambda I) v = 0. Rows are proportional, so take whichever row is
         the better conditioned and read the null direction straight off it. */
      var r1 = [a - l, b], r2 = [c, d - l];
      var r = (Math.abs(r1[0]) + Math.abs(r1[1]) >= Math.abs(r2[0]) + Math.abs(r2[1])) ? r1 : r2;
      var v = (Math.abs(r[0]) + Math.abs(r[1]) < 1e-12) ? [1, 0] : [-r[1], r[0]];
      var n = M.hypot(v[0], v[1]);
      if (n < 1e-12) return [1, 0];
      if (v[0] < -1e-12 || (Math.abs(v[0]) < 1e-12 && v[1] < 0)) { v = [-v[0], -v[1]]; }
      return [v[0] / n, v[1] / n];
    };
    return { real: true, lambda: [l1, l2], vec: [vecFor(l1), vecFor(l2)], trace: tr, det: det, disc: disc };
  };

  P.matVec = function (a, b, c, d, v) { return [a * v[0] + b * v[1], c * v[0] + d * v[1]]; };
  P.det2 = function (a, b, c, d) { return a * d - b * c; };

  /* Two masses, three springs: outer springs k, coupling spring kappa.
     K = [[k+kappa, -kappa], [-kappa, k+kappa]] and M = m I, so the normal-mode
     condition (K - omega^2 M) a = 0 is the eigenvalue problem for K/m. */
  P.coupledModes = function (m, k, kappa) {
    var e = P.eig2((k + kappa) / m, -kappa / m, -kappa / m, (k + kappa) / m);
    /* The in-phase mode (1,1) is the softer one: the coupling spring never
       stretches, so only the wall springs act. Report it first. */
    var w1sq = k / m, w2sq = (k + 2 * kappa) / m;
    return {
      omega: [Math.sqrt(Math.max(0, w1sq)), Math.sqrt(Math.max(0, w2sq))],
      omegaSq: [w1sq, w2sq],
      modes: [[1, 1], [1, -1]],
      eig: e,
      beatPeriod: Math.abs(Math.sqrt(w2sq) - Math.sqrt(w1sq)) < 1e-12
        ? Infinity : M.TAU / Math.abs(Math.sqrt(w2sq) - Math.sqrt(w1sq))
    };
  };

  /* Closed-form motion of the two masses. Normal coordinates q1 = (x1+x2)/2 and
     q2 = (x1-x2)/2 each obey a simple-harmonic equation, so each is solved on
     its own and the two are added back. */
  P.coupledState = function (t, ic, prm) {
    var md = P.coupledModes(prm.m, prm.k, prm.kappa);
    var w1 = md.omega[0], w2 = md.omega[1];
    var q1 = (ic.x1 + ic.x2) / 2, q2 = (ic.x1 - ic.x2) / 2;
    var p1 = ((ic.v1 || 0) + (ic.v2 || 0)) / 2, p2 = ((ic.v1 || 0) - (ic.v2 || 0)) / 2;
    var Q1 = q1 * Math.cos(w1 * t) + (w1 > 1e-12 ? p1 / w1 : p1 * t) * Math.sin(w1 * t);
    var Q2 = q2 * Math.cos(w2 * t) + (w2 > 1e-12 ? p2 / w2 : p2 * t) * Math.sin(w2 * t);
    var V1 = -q1 * w1 * Math.sin(w1 * t) + p1 * Math.cos(w1 * t);
    var V2 = -q2 * w2 * Math.sin(w2 * t) + p2 * Math.cos(w2 * t);
    return { x1: Q1 + Q2, x2: Q1 - Q2, v1: V1 + V2, v2: V1 - V2, q1: Q1, q2: Q2, omega: md.omega };
  };

  /* A wave on a string meeting a second string at x = 0. Same tension both
     sides; the speed changes because the mass per unit length does. */
  P.stringRT = function (mu1, mu2, tension) {
    var T = tension == null ? 1 : tension;
    var v1 = Math.sqrt(T / mu1), v2 = Math.sqrt(T / mu2);
    var Z1 = Math.sqrt(T * mu1), Z2 = Math.sqrt(T * mu2);
    var R = (Z1 - Z2) / (Z1 + Z2);
    var Tr = 2 * Z1 / (Z1 + Z2);
    return { v1: v1, v2: v2, Z1: Z1, Z2: Z2, R: R, T: Tr,
             powerR: R * R, powerT: (Z2 / Z1) * Tr * Tr };
  };

  /* Fourier coefficients of a periodic f over one period, by integration.
     a0 is the mean; an and bn are the projections onto cos and sin. */
  P.fourierCoeffs = function (f, N, period) {
    var T = period == null ? M.TAU : period;
    var w0 = M.TAU / T;
    var a = [M.integrate(f, 0, T, 4000) / T], b = [0], n;
    for (n = 1; n <= N; n++) {
      (function (n) {
        a.push(2 / T * M.integrate(function (t) { return f(t) * Math.cos(n * w0 * t); }, 0, T, 4000));
        b.push(2 / T * M.integrate(function (t) { return f(t) * Math.sin(n * w0 * t); }, 0, T, 4000));
      })(n);
    }
    return { a: a, b: b };
  };

  /* A pulse train of unit height, "on" for `duty` of each period, centred on
     t = 0, plus an optional constant offset. Closed form, derived on page 1.4:
       a0 = duty + offset,  an = (2/(n pi)) sin(n pi duty),  bn = 0. */
  P.pulseTrain = function (t, duty, offset, period) {
    var T = period == null ? M.TAU : period;
    var u = ((t / T) % 1 + 1) % 1;
    if (u > 0.5) u -= 1;
    return (Math.abs(u) < duty / 2 ? 1 : 0) + (offset || 0);
  };
  P.pulseCoeff = function (n, duty, offset) {
    if (n === 0) return duty + (offset || 0);
    return 2 / (n * Math.PI) * Math.sin(n * Math.PI * duty);
  };
  /* The odd square wave of amplitude 1: b_n = 4/(n pi) for odd n, zero for even. */
  P.squareWave = function (t, period) {
    var T = period == null ? M.TAU : period;
    var u = ((t / T) % 1 + 1) % 1;
    return u < 0.5 ? 1 : -1;
  };
  P.squareCoeff = function (n) { return (n % 2) ? 4 / (n * Math.PI) : 0; };

  /* Transform of exp(-x^2 / 2 sigma^2): sigma sqrt(2 pi) exp(-sigma^2 k^2 / 2).
     The widths are the standard deviations of |f|^2 and |F|^2, whose product
     is exactly one half. */
  P.gaussian = function (x, sigma) { return Math.exp(-x * x / (2 * sigma * sigma)); };
  P.gaussianFT = function (k, sigma) {
    return sigma * Math.sqrt(M.TAU) * Math.exp(-sigma * sigma * k * k / 2);
  };
  P.gaussianWidths = function (sigma) {
    return { dx: sigma / Math.SQRT2, dk: 1 / (sigma * Math.SQRT2), product: 0.5 };
  };

  /* Diffraction and interference. sinT is sin(theta). */
  P.singleSlit = function (sinT, aOverLambda) {
    return Math.pow(M.sinc(Math.PI * aOverLambda * sinT), 2);
  };
  P.doubleSlit = function (sinT, aOverLambda, dOverLambda) {
    return P.singleSlit(sinT, aOverLambda) * Math.pow(Math.cos(Math.PI * dOverLambda * sinT), 2);
  };
  P.fringeSpacing = function (lambda, L, d) { return lambda * L / d; };

  /* A wave packet built by adding plane waves with a Gaussian spectrum,
     each carried at its own frequency by the dispersion relation. */
  P.packet = function (x, t, k0, dk, omegaOfK, n) {
    n = n || 121;
    var re = 0, im = 0, i, k, w, ph, amp, norm = 0;
    for (i = 0; i < n; i++) {
      k = k0 + (i / (n - 1) - 0.5) * 8 * dk;
      amp = Math.exp(-Math.pow((k - k0) / dk, 2) / 2);
      w = omegaOfK(k);
      ph = k * x - w * t;
      re += amp * Math.cos(ph); im += amp * Math.sin(ph); norm += amp;
    }
    return { re: re / norm, im: im / norm, env: M.hypot(re, im) / norm };
  };
  /* Group velocity as the slope of the dispersion relation, by central
     difference — the same number the Taylor expansion on page 2.6 produces. */
  P.groupVelocity = function (omegaOfK, k0, h) {
    h = h || 1e-5;
    return (omegaOfK(k0 + h) - omegaOfK(k0 - h)) / (2 * h);
  };
  P.phaseVelocity = function (omegaOfK, k0) { return omegaOfK(k0) / k0; };

  /* Standing waves on a string of length L. */
  P.standing = function (n, L, v, freeEnd) {
    var lambda = freeEnd ? 4 * L / (2 * n - 1) : 2 * L / n;
    return { lambda: lambda, f: v / lambda, k: M.TAU / lambda, omega: M.TAU * v / lambda };
  };

  /* Simple harmonic motion from initial conditions, in all three forms. */
  P.sho = function (x0, v0, omega) {
    var C1 = x0, C2 = omega === 0 ? 0 : v0 / omega;
    var Amp = M.hypot(C1, C2);
    var phi = Math.atan2(-C2, C1);
    return { C1: C1, C2: C2, A: Amp, phi: phi,
             x: function (t) { return C1 * Math.cos(omega * t) + C2 * Math.sin(omega * t); },
             v: function (t) { return omega * (-C1 * Math.sin(omega * t) + C2 * Math.cos(omega * t)); } };
  };

  /* ===================================================================== svg */
  /* Scenes build real SVG nodes rather than markup strings, so every element
     stays addressable and there is no escaping hazard. */

  var NS = 'http://www.w3.org/2000/svg';
  var S = A.svg = {};

  S.el = function (tag, attrs, kids) {
    var n = document.createElementNS(NS, tag), k;
    if (attrs) for (k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (kids) for (var i = 0; i < kids.length; i++) if (kids[i]) n.appendChild(kids[i]);
    return n;
  };
  S.root = function (w, h, label) {
    var s = S.el('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': label || ''
    });
    s.dataset.w = w; s.dataset.h = h;
    return s;
  };
  S.g = function (attrs, kids) { return S.el('g', attrs, kids); };
  S.text = function (x, y, str, cls, anchor) {
    var t = S.el('text', { x: x, y: y, class: cls || 's-lbl', 'text-anchor': anchor || 'start' });
    t.textContent = str;
    return t;
  };
  S.line = function (x1, y1, x2, y2, cls) {
    return S.el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: cls || 's-axis' });
  };
  S.path = function (d, cls) { return S.el('path', { d: d, class: cls || 's-wave' }); };
  S.circle = function (cx, cy, r, cls) {
    return S.el('circle', { cx: cx, cy: cy, r: r, class: cls || 's-fill-w' });
  };
  S.rect = function (x, y, w, h, cls) {
    return S.el('rect', { x: x, y: y, width: Math.max(0, w), height: Math.max(0, h), class: cls });
  };
  S.polyD = function (pts) {
    if (!pts.length) return '';
    var d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (var i = 1; i < pts.length; i++) d += 'L' + pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2);
    return d;
  };
  S.poly = function (pts, cls) { return S.path(S.polyD(pts), cls); };
  /* A coil spring between two points, as a zig-zag. Every picture of a mass on
     a spring on this site draws one, so it lives here rather than being
     rewritten wherever a spring is needed. */
  S.springD = function (xa, xb, y, coils, amp) {
    var pts = [[xa, y]], n = coils * 2, i;
    for (i = 1; i < n; i++) pts.push([xa + (xb - xa) * i / n, y + (i % 2 ? -amp : amp)]);
    pts.push([xb, y]);
    return S.polyD(pts);
  };
  S.areaD = function (pts, baseY) {
    if (!pts.length) return '';
    return S.polyD(pts) + 'L' + pts[pts.length - 1][0].toFixed(2) + ' ' + baseY +
           'L' + pts[0][0].toFixed(2) + ' ' + baseY + 'Z';
  };
  S.sample = function (n, x0, x1, fn) {
    var pts = [], i, t, x;
    for (i = 0; i <= n; i++) { t = i / n; x = x0 + (x1 - x0) * t; pts.push(fn(x, t)); }
    return pts;
  };
  S.setD = function (el, d) { el.setAttribute('d', d); };
  /* Reveal a path by running its dash offset from a 0..1 progress value. */
  S.draw = function (pathEl, p) {
    var len = pathEl.getTotalLength ? pathEl.getTotalLength() : 0;
    if (!len) return;
    pathEl.style.strokeDasharray = len;
    pathEl.style.strokeDashoffset = len * (1 - M.clamp(p, 0, 1));
  };
  S.op = function (node, v) { node.style.opacity = M.clamp(v, 0, 1); };
  S.attr = function (el, k, v) { el.setAttribute(k, v); return el; };

  var markerSeq = 0;
  S.defsArrows = function (svg) {
    var uid = 'ar' + (++markerSeq) + '-' + Math.random().toString(36).slice(2, 6);
    var defs = S.el('defs');
    [['w', 'var(--wave)'], ['q', 'var(--quantum)'], ['f', 'var(--fail)'],
     ['i', 'var(--ink-bright)'], ['m', 'var(--muted)'], ['p', 'var(--probability)']
    ].forEach(function (pair) {
      defs.appendChild(S.el('marker', {
        id: uid + '-' + pair[0], viewBox: '0 0 10 10', refX: '9', refY: '5',
        markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'
      }, [S.el('path', { d: 'M0 0L10 5L0 10Z', fill: pair[1] })]));
    });
    svg.appendChild(defs);
    svg.dataset.arrows = uid;
    return uid;
  };
  S.arrow = function (svg, x1, y1, x2, y2, tone, cls) {
    var uid = svg.dataset.arrows || S.defsArrows(svg);
    var name = { w: 'wave', q: 'quantum', f: 'fail', i: 'axis', m: 'ghost', p: 'prob' }[tone] || 'axis';
    return S.el('line', {
      x1: x1, y1: y1, x2: x2, y2: y2,
      class: cls || ('s-' + name),
      'marker-end': 'url(#' + uid + '-' + tone + ')'
    });
  };
  S.setArrow = function (el, x1, y1, x2, y2) {
    el.setAttribute('x1', x1.toFixed(2)); el.setAttribute('y1', y1.toFixed(2));
    el.setAttribute('x2', x2.toFixed(2)); el.setAttribute('y2', y2.toFixed(2));
    return el;
  };
  S.axes = function (x0, y0, x1, y1, xLabel, yLabel) {
    var g = S.g({});
    g.appendChild(S.line(x0, y1, x1, y1, 's-axis'));
    g.appendChild(S.line(x0, y0, x0, y1, 's-axis'));
    if (xLabel) g.appendChild(S.text(x1, y1 + 20, xLabel, 's-lbl', 'end'));
    if (yLabel) g.appendChild(S.text(x0 - 6, y0 + 4, yLabel, 's-lbl', 'end'));
    return g;
  };
  S.gridLines = function (x0, y0, x1, y1, nx, ny) {
    var g = S.g({}), i, x, y;
    for (i = 1; i < nx; i++) { x = x0 + (x1 - x0) * i / nx; g.appendChild(S.line(x, y0, x, y1, 's-grid')); }
    for (i = 1; i < ny; i++) { y = y0 + (y1 - y0) * i / ny; g.appendChild(S.line(x0, y, x1, y, 's-grid')); }
    return g;
  };
  S.fitCanvas = function (cv, maxDpr) {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  };
  S.cssVar = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };
  /* Pointer position in viewBox coordinates, for the draggable demos. */
  S.pointerIn = function (svg, ev) {
    var r = svg.getBoundingClientRect();
    var W = Number(svg.dataset.w), H = Number(svg.dataset.h);
    return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H];
  };

  /* ============================================================ the contents */
  /* One list drives the sidebar, the pager, the reading-order table and the
     dependency map, so they can never disagree with each other. */

  A.toc = {
    parts: [
      { n: 0, title: 'How to use this site' },
      { n: 1, title: 'Part 1 — Mathematics' },
      { n: 2, title: 'Part 2 — Physics' },
      { n: 3, title: 'Part 3 — Reference' }
    ],
    pages: [
      { id: 'index', part: 0, num: '', title: 'Contents and reading order', file: 'index.html', minutes: 5, feeds: [] },
      { id: '1-1', part: 1, num: '1.1', title: 'Complex numbers and Euler’s formula',
        file: 'sections/1-1-complex.html', minutes: 25, feeds: ['2-1', '2-7', '2-8'] },
      { id: '1-2', part: 1, num: '1.2', title: 'Second-order linear differential equations',
        file: 'sections/1-2-odes.html', minutes: 30, feeds: ['2-1', '2-2'] },
      { id: '1-3', part: 1, num: '1.3', title: 'Linear algebra, from the beginning',
        file: 'sections/1-3-linear-algebra.html', minutes: 75, feeds: ['1-4', '2-2'] },
      { id: '1-4', part: 1, num: '1.4', title: 'Fourier series and Fourier transforms',
        file: 'sections/1-4-fourier.html', minutes: 45, feeds: ['2-6', '2-8'] },
      { id: '2-1', part: 2, num: '2.1', title: 'The simple harmonic oscillator',
        file: 'sections/2-1-sho.html', minutes: 30, feeds: ['2-2'] },
      { id: '2-2', part: 2, num: '2.2', title: 'Coupled oscillators and normal modes',
        file: 'sections/2-2-coupled.html', minutes: 50, feeds: [] },
      { id: '2-3', part: 2, num: '2.3', title: 'Travelling waves and plane waves',
        file: 'sections/2-3-traveling-waves.html', minutes: 25, feeds: ['2-4', '2-5', '2-6'] },
      { id: '2-4', part: 2, num: '2.4', title: 'Waves on strings: reflection and transmission',
        file: 'sections/2-4-strings.html', minutes: 40, feeds: ['2-5'] },
      { id: '2-5', part: 2, num: '2.5', title: 'Standing waves',
        file: 'sections/2-5-standing-waves.html', minutes: 25, feeds: [] },
      { id: '2-6', part: 2, num: '2.6', title: 'Wave packets, phase and group velocity',
        file: 'sections/2-6-wave-packets.html', minutes: 40, feeds: [] },
      { id: '2-7', part: 2, num: '2.7', title: 'Double-slit interference',
        file: 'sections/2-7-double-slit.html', minutes: 30, feeds: ['2-8'] },
      { id: '2-8', part: 2, num: '2.8', title: 'Single-slit diffraction',
        file: 'sections/2-8-single-slit.html', minutes: 30, feeds: [] },
      { id: 'ref', part: 3, num: '3', title: 'Quick reference and glossary',
        file: 'sections/3-reference.html', minutes: 10, feeds: [] }
    ]
  };
  A.toc.byId = function (id) {
    for (var i = 0; i < A.toc.pages.length; i++) if (A.toc.pages[i].id === id) return A.toc.pages[i];
    return null;
  };
  A.toc.neighbours = function (id) {
    var i = A.toc.pages.map(function (p) { return p.id; }).indexOf(id);
    return { prev: i > 0 ? A.toc.pages[i - 1] : null,
             next: (i >= 0 && i < A.toc.pages.length - 1) ? A.toc.pages[i + 1] : null };
  };

  /* ====================================================================== ui */
  /* Controls a demo can build for itself. Each returns an object with get/set
     so the demo and the verification harness drive the same handles. */

  var U = A.ui = {};
  var uidSeq = 0;
  function uid(p) { return (p || 'c') + '-' + (++uidSeq) + Math.random().toString(36).slice(2, 6); }

  U.slider = function (host, opt) {
    var wrap = document.createElement('div');
    wrap.className = 'control';
    var id = uid('sl');
    var fmt = opt.fmt || function (v) { return v.toFixed(2); };
    wrap.innerHTML = '<label for="' + id + '"></label>' +
                     '<input id="' + id + '" type="range">' +
                     '<output></output>';
    var lab = wrap.querySelector('label'), inp = wrap.querySelector('input'), out = wrap.querySelector('output');
    lab.textContent = opt.label;
    inp.min = opt.min; inp.max = opt.max;
    inp.step = opt.step == null ? (opt.max - opt.min) / 200 : opt.step;
    inp.value = opt.value;
    inp.setAttribute('aria-label', opt.label);
    if (opt.name) inp.dataset.name = opt.name;
    var api = {
      el: inp, wrap: wrap, touched: false,
      get: function () { return Number(inp.value); },
      set: function (v, quiet) {
        inp.value = String(v);
        out.textContent = fmt(Number(inp.value));
        if (!quiet && opt.onInput) opt.onInput(Number(inp.value));
      }
    };
    inp.addEventListener('input', function () {
      api.touched = true;
      out.textContent = fmt(Number(inp.value));
      if (opt.onInput) opt.onInput(Number(inp.value));
    });
    out.textContent = fmt(Number(inp.value));
    host.appendChild(wrap);
    return api;
  };

  U.buttons = function (host, items, opt) {
    opt = opt || {};
    var wrap = document.createElement('div');
    wrap.className = 'btn-row';
    if (opt.label) {
      var l = document.createElement('span');
      l.className = 'btn-row__label';
      l.textContent = opt.label;
      wrap.appendChild(l);
    }
    var els = items.map(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = it.label;
      if (it.name) b.dataset.name = it.name;
      b.setAttribute('aria-pressed', i === opt.pressed ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (opt.radio !== false) {
          els.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
        } else {
          b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        }
        if (it.onClick) it.onClick(b.getAttribute('aria-pressed') === 'true', i);
      });
      wrap.appendChild(b);
      return b;
    });
    host.appendChild(wrap);
    return {
      els: els, wrap: wrap,
      press: function (i) { els[i].click(); },
      pressed: function () { return els.map(function (b) { return b.getAttribute('aria-pressed') === 'true'; }); }
    };
  };

  U.toggle = function (host, opt) {
    return U.buttons(host, [{ label: opt.label, name: opt.name, onClick: opt.onChange }],
                     { pressed: opt.on ? 0 : -1, radio: false });
  };

  U.readouts = function (host, rows) {
    var dl = document.createElement('dl');
    dl.className = 'readouts';
    var cells = {};
    rows.forEach(function (r) {
      var d = document.createElement('div');
      d.className = 'readout';
      var dt = document.createElement('dt'); dt.textContent = r.label;
      var dd = document.createElement('dd'); dd.textContent = '—'; dd.dataset.name = r.name;
      d.appendChild(dt); d.appendChild(dd);
      dl.appendChild(d);
      cells[r.name] = dd;
    });
    host.appendChild(dl);
    return {
      el: dl,
      set: function (name, text, tone) {
        var c = cells[name];
        if (!c) return;
        if (c.textContent !== text) c.textContent = text;
        c.className = tone || '';
      },
      read: function () {
        var o = {};
        Object.keys(cells).forEach(function (k) { o[k] = cells[k].textContent; });
        return o;
      }
    };
  };

  /* ================================================================= runtime */

  var scenes = {};
  var mounted = [];
  var reducedMQ = hasDOM && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  A.scene = function (id, fn) { scenes[id] = fn; };
  A.registry = scenes;
  A.reduced = function () { return !!reducedMQ.matches; };

  /* ---------------------------------------------------------------- theme */
  function isDark() {
    var explicit = document.documentElement.getAttribute('data-theme');
    if (explicit) return explicit === 'dark';
    return !window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem('w143-theme'); } catch (e) { /* private mode */ }
    if (stored === 'dark' || stored === 'light') document.documentElement.setAttribute('data-theme', stored);
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    function label() {
      var dark = isDark();
      btn.textContent = dark ? 'Light' : 'Dark';
      btn.setAttribute('aria-label', 'Switch to the ' + (dark ? 'light' : 'dark') + ' theme');
    }
    btn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('w143-theme', next); } catch (e) { /* ignore */ }
      label();
      mounted.forEach(function (m) { if (m.api.onTheme) m.api.onTheme(); });
    });
    label();
    /* The artifact host stamps data-theme too, to express the reader's choice.
       Follow whoever wrote it last so the button never contradicts the page. */
    if (window.MutationObserver) {
      new MutationObserver(label).observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-theme'] });
    }
  }

  /* --------------------------------------------------------------- reveal */
  function initReveal() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reducedMQ.matches) {
      nodes.forEach(function (n) { n.setAttribute('data-shown', '1'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.setAttribute('data-shown', '1'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    /* Anything already on screen is shown at once rather than waiting for the
       observer's first callback: the page must be readable in its resting
       frame, before any scrolling and before anything animates. */
    var vh = window.innerHeight;
    nodes.forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0 && (r.width || r.height)) n.setAttribute('data-shown', '1');
      else io.observe(n);
    });
  }

  /* ------------------------------------------------------------------ nav */
  function base() {
    /* Pages live one directory down; the index sits at the root. */
    return A.currentPage() === 'index' ? '' : '../';
  }

  /* Three seams, so the same code drives the multi-page site and the
     single-document artifact build. The artifact overrides all three before
     boot: there every page is a view in one document, reached by a hash. */
  A.currentPage = function () { return document.body.dataset.page || 'index'; };
  A.href = function (p) { return base() + p.file; };
  A.viewRoot = function () { return document; };
  A.anchor = function (id) { return '#' + id; };
  function buildSidebar() {
    var nav = document.querySelector('.sidebar');
    if (!nav) return;
    var here = A.currentPage();
    var b = base();
    var html = '<a class="sidebar__head" href="' + A.href(A.toc.byId('index')) + '">Physics 143a' +
               '<span>Problem Set 0 — a review companion</span></a>';
    A.toc.parts.forEach(function (part) {
      var pages = A.toc.pages.filter(function (p) { return p.part === part.n; });
      if (!pages.length) return;
      html += '<div class="sidebar__part">' + part.title + '</div>';
      pages.forEach(function (p) {
        var cur = p.id === here;
        html += '<a class="sidebar__link" href="' + A.href(p) + '"' +
                (cur ? ' aria-current="page"' : '') + '>' +
                '<span class="sidebar__num">' + (p.num || '·') + '</span>' +
                '<span>' + p.title + '</span>' +
                '<span class="sidebar__min">' + p.minutes + 'm</span></a>';
        if (cur) html += '<ul class="sidebar__sub" data-sub></ul>';
      });
    });
    nav.innerHTML = html;

    /* Sub-navigation: one entry per section heading on this page. */
    var sub = nav.querySelector('[data-sub]');
    if (sub) {
      var heads = [].slice.call(A.viewRoot().querySelectorAll('h2[id]'));
      sub.innerHTML = heads.map(function (h) {
        return '<li><a href="' + A.anchor(h.id) + '" data-spy="' + h.id + '">' +
               (h.dataset.short || h.textContent) + '</a></li>';
      }).join('');
    }

    var toggle = document.querySelector('.nav-toggle');
    var backdrop = document.querySelector('.nav-backdrop');
    function setOpen(on) {
      document.body.dataset.nav = on ? 'open' : 'closed';
      if (toggle) toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    setOpen(false);
    if (toggle) toggle.addEventListener('click', function () {
      setOpen(document.body.dataset.nav !== 'open');
    });
    if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  /* The reading-order table on the contents page: one row per section, in the
     order the material builds on itself. */
  function buildTocTable() {
    var host = document.querySelector('[data-toc-table]');
    if (!host) return;
    var total = 0;
    var rows = A.toc.pages.filter(function (p) { return p.id !== 'index'; }).map(function (p, i) {
      total += p.minutes;
      var needs = A.toc.pages.filter(function (q) { return q.feeds.indexOf(p.id) !== -1; })
        .map(function (q) { return q.num; });
      return '<tr><td class="num">' + (i + 1) + '</td>' +
             '<td><a href="' + A.href(p) + '">' + p.num + ' · ' + p.title + '</a></td>' +
             '<td class="num">' + p.minutes + ' min</td>' +
             '<td>' + (needs.length ? needs.join(', ') : 'nothing yet') + '</td></tr>';
    }).join('');
    host.innerHTML = '<table><thead><tr><th>Order</th><th>Section</th><th>Time</th>' +
      '<th>Read after</th></tr></thead><tbody>' + rows +
      '<tr><td></td><td><strong>Everything</strong></td><td class="num">' +
      Math.round(total / 60 * 10) / 10 + ' h</td><td></td></tr></tbody></table>';
  }

  /* The card grid of sections, also on the contents page. */
  function buildCards() {
    var host = document.querySelector('[data-toc-cards]');
    if (!host) return;
    host.innerHTML = A.toc.pages.filter(function (p) { return p.id !== 'index'; })
      .map(function (p) {
        return '<a class="card" href="' + A.href(p) + '">' +
               '<span class="card__num">' + p.num + '</span>' +
               '<span class="card__title">' + p.title + '</span>' +
               '<span class="card__meta">' + p.minutes + ' minutes</span></a>';
      }).join('');
  }

  function buildPager() {
    var pager = A.viewRoot().querySelector('.pager') || document.querySelector('.pager');
    if (!pager) return;
    var n = A.toc.neighbours(A.currentPage());
    var html = '';
    if (n.prev) html += '<a class="pager__prev" href="' + A.href(n.prev) + '">' +
      '<span class="pager__dir">Previous</span>' + (n.prev.num ? n.prev.num + ' · ' : '') + n.prev.title + '</a>';
    if (n.next) html += '<a class="pager__next" href="' + A.href(n.next) + '">' +
      '<span class="pager__dir">Next</span>' + (n.next.num ? n.next.num + ' · ' : '') + n.next.title + '</a>';
    pager.innerHTML = html;
  }

  /* ----------------------------------------------------------- scroll-spy */
  var spy = null;
  function initSpy() {
    var links = [].slice.call(document.querySelectorAll('[data-spy]'));
    var bands = [].slice.call(A.viewRoot().querySelectorAll('[data-section]'));
    var now = document.querySelector('.toolbar__now');
    var fill = document.querySelector('.sidebar__fill');
    spy = { links: links, bands: bands, now: now, fill: fill };
  }
  function updateSpy(y, docH) {
    if (!spy) return;
    if (spy.fill) spy.fill.style.height = (docH > 0 ? M.clamp(y / docH, 0, 1) * 100 : 0) + '%';
    var mid = window.innerHeight * 0.35, cur = null;
    for (var i = 0; i < spy.bands.length; i++) {
      var br = spy.bands[i].getBoundingClientRect();
      if (!br.width && !br.height) continue;   /* not rendered: no opinion */
      if (br.top <= mid) cur = spy.bands[i];
    }
    /* The sub-navigation links are keyed by the heading's id, not the band's,
       so read the heading out of the band before comparing. */
    var h2 = cur ? cur.querySelector('h2[id]') : null;
    var id = h2 ? h2.id : (cur ? cur.id : '');
    var name = cur ? (cur.getAttribute('data-section') || '') : '';
    if (spy.now && spy.now.textContent !== name) spy.now.textContent = name;
    for (var j = 0; j < spy.links.length; j++) {
      var on = spy.links[j].getAttribute('data-spy') === id ? '1' : '0';
      if (spy.links[j].getAttribute('data-active') !== on) spy.links[j].setAttribute('data-active', on);
    }
  }

  /* -------------------------------------------------------- scene mounting */
  /* A demo inside a sticky stage gets progress 0 when the stage locks and 1
     when it releases; an ordinary figure ramps as it crosses the viewport. */
  function progressFor(m) {
    var vh = window.innerHeight;
    var r = m.host.getBoundingClientRect();
    if (m.kind === 'stage') {
      var span = r.height - vh;
      if (span <= 0) return M.clamp(1 - (r.top + r.height) / (vh + r.height), 0, 1);
      return M.clamp(-r.top / span, 0, 1);
    }
    var enter = vh * 0.92;
    var span2 = r.height * 0.55 + vh * 0.42;
    return M.clamp((enter - r.top) / span2, 0, 1);
  }

  A.resizeAll = function () {
    mounted.forEach(function (m) { if (m.api.onResize) m.api.onResize(); });
    if (A.derive && A.derive.invalidate) A.derive.invalidate();
    measure();
  };

  A.mountAll = function (root) {
    var nodes = [].slice.call((root || document).querySelectorAll('[data-scene]'));
    nodes.forEach(function (node) {
      if (node.dataset.mounted === '1') return;
      var id = node.getAttribute('data-scene');
      var fn = scenes[id];
      if (!fn) { console.error('[site] no demo registered for id: ' + id); return; }
      var stage = node.closest('.stage');
      var fig = node.closest('.fig');
      var api = {
        id: id,
        reduced: reducedMQ.matches,
        controls: fig ? fig.querySelector('.fig__controls') : null,
        onTheme: null,
        onResize: null
      };
      var update;
      try {
        update = fn(node, api) || function () {};
      } catch (err) {
        console.error('[site] demo "' + id + '" failed to mount:', err);
        return;
      }
      node.dataset.mounted = '1';
      mounted.push({
        id: id, node: node, api: api, update: update,
        host: stage || fig || node,
        kind: stage ? 'stage' : 'inline',
        visible: false, t0: (typeof performance !== 'undefined' ? performance.now() : Date.now()), maxP: 0
      });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          for (var i = 0; i < mounted.length; i++) {
            if (mounted[i].host === e.target) { mounted[i].visible = e.isIntersecting; break; }
          }
        });
      }, { rootMargin: '25% 0px 25% 0px' });
      mounted.forEach(function (m) { if (!m.observed) { m.observed = 1; io.observe(m.host); } });
    } else {
      mounted.forEach(function (m) { m.visible = true; });
    }
    window.__scenes = mounted;
  };

  /* ------------------------------------------------------------- the loop */
  var docH = 0, toolbar = null, ticking = false;

  function measure() {
    docH = document.documentElement.scrollHeight - window.innerHeight;
  }

  function frame(now) {
    var y = window.scrollY || window.pageYOffset || 0;
    updateSpy(y, docH);
    if (toolbar) toolbar.setAttribute('data-scrolled', y > 8 ? '1' : '0');
    for (var i = 0; i < mounted.length; i++) {
      var m = mounted[i];
      if (!m.visible) continue;
      var hr = m.host.getBoundingClientRect();
      /* Hidden hosts measure as zero, and the observer tells us a frame late. */
      if (!hr.width && !hr.height) continue;
      var p = progressFor(m);
      if (p > m.maxP) m.maxP = p;
      try {
        m.update(p, (now - m.t0) / 1000);
      } catch (err) {
        if (!m.errored) { m.errored = true; console.error('[site] demo "' + m.id + '" update failed:', err); }
      }
    }
    requestAnimationFrame(frame);
  }

  /* --------------------------------------------------------------- KaTeX */
  /* Macros are shared with derive.js so a term written one way in prose is the
     same term inside an animated derivation. */
  A.katexMacros = {
    '\\k': '\\htmlData{k=#1}{#2}',
    '\\dd': '\\mathrm{d}',
    '\\half': '\\tfrac{1}{2}',
    '\\unit': '\\,\\mathrm{#1}',
    '\\Ten': 'F_{T}',
    '\\vb': '\\mathbf{#1}',
    '\\vu': '\\hat{\\mathbf{#1}}',
    '\\mat': '\\mathbf{#1}',
    '\\abs': '\\left|#1\\right|',
    '\\inner': '\\left\\langle #1,\\, #2 \\right\\rangle'
  };
  A.katexOptions = function (extra) {
    var o = {
      throwOnError: false,
      trust: function (ctx) { return ctx.command === '\\htmlData'; },
      strict: function (code) { return code === 'htmlExtension' ? 'ignore' : 'warn'; },
      macros: A.katexMacros
    };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  };
  A.renderMath = function (root) {
    if (typeof window.renderMathInElement !== 'function' || typeof window.katex === 'undefined') {
      document.documentElement.setAttribute('data-katex', 'missing');
      console.warn('[site] KaTeX did not load; equations are shown as LaTeX source.');
      return;
    }
    window.renderMathInElement(root || document.body, A.katexOptions({
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }
      ],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      ignoredClasses: ['derive__layer', 'derive__tex', 'derive__fx']
    }));
    document.documentElement.setAttribute('data-katex', 'ready');
  };

  /* ----------------------------------------------------------------- boot */
  function boot() {
    toolbar = document.querySelector('.toolbar');
    initTheme();
    /* Derivations expand first: they inject their own equations and demo
       hosts, and both the maths renderer and the mount pass must see them. */
    var scope = A.viewRoot();
    if (A.derive && A.derive.install) {
      try { A.derive.install(scope); } catch (err) { console.error('[site] derivations failed to build:', err); }
    }
    A.renderMath(scope === document ? document.body : scope);
    buildSidebar();
    buildPager();
    buildTocTable();
    buildCards();
    A.initSpy = initSpy;
    initSpy();
    initReveal();
    A.initReveal = initReveal;
    A.buildNav = function () { buildSidebar(); buildPager(); initSpy(); };
    A.mountAll(scope);
    measure();
    window.addEventListener('resize', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        measure();
        mounted.forEach(function (m) { if (m.api.onResize) m.api.onResize(); });
        if (A.derive && A.derive.invalidate) A.derive.invalidate();
        ticking = false;
      });
    }, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measure();
        if (A.derive && A.derive.invalidate) A.derive.invalidate();
      });
    }
    setTimeout(measure, 400);
    requestAnimationFrame(frame);
    document.documentElement.setAttribute('data-site-ready', '1');
  }

  if (hasDOM) {
    /* Boot on DOMContentLoaded, never on the spot. Every script on the page is
       deferred, so by the time this file runs the document is already
       "interactive" — booting here would mount the page before derive.js and
       the demos had a chance to register themselves. */
    if (document.readyState === 'complete') boot();
    else document.addEventListener('DOMContentLoaded', boot);
  }
})(typeof window !== 'undefined' ? (window.A = window.A || {}) : (globalThis.A = globalThis.A || {}));
