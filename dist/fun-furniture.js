import * as THREE from './vendor/three.module.js';
import { box, glow, material, mesh, tube } from './models.js';
import { FUN_ARENA_BOUNDS } from './fun-arena.js';

const tables = [[-4.3, 2.6], [5.3, 2.1]];
const seats = [[-.68, 1.70, -.32], [-4.15, 1.3, .24], [4.18, 3.46, .37], [6.53, 2.26, -.62]];
const crates = [[-.72, 3.2], [1.61, 3.05], [-5.98, 2.98], [4.98, 4.55],
  [-3.55, 4.53], [-4.67, 4.53], [3.52, 4.53], [3.52, 5.65],
  [-6.4, .1], [6.8, -.9], [-3.48, -.15], [5.16, -.62]];
const propRadius = .50;
const near = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const fracture = [[-.31, 1.03], [-.16, 1.00], [-.06, 1.07], [.03, .93], [.16, .98], [.29, .85]];
const splinterSizes = [[.08, .37, .06], [.09, .24, .08], [.24, .052, .14], [.20, .068, .11],
  [.36, .064, .10], [.11, .052, .24], [.09, .31, .066], [.10, .12, .05]];
const throwing = {
  Chair: { range: 11, duration: .32, turn: Math.PI * 2.5 },
  Box: { range: 5.2, duration: .52, turn: 1.57, restY: 0, restAngle: 0 },
  'Copper plate': { range: 10, duration: .34, turn: Math.PI * 2, restY: .065, restAngle: Math.PI / 2 },
  Generator: { range: 4.6, duration: .62, turn: .64, restY: .04, restAngle: .12 },
  Hammer: { range: 3.9, duration: .57, turn: 1.57, restY: .33 },
  Crowbar: { range: 6.8, duration: .45, turn: Math.PI, restY: .045, restAngle: 0 },
  'Robot head': { range: 8.1, duration: .40, turn: Math.PI * 1.65, restY: .022, restAngle: 0 },
  'Robot torso': { range: 5.7, duration: .56, turn: Math.PI * .5, restY: .022, restAngle: 0 },
  'Robot arm': { range: 7.2, duration: .45, turn: Math.PI * 1.15, restY: .022, restAngle: 0 },
  'Robot leg': { range: 6.8, duration: .49, turn: Math.PI * 1.3, restY: .022, restAngle: 0 },
};
const heavyThrow = { range: 5.0, duration: .60, turn: .80, restY: .04, restAngle: .18 };
const maxGrabDistance = 5.25;

