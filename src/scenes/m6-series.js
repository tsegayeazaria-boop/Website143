/* Maths companion, §M.6: approximating, summing, separating, and getting an
   actual number out at the end. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* --------------------------------------- Taylor, with the error visible --- */

  A.scene('taylor-approx', function (root) {
    var W = 1150, H = 540;
    var svg = S.root(W, H,
      'The exponential and the straight line one plus x, with the gap between them shaded. ' +
      'Near the origin the gap is invisible; away from it the approximation fails.');
    root.appendChild(svg);

    var x0 = 90, x1 = 600, yB = 400, yT = 80;
    var xMin = -1.2, xMax = 1.6, yMax = 5.0;
    var PX = function (x) { return M.map(x, xMin, xMax, x0, x1); };
    var PY = function (y) { return M.map(y, 0, yMax, yB, yT); };
    svg.appendChild(S.gridLines(x0, yT, x1, yB, 7, 5));
    svg.appendChild(S.axes(x0, yT, x1, yB, 'x', null));
    svg.appendChild(S.line(x0, PY(0), x1, PY(0), 's-axis'));
    svg.appendChild(S.line(PX(0), yT, PX(0), yB, 's-axis'));

    var gap = S.el('path', { fill: 'var(--fail)', 'fill-opacity': '0.16', stroke: 'none' });
    svg.appendChild(gap);
    var expC = S.path('', 's-quantum');
    var linC = S.path('', 's-wave');
    linC.setAttribute('stroke-dasharray', '6 4');
    svg.appendChild(expC); svg.appendChild(linC);
    S.setD(expC, S.polyD(S.sample(200, xMin, xMax, function (x) { return [PX(x), PY(Math.exp(x))]; })));
    S.setD(linC, S.polyD(S.sample(2, xMin, xMax, function (x) { return [PX(x), PY(1 + x)]; })));
    svg.appendChild(S.text(PX(1.15), PY(3.9), 'eˣ', 's-lbl-q', 'start'));
    svg.appendChild(S.text(PX(1.2), PY(2.0), '1 + x', 's-lbl-w', 'start'));

    var cursor = S.line(0, yT, 0, yB, 's-axis s-dash');
    svg.appendChild(cursor);
    var cdot = S.circle(0, 0, 5, 's-fill-f');
    svg.appendChild(cdot);

    var read = S.text(650, 140, '', 's-lbl-b', 'start');
    read.setAttribute('font-size', '14');
    svg.appendChild(read);
    var read2 = S.text(650, 168, '', 's-lbl', 'start');
    svg.appendChild(read2);
    var read3 = S.text(650, 192, '', 's-lbl-f', 'start');
    svg.appendChild(read3);

    var notes = [
      'eˣ = 1 + x + x²/2 + x³/6 + …',
      'so eˣ ≈ 1 + x whenever x is small,',
      'and the first thing you throw away is x²/2.',
      '',
      'in §1.2 the small quantity is x = ℏω/k_BT.',
      'at low frequency it is tiny, the approximation is excellent,',
      'and Planck’s formula collapses onto the classical one.',
      '',
      'at high frequency x is large, the approximation is worthless,',
      'and that difference is the whole of the ultraviolet catastrophe.'
    ].map(function (str, i) {
      var t = S.text(650, 240 + i * 28, str, i === 0 || i === 9 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 0 ? '13' : '11.5');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      var xc = M.lerp(0.05, 1.5, M.easeInOut(M.beat(p, 0.1, 0.92)));
      var pts = S.sample(120, 0, xc, function (x) { return [PX(x), PY(Math.exp(x))]; });
      var back = S.sample(120, xc, 0, function (x) { return [PX(x), PY(1 + x)]; });
      gap.setAttribute('d', S.polyD(pts.concat(back)) + 'Z');

      cursor.setAttribute('x1', PX(xc)); cursor.setAttribute('x2', PX(xc));
      cdot.setAttribute('cx', PX(xc)); cdot.setAttribute('cy', PY(Math.exp(xc)));

      var e = Math.exp(xc), l = 1 + xc;
      read.textContent = 'x = ' + xc.toFixed(2);
      read2.textContent = 'eˣ = ' + e.toFixed(3) + '     1 + x = ' + l.toFixed(3);
      read3.textContent = 'error = ' + ((e - l) / e * 100).toFixed(1) + ' %';
      notes.forEach(function (n, i) { S.op(n, M.beat(p, 0.2 + i * 0.06, 0.34 + i * 0.06)); });
    };
  });

  /* ---------------------------------------------- the geometric series --- */

  A.scene('geometric-blocks', function (root) {
    var W = 980, H = 520;
    var svg = S.root(W, H,
      'Terms of a geometric series laid end to end. Each is a fixed fraction of the one ' +
      'before, and the whole line has a finite length.');
    root.appendChild(svg);

    var x0 = 70, yB = 240, ratio = 0.62, unit = 300, h = 52;
    var terms = [], labels = [], acc = 0;
    for (var s = 0; s < 12; s++) {
      var w = unit * Math.pow(ratio, s);
      var r = S.rect(x0 + acc, yB - h, Math.max(1, w - 2), h, 's-fill-q');
      r.setAttribute('opacity', String(Math.max(0.2, 0.9 - s * 0.07)));
      svg.appendChild(r);
      terms.push(r);
      if (s < 4) {
        var t = S.text(x0 + acc + w / 2, yB - h - 12,
          ['1', 'x', 'x²', 'x³'][s], 's-lbl-q', 'middle');
        svg.appendChild(t);
        labels.push(t);
      }
      acc += w;
    }
    var total = unit / (1 - ratio);
    var tick = S.line(x0 + total, yB - h - 26, x0 + total, yB + 18, 's-axis');
    tick.setAttribute('stroke', 'var(--ink-bright)');
    svg.appendChild(tick);
    svg.appendChild(S.line(x0, yB + 12, x0 + total, yB + 12, 's-axis'));
    var sumLbl = S.text(x0 + total / 2, yB + 40, 'the whole line = 1 / (1 − x)', 's-lbl-b', 'middle');
    sumLbl.setAttribute('font-size', '15');
    svg.appendChild(sumLbl);

    svg.appendChild(S.text(x0, 66, 'Z = 1 + x + x² + x³ + …    with 0 < x < 1', 's-lbl-w', 'start'));

    var proof = [
      'call the sum Z, and multiply it by x:',
      'xZ = x + x² + x³ + …   which is Z with its first term missing',
      'so Z − xZ = 1',
      'Z(1 − x) = 1,   hence Z = 1/(1 − x)',
      '',
      'in §1.2, x = e^{−ℏω/k_BT}, which is less than one because the exponent is negative,',
      'so the partition function is finite and elementary — and that is what makes',
      'the mean energy come out with an ω in it, unlike the classical answer.'
    ].map(function (str, i) {
      var t = S.text(x0, 320 + i * 24, str, i === 3 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 3 ? '13' : '11.5');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      terms.forEach(function (r, i) {
        S.op(r, M.beat(p, 0.03 + i * 0.045, 0.16 + i * 0.045) * Math.max(0.2, 0.9 - i * 0.07));
      });
      labels.forEach(function (l, i) { S.op(l, M.beat(p, 0.03 + i * 0.045, 0.16 + i * 0.045)); });
      S.op(tick, M.beat(p, 0.5, 0.62));
      S.op(sumLbl, M.beat(p, 0.5, 0.62));
      proof.forEach(function (t, i) { S.op(t, M.beat(p, 0.4 + i * 0.07, 0.54 + i * 0.07)); });
    };
  });

  /* ---------------------------- differentiating a log to get an average --- */

  A.scene('log-trick', function (root) {
    var W = 1105, H = 520;
    var svg = S.root(W, H,
      'Why differentiating the logarithm of the partition function produces the average ' +
      'energy: the derivative stamps a factor of minus epsilon onto every term of the sum.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var gSum = S.g({});
    svg.appendChild(gSum);
    gSum.appendChild(S.text(50, 70, 'the average we want', 's-lbl-b', 'start'));
    gSum.appendChild(S.line(50, 82, 420, 82, 's-axis'));
    var want = S.text(50, 118, '⟨E⟩ = Σ εₛ e^{−βεₛ}  /  Σ e^{−βεₛ}', 's-lbl-w', 'start');
    want.setAttribute('font-size', '13.5');
    gSum.appendChild(want);
    gSum.appendChild(S.text(50, 146,
      'the top is the awkward part: every term needs its own εₛ', 's-lbl', 'start'));

    /* The derivative reaching into each term. */
    var gTerms = S.g({});
    svg.appendChild(gTerms);
    var tx = 60, ty = 220;
    for (var s = 0; s < 4; s++) {
      var bx = tx + s * 92;
      var r = S.rect(bx, ty, 82, 46, 's-ghost');
      r.setAttribute('fill', 'none'); r.setAttribute('rx', '2');
      gTerms.appendChild(r);
      var lab = S.text(bx + 41, ty + 28, 'e^{−βε' + ['₀', '₁', '₂', '₃'][s] + '}', 's-lbl-w', 'middle');
      lab.setAttribute('font-size', '11');
      gTerms.appendChild(lab);
      gTerms.appendChild(S.arrow(svg, bx + 41, ty - 30, bx + 41, ty - 6, 'q'));
      var st = S.text(bx + 41, ty + 74, '× (−ε' + ['₀', '₁', '₂', '₃'][s] + ')', 's-lbl-q', 'middle');
      st.setAttribute('font-size', '11');
      gTerms.appendChild(st);
    }
    gTerms.appendChild(S.text(tx, ty - 44, '∂/∂β acts on every term at once', 's-lbl-q', 'start'));
    gTerms.appendChild(S.text(tx, ty + 106,
      'which is exactly the factor the numerator was missing', 's-lbl', 'start'));

    var steps = [
      'Z = Σ e^{−βεₛ}',
      '∂Z/∂β = Σ (−εₛ) e^{−βεₛ} = −Σ εₛ e^{−βεₛ}',
      'so   Σ εₛ e^{−βεₛ} = −∂Z/∂β',
      'divide by Z:   ⟨E⟩ = −(1/Z)(∂Z/∂β)',
      'and (1/Z)(∂Z/∂β) is just ∂(ln Z)/∂β',
      '⟨E⟩ = −∂(ln Z)/∂β'
    ].map(function (str, i) {
      var t = S.text(540, 110 + i * 56, str, i === 5 ? 's-lbl-b' : 's-lbl-w', 'start');
      t.setAttribute('font-size', i === 5 ? '16' : '12.5');
      svg.appendChild(t);
      return t;
    });

    var why = S.text(540, 448,
      'one derivative replaces an infinite weighted sum with a closed form', 's-lbl-q', 'start');
    svg.appendChild(why);
    var why2 = S.text(540, 470,
      'and this is the only reason ⟨E⟩ = ℏω/(e^{βℏω} − 1) is a short calculation', 's-lbl', 'start');
    svg.appendChild(why2);

    return function (p) {
      S.op(gSum, M.beat(p, 0.02, 0.16));
      S.op(gTerms, M.beat(p, 0.16, 0.34));
      steps.forEach(function (t, i) { S.op(t, M.beat(p, 0.26 + i * 0.1, 0.42 + i * 0.1)); });
      S.op(why, M.beat(p, 0.86, 0.95));
      S.op(why2, M.beat(p, 0.9, 0.99));
    };
  });

  /* ------------------------------- integrals that stop, and integrals that don't --- */

  A.scene('improper-integral', function (root) {
    var W = 1000, H = 500;
    var svg = S.root(W, H,
      'Two integrals with the upper limit pushed out. One area settles on a number; the ' +
      'other keeps growing without end.');
    root.appendChild(svg);

    var panels = [
      { title: 'converges', fn: function (x) { return Math.exp(-x); },
        anti: function (x) { return 1 - Math.exp(-x); },
        expr: '∫₀^X e^{−x} dx = 1 − e^{−X}', limit: '→ 1', cls: 's-wave', fill: 'var(--wave)' },
      { title: 'diverges', fn: function (x) { return x * x / 25; },
        anti: function (x) { return x * x * x / 75; },
        expr: '∫₀^X x² dx = X³/3', limit: '→ ∞', cls: 's-fail', fill: 'var(--fail)' }
    ];

    var built = panels.map(function (pn, idx) {
      var x0 = 80 + idx * 490, x1 = x0 + 380, yB = 300, yT = 90;
      var xMax = 5, yMax = 1.05;
      var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
      var PY = function (y) { return M.map(y, 0, yMax, yB, yT); };
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.gridLines(x0, yT, x1, yB, 5, 4));
      g.appendChild(S.axes(x0, yT, x1, yB, 'x', null));
      g.appendChild(S.text(x0, yT - 34, pn.title, pn.cls === 's-wave' ? 's-lbl-w' : 's-lbl-f', 'start'));
      g.appendChild(S.text(x0, yT - 14, pn.expr, 's-lbl', 'start'));
      var curve = S.path('', pn.cls);
      var area = S.el('path', { fill: pn.fill, 'fill-opacity': '0.16', stroke: 'none' });
      g.appendChild(area); g.appendChild(curve);
      S.setD(curve, S.polyD(S.sample(160, 0, xMax, function (x) {
        return [PX(x), PY(Math.min(yMax, pn.fn(x)))];
      })));
      var edge = S.line(0, yT, 0, yB, 's-axis s-dash');
      g.appendChild(edge);
      var read = S.text(x0, yB + 44, '', pn.cls === 's-wave' ? 's-lbl-w' : 's-lbl-f', 'start');
      read.setAttribute('font-size', '14');
      g.appendChild(read);
      var lim = S.text(x0, yB + 72, 'as X grows, the area ' + pn.limit, 's-lbl-b', 'start');
      g.appendChild(lim);
      return { g: g, area: area, edge: edge, read: read, lim: lim, pn: pn, PX: PX, PY: PY, yB: yB, xMax: xMax, yMax: yMax };
    });

    var moral = S.text(W / 2, H - 40,
      '“the integral diverges” is not a mystery: it means the running total has no ceiling',
      's-lbl-b', 'middle');
    svg.appendChild(moral);
    var moral2 = S.text(W / 2, H - 16,
      'and the classical spectral density ∝ ω² is the second kind, which is why (1.2.2) is infinite',
      's-lbl-q', 'middle');
    svg.appendChild(moral2);

    return function (p) {
      var X = M.lerp(0.35, 5, M.easeInOut(M.beat(p, 0.08, 0.92)));
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.02 + i * 0.08, 0.2 + i * 0.08));
        var pts = S.sample(120, 0, X, function (x) {
          return [b.PX(x), b.PY(Math.min(b.yMax, b.pn.fn(x)))];
        });
        b.area.setAttribute('d', S.areaD(pts, b.yB));
        b.edge.setAttribute('x1', b.PX(X)); b.edge.setAttribute('x2', b.PX(X));
        b.read.textContent = 'X = ' + X.toFixed(2) + '     area = ' + b.pn.anti(X).toFixed(2);
        S.op(b.lim, M.beat(p, 0.5, 0.66));
      });
      S.op(moral, M.beat(p, 0.74, 0.88));
      S.op(moral2, M.beat(p, 0.8, 0.94));
    };
  });

  /* ---------------------------------------- separating the variables --- */

  A.scene('separate-variables', function (root) {
    var W = 1000, H = 540;
    var svg = S.root(W, H,
      'The three mechanical moves of separation of variables, applied to the equation for a ' +
      'classical electron spiralling into a proton.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var moves = [
      { n: 'move 1', title: 'get each variable onto its own side',
        a: 'dr/dt = −K / r²', b: 'r² dr = −K dt',
        why: 'multiply both sides by r² dt — treat the derivative as a ratio of little pieces' },
      { n: 'move 2', title: 'put an integral sign on each side',
        a: '∫ r² dr = ∫ −K dt', b: 'r³/3 = −K t + C',
        why: 'each side is now an ordinary integral in one variable' },
      { n: 'move 3', title: 'use the endpoints instead of a constant',
        a: '∫_{a₀}^{0} r² dr = −K ∫_0^{t} dt', b: '−a₀³/3 = −K t',
        why: 'the electron starts at r = a₀ and ends at r = 0' }
    ];

    var built = moves.map(function (m, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = 90 + i * 130;
      var num = S.text(50, y, m.n, 's-lbl-w', 'start');
      num.setAttribute('font-size', '11');
      g.appendChild(num);
      g.appendChild(S.text(140, y, m.title, 's-lbl-b', 'start'));
      var a = S.text(140, y + 34, m.a, 's-lbl', 'start');
      a.setAttribute('font-size', '14');
      g.appendChild(a);
      g.appendChild(S.arrow(svg, 400, y + 29, 470, y + 29, 'q'));
      var b = S.text(490, y + 34, m.b, 's-lbl-w', 'start');
      b.setAttribute('font-size', '14');
      g.appendChild(b);
      var why = S.text(140, y + 60, m.why, 's-lbl', 'start');
      why.setAttribute('font-size', '11');
      g.appendChild(why);
      g.appendChild(S.line(50, y + 78, W - 50, y + 78, 's-grid'));
      return g;
    });

    var result = S.text(W / 2, 494, 't = a₀³ / 3K = 1.6 × 10⁻¹¹ s', 's-lbl-b', 'middle');
    result.setAttribute('font-size', '17');
    svg.appendChild(result);
    var note = S.text(W / 2, 520,
      'the whole method is: separate, integrate, apply the endpoints', 's-lbl-q', 'middle');
    svg.appendChild(note);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.04 + i * 0.2, 0.26 + i * 0.2)); });
      S.op(result, M.beat(p, 0.7, 0.86));
      S.op(note, M.beat(p, 0.8, 0.95));
    };
  });

  /* -------------------------- finding a maximum, and Newton when it is hard --- */

  A.scene('find-the-max', function (root) {
    var W = 1000, H = 620;
    var svg = S.root(W, H,
      'A function and its derivative: the maximum sits where the derivative crosses zero. ' +
      'When that crossing cannot be solved in closed form, Newton’s method walks to it by ' +
      'following tangent lines.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* Top: the function and its derivative. */
    var x0 = 70, x1 = 470, yT = 80, yMid = 230, yB2 = 400;
    var xMax = 8;
    var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
    function u(x) { return M.planckShape(x); }
    var peakVal = u(M.wienX());
    var PYu = function (v) { return M.map(v, 0, peakVal * 1.2, yMid, yT); };

    var gTop = S.g({});
    svg.appendChild(gTop);
    gTop.appendChild(S.line(x0, yMid, x1, yMid, 's-axis'));
    var uC = S.path('', 's-quantum');
    gTop.appendChild(uC);
    S.setD(uC, S.polyD(S.sample(200, 0.02, xMax, function (x) { return [PX(x), PYu(u(x))]; })));
    gTop.appendChild(S.text(x0, yT - 14, 'the function:  x³/(eˣ − 1)', 's-lbl-q', 'start'));

    /* Derivative, by finite difference of the same function. */
    var dvals = S.sample(200, 0.05, xMax, function (x) {
      var hh = 1e-4;
      return [x, (u(x + hh) - u(x - hh)) / (2 * hh)];
    });
    var dMax = 0;
    dvals.forEach(function (d) { if (Math.abs(d[1]) > dMax) dMax = Math.abs(d[1]); });
    var PYd = function (v) { return M.map(v, -dMax * 1.15, dMax * 1.15, yB2, yMid + 40); };
    var gBot = S.g({});
    svg.appendChild(gBot);
    gBot.appendChild(S.line(x0, PYd(0), x1, PYd(0), 's-axis'));
    var dC = S.path('', 's-wave');
    gBot.appendChild(dC);
    S.setD(dC, S.polyD(dvals.map(function (d) { return [PX(d[0]), PYd(d[1])]; })));
    gBot.appendChild(S.text(x0, yMid + 34, 'its derivative', 's-lbl-w', 'start'));

    var xPeak = M.wienX();
    var mark = S.line(PX(xPeak), yT, PX(xPeak), yB2, 's-axis s-dash');
    svg.appendChild(mark);
    var markLbl = S.text(PX(xPeak), yB2 + 22, 'x = ' + xPeak.toFixed(4), 's-lbl-b', 'middle');
    svg.appendChild(markLbl);
    var markLbl2 = S.text(PX(xPeak), yB2 + 42, 'top of one, zero of the other', 's-lbl', 'middle');
    svg.appendChild(markLbl2);

    /* Right: Newton's method on 3(1 - e^-x) - x = 0. */
    var nx0 = 560, nx1 = 950, nyB = 400, nyT = 90;
    function fN(x) { return 3 * (1 - Math.exp(-x)) - x; }
    function dfN(x) { return 3 * Math.exp(-x) - 1; }
    var nxMax = 5, nyRange = 1.3;
    var NX = function (x) { return M.map(x, 0, nxMax, nx0, nx1); };
    var NY = function (v) { return M.map(v, -nyRange, nyRange, nyB, nyT); };
    var gN = S.g({});
    svg.appendChild(gN);
    gN.appendChild(S.line(nx0, NY(0), nx1, NY(0), 's-axis'));
    gN.appendChild(S.line(nx0, nyT, nx0, nyB, 's-axis'));
    var fC = S.path('', 's-quantum');
    gN.appendChild(fC);
    S.setD(fC, S.polyD(S.sample(200, 0, nxMax, function (x) { return [NX(x), NY(fN(x))]; })));
    gN.appendChild(S.text(nx0, nyT - 34, 'Newton on  f(x) = 3(1 − e⁻ˣ) − x', 's-lbl-b', 'start'));
    gN.appendChild(S.text(nx0, nyT - 14, 'walk the tangent down to the axis, and repeat', 's-lbl', 'start'));

    var its = M.wienIterates(1.0, 6);
    var tangent = S.line(0, 0, 0, 0, 's-wave');
    var vert = S.line(0, 0, 0, 0, 's-axis s-dash');
    var nDot = S.circle(0, 0, 5, 's-fill-f');
    gN.appendChild(tangent); gN.appendChild(vert); gN.appendChild(nDot);

    var rows = its.slice(0, 5).map(function (v, i) {
      var t = S.text(nx0, 450 + i * 26,
        'x' + ['₀', '₁', '₂', '₃', '₄'][i] + ' = ' + v.toFixed(8), 's-lbl', 'start');
      t.setAttribute('font-size', '12');
      svg.appendChild(t);
      return t;
    });

    var recipe = S.text(70, 450, 'the recipe:', 's-lbl-b', 'start');
    var recipe2 = S.text(70, 476, '1.  set the derivative to zero', 's-lbl', 'start');
    var recipe3 = S.text(70, 500, '2.  simplify as far as algebra goes', 's-lbl', 'start');
    var recipe4 = S.text(70, 524, '3.  if what is left mixes a polynomial with an', 's-lbl', 'start');
    var recipe5 = S.text(70, 546, '     exponential, there is no closed form —', 's-lbl', 'start');
    var recipe6 = S.text(70, 568, '     so iterate:  xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ)', 's-lbl-w', 'start');
    [recipe, recipe2, recipe3, recipe4, recipe5, recipe6].forEach(function (t) { svg.appendChild(t); });

    return function (p) {
      S.op(gTop, M.beat(p, 0.02, 0.16));
      S.op(gBot, M.beat(p, 0.14, 0.3));
      S.op(mark, M.beat(p, 0.3, 0.42));
      S.op(markLbl, M.beat(p, 0.3, 0.42));
      S.op(markLbl2, M.beat(p, 0.34, 0.46));
      S.op(gN, M.beat(p, 0.4, 0.54));

      var k = M.clamp(Math.floor(M.beat(p, 0.5, 0.92) * 4.999), 0, 4);
      var xn = its[k], fn = fN(xn), slope = dfN(xn);
      nDot.setAttribute('cx', NX(xn)); nDot.setAttribute('cy', NY(fn));
      var xNext = xn - fn / slope;
      tangent.setAttribute('x1', NX(xn)); tangent.setAttribute('y1', NY(fn));
      tangent.setAttribute('x2', NX(xNext)); tangent.setAttribute('y2', NY(0));
      vert.setAttribute('x1', NX(xNext)); vert.setAttribute('y1', NY(0));
      vert.setAttribute('x2', NX(xNext)); vert.setAttribute('y2', NY(fN(xNext)));
      rows.forEach(function (r, i) { S.op(r, i <= k ? 1 : 0.15); });

      [recipe, recipe2, recipe3, recipe4, recipe5, recipe6].forEach(function (t, i) {
        S.op(t, M.beat(p, 0.56 + i * 0.06, 0.7 + i * 0.06));
      });
    };
  });
})(window.A = window.A || {});
