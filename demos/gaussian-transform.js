/* §1.4 and §2.6 — a pulse and its transform, side by side. The transform is
   computed by numerically integrating the definition, not by substituting the
   closed form, so the claim that a Gaussian transforms to a Gaussian is being
   tested on screen; the closed form is drawn over it as a dashed check. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('gaussian-transform', function (root, api) {
    var W = 940, H = 460;
    var svg = S.root(W, H, 'A pulse on the left and its Fourier transform on the right.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var pad = 60, half = (W - 3 * pad) / 2;
    var Lx0 = pad, Lx1 = pad + half, Rx0 = 2 * pad + half, Rx1 = W - pad;
    var yc = 210, amp = 130;
    var xRange = 8, kRange = 8;

    var sigma = 1.4, isRect = false;

    function frame(a, b, label, sub) {
      svg.appendChild(S.line(a, yc, b, yc, 's-axis'));
      svg.appendChild(S.line((a + b) / 2, yc - amp * 1.25, (a + b) / 2, yc + 30, 's-axis'));
      svg.appendChild(S.text((a + b) / 2, yc - amp * 1.25 - 12, label, 's-lbl-b', 'middle'));
      svg.appendChild(S.text(b, yc + 20, sub, 's-lbl', 'end'));
    }
    frame(Lx0, Lx1, 'the pulse   f(x)', 'x');
    frame(Rx0, Rx1, 'its transform   F(k)', 'k');

    var PXl = function (x) { return M.map(x, -xRange, xRange, Lx0, Lx1); };
    var PXr = function (k) { return M.map(k, -kRange, kRange, Rx0, Rx1); };
    var PY = function (y) { return yc - y * amp; };

    var fillL = S.el('path', { fill: 'var(--wave)', 'fill-opacity': '0.15', stroke: 'none' });
    var fillR = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.15', stroke: 'none' });
    svg.appendChild(fillL); svg.appendChild(fillR);
    var curveL = S.path('', 's-wave');
    var curveR = S.path('', 's-quantum');
    curveL.setAttribute('stroke-width', '2.6'); curveR.setAttribute('stroke-width', '2.6');
    var checkR = S.path('', 's-prob');
    checkR.setAttribute('stroke-dasharray', '5 4');
    svg.appendChild(curveL); svg.appendChild(fillR); svg.appendChild(curveR); svg.appendChild(checkR);

    /* Width markers: one standard deviation of |f|^2 either side of centre. */
    function widthMarks(cls) {
      var g = S.g({});
      svg.appendChild(g);
      var l = S.line(0, 0, 0, 0, cls), r = S.line(0, 0, 0, 0, cls), b = S.line(0, 0, 0, 0, cls);
      [l, r, b].forEach(function (e) { e.setAttribute('stroke-dasharray', '3 3'); g.appendChild(e); });
      var t = S.text(0, 0, '', cls === 's-wave' ? 's-lbl-w' : 's-lbl-q', 'middle');
      g.appendChild(t);
      return { l: l, r: r, b: b, t: t };
    }
    var wL = widthMarks('s-wave'), wR = widthMarks('s-quantum');

    var product = S.text(W / 2, H - 30, '', 's-lbl-b', 'middle');
    product.setAttribute('font-size', '15');
    svg.appendChild(product);
    var note = S.text(W / 2, H - 10, '', 's-lbl', 'middle');
    svg.appendChild(note);

    var host = api.controls || root;
    var sS = A.ui.slider(host, { label: 'pulse width σ', name: 'sigma', min: 0.25, max: 3.5,
      step: 0.01, value: sigma, fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { sigma = v; draw(); } });
    A.ui.buttons(host, [
      { label: 'Gaussian', name: 'gauss', onClick: function () { isRect = false; draw(); } },
      { label: 'rectangle', name: 'rect', onClick: function () { isRect = true; draw(); } }
    ], { label: 'shape', pressed: 0 });
    var out = A.ui.readouts(host, [
      { label: 'width in x', name: 'dx' },
      { label: 'width in k', name: 'dk' },
      { label: 'their product', name: 'prod' }
    ]);

    function f(x) {
      if (isRect) return Math.abs(x) <= sigma ? 1 : 0;
      return P.gaussian(x, sigma);
    }
    /* The transform, straight from its definition. The function is even, so only
       the cosine part survives and one real integral is enough. */
    function F(k) {
      return M.integrate(function (x) { return f(x) * Math.cos(k * x); }, -xRange, xRange, 1200);
    }
    /* Standard deviation of |f|^2, computed rather than quoted. */
    function width(fn, lo, hi) {
      var w0 = M.integrate(function (u) { return fn(u) * fn(u); }, lo, hi, 1200);
      if (w0 < 1e-12) return 0;
      var w2 = M.integrate(function (u) { return u * u * fn(u) * fn(u); }, lo, hi, 1200);
      return Math.sqrt(w2 / w0);
    }

    function draw() {
      var ptsL = S.sample(600, -xRange, xRange, function (x) { return [PXl(x), PY(f(x))]; });
      S.setD(curveL, S.polyD(ptsL));
      fillL.setAttribute('d', S.areaD(ptsL, PY(0)));

      var F0 = Math.max(1e-9, F(0));
      var ptsR = S.sample(500, -kRange, kRange, function (k) { return [PXr(k), PY(F(k) / F0)]; });
      S.setD(curveR, S.polyD(ptsR));
      fillR.setAttribute('d', S.areaD(ptsR, PY(0)));

      /* The closed form, for comparison — only meaningful for the Gaussian. */
      if (!isRect) {
        S.setD(checkR, S.polyD(S.sample(400, -kRange, kRange, function (k) {
          return [PXr(k), PY(P.gaussianFT(k, sigma) / P.gaussianFT(0, sigma))];
        })));
        S.op(checkR, 0.8);
      } else {
        S.op(checkR, 0);
      }

      var dx = width(f, -xRange, xRange);
      var dk = width(function (k) { return F(k) / F0; }, -kRange, kRange);

      function mark(w, PXf, val, y) {
        w.l.setAttribute('x1', PXf(-val)); w.l.setAttribute('y1', yc - amp * 1.1);
        w.l.setAttribute('x2', PXf(-val)); w.l.setAttribute('y2', yc + 8);
        w.r.setAttribute('x1', PXf(val)); w.r.setAttribute('y1', yc - amp * 1.1);
        w.r.setAttribute('x2', PXf(val)); w.r.setAttribute('y2', yc + 8);
        w.b.setAttribute('x1', PXf(-val)); w.b.setAttribute('y1', y);
        w.b.setAttribute('x2', PXf(val)); w.b.setAttribute('y2', y);
        w.t.setAttribute('x', PXf(0)); w.t.setAttribute('y', y - 6);
      }
      mark(wL, PXl, dx, yc - amp * 1.1);
      mark(wR, PXr, dk, yc - amp * 1.1);
      wL.t.textContent = 'Δx = ' + dx.toFixed(3);
      wR.t.textContent = 'Δk = ' + dk.toFixed(3);

      var prod = dx * dk;
      product.textContent = 'Δx · Δk = ' + dx.toFixed(3) + ' × ' + dk.toFixed(3) + ' = ' + prod.toFixed(3);
      note.textContent = isRect
        ? 'a rectangle does worse than a half — no shape does better than the Gaussian'
        : 'exactly one half, for every width';

      out.set('dx', dx.toFixed(4));
      out.set('dk', dk.toFixed(4));
      out.set('prod', prod.toFixed(4), Math.abs(prod - 0.5) < 0.02 ? 'is-pos' : 'is-neg');
    }

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      if (!sS.touched && !api.reduced) {
        var s = M.lerp(0.5, 2.6, M.easeInOut(M.beat(p, 0.1, 0.9)));
        if (Math.abs(s - sigma) > 0.01) { sigma = s; sS.set(s, true); draw(); }
      }
    };
  });
})(window.A = window.A || {});
