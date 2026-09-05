/* §2.5 — a standing wave built from its two travelling halves. The allowed
   wavelengths come from A.phys.standing, so choosing a mode number and an end
   condition reproduces the page's formulas rather than restating them. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('standing-wave', function (root, api) {
    var W = 940, H = 470;
    var svg = S.root(W, H,
      'A standing wave on a string, together with the two travelling waves that make it.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 80, x1 = W - 80, yc = 180, amp = 88;
    var L = 1, v = 100, n = 3, freeEnd = false, showParts = true, t = 0, running = true;
    var PX = function (x) { return M.map(x, 0, L, x0, x1); };
    var PY = function (y) { return yc - y * amp; };

    svg.appendChild(S.line(x0, yc, x1, yc, 's-axis'));
    /* The two ends, drawn as what they are. */
    var wallL = S.rect(x0 - 12, yc - 46, 12, 92, '');
    wallL.setAttribute('fill', 'var(--hairline)');
    svg.appendChild(wallL);
    var wallR = S.rect(x1, yc - 46, 12, 92, '');
    wallR.setAttribute('fill', 'var(--hairline)');
    svg.appendChild(wallR);
    var pole = S.line(x1 + 6, yc - 52, x1 + 6, yc + 52, 's-quantum');
    pole.setAttribute('stroke-width', '2');
    svg.appendChild(pole);
    var ring = S.el('circle', { r: 9, class: 's-quantum' });
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke-width', '2.5');
    svg.appendChild(ring);

    var right = S.path('', 's-wave');
    var left = S.path('', 's-quantum');
    [right, left].forEach(function (p) {
      p.setAttribute('stroke-opacity', '0.45');
      p.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(p);
    });
    var stand = S.path('', 's-prob');
    stand.setAttribute('stroke-width', '3');
    svg.appendChild(stand);
    var envelope = S.path('', 's-ghost');
    envelope.setAttribute('stroke-dasharray', '2 5');
    svg.appendChild(envelope);

    var gNodes = S.g({});
    svg.appendChild(gNodes);

    svg.appendChild(S.text(x0, 44, 'dashed: the two travelling waves   ·   solid: their sum', 's-lbl', 'start'));
    var modeLbl = S.text(W / 2, 320, '', 's-lbl-b', 'middle');
    modeLbl.setAttribute('font-size', '15');
    svg.appendChild(modeLbl);
    var halfLbl = S.text(W / 2, 348, '', 's-lbl', 'middle');
    svg.appendChild(halfLbl);

    var host = api.controls || root;
    var sn = A.ui.slider(host, { label: 'mode number n', name: 'n', min: 1, max: 6, step: 1, value: n,
      fmt: function (x) { return x.toFixed(0); }, onInput: function (x) { n = x; draw(); } });
    A.ui.slider(host, { label: 'length L (m)', name: 'L', min: 0.4, max: 2, step: 0.05, value: L,
      fmt: function (x) { return x.toFixed(2); }, onInput: function (x) { L = x; draw(); } });
    A.ui.slider(host, { label: 'wave speed v (m/s)', name: 'v', min: 20, max: 300, step: 5, value: v,
      fmt: function (x) { return x.toFixed(0); }, onInput: function (x) { v = x; draw(); } });
    A.ui.buttons(host, [
      { label: 'both ends held', name: 'fixed', onClick: function () { freeEnd = false; draw(); } },
      { label: 'far end free', name: 'free', onClick: function () { freeEnd = true; draw(); } }
    ], { label: 'ends', pressed: 0 });
    A.ui.buttons(host, [
      { label: 'show the two waves', name: 'parts', onClick: function (on) { showParts = on; draw(); } },
      { label: 'pause', name: 'pause', onClick: function (on) { running = !on; } }
    ], { pressed: 0, radio: false });

    var out = A.ui.readouts(host, [
      { label: 'wavelength λₙ', name: 'lam' }, { label: 'frequency fₙ', name: 'f' },
      { label: 'fₙ / f₁', name: 'ratio' }, { label: 'nodes (ends included)', name: 'nodes' }
    ]);

    function draw() {
      var st = P.standing(n, L, v, freeEnd);
      var k = st.k, w = st.omega;

      /* The standing wave, and the two travelling halves that add to it. */
      var yStand = function (x) { return Math.sin(k * x) * Math.cos(w * t); };
      var yR = function (x) { return 0.5 * Math.sin(k * x - w * t); };
      var yL = function (x) { return 0.5 * Math.sin(k * x + w * t); };

      S.setD(stand, S.polyD(S.sample(600, 0, L, function (x) { return [PX(x), PY(yStand(x))]; })));
      S.setD(right, S.polyD(S.sample(400, 0, L, function (x) { return [PX(x), PY(yR(x))]; })));
      S.setD(left, S.polyD(S.sample(400, 0, L, function (x) { return [PX(x), PY(yL(x))]; })));
      S.op(right, showParts ? 1 : 0);
      S.op(left, showParts ? 1 : 0);
      S.setD(envelope,
        S.polyD(S.sample(300, 0, L, function (x) { return [PX(x), PY(Math.sin(k * x))]; })) + ' ' +
        S.polyD(S.sample(300, 0, L, function (x) { return [PX(x), PY(-Math.sin(k * x))]; })));

      S.op(wallR, freeEnd ? 0 : 1);
      S.op(pole, freeEnd ? 1 : 0);
      S.op(ring, freeEnd ? 1 : 0);
      ring.setAttribute('cx', x1 + 6);
      ring.setAttribute('cy', PY(yStand(L)));

      /* Node and antinode markers, placed from the zeros of the shape. */
      while (gNodes.firstChild) gNodes.removeChild(gNodes.firstChild);
      var nodeCount = 0;
      for (var i = 0; i <= 400; i++) {
        var x = L * i / 400;
        var s0 = Math.sin(k * x), s1 = Math.sin(k * (x + L / 400));
        if (i < 400 && (s0 === 0 || s0 * s1 < 0)) {
          gNodes.appendChild(S.circle(PX(x), yc, 4, 's-fill-f'));
          nodeCount++;
        }
      }
      /* x = 0 is always a node; the loop above may have missed it exactly. */
      gNodes.appendChild(S.circle(PX(0), yc, 4, 's-fill-f'));
      nodeCount++;
      if (!freeEnd) { gNodes.appendChild(S.circle(PX(L), yc, 4, 's-fill-f')); nodeCount++; }

      var halves = freeEnd ? ((2 * n - 1) / 4) : (n / 2);
      modeLbl.textContent = freeEnd
        ? 'λ = 4L/' + (2 * n - 1) + ' = ' + st.lambda.toFixed(3) + ' m,   f = ' + st.f.toFixed(1) + ' Hz'
        : 'λ = 2L/' + n + ' = ' + st.lambda.toFixed(3) + ' m,   f = ' + st.f.toFixed(1) + ' Hz';
      halfLbl.textContent = 'the string holds ' + halves.toFixed(2).replace(/\.00$/, '') +
        ' wavelengths' + (freeEnd ? ', an odd number of quarters' : ', a whole number of halves');

      out.set('lam', st.lambda.toFixed(4) + ' m');
      out.set('f', st.f.toFixed(2) + ' Hz');
      out.set('ratio', freeEnd ? String(2 * n - 1) : String(n), 'is-pos');
      out.set('nodes', String(nodeCount));
    }

    root.__demo = { read: function () { return out.read(); } };

    var last = 0;
    return function (p, time) {
      var dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      /* Slowed right down, or a 100 Hz string would be a blur. */
      if (api.reduced) t = 0.0012;
      else if (running) t += dt * 0.012;
      draw();
    };
  });
})(window.A = window.A || {});
