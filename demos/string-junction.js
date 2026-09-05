/* §2.4 — a pulse meeting a join. The three waves are the three functions of
   equation (2.4.1), evaluated directly, with R and T from A.phys.stringRT. So the
   inversion, the reversal and the stretch are consequences of the formulas rather
   than effects added to the picture. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('string-junction', function (root, api) {
    var W = 940, H = 480;
    var svg = S.root(W, H,
      'A pulse travelling along a string and meeting a join with a second, different string.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 40, x1 = W - 40, yc = 170, amp = 74;
    var xMin = -10, xMax = 10;                       /* metres */
    var PX = function (x) { return M.map(x, xMin, xMax, x0, x1); };
    var PY = function (y) { return yc - y * amp; };
    var xJ = PX(0);

    var ratio = 4;              /* mu2 / mu1 */
    var t = 0, running = true, width = 1.0;
    var v1 = 3;

    /* The two strings, drawn with a thickness that says which is heavier. */
    var lineL = S.line(x0, yc, xJ, yc, 's-axis');
    var lineR = S.line(xJ, yc, x1, yc, 's-axis');
    svg.appendChild(lineL); svg.appendChild(lineR);
    var joinMark = S.line(xJ, yc - amp * 1.5, xJ, yc + amp * 1.5, 's-quantum s-dash');
    svg.appendChild(joinMark);
    svg.appendChild(S.text(xJ, yc + amp * 1.5 + 18, 'the join', 's-lbl-q', 'middle'));
    var labL = S.text(x0 + 12, yc + amp * 1.5 + 18, '', 's-lbl', 'start');
    var labR = S.text(x1 - 12, yc + amp * 1.5 + 18, '', 's-lbl', 'end');
    svg.appendChild(labL); svg.appendChild(labR);

    var string = S.path('', 's-wave');
    string.setAttribute('stroke-width', '2.6');
    svg.appendChild(string);
    /* The incident, reflected and transmitted pieces, drawn faintly underneath so
       the total is visibly their sum. */
    var pieces = ['inc', 'ref', 'tr'].map(function (n, i) {
      var p = S.path('', i === 1 ? 's-fail' : (i === 2 ? 's-prob' : 's-ghost'));
      p.setAttribute('stroke-opacity', '0.5');
      p.setAttribute('stroke-dasharray', '4 4');
      svg.appendChild(p);
      return p;
    });
    svg.appendChild(S.text(x0, 40, 'solid: the string   ·   dashed: the incident, reflected and transmitted pieces', 's-lbl', 'start'));

    /* A snapshot strip showing the pulse shapes at a late time. */
    var sy = 330;
    svg.appendChild(S.text(x0, sy - 48, 'after the pulse has passed the join', 's-lbl', 'start'));
    var snapRef = S.path('', 's-fail');
    var snapTr = S.path('', 's-prob');
    var snapInc = S.path('', 's-ghost');
    snapInc.setAttribute('stroke-dasharray', '4 4');
    [snapInc, snapRef, snapTr].forEach(function (p) { svg.appendChild(p); });
    svg.appendChild(S.line(x0, sy, x1, sy, 's-axis'));
    var snapJ = S.line(xJ, sy - 46, xJ, sy + 46, 's-quantum s-dash');
    svg.appendChild(snapJ);
    var snapNote = S.text(x0, sy + 62, '', 's-lbl-q', 'start');
    snapNote.setAttribute('font-size', '13');
    svg.appendChild(snapNote);

    var host = api.controls || root;
    var sr = A.ui.slider(host, {
      label: 'μ₂ / μ₁', name: 'ratio', min: -1.3, max: 1.3, step: 0.01, value: Math.log10(ratio),
      fmt: function (v) { return Math.pow(10, v).toFixed(2); },
      onInput: function (v) { ratio = Math.pow(10, v); draw(); }
    });
    A.ui.slider(host, {
      label: 'pulse width (m)', name: 'width', min: 0.4, max: 2.5, step: 0.05, value: width,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { width = v; draw(); }
    });
    A.ui.buttons(host, [
      { label: 'replay', name: 'replay', onClick: function () { t = 0; running = true; } },
      { label: 'fixed end', name: 'fixed', onClick: function () {
        ratio = 400; sr.set(Math.log10(400), true); sr.touched = true; t = 0; draw(); } },
      { label: 'free end', name: 'free', onClick: function () {
        ratio = 0.0025; sr.set(Math.log10(0.0025), true); sr.touched = true; t = 0; draw(); } },
      { label: 'pause', name: 'pause', onClick: function (on) { running = !on; } }
    ], { label: 'try', pressed: -1, radio: false });

    var out = A.ui.readouts(host, [
      { label: 'R', name: 'R' }, { label: '𝒯', name: 'T' },
      { label: 'v₂ / v₁', name: 'v' }, { label: 'Z₂ / Z₁', name: 'Z' },
      { label: '1 + R', name: 'sum' }, { label: 'power out / in', name: 'pow' }
    ]);

    function pulse(u) {
      /* A single smooth bump — a Gaussian, so it has no corners to argue about. */
      return Math.exp(-Math.pow(u / (width * 0.5), 2));
    }

    function draw() {
      var rt = P.stringRT(1, ratio, 1);
      var v2 = v1 * rt.v2 / rt.v1;
      var start = -7;

      /* Equation (2.4.1), evaluated. Each piece exists only on its own side. */
      function inc(x) { return x <= 0 ? pulse(x - start - v1 * t) : 0; }
      function ref(x) { return x <= 0 ? rt.R * pulse(-x - start - v1 * t) : 0; }
      function tr(x) { return x > 0 ? rt.T * pulse(x * (v1 / v2) - start - v1 * t) : 0; }
      function total(x) { return inc(x) + ref(x) + tr(x); }

      S.setD(string, S.polyD(S.sample(900, xMin, xMax, function (x) {
        return [PX(x), PY(total(x))];
      })));
      [inc, ref, tr].forEach(function (fn, i) {
        S.setD(pieces[i], S.polyD(S.sample(700, xMin, xMax, function (x) {
          return [PX(x), PY(fn(x))];
        })));
      });

      /* The snapshot: the same three functions at a time well after the meeting. */
      var tLate = (0 - start) / v1 + 4.2 / v1;
      function late(fn) {
        return S.polyD(S.sample(700, xMin, xMax, function (x) {
          var save = t; t = tLate; var y = fn(x); t = save;
          return [PX(x), sy - y * 46];
        }));
      }
      S.setD(snapRef, late(ref));
      S.setD(snapTr, late(tr));

      lineL.setAttribute('stroke-width', String(1 + 1.4));
      lineR.setAttribute('stroke-width', String(1 + 1.4 * Math.pow(ratio, 0.25)));
      labL.textContent = 'string 1:  μ₁';
      labR.textContent = 'string 2:  ' + ratio.toFixed(2) + ' μ₁,  ' +
                         (ratio > 1 ? 'heavier and slower' : 'lighter and faster');

      snapNote.textContent = (rt.R < -0.01
        ? 'into a heavier string: the reflection is upside down'
        : (rt.R > 0.01 ? 'into a lighter string: the reflection stays upright'
                       : 'matched strings: nothing reflects at all')) +
        ',  transmitted length × ' + (v2 / v1).toFixed(2);

      out.set('R', rt.R.toFixed(4), rt.R < 0 ? 'is-neg' : (rt.R > 0 ? 'is-pos' : 'is-zero'));
      out.set('T', rt.T.toFixed(4), 'is-pos');
      out.set('v', (rt.v2 / rt.v1).toFixed(3));
      out.set('Z', (rt.Z2 / rt.Z1).toFixed(3));
      out.set('sum', (1 + rt.R).toFixed(4) + '  = 𝒯', 'is-pos');
      out.set('pow', (rt.powerR + rt.powerT).toFixed(4), 'is-pos');
    }

    root.__demo = { read: function () { return out.read(); } };

    var last = 0;
    return function (p, time) {
      var dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      if (api.reduced) t = 2.6;
      else if (running) { t += dt * 0.55; if (t > 5.2) t = 0; }
      draw();
    };
  });
})(window.A = window.A || {});
