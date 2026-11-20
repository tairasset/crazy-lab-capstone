import * as THREE from './vendor/three.module.js';
import { FUN_ARENA_BOUNDS, FUN_ARENA_ENTRIES } from './fun-arena.js';
import { funFirearms, isFunFirearm } from './fun-firearms.js';
import { box, glow, material, mesh } from './models.js';

const waveSizes = [2, 4, 6];
const total = waveSizes.reduce((sum, count) => sum + count, 0);
const tools = {
  training: { color: 0x8fffc9, core: 0xddffed, radius: 1.54, strongRadius: 0, stun: .24 },
  blaster: { color: 0xffd568, core: 0xffffe6, radius: .83, strongRadius: 0, stun: .14, motion: 'bolt', fireInterval: .09 },
  arc: { color: 0x60ffe0, radius: 1.35, stun: 1.22, motion: 'beam', fireInterval: .18 },
  scatter: { color: 0xffcc8a, core: 0xfff2cd, radius: 1.95, strongRadius: 1.28, stun: .32 },
  copper: { color: 0xff895e, core: 0xa6fff0, radius: 3.12, strongRadius: 0, stun: 2.3 },
  cryo: { color: 0x71bcff, core: 0xe4f6ff, radius: 2.32, strongRadius: 0, stun: 3.65 },
  'scatter-plus': { color: 0xffab57, core: 0xfff1bb, radius: 2.58, strongRadius: 1.75, stun: .58, effect: 'scatter' },
  'copper-plus': { color: 0xff6546, core: 0xe6ffd7, radius: 3.78, strongRadius: 1.42, stun: 3.1, effect: 'copper' },
  'cryo-plus': { color: 0x8ceaff, core: 0xf0feff, radius: 2.98, strongRadius: 1.22, stun: 4.65, effect: 'cryo' },
};
const orbFireInterval = .12;
const flatDistance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const strikeStartRange = 1.38;
const strikeRange = 1.58;
const strikeWindup = .46;
const strikeContact = strikeWindup + .13;
const strikeDuration = strikeContact + .34;

function createGuardRoutes(blocked) {
  const { minX, maxX, minZ, maxZ } = FUN_ARENA_BOUNDS;
  const spacing = .4;
  const cols = Math.floor((maxX - minX) / spacing) + 1;
  const rows = Math.floor((maxZ - minZ) / spacing) + 1;
  const parents = new Int16Array(cols * rows).fill(-1);
  const open = new Uint8Array(parents.length);
  const queue = new Uint16Array(parents.length);
  const xAt = index => minX + index % cols * spacing;
  const zAt = index => minZ + Math.floor(index / cols) * spacing;
  const target = new THREE.Vector3();
  let untilUpdate = 0;

  function canCross(x, z, endX, endZ) {
    const steps = Math.ceil(Math.hypot(endX - x, endZ - z) / (spacing / 2));
    for (let i = 1; i <= steps; i++) {
      if (blocked(x + (endX - x) * i / steps, z + (endZ - z) * i / steps)) return false;
    }
    return true;
  }

  function near(position, usable) {
    const col = Math.round((position.x - minX) / spacing);
    const row = Math.round((position.z - minZ) / spacing);
    let result = -1;
    let best = Infinity;
    for (let z = Math.max(0, row - 2); z <= Math.min(rows - 1, row + 2); z++) {
      for (let x = Math.max(0, col - 2); x <= Math.min(cols - 1, col + 2); x++) {
        const index = z * cols + x;
        const distance = Math.hypot(xAt(index) - position.x, zAt(index) - position.z);
        if (distance >= best || !usable(index)) continue;
        result = index;
        best = distance;
      }
    }
    return result;
  }

  function update(player, delta) {
    untilUpdate -= delta;
    if (untilUpdate > 0) return;
    untilUpdate = .32;
    parents.fill(-1);
    for (let i = 0; i < open.length; i++) open[i] = Number(!blocked(xAt(i), zAt(i)));
    const start = near(player, index => open[index]);
    if (start < 0) return;
    parents[start] = start;
    queue[0] = start;
    let count = 1;
    // Search outward from the player so every guard can use the same routes.
    const visit = (from, to) => {
      if (!open[to] || parents[to] >= 0 || blocked((xAt(from) + xAt(to)) / 2, (zAt(from) + zAt(to)) / 2)) return;
      parents[to] = from;
      queue[count++] = to;
    };
    for (let i = 0; i < count; i++) {
      const index = queue[i];
      const col = index % cols;
      if (col > 0) visit(index, index - 1);
      if (col < cols - 1) visit(index, index + 1);
      if (index >= cols) visit(index, index - cols);
      if (index + cols < parents.length) visit(index, index + cols);
    }
  }

  function next(position, player) {
    if (flatDistance(position, player) < 3 && canCross(position.x, position.z, player.x, player.z)) return player;
    const cell = near(position, index => parents[index] >= 0 && canCross(position.x, position.z, xAt(index), zAt(index)));
    if (cell < 0) return position;
    const parent = parents[cell];
    const index = canCross(position.x, position.z, xAt(parent), zAt(parent)) ? parent : cell;
    return target.set(xAt(index), position.y, zAt(index));
  }

  return { update, next, canCross, invalidate: () => { untilUpdate = 0; } };
}

