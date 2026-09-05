/* §2.3 — a travelling wave with a marked crest. The crest's position is computed
   from the constant-phase condition, so the readout showing it covering one
   wavelength per period is the derivation being checked in front of you. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('traveling-wave', function (root, api) {
    var W = 940, H = 460;
    var svg = S.root(W, H, 'A travelling wave, with one crest marked so its motion can be followed.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 60, x1 = W - 40, yc = 150, amp = 78, xMax = 6;   /* metres shown */
    var PX = function (x) { return M.map(x, 0, xMax, x0, x1); };
    var PY = function (y) { return yc - y * amp; };

    var k = 3, w = 4, sign = -1, longitudinal = false, t = 0, running = true;

    svg.appendChild(S.line(x0, yc, x1, yc, 's-axis'));
    svg.appendChild(S.text(x1, yc + 22, 'x  (m)', 's-lbl', 'end'));
    var wave = S.path('', 's-wave');
    wave.setAttribute('stroke-width', '2.6');
    svg.appendChild(wave);
    var ghost = S.path('', 's-ghost');
    ghost.setAttribute('stroke-dasharray', '4 5');
    svg.appendChild(ghost);

    /* Dots that ride the wave, so the transverse/longitudinal difference is
       visible rather than described. */
    var NP = 46, dots = [];
    for (var i = 0; i < NP; i++) {
      var d = S.circle(0, 0, 3, 's-fill-q');
      svg.appendChild(d);
      dots.push(d);
    }

    var crest = S.circle(0, 0, 7, 's-fill-p');
    svg.appendChild(crest);
    var crestTrail = S.path('', 's-prob');
    crestTrail.setAttribute('stroke-dasharray', '2 4');
    svg.appendChild(crestTrail);
    var crestLbl = S.text(0, 0, 'one crest', 's-lbl-p', 'middle');
    svg.appendChild(crestLbl);

    /* Wavelength and period markers. */
    var lamMark = S.g({});
    svg.appendChild(lamMark);
    var lamLine = S.line(0, 0, 0, 0, 's-quantum');
    var lamL = S.text(0, 0, '', 's-lbl-q', 'middle');
    lamMark.appendChild(lamLine); lamMark.appendChild(lamL);

    var tx0 = 60, tx1 = W - 40, tyc = 340, tAmp = 52, tSpan = 4;
    svg.appendChild(S.line(tx0, tyc, tx1, tyc, 's-axis'));
    svg.appendChild(S.text(tx1, tyc + 22, 't  (s)', 's-lbl', 'end'));
    svg.appendChild(S.text(tx0, tyc - tAmp - 14,
      'the string at one fixed place, against time', 's-lbl', 'start'));
    var tTrace = S.path('', 's-fail');
    svg.appendChild(tTrace);
    var tDot = S.circle(0, 0, 5, 's-fill-f');
    svg.appendChild(tDot);
    var probe = S.line(0, 0, 0, 0, 's-fail s-dash');
    svg.appendChild(probe);
    var xProbe = 1.5;

    var host = api.controls || root;
    var sk = A.ui.slider(host, { label: 'k (rad/m)', name: 'k', min: 1, max: 10, step: 0.1, value: k,
      fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { k = v; } });
    A.ui.slider(host, { label: 'ω (rad/s)', name: 'w', min: 0.5, max: 12, step: 0.1, value: w,
      fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { w = v; } });
    A.ui.buttons(host, [
      { label: 'travels →', name: 'right', onClick: function () { sign = -1; } },
      { label: 'travels ←', name: 'left', onClick: function () { sign = +1; } }
    ], { label: 'direction', pressed: 0 });
    A.ui.buttons(host, [
      { label: 'transverse', name: 'trans', onClick: function () { longitudinal = false; } },
      { label: 'longitudinal', name: 'long', onClick: function () { longitudinal = true; } }
    ], { label: 'kind', pressed: 0 });
    A.ui.buttons(host, [
      { label: 'pause', name: 'pause', onClick: function (on) { running = !on; } }
    ], { pressed: -1, radio: false });

    var out = A.ui.readouts(host, [
      { label: 'wavelength λ = 2π/k', name: 'lam' },
      { label: 'period T = 2π/ω', name: 'T' },
      { label: 'speed ω/k', name: 'v' },
      { label: 'and λ/T', name: 'lt' },
      { label: 'crest position', name: 'cx' }
    ]);

    function phase(x) { return k * x + sign * w * t; }

    function draw() {
      var lam = M.TAU / k, T = M.TAU / w, v = w / k;

      S.setD(wave, S.polyD(S.sample(700, 0, xMax, function (x) {
        return [PX(x), PY(longitudinal ? 0 : Math.cos(phase(x)))];
      })));
      S.op(wave, longitudinal ? 0.25 : 1);
      S.setD(ghost, S.polyD(S.sample(400, 0, xMax, function (x) {
        return [PX(x), PY(Math.cos(k * x))];
      })));
      S.op(ghost, 0.35);

      /* The dots: displaced sideways for a transverse wave, along the line of
         travel for a longitudinal one. */
      for (var i = 0; i < NP; i++) {
        var xr = xMax * (i + 0.5) / NP;
        var disp = Math.cos(phase(xr));
        if (longitudinal) {
          dots[i].setAttribute('cx', PX(xr + disp * lam * 0.16));
          dots[i].setAttribute('cy', yc);
        } else {
          dots[i].setAttribute('cx', PX(xr));
          dots[i].setAttribute('cy', PY(disp));
        }
      }

      /* The marked crest: the place where the phase is a multiple of 2 pi. */
      var cx = (-sign * w * t) / k;
      cx = ((cx % lam) + lam) % lam;
      if (sign === -1) { while (cx < xMax * 0.15) cx += lam; }
      else { while (cx < xMax * 0.15) cx += lam; }
      crest.setAttribute('cx', PX(cx)); crest.setAttribute('cy', PY(1));
      crestLbl.setAttribute('x', PX(cx)); crestLbl.setAttribute('y', PY(1) - 16);
      S.setD(crestTrail, S.polyD([[PX(cx), PY(1)], [PX(cx), yc + 26]]));

      lamLine.setAttribute('x1', PX(cx)); lamLine.setAttribute('y1', yc + 42);
      lamLine.setAttribute('x2', PX(Math.min(xMax, cx + lam))); lamLine.setAttribute('y2', yc + 42);
      lamL.setAttribute('x', PX(Math.min(xMax, cx + lam / 2))); lamL.setAttribute('y', yc + 60);
      lamL.textContent = 'λ = ' + lam.toFixed(2) + ' m';

      var t0 = Math.max(0, t - tSpan * 0.7);
      S.setD(tTrace, S.polyD(S.sample(320, t0, t0 + tSpan, function (tt) {
        return [M.map(tt, t0, t0 + tSpan, tx0, tx1), tyc - Math.cos(k * xProbe + sign * w * tt) * tAmp];
      })));
      var dx = M.map(t, t0, t0 + tSpan, tx0, tx1);
      tDot.setAttribute('cx', dx); tDot.setAttribute('cy', tyc - Math.cos(phase(xProbe)) * tAmp);
      probe.setAttribute('x1', PX(xProbe)); probe.setAttribute('y1', PY(Math.cos(phase(xProbe))));
      probe.setAttribute('x2', PX(xProbe)); probe.setAttribute('y2', tyc - tAmp - 20);

      out.set('lam', lam.toFixed(3) + ' m');
      out.set('T', T.toFixed(3) + ' s');
      out.set('v', v.toFixed(3) + ' m/s');
      out.set('lt', (lam / T).toFixed(3) + ' m/s', 'is-pos');
      out.set('cx', cx.toFixed(2) + ' m, moving ' + (sign === -1 ? 'right' : 'left'));
    }

    root.__demo = { read: function () { return out.read(); } };

    var last = 0;
    return function (p, time) {
      var dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      if (api.reduced) t = 0.3;
      else if (running) t += dt;
      draw();
    };
  });
})(window.A = window.A || {});
