/* §2.8 — the diffraction pattern of a slit you can narrow. Brightness comes from
   A.phys.singleSlit, and the first minimum is located by searching the computed
   curve rather than by plotting the formula for it, so the two agree only if both
   are right. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('single-slit', function (root, api) {
    var W = 940, H = 500;
    var svg = S.root(W, H, 'The diffraction pattern of a single slit, as the slit is narrowed.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var aOverLam = 8, L = 2.0, lamNm = 633, withFringes = false, dOverA = 4;

    /* The slit, drawn to scale against the wavelength. */
    var gx = 70, gy = 130;
    svg.appendChild(S.text(gx, 46, 'the slit, drawn against one wavelength', 's-lbl', 'start'));
    var barTop = S.rect(gx, gy - 78, 26, 60, '');
    var barBot = S.rect(gx, gy + 18, 26, 60, '');
    [barTop, barBot].forEach(function (b) {
      b.setAttribute('fill', 'var(--hairline)');
      svg.appendChild(b);
    });
    var lamBar = S.line(gx + 44, gy + 96, gx + 44, gy + 96, 's-quantum');
    lamBar.setAttribute('stroke-width', '3');
    svg.appendChild(lamBar);
    var lamLbl = S.text(gx + 54, gy + 100, 'one λ', 's-lbl-q', 'start');
    svg.appendChild(lamLbl);
    var slitLbl = S.text(gx + 44, gy + 4, '', 's-lbl-b', 'start');
    svg.appendChild(slitLbl);

    /* Rays fanning out, their spread set by the first minimum. */
    var gFan = S.g({});
    svg.appendChild(gFan);

    /* The screen and the curve. */
    var sx0 = 330, sx1 = W - 40, syc = 300, sh = 210;
    svg.appendChild(S.text(sx0, 46, 'the pattern on the screen', 's-lbl', 'start'));
    var NB = 240, bands = [], bw = (sx1 - sx0) / NB;
    for (var i = 0; i < NB; i++) {
      var r = S.rect(sx0 + i * bw, 60, bw + 0.6, 58, '');
      r.setAttribute('stroke', 'none');
      svg.appendChild(r);
      bands.push(r);
    }
    var curve = S.path('', 's-wave');
    curve.setAttribute('stroke-width', '2.4');
    var envelope = S.path('', 's-ghost');
    envelope.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(envelope); svg.appendChild(curve);
    svg.appendChild(S.line(sx0, syc + 60, sx1, syc + 60, 's-axis'));
    svg.appendChild(S.text(sx1, syc + 80, 'angle θ', 's-lbl', 'end'));
    var gMin = S.g({});
    svg.appendChild(gMin);
    var widthBar = S.line(0, 0, 0, 0, 's-fail');
    widthBar.setAttribute('stroke-width', '3');
    svg.appendChild(widthBar);
    var widthLbl = S.text(0, 0, '', 's-lbl-f', 'middle');
    svg.appendChild(widthLbl);

    var note = S.text(sx0, syc + 110, '', 's-lbl-q', 'start');
    note.setAttribute('font-size', '13');
    svg.appendChild(note);

    var sinView = 1;   /* the screen spans sin(theta) from -1 to 1 */

    var host = api.controls || root;
    var sa = A.ui.slider(host, { label: 'slit width, in wavelengths', name: 'a', min: 0.6, max: 24,
      step: 0.1, value: aOverLam, fmt: function (v) { return v.toFixed(1) + ' λ'; },
      onInput: function (v) { aOverLam = v; draw(); } });
    A.ui.slider(host, { label: 'wavelength λ (nm)', name: 'lam', min: 400, max: 700, step: 1,
      value: lamNm, fmt: function (v) { return v.toFixed(0); },
      onInput: function (v) { lamNm = v; draw(); } });
    A.ui.slider(host, { label: 'screen distance L (m)', name: 'L', min: 0.5, max: 4, step: 0.05,
      value: L, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { L = v; draw(); } });
    A.ui.buttons(host, [
      { label: 'add two-slit fringes under it', name: 'fringes',
        onClick: function (on) { withFringes = on; draw(); } }
    ], { pressed: -1, radio: false });

    var out = A.ui.readouts(host, [
      { label: 'first minimum, measured', name: 'meas' },
      { label: 'and λ/a', name: 'pred' },
      { label: 'central band, angular width', name: 'ang' },
      { label: 'and on the screen', name: 'scr' },
      { label: 'brightest side band', name: 'side' }
    ]);

    function I(sinT) {
      var env = P.singleSlit(sinT, aOverLam);
      return withFringes ? env * Math.pow(Math.cos(Math.PI * dOverA * aOverLam * sinT), 2) : env;
    }

    function draw() {
      var col = M.wavelengthRGB(lamNm);

      for (var i = 0; i < NB; i++) {
        var s = (-1 + 2 * (i + 0.5) / NB) * sinView;
        var v = I(s);
        bands[i].setAttribute('fill', col);
        bands[i].setAttribute('fill-opacity', String(0.05 + 0.95 * Math.pow(v, 0.55)));
      }

      S.setD(curve, S.polyD(S.sample(900, -sinView, sinView, function (s) {
        return [M.map(s, -sinView, sinView, sx0, sx1), syc + 60 - I(s) * sh];
      })));
      curve.setAttribute('stroke', col);
      S.setD(envelope, S.polyD(S.sample(500, -sinView, sinView, function (s) {
        return [M.map(s, -sinView, sinView, sx0, sx1), syc + 60 - P.singleSlit(s, aOverLam) * sh];
      })));
      S.op(envelope, withFringes ? 0.8 : 0);

      /* Find the first minimum by walking out from the centre. */
      var found = NaN;
      for (var m = 1; m <= 900; m++) {
        var s0 = (m - 1) / 900 * sinView, s1 = m / 900 * sinView, s2 = (m + 1) / 900 * sinView;
        var e0 = P.singleSlit(s0, aOverLam), e1 = P.singleSlit(s1, aOverLam), e2 = P.singleSlit(s2, aOverLam);
        if (e1 < e0 && e1 <= e2 && e1 < 0.02) { found = s1; break; }
      }

      while (gMin.firstChild) gMin.removeChild(gMin.firstChild);
      if (isFinite(found)) {
        [-1, 1].forEach(function (sgn) {
          var px = M.map(sgn * found, -sinView, sinView, sx0, sx1);
          gMin.appendChild(S.line(px, syc + 60, px, syc + 74, 's-fail'));
        });
        var xa = M.map(-found, -sinView, sinView, sx0, sx1);
        var xb = M.map(found, -sinView, sinView, sx0, sx1);
        widthBar.setAttribute('x1', xa); widthBar.setAttribute('y1', syc + 84);
        widthBar.setAttribute('x2', xb); widthBar.setAttribute('y2', syc + 84);
        widthLbl.setAttribute('x', (xa + xb) / 2); widthLbl.setAttribute('y', syc + 102);
        widthLbl.textContent = 'the central bright band';
        S.op(widthBar, 1); S.op(widthLbl, 1);
      } else {
        S.op(widthBar, 0); S.op(widthLbl, 0);
      }

      /* The slit picture, and the fan of rays out to the first minimum. */
      var pxPerLam = 9;
      var halfPix = Math.max(2, aOverLam * pxPerLam / 2);
      barTop.setAttribute('y', gy - 78 - 0);
      barTop.setAttribute('height', Math.max(4, 78 - halfPix));
      barBot.setAttribute('y', gy + halfPix);
      barBot.setAttribute('height', Math.max(4, 78 - halfPix));
      lamBar.setAttribute('x2', gx + 44 + pxPerLam);
      slitLbl.setAttribute('y', gy - halfPix - 8);
      slitLbl.textContent = 'a = ' + aOverLam.toFixed(1) + ' λ';

      while (gFan.firstChild) gFan.removeChild(gFan.firstChild);
      var spread = isFinite(found) ? Math.asin(Math.min(1, found)) : Math.PI / 2;
      for (var q = -3; q <= 3; q++) {
        var ang = spread * q / 3;
        var ln = S.line(gx + 26, gy, gx + 26 + Math.cos(ang) * 180, gy + Math.sin(ang) * 180, 's-wave');
        ln.setAttribute('stroke-opacity', String(0.7 - 0.15 * Math.abs(q)));
        gFan.appendChild(ln);
      }

      note.textContent = isFinite(found)
        ? 'the light spreads out to ' + (Math.asin(found) * 180 / Math.PI).toFixed(1) + '° before the first dark band'
        : 'the slit is about one wavelength wide: there is no dark band anywhere';

      var lam = lamNm * 1e-9, a = aOverLam * lam;
      out.set('meas', isFinite(found) ? found.toFixed(4) : 'none on the screen',
              isFinite(found) ? '' : 'is-neg');
      out.set('pred', (1 / aOverLam).toFixed(4), 'is-pos');
      out.set('ang', isFinite(found) ? (2 * Math.asin(found) * 180 / Math.PI).toFixed(2) + '°' : '180°');
      out.set('scr', isFinite(found)
        ? (2 * L * Math.tan(Math.asin(found)) * 1000).toFixed(1) + ' mm' : 'the whole screen');
      out.set('side', (P.singleSlit(1.4303 / aOverLam, aOverLam) * 100).toFixed(1) + '% of the peak');
    }

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      if (!sa.touched && !api.reduced) {
        /* Sweep from a wide slit down to about one wavelength, which is where
           the surprise is. */
        var v = M.lerp(20, 1.1, M.easeInOut(M.beat(p, 0.1, 0.9)));
        if (Math.abs(v - aOverLam) > 0.05) { aOverLam = v; sa.set(v, true); draw(); }
      }
    };
  });
})(window.A = window.A || {});
