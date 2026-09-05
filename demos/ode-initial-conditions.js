/* §1.2 — the general solution assembled from its two pieces. The cosine piece is
   fixed by the starting position, the sine piece by the starting velocity; both
   are drawn, and their sum is the curve. Numbers come from A.phys.sho, the same
   closed form the page derives. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('ode-initial-conditions', function (root, api) {
    var W = 920, H = 460;
    var svg = S.root(W, H,
      'A solution of the harmonic equation drawn as the sum of a cosine piece and a sine piece.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 70, x1 = W - 250, yc = 200, amp = 120, tMax = 8;
    var PX = function (t) { return M.map(t, 0, tMax, x0, x1); };
    var PY = function (y) { return yc - y * amp; };

    svg.appendChild(S.line(x0, yc, x1, yc, 's-axis'));
    svg.appendChild(S.line(x0, yc - amp * 1.35, x0, yc + amp * 1.35, 's-axis'));
    svg.appendChild(S.text(x1, yc + 20, 't', 's-lbl', 'end'));
    svg.appendChild(S.text(x0 - 8, yc - amp * 1.3, 'x', 's-lbl', 'end'));

    var cosPiece = S.path('', 's-wave');
    cosPiece.setAttribute('stroke-dasharray', '5 5');
    cosPiece.setAttribute('stroke-opacity', '0.75');
    var sinPiece = S.path('', 's-quantum');
    sinPiece.setAttribute('stroke-dasharray', '5 5');
    sinPiece.setAttribute('stroke-opacity', '0.75');
    var total = S.path('', 's-prob');
    total.setAttribute('stroke-width', '2.8');
    var envelope = S.path('', 's-ghost');
    envelope.setAttribute('stroke-dasharray', '2 6');
    svg.appendChild(envelope); svg.appendChild(cosPiece);
    svg.appendChild(sinPiece); svg.appendChild(total);

    var startDot = S.circle(0, 0, 6, 's-fill-p');
    svg.appendChild(startDot);
    var slope = S.arrow(svg, 0, 0, 0, 0, 'p');
    svg.appendChild(slope);

    var lc = S.text(0, 0, '', 's-lbl-w', 'start');
    var ls = S.text(0, 0, '', 's-lbl-q', 'start');
    svg.appendChild(lc); svg.appendChild(ls);

    var rows = [0, 1, 2, 3, 4].map(function (i) {
      var t = S.text(x1 + 26, 110 + i * 32, '', i === 4 ? 's-lbl-p' : 's-lbl', 'start');
      t.setAttribute('font-size', '13');
      svg.appendChild(t);
      return t;
    });
    svg.appendChild(S.line(x1 + 20, 88, W - 24, 88, 's-axis'));
    svg.appendChild(S.text(x1 + 20, 78, 'the same solution', 's-lbl', 'start'));

    var xi = 0.6, vi = -0.9, w = 3;
    var host = api.controls || root;
    var sx = A.ui.slider(host, { label: 'x(0)', name: 'x0', min: -1, max: 1, step: 0.01, value: xi,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { xi = v; draw(); } });
    A.ui.slider(host, { label: 'velocity at t = 0', name: 'v0', min: -3, max: 3, step: 0.05, value: vi,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { vi = v; draw(); } });
    A.ui.slider(host, { label: 'ω', name: 'w', min: 0.5, max: 5, step: 0.05, value: w,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { w = v; draw(); } });
    A.ui.buttons(host, [
      { label: 'release from rest', name: 'rest', onClick: function () {
        vi = 0; xi = 0.8; sx.set(0.8, true); sx.touched = true; draw(); } },
      { label: 'kick from the middle', name: 'kick', onClick: function () {
        xi = 0; vi = 2; sx.set(0, true); sx.touched = true; draw(); } }
    ], { label: 'try', pressed: -1 });

    var out = A.ui.readouts(host, [
      { label: 'C₁ = x(0)', name: 'c1' },
      { label: 'C₂ = v(0)/ω', name: 'c2' },
      { label: 'amplitude A', name: 'amp' },
      { label: 'phase φ', name: 'phi' }
    ]);

    function draw() {
      var s = P.sho(xi, vi, w);
      var C1 = s.C1, C2 = s.C2;

      S.setD(cosPiece, S.polyD(S.sample(400, 0, tMax, function (t) {
        return [PX(t), PY(C1 * Math.cos(w * t))];
      })));
      S.setD(sinPiece, S.polyD(S.sample(400, 0, tMax, function (t) {
        return [PX(t), PY(C2 * Math.sin(w * t))];
      })));
      S.setD(total, S.polyD(S.sample(500, 0, tMax, function (t) {
        return [PX(t), PY(s.x(t))];
      })));
      S.setD(envelope, S.polyD([[x0, PY(s.A)], [x1, PY(s.A)]]) + ' ' +
                       S.polyD([[x0, PY(-s.A)], [x1, PY(-s.A)]]));

      startDot.setAttribute('cx', PX(0)); startDot.setAttribute('cy', PY(xi));
      var dt = 0.6;
      S.setArrow(slope, PX(0), PY(xi), PX(dt), PY(xi + vi * dt));

      lc.setAttribute('x', PX(0.15)); lc.setAttribute('y', PY(C1) - 8);
      ls.setAttribute('x', PX(tMax * 0.25 / (w / 3))); ls.setAttribute('y', PY(C2) - 8);
      lc.textContent = 'C₁ cos ωt';
      ls.textContent = 'C₂ sin ωt';

      rows[0].textContent = 'x(t) = ' + C1.toFixed(2) + ' cos ' + w.toFixed(1) + 't';
      rows[1].textContent = '       ' + (C2 < 0 ? '− ' : '+ ') + Math.abs(C2).toFixed(2) +
                            ' sin ' + w.toFixed(1) + 't';
      rows[2].textContent = '';
      rows[3].textContent = 'or, as one cosine:';
      rows[4].textContent = s.A.toFixed(3) + ' cos(' + w.toFixed(1) + 't + ' +
                            (s.phi * 180 / Math.PI).toFixed(1) + '°)';

      out.set('c1', C1.toFixed(3));
      out.set('c2', C2.toFixed(3), Math.abs(C2) < 1e-9 ? 'is-zero' : '');
      out.set('amp', s.A.toFixed(3));
      out.set('phi', (s.phi * 180 / Math.PI).toFixed(1) + '°');
    }

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      if (!sx.touched && !api.reduced) {
        vi = M.lerp(-2.4, 2.4, M.easeInOut(M.beat(p, 0.1, 0.9)));
        draw();
      }
    };
  });
})(window.A = window.A || {});
