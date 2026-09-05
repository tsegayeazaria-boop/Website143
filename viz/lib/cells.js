/* ============================================================================
   viz/lib/cells.js — a grid of cells, each holding a number.

   Small, and it does one thing: show a table of inner products in which every
   cell is dark except the diagonal. That is the whole of orthogonality, and it
   is the picture that makes an infinite sum collapsing to a single term look
   inevitable rather than magical.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.svg, V = A.viz;

  V.cells = function (root, opts) {
    opts = opts || {};
    var W = opts.w || V.W, H = opts.h || V.H;
    var svg = V.frame(root, opts.label || 'A table of values.', W, H);
    var cols = opts.cols || 6, rows = opts.rows || 1;
    var padL = opts.padL == null ? 30 : opts.padL;
    var padT = opts.padT == null ? 26 : opts.padT;
    var padR = 10, padB = 22;
    var cw = (W - padL - padR) / cols, ch = (H - padT - padB) / rows;

    var gCell = S.g({}); svg.appendChild(gCell);
    var gEdge = S.g({}); svg.appendChild(gEdge);
    var gText = S.g({}); svg.appendChild(gText);

    var boxes = V.pool(gCell, function () { return S.rect(0, 0, 0, 0, 's-shade'); });
    var edges = V.pool(gEdge, function () { return S.rect(0, 0, 0, 0, 's-ghost'); });
    var texts = V.pool(gText, function () { return S.text(0, 0, '', 's-lbl', 'middle'); });

    function set(st) {
      st = st || {};
      (st.cells || []).forEach(function (c) {
        var x = padL + c.col * cw, y = padT + (c.row || 0) * ch;
        var box = boxes.use('c' + c.key);
        box.setAttribute('class', V.fillClass(c.tone) + ' s-shade');
        box.setAttribute('x', (x + 1.5).toFixed(2)); box.setAttribute('y', (y + 1.5).toFixed(2));
        box.setAttribute('width', (cw - 3).toFixed(2)); box.setAttribute('height', (ch - 3).toFixed(2));
        S.op(box, (c.fill == null ? 0 : c.fill) * (c._in == null ? 1 : c._in));
        var ed = edges.use('e' + c.key);
        ed.setAttribute('x', (x + 1.5).toFixed(2)); ed.setAttribute('y', (y + 1.5).toFixed(2));
        ed.setAttribute('width', (cw - 3).toFixed(2)); ed.setAttribute('height', (ch - 3).toFixed(2));
        S.op(ed, (c.edge == null ? 1 : c.edge) * (c._in == null ? 1 : c._in));
        var t = texts.use('v' + c.key);
        t.setAttribute('class', V.labelClass(c.tone));
        t.setAttribute('x', (x + cw / 2).toFixed(2));
        t.setAttribute('y', (y + ch / 2 + 4).toFixed(2));
        if (t.textContent !== c.text) t.textContent = c.text == null ? '' : c.text;
        S.op(t, (c.op == null ? 1 : c.op) * (c._in == null ? 1 : c._in));
      });
      boxes.sweep(); edges.sweep();

      (st.notes || []).forEach(function (n) {
        var t = texts.use('n' + n.key);
        t.setAttribute('class', V.labelClass(n.tone));
        t.setAttribute('text-anchor', n.anchor || 'middle');
        t.setAttribute('x', (n.px != null ? n.px : padL + (n.col + 0.5) * cw).toFixed(2));
        t.setAttribute('y', (n.py != null ? n.py : padT + (n.row + 0.5) * ch + 4).toFixed(2));
        if (t.textContent !== n.text) t.textContent = n.text;
        S.op(t, (n.op == null ? 1 : n.op) * (n._in == null ? 1 : n._in));
      });
      texts.sweep();
    }
    return { svg: svg, set: set, cw: cw, ch: ch, padL: padL, padT: padT };
  };
})(window.A = window.A || {});