function addFracture(part, points, z, ink) {
  const fracture = new THREE.Group();
  fracture.name = 'Robot fracture';
  fracture.visible = false;
  part.add(fracture);
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1];
    const [endX, endY] = points[i];
    const segment = box(fracture, [Math.hypot(endX - x, endY - y) + .012, .026, .015], ink,
      (x + endX) / 2, (y + endY) / 2, z);
    segment.rotation.z = Math.atan2(endY - y, endX - x);
  }
}

function createGuard(parent, surfaces) {
  const body = new THREE.Group();
  body.name = 'Security guard';
  parent.add(body);
  const chassis = new THREE.Group();
  body.add(chassis);
  const visor = glow(0xff8a61);
  const legs = [];
  const arms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.name = 'Robot leg';
    leg.position.set(side * .19, .74, 0);
    chassis.add(leg);
    box(leg, [.17, .44, .19], surfaces.frame, 0, -.23, 0);
    box(leg, [.20, .29, .23], surfaces.shell, 0, -.44, .045);
    box(leg, [.23, .11, .31], surfaces.trim, 0, -.67, .08);
    legs.push(leg);

    const arm = new THREE.Group();
    arm.name = 'Robot arm';
    arm.position.set(side * .46, 1.31, 0);
    chassis.add(arm);
    box(arm, [.29, .28, .38], surfaces.shell, 0, -.03, 0);
    box(arm, [.16, .35, .20], surfaces.frame, 0, -.29, .01);
    box(arm, [.17, .22, .22], surfaces.trim, 0, -.47, .02);
    arms.push(arm);
  }
  const torso = new THREE.Group();
  torso.name = 'Robot torso';
  torso.position.y = 1.13;
  const head = new THREE.Group();
  head.name = 'Robot head';
  head.position.y = 1.65;
  chassis.add(torso, head);
  box(torso, [.58, .18, .36], surfaces.frame, 0, -.34, 0);
  box(torso, [.68, .49, .43], surfaces.shell);
  box(torso, [.43, .26, .07], surfaces.frame, 0, .02, .248);
  box(torso, [.25, .046, .018], visor, 0, .02, .294);
  box(torso, [.22, .12, .22], surfaces.trim, 0, .30, 0);
  const armor = box(torso, [.63, .23, .064], surfaces.copper, 0, .17, .27);
  box(head, [.51, .35, .42], surfaces.shell);
  box(head, [.50, .16, .068], surfaces.frame, 0, -.01, .23);
  box(head, [.37, .074, .018], visor, 0, 0, .269);
  box(head, [.043, .24, .043], surfaces.trim, .18, .26, -.08);
  box(head, [.059, .066, .059], visor, .18, .402, -.08);
  const split = [[-.29, .21], [-.16, .12], [-.07, .17], [.01, -.02], [.13, .015], [.22, -.17], [.33, -.20]];
  addFracture(torso, split, .31, surfaces.fracture);
  addFracture(torso, split, -.22, surfaces.fracture);
  addFracture(head, [[-.19, .17], [-.095, .07], [-.13, .01], [.025, -.05], [.09, -.17]], .282, surfaces.fracture);
  const warning = mesh(body, surfaces.ringShape,
    new THREE.MeshBasicMaterial({ color: 0xff4a58, transparent: true, depthWrite: false, opacity: .6 }), 0, .038, 0);
  warning.rotation.x = -Math.PI / 2;
  const proxy = box(body, [1.16, 2.07, .95], surfaces.hidden, 0, 1.03, 0);
  body.visible = warning.visible = false;
  return { body, chassis, proxy, legs, arms, torso, head, visor, armor, warning, alive: false };
}

