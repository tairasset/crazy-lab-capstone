import * as THREE from './vendor/three.module.js';

const kit = {
  frame: 0x303e47, steel: 0x748284, pale: 0xc2d0c3, rock: 0x625b66,
  mineral: 0xd9ad5c, plate: 0xb65027, clean: 0xef9462, slag: 0x493a42,
};
const standard = (color, options) => new THREE.MeshStandardMaterial({ color, roughness: .68, ...options });
const glow = color => new THREE.MeshBasicMaterial({ color });
const grainGeometry = new THREE.IcosahedronGeometry(1, 0);
const bubbleGeometry = new THREE.SphereGeometry(1, 9, 6);
const showFrom = (mesh, progress, threshold) => { mesh.visible = progress >= threshold; };
const fraction = (start, end, amount) => THREE.MathUtils.clamp((amount - start) / (end - start), 0, 1);

function particles(parent, shape, material, count) {
  return Array.from({ length: count }, () => {
    const mesh = new THREE.Mesh(shape, material);
    mesh.visible = false;
    parent.add(mesh);
    return mesh;
  });
}

function splitter(machine, box, frame, steel, pale) {
  const water = standard(0x35726e);
  const mineral = standard(kit.mineral);
  const rock = standard(kit.rock);
  const bubbleInk = new THREE.MeshBasicMaterial({ color: 0xa8ede1, transparent: true, opacity: .75, wireframe: true });
  box(machine, steel, -.49, .88, 0, .19, 1.25, 1.46);
  box(machine, water, -.15, .86, -.11, .53, .88, 1.06);
  box(machine, frame, .02, .39, -.10, .78, .14, 1.17);
  for (const z of [-.67, .45]) box(machine, frame, .33, .86, z, .18, .91, .086);
  box(machine, pale, .30, 1.31, -.10, .12, .054, 1.17);
  box(machine, frame, .34, .39, .61, .60, .10, .32);
  const topJaw = box(machine, pale, .13, 1.52, .54, .51, .12, .40);
  box(machine, steel, .11, 1.32, .54, .53, .12, .40);
  box(machine, steel, .55, .45, -.52, .45, .07, .44);
  box(machine, frame, .74, .53, -.52, .06, .14, .46);
  const feed = particles(machine, grainGeometry, rock, 5);
  const rising = particles(machine, bubbleGeometry, bubbleInk, 7);
  const riding = particles(machine, grainGeometry, mineral, 7);
  const sinking = particles(machine, grainGeometry, rock, 5);
  const pile = particles(machine, grainGeometry, mineral, 8);
  return (time, progress, running) => {
    topJaw.position.y = 1.52 - (running && progress < .29 ? Math.sin(progress * Math.PI * 23) ** 2 * .13 : 0);
    feed.forEach((piece, i) => {
      const travel = fraction(i * .026, .22 + i * .023, progress);
      piece.visible = running && travel < 1;
      piece.position.set(.278 + .035 * (i % 2), 1.68 - travel * .56, .43 + (i % 3) * .105 - travel * .15);
      piece.scale.setScalar(.094 - travel * .055);
      piece.rotation.y = i + progress * 3;
    });
    rising.forEach((bubble, i) => {
      const lift = (progress * 3.15 + i * .147) % 1;
      bubble.visible = riding[i].visible = running && progress > .15 && progress < .86;
      bubble.position.set(.39 + (i % 2) * .026, .50 + lift * .76, -.56 + (i % 6) * .176);
      bubble.scale.setScalar(.056 + lift * .026);
      riding[i].position.copy(bubble.position);
      riding[i].position.y += .072;
      riding[i].scale.setScalar(.051);
    });
    sinking.forEach((piece, i) => {
      const fall = fraction(.23 + i * .035, .61 + i * .042, progress);
      showFrom(piece, progress, .23 + i * .035);
      piece.position.set(.41, 1.13 - fall * .67, .31 - i * .125);
      piece.scale.setScalar(.072);
    });
    pile.forEach((piece, i) => {
      const sorting = fraction(.60 + i * .02, .77 + i * .021, progress);
      showFrom(piece, progress, .60 + i * .02);
      piece.position.set(.50 + sorting * (.05 + i % 2 * .12), 1.24 - sorting * (.71 - i % 3 * .035),
        -.42 - sorting * (.23 - i % 4 * .079));
      piece.scale.setScalar(.078);
    });
  };
}

