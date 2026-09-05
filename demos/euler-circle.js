/* §1.1 — the rotating arrow and the cosine it casts. The arrow's position is
   e^{i(wt+phi)} evaluated directly; the curve to its right is the trace of that
   number's real part, so the picture is the identity rather than a drawing of it. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('euler-circle', function (root, api) {
    var W = 940, H = 420;
    var svg = S.root(W, H,
      'An arrow turning on the unit circle, with the trace of its real part drawn beside it as a cosine.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 170, cy = H / 2, R = 110;
    var gx0 = 330, gx1 = W - 40, span = 3 * M.TAU;   /* radians shown */

    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: R, class: 's-ghost' }));
    svg.appendChild(S.line(cx - R - 22, cy, cx + R + 22, cy, 's-axis'));
    svg.appendChild(S.line(cx, cy - R - 22, cx, cy + R + 22, 's-axis'));
    svg.appendChild(S.line(gx0, cy, gx1, cy, 's-axis'));
    svg.appendChild(S.text(gx1, cy + 20, 'ωt + φ', 's-lbl', 'end'));
    svg.appendChild(S.text(cx, cy - R - 30, 'the unit circle', 's-lbl', 'middle'));

    var arrow = S.arrow(svg, 0, 0, 0, 0, 'w');
    arrow.setAttribute('stroke-width', '3');
    svg.appendChild(arrow);
    var dot = S.circle(0, 0, 6, 's-fill-w');
    svg.appendChild(dot);

    var drop = S.line(0, 0, 0, 0, 's-quantum s-dash');
    svg.appendChild(drop);
    var shadow = S.circle(0, 0, 5, 's-fill-q');
    svg.appendChild(shadow);
    var link = S.line(0, 0, 0, 0, 's-quantum s-dash');
    link.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(link);

    var wave = S.path('', 's-quantum');
    wave.setAttribute('stroke-width', '2.5');
    svg.appendChild(wave);
    var sinWave = S.path('', 's-wave');
    sinWave.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(sinWave);
    var head = S.circle(0, 0, 5, 's-fill-q');
    svg.appendChild(head);

    var lblRe = S.text(0, 0, '', 's-lbl-q', 'middle');
    svg.appendChild(lblRe);
    var caption = S.text(gx0, 40, 'the real part, traced as the arrow turns', 's-lbl', 'start');
    svg.appendChild(caption);
    var legend = S.text(gx0, 60, 'faint: the imaginary part, a sine', 's-lbl-w', 'start');
    svg.appendChild(legend);

    var amp = 1, phi = 0, t = 0, running = true;

    var host = api.controls || root;
    A.ui.slider(host, { label: 'phase φ', name: 'phi', min: -180, max: 180, step: 1, value: 0,
      fmt: function (v) { return v.toFixed(0) + '°'; },
      onInput: function (v) { phi = v * Math.PI / 180; } });
    var sw = A.ui.slider(host, { label: 'ω', name: 'w', min: 0.2, max: 3, step: 0.05, value: 1,
      fmt: function (v) { return v.toFixed(2); }, onInput: function () {} });
    A.ui.buttons(host, [
      { label: 'pause', name: 'pause', onClick: function (on) { running = !on; } }
    ], { pressed: -1, radio: false });
    var out = A.ui.readouts(host, [
      { label: 'angle', name: 'ang' },
      { label: 'real part = cos', name: 're' },
      { label: 'imaginary part = sin', name: 'im' },
      { label: 'length', name: 'len' }
    ]);

    function draw() {
      var th = t + phi;
      var re = Math.cos(th), im = Math.sin(th);
      var ax = cx + re * R, ay = cy - im * R;

      S.setArrow(arrow, cx, cy, ax, ay);
      dot.setAttribute('cx', ax); dot.setAttribute('cy', ay);
      /* The shadow on the real axis: this is the number's real part. */
      var sx = cx + re * R;
      drop.setAttribute('x1', ax); drop.setAttribute('y1', ay);
      drop.setAttribute('x2', sx); drop.setAttribute('y2', cy);
      shadow.setAttribute('cx', sx); shadow.setAttribute('cy', cy);
      lblRe.setAttribute('x', sx); lblRe.setAttribute('y', cy + 22);
      lblRe.textContent = re.toFixed(2);

      /* The curve: the same real part, plotted against angle, with now at the left. */
      var pts = S.sample(400, 0, span, function (u) {
        return [M.map(u, 0, span, gx0, gx1), cy - Math.cos(th - u) * R * 0.82];
      });
      S.setD(wave, S.polyD(pts));
      S.setD(sinWave, S.polyD(S.sample(400, 0, span, function (u) {
        return [M.map(u, 0, span, gx0, gx1), cy - Math.sin(th - u) * R * 0.82];
      })));
      head.setAttribute('cx', gx0); head.setAttribute('cy', cy - re * R * 0.82);
      link.setAttribute('x1', sx); link.setAttribute('y1', cy);
      link.setAttribute('x2', gx0); link.setAttribute('y2', cy - re * R * 0.82);

      out.set('ang', ((th * 180 / Math.PI) % 360).toFixed(1) + '°');
      out.set('re', re.toFixed(3), re > 0 ? 'is-pos' : 'is-neg');
      out.set('im', im.toFixed(3), im > 0 ? 'is-pos' : 'is-neg');
      out.set('len', M.hypot(re, im).toFixed(4) + '  — always 1', 'is-pos');
    }

    root.__demo = { read: function () { return out.read(); } };

    var last = 0;
    return function (p, time) {
      var dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      if (api.reduced) t = 0.9;
      else if (running) t += dt * sw.get();
      draw();
    };
  });
})(window.A = window.A || {});
