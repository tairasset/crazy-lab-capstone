import * as THREE from './vendor/three.module.js';
import { box, glow, material, mesh, panel } from './models.js';
import { createFunFirearmModel } from './fun-firearms.js';

const tools = [
  { type: 'training', label: 'Training', color: 0x81c8e3, accent: '#a9e5fa' },
  { type: 'scatter', label: 'Scatter', color: 0x9f76e8, accent: '#e2c4ff' },
  { type: 'copper', label: 'Copper', color: 0xe98b4c, accent: '#ffc18d' },
  { type: 'cryo', label: 'Freeze', color: 0x65dce9, accent: '#9ff9ff' },
  { type: 'blaster', label: 'Blaster', color: 0xe17a70, accent: '#ffc0b0' },
  { type: 'arc', label: 'Arc', color: 0x8fdb9b, accent: '#bafac3' },
];
const firearms = [
  { type: 'sidearm', label: 'Pistol', accent: '#cadce8' },
  { type: 'carbine', label: 'Carbine', accent: '#bce9ca' },
  { type: 'shotgun', label: 'Shotgun', accent: '#ffcf9c' },
];

function orbIcon(parent, type, shell, power, dark) {
  const ball = new THREE.SphereGeometry(.129, 16, 11);
  mesh(parent, ball, shell);

  if (type === 'training') {
    const belt = mesh(parent, new THREE.TorusGeometry(.133, .012, 8, 26), power);
    belt.rotation.set(.31, -.2, .15);
    mesh(parent, new THREE.SphereGeometry(.045, 10, 7), power, 0, 0, .115);
    return;
  }
  if (type === 'scatter') {
    const orbit = mesh(parent, new THREE.TorusGeometry(.168, .008, 6, 30), dark);
    orbit.rotation.set(-.26, .4, .2);
    const spark = new THREE.OctahedronGeometry(.034);
    for (let i = 0; i < 5; i += 1) {
      const a = i * 2 * Math.PI / 5 + .38;
      mesh(parent, spark, power, .163 * Math.cos(a), .141 * Math.sin(a), .08 + .08 * Math.cos(a));
    }
    return;
  }
  if (type === 'copper') {
    const winding = new THREE.TorusGeometry(.130, .014, 8, 28);
    for (const tilt of [-.6, .58]) mesh(parent, winding, dark).rotation.set(.71, tilt, -.37);
    mesh(parent, new THREE.OctahedronGeometry(.061), power, 0, 0, .113);
    return;
  }
  const frost = new THREE.OctahedronGeometry(.051);
  for (const [x, y, z, size] of [[0, 0, .13, 1.45], [-.084, .079, .089, .84], [.074, -.076, .086, .78]]) {
    const crystal = mesh(parent, frost, power, x, y, z);
    crystal.scale.set(size * .67, size, size * .53);
  }
}

function handheldIcon(parent, type, shell, power, dark) {
  if (type === 'blaster') {
    box(parent, [.38, .115, .128], shell, .022, .045, 0);
    box(parent, [.32, .040, .131], dark, .015, .108, 0);
    box(parent, [.116, .143, .108], dark, -.092, -.069, 0).rotation.z = -.16;
    box(parent, [.14, .023, .106], shell, -.101, -.137, 0);
    for (const side of [-1, 1]) box(parent, [.17, .022, .012], power, .04, .063, side * .068);
    const muzzle = mesh(parent, new THREE.CylinderGeometry(.060, .060, .057, 16), dark, .224, .048, 0);
    muzzle.rotation.z = Math.PI / 2;
    mesh(parent, new THREE.TorusGeometry(.039, .008, 8, 20), power, .254, .048, 0).rotation.y = Math.PI / 2;
    box(parent, [.036, .028, .035], power, .146, .139, 0);
    return;
  }
  const grip = mesh(parent, new THREE.CapsuleGeometry(.044, .14, 6, 11), dark, -.039, -.048, 0);
  grip.rotation.z = -.52;
  box(parent, [.133, .10, .11], shell, .007, .035, 0).rotation.z = -.28;
  for (const side of [-1, 1]) {
    box(parent, [.082, .115, .067], shell, side * .069, .081, .019).rotation.z = side * -.38;
    box(parent, [.047, .033, .039], power, side * .092, .128, .019);
  }
  const node = mesh(parent, new THREE.OctahedronGeometry(.061), power, .008, .091, .062);
  node.scale.set(.66, .91, .66);
  mesh(parent, new THREE.TorusGeometry(.054, .009, 7, 20), power, .006, .081, .065).rotation.set(.3, .46, -.2);
}

