/* §2.7 — the fringe pattern on a screen. Intensity is evaluated from
   A.phys.doubleSlit at every point, and the fringe spacing readout is compared
   against lambda L / d, so the formula and the picture check each other. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('double-slit', function (root, api) {
    var W = 940, H = 520;
    var svg = S.root(W, H,
      'Two slits, and the interference pattern they make on a distant screen.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var d = 0.25e-3, L = 2.0, lam = 633e-9;

    /* Left: the geometry, not to scale — the slit separation is drawn large so
       the two paths are distinguishable. */
    var gx = 60, gw = 300, gy = 250;
    svg.appendChild(S.text(gx, 46, 'the two paths (not to scale)', 's-lbl', 'start'));
    var barrier = S.rect(gx + 40, gy - 120, 10, 240, '');
    barrier.setAttribute('fill', 'var(--hairline)');
    svg.appendChild(barrier);
    var slitA = S.rect(gx + 40, gy - 34, 10, 14, '');
    var slitB = S.rect(gx + 40, gy + 20, 10, 14, '');
    [slitA, slitB].forEach(function (s) {
      s.setAttribute('fill', 'var(--ground)');
      svg.appendChild(s);
    });
    var screenLine = S.line(gx + gw, gy - 130, gx + gw, gy + 130, 's-axis');
    svg.appendChild(screenLine);
    var pathA = S.line(0, 0, 0, 0, 's-wave');
    var pathB = S.line(0, 0, 0, 0, 's-quantum');
    svg.appendChild(pathA); svg.appendChild(pathB);
    var extra = S.line(0, 0, 0, 0, 's-fail');
    extra.setAttribute('stroke-width', '3');
    svg.appendChild(extra);
    var extraLbl = S.text(0, 0, '', 's-lbl-f', 'start');
    svg.appendChild(extraLbl);
    var target = S.circle(0, 0, 5, 's-fill-p');
    svg.appendChild(target);

    /* Right: the screen itself, painted, plus the intensity curve. */
    var sx0 = 430, sx1 = W - 40, syc = 250, sh = 190;
    svg.appendChild(S.text(sx0, 46, 'the screen, and the brightness across it', 's-lbl', 'start'));
    var NB = 220, bands = [];
    var bw = (sx1 - sx0) / NB;
    for (var i = 0; i < NB; i++) {
      var r = S.rect(sx0 + i * bw, syc - sh, bw + 0.6, 60, '');
      r.setAttribute('stroke', 'none');
      svg.appendChild(r);
      bands.push(r);
    }
    var curve = S.path('', 's-wave');
    curve.setAttribute('stroke-width', '2.4');
    svg.appendChild(curve);
    var axis = S.line(sx0, syc + 90, sx1, syc + 90, 's-axis');
    svg.appendChild(axis);
    svg.appendChild(S.text(sx1, syc + 110, 'position on the screen', 's-lbl', 'end'));
    var gMarks = S.g({});
    svg.appendChild(gMarks);
    var cursor = S.line(0, 0, 0, 0, 's-prob s-dash');
    svg.appendChild(cursor);

    var yView = 0.02;    /* metres of screen shown, half-width */
    var probe = 0.3;     /* fraction of the view where the cursor sits */

    var host = api.controls || root;
    var sd = A.ui.slider(host, { label: 'slit separation d (mm)', name: 'd', min: 0.05, max: 1,
      step: 0.01, value: d * 1000, fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { d = v / 1000; draw(); } });
    A.ui.slider(host, { label: 'screen distance L (m)', name: 'L', min: 0.5, max: 4, step: 0.05,
      value: L, fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { L = v; draw(); } });
    A.ui.slider(host, { label: 'wavelength λ (nm)', name: 'lam', min: 400, max: 700, step: 1,
      value: lam * 1e9, fmt: function (v) { return v.toFixed(0); },
      onInput: function (v) { lam = v * 1e-9; draw(); } });
    A.ui.slider(host, { label: 'where you are looking', name: 'probe', min: 0, max: 1, step: 0.005,
      value: probe, fmt: function (v) { return ((v - 0.5) * 2 * yView * 1000).toFixed(2) + ' mm'; },
      onInput: function (v) { probe = v; draw(); } });

    var out = A.ui.readouts(host, [
      { label: 'fringe spacing, measured', name: 'meas' },
      { label: 'and λL/d', name: 'pred' },
      { label: 'path difference here', name: 'path' },
      { label: 'phase difference here', name: 'phase' },
      { label: 'brightness here', name: 'I' }
    ]);

    function intensityAt(y) {
      /* Slits treated as very narrow, so only the two-beam factor matters. */
      var sinT = y / Math.sqrt(y * y + L * L);
      return Math.pow(Math.cos(Math.PI * d * sinT / lam), 2);
    }

    function draw() {
      var col = M.wavelengthRGB(lam * 1e9);
      var yy = (probe - 0.5) * 2 * yView;

      for (var i = 0; i < NB; i++) {
        var y = (-1 + 2 * (i + 0.5) / NB) * yView;
        var I = intensityAt(y);
        bands[i].setAttribute('fill', col);
        bands[i].setAttribute('fill-opacity', String(0.08 + 0.92 * I));
      }

      S.setD(curve, S.polyD(S.sample(600, -yView, yView, function (y) {
        return [M.map(y, -yView, yView, sx0, sx1), syc + 90 - intensityAt(y) * 130];
      })));
      curve.setAttribute('stroke', col);

      /* Tick the predicted maxima, so the formula is checkable by eye. */
      while (gMarks.firstChild) gMarks.removeChild(gMarks.firstChild);
      var dy = P.fringeSpacing(lam, L, d);
      for (var m = -20; m <= 20; m++) {
        var ym = m * dy;
        if (Math.abs(ym) > yView) continue;
        var px = M.map(ym, -yView, yView, sx0, sx1);
        gMarks.appendChild(S.line(px, syc + 90, px, syc + 100, 's-quantum'));
      }
      var cxp = M.map(yy, -yView, yView, sx0, sx1);
      cursor.setAttribute('x1', cxp); cursor.setAttribute('y1', syc - sh);
      cursor.setAttribute('x2', cxp); cursor.setAttribute('y2', syc + 100);

      /* The geometry panel, with the extra path segment drawn. */
      var ay = gy - 27, by = gy + 27;
      var ty = gy + (yy / yView) * 110;
      S.setArrow(pathA, gx + 50, ay, gx + gw, ty);
      S.setArrow(pathB, gx + 50, by, gx + gw, ty);
      target.setAttribute('cx', gx + gw); target.setAttribute('cy', ty);
      /* The perpendicular foot: how much further the lower path is. */
      var ang = Math.atan2(ty - gy, gw - 50);
      var seg = 54 * Math.sin(ang);
      extra.setAttribute('x1', gx + 50); extra.setAttribute('y1', by);
      extra.setAttribute('x2', gx + 50 + seg * Math.sin(ang));
      extra.setAttribute('y2', by - seg * Math.cos(ang));
      extraLbl.setAttribute('x', gx + 62); extraLbl.setAttribute('y', by + 20);
      extraLbl.textContent = 'the extra path, d sin θ';

      var sinT = yy / Math.sqrt(yy * yy + L * L);
      var path = d * sinT;
      var phase = M.TAU * path / lam;
      var I = intensityAt(yy);

      /* Measure the spacing off the curve rather than trusting the formula. */
      var peaks = [];
      for (var j = 1; j < 4000; j++) {
        var y0 = (-1 + 2 * (j - 1) / 4000) * yView;
        var y1 = (-1 + 2 * j / 4000) * yView;
        var y2 = (-1 + 2 * (j + 1) / 4000) * yView;
        if (intensityAt(y1) > intensityAt(y0) && intensityAt(y1) >= intensityAt(y2)) peaks.push(y1);
      }
      var meas = peaks.length > 1 ? (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1) : NaN;

      out.set('meas', isFinite(meas) ? (meas * 1000).toFixed(3) + ' mm' : '—');
      out.set('pred', (dy * 1000).toFixed(3) + ' mm', 'is-pos');
      out.set('path', (path * 1e9).toFixed(0) + ' nm  =  ' + (path / lam).toFixed(2) + ' λ');
      out.set('phase', (phase / Math.PI).toFixed(2) + ' π');
      out.set('I', (I * 100).toFixed(1) + '% of the peak',
              I > 0.9 ? 'is-pos' : (I < 0.05 ? 'is-zero' : ''));
    }

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      if (!sd.touched && !api.reduced) {
        var v = M.lerp(0.12, 0.6, M.easeInOut(M.beat(p, 0.1, 0.9)));
        if (Math.abs(v - d * 1000) > 0.005) { d = v / 1000; sd.set(v, true); draw(); }
      }
    };
  });
})(window.A = window.A || {});