function furnace(machine, box, frame, steel, pale) {
  const chamber = standard(0x5b2521, { emissive: 0xe04011, emissiveIntensity: .39 });
  const hot = glow(0xffa236);
  box(machine, frame, -.26, .94, -.05, .92, 1.27, 1.43);
  box(machine, chamber, .22, .95, -.04, .085, .75, .90);
  for (const z of [-.54, .47]) box(machine, steel, .33, .95, z, .23, .94, .09);
  for (const y of [.52, 1.39]) box(machine, steel, .33, y, -.035, .23, .09, 1.10);
  box(machine, pale, -.26, 1.79, -.42, .34, .55, .35);
  box(machine, steel, -.26, 2.09, -.42, .43, .09, .44);
  box(machine, steel, .24, 1.49, .56, .56, .10, .32);
  box(machine, frame, .58, .40, -.40, .45, .09, .53);
  for (const z of [-.68, -.12]) box(machine, steel, .60, .47, z, .46, .10, .057);
  const channel = box(machine, hot, .49, .61, -.22, .38, .045, .10);
  channel.rotation.set(.52, -.25, .12);
  const cast = standard(kit.plate, { emissive: 0xe75113 });
  const slab = box(machine, cast, .60, .47, -.42, .36, .10, .46);
  const layer = particles(machine, grainGeometry, glow(0xffcf70), 7);
  const feed = particles(machine, grainGeometry, standard(kit.mineral), 6);
  return (time, progress, running, reduced) => {
    const heat = fraction(.13, .42, progress);
    chamber.emissiveIntensity = .26 + (running ? heat * 3.1 : 0);
    channel.visible = running && progress > .48 && progress < .92;
    channel.scale.x = .12 + .26 * fraction(.48, .72, progress);
    showFrom(slab, progress, .54);
    slab.scale.z = .06 + fraction(.54, .90, progress) * .40;
    cast.emissiveIntensity = running ? 1.35 * (1 - fraction(.76, 1, progress)) : .12;
    layer.forEach((spark, i) => {
      const wave = reduced ? .5 : .5 + .5 * Math.sin(time * 10 + i * 2.4);
      spark.visible = running && heat > .35;
      spark.position.set(.289, .62 + (i % 3) * .16 + wave * .05, -.37 + i * .112);
      spark.scale.setScalar(.037 + wave * .043);
    });
    feed.forEach((piece, i) => {
      const travel = fraction(i * .033, .30 + i * .021, progress);
      piece.visible = running && travel < 1;
      piece.position.set(.33, 1.65 - travel * .87, .54 - travel * .41 + (i % 2) * .095);
      piece.scale.setScalar(.060 * (1 - travel * .42));
    });
  };
}

function refinery(machine, box, frame, steel, pale) {
  const liquid = standard(0x466e84);
  const glass = new THREE.MeshBasicMaterial({ color: 0x8ee5f2, transparent: true, opacity: .17, depthWrite: false });
  const dirty = standard(kit.plate, { metalness: .40 });
  const clean = standard(kit.clean, { metalness: .42, emissive: 0xa04022, emissiveIntensity: .28 });
  const wire = standard(0xa6773e, { emissive: 0xffbd61, emissiveIntensity: .08 });
  box(machine, steel, -.5, .90, 0, .19, 1.24, 1.46);
  box(machine, liquid, -.12, .84, 0, .64, .82, 1.37);
  box(machine, glass, .68, .86, 0, .025, .88, 1.39);
  box(machine, frame, .15, .39, 0, 1.09, .13, 1.57);
  for (const z of [-.73, .73]) box(machine, steel, .22, .87, z, .95, .95, .093);
  box(machine, pale, .43, 1.34, 0, .18, .075, 1.56);
  box(machine, frame, .01, 1.61, .03, .52, .25, .50);
  box(machine, wire, .36, 1.52, 0, .076, .07, 1.22);
  for (const z of [-.41, .41]) box(machine, wire, .42, 1.41, z, .12, .22, .08);
  const anode = box(machine, dirty, .38, .91, .41, .15, .68, .35);
  box(machine, pale, .36, .91, -.41, .115, .68, .34);
  const coating = box(machine, clean, .43, .91, -.41, .065, .69, .37);
  coating.name = 'Clean copper growing on the collector';
  const ions = particles(machine, grainGeometry, glow(0xffbc82), 11);
  const residue = particles(machine, grainGeometry, standard(kit.slag), 4);
  return (time, progress, running) => {
    const transfer = fraction(.12, .91, progress);
    anode.scale.set(.15 - transfer * .085, .68, .35 - transfer * .108);
    coating.visible = transfer > .08;
    coating.scale.set(.025 + transfer * .085, .69 * transfer, .37 * transfer);
    wire.emissiveIntensity = running ? .95 : .08;
    ions.forEach((ion, i) => {
      const crossing = (progress * 3.4 + i * .105) % 1;
      ion.visible = running && progress > .07 && progress < .94;
      ion.position.set(.51 + (i % 2) * .04, .61 + (i % 5) * .126, .34 - crossing * .70);
      ion.scale.setScalar(.034 + (1 - crossing) * .016);
    });
    residue.forEach((grain, i) => {
      const fall = fraction(.22 + i * .08, .47 + i * .08, progress);
      showFrom(grain, progress, .22 + i * .08);
      grain.position.set(.47, .86 - fall * .37, .26 + i * .108);
      grain.scale.setScalar(.058);
    });
  };
}

export function buildQuarryStation(kind, machine, box) {
  const frame = standard(kit.frame, { metalness: .36 });
  const steel = standard(kit.steel, { metalness: .45 });
  const pale = standard(kit.pale);
  box(machine, frame, 0, .12, 0, 1.70, .22, 1.65);
  box(machine, steel, -.04, .27, 0, 1.48, .13, 1.49);
  return { concentrate: splitter, smelt: furnace, refine: refinery }[kind](machine, box, frame, steel, pale);
}
