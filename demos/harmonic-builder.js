/* §1.4 — build a wave out of harmonics. The coefficients come from the closed
   forms the page derives (A.phys.pulseCoeff and squareCoeff), and the partial sum
   is added up term by term, so what you see converging is the series itself. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('harmonic-builder', function (root, api) {
    var W = 940, H = 520;
    var svg = S.root(W, H,
      'A square wave being built up from its harmonics, with the size of each harmonic shown as a bar.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 60, x1 = W - 40, yc = 170, amp = 105;
    var TAU = M.TAU;
    var PX = function (t) { return M.map(t, -1, 1, x0, x1); };   /* two periods */
    var PY = function (y) { return yc - y * amp; };

    var N = 7, duty = 0.5, shape = 'square';

    svg.appendChild(S.line(x0, yc, x1, yc, 's-axis'));
    svg.appendChild(S.line(x0, yc - amp * 1.35, x0, yc + amp * 1.35, 's-axis'));
    [-1, -0.5, 0, 0.5, 1].forEach(function (u) {
      svg.appendChild(S.line(PX(u), yc - amp * 1.3, PX(u), yc + amp * 1.3, 's-grid'));
      svg.appendChild(S.text(PX(u), yc + amp * 1.3 + 16, (u === 0 ? '0' : u + 'T'), 's-tick', 'middle'));
    });

    var target = S.path('', 's-ghost');
    target.setAttribute('stroke-dasharray', '5 5');
    var partial = S.path('', 's-wave');
    partial.setAttribute('stroke-width', '2.6');
    var dcLine = S.path('', 's-quantum');
    dcLine.setAttribute('stroke-dasharray', '3 5');
    svg.appendChild(target);
    var gTerms = S.g({});
    svg.appendChild(gTerms);
    svg.appendChild(dcLine); svg.appendChild(partial);

    svg.appendChild(S.text(x0, yc - amp * 1.3 - 10, 'dashed: the shape being aimed at   ·   solid: the sum so far', 's-lbl', 'start'));

    /* Coefficient bars. */
    var bx0 = 60, bx1 = W - 40, by = 350, bh = 90, NMAX = 24;
    svg.appendChild(S.line(bx0, by + bh, bx1, by + bh, 's-axis'));
    svg.appendChild(S.text(bx0, by - 10, 'the size of each harmonic', 's-lbl', 'start'));
    var barW = (bx1 - bx0) / NMAX;
    var bars = [];
    for (var i = 0; i < NMAX; i++) {
      var r = S.rect(bx0 + i * barW + 2, by + bh, barW - 4, 0, '');
      r.setAttribute('fill', 'var(--wave)');
      svg.appendChild(r);
      bars.push(r);
      if ((i + 1) % 4 === 0 || i === 0) {
        svg.appendChild(S.text(bx0 + i * barW + barW / 2, by + bh + 16, String(i + 1), 's-tick', 'middle'));
      }
    }
    var dcBar = S.rect(0, 0, 0, 0, '');
    dcBar.setAttribute('fill', 'var(--quantum)');
    svg.appendChild(dcBar);
    var dcLbl = S.text(0, 0, '', 's-lbl-q', 'middle');
    svg.appendChild(dcLbl);

    var verdict = S.text(bx0, by + bh + 42, '', 's-lbl-q', 'start');
    verdict.setAttribute('font-size', '13');
    svg.appendChild(verdict);

    var host = api.controls || root;
    var sN = A.ui.slider(host, { label: 'harmonics kept', name: 'N', min: 1, max: NMAX, step: 1, value: N,
      fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { N = v; draw(); } });
    var sD = A.ui.slider(host, { label: 'duty cycle', name: 'duty', min: 0.05, max: 0.95, step: 0.01, value: 0.5,
      fmt: function (v) { return (v * 100).toFixed(0) + '%'; },
      onInput: function (v) { duty = v; shape = 'pulse'; draw(); } });
    A.ui.buttons(host, [
      { label: 'square, ±1', name: 'square', onClick: function () { shape = 'square'; draw(); } },
      { label: 'pulse, 50%', name: 'p50', onClick: function () {
        shape = 'pulse'; duty = 0.5; sD.set(0.5, true); draw(); } },
      { label: 'pulse, 25%', name: 'p25', onClick: function () {
        shape = 'pulse'; duty = 0.25; sD.set(0.25, true); draw(); } }
    ], { label: 'shape', pressed: 0 });

    var out = A.ui.readouts(host, [
      { label: 'constant term a₀', name: 'a0' },
      { label: 'first harmonic', name: 'h1' },
      { label: 'second harmonic', name: 'h2' },
      { label: 'even harmonics', name: 'even' }
    ]);

    /* The two shapes, and their coefficients, exactly as the page derives them. */
    function targetAt(u) {
      return shape === 'square' ? P.squareWave(u * TAU) : P.pulseTrain(u * TAU, duty, 0);
    }
    function coeff(n) {
      return shape === 'square' ? P.squareCoeff(n) : P.pulseCoeff(n, duty, 0);
    }
    function dc() { return shape === 'square' ? 0 : P.pulseCoeff(0, duty, 0); }
    function termAt(n, u) {
      /* A square wave is built from sines, the centred pulse from cosines. */
      return shape === 'square' ? coeff(n) * Math.sin(n * u * TAU)
                                : coeff(n) * Math.cos(n * u * TAU);
    }

    function draw() {
      S.setD(target, S.polyD(S.sample(1200, -1, 1, function (u) {
        return [PX(u), PY(targetAt(u))];
      })));
      S.setD(partial, S.polyD(S.sample(1200, -1, 1, function (u) {
        var s = dc();
        for (var n = 1; n <= N; n++) s += termAt(n, u);
        return [PX(u), PY(s)];
      })));
      S.setD(dcLine, S.polyD([[x0, PY(dc())], [x1, PY(dc())]]));
      S.op(dcLine, dc() > 1e-6 ? 0.9 : 0);

      /* The individual harmonics, faintly, so the sum is visibly a sum. */
      while (gTerms.firstChild) gTerms.removeChild(gTerms.firstChild);
      for (var n = 1; n <= Math.min(N, 8); n++) {
        (function (n) {
          var p = S.poly(S.sample(600, -1, 1, function (u) {
            return [PX(u), PY(termAt(n, u))];
          }), 's-quantum');
          p.setAttribute('stroke-opacity', String(0.32 / Math.sqrt(n)));
          p.setAttribute('stroke-width', '1');
          gTerms.appendChild(p);
        })(n);
      }

      var maxC = 0.001;
      for (var i = 1; i <= NMAX; i++) maxC = Math.max(maxC, Math.abs(coeff(i)));
      for (i = 0; i < NMAX; i++) {
        var c = Math.abs(coeff(i + 1));
        var h = bh * c / maxC;
        bars[i].setAttribute('y', by + bh - h);
        bars[i].setAttribute('height', h);
        bars[i].setAttribute('fill-opacity', (i + 1) <= N ? '0.85' : '0.2');
      }
      var d0 = dc(), dh = bh * Math.abs(d0) / maxC;
      dcBar.setAttribute('x', bx0 - 2); dcBar.setAttribute('y', by + bh - dh);
      dcBar.setAttribute('width', 0); dcBar.setAttribute('height', dh);
      S.op(dcBar, 0);
      dcLbl.setAttribute('x', bx0 + 60); dcLbl.setAttribute('y', by - 10);
      dcLbl.textContent = d0 > 1e-6 ? 'plus a constant term of ' + d0.toFixed(3) : '';

      var evens = Math.abs(coeff(2)) + Math.abs(coeff(4));
      verdict.textContent = evens < 1e-6
        ? 'the even harmonics are all missing: the shape inverts after half a period'
        : 'the even harmonics are present: this shape has no half-period symmetry';

      out.set('a0', d0.toFixed(4), d0 > 1e-6 ? 'is-pos' : 'is-zero');
      out.set('h1', coeff(1).toFixed(4));
      out.set('h2', coeff(2).toFixed(4), Math.abs(coeff(2)) < 1e-6 ? 'is-zero' : 'is-pos');
      out.set('even', evens < 1e-6 ? 'all zero' : 'present',
              evens < 1e-6 ? 'is-zero' : 'is-pos');
    }

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      if (!sN.touched && !api.reduced) {
        var n = 1 + Math.round(M.beat(p, 0.08, 0.92) * (NMAX - 1));
        if (n !== N) { N = n; sN.set(n, true); draw(); }
      }
    };
  });
})(window.A = window.A || {});
