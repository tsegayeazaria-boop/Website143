/* Section 1.2, second half: the classical prediction, its divergence, Planck's
   ladder, the Boltzmann weights that make the ladder matter, the resulting
   spectral density, and the exercises that follow from it. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* Shared plot frame in the reduced variable x = hbar w / kB T. */
  function frame(svg, x0, y0, x1, y1, xLab, yLab) {
    svg.appendChild(S.gridLines(x0, y0, x1, y1, 8, 5));
    svg.appendChild(S.axes(x0, y0, x1, y1, xLab, null));
    svg.appendChild(S.text(x0 - 8, y0 - 6, yLab, 's-lbl', 'end'));
  }

  /* --------------------------------- the classical curve against the data --- */

  A.scene('rj-vs-data', function (root) {
    var W = 900, H = 600;
    var svg = S.root(W, H,
      'Measured spectral density plotted against the Rayleigh-Jeans prediction. The two ' +
      'agree at low frequency and part company completely as the frequency rises.');
    root.appendChild(svg);

    var x0 = 100, x1 = 830, yT = 70, yB = 470;
    var xMax = 9, yMax = 1.55;
    var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
    var PY = function (y) { return M.map(y, 0, yMax, yB, yT); };
    frame(svg, x0, yT, x1, yB, 'frequency ω', 'u(ω)');

    /* "Data": Planck's law, which is what the experiments actually measured. */
    var peak = M.planckShape(M.wienX());
    var dataPts = [];
    var rnd = M.rng(90119);
    for (var i = 1; i <= 26; i++) {
      var x = (i / 26) * xMax;
      var y = M.planckShape(x) / peak * 1.25;
      dataPts.push([PX(x), PY(y * (1 + (rnd() - 0.5) * 0.035))]);
    }
    var gData = S.g({});
    svg.appendChild(gData);
    dataPts.forEach(function (d) {
      var c = S.circle(d[0], d[1], 3.4, 's-fill-i');
      c.setAttribute('opacity', '0.9');
      gData.appendChild(c);
    });
    gData.appendChild(S.text(PX(3.6), PY(1.34), 'measured spectral density', 's-lbl-b', 'start'));

    /* Rayleigh-Jeans, normalised to match the data at small x. */
    var scale = (M.planckShape(0.25) / peak * 1.25) / M.rayleighShape(0.25);
    var rj = S.path('', 's-fail');
    svg.appendChild(rj);
    var rjPts = S.sample(200, 0.02, xMax, function (x) {
      return [PX(x), PY(Math.min(yMax * 1.4, M.rayleighShape(x) * scale))];
    });
    S.setD(rj, S.polyD(rjPts));
    var rjLbl = S.text(PX(2.6), PY(1.5), 'classical prediction  u ∝ ω²', 's-lbl-f', 'start');
    svg.appendChild(rjLbl);

    var agree = S.g({});
    svg.appendChild(agree);
    var band = S.rect(PX(0), yT, PX(1.1) - PX(0), yB - yT, null);
    band.setAttribute('fill', 'var(--wave)');
    band.setAttribute('opacity', '0.07');
    agree.appendChild(band);
    agree.appendChild(S.text(PX(0.1), yB + 34, 'they agree here', 's-lbl-w', 'start'));

    var diverge = S.text(PX(3.0), yB + 58,
      'and here the classical curve runs away from every measurement ever made',
      's-lbl-f', 'start');
    svg.appendChild(diverge);

    var note = S.text(W / 2, H - 34,
      'no adjustment of constants fixes this: the shapes are different functions',
      's-lbl-b', 'middle');
    svg.appendChild(note);

    return function (p) {
      S.op(gData, M.beat(p, 0.04, 0.24));
      S.draw(rj, M.easeOut(M.beat(p, 0.26, 0.62)));
      S.op(rj, M.beat(p, 0.24, 0.32));
      S.op(rjLbl, M.beat(p, 0.4, 0.55));
      S.op(agree, M.beat(p, 0.55, 0.7));
      S.op(diverge, M.beat(p, 0.66, 0.82));
      S.op(note, M.beat(p, 0.84, 0.96));
    };
  });

  /* ---------------------------------------------- the ultraviolet catastrophe --- */

  A.scene('uv-catastrophe', function (root) {
    var W = 900, H = 560;
    var svg = S.root(W, H,
      'The area under the classical spectral density is the total energy per unit volume. ' +
      'As the upper limit of the integral is pushed up, that area grows without bound.');
    root.appendChild(svg);

    var x0 = 100, x1 = 820, yT = 80, yB = 420;
    var xMax = 10, yMax = 1.0;
    var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
    var PY = function (y) { return M.map(y, 0, yMax, yB, yT); };
    frame(svg, x0, yT, x1, yB, 'ω', 'u(ω) ∝ ω²');

    var norm = xMax * xMax;
    var curve = S.path('', 's-fail');
    svg.appendChild(curve);
    S.setD(curve, S.polyD(S.sample(200, 0, xMax, function (x) {
      return [PX(x), PY(x * x / norm)];
    })));

    var area = S.el('path', { fill: 'var(--fail)', 'fill-opacity': '0.18', stroke: 'none' });
    svg.appendChild(area);

    var edge = S.line(0, yT, 0, yB, 's-axis s-dash');
    svg.appendChild(edge);

    var readout = S.text(x0, yB + 48, '', 's-lbl-f', 'start');
    readout.setAttribute('font-size', '14');
    svg.appendChild(readout);
    var reading2 = S.text(x0, yB + 76, '', 's-lbl', 'start');
    svg.appendChild(reading2);

    var verdict = S.text(W / 2, H - 40, '', 's-lbl-b', 'middle');
    verdict.setAttribute('font-size', '14');
    svg.appendChild(verdict);

    return function (p) {
      var top = M.lerp(0.6, xMax, M.easeInOut(M.beat(p, 0.05, 0.9)));
      var pts = S.sample(140, 0, top, function (x) { return [PX(x), PY(x * x / norm)]; });
      area.setAttribute('d', S.areaD(pts, yB));
      edge.setAttribute('x1', PX(top)); edge.setAttribute('x2', PX(top));

      /* The integral of omega^2 is omega^3 / 3 -- it has no finite limit. */
      var integral = Math.pow(top, 3) / 3;
      readout.textContent = 'area so far  =  ω³/3  =  ' + integral.toFixed(1) +
        '   (in units where the curve is ω²)';
      reading2.textContent = 'push the upper limit to infinity and this number does too';
      S.op(reading2, M.beat(p, 0.55, 0.72));

      verdict.textContent = 'U/V = ∫₀^∞ u(ω) dω = ∞    the ultraviolet catastrophe';
      S.op(verdict, M.beat(p, 0.75, 0.92));
    };
  });

  /* ------------------------------------------------- Planck's energy ladder --- */

  A.scene('energy-ladder', function (root) {
    var W = 900, H = 580;
    var svg = S.root(W, H,
      'Planck postulated that an oscillator at frequency omega can hold energy only in whole ' +
      'multiples of h-bar omega. Higher frequency means a coarser ladder.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var yB = 470, yT = 80;
    var cols = [
      { x: 190, w: 1, label: 'ω' },
      { x: 450, w: 2, label: '2ω' },
      { x: 710, w: 3, label: '3ω' }
    ];
    svg.appendChild(S.arrow(svg, 90, yB, 90, yT - 20, 'i'));
    svg.appendChild(S.text(84, yT - 28, 'energy', 's-lbl-b', 'end'));

    var built = cols.map(function (c) {
      var g = S.g({});
      svg.appendChild(g);
      var rungs = [], labels = [];
      var step = (yB - yT) / 9 * c.w;
      for (var s = 0; s * step <= (yB - yT) + 1; s++) {
        var y = yB - s * step;
        var l = S.line(c.x - 78, y, c.x + 78, y, 's-quantum');
        l.setAttribute('stroke-width', s === 0 ? '2' : '1.6');
        g.appendChild(l);
        rungs.push(l);
        var lab = S.text(c.x + 88, y + 4, s === 0 ? '0' : (s === 1 ? 'ℏ' + c.label : s + 'ℏ' + c.label),
          's-lbl-q', 'start');
        g.appendChild(lab);
        labels.push(lab);
      }
      g.appendChild(S.text(c.x, yB + 34, 'frequency ' + c.label, 's-lbl-b', 'middle'));
      g.appendChild(S.text(c.x, yB + 56, 'rung spacing ℏ' + c.label, 's-lbl', 'middle'));
      return { g: g, rungs: rungs, labels: labels };
    });

    var rule = S.text(W / 2, H - 46, 'εₛ = s ℏω    with   s = 0, 1, 2, 3, …', 's-lbl-b', 'middle');
    rule.setAttribute('font-size', '16');
    svg.appendChild(rule);
    var note = S.text(W / 2, H - 20,
      'the higher the frequency, the bigger the smallest step you are allowed to take',
      's-lbl-q', 'middle');
    svg.appendChild(note);

    return function (p) {
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.04 + i * 0.12, 0.2 + i * 0.12));
        b.rungs.forEach(function (r, j) {
          var f = M.beat(p, 0.1 + i * 0.12 + j * 0.02, 0.3 + i * 0.12 + j * 0.02);
          S.op(r, f);
          if (b.labels[j]) S.op(b.labels[j], f);
        });
      });
      S.op(rule, M.beat(p, 0.66, 0.84));
      S.op(note, M.beat(p, 0.78, 0.94));
    };
  });

  /* --------------------------- why the ladder kills the high frequencies --- */

  A.scene('boltzmann-ladder', function (root) {
    var W = 920, H = 620;
    var svg = S.root(W, H,
      'Boltzmann occupation of a quantised ladder at fixed temperature. When the rung ' +
      'spacing is small compared with k T the ladder is effectively continuous and holds ' +
      'k T of energy; when the spacing is large the oscillator is stuck on the ground rung ' +
      'and holds almost nothing.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var yB = 460, yT = 90;
    var kT = 1.0;
    var cols = [
      { x: 165, hw: 0.28, name: 'low ω' },
      { x: 420, hw: 1.0, name: 'ω ≈ kᴮT/ℏ' },
      { x: 675, hw: 3.2, name: 'high ω' }
    ];
    var pxPerE = (yB - yT) / 6;

    var built = cols.map(function (c) {
      var g = S.g({});
      svg.appendChild(g);
      var rungs = [], bars = [];
      var Z = 1 / (1 - Math.exp(-c.hw / kT));
      for (var s = 0; s * c.hw <= 6.05; s++) {
        var y = yB - s * c.hw * pxPerE;
        var l = S.line(c.x - 70, y, c.x + 8, y, 's-ghost');
        l.setAttribute('stroke', 'var(--hairline-2)');
        g.appendChild(l); rungs.push(l);
        /* Probability of sitting on rung s at temperature T. */
        var prob = Math.exp(-s * c.hw / kT) / Z;
        var b = S.rect(c.x + 12, y - 7, prob * 92, 14, 's-fill-q');
        b.setAttribute('opacity', '0.85');
        g.appendChild(b); bars.push({ el: b, prob: prob });
      }
      /* Mean energy on this ladder, in units of kT. */
      var xh = c.hw / kT;
      var mean = xh / (Math.exp(xh) - 1);
      g.appendChild(S.text(c.x - 30, yB + 34, c.name, 's-lbl-b', 'middle'));
      var m = S.text(c.x - 30, yB + 58, 'mean energy = ' + mean.toFixed(3) + ' kᴮT', 's-lbl-q', 'middle');
      g.appendChild(m);
      var cls = S.text(c.x - 30, yB + 78, 'classical says 1.000 kᴮT', 's-lbl-f', 'middle');
      g.appendChild(cls);
      return { g: g, rungs: rungs, bars: bars, mean: mean, cls: cls };
    });

    svg.appendChild(S.line(105, yB - kT * pxPerE, 800, yB - kT * pxPerE, 's-axis s-dash'));
    svg.appendChild(S.text(96, yB - kT * pxPerE + 4, 'kᴮT', 's-lbl-w', 'end'));
    svg.appendChild(S.arrow(svg, 105, yB, 105, yT - 16, 'i'));
    svg.appendChild(S.text(99, yT - 24, 'energy', 's-lbl-b', 'end'));
    svg.appendChild(S.text(W - 40, yT - 24, 'bar length = probability of that rung', 's-lbl-q', 'end'));

    var punch = S.text(W / 2, H - 36,
      'the ladder only matters when its rungs are wider than the thermal energy available',
      's-lbl-b', 'middle');
    punch.setAttribute('font-size', '14');
    svg.appendChild(punch);

    return function (p) {
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.04 + i * 0.13, 0.24 + i * 0.13));
        S.op(b.cls, M.beat(p, 0.6, 0.78));
      });
      S.op(punch, M.beat(p, 0.8, 0.95));
    };
  });

  /* --------------------------------------------- the geometric series --- */

  A.scene('partition-series', function (root) {
    var W = 880, H = 340;
    var svg = S.root(W, H,
      'The partition function is a geometric series: successive terms shrink by a constant ' +
      'ratio, and the total is finite.');
    root.appendChild(svg);

    var x0 = 70, yB = 210, ratio = 0.55, unit = 320;
    var terms = [], labels = [];
    var acc = 0;
    for (var s = 0; s < 9; s++) {
      var w = unit * Math.pow(ratio, s);
      var r = S.rect(x0 + acc, yB - 46, w - 2, 46, 's-fill-q');
      r.setAttribute('opacity', String(0.9 - s * 0.06));
      svg.appendChild(r);
      terms.push(r);
      if (s < 4) {
        var t = S.text(x0 + acc + w / 2, yB - 58,
          s === 0 ? '1' : (s === 1 ? 'x' : 'x' + ['', '', '²', '³'][s]), 's-lbl-q', 'middle');
        svg.appendChild(t);
        labels.push(t);
      }
      acc += w;
    }
    var total = unit / (1 - ratio);
    svg.appendChild(S.line(x0, yB + 14, x0 + total, yB + 14, 's-axis'));
    svg.appendChild(S.line(x0, yB + 8, x0, yB + 20, 's-axis'));
    var endTick = S.line(x0 + total, yB + 8, x0 + total, yB + 20, 's-axis');
    svg.appendChild(endTick);
    var sum = S.text(x0 + total / 2, yB + 40, 'total = 1 / (1 − x)', 's-lbl-b', 'middle');
    sum.setAttribute('font-size', '14');
    svg.appendChild(sum);

    svg.appendChild(S.text(x0, 70, 'Z = 1 + x + x² + x³ + …    with   x = e^(−ℏω/kᴮT) < 1', 's-lbl', 'start'));
    var why = S.text(x0, H - 34,
      'the ratio is less than one because the exponent is negative, so the sum converges',
      's-lbl', 'start');
    svg.appendChild(why);

    return function (p) {
      terms.forEach(function (r, i) { S.op(r, M.beat(p, 0.05 + i * 0.06, 0.2 + i * 0.06) * (0.9 - i * 0.06)); });
      labels.forEach(function (l, i) { S.op(l, M.beat(p, 0.05 + i * 0.06, 0.2 + i * 0.06)); });
      S.op(sum, M.beat(p, 0.6, 0.8));
      S.op(endTick, M.beat(p, 0.6, 0.8));
      S.op(why, M.beat(p, 0.76, 0.94));
    };
  });

  /* ------------------------------ Planck's law, with a temperature control --- */

  A.scene('planck-fit', function (root, api) {
    var W = 900, H = 620;
    var svg = S.root(W, H,
      'Planck’s spectral density and the classical one plotted together. Both are shown ' +
      'at a temperature the reader can change; the classical curve never turns over.');
    root.appendChild(svg);

    var x0 = 100, x1 = 830, yT = 70, yB = 450;
    var xMax = 12, yMax = 1.75;
    var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
    var PY = function (y) { return M.map(y, 0, yMax, yB, yT); };
    frame(svg, x0, yT, x1, yB, 'frequency ω  (units of kᴮT₀/ℏ)', 'u(ω)');

    var rj = S.path('', 's-fail');
    var pl = S.path('', 's-quantum');
    var fill = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.10', stroke: 'none' });
    svg.appendChild(fill); svg.appendChild(rj); svg.appendChild(pl);

    var peakMark = S.line(0, 0, 0, 0, 's-axis s-dash');
    svg.appendChild(peakMark);
    var peakLbl = S.text(0, 0, '', 's-lbl-q', 'middle');
    svg.appendChild(peakLbl);

    var rjLbl = S.text(0, 0, 'classical  ∝ ω²', 's-lbl-f', 'start');
    var plLbl = S.text(0, 0, 'Planck', 's-lbl-q', 'start');
    svg.appendChild(rjLbl); svg.appendChild(plLbl);

    /* Temperature control, wired to the same formulas the prose derives. */
    var ui = document.createElement('div');
    ui.className = 'control';
    ui.innerHTML =
      '<label for="pf-T">temperature</label>' +
      '<input id="pf-T" type="range" min="40" max="220" value="100" step="1">' +
      '<output id="pf-out">1.00 T₀</output>';
    root.appendChild(ui);
    var slider = ui.querySelector('#pf-T');
    var out = ui.querySelector('#pf-out');
    var Tuser = 1.0, touched = false;
    slider.addEventListener('input', function () {
      Tuser = Number(slider.value) / 100;
      touched = true;
      out.textContent = Tuser.toFixed(2) + ' T₀';
    });

    var wienX = M.wienX();

    return function (p) {
      /* Until the reader touches the slider the temperature rides the scroll. */
      var T = touched ? Tuser : M.lerp(0.55, 1.5, M.easeInOut(M.beat(p, 0.15, 0.85)));
      if (!touched) out.textContent = T.toFixed(2) + ' T₀';
      if (!touched) slider.value = String(Math.round(T * 100));

      /* u(w) = w^3 / (e^{w/T} - 1) in these units, normalised once at T = 1. */
      var norm = 1 / M.planckShape(wienX) * 1.35;
      var plPts = S.sample(240, 0.01, xMax, function (x) {
        return [PX(x), PY(Math.min(yMax * 1.2, T * T * T * M.planckShape(x / T) * norm))];
      });
      S.setD(pl, S.polyD(plPts));
      fill.setAttribute('d', S.areaD(plPts, yB));

      /* The classical curve is the small-x limit of the same expression. */
      var rjPts = S.sample(200, 0.01, xMax, function (x) {
        return [PX(x), PY(Math.min(yMax * 1.25, T * x * x * norm))];
      });
      S.setD(rj, S.polyD(rjPts));

      var xp = wienX * T;
      peakMark.setAttribute('x1', PX(xp)); peakMark.setAttribute('x2', PX(xp));
      peakMark.setAttribute('y1', yT); peakMark.setAttribute('y2', yB);
      peakLbl.setAttribute('x', PX(xp));
      peakLbl.setAttribute('y', yT - 12);
      peakLbl.textContent = 'peak at ω = 2.82 kᴮT/ℏ';

      rjLbl.setAttribute('x', PX(1.1)); rjLbl.setAttribute('y', PY(yMax * 0.95));
      plLbl.setAttribute('x', PX(xp) + 14); plLbl.setAttribute('y', PY(1.05));

      S.op(pl, M.beat(p, 0.05, 0.2));
      S.op(fill, M.beat(p, 0.1, 0.3));
      S.op(rj, M.beat(p, 0.2, 0.38));
      S.op(rjLbl, M.beat(p, 0.28, 0.44));
      S.op(plLbl, M.beat(p, 0.12, 0.28));
      S.op(peakMark, M.beat(p, 0.4, 0.55));
      S.op(peakLbl, M.beat(p, 0.4, 0.55));
    };
  });

  /* --------------------------------- the low-frequency limit, term by term --- */

  A.scene('low-omega', function (root) {
    var W = 880, H = 420;
    var svg = S.root(W, H,
      'Close to the origin the Planck curve and the classical curve lie on top of each other. ' +
      'The expansion of the exponential is why.');
    root.appendChild(svg);

    var x0 = 90, x1 = 560, yT = 60, yB = 330;
    var xMax = 1.4, yMax = 2.1;
    var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
    var PY = function (y) { return M.map(y, 0, yMax, yB, yT); };
    frame(svg, x0, yT, x1, yB, 'ω, small', 'u(ω)');

    var pl = S.path('', 's-quantum');
    var rj = S.path('', 's-fail');
    rj.setAttribute('stroke-dasharray', '6 4');
    svg.appendChild(pl); svg.appendChild(rj);
    S.setD(pl, S.polyD(S.sample(180, 0.005, xMax, function (x) {
      return [PX(x), PY(M.planckShape(x))];
    })));
    S.setD(rj, S.polyD(S.sample(180, 0.005, xMax, function (x) {
      return [PX(x), PY(M.rayleighShape(x))];
    })));
    svg.appendChild(S.text(PX(1.0), PY(1.3), 'Planck', 's-lbl-q', 'start'));
    svg.appendChild(S.text(PX(0.95), PY(0.55), 'classical', 's-lbl-f', 'start'));

    var chain = [
      'for small x,   eˣ  ≈  1 + x',
      'so   eˣ − 1  ≈  x',
      'so   1/(eˣ − 1)  ≈  1/x     with   x = ℏω/kᴮT',
      'u(ω) → (ℏω³/π²c³)(kᴮT/ℏω)  =  ω²kᴮT/π²c³',
      'which is exactly the classical formula'
    ];
    var lines = chain.map(function (s, i) {
      var t = S.text(600, 100 + i * 42, s, i === 4 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 4 ? '13' : '12');
      svg.appendChild(t);
      return t;
    });

    var moral = S.text(W / 2, H - 30,
      'the classical answer was not wrong, it was the low-frequency corner of a bigger one',
      's-lbl-w', 'middle');
    svg.appendChild(moral);

    return function (p) {
      S.draw(pl, M.easeOut(M.beat(p, 0.03, 0.35)));
      S.draw(rj, M.easeOut(M.beat(p, 0.1, 0.42)));
      lines.forEach(function (l, i) { S.op(l, M.beat(p, 0.28 + i * 0.1, 0.44 + i * 0.1)); });
      S.op(moral, M.beat(p, 0.82, 0.96));
    };
  });

  /* ------------------------------- solving 3(1 - e^-x) = x by Newton's method --- */

  A.scene('wien-newton', function (root) {
    var W = 880, H = 440;
    var svg = S.root(W, H,
      'The peak condition rearranges to three times one minus e to the minus x equals x. ' +
      'Newton iterations converge on 2.8214 in a handful of steps.');
    root.appendChild(svg);

    var x0 = 80, x1 = 470, yT = 60, yB = 330;
    var xMax = 5, yMax = 3.4;
    var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
    var PY = function (y) { return M.map(y, 0, yMax, yB, yT); };
    frame(svg, x0, yT, x1, yB, 'x = ℏω/kᴮT', null);

    var lhs = S.path('', 's-quantum');
    var rhs = S.path('', 's-wave');
    svg.appendChild(lhs); svg.appendChild(rhs);
    S.setD(lhs, S.polyD(S.sample(160, 0, xMax, function (x) {
      return [PX(x), PY(3 * (1 - Math.exp(-x)))];
    })));
    S.setD(rhs, S.polyD(S.sample(2, 0, xMax, function (x) { return [PX(x), PY(x)]; })));
    svg.appendChild(S.text(PX(4.1), PY(3.15), '3(1 − e⁻ˣ)', 's-lbl-q', 'start'));
    svg.appendChild(S.text(PX(3.1), PY(3.3), 'x', 's-lbl-w', 'start'));

    var its = M.wienIterates(1.0, 7);
    var root0 = its[its.length - 1];
    var mark = S.line(PX(root0), yT, PX(root0), yB, 's-axis s-dash');
    svg.appendChild(mark);
    var markLbl = S.text(PX(root0), yB + 24, 'x = ' + root0.toFixed(4), 's-lbl-b', 'middle');
    svg.appendChild(markLbl);

    var dot = S.circle(PX(its[0]), PY(its[0]), 5, 's-fill-f');
    svg.appendChild(dot);

    var rows = its.slice(0, 6).map(function (v, i) {
      var t = S.text(560, 96 + i * 30,
        'x' + ['₀', '₁', '₂', '₃', '₄', '₅'][i] + '  =  ' + v.toFixed(8), 's-lbl', 'start');
      svg.appendChild(t);
      return t;
    });
    svg.appendChild(S.text(560, 66, 'Newton iterates', 's-lbl-b', 'start'));

    var conc = S.text(560, 300, 'ω_peak = 2.8214 kᴮT / ℏ', 's-lbl-q', 'start');
    conc.setAttribute('font-size', '14');
    svg.appendChild(conc);
    var conc2 = S.text(560, 326, 'the handout quotes 2.82', 's-lbl', 'start');
    svg.appendChild(conc2);

    return function (p) {
      S.draw(lhs, M.easeOut(M.beat(p, 0.02, 0.22)));
      S.draw(rhs, M.easeOut(M.beat(p, 0.08, 0.28)));
      var k = M.clamp(Math.floor(M.beat(p, 0.3, 0.85) * 6), 0, 5);
      var v = its[k];
      dot.setAttribute('cx', PX(v)); dot.setAttribute('cy', PY(v));
      rows.forEach(function (r, i) { S.op(r, i <= k ? 1 : 0.12); });
      S.op(mark, M.beat(p, 0.7, 0.85));
      S.op(markLbl, M.beat(p, 0.7, 0.85));
      S.op(conc, M.beat(p, 0.8, 0.92));
      S.op(conc2, M.beat(p, 0.86, 0.97));
    };
  });

  /* ------------------------------------ where three black bodies actually peak --- */

  A.scene('spectrum-bar', function (root) {
    var W = 1080, H = 400;
    var svg = S.root(W, H,
      'The electromagnetic spectrum on a logarithmic frequency axis, with the peak ' +
      'frequencies of the Sun, the Earth and the cosmic microwave background marked.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 70, x1 = 1010, yBar = 150, hBar = 40;
    var lo = 9, hi = 17;   /* log10 of frequency in Hz */
    var PX = function (lg) { return M.map(lg, lo, hi, x0, x1); };

    var bands = [
      ['radio', 9, 10.5], ['microwave', 10.5, 11.7], ['infrared', 11.7, 14.3],
      ['visible', 14.3, 14.9], ['ultraviolet', 14.9, 16.1], ['X-ray', 16.1, 17]
    ];
    var gBands = S.g({});
    svg.appendChild(gBands);
    bands.forEach(function (b) {
      var r = S.rect(PX(b[1]), yBar, PX(b[2]) - PX(b[1]), hBar, null);
      /* Visible band gets its true colours; the rest are neutral. */
      if (b[0] === 'visible') {
        for (var i = 0; i < 30; i++) {
          var nm = 700 - (i / 29) * 320;
          var seg = S.rect(PX(b[1]) + (i / 30) * (PX(b[2]) - PX(b[1])),
            yBar, (PX(b[2]) - PX(b[1])) / 30 + 1, hBar, null);
          seg.setAttribute('fill', M.wavelengthRGB(nm));
          gBands.appendChild(seg);
        }
      } else {
        r.setAttribute('fill', 'var(--surface-2)');
        r.setAttribute('stroke', 'var(--hairline)');
        gBands.appendChild(r);
      }
      gBands.appendChild(S.text((PX(b[1]) + PX(b[2])) / 2, yBar + hBar + 20, b[0], 's-tick', 'middle'));
    });
    for (var lg = lo; lg <= hi; lg++) {
      gBands.appendChild(S.line(PX(lg), yBar + hBar, PX(lg), yBar + hBar + 6, 's-axis'));
      gBands.appendChild(S.text(PX(lg), yBar - 10, '10' + ['⁹', '¹⁰', '¹¹', '¹²', '¹³', '¹⁴', '¹⁵', '¹⁶', '¹⁷'][lg - lo], 's-tick', 'middle'));
    }
    gBands.appendChild(S.text(x0, yBar - 34, 'frequency ν  (Hz)', 's-lbl', 'start'));

    /* nu_peak = 2.8214 kB T / (2 pi hbar). Computed, not looked up. */
    var C = M.C, wien = M.wienX();
    function nuPeak(T) { return wien * C.kB * T / (C.hbar * M.TAU); }
    var marks = [
      { T: 5780, name: 'the Sun', sub: 'surface 5780 K' },
      { T: 250, name: 'the Earth', sub: 'surface 250 K' },
      { T: 2.73, name: 'cosmic microwave background', sub: '2.73 K' }
    ].map(function (m, i) {
      var nu = nuPeak(m.T);
      var lgv = Math.log10(nu);
      var g = S.g({});
      svg.appendChild(g);
      var y = 250 + i * 46;
      g.appendChild(S.arrow(svg, PX(lgv), y, PX(lgv), yBar + hBar + 4, 'q'));
      var lbl = S.text(PX(lgv) + 10, y + 4,
        m.name + '  ·  ν = ' + nu.toExponential(2).replace('e+', ' × 10^') + ' Hz  ·  λ = ' +
        (C.c / nu * 1e6).toPrecision(3) + ' µm', 's-lbl-q', 'start');
      g.appendChild(lbl);
      return g;
    });

    var note = S.text(W / 2, H - 24,
      'the Sun peaks just past the red end, the Earth deep in the infrared, ' +
      'the early universe in the microwaves', 's-lbl-b', 'middle');
    svg.appendChild(note);

    return function (p) {
      S.op(gBands, M.beat(p, 0.03, 0.24));
      marks.forEach(function (g, i) { S.op(g, M.beat(p, 0.28 + i * 0.14, 0.48 + i * 0.14)); });
      S.op(note, M.beat(p, 0.8, 0.95));
    };
  });

  /* ------------------------------------------------ how many photons a second --- */

  A.scene('photon-stream', function (root, api) {
    var W = 880, H = 300;
    var svg = S.root(W, H,
      'A one milliwatt red laser emits about three point three times ten to the fifteen ' +
      'photons every second, which is why its beam looks perfectly smooth.');
    root.appendChild(svg);

    var C = M.C;
    var lam = 650e-9;
    var Eph = C.h * C.c / lam;
    var rate = 1e-3 / Eph;

    svg.appendChild(S.rect(60, 120, 74, 34, 's-ghost'));
    var pointer = S.rect(60, 120, 74, 34, null);
    pointer.setAttribute('fill', 'var(--surface-2)');
    pointer.setAttribute('stroke', 'var(--hairline-2)');
    svg.appendChild(pointer);
    svg.appendChild(S.text(97, 172, '1 mW  ·  650 nm', 's-lbl', 'middle'));

    var gDots = S.g({});
    svg.appendChild(gDots);
    var dots = [];
    var rnd = M.rng(31415);
    for (var i = 0; i < 150; i++) {
      var d = S.circle(0, 0, 1.9, 's-fill-f');
      gDots.appendChild(d);
      dots.push({ el: d, off: rnd(), y: 120 + rnd() * 34, sp: 0.5 + rnd() * 0.6 });
    }

    var lines = [
      'E = hc/λ = ' + Eph.toExponential(2).replace('e-', ' × 10⁻') + ' J = ' +
        (Eph / C.e).toFixed(2) + ' eV',
      'N/t = P/E = 10⁻³ W ÷ ' + Eph.toExponential(1).replace('e-', ' × 10⁻') + ' J',
      'N/t ≈ ' + (rate / 1e15).toFixed(1) + ' × 10¹⁵ photons per second'
    ].map(function (s, i) {
      var t = S.text(320, 212 + i * 26, s, i === 2 ? 's-lbl-b' : 's-lbl', 'start');
      svg.appendChild(t);
      return t;
    });

    var note = S.text(320, 96,
      'individually discrete, collectively indistinguishable from a continuous beam',
      's-lbl-f', 'start');
    svg.appendChild(note);

    return function (p, t) {
      var time = api.reduced ? 0.4 : t;
      dots.forEach(function (d) {
        var u = ((time * d.sp + d.off) % 1);
        d.el.setAttribute('cx', (140 + u * 700).toFixed(1));
        d.el.setAttribute('cy', d.y.toFixed(1));
        d.el.setAttribute('opacity', (0.25 + 0.6 * Math.sin(u * Math.PI)).toFixed(2));
      });
      S.op(gDots, M.beat(p, 0.05, 0.25));
      S.op(note, M.beat(p, 0.3, 0.5));
      lines.forEach(function (l, i) { S.op(l, M.beat(p, 0.4 + i * 0.13, 0.58 + i * 0.13)); });
    };
  });
})(window.A = window.A || {});
