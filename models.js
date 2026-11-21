import * as THREE from './vendor/three.module.js';

export const copper = 0xcb8555;
export const jade = 0x9ed9bb;
export const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .65, ...extra });
export const glow = (color) => new THREE.MeshBasicMaterial({ color });

export function mesh(parent, geometry, surface, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

export function box(parent, size, surface, x, y, z) {
  return mesh(parent, new THREE.BoxGeometry(...size), surface, x, y, z);
}

export function tube(parent, points, width, surface) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  return mesh(parent, new THREE.TubeGeometry(curve, 36, width, 8), surface);
}

export function panel(parent, width, height, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = Math.ceil(768 * height / width);
  const ctx = canvas.getContext('2d');
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const face = mesh(parent, new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false }), x, y, z);

  function draw(heading, body = '', accent = '#ffd1a6', fill = '#16251e') {
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = accent;
    ctx.font = `700 ${body ? 40 : Math.min(220, h * .56)}px Segoe UI, sans-serif`;
    ctx.textAlign = body ? 'left' : 'center';
    ctx.textBaseline = body ? 'top' : 'middle';
    ctx.fillText(heading, body ? 26 : w / 2, body ? 18 : h / 2, w - 52);
    if (body) {
      ctx.fillStyle = '#f4f1e5';
      ctx.font = '36px Segoe UI, sans-serif';
      let y = 76;
      let line = '';
      for (const word of body.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > w - 52) {
          ctx.fillText(line, 26, y);
          y += 42;
          line = word;
        } else line = next;
      }
      ctx.fillText(line, 26, y);
    }
    map.needsUpdate = true;
  }
  return { face, draw };
}

