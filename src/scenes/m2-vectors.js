/* Maths companion, §M.2: the two products, and the difference between a scalar
   field and a vector field — which is the difference every operator on the next
   page trades on. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------ the dot product --- */

  A.scene('dot-product', function (root) {
    var W = 960, H = 560;
    var svg = S.root(W, H,
      'Two vectors with the projection of one onto the other drawn. The dot product is the ' +
      'length of that projection times the length of the other vector, and it changes sign ' +
      'once the angle passes ninety degrees.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 270, cy = 300, R = 165;

    var aArrow = S.arrow(svg, cx, cy, cx + R, cy, 'i');
    aArrow.setAttribute('stroke-width', '2.5');
    svg.appendChild(aArrow);
    svg.appendChild(S.text(cx + R + 10, cy + 4, 'a', 's-lbl-b', 'start'));

    var bArrow = S.arrow(svg, cx, cy, cx, cy, 'w');
    bArrow.setAttribute('stroke-width', '2.5');
    svg.appendChild(bArrow);
    var bLbl = S.text(0, 0, 'b', 's-lbl-w', 'start');
    svg.appendChild(bLbl);

    var drop = S.line(0, 0, 0, 0, 's-axis s-dash');
    svg.appendChild(drop);
    var projBar = S.line(cx, cy + 34, cx, cy + 34, 's-quantum');
    projBar.setAttribute('stroke-width', '4');
    svg.appendChild(projBar);
    var projLbl = S.text(0, 0, '', 's-lbl-q', 'middle');
    svg.appendChild(projLbl);

    var arc = S.path('', 's-ghost');
    svg.appendChild(arc);
    var angLbl = S.text(0, 0, 'θ', 's-lbl', 'start');
    svg.appendChild(angLbl);

    /* Value dial on the right. */
    var vx0 = 600, vx1 = 920, vy = 300, vh = 150;
    svg.appendChild(S.line(vx0, vy, vx1, vy, 's-axis'));
    svg.appendChild(S.line(vx0, vy - vh, vx0, vy + vh, 's-axis'));
    svg.appendChild(S.text(vx0 - 8, vy - vh + 4, '+|a||b|', 's-tick', 'end'));
    svg.appendChild(S.text(vx0 - 8, vy + vh + 4, '−|a||b|', 's-tick', 'end'));
    svg.appendChild(S.text(vx0 - 8, vy + 4, '0', 's-tick', 'end'));
    svg.appendChild(S.text(vx1, vy + 26, 'θ  from 0 to π', 's-lbl', 'end'));
    var cosCurve = S.path('', 's-quantum');
    svg.appendChild(cosCurve);
    S.setD(cosCurve, S.polyD(S.sample(160, 0, Math.PI, function (th) {
      return [M.map(th, 0, Math.PI, vx0, vx1), vy - Math.cos(th) * vh];
    })));
    var vDot = S.circle(vx0, vy - vh, 5, 's-fill-q');
    svg.appendChild(vDot);
    var vRead = S.text(vx1, vy - vh - 20, '', 's-lbl-b', 'end');
    vRead.setAttribute('font-size', '14');
    svg.appendChild(vRead);

    var notes = [
      'a · b = |a| |b| cos θ = aₓbₓ + a_y b_y + a_z b_z',
      'positive when they broadly agree, zero when perpendicular, negative when opposed',
      'F · dr in the work integral keeps only the part of the force along the path',
      'k · n̂ = 0 in §1.1 is exactly the statement that E is perpendicular to the travel direction'
    ].map(function (str, i) {
      var t = S.text(60, 456 + i * 26, str, i === 0 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 0 ? '13.5' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      var th = M.lerp(0.28, Math.PI - 0.18, M.easeInOut(M.beat(p, 0.06, 0.92)));
      var bR = R * 0.86;
      var bxp = cx + Math.cos(th) * bR, byp = cy - Math.sin(th) * bR;
      bArrow.setAttribute('x2', bxp.toFixed(1)); bArrow.setAttribute('y2', byp.toFixed(1));
      bLbl.setAttribute('x', bxp + 10); bLbl.setAttribute('y', byp - 6);

      var projLen = Math.cos(th) * bR;
      drop.setAttribute('x1', bxp); drop.setAttribute('y1', byp);
      drop.setAttribute('x2', cx + projLen); drop.setAttribute('y2', cy);

      projBar.setAttribute('x1', cx); projBar.setAttribute('y1', cy + 34);
      projBar.setAttribute('x2', cx + projLen); projBar.setAttribute('y2', cy + 34);
      projLbl.setAttribute('x', cx + projLen / 2);
      projLbl.setAttribute('y', cy + 56);
      projLbl.textContent = '|b| cos θ = ' + (Math.cos(th) * 0.86).toFixed(2) + ' |b|';

      var ar = 52;
      arc.setAttribute('d', 'M' + (cx + ar) + ' ' + cy + 'A' + ar + ' ' + ar + ' 0 0 0 ' +
        (cx + Math.cos(th) * ar).toFixed(1) + ' ' + (cy - Math.sin(th) * ar).toFixed(1));
      angLbl.setAttribute('x', cx + Math.cos(th / 2) * (ar + 14));
      angLbl.setAttribute('y', cy - Math.sin(th / 2) * (ar + 14));

      vDot.setAttribute('cx', M.map(th, 0, Math.PI, vx0, vx1));
      vDot.setAttribute('cy', vy - Math.cos(th) * vh);
      vRead.textContent = 'cos θ = ' + Math.cos(th).toFixed(2) +
        (Math.cos(th) > 0.02 ? '   (positive)' : (Math.cos(th) < -0.02 ? '   (negative)' : '   (zero: perpendicular)'));

      notes.forEach(function (n, i) { S.op(n, M.beat(p, 0.3 + i * 0.13, 0.46 + i * 0.13)); });
    };
  });

  /* ----------------------------------------------- the cross product --- */

  A.scene('cross-product', function (root) {
    var W = 960, H = 540;
    var svg = S.root(W, H,
      'Two vectors spanning a parallelogram, with their cross product standing perpendicular ' +
      'to it. The length of the product is the area of the parallelogram.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var ox = 320, oy = 330;
    function proj(x, y, z) { return [ox + x * 120 + y * 62, oy - z * 108 + y * 40]; }

    var gAx = S.g({});
    svg.appendChild(gAx);
    [[[1.7, 0, 0], 'x'], [[0, 1.7, 0], 'y'], [[0, 0, 1.7], 'z']].forEach(function (row) {
      var e = proj(row[0][0], row[0][1], row[0][2]);
      gAx.appendChild(S.arrow(svg, ox, oy, e[0], e[1], 'i'));
      gAx.appendChild(S.text(e[0] + 8, e[1] + 4, row[1], 's-lbl', 'start'));
    });

    /* a along y-ish, b along z-ish, so a x b comes out along x: E x B. */
    var aEnd = proj(0, 0, 1.15);
    var bEnd = proj(0, 1.15, 0);
    var cEnd = proj(1.3, 0, 0);

    var gPara = S.g({});
    svg.appendChild(gPara);
    var corner = proj(0, 1.15, 1.15);
    var para = S.el('polygon', {
      points: [ox, oy, aEnd[0], aEnd[1], corner[0], corner[1], bEnd[0], bEnd[1]].join(' '),
      fill: 'var(--wave)', 'fill-opacity': '0.10', stroke: 'none'
    });
    gPara.appendChild(para);
    gPara.appendChild(S.text(corner[0] + 10, corner[1] - 8, 'area = |a||b| sin θ', 's-lbl-w', 'start'));

    var aA = S.arrow(svg, ox, oy, aEnd[0], aEnd[1], 'w');
    aA.setAttribute('stroke-width', '2.5');
    var bA = S.arrow(svg, ox, oy, bEnd[0], bEnd[1], 'q');
    bA.setAttribute('stroke-width', '2.5');
    var cA = S.arrow(svg, ox, oy, cEnd[0], cEnd[1], 'i');
    cA.setAttribute('stroke-width', '3');
    svg.appendChild(aA); svg.appendChild(bA); svg.appendChild(cA);
    svg.appendChild(S.text(aEnd[0] - 8, aEnd[1] - 8, 'a = E along y', 's-lbl-w', 'end'));
    svg.appendChild(S.text(bEnd[0] + 10, bEnd[1] + 12, 'b = B along z', 's-lbl-q', 'start'));
    var cLbl = S.text(cEnd[0] + 10, cEnd[1] + 4, 'a × b = S along x', 's-lbl-b', 'start');
    svg.appendChild(cLbl);

    var lines = [
      'a × b is perpendicular to both, with |a × b| = |a||b| sin θ',
      'the direction comes from the right-hand rule: fingers along a, curl to b, thumb gives a × b',
      'so it is zero when a and b are parallel, and largest when they are perpendicular',
      'S = (1/μ₀) E × B is the Poynting vector: energy flows perpendicular to both fields'
    ].map(function (str, i) {
      var t = S.text(60, 428 + i * 26, str, i === 3 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 3 ? '13' : '12');
      svg.appendChild(t);
      return t;
    });

    var comp = S.text(700, 130, 'in components:', 's-lbl', 'start');
    var comp2 = S.text(700, 158, '(a × b)ₓ = a_y b_z − a_z b_y', 's-lbl-w', 'start');
    var comp3 = S.text(700, 182, '(a × b)_y = a_z bₓ − aₓ b_z', 's-lbl-w', 'start');
    var comp4 = S.text(700, 206, '(a × b)_z = aₓ b_y − a_y bₓ', 's-lbl-w', 'start');
    var comp5 = S.text(700, 236, 'x → y → z → x, always in that cycle', 's-lbl-q', 'start');
    [comp, comp2, comp3, comp4, comp5].forEach(function (t) { svg.appendChild(t); });

    return function (p) {
      S.op(gAx, M.beat(p, 0.02, 0.14));
      S.op(aA, M.beat(p, 0.12, 0.26));
      S.op(bA, M.beat(p, 0.2, 0.34));
      S.op(gPara, M.beat(p, 0.3, 0.46));
      S.op(cA, M.beat(p, 0.42, 0.56));
      S.op(cLbl, M.beat(p, 0.46, 0.6));
      [comp, comp2, comp3, comp4].forEach(function (t, i) {
        S.op(t, M.beat(p, 0.5 + i * 0.06, 0.64 + i * 0.06));
      });
      S.op(comp5, M.beat(p, 0.74, 0.88));
      lines.forEach(function (l, i) { S.op(l, M.beat(p, 0.34 + i * 0.11, 0.5 + i * 0.11)); });
    };
  });

  /* --------------------------------------- scalar fields and vector fields --- */

  A.scene('fields-scalar-vector', function (root) {
    var W = 1020, H = 480;
    var svg = S.root(W, H,
      'A scalar field drawn as shaded contours beside a vector field drawn as arrows, with ' +
      'the operators that convert between them.');
    S.defsArrows(svg);
    root.appendChild(svg);

    function g(x, y) { return Math.exp(-(x * x + y * y) * 0.55); }

    /* Left: a scalar field. One number per point, shown as shade. */
    var gS = S.g({});
    svg.appendChild(gS);
    var lx = 70, ly = 110, side = 300, cells = 22;
    for (var i = 0; i < cells; i++) {
      for (var j = 0; j < cells; j++) {
        var xx = -2 + 4 * (i + 0.5) / cells, yy = -2 + 4 * (j + 0.5) / cells;
        var v = g(xx, yy);
        var r = S.rect(lx + (i / cells) * side, ly + (j / cells) * side,
                       side / cells + 0.6, side / cells + 0.6, null);
        r.setAttribute('fill', 'var(--quantum)');
        r.setAttribute('opacity', (v * 0.85).toFixed(3));
        gS.appendChild(r);
      }
    }
    gS.appendChild(S.rect(lx, ly, side, side, 's-ghost'));
    gS.appendChild(S.text(lx, ly - 34, 'a scalar field', 's-lbl-q', 'start'));
    gS.appendChild(S.text(lx, ly - 14, 'one number at every point — a temperature, a potential', 's-lbl', 'start'));
    gS.appendChild(S.text(lx, ly + side + 24, 'f(x, y)', 's-lbl-q', 'start'));

    /* Right: its gradient, as arrows. */
    var gV = S.g({});
    svg.appendChild(gV);
    var rx = 610;
    var nA = 11;
    for (i = 0; i < nA; i++) {
      for (j = 0; j < nA; j++) {
        var ax = -2 + 4 * (i + 0.5) / nA, ay = -2 + 4 * (j + 0.5) / nA;
        var gr = A.field.grad(g, ax, ay, 1e-3);
        var mag = Math.hypot(gr[0], gr[1]);
        var sc = 78;
        var px = rx + ((ax + 2) / 4) * side, py = ly + ((ay + 2) / 4) * side;
        if (mag < 1e-3) continue;
        var a = S.arrow(svg, px, py, px + gr[0] * sc, py + gr[1] * sc, 'w');
        a.setAttribute('stroke-opacity', (0.35 + Math.min(0.6, mag * 1.2)).toFixed(2));
        gV.appendChild(a);
      }
    }
    gV.appendChild(S.rect(rx, ly, side, side, 's-ghost'));
    gV.appendChild(S.text(rx, ly - 34, 'a vector field', 's-lbl-w', 'start'));
    gV.appendChild(S.text(rx, ly - 14, 'an arrow at every point — a force, a field, a current', 's-lbl', 'start'));
    gV.appendChild(S.text(rx, ly + side + 24, 'A(x, y)', 's-lbl-w', 'start'));

    /* Middle: the two directions of travel. */
    var gMid = S.g({});
    svg.appendChild(gMid);
    var mx = 400, mw = 190;
    var up = S.arrow(svg, mx + 8, ly + 96, mx + mw, ly + 96, 'q');
    up.setAttribute('stroke-width', '2');
    gMid.appendChild(up);
    gMid.appendChild(S.text(mx + mw / 2 + 4, ly + 80, 'gradient  ∇', 's-lbl-q', 'middle'));
    var dn = S.arrow(svg, mx + mw, ly + 190, mx + 8, ly + 190, 'w');
    dn.setAttribute('stroke-width', '2');
    gMid.appendChild(dn);
    gMid.appendChild(S.text(mx + mw / 2 + 4, ly + 174, 'divergence  ∇ ·', 's-lbl-w', 'middle'));
    gMid.appendChild(S.text(mx + mw / 2 + 4, ly + 232, 'curl  ∇ ×  stays', 's-lbl', 'middle'));
    gMid.appendChild(S.text(mx + mw / 2 + 4, ly + 250, 'on the right', 's-lbl', 'middle'));
    gMid.appendChild(S.text(mx + mw / 2 + 4, ly + 284, 'Laplacian  ∇²  stays', 's-lbl', 'middle'));
    gMid.appendChild(S.text(mx + mw / 2 + 4, ly + 302, 'on the left', 's-lbl', 'middle'));

    var moral = S.text(W / 2, H - 22,
      'the arrows on the right are the gradient of the shading on the left: uphill, and steepest where the shade changes fastest',
      's-lbl-b', 'middle');
    svg.appendChild(moral);

    return function (p) {
      S.op(gS, M.beat(p, 0.03, 0.22));
      S.op(gMid, M.beat(p, 0.24, 0.42));
      S.op(gV, M.beat(p, 0.36, 0.56));
      S.op(moral, M.beat(p, 0.7, 0.9));
    };
  });
})(window.A = window.A || {});
