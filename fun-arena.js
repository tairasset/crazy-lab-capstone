import * as THREE from './vendor/three.module.js';
import { box, glow, material, mesh, panel, tube } from './models.js';

const gateZ = -5.7;
const gateCenters = [-6.1, 6.1];

export const FUN_ARENA_ENTRIES = gateCenters.map((x) => ({ x, z: -6.2 }));
export const FUN_ARENA_BOUNDS = { minX: -9.55, maxX: 9.55, minZ: -8.2, maxZ: 8.15 };

export function createFunArena(parent, reducedMotion) {
  const group = new THREE.Group();
  group.visible = false;
  parent.add(group);

  const concrete = material(0x44545c);
  const shell = material(0xc0c6bf);
  const beam = material(0x50646c, { metalness: .25 });
  const iron = material(0x829591, { metalness: .28 });
  const copper = material(0xc58a61, { metalness: .36 });
  const bronze = material(0x9c6849, { metalness: .33 });
  const paint = material(0xbb6d42);
  const amber = glow(0xffdbaf);
  const ice = glow(0xc1e7e6);
  const dark = material(0x27393e);
  const step = material(0x546c73, { metalness: .27 });
  const wallBase = material(0x7e9c9b);
  const ceiling = material(0xc3c9c4, { emissive: 0x526f70, emissiveIntensity: .36 });
  const observationGlass = material(0x8ebdc4, { roughness: .4, metalness: .13 });
  const glazingHighlight = material(0xadd1d2, { roughness: .5 });

  const floorDepth = 17.1;
  const floorCenter = -.04;
  const tileDepth = floorDepth / 9;
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1.977, .03, tileDepth - .02), material(0xffffff), 90);
  const stamp = new THREE.Object3D();
  const tint = new THREE.Color();
  for (let i = 0; i < 90; i += 1) {
    const row = Math.floor(i / 10);
    const column = i % 10;
    stamp.position.set(column * 2 - 9, -.027, floorCenter + (row - 4) * tileDepth);
    stamp.updateMatrix();
    tiles.setMatrixAt(i, stamp.matrix);
    tiles.setColorAt(i, tint.setHex([0x7a8f93, 0x809596, 0x859797, 0x748b8d][(row * 7 + column * 11) % 4]));
  }
  group.add(tiles);

  const roomFixtures = new Map();
  function staticBox(size, surface, x, y, z) {
    stamp.position.set(x, y, z);
    stamp.scale.set(...size);
    stamp.updateMatrix();
    if (!roomFixtures.has(surface)) roomFixtures.set(surface, []);
    roomFixtures.get(surface).push(stamp.matrix.clone());
  }
  staticBox([20.2, .17, floorDepth], concrete, 0, -.12, floorCenter);

  staticBox([20.2, 5.6, .30], shell, 0, 2.78, -8.59);
  staticBox([20.2, 5.6, .30], shell, 0, 2.78, 8.66);
  staticBox([20.2, .12, floorDepth], ceiling, 0, 5.59, floorCenter);
  for (const z of [-8.42, 8.49]) {
    staticBox([19.97, 2.14, .10], wallBase, 0, 1.05, z);
    staticBox([19.97, .075, .14], copper, 0, 2.15, z);
  }
  for (const x of [-2.25, 0, 2.25]) {
    staticBox([2.19, 1.64, .12], beam, x, 3.15, -8.33);
    staticBox([2.04, 1.48, .094], observationGlass, x, 3.15, -8.23);
    staticBox([1.92, .055, .012], glazingHighlight, x, 3.68, -8.178);
    staticBox([1.92, .025, .012], glazingHighlight, x, 3.57, -8.178);
  }
  for (const side of [-1, 1]) {
    staticBox([.27, 5.6, floorDepth], shell, side * 10.02, 2.78, floorCenter);
    staticBox([.13, 2.12, floorDepth], wallBase, side * 9.87, 1.05, floorCenter);
    staticBox([.29, .23, floorDepth], beam, side * 9.85, .12, floorCenter);
    staticBox([.17, .075, floorDepth], copper, side * 9.83, 2.13, floorCenter);
    for (const z of [-7.45, -3.75, -.05, 3.65, 7.4]) {
      staticBox([.35, 4.7, .32], beam, side * 9.73, 2.34, z);
      staticBox([.15, .78, .085], ice, side * 9.52, 3.12, z);
      staticBox([.075, .055, .43], copper, side * 9.52, .76, z);
    }
  }

  staticBox([20.05, .29, .55], beam, 0, 4.8, -4.5);
  staticBox([20.05, .24, .50], beam, 0, 4.8, 1.9);
  for (const x of [-6.1, 0, 6.1]) {
    staticBox([3.78, .06, .34], iron, x, 4.62, -4.50);
    staticBox([3.55, .031, .24], amber, x, 4.58, -4.5);
    staticBox([3.78, .06, .34], iron, x, 4.64, 1.9);
    staticBox([3.55, .031, .24], ice, x, 4.60, 1.9);
  }

  const siren = new THREE.Group();
  siren.name = 'Alarm siren';
  siren.position.set(0, 4.05, -4.3);
  group.add(siren);
  box(siren, [.23, .44, .33], beam, 0, .56, -.19);
  box(siren, [1.22, .83, .28], iron, 0, .02, -.06);
  const sirenLens = new THREE.MeshBasicMaterial({ color: 0x7c342e });
  box(siren, [.21, .59, .24], sirenLens, -.41, .035, .158);
  box(siren, [.21, .59, .24], sirenLens, .41, .035, .158);
  box(siren, [.50, .60, .22], dark, 0, .035, .145);
  for (const y of [-.14, -.02, .10, .22]) box(siren, [.38, .043, .039], iron, 0, y, .267);
  const splitLens = new THREE.Group();
  const splitInk = new THREE.MeshBasicMaterial({ color: 0x170e0d });
  const splitPoints = [[.38, .29], [.45, .16], [.39, .08], [.46, -.04], [.40, -.19]];
  for (let i = 1; i < splitPoints.length; i++) {
    const [x, y] = splitPoints[i - 1];
    const [endX, endY] = splitPoints[i];
    const cut = box(splitLens, [Math.hypot(endX - x, endY - y), .027, .012], splitInk,
      (x + endX) / 2, (y + endY) / 2, .284);
    cut.rotation.z = Math.atan2(endY - y, endX - x);
  }
  siren.add(splitLens);
  const sirenSign = panel(siren, 1.21, .30, 0, -.54, .265);
  const sirenTarget = box(siren, [1.36, 1.22, .57], new THREE.MeshBasicMaterial({ visible: false }), 0, -.12, 0);
  const sirenLight = new THREE.PointLight(0xff4730, 0, 3.5);
  sirenLight.position.set(0, -.12, .42);
  siren.add(sirenLight);
  let sirenActive = false;
  let sirenBroken = false;
  let alarmTime = 0;

  function setSiren(active) {
    sirenActive = Boolean(active) && !sirenBroken;
    splitLens.visible = sirenBroken;
    sirenLens.color.setHex(sirenBroken ? 0x403a38 : sirenActive ? 0xff4d39 : 0x7c342e);
    sirenLight.intensity = sirenActive ? 5 : 0;
    sirenSign.draw(sirenBroken ? 'SIREN OFF' : 'SIREN', '', sirenActive ? '#fff1db' : '#d2e5dc',
      sirenActive ? '#783428' : '#21332e');
  }

  function hitSiren(ray) {
    if (!sirenActive) return undefined;
    sirenTarget.updateWorldMatrix(true, false);
    return ray.intersectObject(sirenTarget, false)[0];
  }

  function disableSiren() {
    if (!sirenActive) return false;
    sirenBroken = true;
    siren.rotation.z = -.14;
    setSiren(false);
    return true;
  }

  for (const x of [-8.8, -3.2, 0, 3.2, 8.8]) {
    staticBox([.26, 5.2, .27], beam, x, 2.59, -8.35);
    staticBox([.46, .19, .44], iron, x, .12, -8.31);
  }
  for (const y of [1.35, 2.36, 4.35]) {
    staticBox([19.9, .11, .22], beam, 0, y, -8.31);
  }
  for (const side of [-1, 1]) {
    tube(group, [[side * 9.72, 4.09, 6.9], [side * 9.72, 4.09, 1.5], [side * 9.72, 4.09, -4.4],
      [side * 9.53, 4.09, -7.97], [side * 8.75, 4.09, -8.17], [side * 4.6, 4.09, -8.17]], .085, bronze);
    tube(group, [[side * 9.72, 3.78, 5.3], [side * 9.72, 3.78, -.75], [side * 9.72, 3.78, -5.25],
      [side * 9.53, 3.78, -7.97], [side * 8.75, 3.78, -8.16], [side * 5.2, 3.78, -8.16]], .061, copper);
  }

  // Painted walkways distinguish the room's side aisles from the center bench.
  for (const x of [-4.74, 4.74]) {
    staticBox([.072, .009, 8.7], paint, x, -.005, -1.23);
    for (const z of [-4.65, -2.85, -1.05, .75, 2.55]) {
      staticBox([.23, .009, .036], paint, x * 1.043, -.005, z);
    }
  }
  staticBox([9.55, .009, .072], paint, 0, -.005, 3.17);

  const fixtureShape = new THREE.BoxGeometry();
  for (const [surface, transforms] of roomFixtures) {
    const fixtures = new THREE.InstancedMesh(fixtureShape, surface, transforms.length);
    transforms.forEach((transform, index) => fixtures.setMatrixAt(index, transform));
    group.add(fixtures);
  }

  const lamps = [];
  const leaves = [];
  const entryFrame = material(0x506b73, { metalness: .26 });
  const doorSurface = material(0x78999f, { metalness: .28 });
  const indicator = new THREE.MeshBasicMaterial({ color: 0xd99b62, fog: false });
  const wallStrip = new THREE.MeshBasicMaterial({ color: 0x9ae1dc, fog: false });

  for (const [index, x] of gateCenters.entries()) {
    const bay = new THREE.Group();
    bay.position.set(x, 0, gateZ);
    group.add(bay);
    box(bay, [2.52, .065, 2.02], step, 0, -.005, -.91);
    box(bay, [2.55, .105, .39], iron, 0, .005, .08);
    for (const side of [-1, 1]) {
      box(bay, [.12, 2.88, 2.1], beam, side * 1.12, 1.43, -1.02);
      box(bay, [.59, 2.89, .50], entryFrame, side * 1.30, 1.435, .04);
      box(bay, [.09, 2.12, .064], wallStrip, side * 1.04, 1.36, .31);
      box(bay, [.09, .014, 5.14], paint, side * .96, -.003, 2.88);
      for (const z of [.96, 2.03, 3.10, 4.17, 5.24]) box(bay, [.32, .014, .046], paint, side * .97, -.003, z);
    }
    box(bay, [2.20, 2.88, .09], dark, 0, 1.43, -2.03);
    box(bay, [2.61, .12, 2.14], beam, 0, 2.84, -1.02);
    box(bay, [3.2, .48, .49], entryFrame, 0, 2.84, .05);
    box(bay, [1.52, .065, .080], amber, 0, 2.53, -.25);

    const label = panel(bay, 2.18, .31, 0, 2.85, .31);
    label.draw(index === 0 ? 'SECURITY A' : 'SECURITY B', '', '#e8f7f6', '#2c4a55');
    const lens = indicator.clone();
    box(bay, [.145, .145, .063], lens, 1.31, 2.87, .325);
    lamps.push(lens);

    for (let i = -4; i <= 4; i += 1) {
      const stripe = box(bay, [.12, .012, .32], i % 2 === 0 ? paint : beam, i * .225, .062, .12);
      stripe.rotation.y = .37;
    }

    for (const side of [-1, 1]) {
      const door = new THREE.Group();
      door.position.set(side * .465, 0, .02);
      bay.add(door);
      box(door, [.918, 2.48, .18], doorSurface, 0, 1.29, 0);
      box(door, [.83, .064, .033], bronze, 0, .52, .106);
      box(door, [.83, .064, .033], bronze, 0, 2.06, .106);
      box(door, [.37, 1.17, .042], beam, side * .12, 1.30, .111);
      box(door, [.095, .39, .052], iron, -side * .314, 1.29, .126);
      leaves.push({ door, side });
    }
  }

  let opening = 0;
  let wasOpen = false;

  function applyOpening(amount) {
    const eased = THREE.MathUtils.smoothstep(amount, 0, 1);
    for (const { door, side } of leaves) door.position.x = side * (.465 + eased * 1.025);
  }

  function update(delta, doorsOpen) {
    if (sirenActive && !reducedMotion) {
      alarmTime += delta;
      const flash = .5 + .5 * Math.sin(alarmTime * 7);
      sirenLens.color.setRGB(1, .12 + flash * .23, .07 + flash * .13);
      sirenLight.intensity = 3 + flash * 5;
    }
    if (doorsOpen !== wasOpen) {
      wasOpen = doorsOpen;
      for (const lamp of lamps) lamp.color.setHex(doorsOpen ? 0x7af1c3 : 0xd99b62);
    }
    const target = doorsOpen ? 1 : 0;
    const change = delta * 2.25;
    const next = reducedMotion ? target : THREE.MathUtils.clamp(target, opening - change, opening + change);
    if (next === opening) return;
    opening = next;
    applyOpening(opening);
  }

  function reset() {
    opening = 0;
    wasOpen = false;
    for (const lamp of lamps) lamp.color.setHex(0xd99b62);
    applyOpening(opening);
    sirenBroken = false;
    alarmTime = 0;
    siren.rotation.z = 0;
    setSiren(false);
  }

  reset();
  return { group, update, reset, setSiren, hitSiren, disableSiren };
}