export function trainingAlarm(parent, reducedMotion) {
  const projection = new THREE.Group();
  projection.position.set(0, 3.05, -.85);
  projection.visible = false;
  parent.add(projection);

  const backdrop = panel(projection, 4.28, 1.60, 0, 0, 0);
  backdrop.draw('', '', '#ed7d55', '#261b21');
  const heading = panel(projection, 4.12, .31, 0, .61, .018);
  const caption = panel(projection, 4.12, .25, 0, -.64, .018);
  const red = glow(0xf57757);
  for (const x of [-2.03, 2.03]) box(projection, [.028, .91, .019], red, x, 0, .019);

  const emblem = new THREE.Group();
  projection.add(emblem);
  const warningShape = new THREE.Shape();
  warningShape.moveTo(0, .37);
  warningShape.lineTo(-.39, -.30);
  warningShape.lineTo(.39, -.30);
  warningShape.closePath();
  const outline = new THREE.ShapeGeometry(warningShape);
  mesh(emblem, outline, glow(0xff845a), 0, 0, .05);
  mesh(emblem, outline, glow(0x5f2424), 0, 0, .06).scale.setScalar(.78);
  const warningMark = glow(0xffe6c4);
  box(emblem, [.054, .188, .012], warningMark, 0, .014, .08);
  box(emblem, [.054, .052, .012], warningMark, 0, -.14, .08);

  const burstShape = new THREE.Shape();
  for (let point = 0; point < 22; point += 1) {
    const angle = point * Math.PI / 11;
    const radius = point % 2 === 0 ? .44 : .24;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (point === 0) burstShape.moveTo(x, y);
    else burstShape.lineTo(x, y);
  }
  burstShape.closePath();
  const burst = mesh(projection, new THREE.ShapeGeometry(burstShape), glow(0xff8e41), 0, -.09, .12);
  const core = mesh(projection, new THREE.CircleGeometry(.26, 22), glow(0xffdfa0), 0, -.09, .13);
  const ringInk = new THREE.MeshBasicMaterial({ color: 0xffab66, transparent: true, depthWrite: false });
  const ring = mesh(projection, new THREE.TorusGeometry(.27, .018, 8, 32), ringInk, 0, -.09, .10);

  const sparkInk = new THREE.MeshBasicMaterial({ color: 0xffcf8e, transparent: true, depthWrite: false });
  const sparkShape = new THREE.BoxGeometry(.082, .021, .026);
  const sparks = Array.from({ length: 18 }, (_, i) => {
    const angle = i * Math.PI * 2 / 18 + .11;
    const particle = mesh(projection, sparkShape, sparkInk);
    particle.rotation.z = angle;
    return { particle, angle };
  });

  const smokeInks = [0x71646e, 0x958188, 0xb4a0a2].map((color) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
  const smokeShape = new THREE.IcosahedronGeometry(.22, 1);
  const clouds = Array.from({ length: 15 }, (_, i) => ({
    puff: mesh(projection, smokeShape, smokeInks[i % smokeInks.length]),
    drift: (i - 7) / 7,
    rise: .30 + .13 * Math.sin(i * 2.4),
    depth: .18 + (i % 5) * .022,
  }));

  let started = -Infinity;
  let dramatic = false;

  function play(time, showEffect) {
    started = time;
    dramatic = showEffect;
    projection.visible = true;
    heading.draw(dramatic ? 'FICTIONAL EFFECT' : 'EMERGENCY STOP', '', '#ffd5b5', '#6d2a24');
    caption.draw(dramatic ? 'Training projection' : 'Flow stopped in the simulation', '', '#ffd5b5', '#391e23');
    update(time);
  }

  function clear() {
    started = -Infinity;
    projection.visible = false;
  }

  function update(time) {
    if (!projection.visible) return false;
    const elapsed = time - started;
    if (elapsed >= (dramatic ? 3.8 : 2.7)) {
      clear();
      return false;
    }
    emblem.visible = !dramatic;
    if (!dramatic) {
      emblem.scale.setScalar(reducedMotion ? 1 : 1 + .12 * Math.sin(elapsed * 4));
      burst.visible = core.visible = ring.visible = false;
      for (const { particle } of sparks) particle.visible = false;
      for (const { puff } of clouds) puff.visible = false;
      return true;
    }

    const effectAge = reducedMotion ? .56 : elapsed;
    const spread = THREE.MathUtils.smoothstep(effectAge, 0, 1.1);
    const burstScale = THREE.MathUtils.lerp(.40, 1.12, THREE.MathUtils.smoothstep(effectAge, 0, .37));
    burst.visible = core.visible = effectAge < .74;
    burst.scale.set(1.55 * burstScale, .78 * burstScale, 1);
    burst.rotation.z = .06 + effectAge * .30;
    core.scale.set(1.30 * burstScale, .62 * burstScale, 1);
    ring.visible = effectAge < 1.2;
    ring.scale.set(.7 + spread * 5.5, .55 + spread * 1.14, 1);
    ringInk.opacity = .76 * (1 - spread);
    sparkInk.opacity = 1 - THREE.MathUtils.smoothstep(effectAge, .3, 1.15);
    for (const { particle, angle } of sparks) {
      particle.visible = effectAge < 1.15;
      particle.position.set(Math.cos(angle) * (.13 + 1.51 * spread), -.08 + Math.sin(angle) * (.07 + .36 * spread), .16);
    }

    const drift = THREE.MathUtils.smoothstep(effectAge, .12, 1.75);
    const smokeOpacity = THREE.MathUtils.smoothstep(effectAge, .10, .58) * (1 - THREE.MathUtils.smoothstep(effectAge, 2.7, 3.7));
    for (const ink of smokeInks) ink.opacity = .91 * smokeOpacity;
    for (const { puff, drift: direction, rise, depth } of clouds) {
      puff.visible = effectAge >= .10 && effectAge < 3.7;
      puff.position.set(direction * (.35 + drift * 1.28), -.26 + rise * drift, depth);
      puff.scale.set(.54 + drift * 1.05, .48 + drift * .88, .69);
      puff.rotation.set(depth, drift * .88, direction);
    }
    return true;
  }

  return { play, clear, update };
}

export function roomEffects(parent, scene, reducedMotion) {
  const group = new THREE.Group();
  group.visible = false;
  parent.add(group);

  const origin = new THREE.Vector3(.25, 1.48, -.54);
  const fog = new THREE.FogExp2(0x777472, 0);
  const lamp = new THREE.PointLight(0xff8345, 0, 10);
  lamp.position.copy(origin);
  group.add(lamp);

  function softTexture(smoke = false) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const lobes = smoke ? [[64, 64, 61], [42, 51, 36], [85, 42, 35], [87, 80, 37], [48, 86, 37]] : [[64, 64, 63]];
    for (const [x, y, radius] of lobes) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,.96)');
      gradient.addColorStop(.38, 'rgba(255,255,255,.72)');
      gradient.addColorStop(.76, 'rgba(255,255,255,.23)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }

  const smokeTexture = softTexture(true);
  const flashTexture = softTexture();
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: flashTexture, color: 0xff913e, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  }));
  const core = new THREE.Sprite(flash.material.clone());
  core.material.color.setHex(0xfff0c4);
  flash.renderOrder = core.renderOrder = 2;
  flash.position.copy(origin);
  core.position.copy(origin);
  group.add(flash, core);
  const ring = mesh(group, new THREE.TorusGeometry(.5, .034, 8, 44), new THREE.MeshBasicMaterial({
    color: 0xffbc78, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), origin.x, .06, origin.z);
  ring.rotation.x = -Math.PI / 2;

  const clouds = Array.from({ length: 46 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: smokeTexture, transparent: true, depthWrite: false, fog: false,
    }));
    group.add(sprite);
    return { sprite, angle: i * 2.39996, offset: (i % 11) / 11, lift: (i % 7) / 6, depth: (i % 5) / 4 };
  });
  const debrisShape = new THREE.IcosahedronGeometry(1, 0);
  const debris = new THREE.InstancedMesh(debrisShape, new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, depthWrite: false, fog: false,
  }), 74);
  debris.frustumCulled = false;
  debris.renderOrder = 1;
  group.add(debris);
  const particle = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const travel = new THREE.Vector3();
  const color = new THREE.Color();
  const paths = Array.from({ length: 74 }, (_, i) => ({
    angle: i * 2.39996,
    speed: 2.5 + (i % 9) * .38,
    lift: 1.8 + (i % 13) * .24,
    size: .023 + (i % 7) * .009,
  }));

  let started;
  let kind = 'blast';
  let oldFog = null;

  function clear() {
    if (!group.visible) return;
    group.visible = false;
    if (scene.fog === fog) scene.fog = oldFog;
  }

  function play(effect) {
    clear();
    kind = effect;
    started = undefined;
    oldFog = scene.fog;
    if (kind === 'blast') scene.fog = fog;
    group.visible = true;
    const colors = kind === 'blast' ? [0xffd474, 0xff8d42, 0xff5125] : [0x93f7ef, 0x54d7e3, 0xb2fff1];
    paths.forEach((_, i) => debris.setColorAt(i, color.setHex(colors[i % colors.length])));
    debris.instanceColor.needsUpdate = true;
    lamp.color.setHex(kind === 'blast' ? 0xff8548 : 0x60efef);
    ring.material.color.setHex(kind === 'blast' ? 0xffab63 : 0x7ff0e6);
    clouds.forEach(({ sprite }, i) => sprite.material.color.setHex(
      (kind === 'blast' ? [0x535054, 0x777170, 0xa39a90] : [0x71c6ce, 0x9be3e5, 0xc1efee])[i % 3],
    ));
  }

  function update(time) {
    if (!group.visible) return;
    started ??= time;
    const elapsed = time - started;
    const blast = kind === 'blast';
    const duration = reducedMotion ? 3.2 : blast ? 7.2 : 4.1;
    if (elapsed >= duration) { clear(); return; }
    const age = reducedMotion ? (blast ? .87 : .42) : elapsed;
    const fade = 1 - THREE.MathUtils.smoothstep(elapsed, duration * .65, duration);
    const burst = 1 - THREE.MathUtils.smoothstep(age, .15, .84);
    flash.visible = core.visible = blast && burst > 0;
    flash.material.opacity = .96 * burst;
    core.material.opacity = .88 * burst;
    flash.scale.setScalar(1.4 + age * 6.3);
    core.scale.setScalar(.76 + age * 3.4);
    lamp.intensity = (blast ? 23 * burst + 2.2 * Math.exp(-age * .9) : 5.8 * Math.exp(-age * 3)) * fade;
    ring.visible = age < 1.5;
    ring.scale.setScalar(.3 + age * (blast ? 7.5 : 4.5));
    ring.material.opacity = .8 * Math.max(0, 1 - age / 1.5) * fade;

    const smokeAge = Math.max(0, age - (blast ? .12 : .09));
    const smokeStrength = THREE.MathUtils.smoothstep(age, .06, blast ? 1.25 : .54) * fade;
    fog.density = blast ? .168 * smokeStrength * (reducedMotion ? .52 : 1) : 0;
    for (const [i, { sprite, angle, offset, lift, depth }] of clouds.entries()) {
      sprite.visible = blast || i < 18;
      if (!sprite.visible) continue;
      const spread = smokeAge * (blast ? 1.1 : .68);
      const drift = Math.min(1, spread * .35);
      const distance = (blast ? .35 + offset * .45 : .4) + spread * (.48 + offset);
      sprite.position.set(
        origin.x + Math.cos(angle) * distance,
        Math.min(4.5, origin.y + .1 + smokeAge * (.27 + lift * .64)),
        origin.z + Math.sin(angle) * distance + depth * (blast ? 1.6 : .8),
      );
      const size = (blast ? 1.05 + 2.7 * drift : .62 + 1.12 * drift) * (.67 + offset * .51);
      sprite.scale.set(size * 1.24, size, 1);
      sprite.material.rotation = angle + smokeAge * .16;
      sprite.material.opacity = smokeStrength * (blast ? .46 : .31) * (.61 + lift * .39);
    }

    debris.count = age > (blast ? 1.9 : 1.7) ? 0 : paths.length;
    for (let i = 0; i < debris.count; i += 1) {
      const { angle, speed, lift, size } = paths[i];
      const horizontal = speed * (blast ? 1 : .78);
      const y = origin.y + lift * age - 4.75 * age * age;
      travel.set(Math.cos(angle) * horizontal, lift - 9.5 * age, Math.sin(angle) * horizontal);
      particle.position.set(origin.x + travel.x * age, Math.max(.03, y), origin.z + travel.z * age);
      particle.quaternion.setFromUnitVectors(up, travel.normalize());
      const radius = y <= .025 ? 0 : size * Math.max(.22, 1 - age * .32) * (blast ? 1 : 1.38);
      particle.scale.set(radius, radius * (blast ? 5.4 : 2.2), radius);
      particle.updateMatrix();
      debris.setMatrixAt(i, particle.matrix);
    }
    debris.instanceMatrix.needsUpdate = true;
  }

  return { play, clear, update };
}