function createGuardWrecks(layer, surfaces, reducedMotion, addLooseProp) {
  const fractureTime = .34;
  const breakTime = reducedMotion ? .58 : .82;
  const settleTime = fractureTime + breakTime;
  const wreckTime = addLooseProp ? settleTime : settleTime + 2.15;
  const wrecks = [];
  const rotation = new THREE.Matrix4();
  const partAtRest = new THREE.Matrix4();
  const tiltedBounds = new THREE.Box3();
  const droppedBounds = new THREE.Box3();
  const drift = [
    [-.77, .18, -.9, .2], [.76, .15, .9, -.2],
    [-.53, -.45, -1.5, .4], [.54, -.48, 1.45, -.4],
    [.03, .37, 1.12, 0], [.35, .70, -.9, .6],
  ];
  const sparkShape = new THREE.BoxGeometry(.032, .034, .23);
  const sparkInk = glow(0xffb558);

  function start(guard) {
    const body = new THREE.Group();
    body.name = 'Robot wreckage';
    body.position.copy(guard.body.position);
    body.rotation.copy(guard.body.rotation);
    body.scale.copy(guard.body.scale);
    const parts = [...guard.arms, ...guard.legs, guard.torso, guard.head].map((original, index) => {
      const part = original.clone();
      const home = part.position.clone().add(guard.chassis.position);
      const initial = part.rotation.clone();
      part.position.set(0, 0, 0);
      part.rotation.set(0, 0, 0);
      const bounds = new THREE.Box3().setFromObject(part);
      part.position.copy(home);
      part.rotation.copy(initial);
      part.traverse(node => {
        if (node.name === 'Robot fracture') node.visible = true;
        if (node.material === guard.visor) node.material = surfaces.inactiveVisor;
      });
      body.add(part);
      const [x, z, pitch, roll] = drift[index];
      return { part, home, initial, bounds, x, z, pitch, roll };
    });
    const sparks = Array.from({ length: reducedMotion ? 0 : 8 }, (_, index) => {
      const chip = mesh(body, sparkShape, sparkInk);
      const angle = index * Math.PI * .764;
      chip.visible = false;
      return { chip, x: Math.cos(angle), z: Math.sin(angle), angle, rise: 1 + index % 4 * .27 };
    });
    layer.add(body);
    wrecks.push({ age: 0, body, parts, sparks });
  }

  function draw(wreck) {
    const progress = Math.min(1, Math.max(0, (wreck.age - fractureTime) / breakTime));
    const travel = 1 - (1 - progress) ** 2;
    const jitter = !reducedMotion && progress === 0 ? Math.sin(wreck.age * 56) * .026 : 0;
    const spread = reducedMotion ? .63 : 1.24;
    for (const { part, home, initial, bounds, x, z, pitch, roll } of wreck.parts) {
      part.rotation.set(initial.x + (pitch - initial.x) * travel,
        initial.y + x * travel, initial.z + (roll - initial.z) * travel + jitter);
      rotation.makeRotationFromEuler(part.rotation);
      const floor = .018 - tiltedBounds.copy(bounds).applyMatrix4(rotation).min.y;
      const arc = Math.sin(progress * Math.PI) * (reducedMotion ? .09 : .36);
      part.position.set(home.x + x * spread * travel, Math.max(floor, home.y * (1 - travel) + floor * travel + arc),
        home.z + z * spread * travel);
    }
    const sparkTime = wreck.age - fractureTime;
    for (const { chip, x, z, angle, rise } of wreck.sparks) {
      chip.visible = sparkTime >= 0 && sparkTime < .48;
      if (!chip.visible) continue;
      chip.position.set(x * sparkTime * 3.1, Math.max(.06, 1.2 + rise * sparkTime - 7.5 * sparkTime ** 2), z * sparkTime * 3.1);
      chip.rotation.set(.3 + sparkTime * 5, angle, .4 + angle * .23);
      chip.scale.z = 1.2 - sparkTime * 2;
    }
  }

  function dropParts({ body, parts }) {
    body.updateMatrix();
    const footprint = new THREE.Box3();
    const drops = parts.map(({ part }) => {
      part.updateMatrix();
      partAtRest.multiplyMatrices(body.matrix, part.matrix);
      part.removeFromParent();
      partAtRest.decompose(part.position, part.quaternion, part.scale);

      // Keep the final orientation while centering the pickup's bounds on the floor.
      droppedBounds.setFromObject(part, true);
      footprint.union(droppedBounds);
      const home = droppedBounds.getCenter(new THREE.Vector3());
      const size = droppedBounds.getSize(new THREE.Vector3());
      home.y = droppedBounds.min.y;
      part.position.sub(home);
      home.y = .018;
      return { name: part.name, visual: part, home, shape: size.toArray(), material: 'robot-metal' };
    });
    const { minX, maxX, minZ, maxZ } = FUN_ARENA_BOUNDS;
    const moveX = THREE.MathUtils.clamp(0, minX - footprint.min.x, maxX - footprint.max.x);
    const moveZ = THREE.MathUtils.clamp(0, minZ - footprint.min.z, maxZ - footprint.max.z);
    for (const drop of drops) {
      drop.home.x += moveX;
      drop.home.z += moveZ;
      addLooseProp(drop);
    }
  }

  function update(delta) {
    for (let i = wrecks.length - 1; i >= 0; i--) {
      const wreck = wrecks[i];
      wreck.age += delta;
      if (wreck.age >= wreckTime) {
        if (addLooseProp) {
          draw(wreck);
          dropParts(wreck);
        }
        wreck.body.removeFromParent();
        wrecks.splice(i, 1);
      } else draw(wreck);
    }
  }

  function reset() {
    for (const { body } of wrecks) body.removeFromParent();
    wrecks.length = 0;
  }

  return { start, update, reset };
}

