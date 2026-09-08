/* Hero: probability in motion. A superposition of two plane waves, with tracer
   dots advected by the velocity field v = J / |psi|^2 that the probability
   current defines. Both |psi|^2 and J are evaluated from the closed forms

     |psi|^2 = A1^2 + A2^2 + 2 A1 A2 cos(dtheta)
     J       = A1^2 k1 + A2^2 k2 + A1 A2 (k1 + k2) cos(dtheta)

   so the flow you see is the one section 1.9 derives, not a decoration. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('pre2-hero', function (root, api) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    /* Two plane waves in the plane, in units where hbar/m = 1. */
    var k1 = [1.15, -0.30], k2 = [0.62, 0.74];
    var A1 = 1.0, A2 = 0.86;
    var w1 = 0.5 * (k1[0] * k1[0] + k1[1] * k1[1]);   /* free dispersion */
    var w2 = 0.5 * (k2[0] * k2[0] + k2[1] * k2[1]);

    var N = 520;
    var rnd = M.rng(20260908);
    var dots = [];
    for (var i = 0; i < N; i++) {
      dots.push({ x: rnd(), y: rnd(), size: 0.55 + rnd() * 1.35, warm: rnd() < 0.18 });
    }

    var SC = 13;              /* world units across the canvas */
    var last = 0;

    /* '#4FD6E3' -> '79,214,227', so the gradient below can carry an alpha and
       still track the theme token rather than a hard-coded colour. */
    function rgbOf(hex, fallback) {
      var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
      if (!m) return fallback;
      var v = parseInt(m[1], 16);
      return ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255);
    }

    function dtheta(wx, wy, tt) {
      return (k1[0] - k2[0]) * wx + (k1[1] - k2[1]) * wy - (w1 - w2) * tt;
    }

    return function (p, t) {
      var f = S.fitCanvas(cv, 2);
      var ctx = f.ctx, w = f.w, h = f.h;
      var time = api.reduced ? 4 : t;
      var dt = api.reduced ? 0 : Math.min(0.05, Math.max(0, time - last));
      last = time;

      ctx.clearRect(0, 0, w, h);

      var scrolled = (window.scrollY || 0) / Math.max(1, h);
      var vis = 1 - M.smooth(M.clamp(scrolled * 1.15, 0, 1));
      if (vis <= 0.002) return;

      var cool = S.cssVar('--wave') || '#4FD6E3';
      var warm = S.cssVar('--quantum') || '#F2A65A';
      var peak = (A1 + A2) * (A1 + A2);
      var coolRGB = rgbOf(cool, '79,214,227');

      /* The fringes themselves. The phase difference is linear in position, so
         the pattern is a set of straight bands perpendicular to k1 - k2, and a
         gradient along that direction reproduces it exactly. The mapping from
         world units to pixels is isotropic, so the world direction is also the
         pixel direction. */
      var qx = k1[0] - k2[0], qy = k1[1] - k2[1];
      var qm = Math.sqrt(qx * qx + qy * qy);
      var dx = qx / qm, dy = qy / qm;
      var SP = w / SC;                       /* pixels per world unit */
      var L = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
      var gr = ctx.createLinearGradient(w / 2 - dx * L, h / 2 - dy * L,
                                        w / 2 + dx * L, h / 2 + dy * L);
      var NS = 96, si;
      for (si = 0; si <= NS; si++) {
        var tau = si / NS;
        var ph = qm * ((2 * tau - 1) * L / SP) - (w1 - w2) * time;
        var dd = A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(ph);
        gr.addColorStop(tau, 'rgba(' + coolRGB + ',' +
          (0.115 * Math.pow(dd / peak, 1.5) * vis).toFixed(4) + ')');
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);

      for (var j = 0; j < N; j++) {
        var d = dots[j];
        var wx = (d.x - 0.5) * SC, wy = (d.y - 0.5) * SC * (h / Math.max(1, w));
        var c = Math.cos(dtheta(wx, wy, time));
        var dens = A1 * A1 + A2 * A2 + 2 * A1 * A2 * c;
        var jx = A1 * A1 * k1[0] + A2 * A2 * k2[0] + A1 * A2 * (k1[0] + k2[0]) * c;
        var jy = A1 * A1 * k1[1] + A2 * A2 * k2[1] + A1 * A2 * (k1[1] + k2[1]) * c;
        var den = Math.max(dens, 0.05);

        d.x += (jx / den) * dt * 0.055;
        d.y += (jy / den) * dt * 0.055 * (w / Math.max(1, h));
        if (d.x > 1.02) d.x -= 1.04; if (d.x < -0.02) d.x += 1.04;
        if (d.y > 1.02) d.y -= 1.04; if (d.y < -0.02) d.y += 1.04;

        var alpha = M.clamp(dens / peak, 0, 1);
        ctx.beginPath();
        ctx.fillStyle = d.warm ? warm : cool;
        ctx.globalAlpha = (0.05 + 0.55 * alpha * alpha) * vis;
        ctx.arc(d.x * w, d.y * h, d.size, 0, M.TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
  });
})(window.A = window.A || {});