export function roomEmergency(parent, reducedMotion) {
  const beacons = new THREE.Group();
  beacons.visible = false;
  parent.add(beacons);
  const base = material(0x54312d);
  const red = new THREE.MeshBasicMaterial({ color: 0xff452e, fog: false, toneMapped: false });
  for (const x of [-2.84, 2.84]) {
    box(beacons, [.07, 1.05, .07], base, x, 3.99, -.12);
    box(beacons, [.34, .09, .22], base, x, 3.50, -.12);
    const lens = mesh(beacons, new THREE.SphereGeometry(.13, 16, 12), red, x, 3.40, -.10);
    lens.scale.set(1.14, .86, .85);
  }
  const lamp = new THREE.PointLight(0xff4029, 0, 11);
  lamp.position.set(0, 2.6, 1.36);
  beacons.add(lamp);

  const sprinklers = new THREE.Group();
  parent.add(sprinklers);
  sprinklers.visible = false;
  const heads = [-2.8, 0, 2.8];
  const nozzleY = 4.25;
  for (const x of heads) {
    mesh(sprinklers, new THREE.CylinderGeometry(.12, .16, .13, 16), base, x, nozzleY, -.92);
    mesh(sprinklers, new THREE.CylinderGeometry(.077, .099, .09, 16), glow(0x9dced3), x, nozzleY - .093, -.92);
  }
  const water = new THREE.MeshBasicMaterial({
    color: 0x92e3f5, transparent: true, depthWrite: false, fog: false,
  });
  const drop = new THREE.Object3D();
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), water, 102);
  drops.renderOrder = 1;
  drops.frustumCulled = false;
  sprinklers.add(drops);
  let sprayAt;

  function setAlarm(active) {
    beacons.visible = Boolean(active);
  }

  function startSprinklers() {
    sprayAt = undefined;
    sprinklers.visible = true;
  }

  function clear() {
    beacons.visible = false;
    sprinklers.visible = false;
  }

  function update(t) {
    if (beacons.visible) {
      const pulse = reducedMotion ? .55 : .5 + .5 * Math.sin(t * 5.4);
      lamp.intensity = 25 + pulse * 29;
      red.color.setRGB(.7 + pulse * .3, .025 + pulse * .06, .014);
    }
    if (!sprinklers.visible) return;
    sprayAt ??= t;
    const age = t - sprayAt;
    if (age > 2.75) {
      sprinklers.visible = false;
      return;
    }
    water.opacity = (reducedMotion ? .45 : .80) * (1 - THREE.MathUtils.smoothstep(age, 1.83, 2.75));
    for (let i = 0; i < drops.count; i += 1) {
      const angle = i * 2.39996;
      const progress = ((reducedMotion ? .76 : age * 1.17) + i * .139) % 1;
      const reach = (.19 + progress * 1.39) * (.39 + (i % 7) * .088);
      drop.position.set(heads[i % 3] + reach * Math.cos(angle),
        nozzleY - .19 - progress * (2.7 + (i % 4) * .26), -.92 + reach * Math.sin(angle));
      drop.rotation.set(Math.sin(angle) * .26, 0, -Math.cos(angle) * .26);
      drop.scale.set(.019, .045 + progress * .062, .019);
      drop.updateMatrix();
      drops.setMatrixAt(i, drop.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  }

  return { setAlarm, startSprinklers, clear, update };
}

export function room(scene, gallery) {
  const group = new THREE.Group();
  scene.add(group);
  const floor = material(gallery ? 0x464e42 : 0x334a40);
  const alternate = material(gallery ? 0x3c453b : 0x2e433b);
  const wall = material(gallery ? 0x736e53 : 0x4a5d4e);
  const trim = material(gallery ? 0x987752 : 0x647e66);
  box(group, [14, .2, 16], floor, 0, -.14, 1);
  for (let x = -6; x < 7; x += 2) for (let z = -6; z < 9; z += 2) {
    box(group, [1.985, .035, 1.985], (x + z) % 4 === 0 ? alternate : floor, x, -.015, z);
  }
  box(group, [14, 5.5, .30], wall, 0, 2.75, -4.65);
  for (const side of [-1, 1]) box(group, [.2, 5.5, 16], wall, side * 7, 2.75, 1);
  for (const y of [.18, 3.77, 4.12]) box(group, [14, .10, .22], trim, 0, y, -4.44);
  for (const x of [-6.45, -4.4, -.7, 2.55, 5.8]) {
    box(group, [.23, 4.25, .30], trim, x, 2.08, -4.35);
    box(group, [.43, .19, .40], trim, x, .2, -4.29);
    box(group, [.44, .15, .38], trim, x, 4.08, -4.28);
  }
  if (gallery) {
    const rug = material(0x69404c);
    box(group, [3.28, .02, 9], rug, 0, .014, 1.24);
    for (const x of [-1.51, 1.51]) box(group, [.04, .024, 8.8], trim, x, .017, 1.24);
    const brass = material(0xbd8b56, { metalness: .38 });
    const amber = glow(0xffd49d);
    for (const x of [-5.18, -1.92, 1.92, 5.18]) {
      box(group, [.029, .42, .029], brass, x, 3.52, -3.99);
      mesh(group, new THREE.OctahedronGeometry(.15), amber, x, 3.26, -3.99);
      mesh(group, new THREE.TorusGeometry(.18, .022, 8, 22), brass, x, 3.26, -3.99);
    }
  }
  for (const x of [-4.4, -.7, 2.55, 5.8]) {
    box(group, [.12, .59, .10], glow(gallery ? 0xf4c488 : 0x9aceb1), x, 2.95, -4.13);
  }
  return group;
}

export function pedestal(parent, x, z) {
  const stone = material(0x34483d);
  box(parent, [1.8, .82, 1.32], stone, x, .43, z);
  box(parent, [1.93, .07, 1.45], material(copper), x, .855, z);
  box(parent, [1.93, .10, 1.45], stone, x, .06, z);
}

export const leadColors = [0xc75b4b, 0x30343d];

export function powerSource(parent, x, z) {
  const casing = material(0xbcc3bc, { metalness: .27 });
  const panelSurface = material(0x35413e);
  const trim = material(0x26342e);
  const socketRim = material(0x727e78, { metalness: .44 });
  const lamp = material(0x617168, { emissive: 0x9bf0c3, emissiveIntensity: 0 });
  box(parent, [1.55, .70, .80], casing, x, 1.27, z);
  box(parent, [1.43, .57, .055], panelSurface, x, 1.27, z + .405);
  for (const side of [-1, 1]) {
    box(parent, [.22, .055, .59], trim, x + side * .49, .898, z);
    for (let i = 0; i < 4; i++) box(parent, [.24, .013, .013], trim, x + side * .45, 1.626, z - .18 + i * .052);
  }
  const screen = panel(parent, .78, .21, x - .21, 1.434, z + .437);
  const knob = mesh(parent, new THREE.CylinderGeometry(.115, .13, .072, 20), trim, x + .475, 1.422, z + .466);
  knob.rotation.x = Math.PI / 2;
  box(parent, [.013, .053, .009], casing, x + .475, 1.463, z + .508);
  box(parent, [.164, .107, .034], trim, x - .53, 1.096, z + .452);
  box(parent, [.127, .077, .014], lamp, x - .53, 1.096, z + .472);
  const powerMark = panel(parent, .146, .095, x - .53, 1.217, z + .438);
  powerMark.draw('⏻', '', '#d7e9dc', '#35413e');

  const terminals = [x + .10, x + .42].map((socketX, index) => {
    const sleeve = material(leadColors[index]);
    const rim = mesh(parent, new THREE.CylinderGeometry(.066, .068, .022, 18), socketRim, socketX, 1.083, z + .447);
    const plug = mesh(parent, new THREE.CylinderGeometry(.048, .051, .091, 18), sleeve, socketX, 1.083, z + .488);
    rim.rotation.x = plug.rotation.x = Math.PI / 2;
    const sign = panel(parent, .153, .13, socketX, 1.217, z + .439);
    sign.draw(index === 0 ? '+' : '−', '', index === 0 ? '#ffb5a7' : '#d1e6eb', '#35413e');
    return [socketX, 1.083, z + .535];
  });

  let powered;
  function setOn(active) {
    if (powered === active) return;
    powered = active;
    lamp.emissiveIntensity = active ? 1.12 : 0;
    screen.draw(active ? 'DC · ON' : 'DC · OFF', '', active ? '#bcf8d4' : '#96a99c', '#162623');
  }
  setOn(false);
  return { terminals, setOn };
}

export function filterStand(parent, x, z) {
  const frame = material(0xa1aaa1, { metalness: .42 });
  const paper = material(0xe5dfc3, { side: THREE.DoubleSide });
  const glass = new THREE.MeshBasicMaterial({ color: 0xb7e8e0, transparent: true, opacity: .23, depthWrite: false, side: THREE.DoubleSide });
  const water = new THREE.MeshBasicMaterial({ color: 0x8bced0, transparent: true, opacity: .37, depthWrite: false });
  mesh(parent, new THREE.CylinderGeometry(.41, .11, .43, 24, 1, true), paper, x, 1.75, z);
  mesh(parent, new THREE.CylinderGeometry(.065, .065, .20, 18), frame, x, 1.445, z);
  const rim = mesh(parent, new THREE.TorusGeometry(.395, .022, 8, 34), frame, x, 1.966, z);
  rim.rotation.x = Math.PI / 2;
  mesh(parent, new THREE.CylinderGeometry(.245, .27, .42, 28, 1, true), glass, x, 1.19, z).renderOrder = 2;
  mesh(parent, new THREE.CylinderGeometry(.237, .251, .09, 26), water, x, 1.03, z).renderOrder = 1;
  box(parent, [.076, .97, .076], frame, x - .49, 1.40, z - .22);
  box(parent, [.52, .055, .055], frame, x - .24, 1.64, z - .16);
  box(parent, [1.12, .063, .69], frame, x, .934, z);
  return frame;
}

export function learningPreparation(parent, x, z, reactorX) {
  const group = new THREE.Group();
  parent.add(group);
  group.position.set(x, 0, z);
  group.visible = false;

  const metal = material(0x829b99, { metalness: .38 });
  const trim = material(0x344a47);
  const glass = new THREE.MeshBasicMaterial({
    color: 0xc3ecf6, side: THREE.DoubleSide, transparent: true, opacity: .17, depthWrite: false,
  });
  const blue = new THREE.MeshBasicMaterial({ color: 0x45bde5, transparent: true, opacity: .70, depthWrite: false });
  const filterX = -.34;
  const dryerX = .61;
  const screenY = 1.77;
  const ringShape = new THREE.TorusGeometry(.39, .024, 8, 36);
  for (const y of [1.01, 1.47, screenY, 2.34]) {
    const rim = mesh(group, ringShape, metal, filterX, y, 0);
    rim.rotation.x = Math.PI / 2;
  }
  for (const side of [-1, 1]) {
    box(group, [.047, 1.29, .052], metal, filterX + side * .43, 1.65, -.15);
  }
  box(group, [1, .069, .86], trim, filterX, .927, 0);
  mesh(group, new THREE.CylinderGeometry(.37, .37, .57, 36, 1, true), glass, filterX, 2.055, 0).renderOrder = 4;
  mesh(group, new THREE.CylinderGeometry(.37, .37, .46, 36, 1, true), glass, filterX, 1.24, 0).renderOrder = 4;
  mesh(group, new THREE.CylinderGeometry(.37, .37, .035, 32), metal, filterX, 1.023, 0);

  const grid = material(0xb7c4a7);
  for (let i = -4; i <= 4; i += 1) {
    const offset = i * .081;
    const span = 2 * Math.sqrt(.373 ** 2 - offset ** 2);
    box(group, [span, .022, .013], grid, filterX, screenY, offset);
    box(group, [.013, .022, span], grid, filterX + offset, screenY + .012, 0);
  }

  const liquidShape = new THREE.CylinderGeometry(.35, .35, 1, 32);
  const upper = mesh(group, liquidShape, blue, filterX, 2.01, 0);
  const lower = mesh(group, liquidShape, blue, filterX, 1.05, 0);
  upper.renderOrder = lower.renderOrder = 2;
  const dropShape = new THREE.SphereGeometry(.035, 8, 6);
  const dropColor = glow(0x7fe4ff);
  const drops = Array.from({ length: 13 }, (_, index) => {
    const angle = index * 2.39996;
    const radius = .27 * Math.sqrt((index + .5) / 13);
    const drop = mesh(group, dropShape, dropColor,
      filterX + Math.cos(angle) * radius, screenY, Math.sin(angle) * radius);
    drop.scale.y = 1.45;
    return drop;
  });

  const dryer = material(0x6c827d, { metalness: .3 });
  const window = new THREE.MeshBasicMaterial({ color: 0xffbf7d, transparent: true, opacity: .18, depthWrite: false });
  box(group, [.78, .08, .72], dryer, dryerX, 1.03, 0);
  box(group, [.78, .1, .72], dryer, dryerX, 1.48, 0);
  box(group, [.78, .40, .06], trim, dryerX, 1.255, -.32);
  box(group, [.054, .40, .71], dryer, dryerX - .36, 1.255, 0);
  box(group, [.054, .40, .71], dryer, dryerX + .36, 1.255, 0);
  box(group, [.64, .34, .016], window, dryerX, 1.25, .35).renderOrder = 3;
  const lamp = material(0x6b7061, { emissive: 0xff963e, emissiveIntensity: 0 });
  box(group, [.14, .044, .024], lamp, dryerX + .23, 1.48, .365);
  const dryerLabel = panel(group, .66, .16, dryerX, 1.71, .29);
  dryerLabel.draw('Dryer', '', '#f8ce9e', '#263934');

  const retained = new THREE.Group();
  group.add(retained);
  const grainShape = new THREE.IcosahedronGeometry(.042, 0);
  const grainColors = [0xc16035, 0xe78d48, 0x974628].map((color) => material(color));
  const grains = Array.from({ length: 49 }, (_, index) => {
    const angle = index * 2.39996;
    const radius = .307 * Math.sqrt((index + .5) / 49);
    const grain = mesh(retained, grainShape, grainColors[index % grainColors.length],
      Math.cos(angle) * radius, .028 + (index % 5) * .016, Math.sin(angle) * radius);
    grain.rotation.set(index, index * .6, index * 1.2);
    return grain;
  });
  const tray = box(retained, [.66, .037, .53], metal, 0, -.005, 0);
  const notices = [
    panel(group, 1.20, .18, filterX, 2.50, .37),
    panel(group, 1.08, .17, filterX, 1.59, .49),
  ];
  notices[0].draw('Grains stay in the filter', '', '#ffd19d');
  notices[1].draw('Liquid falls through', '', '#a9eaff');
  const rinseNote = panel(group, 1.10, .18, filterX, 2.50, .37);
  rinseNote.draw('Rinse the grains', '', '#a9eaff');

  function waterLevel(mesh, depth, bottom) {
    mesh.visible = depth > .002;
    mesh.scale.y = Math.max(.002, depth);
    mesh.position.y = bottom + depth / 2;
  }

  function update(phase, time, reduceMotion) {
    const filtering = phase === 'filtering';
    const filtered = ['prep-dry', 'drying', 'ready', 'reduction', 'product', 'won'].includes(phase);
    const filled = phase === 'filter' || filtering;
    const drying = phase === 'drying';
    const rinseEnd = .56;
    const rinsing = drying && time < rinseEnd;
    const filterAge = filtering ? THREE.MathUtils.smoothstep(time, .15, 1.98) : Number(filtered);
    waterLevel(upper, filled ? .46 * (1 - filterAge) : 0, screenY + .025);
    const rinseWater = drying ? THREE.MathUtils.smoothstep(time, .08, rinseEnd)
      : Number(filtered && phase !== 'prep-dry');
    waterLevel(lower, .34 * filterAge + .035 * rinseWater, 1.048);
    for (const [i, drop] of drops.entries()) {
      drop.visible = rinsing || (filtering && filterAge > .02 && filterAge < .99);
      if (drop.visible) {
        const fall = ((reduceMotion ? .45 : time * 2.4) + i / drops.length) % 1;
        drop.position.y = rinsing ? screenY + .51 - fall * .96 : screenY - .075 - fall * .48;
      }
    }
    notices[0].face.visible = filled || phase === 'prep-dry';
    notices[1].face.visible = filtering || phase === 'prep-dry';
    rinseNote.face.visible = rinsing;
    retained.visible = filled || phase === 'prep-dry' || drying;
    tray.visible = drying && !rinsing;
    lamp.emissiveIntensity = drying && time > .83 && time < 1.24 ? 1.4 : 0;
    window.opacity = lamp.emissiveIntensity ? .42 : .18;
    if (!retained.visible) return;
    const toDryer = drying ? THREE.MathUtils.smoothstep(time, rinseEnd, .91) : 0;
    const toReactor = drying ? THREE.MathUtils.smoothstep(time, 1.22, 1.83) : 0;
    retained.position.set(
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(filterX, dryerX, toDryer), reactorX - x, toReactor),
      THREE.MathUtils.lerp(screenY + .02, 1.107, toDryer) + Math.sin(toDryer * Math.PI) * .2 + Math.sin(toReactor * Math.PI) * .29,
      Math.sin(toDryer * Math.PI) * .57 + toDryer * .05 + Math.sin(toReactor * Math.PI) * .61,
    );
    for (const [i, grain] of grains.entries()) {
      const unsettled = (i % 7) * .049;
      grain.position.y = .028 + (i % 5) * .016 + (1 - filterAge) * unsettled;
    }
  }

  return { group, update };
}