function createProjectile(parent, surfaces) {
  const body = new THREE.Group();
  parent.add(body);
  const coreInk = glow(tools.scatter.core);
  const edgeInk = glow(tools.scatter.color);
  const core = mesh(body, surfaces.orbShape, coreInk);
  const halo = mesh(body, surfaces.haloShape, edgeInk);
  const trail = Array.from({ length: 4 }, (_, index) => {
    const bead = mesh(parent, surfaces.orbShape, edgeInk);
    bead.scale.setScalar(.60 - .10 * index);
    bead.visible = false;
    return bead;
  });
  body.visible = false;
  return { body, core, halo, trail, coreInk, edgeInk, from: new THREE.Vector3(), to: new THREE.Vector3(), active: false };
}

function createBurst(parent, surfaces) {
  const body = new THREE.Group();
  parent.add(body);
  const ink = new THREE.MeshBasicMaterial({ color: tools.scatter.color, transparent: true, depthWrite: false });
  const flash = mesh(body, surfaces.flashShape, ink, 0, .18);
  const inner = mesh(body, surfaces.ringShape, ink);
  const outer = mesh(body, surfaces.ringShape, ink);
  inner.rotation.x = outer.rotation.x = -Math.PI / 2;
  const shards = Array.from({ length: 12 }, (_, index) => {
    const chip = mesh(body, surfaces.chipShape, ink);
    const angle = index * Math.PI * 2 / 12;
    chip.rotation.set(index * .86, angle, index * .35);
    return { chip, x: Math.cos(angle), z: Math.sin(angle), rise: .42 + (index % 4) * .21 };
  });
  body.visible = false;
  return { body, flash, inner, outer, ink, shards };
}