export function createFunFurniture(parent, camera, reducedMotion, onPropImpact) {
  const room = new THREE.Group();
  const hand = new THREE.Group();
  parent.add(room);
  camera.add(hand);
  hand.position.set(-.35, -.37, -1.04);
  hand.scale.setScalar(.44);
  hand.rotation.set(-.26, .38, -.18);
  const frame = material(0x556c67, { metalness: .35 });
  const wood = material(0x9f674c);
  const chairWood = material(0xbc8155, { roughness: .86 });
  const chairEdge = material(0xe1a973, { roughness: .88 });
  const chairCrack = material(0x362217, { roughness: 1 });
  const accent = glow(0xa7e8d3);
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const tablePieces = [];
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const stamp = new THREE.Object3D();

  // Parts with one material move as a rigid prop and can render in one call.
  function boxBatch(parent, material, parts) {
    const batch = new THREE.InstancedMesh(unitBox, material, parts.length);
    for (const [index, [size, x, y, z]] of parts.entries()) {
      stamp.scale.set(...size);
      stamp.position.set(x, y, z);
      stamp.updateMatrix();
      batch.setMatrixAt(index, stamp.matrix);
    }
    parent.add(batch);
  }

  for (const [x, z] of tables) {
    tablePieces.push(box(room, [1.65, .13, .91], wood, x, .95, z));
    for (const side of [-1, 1]) for (const edge of [-1, 1]) {
      tablePieces.push(box(room, [.085, .90, .085], frame, x + side * .66, .46, z + edge * .33));
    }
  }
  const hammerIndex = seats.length + crates.length;
  const props = [...seats.map(pos => ['Chair', .62, ...pos]), ...crates.map(pos => ['Box', .69, ...pos, 0]),
    ['Hammer', .28, -3.88, 2.63, -.45], ['Crowbar', .17, 5.56, 2.10, .40]].map(([name, height, x, z, yaw], index) => {
    const body = new THREE.Group();
    body.name = name;
    room.add(body);
    let crack;
    let fragments;
    if (name === 'Chair') {
      const woodenParts = [
        [[.70, .12, .65], 0, .56, 0],
        [[.68, .38, .095], 0, .96, -.26],
      ];
      for (const side of [-1, 1]) {
        for (const edge of [-1, 1]) woodenParts.push([[.076, .54, .076], side * .28, .27, edge * .26]);
        woodenParts.push([[.064, .60, .064], side * .28, .80, -.26]);
      }
      boxBatch(body, chairWood, woodenParts);
      boxBatch(body, chairEdge, [
        [[.57, .017, .011], 0, 1.06, -.210],
        [[.57, .015, .013], 0, .57, .326],
      ]);
      crack = new THREE.Group();
      crack.name = 'Chair crack';
      body.add(crack);
      for (const z of [-.310, -.210]) {
        for (let i = 1; i < fracture.length; i++) {
          const [x, y] = fracture[i - 1];
          const [nextX, nextY] = fracture[i];
          const dx = nextX - x, dy = nextY - y;
          const seam = box(crack, [Math.hypot(dx, dy) + .007, .019, .009], chairCrack,
            (x + nextX) * .5, (y + nextY) * .5, z);
          seam.rotation.z = Math.atan2(dy, dx);
        }
      }
      fragments = new THREE.Group();
      fragments.name = 'Chair fragments';
      room.add(fragments);
      splinterSizes.forEach((size, i) => box(fragments, size, i % 3 ? chairWood : chairEdge, 0, 0, 0));
    } else if (name === 'Box') {
      box(body, [.94, .65, .94], wood, 0, .325, 0);
      boxBatch(body, frame, [
        [[.98, .09, .98], 0, .066, 0],
        [[.98, .09, .98], 0, .627, 0],
        [[.09, .55, .03], -.34, .34, .48],
        [[.09, .55, .03], .34, .34, .48],
      ]);
      box(body, [.26, .067, .024], accent, 0, .37, .48);
    } else if (name === 'Crowbar') {
      tube(body, [[0,.05,.38], [0,.05,.04], [0,.05,-.28], [.04,.055,-.40], [.14,.067,-.43], [.22,.07,-.37]], .027, frame);
      box(body, [.068,.027,.074], accent, 0,.048,.405);
      box(body, [.063,.027,.066], accent, .221,.071,-.35).rotation.y = -.7;
    } else {
      box(body, [.14, .13, .55], wood, 0, .07, 0);
      box(body, [.34, .23, .17], frame, 0, .12, -.23);
      box(body, [.12, .035, .09], accent, 0, .245, -.23);
    }
    const shape = name === 'Chair' ? [.80, 1.14, .73] : name === 'Box' ? [1, .69, 1]
      : name === 'Crowbar' ? [.56, .23, .93] : [.52, .34, .71];
    const target = box(body, shape, hidden, 0, shape[1] / 2, 0);
    target.userData.action = `fun-prop-${index}`;
    return { id: index, body, target, name, height, crack, fragments, hits: 0,
      material: name === 'Chair' ? 'wood' : name === 'Box' ? 'crate' : 'metal',
      home: new THREE.Vector3(x, name === 'Hammer' || name === 'Crowbar' ? 1.02 : 0, z), yaw, state: 'loose' };
  });

  const markerInk = new THREE.MeshBasicMaterial({ color: 0x8bdfbd, side: THREE.DoubleSide, transparent: true, opacity: .72 });
  const marker = mesh(room, new THREE.RingGeometry(.40, .51, 32), markerInk);
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  const handPoint = new THREE.Vector3();
  const plan = new THREE.Vector3();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const face = new THREE.Vector3();
  const flightOrigin = new THREE.Vector3();
  const flightDirection = new THREE.Vector3();
  const collisionRay = new THREE.Raycaster();
  let held;
  const storage = new THREE.Group();
  const inventory = [null, null, null];
  storage.visible = false;
  parent.add(storage);
  let enabled = true;
  let swingTime = 0;
  let nextPropId = props.length;

  function registerProp({ name, visual, home, shape, material, onGrab, onReset, available, yaw = 0 }, dynamic) {
    const body = new THREE.Group();
    body.name = name;
    body.add(visual);
    const target = box(body, shape, hidden, 0, shape[1] / 2, 0);
    const id = nextPropId++;
    target.userData.action = `fun-prop-${id}`;
    const prop = { id, body, target, name, material, height: shape[1], home, yaw, onGrab, onReset, available,
      docked: !dynamic, dynamic };
    props.push(prop);
    restore(prop);
    body.updateWorldMatrix(true, true);
    return id;
  }

  function addProp(options) {
    return registerProp(options, false);
  }

  function addLooseProp(options) {
    return registerProp(options, true);
  }

  function clearLooseProps() {
    for (let index = props.length - 1; index >= 0; index--) {
      const prop = props[index];
      if (!prop.dynamic) continue;
      if (held === prop) held = undefined;
      const slot = inventory.indexOf(prop);
      if (slot !== -1) inventory[slot] = null;
      prop.body.removeFromParent();
      prop.target.geometry.dispose();
      props.splice(index, 1);
    }
    if (!held) marker.visible = false;
  }

  function restore(prop) {
    room.add(prop.body);
    prop.body.position.copy(prop.home);
    prop.body.rotation.set(0, prop.yaw, 0);
    prop.body.scale.setScalar(1);
    prop.state = prop.docked ? 'docked' : 'loose';
    prop.body.visible = !prop.docked;
    prop.flight = undefined;
    prop.hits = 0;
    prop.fragmentAge = 0;
    if (prop.crack) prop.crack.visible = prop.fragments.visible = false;
    prop.onReset?.();
  }

  function reset() {
    clearLooseProps();
    held = undefined;
    inventory.fill(null);
    swingTime = 0;
    marker.visible = false;
    props.forEach(restore);
  }
  reset();

  function movable(chair) {
    return chair.state === 'loose' || chair.state === 'placed' || chair.state === 'tumbled';
  }

  const canGrab = item => item.state === 'docked' ? (item.available?.() ?? true) : movable(item);

  function nearest(origin) {
    let distance = Infinity;
    let closest;
    for (const chair of props) {
      if (!canGrab(chair) || chair.name === 'Hammer') continue;
      const range = near(chair.body.position, origin);
      const rank = range + (chair.state === 'placed' ? maxGrabDistance : 0);
      if (range > maxGrabDistance || rank >= distance) continue;
      distance = rank;
      closest = chair;
    }
    return closest;
  }

  function grab(origin, id) {
    const chair = id == null ? nearest(origin) : props.find(item => item.id === id);
    if (!chair || !canGrab(chair) || near(chair.body.position, origin) > (chair.name === 'Hammer' ? 6.8 : maxGrabDistance)) return 'Move closer to the object.';
    if (props.some(item => item.state === 'placed' && near(item.body.position, chair.body.position) < .12 && Math.abs(item.body.position.y - top(chair)) < .06)) {
      return 'Take the item on top first.';
    }
    const slot = inventory.indexOf(null);
    if (slot < 0) return 'Inventory is full. Drop an item with Z.';
    if (chair.state === 'docked') chair.onGrab?.();
    inventory[slot] = chair;
    equip(slot);
    return `${chair.name} in left hand.`;
  }

  function equip(slot) {
    if (held) {
      storage.add(held.body);
      held.state = 'stored';
    }
    held = inventory[slot] ?? undefined;
    if (!held) return;
    const chair = held;
    chair.state = 'held';
    chair.body.visible = true;
    hand.add(chair.body);
    chair.body.position.set(0, chair.name === 'Hammer' || chair.name === 'Crowbar' ? 0 : -.50, 0);
    chair.body.rotation.set(0, -.32, 0);
  }

  function landing(origin, forward, distance) {
    const length = Math.hypot(forward.x, forward.z) || 1;
    return plan.set(origin.x + forward.x * distance / length, .024, origin.z + forward.z * distance / length);
  }

  const top = item => item.body.position.y + item.height;

  function buildSpot(origin, forward, ray, strict = false) {
    if (ray && (held.name === 'Box' || held.name === 'Chair')) {
      const surface = hit(ray);
      const support = props.find(item => item.target === surface?.object);
      if (support && (support.name === 'Box' || support.name === 'Chair') && surface.distance <= 5.25) {
        const at = support.body.position;
        face.copy(surface.face.normal).transformDirection(surface.object.matrixWorld);
        if (face.y > .5 || support.name === 'Chair' || held.name === 'Chair') return plan.set(at.x, top(support), at.z);
        if (Math.abs(face.z) >= Math.abs(face.x)) return plan.set(at.x, 0, at.z + Math.sign(face.z));
        return plan.set(at.x + Math.sign(face.x), 0, at.z);
      }
      const floorPoint = ray.ray.intersectPlane(ground, plan);
      if (floorPoint && ray.ray.origin.distanceTo(floorPoint) <= Math.min(5.25, surface?.distance ?? Infinity)) {
        return plan.set(Math.round(plan.x), 0, Math.round(plan.z));
      }
    }
    if (strict) return null;
    const point = landing(origin, forward, 1.65);
    let support;
    if (held.name !== 'Hammer') for (const item of props) {
      if (item.state === 'placed' && near(item.body.position, point) < .68 && (!support || top(item) > top(support))) support = item;
    }
    if (support) point.set(support.body.position.x, top(support), support.body.position.z);
    else point.y = 0;
    return point;
  }

  function clearFootprint(point, edge = .62) {
    const { x, z } = point;
    const { minX, maxX, minZ, maxZ } = FUN_ARENA_BOUNDS;
    if (x < minX + edge || x > maxX - edge || z < minZ + edge || z > maxZ - edge) return false;
    if (x > -5.14 && x < 4.30 && z > -2.84 && z < -.35) return false;
    if (Math.abs(x) < 2.55 && Math.abs(z - .52) < .68) return false;
    return !tables.some(([tx, tz]) => Math.abs(tx - x) < 1.15 && Math.abs(tz - z) < .76);
  }

  function fits(point) {
    if (!clearFootprint(point)) return false;
    if (point.y + held.height > 2.12) return false;
    return props.every(chair => chair.dynamic || !movable(chair) || near(chair.body.position, point) > .90 ||
      top(chair) <= point.y + .02);
  }

  function boxSpot(origin, ray) {
    if (held?.name !== 'Box' || !ray) return null;
    const point = buildSpot(origin, ray.ray.direction, ray, true);
    return point && near(origin, point) >= .78 && fits(point) ? point : null;
  }

  function settleCopperPlate(plate, from) {
    const at = plate.body.position;
    if (clearFootprint(at, 1.17) && floor(at.x, at.z) === 0) return;
    for (let step = 1; step <= 7; step++) {
      flightOrigin.copy(at).lerp(from, step / 7);
      if (clearFootprint(flightOrigin, 1.17) && floor(flightOrigin.x, flightOrigin.z) === 0) {
        at.x = flightOrigin.x;
        at.z = flightOrigin.z;
        return;
      }
    }
    restore(plate);
  }

  function put(origin, forward, toss, ray, target, onImpact, surface = 'floor', direct = false) {
    if (!held) return 'Grab an object first.';
    const motion = throwing[held.name] ?? heavyThrow;
    const point = toss ? target ?? landing(origin, forward, motion.range) : target ?? buildSpot(origin, forward, ray);
    if (toss && !target) {
      point.x = THREE.MathUtils.clamp(point.x, FUN_ARENA_BOUNDS.minX + .6, FUN_ARENA_BOUNDS.maxX - .6);
      point.z = THREE.MathUtils.clamp(point.z, FUN_ARENA_BOUNDS.minZ + .6, FUN_ARENA_BOUNDS.maxZ - .6);
    }
    if (!toss && !target && !fits(point)) return 'Aim at a clear spot, or the top of a box.';
    if (!toss && near(origin, point) < .78 && origin.y - point.y > 0) return 'Step back to place it.';
    const chair = held;
    inventory[inventory.indexOf(chair)] = null;
    held = undefined;
    if (toss) hand.getWorldPosition(handPoint);
    room.add(chair.body);
    const lower = !toss && props.find(item => item !== chair && movable(item) &&
      near(item.body.position, point) < .10 && Math.abs(top(item) - point.y) < .025);
    const yaw = chair.name === 'Box' && !toss ? 0 : lower ? lower.body.rotation.y : Math.atan2(forward.x, forward.z);
    chair.body.rotation.set(0, yaw, 0);
    chair.body.position.copy(toss ? handPoint : point);
    chair.state = toss ? 'flying' : chair.dynamic || chair.name === 'Hammer' ? 'loose' : 'placed';
    if (toss) {
      chair.flight = { from: handPoint.clone(), to: point.clone(), elapsed: 0, onImpact, surface, motion, direct };
      onPropImpact?.({ phase: 'throw', item: chair.name, material: chair.material });
    }
    marker.visible = false;
    if (toss) return `${chair.name} tossed.`;
    if (chair.state === 'loose') return `${chair.name} set down.`;
    return point.y > 0 ? 'Platform stacked.' : 'Barricade placed.';
  }

  function drop(origin, forward) {
    if (!held) return 'Select an item to drop.';
    const { minX, maxX, minZ, maxZ } = FUN_ARENA_BOUNDS;
    for (const angle of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      face.set(forward.x, 0, forward.z).applyAxisAngle(THREE.Object3D.DEFAULT_UP, angle);
      for (const distance of [1.15, 1.75, 2.4]) {
        const point = landing(origin, face, distance);
        if (point.x < minX + .6 || point.x > maxX - .6 || point.z < minZ + .6 || point.z > maxZ - .6) continue;
        point.y = 0;
        if (!fits(point)) continue;
        const item = held;
        inventory[inventory.indexOf(item)] = null;
        held = undefined;
        room.add(item.body);
        item.body.position.copy(point);
        item.body.rotation.set(0, item.yaw, 0);
        item.state = 'loose';
        return `${item.name} dropped.`;
      }
    }
    return 'Step toward open floor to drop the item.';
  }

  function hit(ray) {
    const targets = props.filter(canGrab).map(chair => chair.target);
    return ray.intersectObjects(targets, false)[0];
  }

  function blocks(x, z, padding = 0, feet = 0) {
    return feet < floor(x, z, padding) - .025;
  }

  function floor(x, z, padding = .12) {
    let height = 0;
    for (const [tx, tz] of tables) {
      if (Math.abs(x - tx) < .825 + padding && Math.abs(z - tz) < .455 + padding) height = 1.015;
    }
    for (const item of props) if (!item.dynamic && (item.state === 'placed' || item.state === 'loose' && item.name !== 'Hammer') &&
      Math.hypot(item.body.position.x - x, item.body.position.z - z) < propRadius + padding) height = Math.max(height, top(item));
    return height;
  }

  function covers(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = dx * dx + dz * dz;
    if (!length) return false;
    return props.some(({ state, body: { position } }) => {
      if (state !== 'placed') return false;
      const fraction = ((position.x - from.x) * dx + (position.z - from.z) * dz) / length;
      return fraction > 0 && fraction < 1 && Math.hypot(position.x - from.x - fraction * dx, position.z - from.z - fraction * dz) < propRadius + .08;
    });
  }

  function furnitureHit(from, to) {
    flightDirection.copy(to).sub(from);
    const length = flightDirection.length();
    if (!length) return;
    collisionRay.set(from, flightDirection.multiplyScalar(1 / length));
    collisionRay.far = length;
    const propsInRoom = props.filter(movable);
    const table = collisionRay.intersectObjects(tablePieces, false)[0];
    const prop = collisionRay.intersectObjects(propsInRoom.map(item => item.target), false)[0];
    if (!prop || table && table.distance < prop.distance) return table && { point: table.point, surface: 'wood' };
    const hitProp = propsInRoom.find(item => item.target === prop.object);
    return { point: prop.point, surface: hitProp.material === 'wood' || hitProp.material === 'crate' ? 'wood' : 'metal' };
  }

  function breakChair(chair) {
    chair.state = 'broken';
    chair.fragments.position.copy(chair.body.position);
    chair.fragments.position.y = Math.max(.16, chair.fragments.position.y);
    chair.fragmentAge = 0;
    chair.fragments.visible = true;
    chair.body.removeFromParent();
    updateFragments(chair, 0);
  }

  function updateFragments(chair, delta) {
    chair.fragmentAge += delta;
    const time = chair.fragmentAge;
    if (time > 1.4) {
      chair.fragments.visible = false;
      return;
    }
    for (const [index, fragment] of chair.fragments.children.entries()) {
      const angle = index * 2.399;
      const speed = (reducedMotion ? .6 : 1.35) + (index % 3) * .27;
      const distance = speed * Math.min(time, .55);
      fragment.position.set(Math.cos(angle) * distance,
        Math.max(.055 - chair.fragments.position.y, (2.4 + index % 4 * .31) * time - 5.9 * time ** 2),
        Math.sin(angle) * distance);
      fragment.rotation.set(angle + time * 4, angle * .6, time * (4 + index % 4));
    }
  }

  function update(delta, origin, forward, impact, buildRay) {
    const point = held && enabled && buildRay && (held.name === 'Box' ? boxSpot(origin, buildRay)
      : held.name === 'Chair' ? buildSpot(origin, forward, buildRay) : null);
    marker.visible = Boolean(point);
    if (point) {
      marker.position.copy(point);
      marker.position.y += .025;
      markerInk.color.setHex(fits(point) ? 0x8bdfbd : 0xec8d79);
    }
    if (swingTime > 0) swingTime = Math.max(0, swingTime - delta);
    hand.rotation.x = -.26 - (reducedMotion ? 0 : Math.sin(swingTime / .32 * Math.PI) * .94);
    for (const chair of props) {
      if (chair.fragments?.visible) updateFragments(chair, delta);
      if (!chair.flight || delta <= 0) continue;
      const flight = chair.flight;
      flightOrigin.copy(chair.body.position);
      flight.elapsed += delta;
      const fraction = Math.min(1, flight.elapsed / flight.motion.duration);
      chair.body.position.lerpVectors(flight.from, flight.to, fraction);
      chair.body.position.y += Math.sin(fraction * Math.PI) * (flight.direct || reducedMotion ? .12 : .62);
      chair.body.rotation.x = fraction * (reducedMotion ? Math.min(1.57, flight.motion.turn) : flight.motion.turn);
      const chairThrown = chair.name === 'Chair';
      const furniture = furnitureHit(flightOrigin, chair.body.position);
      if (furniture) chair.body.position.copy(furniture.point);
      const robots = impact(flightOrigin, chair.body.position, chair.name);
      if (robots) {
        onPropImpact?.({ phase: 'impact', item: chair.name, material: chair.material, surface: 'robot' });
      }
      if (!furniture && fraction < 1) continue;
      chair.flight = undefined;
      let cracked = false;
      let broken = false;
      if (chairThrown) {
        chair.hits += 1;
        cracked = chair.hits === 2;
        broken = chair.hits === 3;
        if (cracked) chair.crack.visible = true;
        if (broken) breakChair(chair);
      }
      onPropImpact?.({ phase: 'impact', item: chair.name, material: chair.material,
        surface: furniture?.surface ?? flight.surface, cracked, broken });
      if (chair.state !== 'broken') {
        chair.state = 'tumbled';
        chair.body.position.y = flight.motion.restY ?? .33;
        if (flight.motion.restAngle !== undefined) chair.body.rotation.x = flight.motion.restAngle;
        if (chair.name === 'Copper plate') settleCopperPlate(chair, flight.from);
      }
      if (!furniture && flight.onImpact) flight.onImpact();
    }
  }

  return { addProp, addLooseProp, clearLooseProps, grab, put, drop, equip, hit, blocks, floor, covers, update, reset, boxSpot,
    holding: () => held?.name,
    tossRange: () => (throwing[held?.name] ?? heavyThrow).range,
    inventory: () => ({ items: inventory.map(item => item?.name ?? null), active: held ? inventory.indexOf(held) : -1 }),
    canStackOn(id) {
      const support = props.find(item => item.id === id);
      return held?.name === 'Chair' && support?.name === 'Chair' && movable(support);
    },
    grabHammer: (origin) => grab(origin, hammerIndex),
    swing() {
      if (!held || !['Hammer', 'Copper plate', 'Crowbar'].includes(held.name) || swingTime > 0) return false;
      swingTime = .32;
      return true;
    },
    setVisible(visible) { enabled = room.visible = hand.visible = visible; },
  };
}
