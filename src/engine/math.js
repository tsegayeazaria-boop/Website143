/* Numerics shared by the scenes. Everything here is deterministic so the same
   scroll position always draws the same frame. */
(function (A) {
  'use strict';
  var M = A.math = {};

  M.TAU = Math.PI * 2;
  M.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  M.lerp = function (a, b, t) { return a + (b - a) * t; };
  M.inv = function (v, a, b) { return b === a ? 0 : (v - a) / (b - a); };
  M.map = function (v, a, b, c, d) { return M.lerp(c, d, M.clamp(M.inv(v, a, b), 0, 1)); };

  /* Sub-range of a 0..1 progress value, so one stage can stage several beats. */
  M.beat = function (p, a, b) { return M.clamp((p - a) / (b - a), 0, 1); };

  /* Easings. Slow in, slow out — the pacing this piece is built around. */
  M.easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  M.easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  M.easeIn = function (t) { return t * t * t; };
  M.smooth = function (t) { return t * t * (3 - 2 * t); };

  /* Deterministic PRNG (mulberry32) — reproducible speckle and electron hits. */
  M.rng = function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  M.sinc = function (x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; };

  /* Single-slit intensity, normalized to 1 on axis: I/I0 = sinc^2(pi a sinT / L) */
  M.singleSlit = function (sinT, aOverLambda) {
    return Math.pow(M.sinc(Math.PI * aOverLambda * sinT), 2);
  };
  /* Two slits of width a separated by d: fringes under the single-slit envelope. */
  M.doubleSlit = function (sinT, aOverLambda, dOverLambda) {
    return M.singleSlit(sinT, aOverLambda) *
           Math.pow(Math.cos(Math.PI * dOverLambda * sinT), 2);
  };

  /* Spectral densities in units where hbar = c = kB = 1; x = hbar w / kB T. */
  M.planckShape = function (x) {
    if (x <= 0) return 0;
    if (x > 700) return 0;
    var d = Math.exp(x) - 1;
    return d <= 0 ? 0 : (x * x * x) / d;
  };
  M.rayleighShape = function (x) { return x * x; };

  /* Wien: maximize x^3/(e^x - 1)  =>  3(1 - e^-x) = x. Newton from x0.
     Returns the iterate list so a scene can show the convergence, not assert it. */
  M.wienIterates = function (x0, n) {
    var out = [x0], x = x0, i;
    for (i = 0; i < n; i++) {
      var e = Math.exp(-x);
      var f = 3 * (1 - e) - x;
      var df = 3 * e - 1;
      x = x - f / df;
      out.push(x);
    }
    return out;
  };
  M.wienX = function () { return M.wienIterates(3, 12).pop(); };

  /* Approximate visible-spectrum colour for a wavelength in nm. Used for the
     spectrum bar so the colours are the physics, not a decorative gradient. */
  M.wavelengthRGB = function (nm) {
    var r = 0, g = 0, b = 0, a = 1;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    else { return 'rgba(120,134,143,0.35)'; }
    if (nm < 420) a = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700) a = 0.3 + 0.7 * (780 - nm) / 80;
    var f = function (c) { return Math.round(255 * Math.pow(Math.max(0, Math.min(1, c)) * a, 0.8)); };
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  };

  /* Cyclic hue for arg(psi). Distinct in both themes, no muddy midpoints. */
  M.phaseColor = function (phi, alpha) {
    var h = ((phi / M.TAU) % 1 + 1) % 1 * 360;
    return 'hsla(' + h.toFixed(1) + ', 72%, 62%, ' + (alpha == null ? 1 : alpha) + ')';
  };

  /* Physical constants, SI, for the worked exercises. */
  M.C = {
    h: 6.62607015e-34, hbar: 1.054571817e-34, c: 2.99792458e8,
    kB: 1.380649e-23, e: 1.602176634e-19, me: 9.1093837015e-31,
    eps0: 8.8541878128e-12, a0: 5.29177210903e-11, alpha: 7.2973525693e-3
  };
})(window.A = window.A || {});