export function createFunEncounter(parent, reducedMotion, furniture, groundImpact, equipmentBlocks, onGuardStrike) {
  const routes = createGuardRoutes((x, z) => furniture?.blocks(x, z, .26) || equipmentBlocks?.(x, z));
  const layer = new THREE.Group();
  parent.add(layer);
  const surfaces = {
    shell: material(0xada89a, { metalness: .35 }), frame: material(0x252e31),
    trim: material(0x62616a, { metalness: .38 }), copper: material(0xc77843, { metalness: .43 }),
    fracture: glow(0xffaa49), inactiveVisor: material(0x41322d),
    hidden: new THREE.MeshBasicMaterial({ visible: false }),
    ringShape: new THREE.RingGeometry(.88, 1, 40), haloShape: new THREE.TorusGeometry(.29, .025, 7, 16),
    orbShape: new THREE.IcosahedronGeometry(.21, 1), flashShape: new THREE.IcosahedronGeometry(1, 1),
    chipShape: new THREE.OctahedronGeometry(.13),
  };
  const guards = Array.from({ length: waveSizes.at(-1) }, () => createGuard(layer, surfaces));
  const addLooseProp = furniture?.addLooseProp ? (part) => furniture.addLooseProp(part) : undefined;
  const wrecks = createGuardWrecks(layer, surfaces, reducedMotion, addLooseProp);
  // Flight can last up to 640 ms, with a new orb every 120 ms.
  const projectiles = Array.from({ length: 7 }, () => createProjectile(layer, surfaces));
  const bursts = Array.from({ length: 8 }, () => createBurst(layer, surfaces));
  const beamShape = new THREE.CylinderGeometry(.035, .055, 1, 8);
  const beams = Array.from({ length: 4 }, () => {
    const ink = new THREE.MeshBasicMaterial({ color: tools.arc.color, transparent: true, depthWrite: false });
    const body = mesh(layer, beamShape, ink);
    body.visible = false;
    return { body, ink, age: 0 };
  });
  const beamAxis = new THREE.Vector3(0, 1, 0);
  const beamDirection = new THREE.Vector3();
  const tracerShape = new THREE.CylinderGeometry(.012, .009, 1, 5);
  const strikeShape = new THREE.OctahedronGeometry(.097);
  const traces = Array.from({ length: 12 }, () => {
    const ink = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
    const body = mesh(layer, tracerShape, ink);
    const strike = mesh(layer, strikeShape, ink);
    body.visible = strike.visible = false;
    return { body, strike, ink, age: 0 };
  });
  const targetRay = new THREE.Raycaster();
  const targetDirection = new THREE.Vector3();
  const targetRight = new THREE.Vector3();
  const targetUp = new THREE.Vector3();
  const traceEnd = new THREE.Vector3();
  const traceDirection = new THREE.Vector3();
  const shotHits = [];
  const teamByTarget = new Map(guards.map(guard => [guard.proxy, guard]));
  let status = 'idle';
  let wave = 0;
  let remaining = 0;
  let shield = 100;
  let cooldown = 0;
  let between = 0;
  let defeated = 0;

  function reset() {
    routes.invalidate();
    status = 'idle';
    wave = remaining = cooldown = between = defeated = 0;
    shield = 100;
    for (const guard of guards) guard.alive = guard.body.visible = guard.warning.visible = false;
    wrecks.reset();
    furniture?.clearLooseProps?.();
    for (const shot of projectiles) {
      shot.active = shot.body.visible = false;
      shot.onImpact = undefined;
      for (const bead of shot.trail) bead.visible = false;
    }
    for (const burst of bursts) burst.body.visible = false;
    for (const beam of beams) beam.body.visible = false;
    for (const { body, strike } of traces) body.visible = strike.visible = false;
  }

  function nextWave() {
    wave += 1;
    remaining = waveSizes[wave - 1];
    if (wave > 1) shield = Math.min(100, shield + 20);
    for (const [index, guard] of guards.entries()) {
      const entry = FUN_ARENA_ENTRIES[index % FUN_ARENA_ENTRIES.length];
      const armored = wave === waveSizes.length && index >= 3;
      guard.alive = index < remaining;
      guard.delay = Math.floor(index / FUN_ARENA_ENTRIES.length) * .45;
      guard.body.visible = guard.alive && guard.delay === 0;
      guard.body.position.set(entry.x, 0, entry.z);
      guard.body.rotation.y = 0;
      guard.body.scale.setScalar(armored ? 1.16 : 1);
      guard.armor.visible = armored;
      guard.health = armored ? 2 : 1;
      guard.warning.visible = false;
      guard.visor.color.setHex(0xff8a61);
      guard.ready = guard.stunned = guard.walk = 0;
      guard.strikeTime = -1;
      guard.strikeSide = index % 2;
      animateGuard(guard, 0, 0);
      guard.speed = 1.32 + wave * .19 + (index % 3) * .10;
    }
  }

  function start() {
    reset();
    status = 'active';
    nextWave();
  }

  function aim(raycaster) {
    if (status !== 'active') return null;
    const proxies = guards.filter((guard) => guard.alive && guard.body.visible).map((guard) => guard.proxy);
    for (const proxy of proxies) proxy.updateWorldMatrix(true, false);
    const [hit] = raycaster.intersectObjects(proxies, false);
    return hit ? hit.object.parent.position.clone().setY(.14) : null;
  }

  function throwOrb(type, origin, target, onImpact) {
    const inCombat = status === 'active' && remaining > 0;
    const practicing = Boolean(target);
    if (!Object.hasOwn(tools, type) || cooldown > 0 || (!inCombat && !practicing)) return false;
    const kind = tools[type];
    if (!target) {
      let distance = Infinity;
      for (const guard of guards) {
        if (!guard.alive || !guard.body.visible) continue;
        const range = flatDistance(origin, guard.body.position);
        if (range < distance) {
          target = guard.body.position;
          distance = range;
        }
      }
    }
    if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.z)) return false;
    if (kind.motion === 'beam') {
      fireArc(origin, target, kind, Boolean(onImpact));
      cooldown = kind.fireInterval;
      onImpact?.();
      return true;
    }
    const shot = projectiles.find(({ active }) => !active);
    if (!shot) return false;
    shot.type = type;
    shot.age = 0;
    shot.onImpact = onImpact;
    shot.active = shot.body.visible = true;
    shot.from.copy(origin);
    const bolt = kind.motion === 'bolt';
    shot.to.set(THREE.MathUtils.clamp(target.x, -9.1, 9.1), onImpact ? target.y : bolt ? 1.02 : .13, THREE.MathUtils.clamp(target.z, -8.4, 8.25));
    shot.duration = bolt ? .16 : Math.min(.64, .36 + flatDistance(shot.from, shot.to) * .025);
    shot.coreInk.color.setHex(kind.core);
    shot.edgeInk.color.setHex(kind.color);
    shot.core.scale.setScalar(bolt ? .62 : type === 'training' ? .77 : kind.effect ? 1.27 : 1);
    shot.halo.visible = !bolt;
    shot.halo.scale.setScalar(kind.effect ? 1.55 : type === 'copper' ? 1.30 : 1);
    shot.body.position.copy(shot.from);
    cooldown = kind.fireInterval ?? orbFireInterval;
    return true;
  }

  function drawTrace(from, to, color, hit) {
    const trace = traces.find(({ body }) => !body.visible);
    if (!trace) return;
    traceDirection.subVectors(to, from);
    const length = traceDirection.length();
    if (length < .02) return;
    trace.ink.color.setHex(color);
    trace.ink.opacity = reducedMotion ? .40 : .88;
    trace.age = 0;
    trace.body.position.lerpVectors(from, to, .5);
    trace.body.quaternion.setFromUnitVectors(beamAxis, traceDirection.normalize());
    trace.body.scale.y = length;
    trace.strike.position.copy(to);
    trace.strike.visible = hit && !reducedMotion;
    trace.body.visible = true;
  }

  function shootFirearm(type, raycaster, maxDistance, impact, muzzle) {
    if (!isFunFirearm(type) || cooldown > 0 || !Number.isFinite(maxDistance) || maxDistance <= .05) return false;
    const weapon = funFirearms[type];
    const { origin, direction } = raycaster.ray;
    targetRight.crossVectors(direction, beamAxis).normalize();
    targetUp.crossVectors(targetRight, direction).normalize();
    targetRay.far = maxDistance;
    const targets = [];
    if (status === 'active') for (const { body, alive, proxy } of guards) {
      if (!alive || !body.visible) continue;
      proxy.updateWorldMatrix(true, false);
      targets.push(proxy);
    }

    const hits = new Map();
    let clearCenter = false;
    for (const [index, [across, rise]] of weapon.pellets.entries()) {
      targetDirection.copy(direction).addScaledVector(targetRight, across).addScaledVector(targetUp, rise).normalize();
      targetRay.set(origin, targetDirection);
      shotHits.length = 0;
      const [hit] = targetRay.intersectObjects(targets, false, shotHits);
      if (hit) {
        const guard = teamByTarget.get(hit.object);
        hits.set(guard, (hits.get(guard) ?? 0) + 1);
      }
      if (!index) clearCenter = !hit;
      const end = hit?.point ?? targetRay.ray.at(maxDistance, traceEnd);
      drawTrace(muzzle ?? origin, end, weapon.color, Boolean(hit || !index));
    }
    cooldown = weapon.interval;
    for (const [guard, count] of hits) damageGuard(guard, Math.min(count, 2), .16);
    if (clearCenter) impact?.();
    return true;
  }

  function pulse(position, radius, color, type) {
    const burst = bursts.find(({ body }) => !body.visible);
    if (!burst) return;
    burst.body.position.set(position.x, .046, position.z);
    burst.body.visible = true;
    burst.ink.color.setHex(color);
    burst.ink.opacity = .74;
    burst.radius = radius;
    burst.age = 0;
    burst.type = type;
  }

  function disable(guard) {
    if (!guard.alive) return;
    wrecks.start(guard);
    guard.alive = guard.body.visible = guard.warning.visible = false;
    remaining -= 1;
    defeated += 1;
    pulse(guard.body.position, .66, 0xc1fff2, 'offline');
  }

  function damageGuard(guard, damage, stun) {
    guard.health -= damage;
    if (guard.health <= 0) disable(guard);
    else {
      guard.stunned = stun;
      guard.strikeTime = -1;
      guard.warning.visible = false;
    }
  }

  function closestGuard(position, radius, exclude) {
    let closest;
    for (const guard of guards) {
      if (guard === exclude || !guard.alive || !guard.body.visible) continue;
      const distance = flatDistance(guard.body.position, position);
      if (distance > radius) continue;
      radius = distance;
      closest = guard;
    }
    return closest;
  }

  function flashBeam(from, to) {
    const beam = beams.find(({ body }) => !body.visible);
    beamDirection.subVectors(to, from);
    const length = beamDirection.length();
    if (!beam || length < .02) return;
    beam.body.visible = true;
    beam.body.position.lerpVectors(from, to, .5);
    beam.body.quaternion.setFromUnitVectors(beamAxis, beamDirection.normalize());
    beam.body.scale.set(1, length, 1);
    beam.ink.opacity = .95;
    beam.age = 0;
  }

  function fireArc(origin, target, kind, directHit) {
    const first = status === 'active' && !directHit ? closestGuard(target, kind.radius) : undefined;
    const firstPoint = (first?.body.position ?? target).clone();
    if (!directHit) firstPoint.y = 1.07;
    flashBeam(origin, firstPoint);
    if (!first) return;
    const second = closestGuard(firstPoint, 3.10, first);
    for (const guard of [first, second]) {
      if (!guard) continue;
      const point = guard.body.position.clone().setY(1.07);
      if (guard === second) flashBeam(firstPoint, point);
      pulse(point, .79, kind.color, 'arc');
      damageGuard(guard, 1, kind.stun);
    }
  }

  function land(shot) {
    const kind = tools[shot.type];
    pulse(shot.to, kind.radius, kind.color, kind.effect ?? shot.type);
    if (!shot.onImpact && kind.motion !== 'bolt') groundImpact?.(shot.to, kind.radius);
    if (status === 'active') {
      for (const guard of guards) {
        if (!guard.alive || !guard.body.visible) continue;
        const distance = flatDistance(guard.body.position, shot.to);
        if (distance > kind.radius) continue;
        const damage = kind.strongRadius > 0 && distance <= kind.strongRadius ? 2 : 1;
        damageGuard(guard, damage, kind.stun);
      }
    }
    shot.active = shot.body.visible = false;
    for (const bead of shot.trail) bead.visible = false;
    const impact = shot.onImpact;
    shot.onImpact = undefined;
    impact?.();
  }

  function propImpact(position, paused, item = 'Chair') {
    if (status !== 'active' || paused) return false;
    const guard = closestGuard(position, item === 'Box' ? 1.06 : .98);
    if (!guard || position.y > 2.18) return false;
    if (item === 'Box') damageGuard(guard, 1, 1.65);
    else disable(guard);
    return true;
  }

  const propRay = new THREE.Ray();
  const guardFeet = new THREE.Vector3();
  const guardShoulders = new THREE.Vector3();
  const nearestFlightPoint = new THREE.Vector3();

  function sweepPropImpact(from, to, paused, item = 'Chair') {
    if (status !== 'active' || paused) return 0;
    propRay.origin.copy(from);
    propRay.direction.subVectors(to, from);
    const length = propRay.direction.length();
    if (length === 0) return 0;
    propRay.direction.divideScalar(length);
    const propRadius = item === 'Box' ? .34 : item === 'Chair' ? .25 : .18;
    let hits = 0;
    for (const guard of guards) {
      if (!guard.alive || !guard.body.visible) continue;
      const { position, scale } = guard.body;
      guardFeet.copy(position).y += .37 * scale.y;
      guardShoulders.copy(position).y += 1.62 * scale.y;
      let distanceSq = propRay.distanceSqToSegment(guardFeet, guardShoulders, nearestFlightPoint);
      if (nearestFlightPoint.distanceToSquared(from) > length * length) {
        guardFeet.y = THREE.MathUtils.clamp(to.y, guardFeet.y, guardShoulders.y);
        distanceSq = to.distanceToSquared(guardFeet);
      }
      if (distanceSq <= (.50 * scale.x + propRadius) ** 2) {
        disable(guard);
        hits += 1;
      }
    }
    return hits;
  }

  function arc(shot, position, progress) {
    position.lerpVectors(shot.from, shot.to, progress);
    if (tools[shot.type].motion !== 'bolt') position.y += Math.sin(Math.PI * progress) * (reducedMotion ? .40 : 1.23);
  }

  function updateEffects(delta) {
    for (const trace of traces) {
      if (!trace.body.visible) continue;
      trace.age += delta;
      trace.ink.opacity = (reducedMotion ? .4 : .88) * Math.max(0, 1 - trace.age / .10);
      if (trace.age >= .10) trace.body.visible = trace.strike.visible = false;
    }
    for (const beam of beams) {
      if (!beam.body.visible) continue;
      beam.age += delta;
      beam.body.visible = beam.age < .28;
      beam.ink.opacity = .95 * Math.max(0, 1 - beam.age / .28);
    }
    for (const shot of projectiles) {
      if (!shot.active) continue;
      shot.age += delta;
      const progress = shot.age / shot.duration;
      if (progress >= 1) { land(shot); continue; }
      arc(shot, shot.body.position, progress);
      if (reducedMotion) continue;
      shot.halo.rotation.set(shot.age * 5.5, shot.age * 6.2, 0);
      for (const [index, bead] of shot.trail.entries()) {
        const lag = progress - (index + 1) * .065;
        bead.visible = lag >= 0;
        if (bead.visible) arc(shot, bead.position, lag);
      }
    }
    for (const burst of bursts) {
      if (!burst.body.visible) continue;
      burst.age += delta;
      const lingering = burst.type === 'copper' || burst.type === 'cryo';
      const duration = lingering ? 1.15 : .65;
      const progress = burst.age / duration;
      if (progress >= 1) { burst.body.visible = false; continue; }
      const size = burst.radius * (reducedMotion ? .84 : 1 - (1 - progress) ** 3);
      burst.ink.opacity = .78 * (1 - progress);
      burst.outer.scale.setScalar(Math.max(.02, size));
      burst.inner.scale.setScalar(Math.max(.02, size * .64));
      burst.inner.visible = lingering;
      burst.flash.visible = burst.type === 'scatter' && !reducedMotion && progress < .27;
      burst.flash.scale.setScalar(.32 + progress * 1.35);
      for (const { chip, x, z, rise } of burst.shards) {
        const frozen = burst.type === 'cryo';
        chip.visible = !reducedMotion && (frozen || burst.type === 'scatter' || burst.type === 'offline');
        chip.position.set(x * size, .22 + Math.sin(progress * Math.PI) * rise * (frozen ? .50 : 1), z * size);
        const scale = 1 - progress * .7;
        chip.scale.set(scale, frozen ? scale * 2.7 : scale, scale);
      }
    }
  }

  function animateGuard(guard, delta, speed) {
    guard.walk += delta * speed * 6.6;
    const stride = reducedMotion ? 0 : Math.sin(guard.walk) * Math.min(.49, speed * .31);
    guard.chassis.position.y = reducedMotion ? 0 : Math.abs(stride) * .105;
    guard.chassis.position.z = 0;
    guard.legs[0].rotation.x = stride;
    guard.legs[1].rotation.x = -stride;
    guard.arms[0].rotation.x = -stride * .65;
    guard.arms[1].rotation.x = stride * .65;
    for (const arm of guard.arms) arm.rotation.z = 0;
  }

  function animateStrike(guard) {
    const time = guard.strikeTime;
    const load = THREE.MathUtils.smoothstep(time, 0, strikeWindup);
    const extend = THREE.MathUtils.smoothstep(time, strikeWindup, strikeContact);
    const recover = THREE.MathUtils.smoothstep(time, strikeContact, strikeDuration);
    const reach = extend * (1 - recover);
    animateGuard(guard, 0, 0);
    const arm = guard.arms[guard.strikeSide];
    arm.rotation.x = .93 * load * (1 - extend) - 1.57 * reach;
    arm.rotation.z = (guard.strikeSide ? -1 : 1) * .19 * reach;
    guard.chassis.position.z = reducedMotion ? .18 * reach : -.12 * load * (1 - extend) + .36 * reach;
    guard.warning.visible = time < strikeContact;
    if (guard.warning.visible) guard.warning.scale.setScalar(strikeRange * (reducedMotion ? 1 : .72 + .28 * load));
  }

  function moveGuard(guard, delta, player, highGround) {
    const position = guard.body.position;
    const dx = player.x - position.x;
    const dz = player.z - position.z;
    const range = Math.hypot(dx, dz);
    if (guard.delay > 0) {
      guard.delay -= delta;
      if (guard.delay <= 0) guard.body.visible = true;
      return;
    }
    guard.stunned = Math.max(0, guard.stunned - delta);
    guard.ready = Math.max(0, guard.ready - delta);
    if (highGround && guard.strikeTime >= 0) {
      guard.strikeTime = -1;
      guard.warning.visible = false;
    }
    guard.visor.color.setHex(guard.stunned ? 0x86f6f0 : guard.strikeTime >= 0 ? 0xff515e : 0xff8a61);
    if (guard.stunned) { animateGuard(guard, delta, 0); return; }

    if (guard.strikeTime >= 0) {
      const previous = guard.strikeTime;
      guard.strikeTime += delta;
      if (previous < strikeWindup) guard.body.rotation.y = Math.atan2(dx, dz);
      animateStrike(guard);
      if (previous < strikeContact && guard.strikeTime >= strikeContact) {
        guard.ready = 1.16;
        const facing = Math.cos(Math.atan2(dx, dz) - guard.body.rotation.y) > .80;
        if (shield > 0 && facing && range <= strikeRange && routes.canCross(position.x, position.z, player.x, player.z)) {
          shield = Math.max(0, shield - 12 - 2 * wave);
          onGuardStrike?.();
        }
      }
      if (guard.strikeTime >= strikeDuration) guard.strikeTime = -1;
      return;
    }
    if (!highGround && range < strikeStartRange && routes.canCross(position.x, position.z, player.x, player.z)) {
      guard.body.rotation.y = Math.atan2(dx, dz);
      if (guard.ready === 0) {
        guard.strikeSide = 1 - guard.strikeSide;
        guard.strikeTime = 0;
        animateStrike(guard);
      } else {
        animateGuard(guard, delta, 0);
      }
      return;
    }

    const target = routes.next(position, player);
    const moveX = target.x - position.x;
    const moveZ = target.z - position.z;
    const distance = Math.hypot(moveX, moveZ);
    if (distance === 0) { animateGuard(guard, delta, 0); return; }
    const fraction = Math.min(1, guard.speed * delta / distance);
    position.x += moveX * fraction;
    position.z += moveZ * fraction;
    guard.body.rotation.y = Math.atan2(moveX, moveZ);
    animateGuard(guard, delta, guard.speed);
  }

  function update(delta, playerPosition, paused = false, highGround = false) {
    if (paused) return;
    updateEffects(delta);
    wrecks.update(delta);
    cooldown = Math.max(0, cooldown - delta);
    if (status !== 'active') return;
    if (remaining === 0) {
      between += delta;
      if (wave === waveSizes.length) { status = 'won'; return; }
      if (between >= 1.05) { between = 0; nextWave(); }
      return;
    }
    routes.update(playerPosition, delta);
    for (const guard of guards) if (guard.alive) moveGuard(guard, delta, playerPosition, highGround);
    if (shield === 0) {
      status = 'lost';
      for (const guard of guards) guard.warning.visible = false;
    }
  }

  return { start, reset, update, throwOrb, shootFirearm, aim, propImpact,
    sweepPropImpact,
    snapshot: () => ({ status, wave, waves: waveSizes.length, remaining, shield, cooldown, defeated, total }),
  };
}
