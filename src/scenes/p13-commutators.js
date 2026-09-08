/* Section 1.13: commutation relations between position and momentum. The two
   orders of operation written out in full, the operator identity that survives
   when the wavefunction cancels, the case that commutes and why, the whole
   table of commutators as a Kronecker delta, the add-and-subtract identity for
   a product, and the link forward to the bound that a non-zero commutator puts
   on how sharp a pair of observables can be.

   Every number these scenes print is differentiated, summed or integrated on
   the page. Nothing is a transcribed result: the commutators are evaluated by
   finite differences on real test functions, and the widths in the last scene
   are moments of the distributions that are drawn. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;
  var C = M.C;

  /* ------------------------------------------------------------- utils --- */

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
  /* Several labels here line two columns up by padding with spaces, and SVG
     collapses runs of whitespace unless told not to. */
  function put(parent, x, y, str, cls, anchor, size) {
    var t = S.text(x, y, str, cls, anchor);
    if (size) t.setAttribute('font-size', String(size));
    t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    parent.appendChild(t);
    return t;
  }
  function card(parent, x, y, w, h, stroke) {
    var r = S.rect(x, y, w, h, 's-ghost');
    r.setAttribute('fill', 'var(--surface)');
    r.setAttribute('rx', '3');
    if (stroke) r.setAttribute('stroke', stroke);
    parent.appendChild(r);
    return r;
  }
  /* A horizontal span marker with a caption. */
  function span(parent, xa, xb, y, label, cls) {
    var g = S.g({});
    parent.appendChild(g);
    g.appendChild(S.line(xa, y - 5, xa, y + 5, 's-axis'));
    g.appendChild(S.line(xb, y - 5, xb, y + 5, 's-axis'));
    g.appendChild(S.line(xa, y, xb, y, 's-axis s-dash'));
    put(g, (xa + xb) / 2, y - 9, label, cls || 's-lbl-b', 'middle', 11);
    return g;
  }

  /* Fourth-order central first derivative on a uniform grid. Two points are
     lost at each end, so out[k] holds the derivative at input index k + 2. */
  function d1(v, h) {
    var out = [], i;
    for (i = 2; i < v.length - 2; i++) {
      out.push((-v[i + 2] + 8 * v[i + 1] - 8 * v[i - 1] + v[i - 2]) / (12 * h));
    }
    return out;
  }
  /* n applications of the above; the index shift is 2n. */
  function derivN(v, h, n) {
    var r = v, k;
    for (k = 0; k < n; k++) r = d1(r, h);
    return r;
  }
  /* Trapezoidal integral of f sampled on xs. */
  function integrate(xs, fs) {
    var s = 0, i;
    for (i = 1; i < xs.length; i++) s += 0.5 * (fs[i] + fs[i - 1]) * (xs[i] - xs[i - 1]);
    return s;
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

  /* Build the three functions that the first two scenes compare, for one test
     wavefunction on [x0, x1]. Everything is a finite difference of the sampled
     function; nothing uses the product rule the scenes are about to prove.

     f1 = d/dx (x psi)        the order that puts x inside the derivative
     f2 = x . d(psi)/dx       the order that leaves it outside
     df = f1 - f2             which the algebra claims is psi itself          */
  function orderPair(fn, x0, x1, N) {
    var h = (x1 - x0) / N, xs = [], ps = [], gs = [], i, x;
    for (i = 0; i <= N; i++) {
      x = x0 + i * h;
      xs.push(x); ps.push(fn(x)); gs.push(x * fn(x));
    }
    var dps = d1(ps, h), dgs = d1(gs, h);
    var X = [], F1 = [], F2 = [], DF = [], P = [], worst = 0, vmax = 0;
    for (i = 2; i <= N - 2; i++) {
      var a = dgs[i - 2], b = xs[i] * dps[i - 2];
      X.push(xs[i]); F1.push(a); F2.push(b); DF.push(a - b); P.push(ps[i]);
      var g = Math.abs((a - b) - ps[i]);
      if (g > worst) worst = g;
      vmax = Math.max(vmax, Math.abs(a), Math.abs(b), Math.abs(ps[i]));
    }
    return { x: X, f1: F1, f2: F2, df: DF, p: P, worst: worst, vmax: vmax };
  }

  /* =====================================================================
     1. The two orders, side by side. One branch puts the coordinate inside
        the derivative and the product rule throws off a term; the other
        does not. The difference is computed, not asserted.
     ================================================================== */

  A.scene('order-matters', function (root) {
    var W = 1200, H = 900;
    var svg = S.root(W, H,
      'The position and momentum operators applied to the same wavefunction in both orders. ' +
      'Applying x first puts the coordinate inside the derivative, so the product rule throws ' +
      'off an extra term; applying it second leaves the coordinate outside and throws off ' +
      'nothing. The difference between the two results is computed for a real wavefunction ' +
      'and is the wavefunction itself.');
    root.appendChild(svg);

    put(svg, W / 2, 40, 'one wavefunction, two orders of operation', 's-lbl-b', 'middle', 15);

    var CA = 62, CB = 646;
    var hdA = put(svg, CA, 76, 'apply x̂ first, then p̂ₓ   →   p̂ₓ x̂ ψ', 's-lbl-q', 'start', 13);
    var hdB = put(svg, CB, 76, 'apply p̂ₓ first, then x̂   →   x̂ p̂ₓ ψ', 's-lbl-w', 'start', 13);
    var divide = S.line(620, 62, 620, 328, 's-axis s-dash');
    svg.appendChild(divide);

    var LY = [114, 146, 180, 212, 244, 278, 310];
    var textA = [
      ['p̂ₓ x̂ ψ  =  p̂ₓ ( x ψ )', 's-lbl-b', 13],
      ['=  −iℏ ∂/∂x ( x ψ )', 's-lbl-b', 13],
      ['the x sits inside the derivative, so the product rule fires', 's-lbl', 12],
      ['∂/∂x ( x ψ )  =  (∂x/∂x) ψ  +  x ∂ψ/∂x', 's-lbl-q', 12],
      ['∂x/∂x = 1, and that single 1 is the whole story', 's-lbl-q', 12],
      ['=  −iℏ ψ  −  iℏ x ∂ψ/∂x', 's-lbl-b', 13],
      ['an extra term appears', 's-lbl-q', 12]
    ];
    var textB = [
      ['x̂ p̂ₓ ψ  =  x̂ ( −iℏ ∂ψ/∂x )', 's-lbl-b', 13],
      ['=  x · ( −iℏ ∂ψ/∂x )', 's-lbl-b', 13],
      ['the x sits outside the derivative and stays there', 's-lbl', 12],
      ['multiplying by x is not a derivative, so nothing is thrown off', 's-lbl-w', 12],
      ['there is no second term to write down', 's-lbl-w', 12],
      ['=  −iℏ x ∂ψ/∂x', 's-lbl-b', 13],
      ['no extra term', 's-lbl-w', 12]
    ];
    var rowsA = textA.map(function (r, i) { return put(svg, CA, LY[i], r[0], r[1], 'start', r[2]); });
    var rowsB = textB.map(function (r, i) { return put(svg, CB, LY[i], r[0], r[1], 'start', r[2]); });

    /* --- the subtraction the handout leaves out --- */
    var gDiff = S.g({});
    svg.appendChild(gDiff);
    card(gDiff, 120, 348, 960, 106, 'var(--quantum)');
    put(gDiff, W / 2, 378,
      '( x̂ p̂ₓ − p̂ₓ x̂ ) ψ  =  [ −iℏ x ∂ψ/∂x ]  −  [ −iℏ ψ − iℏ x ∂ψ/∂x ]',
      's-lbl-b', 'middle', 13);
    put(gDiff, W / 2, 404,
      'distribute the minus sign over both terms of the second bracket',
      's-lbl', 'middle', 12);
    put(gDiff, W / 2, 434,
      '=  −iℏ x ∂ψ/∂x  +  iℏ ψ  +  iℏ x ∂ψ/∂x   =   iℏ ψ', 's-lbl-q', 'middle', 14);

    /* --- and the same three functions, computed --- */
    function testPsi(x) { return Math.exp(-x * x / 2.6) * (1 + 0.15 * x); }
    var D = orderPair(testPsi, -4, 4, 800);

    var px0 = 110, px1 = 860, pyT = 512, pyB = 700;
    var PXf = function (x) { return M.map(x, -4, 4, px0, px1); };
    var PYf = function (v) { return M.map(v, -D.vmax * 1.08, D.vmax * 1.08, pyB, pyT); };

    var gPlot = S.g({});
    svg.appendChild(gPlot);
    put(gPlot, px0, 488,
      'the same three functions for  ψ(x) = e^(−x²/2.6) (1 + 0.15 x)', 's-lbl', 'start', 12);
    gPlot.appendChild(S.line(px0, PYf(0), px1, PYf(0), 's-axis'));
    gPlot.appendChild(S.line(px0, pyT, px0, pyB, 's-axis'));
    put(gPlot, px1, pyB + 20, 'x', 's-lbl', 'end', 12);

    function curve(vals, cls, dash) {
      var pts = [], i;
      for (i = 0; i < D.x.length; i += 2) pts.push([PXf(D.x[i]), PYf(vals[i])]);
      var pth = S.path(S.polyD(pts), cls);
      if (dash) pth.setAttribute('stroke-dasharray', dash);
      gPlot.appendChild(pth);
      return pth;
    }
    var cGhost = curve(D.p, 's-ghost', null);
    var cF1 = curve(D.f1, 's-quantum', null);
    var cF2 = curve(D.f2, 's-wave', null);
    var cDf = curve(D.df, 's-prob', '7 4');

    var gLeg = S.g({});
    svg.appendChild(gLeg);
    var legend = [
      ['∂/∂x ( x ψ )', 's-quantum', 's-lbl-q'],
      ['x ∂ψ/∂x', 's-wave', 's-lbl-w'],
      ['difference, dashed', 's-prob', 's-lbl-p'],
      ['ψ itself', 's-ghost', 's-lbl']
    ];
    legend.forEach(function (L, i) {
      var y = 528 + i * 30;
      var ln = S.line(890, y - 4, 920, y - 4, L[1]);
      if (i === 2) ln.setAttribute('stroke-dasharray', '7 4');
      gLeg.appendChild(ln);
      put(gLeg, 928, y, L[0], L[2], 'start', 12);
    });

    var read1 = put(svg, px0, 742,
      'largest gap between  ∂ₓ(xψ) − x ∂ₓψ  and  ψ  across the plot:  ' + sci(D.worst, 2),
      's-lbl-p', 'start', 12);
    var read2 = put(svg, px0, 766,
      'that is finite-difference error, not a physical difference: the extra term is ψ',
      's-lbl', 'start', 12);

    var v1 = put(svg, W / 2, 812,
      'x̂ then p̂ₓ and p̂ₓ then x̂ are different operations on the same state',
      's-lbl-b', 'middle', 13);
    var v2 = put(svg, W / 2, 844,
      'the gap between them is one term, and that term is iℏ times the state itself',
      's-lbl-q', 'middle', 12);
    var v3 = put(svg, W / 2, 874,
      'so the order in which operators are written is part of the physics',
      's-lbl', 'middle', 12);

    return function (p) {
      S.op(hdA, M.beat(p, 0.01, 0.06));
      S.op(hdB, M.beat(p, 0.02, 0.07));
      S.op(divide, M.beat(p, 0.02, 0.08) * 0.6);
      rowsA.forEach(function (r, i) { S.op(r, M.beat(p, 0.05 + i * 0.045, 0.12 + i * 0.045)); });
      rowsB.forEach(function (r, i) { S.op(r, M.beat(p, 0.06 + i * 0.045, 0.13 + i * 0.045)); });

      S.op(gDiff, M.beat(p, 0.40, 0.50));

      S.op(gPlot, M.beat(p, 0.52, 0.60));
      S.draw(cF1, M.easeOut(M.beat(p, 0.54, 0.66)));
      S.draw(cF2, M.easeOut(M.beat(p, 0.57, 0.69)));
      /* the difference keeps its dash pattern, so it is revealed by opacity */
      S.op(cGhost, M.beat(p, 0.64, 0.72) * 0.8);
      S.op(cDf, M.beat(p, 0.68, 0.78));
      S.op(gLeg, M.beat(p, 0.60, 0.70));

      S.op(read1, M.beat(p, 0.74, 0.82));
      S.op(read2, M.beat(p, 0.78, 0.86));
      S.op(v1, M.beat(p, 0.84, 0.90));
      S.op(v2, M.beat(p, 0.88, 0.94));
      S.op(v3, M.beat(p, 0.92, 0.99));
    };
  });

  /* =====================================================================
     2. The value of the commutator. Four unrelated test functions, the
        commutator evaluated on each, and the same answer every time --
        which is what licenses stripping the wavefunction off.
     ================================================================== */

  A.scene('commutator-value', function (root) {
    var W = 1180, H = 800;
    var svg = S.root(W, H,
      'The commutator of position and momentum evaluated on four unrelated test functions. ' +
      'In every case the result lies exactly on top of the test function itself, which is ' +
      'why the wavefunction can be cancelled and the relation stated as an identity between ' +
      'operators rather than a statement about one state.');
    root.appendChild(svg);

    var title = put(svg, W / 2, 40,
      'the ψ cancels, so the answer is not a function at all', 's-lbl-b', 'middle', 15);

    var TESTS = [
      { name: 'a Gaussian', f: function (x) { return Math.exp(-x * x / 2); } },
      { name: 'an off-centre bump',
        f: function (x) { return Math.exp(-(x - 1.1) * (x - 1.1) * 1.4); } },
      { name: 'an oscillating packet',
        f: function (x) { return Math.exp(-x * x / 4) * Math.cos(3.2 * x); } },
      { name: 'a lopsided state',
        f: function (x) { return Math.exp(-x * x / 2.2) * (1 + 0.7 * x + 0.25 * x * x); } }
    ];

    var panels = TESTS.map(function (T, k) {
      var g = S.g({});
      svg.appendChild(g);
      var x0 = 60 + k * 280, x1 = x0 + 220, yc = 212, amp = 76;
      var D = orderPair(T.f, -3.2, 3.2, 640);
      var PXp = function (x) { return M.map(x, -3.2, 3.2, x0, x1); };
      var PYp = function (v) { return yc - v / (D.vmax * 1.05) * amp; };

      g.appendChild(S.line(x0, yc, x1, yc, 's-axis'));
      put(g, x0 + 110, 114, T.name, 's-lbl-b', 'middle', 12);

      var ptsP = [], ptsD = [], i;
      for (i = 0; i < D.x.length; i += 3) {
        ptsP.push([PXp(D.x[i]), PYp(D.p[i])]);
        ptsD.push([PXp(D.x[i]), PYp(D.df[i])]);
      }
      g.appendChild(S.poly(ptsP, 's-prob'));
      var over = S.poly(ptsD, 's-quantum');
      over.setAttribute('stroke-dasharray', '6 5');
      g.appendChild(over);

      put(g, x0 + 110, 318, 'largest gap  ' + sci(D.worst, 1), 's-lbl', 'middle', 11);
      return g;
    });

    var legend = put(svg, W / 2, 356,
      'violet: ψ        amber dashed: ∂ₓ(xψ) − x ∂ₓψ        they lie on top of each other',
      's-lbl', 'middle', 12);

    var lines = [
      [410, '[ x̂ , p̂ₓ ] ψ  =  iℏ ψ        for every ψ in the domain', 's-lbl-b', 13],
      [440, 'two operators are equal exactly when they agree on every state', 's-lbl', 12],
      [468, 'so the ψ can be dropped, and what is left is an identity between operators', 's-lbl', 12]
    ].map(function (L) { return put(svg, W / 2, L[0], L[1], L[2], 'middle', L[3]); });

    var gHero = S.g({});
    svg.appendChild(gHero);
    card(gHero, 460, 492, 260, 46, 'var(--quantum)');
    put(gHero, W / 2, 524, '[ x̂ , p̂ₓ ]  =  iℏ Î', 's-lbl-q', 'middle', 20);

    var tail = [
      [568, 'Î is the identity operator: the right-hand side is a number times it', 's-lbl', 12],
      [594, 'not a function of x, not a function of ψ, the same in every state', 's-lbl', 12],
      [628, 'iℏ  =  ' + sci(C.h / M.TAU, 6) + ' i J s        computed from ℏ = h/2π', 's-lbl-q', 12],
      [660, 'the handout prints iℏ alone; the left-hand side is an operator, so the right', 's-lbl-f', 12],
      [686, 'must be one too, and the identity operator is what makes the two sides match', 's-lbl-f', 12],
      [730, 'because iℏ ≠ 0, no state is an eigenstate of x̂ and of p̂ₓ at the same time', 's-lbl-b', 13],
      [762, 'a definite position and a definite momentum cannot be held by one state', 's-lbl', 12]
    ].map(function (L) { return put(svg, W / 2, L[0], L[1], L[2], 'middle', L[3]); });

    return function (p) {
      S.op(title, M.beat(p, 0.01, 0.07));
      panels.forEach(function (g, i) { S.op(g, M.beat(p, 0.05 + i * 0.09, 0.20 + i * 0.09)); });
      S.op(legend, M.beat(p, 0.40, 0.48));
      lines.forEach(function (l, i) { S.op(l, M.beat(p, 0.46 + i * 0.06, 0.56 + i * 0.06)); });
      S.op(gHero, M.beat(p, 0.64, 0.72));
      tail.forEach(function (l, i) { S.op(l, M.beat(p, 0.70 + i * 0.038, 0.79 + i * 0.038)); });
    };
  });

  /* =====================================================================
     3. Why x and p_y commute. The same algebra with the derivative taken
        in the other direction, and a picture of the one fact that makes
        the difference: moving along y does not change x.
     ================================================================== */

  A.scene('which-commute', function (root) {
    var W = 1200, H = 880;
    var svg = S.root(W, H,
      'The same manipulation with the derivative taken along y instead of along x. Because ' +
      'x and y are independent coordinates, moving along y leaves the multiplier x untouched, ' +
      'the product rule contributes nothing, and the commutator vanishes. The rays in the ' +
      'lower panel carry the value of x at each step, computed and printed.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var title = put(svg, W / 2, 40,
      'the same algebra with ∂/∂y, and the extra term is gone', 's-lbl-b', 'middle', 15);

    var CA = 62, CB = 646;
    var hdA = put(svg, CA, 76, 'derivative along x   →   [ x̂ , p̂ₓ ]', 's-lbl-q', 'start', 13);
    var hdB = put(svg, CB, 76, 'derivative along y   →   [ x̂ , p̂_y ]', 's-lbl-w', 'start', 13);
    var divide = S.line(620, 62, 620, 300, 's-axis s-dash');
    svg.appendChild(divide);

    var LY = [116, 148, 180, 212, 244, 278];
    var textA = [
      ['p̂ₓ x̂ ψ  =  −iℏ ∂/∂x ( x ψ )', 's-lbl-b', 13],
      ['∂/∂x ( x ψ )  =  (∂x/∂x) ψ  +  x ∂ψ/∂x', 's-lbl-q', 12],
      ['∂x/∂x  =  1', 's-lbl-q', 13],
      ['=  ψ  +  x ∂ψ/∂x', 's-lbl-b', 13],
      ['one term survives the product rule', 's-lbl-q', 12],
      ['[ x̂ , p̂ₓ ] ψ  =  iℏ ψ', 's-lbl-q', 14]
    ];
    var textB = [
      ['p̂_y x̂ ψ  =  −iℏ ∂/∂y ( x ψ )', 's-lbl-b', 13],
      ['∂/∂y ( x ψ )  =  (∂x/∂y) ψ  +  x ∂ψ/∂y', 's-lbl-w', 12],
      ['∂x/∂y  =  0      x and y are independent coordinates', 's-lbl-w', 12],
      ['=  x ∂ψ/∂y', 's-lbl-b', 13],
      ['nothing survives the product rule', 's-lbl-w', 12],
      ['[ x̂ , p̂_y ] ψ  =  0', 's-lbl-w', 14]
    ];
    var rowsA = textA.map(function (r, i) { return put(svg, CA, LY[i], r[0], r[1], 'start', r[2]); });
    var rowsB = textB.map(function (r, i) { return put(svg, CB, LY[i], r[0], r[1], 'start', r[2]); });

    /* --- the two rays, carrying the value of the multiplier x --- */
    var gRay = S.g({});
    svg.appendChild(gRay);
    var ox = 400, oy = 610;
    var RX = function (x) { return M.map(x, 0, 3.4, ox, 870); };
    var RY = function (y) { return M.map(y, 0, 2.4, oy, 360); };
    gRay.appendChild(S.arrow(svg, ox, oy, 880, oy, 'i'));
    gRay.appendChild(S.arrow(svg, ox, oy, ox, 348, 'i'));
    put(gRay, 884, oy + 5, 'x', 's-lbl-b', 'start', 13);
    put(gRay, ox - 10, 344, 'y', 's-lbl-b', 'end', 13);

    var xRay = [0.9, 1.4, 1.9, 2.4, 2.9];
    var yRay = [0.9, 1.2, 1.5, 1.8, 2.1];
    gRay.appendChild(S.arrow(svg, RX(0.9), RY(0.5), RX(3.05), RY(0.5), 'q'));
    gRay.appendChild(S.arrow(svg, RX(0.9), RY(0.5), RX(0.9), RY(2.25), 'w'));

    /* The multiplier is the coordinate x that x-hat multiplies the state by.
       Along the first ray it is read at each dot; along the second it is the
       x of the same vertical line, and both are printed as they come out. */
    function multiplier(pt) { return pt[0]; }
    xRay.forEach(function (xv, i) {
      gRay.appendChild(S.circle(RX(xv), RY(0.5), 4.2, 's-fill-q'));
      /* the first dot sits on the vertical ray, so its label steps aside */
      put(gRay, RX(xv) - (i === 0 ? 9 : 0), RY(0.5) - 12,
        'x = ' + num(multiplier([xv, 0.5]), 1),
        's-lbl-q', i === 0 ? 'end' : 'middle', 11);
    });
    yRay.forEach(function (yv) {
      gRay.appendChild(S.circle(RX(0.9), RY(yv), 4.2, 's-fill-w'));
      put(gRay, RX(0.9) + 13, RY(yv) + 4, 'x = ' + num(multiplier([0.9, yv]), 1),
        's-lbl-w', 'start', 11);
    });
    put(gRay, RX(0.9) + 46, 344,
      'moving in y: the multiplier x does not change', 's-lbl-w', 'start', 12);
    put(gRay, RX(0.9), oy - 18,
      'moving in x: the multiplier x changes', 's-lbl-q', 'start', 12);

    /* Slopes read off the drawn dots, so the 1 and the 0 are measured. */
    var pA = [xRay[0], 0.5], pB = [xRay[4], 0.5];
    var qA = [0.9, yRay[0]], qB = [0.9, yRay[4]];
    var slopeX = (multiplier(pB) - multiplier(pA)) / (pB[0] - pA[0]);
    var slopeY = (multiplier(qB) - multiplier(qA)) / (qB[1] - qA[1]);

    /* --- the same two statements on a genuine two-dimensional psi --- */
    function psi2(x, y) {
      return Math.exp(-(x * x + y * y) / 3) * (1 + 0.3 * x - 0.2 * y + 0.15 * x * y);
    }
    var hh = 0.02, worstY = 0, worstX = 0, ix, iy;
    for (ix = -20; ix <= 20; ix++) {
      for (iy = -20; iy <= 20; iy++) {
        var gx = ix * 0.1, gy = iy * 0.1;
        /* d/dy of (x psi) against x times d(psi)/dy */
        var ay = (-gx * psi2(gx, gy + 2 * hh) + 8 * gx * psi2(gx, gy + hh) -
                  8 * gx * psi2(gx, gy - hh) + gx * psi2(gx, gy - 2 * hh)) / (12 * hh);
        var by = gx * ((-psi2(gx, gy + 2 * hh) + 8 * psi2(gx, gy + hh) -
                        8 * psi2(gx, gy - hh) + psi2(gx, gy - 2 * hh)) / (12 * hh));
        worstY = Math.max(worstY, Math.abs(ay - by));
        /* the same thing along x, where the answer is psi and not zero */
        var ax = (-(gx + 2 * hh) * psi2(gx + 2 * hh, gy) + 8 * (gx + hh) * psi2(gx + hh, gy) -
                  8 * (gx - hh) * psi2(gx - hh, gy) + (gx - 2 * hh) * psi2(gx - 2 * hh, gy)) / (12 * hh);
        var bx = gx * ((-psi2(gx + 2 * hh, gy) + 8 * psi2(gx + hh, gy) -
                        8 * psi2(gx - hh, gy) + psi2(gx - 2 * hh, gy)) / (12 * hh));
        worstX = Math.max(worstX, Math.abs((ax - bx) - psi2(gx, gy)));
      }
    }

    var reads = [
      [676, 'measured along the x-ray:   Δ(multiplier) / Δx  =  ' + num(slopeX, 3), 's-lbl-q', 12],
      [702, 'measured along the y-ray:   Δ(multiplier) / Δy  =  ' + num(slopeY, 3), 's-lbl-w', 12],
      [732, 'on a grid over a two-dimensional ψ:   max | ∂_y(xψ) − x ∂_yψ |  =  ' +
            sci(worstY, 1), 's-lbl-w', 12],
      [758, 'the same grid:   ∂_x(xψ) − x ∂_xψ  matches ψ to  ' + sci(worstX, 1) +
            ', which is the finite difference', 's-lbl-q', 12]
    ].map(function (L) { return put(svg, W / 2, L[0], L[1], L[2], 'middle', L[3]); });

    var v1 = put(svg, W / 2, 804,
      'x̂ and p̂_y commute, so a state can be sharp in both at once', 's-lbl-w', 'middle', 13);
    var v2 = put(svg, W / 2, 836,
      'x̂ and p̂ₓ do not, and no state is sharp in both', 's-lbl-q', 'middle', 13);
    var v3 = put(svg, W / 2, 866,
      'the entire difference is whether ∂xᵢ/∂xⱼ is 1 or 0', 's-lbl-b', 'middle', 12);

    return function (p) {
      S.op(title, M.beat(p, 0.01, 0.07));
      S.op(hdA, M.beat(p, 0.02, 0.08));
      S.op(hdB, M.beat(p, 0.03, 0.09));
      S.op(divide, M.beat(p, 0.03, 0.10) * 0.6);
      rowsA.forEach(function (r, i) { S.op(r, M.beat(p, 0.06 + i * 0.05, 0.14 + i * 0.05)); });
      rowsB.forEach(function (r, i) { S.op(r, M.beat(p, 0.07 + i * 0.05, 0.15 + i * 0.05)); });
      S.op(gRay, M.beat(p, 0.42, 0.56));
      reads.forEach(function (r, i) { S.op(r, M.beat(p, 0.58 + i * 0.055, 0.68 + i * 0.055)); });
      S.op(v1, M.beat(p, 0.84, 0.90));
      S.op(v2, M.beat(p, 0.88, 0.94));
      S.op(v3, M.beat(p, 0.92, 0.99));
    };
  });

  /* =====================================================================
     4. The whole table. Nine position-momentum commutators, nine
        position-position and nine momentum-momentum, every entry
        evaluated by finite differences on one three-dimensional test
        function. The Kronecker delta is the pattern, not the symbol.
     ================================================================== */

  A.scene('commutator-table', function (root) {
    var W = 1240, H = 780;
    var svg = S.root(W, H,
      'A three by three grid of the commutators between the components of position and ' +
      'momentum. Every entry is evaluated numerically on a three-dimensional test function: ' +
      'the diagonal comes out one and everything off it comes out zero, which is the ' +
      'Kronecker delta drawn as a pattern. Two smaller grids show that position commutes ' +
      'with position and momentum with momentum.');
    root.appendChild(svg);

    var title = put(svg, W / 2, 42,
      'nine entries, one rule, and the rule is a pattern', 's-lbl-b', 'middle', 15);

    /* --- the test function and the three derivative directions --- */
    function psi3(q) {
      var x = q[0], y = q[1], z = q[2];
      return Math.exp(-(x * x + y * y + z * z) / 3) *
             (1 + 0.3 * x - 0.2 * y + 0.25 * z + 0.1 * x * y - 0.12 * y * z);
    }
    var hh = 0.02, rStar = [0.6, -0.4, 0.5];
    function shift(q, j, d) { var s = [q[0], q[1], q[2]]; s[j] += d; return s; }
    function Dj(g, q, j) {
      return (-g(shift(q, j, 2 * hh)) + 8 * g(shift(q, j, hh)) -
              8 * g(shift(q, j, -hh)) + g(shift(q, j, -2 * hh))) / (12 * hh);
    }
    var base = psi3(rStar);
    function xpEntry(i, j) {
      var gi = function (q) { return q[i] * psi3(q); };
      return (Dj(gi, rStar, j) - rStar[i] * Dj(psi3, rStar, j)) / base;
    }
    /* Momentum with momentum: the two orders of mixed partial differentiation. */
    var ppWorst = 0, i, j;
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        var a = Dj(function (q) { return Dj(psi3, q, j); }, rStar, i);
        var b = Dj(function (q) { return Dj(psi3, q, i); }, rStar, j);
        ppWorst = Math.max(ppWorst, Math.abs(a - b));
      }
    }
    /* Position with position: ordinary multiplication, so exactly zero. */
    var xxWorst = 0;
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        xxWorst = Math.max(xxWorst,
          Math.abs(rStar[i] * rStar[j] * base - rStar[j] * rStar[i] * base));
      }
    }

    /* --- the main grid --- */
    var CW = 140, CH = 86, GX = 250, GY = 190;
    var colNames = ['p̂ₓ', 'p̂_y', 'p̂_z'];
    var rowNames = ['x̂', 'ŷ', 'ẑ'];

    var gMain = S.g({});
    svg.appendChild(gMain);
    put(gMain, GX + 1.5 * CW, 128, '[ x̂ᵢ , p̂ⱼ ]  evaluated on a test function',
      's-lbl-q', 'middle', 13);

    var diag = S.rect(GX, GY, CW * 3, CH * 3, null);
    diag.setAttribute('fill', 'none');
    gMain.appendChild(diag);
    for (i = 0; i < 3; i++) {
      var hl = S.rect(GX + i * CW, GY + i * CH, CW, CH, null);
      hl.setAttribute('fill', 'var(--quantum)');
      hl.setAttribute('fill-opacity', '0.12');
      gMain.appendChild(hl);
    }
    for (i = 0; i <= 3; i++) {
      gMain.appendChild(S.line(GX, GY + i * CH, GX + 3 * CW, GY + i * CH, 's-grid'));
      gMain.appendChild(S.line(GX + i * CW, GY, GX + i * CW, GY + 3 * CH, 's-grid'));
    }
    for (j = 0; j < 3; j++) {
      put(gMain, GX + (j + 0.5) * CW, GY - 14, colNames[j], 's-lbl-b', 'middle', 14);
    }
    for (i = 0; i < 3; i++) {
      put(gMain, GX - 14, GY + (i + 0.5) * CH + 5, rowNames[i], 's-lbl-b', 'end', 14);
      for (j = 0; j < 3; j++) {
        var v = xpEntry(i, j);
        var cx = GX + (j + 0.5) * CW;
        var cy = GY + (i + 0.5) * CH;
        put(gMain, cx, cy - 2, i === j ? 'iℏ' : '0', i === j ? 's-lbl-q' : 's-lbl', 'middle', 17);
        put(gMain, cx, cy + 22, 'measured ' + num(v, 6), 's-lbl', 'middle', 11);
      }
    }

    /* --- the two grids that are entirely zero --- */
    function smallGrid(x0, y0, title2, names, reason) {
      var g = S.g({});
      svg.appendChild(g);
      var cw = 78, ch = 54;
      put(g, x0 + 1.5 * cw, y0 - 34, title2, 's-lbl-w', 'middle', 13);
      var a, b2;
      for (a = 0; a <= 3; a++) {
        g.appendChild(S.line(x0, y0 + a * ch, x0 + 3 * cw, y0 + a * ch, 's-grid'));
        g.appendChild(S.line(x0 + a * cw, y0, x0 + a * cw, y0 + 3 * ch, 's-grid'));
      }
      for (a = 0; a < 3; a++) {
        put(g, x0 + (a + 0.5) * cw, y0 - 10, names[a], 's-lbl', 'middle', 12);
        put(g, x0 - 10, y0 + (a + 0.5) * ch + 5, names[a], 's-lbl', 'end', 12);
        for (b2 = 0; b2 < 3; b2++) {
          put(g, x0 + (b2 + 0.5) * cw, y0 + (a + 0.5) * ch + 6, '0', 's-lbl-w', 'middle', 15);
        }
      }
      put(g, x0, y0 + 3 * ch + 24, reason, 's-lbl', 'start', 11);
      return g;
    }
    var gXX = smallGrid(840, 196, '[ x̂ᵢ , x̂ⱼ ]', rowNames,
      'numbers multiply in either order:  max ' + sci(xxWorst, 1));
    var gPP = smallGrid(840, 440, '[ p̂ᵢ , p̂ⱼ ]', colNames,
      'mixed partials are equal:  max ' + sci(ppWorst, 1));

    /* --- the reading of the pattern --- */
    var notes = [
      [500, 'the diagonal is 1 and everything off it is 0 — that pattern is δᵢⱼ', 's-lbl-q', 13],
      [528, 'each entry is  [ ∂/∂xⱼ ( xᵢ ψ ) − xᵢ ∂ψ/∂xⱼ ] / ψ , evaluated on the page', 's-lbl', 12],
      [554, '∂xᵢ/∂xⱼ = δᵢⱼ is the only fact any of the nine entries uses', 's-lbl', 12]
    ].map(function (L) { return put(svg, 130, L[0], L[1], L[2], 'start', L[3]); });

    var v1 = put(svg, W / 2, 650,
      '[ x̂ᵢ , p̂ⱼ ]  =  iℏ δᵢⱼ Î          [ x̂ᵢ , x̂ⱼ ]  =  [ p̂ᵢ , p̂ⱼ ]  =  0',
      's-lbl-b', 'middle', 15);
    var v2 = put(svg, W / 2, 686,
      'one operator identity holds the whole table', 's-lbl-q', 'middle', 12);
    var v3 = put(svg, W / 2, 716,
      'the zeros in the three grids are zero for three different reasons, and only one is δᵢⱼ',
      's-lbl', 'middle', 12);

    return function (p) {
      S.op(title, M.beat(p, 0.01, 0.07));
      S.op(gMain, M.beat(p, 0.05, 0.24));
      S.op(gXX, M.beat(p, 0.28, 0.42));
      S.op(gPP, M.beat(p, 0.38, 0.52));
      notes.forEach(function (n, i2) { S.op(n, M.beat(p, 0.54 + i2 * 0.07, 0.66 + i2 * 0.07)); });
      S.op(v1, M.beat(p, 0.80, 0.88));
      S.op(v2, M.beat(p, 0.86, 0.93));
      S.op(v3, M.beat(p, 0.91, 0.99));
    };
  });

  /* =====================================================================
     5. The product identity by adding and subtracting, then applied to
        p squared. The powers are checked by repeated differentiation,
        so the 2 in 2 i hbar p is measured rather than quoted.
     ================================================================== */

  A.scene('commutator-product', function (root) {
    var W = 1200, H = 930;
    var svg = S.root(W, H,
      'The identity for the commutator of a product, derived by adding and subtracting one ' +
      'term so that each half factorises. Applied to momentum squared it gives two i h-bar p. ' +
      'The coefficient is then checked by differentiating a Gaussian repeatedly, for the ' +
      'first four powers of the momentum operator.');
    root.appendChild(svg);

    var title = put(svg, W / 2, 40,
      'add zero, in the one form that makes both halves factorise', 's-lbl-b', 'middle', 15);

    var s0 = put(svg, W / 2, 84,
      '[ Â , B̂Ĉ ]  =  Â B̂ Ĉ  −  B̂ Ĉ Â        neither term factorises as it stands',
      's-lbl', 'middle', 12);
    var s1 = put(svg, W / 2, 114,
      'add zero in the form  − B̂ Â Ĉ  +  B̂ Â Ĉ', 's-lbl-q', 'middle', 13);

    /* --- the four terms as tiles --- */
    var gTiles = S.g({});
    svg.appendChild(gTiles);
    var terms = ['+  Â B̂ Ĉ', '−  B̂ Â Ĉ', '+  B̂ Â Ĉ', '−  B̂ Ĉ Â'];
    var TX = [140, 380, 620, 860], TW = 200;
    terms.forEach(function (s, i) {
      card(gTiles, TX[i], 148, TW, 58, i < 2 ? 'var(--quantum)' : 'var(--wave)');
      put(gTiles, TX[i] + TW / 2, 184, s, i < 2 ? 's-lbl-q' : 's-lbl-w', 'middle', 16);
    });

    var gBr = S.g({});
    svg.appendChild(gBr);
    gBr.appendChild(S.path(S.braceD(TX[0], TX[1] + TW, 214, 9), 's-axis'));
    gBr.appendChild(S.path(S.braceD(TX[2], TX[3] + TW, 214, 9), 's-axis'));

    var f1 = put(svg, (TX[0] + TX[1] + TW) / 2, 258,
      'Â B̂ Ĉ − B̂ Â Ĉ  =  ( Â B̂ − B̂ Â ) Ĉ  =  [ Â , B̂ ] Ĉ', 's-lbl-q', 'middle', 13);
    var f1b = put(svg, (TX[0] + TX[1] + TW) / 2, 286,
      'Ĉ is the rightmost factor in both, so it comes out on the right', 's-lbl', 'middle', 12);
    var f2 = put(svg, (TX[2] + TX[3] + TW) / 2, 258,
      'B̂ Â Ĉ − B̂ Ĉ Â  =  B̂ ( Â Ĉ − Ĉ Â )  =  B̂ [ Â , Ĉ ]', 's-lbl-w', 'middle', 13);
    var f2b = put(svg, (TX[2] + TX[3] + TW) / 2, 286,
      'B̂ is the leftmost factor in both, so it comes out on the left', 's-lbl', 'middle', 12);

    var gRes = S.g({});
    svg.appendChild(gRes);
    card(gRes, 380, 316, 440, 48, 'var(--quantum)');
    put(gRes, W / 2, 348, '[ Â , B̂Ĉ ]  =  B̂ [ Â , Ĉ ]  +  [ Â , B̂ ] Ĉ', 's-lbl-q', 'middle', 17);
    var resNote = put(svg, W / 2, 390,
      'the surviving factors keep their side: B̂ stays left, Ĉ stays right', 's-lbl', 'middle', 12);

    /* --- applied to p squared --- */
    var apply = [
      [438, 'now put  Â = x̂  and  B̂ = Ĉ = p̂ₓ', 's-lbl-b', 13],
      [470, '[ x̂ , p̂ₓ² ]  =  p̂ₓ [ x̂ , p̂ₓ ]  +  [ x̂ , p̂ₓ ] p̂ₓ', 's-lbl-b', 14],
      [500, 'iℏ is a number times the identity, so it commutes with p̂ₓ and can be moved out',
        's-lbl', 12],
      [532, '=  iℏ p̂ₓ  +  iℏ p̂ₓ  =  2 iℏ p̂ₓ', 's-lbl-q', 16]
    ].map(function (L) { return put(svg, W / 2, L[0], L[1], L[2], 'middle', L[3]); });

    /* --- and checked by differentiating, power by power --- */
    var NG = 1200, GX0 = -6, GX1 = 6, hg = (GX1 - GX0) / NG;
    var xs = [], ps = [], gs = [], k, xv;
    for (k = 0; k <= NG; k++) {
      xv = GX0 + k * hg;
      xs.push(xv); ps.push(Math.exp(-xv * xv / 2)); gs.push(xv * Math.exp(-xv * xv / 2));
    }
    var xStar = 0.7, cIdx = Math.round((xStar - GX0) / hg);
    function powerCoeff(n) {
      var dp = derivN(ps, hg, n), dg = derivN(gs, hg, n), dpm = derivN(ps, hg, n - 1);
      var top = dg[cIdx - 2 * n] - xs[cIdx] * dp[cIdx - 2 * n];
      return top / dpm[cIdx - 2 * (n - 1)];
    }

    var gTab = S.g({});
    svg.appendChild(gTab);
    put(gTab, 250, 588,
      'checked by repeated differentiation of  ψ = e^(−x²/2)  at  x = ' + num(xStar, 1),
      's-lbl-b', 'start', 13);
    put(gTab, 250, 618, 'n', 's-lbl-q', 'start', 12);
    put(gTab, 400, 618, 'measured coefficient', 's-lbl-q', 'start', 12);
    put(gTab, 640, 618, 'the identity it gives', 's-lbl-q', 'start', 12);
    gTab.appendChild(S.line(250, 628, 950, 628, 's-axis'));

    var rows = [1, 2, 3, 4].map(function (n, i) {
      var g = S.g({});
      gTab.appendChild(g);
      var y = 654 + i * 30;
      var cf = powerCoeff(n);
      put(g, 250, y, String(n), 's-lbl', 'start', 12);
      put(g, 400, y, num(cf, 6), 's-lbl-b', 'start', 12);
      var rhs = n === 1
        ? '[ x̂ , p̂ₓ ]  =  iℏ Î'
        : '[ x̂ , p̂ₓ' + sup(n) + ' ]  =  ' + n + ' iℏ p̂ₓ' + (n === 2 ? '' : sup(n - 1));
      put(g, 640, y, rhs, n === 2 ? 's-lbl-q' : 's-lbl', 'start', 12);
      return g;
    });

    var tabNote = put(svg, W / 2, 800,
      'the ratio measured is  [ (xψ)⁽ⁿ⁾ − x ψ⁽ⁿ⁾ ] / ψ⁽ⁿ⁻¹⁾ , and it comes out n every time',
      's-lbl', 'middle', 12);
    var tabNote2 = put(svg, W / 2, 826,
      'so  [ x̂ , p̂ₓⁿ ]  =  iℏ n p̂ₓⁿ⁻¹ , which is (1.13.10) applied n − 1 times',
      's-lbl-q', 'middle', 12);

    var v1 = put(svg, W / 2, 872,
      'the same add-and-subtract move proves the double-curl identity in the toolkit',
      's-lbl-b', 'middle', 12);
    var v2 = put(svg, W / 2, 900,
      'and this commutator is what makes  dx̂/dt = p̂/m  come out right', 's-lbl', 'middle', 12);

    return function (p) {
      S.op(title, M.beat(p, 0.01, 0.06));
      S.op(s0, M.beat(p, 0.03, 0.10));
      S.op(s1, M.beat(p, 0.08, 0.15));
      S.op(gTiles, M.beat(p, 0.12, 0.22));
      S.op(gBr, M.beat(p, 0.22, 0.30));
      S.op(f1, M.beat(p, 0.26, 0.34));
      S.op(f1b, M.beat(p, 0.30, 0.38));
      S.op(f2, M.beat(p, 0.32, 0.40));
      S.op(f2b, M.beat(p, 0.36, 0.44));
      S.op(gRes, M.beat(p, 0.42, 0.50));
      S.op(resNote, M.beat(p, 0.47, 0.55));
      apply.forEach(function (l, i) { S.op(l, M.beat(p, 0.52 + i * 0.045, 0.60 + i * 0.045)); });
      S.op(gTab, M.beat(p, 0.70, 0.76));
      rows.forEach(function (r, i) { S.op(r, M.beat(p, 0.72 + i * 0.035, 0.80 + i * 0.035)); });
      S.op(tabNote, M.beat(p, 0.84, 0.90));
      S.op(tabNote2, M.beat(p, 0.87, 0.93));
      S.op(v1, M.beat(p, 0.91, 0.96));
      S.op(v2, M.beat(p, 0.94, 0.99));
    };
  });

  /* =====================================================================
     6. What a non-zero commutator costs. One separable state, three
        distributions, and two products: the pair whose commutator is
        i h-bar cannot go below h-bar over two, and the pair whose
        commutator is zero can be made as sharp as you like.
     ================================================================== */

  A.scene('noncommute-uncertainty', function (root, api) {
    var W = 1240, H = 940;
    var svg = S.root(W, H,
      'A state that is narrow in x and adjustable in y. The product of the position spread ' +
      'and the x-momentum spread sits exactly on h-bar over two and never falls below it; ' +
      'the product of the same position spread with the y-momentum spread slides freely to ' +
      'zero, because the commutator that bounds it is zero. Every width is a moment of the ' +
      'distribution drawn above it.');
    root.appendChild(svg);

    var ANG = 1e-10;
    var title = put(svg, W / 2, 42,
      'the size of the commutator is the size of the floor', 's-lbl-b', 'middle', 15);

    /* --- widths of a real even wavefunction, measured from the curves --- */
    function widths(fn, XMAX, NX, PMAX, NP) {
      var xs = [], ps = [], i, j, hx = XMAX / NX, x;
      for (i = 0; i <= NX; i++) { x = i * hx; xs.push(x); ps.push(fn(x)); }
      var p2 = [], x2 = [];
      for (i = 0; i <= NX; i++) { p2.push(ps[i] * ps[i]); x2.push(xs[i] * xs[i] * ps[i] * ps[i]); }
      var dx = Math.sqrt(Math.max(0, integrate(xs, x2) / integrate(xs, p2)));
      var qs = [], ph2 = [], hp = PMAX / NP, s, ph;
      for (j = 0; j <= NP; j++) {
        var q = j * hp;
        s = 0.5 * (ps[0] + ps[NX] * Math.cos(q * xs[NX] / C.hbar));
        for (i = 1; i < NX; i++) s += ps[i] * Math.cos(q * xs[i] / C.hbar);
        ph = 2 * s * hx;
        qs.push(q); ph2.push(ph * ph);
      }
      var q2 = [];
      for (j = 0; j <= NP; j++) q2.push(qs[j] * qs[j] * ph2[j]);
      var dp = Math.sqrt(Math.max(0, integrate(qs, q2) / integrate(qs, ph2)));
      return { xs: xs, p2: p2, qs: qs, ph2: ph2, dx: dx, dp: dp };
    }
    function gauss(sig) {
      return function (x) { return Math.exp(-x * x / (4 * sig * sig)); };
    }

    var AWID = 1.0 * ANG;                 /* the x factor, held fixed        */
    var Wx = widths(gauss(AWID), 7 * AWID, 160, 8 * C.hbar / (2 * AWID), 140);

    /* A two-bump state, computed once, to show that the floor is a floor. */
    var s2 = 0.8 * ANG, a2 = 2.0 * ANG;
    var Wb = widths(function (x) {
      return Math.exp(-(x - a2) * (x - a2) / (4 * s2 * s2)) +
             Math.exp(-(x + a2) * (x + a2) / (4 * s2 * s2));
    }, 9 * ANG, 600, 7 * C.hbar / s2, 600);
    var bumpRatio = Wb.dx * Wb.dp / (C.hbar / 2);

    /* --- three panels: the state in space, and its two momentum spreads --- */
    var XFULL = 14 * ANG, PFULL = 3.2e-24;
    var pyT = 122, pyB = 288;
    var PAN = [
      { x0: 80, x1: 400, cap: '|ψ|²  along x  (violet)  and along y  (cyan)' },
      { x0: 460, x1: 780, cap: '|φ(pₓ)|²' },
      { x0: 840, x1: 1160, cap: '|φ(p_y)|²' }
    ];
    PAN.forEach(function (P) {
      svg.appendChild(S.line(P.x0, pyB, P.x1, pyB, 's-axis'));
      put(svg, (P.x0 + P.x1) / 2, 100, P.cap, 's-lbl-b', 'middle', 12);
    });
    put(svg, 240, 356, 'x and y in ångström, ±' + num(XFULL / ANG, 0), 's-lbl', 'middle', 11);
    put(svg, 620, 344, 'pₓ, fixed axis ±' + sci(PFULL, 1) + ' kg m s⁻¹', 's-lbl', 'middle', 11);
    put(svg, 1000, 344, 'p_y, the same axis', 's-lbl', 'middle', 11);

    var PXs = function (v) { return M.map(v, -XFULL, XFULL, PAN[0].x0, PAN[0].x1); };
    var PPa = function (v) { return M.map(v, -PFULL, PFULL, PAN[1].x0, PAN[1].x1); };
    var PPb = function (v) { return M.map(v, -PFULL, PFULL, PAN[2].x0, PAN[2].x1); };

    var curveX = S.path('', 's-prob'); svg.appendChild(curveX);
    var curveY = S.path('', 's-wave'); svg.appendChild(curveY);
    var curvePx = S.path('', 's-prob'); svg.appendChild(curvePx);
    var curvePy = S.path('', 's-wave'); svg.appendChild(curvePy);

    var spanX = span(svg, PXs(-Wx.dx), PXs(Wx.dx), 312, 'Δx = ' + num(Wx.dx / ANG, 3) + ' Å', 's-lbl-p');
    var spanPx = span(svg, PPa(-Wx.dp), PPa(Wx.dp), 314, 'Δpₓ = ' + sci(Wx.dp, 3), 's-lbl-p');
    var gSpanY = S.g({}); svg.appendChild(gSpanY);
    var gSpanPy = S.g({}); svg.appendChild(gSpanPy);

    /* --- the two gauges --- */
    var BX0 = 340, BX1 = 1040, VMAX = 3;
    var GB = function (v) { return M.map(v, 0, VMAX, BX0, BX1); };

    function gauge(yTop, label, floorVal, tone) {
      var g = S.g({});
      svg.appendChild(g);
      put(g, BX0 - 16, yTop + 20, label, 's-lbl-b', 'end', 13);
      var forb = S.rect(BX0, yTop, GB(floorVal) - BX0, 30, null);
      forb.setAttribute('fill', 'var(--fail)');
      forb.setAttribute('fill-opacity', '0.16');
      g.appendChild(forb);
      var bar = S.rect(BX0, yTop, BX1 - BX0, 30, 's-ghost');
      bar.setAttribute('fill', 'none');
      g.appendChild(bar);
      var t;
      for (t = 0; t <= VMAX; t++) {
        g.appendChild(S.line(GB(t), yTop + 30, GB(t), yTop + 36, 's-axis'));
        put(g, GB(t), yTop + 52, String(t), 's-tick', 'middle', 11);
      }
      var fl = S.line(GB(floorVal), yTop - 6, GB(floorVal), yTop + 36, 's-fail');
      fl.setAttribute('stroke-width', '2');
      g.appendChild(fl);
      put(g, GB(floorVal), yTop - 12,
        floorVal > 0 ? 'floor  ℏ/2' : 'floor  0', 's-lbl-f', 'middle', 11);
      var needle = S.line(0, yTop - 2, 0, yTop + 32, tone === 'p' ? 's-prob' : 's-wave');
      needle.setAttribute('stroke-width', '3');
      g.appendChild(needle);
      var lbl = S.text(0, yTop + 74, '', tone === 'p' ? 's-lbl-p' : 's-lbl-w', 'middle');
      lbl.setAttribute('font-size', '12');
      g.appendChild(lbl);
      return { g: g, needle: needle, lbl: lbl, yTop: yTop };
    }
    var g1 = gauge(410, 'Δx Δpₓ  in units of ℏ/2', 1, 'p');
    var g2 = gauge(516, 'Δx Δp_y  in units of ℏ/2', 0, 'w');

    /* the two-bump state, marked once on the first gauge */
    var gBump = S.g({});
    svg.appendChild(gBump);
    var bx = GB(Math.min(VMAX, bumpRatio));
    var bmk = S.circle(bx, 425, 5.5, 's-fill-q');
    gBump.appendChild(bmk);
    put(gBump, bx, 398, 'a two-bump state:  ' + num(bumpRatio, 3), 's-lbl-q', 'middle', 11);

    /* --- the chain that produces those two floors --- */
    var chain = [
      [618, 'δA δB  ≥  ½ | ⟨ [ Â , B̂ ] ⟩ |', 's-lbl-q', 17],
      [648, 'Robertson, 1929 — stated here, proved later in the course', 's-lbl-f', 12],
      [682, 'Â = x̂ , B̂ = p̂ₓ :    ⟨ iℏ Î ⟩ = iℏ ⟨ψ|ψ⟩ = iℏ ,    | iℏ | = ℏ', 's-lbl-b', 13],
      [712, 'δx δpₓ  ≥  ℏ/2  =  ' + sci(C.hbar / 2, 6) + ' J s', 's-lbl-p', 14],
      [746, 'Â = x̂ , B̂ = p̂_y :    ⟨ 0 ⟩ = 0 ,    | 0 | = 0', 's-lbl-b', 13],
      [774, 'δx δp_y  ≥  0    —    no restriction at all', 's-lbl-w', 13]
    ].map(function (L) { return put(svg, W / 2, L[0], L[1], L[2], 'middle', L[3]); });

    var caveats = [
      [818, 'the bars matter: ⟨[Â, B̂]⟩ is purely imaginary, and a complex number is not a bound',
        's-lbl', 12],
      [844, 'the bound is state-dependent in general, and can vanish in a particular state',
        's-lbl', 12],
      [870, 'x and p escape that only because [x̂, p̂ₓ] is a number times the identity',
        's-lbl', 12]
    ].map(function (L) { return put(svg, W / 2, L[0], L[1], L[2], 'middle', L[3]); });

    var close = put(svg, W / 2, 912,
      '§1.12 obtained ℏ/2 from Fourier analysis; this says where the ℏ/2 comes from',
      's-lbl-b', 'middle', 13);

    /* the fixed x panel and pₓ panel never change, so draw them once */
    var pk0 = Wx.p2[0], pkp = Wx.ph2[0];
    S.setD(curveX, S.polyD(S.sample(300, -XFULL, XFULL, function (v) {
      return [PXs(v), M.map(at(Wx.xs, Wx.p2, Math.abs(v)) / pk0, 0, 1.1, pyB, pyT)];
    })));
    S.setD(curvePx, S.polyD(S.sample(300, -PFULL, PFULL, function (v) {
      var a = Math.abs(v);
      var val = (a > Wx.qs[Wx.qs.length - 1]) ? 0 : at(Wx.qs, Wx.ph2, a);
      return [PPa(v), M.map(val / pkp, 0, 1.1, pyB, pyT)];
    })));

    var readY = put(svg, W / 2, 380, '', 's-lbl-w', 'middle', 12);

    return function (p) {
      /* The y factor is the only thing that moves: wide state, narrow p_y. */
      var frac = api.reduced ? 0.7 : M.easeInOut(M.beat(p, 0.10, 0.86));
      var b = M.lerp(0.4, 12.0, frac) * ANG;
      var Wy = widths(gauss(b), 7 * b, 160, 8 * C.hbar / (2 * b), 140);

      var pky = Wy.p2[0], pkq = Wy.ph2[0];
      S.setD(curveY, S.polyD(S.sample(300, -XFULL, XFULL, function (v) {
        var a = Math.abs(v);
        var val = (a > Wy.xs[Wy.xs.length - 1]) ? 0 : at(Wy.xs, Wy.p2, a);
        return [PXs(v), M.map(val / pky, 0, 1.1, pyB, pyT)];
      })));
      S.setD(curvePy, S.polyD(S.sample(300, -PFULL, PFULL, function (v) {
        var a = Math.abs(v);
        var val = (a > Wy.qs[Wy.qs.length - 1]) ? 0 : at(Wy.qs, Wy.ph2, a);
        return [PPb(v), M.map(val / pkq, 0, 1.1, pyB, pyT)];
      })));

      while (gSpanY.firstChild) gSpanY.removeChild(gSpanY.firstChild);
      while (gSpanPy.firstChild) gSpanPy.removeChild(gSpanPy.firstChild);
      span(gSpanY, PXs(-Wy.dx), PXs(Wy.dx), 334, 'Δy = ' + num(Wy.dx / ANG, 3) + ' Å', 's-lbl-w');
      span(gSpanPy, PPb(-Wy.dp), PPb(Wy.dp), 314, 'Δp_y = ' + sci(Wy.dp, 3), 's-lbl-w');

      var r1 = Wx.dx * Wx.dp / (C.hbar / 2);
      var r2 = Wx.dx * Wy.dp / (C.hbar / 2);
      readY.textContent = 'the y factor is ' + num(Wy.dx / Wx.dx, 2) +
        ' times as long as the x factor, and its p_y spread is ' +
        num(Wy.dp / Wx.dp, 2) + ' times as wide';

      var n1x = GB(Math.min(VMAX, r1)), n2x = GB(Math.min(VMAX, r2));
      g1.needle.setAttribute('x1', n1x); g1.needle.setAttribute('x2', n1x);
      g2.needle.setAttribute('x1', n2x); g2.needle.setAttribute('x2', n2x);
      g1.lbl.setAttribute('x', n1x);
      g1.lbl.textContent = num(r1, 6) + ' — exactly on the floor';
      g2.lbl.setAttribute('x', n2x);
      g2.lbl.textContent = num(r2, 3) + (r2 < 1
        ? ' — under ℏ/2, and allowed'
        : ' — above ℏ/2, though nothing requires it');

      S.op(title, M.beat(p, 0.01, 0.06));
      S.op(curveX, M.beat(p, 0.03, 0.12));
      S.op(spanX, M.beat(p, 0.06, 0.14));
      S.op(curvePx, M.beat(p, 0.05, 0.14));
      S.op(spanPx, M.beat(p, 0.08, 0.16));
      S.op(curveY, M.beat(p, 0.10, 0.20));
      S.op(gSpanY, M.beat(p, 0.12, 0.22));
      S.op(curvePy, M.beat(p, 0.12, 0.22));
      S.op(gSpanPy, M.beat(p, 0.14, 0.24));
      S.op(readY, M.beat(p, 0.20, 0.30));
      S.op(g1.g, M.beat(p, 0.26, 0.36));
      S.op(g2.g, M.beat(p, 0.32, 0.42));
      S.op(gBump, M.beat(p, 0.46, 0.56));
      chain.forEach(function (l, i) { S.op(l, M.beat(p, 0.52 + i * 0.05, 0.62 + i * 0.05)); });
      caveats.forEach(function (l, i) { S.op(l, M.beat(p, 0.82 + i * 0.04, 0.90 + i * 0.04)); });
      S.op(close, M.beat(p, 0.94, 0.99));
    };
  });
})(window.A = window.A || {});