export function saltExhibit(parent, x, z) {
  const bench = material(0x34483d);
  box(parent, [1.30, .82, 1.15], bench, x, .43, z);
  box(parent, [1.39, .07, 1.26], material(copper), x, .855, z);
  const glass = new THREE.MeshBasicMaterial({ color: 0xb7e8e0, transparent: true, opacity: .20, depthWrite: false, side: THREE.DoubleSide });
  const water = new THREE.MeshBasicMaterial({ color: 0x77c8c9, transparent: true, opacity: .38, depthWrite: false });
  const cupX = x - .22;
  mesh(parent, new THREE.CylinderGeometry(.23, .18, .61, 24, 1, true), glass, cupX, 1.20, z).renderOrder = 3;
  mesh(parent, new THREE.CylinderGeometry(.20, .18, .38, 24), water, cupX, 1.10, z).renderOrder = 1;
  const rim = mesh(parent, new THREE.TorusGeometry(.229, .018, 8, 26), material(0x9bb3a4), cupX, 1.51, z);
  rim.rotation.x = Math.PI / 2;
  mesh(parent, new THREE.CylinderGeometry(.19, .15, .069, 20), material(0xb59c7a), x + .34, .92, z + .10);
  const crystals = mesh(parent, new THREE.SphereGeometry(.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(0xe9ede2), x + .34, .956, z + .10);
  crystals.scale.y = .53;
  const dotShape = new THREE.SphereGeometry(.021, 8, 6);
  const colors = [glow(0xffd597), glow(0xb7f4ff)];
  const dissolved = Array.from({ length: 10 }, (_, i) => mesh(parent, dotShape, colors[i % 2],
    cupX + Math.cos(i * 2.4) * .135, .966 + (i % 5) * .063, z + .093 + Math.sin(i * 2.4) * .068));
  return { crystals, dissolved };
}

export function atomModel(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 1.69, z);
  parent.add(group);
  const core = mesh(group, new THREE.IcosahedronGeometry(.27, 1), material(copper, { flatShading: true }));
  const ring = mesh(group, new THREE.TorusGeometry(.59, .013, 8, 60), glow(0xb6ab82));
  ring.rotation.set(.36, .22, .39);
  const electron = mesh(group, new THREE.SphereGeometry(.071, 16, 10), glow(0xb4eaf0));
  const charge = panel(group, .56, .28, .59, .40, .15);
  charge.draw('+1', '', '#bbebcf');
  const counts = panel(group, 2.48, .32, 0, .88, .49);
  const key = panel(group, 2.48, .23, 0, -.66, .49);
  key.draw('Blue ball = one electron', '', '#b9e9ec');
  const wireNote = panel(group, 1.00, .23, 1.28, .60, .49);
  wireNote.draw('To the wire →', '', '#b9e9ec');
  return { group, core, electron, charge: charge.face, counts, key: key.face, wireNote: wireNote.face };
}

