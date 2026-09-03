/* Maths companion, §M.1: derivatives when there is more than one variable.
   The surface with one variable frozen, the total-versus-partial distinction the
   energy proof turns on, and the chain, product and quotient rules worked on
   lines that actually appear in the lecture. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, F = A.field;

  /* --------------------------------- freeze one variable, walk along the other --- */

  A.scene('partial-surface', function (root) {
    var W = 960, H = 620;
    var svg = S.root(W, H,
      'A surface above the x-y plane. Freezing y and walking along x gives one slope; ' +
      'freezing x and walking along y gives another. Those two numbers are the partial ' +
      'derivatives at that point.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* V(x,y) with a cross term, so each partial depends on both variables --
       which is the whole reason partial derivatives need their own notation. */
    function V(x, y) { return 0.5 * x * x + 0.9 * y * y + 0.35 * x * y; }
    function dVdx(x, y) { return x + 0.35 * y; }
    function dVdy(x, y) { return 1.8 * y + 0.35 * x; }

    var ox = 380, oy = 430, sx = 108, sy = 56, sz = 62;
    function proj(x, y, z) {
      return [ox + x * sx - y * sy * 0.92, oy - z * sz - y * sy * 0.46];
    }

    var lim = 2.0;
    var gGrid = S.g({});
    svg.appendChild(gGrid);
    var n = 9, i, j;
    for (i = 0; i <= n; i++) {
      var yv = -lim + 2 * lim * i / n;
      var pts = S.sample(40, -lim, lim, function (x) { return proj(x, yv, V(x, yv)); });
      var pl = S.poly(pts, 's-ghost');
      pl.setAttribute('stroke-opacity', '0.5');
      gGrid.appendChild(pl);
    }
    for (i = 0; i <= n; i++) {
      var xv = -lim + 2 * lim * i / n;
      var pts2 = S.sample(40, -lim, lim, function (y) { return proj(xv, y, V(xv, y)); });
      var pl2 = S.poly(pts2, 's-ghost');
      pl2.setAttribute('stroke-opacity', '0.5');
      gGrid.appendChild(pl2);
    }

    /* Base-plane axes. */
    var gAx = S.g({});
    svg.appendChild(gAx);
    gAx.appendChild(S.arrow(svg, proj(-lim, -lim, 0)[0], proj(-lim, -lim, 0)[1],
                            proj(lim * 1.2, -lim, 0)[0], proj(lim * 1.2, -lim, 0)[1], 'i'));
    gAx.appendChild(S.arrow(svg, proj(-lim, -lim, 0)[0], proj(-lim, -lim, 0)[1],
                            proj(-lim, lim * 1.2, 0)[0], proj(-lim, lim * 1.2, 0)[1], 'i'));
    gAx.appendChild(S.text(proj(lim * 1.3, -lim, 0)[0], proj(lim * 1.3, -lim, 0)[1] + 4, 'x', 's-lbl-b', 'start'));
    gAx.appendChild(S.text(proj(-lim, lim * 1.3, 0)[0] - 8, proj(-lim, lim * 1.3, 0)[1], 'y', 's-lbl-b', 'end'));
    gAx.appendChild(S.text(60, 60, 'a surface  V(x, y)', 's-lbl', 'start'));

    var P = [0.85, -0.55];

    /* The two slices through the chosen point. */
    var sliceX = S.path('', 's-wave');
    sliceX.setAttribute('stroke-width', '2.5');
    var sliceY = S.path('', 's-quantum');
    sliceY.setAttribute('stroke-width', '2.5');
    svg.appendChild(sliceX); svg.appendChild(sliceY);
    S.setD(sliceX, S.polyD(S.sample(60, -lim, lim, function (x) { return proj(x, P[1], V(x, P[1])); })));
    S.setD(sliceY, S.polyD(S.sample(60, -lim, lim, function (y) { return proj(P[0], y, V(P[0], y)); })));

    var tanX = S.line(0, 0, 0, 0, 's-wave');
    tanX.setAttribute('stroke-dasharray', '5 4');
    var tanY = S.line(0, 0, 0, 0, 's-quantum');
    tanY.setAttribute('stroke-dasharray', '5 4');
    svg.appendChild(tanX); svg.appendChild(tanY);

    var dot = S.circle(0, 0, 6, 's-fill-i');
    var pp = proj(P[0], P[1], V(P[0], P[1]));
    dot.setAttribute('cx', pp[0]); dot.setAttribute('cy', pp[1]);
    svg.appendChild(dot);

    var dropLine = S.line(pp[0], pp[1], proj(P[0], P[1], 0)[0], proj(P[0], P[1], 0)[1], 's-axis s-dash');
    svg.appendChild(dropLine);
    var footDot = S.circle(proj(P[0], P[1], 0)[0], proj(P[0], P[1], 0)[1], 3.5, 's-fill-i');
    svg.appendChild(footDot);

    /* Tangent segments in the two slice planes. */
    var d = 0.62;
    var ax = proj(P[0] - d, P[1], V(P[0], P[1]) - dVdx(P[0], P[1]) * d);
    var bx = proj(P[0] + d, P[1], V(P[0], P[1]) + dVdx(P[0], P[1]) * d);
    tanX.setAttribute('x1', ax[0]); tanX.setAttribute('y1', ax[1]);
    tanX.setAttribute('x2', bx[0]); tanX.setAttribute('y2', bx[1]);
    var ay = proj(P[0], P[1] - d, V(P[0], P[1]) - dVdy(P[0], P[1]) * d);
    var by = proj(P[0], P[1] + d, V(P[0], P[1]) + dVdy(P[0], P[1]) * d);
    tanY.setAttribute('x1', ay[0]); tanY.setAttribute('y1', ay[1]);
    tanY.setAttribute('x2', by[0]); tanY.setAttribute('y2', by[1]);

    var lblX = S.text(bx[0] + 10, bx[1], '', 's-lbl-w', 'start');
    var lblY = S.text(by[0] - 10, by[1] + 4, '', 's-lbl-q', 'end');
    lblX.textContent = '∂V/∂x = ' + dVdx(P[0], P[1]).toFixed(2) + '   (y held fixed)';
    lblY.textContent = '∂V/∂y = ' + dVdy(P[0], P[1]).toFixed(2) + '   (x held fixed)';
    svg.appendChild(lblX); svg.appendChild(lblY);

    var lines = [
      'V(x, y) = ½x² + 0.9y² + 0.35xy',
      '∂V/∂x = x + 0.35y        treat y as a constant',
      '∂V/∂y = 1.8y + 0.35x     treat x as a constant',
      'the cross term is why each slope depends on both variables'
    ].map(function (str, k) {
      var t = S.text(60, 500 + k * 26, str, k === 3 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', k === 3 ? '12' : '13');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      S.op(gGrid, M.beat(p, 0.02, 0.16));
      S.op(gAx, M.beat(p, 0.06, 0.2));
      var pt = M.beat(p, 0.18, 0.28);
      S.op(dot, pt); S.op(dropLine, pt * 0.8); S.op(footDot, pt);
      S.op(sliceX, M.beat(p, 0.28, 0.42));
      S.op(tanX, M.beat(p, 0.36, 0.48));
      S.op(lblX, M.beat(p, 0.4, 0.52));
      S.op(sliceY, M.beat(p, 0.5, 0.64));
      S.op(tanY, M.beat(p, 0.58, 0.7));
      S.op(lblY, M.beat(p, 0.62, 0.74));
      lines.forEach(function (l, k) { S.op(l, M.beat(p, 0.7 + k * 0.06, 0.82 + k * 0.06)); });
    };
  });

  /* --------------------- the distinction the energy proof turns on --- */

  A.scene('total-vs-partial', function (root, api) {
    var W = 960, H = 620;
    var svg = S.root(W, H,
      'A ball on a landscape that is itself rising. The height above the ground changes for ' +
      'two separate reasons: the ball moves, and the landscape moves. The total derivative ' +
      'is the sum of the two.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 90, x1 = 700, yBase = 400, amp = 120;

    /* V(x, t): a fixed shape whose whole height grows with t. */
    function shape(x) { return 0.5 + 0.5 * Math.cos(x * 2.1); }
    function V(x, tt) { return shape(x) * (1 + 0.55 * tt); }
    function dVdx(x, tt) { return -0.5 * 2.1 * Math.sin(x * 2.1) * (1 + 0.55 * tt); }
    function dVdt(x) { return shape(x) * 0.55; }

    var PX = function (x) { return M.map(x, -1.5, 1.5, x0, x1); };
    var PY = function (v) { return yBase - v * amp; };

    svg.appendChild(S.line(x0, yBase, x1, yBase, 's-axis'));
    svg.appendChild(S.text(x1, yBase + 22, 'x', 's-lbl-b', 'end'));
    svg.appendChild(S.text(x0 - 8, PY(1.5), 'V', 's-lbl-b', 'end'));

    var ghost = S.path('', 's-ghost');
    ghost.setAttribute('stroke-dasharray', '4 5');
    var curve = S.path('', 's-wave');
    curve.setAttribute('stroke-width', '2.5');
    svg.appendChild(ghost); svg.appendChild(curve);

    var ball = S.circle(0, 0, 8, 's-fill-i');
    svg.appendChild(ball);
    var vArrow = S.arrow(svg, 0, 0, 0, 0, 'i');
    svg.appendChild(vArrow);
    var vLbl = S.text(0, 0, 'v', 's-lbl-b', 'middle');
    svg.appendChild(vLbl);

    var riseArrow = S.arrow(svg, 0, 0, 0, 0, 'q');
    svg.appendChild(riseArrow);
    var riseLbl = S.text(0, 0, 'the landscape itself is rising', 's-lbl-q', 'start');
    svg.appendChild(riseLbl);

    var stageLbl = S.text(x0, 66, '', 's-lbl-b', 'start');
    stageLbl.setAttribute('font-size', '15');
    svg.appendChild(stageLbl);

    /* Live readout of the two terms and their sum. */
    var rows = [
      { key: 'moving through the slope', tex: '∇V · v', cls: 's-lbl-w' },
      { key: 'the landscape changing', tex: '∂V/∂t', cls: 's-lbl-q' },
      { key: 'total rate of change', tex: 'dV/dt', cls: 's-lbl-b' }
    ];
    var readouts = rows.map(function (r, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = 470 + i * 40;
      if (i === 2) g.appendChild(S.line(x0, y - 22, 700, y - 22, 's-axis'));
      g.appendChild(S.text(x0, y, r.tex, r.cls, 'start'));
      g.appendChild(S.text(x0 + 110, y, r.key, 's-lbl', 'start'));
      var val = S.text(660, y, '', r.cls, 'end');
      val.setAttribute('font-size', '14');
      g.appendChild(val);
      return { g: g, val: val };
    });

    var formula = S.text(760, 500,
      'dV/dt = ∇V · v + ∂V/∂t', 's-lbl-b', 'middle');
    formula.setAttribute('font-size', '15');
    svg.appendChild(formula);
    var formula2 = S.text(760, 528, 'two reasons, one sum', 's-lbl', 'middle');
    svg.appendChild(formula2);
    var used = S.text(760, 566, 'this is the step where the', 's-lbl', 'middle');
    var used2 = S.text(760, 584, 'gradient terms cancel in', 's-lbl', 'middle');
    var used3 = S.text(760, 602, 'the proof that E is conserved', 's-lbl', 'middle');
    svg.appendChild(used); svg.appendChild(used2); svg.appendChild(used3);

    return function (p, t) {
      /* Three beats: only the ball moves, only the landscape moves, then both. */
      var beat = p < 0.34 ? 0 : (p < 0.64 ? 1 : 2);
      var loc = beat === 0 ? M.beat(p, 0.04, 0.34)
              : beat === 1 ? M.beat(p, 0.34, 0.64)
              : M.beat(p, 0.64, 0.98);

      var xb, tt, vel;
      if (beat === 0) { xb = M.lerp(-1.25, 1.1, M.easeInOut(loc)); tt = 0; vel = 1; }
      else if (beat === 1) { xb = 0.42; tt = M.easeInOut(loc) * 1.0; vel = 0; }
      else { xb = M.lerp(-1.25, 1.1, M.easeInOut(loc)); tt = M.easeInOut(loc) * 1.0; vel = 1; }

      var pts = S.sample(180, -1.5, 1.5, function (x) { return [PX(x), PY(V(x, tt))]; });
      S.setD(curve, S.polyD(pts));
      if (tt > 0.02) {
        S.setD(ghost, S.polyD(S.sample(120, -1.5, 1.5, function (x) { return [PX(x), PY(V(x, 0))]; })));
        S.op(ghost, 0.7);
      } else { S.op(ghost, 0); }

      var bx = PX(xb), by = PY(V(xb, tt));
      ball.setAttribute('cx', bx.toFixed(1)); ball.setAttribute('cy', by.toFixed(1));

      var showV = vel > 0 ? 1 : 0.12;
      vArrow.setAttribute('x1', bx); vArrow.setAttribute('y1', by + 26);
      vArrow.setAttribute('x2', bx + 54); vArrow.setAttribute('y2', by + 26);
      S.op(vArrow, showV);
      vLbl.setAttribute('x', bx + 27); vLbl.setAttribute('y', by + 48);
      S.op(vLbl, showV);

      var showRise = beat === 0 ? 0.12 : 1;
      riseArrow.setAttribute('x1', PX(-1.15)); riseArrow.setAttribute('y1', PY(V(-1.15, 0)));
      riseArrow.setAttribute('x2', PX(-1.15)); riseArrow.setAttribute('y2', PY(V(-1.15, tt)) - 6);
      S.op(riseArrow, showRise * (tt > 0.05 ? 1 : 0.2));
      riseLbl.setAttribute('x', PX(-1.15) + 12);
      riseLbl.setAttribute('y', PY(V(-1.15, tt)) - 14);
      S.op(riseLbl, showRise * (tt > 0.1 ? 1 : 0));

      stageLbl.textContent = beat === 0
        ? 'the ball moves, the landscape is frozen'
        : (beat === 1 ? 'the ball is held still, the landscape rises'
                      : 'both at once');

      /* The two contributions, evaluated from the formulas above. */
      var termA = dVdx(xb, tt) * (vel * 2.35);
      var termB = beat === 0 ? 0 : dVdt(xb);
      readouts[0].val.textContent = termA.toFixed(3);
      readouts[1].val.textContent = termB.toFixed(3);
      readouts[2].val.textContent = (termA + termB).toFixed(3);
      S.op(readouts[0].g, beat === 1 ? 0.35 : 1);
      S.op(readouts[1].g, beat === 0 ? 0.35 : 1);
      S.op(readouts[2].g, M.beat(p, 0.6, 0.72));
      S.op(formula, M.beat(p, 0.66, 0.8));
      S.op(formula2, M.beat(p, 0.7, 0.84));
      S.op(used, M.beat(p, 0.8, 0.92));
      S.op(used2, M.beat(p, 0.82, 0.94));
      S.op(used3, M.beat(p, 0.84, 0.96));
    };
  });

  /* ------------------------------------------------ the chain rule, in layers --- */

  A.scene('chain-layers', function (root) {
    var W = 940, H = 540;
    var svg = S.root(W, H,
      'The chain rule as a stack of layers: differentiate the outside, keep the inside, then ' +
      'multiply by the derivative of the inside.');
    S.defsArrows(svg);
    root.appendChild(svg);

    function example(x0, title, layers, result, note) {
      var g = S.g({});
      svg.appendChild(g);
      var t = S.text(x0, 76, title, 's-lbl-b', 'start');
      t.setAttribute('font-size', '15');
      g.appendChild(t);
      g.appendChild(S.line(x0, 90, x0 + 380, 90, 's-axis'));
      var parts = layers.map(function (L, i) {
        var gg = S.g({});
        g.appendChild(gg);
        var y = 124 + i * 78;
        var box = S.rect(x0, y, 380 - i * 0, 54, 's-ghost');
        box.setAttribute('fill', 'none'); box.setAttribute('rx', '2');
        gg.appendChild(box);
        gg.appendChild(S.text(x0 + 14, y + 22, L[0], 's-lbl', 'start'));
        var e = S.text(x0 + 14, y + 44, L[1], i === layers.length - 1 ? 's-lbl-q' : 's-lbl-w', 'start');
        e.setAttribute('font-size', '13');
        gg.appendChild(e);
        return gg;
      });
      var res = S.text(x0, 124 + layers.length * 78 + 26, result, 's-lbl-b', 'start');
      res.setAttribute('font-size', '14');
      g.appendChild(res);
      var nt = S.text(x0, 124 + layers.length * 78 + 50, note, 's-lbl', 'start');
      g.appendChild(nt);
      return { g: g, parts: parts, res: res, nt: nt };
    }

    var left = example(50, 'differentiate cos(kx − ωt) by x', [
      ['outer layer', 'f(u) = cos u        df/du = −sin u'],
      ['inner layer', 'u = kx − ωt        ∂u/∂x = k']
    ], '∂/∂x cos(kx − ωt) = −k sin(kx − ωt)',
      'each derivative pulls one factor of k out front');

    var right = example(510, 'differentiate e^(−βℏω) by β', [
      ['outer layer', 'f(u) = eᵘ        df/du = eᵘ'],
      ['inner layer', 'u = −βℏω        ∂u/∂β = −ℏω']
    ], '∂/∂β e^(−βℏω) = −ℏω e^(−βℏω)',
      'this is the step that pulls ε out of the partition function');

    var rule = S.text(W / 2, H - 24,
      'df/dx = (df/du)(du/dx)      differentiate the outside, then multiply by the inside',
      's-lbl-w', 'middle');
    rule.setAttribute('font-size', '13');
    svg.appendChild(rule);

    return function (p) {
      [left, right].forEach(function (ex, k) {
        S.op(ex.g, M.beat(p, 0.02 + k * 0.1, 0.14 + k * 0.1));
        ex.parts.forEach(function (gg, i) {
          S.op(gg, M.beat(p, 0.12 + k * 0.1 + i * 0.12, 0.28 + k * 0.1 + i * 0.12));
        });
        S.op(ex.res, M.beat(p, 0.52 + k * 0.08, 0.68 + k * 0.08));
        S.op(ex.nt, M.beat(p, 0.62 + k * 0.08, 0.78 + k * 0.08));
      });
      S.op(rule, M.beat(p, 0.82, 0.95));
    };
  });

  /* --------------------------------- product and quotient, on real lines --- */

  A.scene('product-quotient', function (root) {
    var W = 980, H = 600;
    var svg = S.root(W, H,
      'The product rule applied to psi-star psi, and the quotient rule applied to the ' +
      'function whose maximum gives the peak of the Planck spectrum.');
    root.appendChild(svg);

    function column(x0, rule, title, steps, closing) {
      var g = S.g({});
      svg.appendChild(g);
      var r = S.text(x0, 64, rule, 's-lbl-w', 'start');
      r.setAttribute('font-size', '14');
      g.appendChild(r);
      var t = S.text(x0, 92, title, 's-lbl-b', 'start');
      g.appendChild(t);
      g.appendChild(S.line(x0, 104, x0 + 400, 104, 's-axis'));
      var rows = steps.map(function (str, i) {
        var e = S.text(x0, 136 + i * 42, str, 's-lbl', 'start');
        e.setAttribute('font-size', '12.5');
        g.appendChild(e);
        return e;
      });
      var c = S.text(x0, 136 + steps.length * 42 + 14, closing, 's-lbl-q', 'start');
      c.setAttribute('font-size', '13');
      g.appendChild(c);
      return { g: g, rows: rows, c: c };
    }

    var left = column(50,
      '(uv)′ = u′v + uv′',
      'the §1.7 step: differentiate |ψ|² = ψ*ψ in time',
      [
        '∂/∂t (ψ* ψ)',
        '=  (∂ψ*/∂t) ψ  +  ψ* (∂ψ/∂t)',
        'now substitute the Schrödinger equation for ∂ψ/∂t',
        'and its complex conjugate for ∂ψ*/∂t',
        'the two V terms come out equal and opposite'
      ],
      'and cancel, provided V is real');

    var right = column(530,
      '(u/v)′ = (u′v − uv′) / v²',
      'the Wien peak: maximise x³/(eˣ − 1)',
      [
        'd/dx [ x³ / (eˣ − 1) ]',
        '=  [ 3x²(eˣ − 1) − x³eˣ ] / (eˣ − 1)²',
        'set the numerator to zero and divide by x²',
        '3(eˣ − 1) − x eˣ = 0',
        'divide through by eˣ'
      ],
      '3(1 − e⁻ˣ) = x,  whose root is x = 2.8214');

    var moral = S.text(W / 2, H - 26,
      'in both cases the rule is mechanical; the physics is in what you substitute afterwards',
      's-lbl-b', 'middle');
    svg.appendChild(moral);

    return function (p) {
      [left, right].forEach(function (col, k) {
        S.op(col.g, M.beat(p, 0.02 + k * 0.06, 0.14 + k * 0.06));
        col.rows.forEach(function (r, i) {
          S.op(r, M.beat(p, 0.1 + k * 0.05 + i * 0.09, 0.24 + k * 0.05 + i * 0.09));
        });
        S.op(col.c, M.beat(p, 0.66 + k * 0.05, 0.8 + k * 0.05));
      });
      S.op(moral, M.beat(p, 0.84, 0.96));
    };
  });
})(window.A = window.A || {});
