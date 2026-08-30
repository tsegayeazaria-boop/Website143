/* Section 1.7: Born's rule, normalisation, the wavefunctions that have to be
   thrown away, the dimensions of psi, and the proof that normalisation lasts. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------ squaring away the phase --- */

  A.scene('born-modulus', function (root, api) {
    var W = 900, H = 420;
    var svg = S.root(W, H,
      'Two wavefunctions differing only by a phase. Their moduli squared are identical, so ' +
      'no measurement can distinguish them.');
    root.appendChild(svg);

    var x0 = 70, x1 = 830, cyA = 120, cyB = 320, amp = 62;
    svg.appendChild(S.line(x0, cyA, x1, cyA, 's-axis'));
    svg.appendChild(S.line(x0, cyB, x1, cyB, 's-axis'));
    svg.appendChild(S.text(x0, cyA - amp - 22, 'ψ  and  e^{iθ} ψ  — different functions', 's-lbl', 'start'));
    svg.appendChild(S.text(x0, cyB - amp - 22, '|ψ|²  and  |e^{iθ} ψ|²  — the same function', 's-lbl-p', 'start'));

    var w1 = S.path('', 's-wave');
    var w2 = S.path('', 's-quantum');
    w2.setAttribute('stroke-dasharray', '6 4');
    var m1 = S.path('', 's-prob');
    var m2 = S.path('', 's-prob');
    m2.setAttribute('stroke-dasharray', '6 4');
    m2.setAttribute('stroke', 'var(--quantum)');
    svg.appendChild(w1); svg.appendChild(w2); svg.appendChild(m1); svg.appendChild(m2);

    var verdict = S.text(W / 2, H - 22,
      'the overall phase carries no information a detector can reach — but relative phases do, ' +
      'and that is what interferes', 's-lbl-b', 'middle');
    svg.appendChild(verdict);

    return function (p, t) {
      var theta = api.reduced ? 1.9 : (t * 0.7) % M.TAU;
      var env = function (x) { return Math.exp(-Math.pow((x - 0.5) * 4.2, 2)); };
      var k = 26;

      S.setD(w1, S.polyD(S.sample(340, 0, 1, function (u) {
        return [M.lerp(x0, x1, u), cyA - env(u) * Math.cos(k * u) * amp];
      })));
      S.setD(w2, S.polyD(S.sample(340, 0, 1, function (u) {
        return [M.lerp(x0, x1, u), cyA - env(u) * Math.cos(k * u + theta) * amp];
      })));
      var mod = S.polyD(S.sample(340, 0, 1, function (u) {
        return [M.lerp(x0, x1, u), cyB - env(u) * env(u) * amp * 1.25];
      }));
      S.setD(m1, mod); S.setD(m2, mod);

      S.op(w1, M.beat(p, 0.03, 0.2));
      S.op(w2, M.beat(p, 0.18, 0.36));
      S.op(m1, M.beat(p, 0.4, 0.58));
      S.op(m2, M.beat(p, 0.46, 0.64));
      S.op(verdict, M.beat(p, 0.7, 0.9));
    };
  });

  /* ------------------------------------------------------ normalisation --- */

  A.scene('normalization', function (root) {
    var W = 920, H = 560;
    var svg = S.root(W, H,
      'A solution of the Schrodinger equation whose modulus squared integrates to something ' +
      'other than one, and the rescaling that fixes it.');
    root.appendChild(svg);

    var x0 = 90, x1 = 830, yB = 380, yT = 90;
    svg.appendChild(S.axes(x0, yT, x1, yB, 'x', null));
    svg.appendChild(S.text(x0 - 8, yT - 8, '|ψ|²', 's-lbl-p', 'end'));

    var area = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.20', stroke: 'none' });
    var curve = S.path('', 's-prob');
    svg.appendChild(area); svg.appendChild(curve);

    var readout = S.text(x0, yB + 44, '', 's-lbl-p', 'start');
    readout.setAttribute('font-size', '15');
    svg.appendChild(readout);
    var step = S.text(x0, yB + 74, '', 's-lbl', 'start');
    svg.appendChild(step);

    var rule = S.text(x0, yB + 118, 'ψ = ψₛ / √A     so that     ∫ |ψ|² d³r = 1', 's-lbl-b', 'start');
    rule.setAttribute('font-size', '15');
    svg.appendChild(rule);
    var rule2 = S.text(x0, yB + 146,
      'this is always allowed: the Schrödinger equation is linear, so any constant multiple ' +
      'of a solution is a solution', 's-lbl', 'start');
    svg.appendChild(rule2);

    /* Unit-area Gaussian, scaled by A so the area is visibly wrong then fixed. */
    var sig = 0.16;
    return function (p) {
      var A0 = M.lerp(3.1, 1.0, M.easeInOut(M.beat(p, 0.30, 0.80)));
      var pts = S.sample(280, 0, 1, function (u) {
        var g = Math.exp(-Math.pow((u - 0.5) / sig, 2) / 2) / (sig * Math.sqrt(M.TAU));
        return [M.lerp(x0, x1, u), M.map(g * A0, 0, 3.4, yB, yT)];
      });
      S.setD(curve, S.polyD(pts));
      area.setAttribute('d', S.areaD(pts, yB));

      readout.textContent = '∫ |ψ|² dx  =  ' + A0.toFixed(3);
      var done = A0 < 1.02;
      readout.setAttribute('class', done ? 's-lbl-w' : 's-lbl-f');
      step.textContent = done
        ? 'normalised: the particle is somewhere, with probability one'
        : 'not a probability density yet — the total does not come to one';
      S.op(rule, M.beat(p, 0.2, 0.36));
      S.op(rule2, M.beat(p, 0.3, 0.48));
    };
  });

  /* --------------------------------------- the solutions that get thrown out --- */

  A.scene('nonnormalizable', function (root) {
    var W = 900, H = 400;
    var svg = S.root(W, H,
      'Three candidate wavefunctions: one that grows without bound, one that blows up at a ' +
      'point, and one that decays. Only the third can be normalised.');
    root.appendChild(svg);

    var panels = [
      { x: 60, label: 'ψ ∝ e^{+x}', sub: 'grows without bound', ok: false,
        fn: function (u) { return Math.exp((u - 0.5) * 4) / 8; } },
      { x: 350, label: 'ψ ∝ 1/x', sub: 'infinite at a point', ok: false,
        fn: function (u) { return Math.min(3, 0.09 / Math.abs(u - 0.5)); } },
      { x: 640, label: 'ψ ∝ e^{−x²}', sub: 'square-integrable', ok: true,
        fn: function (u) { return 2.4 * Math.exp(-Math.pow((u - 0.5) * 5, 2)); } }
    ];

    var built = panels.map(function (pn) {
      var g = S.g({});
      svg.appendChild(g);
      var w = 220, yB = 300, yT = 90;
      g.appendChild(S.line(pn.x, yB, pn.x + w, yB, 's-axis'));
      var path = S.path('', pn.ok ? 's-prob' : 's-fail');
      g.appendChild(path);
      S.setD(path, S.polyD(S.sample(200, 0.02, 0.98, function (u) {
        return [pn.x + u * w, yB - Math.min(3.1, pn.fn(u)) * (yB - yT) / 3.2];
      })));
      g.appendChild(S.text(pn.x + w / 2, 68, pn.label, pn.ok ? 's-lbl-p' : 's-lbl-f', 'middle'));
      g.appendChild(S.text(pn.x + w / 2, yB + 24, pn.sub, 's-lbl', 'middle'));
      var verdict = S.text(pn.x + w / 2, yB + 48, pn.ok ? 'keep' : 'discard',
        pn.ok ? 's-lbl-w' : 's-lbl-f', 'middle');
      verdict.setAttribute('font-size', '14');
      g.appendChild(verdict);
      return g;
    });

    var note = S.text(W / 2, H - 24,
      'we will meet useful improper wavefunctions later that break this rule on purpose',
      's-lbl', 'middle');
    svg.appendChild(note);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.05 + i * 0.16, 0.28 + i * 0.16)); });
      S.op(note, M.beat(p, 0.7, 0.9));
    };
  });

  /* --------------------------------------------------- dimensions of psi --- */

  A.scene('psi-dimensions', function (root) {
    var W = 880, H = 340;
    var svg = S.root(W, H,
      'Dimensional analysis of the wavefunction, from the requirement that the integral of ' +
      'its modulus squared over space is the dimensionless number one.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var rows = [
      ['three dimensions', '∫ |ψ|² d³r = 1', '[ψ]² × L³ = 1', '[ψ] = L^(−3/2)', 'm^(−3/2)'],
      ['one dimension', '∫ |ψ|² dx = 1', '[ψ]² × L = 1', '[ψ] = L^(−1/2)', 'm^(−1/2)']
    ];
    var xs = [70, 250, 440, 610, 780];
    var head = ['', 'normalisation', 'dimensions', 'so', 'in SI'];

    var gHead = S.g({});
    svg.appendChild(gHead);
    head.forEach(function (h, i) { if (h) gHead.appendChild(S.text(xs[i], 84, h, 's-lbl-q', 'start')); });
    gHead.appendChild(S.line(70, 96, 860, 96, 's-axis'));

    var built = rows.map(function (r, i) {
      var g = S.g({});
      svg.appendChild(g);
      r.forEach(function (cell, j) {
        var t = S.text(xs[j], 136 + i * 46, cell, j === 3 ? 's-lbl-b' : 's-lbl', 'start');
        if (j === 3) t.setAttribute('font-size', '13');
        g.appendChild(t);
      });
      return g;
    });

    var note = S.text(W / 2, H - 44,
      'the wavefunction is not dimensionless, and its units depend on how many dimensions ' +
      'you are working in', 's-lbl-b', 'middle');
    svg.appendChild(note);
    var note2 = S.text(W / 2, H - 20,
      'which is a strong hint that ψ itself is not a physical field like E', 's-lbl', 'middle');
    svg.appendChild(note2);

    return function (p) {
      S.op(gHead, M.beat(p, 0.04, 0.22));
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.2 + i * 0.16, 0.42 + i * 0.16)); });
      S.op(note, M.beat(p, 0.6, 0.8));
      S.op(note2, M.beat(p, 0.74, 0.92));
    };
  });

  /* -------------------------- normalisation survives, by the continuity equation --- */

  A.scene('current-conservation', function (root) {
    var W = 940, H = 600;
    var svg = S.root(W, H,
      'A wave packet spreading in time. Its height falls and its width grows in step, so the ' +
      'area underneath never changes.');
    root.appendChild(svg);

    var x0 = 80, x1 = 700, yB = 330, yT = 80;
    svg.appendChild(S.axes(x0, yT, x1, yB, 'x', null));
    svg.appendChild(S.text(x0 - 8, yT - 8, '|ψ|²', 's-lbl-p', 'end'));

    var ghosts = [];
    for (var g = 0; g < 4; g++) {
      var pth = S.path('', 's-ghost');
      svg.appendChild(pth);
      ghosts.push(pth);
    }
    var area = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.18', stroke: 'none' });
    var curve = S.path('', 's-prob');
    svg.appendChild(area); svg.appendChild(curve);

    var readout = S.text(x0, yB + 40, '', 's-lbl-b', 'start');
    readout.setAttribute('font-size', '14');
    svg.appendChild(readout);

    var proof = [
      '∂|ψ|²/∂t = ψ* ∂ψ/∂t + ψ ∂ψ*/∂t',
      'substitute the Schrödinger equation and its complex conjugate',
      '= (iℏ/2m)( ψ* ∇²ψ − ψ ∇²ψ* )        the V terms cancel because V is real',
      '= − ∇ · J        with        J = (ℏ/2mi)( ψ* ∇ψ − ψ ∇ψ* )',
      'integrate over all space and use the divergence theorem:',
      'd/dt ∫ |ψ|² d³r = − ∮ J · dA = 0        for any normalisable ψ'
    ].map(function (s, i) {
      var t = S.text(60, 410 + i * 28, s, i === 5 ? 's-lbl-w' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 5 ? '13' : '12');
      svg.appendChild(t);
      return t;
    });

    var moral = S.text(60, H - 18,
      'normalise once and it stays normalised: the interpretation is consistent with the ' +
      'dynamics', 's-lbl-b', 'start');
    svg.appendChild(moral);

    var sig0 = 0.055;
    return function (p) {
      var time = M.easeInOut(M.beat(p, 0.06, 0.9)) * 4;
      function draw(tt) {
        var sp = Math.sqrt(1 + tt * tt * 0.55);
        return S.sample(260, 0, 1, function (u) {
          var val = Math.exp(-Math.pow((u - 0.5) / (sig0 * sp), 2)) / sp;
          return [M.lerp(x0, x1, u), M.map(val, 0, 1.05, yB, yT)];
        });
      }
      ghosts.forEach(function (gh, i) {
        var tt = (i + 1) / 4 * time;
        S.setD(gh, S.polyD(draw(tt)));
        S.op(gh, 0.35);
      });
      var pts = draw(time);
      S.setD(curve, S.polyD(pts));
      area.setAttribute('d', S.areaD(pts, yB));

      /* Trapezoid the drawn curve, so the printed area is measured not asserted. */
      var sum = 0;
      for (var i2 = 1; i2 < pts.length; i2++) {
        var h1 = yB - pts[i2 - 1][1], h2 = yB - pts[i2][1];
        sum += 0.5 * (h1 + h2) * (pts[i2][0] - pts[i2 - 1][0]);
      }
      var norm = sum / ((yB - yT) * (x1 - x0)) * 8.6;
      readout.textContent = 'width × height stays constant   ·   measured area = ' +
        norm.toFixed(3) + ' (constant to within the pixel grid)';

      proof.forEach(function (l, i3) { S.op(l, M.beat(p, 0.2 + i3 * 0.1, 0.36 + i3 * 0.1)); });
      S.op(moral, M.beat(p, 0.84, 0.96));
    };
  });

  /* ---------------------------------------------------------- the closing map --- */

  A.scene('constellation', function (root) {
    var W = 1080, H = 620;
    var svg = S.root(W, H,
      'The equations of this lecture arranged in the order they were derived, with the ' +
      'dependencies between them.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var nodes = [
      { id: 'n111', x: 110, y: 90, t: '(1.1.1)', s: 'Newton', tone: 'w' },
      { id: 'n112', x: 110, y: 200, t: '(1.1.2)', s: 'E = p²/2m + V', tone: 'w' },
      { id: 'n113', x: 110, y: 310, t: '(1.1.3)', s: 'wave equation', tone: 'w' },
      { id: 'n114', x: 110, y: 420, t: '(1.1.4)', s: 'plane wave', tone: 'w' },
      { id: 'n121', x: 360, y: 90, t: '(1.2.1)', s: 'Rayleigh–Jeans', tone: 'f' },
      { id: 'n122', x: 360, y: 200, t: '(1.2.2)', s: 'the catastrophe', tone: 'f' },
      { id: 'n124', x: 360, y: 310, t: '(1.2.4)', s: 'ε = s ℏω', tone: 'q' },
      { id: 'n123', x: 360, y: 420, t: '(1.2.3)', s: 'Planck’s law', tone: 'q' },
      { id: 'n131', x: 610, y: 200, t: '(1.3.1)', s: 'sin θ = λ/a', tone: 'w' },
      { id: 'n153', x: 610, y: 340, t: '(1.5.3)', s: 'λ = h/p', tone: 'q' },
      { id: 'n161', x: 860, y: 250, t: '(1.6.1)', s: 'Schrödinger', tone: 'p' },
      { id: 'n171', x: 860, y: 430, t: '(1.7.1)', s: 'P = |ψ|²', tone: 'p' }
    ];
    var byId = {};
    var built = nodes.map(function (n) {
      var g = S.g({});
      svg.appendChild(g);
      var w = 170, h = 58;
      var r = S.rect(n.x, n.y, w, h, 's-ghost');
      r.setAttribute('fill', 'var(--surface)');
      r.setAttribute('rx', '2');
      r.setAttribute('stroke', { w: 'var(--wave)', q: 'var(--quantum)', f: 'var(--fail)', p: 'var(--probability)' }[n.tone]);
      g.appendChild(r);
      var t = S.text(n.x + w / 2, n.y + 24, n.t,
        { w: 's-lbl-w', q: 's-lbl-q', f: 's-lbl-f', p: 's-lbl-p' }[n.tone], 'middle');
      t.setAttribute('font-size', '13');
      g.appendChild(t);
      g.appendChild(S.text(n.x + w / 2, n.y + 44, n.s, 's-lbl', 'middle'));
      byId[n.id] = { x: n.x, y: n.y, w: w, h: h };
      return g;
    });

    var edges = [
      ['n111', 'n112'], ['n113', 'n114'], ['n114', 'n121'], ['n121', 'n122'],
      ['n122', 'n124'], ['n124', 'n123'], ['n114', 'n131'], ['n123', 'n153'],
      ['n131', 'n153'], ['n153', 'n161'], ['n112', 'n161'], ['n161', 'n171']
    ].map(function (e) {
      var a = byId[e[0]], b = byId[e[1]];
      var ax = a.x + a.w / 2, ay = a.y + a.h;
      var bx = b.x + b.w / 2, by = b.y;
      if (Math.abs(a.x - b.x) > 100) { ax = a.x + a.w; ay = a.y + a.h / 2; bx = b.x; by = b.y + b.h / 2; }
      var l = S.arrow(svg, ax, ay, bx, by, 'm');
      l.setAttribute('stroke-opacity', '0.55');
      svg.appendChild(l);
      return l;
    });

    var title = S.text(W / 2, H - 40,
      'every arrow on this map was walked, not assumed', 's-lbl-b', 'middle');
    title.setAttribute('font-size', '15');
    svg.appendChild(title);
    var sub = S.text(W / 2, H - 16,
      'from a ball rolling in a well to a probability amplitude, in one lecture',
      's-lbl', 'middle');
    svg.appendChild(sub);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.02 + i * 0.045, 0.2 + i * 0.045)); });
      edges.forEach(function (e, i) { S.op(e, M.beat(p, 0.3 + i * 0.035, 0.46 + i * 0.035) * 0.55); });
      S.op(title, M.beat(p, 0.78, 0.92));
      S.op(sub, M.beat(p, 0.86, 0.98));
    };
  });
})(window.A = window.A || {});
