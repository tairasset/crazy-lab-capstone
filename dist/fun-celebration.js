import * as THREE from './vendor/three.module.js';

export function createFunCelebration(parent, reducedMotion) {
  const launches = [[-2.9, 3.2, -1.7], [2.8, 3.5, -1.8], [0, 4.1, -2.8], [-1.9, 3.6, .3], [1.9, 3.4, .4]];
  const colors = [0xffba65, 0x81f9da, 0xff8cae, 0x9ac9ff, 0xffe8a3];
  const bursts = launches.map(([x, y, z], index) => {
    const geometry = new THREE.BufferGeometry();
    const sparks = new Float32Array(60 * 3);
    const position = new THREE.BufferAttribute(sparks, 3);
    geometry.setAttribute('position', position);
    const ink = new THREE.PointsMaterial({ color: colors[index], size: .102, transparent: true, depthWrite: false });
    const points = new THREE.Points(geometry, ink);
    points.name = 'Victory firework';
    points.position.set(x, y, z);
    points.visible = false;
    points.frustumCulled = false;
    parent.add(points);
    return { points, position, sparks, ink, delay: index * .44 };
  });
  let elapsed = Infinity;

  function update(delta) {
    if (elapsed > 4.4) return;
    elapsed += delta;
    for (const { points, position, sparks, ink, delay } of bursts) {
      const age = elapsed - delay;
      points.visible = age >= 0 && age < 2.3;
      if (!points.visible) continue;
      const spread = reducedMotion ? .92 : Math.min(1.50, age * 1.9);
      ink.opacity = Math.min(1, (2.3 - age) * .83);
      for (let i = 0; i < sparks.length / 3; i++) {
        const angle = i * 2.39996;
        const depth = (i % 13 - 6) / 7;
        const radius = spread * (.58 + (i % 5) * .14);
        sparks[i * 3] = Math.cos(angle) * radius;
        sparks[i * 3 + 1] = Math.sin(angle) * radius - (reducedMotion ? 0 : age * age * .22);
        sparks[i * 3 + 2] = depth * radius;
      }
      position.needsUpdate = true;
    }
  }

  return { update, start() { elapsed = 0; }, clear() { elapsed = Infinity; for (const { points } of bursts) points.visible = false; } };
}
