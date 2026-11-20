import * as THREE from './vendor/three.module.js';
import { box, material, mesh } from './models.js';
import { createFirearmAudio } from './fun-firearm-audio.js';

export const funFirearms = {
  sidearm: { color: 0xffd28c, interval: .27, recoil: .10, pellets: [[0, 0]] },
  carbine: { color: 0xffd99d, interval: .105, recoil: .063, pellets: [[0, 0]] },
  shotgun: { color: 0xffb46f, interval: .54, recoil: .17,
    pellets: [[0, 0], [-.097, -.024], [.097, -.024], [-.063, .067], [.063, .067], [0, -.087]] },
};

export const isFunFirearm = type => Object.hasOwn(funFirearms, type);

function cylinderAlongX(parent, radii, length, surface, x, y) {
  const tube = mesh(parent, new THREE.CylinderGeometry(radii[0], radii[1], length, 12), surface, x, y, 0);
  tube.rotation.z = Math.PI / 2;
  return tube;
}

export function createFunFirearmModel(type) {
  const group = new THREE.Group();
  group.name = `Armory ${type}`;
  const long = type !== 'sidearm';
  const spread = type === 'shotgun';
  const frame = material(spread ? 0x645850 : 0x516971, { metalness: .44, roughness: .42 });
  const polymer = material(type === 'carbine' ? 0x394843 : 0x293739, { roughness: .84 });
  const iron = material(0x768a89, { metalness: .54, roughness: .37 });
  const stripe = material(type === 'carbine' ? 0x76a08f : 0xb8815d, { metalness: .43, roughness: .47 });
  const bore = material(0x11191b);
  const front = spread ? material(0x996345, { roughness: .72 }) : polymer;
  const muzzleX = spread ? .86 : long ? .73 : .35;
  const y = long ? .115 : .10;
  const width = spread ? .19 : .156;

  box(group, [long ? .50 : .48, .126, width], frame, -.035, y, 0);
  box(group, [long ? .40 : .43, .040, width * .89], iron, -.035, y + .074, 0);
  box(group, [.137, .225, .124], polymer, -.175, -.060, 0).rotation.z = -.21;
  box(group, [.145, .029, .13], frame, -.198, -.164, 0);
  box(group, [.175, .026, .035], polymer, -.043, -.072, 0);
  box(group, [.032, .107, .037], frame, .037, -.024, 0).rotation.z = -.22;
  for (const side of [-1, 1]) {
    box(group, [.19, .031, .013], stripe, -.08, y + .015, side * (width / 2 + .004));
    box(group, [.077, .018, .019], iron, -.221, y + .108, side * .036);
    for (let line = 0; line < 4; line++) {
      box(group, [.010, .038, .008], polymer, -.128 + .029 * line, -.064, side * .06).rotation.z = -.21;
    }
  }
  if (long) {
    box(group, [spread ? .25 : .28, .086, .102], front, -.37, y - .018, 0);
    box(group, [.066, .177, .130], frame, -.49, y - .050, 0).rotation.z = spread ? -.25 : -.11;
    box(group, [spread ? .32 : .371, .141, width + .020], front, spread ? .375 : .336, y - .014, 0);
    if (spread) {
      for (let rib = 0; rib < 5; rib++) {
        box(group, [.028, .147, width + .027], front, .24 + .062 * rib, y - .008, 0);
      }
    } else {
      box(group, [.116, .164, .119], frame, .065, -.029, 0).rotation.z = .13;
      for (const side of [-1, 1]) {
        for (let notch = 0; notch < 4; notch++) {
          box(group, [.047, .022, .012], iron, .227 + .072 * notch, y + .030, side * (width / 2 + .012));
        }
      }
    }
  }
  const radius = spread ? .069 : .054;
  cylinderAlongX(group, [radius * .80, radius * .83], long ? .215 : .128, iron, muzzleX - .113, y);
  cylinderAlongX(group, [radius, radius * .89], .067, frame, muzzleX - .030, y);
  cylinderAlongX(group, [radius * .68, radius * .68], .013, bore, muzzleX + .007, y);
  box(group, [.037, .041, .037], polymer, muzzleX - .104, y + .069, 0);
  box(group, [.014, .015, .013], stripe, muzzleX - .096, y + .093, 0);

  const muzzle = new THREE.Object3D();
  muzzle.name = 'Muzzle';
  muzzle.position.set(muzzleX + .044, y, 0);
  group.add(muzzle);
  return group;
}

