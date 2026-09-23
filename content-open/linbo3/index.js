/* The LiNbO3 lattice-anisotropy explainer.

   Ten scenes, pinned in order. Almost all of the page is geometry computed by
   src/engine/lattice.js and drawn by src/scenes/ln*.js; this module holds only
   the handful of words that appear over the figures, and the references.

   The text budget is a hard cap and build.mjs enforces it. Every string below
   is on screen, so adding one is a deliberate act. */

/* No prose panels anywhere: the scroll length of each stage comes from travel
   instead. `say` is the scene's caption; it sits in the top left corner of every
   stage, the one corner nothing else in the piece uses, so a caption can never
   land on a label. `labels` is whatever else that scene puts on screen. */
const stage = (scene, travel, say, labels) => ({
  t: 'stage',
  scene,
  travel,
  overlay: '<span class="ln-say">' + say + '</span>' + (labels || ''),
  panels: []
});

export default {
  title: 'Three bonds, one crystal',

  /* Scene 1 is a stage like the rest, so there is no separate hero. */
  hero: () => '',

  sections: [{
    id: 'lattice',
    label: 'lattice',
    bare: true,
    body: [
      /* 1. One pillar becomes a lattice. */
      stage('ln-pillar', 1.8,
        'Each pillar is a mechanical resonator standing on a substrate. Set a few ' +
        'hundred of them on a honeycomb and they behave as one two-dimensional ' +
        'crystal for sound.'),

      /* 2. One bond, and the coupling that lives on it. */
      stage('ln-bond', 1.4,
        'Neighbouring pillars trade energy through the substrate surface. How fast ' +
        'they trade it is the coupling $\\kappa$, measured in hertz. That one number ' +
        'is what the whole piece is about.',
        '<span class="ln-k ln-k--solo">$\\kappa$</span>'),

      /* 3. Three bond directions, all alike. */
      stage('ln-three', 1.3,
        'Every site has three neighbours, 120 degrees apart. On an ideal lattice the ' +
        'three bond directions are interchangeable, and nothing distinguishes one ' +
        'from another.'),

      /* 4. The three couplings close into a triangle, and a Dirac cone. */
      stage('ln-close', 1.9,
        'Treat the three couplings as lengths. When they close into a triangle the ' +
        'two bands touch at a point, and the cone beside it is what every ' +
        'topological acoustic device is built on.'),

      /* 5. The substrate underneath, and its directional rose. */
      stage('ln-substrate', 1.7,
        'The substrate is lithium niobate, cut at 128 degrees. It is trigonal and ' +
        'strongly anisotropic in plane: wave speed and electromechanical coupling ' +
        'both depend on direction. The rose is that dependence, and it turns with ' +
        'the crystal.',
        '<span class="ln-cut">128° Y-cut</span>'),

      /* 6. The same rose, sampled at the three bond angles. */
      stage('ln-disagree', 1.4,
        'Read the rose off at each bond angle and the three couplings no longer ' +
        'match: one direction over-coupled, two under-coupled. Nothing in the ' +
        'lattice did this. The crystal underneath did.',
        '<span class="ln-k ln-k--1">$\\kappa_1$</span>' +
        '<span class="ln-k ln-k--2">$\\kappa_2$</span>' +
        '<span class="ln-k ln-k--3">$\\kappa_3$</span>'),

      /* 7. The payload: one stick cannot reach, and the cone gaps out. */
      stage('ln-fail', 3.2,
        'Push the imbalance far enough and one coupling exceeds the other two ' +
        'together. Then no triangle closes: the two band-touching points slide ' +
        'along a zone edge, merge, and a gap opens, exactly twice the shortfall.'),

      /* 8. The whole field is wrong the same way everywhere, which is why it
            makes no pseudomagnetic field, and the open question. */
      stage('ln-scale', 1.6,
        'The same imbalance sits in every cell. A uniform imbalance is a constant ' +
        'vector potential, and a constant field has no curl, so it makes no ' +
        'pseudomagnetic field. It only corrupts the bands everything else is ' +
        'built on.',
        '<span class="ln-word">Uniform</span>' +
        '<span class="ln-eq">$\\nabla \\times \\mathbf{A} = 0$</span>' +
        '<span class="ln-note">Nobody has measured where 128YX sits.</span>'),

      /* 9. The field's fix, and the one nobody has tried. */
      stage('ln-fixes', 2.2,
        'Two ways out: change the crystal, or change the geometry.',
        '<span class="ln-cap ln-cap--l">152° cut: 66.5% better in-plane isotropy, ' +
        '37.0% better coupling.</span>' +
        '<span class="ln-cap ln-cap--r">Grade the pillars instead. Never tried.</span>'),

      /* 10. Coda: what an equalised lattice buys you. */
      stage('ln-coda', 2.0,
        'Equalise the bonds and the imbalance can be put back on purpose, varying ' +
        'across the lattice. Now it has a curl: a real pseudomagnetic field, ' +
        'Landau levels, and amplitude collecting on one sublattice.',
        '<span class="ln-num">1567 : 1</span>')
    ]
  }],

  colophon: () => `
<footer class="refs">
  <details>
    <summary>References</summary>

    <h3>Band structure and Dirac point merging</h3>
    <ul>
      <li>Wallace, <i>The Band Theory of Graphite</i> (1947)</li>
      <li>Pereira, Castro Neto &amp; Peres, <i>Tight-binding approach to uniaxial strain in graphene</i>, PRB 80, 045401 (2009)</li>
      <li>Montambaux et al., on the merging of Dirac points</li>
      <li>Vozmediano, Katsnelson &amp; Guinea, <i>Gauge fields in graphene</i>, Phys. Rep. (2010)</li>
    </ul>

    <h3>Pseudomagnetic fields from strain</h3>
    <ul>
      <li>Guinea, Katsnelson &amp; Geim, <i>Energy gaps and a zero-field quantum Hall effect in graphene by strain engineering</i>, Nat. Phys. (2010)</li>
      <li>Poli, Arkinstall &amp; Schomerus, <i>Degeneracy doubling and sublattice polarization in strain-induced pseudo-Landau levels</i>, PRB 90, 155418 (2014)</li>
    </ul>

    <h3>Classical-wave realisations</h3>
    <ul>
      <li>Rechtsman et al., <i>Strain-induced pseudomagnetic field and photonic Landau levels in dielectric structures</i>, Nat. Photonics (2013)</li>
      <li>Abbaszadeh et al., <i>Sonic Landau Levels and Synthetic Gauge Fields in Mechanical Metamaterials</i>, PRL (2017)</li>
      <li>Yang et al., <i>Strain-Induced Gauge Field and Landau Levels in Acoustic Structures</i>, PRL (2017)</li>
      <li>Brendel, Peano, Painter &amp; Marquardt, <i>Pseudomagnetic fields for sound at the nanoscale</i>, PNAS (2017)</li>
      <li>Wen et al., <i>Acoustic Landau quantization and quantum-Hall-like edge states</i>, Nat. Phys. (2019)</li>
      <li>Yan et al., <i>Pseudomagnetic Fields Enabled Manipulation of On-Chip Elastic Waves</i>, PRL 127, 136401 (2021)</li>
    </ul>

    <h3>Lithium niobate and the anisotropy problem</h3>
    <ul>
      <li>Wang, Zhang, Yu, Ge, Liu, Wu &amp; Chen, <i>Extended topological valley-locked surface acoustic waves</i>, Nat. Commun. 13, 1324 (2022)</li>
      <li>Zhao et al., <i>Topological acoustofluidics</i>, Nat. Mater. 24, 707&ndash;715 (2025)</li>
      <li>Friend group, <i>Optimized, omnidirectional surface acoustic wave source: 152&deg; Y-rotated cut of lithium niobate for acoustofluidics</i></li>
    </ul>

    <h3>On what this page does and does not claim</h3>
    <ul>
      <li>The threshold <i>&kappa;</i><sub>max</sub> = <i>&kappa;</i><sub>mid</sub> + <i>&kappa;</i><sub>min</sub> is exact for three nearest neighbours.</li>
      <li>The in-plane anisotropy of 128&deg; Y-cut lithium niobate is large and documented. The figure that roughly a factor of two separates surface displacement along X from along Y concerns the efficiency of generating a surface acoustic wave by direction. It is not the same quantity as the pillar-to-pillar coupling <i>&kappa;</i>.</li>
      <li>Where 128YX sits relative to the merging threshold has not been measured. It has to be extracted numerically. Nothing here claims the threshold is crossed.</li>
      <li>The anisotropy model in <code>src/engine/lattice.js</code> is a placeholder two-fold in-plane form, mirror-symmetric about X, which is the right symmetry class for a Y-rotated cut. It is not fitted to 128YX.</li>
    </ul>
  </details>
</footer>`
};
