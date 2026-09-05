/* §2.1 — the mass, the spring, the phasor and the energy, all driven by the same
   closed-form solution from A.phys.sho. The energy bars are computed from the
   instantaneous position and velocity, so their total staying put is a result
   rather than a promise. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('sho-mass-spring', function (root, api) {
    var W = 940, H = 520;
    var svg = S.root(W, H,
      'A mass on a spring, its rotating phasor, and the two forms of its energy.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var k = 200, m = 0.5, x0 = 0.05, v0 = -1.0;
    var t = 0, running = true;
    var scale = 900;           /* pixels per metre */

    /* ---- the apparatus ---- */
    var wallX = 60, restX = 300, yM = 110, box = 48;
    var wall = S.rect(wallX - 14, yM - 60, 14, 120, '');
    wall.setAttribute('fill', 'var(--hairline)');
    svg.appendChild(wall);
    svg.appendChild(S.line(wallX, yM + 60, 560, yM + 60, 's-axis'));
    var spring = S.path('', 's-quantum');
    spring.setAttribute('stroke-width', '2');
    svg.appendChild(spring);
    var mass = S.rect(0, 0, box, box, '');
    mass.setAttribute('fill', 'var(--surface-2)');
    mass.setAttribute('stroke', 'var(--wave)');
    mass.setAttribute('rx', '3');
    svg.appendChild(mass);
    var restLine = S.line(restX, yM - 66, restX, yM + 60, 's-axis s-dash');
    restLine.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(restLine);
    svg.appendChild(S.text(restX, yM - 74, 'x = 0', 's-tick', 'middle'));
    var vArrow = S.arrow(svg, 0, 0, 0, 0, 'w');
    vArrow.setAttribute('stroke-width', '2.5');
    svg.appendChild(vArrow);
    var aArrow = S.arrow(svg, 0, 0, 0, 0, 'f');
    aArrow.setAttribute('stroke-width', '2.5');
    svg.appendChild(aArrow);
    svg.appendChild(S.text(600, yM - 30, 'velocity', 's-lbl-w', 'start'));
    svg.appendChild(S.text(600, yM - 12, 'acceleration', 's-lbl-f', 'start'));

    /* ---- the phasor ---- */
    var pcx = 780, pcy = 150, pR = 78;
    svg.appendChild(S.el('circle', { cx: pcx, cy: pcy, r: pR, class: 's-ghost s-dash' }));
    svg.appendChild(S.line(pcx - pR - 16, pcy, pcx + pR + 16, pcy, 's-axis'));
    svg.appendChild(S.line(pcx, pcy - pR - 16, pcx, pcy + pR + 16, 's-axis'));
    var phasor = S.arrow(svg, 0, 0, 0, 0, 'p');
    phasor.setAttribute('stroke-width', '3');
    svg.appendChild(phasor);
    var phasorDrop = S.line(0, 0, 0, 0, 's-prob s-dash');
    svg.appendChild(phasorDrop);
    svg.appendChild(S.text(pcx, pcy - pR - 24, 'the phasor', 's-lbl-p', 'middle'));

    /* ---- the trace ---- */
    var tx0 = 60, tx1 = 700, tyc = 300, tAmp = 55, tSpan = 1.6;
    svg.appendChild(S.line(tx0, tyc, tx1, tyc, 's-axis'));
    var trace = S.path('', 's-wave');
    var traceV = S.path('', 's-fail');
    traceV.setAttribute('stroke-opacity', '0.55');
    svg.appendChild(traceV); svg.appendChild(trace);
    var traceDot = S.circle(0, 0, 5, 's-fill-w');
    svg.appendChild(traceDot);
    svg.appendChild(S.text(tx0, tyc - tAmp - 12, 'position (blue) and velocity (red) against time', 's-lbl', 'start'));

    /* ---- energy ---- */
    var eb = 380, ebx = 60, ebw = 640;
    svg.appendChild(S.text(ebx, eb - 10, 'energy', 's-lbl', 'start'));
    function bar(y, cls, label) {
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.text(ebx, y + 13, label, cls, 'start'));
      var back = S.rect(ebx + 150, y, ebw - 150, 18, '');
      back.setAttribute('fill', 'var(--surface-2)');
      g.appendChild(back);
      var f = S.rect(ebx + 150, y, 0, 18, '');
      f.setAttribute('fill', cls === 's-lbl-w' ? 'var(--wave)' :
                            (cls === 's-lbl-q' ? 'var(--quantum)' : 'var(--ink-bright)'));
      f.setAttribute('fill-opacity', '0.65');
      g.appendChild(f);
      var v = S.text(ebx + ebw + 12, y + 13, '', cls, 'start');
      g.appendChild(v);
      return { fill: f, val: v };
    }
    var barK = bar(eb + 6, 's-lbl-w', 'kinetic  ½mv²');
    var barU = bar(eb + 34, 's-lbl-q', 'spring  ½kx²');
    var barT = bar(eb + 68, 's-lbl-b', 'total');

    /* ---- controls ---- */
    var host = api.controls || root;
    var sk = A.ui.slider(host, { label: 'k (N/m)', name: 'k', min: 20, max: 400, step: 5, value: k,
      fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { k = v; t = 0; } });
    A.ui.slider(host, { label: 'm (kg)', name: 'm', min: 0.1, max: 2, step: 0.05, value: m,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { m = v; t = 0; } });
    var sx = A.ui.slider(host, { label: 'x(0) (cm)', name: 'x0', min: -8, max: 8, step: 0.1, value: x0 * 100,
      fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { x0 = v / 100; t = 0; } });
    var sv = A.ui.slider(host, { label: 'v(0) (m/s)', name: 'v0', min: -3, max: 3, step: 0.05, value: v0,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { v0 = v; t = 0; } });
    A.ui.buttons(host, [
      { label: 'release from rest', name: 'rest', onClick: function () {
        v0 = 0; sv.set(0, true); x0 = 0.06; sx.set(6, true); t = 0; } },
      { label: 'kick from the middle', name: 'kick', onClick: function () {
        x0 = 0; sx.set(0, true); v0 = 1.5; sv.set(1.5, true); t = 0; } },
      { label: 'pause', name: 'pause', onClick: function (on) { running = !on; } }
    ], { label: 'try', pressed: -1, radio: false });

    var out = A.ui.readouts(host, [
      { label: 'ω', name: 'w' }, { label: 'period T', name: 'T' },
      { label: 'amplitude A', name: 'A' }, { label: 'phase φ', name: 'phi' },
      { label: 'position x', name: 'x' }, { label: 'velocity v', name: 'v' },
      { label: 'total energy', name: 'E' }
    ]);

    function springPath(xa, xb, y, coils, amp) {
      var pts = [[xa, y]], n = coils * 2, i;
      for (i = 1; i < n; i++) pts.push([xa + (xb - xa) * i / n, y + (i % 2 ? -amp : amp)]);
      pts.push([xb, y]);
      return S.polyD(pts);
    }

    function draw() {
      var w = Math.sqrt(k / m);
      var s = P.sho(x0, v0, w);
      var x = s.x(t), v = s.v(t), a = -w * w * x;

      var px = restX + x * scale;
      S.setD(spring, springPath(wallX, px - box / 2, yM, 9, 12));
      mass.setAttribute('x', px - box / 2); mass.setAttribute('y', yM - box / 2);
      S.setArrow(vArrow, px, yM - box / 2 - 14, px + v * 55, yM - box / 2 - 14);
      S.setArrow(aArrow, px, yM + box / 2 + 14, px + a * 0.9, yM + box / 2 + 14);
      S.op(vArrow, Math.abs(v) > 0.02 ? 1 : 0);
      S.op(aArrow, Math.abs(a) > 0.2 ? 1 : 0);

      /* The phasor: an arrow of length A at angle (wt + phi), whose horizontal
         shadow is the position. */
      var ang = w * t + s.phi;
      var ex = pcx + Math.cos(ang) * pR, ey = pcy - Math.sin(ang) * pR;
      S.setArrow(phasor, pcx, pcy, ex, ey);
      phasorDrop.setAttribute('x1', ex); phasorDrop.setAttribute('y1', ey);
      phasorDrop.setAttribute('x2', pcx + Math.cos(ang) * pR); phasorDrop.setAttribute('y2', pcy);

      var t0 = Math.max(0, t - tSpan * 0.7);
      var Ascale = Math.max(0.005, s.A);
      S.setD(trace, S.polyD(S.sample(320, t0, t0 + tSpan, function (tt) {
        return [M.map(tt, t0, t0 + tSpan, tx0, tx1), tyc - s.x(tt) / Ascale * tAmp];
      })));
      S.setD(traceV, S.polyD(S.sample(320, t0, t0 + tSpan, function (tt) {
        return [M.map(tt, t0, t0 + tSpan, tx0, tx1), tyc - s.v(tt) / (Ascale * w) * tAmp];
      })));
      var dx = M.map(t, t0, t0 + tSpan, tx0, tx1);
      traceDot.setAttribute('cx', dx); traceDot.setAttribute('cy', tyc - x / Ascale * tAmp);

      var KE = 0.5 * m * v * v, U = 0.5 * k * x * x, E = KE + U;
      var full = Math.max(1e-9, 0.5 * k * s.A * s.A);
      barK.fill.setAttribute('width', (ebw - 150) * KE / full);
      barU.fill.setAttribute('width', (ebw - 150) * U / full);
      barT.fill.setAttribute('width', (ebw - 150) * E / full);
      barK.val.textContent = KE.toFixed(3) + ' J';
      barU.val.textContent = U.toFixed(3) + ' J';
      barT.val.textContent = E.toFixed(3) + ' J';

      out.set('w', w.toFixed(2) + ' rad/s');
      out.set('T', (M.TAU / w).toFixed(3) + ' s');
      out.set('A', (s.A * 100).toFixed(2) + ' cm');
      out.set('phi', (s.phi * 180 / Math.PI).toFixed(1) + '°');
      out.set('x', (x * 100).toFixed(2) + ' cm', x > 0 ? 'is-pos' : (x < 0 ? 'is-neg' : 'is-zero'));
      out.set('v', v.toFixed(3) + ' m/s', v > 0 ? 'is-pos' : (v < 0 ? 'is-neg' : 'is-zero'));
      out.set('E', E.toFixed(4) + ' J');
    }

    root.__demo = { read: function () { return out.read(); } };

    var last = 0;
    return function (p, time) {
      var dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      if (api.reduced) t = 0.02;
      else if (running) t += dt;
      draw();
    };
  });
})(window.A = window.A || {});
