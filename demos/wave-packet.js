/* §2.6 — a wave packet under a dispersion relation you control. The packet is
   summed from plane waves by A.phys.packet, each carried at its own frequency,
   so the crests sliding through the envelope and the envelope widening are both
   consequences of the sum rather than effects layered on. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('wave-packet', function (root, api) {
    var W = 940, H = 500;
    var svg = S.root(W, H,
      'A wave packet travelling, with its envelope and one crest tracked separately.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 50, x1 = W - 50, yc = 170, amp = 96;
    var xMin = 0, xMax = 60;
    var PX = function (x) { return M.map(x, xMin, xMax, x0, x1); };
    var PY = function (y) { return yc - y * amp; };

    var k0 = 3, dk = 0.32, disp = 0.15, t = 0, running = true;
    /* omega = v k + D k^2: the second term is the whole story of this page. */
    function omega(k) { return 1.0 * k + disp * k * k; }

    svg.appendChild(S.line(x0, yc, x1, yc, 's-axis'));
    var wave = S.path('', 's-wave');
    wave.setAttribute('stroke-width', '2');
    var envTop = S.path('', 's-quantum');
    var envBot = S.path('', 's-quantum');
    [envTop, envBot].forEach(function (e) {
      e.setAttribute('stroke-dasharray', '5 4');
      e.setAttribute('stroke-opacity', '0.85');
    });
    svg.appendChild(envTop); svg.appendChild(envBot); svg.appendChild(wave);

    var crestMark = S.circle(0, 0, 6, 's-fill-w');
    var envMark = S.circle(0, 0, 6, 's-fill-q');
    svg.appendChild(crestMark); svg.appendChild(envMark);
    var crestTick = S.line(0, 0, 0, 0, 's-wave s-dash');
    var envTick = S.line(0, 0, 0, 0, 's-quantum s-dash');
    svg.appendChild(crestTick); svg.appendChild(envTick);
    var crestLbl = S.text(0, 0, 'a crest', 's-lbl-w', 'middle');
    var envLbl = S.text(0, 0, 'the envelope peak', 's-lbl-q', 'middle');
    svg.appendChild(crestLbl); svg.appendChild(envLbl);

    /* Trails: where each marker has been, so the two speeds are comparable. */
    var trailC = [], trailE = [];
    var trailCP = S.path('', 's-wave');
    var trailEP = S.path('', 's-quantum');
    [trailCP, trailEP].forEach(function (p) {
      p.setAttribute('stroke-opacity', '0.45');
      svg.appendChild(p);
    });
    var ty0 = 300, ty1 = 420;
    svg.appendChild(S.line(x0, ty0, x0, ty1, 's-axis'));
    svg.appendChild(S.line(x0, ty1, x1, ty1, 's-axis'));
    svg.appendChild(S.text(x0 - 6, ty0, 'time', 's-lbl', 'end'));
    svg.appendChild(S.text(x1, ty1 + 18, 'position', 's-lbl', 'end'));
    svg.appendChild(S.text(x0 + 10, ty0 - 10,
      'where each has been: a steeper line means a slower speed', 's-lbl', 'start'));

    var host = api.controls || root;
    var sd = A.ui.slider(host, { label: 'dispersion D', name: 'disp', min: 0, max: 0.5, step: 0.005,
      value: disp, fmt: function (v) { return v.toFixed(3); },
      onInput: function (v) { disp = v; reset(); } });
    A.ui.slider(host, { label: 'spread Δk', name: 'dk', min: 0.1, max: 0.8, step: 0.01, value: dk,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { dk = v; reset(); } });
    A.ui.slider(host, { label: 'centre k₀', name: 'k0', min: 1.5, max: 6, step: 0.05, value: k0,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { k0 = v; reset(); } });
    A.ui.buttons(host, [
      { label: 'restart', name: 'restart', onClick: reset },
      { label: 'no dispersion', name: 'none', onClick: function () {
        disp = 0; sd.set(0, true); sd.touched = true; reset(); } },
      { label: 'pause', name: 'pause', onClick: function (on) { running = !on; } }
    ], { label: 'try', pressed: -1, radio: false });

    var out = A.ui.readouts(host, [
      { label: 'phase velocity ω/k', name: 'vp' },
      { label: 'group velocity dω/dk', name: 'vg' },
      { label: 'their ratio', name: 'ratio' },
      { label: 'envelope width now', name: 'wid' }
    ]);

    function reset() { t = 0; trailC.length = 0; trailE.length = 0; }

    /* The packet, summed from plane waves: real part and envelope together. */
    function at(x) { return P.packet(x - 8, t, k0, dk, omega, 101); }

    function draw() {
      var pts = [], top = [], bot = [], i, x, r;
      var N = 520;
      for (i = 0; i <= N; i++) {
        x = xMin + (xMax - xMin) * i / N;
        r = at(x);
        pts.push([PX(x), PY(r.re)]);
        top.push([PX(x), PY(r.env)]);
        bot.push([PX(x), PY(-r.env)]);
      }
      S.setD(wave, S.polyD(pts));
      S.setD(envTop, S.polyD(top));
      S.setD(envBot, S.polyD(bot));

      var vp = P.phaseVelocity(omega, k0), vg = P.groupVelocity(omega, k0);

      /* Track the envelope peak by searching, and a crest by its phase. */
      var best = -1, bx = 0;
      for (i = 0; i <= 400; i++) {
        x = xMin + (xMax - xMin) * i / 400;
        var e = at(x).env;
        if (e > best) { best = e; bx = x; }
      }
      var cx = 8 + vp * t;
      var lam = M.TAU / k0;
      while (cx < bx - lam / 2) cx += lam;
      while (cx > bx + lam / 2) cx -= lam;

      crestMark.setAttribute('cx', PX(cx)); crestMark.setAttribute('cy', PY(at(cx).re));
      envMark.setAttribute('cx', PX(bx)); envMark.setAttribute('cy', PY(best));
      crestTick.setAttribute('x1', PX(cx)); crestTick.setAttribute('y1', PY(0));
      crestTick.setAttribute('x2', PX(cx)); crestTick.setAttribute('y2', PY(1.25));
      envTick.setAttribute('x1', PX(bx)); envTick.setAttribute('y1', PY(0));
      envTick.setAttribute('x2', PX(bx)); envTick.setAttribute('y2', PY(-1.25));
      crestLbl.setAttribute('x', PX(cx)); crestLbl.setAttribute('y', PY(1.32));
      envLbl.setAttribute('x', PX(bx)); envLbl.setAttribute('y', PY(-1.32));

      if (trailC.length === 0 || t - trailC[trailC.length - 1][1] > 0.12) {
        trailC.push([cx, t]); trailE.push([bx, t]);
        if (trailC.length > 260) { trailC.shift(); trailE.shift(); }
      }
      var tSpan = Math.max(6, t);
      var mapTrail = function (arr) {
        return S.polyD(arr.map(function (q) {
          return [PX(q[0]), M.map(q[1], 0, tSpan, ty1, ty0)];
        }));
      };
      S.setD(trailCP, mapTrail(trailC));
      S.setD(trailEP, mapTrail(trailE));

      /* Envelope width, measured from the curve rather than predicted. */
      var half = 0, count = 0;
      for (i = 0; i <= 400; i++) {
        x = xMin + (xMax - xMin) * i / 400;
        if (at(x).env > best * 0.6065) count++;
      }
      half = count / 400 * (xMax - xMin);

      out.set('vp', vp.toFixed(3));
      out.set('vg', vg.toFixed(3));
      out.set('ratio', (vg / vp).toFixed(3), Math.abs(vg / vp - 1) < 0.01 ? 'is-zero' : 'is-pos');
      out.set('wid', half.toFixed(2), 'is-pos');
    }

    root.__demo = { read: function () { return out.read(); } };

    var last = 0;
    return function (p, time) {
      var dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      if (api.reduced) t = 4;
      else if (running) { t += dt * 1.4; if (t > 14) reset(); }
      draw();
    };
  });
})(window.A = window.A || {});
