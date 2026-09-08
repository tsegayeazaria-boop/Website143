/* Section 1.11: position and momentum. The probability profile of Figure 1.11.1
   rebuilt from a computed state, the three measurement protocols and which two of
   them define an average, the expectation value as the balance point of the
   density, the full chain that turns d<x>/dt into an operator sandwich, why the
   operator has to sit between psi* and psi, the general formula, and the first
   Ehrenfest relation drawn against a classical trajectory.

   Every number printed by these scenes is integrated or sampled here. Nothing
   below is a transcribed result. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------------------------ util */

  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³',
              '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function sup(n) {
    var str = String(n), o = '', i;
    for (i = 0; i < str.length; i++) o += SUP[str.charAt(i)] || str.charAt(i);
    return o;
  }
  /* Fixed-point with a real minus sign, and no negative zero. */
  function num(v, d) {
    var str = (Math.abs(v) < 0.5 * Math.pow(10, -d)) ? (0).toFixed(d) : v.toFixed(d);
    return (str.charAt(0) === '-') ? '−' + str.slice(1) : str;
  }
  /* a + b i, with the sign of b carried into the join. */
  function cplx(re, im, d) {
    var s = num(im, d);
    var neg = (s.charAt(0) === '−');
    return num(re, d) + (neg ? ' − ' : ' + ') + (neg ? s.slice(1) : s) + ' i';
  }
  /* Scientific notation with a superscript exponent, for the discarded terms. */
  function sci(v, d) {
    if (!isFinite(v) || v === 0) return '0';
    var e = Math.floor(Math.log(Math.abs(v)) / Math.LN10);
    var m = v / Math.pow(10, e);
    var dd = (d == null) ? 1 : d;
    if (Math.abs(m) >= 10 - 0.5 * Math.pow(10, -dd)) { m /= 10; e += 1; }
    return num(m, dd) + ' × 10' + sup(e);
  }

  /* Combining marks (the hats on x and p) take no width, so ignore them when
     padding a column of labels into alignment. */
  function vlen(str) { return str.replace(/[\u0300-\u036F]/g, '').length; }
  function pad(str, n) { var o = str; while (vlen(o) < n) o += ' '; return o; }

  /* SVG collapses runs of whitespace by default, which would undo every column
     of figures below; preserve it so the readouts line up. */
  function put(parent, x, y, str, cls, anchor, size) {
    var t = S.text(x, y, str, cls, anchor);
    t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'space', 'preserve');
    t.style.whiteSpace = 'pre';
    if (size) t.setAttribute('font-size', String(size));
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

  /* Monospace advance used to lay text runs end to end and to strike them
     through. The scene stylesheet is 0.6em mono plus 0.06em letter spacing. */
  var ADV = 0.66;

  function runText(parent, x, y, parts, size) {
    var cx = x, out = [];
    parts.forEach(function (pt) {
      var t = put(parent, cx, y, pt.s, pt.cls, 'start', size);
      var w = pt.s.length * size * ADV;
      out.push({ el: t, x0: cx, x1: cx + w });
      cx += w;
    });
    return out;
  }

  /* Trapezoidal integral of f sampled on xs. Used for every printed number. */
  function integrate(xs, fs) {
    var s = 0, i;
    for (i = 1; i < xs.length; i++) s += 0.5 * (fs[i] + fs[i - 1]) * (xs[i] - xs[i - 1]);
    return s;
  }

  /* Location of the largest sample, refined by fitting a parabola to its two
     neighbours, so a printed maximum is not just the nearest grid point. */
  function refineMax(xs, fs) {
    var i, im = 1, y0, y1, y2, d, off;
    for (i = 1; i < fs.length - 1; i++) if (fs[i] > fs[im]) im = i;
    y0 = fs[im - 1]; y1 = fs[im]; y2 = fs[im + 1];
    d = y0 - 2 * y1 + y2;
    off = (d === 0) ? 0 : 0.5 * (y0 - y2) / d;
    return xs[im] + off * (xs[im + 1] - xs[im]);
  }

  /* Value of f at an arbitrary x, by linear interpolation on the grid. */
  function at(xs, fs, x) {
    var n = xs.length;
    if (x <= xs[0]) return fs[0];
    if (x >= xs[n - 1]) return fs[n - 1];
    var lo = 0, hi = n - 1, mid;
    while (hi - lo > 1) { mid = (lo + hi) >> 1; if (xs[mid] > x) hi = mid; else lo = mid; }
    var f = (x - xs[lo]) / (xs[hi] - xs[lo]);
    return fs[lo] + f * (fs[hi] - fs[lo]);
  }

  /* Running integral of a density, and the x where it first passes q. */
  function quantile(xs, P, q) {
    var acc = 0, i;
    for (i = 1; i < xs.length; i++) {
      var d = 0.5 * (P[i] + P[i - 1]) * (xs[i] - xs[i - 1]);
      if (acc + d >= q) {
        return xs[i - 1] + (xs[i] - xs[i - 1]) * (d === 0 ? 0 : (q - acc) / d);
      }
      acc += d;
    }
    return xs[xs.length - 1];
  }

  /* Inverse-CDF sampler: hand it a uniform 0..1 and it returns a draw from P. */
  function sampler(xs, P) {
    var cdf = [0], i;
    for (i = 1; i < xs.length; i++) {
      cdf.push(cdf[i - 1] + 0.5 * (P[i] + P[i - 1]) * (xs[i] - xs[i - 1]));
    }
    var tot = cdf[cdf.length - 1];
    return function (u) {
      var target = u * tot, lo = 0, hi = cdf.length - 1, mid, d, f;
      while (hi - lo > 1) { mid = (lo + hi) >> 1; if (cdf[mid] > target) hi = mid; else lo = mid; }
      d = cdf[hi] - cdf[lo];
      f = (d === 0) ? 0 : (target - cdf[lo]) / d;
      return xs[lo] + f * (xs[hi] - xs[lo]);
    };
  }

  /* ---------------------------------------------------------------------- */
  /* The state used in the opening two figures. Two Gaussian lobes subtracted,
     so the density has one genuine maximum and one genuine zero between them
     rather than a dip that merely looks like a zero.                        */

  function figPsi(x) {
    return Math.exp(-Math.pow((x - 3.4) / 1.15, 2)) -
           0.72 * Math.exp(-Math.pow((x - 7.2) / 1.5, 2));
  }

  var FIG = null;
  function figState() {
    if (FIG) return FIG;
    var n = 2200, xa = 0, xb = 11, i, x, xs = [], raw = [];
    for (i = 0; i <= n; i++) {
      x = xa + (xb - xa) * i / n;
      xs.push(x);
      raw.push(Math.pow(figPsi(x), 2));
    }
    var Z = integrate(xs, raw);
    var P = [];
    for (i = 0; i <= n; i++) P.push(raw[i] / Z);

    /* The node: bisect figPsi between the two lobes. */
    var lo = 4.4, hi = 6.0, mid;
    for (i = 0; i < 60; i++) {
      mid = 0.5 * (lo + hi);
      if (figPsi(lo) * figPsi(mid) <= 0) hi = mid; else lo = mid;
    }
    var xC = 0.5 * (lo + hi);
    var xB = refineMax(xs, P);

    var xP = [], x2P = [];
    for (i = 0; i <= n; i++) { xP.push(xs[i] * P[i]); x2P.push(xs[i] * xs[i] * P[i]); }
    var mean = integrate(xs, xP);
    var sd = Math.sqrt(Math.max(0, integrate(xs, x2P) - mean * mean));

    FIG = { xs: xs, P: P, xA: 1.9, xB: xB, xC: xC, mean: mean, sd: sd,
            total: integrate(xs, P), draw: sampler(xs, P) };
    return FIG;
  }

  /* Probability inside [a,b], integrated from the same grid that is drawn. */
  function windowProb(st, a, b) {
    var xs = [], fs = [], n = 400, i, x;
    for (i = 0; i <= n; i++) {
      x = a + (b - a) * i / n;
      xs.push(x);
      fs.push(at(st.xs, st.P, x));
    }
    return integrate(xs, fs);
  }

  /* ======================================================================
     1. Figure 1.11.1, rebuilt so that A, B and C mean something measurable.
     =================================================================== */

  A.scene('density-profile', function (root) {
    var W = 1100, H = 660;
    var svg = S.root(W, H,
      'A probability density plotted against position, with a point B at its maximum, a ' +
      'point C where it vanishes, and the area between A and B shaded and integrated.');
    root.appendChild(svg);

    var st = figState();
    var x0 = 100, x1 = 1030, yT = 90, yB = 400;
    var PXm = function (x) { return M.map(x, 0, 11, x0, x1); };
    var pk = at(st.xs, st.P, st.xB);
    var PYm = function (v) { return M.map(v, 0, pk * 1.18, yB, yT); };

    svg.appendChild(S.gridLines(x0, yT, x1, yB, 11, 4));
    svg.appendChild(S.axes(x0, yT, x1, yB, 'x', null));
    put(svg, x0 - 8, yT - 8, '|ψ(x,t₁)|²', 's-lbl-p', 'end', 12);

    /* The curve, and the shaded probability between A and B. */
    var shade = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.22', stroke: 'none' });
    svg.appendChild(shade);
    var curve = S.path('', 's-prob');
    svg.appendChild(curve);

    var pts = S.sample(600, 0, 11, function (x) { return [PXm(x), PYm(at(st.xs, st.P, x))]; });
    S.setD(curve, S.polyD(pts));
    var shPts = S.sample(300, st.xA, st.xB, function (x) { return [PXm(x), PYm(at(st.xs, st.P, x))]; });
    shade.setAttribute('d', S.areaD(shPts, yB));

    /* A, B, C. */
    function marker(x, letter, cls, note, noteCls, dy) {
      var g = S.g({});
      svg.appendChild(g);
      var l = S.line(PXm(x), yB, PXm(x), PYm(at(st.xs, st.P, x)) - 6, 's-axis s-dash');
      g.appendChild(l);
      var lab = put(g, PXm(x), yB + 24, letter, cls, 'middle', 15);
      lab.setAttribute('letter-spacing', '0');
      if (note) put(g, PXm(x), PYm(at(st.xs, st.P, x)) - dy, note, noteCls, 'middle', 11);
      return g;
    }
    var gA = marker(st.xA, 'A', 's-lbl-b', null, null, 0);
    var gB = marker(st.xB, 'B', 's-lbl-b', 'density largest here', 's-lbl-p', 18);
    var gC = marker(st.xC, 'C', 's-lbl-b', null, null, 0);
    put(gC, PXm(st.xC), yB + 46, 'density exactly zero here', 's-lbl-f', 'middle', 11);

    /* Two windows of identical width, one at B and one at C. */
    var dxw = 0.30;
    var gWin = S.g({});
    svg.appendChild(gWin);
    function windowBox(xc, cls) {
      var r = S.rect(PXm(xc - dxw / 2), yT + 8, PXm(xc + dxw / 2) - PXm(xc - dxw / 2), yB - yT - 8, null);
      r.setAttribute('fill', 'var(--quantum)');
      r.setAttribute('fill-opacity', '0.16');
      r.setAttribute('stroke', 'var(--quantum)');
      r.setAttribute('stroke-opacity', '0.5');
      gWin.appendChild(r);
      return r;
    }
    windowBox(st.xB);
    windowBox(st.xC);
    put(gWin, PXm(st.xB), yT - 6, 'window dx', 's-lbl-q', 'middle', 11);
    put(gWin, PXm(st.xC), yT - 6, 'same dx', 's-lbl-q', 'middle', 11);

    /* Everything printed below is integrated from the curve above. */
    var pAB = windowProb(st, st.xA, st.xB);
    var pWB = windowProb(st, st.xB - dxw / 2, st.xB + dxw / 2);
    var pWC = windowProb(st, st.xC - dxw / 2, st.xC + dxw / 2);
    var ratio = pWB / pWC;

    var lines = [
      { s: 'P_AB  =  ∫ from A to B of |ψ(x,t₁)|² dx  =  ' + pAB.toFixed(4) +
           '        the shaded area, and nothing else', c: 's-lbl-p', z: 12 },
      { s: 'total  =  ∫ over all x of |ψ(x,t₁)|² dx  =  ' + st.total.toFixed(6) +
           '      the state is normalised', c: 's-lbl-b', z: 12 },
      { s: 'two windows of the same width dx = ' + dxw.toFixed(2) + ' :    at B  P = ' +
           pWB.toFixed(6) + '      at C  P = ' + pWC.toFixed(6), c: 's-lbl-q', z: 11 },
      { s: 'the window at B is ' + Math.round(ratio) +
           ' times likelier than the window at C — that is all "most likely at B" can mean',
        c: 's-lbl', z: 11 },
      { s: 'the point B on its own carries no probability at all: ∫ from B to B of |ψ|² dx = 0',
        c: 's-lbl', z: 11 },
      { s: 'and |ψ|² is a density, not a probability: its unit is m⁻¹, so that |ψ|² dx is a pure number',
        c: 's-lbl-f', z: 11 }
    ].map(function (d, i) {
      return put(svg, 70, 480 + i * 26, d.s, d.c, 'start', d.z);
    });

    var note = put(svg, W / 2, H - 22,
      'A, B and C are places on the axis. Probability lives in intervals between them.',
      's-lbl-b', 'middle', 12);

    return function (p) {
      S.op(curve, M.beat(p, 0.02, 0.16));
      S.op(gB, M.beat(p, 0.14, 0.26));
      S.op(gC, M.beat(p, 0.22, 0.34));
      S.op(gA, M.beat(p, 0.30, 0.42));
      S.op(shade, M.beat(p, 0.36, 0.50));
      S.op(gWin, M.beat(p, 0.56, 0.68));
      lines.forEach(function (l, i) {
        S.op(l, M.beat(p, 0.40 + i * 0.075, 0.52 + i * 0.075));
      });
      S.op(note, M.beat(p, 0.90, 0.98));
    };
  });

  /* ======================================================================
     2. Three protocols. Two of them are an ensemble; one is not.
     =================================================================== */

  A.scene('two-scenarios', function (root) {
    var W = 1200, H = 860;
    var svg = S.root(W, H,
      'Three measurement protocols drawn side by side: many identical systems each measured ' +
      'once, one system reprepared and remeasured, and one system measured repeatedly ' +
      'without repreparation, which collapses the state and returns the same answer forever.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var st = figState();
    var NMAX = 60;
    var head = put(svg, 60, 34,
      'the same wavefunction ψ, measured three different ways', 's-lbl-b', 'start', 14);
    put(svg, 60, 56,
      'outcomes are drawn from P(x) = |ψ(x)|², the density of the previous figure',
      's-lbl', 'start', 11);

    /* Draw NMAX outcomes for each of the first two protocols, from two seeds. */
    function drawSet(seed) {
      var rnd = M.rng(seed), out = [], i;
      for (i = 0; i < NMAX; i++) out.push(st.draw(rnd()));
      return out;
    }
    var setA = drawSet(20260911);
    var setB = drawSet(778121);
    var setC = [];
    var firstC = st.draw(M.rng(90512)());
    for (var q = 0; q < NMAX; q++) setC.push(firstC);

    var ax0 = 560, ax1 = 1150;
    var PXo = function (x) { return M.map(x, 0, 11, ax0, ax1); };

    function band(by, title, sub, data, live) {
      var g = S.g({});
      svg.appendChild(g);
      put(g, 60, by + 16, title, live ? 's-lbl-b' : 's-lbl-f', 'start', 13);
      put(g, 60, by + 36, sub, 's-lbl', 'start', 11);

      var axis = S.line(ax0, by + 150, ax1, by + 150, 's-axis');
      g.appendChild(axis);
      put(g, ax1, by + 168, 'x', 's-lbl', 'end', 11);

      /* The true density, drawn behind the histogram for comparison. */
      var ghost = S.path('', 's-ghost');
      g.appendChild(ghost);
      var pk = at(st.xs, st.P, st.xB);
      S.setD(ghost, S.polyD(S.sample(240, 0, 11, function (x) {
        return [PXo(x), by + 150 - at(st.xs, st.P, x) / pk * 62];
      })));

      /* Histogram bins, filled in as N grows. */
      var NB = 24, bars = [], i;
      for (i = 0; i < NB; i++) {
        var r = S.rect(PXo(i * 11 / NB) + 1, by + 150, (ax1 - ax0) / NB - 2, 0,
          live ? 's-fill-q' : 's-fill-f');
        r.setAttribute('opacity', '0.75');
        g.appendChild(r);
        bars.push(r);
      }

      var dots = [];
      for (i = 0; i < NMAX; i++) {
        var c = S.circle(PXo(data[i]), by + 158, 2.2, live ? 's-fill-q' : 's-fill-f');
        c.setAttribute('opacity', '0');
        g.appendChild(c);
        dots.push(c);
      }

      var r1 = put(g, 60, by + 190, '', live ? 's-lbl-b' : 's-lbl-f', 'start', 12);
      var r2 = put(g, 60, by + 210, '', 's-lbl', 'start', 11);

      return { g: g, bars: bars, dots: dots, r1: r1, r2: r2, NB: NB, by: by, data: data, live: live };
    }

    var b1 = band(90,
      'protocol 1    N identical systems, each measured once',
      'N copies of the same ψ, all measured at the same elapsed time t',
      setA, true);

    var b2 = band(330,
      'protocol 2    one system, reprepared and remeasured N times',
      'prepare, wait t, measure, discard, prepare again — N times over',
      setB, true);

    var b3 = band(570,
      'protocol 3    one system, measured again and again — NOT the same thing',
      'the first measurement collapses ψ; every later one only repeats it',
      setC, false);

    /* Schematics on the left of each band. */
    function miniPacket(g, x, y, w, h, collapsed, xc) {
      card(g, x, y, w, h, null);
      var pth = S.path('', 's-prob');
      g.appendChild(pth);
      S.setD(pth, S.polyD(S.sample(50, 0, 1, function (u) {
        var v = collapsed
          ? Math.exp(-Math.pow((u - xc) * 26, 2))
          : at(st.xs, st.P, u * 11) / at(st.xs, st.P, st.xB);
        return [x + 4 + u * (w - 8), y + h - 6 - v * (h - 14)];
      })));
      return pth;
    }

    var s1 = S.g({});
    b1.g.appendChild(s1);
    for (var i1 = 0; i1 < 6; i1++) {
      miniPacket(s1, 60 + i1 * 74, 90 + 62, 62, 52, false, 0);
      s1.appendChild(S.arrow(svg, 60 + i1 * 74 + 31, 90 + 118, 60 + i1 * 74 + 31, 90 + 140, 'q'));
      s1.appendChild(S.circle(60 + i1 * 74 + 31, 90 + 146, 2.4, 's-fill-q'));
    }
    put(s1, 505, 90 + 146, '…', 's-lbl-b', 'start', 15);

    var s2 = S.g({});
    b2.g.appendChild(s2);
    miniPacket(s2, 60, 330 + 62, 62, 52, false, 0);
    s2.appendChild(S.arrow(svg, 126, 330 + 88, 186, 330 + 88, 'q'));
    put(s2, 192, 330 + 84, 'measure', 's-lbl-q', 'start', 11);
    s2.appendChild(S.arrow(svg, 300, 330 + 88, 360, 330 + 88, 'w'));
    put(s2, 366, 330 + 84, 'discard, prepare again', 's-lbl-w', 'start', 11);
    var loop = S.path('M 92 ' + (330 + 118) + ' C 92 ' + (330 + 152) + ', 470 ' + (330 + 152) +
      ', 470 ' + (330 + 96), 's-wave s-dash');
    loop.setAttribute('fill', 'none');
    s2.appendChild(loop);
    put(s2, 280, 330 + 170, 'repeat N times, always the same ψ', 's-lbl-w', 'middle', 11);

    var s3 = S.g({});
    b3.g.appendChild(s3);
    miniPacket(s3, 60, 570 + 62, 62, 52, false, 0);
    s3.appendChild(S.arrow(svg, 126, 570 + 88, 176, 570 + 88, 'f'));
    put(s3, 182, 570 + 78, 'first measurement', 's-lbl-f', 'start', 11);
    miniPacket(s3, 320, 570 + 62, 62, 52, true, firstC / 11);
    s3.appendChild(S.arrow(svg, 386, 570 + 88, 436, 570 + 88, 'f'));
    put(s3, 442, 570 + 78, 'and again', 's-lbl-f', 'start', 11);
    put(s3, 442, 570 + 96, 'and again', 's-lbl-f', 'start', 11);
    put(s3, 320, 570 + 132, 'ψ collapsed', 's-lbl-f', 'start', 11);
    var xmark = S.g({});
    b3.g.appendChild(xmark);
    xmark.appendChild(S.line(60, 570 - 12, 1150, 570 - 12, 's-fail s-dash'));

    var verdict1 = put(svg, 60, H - 48, '', 's-lbl-b', 'start', 12);
    var verdict2 = put(svg, 60, H - 26,
      'an expectation value is a property of the state, not the outcome of any one measurement',
      's-lbl', 'start', 11);

    function refresh(b, n, tag) {
      var i, counts = [], mean = 0;
      for (i = 0; i < b.NB; i++) counts.push(0);
      for (i = 0; i < n; i++) {
        var bi = Math.min(b.NB - 1, Math.floor(b.data[i] / 11 * b.NB));
        counts[bi] += 1;
        mean += b.data[i];
      }
      mean = n > 0 ? mean / n : 0;
      var mx = 1;
      for (i = 0; i < b.NB; i++) if (counts[i] > mx) mx = counts[i];
      for (i = 0; i < b.NB; i++) {
        var hgt = counts[i] / mx * 62;
        b.bars[i].setAttribute('y', String(b.by + 150 - hgt));
        b.bars[i].setAttribute('height', String(hgt));
      }
      for (i = 0; i < NMAX; i++) S.op(b.dots[i], i < n ? 0.85 : 0);
      var se = st.sd / Math.sqrt(Math.max(1, n));
      if (b.live) {
        b.r1.textContent = tag + '   N = ' + n + '    sample mean = ' + mean.toFixed(3) +
          '    ⟨x̂⟩ = ' + st.mean.toFixed(3);
        b.r2.textContent = 'gap ' + Math.abs(mean - st.mean).toFixed(3) +
          ',  standard error Δx/√N = ' + st.sd.toFixed(2) + '/√' + n + ' = ' + se.toFixed(3);
      } else {
        b.r1.textContent = tag + '   N = ' + n + '    sample mean = ' + mean.toFixed(3) +
          '    ⟨x̂⟩ = ' + st.mean.toFixed(3);
        b.r2.textContent = 'the mean never moves off the first outcome, whatever N is';
      }
      return mean;
    }

    return function (p) {
      var n = Math.max(1, Math.round(M.lerp(1, NMAX, M.easeOut(M.beat(p, 0.10, 0.86)))));
      var m1 = refresh(b1, n, 'protocol 1');
      var m2 = refresh(b2, n, 'protocol 2');
      refresh(b3, n, 'protocol 3');

      S.op(b1.g, M.beat(p, 0.02, 0.14));
      S.op(b2.g, M.beat(p, 0.18, 0.30));
      S.op(b3.g, M.beat(p, 0.46, 0.58));
      S.op(xmark, M.beat(p, 0.58, 0.70));

      verdict1.textContent = 'protocols 1 and 2 agree to ' +
        Math.abs(m1 - m2).toFixed(3) + ' at N = ' + n +
        '; both converge on ⟨x̂⟩ = ' + st.mean.toFixed(3) + ' as 1/√N';
      S.op(verdict1, M.beat(p, 0.74, 0.86));
      S.op(verdict2, M.beat(p, 0.86, 0.96));
    };
  });

  /* ======================================================================
     3. The expectation value as the balance point of the density.
     =================================================================== */

  A.scene('mean-position', function (root) {
    var W = 1120, H = 690;
    var svg = S.root(W, H,
      'A probability density in an infinite well, morphing from the ground state through a ' +
      'superposition to the first excited state, with its mean, mode and median tracked. At ' +
      'the end the mean sits exactly on the node, where the density is zero.');
    root.appendChild(svg);

    /* Orthonormal well states on [0,1]; the mixing angle rides the scroll. */
    var NG = 900, xs = [], i;
    for (i = 0; i <= NG; i++) xs.push(i / NG);
    var SQ2 = Math.sqrt(2);
    function u1(x) { return SQ2 * Math.sin(Math.PI * x); }
    function u2(x) { return SQ2 * Math.sin(2 * Math.PI * x); }
    /* Off-diagonal matrix element, evaluated on the grid, not quoted. */
    var mix = [];
    for (i = 0; i <= NG; i++) mix.push(xs[i] * u1(xs[i]) * u2(xs[i]));
    var x12 = integrate(xs, mix);
    var analyticX12 = -16 / (9 * Math.PI * Math.PI);

    /* The tallest the density gets anywhere in the sweep, which is not at
       either end of it: for a given x the largest (cosθ u₁ + sinθ u₂)² any
       angle can produce is u₁² + u₂², so the maximum of that over the grid
       covers every frame. Scaling to the ground state instead would clip the
       interference peak flat against the top of the box for a third of the
       scroll, and M.map clamps, so the clipping would be silent. */
    var PMAX = 0, uu;
    for (i = 0; i <= NG; i++) {
      uu = u1(xs[i]) * u1(xs[i]) + u2(xs[i]) * u2(xs[i]);
      if (uu > PMAX) PMAX = uu;
    }

    var x0 = 90, x1 = 1030, yT = 90, yB = 390;
    var PXm = function (x) { return M.map(x, 0, 1, x0, x1); };
    var PYm = function (v) { return M.map(v, 0, PMAX * 1.08, yB, yT); };

    svg.appendChild(S.gridLines(x0, yT, x1, yB, 10, 4));
    svg.appendChild(S.axes(x0, yT, x1, yB, 'x / L', null));
    put(svg, x0, yT - 10, 'P(x) = |ψ(x)|²   in units of 1/L', 's-lbl-p', 'start', 11);

    var fill = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.18', stroke: 'none' });
    svg.appendChild(fill);
    var curve = S.path('', 's-prob');
    svg.appendChild(curve);

    var meanLine = S.line(0, yT, 0, yB, 's-quantum s-dash');
    svg.appendChild(meanLine);
    var fulcrum = S.el('path', { fill: 'var(--quantum)', stroke: 'none' });
    svg.appendChild(fulcrum);
    var meanLbl = put(svg, 0, 0, '⟨x̂⟩', 's-lbl-q', 'middle', 13);
    var modeMark = S.line(0, yT + 20, 0, yB, 's-wave s-dash');
    svg.appendChild(modeMark);
    var modeLbl = put(svg, 0, 0, 'mode', 's-lbl-w', 'middle', 11);
    var medMark = S.line(0, yT + 40, 0, yB, 's-ghost s-dash');
    svg.appendChild(medMark);
    var medLbl = put(svg, 0, 0, 'median', 's-lbl', 'middle', 11);

    var rows = [], labels = [
      's-lbl-b', 's-lbl-q', 's-lbl-q', 's-lbl-w', 's-lbl-p', 's-lbl'
    ];
    for (i = 0; i < 6; i++) rows.push(put(svg, 70, 452 + i * 26, '', labels[i], 'start', 11));
    var flag = put(svg, 70, 620, '', 's-lbl-f', 'start', 12);
    var note = put(svg, 70, H - 22,
      'the balance point of a distribution need not be a place the distribution puts anything',
      's-lbl-b', 'start', 11);

    return function (p) {
      var th = M.lerp(0, Math.PI / 2, M.easeInOut(M.beat(p, 0.08, 0.86)));
      var c = Math.cos(th), s = Math.sin(th);
      var P = [], xP = [], x2P = [];
      for (i = 0; i <= NG; i++) {
        var v = c * u1(xs[i]) + s * u2(xs[i]);
        var d = v * v;
        P.push(d); xP.push(xs[i] * d); x2P.push(xs[i] * xs[i] * d);
      }
      var tot = integrate(xs, P);
      var mean = integrate(xs, xP);
      var sd = Math.sqrt(Math.max(0, integrate(xs, x2P) - mean * mean));
      var mode = refineMax(xs, P);
      var med = quantile(xs, P, 0.5 * tot);
      var pAtMean = at(xs, P, mean);
      var pAtMode = at(xs, P, mode);
      var algebraic = 0.5 + 2 * c * s * x12;

      var pts = S.sample(400, 0, 1, function (x) {
        var vv = c * u1(x) + s * u2(x);
        return [PXm(x), PYm(vv * vv)];
      });
      S.setD(curve, S.polyD(pts));
      fill.setAttribute('d', S.areaD(pts, yB));

      meanLine.setAttribute('x1', String(PXm(mean)));
      meanLine.setAttribute('x2', String(PXm(mean)));
      var fx = PXm(mean);
      fulcrum.setAttribute('d', 'M' + fx + ' ' + (yB + 3) + 'L' + (fx - 11) + ' ' + (yB + 22) +
        'L' + (fx + 11) + ' ' + (yB + 22) + 'Z');
      meanLbl.setAttribute('x', String(fx));
      meanLbl.setAttribute('y', String(yB + 42));
      modeMark.setAttribute('x1', String(PXm(mode)));
      modeMark.setAttribute('x2', String(PXm(mode)));
      modeLbl.setAttribute('x', String(PXm(mode)));
      modeLbl.setAttribute('y', String(yT + 14));
      medMark.setAttribute('x1', String(PXm(med)));
      medMark.setAttribute('x2', String(PXm(med)));
      medLbl.setAttribute('x', String(PXm(med)));
      medLbl.setAttribute('y', String(yT + 34));

      rows[0].textContent = 'mixing angle θ = ' + (th * 180 / Math.PI).toFixed(1) +
        '°     ψ = cos θ · u₁ + sin θ · u₂     ∫ P dx = ' + tot.toFixed(6);
      rows[1].textContent = '⟨x̂⟩ = ∫ x P dx = ' + num(mean, 5) +
        ' L        integrated from the curve above';
      rows[2].textContent = 'L/2 + 2 sinθ cosθ ⟨1|x̂|2⟩ = ' + num(algebraic, 5) +
        ' L    with ⟨1|x̂|2⟩ = ' + num(x12, 5) + ' L';
      rows[3].textContent = 'mode = ' + mode.toFixed(5) + ' L        median = ' +
        med.toFixed(5) + ' L        Δx = ' + sd.toFixed(5) + ' L';
      rows[4].textContent = 'P at the mode = ' + pAtMode.toFixed(5) +
        '/L        P at ⟨x̂⟩ = ' + pAtMean.toFixed(5) + '/L';
      rows[5].textContent = 'closed form −16/(9π²) = ' + num(analyticX12, 5) +
        ' L, so the two lines above are the same statement';
      rows[4].setAttribute('class', pAtMean < 0.02 ? 's-lbl-f' : 's-lbl-p');

      flag.textContent = pAtMean < 0.02
        ? 'the average position is now the one interior point where the particle is never found'
        : 'mean, mode and median part company as soon as the density stops being symmetric';
      flag.setAttribute('class', pAtMean < 0.02 ? 's-lbl-f' : 's-lbl');

      S.op(curve, M.beat(p, 0.02, 0.12));
      S.op(fill, M.beat(p, 0.04, 0.16));
      S.op(meanLine, M.beat(p, 0.12, 0.22));
      S.op(fulcrum, M.beat(p, 0.12, 0.22));
      S.op(meanLbl, M.beat(p, 0.12, 0.22));
      S.op(modeMark, M.beat(p, 0.26, 0.36));
      S.op(modeLbl, M.beat(p, 0.26, 0.36));
      S.op(medMark, M.beat(p, 0.34, 0.44));
      S.op(medLbl, M.beat(p, 0.34, 0.44));
      rows.forEach(function (r, k) { S.op(r, M.beat(p, 0.16 + k * 0.06, 0.28 + k * 0.06)); });
      S.op(flag, M.beat(p, 0.62, 0.74));
      S.op(note, M.beat(p, 0.88, 0.97));
    };
  });

  /* ======================================================================
     4. The chain that turns d<x>/dt into an operator sandwich, with the two
        discarded boundary terms measured on a real packet.
     =================================================================== */

  A.scene('momentum-derivation', function (root) {
    var W = 1200, H = 890;
    var svg = S.root(W, H,
      'The derivation of equation 1.11.3 line by line, with each move justified beside it, ' +
      'the two boundary terms struck out as they are discarded, and a numerically evolved ' +
      'free wave packet underneath on which every quantity in the chain is measured.');
    root.appendChild(svg);

    var head = put(svg, 60, 36,
      'd⟨x̂⟩/dt, one move at a time.  Left: the algebra.  Right: why the move is allowed.',
      's-lbl-b', 'start', 14);

    var EQX = 80, WHYX = 630, Y0 = 92, DY = 44, EZ = 12;

    var rows = [
      { parts: [{ s: '⟨x̂⟩(t)  =  ∫ x P(x,t) dx        with  P = |ψ(x,t)|²', c: 's-lbl-b' }],
        why: ['the definition, (1.11.2). The integrand is x, an ordinary',
              'number, not the operator x̂ the handout prints there'] },

      { parts: [{ s: 'd⟨x̂⟩/dt  =  d/dt ∫ x P(x,t) dx', c: 's-lbl-b' }],
        why: ['differentiate it. ⟨x̂⟩ depends on t only through P'] },

      { parts: [{ s: '=  ∫ x (∂P/∂t) dx', c: 's-lbl-b' }],
        why: ['d/dt moves inside: the limits are fixed and x is the',
              'variable of integration, not a function of t'] },

      { parts: [{ s: '=  −∫ x (∂J/∂x) dx', c: 's-lbl-b' }],
        why: ['continuity, ∂P/∂t = −∂J/∂x, from §1.9. Needs V real'] },

      { parts: [{ s: '=  −∫ [ ∂(xJ)/∂x  −  J ] dx', c: 's-lbl-b' }],
        why: ['product rule run backwards: ∂(xJ)/∂x = J + x ∂J/∂x'] },

      { parts: [{ s: '=  −', c: 's-lbl-b' },
                { s: '[ x J ] from −∞ to +∞', c: 's-lbl-f' },
                { s: '  +  ∫ J dx', c: 's-lbl-b' }],
        why: ['a total derivative integrates to the difference of its',
              'values at the two ends — that is the fundamental theorem'],
        strike: 1 },

      { parts: [{ s: '=  ∫ J dx', c: 's-lbl-q' }],
        why: ['boundary term 1 discarded: we assume x J → 0 at infinity.',
              'That is STRONGER than normalisability. See the panel below'],
        whyCls: 's-lbl-f' },

      { parts: [{ s: '=  −(iℏ/2m) ∫ ( ψ* ∂ψ/∂x  −  ψ ∂ψ*/∂x ) dx', c: 's-lbl-b' }],
        why: ['insert J = −(iℏ/2m)(ψ* ∂ψ/∂x − ψ ∂ψ*/∂x), also from §1.9'] },

      { parts: [{ s: '=  −(iℏ/2m) ∫ ( ψ* ∂ψ/∂x + ψ* ∂ψ/∂x − ∂(ψ*ψ)/∂x ) dx', c: 's-lbl-b' }],
        why: ['add and subtract ψ* ∂ψ/∂x, using the product rule',
              '∂(ψ*ψ)/∂x = ψ* ∂ψ/∂x + ψ ∂ψ*/∂x. The two terms combine'] },

      { parts: [{ s: '=  −(iℏ/2m) [ 2 ∫ ψ* ∂ψ/∂x dx  −  ', c: 's-lbl-b' },
                { s: '[ |ψ|² ] from −∞ to +∞', c: 's-lbl-f' },
                { s: ' ]', c: 's-lbl-b' }],
        why: ['the second piece is a total derivative too'],
        strike: 2 },

      { parts: [{ s: '=  −(iℏ/m) ∫ ψ* ∂ψ/∂x dx', c: 's-lbl-q' }],
        why: ['boundary term 2 discarded: |ψ|² → 0 at infinity. This one',
              'is nearly free. The 2 in 2m is gone — do not lose it'],
        whyCls: 's-lbl-f' },

      { parts: [{ s: '=  (1/m) ∫ ψ* ( −iℏ ∂ψ/∂x ) dx              (1.11.3)', c: 's-lbl-q' }],
        why: ['pull the constant inside. What is left acting on ψ is p̂'] }
    ];

    var built = rows.map(function (r, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = Y0 + i * DY;
      var run = runText(g, EQX, y, r.parts, EZ);
      r.why.forEach(function (w, j) {
        put(g, WHYX, y - 7 + j * 15, w, r.whyCls || 's-lbl', 'start', 11);
      });
      var strike = null;
      if (r.strike) {
        strike = S.line(run[1].x0 - 2, y - 4, run[1].x1 + 2, y - 4, 's-fail');
        strike.setAttribute('stroke-width', '1.6');
        svg.appendChild(strike);
      }
      return { g: g, run: run, strike: strike };
    });

    /* The run pieces are first placed with an estimated monospace advance. On
       the first frame, once the browser has laid the text out, re-place them
       from their measured widths so the segments butt up exactly and the
       strike-through lands on the boundary term and nothing else. */
    var laidOut = false;
    function relayout() {
      var ok = true;
      built.forEach(function (b2) {
        var cx = EQX;
        b2.run.forEach(function (piece) {
          var w = 0;
          try { w = piece.el.getComputedTextLength(); } catch (e) { w = 0; }
          if (!w) { ok = false; return; }
          piece.el.setAttribute('x', String(cx));
          piece.x0 = cx; piece.x1 = cx + w;
          cx += w;
        });
        if (b2.strike && b2.run[1]) {
          b2.strike.setAttribute('x1', String(b2.run[1].x0 - 2));
          b2.strike.setAttribute('x2', String(b2.run[1].x1 + 2));
        }
      });
      return ok;
    }

    /* -------- the numerical check, on a genuinely evolved free packet -------- */

    var NX = 241, XA = -14, XB = 14, NK = 81, K0 = 1.5, SIG = 1.2, XSTART = -5;
    var NT = 25, TMAX = 4, DT = TMAX / (NT - 1);
    var gx = [], ik;
    for (ik = 0; ik < NX; ik++) gx.push(XA + (XB - XA) * ik / (NX - 1));
    var ks = [], amp = [];
    for (ik = 0; ik < NK; ik++) {
      var kk = K0 - 3 + 6 * ik / (NK - 1);
      ks.push(kk);
      amp.push(Math.exp(-SIG * SIG * (kk - K0) * (kk - K0)));
    }

    /* Each plane wave is an exact solution of the free equation, so summing
       them is an exact evolution, not a finite-difference approximation. */
    function slice(tt) {
      var Pv = [], Jv = [], Av = [], j, m2;
      for (j = 0; j < NX; j++) {
        var re = 0, im = 0, dre = 0, dim = 0, x = gx[j];
        for (m2 = 0; m2 < NK; m2++) {
          var th = ks[m2] * (x - XSTART) - 0.5 * ks[m2] * ks[m2] * tt;
          var ct = Math.cos(th), stt = Math.sin(th), a = amp[m2];
          re += a * ct; im += a * stt;
          dre += -a * ks[m2] * stt; dim += a * ks[m2] * ct;
        }
        Pv.push(re * re + im * im);
        Jv.push(re * dim - im * dre);
        Av.push(re * dre + im * dim);
      }
      return { P: Pv, J: Jv, A: Av };
    }

    var slices = [], norm = 1;
    for (ik = 0; ik < NT; ik++) {
      var sl = slice(ik * DT);
      if (ik === 0) norm = integrate(gx, sl.P);
      var j2;
      for (j2 = 0; j2 < NX; j2++) { sl.P[j2] /= norm; sl.J[j2] /= norm; sl.A[j2] /= norm; }
      var xP = [];
      for (j2 = 0; j2 < NX; j2++) xP.push(gx[j2] * sl.P[j2]);
      sl.mean = integrate(gx, xP);
      sl.Jint = integrate(gx, sl.J);
      sl.Aint = integrate(gx, sl.A);
      sl.edgeXJ = gx[NX - 1] * sl.J[NX - 1] - gx[0] * sl.J[0];
      sl.edgeP = sl.P[NX - 1] - sl.P[0];
      sl.t = ik * DT;
      slices.push(sl);
    }
    for (ik = 0; ik < NT; ik++) {
      var lo = Math.max(0, ik - 1), hi = Math.min(NT - 1, ik + 1);
      slices[ik].dmean = (slices[hi].mean - slices[lo].mean) / ((hi - lo) * DT);
    }
    var peakP = 0;
    for (ik = 0; ik < NX; ik++) if (slices[0].P[ik] > peakP) peakP = slices[0].P[ik];

    var gPanel = S.g({});
    svg.appendChild(gPanel);
    put(gPanel, 60, 622,
      'the same chain, measured on a free packet built from ' + NK +
      ' exact plane-wave solutions   (ℏ = m = 1)', 's-lbl-b', 'start', 13);

    var px0 = 80, px1 = 590, pyT = 660, pyB = 800;
    gPanel.appendChild(S.axes(px0, pyT, px1, pyB, 'x', null));
    put(gPanel, px0 - 8, pyT - 6, 'P(x,t)', 's-lbl-p', 'end', 11);
    var ghosts = [];
    for (ik = 0; ik < 4; ik++) { var gp = S.path('', 's-ghost'); gPanel.appendChild(gp); ghosts.push(gp); }
    var pkFill = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.18', stroke: 'none' });
    gPanel.appendChild(pkFill);
    var pkCurve = S.path('', 's-prob');
    gPanel.appendChild(pkCurve);
    var cTick = S.line(0, pyT, 0, pyB, 's-quantum s-dash');
    gPanel.appendChild(cTick);
    var cLbl = put(gPanel, 0, 0, '⟨x̂⟩', 's-lbl-q', 'middle', 11);

    var readCls = ['s-lbl', 's-lbl-b', 's-lbl-q', 's-lbl-q', 's-lbl-q', 's-lbl', 's-lbl-f', 's-lbl-f'];
    var reads = [];
    for (ik = 0; ik < 8; ik++) reads.push(put(gPanel, 640, 652 + ik * 23, '', readCls[ik], 'start', 11));

    var moral = put(svg, 60, H - 22,
      'the centroid of |ψ|² moves at the net probability current, and ⟨p̂⟩ is m times that',
      's-lbl-b', 'start', 12);

    return function (p) {
      if (!laidOut) laidOut = relayout();
      S.op(head, M.beat(p, 0.00, 0.04));
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.015 + i * 0.034, 0.06 + i * 0.034));
        if (b.strike) S.op(b.strike, M.beat(p, 0.015 + (i + 1) * 0.034, 0.06 + (i + 1) * 0.034));
      });

      S.op(gPanel, M.beat(p, 0.50, 0.58));
      var f = M.beat(p, 0.54, 0.96);
      var idx = Math.min(NT - 1, Math.round(f * (NT - 1)));
      var sl = slices[idx];

      var pts = S.sample(NX - 1, 0, 1, function (u, tt) {
        var j = Math.round(tt * (NX - 1));
        return [M.map(gx[j], XA, XB, px0, px1), M.map(sl.P[j], 0, peakP * 1.1, pyB, pyT)];
      });
      S.setD(pkCurve, S.polyD(pts));
      pkFill.setAttribute('d', S.areaD(pts, pyB));
      ghosts.forEach(function (gp, j) {
        var gi = Math.min(NT - 1, Math.round(idx * (j + 1) / 5));
        var gsl = slices[gi];
        S.setD(gp, S.polyD(S.sample(NX - 1, 0, 1, function (u, tt) {
          var jj = Math.round(tt * (NX - 1));
          return [M.map(gx[jj], XA, XB, px0, px1), M.map(gsl.P[jj], 0, peakP * 1.1, pyB, pyT)];
        })));
        S.op(gp, 0.35);
      });
      var cx = M.map(sl.mean, XA, XB, px0, px1);
      cTick.setAttribute('x1', String(cx)); cTick.setAttribute('x2', String(cx));
      cLbl.setAttribute('x', String(cx)); cLbl.setAttribute('y', String(pyT - 6));

      reads[0].textContent = 't = ' + sl.t.toFixed(3) + '     k₀ = ' + K0.toFixed(3) +
        ',  σ₀ = ' + SIG.toFixed(2) + ',  so ℏk₀/m = ' + (K0).toFixed(6);
      reads[1].textContent = '⟨x̂⟩(t)              = ' + num(sl.mean, 6) +
        '     ( ∫ x P dx )';
      reads[2].textContent = 'd⟨x̂⟩/dt             = ' + num(sl.dmean, 6) +
        '     ( differenced )';
      reads[3].textContent = '∫ J dx               = ' + num(sl.Jint, 6) +
        '     ( J = Im ψ*∂ψ/∂x )';
      reads[4].textContent = '−(iℏ/m)∫ψ*∂ψ/∂x dx  = ' + num(sl.Jint, 6) +
        '     ( the same integral )';
      reads[5].textContent = 'imaginary part       = ' + num(-sl.Aint, 6) +
        '     ( it has to vanish )';
      reads[6].textContent = 'discarded [ x J ]    = ' + sci(sl.edgeXJ, 1) +
        '     ( boundary term 1 )';
      reads[7].textContent = 'discarded [ |ψ|² ]   = ' + sci(sl.edgeP, 1) +
        '     ( boundary term 2 )';
      reads.forEach(function (r, i) { S.op(r, M.beat(p, 0.56 + i * 0.03, 0.66 + i * 0.03)); });

      S.op(moral, M.beat(p, 0.90, 0.98));
    };
  });

  /* ======================================================================
     A normalised Gaussian packet g(x−x₀) e^{ikx}, with its first and second
     derivatives evaluated analytically, so operator sandwiches can be
     integrated on the grid rather than asserted.
     =================================================================== */

  function packet(xs, x0, sig, k) {
    var n = xs.length, re = [], im = [], dre = [], dim = [], d2re = [], d2im = [], i;
    for (i = 0; i < n; i++) {
      var x = xs[i];
      var g = Math.exp(-Math.pow(x - x0, 2) / (4 * sig * sig));
      var gp = -(x - x0) / (2 * sig * sig) * g;
      var gpp = (Math.pow(x - x0, 2) / (4 * Math.pow(sig, 4)) - 1 / (2 * sig * sig)) * g;
      var c = Math.cos(k * x), s = Math.sin(k * x);
      re.push(g * c); im.push(g * s);
      dre.push(gp * c - k * g * s);
      dim.push(gp * s + k * g * c);
      d2re.push((gpp - k * k * g) * c - 2 * k * gp * s);
      d2im.push((gpp - k * k * g) * s + 2 * k * gp * c);
    }
    var dens = [], j;
    for (j = 0; j < n; j++) dens.push(re[j] * re[j] + im[j] * im[j]);
    var sc = 1 / Math.sqrt(integrate(xs, dens));
    for (j = 0; j < n; j++) {
      re[j] *= sc; im[j] *= sc; dre[j] *= sc; dim[j] *= sc; d2re[j] *= sc; d2im[j] *= sc;
    }
    return { xs: xs, re: re, im: im, dre: dre, dim: dim, d2re: d2re, d2im: d2im,
             x0: x0, sig: sig, k: k };
  }

  /* ∫ ψ* (Ôψ) dx, returned as [real, imaginary]. opFn(i) gives Ôψ at grid i. */
  function sandwich(st, opFn) {
    var n = st.xs.length, fr = [], fi = [], i;
    for (i = 0; i < n; i++) {
      var w = opFn(i);
      fr.push(st.re[i] * w[0] + st.im[i] * w[1]);
      fi.push(st.re[i] * w[1] - st.im[i] * w[0]);
    }
    return [integrate(st.xs, fr), integrate(st.xs, fi)];
  }

  function testGrid(x0, sig) {
    var xs = [], n = 1600, a = x0 - 9 * sig, b = x0 + 9 * sig, i;
    for (i = 0; i <= n; i++) xs.push(a + (b - a) * i / n);
    return xs;
  }

  /* ======================================================================
     5. Why the operator sits between psi* and psi.
     =================================================================== */

  A.scene('operator-sandwich', function (root) {
    var W = 1180, H = 700;
    var svg = S.root(W, H,
      'The momentum operator drawn between psi star and psi, with an arrow showing that it ' +
      'differentiates only what stands to its right, and three integrals computed on the ' +
      'same state to show what happens when it is moved.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var HB = 1;
    var K = 2.0, SG = 1.0, X0 = 0.0;
    var xs = testGrid(X0, SG);
    var st = packet(xs, X0, SG, K);
    var stc = packet(xs, X0, SG, -K);   /* the complex conjugate state */

    var head = put(svg, 60, 36,
      'ψ*(x,t)  ·  p̂  ·  ψ(x,t)   —  the order is not decoration', 's-lbl-b', 'start', 14);

    /* --- the schematic --- */
    var gS = S.g({});
    svg.appendChild(gS);
    var bx = [140, 420, 760], bw = [220, 260, 220], byy = 90, bh = 84;
    var caps = ['ψ*(x,t)', '−iℏ ∂/∂x', 'ψ(x,t)'];
    var ccl = ['s-lbl-p', 's-lbl-q', 's-lbl-p'];
    var i;
    for (i = 0; i < 3; i++) {
      card(gS, bx[i], byy, bw[i], bh, i === 1 ? 'var(--quantum)' : 'var(--probability)');
      put(gS, bx[i] + bw[i] / 2, byy + 50, caps[i], ccl[i], 'middle', 18);
    }
    gS.appendChild(S.arrow(svg, 690, byy + bh + 26, 866, byy + bh + 4, 'q'));
    put(gS, 700, byy + bh + 44, 'the derivative acts on this one', 's-lbl-q', 'start', 12);
    var bad = S.arrow(svg, 550, byy + bh + 26, 300, byy + bh + 4, 'f');
    gS.appendChild(bad);
    var badX = S.g({});
    gS.appendChild(badX);
    badX.appendChild(S.line(413, byy + bh + 3, 437, byy + bh + 27, 's-fail'));
    badX.appendChild(S.line(437, byy + bh + 3, 413, byy + bh + 27, 's-fail'));
    put(gS, 150, byy + bh + 44, 'never on this one', 's-lbl-f', 'start', 12);

    /* --- three integrals on the same state --- */
    var pRight = sandwich(st, function (j) { return [HB * st.dim[j], -HB * st.dre[j]]; });
    /* The same operator moved to the left of the star, and then applied to the
       whole product instead. Conjugating gives d(psi-star)/dx = dre - i dim, so
       -i hbar times it has real part -hbar dim and imaginary part -hbar dre. */
    var leftR = 0, leftI = 0, prodR = 0;
    (function () {
      var n = xs.length, fr = [], fi = [], gr = [], j;
      for (j = 0; j < n; j++) {
        /* The conjugate side, minus i hbar times d(psi-star)/dx, times psi,
           worked out componentwise. */
        var wr = HB * (-st.dim[j]);
        var wi = -HB * st.dre[j];
        /* then multiplied by psi = re + i im */
        fr.push(wr * st.re[j] - wi * st.im[j]);
        fi.push(wr * st.im[j] + wi * st.re[j]);
        /* the derivative of the product is real: twice Re(conj(psi) dpsi/dx) */
        gr.push(2 * (st.re[j] * st.dre[j] + st.im[j] * st.dim[j]));
      }
      leftR = integrate(xs, fr);
      leftI = integrate(xs, fi);
      prodR = integrate(xs, gr);
    })();

    /* Position: the operator multiplies, so the order genuinely does not matter. */
    var xSand = sandwich(st, function (j) { return [xs[j] * st.re[j], xs[j] * st.im[j]]; });
    var xDens = [];
    for (i = 0; i < xs.length; i++) xDens.push(xs[i] * (st.re[i] * st.re[i] + st.im[i] * st.im[i]));
    var xWeighted = integrate(xs, xDens);

    /* Two states with identical densities and opposite momenta. */
    var pConj = sandwich(stc, function (j) { return [HB * stc.dim[j], -HB * stc.dre[j]]; });
    var densGap = 0;
    for (i = 0; i < xs.length; i++) {
      var g1 = st.re[i] * st.re[i] + st.im[i] * st.im[i];
      var g2 = stc.re[i] * stc.re[i] + stc.im[i] * stc.im[i];
      if (Math.abs(g1 - g2) > densGap) densGap = Math.abs(g1 - g2);
    }

    put(svg, 60, 300, 'the same state ψ = N e^(−(x−x₀)²/4σ²) e^(ikx), with k = ' +
      K.toFixed(3) + ', σ = ' + SG.toFixed(2) + ', ℏ = 1', 's-lbl-b', 'start', 12);

    var rowsTxt = [
      { s: pad('∫ ψ* ( −iℏ ∂ψ/∂x ) dx', 24) + '=  ' + num(pRight[0], 6) + ' ℏ   (imag ' +
           num(pRight[1], 6) + ')   correct — this is ⟨p̂⟩', c: 's-lbl-q' },
      { s: pad('∫ ( −iℏ ∂ψ*/∂x ) ψ dx', 24) + '=  ' + num(leftR, 6) + ' ℏ   (imag ' +
           num(leftI, 6) + ')   the operator moved left: the sign flips', c: 's-lbl-f' },
      { s: pad('−iℏ ∫ ∂(ψ*ψ)/∂x dx', 24) + '=  −iℏ × ' + num(prodR, 6) +
           ' = 0             a total derivative: nothing survives', c: 's-lbl-f' },
      { s: pad('∫ ψ* x̂ ψ dx', 24) + '=  ' + num(xSand[0], 6) + '     and     ∫ x |ψ|² dx = ' +
           num(xWeighted, 6) + '     for x̂ the order does not matter', c: 's-lbl-b' }
    ].map(function (d, j) {
      return put(svg, 60, 340 + j * 30, d.s, d.c, 'start', 11);
    });

    put(svg, 60, 490, 'and this is why ⟨p̂⟩ cannot be written as ∫ p |ψ(x)|² dx :',
      's-lbl-b', 'start', 12);
    var proof = [
      { s: 'ψ = N g(x) e^(ikx)  gives  ⟨p̂⟩ = ' + num(pRight[0], 6) + ' ℏ', c: 's-lbl-q' },
      { s: 'ψ* = N g(x) e^(−ikx) gives  ⟨p̂⟩ = ' + num(pConj[0], 6) + ' ℏ', c: 's-lbl-w' },
      { s: 'largest gap between the two densities |ψ|² and |ψ*|² anywhere on the grid = ' +
           sci(densGap, 1), c: 's-lbl-b' },
      { s: 'same density, momenta ' + num(Math.abs(pRight[0] - pConj[0]), 6) +
           ' ℏ apart — so no ∫ f(x)|ψ|² dx can ever produce ⟨p̂⟩', c: 's-lbl-f' }
    ].map(function (d, j) {
      return put(svg, 60, 522 + j * 26, d.s, d.c, 'start', 11);
    });

    var moral = put(svg, 60, H - 24,
      'x̂ acts by multiplication, so it can be folded into the density. p̂ is a derivative, and cannot.',
      's-lbl-b', 'start', 12);

    return function (p) {
      S.op(head, M.beat(p, 0.00, 0.06));
      S.op(gS, M.beat(p, 0.05, 0.20));
      S.op(bad, M.beat(p, 0.20, 0.30));
      S.op(badX, M.beat(p, 0.24, 0.34));
      rowsTxt.forEach(function (r, j) { S.op(r, M.beat(p, 0.32 + j * 0.09, 0.44 + j * 0.09)); });
      proof.forEach(function (r, j) { S.op(r, M.beat(p, 0.62 + j * 0.07, 0.74 + j * 0.07)); });
      S.op(moral, M.beat(p, 0.90, 0.98));
    };
  });

  /* ======================================================================
     6. The general formula, and what it costs to write it down.
     =================================================================== */

  A.scene('general-expectation', function (root) {
    var W = 1220, H = 820;
    var svg = S.root(W, H,
      'The general expectation-value formula with the operator between psi star and psi, and ' +
      'five instances of it evaluated on one state: position, momentum, potential energy, ' +
      'kinetic energy, and the product of position and momentum, whose ordering matters.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var HB = 1, K = 2.0, SG = 1.0, X0 = 1.4;
    var xs = testGrid(X0, SG);
    var st = packet(xs, X0, SG, K);
    var i;

    /* the five sandwiches */
    var Ex = sandwich(st, function (j) { return [xs[j] * st.re[j], xs[j] * st.im[j]]; });
    var Ex2 = sandwich(st, function (j) {
      return [xs[j] * xs[j] * st.re[j], xs[j] * xs[j] * st.im[j]];
    });
    var Ep = sandwich(st, function (j) { return [HB * st.dim[j], -HB * st.dre[j]]; });
    var Ep2 = sandwich(st, function (j) { return [-HB * HB * st.d2re[j], -HB * HB * st.d2im[j]]; });
    var Ev = sandwich(st, function (j) {
      return [0.5 * xs[j] * xs[j] * st.re[j], 0.5 * xs[j] * xs[j] * st.im[j]];
    });
    var Exp = sandwich(st, function (j) {
      return [xs[j] * HB * st.dim[j], -xs[j] * HB * st.dre[j]];
    });
    var Epx = sandwich(st, function (j) {
      return [HB * (st.im[j] + xs[j] * st.dim[j]), -HB * (st.re[j] + xs[j] * st.dre[j])];
    });
    var symR = 0.5 * (Exp[0] + Epx[0]), symI = 0.5 * (Exp[1] + Epx[1]);

    /* kinetic energy the other way round, after one integration by parts */
    var grad2 = [];
    for (i = 0; i < xs.length; i++) grad2.push(st.dre[i] * st.dre[i] + st.dim[i] * st.dim[i]);
    var p2byParts = HB * HB * integrate(xs, grad2);

    var dx = Math.sqrt(Math.max(0, Ex2[0] - Ex[0] * Ex[0]));
    var dp = Math.sqrt(Math.max(0, Ep2[0] - Ep[0] * Ep[0]));

    var head = put(svg, W / 2, 40,
      '⟨Ô⟩  =  ∫ ψ*(r,t)  Ô( r, −iℏ∇ )  ψ(r,t)  d³r              (1.11.6)',
      's-lbl-b', 'middle', 17);
    var sub = put(svg, W / 2, 68,
      'one formula. Everything below is that formula with a different Ô, integrated on one state.',
      's-lbl', 'middle', 11);
    put(svg, W / 2, 92, 'ψ = N e^(−(x−x₀)²/4σ²) e^(ikx)   with x₀ = ' + X0.toFixed(2) +
      ', σ = ' + SG.toFixed(2) + ', k = ' + K.toFixed(2) + ', ℏ = m = 1',
      's-lbl-p', 'middle', 11);

    var branches = [
      { o: 'Ô = x̂', act: 'x̂ψ = x ψ   (multiply)',
        res: '⟨x̂⟩ = ∫ x |ψ|² dx = ' + num(Ex[0], 6),
        note: 'this is (1.11.5), and it collapses to (1.11.2)', c: 's-lbl-p' },
      { o: 'Ô = p̂', act: 'p̂ψ = −iℏ ∂ψ/∂x   (differentiate)',
        res: '⟨p̂⟩ = ∫ ψ*(−iℏ ∂ψ/∂x) dx = ' + num(Ep[0], 6),
        note: 'this is (1.11.4), and it cost a whole derivation', c: 's-lbl-q' },
      { o: 'Ô = V(x̂) = ½x̂²', act: 'V(x̂)ψ = V(x) ψ   (multiply)',
        res: '⟨V⟩ = ∫ V(x)|ψ|² dx = ' + num(Ev[0], 6),
        note: 'any function of position alone folds into the density', c: 's-lbl-p' },
      { o: 'Ô = p̂²/2m', act: 'p̂²ψ = −ℏ² ∂²ψ/∂x²',
        res: '⟨T̂⟩ = ' + num(Ep2[0] / 2, 6) + ',  and (ℏ²/2m)∫|∂ψ/∂x|² dx = ' +
             num(p2byParts / 2, 6),
        note: 'the two agree, by one integration by parts — and are ≥ 0', c: 's-lbl-w' }
    ].map(function (b, j) {
      var g = S.g({});
      svg.appendChild(g);
      var y = 140 + j * 88;
      card(g, 60, y, 1100, 74, null);
      put(g, 80, y + 26, b.o, b.c, 'start', 14);
      put(g, 80, y + 52, b.act, 's-lbl', 'start', 11);
      put(g, 440, y + 26, b.res, 's-lbl-b', 'start', 12);
      put(g, 440, y + 52, b.note, 's-lbl', 'start', 11);
      return g;
    });

    /* the ordering problem */
    var gWarn = S.g({});
    svg.appendChild(gWarn);
    var wy = 500;
    card(gWarn, 60, wy, 1100, 138, 'var(--fail)');
    put(gWarn, 80, wy + 26, 'Ô = x̂p̂    the one case the handout waves past', 's-lbl-f', 'start', 14);
    [
      '⟨x̂p̂⟩ = ' + cplx(Exp[0], Exp[1], 6) +
        '        not real, so x̂p̂ is not an observable',
      '⟨p̂x̂⟩ = ' + cplx(Epx[0], Epx[1], 6) +
        '        the same product, written the other way round',
      '⟨x̂p̂⟩ − ⟨p̂x̂⟩ = ' + cplx(Exp[0] - Epx[0], Exp[1] - Epx[1], 6) +
        '  =  iℏ,  measured on the grid',
      '⟨½(x̂p̂ + p̂x̂)⟩ = ' + cplx(symR, symI, 6) +
        '        the symmetrised form is real, and Hermitian'
    ].forEach(function (s, j) {
      put(gWarn, 80, wy + 52 + j * 22, s, j === 3 ? 's-lbl-q' : 's-lbl', 'start', 11);
    });

    var gEnd = S.g({});
    svg.appendChild(gEnd);
    put(gEnd, 60, 676, 'and one number that belongs to the next two sections:',
      's-lbl-b', 'start', 12);
    put(gEnd, 60, 702, 'Δx = √(⟨x̂²⟩ − ⟨x̂⟩²) = ' + num(dx, 6) +
      '        Δp = √(⟨p̂²⟩ − ⟨p̂⟩²) = ' + num(dp, 6) + ' ℏ', 's-lbl-p', 'start', 11);
    put(gEnd, 60, 726, 'Δx · Δp = ' + num(dx * dp, 6) + ' ℏ,  and ℏ/2 = ' +
      num(HB / 2, 6) + ' ℏ — this state sits exactly on the bound', 's-lbl-q', 'start', 11);

    var moral = put(svg, 60, H - 24,
      'the recipe needs Ô Hermitian, ψ normalised, and an ordering chosen. The handout mentions none of the three.',
      's-lbl-f', 'start', 11);

    return function (p) {
      S.op(head, M.beat(p, 0.00, 0.08));
      S.op(sub, M.beat(p, 0.05, 0.14));
      branches.forEach(function (g, j) { S.op(g, M.beat(p, 0.12 + j * 0.10, 0.26 + j * 0.10)); });
      S.op(gWarn, M.beat(p, 0.56, 0.68));
      S.op(gEnd, M.beat(p, 0.74, 0.84));
      S.op(moral, M.beat(p, 0.88, 0.97));
    };
  });

  /* ======================================================================
     7. Ehrenfest: the average of many runs against a classical trajectory.
     =================================================================== */

  A.scene('ehrenfest-hint', function (root) {
    var W = 1220, H = 700;
    var svg = S.root(W, H,
      'A classical oscillation drawn as a smooth curve, with the outcomes of many individual ' +
      'quantum measurements scattered around it and the average of those outcomes tracking ' +
      'the classical curve.');
    root.appendChild(svg);

    var head = put(svg, 60, 34,
      'm d⟨x̂⟩/dt = ⟨p̂⟩ is the first Ehrenfest relation. Here is what it does and does not say.',
      's-lbl-b', 'start', 14);

    var AMP = 3.0, SIG = Math.sqrt(0.5), NRUN = 64, NT = 41, TMAX = 2 * M.TAU;

    /* Individual measurement outcomes, sampled from the coherent-state density
       whose centre is exactly the classical position at that time. Drawn first,
       because the axis is scaled to them. */
    var rnd = M.rng(4211903);
    function gauss() {
      var u = rnd(), v = rnd();
      if (u < 1e-12) u = 1e-12;
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(M.TAU * v);
    }
    var cols = [], j, i;
    for (j = 0; j < NT; j++) {
      var t = TMAX * j / (NT - 1);
      var mu = AMP * Math.cos(t);
      var draws = [], sum = 0;
      for (i = 0; i < NRUN; i++) {
        var d = mu + SIG * gauss();
        draws.push(d);
        sum += d;
      }
      cols.push({ t: t, mu: mu, draws: draws, mean: sum / NRUN });
    }

    /* The axis has to reach the draws that actually came out. M.map clamps, so
       a fixed range would silently stack the handful of outliers past three
       standard deviations along the top and bottom rules — in a figure whose
       entire point is the scatter. */
    var YSPAN = AMP;
    for (j = 0; j < NT; j++) {
      for (i = 0; i < NRUN; i++) {
        if (Math.abs(cols[j].draws[i]) > YSPAN) YSPAN = Math.abs(cols[j].draws[i]);
      }
    }
    YSPAN *= 1.06;

    var x0 = 90, x1 = 1150, yT = 90, yB = 400;
    var PXt = function (t) { return M.map(t, 0, TMAX, x0, x1); };
    var PYx = function (v) { return M.map(v, -YSPAN, YSPAN, yB, yT); };

    svg.appendChild(S.gridLines(x0, yT, x1, yB, 8, 4));
    svg.appendChild(S.line(x0, PYx(0), x1, PYx(0), 's-axis'));
    put(svg, x1, PYx(0) + 18, 'time', 's-lbl', 'end', 11);
    put(svg, x0 - 8, yT - 8, 'position', 's-lbl', 'end', 11);

    /* Classical trajectory: a harmonic oscillator, unit mass and frequency. */
    var cls = S.path('', 's-wave');
    svg.appendChild(cls);
    S.setD(cls, S.polyD(S.sample(400, 0, TMAX, function (t) {
      return [PXt(t), PYx(AMP * Math.cos(t))];
    })));
    put(svg, PXt(TMAX * 0.06), PYx(AMP) - 14, 'classical x(t) = A cos ωt', 's-lbl-w', 'start', 11);

    var gDots = S.g({});
    svg.appendChild(gDots);
    var dotCols = cols.map(function (cdat) {
      var g = S.g({});
      gDots.appendChild(g);
      cdat.draws.forEach(function (d) {
        var c = S.circle(PXt(cdat.t), PYx(d), 1.7, null);
        c.setAttribute('fill', 'var(--probability)');
        c.setAttribute('opacity', '0.35');
        g.appendChild(c);
      });
      return g;
    });

    var avg = S.path('', 's-quantum');
    svg.appendChild(avg);
    put(svg, PXt(TMAX * 0.40), PYx(-AMP) + 26, 'average of ' + NRUN +
      ' runs at each instant', 's-lbl-q', 'start', 11);

    /* How well the run average tracks the classical curve, measured. */
    var sq = 0;
    for (j = 0; j < NT; j++) sq += Math.pow(cols[j].mean - cols[j].mu, 2);
    var rms = Math.sqrt(sq / NT);
    var pred = SIG / Math.sqrt(NRUN);

    /* And where the correspondence stops: a quartic potential, same density. */
    var mu0 = AMP;
    var gx = [], gP = [], gx3 = [];
    for (i = 0; i <= 1200; i++) {
      var xx = mu0 - 7 * SIG + 14 * SIG * i / 1200;
      gx.push(xx);
      var dens = Math.exp(-Math.pow(xx - mu0, 2) / (2 * SIG * SIG));
      gP.push(dens);
      gx3.push(xx * xx * xx * dens);
    }
    var Zq = integrate(gx, gP);
    var x3 = integrate(gx, gx3) / Zq;
    var x3naive = mu0 * mu0 * mu0;

    var left = [
      { s: 'ℏ = m = ω = 1,  A = ' + AMP.toFixed(1) + ',  Δx = ' + SIG.toFixed(4) +
           ',  ' + NRUN + ' runs per instant', c: 's-lbl' },
      { s: 'RMS gap between the run average and the classical curve = ' + rms.toFixed(4),
        c: 's-lbl-q' },
      { s: 'predicted standard error Δx/√N = ' + pred.toFixed(4) + ' — the same size',
        c: 's-lbl-b' },
      { s: 'no single dot follows the curve. The average does, and only the average.',
        c: 's-lbl-p' }
    ].map(function (d, k) {
      return put(svg, 60, 452 + k * 24, d.s, d.c, 'start', 11);
    });

    var right = [
      { s: 'the two relations, together:', c: 's-lbl-b' },
      { s: 'm d⟨x̂⟩/dt = ⟨p̂⟩            derived above as (1.11.3)', c: 's-lbl-q' },
      { s: 'd⟨p̂⟩/dt = −⟨dV/dx⟩         the second one, same method', c: 's-lbl-q' },
      { s: 'Newton would need −dV/dx evaluated at ⟨x̂⟩ instead.', c: 's-lbl' },
      { s: 'For V = ½x² the two coincide, which is why this picture works.', c: 's-lbl' },
      { s: 'For V = ¼x⁴ they do not: ⟨x̂³⟩ = ' + x3.toFixed(4) + ' but ⟨x̂⟩³ = ' +
           x3naive.toFixed(4) + ',', c: 's-lbl-f' },
      { s: 'a gap of ' + (x3 - x3naive).toFixed(4) + ' = 3⟨x̂⟩(Δx)², which is where the',
        c: 's-lbl-f' },
      { s: 'quantum averages leave the classical path.', c: 's-lbl-f' }
    ].map(function (d, k) {
      return put(svg, 640, 452 + k * 22, d.s, d.c, 'start', 11);
    });

    var moral = put(svg, 60, H - 22,
      'quantum mechanics reproduces classical motion in the averages, and in nothing narrower than the averages.',
      's-lbl-b', 'start', 12);

    return function (p) {
      S.op(cls, M.beat(p, 0.02, 0.14));
      var shown = Math.round(M.beat(p, 0.16, 0.62) * NT);
      dotCols.forEach(function (g, k) { S.op(g, k < shown ? 1 : 0); });
      var apts = [];
      for (var k = 0; k < Math.max(2, shown); k++) {
        var cc = cols[Math.min(NT - 1, k)];
        apts.push([PXt(cc.t), PYx(cc.mean)]);
      }
      S.setD(avg, S.polyD(apts));
      S.op(avg, M.beat(p, 0.22, 0.34));
      left.forEach(function (l, k) { S.op(l, M.beat(p, 0.46 + k * 0.06, 0.58 + k * 0.06)); });
      right.forEach(function (l, k) { S.op(l, M.beat(p, 0.62 + k * 0.035, 0.72 + k * 0.035)); });
      S.op(moral, M.beat(p, 0.90, 0.98));
    };
  });
})(window.A = window.A || {});