export function createFunRack(parent, camera) {
  const group = new THREE.Group();
  group.name = 'Armory rack';
  group.position.set(3.12, 0, -.62);
  parent.add(group);
  const hand = new THREE.Group();
  hand.position.set(.36, -.32, -1.01);
  hand.rotation.set(.03, -.26, .18);
  camera?.add(hand);

  const frame = material(0x42554f, { metalness: .41 });
  const backing = material(0x223430);
  const trim = material(0xa07150, { metalness: .4 });
  const dark = material(0x253430, { metalness: .3 });
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  box(group, [1.87, .09, .57], frame, 0, .047, -.017);
  box(group, [1.83, 1.99, .20], frame, 0, 1.26, -.108);
  box(group, [1.70, 1.68, .09], backing, 0, 1.213, .019);
  box(group, [1.91, .33, .26], trim, 0, 2.175, -.056);
  for (const x of [-.91, .91]) {
    box(group, [.076, 1.99, .28], frame, x, 1.24, .048);
    box(group, [.14, .28, .32], frame, x, .17, .028);
  }
  const title = panel(group, 1.65, .245, 0, 2.182, .092);
  title.draw('ARMORY', '', '#ffdbb5', '#202d28');

  const firearmSlots = firearms.map(({ type, label, accent }, index) => {
    const x = (index - 1) * .565;
    const y = 1.76;
    const edge = new THREE.MeshBasicMaterial({ color: 0x394e46 });
    const bay = material(0x283d36);
    box(group, [.545, .49, .027], edge, x, y, .087);
    box(group, [.506, .452, .025], bay, x, y, .107);
    box(group, [.43, .025, .145], dark, x, y - .035, .174);
    const icon = createFunFirearmModel(type);
    const bounds = new THREE.Box3().setFromObject(icon);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = Math.min(.45 / size.x, .204 / size.y);
    icon.scale.setScalar(scale);
    icon.position.set(x, y + .076, .231).addScaledVector(bounds.getCenter(new THREE.Vector3()), -scale);
    group.add(icon);
    const tag = panel(group, .49, .144, x, y - .145, .141);
    const target = box(group, [.545, .49, .28], hidden, x, y, .261);
    target.name = `Armory ${label}`;
    target.userData.action = `fun-weapon-${type}`;
    return { type, label, accent, edge, bay, tag, target };
  });

  const toolSlots = tools.map(({ type, label, color, accent }, index) => {
    const x = index % 2 === 0 ? -.439 : .439;
    const y = 1.296 - Math.floor(index / 2) * .427;
    const edge = new THREE.MeshBasicMaterial({ color: 0x394e46 });
    const bay = material(0x283d36);
    const shell = material(color, { metalness: .32, roughness: .48 });
    const power = glow(color);
    box(group, [.839, .406, .027], edge, x, y, .087);
    box(group, [.786, .374, .025], bay, x, y, .107);
    box(group, [.54, .025, .145], dark, x, y - .040, .174);
    const icon = new THREE.Group();
    icon.position.set(x, y + .068, .233);
    group.add(icon);
    if (type === 'blaster' || type === 'arc') handheldIcon(icon, type, shell, power, dark);
    else orbIcon(icon, type, shell, power, dark);

    const tag = panel(group, .757, .126, x, y - .124, .136);
    const target = box(group, [.83, .406, .26], hidden, x, y, .257);
    target.name = `Armory ${label}`;
    target.userData.action = `fun-weapon-${type}`;
    const held = icon.clone();
    held.position.set(0, 0, 0);
    held.scale.setScalar(type === 'blaster' ? 1.18 : .70);
    if (type === 'blaster') {
      held.position.set(-.018, -.015, -.055);
      held.rotation.set(0, Math.PI / 2 + .26, -.03);
    }
    hand.add(held);
    icon.scale.setScalar(.76);
    return { type, label, accent, edge, bay, tag, target, held };
  });
  const slots = [...firearmSlots, ...toolSlots];

  let selected;
  function select(type) {
    if (selected === type) return;
    selected = type;
    for (const { type: id, label, accent, edge, bay, tag, held } of slots) {
      const active = type === id;
      if (held) held.visible = active;
      edge.color.set(active ? accent : '#394e46');
      bay.color.setHex(active ? 0x3a5045 : 0x283d36);
      tag.draw(label, '', active ? '#fff2cf' : accent, active ? '#364c40' : '#23352f');
    }
  }

  select('training');
  return { group, targets: slots.map(({ target }) => target), select, setVisible(visible) { group.visible = hand.visible = visible; } };
}