export function tank(parent, x, y, z, scale = 1, labDetails = false) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  parent.add(group);
  const frame = material(0x789184, { metalness: .32 });
  const glass = new THREE.MeshBasicMaterial({ color: 0xb7e8e0, transparent: true, opacity: .11, depthWrite: false });
  box(group, [2.04, .10, 1.12], frame, 0, .06, 0);
  const liquid = box(group, [1.89, .74, .99], new THREE.MeshBasicMaterial({ color: 0x5dbbb1, transparent: true, opacity: .25, depthWrite: false }), 0, .50, 0);
  liquid.renderOrder = 1;
  const shell = box(group, [2, 1.15, 1.09], glass, 0, .70, 0);
  shell.renderOrder = 2;
  for (const dx of [-1, 1]) for (const dz of [-.55, .55]) box(group, [.042, 1.17, .042], frame, dx, .7, dz);
  for (const dy of [.12, 1.28]) for (const dz of [-.55, .55]) box(group, [2, .036, .037], frame, 0, dy, dz);
  const signs = [];
  const terminals = [];
  const plates = [];
  for (const dx of [-.57, .57]) {
    plates.push(box(group, [.35, 1.16, .12], material(copper, { metalness: .42 }), dx, .77, .08));
    const sign = panel(group, .78, .31, dx, labDetails ? 1.68 : 1.50, labDetails ? .59 : .42);
    sign.draw(dx < 0 ? '+' : '−', '', dx < 0 ? '#ffd0a4' : '#b9e9ec');
    signs.push(sign);
    if (labDetails) {
      box(group, [.058, .28, .068], material(copper, { metalness: .52 }), dx, 1.45, -.14);
      box(group, [.05, .054, .28], material(copper, { metalness: .52 }), dx, 1.34, -.01);
      terminals.push([x + dx * scale, y + 1.59 * scale, z - .14 * scale]);
    }
  }
  if (labDetails) {
    const hood = new THREE.MeshBasicMaterial({ color: 0x93ced2, transparent: true, opacity: .42, depthWrite: false, side: THREE.DoubleSide });
    mesh(group, new THREE.CylinderGeometry(.20, .25, .20, 24, 1, true), hood, .57, 1.36, .16).renderOrder = 3;
    mesh(group, new THREE.CylinderGeometry(.20, .20, .022, 24), hood, .57, 1.465, .16).renderOrder = 3;
    mesh(group, new THREE.CylinderGeometry(.056, .056, .10, 18), frame, .57, 1.50, .16);
    for (const side of [-1, 1]) {
      const slope = box(group, [1.01, .049, .92], frame, side * .47, .142, 0);
      slope.rotation.z = side * .103;
    }
    const drain = mesh(group, new THREE.CylinderGeometry(.104, .104, .11, 18), frame, 0, .136, .585);
    drain.rotation.x = Math.PI / 2;
    mesh(group, new THREE.CircleGeometry(.058, 18), material(0x27332f), 0, .136, .645);
  }
  const bubbles = [];
  const grains = [];
  const bubbleShape = new THREE.SphereGeometry(.025, 8, 6);
  const grainShape = new THREE.IcosahedronGeometry(.036, 0);
  const grainSurface = material(0xb95e43);
  const bubbleSurface = glow(0xc9f3ed);
  for (let i = 0; i < 16; i++) bubbles.push(mesh(group, bubbleShape, bubbleSurface));
  for (let i = 0; i < 70; i++) {
    const angle = i * 2.39996;
    const radius = Math.sqrt(i / 70) * .84;
    const grainX = Math.cos(angle) * radius;
    const grainY = labDetails ? .16 + Math.abs(grainX) * .10 : .16;
    const grain = mesh(group, grainShape, grainSurface, grainX, grainY + (1 - radius) * (i % 5) * .023, Math.sin(angle) * radius * .45);
    grain.rotation.set(i, i * 2, i * 3);
    grains.push(grain);
  }
  const ions = [];
  const ionShape = new THREE.IcosahedronGeometry(.022, 0);
  const ionSurface = new THREE.MeshBasicMaterial({ color: 0xff995f, toneMapped: false });
  for (let i = 0; i < 9; i++) ions.push(mesh(group, ionShape, ionSurface));
  return { liquid, shell, plates, bubbles, grains, ions, signs, terminals, gasOutlet: [x + .57 * scale, y + 1.55 * scale, z + .16 * scale] };
}

