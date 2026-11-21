import * as THREE from './vendor/three.module.js';
import { buildQuarryStation } from './quarry-stations.js';

const bounds = Object.freeze({ minX: -11.4, maxX: 11.4, minZ: -13.3, maxZ: 10.4 });
const spawn = Object.freeze({ x: 0, y: 1, z: 7 });
const bottom = -4;
const buildCeiling = 10;
const inventoryKinds = ['soil', 'stone', 'sand', 'ore'];
const blockKinds = [...inventoryKinds, 'bedrock'];
const sides = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const key = (x, y, z) => `${x},${y},${z}`;
const columnKey = (x, z) => `${x},${z}`;
const oreSites = [
  [-2, 0, 3], [0, 0, 2], [-2, 0, 1], [-3, 0, -2],
  [-2, -1, 3], [-1, -1, 3], [0, -1, 2], [1, -1, 2], [-2, -1, 1],
  [-3, -1, -2], [-4, -1, -2], [-2, -2, 2], [2, -2, 1], [1, -1, -3],
  [0, 1, -6], [0, 0, -6], [1, 0, -7], [-1, 1, -7],
];
const stationSites = [
  { kind: 'concentrate', label: 'CONCENTRATOR', x: -5.65, z: 5.1, accent: 0x74c5a7 },
  { kind: 'smelt', label: 'SMELTER', x: -5.65, z: 1.5, accent: 0xff9a55 },
  { kind: 'refine', label: 'REFINER', x: -5.65, z: -2.1, accent: 0x7ddcfa },
];

function terrainTexture(kind, seed) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const styles = {
    soil: ['#b77755', '#c58865', '#a0674b', '#d29873'],
    stone: ['#8f9297', '#a3a4a5', '#81848c', '#afb0ad'],
    sand: ['#d0a77d', '#dab493', '#b28b69', '#e6c29f'],
    ore: ['#727a7b', '#899390', '#666e73', '#a5a496'],
    bedrock: ['#4b5260', '#626874', '#414751', '#757780'],
  };
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function facet(x, y, radius, color, angle = 0) {
    ctx.beginPath();
    ctx.moveTo(x - radius, y + Math.sin(angle) * radius);
    ctx.lineTo(x - radius * .22, y - radius * .63);
    ctx.lineTo(x + radius * .89, y - radius * .34);
    ctx.lineTo(x + radius * .36, y + radius * .58);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  const palette = styles[kind];
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalAlpha = .46;
  for (let i = 0; i < 60; i++) {
    facet(random() * 128, random() * 128, 5 + random() * 18, palette[1 + (i % 3)], random() * 6);
  }
  ctx.globalAlpha = 1;
  if (kind === 'ore') {
    for (const [x, y, radius] of [[25, 32, 18], [65, 47, 13], [102, 28, 12], [95, 84, 20], [38, 99, 17], [67, 109, 10]]) {
      facet(x, y, radius * 1.25, '#264d4c', .7);
      facet(x, y, radius, '#7ed0b7', .7);
      facet(x + 3, y + 6, radius * .61, '#dc985f', 1);
      facet(x - 1, y - 3, radius * .44, '#eac99b', .2);
    }
  }
  ctx.strokeStyle = '#00000024';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 126);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function sign(text, background, foreground) {
  if (typeof document === 'undefined') return new THREE.MeshBasicMaterial({ color: background });
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 320, 80);
  ctx.fillStyle = foreground;
  ctx.fillRect(8, 9, 4, 62);
  ctx.font = 'bold 32px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, 165, 41, 286);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map });
}

