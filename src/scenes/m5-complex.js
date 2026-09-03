/* Maths companion, §M.5: complex numbers as geometry. i as a quarter-turn,
   Euler's formula as circular motion, the modulus squared that destroys the
   phase, and the arrow addition that is interference. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------- i is a quarter turn --- */

  A.scene('i-rotation', function (root) {
    var W = 1160, H = 520;
    var svg = S.root(W, H,
      'Multiplying by i turns a number a quarter turn anticlockwise. Doing it twice takes ' +
      'one to minus one, which is what i squared equals minus one means.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 330, cy = 280, R = 150;
    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: R, class: 's-ghost', 'stroke-dasharray': '3 6' }));
    svg.appendChild(S.arrow(svg, cx - R - 40, cy, cx + R + 40, cy, 'i'));
    svg.appendChild(S.arrow(svg, cx, cy + R + 40, cx, cy - R - 40, 'i'));
    svg.appendChild(S.text(cx + R + 46, cy + 4, 'real', 's-lbl-b', 'start'));
    svg.appendChild(S.text(cx + 8, cy - R - 46, 'imaginary', 's-lbl-b', 'start'));

    var marks = [
      { a: 0, lab: '1' },
      { a: Math.PI / 2, lab: 'i' },
      { a: Math.PI, lab: '−1' },
      { a: 3 * Math.PI / 2, lab: '−i' }
    ].map(function (m) {
      var g = S.g({});
      svg.appendChild(g);
      var px = cx + Math.cos(m.a) * R, py = cy - Math.sin(m.a) * R;
      g.appendChild(S.circle(px, py, 5, 's-fill-i'));
      var dx = Math.cos(m.a) * 22, dy = -Math.sin(m.a) * 22;
      g.appendChild(S.text(px + dx, py + dy + 5, m.lab, 's-lbl-b',
        Math.abs(Math.cos(m.a)) > 0.5 ? (Math.cos(m.a) > 0 ? 'start' : 'end') : 'middle'));
      return g;
    });

    var vec = S.arrow(svg, cx, cy, cx + R, cy, 'w');
    vec.setAttribute('stroke-width', '2.5');
    svg.appendChild(vec);

    var arcs = [];
    for (var k = 0; k < 4; k++) {
      var a0 = k * Math.PI / 2, a1 = (k + 1) * Math.PI / 2;
      var rr = R * 0.62;
      var pth = S.path('M' + (cx + Math.cos(a0) * rr) + ' ' + (cy - Math.sin(a0) * rr) +
        'A' + rr + ' ' + rr + ' 0 0 0 ' + (cx + Math.cos(a1) * rr) + ' ' + (cy - Math.sin(a1) * rr),
        's-quantum');
      svg.appendChild(pth);
      arcs.push(pth);
    }
    var stepLbl = S.text(cx, cy - R - 80, '', 's-lbl-q', 'middle');
    stepLbl.setAttribute('font-size', '15');
    svg.appendChild(stepLbl);

    var lines = [
      'multiplying by i rotates a quarter turn, and changes nothing else',
      '1 → i → −1 → −i → 1',
      'so i × i takes 1 to −1:   i² = −1',
      'nothing imaginary is happening; it is a rotation with a bad name',
      'and this is why an i in an equation couples the real and imaginary parts:',
      'it feeds each one into the other'
    ].map(function (str, i) {
      var t = S.text(600, 150 + i * 42, str,
        i === 2 || i === 3 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 2 ? '15' : '12.5');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      var quarter = M.clamp(Math.floor(M.beat(p, 0.06, 0.62) * 4.999), 0, 4);
      var frac = M.clamp(M.beat(p, 0.06, 0.62) * 4.999 - quarter, 0, 1);
      var ang = (quarter + M.smooth(frac)) * Math.PI / 2;
      vec.setAttribute('x2', (cx + Math.cos(ang) * R).toFixed(1));
      vec.setAttribute('y2', (cy - Math.sin(ang) * R).toFixed(1));

      marks.forEach(function (g, i) { S.op(g, quarter >= i ? 1 : 0.25); });
      arcs.forEach(function (a, i) { S.op(a, quarter > i ? 0.8 : (quarter === i ? frac * 0.8 : 0)); });

      stepLbl.textContent = ['×1', '× i  →  i', '× i  →  −1', '× i  →  −i', '× i  →  back to 1'][quarter];

      lines.forEach(function (l, i) { S.op(l, M.beat(p, 0.2 + i * 0.11, 0.36 + i * 0.11)); });
    };
  });

  /* ------------------------------------------- Euler, as circular motion --- */

  A.scene('euler-formula', function (root, api) {
    var W = 1085, H = 560;
    var svg = S.root(W, H,
      'The point e to the i theta moves round the unit circle. Its velocity is its position ' +
      'turned a quarter turn, which is exactly the condition for uniform circular motion.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 290, cy = 300, R = 155;
    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: R, class: 's-ghost' }));
    svg.appendChild(S.arrow(svg, cx - R - 36, cy, cx + R + 36, cy, 'i'));
    svg.appendChild(S.arrow(svg, cx, cy + R + 36, cx, cy - R - 36, 'i'));
    svg.appendChild(S.text(cx + R + 42, cy + 4, 'Re', 's-lbl-b', 'start'));
    svg.appendChild(S.text(cx + 8, cy - R - 42, 'Im', 's-lbl-b', 'start'));

    var posVec = S.arrow(svg, cx, cy, cx + R, cy, 'w');
    posVec.setAttribute('stroke-width', '2.5');
    svg.appendChild(posVec);
    var velVec = S.arrow(svg, 0, 0, 0, 0, 'q');
    velVec.setAttribute('stroke-width', '2.5');
    svg.appendChild(velVec);
    var dot = S.circle(cx + R, cy, 6, 's-fill-w');
    svg.appendChild(dot);
    var posLbl = S.text(0, 0, 'e^{iθ}', 's-lbl-w', 'start');
    var velLbl = S.text(0, 0, 'i e^{iθ}', 's-lbl-q', 'start');
    svg.appendChild(posLbl); svg.appendChild(velLbl);

    /* Projections: cos on the real axis, sin on the imaginary one. */
    var cosDrop = S.line(0, 0, 0, 0, 's-axis s-dash');
    var sinDrop = S.line(0, 0, 0, 0, 's-axis s-dash');
    svg.appendChild(cosDrop); svg.appendChild(sinDrop);
    var cosLbl = S.text(0, 0, 'cos θ', 's-lbl', 'middle');
    var sinLbl = S.text(0, 0, 'sin θ', 's-lbl', 'middle');
    svg.appendChild(cosLbl); svg.appendChild(sinLbl);

    var argue = [
      'define f(θ) = e^{iθ}. Then df/dθ = i f.',
      'multiplying by i is a quarter turn, so the velocity is always',
      'perpendicular to the position, and always the same length as it.',
      '',
      'a point whose velocity is perpendicular to its position, at constant',
      'speed, is going round a circle. It starts at f(0) = 1.',
      '',
      'so e^{iθ} is the point on the unit circle at angle θ:',
      'e^{iθ} = cos θ + i sin θ'
    ].map(function (str, i) {
      var t = S.text(560, 130 + i * 40, str, i === 8 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 8 ? '17' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p, t) {
      var th = api.reduced ? 0.9 : (M.beat(p, 0.05, 1.0) * M.TAU * 1.6 + t * 0.55) % M.TAU;
      var px = cx + Math.cos(th) * R, py = cy - Math.sin(th) * R;
      posVec.setAttribute('x2', px.toFixed(1)); posVec.setAttribute('y2', py.toFixed(1));
      dot.setAttribute('cx', px.toFixed(1)); dot.setAttribute('cy', py.toFixed(1));
      posLbl.setAttribute('x', px + 12); posLbl.setAttribute('y', py - 8);

      /* Velocity = position rotated a quarter turn: (x,y) -> (-y,x). */
      var vx = -Math.sin(th), vy = -Math.cos(th);
      velVec.setAttribute('x1', px.toFixed(1)); velVec.setAttribute('y1', py.toFixed(1));
      velVec.setAttribute('x2', (px + vx * 66).toFixed(1));
      velVec.setAttribute('y2', (py + vy * 66).toFixed(1));
      velLbl.setAttribute('x', px + vx * 78);
      velLbl.setAttribute('y', py + vy * 78);

      cosDrop.setAttribute('x1', px); cosDrop.setAttribute('y1', py);
      cosDrop.setAttribute('x2', px); cosDrop.setAttribute('y2', cy);
      sinDrop.setAttribute('x1', px); sinDrop.setAttribute('y1', py);
      sinDrop.setAttribute('x2', cx); sinDrop.setAttribute('y2', py);
      cosLbl.setAttribute('x', px); cosLbl.setAttribute('y', cy + 20);
      sinLbl.setAttribute('x', cx - 34); sinLbl.setAttribute('y', py + 4);
      var proj = M.beat(p, 0.4, 0.56);
      S.op(cosDrop, proj * 0.8); S.op(sinDrop, proj * 0.8);
      S.op(cosLbl, proj); S.op(sinLbl, proj);

      argue.forEach(function (a, i) { S.op(a, M.beat(p, 0.08 + i * 0.08, 0.24 + i * 0.08)); });
    };
  });

  /* ------------------------------- conjugate and modulus squared --- */

  A.scene('conjugate-modulus', function (root) {
    var W = 1105, H = 520;
    var svg = S.root(W, H,
      'A complex number and its conjugate, reflected across the real axis. Multiplying them ' +
      'gives the length squared, with the phase cancelling exactly.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 300, cy = 270, sc = 150;
    svg.appendChild(S.arrow(svg, cx - sc - 40, cy, cx + sc + 40, cy, 'i'));
    svg.appendChild(S.arrow(svg, cx, cy + sc + 40, cx, cy - sc - 40, 'i'));
    svg.appendChild(S.text(cx + sc + 46, cy + 4, 'Re', 's-lbl-b', 'start'));
    svg.appendChild(S.text(cx + 8, cy - sc - 46, 'Im', 's-lbl-b', 'start'));
    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: sc * 0.78, class: 's-ghost', 'stroke-dasharray': '3 6' }));

    var zVec = S.arrow(svg, cx, cy, cx, cy, 'w');
    zVec.setAttribute('stroke-width', '2.5');
    var cVec = S.arrow(svg, cx, cy, cx, cy, 'q');
    cVec.setAttribute('stroke-width', '2.5');
    svg.appendChild(zVec); svg.appendChild(cVec);
    var zLbl = S.text(0, 0, 'z = |z| e^{iφ}', 's-lbl-w', 'start');
    var cLbl = S.text(0, 0, 'z* = |z| e^{−iφ}', 's-lbl-q', 'start');
    svg.appendChild(zLbl); svg.appendChild(cLbl);
    var mirror = S.line(cx - sc, cy, cx + sc, cy, 's-axis s-dash');
    svg.appendChild(mirror);

    var arcZ = S.path('', 's-ghost');
    svg.appendChild(arcZ);

    var steps = [
      'z = |z| e^{iφ}',
      'z* = |z| e^{−iφ}          the conjugate flips the sign of the phase',
      'z* z = |z| e^{−iφ} · |z| e^{iφ}',
      '      = |z|² e^{−iφ + iφ}',
      '      = |z|²                 the phase has cancelled itself',
      '',
      'real, never negative, and completely blind to φ.',
      'which is why the overall phase of ψ has no physical consequence —',
      'and why the difference of two phases still does.'
    ].map(function (str, i) {
      var t = S.text(600, 110 + i * 40, str,
        i === 4 ? 's-lbl-b' : (i >= 6 ? 's-lbl-q' : 's-lbl'), 'start');
      t.setAttribute('font-size', i === 4 ? '15' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      var phi = M.lerp(0.45, 1.35, M.easeInOut(M.beat(p, 0.06, 0.9)));
      var R = sc * 0.78;
      var px = cx + Math.cos(phi) * R, py = cy - Math.sin(phi) * R;
      var qx = px, qy = cy + Math.sin(phi) * R;
      zVec.setAttribute('x2', px.toFixed(1)); zVec.setAttribute('y2', py.toFixed(1));
      cVec.setAttribute('x2', qx.toFixed(1)); cVec.setAttribute('y2', qy.toFixed(1));
      zLbl.setAttribute('x', px + 12); zLbl.setAttribute('y', py - 8);
      cLbl.setAttribute('x', qx + 12); cLbl.setAttribute('y', qy + 18);
      var ar = 44;
      arcZ.setAttribute('d', 'M' + (cx + ar) + ' ' + cy + 'A' + ar + ' ' + ar + ' 0 0 0 ' +
        (cx + Math.cos(phi) * ar).toFixed(1) + ' ' + (cy - Math.sin(phi) * ar).toFixed(1));
      steps.forEach(function (t, i) { S.op(t, M.beat(p, 0.1 + i * 0.09, 0.26 + i * 0.09)); });
    };
  });

  /* ------------------------ why exponentials make derivatives easy --- */

  A.scene('complex-derivatives', function (root) {
    var W = 1000, H = 600;
    var svg = S.root(W, H,
      'Derivatives of a complex plane wave, and the assembly of the Schrodinger equation ' +
      'that they make possible.');
    root.appendChild(svg);

    var gL = S.g({});
    svg.appendChild(gL);
    gL.appendChild(S.text(50, 66, 'every derivative just multiplies', 's-lbl-b', 'start'));
    gL.appendChild(S.line(50, 78, 460, 78, 's-axis'));
    var rows = [
      ['ψ = e^{i(kx − ωt)}', ''],
      ['∂ψ/∂x = ik ψ', 'one x-derivative → × ik'],
      ['∂²ψ/∂x² = (ik)² ψ = −k² ψ', 'two of them → × −k²'],
      ['∂ψ/∂t = −iω ψ', 'one t-derivative → × −iω'],
      ['iℏ ∂ψ/∂t = iℏ(−iω) ψ = ℏω ψ', 'the two i’s multiply to −1'],
      ['−(ℏ²/2m) ∂²ψ/∂x² = (ℏ²k²/2m) ψ', 'and the minus signs cancel too']
    ].map(function (row, i) {
      var g = S.g({});
      gL.appendChild(g);
      var y = 112 + i * 62;
      var a = S.text(50, y, row[0], i === 0 ? 's-lbl-b' : 's-lbl-w', 'start');
      a.setAttribute('font-size', '13.5');
      g.appendChild(a);
      if (row[1]) {
        var b = S.text(62, y + 20, row[1], 's-lbl', 'start');
        b.setAttribute('font-size', '11');
        g.appendChild(b);
      }
      return g;
    });

    var gR = S.g({});
    svg.appendChild(gR);
    gR.appendChild(S.text(540, 66, 'so the whole equation is algebra', 's-lbl-b', 'start'));
    gR.appendChild(S.line(540, 78, W - 40, 78, 's-axis'));
    var rows2 = [
      ['put E = ℏω and p = ℏk', ''],
      ['iℏ ∂ψ/∂t  =  E ψ', 'the time derivative reads off the energy'],
      ['−(ℏ²/2m) ∂²ψ/∂x²  =  (p²/2m) ψ', 'the space derivatives read off the kinetic energy'],
      ['E = p²/2m + V', 'the classical relation, multiplied by ψ'],
      ['iℏ ∂ψ/∂t = −(ℏ²/2m) ∇²ψ + Vψ', 'which is (1.6.1)']
    ].map(function (row, i) {
      var g = S.g({});
      gR.appendChild(g);
      var y = 112 + i * 62;
      var a = S.text(540, y, row[0], i === 4 ? 's-lbl-b' : 's-lbl-w', 'start');
      a.setAttribute('font-size', i === 4 ? '13' : '13.5');
      g.appendChild(a);
      if (row[1]) {
        var b = S.text(552, y + 20, row[1], 's-lbl', 'start');
        b.setAttribute('font-size', '11');
        g.appendChild(b);
      }
      return g;
    });

    /* The other identity the lecture needs. */
    var gId = S.g({});
    svg.appendChild(gId);
    gId.appendChild(S.line(50, 486, W - 40, 486, 's-axis'));
    gId.appendChild(S.text(50, 512, 'and one more, for the single-slit integral in §1.3:', 's-lbl', 'start'));
    var idEq = S.text(50, 542, 'e^{iβ} − e^{−iβ} = (cos β + i sin β) − (cos β − i sin β) = 2i sin β', 's-lbl-w', 'start');
    idEq.setAttribute('font-size', '13.5');
    gId.appendChild(idEq);
    gId.appendChild(S.text(50, 572,
      'which is how ∫ e^{iαx} dx across the slit turns into a sine, and then into sinc',
      's-lbl-q', 'start'));

    return function (p) {
      S.op(gL, M.beat(p, 0.02, 0.12));
      rows.forEach(function (g, i) { S.op(g, M.beat(p, 0.05 + i * 0.07, 0.2 + i * 0.07)); });
      S.op(gR, M.beat(p, 0.4, 0.5));
      rows2.forEach(function (g, i) { S.op(g, M.beat(p, 0.44 + i * 0.07, 0.6 + i * 0.07)); });
      S.op(gId, M.beat(p, 0.8, 0.94));
    };
  });

  /* --------------------------------- adding arrows is interference --- */

  A.scene('adding-arrows', function (root) {
    var W = 1000, H = 580;
    var svg = S.root(W, H,
      'Two complex amplitudes added tip to tail. The length of the sum depends on the angle ' +
      'between them, and vanishes when they are opposed.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 300, cy = 300, sc = 100;
    svg.appendChild(S.arrow(svg, cx - 60, cy, cx + 250, cy, 'i'));
    svg.appendChild(S.arrow(svg, cx, cy + 180, cx, cy - 200, 'i'));
    svg.appendChild(S.text(cx + 256, cy + 4, 'Re', 's-lbl-b', 'start'));
    svg.appendChild(S.text(cx + 8, cy - 206, 'Im', 's-lbl-b', 'start'));

    var z1 = S.arrow(svg, cx, cy, cx + sc, cy, 'w');
    z1.setAttribute('stroke-width', '2.5');
    var z2 = S.arrow(svg, 0, 0, 0, 0, 'q');
    z2.setAttribute('stroke-width', '2.5');
    var sum = S.arrow(svg, cx, cy, cx, cy, 'i');
    sum.setAttribute('stroke-width', '3');
    svg.appendChild(z1); svg.appendChild(z2); svg.appendChild(sum);
    svg.appendChild(S.text(cx + sc / 2, cy + 22, 'ψ₁', 's-lbl-w', 'middle'));
    var z2Lbl = S.text(0, 0, 'ψ₂', 's-lbl-q', 'start');
    var sumLbl = S.text(0, 0, '', 's-lbl-b', 'start');
    svg.appendChild(z2Lbl); svg.appendChild(sumLbl);

    /* The intensity as the relative phase turns. */
    var px0 = 620, px1 = 950, pyB = 420, pyT = 130;
    svg.appendChild(S.axes(px0, pyT, px1, pyB, 'phase difference  φ₁ − φ₂', null));
    svg.appendChild(S.text(px0 - 8, pyT - 8, '|ψ₁ + ψ₂|²', 's-lbl', 'end'));
    var curve = S.path('', 's-wave');
    svg.appendChild(curve);
    S.setD(curve, S.polyD(S.sample(200, 0, M.TAU, function (d) {
      var v = 1 + 1 + 2 * Math.cos(d);
      return [M.map(d, 0, M.TAU, px0, px1), M.map(v, 0, 4.2, pyB, pyT)];
    })));
    var sumLine = S.line(px0, 0, px1, 0, 's-fail');
    sumLine.setAttribute('stroke-dasharray', '5 4');
    svg.appendChild(sumLine);
    var sumLineLbl = S.text(px1, 0, 'what particles would give: |ψ₁|² + |ψ₂|²', 's-lbl-f', 'end');
    sumLineLbl.setAttribute('font-size', '11');
    svg.appendChild(sumLineLbl);
    var mark = S.circle(0, 0, 5, 's-fill-q');
    svg.appendChild(mark);
    for (var m = 0; m <= 2; m++) {
      var tx = M.map(m * Math.PI, 0, M.TAU, px0, px1);
      svg.appendChild(S.line(tx, pyB, tx, pyB + 6, 's-axis'));
      svg.appendChild(S.text(tx, pyB + 20, ['0', 'π', '2π'][m], 's-tick', 'middle'));
    }

    var algebra = [
      '|ψ₁ + ψ₂|² = |ψ₁|² + |ψ₂|² + 2|ψ₁||ψ₂| cos(φ₁ − φ₂)',
      'the first two terms are what you would get by adding probabilities',
      'the third is the cross term, and it swings from +2|ψ₁||ψ₂| to −2|ψ₁||ψ₂|',
      'at φ₁ − φ₂ = π the two amplitudes cancel completely'
    ].map(function (str, i) {
      var t = S.text(60, 480 + i * 26, str, i === 0 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 0 ? '13.5' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      var d = M.lerp(0.35, M.TAU - 0.35, M.easeInOut(M.beat(p, 0.06, 0.92)));
      var t1x = cx + sc, t1y = cy;
      var t2x = t1x + Math.cos(d) * sc, t2y = t1y - Math.sin(d) * sc;
      z2.setAttribute('x1', t1x); z2.setAttribute('y1', t1y);
      z2.setAttribute('x2', t2x.toFixed(1)); z2.setAttribute('y2', t2y.toFixed(1));
      z2Lbl.setAttribute('x', (t1x + t2x) / 2 + 12);
      z2Lbl.setAttribute('y', (t1y + t2y) / 2 - 6);

      sum.setAttribute('x2', t2x.toFixed(1)); sum.setAttribute('y2', t2y.toFixed(1));
      var len = Math.hypot(t2x - cx, t2y - cy) / sc;
      sumLbl.setAttribute('x', t2x + 12);
      sumLbl.setAttribute('y', t2y + 20);
      sumLbl.textContent = 'ψ₁ + ψ₂,  length ' + len.toFixed(2);

      var val = 1 + 1 + 2 * Math.cos(d);
      mark.setAttribute('cx', M.map(d, 0, M.TAU, px0, px1).toFixed(1));
      mark.setAttribute('cy', M.map(val, 0, 4.2, pyB, pyT).toFixed(1));
      var sy = M.map(2, 0, 4.2, pyB, pyT);
      sumLine.setAttribute('y1', sy); sumLine.setAttribute('y2', sy);
      sumLineLbl.setAttribute('y', sy - 8);
      S.op(sumLine, M.beat(p, 0.4, 0.56));
      S.op(sumLineLbl, M.beat(p, 0.4, 0.56));

      algebra.forEach(function (a, i) { S.op(a, M.beat(p, 0.2 + i * 0.13, 0.36 + i * 0.13)); });
    };
  });
})(window.A = window.A || {});
