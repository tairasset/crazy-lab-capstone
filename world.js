import * as THREE from './vendor/three.module.js';
import { jade, leadColors, material, glow, mesh, box, tube, panel, trainingAlarm, roomEffects, roomEmergency, room, pedestal, atomModel, powerSource, filterStand, learningPreparation, saltExhibit, tank, animateTank, reactorModel } from './models.js';
import { createFunArena, FUN_ARENA_BOUNDS } from './fun-arena.js';
import { createFunEncounter } from './fun-encounter.js';
import { createFunRack } from './fun-rack.js';
import { createFunFurniture } from './fun-furniture.js';
import { createFunCelebration } from './fun-celebration.js';
import { createFunDamage } from './fun-damage.js';
import { createFunFirearmView, isFunFirearm } from './fun-firearms.js';
import { createSceneActionCue } from './scene-action-cue.js';

export function createWorld(viewport, onSelect, onHover) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x172720);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D laboratory. You can also use the action buttons.');
  viewport.append(canvas);
  const camera = new THREE.PerspectiveCamera(53, 1, .06, 45);
  camera.rotation.order = 'YXZ';
  const rig = new THREE.Group();
  rig.add(camera);
  scene.add(rig);
  scene.add(new THREE.HemisphereLight(0xf3f7d6, 0x485f54, 2.4));
  const key = new THREE.DirectionalLight(0xffdbad, 2.1);
  key.position.set(-4, 6, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xa5e3db, .85);
  fill.position.set(5, 5, -3);
  scene.add(fill);

  const gallery = room(scene, true);
  const equipment = room(scene, true);
  const lab = room(scene, false);
  const standardLabShell = [...lab.children];
  const actionCue = createSceneActionCue(scene);
  const stations = [];
  const hidden = new THREE.MeshBasicMaterial({ visible: false });

  function station(parent, id, caption, x, y, z, width, hitbox) {
    const tag = panel(parent, width, .31, x, y, z);
    tag.draw(caption);
    tag.face.userData.action = id;
    let volume;
    if (hitbox) {
      const [size, at] = hitbox;
      volume = box(parent, size, hidden, ...at);
      volume.userData.action = id;
      volume.userData.stationVolume = true;
    }
    const result = { id, parent, tag, caption, volume };
    stations.push(result);
    return result;
  }

  function title(parent, text, height = 3.51) {
    const sign = panel(parent, 4.9, .50, -.18, height, -3.94);
    sign.draw(text, '', '#ffcc9d', '#1e2d25');
    return sign;
  }

  function portal(parent, id, caption, x, z, tinted = false, tagHeight = 1.43) {
    const door = material(tinted ? 0x2b4742 : 0x362e26);
    const border = material(tinted ? 0x88b6a7 : 0x9d7650, { metalness: .25 });
    box(parent, [1.83, 2.87, .23], border, x, 1.49, z - .19);
    box(parent, [1.59, 2.63, .14], door, x, 1.41, z);
    mesh(parent, new THREE.CircleGeometry(.80, 28, 0, Math.PI), door, x, 2.68, z + .08);
    mesh(parent, new THREE.TorusGeometry(.83, .075, 8, 36, Math.PI), border, x, 2.68, z + .09);
    for (const side of [-.53, 0, .53]) box(parent, [.026, 2.59, .031], border, x + side, 1.42, z + .09);
    return station(parent, id, caption, x, tagHeight, z + .104, 1.52, [[1.7, 2.79, .4], [x, 1.43, z - .04]]);
  }

  title(gallery, 'KNOWLEDGE PALACE');
  pedestal(gallery, -2.66, -1.75);
  pedestal(gallery, .06, -1.75);
  const atom = atomModel(gallery, -2.66, -1.75);
  const signRows = [1.85, 1.42].map((y) => panel(gallery, 1.64, .36, -2.66, y, -1.28));
  const mini = tank(gallery, .06, .92, -1.75, .79);
  const miniInputs = [['plate-plus', -.39], ['plate-minus', .51]].map(([action, x]) => {
    const hit = box(gallery, [.78, .96, .55], hidden, x, 1.45, -1.34);
    hit.userData.action = action;
    hit.userData.stationVolume = true;
    return hit;
  });
  const miniPowerInput = box(gallery, [1.60, 1.12, .55], hidden, .06, 1.50, -1.34);
  miniPowerInput.userData.action = 'electrodes-power';
  miniPowerInput.userData.stationVolume = true;
  const bubbleBurst = new THREE.Group();
  bubbleBurst.position.set(.51, 1.71, -1.23);
  bubbleBurst.visible = false;
  gallery.add(bubbleBurst);
  const bubbleBurstInk = new THREE.MeshBasicMaterial({ color: 0xaffaff, transparent: true, depthWrite: false });
  const bubbleRipple = mesh(bubbleBurst, new THREE.TorusGeometry(.34, .017, 8, 36), bubbleBurstInk);
  const bubbleSparkShape = new THREE.OctahedronGeometry(.047);
  const bubbleSparks = Array.from({ length: 9 }, () => mesh(bubbleBurst, bubbleSparkShape, bubbleBurstInk));
  const saltX = 1.95;
  const salt = saltExhibit(gallery, saltX, -1.75);
  const saltNote = panel(gallery, 1.26, .23, saltX, 1.77, -1.11);
  for (const bubble of mini.bubbles) bubble.scale.setScalar(1.6);
  const lessonActions = Array.from({ length: 3 }, () => panel(scene, 1.98, .35, 0, .47, -.85));
  station(gallery, 'atom', '01   Atoms and ions', -2.66, .60, -1.075, 1.79,
    [[1.8, 1.62, 1.4], [-2.66, 1.55, -1.75]]);
  station(gallery, 'electrodes', '02   Anode and cathode', .06, .60, -1.075, 1.79,
    [[1.8, 1.62, 1.4], [.06, 1.55, -1.75]]);
  const saltHit = [[1.32, 1.05, 1.25], [saltX, 1.26, -1.75]];
  station(gallery, 'salt', '03   Salt in water', saltX, .60, -1.11, 1.29, saltHit);
  station(gallery, 'salt-compare', 'Add salt', saltX, .86, -1.10, 1.29, saltHit);
  const labDoors = [portal(gallery, 'enter', 'Laboratory', 3.28, -3.43)];
  portal(gallery, 'equipment-wing', 'Equipment', -4.80, -3.54, true);

  title(equipment, 'KNOWLEDGE PALACE   /   EQUIPMENT', 4.27);
  portal(equipment, 'basics-wing', 'Back to basics', -2.53, -3.68, true, 2.42);
  labDoors.push(portal(equipment, 'enter', 'Laboratory', 2.53, -3.68, false, 2.42));
  const equipmentZ = -2.26;
  const powerX = -3.45;
  const tankX = -1.15;
  const filterX = 1.15;
  const reactorX = 3.45;
  const exhibits = [
    ['equipment-power', 'Power supply', powerX],
    ['equipment-tank', 'Electrolysis tank', tankX],
    ['equipment-prep', 'Filter and dryer', filterX],
    ['equipment-reactor', 'Reactor', reactorX],
  ];
  for (const [id, label, x] of exhibits) {
    pedestal(equipment, x, equipmentZ);
    station(equipment, id, label, x, .60, equipmentZ + .675, 1.83,
      [[1.82, 1.40, 1.04], [x, 1.37, equipmentZ]]);
  }
  const equipmentPower = powerSource(equipment, powerX, equipmentZ);
  const equipmentTank = tank(equipment, tankX, .91, equipmentZ, .73);
  const equipmentPrep = learningPreparation(equipment, filterX, equipmentZ, reactorX);
  equipmentPrep.group.visible = true;
  const reactorExhibit = new THREE.Group();
  reactorExhibit.position.set(reactorX, .27, equipmentZ);
  reactorExhibit.scale.setScalar(.72);
  equipment.add(reactorExhibit);
  const equipmentReactor = reactorModel(reactorExhibit, 0, 0);
  equipmentReactor.sample.visible = false;
  const focusX = { atom: -2.66, electrodes: .06, salt: saltX, ...Object.fromEntries(exhibits.map(([id, , x]) => [id, x])) };
  const glintShape = new THREE.OctahedronGeometry(.039);
  const glintInk = glow(0xffd89a);
  const glints = Array.from({ length: 6 }, () => mesh(scene, glintShape, glintInk));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doorLights = [[gallery, 3.28, -3.30], [equipment, 2.53, -3.55]].flatMap(([parent, x, z]) =>
    ['atom', 'electrodes'].map((id, index) => ({ id,
      lamp: box(parent, [.14, .11, .04], glow(0x745746), x + (index - .5) * .28, 2.51, z),
    })));

  const labTitle = title(lab, 'COPPER LAB', 3.78);
  const labZ = -1.62;
  const supplyX = -3.66;
  const cellX = -1.54;
  const prepX = .58;
  const ovenX = 2.70;
  for (const x of [supplyX, cellX, prepX, ovenX]) pedestal(lab, x, labZ);
  const powerAssembly = new THREE.Group();
  lab.add(powerAssembly);
  const labPower = powerSource(powerAssembly, supplyX, labZ);
  const cell = tank(lab, cellX, .91, labZ, .92, true);
  cell.signs[0].draw('+ Anode', '', '#ffd0a4');
  cell.signs[1].draw('− Cathode', '', '#b9e9ec');
  const cellNotes = [
    panel(lab, 1.02, .22, cellX - .53, 2.76, -1.05),
    panel(lab, 1.02, .22, cellX + .53, 2.76, -1.05),
  ];
  cellNotes[0].draw('Copper → liquid', '', '#ffd0a4');
  cellNotes[1].draw('Hydrogen ↑ bubbles', '', '#b9e9ec');
  for (const ion of cell.ions) ion.scale.setScalar(1.55);
  for (const bubble of cell.bubbles) bubble.scale.setScalar(1.30);
  const powerLeads = labPower.terminals.map((source, index) => {
    const target = cell.terminals[index];
    const lane = index === 0 ? -.08 : .07;
    const side = cellX - 1.15 + lane;
    const top = 2.67 + lane;
    return tube(lab, [source, [source[0] + .14, .98, source[2] + .22], [side, .99, labZ + .48],
      [side, 1.30, labZ - .45], [side, 2.40, labZ - .54], [side + .13, top, labZ - .54],
      [target[0] - .14, top, labZ - .46], target], .028, material(leadColors[index]));
  });
  const classicPrep = new THREE.Group();
  lab.add(classicPrep);
  const prepMat = filterStand(classicPrep, prepX, labZ);
  const learningPrep = learningPreparation(lab, prepX, labZ, ovenX);
  const filterAnswers = [['crazy-filter-screen', 1.90], ['crazy-filter-cup', 1.23]].map(([action, y]) => {
    const hit = box(learningPrep.group, [.74, .50, .64], hidden, -.34, y, .20);
    hit.userData.action = action;
    hit.userData.stationVolume = true;
    return hit;
  });
  const powderTrail = tube(lab, [[cellX, 1.01, -1.06], [-.57, .93, -1.10], [prepX, .95, -1.15],
    [1.61, .95, -1.15], [ovenX - .20, 1.05, -1.19]], .018, glow(0xe19762));
  const [outletX, outletY, outletZ] = cell.gasOutlet;
  const hoodNote = panel(lab, 1.38, .22, outletX, 2.98, -1.10);
  hoodNote.draw('Hydrogen collector', '', '#b9e9ec');
  const gasTube = tube(lab, [cell.gasOutlet, [outletX, outletY + .34, outletZ - .22],
    [outletX + .54, 2.87, labZ - .41], [ovenX - .48, 2.85, labZ - .39], [ovenX, 2.13, labZ - .27]],
  .037, glow(0x4e6e69));
  const pipePath = gasTube.geometry.parameters.path;
  const pipeAim = mesh(lab, new THREE.TubeGeometry(pipePath, 36, .12, 8), hidden);
  pipeAim.userData.action = 'pipe';
  pipeAim.userData.stationVolume = true;
  const pipeCuePoint = pipePath.getPointAt(.54);
  const flowShape = new THREE.SphereGeometry(.067, 12, 8);
  const flows = [
    { id: 'gas', guide: gasTube, color: 0xd8ffef },
    { id: 'solid', guide: powderTrail, color: 0xffc090 },
  ].map(({ id, guide, color }) => {
    const ink = glow(color);
    return { id, path: guide.geometry.parameters.path, started: -Infinity,
      dots: Array.from({ length: 5 }, () => mesh(lab, flowShape, ink)) };
  });
  const ovenAssembly = new THREE.Group();
  lab.add(ovenAssembly);
  const reactor = reactorModel(ovenAssembly, ovenX, labZ);
  const chamberNote = panel(lab, 1.65, .23, ovenX, 2.02, labZ + .63);
  const powderNote = panel(lab, 1.9, .22, ovenX, 2.34, -1.06);
  powderNote.draw('Magnified powder', '', '#ffd0a4');
  const tankHit = [[1.92, 1.40, 1.13], [cellX, 1.61, labZ]];
  const reactorHit = [[2.1, 1.25, 1.1], [ovenX, 1.54, labZ]];
  const supplyHit = [[1.62, .75, .93], [supplyX, 1.28, labZ]];
  const funEquipment = [supplyHit, tankHit, [[1.74, 1.14, 1.30], [prepX, 1.42, labZ]], reactorHit]
    .map(([size, at]) => box(lab, size, hidden, ...at));
  station(lab, 'start', 'Turn on the power', supplyX, .60, -.946, 1.77, supplyHit);
  const powerComparison = station(lab, 'compare-power', 'Turn current off', supplyX, .60, -.946, 1.77, supplyHit);
  station(lab, 'lab-observe', 'Inspect the tank', cellX, .60, -.946, 1.77, tankHit);
  station(lab, 'gas', 'Trace the hydrogen', outletX, 2.67, -1.15, 1.86,
    [[.75, .99, .78], [outletX, 1.88, labZ + .24]]);
  station(lab, 'solid', 'Collect settled grains', cellX, .60, -.946, 1.77,
    [[1.83, .35, 1.08], [cellX, 1.10, labZ + .10]]);
  station(lab, 'pipe', 'Send gas through the tube', .59, 2.72, -1.91, 1.72);
  gasTube.userData.action = 'pipe';
  station(lab, 'prep', 'Separate grains from liquid', prepX, .60, -.946, 1.79,
    [[1.82, 1.11, 1.34], [prepX, 1.45, labZ]]).classicOnly = true;
  station(learningPrep.group, 'prep', 'Start filtering', -.34, .62, .738, .88,
    [[.9, 1.49, .88], [-.34, 1.65, 0]]);
  station(learningPrep.group, 'dry', 'Rinse and dry', .61, .62, .738, .88,
    [[.82, .66, .83], [.61, 1.27, 0]]);
  station(lab, 'reactor', 'Start reactor', ovenX, .60, -.946, 1.78, reactorHit);
  station(lab, 'inspect-powder', 'Inspect the powder', ovenX, .60, -.946, 1.78,
    [[2.1, 1.45, 1.7], [ovenX, 1.51, labZ + .25]]);
  station(lab, 'tank', 'Tank', cellX, .60, -.946, 1.77, tankHit);
  station(lab, 'sample', 'Reactor', ovenX, .60, -.946, 1.78, reactorHit);
  station(lab, 'restart', 'Play again', ovenX, .60, -.946, 1.78);
  const labCaptions = [
    [supplyX, 'Power supply', ['start', 'compare-power']],
    [cellX, 'Electrolysis tank', ['lab-observe', 'solid', 'tank']],
    [prepX, 'Filter and dryer', ['prep', 'dry']],
    [ovenX, 'Reactor', ['reactor', 'inspect-powder', 'sample', 'restart']],
  ].map(([x, caption, replacedBy]) => {
    const sign = panel(lab, 1.57, .25, x, .60, -.946);
    sign.draw(caption, '', '#abbdb2', '#25372d');
    return { ...sign, caption, replacedBy };
  });

  const funControls = new THREE.Group();
  lab.add(funControls);
  funControls.visible = false;
  const funDeck = material(0x293735, { metalness: .35 });
  for (const [id, caption, x, color] of [
    ['fun-blast', 'Blast', -1.58, 0xe7613e],
    ['fun-reset', 'Reset', 0, 0xe7b868],
    ['fun-splash', 'Splash', 1.58, 0x5ed9eb],
  ]) {
    box(funControls, [.88, .38, .59], funDeck, x, .30, .52);
    mesh(funControls, new THREE.CylinderGeometry(.22, .25, .14, 22), glow(color), x, .53, .52);
    const { tag } = station(funControls, id, caption, x, .33, .826, .75, [[.86, .58, .58], [x, .36, .53]]);
  }

  const vrText = panel(scene, 3.1, 1.20, -.05, 3.25, -2.95);
  vrText.face.visible = false;
  const crazyPlaques = Array.from({ length: 4 }, () => panel(lab, 2.30, .70, 0, 0, -.48));
  for (const plaque of crazyPlaques) plaque.face.visible = false;
  const ray = new THREE.Raycaster();
  const buildRay = new THREE.Raycaster();
  const centerCursor = new THREE.Vector2();
  const cursor = new THREE.Vector2();
  const funPointer = new THREE.Vector2();
  const funScrollLook = new THREE.Vector2();
  let funPointerOnCanvas = false;
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const keys = new Set();
  let pickable = [];
  let pointer;
  let state;
  let previousTime;
  let phaseAt = 0;
  let equipmentPrepAt = -Infinity;
  let atomAt = -Infinity;
  let miniPowered = false;
  let suggestion = null;
  let suggestedUntil = 0;
  let pipeReady = false;
  let alarm;
  let funEffect;
  let funEmergency;
  let funAlarmActive = false;
  let funArena;
  let funRack;
  let funFurniture;
  let funChairAudio;
  let funDamage;
  let funCelebration;
  let funEncounter;
  let funFirearmView;
  let funTriggerHeld = false;
  let funLookSensitivity = 1;
  let funMeleeReadyAt = 0;
  const detachedFunDevices = new Set();
  const detachedCopperPlates = new Set();
  let funEncounterActive = false;
  let funGuardsPaused = false;
  let funMenuOpen = false;
  let funAirborne = false;
  let funJumpSpeed = 0;
  const funEyeHeight = 1.8;
  let funOrb = 'training';
  let bubbleBurstAt = -Infinity;
  const funMoveKeys = new Set();
  const funMoveStick = new THREE.Vector2();
  const funGround = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.08);
  const funBounds = new THREE.Box3(
    new THREE.Vector3(FUN_ARENA_BOUNDS.minX, .045, FUN_ARENA_BOUNDS.minZ),
    new THREE.Vector3(FUN_ARENA_BOUNDS.maxX, 5.43, FUN_ARENA_BOUNDS.maxZ),
  );
  const funTarget = new THREE.Vector3();
  const funMuzzle = new THREE.Vector3();
  const funOrigin = new THREE.Vector3();
  const funPlayer = new THREE.Vector3();
  const funFacing = new THREE.Vector3();
  let crazyTargets = [];
  const now = () => performance.now() / 1000;
  const moveKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
  const learningFocus = {
    idle: [supplyX, 1.34, 1.69],
    electrolysis: [cellX, 1.73, 2.23],
    observe: [cellX, 1.73, 2.23],
    route: [.22, 2.42, 3.74],
    'gas-flow': [.22, 2.42, 3.74],
    filter: [prepX - .24, 1.66, 1.36],
    filtering: [prepX - .24, 1.66, 1.36],
    'prep-dry': [prepX + .16, 1.62, 1.62],
    drying: [(prepX + ovenX) / 2, 1.63, 2.55],
    ready: [ovenX, 1.54, 1.78],
    reduction: [ovenX, 1.54, 1.78],
    product: [ovenX, 1.27, 1.36],
    won: [ovenX, 1.27, 1.36],
  };
  const learningCaptions = {
    start: 'Power on', 'lab-observe': 'Inspect tank', pipe: 'Route gas',
    prep: 'Start filtering', dry: 'Rinse and dry', reactor: 'Start reactor', 'inspect-powder': 'Inspect powder',
  };
  const prepFocusPhases = new Set(['filter', 'filtering', 'prep-dry', 'drying', 'ready', 'reduction', 'product', 'won']);
  const equipmentPrepFocus = [filterX - .02, 1.69, 1.03, equipmentZ];

  function viewFocus(area) {
    if (!area) return null;
    if (area.room === 'gallery') return area.lesson === 'equipment-prep' ? equipmentPrepFocus : null;
    if (area.learning) return learningFocus[area.prepPhase] ?? learningFocus.idle;
    return area.animatedPrep && prepFocusPhases.has(area.prepPhase) ? learningFocus[area.prepPhase] : null;
  }

  function center(area = state) {
    if (area?.fun) {
      rig.position.set(0, funEyeHeight, camera.aspect < 1.25 ? 7.75 : 6.0);
      camera.rotation.set(-.025, 0, 0);
      funPointerOnCanvas = false;
      funScrollLook.set(0, 0);
      funAirborne = false;
      funJumpSpeed = 0;
      return;
    }
    const focus = viewFocus(area);
    if (focus) {
      const [x, targetY, z, targetZ = labZ] = focus;
      const y = targetY + .37;
      rig.position.set(x, y, z);
      camera.rotation.set(-Math.atan2(y - targetY, z - targetZ), 0, 0);
      return;
    }
    if (area?.palace && area.room === 'gallery' && area.lesson) {
      const focus = area.lesson.startsWith('atom-') ? focusX.atom : focusX.electrodes;
      rig.position.set(focus, 1.72, 1.36);
      camera.rotation.set(-.068, 0, 0);
      return;
    }
    const narrow = camera.aspect < 1.25;
    const labView = area?.room === 'lab';
    const compactLab = labView && camera.aspect < 1.60;
    const x = compactLab ? (narrow ? -.45 : -.32) : 0;
    const z = camera.aspect < 1.05 ? 7.25 : narrow ? 6.25 : compactLab && camera.aspect < 1.49 ? 6 : 4.9;
    rig.position.set(x, 1.58, z);
    camera.rotation.set(-.015, 0, 0);
  }

  function resize() {
    const { width, height } = viewport.getBoundingClientRect();
    if (width < 1 || height < 1 || renderer.xr.isPresenting) return;
    camera.aspect = width / height;
    const halfAngle = THREE.MathUtils.degToRad(53 / 2);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfAngle) / Math.min(camera.aspect, 1)));
    camera.updateProjectionMatrix();
    const scale = Math.min(devicePixelRatio, 1.5, Math.sqrt(1_250_000 / (width * height)));
    renderer.setDrawingBufferSize(width, height, scale);
  }
  resize();
  center();
  new ResizeObserver(resize).observe(viewport);

  function rayHit() {
    const targets = renderer.xr.isPresenting && crazyTargets.length ? crazyTargets : pickable;
    const hits = ray.intersectObjects(targets, false);
    const visibleHit = hits.find(({ object }) => !object.userData.stationVolume);
    const stationHit = visibleHit ?? hits[0];
    if (state?.fun) {
      const prop = funFurniture?.hit(ray);
      const siren = funArena?.hitSiren(ray);
      if (siren && siren.distance < Math.min(stationHit?.distance ?? Infinity, prop?.distance ?? Infinity)) {
        return 'fun-siren';
      }
      if (prop && (!stationHit || prop.distance < stationHit.distance)) return prop.object.userData.action;
    }
    return stationHit?.object.userData.action;
  }

  function setPointerRay(raycaster, x, y) {
    const bounds = canvas.getBoundingClientRect();
    camera.updateWorldMatrix(true, false);
    const onCanvas = bounds.width && bounds.height && x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom;
    if (!onCanvas) return false;
    cursor.set(2 * (x - bounds.left) / bounds.width - 1, 1 - 2 * (y - bounds.top) / bounds.height);
    raycaster.setFromCamera(cursor, camera);
    return true;
  }

  function setFunInputRay(raycaster) {
    if (funPointerOnCanvas && document.pointerLockElement !== canvas && !renderer.xr.isPresenting &&
      setPointerRay(raycaster, funPointer.x, funPointer.y)) return;
    camera.updateWorldMatrix(true, false);
    raycaster.setFromCamera(centerCursor, camera);
  }

  function hitAt(event) {
    if (!setPointerRay(ray, event.clientX, event.clientY)) return;
    return rayHit();
  }

  function turnCamera(dx, dy, speed) {
    const factor = state?.fun ? speed * funLookSensitivity : speed;
    camera.rotation.y -= dx * factor;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - dy * factor, -1.12, 1.12);
  }

  function sceneInputBlocked() {
    return document.hidden || Boolean(document.querySelector('dialog[open]')) ||
      (state?.fun && (funGuardsPaused || funMenuOpen));
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || sceneInputBlocked()) return;
    if (state?.fun && event.pointerType === 'touch') funPointerOnCanvas = false;
    if (state?.fun && document.pointerLockElement === canvas) {
      aimFunCenter();
      return;
    }
    if ((!event.isPrimary && !state?.fun) || pointer) return;
    const threshold = event.pointerType === 'touch' ? 12 : 8;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, drag: false,
      threshold, action: state?.fun ? null : hitAt(event) };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (state?.fun && event.pointerType === 'mouse' && document.pointerLockElement !== canvas) {
      funPointerOnCanvas = true;
      funPointer.set(event.clientX, event.clientY);
    }
    if (!pointer && document.pointerLockElement !== canvas && !onHover) return;
    if (sceneInputBlocked()) return;
    if (state?.fun && document.pointerLockElement === canvas) {
      turnCamera(event.movementX, event.movementY, .0025);
      return;
    }
    if (pointer?.id === event.pointerId) {
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!pointer.drag && Math.hypot(dx, dy) < pointer.threshold) return;
      pointer.drag = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      turnCamera(dx, dy, .004);
      return;
    }
    if (onHover) {
      const id = hitAt(event);
      onHover(id);
      canvas.classList.toggle('pointing', Boolean(id));
    }
  });
  canvas.addEventListener('wheel', (event) => {
    if (!state?.fun || event.ctrlKey || sceneInputBlocked() || !event.cancelable) return;
    event.preventDefault();
    if (document.pointerLockElement !== canvas) {
      funPointerOnCanvas = true;
      funPointer.set(event.clientX, event.clientY);
    }
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1;
    funScrollLook.x = THREE.MathUtils.clamp(funScrollLook.x + event.deltaX * scale, -160, 160);
    funScrollLook.y = THREE.MathUtils.clamp(funScrollLook.y + event.deltaY * scale, -160, 160);
  }, { passive: false });
  canvas.addEventListener('pointerup', (event) => {
    if (pointer?.id !== event.pointerId) return;
    const click = !pointer.drag;
    const { action } = pointer;
    pointer = null;
    if (!click || sceneInputBlocked()) return;
    if (state?.fun) {
      if (setPointerRay(ray, event.clientX, event.clientY)) useFunAim(rayHit());
    }
    else if (action) onSelect(action);
  });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, (event) => { if (pointer?.id === event.pointerId) pointer = null; });
  }
  canvas.addEventListener('pointerleave', () => {
    funPointerOnCanvas = false;
    onHover?.(null);
    canvas.classList.remove('pointing');
  });
  for (const name of ['pointerlockchange', 'fullscreenchange']) {
    document.addEventListener(name, () => { pointer = null; funPointerOnCanvas = false; funScrollLook.set(0, 0); });
  }
  const editable = (target) => target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
  window.addEventListener('keydown', (event) => {
    if (!moveKeys.includes(event.code) || sceneInputBlocked() || event.altKey || event.ctrlKey || event.metaKey || editable(event.target)) return;
    if (!state?.fun && event.code.startsWith('Arrow') && event.target instanceof HTMLElement && event.target.closest('button, summary, a')) return;
    event.preventDefault();
    if (!event.repeat) keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  function clearInput() {
    keys.clear();
    funMoveKeys.clear();
    funMoveStick.set(0, 0);
    funTriggerHeld = false;
    pointer = null;
    funPointerOnCanvas = false;
    funScrollLook.set(0, 0);
  }
  window.addEventListener('focusin', (event) => {
    if (editable(event.target) || event.target.closest?.('dialog[open]')) clearInput();
  });
  window.addEventListener('blur', clearInput);
  window.addEventListener('pagehide', clearInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInput();
  });

  function controllerRay(controller) {
    ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    ray.ray.direction.set(0, 0, -1).transformDirection(controller.matrixWorld);
    return rayHit();
  }

  const controllers = [0, 1].map((index) => {
    const controller = renderer.xr.getController(index);
    const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(), new THREE.Vector3(0, 0, -9),
    ]), new THREE.LineBasicMaterial({ color: 0x96d7bc, transparent: true, opacity: .58 }));
    controller.add(beam);
    controller.addEventListener('select', () => {
      const action = controllerRay(controller);
      if (state?.fun) useFunAim(action);
      else if (action) onSelect(action);
    });
    rig.add(controller);
    return { controller, beam };
  });

  renderer.xr.addEventListener('sessionstart', () => {
    center();
    camera.rotation.set(0, 0, 0);
    vrText.face.visible = true;
    for (const face of crazyTargets) face.visible = true;
    keys.clear();
  });
  renderer.xr.addEventListener('sessionend', () => {
    vrText.face.visible = false;
    for (const face of crazyTargets) face.visible = false;
    resize();
    center();
  });

  function update(next, active, heading, text, labels = {}) {
    const animatedPrep = Boolean(next.learning || !next.crazy);
    const prepPhase = next.phase === 'route' && active.includes('prep') ? 'filter' : next.phase;
    const current = { ...next, animatedPrep, prepPhase };
    const lessonOpened = state?.lesson !== next.lesson && (next.lesson === 'atom-signs' || next.lesson?.endsWith('-intro'));
    const nextFocus = viewFocus(current);
    const lastFocus = viewFocus(state);
    const focusChanged = nextFocus !== lastFocus;
    const palaceFocusChanged = next.palace && Boolean(state?.lesson) !== Boolean(next.lesson);
    if ((state?.room !== next.room || state?.wing !== next.wing || focusChanged || lessonOpened || palaceFocusChanged) && !renderer.xr.isPresenting) center(current);
    if (lessonOpened && next.lesson === 'atom-intro') atomAt = -Infinity;
    if (state?.lesson !== next.lesson) equipmentPrepAt = next.lesson === 'equipment-prep' ? now() : -Infinity;
    if (!next.lesson?.startsWith('electrodes-') || next.lesson === 'electrodes-intro') miniPowered = false;
    if (state?.phase !== next.phase) {
      phaseAt = now();
      if (next.phase === 'product') reactor.reveal.reset().setEffectiveTimeScale(1 / (next.animationPace ?? 1)).play();
    }
    for (const flow of flows) {
      if (flow.id === 'solid' && animatedPrep) {
        flow.started = -Infinity;
      } else if (next.learning) {
        if (next.phase !== 'gas-flow') flow.started = -Infinity;
        else if (state?.phase !== next.phase) flow.started = now();
      } else if (!next[flow.id]) flow.started = -Infinity;
      else if (!state?.[flow.id]) flow.started = now();
    }
    if (Boolean(next.crazy) !== Boolean(state?.crazy)) {
      labTitle.draw(next.crazy ? 'CRAZY LAB' : 'COPPER LAB', '', '#ffcc9d', '#1e2d25');
    }
    if (animatedPrep !== state?.animatedPrep) {
      for (const sign of labCaptions) {
        const caption = sign.caption === 'Filter and dryer' && !animatedPrep ? 'Filter' : sign.caption;
        sign.draw(caption, '', '#abbdb2', '#25372d');
      }
    }
    state = current;
    const inPalace = next.room === 'gallery';
    if (inPalace || !next.crazy) clearAlarm();
    if (inPalace || !next.fun) clearFunEffect();
    gallery.visible = inPalace && next.wing !== 'equipment';
    equipment.visible = inPalace && !gallery.visible;
    lab.visible = !inPalace;
    funControls.visible = lab.visible && Boolean(next.fun);
    if (funControls.visible && !funArena) {
      funArena = createFunArena(lab, reducedMotion);
      funDamage = createFunDamage(lab, funEquipment, cell, powerAssembly, reducedMotion, [classicPrep, ovenAssembly]);
      funFurniture = createFunFurniture(lab, camera, reducedMotion, impact => funChairAudio?.(impact));
      registerFunProps();
      funEncounter = createFunEncounter(lab, reducedMotion, funFurniture, funDamage.mark,
        (x, z) => funEquipmentFloor(x, z) > 0,
        () => funChairAudio?.({ item: 'Robot strike', surface: 'shield', phase: 'impact' }));
      funRack = createFunRack(lab, camera);
      funFirearmView = createFunFirearmView(camera, reducedMotion, () => document.getElementById('fun-sound').checked);
      funCelebration = createFunCelebration(lab, reducedMotion);
    }
    if (funArena) {
      funArena.group.visible = funControls.visible;
      funRack.setVisible(funControls.visible);
      funFurniture.setVisible(funControls.visible);
      funFirearmView.select(funControls.visible ? funOrb : null);
      for (const surface of standardLabShell) surface.visible = !funControls.visible;
      labTitle.face.visible = !funControls.visible;
    }
    classicPrep.visible = !animatedPrep && !(next.fun && detachedFunDevices.has(2));
    learningPrep.group.visible = lab.visible && animatedPrep;
    const phaseElapsed = (now() - phaseAt) / (next.animationPace ?? 1);
    if (learningPrep.group.visible) learningPrep.update(prepPhase, phaseElapsed, reducedMotion);
    for (const { face, replacedBy } of labCaptions) face.visible = lab.visible && !replacedBy.some((id) => active.includes(id));
    syncFunPropDisplays();
    const lessonOpen = inPalace && Boolean(next.lesson);
    const saltInWater = next.lesson === 'salt-done';
    saltNote.face.visible = gallery.visible && (next.lesson === 'salt-intro' || saltInWater);
    if (saltNote.face.visible) saltNote.draw(saltInWater ? 'The salt dissolved' : 'Water and salt', '', '#b9e9ec');
    salt.crystals.visible = !saltInWater;
    for (const dot of salt.dissolved) dot.visible = saltInWater;
    const signOpen = lessonOpen && ['atom-signs', 'atom-paired'].includes(next.lesson);
    const atomOpen = lessonOpen && !signOpen && next.lesson.startsWith('atom-');
    atom.group.visible = !signOpen;
    for (const [index, row] of signRows.entries()) {
      row.face.visible = signOpen;
      if (signOpen) {
        const paired = next.lesson === 'atom-paired';
        row.draw(paired ? '+     −     →     0' : ['+         +', '−         −'][index], '',
          paired ? '#bbebcf' : index === 0 ? '#ffd2ad' : '#bde6ef');
      }
    }
    atom.counts.face.visible = atomOpen;
    atom.key.visible = atomOpen && !next.palace;
    atom.wireNote.visible = atomOpen && !next.palace && next.lesson === 'atom-question';
    if (atomOpen) {
      const counts = { 'atom-intro': 'Paired     + −   + −', 'atom-question': 'One left     + −   + □', 'atom-done': 'Copper ion → water' };
      atom.counts.draw(counts[next.lesson]);
    }
    const namePlates = next.lesson === 'electrodes-done';
    mini.signs[0].draw(namePlates ? '+ Anode' : '+');
    mini.signs[1].draw(namePlates ? '− Cathode' : '−', '', '#b9e9ec');
    for (const door of labDoors) door.caption = active.includes('enter') ? 'Laboratory' : 'Entrance closed';
    for (const { id, lamp } of doorLights) lamp.material.color.setHex(next.seen.has(id) ? jade : 0x745746);
    gasTube.material.color.setHex(next.gas ? 0xa5dfd1 : 0x4e6e69);
    powderTrail.visible = next.solid && !animatedPrep;
    reactor.sample.visible = ['product', 'quiz', 'won'].includes(next.phase);
    powderNote.face.visible = reactor.sample.visible;
    reactor.showLearning(animatedPrep ? prepPhase : null, phaseElapsed);
    const powered = labPowered(next);
    labPower.setOn(powered);
    for (const note of cellNotes) note.face.visible = lab.visible && powered;
    powerComparison.caption = labels['compare-power'] ?? (powered ? 'Turn current off' : 'Turn current back on');
    pickable = [];
    if (funRack?.group.visible) pickable.push(...funRack.targets);
    pipeReady = lab.visible && active.includes('pipe');
    if (pipeReady) pickable.push(gasTube, pipeAim);
    hoodNote.face.visible = pipeReady || (lab.visible && (active.includes('gas') || (next.learning && next.phase === 'gas-flow')));
    chamberNote.face.visible = lab.visible && ['ready', 'reduction'].includes(next.phase);
    if (chamberNote.face.visible) chamberNote.draw(next.phase === 'ready' ? 'Dry grains + hydrogen' : 'Heating · copper forms', '', '#ffc695');
    if (lessonOpen && next.lesson === 'atom-signs') {
      signRows[1].face.userData.action = 'pair-charges';
      pickable.push(signRows[1].face);
    }
    if (lessonOpen && next.lesson === 'atom-intro') {
      atom.electron.userData.action = 'atom-remove';
      pickable.push(atom.electron);
    }
    if (lessonOpen && next.lesson === 'electrodes-question') {
      mini.signs[0].face.userData.action = 'plate-plus';
      mini.signs[1].face.userData.action = 'plate-minus';
      pickable.push(...mini.signs.map((sign) => sign.face));
      if (next.palace) {
        for (const bubble of mini.bubbles) bubble.userData.action = 'plate-minus';
        pickable.push(...miniInputs, ...mini.bubbles);
      }
    }
    if (next.palace && active.includes('electrodes-power')) pickable.push(miniPowerInput);
    if (next.palace) pickable.push(...filterAnswers.filter(({ userData }) => active.includes(userData.action)));
    for (const { id, parent, tag, caption, volume, classicOnly } of stations) {
      const enabled = parent.visible && !(animatedPrep && classicOnly) && active.includes(id);
      const visited = next.seen.has(id);
      tag.face.visible = enabled || (inPalace && parent.visible && id === 'enter' && !lessonOpen && !next.palace);
      if (tag.face.visible) {
        const guided = enabled && next.hintAction === id;
        const label = guided && next.hintLabel ? next.hintLabel
          : next.discovery || next.palace || parent === funControls ? (labels[id] ?? caption)
          : next.learning ? (learningCaptions[id] ?? caption) : caption;
        const text = visited ? `✓  ${label}` : label;
        const primaryLabAction = enabled && (parent === lab || parent === learningPrep.group) && id !== 'compare-power';
        const accent = guided ? '#ffd18c' : visited || primaryLabAction ? '#bbebcf' : enabled ? '#ffd1a6' : '#b9ae98';
        tag.draw(text, '', accent, guided ? '#392d20' : primaryLabAction ? '#204535' : next.selected === id ? '#4a3828' : '#16251e');
      }
      if (enabled) {
        pickable.push(tag.face);
        if (volume) pickable.push(volume);
      }
    }
    const spacing = active.length === 2 ? 2.2 : 2.18;
    for (const [index, plaque] of lessonActions.entries()) {
      const id = active[index];
      plaque.face.visible = lessonOpen && Boolean(id) && id !== 'salt-compare';
      if (!plaque.face.visible) continue;
      if (next.palace) {
        const centerX = next.lesson.startsWith('atom-') ? focusX.atom : focusX.electrodes;
        plaque.face.position.set(centerX + (index - (active.length - 1) / 2) * 1.34, .60, -.85);
        plaque.face.scale.setScalar(.65);
      } else {
        plaque.face.position.set((index - (active.length - 1) / 2) * spacing, .47, -.85);
        plaque.face.scale.setScalar(1);
      }
      plaque.face.userData.action = id;
      if (next.hintAction === id) plaque.draw(labels[id] ?? id, '', '#ffd18c', '#392d20');
      else plaque.draw(labels[id] ?? id);
      pickable.push(plaque.face);
    }
    crazyTargets = [];
    const crazyActions = next.crazy && !inPalace ? active.filter((id) => id.startsWith('crazy-')) : [];
    for (const [index, plaque] of crazyPlaques.entries()) {
      const id = crazyActions[index];
      plaque.face.visible = Boolean(id) && renderer.xr.isPresenting;
      if (!id) continue;
      plaque.face.position.set(crazyActions.length === 1 ? 0 : (index % 2 ? 1.22 : -1.22),
        crazyActions.length === 1 ? .78 : index < 2 ? 1.28 : .52, -.48);
      plaque.face.userData.action = id;
      const label = labels[id] ?? id;
      if (/^crazy-[a-d]$/.test(id)) {
        plaque.draw(`Option ${id.at(-1).toUpperCase()}`, label.replace(/^[A-D][\s.)·:—-]+/u, ''), '#ffe2bf');
      } else plaque.draw(label, '', '#bbebcf', '#204535');
      crazyTargets.push(plaque.face);
    }
    const hinted = next.hintAction ? pickable.find(object => object.userData.action === next.hintAction && object.userData.stationVolume)
      ?? pickable.find(object => object.userData.action === next.hintAction) : undefined;
    actionCue.select(hinted, next.hintAction, next.hintAction === 'pipe' ? pipeCuePoint : undefined);
    vrText.draw(heading, text);
    scene.updateMatrixWorld(true);
  }

  function labPowered(current) {
    return current?.phase === 'electrolysis' || (current?.phase === 'observe' && current.comparePower !== false);
  }

  function exhibit(id) {
    if (id === 'atom') atomAt = now();
    if (id === 'electrodes') miniPowered = true;
    if (id === 'palace-bubble-pop') bubbleBurstAt = now();
  }

  function suggest(id) {
    suggestion = id;
    suggestedUntil = now() + 2.5;
  }

  function playAlarm({ dramatic = false } = {}) {
    alarm ??= trainingAlarm(lab, reducedMotion);
    alarm.play(now(), dramatic);
  }

  function clearAlarm() {
    alarm?.clear();
  }

  function playFunEffect(effect) {
    if (!state?.fun || (effect !== 'blast' && effect !== 'splash')) return;
    funEffect ??= roomEffects(lab, scene, reducedMotion);
    funEffect.play(effect);
  }

  function clearFunEffect() {
    funEffect?.clear();
    funEmergency?.clear();
    if (funAlarmActive) setFunAlarm(false);
  }

  function setFunAlarm(active) {
    if (active && !state?.fun) return;
    if (active) funEmergency ??= roomEmergency(lab, reducedMotion);
    funAlarmActive = Boolean(active);
    funEmergency?.setAlarm(funAlarmActive);
    funArena?.setSiren(funAlarmActive);
  }

  function playFunSprinklers() {
    if (!state?.fun) return;
    funEmergency ??= roomEmergency(lab, reducedMotion);
    funEmergency.startSprinklers();
  }

  function startFunEncounter() {
    if (!funEncounter || !state?.fun) return false;
    funEncounter.start();
    funCelebration.clear();
    funEncounterActive = true;
    return true;
  }

  function resetFunEncounter() {
    funEncounterActive = false;
    clearInput();
    funEncounter?.reset();
    funArena?.reset();
    funCelebration?.clear();
  }

  function canUseFunWeapon() {
    return Boolean(state?.fun && funEncounter && !funGuardsPaused && !funMenuOpen);
  }

  function syncFunPropDisplays() {
    const active = Boolean(state?.fun);
    const generatorPresent = !active || !detachedFunDevices.has(0) && !funDamage?.broken(0);
    powerAssembly.visible = generatorPresent;
    classicPrep.visible = !state?.animatedPrep && !(active && detachedFunDevices.has(2));
    ovenAssembly.visible = !(active && detachedFunDevices.has(3));
    cell.plates.forEach((plate, index) => {
      plate.visible = !(active && detachedCopperPlates.has(index));
      cell.signs[index].face.visible = plate.visible;
    });
    powerLeads.forEach((lead, index) => {
      lead.visible = generatorPresent && cell.plates[index].visible;
    });
    if (active) labCaptions.forEach(({ face }, index) => { face.visible = !detachedFunDevices.has(index); });
  }

  function registerFunProps() {
    for (const [index, plate] of cell.plates.entries()) {
      const platePosition = plate.getWorldPosition(new THREE.Vector3());
      const scale = plate.getWorldScale(new THREE.Vector3());
      const { width, height, depth } = plate.geometry.parameters;
      const plateBody = plate.clone();
      plateBody.scale.copy(scale);
      plateBody.position.set(0, height * scale.y * .5, 0);
      platePosition.y -= plateBody.position.y;
      funFurniture.addProp({
        name: 'Copper plate', visual: plateBody, home: platePosition,
        shape: [width * scale.x, height * scale.y, depth * scale.z + .12], material: 'copper',
        onGrab() {
          detachedCopperPlates.add(index);
          syncFunPropDisplays();
        },
        onReset() {
          detachedCopperPlates.delete(index);
          syncFunPropDisplays();
        },
      });
    }
    for (const [index, name, material, assembly] of [
      [0, 'Generator', 'generator', powerAssembly],
      [2, 'Filter', 'metal', classicPrep],
      [3, 'Reactor', 'metal', ovenAssembly],
    ]) {
      const source = funEquipment[index];
      const { width, height, depth } = source.geometry.parameters;
      const home = source.position.clone().setY(.89);
      const visual = new THREE.Group();
      const clone = assembly.clone(false);
      clone.position.sub(home);
      for (const piece of assembly.children) {
        if (piece.visible && piece !== reactor.sample) clone.add(piece.clone());
      }
      visual.add(clone);
      funFurniture.addProp({
        name, visual, home, shape: [width, Math.max(height, source.position.y + height / 2 - home.y), depth], material,
        available: () => !funDamage.broken(index),
        onGrab() {
          detachedFunDevices.add(index);
          funDamage.detach(index);
          syncFunPropDisplays();
        },
        onReset() {
          detachedFunDevices.delete(index);
          syncFunPropDisplays();
        },
      });
    }
  }

  function findFunDevice() {
    return ray.intersectObjects(funEquipment, false).find(({ object }) => isFunDeviceMounted(funEquipment.indexOf(object)));
  }

  function isFunDeviceMounted(index) {
    return !detachedFunDevices.has(index) && (index === 1 || !funDamage?.broken(index));
  }

  function funDeviceSurface(index) {
    return index === 0 ? 'generator' : index === 1 && cell.shell.visible ? 'glass' : 'equipment';
  }

  function throwFunOrb() {
    if (!canUseFunWeapon()) return false;
    if (isFunFirearm(funOrb)) {
      setFunInputRay(ray);
      return shootFunFirearm();
    }
    camera.getWorldPosition(funOrigin);
    ray.setFromCamera(cursor.set(0, 0), camera);
    const siren = shootAimedSiren();
    if (siren !== undefined) return siren;
    if (funEncounterActive) return funEncounter.throwOrb(funOrb, funOrigin, null);
    const equipment = findFunDevice();
    if (equipment && equipment.distance <= 4.8) return launchAtEquipment(equipment);
    camera.getWorldDirection(funTarget).multiplyScalar(4.8).add(funOrigin).setY(.08);
    return funEncounter.throwOrb(funOrb, funOrigin, funTarget);
  }

  function shootFunFirearm() {
    const boundary = ray.ray.intersectBox(funBounds, funTarget);
    let distance = boundary ? ray.ray.origin.distanceTo(boundary) : 20;
    let impact;
    const siren = funArena.hitSiren(ray);
    const device = findFunDevice();
    if (siren && siren.distance < Math.min(distance, device?.distance ?? Infinity)) {
      distance = siren.distance;
      impact = () => { if (funArena.disableSiren()) onSelect('fun-siren-hit'); };
    } else if (device && device.distance < distance) {
      distance = device.distance;
      const index = funEquipment.indexOf(device.object);
      impact = () => hitFunDevice(index);
    }
    if (!funEncounter.shootFirearm(funOrb, ray, distance, impact, funFirearmView.origin(funMuzzle))) return false;
    funFirearmView.fire();
    return true;
  }

  function throwAlongRay() {
    const aimed = funEncounter.aim(ray);
    const equipment = findFunDevice();
    if (equipment && (!aimed || equipment.distance + .30 < Math.hypot(aimed.x - ray.ray.origin.x, aimed.z - ray.ray.origin.z))) {
      if (funFurniture.holding() === 'Hammer' && equipment.distance < 3.2) {
        const index = funEquipment.indexOf(equipment.object);
        if (funFurniture.swing()) hitFunDevice(index);
        return;
      }
      return launchAtEquipment(equipment);
    }
    const target = aimed ?? ray.ray.intersectPlane(funGround, funTarget);
    if (!target) return;
    target.x = THREE.MathUtils.clamp(target.x, FUN_ARENA_BOUNDS.minX, FUN_ARENA_BOUNDS.maxX);
    target.z = THREE.MathUtils.clamp(target.z, FUN_ARENA_BOUNDS.minZ, FUN_ARENA_BOUNDS.maxZ);
    funEncounter.throwOrb(funOrb, ray.ray.origin, target);
  }

  function shootAimedSiren() {
    const hit = funArena?.hitSiren(ray);
    if (!hit) return undefined;
    const guard = funEncounter.aim(ray);
    const guardDistance = guard ? guard.distanceTo(ray.ray.origin) : Infinity;
    const equipment = findFunDevice();
    if (hit.distance > Math.min(guardDistance, equipment?.distance ?? Infinity)) return undefined;
    return funEncounter.throwOrb(funOrb, ray.ray.origin, hit.point, () => {
      if (funArena.disableSiren()) onSelect('fun-siren-hit');
    });
  }

  function launchAtEquipment(hit) {
    const index = funEquipment.indexOf(hit.object);
    return funEncounter.throwOrb(funOrb, ray.ray.origin, hit.point, () => hitFunDevice(index));
  }

  function aimFunCenter() {
    camera.updateWorldMatrix(true, false);
    ray.setFromCamera(cursor.set(0, 0), camera);
    useFunAim(rayHit());
  }

  function useFunAim(action) {
    if (funGuardsPaused) return;
    if (action?.startsWith('fun-weapon-')) { onSelect(action); return; }
    const held = funFurniture?.holding();
    if (action === 'fun-siren' && canUseFunWeapon()) {
      if (isFunFirearm(funOrb)) { shootFunFirearm(); return; }
      if (shootAimedSiren() !== undefined) return;
    }
    if (held === 'Box') onSelect('fun-aim-box');
    else if (held === 'Chair') {
      const propId = action?.startsWith('fun-prop-') ? Number(action.slice('fun-prop-'.length)) : -1;
      onSelect(funFurniture.canStackOn(propId) ? 'fun-aim-place' : 'fun-aim-toss');
    } else if (held && held !== 'Hammer' && held !== 'Crowbar') onSelect('fun-aim-toss');
    else if (action === 'fun-siren') return;
    else if (isFunFirearm(funOrb) && canUseFunWeapon() && (!action || action.startsWith('fun-prop-'))) shootFunFirearm();
    else if (action) onSelect(action);
    else if (canUseFunWeapon()) throwAlongRay();
  }

  function useFunMelee() {
    const item = funFurniture.holding();
    const withTool = item === 'Crowbar' || item === 'Hammer' || item === 'Copper plate';
    if (!withTool && !isFunFirearm(funOrb)) return 'Equip a crowbar or firearm to strike.';
    if (now() < funMeleeReadyAt) return 'Ready to strike again shortly.';
    if (withTool && !funFurniture.swing()) return 'Ready to strike again shortly.';
    funMeleeReadyAt = now() + .42;
    if (!withTool) funFirearmView.melee();
    setFunInputRay(ray);
    const guard = funEncounter.aim(ray);
    const device = findFunDevice();
    const distance = guard ? Math.hypot(guard.x - funOrigin.x, guard.y + 1.12 - funOrigin.y, guard.z - funOrigin.z) : Infinity;
    const soundItem = withTool ? item : 'Weapon strike';
    if (distance <= 2 && distance < (device?.distance ?? Infinity) &&
        funEncounter.propImpact(guard, funGuardsPaused, soundItem)) {
      funChairAudio?.({ item: soundItem, surface: 'robot', phase: 'impact' });
      return 'Robot disabled.';
    }
    if (device?.distance <= 2) {
      const index = funEquipment.indexOf(device.object);
      funChairAudio?.({ item: soundItem, surface: funDeviceSurface(index), phase: 'impact' });
      hitFunDevice(index);
      return 'Device damaged.';
    }
    return 'Aim at a target within 2 m.';
  }

  function hitFunDevice(index, gel = false) {
    if (!isFunDeviceMounted(index)) return;
    funDamage.hit(index, gel);
    syncFunPropDisplays();
    onSelect('fun-equipment-hit');
  }

  function useFunFurniture(action, index, allowNearby = false) {
    if (!funFurniture || !state?.fun) return 'Furniture needs the 3D lab.';
    camera.getWorldPosition(funOrigin);
    if (action === 'melee') return useFunMelee();
    if (action === 'drop') {
      camera.getWorldDirection(funFacing);
      return funFurniture.drop(funOrigin, funFacing);
    }
    const useCurrentRay = action.startsWith('aim-');
    if (action === 'grab') {
      if (index == null) {
        setFunInputRay(ray);
        const target = funFurniture.hit(ray)?.object.userData.action;
        if (target) index = Number(target.slice('fun-prop-'.length));
      }
      return funFurniture.grab(funOrigin, index, allowNearby);
    }
    if (action === 'gel') {
      const tank = funEquipment[1].position;
      if (Math.hypot(tank.x - funOrigin.x, tank.z - funOrigin.z) > 3.25) return 'Move closer to the tank to use gel.';
      hitFunDevice(1, true);
      return 'Fictional gel spilled. Watch the floor.';
    }
    if (action === 'hammer') {
      const item = funFurniture.holding();
      if (item === 'Crowbar') return useFunMelee();
      if (item !== 'Hammer' && item !== 'Copper plate') return funFurniture.grabHammer(funOrigin);
      camera.updateWorldMatrix(true, false);
      ray.setFromCamera(cursor.set(0, 0), camera);
      const equipment = findFunDevice();
      const guard = funEncounter.aim(ray);
      const guardDistance = guard ? Math.hypot(funOrigin.x - guard.x, funOrigin.z - guard.z) : Infinity;
      const reach = item === 'Copper plate' ? 2.6 : 3.2;
      if (guardDistance < reach && guardDistance < (equipment?.distance ?? Infinity)) {
        if (funFurniture.swing() && funEncounter.propImpact(guard, funGuardsPaused, item)) {
          funChairAudio?.({ item, surface: 'robot', phase: 'impact' });
          return 'Robot disabled.';
        }
        return 'Ready to swing again.';
      }
      let index = equipment?.distance < reach ? funEquipment.indexOf(equipment.object) : -1;
      if (index < 0 && item === 'Hammer') {
        let range = 2.45;
        for (const [i, { position }] of funEquipment.entries()) {
          if (!isFunDeviceMounted(i)) continue;
          const distance = Math.hypot(funOrigin.x - position.x, funOrigin.z - position.z);
          if (distance >= range) continue;
          range = distance;
          index = i;
        }
      }
      if (index < 0) return 'Move closer to the device to swing.';
      if (funFurniture.swing()) {
        funChairAudio?.({ item, surface: funDeviceSurface(index), phase: 'impact' });
        hitFunDevice(index);
        return 'Device damaged.';
      }
      return 'Ready to swing again.';
    }
    camera.getWorldDirection(funFacing);
    if (!useCurrentRay) setFunInputRay(ray);
    const boxPoint = action === 'aim-box' ? funFurniture.boxSpot(funOrigin, ray) : null;
    const toss = action === 'toss' || action === 'aim-toss' || (action === 'aim-box' && !boxPoint);
    if (boxPoint) return funFurniture.put(funOrigin, funFacing, false, null, boxPoint);
    if (!toss) return funFurniture.put(funOrigin, funFacing, false, ray);
    funFacing.copy(ray.ray.direction);
    const aimed = funEncounter.aim(ray);
    const device = findFunDevice();
    const range = funFurniture.tossRange();
    const boundary = ray.ray.intersectBox(funBounds, funTarget);
    const distance = Math.min(range, boundary ? ray.ray.origin.distanceTo(boundary) : range);
    if (device && device.distance <= distance) {
      const index = funEquipment.indexOf(device.object);
      return funFurniture.put(funOrigin, funFacing, true, null, device.point, () => hitFunDevice(index), funDeviceSurface(index), Boolean(aimed));
    }
    if (aimed) return funFurniture.put(funOrigin, funFacing, true, null, ray.ray.at(distance, funTarget), undefined, 'floor', true);
    const floor = ray.ray.intersectPlane(funGround, funTarget);
    const target = floor && funOrigin.distanceTo(floor) < distance + .10 ? floor : null;
    return funFurniture.put(funOrigin, funFacing, true, null, target);
  }

  function jumpFun() {
    if (!state?.fun || funAirborne || renderer.xr.isPresenting) return;
    funAirborne = true;
    funJumpSpeed = 7.1;
  }

  function funEquipmentFloor(x, z) {
    let height = 0;
    for (const [index, device] of funEquipment.entries()) {
      const { width, depth, height: size } = device.geometry.parameters;
      const dx = Math.abs(x - device.position.x);
      const dz = Math.abs(z - device.position.z);
      if (dx < 1.05 && dz < .80) height = Math.max(height, .89);
      if (isFunDeviceMounted(index) && dx < width / 2 + .06 && dz < depth / 2 + .06) height = Math.max(height, device.position.y + size / 2);
    }
    return height;
  }

  function funFloor(x, z) {
    return Math.max(funFurniture.floor(x, z), funEquipmentFloor(x, z));
  }

  function updateFunJump(delta) {
    if (renderer.xr.isPresenting) return;
    const ground = funFloor(rig.position.x, rig.position.z);
    const feet = rig.position.y - funEyeHeight;
    if (!funAirborne && feet <= ground + .02) return;
    funAirborne = true;
    const next = feet + funJumpSpeed * delta;
    funJumpSpeed -= 10.4 * delta;
    if (funJumpSpeed <= 0 && next <= ground) {
      rig.position.y = funEyeHeight + ground;
      funAirborne = false;
      funJumpSpeed = 0;
    } else rig.position.y = Math.max(funEyeHeight, funEyeHeight + next);
  }

  function reset() {
    atomAt = -Infinity;
    miniPowered = false;
    bubbleBurstAt = -Infinity;
    equipmentPrepAt = -Infinity;
    suggestion = null;
    clearAlarm();
    clearFunEffect();
    reactor.reveal.stop();
    if (!renderer.xr.isPresenting) center();
  }

  function move(delta) {
    if ((!keys.size && !funMoveKeys.size && !funMoveStick.lengthSq()) || renderer.xr.isPresenting) return;
    if (sceneInputBlocked()) { clearInput(); return; }
    const pressed = (letter, arrow) => Number(keys.has(letter) || keys.has(arrow) || funMoveKeys.has(letter));
    const along = pressed('KeyW', 'ArrowUp') - pressed('KeyS', 'ArrowDown') - funMoveStick.y;
    const across = pressed('KeyD', 'ArrowRight') - pressed('KeyA', 'ArrowLeft') + funMoveStick.x;
    const yaw = camera.rotation.y;
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    direction.copy(forward).multiplyScalar(along).addScaledVector(right, across).clampLength(0, 1);
    if (state?.fun) {
      const { minX, maxX, minZ, maxZ } = FUN_ARENA_BOUNDS;
      const x = THREE.MathUtils.clamp(rig.position.x + direction.x * 3.1 * delta, minX, maxX);
      const z = THREE.MathUtils.clamp(rig.position.z + direction.z * 3.1 * delta, minZ, maxZ);
      const feet = rig.position.y - funEyeHeight;
      if (funFloor(x, rig.position.z) <= feet + .025) rig.position.x = x;
      if (funFloor(rig.position.x, z) <= feet + .025) rig.position.z = z;
    } else {
      rig.position.addScaledVector(direction, 2.2 * delta);
      rig.position.x = THREE.MathUtils.clamp(rig.position.x, -5.95, 5.95);
      rig.position.z = THREE.MathUtils.clamp(rig.position.z, .42, 7.7);
    }
  }

  renderer.setAnimationLoop((timestamp) => {
    const t = now();
    const delta = previousTime == null ? 0 : Math.min((timestamp - previousTime) / 1000, .05);
    previousTime = timestamp;
    if (funScrollLook.lengthSq() > .01) {
      if (sceneInputBlocked()) funScrollLook.set(0, 0);
      else {
        const fraction = 1 - Math.exp(-delta * 35);
        turnCamera(funScrollLook.x * fraction, funScrollLook.y * fraction, .003);
        funScrollLook.multiplyScalar(1 - fraction);
      }
    }
    if (state?.fun && funFurniture) updateFunJump(delta);
    move(delta);
    const alarmPlaying = alarm?.update(t);
    funEffect?.update(t);
    funEmergency?.update(t);
    if (funArena?.group.visible) {
      if (!funGuardsPaused) funArena.update(delta, funEncounterActive);
      const player = renderer.xr.isPresenting ? renderer.xr.getCamera().getWorldPosition(funPlayer) : rig.position;
      camera.getWorldDirection(funFacing);
      const held = funFurniture.holding();
      const preview = !funGuardsPaused && !funMenuOpen && (held === 'Box' || held === 'Chair');
      if (preview) setFunInputRay(buildRay);
      funFurniture.update(funGuardsPaused ? 0 : delta, player, funFacing,
        (from, to, item) => funEncounter.sweepPropImpact(from, to, funGuardsPaused, item), preview ? buildRay : null);
      funDamage.update(delta);
      key.intensity = funDamage.powerDown() || detachedFunDevices.has(0) ? .72 : 2.1;
      const feet = player.y - funEyeHeight;
      const highGround = !renderer.xr.isPresenting && (funAirborne || feet > .20);
      funEncounter.update(delta, player, funGuardsPaused, highGround);
      if (funTriggerHeld && funOrb === 'carbine') throwFunOrb();
      funFirearmView.update(delta);
      const battle = funEncounterActive && funEncounter.snapshot().status;
      if (battle && battle !== 'active') {
        funEncounterActive = false;
        funMoveKeys.clear();
        if (battle === 'won') funCelebration.start();
      }
      funCelebration.update(delta);
    }
    if (renderer.xr.isPresenting) vrText.face.visible = !alarmPlaying;
    const atomElapsed = t - atomAt;
    const ion = atomElapsed >= .95;
    const illustrated = Number.isFinite(atomElapsed);
    const orbit = illustrated || state?.lesson === 'atom-intro' ? .28 : t * 1.15;
    const depart = illustrated ? THREE.MathUtils.smoothstep(atomElapsed, .20, 1.20) : 0;
    atom.electron.position.set(Math.cos(orbit) * .48 + depart * .95, Math.sin(orbit) * .36 + depart * .31, .22 + depart * .11);
    atom.electron.visible = depart < .995;
    atom.charge.visible = illustrated && ion && (state?.lesson === 'atom-done' || state?.seen.has('atom') && !state?.lesson);
    atom.core.rotation.y = t * .40;
    const lesson = state?.lesson;
    const focus = state?.room === 'gallery' && lesson ? focusX[lesson.startsWith('equipment-') ? lesson : lesson.split('-')[0]] : undefined;
    for (const [i, spark] of glints.entries()) {
      spark.visible = focus !== undefined;
      if (!spark.visible) continue;
      const angle = i * Math.PI / 3 + (reducedMotion ? 0 : t * .5);
      spark.position.set(focus + Math.cos(angle) * .84, 1.46 + Math.sin(angle * 2) * .37, -1.49 + Math.sin(angle) * .31);
      spark.rotation.y = angle;
    }
    animateTank(mini, t, miniPowered && gallery.visible, 0);
    const burst = (t - bubbleBurstAt) / .68;
    bubbleBurst.visible = state?.palace && gallery.visible && burst < 1;
    if (bubbleBurst.visible) {
      const spread = reducedMotion ? .6 : burst;
      bubbleBurstInk.opacity = 1 - burst;
      bubbleRipple.scale.setScalar(.43 + spread * 1.24);
      for (const [index, spark] of bubbleSparks.entries()) {
        const angle = index * Math.PI * 2 / bubbleSparks.length;
        const radius = .16 + spread * .45;
        spark.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, .045);
      }
    }
    const operating = state?.phase === 'electrolysis';
    const animationPace = state?.animationPace ?? 1;
    const phaseElapsed = (t - phaseAt) / animationPace;
    const fraction = operating ? THREE.MathUtils.smoothstep(phaseElapsed, .35, state.learning ? 1.66 : 2.85)
      : Number(state?.animatedPrep ? ['observe', 'route', 'gas-flow'].includes(state.prepPhase) : Boolean(state && state.phase !== 'idle'));
    animateTank(cell, t / animationPace, labPowered(state), fraction);
    if (state?.animatedPrep && lab.visible) {
      learningPrep.update(state.prepPhase, phaseElapsed, reducedMotion);
      reactor.showLearning(state.prepPhase, phaseElapsed);
    }
    const showingEquipmentTank = equipment.visible && state?.lesson === 'equipment-tank';
    animateTank(equipmentTank, t, showingEquipmentTank, showingEquipmentTank ? .7 : 0);
    equipmentPower.setOn(state?.lesson === 'equipment-power');
    if (equipment.visible) {
      const equipmentPrepAge = t - equipmentPrepAt;
      const phase = state?.lesson === 'equipment-prep' ? (equipmentPrepAge < 2.2 ? 'filtering' : 'prep-dry') : 'idle';
      equipmentPrep.update(phase, equipmentPrepAge, reducedMotion);
    }
    equipmentReactor.furnace.emissiveIntensity = state?.lesson === 'equipment-reactor' ? 1.15 : 0;
    reactor.furnace.emissiveIntensity = state?.phase === 'reduction' ? 1.2 + Math.sin(t * 10) * .25 : 0;
    reactor.mixer.update(delta);
    const hinted = t < suggestedUntil;
    const pipeColor = state?.hintAction === 'pipe' ? 0xffd18c : state?.gas || pipeReady ? 0xa5dfd1
      : hinted && suggestion === 'pipe' ? 0xe2c58f : 0x4e6e69;
    gasTube.material.color.setHex(pipeColor);
    for (const { path, dots, started } of flows) {
      for (const [index, dot] of dots.entries()) {
        const progress = ((t - started) / animationPace - index * .14) / 1.25;
        dot.visible = progress >= 0 && progress <= 1;
        if (dot.visible) path.getPointAt(progress, dot.position);
      }
    }
    prepMat.emissive.setHex(hinted && suggestion === 'prep' ? 0x634327 : 0);
    if (suggestion === 'sample' && state?.phase !== 'reduction' && hinted) reactor.furnace.emissiveIntensity = .64;
    if (!hinted) suggestion = null;
    if (renderer.xr.isPresenting) {
      for (const { controller, beam } of controllers) beam.material.color.setHex(controllerRay(controller) ? 0xf4c797 : jade);
    }
    actionCue.update();
    renderer.render(scene, camera);
  });

  async function enterVR() {
    const session = await navigator.xr.requestSession('immersive-vr');
    try { await renderer.xr.setSession(session); }
    catch (error) { await session.end(); throw error; }
  }

  return {
    update, exhibit, suggest, reset, enterVR, center, playAlarm, clearAlarm, playFunEffect, clearFunEffect,
    setFunAlarm, playFunSprinklers, startFunEncounter, resetFunEncounter, throwFunOrb,
    getFunEncounterState: () => funEncounter?.snapshot(),
    setFunLookSensitivity(value) { funLookSensitivity = THREE.MathUtils.clamp(value, .25, 2); },
    setFunMoveStick(x, y) { funMoveStick.set(x, y); },
    nudgeFunAim(dx, dy) {
      if (!state?.fun || sceneInputBlocked()) return;
      funPointerOnCanvas = false;
      turnCamera(dx, dy, .004);
    },
    holdFunTrigger(held) {
      funTriggerHeld = held;
      if (held) throwFunOrb();
    },
    setFunGuardsPaused: (paused) => {
      funGuardsPaused = paused;
      if (paused) clearInput();
    },
    jumpFun, useFunFurniture,
    setFunMenuOpen(open) {
      funMenuOpen = open;
      if (open) clearInput();
    },
    getFunInventory: () => funFurniture?.inventory(),
    equipFunInventory: slot => funFurniture?.equip(slot),
    lockFunLook: () => canvas.requestPointerLock?.(),
    unlockFunLook: () => { if (document.pointerLockElement === canvas) document.exitPointerLock(); },
    getFunFurniture: () => funFurniture?.holding(),
    setFunChairAudio(play) { funChairAudio = play; },
    resetFunRoom() {
      funMeleeReadyAt = 0;
      funDamage?.reset();
      funFurniture?.reset();
      syncFunPropDisplays();
    },
    setFunOrb: (type) => {
      funOrb = type;
      funRack?.select(type.replace(/-plus$/, ''));
      funFirearmView?.select(type);
    },
    holdFunMove: (key, held) => {
      if (held && state?.fun) funMoveKeys.add(key);
      else funMoveKeys.delete(key);
    },
  };
}