export function createQuarryTerrain(scene) {
  const terrain = new THREE.Group();
  terrain.name = 'Copper Quarry terrain';
  scene.add(terrain);
  const cube = new THREE.BoxGeometry();
  const stamp = new THREE.Object3D();
  const initial = new Map();
  const voxels = new Map();
  const stock = new Map(inventoryKinds.map(kind => [kind, 0]));
  const waterColumns = new Set();
  const columns = new Map();
  const stationTargets = [];
  const stationBounds = [];
  const soilColors = [0xffffff, 0xfff4e7, 0xf0e7df, 0xf6e0ca, 0xf7eee2];
  const stoneLayers = [0x9da7aa, 0xc9bfd0, 0xe7e2db, 0xe3ded5, 0xf3d6bc];
  const color = new THREE.Color();
  const infrastructure = 0x313946;

  function box(parent, material, x, y, z, width, height, depth) {
    const mesh = new THREE.Mesh(cube, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    parent.add(mesh);
    return mesh;
  }

  for (let x = -12; x <= 12; x++) {
    for (let z = -14; z <= 11; z++) {
      const shore = ((x - 7.1) / 3.8) ** 2 + ((z - .1) / 5.6) ** 2;
      const pond = shore < .90;
      const shoal = shore < .56;
      const westBank = Math.max(0, -x - 8);
      const backWall = Math.max(0, -z - 4);
      const terrace = Math.min(5, Math.max(Math.floor(westBank * .93), Math.floor(backWall * .49)));
      const height = pond ? (shoal ? -1 : 0) : 1 + terrace;
      if (pond) waterColumns.add(columnKey(x, z));
      for (let y = bottom; y < height; y++) {
        const kind = y === bottom ? 'bedrock' : y === height - 1 && shore < 1.18 ? 'sand'
          : y === height - 1 && height <= 2 ? 'soil' : 'stone';
        initial.set(key(x, y, z), { x, y, z, kind });
      }
    }
  }
  for (const [x, y, z] of oreSites) initial.set(key(x, y, z), { x, y, z, kind: 'ore' });
  const kinds = Object.fromEntries(blockKinds.map((kind, index) => {
    const texture = terrainTexture(kind, 39883 + index * 16);
    const material = new THREE.MeshStandardMaterial({
      color: texture ? 0xffffff : [0xb77755, 0x92969c, 0xd0a77d, 0x6eaa91, 0x4c5360][index],
      map: texture, roughness: .92,
    });
    const mesh = new THREE.InstancedMesh(cube, material, initial.size);
    mesh.userData.kind = kind;
    mesh.name = `Quarry ${kind}`;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    terrain.add(mesh);
    return [kind, { mesh, blocks: [] }];
  }));

  function rebuild() {
    columns.clear();
    for (const batch of Object.values(kinds)) batch.blocks.length = 0;
    for (const block of voxels.values()) {
      const { x, y, z, kind } = block;
      const column = columnKey(x, z);
      columns.set(column, Math.max(columns.get(column) ?? bottom, y + 1));
      if (sides.every(([dx, dy, dz]) => voxels.has(key(x + dx, y + dy, z + dz)))) continue;
      const batch = kinds[kind];
      const index = batch.blocks.length;
      batch.blocks.push(block);
      stamp.position.set(x, y + .5, z);
      stamp.updateMatrix();
      batch.mesh.setMatrixAt(index, stamp.matrix);
      const variation = (Math.abs(x * 29 + z * 11 + y * 13)) % soilColors.length;
      color.setHex(kind === 'stone' ? stoneLayers[((y % 5) + 5) % 5] : soilColors[variation]);
      batch.mesh.setColorAt(index, color.multiplyScalar(.90 + variation * .025));
    }
    for (const { mesh, blocks } of Object.values(kinds)) {
      mesh.count = blocks.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  function reset() {
    voxels.clear();
    for (const [id, block] of initial) voxels.set(id, block);
    for (const kind of stock.keys()) stock.set(kind, 0);
    rebuild();
  }

  const skyline = new THREE.Group();
  terrain.add(skyline);
  const distant = new THREE.MeshBasicMaterial({ color: 0x918c8c });
  const nearRidge = new THREE.MeshBasicMaterial({ color: 0x786f75 });
  for (const [x, z, width, height, depth] of [[-15, -25, 16, 11, 8], [-4, -28, 12, 13, 9],
    [7, -27, 12, 10, 10], [18, -25, 14, 12, 11]]) {
    box(skyline, distant, x, height / 2 - 1, z, width, height, depth);
    box(skyline, distant, x + .55, height - .1, z - .3, width * .67, 1.9, depth * .82);
  }
  for (const [x, z, width, height, depth] of [[-13, -19, 12, 8.4, 5], [-5, -20, 8, 7.4, 4.5],
    [7, -20, 13, 6.9, 5], [17, -15, 10, 8.2, 12]]) {
    box(skyline, nearRidge, x, height / 2 - .8, z, width, height, depth);
    box(skyline, nearRidge, x - .3, height -.36, z, width * .59, .96, depth * .8);
  }

  const platform = new THREE.Group();
  platform.name = 'Quarry workshop';
  terrain.add(platform);
  const beam = new THREE.MeshStandardMaterial({ color: 0x504351, roughness: .7 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xbd775a, metalness: .35, roughness: .55 });
  const rail = new THREE.MeshStandardMaterial({ color: infrastructure, metalness: .35, roughness: .62 });
  const paving = new THREE.MeshStandardMaterial({ color: 0x655557, roughness: .94 });
  const pale = new THREE.MeshStandardMaterial({ color: 0xb9a48d, roughness: .92 });
  const stands = [];

  box(platform, paving, -5.9, 1.027, 1.45, 3.2, .055, 11.90);
  for (let z = -4; z < 7.3; z += .82) box(platform, pale, -4.33, 1.061, z, .20, .025, .35);
  for (const z of [-3.8, .10, 3.9, 7.15]) box(platform, beam, -7.31, 2.72, z, .19, 3.34, .19);
  box(platform, beam, -7.30, 4.40, 1.55, .22, .23, 11.14);
  for (const z of [-3.8, .1, 3.9, 7.15]) box(platform, rail, -5.69, 4.35, z, 3.40, .14, .16);
  for (let z = -3.8; z <= 7.15; z += .53) {
    box(platform, z < 3.5 ? beam : copper, -6.14, 4.48, z, 2.45, .09, .37);
  }
  box(platform, copper, -7.22, 1.12, 1.4, .08, .08, 11.53);

  for (const { kind, label, x, z, accent } of stationSites) {
    const machine = new THREE.Group();
    machine.name = label;
    machine.position.set(x, 1, z);
    platform.add(machine);
    const lamp = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: .25, roughness: .46 });
    const banner = box(machine, sign(label, '#26373d', '#e8d5b2'), .77, 1.87, 0, 1.54, .32, .045);
    banner.rotation.y = Math.PI / 2;
    const animate = buildQuarryStation(kind, machine, box);
    box(machine, lamp, .805, 1.62, -.64, .07, .116, .14);
    const target = box(machine, new THREE.MeshBasicMaterial({ visible: false }),
      0, .72, 0, 1.66, 1.44, 1.68);
    target.userData.kind = kind;
    target.userData.address = new THREE.Vector3(x, 1.72, z);
    stationTargets.push(target);
    stationBounds.push({ x, z });
    stands.push({ kind, lamp, animate, previous: -1 });
  }

  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x3aa4ba, metalness: .16, roughness: .46, transparent: true, opacity: .76,
  });
  const waterMesh = new THREE.InstancedMesh(cube, waterMaterial, waterColumns.size);
  waterMesh.name = 'Quarry pond';
  stamp.scale.set(1, .05, 1);
  let waterIndex = 0;
  for (const id of waterColumns) {
    const [x, z] = id.split(',').map(Number);
    stamp.position.set(x, .58, z);
    stamp.updateMatrix();
    waterMesh.setMatrixAt(waterIndex, stamp.matrix);
    color.setHex((x * 13 + z * 5) % 4 === 0 ? 0xc7f4fa : 0xf5fdff);
    waterMesh.setColorAt(waterIndex, color);
    waterIndex += 1;
  }
  stamp.scale.setScalar(1);
  terrain.add(waterMesh);
  const rippleGroup = new THREE.Group();
  terrain.add(rippleGroup);
  const rippleMaterial = new THREE.MeshBasicMaterial({ color: 0xb1ebec, transparent: true, opacity: .47 });
  const ripples = [[6.3, 1.5], [8, -2], [7.4, 3.3], [8.6, .8], [5.5, -.5], [6, -2.2]].map(([x, z], index) => {
    const ripple = box(rippleGroup, rippleMaterial, x, .613, z, .68 + index * .065, .008, .025);
    return { ripple, x, z };
  });

  const brush = new THREE.MeshStandardMaterial({ color: 0x747459, roughness: 1 });
  const dry = new THREE.MeshStandardMaterial({ color: 0xa28759, roughness: .96 });
  const growth = [[3.5, 4.75], [4.1, -2.4], [6.2, 5.45], [10.3, 3.2], [9.8, -4.2], [4.5, -4.2], [3.9, 3.4], [9.9, 4.3]];
  for (let index = 0; index < growth.length; index++) {
    const [x, z] = growth[index];
    for (let stem = 0; stem < 3; stem++) {
      const height = .32 + ((index * 5 + stem * 7) % 5) * .08;
      const blade = box(terrain, stem === 1 ? dry : brush, x + stem * .075, 1 + height / 2, z + stem * .07, .046, height, .044);
      blade.rotation.z = (stem - 1) * .19;
    }
  }

  const stationHits = [];
  const rayStart = new THREE.Vector3();

  function hitVoxel(ray, near, far) {
    // Visit only the grid cells along the aim ray, in order from the player.
    ray.at(near - 1e-8, rayStart);
    let x = Math.floor(rayStart.x + .5);
    let y = Math.floor(rayStart.y);
    let z = Math.floor(rayStart.z + .5);
    const { origin, direction } = ray;
    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);
    const intervalX = stepX ? 1 / Math.abs(direction.x) : Infinity;
    const intervalY = stepY ? 1 / Math.abs(direction.y) : Infinity;
    const intervalZ = stepZ ? 1 / Math.abs(direction.z) : Infinity;
    let nextX = stepX ? (x + stepX * .5 - origin.x) / direction.x : Infinity;
    let nextY = stepY ? (y + Number(stepY > 0) - origin.y) / direction.y : Infinity;
    let nextZ = stepZ ? (z + stepZ * .5 - origin.z) / direction.z : Infinity;
    while (Math.min(nextX, nextY, nextZ) <= far) {
      const distance = Math.max(near, Math.min(nextX, nextY, nextZ));
      let nx = 0;
      let ny = 0;
      let nz = 0;
      if (nextX <= nextY && nextX <= nextZ) {
        x += stepX;
        nextX += intervalX;
        nx = -stepX;
      } else if (nextY <= nextZ) {
        y += stepY;
        nextY += intervalY;
        ny = -stepY;
      } else {
        z += stepZ;
        nextZ += intervalZ;
        nz = -stepZ;
      }
      const block = voxels.get(key(x, y, z));
      if (block) return {
        kind: block.kind, block, distance, normal: new THREE.Vector3(nx, ny, nz),
        point: ray.at(distance, new THREE.Vector3()), position: new THREE.Vector3(x, y + .5, z),
      };
    }
    return null;
  }

  function hit(raycaster, maxDistance = 5) {
    const previous = raycaster.far;
    raycaster.far = Math.min(previous, maxDistance);
    let nearest;
    try {
      stationHits.length = 0;
      nearest = raycaster.intersectObjects(stationTargets, false, stationHits)[0];
      const block = hitVoxel(raycaster.ray, raycaster.near, nearest?.distance ?? raycaster.far);
      if (block) return block;
    }
    finally { raycaster.far = previous; }
    if (!nearest) return null;
    const { object, point, distance, face } = nearest;
    return { kind: object.userData.kind, point, distance, normal: face.normal.clone().transformDirection(object.matrixWorld),
      position: object.userData.address.clone() };
  }

  function floorAt(x, z) {
    return columns.get(columnKey(Math.round(x), Math.round(z))) ?? bottom + 1;
  }

  function isSolid(x, y, z) {
    return voxels.has(key(Math.round(x), Math.floor(y), Math.round(z))) ||
      (y >= 1 && y < 2.52 && stationBounds.some(station => Math.abs(station.x - x) < .78 && Math.abs(station.z - z) < .78));
  }

  function isWorkshop(x, z) {
    return x >= -7 && x <= -4 && z >= -4 && z <= 7;
  }

  function mine(target) {
    const block = target?.block;
    if (!block || !stock.has(block.kind)) return false;
    const { x, y, z, kind } = block;
    const id = key(x, y, z);
    if (voxels.get(id) !== block || y <= 0 && isWorkshop(x, z)) return false;
    voxels.delete(id);
    stock.set(kind, stock.get(kind) + 1);
    rebuild();
    return true;
  }

  function placementCell(target) {
    const block = target?.block;
    if (!block || !target.normal || voxels.get(key(block.x, block.y, block.z)) !== block) return null;
    const dx = Math.round(target.normal.x);
    const dy = Math.round(target.normal.y);
    const dz = Math.round(target.normal.z);
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) !== 1) return null;
    return { x: block.x + dx, y: block.y + dy, z: block.z + dz };
  }

  function canPlace(cell, kind) {
    if (!cell || !(stock.get(kind) > 0)) return false;
    const { x, y, z } = cell;
    if (![x, y, z].every(Number.isInteger) || x < bounds.minX || x > bounds.maxX ||
        z < bounds.minZ || z > bounds.maxZ || y <= bottom || y >= buildCeiling) return false;
    if (voxels.has(key(x, y, z)) || isWorkshop(x, z)) return false;
    if (y < 1 && waterColumns.has(columnKey(x, z))) return false;
    return sides.some(([dx, dy, dz]) => voxels.has(key(x + dx, y + dy, z + dz)));
  }

  function place(cell, kind) {
    if (!canPlace(cell, kind)) return false;
    const { x, y, z } = cell;
    voxels.set(key(x, y, z), { x, y, z, kind });
    stock.set(kind, stock.get(kind) - 1);
    rebuild();
    return true;
  }

  function demoTarget(kind) {
    if (kind === 'mine' || kind === 'ore') {
      for (const [x, y, z] of oreSites) {
        if (voxels.get(key(x, y, z))?.kind === 'ore' && floorAt(x, z) === y + 1) {
          return new THREE.Vector3(x, y + .5, z);
        }
      }
      for (const { x, y, z } of kinds.ore.blocks) {
        if (floorAt(x, z) === y + 1) return new THREE.Vector3(x, y + .5, z);
      }
      return null;
    }
    const station = stationSites.find(site => site.kind === kind);
    return station ? new THREE.Vector3(station.x, 1.72, station.z) : null;
  }

  function nearbyStation(x, y, z, radius = 2.65) {
    if (Math.abs(y - 1) > 1) return null;
    let nearest = null;
    let distance = radius ** 2;
    for (const station of stationSites) {
      const square = (x - station.x) ** 2 + (z - station.z) ** 2;
      if (square >= distance) continue;
      nearest = station.kind;
      distance = square;
    }
    return nearest;
  }

  function update(time, stage = '', processing = null, reduced = false) {
    for (const [index, { ripple, x, z }] of ripples.entries()) {
      ripple.position.x = x + .21 * Math.sin(time * .9 + index * .47);
      ripple.position.z = z + .06 * Math.sin(time * .65 + index);
      ripple.scale.x = .62 + .29 * Math.sin(time * 1.6 + index) + index * .045;
    }
    const current = stands.findIndex(({ kind }) => kind === stage);
    for (const [index, stand] of stands.entries()) {
      const running = index === current && processing !== null;
      const finished = stage === 'complete' || current > index;
      const progress = running ? processing : Number(finished);
      stand.lamp.emissiveIntensity = running ? 1.15 : finished ? .65 : index === current ? .8 : .23;
      if (running || progress !== stand.previous) stand.animate(time, progress, running, reduced);
      stand.previous = progress;
    }
  }

  reset();
  update(0);
  terrain.updateMatrixWorld(true);
  return {
    bounds, spawn, hit, mine, placementCell, canPlace, place, demoTarget, nearbyStation,
    reset, floorAt, isSolid, update, oreCount: oreSites.length,
    isWater: (x, z) => waterColumns.has(columnKey(Math.round(x), Math.round(z))),
  };
}
