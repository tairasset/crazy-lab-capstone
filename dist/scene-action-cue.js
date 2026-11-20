import * as THREE from './vendor/three.module.js';

function cornerShape(x, y, thickness, margin) {
  const points = [[0, 0], [.22, 0], [.22, thickness], [thickness, thickness],
    [thickness, .22], [0, .22]];
  const shape = new THREE.Shape();
  for (const [index, [dx, dy]] of points.entries()) {
    const px = x * (.5 + margin - dx);
    const py = y * (.5 + margin - dy);
    if (!index) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  shape.closePath();
  return shape;
}

function arrowShape(width, height, stroke) {
  const shape = new THREE.Shape();
  shape.moveTo(-width, height);
  shape.lineTo(0, 0);
  shape.lineTo(width, height);
  shape.lineTo(width - stroke, height + stroke);
  shape.lineTo(0, stroke * 1.44);
  shape.lineTo(-width + stroke, height + stroke);
  shape.closePath();
  return shape;
}

export function createSceneActionCue(scene) {
  const cue = new THREE.Group();
  cue.name = 'Guided action highlight';
  cue.visible = false;
  scene.add(cue);
  const frame = new THREE.Group();
  const arrow = new THREE.Group();
  cue.add(frame, arrow);
  const gold = new THREE.MeshBasicMaterial({ color: 0xffd18c, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const dark = new THREE.MeshBasicMaterial({ color: 0x231e18, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  for (const { ink, thickness, margin, depth, order } of [
    { ink: dark, thickness: .034, margin: .007, depth: 0, order: 11 },
    { ink: gold, thickness: .019, margin: 0, depth: .004, order: 12 },
  ]) {
    const corners = [-1, 1].flatMap(x => [-1, 1].map(y => cornerShape(x, y, thickness, margin)));
    const cornersMesh = new THREE.Mesh(new THREE.ShapeGeometry(corners), ink);
    cornersMesh.position.z = depth;
    cornersMesh.renderOrder = order;
    frame.add(cornersMesh);
    const arrowMesh = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape(.105, .094, thickness)), ink);
    arrowMesh.position.z = depth;
    arrowMesh.renderOrder = order;
    arrow.add(arrowMesh);
  }

  const bounds = new THREE.Box3();
  const size = new THREE.Vector3();
  let target;
  let tubePoint;

  function update() {
    if (!target) return;
    target.updateWorldMatrix(true, false);
    if (tubePoint) {
      cue.position.copy(tubePoint).applyMatrix4(target.matrixWorld);
      cue.position.z += .10;
      size.set(.52, .22, 0);
    } else {
      bounds.copy(target.geometry.boundingBox).applyMatrix4(target.matrixWorld);
      bounds.getCenter(cue.position);
      bounds.getSize(size);
      cue.position.z = bounds.max.z + .055;
    }
    frame.scale.set(Math.max(.34, size.x + .13), Math.max(.27, size.y + .12), 1);
    arrow.position.y = frame.scale.y / 2 + .075;
  }

  return {
    select(next, action, point) {
      target = next;
      tubePoint = point;
      cue.visible = Boolean(target);
      cue.userData.action = cue.visible ? action : '';
      if (!target) return;
      if (!tubePoint && !target.geometry.boundingBox) target.geometry.computeBoundingBox();
      update();
    },
    update,
  };
}
