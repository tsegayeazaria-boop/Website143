/* Section 1.12: the uncertainty principle. Localisation as a superposition of
   wavelengths, the variance identity behind (1.12.2), the Fourier trade-off with
   both widths measured off the plotted distributions, the Heisenberg microscope
   drawn as a real single-slit pattern, an honest accounting of the factor the
   microscope misses, and the answer to Question 1.12.2.

   Every number these scenes print is integrated, transformed or evaluated here.
   Nothing is a transcribed result. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;
  var C = M.C;

  /* ---------------------------------------------------------------- utils */

  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³',
              '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function sup(n) {
    var str = String(n), o = '', i;
    for (i = 0; i < str.length; i++) o += SUP[str.charAt(i)] || str.charAt(i);
    return o;
  }
  /* Fixed point with a typographic minus, and never a negative zero. */
  function num(v, d) {
    var str = (Math.abs(v) < 0.5 * Math.pow(10, -d)) ? (0).toFixed(d) : v.toFixed(d);
    return (str.charAt(0) === '-') ? '−' + str.slice(1) : str;
  }
  /* Scientific notation with a superscript exponent. */
  function sci(v, d) {
    if (!isFinite(v) || v === 0) return '0';
    var e = Math.floor(Math.log(Math.abs(v)) / Math.LN10);
    var m = v / Math.pow(10, e);
    var dd = (d == null) ? 3 : d;
    if (Math.abs(m) >= 10 - 0.5 * Math.pow(10, -dd)) { m /= 10; e += 1; }
    return num(m, dd) + ' × 10' + sup(e);
  }
  function put(parent, x, y, str, cls, anchor, size) {
    var t = S.text(x, y, str, cls, anchor);
    if (size) t.setAttribute('font-size', String(size));
    parent.appendChild(t);
    return t;
  }
  /* Trapezoidal integral of f sampled on xs. */
  function integrate(xs, fs) {
    var s = 0, i;
    for (i = 1; i < xs.length; i++) s += 0.5 * (fs[i] + fs[i - 1]) * (xs[i] - xs[i - 1]);
    return s;
  }
  /* Norm, mean and standard deviation of a sampled non-negative density. */
  function moments(xs, fs) {
    var i, xf = [], x2f = [];
    for (i = 0; i < xs.length; i++) { xf.push(xs[i] * fs[i]); x2f.push(xs[i] * xs[i] * fs[i]); }
    var Z = integrate(xs, fs);
    if (Z <= 0) return { Z: 0, mean: 0, m2: 0, sd: 0 };
    var mean = integrate(xs, xf) / Z;
    var m2 = integrate(xs, x2f) / Z;
    return { Z: Z, mean: mean, m2: m2, sd: Math.sqrt(Math.max(0, m2 - mean * mean)) };
  }
  /* The same three numbers for a discrete distribution. */
  function discMoments(ks, ws) {
    var Z = 0, s1 = 0, s2 = 0, i;
    for (i = 0; i < ks.length; i++) { Z += ws[i]; s1 += ks[i] * ws[i]; s2 += ks[i] * ks[i] * ws[i]; }
    var mean = s1 / Z, m2 = s2 / Z;
    return { Z: Z, mean: mean, m2: m2, sd: Math.sqrt(Math.max(0, m2 - mean * mean)) };
  }
  /* Linear interpolation of a sampled function. */
  function at(xs, fs, x) {
    var n = xs.length;
    if (x <= xs[0]) return fs[0];
    if (x >= xs[n - 1]) return fs[n - 1];
    var lo = 0, hi = n - 1, mid;
    while (hi - lo > 1) { mid = (lo + hi) >> 1; if (xs[mid] > x) hi = mid; else lo = mid; }
    var f = (x - xs[lo]) / (xs[hi] - xs[lo]);
    return fs[lo] + f * (fs[hi] - fs[lo]);
  }
  function card(parent, x, y, w, h, stroke) {
    var r = S.rect(x, y, w, h, 's-ghost');
    r.setAttribute('fill', 'var(--surface)');
    r.setAttribute('rx', '3');
    if (stroke) r.setAttribute('stroke', stroke);
    parent.appendChild(r);
    return r;
  }
  /* A horizontal span marker with a caption: |<--- label --->| */
  function span(parent, xa, xb, y, label, cls) {
    var g = S.g({});
    parent.appendChild(g);
    g.appendChild(S.line(xa, y - 5, xa, y + 5, 's-axis'));
    g.appendChild(S.line(xb, y - 5, xb, y + 5, 's-axis'));
    g.appendChild(S.line(xa, y, xb, y, 's-axis s-dash'));
    put(g, (xa + xb) / 2, y - 9, label, cls || 's-lbl-b', 'middle', 11);
    return g;
  }

  /* ======================================================================
     1. Question 1.12.1 and Figure 1.12.1. A broad packet and a narrow one,
        each drawn as the sum of the cosines it is actually made of.
     =================================================================== */

  A.scene('narrow-vs-broad', function (root) {
    var W = 1200, H = 880;
    var svg = S.root(W, H,
      'Two wave packets side by side. The broad one is built from a narrow band of ' +
      'wavelengths; the narrow one needs a wide band. Each packet is drawn as the sum of ' +
      'the cosine components shown beneath it, and the two widths are measured from the ' +
      'plotted curves.');
    root.appendChild(svg);

    var XW = 6;            /* the window is x in [-XW, XW]                   */
    var K0 = 6.0;          /* central wavenumber, the same for both columns  */
    var NK = 31;           /* how many cosines are summed                    */
    var SHOW = [0, 5, 10, 15, 20, 25, 30];   /* which of them get a lane     */

    var yPsi = 132, aPsi = 38;
    var yProbB = 292, hProb = 84;
    var yLane0 = 350, dLane = 30, aLane = 11;
    var ySpecB = 668, hSpec = 76;

    function column(cfg) {
      var g = S.g({});
      svg.appendChild(g);
      var x0 = cfg.x0, x1 = cfg.x1, i, j;
      var PX = function (x) { return M.map(x, -XW, XW, x0, x1); };
      var PK = function (k) { return M.map(k, 0, 12, x0, x1); };

      /* The spectrum actually summed: 31 cosines with Gaussian weights,
         spanning three standard deviations either side of K0. */
      var ks = [], ws = [], dk = 6 * cfg.sigK / (NK - 1);
      for (i = 0; i < NK; i++) {
        ks.push(K0 - 3 * cfg.sigK + i * dk);
        ws.push(Math.exp(-Math.pow((ks[i] - K0) / cfg.sigK, 2) / 2));
      }
      function psi(x) {
        var s = 0, m;
        for (m = 0; m < NK; m++) s += ws[m] * Math.cos(ks[m] * x);
        return s;
      }
      var psiMax = psi(0);

      /* Widths, measured. Δx from the plotted |ψ|², Δk from the plotted stems. */
      var xs = [], fs = [], n = 1400, xv;
      for (i = 0; i <= n; i++) {
        xv = -XW + 2 * XW * i / n;
        xs.push(xv);
        fs.push(Math.pow(psi(xv), 2));
      }
      var mx = moments(xs, fs);
      var wsq = [];
      for (i = 0; i < NK; i++) wsq.push(ws[i] * ws[i]);
      var mk = discMoments(ks, wsq);

      /* --- heading and the wavefunction itself --- */
      var gHead = S.g({});
      g.appendChild(gHead);
      put(gHead, x0, 52, cfg.head, 's-lbl-b', 'start', 13);
      put(gHead, x0, 76, cfg.sub, cfg.subCls, 'start', 11);

      var gPsi = S.g({});
      g.appendChild(gPsi);
      gPsi.appendChild(S.line(x0, yPsi, x1, yPsi, 's-axis'));
      put(gPsi, x0, yPsi - aPsi - 12, 'ψ(x), the sum of every component below', 's-lbl', 'start', 11);
      var pPsi = S.path('', 's-wave');
      gPsi.appendChild(pPsi);
      S.setD(pPsi, S.polyD(S.sample(760, -XW, XW, function (x) {
        return [PX(x), yPsi - psi(x) / psiMax * aPsi];
      })));

      /* --- |psi|^2, which is what Figure 1.12.1 plots --- */
      var gProb = S.g({});
      g.appendChild(gProb);
      gProb.appendChild(S.line(x0, yProbB, x1, yProbB, 's-axis'));
      put(gProb, x0, yProbB - hProb - 14, '|ψ(x)|², the density the handout draws',
        's-lbl-p', 'start', 11);
      var probPts = S.sample(760, -XW, XW, function (x) {
        return [PX(x), yProbB - Math.pow(psi(x) / psiMax, 2) * hProb];
      });
      var fill = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.20', stroke: 'none' });
      gProb.appendChild(fill);
      fill.setAttribute('d', S.areaD(probPts, yProbB));
      var pProb = S.path('', 's-prob');
      gProb.appendChild(pProb);
      S.setD(pProb, S.polyD(probPts));
      var gSpanX = span(gProb, PX(-mx.sd), PX(mx.sd), yProbB + 22,
        'Δx = ' + num(mx.sd, 3), 's-lbl-p');

      /* --- the component cosines, one lane each --- */
      var gLanes = S.g({});
      g.appendChild(gLanes);
      put(gLanes, x0, yLane0 - 20, 'components, equal amplitude — true weights below',
        's-lbl', 'start', 11);
      var lanes = SHOW.map(function (idx, row) {
        var lg = S.g({});
        gLanes.appendChild(lg);
        var yc = yLane0 + row * dLane;
        var lx1 = x1 - 122;
        lg.appendChild(S.line(x0, yc, lx1, yc, 's-grid'));
        var pth = S.path('', 's-quantum');
        pth.setAttribute('stroke-width', '1.2');
        lg.appendChild(pth);
        S.setD(pth, S.polyD(S.sample(620, -XW, XW, function (x) {
          return [M.map(x, -XW, XW, x0, lx1), yc - Math.cos(ks[idx] * x) * aLane];
        })));
        put(lg, lx1 + 10, yc + 4,
          'λ ' + num(M.TAU / ks[idx], 2) + '  w ' + num(ws[idx], 3),
          's-lbl-q', 'start', 10);
        return lg;
      });

      /* --- the spectrum: which wavenumbers, and how strongly --- */
      var gSpec = S.g({});
      g.appendChild(gSpec);
      put(gSpec, x0, ySpecB - hSpec - 16, 'weight of each wavenumber, |A(k)|²',
        's-lbl-q', 'start', 11);
      gSpec.appendChild(S.line(x0, ySpecB, x1, ySpecB, 's-axis'));
      for (j = 0; j <= 12; j += 2) {
        gSpec.appendChild(S.line(PK(j), ySpecB, PK(j), ySpecB + 5, 's-axis'));
        put(gSpec, PK(j), ySpecB + 17, String(j), 's-tick', 'middle', 9);
      }
      put(gSpec, x1, ySpecB + 34, 'wavenumber k', 's-lbl', 'end', 11);
      for (i = 0; i < NK; i++) {
        var st = S.line(PK(ks[i]), ySpecB, PK(ks[i]), ySpecB - wsq[i] * hSpec, 's-quantum');
        st.setAttribute('stroke-width', '2.4');
        gSpec.appendChild(st);
      }
      var gSpanK = span(gSpec, PK(mk.mean - mk.sd), PK(mk.mean + mk.sd), ySpecB - hSpec - 2,
        'Δk = ' + num(mk.sd, 3), 's-lbl-q');

      /* --- the numbers, all measured above --- */
      var gNum = S.g({});
      g.appendChild(gNum);
      var lam1 = M.TAU / ks[NK - 1], lam2 = M.TAU / ks[0];
      [['Δx = ' + num(mx.sd, 3) + '        Δk = ' + num(mk.sd, 3) +
        '        Δx Δk = ' + num(mx.sd * mk.sd, 3), 's-lbl-b'],
       ['wavelengths present: ' + num(lam1, 2) + ' to ' + num(lam2, 2) +
        '   —   a factor ' + num(lam2 / lam1, 1), 's-lbl-q'],
       [cfg.moral, cfg.moralCls]
      ].forEach(function (row, i2) {
        put(gNum, x0, 740 + i2 * 26, row[0], row[1], 'start', 12);
      });

      return { g: g, head: gHead, psi: gPsi, prob: gProb, spanX: gSpanX,
               lanes: lanes, spec: gSpec, spanK: gSpanK, nums: gNum };
    }

    /* Two columns of identical construction, differing only in the width of
       the band of wavenumbers they are allowed to use. */
    var colA = column({
      x0: 60, x1: 580, sigK: 0.4714,
      head: '(A)  broad in x',
      sub: 'the position is poorly determined', subCls: 's-lbl',
      moral: 'few wavelengths, so λ — and p = h/λ — is almost definite',
      moralCls: 's-lbl-w'
    });
    var colB = column({
      x0: 640, x1: 1160, sigK: 1.5708,
      head: '(B)  narrow in x',
      sub: 'the position is well determined', subCls: 's-lbl-p',
      moral: 'many wavelengths, so λ — and p = h/λ — is badly smeared',
      moralCls: 's-lbl-f'
    });

    var verdict = put(svg, W / 2, H - 26,
      'localising a wave costs wavelengths: a single wavelength is spread over the whole axis',
      's-lbl-b', 'middle', 13);

    return function (p) {
      [colA, colB].forEach(function (c, i) {
        var o = i * 0.06;
        S.op(c.head, M.beat(p, 0.01 + o, 0.09 + o));
        S.op(c.psi, M.beat(p, 0.05 + o, 0.15 + o));
        S.op(c.prob, M.beat(p, 0.12 + o, 0.24 + o));
        S.op(c.spanX, M.beat(p, 0.62, 0.74));
        c.lanes.forEach(function (l, j) {
          S.op(l, M.beat(p, 0.26 + o + j * 0.022, 0.36 + o + j * 0.022));
        });
        S.op(c.spec, M.beat(p, 0.48 + o, 0.60 + o));
        S.op(c.spanK, M.beat(p, 0.64, 0.76));
        S.op(c.nums, M.beat(p, 0.72 + i * 0.04, 0.86 + i * 0.04));
      });
      S.op(verdict, M.beat(p, 0.88, 0.98));
    };
  });

  /* ======================================================================
     2. Equation (1.12.2), with every skipped justification put back, and the
        identity checked numerically on a deliberately lopsided density.
     =================================================================== */

  A.scene('variance-identity', function (root) {
    var W = 1180, H = 740;
    var svg = S.root(W, H,
      'The algebra that turns the definition of a standard deviation into the difference of ' +
      'the second moment and the square of the first, checked against a lopsided probability ' +
      'density whose moments are integrated on the page.');
    root.appendChild(svg);

    /* --- the chain, one line at a time --- */
    var chain = [
      { s: '(ΔO)²  =  ⟨(Ô − ⟨Ô⟩)²⟩', c: 's-lbl-b', z: 13 },
      { s: '⟨Ô⟩ is a number, not an operator — so it carries an identity 1̂', c: 's-lbl', z: 12 },
      { s: '(Ô − ⟨Ô⟩1̂)²  =  Ô² − Ô⟨Ô⟩1̂ − ⟨Ô⟩1̂Ô + ⟨Ô⟩²1̂', c: 's-lbl-q', z: 12 },
      { s: 'a number commutes with every operator, so those two middle terms', c: 's-lbl', z: 12 },
      { s: 'are the same term twice:   Ô² − 2⟨Ô⟩Ô + ⟨Ô⟩²1̂', c: 's-lbl-q', z: 12 },
      { s: 'now take ⟨·⟩ of both sides. it is linear, because ∫ is linear', c: 's-lbl', z: 12 },
      { s: '(ΔO)²  =  ⟨Ô²⟩ − 2⟨Ô⟩⟨Ô⟩ + ⟨Ô⟩²⟨1̂⟩', c: 's-lbl-q', z: 12 },
      { s: '⟨1̂⟩ = ∫ψ*ψ dx = 1 — normalisation, used exactly once, here', c: 's-lbl-w', z: 12 },
      { s: '(ΔO)²  =  ⟨Ô²⟩ − ⟨Ô⟩²', c: 's-lbl-b', z: 14 }
    ];
    var gChain = S.g({});
    svg.appendChild(gChain);
    put(gChain, 60, 62, 'the algebra behind (1.12.2)', 's-lbl-q', 'start', 12);
    var lines = chain.map(function (r, i) {
      return put(gChain, 60, 106 + i * 42, r.s, r.c, 'start', r.z);
    });
    var box = S.rect(48, 106 + 8 * 42 - 24, 330, 36, 's-ghost');
    box.setAttribute('fill', 'none');
    box.setAttribute('stroke', 'var(--ink-bright)');
    box.setAttribute('rx', '3');
    gChain.appendChild(box);

    /* --- a concrete state to check it on: P(x) = x^2 e^{-x} / 2 --- */
    var xs = [], fs = [], N = 6000, i, x;
    for (i = 0; i <= N; i++) {
      x = 40 * i / N;
      xs.push(x);
      fs.push(0.5 * x * x * Math.exp(-x));
    }
    var m = moments(xs, fs);
    /* The left-hand side of (1.12.2), integrated separately from the right. */
    var dev = [];
    for (i = 0; i <= N; i++) dev.push(Math.pow(xs[i] - m.mean, 2) * fs[i]);
    var lhs = integrate(xs, dev) / m.Z;
    var rhs = m.m2 - m.mean * m.mean;

    var px0 = 690, px1 = 1140, pyB = 300, pyT = 128;
    var PX = function (v) { return M.map(v, 0, 14, px0, px1); };
    var peak = 0.5 * 4 * Math.exp(-2);
    var PY = function (v) { return M.map(v, 0, peak * 1.22, pyB, pyT); };

    var gPlot = S.g({});
    svg.appendChild(gPlot);
    put(gPlot, px0, 62, 'a check, on a density chosen not to be symmetric', 's-lbl-p', 'start', 12);
    gPlot.appendChild(S.axes(px0, pyT, px1, pyB, 'x', null));
    put(gPlot, px0 - 8, pyT - 8, 'P(x) = ½x²e⁻ˣ', 's-lbl-p', 'end', 11);
    var pts = S.sample(420, 0, 14, function (v) { return [PX(v), PY(at(xs, fs, v))]; });
    var pf = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.18', stroke: 'none' });
    gPlot.appendChild(pf);
    pf.setAttribute('d', S.areaD(pts, pyB));
    var pc = S.path('', 's-prob');
    gPlot.appendChild(pc);
    S.setD(pc, S.polyD(pts));
    gPlot.appendChild(S.line(PX(m.mean), pyB, PX(m.mean), PY(at(xs, fs, m.mean)), 's-axis s-dash'));
    put(gPlot, PX(m.mean), pyT - 6, '⟨x̂⟩', 's-lbl-b', 'middle', 12);
    span(gPlot, PX(m.mean - m.sd), PX(m.mean + m.sd), pyB + 26, '± Δx', 's-lbl-p');

    var gNum = S.g({});
    svg.appendChild(gNum);
    var rows = [
      ['⟨x̂⟩            =  ' + num(m.mean, 6), 's-lbl'],
      ['⟨x̂²⟩           =  ' + num(m.m2, 6), 's-lbl'],
      ['⟨x̂⟩²           =  ' + num(m.mean * m.mean, 6), 's-lbl'],
      ['⟨x̂²⟩ − ⟨x̂⟩²    =  ' + num(rhs, 6) + '   ← right side', 's-lbl-q'],
      ['⟨(x̂ − ⟨x̂⟩)²⟩   =  ' + num(lhs, 6) + '   ← left side', 's-lbl-q'],
      ['they differ by ' + sci(Math.abs(lhs - rhs), 1) + ', which is the grid', 's-lbl-w'],
      ['⟨⟨x̂⟩⟩ = ' + num(m.mean, 6) + ' = ⟨x̂⟩   averaging a number returns it', 's-lbl-b'],
      ['Δx = √' + num(rhs, 4) + ' = ' + num(m.sd, 6), 's-lbl-p']
    ].map(function (r, i2) {
      return put(gNum, px0, 366 + i2 * 28, r[0], r[1], 'start', 12);
    });

    var warn = S.g({});
    svg.appendChild(warn);
    put(warn, px0, 610, 'and note ⟨x̂²⟩ ≠ ⟨x̂⟩² : ' + num(m.m2, 3) + ' against ' +
      num(m.mean * m.mean, 3), 's-lbl-f', 'start', 12);
    put(warn, px0, 634, '⟨Ô²⟩ means ∫ψ*Ô(Ôψ)dx — the operator acts twice', 's-lbl-f', 'start', 12);

    var moral = put(svg, W / 2, H - 46,
      'nothing here is quantum mechanics: this is Var(X) = E[X²] − E[X]² for any random variable',
      's-lbl-b', 'middle', 13);
    var moral2 = put(svg, W / 2, H - 22,
      'the quantum content arrives later, when x and p turn out to have no joint distribution',
      's-lbl', 'middle', 12);

    return function (p) {
      lines.forEach(function (l, i3) { S.op(l, M.beat(p, 0.02 + i3 * 0.062, 0.14 + i3 * 0.062)); });
      S.op(box, M.beat(p, 0.60, 0.72));
      S.op(gPlot, M.beat(p, 0.10, 0.24));
      rows.forEach(function (r, i3) { S.op(r, M.beat(p, 0.30 + i3 * 0.055, 0.42 + i3 * 0.055)); });
      S.op(warn, M.beat(p, 0.76, 0.88));
      S.op(moral, M.beat(p, 0.84, 0.94));
      S.op(moral2, M.beat(p, 0.90, 0.99));
    };
  });

  /* ======================================================================
     3. The trade-off made quantitative. One state, two distributions, both
        widths measured; the momentum distribution is Fourier transformed
        numerically from the position one every frame.
     =================================================================== */

  A.scene('fourier-tradeoff', function (root, api) {
    var W = 1200, H = 820;
    var svg = S.root(W, H,
      'A wave packet and its momentum distribution drawn side by side on fixed axes. ' +
      'Squeezing the packet in position widens it in momentum. Both standard deviations are ' +
      'integrated from the plotted curves and their product is printed live against the ' +
      'bound h-bar over two.');
    root.appendChild(svg);

    /* Units: lengths in a, momenta in hbar/a, so hbar = 1 and the product of
       the two widths is read directly in units of hbar. */
    var ax0 = 90, ax1 = 560, bx0 = 660, bx1 = 1130, yT = 120, yB = 340;
    var XV = 4.0;              /* the x axis is fixed at +/- 4 a            */
    var PV = 4.0;              /* the p axis is fixed at +/- 4 hbar/a       */
    var YX = 0.88, YP = 1.75;  /* fixed vertical scales, chosen to fit both */

    var PXa = function (x) { return M.map(x, -XV, XV, ax0, ax1); };
    var PYa = function (v) { return M.map(v, 0, YX, yB, yT); };
    var PXb = function (q) { return M.map(q, -PV, PV, bx0, bx1); };
    var PYb = function (v) { return M.map(v, 0, YP, yB, yT); };

    svg.appendChild(S.gridLines(ax0, yT, ax1, yB, 8, 4));
    svg.appendChild(S.axes(ax0, yT, ax1, yB, 'x  (units of a)', null));
    svg.appendChild(S.gridLines(bx0, yT, bx1, yB, 8, 4));
    svg.appendChild(S.axes(bx0, yT, bx1, yB, 'p  (units of ℏ/a)', null));
    put(svg, ax0, yT - 34, '|ψ(x)|²  —  where the particle is', 's-lbl-p', 'start', 12);
    put(svg, bx0, yT - 34, '|φ(p)|²  —  what momenta it is made of', 's-lbl-q', 'start', 12);
    put(svg, ax0 - 8, yT - 8, num(YX, 2), 's-tick', 'end', 9);
    put(svg, bx0 - 8, yT - 8, num(YP, 2), 's-tick', 'end', 9);
    put(svg, ax1, yB + 36, 'both areas are one', 's-lbl', 'end', 11);
    put(svg, bx1, yB + 36, 'transformed from the left, on this grid', 's-lbl', 'end', 11);

    var fillA = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.20', stroke: 'none' });
    var curveA = S.path('', 's-prob');
    var fillB = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.18', stroke: 'none' });
    var curveB = S.path('', 's-quantum');
    svg.appendChild(fillA); svg.appendChild(curveA);
    svg.appendChild(fillB); svg.appendChild(curveB);

    var bandA = S.rect(0, yT, 0, yB - yT, null);
    bandA.setAttribute('fill', 'var(--probability)');
    bandA.setAttribute('fill-opacity', '0.13');
    var bandB = S.rect(0, yT, 0, yB - yT, null);
    bandB.setAttribute('fill', 'var(--quantum)');
    bandB.setAttribute('fill-opacity', '0.13');
    svg.appendChild(bandA); svg.appendChild(bandB);
    var lblA = put(svg, 0, yB + 20, '', 's-lbl-p', 'middle', 12);
    var lblB = put(svg, 0, yB + 20, '', 's-lbl-q', 'middle', 12);

    /* --- the product, drawn against the floor --- */
    var barX0 = 150, barX1 = 1080, barY = 430, barMax = 2.6;   /* in units of hbar/2 */
    var PB = function (v) { return M.map(v, 0, barMax, barX0, barX1); };
    var forbid = S.rect(barX0, barY - 18, PB(1) - barX0, 36, null);
    forbid.setAttribute('fill', 'var(--fail)');
    forbid.setAttribute('fill-opacity', '0.10');
    svg.appendChild(forbid);
    svg.appendChild(S.line(PB(1), barY - 28, PB(1), barY + 28, 's-fail'));
    put(svg, PB(1), barY + 46, 'ℏ/2 — the floor', 's-lbl-f', 'middle', 12);
    put(svg, barX0, barY + 46, 'no state lives in here', 's-lbl-f', 'start', 11);
    put(svg, barX0 - 12, barY + 5, 'Δx Δp', 's-lbl-b', 'end', 12);
    var bar = S.rect(barX0, barY - 11, 0, 22, 's-fill-q');
    bar.setAttribute('opacity', '0.85');
    svg.appendChild(bar);
    var barLbl = put(svg, 0, barY + 5, '', 's-lbl-b', 'start', 12);
    for (var tk = 0; tk <= 5; tk++) {
      var tv = tk * 0.5;
      svg.appendChild(S.line(PB(tv), barY + 18, PB(tv), barY + 24, 's-axis'));
      put(svg, PB(tv), barY + 36, num(tv, 1), 's-tick', 'middle', 9);
    }
    put(svg, barX1, barY - 30, 'in multiples of ℏ/2', 's-lbl', 'end', 11);

    /* --- the readouts --- */
    var readout = [];
    for (var ri = 0; ri < 6; ri++) {
      readout.push(put(svg, 90, 540 + ri * 28, '', ri === 2 ? 's-lbl-b' : 's-lbl', 'start', 12));
    }
    var verdict = put(svg, W / 2, H - 26,
      'squeeze the packet and the momentum distribution widens at exactly the compensating rate',
      's-lbl-b', 'middle', 13);

    /* --- two reader controls --- */
    var ui = document.createElement('div');
    ui.className = 'control';
    ui.innerHTML =
      '<label for="ft-sig">packet width σ</label>' +
      '<input id="ft-sig" type="range" min="45" max="230" value="150" step="1">' +
      '<output id="ft-sout">1.50 a</output>';
    root.appendChild(ui);
    var ui2 = document.createElement('div');
    ui2.className = 'control';
    ui2.innerHTML =
      '<label for="ft-shp">shape n</label>' +
      '<input id="ft-shp" type="range" min="100" max="240" value="100" step="1">' +
      '<output id="ft-nout">1.00</output>';
    root.appendChild(ui2);

    var sSlider = ui.querySelector('#ft-sig'), sOut = ui.querySelector('#ft-sout');
    var nSlider = ui2.querySelector('#ft-shp'), nOut = ui2.querySelector('#ft-nout');
    var sigU = 1.5, nU = 1.0, touchedS = false, touchedN = false;
    sSlider.addEventListener('input', function () {
      sigU = Number(sSlider.value) / 100; touchedS = true;
      sOut.textContent = num(sigU, 2) + ' a';
    });
    nSlider.addEventListener('input', function () {
      nU = Number(nSlider.value) / 100; touchedN = true;
      nOut.textContent = num(nU, 2);
    });

    var NX = 300, NP = 320;

    return function (p) {
      var sig = touchedS ? sigU : M.lerp(1.90, 0.58, M.easeInOut(M.beat(p, 0.10, 0.62)));
      var nn = touchedN ? nU : M.lerp(1.0, 2.2, M.easeInOut(M.beat(p, 0.76, 0.96)));
      if (!touchedS) { sOut.textContent = num(sig, 2) + ' a'; sSlider.value = String(Math.round(sig * 100)); }
      if (!touchedN) { nOut.textContent = num(nn, 2); nSlider.value = String(Math.round(nn * 100)); }

      /* ψ(x) = exp[ −(x²/4σ²)ⁿ ], real and even. n = 1 is the Gaussian. */
      var X = 7 * sig, hx = X / NX, i, j, x, q;
      var xs = [], ps = [], ps2 = [];
      for (i = 0; i <= NX; i++) {
        x = i * hx;
        xs.push(x);
        ps.push(Math.exp(-Math.pow(x * x / (4 * sig * sig), nn)));
        ps2.push(ps[i] * ps[i]);
      }
      /* Normalise on the half grid: the full integral is twice this. */
      var Zx = 2 * integrate(xs, ps2);
      var invRoot = 1 / Math.sqrt(Zx);
      for (i = 0; i <= NX; i++) { ps[i] *= invRoot; ps2[i] = ps[i] * ps[i]; }

      var xx2 = [];
      for (i = 0; i <= NX; i++) xx2.push(xs[i] * xs[i] * ps2[i]);
      /* Even, so the mean is zero and the variance is the second moment. */
      var dx = Math.sqrt(Math.max(0, 2 * integrate(xs, xx2)));

      /* φ(p) = (2/√(2π)) ∫₀^X ψ(x) cos(px) dx, with ħ = 1. */
      var P = 12 / sig, hp = P / NP;
      var qs = [], phi2 = [], pref = 2 / Math.sqrt(M.TAU);
      for (j = 0; j <= NP; j++) {
        q = j * hp;
        var s = 0.5 * (ps[0] * 1 + ps[NX] * Math.cos(q * xs[NX]));
        for (i = 1; i < NX; i++) s += ps[i] * Math.cos(q * xs[i]);
        var ph = pref * s * hx;
        qs.push(q);
        phi2.push(ph * ph);
      }
      var Zp = 2 * integrate(qs, phi2);
      var qq2 = [];
      for (j = 0; j <= NP; j++) qq2.push(qs[j] * qs[j] * phi2[j]);
      var dp = Math.sqrt(Math.max(0, 2 * integrate(qs, qq2) / Zp));
      var prod = dx * dp;

      /* --- draw --- */
      var aPts = S.sample(420, -XV, XV, function (v) {
        return [PXa(v), PYa(at(xs, ps2, Math.abs(v)))];
      });
      S.setD(curveA, S.polyD(aPts));
      fillA.setAttribute('d', S.areaD(aPts, yB));
      var bPts = S.sample(460, -PV, PV, function (v) {
        return [PXb(v), PYb(at(qs, phi2, Math.abs(v)))];
      });
      S.setD(curveB, S.polyD(bPts));
      fillB.setAttribute('d', S.areaD(bPts, yB));

      bandA.setAttribute('x', PXa(-dx));
      bandA.setAttribute('width', Math.max(0, PXa(dx) - PXa(-dx)));
      bandB.setAttribute('x', PXb(-dp));
      bandB.setAttribute('width', Math.max(0, PXb(dp) - PXb(-dp)));
      lblA.setAttribute('x', (ax0 + ax1) / 2);
      lblA.textContent = 'Δx = ' + num(dx, 4) + ' a';
      lblB.setAttribute('x', (bx0 + bx1) / 2);
      lblB.textContent = 'Δp = ' + num(dp, 4) + ' ℏ/a';

      var bw = Math.max(0, Math.min(PB(barMax), PB(prod / 0.5)) - barX0);
      bar.setAttribute('width', bw);
      barLbl.setAttribute('x', barX0 + bw + 12);
      barLbl.textContent = num(prod / 0.5, 4) + ' × (ℏ/2)';

      readout[0].textContent = 'σ = ' + num(sig, 3) + ' a      shape n = ' + num(nn, 2) +
        (nn < 1.02 ? '   (a Gaussian)' : '   (flatter than a Gaussian)');
      readout[1].textContent = 'Δx = ' + num(dx, 5) + ' a       Δp = ' + num(dp, 5) +
        ' ℏ/a       both integrated from the curves above';
      readout[2].textContent = 'Δx Δp = ' + num(prod, 5) + ' ℏ  =  ' + num(prod / 0.5, 5) +
        ' × ℏ/2';
      readout[3].textContent = nn < 1.02
        ? 'the Gaussian prediction: Δx = σ = ' + num(sig, 5) + ' a,  Δp = ℏ/2σ = ' +
          num(1 / (2 * sig), 5) + ' ℏ/a'
        : 'not a Gaussian, so the bound is not attained — and the product has risen above it';
      readout[4].textContent = '∫|φ(p)|² dp = ' + num(Zp, 6) +
        '   — the transform kept the normalisation, so the widths can be trusted';
      readout[5].textContent = 'σ is a parameter of the formula; Δx is measured from the curve. ' +
        'For n = 1 they agree.';

      S.op(curveA, M.beat(p, 0.02, 0.12));
      S.op(fillA, M.beat(p, 0.04, 0.16));
      S.op(curveB, M.beat(p, 0.08, 0.20));
      S.op(fillB, M.beat(p, 0.10, 0.24));
      S.op(bandA, M.beat(p, 0.24, 0.36));
      S.op(bandB, M.beat(p, 0.26, 0.38));
      S.op(lblA, M.beat(p, 0.24, 0.36));
      S.op(lblB, M.beat(p, 0.26, 0.38));
      S.op(forbid, M.beat(p, 0.40, 0.52));
      S.op(bar, M.beat(p, 0.42, 0.54));
      S.op(barLbl, M.beat(p, 0.44, 0.56));
      readout.forEach(function (r, i2) { S.op(r, M.beat(p, 0.46 + i2 * 0.06, 0.58 + i2 * 0.06)); });
      S.op(verdict, M.beat(p, 0.86, 0.97));
    };
  });

  /* ======================================================================
     4. Figure 1.12.2. Babinet turns the electron into a slit, and the slit
        into a diffraction fan whose opening angle is computed, not sketched.
     =================================================================== */

  A.scene('heisenberg-microscope', function (root, api) {
    var W = 1240, H = 800;
    var svg = S.root(W, H,
      'A photon of wavelength lambda approaching a region of width delta-x in which an ' +
      'electron is known to lie. By Babinet the scattering has the angular pattern of a ' +
      'single slit of that width, so the photon leaves inside a cone whose half angle has ' +
      'sine lambda over delta-x. As the region narrows the cone opens.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var LAM = 500e-9;                      /* the light we choose to use     */
    var SX = 480, SY = 330;                /* the slit, in screen pixels     */
    var PXPERLAM = 44;                     /* one wavelength, in pixels      */
    var yTop = 96, yBot = 566;

    /* --- incoming plane wave --- */
    var gIn = S.g({});
    svg.appendChild(gIn);
    var fronts = [];
    for (var fi = 0; fi < 9; fi++) {
      var l = S.line(0, yTop + 24, 0, yBot - 24, 's-wave');
      l.setAttribute('stroke-width', '1.4');
      gIn.appendChild(l);
      fronts.push(l);
    }
    gIn.appendChild(S.arrow(svg, 96, SY, 190, SY, 'w'));
    put(gIn, 96, SY - 14, 'photon, λ = 500 nm', 's-lbl-w', 'start', 12);
    put(gIn, 96, yBot + 24, 'wavefronts one λ apart', 's-lbl', 'start', 11);

    /* --- the barrier and the localisation region --- */
    var gSlit = S.g({});
    svg.appendChild(gSlit);
    var barU = S.rect(SX - 9, yTop, 18, 0, null);
    var barL = S.rect(SX - 9, 0, 18, 0, null);
    [barU, barL].forEach(function (b) {
      b.setAttribute('fill', 'var(--surface-2)');
      b.setAttribute('stroke', 'var(--hairline-2)');
      gSlit.appendChild(b);
    });
    var gapBand = S.rect(SX - 9, 0, 18, 0, null);
    gapBand.setAttribute('fill', 'var(--probability)');
    gapBand.setAttribute('fill-opacity', '0.22');
    gSlit.appendChild(gapBand);
    var gapTick = S.g({});
    gSlit.appendChild(gapTick);
    var tickA = S.line(SX - 42, 0, SX - 18, 0, 's-prob');
    var tickB = S.line(SX - 42, 0, SX - 18, 0, 's-prob');
    var tickC = S.line(SX - 30, 0, SX - 30, 0, 's-prob s-dash');
    gapTick.appendChild(tickA); gapTick.appendChild(tickB); gapTick.appendChild(tickC);
    var gapLbl = put(gapTick, SX - 48, 0, 'Δx', 's-lbl-p', 'end', 13);
    var elec = S.circle(SX, SY, 4.5, 's-fill-i');
    gSlit.appendChild(elec);
    put(gSlit, SX + 16, yTop - 14, 'the electron is somewhere in here', 's-lbl-p', 'start', 11);
    put(gSlit, SX + 16, yBot + 24, 'axis x is across the page, z along the beam', 's-lbl', 'start', 11);

    /* --- the diffraction fan and the intensity lobe --- */
    var gFan = S.g({});
    svg.appendChild(gFan);
    var rays = [];
    var NR = 61, AMAX = 72 * Math.PI / 180;
    for (var ri = 0; ri < NR; ri++) {
      var rl = S.line(SX, SY, SX, SY, 's-quantum');
      rl.setAttribute('stroke-width', '1.6');
      gFan.appendChild(rl);
      rays.push({ el: rl, ang: -AMAX + 2 * AMAX * ri / (NR - 1) });
    }
    var lobe = S.path('', 's-quantum');
    lobe.setAttribute('stroke-dasharray', '5 4');
    gFan.appendChild(lobe);
    var minU = S.line(SX, SY, SX, SY, 's-fail');
    var minL = S.line(SX, SY, SX, SY, 's-fail');
    gFan.appendChild(minU); gFan.appendChild(minL);
    var thetaLbl = put(gFan, 0, 0, '', 's-lbl-f', 'start', 12);
    put(gFan, 700, yBot + 24, 'dashed outline: the single-slit intensity sinc²(πΔx sinθ/λ)',
      's-lbl-q', 'start', 11);

    /* --- the momentum inset --- */
    var IX = 900, IY = 300, IL = 132;
    var gIns = S.g({});
    svg.appendChild(gIns);
    card(gIns, IX - 50, IY - 168, 336, 250);
    put(gIns, IX - 36, IY - 146, 'what the photon carries away', 's-lbl-b', 'start', 12);
    gIns.appendChild(S.arrow(svg, IX, IY, IX + IL, IY, 'm'));
    put(gIns, IX + IL + 8, IY + 4, 'z', 's-lbl', 'start', 11);
    var pVec = S.line(IX, IY, IX, IY, 's-quantum');
    pVec.setAttribute('stroke-width', '2.4');
    gIns.appendChild(pVec);
    var pComp = S.line(IX, IY, IX, IY, 's-fail s-dash');
    gIns.appendChild(pComp);
    var pDrop = S.line(IX, IY, IX, IY, 's-ghost s-dash');
    gIns.appendChild(pDrop);
    var pLbl = put(gIns, 0, 0, 'p = h/λ', 's-lbl-q', 'start', 12);
    var pxLbl = put(gIns, 0, 0, '', 's-lbl-f', 'start', 12);
    put(gIns, IX - 36, IY + 58, 'pₓ is anywhere from 0 to p sin θ', 's-lbl-f', 'start', 11);
    put(gIns, IX - 36, IY + 76, 'so the electron is kicked by that much', 's-lbl-f', 'start', 11);

    /* --- the numbers --- */
    var rows = [];
    for (var qi = 0; qi < 6; qi++) {
      rows.push(put(svg, 70, 630 + qi * 26, '', qi === 3 ? 's-lbl-b' : 's-lbl', 'start', 12));
    }
    var verdict = put(svg, W / 2, H - 22,
      'the wavelength cancels: sharper vision needs a harder kick, in exactly compensating measure',
      's-lbl-q', 'middle', 13);

    return function (p, t) {
      /* Δx, in wavelengths, shrinking as the scroll advances. */
      var ratio = M.lerp(5.0, 1.12, M.easeInOut(M.beat(p, 0.10, 0.80)));
      var gap = ratio * PXPERLAM;
      var gapH = Math.min(gap, yBot - yTop - 40) / 2;

      barU.setAttribute('y', yTop);
      barU.setAttribute('height', Math.max(0, (SY - gapH) - yTop));
      barL.setAttribute('y', SY + gapH);
      barL.setAttribute('height', Math.max(0, yBot - (SY + gapH)));
      gapBand.setAttribute('y', SY - gapH);
      gapBand.setAttribute('height', 2 * gapH);
      tickA.setAttribute('y1', SY - gapH); tickA.setAttribute('y2', SY - gapH);
      tickB.setAttribute('y1', SY + gapH); tickB.setAttribute('y2', SY + gapH);
      tickC.setAttribute('y1', SY - gapH); tickC.setAttribute('y2', SY + gapH);
      gapLbl.setAttribute('y', SY + 5);

      /* Travelling wavefronts, spaced one wavelength apart. */
      var time = api.reduced ? 0.35 : t;
      fronts.forEach(function (f, i) {
        var xw = 120 + ((i * PXPERLAM + time * 26) % (9 * PXPERLAM));
        f.setAttribute('x1', xw); f.setAttribute('x2', xw);
        f.setAttribute('opacity', xw > SX - 24 ? '0.12' : '0.7');
      });

      /* The diffraction pattern of a slit of this width. */
      var aOverL = ratio;
      var sinTh = Math.min(1, 1 / aOverL);
      var theta = Math.asin(sinTh);

      rays.forEach(function (r) {
        var I = M.singleSlit(Math.sin(r.ang), aOverL);
        var len = 60 + 200 * Math.sqrt(I);
        r.el.setAttribute('x2', SX + len * Math.cos(r.ang));
        r.el.setAttribute('y2', SY + len * Math.sin(r.ang));
        r.el.setAttribute('stroke-opacity', (0.10 + 0.75 * Math.sqrt(I)).toFixed(3));
      });
      S.setD(lobe, S.polyD(S.sample(220, -AMAX, AMAX, function (a) {
        var I = M.singleSlit(Math.sin(a), aOverL);
        var R = 60 + 200 * Math.sqrt(I);
        return [SX + R * Math.cos(a), SY + R * Math.sin(a)];
      })));

      var mlen = 268;
      minU.setAttribute('x2', SX + mlen * Math.cos(theta));
      minU.setAttribute('y2', SY - mlen * Math.sin(theta));
      minL.setAttribute('x2', SX + mlen * Math.cos(theta));
      minL.setAttribute('y2', SY + mlen * Math.sin(theta));
      thetaLbl.setAttribute('x', SX + (mlen + 8) * Math.cos(theta));
      thetaLbl.setAttribute('y', SY - (mlen + 8) * Math.sin(theta));
      thetaLbl.textContent = 'θ = ' + num(theta * 180 / Math.PI, 1) + '°';

      /* The momentum inset, drawn at the same angle. */
      pVec.setAttribute('x2', IX + IL * Math.cos(theta));
      pVec.setAttribute('y2', IY - IL * Math.sin(theta));
      pDrop.setAttribute('x1', IX + IL * Math.cos(theta));
      pDrop.setAttribute('y1', IY - IL * Math.sin(theta));
      pDrop.setAttribute('x2', IX + IL * Math.cos(theta));
      pDrop.setAttribute('y2', IY);
      pComp.setAttribute('x1', IX - 26); pComp.setAttribute('y1', IY);
      pComp.setAttribute('x2', IX - 26);
      pComp.setAttribute('y2', IY - IL * Math.sin(theta));
      pLbl.setAttribute('x', IX + IL * Math.cos(theta) + 8);
      pLbl.setAttribute('y', IY - IL * Math.sin(theta) - 6);
      pxLbl.setAttribute('x', IX - 34);
      pxLbl.setAttribute('y', IY - IL * Math.sin(theta) - 8);
      pxLbl.textContent = 'pₓ = p sin θ';

      /* Everything below is arithmetic on the constants, done here. */
      var dxm = ratio * LAM;
      var pgam = C.h / LAM;
      var dpx = pgam * sinTh;
      var prod = dxm * dpx;

      rows[0].textContent = 'Δx = ' + num(ratio, 2) + ' λ = ' + num(dxm * 1e9, 0) +
        ' nm        sin θ = λ/Δx = ' + num(sinTh, 4) + '        θ = ' +
        num(theta * 180 / Math.PI, 2) + '°';
      rows[1].textContent = 'photon momentum   p = h/λ = ' + sci(pgam, 3) + ' kg m s⁻¹';
      rows[2].textContent = 'x-momentum unknown within   Δpₓ ≈ p sin θ = ' + sci(dpx, 3) +
        ' kg m s⁻¹';
      rows[3].textContent = 'Δx Δpₓ ≈ ' + sci(prod, 4) + ' J s   =  ' +
        num(prod / C.h, 4) + ' h        (h = ' + sci(C.h, 4) + ' J s)';
      rows[4].textContent = 'the λ in p = h/λ cancels the λ in sin θ = λ/Δx, leaving Δpₓ ≈ h/Δx';
      rows[5].textContent = 'and sin θ ≤ 1 forces λ ≤ Δx: you cannot localise better than a ' +
        'wavelength (Abbe)';

      S.op(gIn, M.beat(p, 0.02, 0.14));
      S.op(gSlit, M.beat(p, 0.08, 0.20));
      S.op(gFan, M.beat(p, 0.18, 0.32));
      S.op(minU, M.beat(p, 0.30, 0.42));
      S.op(minL, M.beat(p, 0.30, 0.42));
      S.op(thetaLbl, M.beat(p, 0.32, 0.44));
      S.op(gIns, M.beat(p, 0.42, 0.56));
      rows.forEach(function (r, i) { S.op(r, M.beat(p, 0.50 + i * 0.065, 0.62 + i * 0.065)); });
      S.op(verdict, M.beat(p, 0.88, 0.98));
    };
  });

  /* ======================================================================
     5. What the estimate is worth. The heuristic against the theorem, with
        the factor between them computed from the constants themselves.
     =================================================================== */

  A.scene('microscope-algebra', function (root) {
    var W = 1180, H = 720;
    var svg = S.root(W, H,
      'The microscope estimate and several equally defensible variants of it, plotted in ' +
      'multiples of the exact bound h-bar over two. All of them land between three and ' +
      'twenty-five floors up, which is why the argument cannot fix the constant.');
    root.appendChild(svg);

    /* h in units of hbar/2, from the SI values, not from 4 pi. */
    var floors = C.h / (C.hbar / 2);
    var fourPi = 4 * Math.PI;

    var gTop = S.g({});
    svg.appendChild(gTop);
    [['ℏ ≡ h/2π,   so   h = 2πℏ   and   h ÷ (ℏ/2) = 4π', 's-lbl-b', 13],
     ['from the SI constants:  h/(ℏ/2) = ' + num(floors, 9), 's-lbl-q', 12],
     ['from geometry:          4π       = ' + num(fourPi, 9) +
      '     they differ by ' + sci(Math.abs(floors - fourPi), 1), 's-lbl-q', 12],
     ['the microscope lands a factor ' + num(fourPi, 2) +
      ' above the floor. that is not evidence for the floor.', 's-lbl-f', 12]
    ].forEach(function (r, i) {
      put(gTop, 60, 62 + i * 30, r[0], r[1], 'start', r[2]);
    });

    /* --- the chart --- */
    var cx0 = 320, cx1 = 1080, axY = 560, top = 200;
    var VMAX = 28;
    var PXc = function (v) { return M.map(v, 0, VMAX, cx0, cx1); };

    var gAx = S.g({});
    svg.appendChild(gAx);
    gAx.appendChild(S.line(cx0, axY, cx1, axY, 's-axis'));
    for (var tk = 0; tk <= 28; tk += 4) {
      gAx.appendChild(S.line(PXc(tk), axY, PXc(tk), axY + 6, 's-axis'));
      put(gAx, PXc(tk), axY + 20, String(tk), 's-tick', 'middle', 9);
    }
    put(gAx, cx1, axY + 40, 'the product Δx Δp, in multiples of ℏ/2', 's-lbl', 'end', 12);
    var floorLine = S.line(PXc(1), top - 12, PXc(1), axY, 's-fail');
    gAx.appendChild(floorLine);
    var forbid = S.rect(cx0, top - 12, PXc(1) - cx0, axY - top + 12, null);
    forbid.setAttribute('fill', 'var(--fail)');
    forbid.setAttribute('fill-opacity', '0.09');
    gAx.appendChild(forbid);
    put(gAx, cx0 + 6, top - 22, 'forbidden', 's-lbl-f', 'start', 11);

    var rows = [
      { name: 'the theorem,  ℏ/2', v: 1, cls: 's-quantum', lc: 's-lbl-q',
        note: 'attained, and only by a Gaussian' },
      { name: 'range → s.d.,  h/√12', v: floors / Math.sqrt(12), cls: 's-fail', lc: 's-lbl-f',
        note: 'if the cone is read as a flat distribution' },
      { name: 'the microscope,  h', v: floors, cls: 's-fail', lc: 's-lbl-f',
        note: 'the handout’s chain, one-sided cone' },
      { name: 'Rayleigh 1.22,  1.22h', v: 1.22 * floors, cls: 's-fail', lc: 's-lbl-f',
        note: 'a round aperture rather than a slit' },
      { name: 'two-sided cone,  2h', v: 2 * floors, cls: 's-fail', lc: 's-lbl-f',
        note: 'the photon may deflect either way' }
    ];
    var built = rows.map(function (r, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = top + 22 + i * 62;
      put(g, 60, y + 4, r.name, r.lc, 'start', 12);
      put(g, 60, y + 22, r.note, 's-lbl', 'start', 10);
      var bar = S.rect(cx0, y - 9, Math.max(2, PXc(r.v) - cx0), 18, null);
      bar.setAttribute('fill', r.v === 1 ? 'var(--quantum)' : 'var(--fail)');
      bar.setAttribute('fill-opacity', r.v === 1 ? '0.85' : '0.42');
      g.appendChild(bar);
      put(g, PXc(r.v) + 10, y + 5, num(r.v, 3) + ' × (ℏ/2)', r.lc, 'start', 11);
      return g;
    });

    var gEnd = S.g({});
    svg.appendChild(gEnd);
    [['the five bars are all the same argument, with equally reasonable readings of "range"',
      's-lbl', 12],
     ['so the microscope fixes the scale ~ h and the 1/Δx dependence, and nothing beyond that',
      's-lbl-b', 12],
     ['the constant ℏ/2 comes from ½|⟨[x̂,p̂]⟩| = ½|iℏ| through Cauchy–Schwarz, and from nowhere else',
      's-lbl-q', 12]
    ].forEach(function (r, i) {
      put(gEnd, 60, 630 + i * 26, r[0], r[1], 'start', r[2]);
    });

    return function (p) {
      S.op(gTop, M.beat(p, 0.02, 0.18));
      S.op(gAx, M.beat(p, 0.14, 0.28));
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.26 + i * 0.09, 0.40 + i * 0.09)); });
      S.op(gEnd, M.beat(p, 0.76, 0.92));
    };
  });

  /* ======================================================================
     6. Question 1.12.2, answered. Turn Planck's constant down and watch the
        momentum distribution collapse; then list what the theorem uses.
     =================================================================== */

  A.scene('why-uncertainty', function (root) {
    var W = 1220, H = 900;
    var svg = S.root(W, H,
      'One fixed wave packet, Fourier transformed with a Planck constant that is dialled ' +
      'down towards zero. The momentum distribution collapses to a spike, the bound goes to ' +
      'zero with it, and beneath the two plots is a ledger of what the theorem actually ' +
      'uses and what it does not.');
    root.appendChild(svg);

    var SIG = 1e-10;               /* the packet is 1 angstrom wide, always */
    var ax0 = 90, ax1 = 540, bx0 = 660, bx1 = 1130, yT = 116, yB = 320;
    var XV = 3.6 * SIG;
    var PFULL = 3.4 * (C.hbar / (2 * SIG));

    var PXa = function (x) { return M.map(x, -XV, XV, ax0, ax1); };
    var PXb = function (q) { return M.map(q, -PFULL, PFULL, bx0, bx1); };

    svg.appendChild(S.gridLines(ax0, yT, ax1, yB, 6, 3));
    svg.appendChild(S.axes(ax0, yT, ax1, yB, 'x   (±3.6 Å)', null));
    svg.appendChild(S.gridLines(bx0, yT, bx1, yB, 6, 3));
    svg.appendChild(S.axes(bx0, yT, bx1, yB, 'p   (axis fixed)', null));
    put(svg, ax0, yT - 30, '|ψ(x)|²  —  held fixed, whatever ℏ is', 's-lbl-p', 'start', 12);
    put(svg, bx0, yT - 30, '|φ(p)|²  —  scaled to the same height', 's-lbl-q', 'start', 12);

    var fillA = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.20', stroke: 'none' });
    var curveA = S.path('', 's-prob');
    svg.appendChild(fillA); svg.appendChild(curveA);
    var fillB = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.20', stroke: 'none' });
    var curveB = S.path('', 's-quantum');
    svg.appendChild(fillB); svg.appendChild(curveB);

    /* The packet never changes, so build it once. */
    var NX = 240, X = 7 * SIG, hx = X / NX, i;
    var xs = [], ps = [], ps2 = [];
    for (i = 0; i <= NX; i++) {
      xs.push(i * hx);
      ps.push(Math.exp(-Math.pow(i * hx, 2) / (4 * SIG * SIG)));
    }
    var Zx0 = 0;
    for (i = 0; i <= NX; i++) ps2.push(ps[i] * ps[i]);
    Zx0 = 2 * integrate(xs, ps2);
    for (i = 0; i <= NX; i++) { ps[i] /= Math.sqrt(Zx0); ps2[i] = ps[i] * ps[i]; }
    var xx2 = [];
    for (i = 0; i <= NX; i++) xx2.push(xs[i] * xs[i] * ps2[i]);
    var DX = Math.sqrt(Math.max(0, 2 * integrate(xs, xx2)));

    var aPts = S.sample(360, -XV, XV, function (v) {
      return [PXa(v), M.map(at(xs, ps2, Math.abs(v)), 0, at(xs, ps2, 0) * 1.15, yB, yT)];
    });
    S.setD(curveA, S.polyD(aPts));
    fillA.setAttribute('d', S.areaD(aPts, yB));
    var bandA = S.rect(PXa(-DX), yT, PXa(DX) - PXa(-DX), yB - yT, null);
    bandA.setAttribute('fill', 'var(--probability)');
    bandA.setAttribute('fill-opacity', '0.14');
    svg.appendChild(bandA);
    put(svg, (ax0 + ax1) / 2, yB + 22, 'Δx = ' + num(DX * 1e10, 4) + ' Å, measured',
      's-lbl-p', 'middle', 12);
    var lblB = put(svg, (bx0 + bx1) / 2, yB + 22, '', 's-lbl-q', 'middle', 12);

    var dial = put(svg, W / 2, 74, '', 's-lbl-b', 'middle', 14);
    var readout = [];
    for (var ri = 0; ri < 4; ri++) {
      readout.push(put(svg, 90, 380 + ri * 26, '', ri === 2 ? 's-lbl-b' : 's-lbl', 'start', 12));
    }

    /* --- the ledger --- */
    var gLed = S.g({});
    svg.appendChild(gLed);
    card(gLed, 60, 508, 540, 216, 'var(--quantum)');
    card(gLed, 640, 508, 520, 216, 'var(--fail)');
    put(gLed, 84, 536, 'what the bound is built from', 's-lbl-q', 'start', 13);
    put(gLed, 664, 536, 'what never appears in it', 's-lbl-f', 'start', 13);
    ['ψ is normalisable:  ∫|ψ|² dx = 1',
     'the commutator:  [x̂, p̂] = iℏ',
     'the Cauchy–Schwarz inequality in L²',
     'the fact that ψ(x) and φ(p) are a Fourier pair',
     'nothing else at all'
    ].forEach(function (s, i2) {
      put(gLed, 84, 570 + i2 * 30, '·  ' + s, 's-lbl', 'start', 12);
    });
    ['no photon, no lens, no microscope',
     'no wavelength belonging to any probe',
     'no disturbance of anything by anything',
     'measure x on half the copies, p on the other half:',
     'no particle is touched twice, and the bound still holds'
    ].forEach(function (s, i2) {
      put(gLed, 664, 570 + i2 * 30, '·  ' + s, 's-lbl', 'start', 12);
    });

    var close1 = put(svg, W / 2, 772,
      'so (1.12.3) constrains the state ψ, not the delicacy of an apparatus',
      's-lbl-b', 'middle', 13);
    var close2 = put(svg, W / 2, 800,
      'a short pulse cannot be monochromatic; p = ℏk turns that into the uncertainty principle',
      's-lbl-q', 'middle', 12);
    var close3 = put(svg, W / 2, 828,
      'with ℏ = 0 the packet has no wavelength, φ collapses to a point, and both are exact',
      's-lbl-w', 'middle', 12);
    var close4 = put(svg, W / 2, 862,
      'which is the handout’s own closing sentence, and it is right',
      's-lbl', 'middle', 12);

    var NP = 200;

    return function (p) {
      /* Planck's constant, as a fraction of its real value. */
      var frac = M.lerp(1.0, 0.06, M.easeInOut(M.beat(p, 0.30, 0.86)));
      var hb = C.hbar * frac;

      /* φ(p) recomputed with this ħ, on a grid that follows the spike in. */
      var Pmax = 8 * hb / (2 * SIG), hp = Pmax / NP, j, q;
      var qs = [], phi2 = [], pref = 2 / Math.sqrt(M.TAU * hb);
      for (j = 0; j <= NP; j++) {
        q = j * hp;
        var s = 0.5 * (ps[0] + ps[NX] * Math.cos(q * xs[NX] / hb));
        for (i = 1; i < NX; i++) s += ps[i] * Math.cos(q * xs[i] / hb);
        var ph = pref * s * hx;
        qs.push(q);
        phi2.push(ph * ph);
      }
      var Zp = 2 * integrate(qs, phi2);
      var qq2 = [];
      for (j = 0; j <= NP; j++) qq2.push(qs[j] * qs[j] * phi2[j]);
      var DP = Math.sqrt(Math.max(0, 2 * integrate(qs, qq2) / Zp));
      var pk = phi2[0];

      /* Drawn on the fixed axis, so the collapse is visible. */
      var bPts = S.sample(420, -PFULL, PFULL, function (v) {
        var a = Math.abs(v);
        var val = (a > Pmax) ? 0 : at(qs, phi2, a);
        return [PXb(v), M.map(val / pk, 0, 1.15, yB, yT)];
      });
      S.setD(curveB, S.polyD(bPts));
      fillB.setAttribute('d', S.areaD(bPts, yB));
      lblB.textContent = 'Δp = ' + sci(DP, 3) + ' kg m s⁻¹';

      dial.textContent = 'ℏ turned down to ' + num(frac, 3) + ' of its real value';

      var prod = DX * DP;
      var dv = DP / C.me;
      var lamdB = (C.h * frac) / (C.hbar / (2 * SIG));
      readout[0].textContent = 'Δx = ' + num(DX * 1e10, 4) + ' Å, unchanged      Δp = ' +
        sci(DP, 4) + ' kg m s⁻¹, measured from the right-hand curve';
      readout[1].textContent = 'the electron’s velocity is uncertain by Δv = Δp/mₑ = ' +
        sci(dv, 3) + ' m s⁻¹';
      readout[2].textContent = 'Δx Δp = ' + sci(prod, 4) + ' J s      ℏ_eff/2 = ' +
        sci(hb / 2, 4) + ' J s      ratio ' + num(prod / (hb / 2), 4) +
        ' — saturated, but the floor itself has moved';
      readout[3].textContent = 'de Broglie wavelength at this momentum: λ = h_eff/p = ' +
        sci(lamdB, 3) + ' m — the wave shrinks away with ℏ';

      S.op(curveA, M.beat(p, 0.02, 0.14));
      S.op(fillA, M.beat(p, 0.04, 0.16));
      S.op(bandA, M.beat(p, 0.10, 0.22));
      S.op(curveB, M.beat(p, 0.08, 0.20));
      S.op(fillB, M.beat(p, 0.10, 0.24));
      S.op(lblB, M.beat(p, 0.14, 0.26));
      S.op(dial, M.beat(p, 0.24, 0.34));
      readout.forEach(function (r, i2) { S.op(r, M.beat(p, 0.30 + i2 * 0.06, 0.42 + i2 * 0.06)); });
      S.op(gLed, M.beat(p, 0.58, 0.74));
      S.op(close1, M.beat(p, 0.76, 0.86));
      S.op(close2, M.beat(p, 0.80, 0.90));
      S.op(close3, M.beat(p, 0.85, 0.94));
      S.op(close4, M.beat(p, 0.90, 0.99));
    };
  });
})(window.A = window.A || {});
