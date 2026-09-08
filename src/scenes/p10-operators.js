/* Section 1.10: the Schrodinger equation read as an operator equation. The plane
   wave substituted into the free equation, the two identifications it motivates,
   the two dispersion relations set against each other, the Hamiltonian assembled
   by the Dirac substitution, the eigenvalue problem drawn honestly, and the
   general recipe together with the asymmetry it hides. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;
  var C = M.C;

  /* ------------------------------------------------------------------------
     Shared helpers. Every number these produce is evaluated from M.C on the
     page; nothing below is a transcribed result.
     --------------------------------------------------------------------- */

  var SUP = {
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³',
    '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  function sup(n) {
    var s = String(n), o = '', i;
    for (i = 0; i < s.length; i++) o += SUP[s.charAt(i)] || s.charAt(i);
    return o;
  }
  /* Scientific notation with a real superscript exponent. */
  function sci(v, d) {
    if (!isFinite(v) || v === 0) return '0';
    var e = Math.floor(Math.log(Math.abs(v)) / Math.LN10);
    var m = v / Math.pow(10, e);
    var dd = (d == null) ? 3 : d;
    if (Math.abs(m) >= 10 - 0.5 * Math.pow(10, -dd)) { m /= 10; e += 1; }
    return m.toFixed(dd) + ' × 10' + sup(e);
  }

  function card(parent, x, y, w, h, stroke) {
    var r = S.rect(x, y, w, h, 's-ghost');
    r.setAttribute('fill', 'var(--surface)');
    r.setAttribute('rx', '3');
    if (stroke) r.setAttribute('stroke', stroke);
    parent.appendChild(r);
    return r;
  }

  function put(parent, x, y, str, cls, anchor, size) {
    var t = S.text(x, y, str, cls, anchor);
    if (size) t.setAttribute('font-size', String(size));
    parent.appendChild(t);
    return t;
  }

  /* The worked anchor used throughout the section: an electron whose de Broglie
     wavelength is one angstrom. Everything downstream is computed from it. */
  function anchor() {
    var lam = 1e-10;
    var k = M.TAU / lam;
    var p = C.hbar * k;
    var E = C.hbar * C.hbar * k * k / (2 * C.me);
    return { lam: lam, k: k, p: p, E: E, eV: E / C.e, w: E / C.hbar };
  }

  /* ======================================================================
     1. Exercise 1.10.1 — does the plane wave solve the free equation?
     =================================================================== */

  A.scene('planewave-test', function (root) {
    var W = 1180, H = 740;
    var svg = S.root(W, H,
      'The plane wave substituted into the free Schrodinger equation. One time derivative ' +
      'brings down h-bar omega, two space derivatives bring down h-bar squared k squared ' +
      'over two m, and the two sides agree only when omega equals h-bar k squared over two m.');
    root.appendChild(svg);

    var a = anchor();
    /* What option (B) would demand at the same k, relative to the true energy. */
    var ratioB = (a.p * C.c) / a.E;

    var head = put(svg, W / 2, 46,
      'put  ψ(r,t) = A e^{i(k·r − ωt)}  into  iℏ ∂ψ/∂t = −(ℏ²/2m) ∇²ψ   with  V = 0',
      's-lbl-b', 'middle', 15);

    /* ---- left column: the time derivative ---- */
    var gL = S.g({});
    svg.appendChild(gL);
    put(gL, 70, 104, 'LEFT SIDE     iℏ ∂ψ/∂t', 's-lbl-w', 'start', 13);
    var Ltext = [
      '∂ψ/∂t = A · ∂/∂t e^{i(k·r − ωt)}',
      '      = (−iω) A e^{i(k·r − ωt)} = −iω ψ',
      'iℏ · (−iω) = −i²ℏω = +ℏω     because i² = −1'
    ];
    var Lrows = Ltext.map(function (s, i) {
      return put(gL, 70, 138 + i * 30, s, 's-lbl', 'start', 12);
    });
    var Lend = put(gL, 70, 234, 'iℏ ∂ψ/∂t  =  ℏω ψ(r,t)', 's-lbl-b', 'start', 14);

    /* ---- right column: the Laplacian ---- */
    var gR = S.g({});
    svg.appendChild(gR);
    put(gR, 620, 104, 'RIGHT SIDE     −(ℏ²/2m) ∇²ψ', 's-lbl-w', 'start', 13);
    var Rtext = [
      'each ∂/∂xⱼ pulls down i kⱼ, so ∇ψ = i k ψ',
      '∇²ψ = ∇·(i k ψ) = (i k)·(i k) ψ = −k² ψ',
      'k² here is k·k = |k|², a scalar, not a vector'
    ];
    var Rrows = Rtext.map(function (s, i) {
      return put(gR, 620, 138 + i * 30, s, 's-lbl', 'start', 12);
    });
    var Rend = put(gR, 620, 234, '−(ℏ²/2m)(−k²ψ)  =  +(ℏ²k²/2m) ψ(r,t)', 's-lbl-b', 'start', 14);

    var gapNote = put(svg, 620, 262,
      'the handout skips this line and drops the ψ on the right', 's-lbl-f', 'start', 11);

    /* ---- the middle: equate, divide, conclude ---- */
    var gM = S.g({});
    svg.appendChild(gM);
    put(gM, W / 2, 306, 'equate:    ℏω ψ(r,t)  =  (ℏ²k²/2m) ψ(r,t)', 's-lbl-q', 'middle', 14);
    put(gM, W / 2, 334,
      '|ψ| = |A|·|e^{i(k·r−ωt)}| = |A| ≠ 0 at every r and t, so ψ may be divided out',
      's-lbl', 'middle', 12);

    var gBox = S.g({});
    svg.appendChild(gBox);
    card(gBox, 340, 356, 500, 62, 'var(--quantum)');
    put(gBox, W / 2, 394, 'ℏω = ℏ²k²/2m        ω(k) = ℏk²/2m', 's-lbl-b', 'middle', 17);
    put(gBox, W / 2, 438,
      'A cancelled and the direction of k cancelled: the equation is linear and isotropic',
      's-lbl', 'middle', 12);

    /* ---- the four options ---- */
    var gO = S.g({});
    svg.appendChild(gO);
    put(gO, 70, 480, 'the four options offered', 's-lbl-q', 'start', 13);
    var opts = [
      ['(A)  ℏω = ℏ²k²/2m', 's-lbl-w',
        'exactly the condition just derived — this is the answer'],
      ['(B)  ℏω = pc', 's-lbl-f',
        'the photon relation: at λ = 1 Å it wants ℏω larger by pc/E = ' + ratioB.toFixed(1)],
      ['(C)  any relation between ω and k', 's-lbl-f',
        'no: double ω and the left side reads ' + (2 * a.eV).toFixed(1) +
        ' eV while the right still reads ' + a.eV.toFixed(1) + ' eV'],
      ['(D)  not at all', 's-lbl-f',
        'contradicted by (A), which satisfies the equation identically']
    ];
    var rows = opts.map(function (o, i) {
      var g = S.g({});
      gO.appendChild(g);
      put(g, 70, 512 + i * 32, o[0], o[1], 'start', 13);
      put(g, 470, 512 + i * 32, o[2], i === 0 ? 's-lbl-b' : 's-lbl', 'start', 12);
      return g;
    });

    /* ---- the numeric anchor ---- */
    var gN = S.g({});
    svg.appendChild(gN);
    put(gN, 70, 660,
      'anchor — electron at λ = 1 Å:   k = 2π/λ = ' + sci(a.k) + ' m⁻¹,   p = ℏk = ' +
      sci(a.p) + ' kg m/s', 's-lbl-q', 'start', 12);
    put(gN, 70, 686,
      'ℏω = ℏ²k²/2m = ' + sci(a.E) + ' J = ' + a.eV.toFixed(1) + ' eV,   so ω = ' +
      sci(a.w) + ' rad/s', 's-lbl-q', 'start', 12);

    var moral = put(svg, W / 2, 718,
      'the plane wave is a solution of the free equation only on the parabola ω = ℏk²/2m',
      's-lbl-b', 'middle', 13);

    return function (p) {
      S.op(head, M.beat(p, 0.00, 0.08));
      S.op(gL, M.beat(p, 0.06, 0.16));
      Lrows.forEach(function (r, i) { S.op(r, M.beat(p, 0.10 + i * 0.05, 0.20 + i * 0.05)); });
      S.op(Lend, M.beat(p, 0.26, 0.34));
      S.op(gR, M.beat(p, 0.18, 0.28));
      Rrows.forEach(function (r, i) { S.op(r, M.beat(p, 0.22 + i * 0.05, 0.32 + i * 0.05)); });
      S.op(Rend, M.beat(p, 0.38, 0.46));
      S.op(gapNote, M.beat(p, 0.44, 0.52));
      S.op(gM, M.beat(p, 0.48, 0.58));
      S.op(gBox, M.beat(p, 0.56, 0.66));
      S.op(gO, M.beat(p, 0.62, 0.70));
      rows.forEach(function (g, i) { S.op(g, M.beat(p, 0.66 + i * 0.045, 0.76 + i * 0.045)); });
      S.op(gN, M.beat(p, 0.84, 0.92));
      S.op(moral, M.beat(p, 0.90, 0.98));
    };
  });

  /* ======================================================================
     2. The two identifications, drawn as machines.
     =================================================================== */

  A.scene('operator-extraction', function (root, api) {
    var W = 1180, H = 700;
    var svg = S.root(W, H,
      'Two machines. The state goes in, the same state comes out, multiplied by a number: ' +
      'the time derivative returns the energy, the gradient returns the momentum.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var a = anchor();

    var head = put(svg, W / 2, 44,
      'the same two derivatives, read as machines that act on the state',
      's-lbl-b', 'middle', 15);

    /* One machine: input box, operator box, output box, with the same waveform
       drawn in the input and the output so "the same state" is literal. */
    function machine(yTop, opStr, opSub, outStr, outNum, tone) {
      var g = S.g({});
      svg.appendChild(g);
      var h = 130;
      card(g, 70, yTop, 250, h);
      card(g, 400, yTop, 210, h, tone === 'q' ? 'var(--quantum)' : 'var(--probability)');
      card(g, 690, yTop, 400, h, tone === 'q' ? 'var(--quantum)' : 'var(--probability)');

      put(g, 195, yTop - 10, 'the state goes in', 's-lbl', 'middle', 11);
      put(g, 890, yTop - 10, 'the same state comes out, times a number', 's-lbl', 'middle', 11);

      var wIn = S.path('', 's-wave');
      var wOut = S.path('', tone === 'q' ? 's-quantum' : 's-prob');
      g.appendChild(wIn); g.appendChild(wOut);

      put(g, 195, yTop + h - 16, 'ψ = A e^{i(k·r − ωt)}', 's-lbl-w', 'middle', 12);
      put(g, 505, yTop + 62, opStr, 's-lbl-b', 'middle', 20);
      put(g, 505, yTop + 96, opSub, 's-lbl', 'middle', 11);
      put(g, 890, yTop + 58, outStr, tone === 'q' ? 's-lbl-q' : 's-lbl-p', 'middle', 17);
      put(g, 890, yTop + h - 16, outNum, 's-lbl', 'middle', 12);

      g.appendChild(S.arrow(svg, 326, yTop + h / 2, 394, yTop + h / 2, 'm'));
      g.appendChild(S.arrow(svg, 616, yTop + h / 2, 684, yTop + h / 2, 'm'));
      return { g: g, wIn: wIn, wOut: wOut, y: yTop + h / 2 - 14 };
    }

    var mA = machine(130, 'iℏ ∂/∂t', 'differentiates the label t',
      'ℏω ψ  =  E ψ',
      'E = ' + a.eV.toFixed(1) + ' eV   (electron, λ = 1 Å)', 'q');
    var mB = machine(370, '−iℏ ∇', 'differentiates the argument r',
      'ℏk ψ  =  p ψ',
      'p = ' + sci(a.p) + ' kg m/s', 'p');

    var workA = put(svg, 70, 300,
      'iℏ ∂/∂t ( A e^{i(k·r−ωt)} ) = iℏ(−iω) A e^{i(k·r−ωt)} = ℏω ψ,   and  E = ℏω',
      's-lbl-q', 'start', 12);
    var workB = put(svg, 70, 540,
      '−iℏ ∇ ( A e^{i(k·r−ωt)} ) = −iℏ(i k) A e^{i(k·r−ωt)} = ℏk ψ,   and  p = ℏk',
      's-lbl-p', 'start', 12);

    var notes = [
      'same state out, multiplied by a number: that is the whole reason these operators are worth having',
      'but the first machine only works because this state has one single ω. for a superposition of energies',
      'iℏ ∂ψ/∂t = Ĥψ still holds and no single number E does — the two lines are not on the same footing'
    ].map(function (s, i) {
      return put(svg, 70, 588 + i * 26, s, i === 0 ? 's-lbl-b' : 's-lbl', 'start', 12);
    });

    var moral = put(svg, W / 2, 678,
      '−iℏ∇ acts inside the space of states; iℏ∂/∂t steps between one time and the next',
      's-lbl-b', 'middle', 13);

    return function (p, t) {
      var phase = api.reduced ? 1.2 : t * 1.6;
      function waveD(x0, x1, yc) {
        return S.polyD(S.sample(120, 0, 1, function (u) {
          return [M.lerp(x0, x1, u), yc - 22 * Math.cos(u * 4.4 * M.TAU - phase)];
        }));
      }
      S.setD(mA.wIn, waveD(92, 298, mA.y));
      S.setD(mA.wOut, waveD(712, 918, mA.y));
      S.setD(mB.wIn, waveD(92, 298, mB.y));
      S.setD(mB.wOut, waveD(712, 918, mB.y));

      S.op(head, M.beat(p, 0.00, 0.08));
      S.op(mA.g, M.beat(p, 0.06, 0.20));
      S.op(workA, M.beat(p, 0.20, 0.32));
      S.op(mB.g, M.beat(p, 0.30, 0.44));
      S.op(workB, M.beat(p, 0.44, 0.56));
      notes.forEach(function (n, i) { S.op(n, M.beat(p, 0.58 + i * 0.09, 0.70 + i * 0.09)); });
      S.op(moral, M.beat(p, 0.88, 0.97));
    };
  });

  /* ======================================================================
     3. Two dispersion relations, plotted together.
     =================================================================== */

  A.scene('dispersion-contrast', function (root) {
    var W = 1180, H = 720;
    var svg = S.root(W, H,
      'The Schrodinger dispersion relation is a parabola and the wave equation dispersion ' +
      'relation is a straight line. They meet only at the origin and at one isolated ' +
      'wavenumber, where the non-relativistic description has already failed.');
    root.appendChild(svg);

    /* Natural units for the comparison: the two curves cross at k = 2mc/hbar. */
    var kStar = 2 * C.me * C.c / C.hbar;
    var wStar = C.c * kStar;
    var lamStar = M.TAU / kStar;
    var lamC = C.h / (C.me * C.c);

    var x0 = 110, x1 = 690, yT = 80, yB = 520;
    var uMax = 1.6, yLo = -0.75, yHi = 1.9;
    var PX = function (u) { return M.map(u, 0, uMax, x0, x1); };
    var PY = function (v) { return M.map(v, yLo, yHi, yB, yT); };

    svg.appendChild(S.gridLines(x0, yT, x1, yB, 8, 6));
    svg.appendChild(S.line(x0, yT, x0, yB, 's-axis'));
    svg.appendChild(S.line(x0, PY(0), x1, PY(0), 's-axis'));
    put(svg, x1, PY(0) + 20, 'wavenumber  k / k*', 's-lbl', 'end', 11);
    put(svg, x0 - 8, yT - 8, 'ω / ω*', 's-lbl', 'end', 11);

    /* The region where the non-relativistic formula has already stopped meaning
       anything: v = hbar k / m = 2 c (k/k*), so v > c/2 once k/k* > 1/4. */
    var bad = S.rect(PX(0.25), yT, PX(uMax) - PX(0.25), yB - yT, null);
    bad.setAttribute('fill', 'var(--fail)');
    bad.setAttribute('opacity', '0.07');
    svg.appendChild(bad);
    var badLbl = put(svg, PX(0.28), yT + 18,
      'v > c/2 beyond here: the non-relativistic formula is already false',
      's-lbl-f', 'start', 11);

    var para = S.path('', 's-quantum');
    var lineP = S.path('', 's-wave');
    var lineM = S.path('', 's-wave');
    lineM.setAttribute('stroke-dasharray', '6 5');
    svg.appendChild(para); svg.appendChild(lineP); svg.appendChild(lineM);

    S.setD(para, S.polyD(S.sample(200, 0, uMax, function (u) {
      return [PX(u), PY(Math.min(yHi, u * u))];
    })));
    S.setD(lineP, S.polyD(S.sample(2, 0, uMax, function (u) {
      return [PX(u), PY(Math.min(yHi, u))];
    })));
    S.setD(lineM, S.polyD(S.sample(2, 0, 0.75, function (u) {
      return [PX(u), PY(-u)];
    })));

    var labP = put(svg, PX(1.24), PY(1.62), 'Schrödinger:  ℏω = ℏ²k²/2m', 's-lbl-q', 'end', 12);
    var labL = put(svg, PX(1.5), PY(1.62), 'wave equation:  ω = +ck', 's-lbl-w', 'start', 12);
    var labM = put(svg, PX(0.06), PY(-0.62),
      'and ω = −ck as well: second order in t keeps both roots', 's-lbl-w', 'start', 11);

    var cross = S.g({});
    svg.appendChild(cross);
    cross.appendChild(S.line(PX(1), yT, PX(1), yB, 's-axis s-dash'));
    cross.appendChild(S.circle(PX(1), PY(1), 5, 's-fill-i'));
    put(cross, PX(1) + 10, PY(1) - 12, 'the only crossing', 's-lbl-b', 'start', 11);

    /* Right-hand commentary. */
    var side = [
      ['in units of k* = 2mc/ℏ and ω* = ck*,', 's-lbl'],
      ['the parabola is (k/k*)² and the line is k/k*', 's-lbl'],
      ['so they meet only at k = 0 and k = k*', 's-lbl'],
      ['', 's-lbl'],
      ['k* = ' + sci(kStar) + ' m⁻¹', 's-lbl-b'],
      ['λ* = 2π/k* = ' + (lamStar * 1e12).toFixed(3) + ' pm', 's-lbl-b'],
      ['which is half the Compton wavelength,', 's-lbl'],
      ['λ_C = h/mc = ' + (lamC * 1e12).toFixed(3) + ' pm', 's-lbl'],
      ['and there v = ℏk*/m = 2c, so the crossing', 's-lbl-f'],
      ['is spurious: Schrödinger died long before it', 's-lbl-f'],
      ['', 's-lbl'],
      ['E = p²/2m    massive, non-relativistic', 's-lbl-q'],
      ['E = pc       massless, photon-like', 's-lbl-w'],
      ['one plane wave cannot satisfy both', 's-lbl-b'],
      ['', 's-lbl'],
      ['cos(k·r − ωt) solves the wave equation but', 's-lbl'],
      ['not this one: the left side is imaginary ×', 's-lbl'],
      ['sin, the right side is real × cos', 's-lbl']
    ].map(function (row, i) {
      return put(svg, 720, 118 + i * 24, row[0], row[1], 'start', 12);
    });

    /* Scroll-driven readout at a moving wavenumber. */
    var mark = S.line(0, yT, 0, yB, 's-axis s-dash');
    svg.appendChild(mark);
    var dotS = S.circle(0, 0, 4.5, 's-fill-q');
    var dotW = S.circle(0, 0, 4.5, 's-fill-w');
    svg.appendChild(dotS); svg.appendChild(dotW);

    var read1 = put(svg, 110, 570, '', 's-lbl-b', 'start', 13);
    var read2 = put(svg, 110, 598, '', 's-lbl', 'start', 12);
    var read3 = put(svg, 110, 624,
      'the phase velocity ω/k = ℏk/2m is half of that, which is why it is not the physical one',
      's-lbl', 'start', 12);

    var moral = put(svg, W / 2, 676,
      'one equation carries the Newtonian energy-momentum relation, the other the photon one',
      's-lbl-b', 'middle', 14);
    var moral2 = put(svg, W / 2, 702,
      'and because ω ∝ k² is not a straight line, free matter packets spread while light pulses do not',
      's-lbl', 'middle', 12);

    return function (p) {
      var u = M.lerp(0.08, 1.32, M.easeInOut(M.beat(p, 0.42, 0.94)));
      mark.setAttribute('x1', PX(u)); mark.setAttribute('x2', PX(u));
      dotS.setAttribute('cx', PX(u)); dotS.setAttribute('cy', PY(Math.min(yHi, u * u)));
      dotW.setAttribute('cx', PX(u)); dotW.setAttribute('cy', PY(Math.min(yHi, u)));

      var vg = 2 * C.c * u;                     /* dω/dk = hbar k / m = 2 c u */
      read1.textContent = 'at k = ' + u.toFixed(2) + ' k*:   parabola ω/ω* = ' +
        (u * u).toFixed(3) + ',   line ω/ω* = ' + u.toFixed(3) +
        ',   they differ by ×' + (1 / u).toFixed(2);
      read2.textContent = 'group velocity dω/dk = ℏk/m = ' + sci(vg) + ' m/s = ' +
        (vg / C.c).toFixed(3) + ' c';

      S.op(bad, M.beat(p, 0.60, 0.72) * 0.07);
      S.op(badLbl, M.beat(p, 0.60, 0.72));
      S.draw(para, M.easeOut(M.beat(p, 0.03, 0.30)));
      S.draw(lineP, M.easeOut(M.beat(p, 0.10, 0.34)));
      S.op(para, M.beat(p, 0.02, 0.10));
      S.op(lineP, M.beat(p, 0.08, 0.16));
      S.op(labP, M.beat(p, 0.14, 0.24));
      S.op(labL, M.beat(p, 0.18, 0.28));
      S.op(lineM, M.beat(p, 0.28, 0.38));
      S.op(labM, M.beat(p, 0.30, 0.40));
      side.forEach(function (s, i) { S.op(s, M.beat(p, 0.20 + i * 0.028, 0.32 + i * 0.028)); });
      S.op(cross, M.beat(p, 0.52, 0.62));
      S.op(mark, M.beat(p, 0.42, 0.50));
      S.op(dotS, M.beat(p, 0.42, 0.50));
      S.op(dotW, M.beat(p, 0.42, 0.50));
      S.op(read1, M.beat(p, 0.44, 0.54));
      S.op(read2, M.beat(p, 0.56, 0.66));
      S.op(read3, M.beat(p, 0.66, 0.76));
      S.op(moral, M.beat(p, 0.84, 0.93));
      S.op(moral2, M.beat(p, 0.90, 0.99));
    };
  });

  /* ======================================================================
     4. The Hamiltonian operator, assembled.
     =================================================================== */

  A.scene('hamiltonian-build', function (root) {
    var W = 1180, H = 760;
    var svg = S.root(W, H,
      'The Hamiltonian operator built from the classical Hamiltonian in two separate moves: ' +
      'promoting each symbol to an operator, then choosing the position representation in ' +
      'which those operators become derivatives and multiplications.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var a = anchor();
    var hbar2 = C.hbar * C.hbar;

    var head = put(svg, W / 2, 46,
      'the Hamiltonian operator, built from the classical one in two distinct moves',
      's-lbl-b', 'middle', 15);

    /* ---- stage 1: the classical object ---- */
    var g1 = S.g({});
    svg.appendChild(g1);
    card(g1, 310, 78, 560, 76, 'var(--wave)');
    put(g1, W / 2, 114, 'H(p, r, t)  =  p²/2m  +  V(r, t)', 's-lbl-w', 'middle', 18);
    put(g1, W / 2, 142, 'the classical Hamiltonian: a number, built out of numbers',
      's-lbl', 'middle', 11);

    /* ---- stage 2: promotion, with the hat drawn as it appears ---- */
    var g2 = S.g({});
    svg.appendChild(g2);
    put(g2, W / 2, 196, 'move one — promotion', 's-lbl-q', 'middle', 13);

    var hats = [];
    [['p', 'momentum', 70], ['r', 'position', 430], ['V', 'potential energy', 790]]
      .forEach(function (row) {
        var x = row[2];
        card(g2, x, 216, 320, 78);
        put(g2, x + 78, 266, row[0], 's-lbl-w', 'middle', 22);
        g2.appendChild(S.arrow(svg, x + 112, 258, x + 190, 258, 'm'));
        put(g2, x + 232, 266, row[0], 's-lbl-q', 'middle', 22);
        var caret = S.path('M' + (x + 222) + ' 240L' + (x + 232) + ' 231L' + (x + 242) + ' 240',
          's-quantum');
        caret.setAttribute('stroke-width', '2.2');
        g2.appendChild(caret);
        hats.push(caret);
        put(g2, x + 160, 286, row[1], 's-lbl', 'middle', 11);
      });

    var promNote = put(svg, W / 2, 316,
      'the Dirac substitution. an arrow, not an equals sign: it says what kind of object each symbol becomes',
      's-lbl', 'middle', 12);

    /* ---- stage 3: the position representation, now with equalities ---- */
    var g3 = S.g({});
    svg.appendChild(g3);
    put(g3, W / 2, 360, 'move two — choosing a representation', 's-lbl-q', 'middle', 13);
    var reps = [
      '( p̂ ψ )(r,t)  =  −iℏ ∇ψ(r,t)',
      '( r̂ ψ )(r,t)  =  r ψ(r,t)',
      '( V̂ ψ )(r,t)  =  V(r,t) ψ(r,t)        V is real, so V̂ is Hermitian'
    ].map(function (s, i) {
      return put(g3, 300, 392 + i * 28, s, 's-lbl-b', 'start', 13);
    });
    var repNote = put(svg, W / 2, 500,
      'equalities now, not arrows: −iℏ∇ is a formula valid in one representation, not the definition of momentum',
      's-lbl', 'middle', 12);

    /* ---- stage 4: square the momentum operator ---- */
    var g4 = S.g({});
    svg.appendChild(g4);
    put(g4, W / 2, 536, 'p̂² = (−iℏ∇)·(−iℏ∇) = (−iℏ)² ∇² = −ℏ² ∇²', 's-lbl-b', 'middle', 14);
    put(g4, W / 2, 562, '(−iℏ)² = i²ℏ² = −ℏ² = −' + sci(hbar2) + ' J² s²   —  the sign that ' +
      'turns −(ℏ²/2m)∇² into a positive kinetic energy', 's-lbl', 'middle', 11);

    /* ---- stage 5: the result ---- */
    var g5 = S.g({});
    svg.appendChild(g5);
    card(g5, 220, 588, 740, 92, 'var(--quantum)');
    put(g5, W / 2, 626, 'Ĥ  =  p̂²/2m + V̂  =  −(ℏ²/2m) ∇²  +  V(r, t)', 's-lbl-b', 'middle', 18);
    put(g5, W / 2, 660, 'iℏ ∂ψ/∂t  =  Ĥ ψ', 's-lbl-q', 'middle', 16);

    var check = put(svg, W / 2, 704,
      'check on the plane wave: Ĥψ = (ℏ²k²/2m) ψ, which for an electron at λ = 1 Å is ' +
      a.eV.toFixed(1) + ' eV times ψ', 's-lbl-q', 'middle', 12);
    var foot = put(svg, W / 2, 732,
      'one gap in the recipe: x̂p̂ ≠ p̂x̂, so a classical product x pₓ has no unique image — symmetrise it as (x̂p̂ + p̂x̂)/2',
      's-lbl', 'middle', 11);

    return function (p) {
      S.op(head, M.beat(p, 0.00, 0.07));
      S.op(g1, M.beat(p, 0.05, 0.16));
      S.op(g2, M.beat(p, 0.16, 0.26));
      hats.forEach(function (c, i) {
        S.draw(c, M.easeOut(M.beat(p, 0.22 + i * 0.05, 0.32 + i * 0.05)));
      });
      S.op(promNote, M.beat(p, 0.34, 0.43));
      S.op(g3, M.beat(p, 0.40, 0.48));
      reps.forEach(function (r, i) { S.op(r, M.beat(p, 0.43 + i * 0.05, 0.53 + i * 0.05)); });
      S.op(repNote, M.beat(p, 0.58, 0.66));
      S.op(g4, M.beat(p, 0.64, 0.73));
      S.op(g5, M.beat(p, 0.74, 0.84));
      S.op(check, M.beat(p, 0.84, 0.92));
      S.op(foot, M.beat(p, 0.90, 0.98));
    };
  });

  /* ======================================================================
     5. The eigenvalue reading, drawn honestly.
     =================================================================== */

  A.scene('eigenvalue-view', function (root) {
    var W = 1180, H = 760;
    var svg = S.root(W, H,
      'On the left a two by two matrix and the two directions it leaves unturned. On the ' +
      'right the same idea for functions: a cosine is an eigenfunction of the free ' +
      'Hamiltonian and a Gaussian is not. Below, why the time-dependent equation is not an ' +
      'eigenvalue equation at all.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var head = put(svg, W / 2, 42,
      'an eigenvalue problem: the operator hands back the same vector, times a number',
      's-lbl-b', 'middle', 15);

    /* ---------------- left: the finite-dimensional analogy ---------------- */
    var gL = S.g({});
    svg.appendChild(gL);
    put(gL, 60, 90, 'finite dimensions: a 2 × 2 matrix', 's-lbl-w', 'start', 13);

    var Mx = [[2, 1], [1, 2]];
    /* Eigenvalues from the characteristic polynomial, evaluated here. */
    var tr = Mx[0][0] + Mx[1][1];
    var det = Mx[0][0] * Mx[1][1] - Mx[0][1] * Mx[1][0];
    var disc = Math.sqrt(tr * tr - 4 * det);
    var lamP = (tr + disc) / 2, lamM = (tr - disc) / 2;

    var cx = 250, cy = 250, sc = 52;
    var QX = function (x) { return cx + x * sc; };
    var QY = function (y) { return cy - y * sc; };
    gL.appendChild(S.line(cx - 140, cy, cx + 140, cy, 's-axis'));
    gL.appendChild(S.line(cx, cy - 140, cx, cy + 140, 's-axis'));

    var ring = S.el('circle', { cx: cx, cy: cy, r: sc, class: 's-ghost' });
    gL.appendChild(ring);
    var img = S.path('', 's-ghost');
    img.setAttribute('stroke-dasharray', '4 4');
    gL.appendChild(img);
    S.setD(img, S.polyD(S.sample(180, 0, M.TAU, function (th) {
      var vx = Math.cos(th), vy = Math.sin(th);
      return [QX(Mx[0][0] * vx + Mx[0][1] * vy), QY(Mx[1][0] * vx + Mx[1][1] * vy)];
    })));

    /* The two invariant directions, drawn as guides. */
    [[1, 1], [1, -1]].forEach(function (d) {
      var n = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
      var l = S.line(QX(-2.4 * d[0] / n), QY(-2.4 * d[1] / n),
        QX(2.4 * d[0] / n), QY(2.4 * d[1] / n), 's-axis s-dash');
      l.setAttribute('stroke', 'var(--quantum)');
      l.setAttribute('stroke-opacity', '0.5');
      gL.appendChild(l);
    });

    var vIn = S.arrow(svg, cx, cy, cx, cy, 'w');
    var vOut = S.arrow(svg, cx, cy, cx, cy, 'p');
    gL.appendChild(vIn); gL.appendChild(vOut);
    var flag = put(gL, 0, 0, '', 's-lbl-q', 'start', 12);

    var lRead = [
      'M = [ 2  1 ; 1  2 ],  v a unit vector',
      'M v is parallel to v for only two v',
      'λ₊ = ' + lamP.toFixed(3) + '  along  (1, 1)/√2',
      'λ₋ = ' + lamM.toFixed(3) + '  along  (1, −1)/√2',
      ''
    ].map(function (s, i) {
      return put(gL, 60, 420 + i * 24, s, i > 1 ? 's-lbl-q' : 's-lbl', 'start', 12);
    });

    /* ---------------- right: the same question for functions --------------- */
    var gR = S.g({});
    svg.appendChild(gR);
    put(gR, 540, 90, 'infinite dimensions: Ĥ acting on a function', 's-lbl-p', 'start', 13);

    var xa = 540, xb = 1120;
    var pre = -C.hbar * C.hbar / (2 * C.me);

    /* Apply H-hat by central differences on the sampled function, so the output
       curve is measured off the input, not drawn from a known answer. */
    function applyH(fn, la, lb, n) {
      var i, xs = [], fs = [], hs = [];
      var dx = (lb - la) / n;
      for (i = 0; i <= n; i++) { xs.push(la + i * dx); fs.push(fn(la + i * dx)); }
      for (i = 0; i <= n; i++) {
        var xm = xs[i] - dx, xp = xs[i] + dx;
        var second = (fn(xp) - 2 * fs[i] + fn(xm)) / (dx * dx);
        hs.push(pre * second);
      }
      return { xs: xs, fs: fs, hs: hs };
    }

    function plotRow(yTop, yBot, label, fn, la, lb, verdictTone) {
      var g = S.g({});
      gR.appendChild(g);
      var mid = (yTop + yBot) / 2;
      g.appendChild(S.line(xa, mid, xb, mid, 's-axis'));
      put(g, 540, yTop - 12, label, 's-lbl-b', 'start', 12);

      var d = applyH(fn, la, lb, 400);
      var fMax = 0, hMax = 0, i;
      for (i = 0; i < d.fs.length; i++) {
        fMax = Math.max(fMax, Math.abs(d.fs[i]));
        hMax = Math.max(hMax, Math.abs(d.hs[i]));
      }
      var amp = (yBot - yTop) / 2 - 8;
      var pIn = S.path('', 's-wave');
      var pOut = S.path('', verdictTone === 'ok' ? 's-prob' : 's-fail');
      pOut.setAttribute('stroke-dasharray', '7 5');
      g.appendChild(pIn); g.appendChild(pOut);

      var ptsIn = [], ptsOut = [];
      for (i = 0; i < d.xs.length; i++) {
        var px = M.map(d.xs[i], la, lb, xa, xb);
        ptsIn.push([px, mid - (d.fs[i] / fMax) * amp]);
        ptsOut.push([px, mid - (d.hs[i] / hMax) * amp]);
      }
      S.setD(pIn, S.polyD(ptsIn));
      S.setD(pOut, S.polyD(ptsOut));

      /* The ratio Hf/f, sampled where f is comfortably away from zero. */
      var lo = Infinity, hi = -Infinity, nSamp = 0;
      for (i = 0; i < d.xs.length; i += 40) {
        if (Math.abs(d.fs[i]) < 0.25 * fMax) continue;
        var r = d.hs[i] / d.fs[i] / C.e;
        lo = Math.min(lo, r); hi = Math.max(hi, r);
        nSamp++;
      }
      return { g: g, lo: lo, hi: hi, n: nSamp, pIn: pIn, pOut: pOut };
    }

    var kEig = M.TAU / 1e-10;
    var row1 = plotRow(150, 260, 'φ = cos kx  (cyan)   and   Ĥφ  (dashed)',
      function (x) { return Math.cos(kEig * x); }, -1e-10, 1e-10, 'ok');
    var sig = 3e-11;
    var row2 = plotRow(360, 470, 'g = e^{−x²/2σ²}  (cyan)   and   Ĥg  (dashed)',
      function (x) { return Math.exp(-x * x / (2 * sig * sig)); }, -8e-11, 8e-11, 'bad');

    var r1a = put(gR, 540, 288,
      'measured Ĥφ/φ at ' + row1.n + ' sample points: every one of them ' +
      row1.lo.toFixed(1) + ' eV', 's-lbl-p', 'start', 12);
    var r1b = put(gR, 540, 310,
      'a constant, and the two curves lie on top of each other — φ is an eigenfunction',
      's-lbl-b', 'start', 12);

    var r2a = put(gR, 540, 498,
      'measured Ĥg/g runs from ' + row2.lo.toFixed(1) + ' eV to ' + row2.hi.toFixed(1) + ' eV',
      's-lbl-f', 'start', 12);
    var r2b = put(gR, 540, 520,
      'not a constant, and the shapes differ — g is not an eigenfunction of Ĥ',
      's-lbl-b', 'start', 12);

    var diff = put(gR, 540, 542,
      'what the matrix picture does not have: the vectors are functions, the operator is a ' +
      'derivative,', 's-lbl', 'start', 11);
    var diff2 = put(gR, 540, 562,
      'the space has no finite basis, and the spectrum here is continuous rather than a list',
      's-lbl', 'start', 11);

    /* ---------------- the honest caveat ---------------- */
    svg.appendChild(S.line(60, 592, 1120, 592, 's-axis'));
    var gC = S.g({});
    svg.appendChild(gC);
    put(gC, 60, 620, 'and one thing to be careful about', 's-lbl-q', 'start', 13);
    [
      'iℏ ∂ψ/∂t = Ĥψ is satisfied by every physical state, so it singles nothing out; it is not the',
      'eigenvalue equation. the eigenvalue equation is Ĥφ(r) = E φ(r) with E a number, and only',
      'special φ satisfy it. substituting E → iℏ∂/∂t into Eψ = Ĥψ gives that same equation back.'
    ].forEach(function (s, i) {
      put(gC, 60, 648 + i * 24, s, 's-lbl', 'start', 12);
    });

    /* A two-energy superposition: the spread computed two independent ways. */
    var E1 = 2.0, E2 = 5.0, wa = 0.3, wb = 0.7;
    var mean = wa * E1 + wb * E2;
    var mean2 = wa * E1 * E1 + wb * E2 * E2;
    var spread = Math.sqrt(mean2 - mean * mean);
    var spread2 = Math.sqrt(wa * wb) * Math.abs(E1 - E2);

    var gS = S.g({});
    svg.appendChild(gS);
    put(gS, 60, 724, 'superpose E₁ = ' + E1.toFixed(2) + ' eV and E₂ = ' + E2.toFixed(2) +
      ' eV with weights ' + wa.toFixed(2) + ' and ' + wb.toFixed(2) + ':   ⟨E⟩ = ' +
      mean.toFixed(3) + ' eV', 's-lbl-q', 'start', 12);
    put(gS, 60, 746, 'ΔE = √(⟨E²⟩ − ⟨E⟩²) = ' + spread.toFixed(3) + ' eV = √(ab)|E₁ − E₂| = ' +
      spread2.toFixed(3) + ' eV, so no single E exists', 's-lbl-q', 'start', 12);

    return function (p) {
      /* Sweep a unit vector and report the angle its image makes with it. */
      var th = M.lerp(0, Math.PI, M.easeInOut(M.beat(p, 0.10, 0.62)));
      var vx = Math.cos(th), vy = Math.sin(th);
      var ox = Mx[0][0] * vx + Mx[0][1] * vy;
      var oy = Mx[1][0] * vx + Mx[1][1] * vy;
      vIn.setAttribute('x2', QX(vx)); vIn.setAttribute('y2', QY(vy));
      vOut.setAttribute('x2', QX(ox)); vOut.setAttribute('y2', QY(oy));

      var dot = (vx * ox + vy * oy) / Math.sqrt(ox * ox + oy * oy);
      var ang = Math.acos(M.clamp(dot, -1, 1)) * 180 / Math.PI;
      var aligned = ang < 1.2;
      var lamNow = (vx * ox + vy * oy);      /* Rayleigh quotient, |v| = 1 */
      lRead[4].textContent = aligned
        ? 'parallel here: M v = ' + lamNow.toFixed(3) + ' v'
        : 'angle between v and M v = ' + ang.toFixed(1) + '°, so v is not an eigenvector';
      lRead[4].setAttribute('class', aligned ? 's-lbl-b' : 's-lbl-f');
      flag.setAttribute('x', QX(ox) + 8);
      flag.setAttribute('y', QY(oy) - 8);
      flag.textContent = aligned ? 'λ = ' + lamNow.toFixed(3) : '';
      S.op(flag, aligned ? 1 : 0);

      S.op(head, M.beat(p, 0.00, 0.06));
      S.op(gL, M.beat(p, 0.04, 0.14));
      lRead.forEach(function (l, i) { S.op(l, M.beat(p, 0.16 + i * 0.04, 0.26 + i * 0.04)); });
      S.op(gR, M.beat(p, 0.30, 0.40));
      S.op(row1.pOut, M.beat(p, 0.38, 0.48));
      S.op(r1a, M.beat(p, 0.44, 0.52));
      S.op(r1b, M.beat(p, 0.48, 0.56));
      S.op(row2.g, M.beat(p, 0.52, 0.60));
      S.op(r2a, M.beat(p, 0.58, 0.66));
      S.op(r2b, M.beat(p, 0.62, 0.70));
      S.op(diff, M.beat(p, 0.68, 0.76));
      S.op(diff2, M.beat(p, 0.71, 0.79));
      S.op(gC, M.beat(p, 0.76, 0.86));
      S.op(gS, M.beat(p, 0.88, 0.97));
    };
  });

  /* ======================================================================
     6. The general recipe, and the symbol it leaves out.
     =================================================================== */

  A.scene('recipe', function (root) {
    var W = 1180, H = 720;
    var svg = S.root(W, H,
      'The three-step recipe for building a Hamiltonian operator, followed by the reason ' +
      'time is treated as a label rather than an operator: the gradient acts inside the ' +
      'space of states at one instant, while the time derivative moves between instants.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* Hydrogen ground state from the constants, as a concrete lower bound. */
    var E1 = -C.me * Math.pow(C.e, 4) /
      (2 * Math.pow(4 * Math.PI * C.eps0, 2) * C.hbar * C.hbar);
    var E1eV = E1 / C.e;

    var head = put(svg, W / 2, 44,
      'the recipe, and the one symbol it deliberately leaves out', 's-lbl-b', 'middle', 15);

    var steps = [
      ['1', 'write the classical Hamiltonian', 'H(p, r, t) = p²/2m + V(r, t)'],
      ['2', 'add what has no classical counterpart', 'spin, for one'],
      ['3', 'promote the symbols to operators', 'p → p̂,    r → r̂']
    ];
    var boxes = steps.map(function (st, i) {
      var g = S.g({});
      svg.appendChild(g);
      var x = 70 + i * 355;
      card(g, x, 88, 330, 118, 'var(--wave)');
      put(g, x + 20, 116, st[0], 's-lbl-q', 'start', 16);
      put(g, x + 165, 148, st[1], 's-lbl', 'middle', 12);
      put(g, x + 165, 180, st[2], 's-lbl-b', 'middle', 13);
      if (i < 2) g.appendChild(S.arrow(svg, x + 334, 147, x + 421, 147, 'm'));
      return g;
    });

    var gRes = S.g({});
    svg.appendChild(gRes);
    card(gRes, 250, 240, 680, 88, 'var(--quantum)');
    put(gRes, W / 2, 282, 'iℏ ∂ψ/∂t  =  Ĥ ψ', 's-lbl-b', 'middle', 20);
    put(gRes, W / 2, 312, 'and the state is whatever solves it, once ψ is given at one time',
      's-lbl', 'middle', 11);

    var sym1 = put(svg, W / 2, 362,
      'step 3 has a gap: x̂p̂ ≠ p̂x̂, so a classical product like x pₓ has no unique image. symmetrise it, (x̂p̂ + p̂x̂)/2',
      's-lbl', 'middle', 12);
    var sym2 = put(svg, W / 2, 388,
      'the size of the gap is x̂p̂ − p̂x̂ = iℏ, and ℏ = ' + sci(C.hbar, 4) + ' J s is not zero',
      's-lbl', 'middle', 12);

    svg.appendChild(S.line(60, 418, 1120, 418, 's-axis'));

    /* ---- time as a label ---- */
    var gT = S.g({});
    svg.appendChild(gT);
    put(gT, 70, 448, 'time is a label, not an operator', 's-lbl-q', 'start', 13);
    put(gT, 70, 486, 'p̂ acts here, inside one frame', 's-lbl-p', 'start', 11);

    var frames = [];
    var rnd = M.rng(101011);
    [0, 1, 2].forEach(function (i) {
      var x = 90 + i * 160;
      var g = S.g({});
      gT.appendChild(g);
      card(g, x, 500, 140, 100, i === 1 ? 'var(--probability)' : null);
      var seed = 0.6 + rnd() * 0.8;
      var w = S.path('', 's-wave');
      g.appendChild(w);
      S.setD(w, S.polyD(S.sample(80, 0, 1, function (u) {
        return [M.lerp(x + 12, x + 128, u),
          550 - 26 * Math.exp(-Math.pow((u - 0.5) * 3.1, 2)) * Math.cos(u * 5.2 * M.TAU + i * seed)];
      })));
      put(g, x + 70, 620, 't' + ['₁', '₂', '₃'][i], 's-lbl-b', 'middle', 12);
      if (i < 2) g.appendChild(S.arrow(svg, x + 144, 550, x + 246, 550, 'q'));
      frames.push(g);
    });
    var inner = S.arrow(svg, 200, 512, 240, 512, 'p');
    gT.appendChild(inner);
    var evoLbl = put(gT, 90, 646,
      'evolution carries you along this row; the operators act within one box',
      's-lbl', 'start', 11);

    var side = [
      '−iℏ∇ differentiates the argument r of ψ, so it takes a',
      'state at one instant to another state at that instant.',
      '',
      'iℏ ∂/∂t differentiates the label t. it compares two',
      'different boxes, so it is not an operator on the space',
      'of states at all, and E → iℏ∂/∂t is not a quantisation',
      'rule on the same footing as p → −iℏ∇.',
      '',
      'nor is there a self-adjoint T̂ with [T̂, Ĥ] = iℏ, because',
      'Ĥ is bounded below — hydrogen bottoms out at ' + E1eV.toFixed(3) + ' eV.'
    ].map(function (s, i) {
      return put(svg, 620, 470 + i * 22, s, i > 7 ? 's-lbl-f' : 's-lbl', 'start', 12);
    });

    var moral = put(svg, W / 2, 700,
      'E → iℏ∂/∂t is a mnemonic, exact on states of a single frequency; p → −iℏ∇ is the real rule',
      's-lbl-b', 'middle', 13);

    return function (p) {
      S.op(head, M.beat(p, 0.00, 0.07));
      boxes.forEach(function (b, i) { S.op(b, M.beat(p, 0.05 + i * 0.09, 0.18 + i * 0.09)); });
      S.op(gRes, M.beat(p, 0.30, 0.40));
      S.op(sym1, M.beat(p, 0.40, 0.49));
      S.op(sym2, M.beat(p, 0.45, 0.54));
      S.op(gT, M.beat(p, 0.54, 0.62));
      frames.forEach(function (f, i) { S.op(f, M.beat(p, 0.56 + i * 0.05, 0.68 + i * 0.05)); });
      S.op(inner, M.beat(p, 0.70, 0.78));
      S.op(evoLbl, M.beat(p, 0.72, 0.80));
      side.forEach(function (s, i) { S.op(s, M.beat(p, 0.62 + i * 0.028, 0.74 + i * 0.028)); });
      S.op(moral, M.beat(p, 0.90, 0.98));
    };
  });
})(window.A = window.A || {});