export function animateTank(model, time, active, fraction) {
  for (const [i, bubble] of model.bubbles.entries()) {
    bubble.visible = active;
    const rise = (time * .8 + i / model.bubbles.length) % 1;
    bubble.position.set(.56 + Math.sin(i * 1.4) * .19, .25 + rise * .77, .19 + Math.cos(i) * .13);
  }
  for (const [i, grain] of model.grains.entries()) grain.visible = i < model.grains.length * fraction;
  for (const [i, ion] of model.ions.entries()) {
    ion.visible = active;
    const drift = (time * .65 + i / model.ions.length) % 1;
    ion.position.set(-.56 + drift * .42, .37 + (i % 6) * .072 - drift * .10, .22 + Math.sin(i) * .16);
  }
}

export function reactorModel(parent, x, z) {
  const casing = material(0x465c53, { metalness: .35 });
  box(parent, [2.08, 1.16, 1.04], casing, x, 1.54, z);
  box(parent, [1.9, .81, .055], material(0x293e35), x, 1.57, z + .53);
  const furnace = material(0x976a53, { emissive: 0xf07633, emissiveIntensity: 0 });
  box(parent, [1.58, .16, .045], furnace, x, 1.83, z + .57);
  for (const dx of [-.71, -.47, -.23, .01, .25, .49, .73]) box(parent, [.12, .035, .03], casing, x + dx, 1.52, z + .56);
  const window = new THREE.Group();
  window.position.set(x, 1.52, z + .585);
  window.visible = false;
  parent.add(window);
  box(window, [1.55, .36, .014], material(0x59736b, { metalness: .5 }));
  box(window, [1.45, .28, .016], material(0x192d2a), 0, 0, .011);
  const windowGrain = material(0x934627, { metalness: .12 });
  const windowGrains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.012, 0), windowGrain, 128);
  const grain = new THREE.Object3D();
  for (let i = 0; i < windowGrains.count; i++) {
    const angle = i * 2.39996;
    const radius = Math.sqrt((i + .5) / windowGrains.count);
    grain.position.set(.49 * radius * Math.cos(angle), -.073 + .046 * radius * Math.sin(angle), .029 + (i % 5) * .007);
    grain.rotation.set(i * .7, i, 0);
    grain.scale.setScalar(.75 + (i % 7) * .075);
    grain.updateMatrix();
    windowGrains.setMatrixAt(i, grain.matrix);
  }
  window.add(windowGrains);
  const oxideTint = new THREE.Color(0x914827);
  const copperTint = new THREE.Color(0xe4925b);

  function showLearning(phase, time) {
    window.visible = phase === 'ready' || phase === 'reduction';
    if (!window.visible) return;
    const progress = phase === 'reduction' ? THREE.MathUtils.smoothstep(time, .24, 1.79) : 0;
    windowGrain.color.copy(oxideTint).lerp(copperTint, progress);
    windowGrain.metalness = .12 + progress * .4;
    windowGrain.roughness = .76 - progress * .38;
  }

  const sample = new THREE.Group();
  sample.position.set(x, .96, z + .91);
  parent.add(sample);
  const tray = material(0x877054, { metalness: .48 });
  box(sample, [.78, .08, .47], tray, 0, .04, 0);
  const mound = mesh(sample, new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    material(0xd4844f, { roughness: .92 }), 0, .081, 0);
  mound.scale.set(.32, .057, .17);
  const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.007, 0), material(0xffffff), 420);
  const tint = new THREE.Color();
  for (let i = 0; i < grains.count; i++) {
    const angle = i * 2.39996;
    const radius = Math.sqrt((i + .5) / grains.count);
    grain.position.set(.32 * radius * Math.cos(angle), .081 + .057 * Math.sqrt(1 - radius ** 2),
      .17 * radius * Math.sin(angle));
    grain.rotation.set(i, i * 2, i * 3);
    grain.scale.setScalar(.64 + (i % 7) * .095);
    grain.updateMatrix();
    grains.setMatrixAt(i, grain.matrix);
    grains.setColorAt(i, tint.setHSL(.064 + (i % 5) * .005, .57, .43 + (i % 9) * .023));
  }
  sample.add(grains);
  const lid = new THREE.Group();
  lid.name = 'sample-lid';
  lid.position.set(0, .20, -.23);
  sample.add(lid);
  box(lid, [.8, .055, .48], tray, 0, 0, .23);
  box(lid, [.16, .045, .09], casing, 0, .04, .37);
  const mixer = new THREE.AnimationMixer(sample);
  const track = new THREE.NumberKeyframeTrack('sample-lid.rotation[x]', [0, .25, 1], [0, -.18, -1.48]);
  const reveal = mixer.clipAction(new THREE.AnimationClip('Reveal copper powder', 1, [track]));
  reveal.setLoop(THREE.LoopOnce, 1);
  reveal.clampWhenFinished = true;
  return { furnace, sample, mixer, reveal, showLearning };
}
