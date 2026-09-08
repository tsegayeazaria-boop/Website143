/* Section 1.1, classical half: Newton's second law as a statement about the
   slope of the potential, the meaning of the minus sign, what determinism does
   and does not promise, and conservation of energy shown as a flat line. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* Leapfrog integration of m x'' = -dV/dx with m = 1. Returns sampled states.
     The trajectories on screen are integrated from the equation of motion, not
     drawn by hand, so what you see is what the law actually produces. */
  function integrate(V, dV, x0, v0, dt, n) {
    var out = new Array(n), x = x0, v = v0, a = -dV(x), i;
    for (i = 0; i < n; i++) {
      out[i] = { x: x, v: v, T: 0.5 * v * v, V: V(x) };
      v += 0.5 * dt * a;
      x += dt * v;
      a = -dV(x);
      v += 0.5 * dt * a;
    }
    return out;
  }

  /* ---------------------------------------------------- the single well --- */

  var wellV = function (u) { return 0.5 * u * u + 0.10 * u * u * u * u; };
  var wellD = function (u) { return u + 0.40 * u * u * u; };

  A.scene('newton-potential', function (root, api) {
    var W = 920, H = 580;
    var svg = S.root(W, H,
      'A particle in a potential well. The force on it is minus the slope of the potential, ' +
      'and integrating that force reproduces the whole motion.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 110, x1 = 700, yTop = 70, yBase = 400;
    var uMin = -2.1, uMax = 2.1, vMax = 3.2;
    var px = function (u) { return M.map(u, uMin, uMax, x0, x1); };
    var py = function (v) { return M.map(v, 0, vMax, yBase, yTop); };

    svg.appendChild(S.gridLines(x0, yTop, x1, yBase, 8, 4));
    svg.appendChild(S.axes(x0, yTop, x1, yBase, 'position  x', null));
    svg.appendChild(S.text(x0 - 8, yTop + 4, 'V(x)', 's-lbl', 'end'));

    var curvePts = S.sample(220, uMin, uMax, function (u) { return [px(u), py(wellV(u))]; });
    var curve = S.poly(curvePts, 's-ghost');
    curve.setAttribute('stroke', 'var(--wave)');
    curve.setAttribute('stroke-width', '2');
    svg.appendChild(curve);

    var traj = integrate(wellV, wellD, 1.85, 0, 0.006, 4200);

    var gMotion = S.g({});
    svg.appendChild(gMotion);

    var traceLine = S.path('', 's-ghost');
    traceLine.setAttribute('stroke', 'var(--hairline-2)');
    gMotion.appendChild(traceLine);

    var drop = S.line(0, 0, 0, 0, 's-axis s-dash');
    gMotion.appendChild(drop);

    var tangent = S.line(0, 0, 0, 0, 's-ghost');
    tangent.setAttribute('stroke', 'var(--quantum)');
    tangent.setAttribute('stroke-width', '1.5');
    gMotion.appendChild(tangent);

    var forceArrow = S.arrow(svg, 0, 0, 0, 0, 'f');
    forceArrow.setAttribute('stroke-width', '2.5');
    gMotion.appendChild(forceArrow);

    var ball = S.circle(0, 0, 8, 's-fill-i');
    gMotion.appendChild(ball);

    var slopeLbl = S.text(0, 0, '', 's-lbl-q', 'start');
    var forceLbl = S.text(0, 0, '', 's-lbl-f', 'middle');
    gMotion.appendChild(slopeLbl);
    gMotion.appendChild(forceLbl);

    /* Energy readout on the right. */
    var bx = 736, bw = 42, bTop = 110, bBot = 400;
    var gBars = S.g({});
    svg.appendChild(gBars);
    var barT = S.rect(bx, 0, bw, 0, 's-fill-w');
    var barV = S.rect(bx + bw + 18, 0, bw, 0, 's-fill-q');
    gBars.appendChild(barT); gBars.appendChild(barV);
    gBars.appendChild(S.line(bx - 10, bBot, bx + 2 * bw + 28, bBot, 's-axis'));
    gBars.appendChild(S.text(bx + bw / 2, bBot + 18, 'T', 's-lbl-w', 'middle'));
    gBars.appendChild(S.text(bx + bw + 18 + bw / 2, bBot + 18, 'V', 's-lbl-q', 'middle'));
    var totalLine = S.line(bx - 10, 0, bx + 2 * bw + 28, 0, 's-axis');
    totalLine.setAttribute('stroke', 'var(--ink-bright)');
    gBars.appendChild(totalLine);
    var totalLbl = S.text(bx - 18, 0, 'E', 's-lbl-b', 'end');
    gBars.appendChild(totalLbl);

    var readout = S.text(x0, H - 34, '', 's-lbl', 'start');
    svg.appendChild(readout);

    var E0 = traj[0].T + traj[0].V;
    var eScale = (bBot - bTop) / (E0 * 1.15);

    return function (p) {
      var draw = M.beat(p, 0.00, 0.20);
      S.draw(curve, M.easeOut(draw));

      var appear = M.beat(p, 0.18, 0.30);
      S.op(gMotion, appear);

      var run = M.beat(p, 0.34, 1.0);
      var idx = Math.min(traj.length - 1, Math.floor(M.easeInOut(run) * (traj.length - 1)));
      var st = traj[idx];

      var bxp = px(st.x), byp = py(st.V);
      ball.setAttribute('cx', bxp.toFixed(1));
      ball.setAttribute('cy', byp.toFixed(1));

      drop.setAttribute('x1', bxp); drop.setAttribute('y1', byp);
      drop.setAttribute('x2', bxp); drop.setAttribute('y2', yBase);

      /* Tangent whose slope is dV/dx: the quantity the law actually reads. */
      var slope = wellD(st.x);
      var du = 0.42;
      var sx = (px(st.x + du) - px(st.x - du));
      var sy = (py(wellV(st.x) + slope * du) - py(wellV(st.x) - slope * du));
      tangent.setAttribute('x1', bxp - sx / 2); tangent.setAttribute('y1', byp - sy / 2);
      tangent.setAttribute('x2', bxp + sx / 2); tangent.setAttribute('y2', byp + sy / 2);
      /* The label rides the far end of the tangent, which on a steep wall
         swings above the top of the box, where SVG silently clips it. Keep it
         inside: about 140 px of text at this size, plus room for the ascender. */
      slopeLbl.setAttribute('x', M.clamp(bxp + sx / 2 + 8, 8, W - 142).toFixed(1));
      slopeLbl.setAttribute('y', M.clamp(byp + sy / 2 + 4, 18, H - 12).toFixed(1));
      slopeLbl.textContent = 'slope dV/dx = ' + slope.toFixed(2);

      /* Force = -dV/dx, drawn horizontally at the base so its sign is visible. */
      var fpx = Math.max(-150, Math.min(150, -slope * 52));
      forceArrow.setAttribute('x1', bxp); forceArrow.setAttribute('y1', yBase + 28);
      forceArrow.setAttribute('x2', bxp + fpx); forceArrow.setAttribute('y2', yBase + 28);
      forceLbl.setAttribute('x', bxp + fpx / 2);
      forceLbl.setAttribute('y', yBase + 50);
      forceLbl.textContent = 'F = −dV/dx';
      S.op(forceArrow, M.beat(p, 0.28, 0.36));
      S.op(forceLbl, M.beat(p, 0.28, 0.36));

      /* Where the particle has been: a record, not a prediction. */
      var pts = [], i;
      for (i = 0; i <= idx; i += 24) pts.push([px(traj[i].x), yBase + 10]);
      if (pts.length > 1) {
        traceLine.setAttribute('d',
          'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1] +
          'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + pts[0][1]);
      }

      var hT = st.T * eScale, hV = st.V * eScale;
      barT.setAttribute('y', bBot - hT); barT.setAttribute('height', Math.max(0, hT));
      barV.setAttribute('y', bBot - hV); barV.setAttribute('height', Math.max(0, hV));
      var yE = bBot - (st.T + st.V) * eScale;
      totalLine.setAttribute('y1', yE); totalLine.setAttribute('y2', yE);
      totalLbl.setAttribute('y', yE + 4);
      S.op(gBars, M.beat(p, 0.40, 0.52));

      readout.textContent =
        'x = ' + st.x.toFixed(3) + '  /  v = ' + st.v.toFixed(3) +
        '  /  T = ' + st.T.toFixed(3) + '  /  V = ' + st.V.toFixed(3) +
        '  /  T + V = ' + (st.T + st.V).toFixed(3);
    };
  });

  /* ------------------------------------------- why the minus sign is there --- */

  A.scene('gradient-field', function (root) {
    var W = 880, H = 380;
    var svg = S.root(W, H,
      'Level curves of a potential with the uphill gradient and the downhill force ' +
      'drawn at the same points, showing that the force is minus the gradient.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = W * 0.34, cy = H * 0.52, sx = 96, sy = 62;

    /* V = (x^2 + 1.6 y^2)/2, so level sets are exact ellipses. */
    var gLevels = S.g({});
    svg.appendChild(gLevels);
    for (var k = 1; k <= 5; k++) {
      var r = k * 0.42;
      var e = S.el('ellipse', {
        cx: cx, cy: cy, rx: r * sx, ry: r * sy / Math.sqrt(1.6),
        class: 's-ghost'
      });
      gLevels.appendChild(e);
      if (k === 5) {
        gLevels.appendChild(S.text(cx + r * sx + 8, cy + 4, 'V constant', 's-lbl', 'start'));
      }
    }
    gLevels.appendChild(S.circle(cx, cy, 3, 's-fill-i'));
    gLevels.appendChild(S.text(cx, cy + 20, 'minimum of V', 's-lbl', 'middle'));

    var samples = [[1.15, 0.35], [-0.95, 0.75], [0.35, -1.05], [-1.25, -0.45]];
    var gArrows = S.g({});
    svg.appendChild(gArrows);
    var upArrows = [], downArrows = [];
    samples.forEach(function (s) {
      var u = s[0], v = s[1];
      var X = cx + u * sx, Y = cy - v * sy;
      /* grad V = (u, 1.6 v); on screen y is flipped. */
      var gx = u, gy = 1.6 * v;
      var n = Math.sqrt(gx * gx + gy * gy) || 1;
      var L = 52;
      var up = S.arrow(svg, X, Y, X + (gx / n) * L, Y - (gy / n) * L, 'm');
      var dn = S.arrow(svg, X, Y, X - (gx / n) * L, Y + (gy / n) * L, 'w');
      dn.setAttribute('stroke-width', '2');
      gArrows.appendChild(up); gArrows.appendChild(dn);
      gArrows.appendChild(S.circle(X, Y, 3.5, 's-fill-i'));
      upArrows.push(up); downArrows.push(dn);
    });

    var keyY = H - 34;
    var gKey = S.g({});
    svg.appendChild(gKey);
    gKey.appendChild(S.arrow(svg, 560, keyY - 22, 610, keyY - 22, 'm'));
    gKey.appendChild(S.text(620, keyY - 18, '∇V points uphill', 's-lbl', 'start'));
    var dk = S.arrow(svg, 560, keyY + 4, 610, keyY + 4, 'w');
    dk.setAttribute('stroke-width', '2');
    gKey.appendChild(dk);
    gKey.appendChild(S.text(620, keyY + 8, 'F = −∇V points downhill', 's-lbl-w', 'start'));

    return function (p) {
      S.op(gLevels, M.beat(p, 0.05, 0.3));
      upArrows.forEach(function (a, i) { S.op(a, M.beat(p, 0.28 + i * 0.04, 0.5 + i * 0.04)); });
      downArrows.forEach(function (a, i) { S.op(a, M.beat(p, 0.5 + i * 0.04, 0.72 + i * 0.04)); });
      S.op(gKey, M.beat(p, 0.6, 0.85));
    };
  });

  /* --------------------------------------- determinism and its fine print --- */

  var dblV = function (u) { return 0.25 * u * u * u * u - 0.5 * u * u; };
  var dblD = function (u) { return u * u * u - u; };

  A.scene('determinism', function (root) {
    var W = 920, H = 560;
    var svg = S.root(W, H,
      'Two pairs of trajectories. In a smooth well, nearby starting conditions stay ' +
      'together. Started balanced on a barrier top, a difference of one part in ten ' +
      'thousand sends the two particles into opposite wells.');
    root.appendChild(svg);

    var rows = [
      { y0: 60, y1: 240, title: 'ordinary well  ·  two starts differing by 10⁻⁴' },
      { y0: 320, y1: 500, title: 'balanced on the barrier top  ·  the same 10⁻⁴' }
    ];
    var xA = 90, xB = 860;

    var dt = 0.008, n = 3000;
    var setA = [
      integrate(wellV, wellD, 1.6, 0, dt, n),
      integrate(wellV, wellD, 1.6001, 0, dt, n)
    ];
    var setB = [
      integrate(dblV, dblD, 0, 0.99995, dt, n),
      integrate(dblV, dblD, 0, 1.00005, dt, n)
    ];

    var built = rows.map(function (row, ri) {
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.line(xA, (row.y0 + row.y1) / 2, xB, (row.y0 + row.y1) / 2, 's-axis s-dash'));
      g.appendChild(S.line(xA, row.y0, xA, row.y1, 's-axis'));
      g.appendChild(S.text(xA, row.y0 - 14, row.title, 's-lbl', 'start'));
      g.appendChild(S.text(xA - 8, (row.y0 + row.y1) / 2 + 4, 'x', 's-lbl', 'end'));
      g.appendChild(S.text(xB, row.y1 + 20, 'time', 's-lbl', 'end'));
      var p1 = S.path('', 's-wave');
      var p2 = S.path('', 's-quantum');
      p2.setAttribute('stroke-dasharray', '5 4');
      g.appendChild(p1); g.appendChild(p2);
      return { g: g, p1: p1, p2: p2, row: row, set: ri === 0 ? setA : setB, range: ri === 0 ? 2.0 : 1.7 };
    });

    var note = S.text(W / 2, H - 12, '', 's-lbl-f', 'middle');
    svg.appendChild(note);

    return function (p) {
      var run = M.easeInOut(M.beat(p, 0.08, 0.92));
      var upTo = Math.max(2, Math.floor(run * (n - 1)));
      built.forEach(function (b, bi) {
        S.op(b.g, M.beat(p, bi * 0.06, 0.2 + bi * 0.06));
        var yc = (b.row.y0 + b.row.y1) / 2;
        var half = (b.row.y1 - b.row.y0) / 2;
        [b.p1, b.p2].forEach(function (pathEl, si) {
          var tr = b.set[si], pts = [], i;
          var step = Math.max(1, Math.floor(upTo / 420));
          for (i = 0; i <= upTo; i += step) {
            pts.push([
              M.map(i, 0, n - 1, xA, xB),
              yc - M.clamp(tr[i].x / b.range, -1, 1) * half
            ]);
          }
          S.setD(pathEl, S.polyD(pts));
        });
      });
      note.textContent = run > 0.55
        ? 'Same law, same exactness. Only the starting numbers differ.'
        : '';
      S.op(note, M.beat(p, 0.55, 0.7));
    };
  });

  /* -------------------------------------------- energy as a flat line --- */

  A.scene('energy-trade', function (root) {
    var W = 920, H = 520;
    var svg = S.root(W, H,
      'Kinetic and potential energy plotted against time for one particle. Each ' +
      'rises and falls; their sum is a horizontal line.');
    root.appendChild(svg);

    var x0 = 100, x1 = 840, yTop = 70, yBot = 420;
    svg.appendChild(S.gridLines(x0, yTop, x1, yBot, 10, 5));
    svg.appendChild(S.axes(x0, yTop, x1, yBot, 'time  t', null));

    var n = 2600;
    var traj = integrate(wellV, wellD, 1.75, 0, 0.008, n);
    var E = traj[0].T + traj[0].V;
    var top = E * 1.25;
    var py = function (v) { return M.map(v, 0, top, yBot, yTop); };

    var pT = S.path('', 's-wave');
    var pV = S.path('', 's-quantum');
    var pE = S.path('', 's-ghost');
    pE.setAttribute('stroke', 'var(--ink-bright)');
    pE.setAttribute('stroke-width', '2');
    svg.appendChild(pT); svg.appendChild(pV); svg.appendChild(pE);

    var key = S.g({});
    svg.appendChild(key);
    [['T = p²/2m', 'var(--wave)', 0], ['V(x)', 'var(--quantum)', 1], ['E = T + V', 'var(--ink-bright)', 2]]
      .forEach(function (row) {
        var y = yBot + 42 + row[2] * 22;
        var l = S.line(x0, y, x0 + 26, y, 's-axis');
        l.setAttribute('stroke', row[1]);
        l.setAttribute('stroke-width', '2.5');
        key.appendChild(l);
        var t = S.text(x0 + 36, y + 4, row[0], 's-lbl', 'start');
        t.setAttribute('fill', row[1]);
        key.appendChild(t);
      });

    var spread = S.text(x1, yBot + 42, '', 's-lbl-b', 'end');
    key.appendChild(spread);

    return function (p) {
      var run = M.easeInOut(M.beat(p, 0.06, 0.95));
      var upTo = Math.max(2, Math.floor(run * (n - 1)));
      var step = Math.max(1, Math.floor(upTo / 500));
      var a = [], b = [], c = [], i, lo = Infinity, hi = -Infinity;
      for (i = 0; i <= upTo; i += step) {
        var X = M.map(i, 0, n - 1, x0, x1), s = traj[i];
        a.push([X, py(s.T)]);
        b.push([X, py(s.V)]);
        c.push([X, py(s.T + s.V)]);
        var tot = s.T + s.V;
        if (tot < lo) lo = tot;
        if (tot > hi) hi = tot;
      }
      S.setD(pT, S.polyD(a));
      S.setD(pV, S.polyD(b));
      S.setD(pE, S.polyD(c));
      S.op(key, M.beat(p, 0.3, 0.5));
      spread.textContent = upTo > 400
        ? 'E drifts by ' + ((hi - lo) / E * 100).toExponential(1) + ' % over the run'
        : '';
    };
  });
})(window.A = window.A || {});
