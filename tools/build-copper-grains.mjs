import { writeFile } from 'node:fs/promises';

// Original, deliberately magnified powder geometry for the electronics demo.
const points = [[0, .76, 0], [.68, -.02, 0], [0, .01, .62], [-.52, 0, .02],
  [.05, -.04, -.61], [.02, -.53, 0]];
const triangles = [[0, 2, 1], [0, 3, 2], [0, 4, 3], [0, 1, 4],
  [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1]];
const vertexPositions = [];
const vertexNormals = [];

for (const [x, y, z] of triangles) {
  const [a, b, c] = [points[x], points[y], points[z]];
  const [ux, uy, uz] = b.map((value, i) => value - a[i]);
  const [vx, vy, vz] = c.map((value, i) => value - a[i]);
  const normal = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const length = Math.hypot(...normal);
  for (const vertex of [a, b, c]) {
    vertexPositions.push(...vertex);
    vertexNormals.push(...normal.map(value => value / length));
  }
}

const bufferViews = [];
const accessors = [];
const sections = [];
let byteLength = 0;

function floats(values, width, { target, bounds = false } = {}) {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((value, index) => bytes.writeFloatLE(value, index * 4));
  const view = { buffer: 0, byteOffset: byteLength, byteLength: bytes.length };
  if (target) view.target = target;
  const accessor = { bufferView: bufferViews.length, componentType: 5126,
    count: values.length / width, type: width === 1 ? 'SCALAR' : `VEC${width}` };
  if (bounds) {
    const columns = Array.from({ length: width }, (_, axis) => values.filter((_, i) => i % width === axis));
    accessor.min = columns.map(column => Math.fround(Math.min(...column)));
    accessor.max = columns.map(column => Math.fround(Math.max(...column)));
  }
  bufferViews.push(view);
  sections.push(bytes);
  byteLength += bytes.length;
  return accessors.push(accessor) - 1;
}

const position = floats(vertexPositions, 3, { target: 34962, bounds: true });
const normal = floats(vertexNormals, 3, { target: 34962 });
const times = floats([0, .45, 1.18, 1.9, 2.7], 1, { bounds: true });
const scatter = [[-.40, .045, -.10], [-.18, .043, .15], [.025, .04, -.15], [.22, .046, .12], [.44, .044, -.07]];
const nodes = [];
const samplers = [];
const channels = [];

scatter.forEach((translation, index) => {
  const [x, y, z] = translation;
  const joined = (index - 2) * .115;
  const size = [.086, .10, .094, .102, .083][index];
  const output = floats([
    x, y, z,
    x, y + .065, z,
    (x + joined) / 2, y + .18 + (index % 2) * .035, z * .42,
    joined, y + .025, 0,
    joined, y, 0,
  ], 3);
  nodes.push({ name: `Copper grain ${index + 1}`, mesh: 0, translation, scale: [size, size, size] });
  samplers.push({ input: times, interpolation: 'LINEAR', output });
  channels.push({ sampler: index, target: { node: index, path: 'translation' } });
});

const gltf = {
  asset: { version: '2.0', generator: 'Crazy Lab original geometry',
    extras: { description: 'Illustrative and deliberately magnified copper powder. Created for Crazy Lab.' } },
  scene: 0, scenes: [{ name: 'Copper grains specimen', nodes: nodes.map((_, index) => index) }], nodes,
  meshes: [{ name: 'Faceted grain', primitives: [{ attributes: { POSITION: position, NORMAL: normal }, material: 0 }] }],
  materials: [{ name: 'Copper orange', pbrMetallicRoughness: {
    baseColorFactor: [.69, .26, .087, 1], metallicFactor: .22, roughnessFactor: .48,
  } }],
  animations: [{ name: 'CopperGrainsJoin', samplers, channels }],
  accessors, bufferViews, buffers: [{ byteLength }],
};

const json = Buffer.from(JSON.stringify(gltf));
const padding = Buffer.alloc((4 - json.length % 4) % 4, 0x20);
const header = Buffer.alloc(12);
header.write('glTF');
header.writeUInt32LE(2, 4);
header.writeUInt32LE(header.length + 16 + json.length + padding.length + byteLength, 8);
const jsonChunk = Buffer.alloc(8);
jsonChunk.writeUInt32LE(json.length + padding.length, 0);
jsonChunk.write('JSON', 4);
const binaryChunk = Buffer.alloc(8);
binaryChunk.writeUInt32LE(byteLength, 0);
binaryChunk.write('BIN\0', 4);
await writeFile(new URL('../dist/copper-grains.glb', import.meta.url),
  Buffer.concat([header, jsonChunk, json, padding, binaryChunk, ...sections]));