export function createFunFirearmView(camera, reducedMotion, canPlaySound = () => true) {
  const rig = new THREE.Group();
  rig.name = 'First-person armory';
  camera.add(rig);
  const glow = new THREE.MeshBasicMaterial({
    color: 0xffe2b2, transparent: true, opacity: .92, depthWrite: false, toneMapped: false
  });
  const flash = new THREE.Group();
  const flame = mesh(flash, new THREE.OctahedronGeometry(.14), glow);
  flame.scale.set(1.7, .6, .6);
  const forks = mesh(flash, new THREE.OctahedronGeometry(.12), glow);
  forks.rotation.set(.73, .32, .24);
  forks.scale.set(.93, .77, .48);
  flash.name = 'Muzzle flash';
  flash.visible = false;
  const models = Object.fromEntries(Object.keys(funFirearms).map(type => {
    const model = createFunFirearmModel(type);
    const long = type !== 'sidearm';
    model.scale.setScalar(long ? .73 : .93);
    model.rotation.y = Math.PI / 2 + .105;
    model.position.z = long ? -.021 : -.085;
    model.visible = false;
    rig.add(model);
    return [type, model];
  }));
  const play = createFirearmAudio(canPlaySound);
  let selected;
  let kick = 0;
  let flashAge = Infinity;
  let strikeAge = Infinity;

  function select(type) {
    if (selected === type) return;
    for (const [id, model] of Object.entries(models)) model.visible = type === id;
    selected = type;
    if (isFunFirearm(type)) models[type].getObjectByName('Muzzle').add(flash);
    kick = 0;
    strikeAge = Infinity;
    flash.visible = false;
    update(0);
  }

  function update(delta) {
    if (!isFunFirearm(selected)) return;
    kick *= Math.exp(-delta * 18);
    strikeAge += delta;
    const strike = strikeAge < .10 ? strikeAge / .10 : Math.max(0, 1 - (strikeAge - .10) / .19);
    const motion = reducedMotion ? strike * .30 : strike;
    const narrow = camera.aspect < 1.1;
    rig.position.set((narrow ? .25 : .36) - motion * .18, (narrow ? -.31 : -.34) + motion * .045,
      -.90 + kick - motion * .16);
    rig.rotation.set(kick * .80 + motion * .19, motion * .43, -.08 - motion * .27);
    if (flash.visible) {
      flashAge += delta;
      if (flashAge >= .093) flash.visible = false;
      glow.opacity = Math.max(0, 1 - flashAge / .093) * (reducedMotion ? .41 : .92);
    }
  }

  return {
    select, update,
    fire() {
      if (!isFunFirearm(selected)) return;
      const weapon = funFirearms[selected];
      flashAge = 0;
      flash.visible = true;
      glow.color.setHex(weapon.color);
      glow.opacity = reducedMotion ? .41 : .92;
      flash.scale.setScalar(reducedMotion ? .61 : selected === 'shotgun' ? 1.38 : 1);
      flash.rotation.x = Math.random() * Math.PI;
      kick = reducedMotion ? 0 : weapon.recoil;
      play(selected);
      update(0);
    },
    melee() {
      if (isFunFirearm(selected)) strikeAge = 0;
    },
    origin(out) {
      return isFunFirearm(selected) ? models[selected].getObjectByName('Muzzle').getWorldPosition(out) : null;
    },
  };
}
