import * as THREE from './vendor/three.module.js';
import { glow, mesh, panel, tube } from './models.js';

export function createFunDamage(parent, targets, { liquid, shell }, powerAssembly, reducedMotion, assemblies = []) {
  const group = new THREE.Group();
  group.name = 'Lab damage effects';
  parent.add(group);
  const labels = ['Power offline', 'Tank shattered', 'Filter broken', 'Reactor offline'];
  const devices = targets.map((target, index) => {
    const { x, y, z } = target.position;
    const front = z + target.geometry.parameters.depth / 2 + .035;
    const sign = panel(group, 1.05, .24, x, y + .45, front + .035);
    sign.draw(labels[index], '', '#ffd6ae', '#49271b');
    sign.face.visible = false;
    const scratch = new THREE.BufferGeometry().setFromPoints([
      [-.28,.21],[-.07,.03],[-.07,.03],[.09,.12],[.09,.12],[.23,-.16],[-.07,.03],[-.19,-.20],
    ].map(([dx, dy]) => new THREE.Vector3(x + dx, y + dy, front)));
    const fracture = new THREE.LineSegments(scratch, new THREE.LineBasicMaterial({ color: 0xffb578 }));
    fracture.visible = false;
    group.add(fracture);
    return { target, sign, fracture, front, hits: 0 };
  });
  // Animate the original components so the funnel, rim, casing and vents remain recognizable.
  const breakables = assemblies.map(assembly => ({
    time: 0, pieces: assembly.children.filter(part => part.isMesh).map(part => ({
      part, start: part.position.clone(), angle: part.rotation.clone(),
    })),
  }));
  function scatter(index, elapsed) {
    const rig = breakables[index];
    rig.pieces.forEach(({part,start,angle}, i) => {
      const direction = i * 2.4 + index;
      const distance = elapsed * (0.45 + i % 4 * .27);
      part.position.set(start.x + Math.cos(direction)*distance,
        Math.max(.12, start.y + elapsed*(1.6 + i%3*.35) - 3.7*elapsed*elapsed),
        start.z + Math.sin(direction)*distance + elapsed*.55);
      part.rotation.set(angle.x + elapsed*(1+i%3), angle.y+elapsed*direction, angle.z+elapsed*.7);
    });
  }
  const disk = new THREE.CircleGeometry(1, 28);
  const rim = new THREE.RingGeometry(.77, 1, 28);
  const maxMarks = 14;
  const makeMarks = (shape, color, opacity) => {
    const ink = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    const batch = new THREE.InstancedMesh(shape.clone().rotateX(-Math.PI / 2), ink, maxMarks);
    batch.count = 0;
    batch.frustumCulled = false;
    group.add(batch);
    return batch;
  };
  const marks = makeMarks(disk, 0x1c1717, .65);
  marks.name = 'Orb scorch marks';
  const outlines = makeMarks(rim, 0x7d4937, .54);
  const stamp = new THREE.Object3D();
  const markSlots = Array(maxMarks).fill(null);
  let nextMark = 0;
  const supply = devices[0];
  const smoke = new THREE.Group();
  smoke.name = 'Power supply smoke';
  group.add(smoke);
  const puffs = Array.from({ length: 7 }, () => {
    const puff = mesh(smoke, new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x9a9891, transparent: true, depthWrite: false }));
    return puff;
  });
  const debris = new THREE.Group();
  debris.name = 'Power supply debris';
  group.add(debris);
  const fragmentsPower = Array.from({ length: 9 }, (_, i) => mesh(debris,
    new THREE.BoxGeometry(.16 + i % 3 * .06, .09 + i % 4 * .035, .15 + i % 5 * .04),
    new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x8d6b51 : 0x4d5a54, metalness: .32, roughness: .55 })));
  const flash = mesh(group, new THREE.IcosahedronGeometry(.50, 2), glow(0xffcd7b), supply.target.position.x, 1.36, supply.front);
  let powerTime = Infinity;
  let smokeTime = 0;
  const tank = devices[1];
  const chip = new THREE.BufferGeometry();
  chip.setAttribute('position', new THREE.Float32BufferAttribute([-.65,-.35,0, .51,-.50,0, .10,.71,0], 3));
  chip.computeVertexNormals();
  const glassInk = new THREE.MeshStandardMaterial({
    color: 0xb8e7ee, side: THREE.DoubleSide, transparent: true, opacity: .82, metalness: .32, roughness: .18,
    emissive: 0x477681, emissiveIntensity: .42,
  });
  const shards = new THREE.InstancedMesh(chip, glassInk, 72);
  shards.name = 'Shattered tank glass';
  shards.frustumCulled = false;
  shards.visible = false;
  group.add(shards);
  const fragments = Array.from({ length: shards.count }, (_, i) => {
    const side = i % 4;
    const lateral = ((i * 17) % 37) / 36 - .5;
    const row = ((i * 13) % 31) / 30;
    const end = side === 0 || side === 2;
    const sign = side < 2 ? 1 : -1;
    return {
      x: tank.target.position.x + (end ? lateral * 1.82 : sign * .92),
      y: 1.08 + row * .94,
      z: tank.target.position.z + (end ? sign * .50 : lateral * .98),
      vx: (end ? lateral * 2.6 : sign * 1.8) + Math.sin(i * 2.4) * .7,
      vy: .27 + row * 1.15,
      vz: (end ? sign * (1.5 + row) : lateral * 1.25) + .55,
      size: .08 + (i % 9) * .014,
    };
  });
  const leakX = tank.target.position.x + .34;
  const leakZ = tank.front + .05;
  const liquidColor = liquid.material.color.clone();
  const spillInk = new THREE.MeshBasicMaterial({ color: 0x65d5e8, transparent: true, opacity: .57, depthWrite: false });
  const stream = tube(group, [[leakX, 1.29, leakZ], [leakX, .83, leakZ + .19], [leakX + .09, .09, leakZ + .43]], .045, spillInk);
  stream.name = 'Tank leak stream';
  const puddle = mesh(group, disk, spillInk, leakX + .10, .012, leakZ + .48);
  puddle.rotation.x = -Math.PI / 2;
  const crater = new THREE.Group();
  crater.name = 'Gel crater';
  group.add(crater);
  crater.position.set(leakX + .12, .022, leakZ + .57);
  mesh(crater, disk, new THREE.MeshBasicMaterial({ color: 0x101817 })).rotation.x = -Math.PI / 2;
  mesh(crater, rim, glow(0xa7d361), 0, .004, 0).rotation.x = -Math.PI / 2;
  const particles = new Float32Array(36 * 3);
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(particles, 3);
  geometry.setAttribute('position', attribute);
  const ink = new THREE.PointsMaterial({ color: 0xffc18c, size: .083, transparent: true, depthWrite: false });
  const sparks = new THREE.Points(geometry, ink);
  sparks.frustumCulled = false;
  group.add(sparks);
  let struck;
  let impactTime = 0;
  let spill = null;
  let spillTime = 0;
  let glassTime = Infinity;

  function updateGlass(delta) {
    if (!shards.visible || glassTime >= 1.7) return;
    glassTime = Math.min(1.7, glassTime + delta);
    const time = reducedMotion ? 1.7 : glassTime;
    for (const [i, piece] of fragments.entries()) {
      const landing = (piece.vy + Math.sqrt(piece.vy ** 2 + 19.6 * (piece.y - .04))) / 9.8;
      const flight = Math.min(time, landing);
      const slide = Math.min(.25, Math.max(0, time - landing)) * .27;
      stamp.position.set(piece.x + piece.vx * (flight + slide),
        Math.max(.04 + (i % 4) * .006, piece.y + piece.vy * flight - 4.9 * flight * flight),
        piece.z + piece.vz * (flight + slide));
      stamp.rotation.set(time >= landing ? Math.PI / 2 : flight * (4 + i % 5), i * 2.4, flight * (3 + i % 4));
      stamp.scale.set(piece.size, piece.size, piece.size);
      stamp.updateMatrix();
      shards.setMatrixAt(i, stamp.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;
  }

  function reset() {
    for (const rig of breakables) {
      rig.time = 0;
      for (const {part,start,angle} of rig.pieces) { part.position.copy(start); part.rotation.copy(angle); }
    }
    struck = spill = null;
    stream.visible = puddle.visible = crater.visible = sparks.visible = false;
    liquid.scale.y = 1;
    liquid.position.y = .50;
    liquid.material.color.copy(liquidColor);
    shell.visible = true;
    glassTime = Infinity;
    shards.visible = false;
    powerAssembly.visible = true;
    smoke.visible = debris.visible = flash.visible = false;
    powerTime = Infinity;
    smokeTime = 0;
    supply.sign.draw('Power offline', '', '#ffd6ae', '#49271b');
    for (const { sign, fracture } of devices) sign.face.visible = fracture.visible = false;
    for (const device of devices) device.hits = 0;
    marks.count = outlines.count = 0;
    markSlots.fill(null);
    nextMark = 0;
  }
  reset();

  function mark(position, radius) {
    const index = nextMark;
    nextMark = (nextMark + 1) % maxMarks;
    const entry = { x: position.x, z: position.z, size: Math.min(1.3, radius * .46), born: performance.now() };
    markSlots[index] = entry;
    drawMark(index, entry, 1);
    marks.count = outlines.count = Math.max(marks.count, index + 1);
    marks.instanceMatrix.needsUpdate = outlines.instanceMatrix.needsUpdate = true;
  }

  function drawMark(index, entry, fraction) {
    stamp.position.set(entry.x, .007 + index * .0004, entry.z);
    const size = entry.size * fraction;
    stamp.scale.set(size, 1, size * .78);
    stamp.rotation.set(0, index * .57, 0);
    stamp.updateMatrix();
    marks.setMatrixAt(index, stamp.matrix);
    stamp.position.y += .002;
    stamp.updateMatrix();
    outlines.setMatrixAt(index, stamp.matrix);
  }

  function ageMarks(now) {
    let changed = false;
    for (let index = 0; index < marks.count; index++) {
      const entry = markSlots[index];
      if (!entry || now - entry.born < 26_000) continue;
      const fraction = Math.max(0, (30_000 - (now - entry.born)) / 4_000);
      drawMark(index, entry, fraction);
      if (fraction === 0) markSlots[index] = null;
      changed = true;
    }
    if (!changed) return;
    while (marks.count && !markSlots[marks.count - 1]) marks.count -= 1;
    outlines.count = marks.count;
    marks.instanceMatrix.needsUpdate = outlines.instanceMatrix.needsUpdate = true;
  }

  function hit(index, gel = false) {
    const device = devices[index];
    if (index !== 1 && device.hits >= 2) return;
    device.hits += 1;
    device.sign.face.visible = true;
    device.fracture.visible = index !== 1 && device.hits === 1;
    struck = device;
    impactTime = 0;
    if (index === 0) {
      const destroyed = device.hits === 2;
      smoke.visible = !destroyed;
      device.sign.draw(destroyed ? 'Power destroyed' : 'Power smoking', '', '#ffd6ae', '#49271b');
      if (destroyed) {
        powerAssembly.visible = false;
        debris.visible = true;
        powerTime = 0;
      }
    }
    if (index >= 2) device.sign.draw(device.hits === 1 ? 'Casing cracked' : labels[index], '', '#ffd6ae', '#49271b');
    if (index === 1 && (!spill || gel && spill !== 'gel')) {
      if (shell.visible) {
        glassTime = 0;
        shards.visible = true;
        updateGlass(0);
      }
      shell.visible = false;
      spill = gel ? 'gel' : 'water';
      spillTime = 0;
      spillInk.color.setHex(gel ? 0xb4f176 : 0x65d5e8);
      if (gel) liquid.material.color.setHex(0xa7e955);
    }
  }

  function update(delta) {
    if (marks.count) ageMarks(performance.now());
    breakables.forEach((rig, i) => {
      if (devices[i+2].hits < 2 || rig.time >= 1.15) return;
      rig.time = reducedMotion ? 1.15 : Math.min(1.15, rig.time + delta);
      scatter(i, rig.time);
    });
    updateGlass(delta);
    if (smoke.visible) {
      smokeTime += delta;
      for (const [i, puff] of puffs.entries()) {
        const phase = ((reducedMotion ? 0 : smokeTime * .66) + i / puffs.length) % 1;
        puff.position.set(supply.target.position.x + Math.sin(i * 2.4 + phase * 3) * phase * .24,
          1.58 + phase * 1.05, supply.target.position.z + .18 + phase * .16);
        puff.scale.setScalar(.09 + phase * .25);
        puff.material.opacity = .42 * (1 - phase);
      }
    }
    if (powerTime < 1.1) {
      powerTime = Math.min(1.1, powerTime + delta);
      flash.visible = !reducedMotion && powerTime < .19;
      flash.scale.setScalar(.55 + powerTime * 3);
      const age = reducedMotion ? 1.1 : powerTime;
      for (const [i, piece] of fragmentsPower.entries()) {
        const angle = i * 2.4;
        const speed = 1.2 + i % 4 * .44;
        const distance = Math.min(age, .82) * speed;
        piece.position.set(supply.target.position.x + Math.cos(angle) * distance,
          Math.max(.09, 1.26 + (1 + i % 3 * .36) * age - 5.9 * age ** 2),
          supply.front + .20 + Math.sin(angle) * distance);
        piece.rotation.set(i + age * (i % 4 + 1), angle, age * 3);
      }
    }
    if (spill && spillTime < 4.2) {
      spillTime = Math.min(4.2, spillTime + delta);
      const drained = Math.min(1, spillTime / 4.2);
      stream.visible = drained < 1;
      puddle.visible = true;
      puddle.scale.set(.20 + drained * 1.12, .13 + drained * .57, 1);
      liquid.scale.y = 1 - drained * .92;
      liquid.position.y = .50 - drained * .34;
      crater.visible = spill === 'gel' && spillTime > 1.2;
      if (crater.visible) crater.scale.setScalar(Math.min(.96, (spillTime - 1.2) * .53));
    }
    sparks.visible = Boolean(struck && impactTime < .82);
    if (!sparks.visible) return;
    impactTime += delta;
    const age = reducedMotion ? .37 : impactTime;
    const { x, y } = struck.target.position;
    ink.opacity = Math.max(0, 1 - impactTime / .82);
    ink.color.setHex(struck === tank ? spill === 'gel' ? 0xa3f06c : 0xb9efff : 0xffc18c);
    for (let i = 0; i < particles.length / 3; i++) {
      const angle = i * 2.39996;
      const speed = .57 + (i % 7) * .21;
      particles[i * 3] = x + Math.cos(angle) * age * speed;
      particles[i * 3 + 1] = y + Math.sin(angle) * age * speed - age * age * .93;
      particles[i * 3 + 2] = struck.front + age * (.16 + (i % 5) * .23);
    }
    attribute.needsUpdate = true;
  }

  function detach(index) {
    const device = devices[index];
    device.sign.face.visible = device.fracture.visible = false;
    if (struck === device) {
      struck = undefined;
      sparks.visible = false;
    }
    if (index === 0) smoke.visible = false;
  }

  return { hit, mark, update, reset, detach, broken: index => devices[index].hits >= 2, powerDown: () => supply.hits === 2 };
}
