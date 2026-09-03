/* Maths companion, §M.7: time averages, the sinc function, and the two habits
   that catch mistakes — checking units and reading a logarithmic axis. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------- the time average --- */

  A.scene('time-average', function (root) {
    var W = 1120, H = 560;
    var svg = S.root(W, H,
      'Cosine squared plotted with the level one half. The area above the line exactly fills ' +
      'the gaps below it, which is why the average of cosine squared is one half.');
    root.appendChild(svg);

    var x0 = 70, x1 = 640, cy1 = 150, cy2 = 380, amp = 66;

    /* Top: cos and cos squared. */
    var gTop = S.g({});
    svg.appendChild(gTop);
    gTop.appendChild(S.line(x0, cy1, x1, cy1, 's-axis'));
    var cosC = S.path('', 's-wave');
    gTop.appendChild(cosC);
    S.setD(cosC, S.polyD(S.sample(300, 0, 1, function (u) {
      return [M.lerp(x0, x1, u), cy1 - Math.cos(u * 2 * M.TAU) * amp];
    })));
    gTop.appendChild(S.text(x0, cy1 - amp - 26, 'cos φ  —  averages to zero', 's-lbl-w', 'start'));

    /* Bottom: cos squared, the half line, and the matching areas. */
    var gBot = S.g({});
    svg.appendChild(gBot);
    var base = cy2 + amp;
    gBot.appendChild(S.line(x0, base, x1, base, 's-axis'));
    var sqC = S.path('', 's-quantum');
    var fill = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.14', stroke: 'none' });
    gBot.appendChild(fill); gBot.appendChild(sqC);
    var sqPts = S.sample(300, 0, 1, function (u) {
      var c = Math.cos(u * 2 * M.TAU);
      return [M.lerp(x0, x1, u), base - c * c * 2 * amp];
    });
    S.setD(sqC, S.polyD(sqPts));
    fill.setAttribute('d', S.areaD(sqPts, base));
    var halfLine = S.line(x0, base - amp, x1, base - amp, 's-axis');
    halfLine.setAttribute('stroke', 'var(--ink-bright)');
    halfLine.setAttribute('stroke-dasharray', '6 4');
    gBot.appendChild(halfLine);
    gBot.appendChild(S.text(x1 + 8, base - amp + 4, '½', 's-lbl-b', 'start'));
    gBot.appendChild(S.text(x0, cy2 - amp - 26, 'cos²φ  —  never negative, so it cannot average to zero', 's-lbl-q', 'start'));

    var algebra = [
      '⟨f⟩ means the average over one full period:',
      '⟨f⟩ = (1/T) ∫₀^T f dt',
      '',
      'use the identity   cos²φ = ½(1 + cos 2φ)',
      'the ½ is constant, so it averages to ½',
      'the cos 2φ is a cosine, so it averages to 0',
      '⟨cos²φ⟩ = ½',
      '',
      'so I = c ε₀ ⟨E²⟩ = ½ c ε₀ E₀²,',
      'and every factor of ½ in an intensity comes from here.'
    ].map(function (str, i) {
      var t = S.text(690, 110 + i * 40, str,
        i === 6 ? 's-lbl-b' : (i === 8 || i === 9 ? 's-lbl-q' : 's-lbl'), 'start');
      t.setAttribute('font-size', i === 6 ? '16' : '12');
      svg.appendChild(t);
      return t;
    });

    var why = S.text(x0, H - 22,
      'the shaded area above the dashed line is the same as the empty area below it — that is what an average is',
      's-lbl', 'start');
    svg.appendChild(why);

    return function (p) {
      S.op(gTop, M.beat(p, 0.02, 0.18));
      S.op(gBot, M.beat(p, 0.16, 0.34));
      S.op(halfLine, M.beat(p, 0.34, 0.48));
      algebra.forEach(function (t, i) { S.op(t, M.beat(p, 0.12 + i * 0.07, 0.28 + i * 0.07)); });
      S.op(why, M.beat(p, 0.84, 0.96));
    };
  });

  /* -------------------------------------------------- the sinc function --- */

  A.scene('sinc-function', function (root) {
    var W = 1210, H = 540;
    var svg = S.root(W, H,
      'The function sine theta over theta and its square, with the zeros marked at whole ' +
      'multiples of pi.');
    root.appendChild(svg);

    var x0 = 70, x1 = 640, yMid = 180, yB = 440;
    var lim = 3.4;
    var PX = function (b) { return M.map(b, -lim, lim, x0, x1); };

    var gA = S.g({});
    svg.appendChild(gA);
    gA.appendChild(S.line(x0, yMid, x1, yMid, 's-axis'));
    var sc = S.path('', 's-wave');
    gA.appendChild(sc);
    S.setD(sc, S.polyD(S.sample(400, -lim, lim, function (b) {
      return [PX(b), yMid - M.sinc(b * Math.PI) * 90];
    })));
    gA.appendChild(S.text(x0, yMid - 116, 'sin β / β        it equals 1 at β = 0', 's-lbl-w', 'start'));

    var gB = S.g({});
    svg.appendChild(gB);
    gB.appendChild(S.line(x0, yB, x1, yB, 's-axis'));
    var sc2 = S.path('', 's-quantum');
    var fill = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.14', stroke: 'none' });
    gB.appendChild(fill); gB.appendChild(sc2);
    var pts2 = S.sample(500, -lim, lim, function (b) {
      return [PX(b), yB - Math.pow(M.sinc(b * Math.PI), 2) * 170];
    });
    S.setD(sc2, S.polyD(pts2));
    fill.setAttribute('d', S.areaD(pts2, yB));
    gB.appendChild(S.text(x0, yB - 196, '(sin β / β)²      the intensity actually measured', 's-lbl-q', 'start'));

    var gZero = S.g({});
    svg.appendChild(gZero);
    for (var m = -3; m <= 3; m++) {
      if (m === 0) continue;
      var xx = PX(m);
      gZero.appendChild(S.line(xx, yMid - 100, xx, yB, 's-axis s-dash'));
      gZero.appendChild(S.text(xx, yB + 20, (m > 0 ? '' : '−') + Math.abs(m) + 'π', 's-tick', 'middle'));
    }
    gZero.appendChild(S.text(PX(0), yB + 20, '0', 's-tick', 'middle'));

    var lines = [
      'at β = 0 both sin β and β vanish, so the ratio needs a limit:',
      'sin β ≈ β − β³/6 for small β, so sin β / β ≈ 1 − β²/6 → 1',
      '',
      'the zeros are where sin β = 0 but β ≠ 0, that is β = mπ with m ≠ 0',
      '',
      'in §1.3, β = πa sin θ / λ, so a zero means',
      'πa sin θ / λ = mπ,   that is   a sin θ = mλ',
      '',
      'and m = 1 is the first minimum,  sin θ = λ/a,  which is (1.3.1)'
    ].map(function (str, i) {
      var t = S.text(690, 110 + i * 42, str,
        i === 7 ? 's-lbl-b' : (i === 6 ? 's-lbl-w' : 's-lbl'), 'start');
      t.setAttribute('font-size', i === 7 ? '12.5' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      S.op(gA, M.beat(p, 0.02, 0.18));
      S.draw(sc, M.easeOut(M.beat(p, 0.04, 0.32)));
      S.op(gB, M.beat(p, 0.2, 0.36));
      S.op(gZero, M.beat(p, 0.36, 0.5));
      lines.forEach(function (t, i) { S.op(t, M.beat(p, 0.14 + i * 0.08, 0.3 + i * 0.08)); });
    };
  });

  /* ------------------------------------------- checking with units --- */

  A.scene('dimensional-check', function (root) {
    var W = 1040, H = 540;
    var svg = S.root(W, H,
      'Two dimensional checks: that one over the square root of mu-zero epsilon-zero really ' +
      'is a speed, and that the wavefunction has units that depend on how many dimensions ' +
      'you are working in.');
    root.appendChild(svg);

    function panel(x0, title, rows, verdict) {
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.text(x0, 76, title, 's-lbl-b', 'start'));
      g.appendChild(S.line(x0, 88, x0 + 420, 88, 's-axis'));
      var built = rows.map(function (r, i) {
        var y = 124 + i * 52;
        var a = S.text(x0, y, r[0], 's-lbl', 'start');
        a.setAttribute('font-size', '11.5');
        g.appendChild(a);
        var b = S.text(x0 + 12, y + 22, r[1], 's-lbl-w', 'start');
        b.setAttribute('font-size', '13');
        g.appendChild(b);
        return g;
      });
      var v = S.text(x0, 124 + rows.length * 52 + 18, verdict, 's-lbl-q', 'start');
      v.setAttribute('font-size', '13');
      g.appendChild(v);
      return { g: g, v: v };
    }

    var left = panel(50, 'is 1/√(μ₀ε₀) a speed?', [
      ['ε₀ is measured in farads per metre', '[ε₀] = C² N⁻¹ m⁻²'],
      ['μ₀ is measured in henries per metre', '[μ₀] = N A⁻² = N s² C⁻²'],
      ['multiply them: the charges and newtons cancel', '[μ₀ε₀] = s² m⁻²'],
      ['take the reciprocal square root', '[1/√(μ₀ε₀)] = m s⁻¹']
    ], 'a speed — so c had to be one, before any number was put in');

    var right = panel(540, 'what are the units of ψ?', [
      ['normalisation says the total is the pure number 1', '∫ |ψ|² d³r = 1'],
      ['so the integrand times a volume is dimensionless', '[|ψ|²] × L³ = 1'],
      ['in three dimensions', '[ψ] = L^(−3/2) = m^(−3/2)'],
      ['in one dimension the element is only dx', '[ψ] = L^(−1/2) = m^(−1/2)']
    ], 'a field whose units change with the dimension is not a substance');

    var moral = S.text(W / 2, H - 42,
      'units are a free check on every line: if they do not match, the algebra is wrong, and you know it before you look at the numbers',
      's-lbl-b', 'middle');
    moral.setAttribute('font-size', '12');
    svg.appendChild(moral);
    var moral2 = S.text(W / 2, H - 18,
      'it costs ten seconds and catches most sign-and-factor errors before they spread',
      's-lbl', 'middle');
    svg.appendChild(moral2);

    return function (p) {
      S.op(left.g, M.beat(p, 0.02, 0.2));
      S.op(right.g, M.beat(p, 0.24, 0.44));
      S.op(left.v, M.beat(p, 0.4, 0.56));
      S.op(right.v, M.beat(p, 0.56, 0.72));
      S.op(moral, M.beat(p, 0.76, 0.9));
      S.op(moral2, M.beat(p, 0.84, 0.96));
    };
  });

  /* --------------------------------------- reading a logarithmic axis --- */

  A.scene('log-scale', function (root) {
    var W = 1020, H = 460;
    var svg = S.root(W, H,
      'The same four lengths on a linear axis and on a logarithmic one. On the linear axis ' +
      'three of them sit on top of each other at zero.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var items = [
      { v: 6.6e-34, lab: 'a walking person’s wavelength', tone: 'f' },
      { v: 5.0e-11, lab: 'an electron at 600 eV', tone: 'w' },
      { v: 6.2e-8, lab: 'the slit, 62 nm', tone: 'q' },
      { v: 1.0e-3, lab: 'a millimetre', tone: 'i' }
    ];
    var col = { f: ['s-lbl-f', 's-fill-f'], w: ['s-lbl-w', 's-fill-w'],
                q: ['s-lbl-q', 's-fill-q'], i: ['s-lbl-b', 's-fill-i'] };

    /* Linear axis. */
    var lx0 = 90, lx1 = 930, ly = 150;
    var gLin = S.g({});
    svg.appendChild(gLin);
    gLin.appendChild(S.line(lx0, ly, lx1, ly, 's-axis'));
    gLin.appendChild(S.text(lx0, ly - 44, 'a linear axis, 0 to 1 mm', 's-lbl-b', 'start'));
    gLin.appendChild(S.text(lx0, ly + 34, '0', 's-tick', 'middle'));
    gLin.appendChild(S.text(lx1, ly + 34, '1 mm', 's-tick', 'middle'));
    items.forEach(function (it) {
      var px = lx0 + (it.v / 1e-3) * (lx1 - lx0);
      gLin.appendChild(S.circle(px, ly, 5, col[it.tone][1]));
    });
    gLin.appendChild(S.text(lx0 + 14, ly - 18, 'three of the four are stacked here, indistinguishable', 's-lbl', 'start'));

    /* Log axis. */
    var gLog = S.g({});
    svg.appendChild(gLog);
    var gy = 330;
    var lo = -35, hi = -2;
    var LX = function (lg) { return M.map(lg, lo, hi, lx0, lx1); };
    gLog.appendChild(S.line(lx0, gy, lx1, gy, 's-axis'));
    gLog.appendChild(S.text(lx0, gy - 76, 'a logarithmic axis: each step is a factor of ten', 's-lbl-b', 'start'));
    for (var lg = lo; lg <= hi; lg += 3) {
      gLog.appendChild(S.line(LX(lg), gy, LX(lg), gy + 7, 's-axis'));
      var sup = String(lg).replace('-', '⁻').replace(/[0-9]/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; });
      gLog.appendChild(S.text(LX(lg), gy + 24, '10' + sup, 's-tick', 'middle'));
    }
    gLog.appendChild(S.text(lx1, gy + 48, 'metres', 's-lbl', 'end'));
    items.forEach(function (it, i) {
      var px = LX(Math.log10(it.v));
      gLog.appendChild(S.circle(px, gy, 5, col[it.tone][1]));
      var yy = gy - 20 - (i % 2) * 26;
      gLog.appendChild(S.line(px, gy - 6, px, yy + 6, 's-axis s-dash'));
      var anchor = px > W * 0.72 ? 'end' : 'start';
      gLog.appendChild(S.text(px + (anchor === 'end' ? -8 : 8), yy, it.lab, col[it.tone][0], anchor));
    });

    var moral = S.text(W / 2, H - 42,
      'on a log axis, equal distances mean equal ratios — which is the only way to put 10⁻³⁴ and 10⁻³ on one picture',
      's-lbl-b', 'middle');
    moral.setAttribute('font-size', '12');
    svg.appendChild(moral);
    var moral2 = S.text(W / 2, H - 18,
      'and the gap you can see is the answer to “does this object diffract?”', 's-lbl-q', 'middle');
    svg.appendChild(moral2);

    return function (p) {
      S.op(gLin, M.beat(p, 0.02, 0.24));
      S.op(gLog, M.beat(p, 0.3, 0.54));
      S.op(moral, M.beat(p, 0.62, 0.78));
      S.op(moral2, M.beat(p, 0.74, 0.9));
    };
  });

  /* ---------------------------------- closing map: technique to equation --- */

  A.scene('technique-map', function (root) {
    var W = 1040, H = 640;
    var svg = S.root(W, H,
      'Each technique on this page, with the equations of Lecture 1 that it makes possible.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var rows = [
      ['gradient', '(1.1.1)  F = −∇V'],
      ['line integral, conservative fields', 'the very existence of V'],
      ['product rule, exact differentials', '(1.1.2)  E = p²/2m + V'],
      ['curl, and curl of a curl', '(1.1.3)  the wave equation'],
      ['Laplacian, partial derivatives', '(1.1.4)  ω = kc,  and (1.6.1)'],
      ['divergence', 'transversality:  k · n̂ = 0'],
      ['Euler, conjugates, adding arrows', 'Q1.1.4, and every interference term'],
      ['geometric series, log differentiation', '(1.2.3)  Planck’s law'],
      ['Taylor expansion', '(1.2.7)  the classical limit'],
      ['divergent integrals', '(1.2.2)  the ultraviolet catastrophe'],
      ['maximising, Newton’s method', 'ω_peak = 2.82 k_BT/ℏ'],
      ['time averaging, sinc', '(1.3.1)  sin θ = λ/a'],
      ['separation of variables', 'the Larmor fall time, 1.6 × 10⁻¹¹ s'],
      ['divergence theorem', '(1.7.2)  normalisation, preserved for ever'],
      ['dimensional analysis', 'Q1.7.1  [ψ] = L^(−3/2)']
    ];

    var top = 90, rowH = 34;
    svg.appendChild(S.text(50, 64, 'the technique', 's-lbl', 'start'));
    svg.appendChild(S.text(520, 64, 'what it unlocks', 's-lbl', 'start'));
    svg.appendChild(S.line(50, 76, W - 40, 76, 's-axis'));

    var built = rows.map(function (r, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = top + i * rowH;
      g.appendChild(S.text(50, y, r[0], 's-lbl-w', 'start'));
      var a = S.arrow(svg, 452, y - 4, 500, y - 4, 'm');
      a.setAttribute('stroke-opacity', '0.5');
      g.appendChild(a);
      g.appendChild(S.text(520, y, r[1], 's-lbl-q', 'start'));
      g.appendChild(S.line(50, y + 11, W - 40, y + 11, 's-grid'));
      return g;
    });

    var closing = S.text(W / 2, H - 44,
      'none of this is advanced mathematics. It is a dozen habits, applied carefully.',
      's-lbl-b', 'middle');
    closing.setAttribute('font-size', '14');
    svg.appendChild(closing);
    var closing2 = S.text(W / 2, H - 18,
      'the difficulty in Lecture 1 was never the calculus — it was believing the answer',
      's-lbl-q', 'middle');
    svg.appendChild(closing2);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.02 + i * 0.04, 0.16 + i * 0.04)); });
      S.op(closing, M.beat(p, 0.76, 0.9));
      S.op(closing2, M.beat(p, 0.84, 0.97));
    };
  });
})(window.A = window.A || {});
