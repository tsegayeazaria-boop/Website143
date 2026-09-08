/* The bridge into the second set of notes: a map of what is coming, and Born's
   rule shown as an accumulation rather than asserted as a formula. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------------------ roadmap --- */

  A.scene('pre2-roadmap', function (root) {
    var W = 1100, H = 460;
    var svg = S.root(W, H,
      'A map of the six sections ahead: collapse, probability current, operators, ' +
      'expectation values, uncertainty, and commutators.');
    root.appendChild(svg);

    var STATIONS = [
      { n: '1.8',  t: 'Collapse',
        say: 'A measurement does not reveal where the particle was. It decides where it is.' },
      { n: '1.9',  t: 'Probability current',
        say: 'Probability is never created or destroyed. It flows, and this is the flow.' },
      { n: '1.10', t: 'Operators',
        say: 'Every observable turns out to be something you do to the wavefunction.' },
      { n: '1.11', t: 'Expectation values',
        say: 'What you get on average — and why m d⟨x⟩/dt comes out to exactly ⟨p⟩.' },
      { n: '1.12', t: 'Uncertainty',
        say: 'Narrow in position means wide in wavenumber. True of waves before it is physics.' },
      { n: '1.13', t: 'Commutators',
        say: 'The same two operations in the other order. What is left over is iħ.' }
    ];

    var x0 = 100, x1 = 1000, yS = 190;
    var spine = S.line(x0, yS, x1, yS, 's-axis');
    svg.appendChild(spine);

    svg.appendChild(S.text(W / 2, 58,
      'Born said what |ψ|² means. These six sections say what follows.', 's-lbl-b', 'middle'))
      .setAttribute('font-size', '16');

    var nodes = [];
    for (var i = 0; i < STATIONS.length; i++) {
      var st = STATIONS[i];
      var cx = M.lerp(x0, x1, i / (STATIONS.length - 1));
      var g = S.g({});
      var ring = S.circle(cx, yS, 21, 's-axis');
      ring.setAttribute('fill', 'var(--ground)');
      var core = S.circle(cx, yS, 21, 's-wave');
      core.setAttribute('fill', 'var(--wave)');
      core.setAttribute('fill-opacity', '0.14');
      var num = S.text(cx, yS + 5, st.n, 's-lbl-w', 'middle');
      num.setAttribute('font-size', '12');
      var ttl = S.text(cx, yS + 52, st.t, 's-lbl', 'middle');
      g.appendChild(ring); g.appendChild(core); g.appendChild(num); g.appendChild(ttl);
      svg.appendChild(g);
      nodes.push({ g: g, core: core, num: num, ttl: ttl, say: st.say, cx: cx });
    }

    var caption = S.text(W / 2, 330, '', 's-lbl-b', 'middle');
    caption.setAttribute('font-size', '15');
    svg.appendChild(caption);

    var tail = S.text(W / 2, 398,
      'One thread runs through all six: the wavefunction is not a picture of the particle, ' +
      'it is the whole of what can be known about it.', 's-lbl', 'middle');
    svg.appendChild(tail);

    return function (p) {
      var lit = M.beat(p, 0.05, 0.72) * STATIONS.length;
      S.draw(spine, M.beat(p, 0.02, 0.7));
      var active = -1;
      for (var i = 0; i < nodes.length; i++) {
        var on = M.clamp(lit - i, 0, 1);
        S.op(nodes[i].g, 0.18 + 0.82 * on);
        nodes[i].core.setAttribute('fill-opacity', String(0.05 + 0.35 * on));
        nodes[i].core.setAttribute('stroke-opacity', String(0.15 + 0.85 * on));
        if (on > 0.35) active = i;
      }
      caption.textContent = active >= 0 ? nodes[active].say : '';
      S.op(caption, active >= 0 ? 1 : 0);
      S.op(tail, M.beat(p, 0.78, 0.95));
    };
  });

  /* ------------------------------------------ Born's rule as accumulation --- */

  A.scene('born-recap', function (root) {
    var W = 1000, H = 620;
    var svg = S.root(W, H,
      'Single electron detections landing one at a time on a screen. Each one is ' +
      'unpredictable; the histogram they build converges to the modulus squared of the ' +
      'wavefunction.');
    root.appendChild(svg);

    var x0 = 80, x1 = 920;
    var yScreen = 150, yBase = 520, yTop = 250;

    /* The density: a two-slit pattern, envelope times fringes, normalised
       numerically so the curve and the histogram are on the same footing. */
    var NB = 84;
    function shape(u) {                    /* u in 0..1 across the screen */
      var s = (u - 0.5) * 2;               /* -1..1 */
      var env = M.sinc(s * 2.35);
      var fr = Math.cos(s * 9.4);
      return env * env * fr * fr;
    }
    var bins = [], norm = 0, k;
    for (k = 0; k < NB; k++) {
      var v = shape((k + 0.5) / NB);
      bins.push(v); norm += v;
    }
    var cdf = [], run = 0;
    for (k = 0; k < NB; k++) { run += bins[k] / norm; cdf.push(run); }
    var peak = 0;
    for (k = 0; k < NB; k++) peak = Math.max(peak, bins[k] / norm);

    /* Pre-draw a fixed sequence of detections by inverse-transform sampling. */
    var NMAX = 1400;
    var rnd = M.rng(19260713);
    var hits = [];
    for (k = 0; k < NMAX; k++) {
      var r = rnd(), lo = 0;
      while (lo < NB - 1 && cdf[lo] < r) lo++;
      hits.push((lo + rnd()) / NB);
    }

    svg.appendChild(S.line(x0, yScreen, x1, yScreen, 's-axis'));
    svg.appendChild(S.text(x0, yScreen - 26, 'the screen — one electron at a time', 's-lbl', 'start'));

    var dotLayer = S.g({});
    svg.appendChild(dotLayer);
    var dots = [];
    for (k = 0; k < NMAX; k++) {
      var d = S.circle(M.lerp(x0, x1, hits[k]), yScreen + 6 + ((k * 37) % 44), 1.5, 's-fill-q');
      d.setAttribute('fill-opacity', '0');
      dotLayer.appendChild(d);
      dots.push(d);
    }

    svg.appendChild(S.axes(x0, yTop - 20, x1, yBase, 'position on the screen', null));

    var barLayer = S.g({});
    svg.appendChild(barLayer);
    var bars = [];
    var bw = (x1 - x0) / NB;
    for (k = 0; k < NB; k++) {
      var b = S.rect(x0 + k * bw + 0.6, yBase, Math.max(1, bw - 1.2), 0, 's-fill-q');
      b.setAttribute('fill-opacity', '0.42');
      barLayer.appendChild(b);
      bars.push(b);
    }

    var curve = S.path('', 's-prob');
    svg.appendChild(curve);
    var curveLbl = S.text(x1, yTop - 34, '|ψ|²  — the wavefunction, squared', 's-lbl-p', 'end');
    svg.appendChild(curveLbl);

    var count = S.text(x0, yBase + 52, '', 's-lbl-q', 'start');
    count.setAttribute('font-size', '15');
    svg.appendChild(count);
    var verdict = S.text(x0, yBase + 80, '', 's-lbl', 'start');
    svg.appendChild(verdict);

    var lastN = 0;
    return function (p) {
      var n = Math.round(M.easeIn(M.beat(p, 0.06, 0.88)) * NMAX);
      var i;
      if (n !== lastN) {
        var lo = Math.min(lastN, n), hi = Math.max(lastN, n);
        for (i = lo; i < hi; i++) dots[i].setAttribute('fill-opacity', i < n ? '0.55' : '0');
        lastN = n;
      }
      /* Histogram and curve share one axis, in units of probability per bin.
         The axis is whichever is larger: the curve's own peak, or the tallest
         bar so far. Early on the fluctuations set the scale and the curve is a
         low bump; as n grows the axis settles onto the curve and the histogram
         converges into it. Nothing is clipped and nothing is fudged. */
      var counts = [], mxc = 0;
      for (i = 0; i < NB; i++) counts.push(0);
      for (i = 0; i < n; i++) counts[Math.min(NB - 1, Math.floor(hits[i] * NB))]++;
      for (i = 0; i < NB; i++) mxc = Math.max(mxc, counts[i]);
      var axisMax = Math.max(peak * 1.12, n ? (mxc / n) * 1.05 : peak * 1.12);
      for (i = 0; i < NB; i++) {
        var hgt = n ? ((counts[i] / n) / axisMax) * (yBase - yTop) : 0;
        bars[i].setAttribute('y', String(yBase - hgt));
        bars[i].setAttribute('height', String(Math.max(0, hgt)));
      }
      S.setD(curve, S.polyD(S.sample(300, 0, 1, function (u) {
        return [M.lerp(x0, x1, u), M.map(shape(u) / norm, 0, axisMax, yBase, yTop)];
      })));
      S.op(barLayer, M.beat(p, 0.14, 0.3));
      S.op(curve, M.beat(p, 0.55, 0.75));
      S.op(curveLbl, M.beat(p, 0.6, 0.8));

      count.textContent = 'electrons detected:  ' + n;
      verdict.textContent = n < 60
        ? 'no pattern yet — each landing point is genuinely unpredictable'
        : (n < 700
          ? 'the pattern is emerging, and no single electron knew about it'
          : 'the histogram is |ψ|². That statement is Born’s hypothesis.');
    };
  });
})(window.A = window.A || {});
