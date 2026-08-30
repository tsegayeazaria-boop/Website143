/* Hero: a phase-space field. Every dot is one classical particle in a harmonic
   well, plotted as (position, momentum). Newton's laws send each one around a
   closed ellipse forever, which is determinism drawn rather than asserted. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('hero-field', function (root, api) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    var N = 260;
    var rnd = M.rng(20260830);
    var pts = [];
    for (var i = 0; i < N; i++) {
      var r = 0.12 + Math.pow(rnd(), 0.62) * 0.88;
      pts.push({
        r: r,
        phase: rnd() * M.TAU,
        speed: 0.055 + rnd() * 0.05,
        ecc: 0.55 + rnd() * 0.5,
        size: 0.6 + rnd() * 1.5,
        warm: rnd() < 0.22
      });
    }

    return function (p, t) {
      var f = S.fitCanvas(cv, 2);
      var ctx = f.ctx, w = f.w, h = f.h;
      var cx = w * 0.5, cy = h * 0.5;
      var R = Math.min(w, h) * 0.46;
      var time = api.reduced ? 6 : t;

      ctx.clearRect(0, 0, w, h);

      /* Fade the field out as the reader leaves the hero. The generic inline
         progress ramp is wrong here: a full-viewport element sitting at the top
         of the document already reads as nearly complete, so use the scroll
         position against the hero's own height instead. */
      var scrolled = (window.scrollY || 0) / Math.max(1, h);
      var vis = 1 - M.smooth(M.clamp(scrolled * 1.15, 0, 1));
      if (vis <= 0.002) return;

      var cool = S.cssVar('--wave') || '#4FD6E3';
      var warm = S.cssVar('--quantum') || '#F2A65A';
      var ghost = S.cssVar('--hairline') || '#1C2731';

      /* A few orbits drawn as faint closed curves: the trajectories themselves. */
      ctx.save();
      ctx.globalAlpha = 0.5 * vis;
      ctx.strokeStyle = ghost;
      ctx.lineWidth = 1;
      for (var k = 1; k <= 5; k++) {
        var rr = (k / 5) * R;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rr, rr * 0.62, 0, 0, M.TAU);
        ctx.stroke();
      }
      ctx.restore();

      for (var j = 0; j < N; j++) {
        var q = pts[j];
        var a = q.phase + time * q.speed;
        var x = cx + Math.cos(a) * q.r * R;
        var y = cy + Math.sin(a) * q.r * R * 0.62 * q.ecc;
        var alpha = (0.16 + 0.5 * (1 - q.r)) * vis;
        ctx.beginPath();
        ctx.fillStyle = q.warm ? warm : cool;
        ctx.globalAlpha = alpha;
        ctx.arc(x, y, q.size, 0, M.TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
  });
})(window.A = window.A || {});
