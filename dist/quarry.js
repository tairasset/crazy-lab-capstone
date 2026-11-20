import * as THREE from './vendor/three.module.js';
import { clearVictory, showVictory } from './victory.js';
import { box, material } from './models.js';
import { createQuarryTerrain } from './quarry-terrain.js';
import { copperMaterialNotes, quarryNotes } from './quarry-notes.js';

const oreGoal = 3;
const reach = 5;
const factOrder = ['mine', 'ore', ...copperMaterialNotes];
const stages = {
  mine: {
    title: 'Mine 3 copper ore blocks',
    text: 'Colored flecks mark ore in this game. Strike the same block twice with your pickaxe.',
  },
  concentrate: {
    title: 'Separate the copper minerals',
    text: 'Take the ore to the Concentrator in the work yard. Watch it crush the rock, then lift the copper-rich grains with bubbles.',
    from: 'ore', amount: oreGoal, to: 'concentrate', time: 4.4,
    motion: [[0, 'Crushing the rock…'], [.23, 'Bubbles lifting the grains…'], [.66, 'Collecting the concentrate…']],
  },
  smelt: {
    title: 'Turn the concentrate into metal',
    text: 'Take the concentrate to the Smelter. Watch the furnace glow as the grains turn into metal, then look for copper in the mold.',
    from: 'concentrate', amount: 1, to: 'blister', time: 4.5,
    motion: [[0, 'Feeding in the grains…'], [.22, 'Heating the concentrate…'], [.56, 'Pouring the liquid metal…']],
  },
  refine: {
    title: 'Refine your copper',
    text: 'Take the rough copper to the blue Refiner. Watch the copper move through the liquid and build up on the clean plate.',
    from: 'blister', amount: 1, to: 'copper', time: 4.8,
    motion: [[0, 'Turning on the current…'], [.21, 'Copper moving through the liquid…'], [.63, 'Building the clean plate…']],
  },
  complete: {
    title: 'Batch complete',
    text: 'You produced refined copper. Copper powder is a different product. See how it is made in Learning Mode.',
  },
};
const stageOrder = Object.keys(stages);
const targetNames = {
  concentrate: 'Concentrator',
  smelt: 'Smelter',
  refine: 'Refiner',
  ore: 'Copper ore',
  soil: 'Soil',
  stone: 'Rock',
  sand: 'Sand',
};
const keyAliases = { ArrowUp: 'KeyW', ArrowDown: 'KeyS', ArrowLeft: 'KeyA', ArrowRight: 'KeyD' };
const moves = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
const hotbar = [
  ['pickaxe', 'Pickaxe'], ['soil', 'Soil'], ['stone', 'Stone'], ['sand', 'Sand'], ['ore', 'Copper ore'],
];
const bodyOffsets = [[-.21, -.21], [-.21, .21], [.21, -.21], [.21, .21]];
const objectiveGold = 0xffd18c;

function createObjectiveMarker(scene, viewport, view) {
  const group = new THREE.Group();
  group.name = 'Quarry next action';
  group.visible = false;
  scene.add(group);
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.06, 1.06, 1.06)),
    new THREE.LineBasicMaterial({ color: objectiveGold, toneMapped: false }),
  );
  group.add(outline);

  const arrow = document.createElement('div');
  arrow.className = 'quarry-objective-arrow';
  arrow.hidden = true;
  arrow.setAttribute('aria-hidden', 'true');
  viewport.append(arrow);
  const topControls = view.querySelector('.quarry-top');
  const bottomControls = view.querySelector('.quarry-bottom');
  let width, height, size, minY, maxY, pip, bubble;
  function measure() {
    const frame = viewport.getBoundingClientRect();
    width = frame.width;
    height = frame.height;
    size = THREE.MathUtils.clamp(Math.min(window.innerWidth, window.innerHeight) * .055, 34, 48);
    minY = topControls.offsetTop + topControls.offsetHeight + size + 9;
    maxY = Math.max(minY, bottomControls.offsetTop - 7);
    const speech = pip && !pip.hidden ? pip.getBoundingClientRect() : null;
    bubble = speech && {
      left: speech.left - frame.left, right: speech.right - frame.left,
      top: speech.top - frame.top, bottom: speech.bottom - frame.top,
    };
  }
  const resize = new ResizeObserver(measure);
  for (const element of [viewport, topControls, bottomControls]) resize.observe(element);
  const speechObserver = new MutationObserver(observeSpeech);
  function observeSpeech() {
    pip = view.querySelector('.pip-bubble');
    if (!pip) return;
    speechObserver.disconnect();
    resize.observe(pip);
    measure();
  }
  speechObserver.observe(view, { childList: true });
  observeSpeech();
  measure();

  function positionArrow(anchor, targetX, targetY) {
    const edge = size / 2 + 5;
    let x = THREE.MathUtils.clamp((anchor.x + 1) * width / 2, edge, width - edge);
    let y = THREE.MathUtils.clamp((1 - anchor.y) * height / 2, minY, maxY);
    let overSpeech = false;
    if (bubble && x + edge > bubble.left && x - edge < bubble.right &&
        y > bubble.top && y - size - 5 < bubble.bottom) {
      const left = bubble.left - edge - 2;
      const right = bubble.right + edge + 2;
      if (left >= edge && (right > width - edge || x - left <= right - x)) x = left;
      else if (right <= width - edge) x = right;
      else if (bubble.bottom + size + 9 <= maxY) y = bubble.bottom + size + 9;
      else if (bubble.top - 4 >= minY) y = bubble.top - 4;
      else overSpeech = true;
    }
    const dx = (targetX + 1) * width / 2 - x;
    const dy = (1 - targetY) * height / 2 - (y - size / 2 - 5);
    const angle = Math.atan2(dy, dx) - Math.PI / 2;
    arrow.style.left = `${x.toFixed(1)}px`;
    arrow.style.top = `${y.toFixed(1)}px`;
    arrow.style.setProperty('--arrow-angle', `${angle.toFixed(3)}rad`);
    arrow.toggleAttribute('data-over-speech', overSpeech);
  }
  return { group, outline, arrow, positionArrow };
}

function createCracks() {
  const map = document.createElement('canvas');
  map.width = map.height = 128;
  const ink = map.getContext('2d');
  const lines = [
    [[6, 10], [28, 27], [33, 47], [60, 60], [73, 80], [98, 85], [122, 113]],
    [[60, 60], [57, 39], [79, 29], [92, 5]],
    [[60, 60], [39, 75], [23, 72], [3, 92]],
    [[73, 80], [62, 101], [67, 125]],
    [[79, 29], [103, 43], [123, 38]],
    [[39, 75], [36, 95], [14, 115]],
  ];
  ink.beginPath();
  for (const [start, ...points] of lines) {
    ink.moveTo(...start);
    for (const point of points) ink.lineTo(...point);
  }
  ink.lineJoin = 'round';
  ink.strokeStyle = '#ffe9b8c9';
  ink.lineWidth = 6;
  ink.stroke();
  ink.strokeStyle = '#221617';
  ink.lineWidth = 3;
  ink.stroke();
  return new THREE.Mesh(new THREE.BoxGeometry(1.013, 1.013, 1.013), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(map), transparent: true, depthWrite: false,
  }));
}

export function setupQuarry({ discover = false, nextHref = '?mission=crazy&mode=learning&journey=discover' } = {}) {
  const find = id => document.getElementById(id);
  const game = find('quarry-game');
  const viewport = find('quarry-viewport');
  const progress = find('quarry-progress');
  const aimText = find('quarry-aim');
  const status = find('quarry-status');
  const lock = find('quarry-lock');
  const view = find('quarry-view');
  const fullscreen = find('quarry-fullscreen');
  const point = find('quarry-point');
  const useButton = find('quarry-use');
  const field = find('quarry-field');
  const strike = find('quarry-strike');
  const next = find('quarry-continue');
  const moreFacts = find('quarry-more-facts');
  const route = discover ? find('lab-nav') : null;
  const routeHome = route ? document.createComment('Discover Copper navigation') : null;
  route?.before(routeHome);
  const notebook = document.createElement('details');
  const notebookTitle = document.createElement('summary');
  notebookTitle.textContent = 'Copper facts';
  const [fact, sources] = field.children;
  notebook.append(notebookTitle, fact, sources);
  field.prepend(notebook);
  moreFacts.textContent = 'Next fact';
  moreFacts.hidden = false;
  const oresNeeded = discover ? 1 : oreGoal;
  const stationActions = { concentrate: 'Sort the ore', smelt: 'Fire the furnace', refine: 'Refine the copper' };
  const introducedStations = new Set();
  const resources = { ore: 0, concentrate: 0, blister: 0, copper: 0, soil: 0, stone: 0, sand: 0 };
  const meters = new Map(['ore', 'concentrate', 'blister', 'copper'].map(name => [name, find(`quarry-${name}`)]));
  let stage = 'mine';
  let pending;
  let currentNote;
  let foundOre;
  let markedControl;
  game.dataset.discover = String(discover);
  game.hidden = false;
  next.href = nextHref;

  function markControl(control) {
    if (markedControl === control) return;
    markedControl?.removeAttribute('data-quarry-next');
    markedControl = control;
    markedControl?.setAttribute('data-quarry-next', '');
  }

  function paintBatch() {
    game.dataset.stage = stage;
    game.dataset.processing = String(Boolean(pending));
    for (const [name, meter] of meters) {
      meter.textContent = resources[name];
      const inUse = name === 'ore' && stage === 'mine' || name === stages[stage].from;
      meter.parentElement.hidden = discover && !resources[name] && !inUse;
    }
    if (!discover) return;
    strike.setAttribute('aria-disabled', String(Boolean(pending)));
    strike.hidden = stage === 'complete';
    next.hidden = stage !== 'complete';
    markControl(pending ? null : stage === 'complete' ? next : strike);
    if (stage === 'mine') strike.textContent = game.dataset.sample === 'cracked' ? 'Break it open' : 'Strike the ore';
    else if (stage !== 'complete') strike.textContent = pending ? stages[stage].motion[0][1] : stationActions[stage];
  }

  function introduceStation(kind) {
    if (!stationActions[kind] || introducedStations.has(kind)) return;
    introducedStations.add(kind);
    game.dataset.quarryNote = kind;
  }

  function startBatch() {
    const recipe = stages[stage];
    const amount = stage === 'concentrate' ? oresNeeded : recipe.amount;
    if (pending || !recipe.from || resources[recipe.from] < amount) return false;
    resources[recipe.from] -= amount;
    pending = { recipe, duration: recipe.time, elapsed: 0, cue: 0 };
    introduceStation(stage);
    return true;
  }

  function finishBatch() {
    resources[pending.recipe.to] += 1;
    pending = undefined;
    stage = stageOrder[stageOrder.indexOf(stage) + 1];
    if (stage === 'complete') {
      game.dataset.quarryNote = 'complete';
      showVictory('quarry');
    }
  }

  function showNote(key) {
    currentNote = key;
    const note = quarryNotes[key];
    find('quarry-fact-title').textContent = note.title;
    find('quarry-fact-text').textContent = note.text;
    const link = find('quarry-fact-source');
    link.href = note.source.url;
    link.textContent = note.source.title + ' ↗';
  }

  function resetNotes() {
    introducedStations.clear();
    foundOre = false;
    delete game.dataset.quarryNote;
    notebook.open = false;
    showNote('mine');
    next.hidden = true;
    strike.hidden = !discover;
    strike.textContent = 'Strike the ore';
    delete game.dataset.sample;
  }

  function crackOre() {
    if (foundOre || game.dataset.sample === 'cracked') return;
    game.dataset.sample = 'cracked';
    strike.textContent = 'Break it open';
  }

  function collectOre() {
    if (!foundOre) game.dataset.quarryNote = 'ore';
    foundOre = true;
    game.dataset.sample = 'collected';
  }

  moreFacts.addEventListener('click', () => {
    const nextIndex = (factOrder.indexOf(currentNote) + 1) % factOrder.length;
    showNote(factOrder[nextIndex]);
  });
  resetNotes();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch {
    const notice = find('quarry-no-webgl');
    notice.hidden = false;
    lock.disabled = find('quarry-reset').disabled = find('quarry-home').disabled = true;
    point.disabled = useButton.disabled = find('quarry-jump').disabled = true;
    if (discover) {
      game.dataset.flatSample = 'true';
      let machineTimer;
      function resetFlat() {
        clearTimeout(machineTimer);
        clearVictory();
        stage = 'mine';
        pending = undefined;
        for (const key of Object.keys(resources)) resources[key] = 0;
        resetNotes();
        paintBatch();
        notice.textContent = 'Copper ore sample';
      }
      find('quarry-reset').disabled = false;
      find('quarry-reset').addEventListener('click', resetFlat);
      window.addEventListener('pagehide', () => clearTimeout(machineTimer));
      window.addEventListener('pageshow', event => { if (event.persisted && pending) resetFlat(); });
      resetFlat();
      strike.addEventListener('click', () => {
        if (stage === 'mine') {
          if (game.dataset.sample !== 'cracked') { crackOre(); return; }
          resources.ore++;
          collectOre();
          stage = 'concentrate';
          notice.textContent = targetNames[stage];
        } else if (startBatch()) {
          notice.textContent = stages[stage].motion[0][1];
          machineTimer = setTimeout(() => {
            finishBatch();
            notice.textContent = targetNames[stage] || 'Refined copper plate';
            paintBatch();
          }, pending.duration * 1000);
        }
        paintBatch();
      });
    }
    return;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D quarry. Drag to look, move with WASD or arrows, and press E to act.');
  viewport.append(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb6d5d7);
  scene.fog = new THREE.Fog(0xb6d5d7, 19, 48);
  scene.add(new THREE.HemisphereLight(0xf3faff, 0x6d5352, 2.4));
  const sun = new THREE.DirectionalLight(0xffdfae, 2.1);
  sun.position.set(-6, 16, 9);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(62, 1, .04, 70);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  const terrain = createQuarryTerrain(scene);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let approachStation;
  let approachTime = Infinity;
  const position = new THREE.Vector3();
  const viewHeight = 1.57;
  const aim = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const objectiveRay = new THREE.Raycaster();
  const objectiveMarker = createObjectiveMarker(scene, viewport, view);
  const markerProjection = new THREE.Vector3();
  let objectiveTarget;
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.025, 1.025, 1.025)),
    new THREE.LineBasicMaterial({ color: 0xffe09d }),
  );
  outline.visible = false;
  scene.add(outline);
  const cracks = createCracks();
  cracks.visible = false;
  scene.add(cracks);

  const chipsGeometry = new THREE.BufferGeometry();
  const chipPositions = new THREE.Float32BufferAttribute(new Float32Array(63), 3);
  chipsGeometry.setAttribute('position', chipPositions);
  const impact = new THREE.Points(chipsGeometry, new THREE.PointsMaterial({
    size: .095, color: 0xf0ab71, transparent: true, depthWrite: false,
  }));
  impact.visible = false;
  impact.frustumCulled = false;
  scene.add(impact);
  const impactAt = new THREE.Vector3();
  let impactAge = 0;

  const pick = new THREE.Group();
  const timber = material(0x81503a, { roughness: .78 });
  const wrap = material(0x38464d);
  const iron = material(0x758997, { metalness: .46, roughness: .39 });
  box(pick, [.085, .66, .085], timber, 0, -.06, 0);
  box(pick, [.094, .19, .094], wrap, 0, -.24, 0);
  box(pick, [.45, .09, .11], iron, 0, .235, 0);
  for (const side of [-1, 1]) {
    const tooth = box(pick, [.115, .075, .093], iron, side * .24, .21, 0);
    tooth.rotation.z = -side * .55;
  }
  pick.scale.setScalar(.58);
  camera.add(pick);
  const keys = new Set();
  const touchKeys = new Set();
  let selected = 'pickaxe';
  const slots = hotbar.map(([kind, name], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.quarryItem = kind;
    const key = document.createElement('kbd');
    key.textContent = index + 1;
    const label = document.createElement('span');
    label.textContent = name;
    const count = document.createElement('span');
    count.className = 'quarry-slot-count';
    count.hidden = kind === 'pickaxe';
    button.append(key, label, count);
    playControl(button, () => select(kind));
    find('quarry-hotbar').append(button);
    return { button, kind, name, count };
  });
  const placement = new THREE.Vector3();
  const chips = Array.from(game.querySelectorAll('[data-stage]'));
  let mining;
  let swing = 0;
  let statusTime = 0;
  let vy = 0;
  let grounded = false;
  let gesture;
  let lastTime;
  let lastAim = '';
  let lastStrike = -Infinity;
  let jumpUntil = 0;
  let groundTime = -Infinity;

  function paintHotbar() {
    if (selected !== 'pickaxe' && !resources[selected]) selected = 'pickaxe';
    for (const { button, kind, name, count } of slots) {
      const stock = resources[kind] ?? 0;
      const empty = kind !== 'pickaxe' && stock === 0;
      count.textContent = stock;
      button.setAttribute('aria-pressed', String(selected === kind));
      button.setAttribute('aria-label', kind === 'pickaxe' ? name : `${name}, ${stock} blocks`);
      button.setAttribute('aria-disabled', String(empty));
      button.classList.toggle('quarry-slot-empty', empty);
    }
    useButton.textContent = selected === 'pickaxe' ? 'Use' : 'Place';
    pick.visible = selected === 'pickaxe';
  }

  function select(kind) {
    if (kind !== 'pickaxe' && !resources[kind]) {
      say(`No ${targetNames[kind].toLowerCase()} blocks to place.`);
      return;
    }
    selected = kind;
    paintHotbar();
    canvas.focus({ preventScroll: true });
  }

  function say(text) {
    status.textContent = text;
    status.hidden = !text;
    statusTime = text ? 3.4 : 0;
  }

  function paint() {
    paintBatch();
    objectiveTarget = pending || stage === 'complete' ? null : terrain.demoTarget(stage);
    const current = stageOrder.indexOf(stage);
    for (const chip of chips) {
      const index = stageOrder.indexOf(chip.dataset.stage);
      chip.dataset.state = index < current ? 'done' : index === current ? 'current' : '';
      if (index === current) chip.setAttribute('aria-current', 'step');
      else chip.removeAttribute('aria-current');
    }
    find('quarry-objective').textContent = stages[stage].title;
    find('quarry-view-objective').textContent = stages[stage].title;
    find('quarry-story').textContent = stages[stage].text;
    point.disabled = Boolean(pending) || stage === 'complete';
    progress.hidden = !pending;
    if (pending) progress.value = 0;
    paintHotbar();
  }

  function pose() {
    camera.position.set(position.x, position.y + viewHeight, position.z);
  }

  function focusViewport() {
    if (document.activeElement !== canvas) canvas.focus({ preventScroll: true });
  }

  function playControl(button, action) {
    button.addEventListener('click', event => {
      if (event.detail > 0) focusViewport();
      action();
    });
  }

  function clearInput() {
    keys.clear();
    touchKeys.clear();
    gesture = undefined;
    jumpUntil = 0;
  }

  function returnToTrail() {
    position.set(terrain.spawn.x, terrain.spawn.y, terrain.spawn.z);
    camera.rotation.set(-.34, .464, 0);
    vy = 0;
    grounded = true;
    clearInput();
    groundTime = performance.now();
    pose();
  }

  function reset() {
    clearVictory();
    terrain.reset();
    returnToTrail();
    for (const key of Object.keys(resources)) resources[key] = 0;
    selected = 'pickaxe';
    pending = mining = undefined;
    swing = 0;
    impact.visible = false;
    cracks.visible = false;
    lastStrike = -Infinity;
    stage = 'mine';
    resetNotes();
    say('');
    paint();
  }

  function targetAt(x = 0, y = 0) {
    camera.updateMatrixWorld(true);
    ray.setFromCamera(aim.set(x, y), camera);
    return terrain.hit(ray, reach);
  }

  function targetKind() { return stage === 'mine' ? 'ore' : stage; }

  function nextHit(aimed, target) {
    const kind = targetKind();
    if (aimed?.kind === kind) return aimed;
    if (!target) return null;
    objectiveRay.ray.origin.copy(camera.position);
    objectiveRay.ray.direction.copy(target).sub(camera.position).normalize();
    const hit = terrain.hit(objectiveRay, reach);
    return hit?.kind === kind ? hit : null;
  }

  function guideNextAction(aimed) {
    const { group, outline, arrow, positionArrow } = objectiveMarker;
    const miningOre = stage === 'mine';
    if (miningOre && selected !== 'pickaxe') {
      group.visible = false;
      arrow.hidden = true;
      markControl(slots[0].button);
      return;
    }
    const aimedAtObjective = aimed?.kind === targetKind();
    const target = aimedAtObjective ? aimed.position : objectiveTarget;
    group.visible = !pending && stage !== 'complete' && Boolean(target);
    if (!group.visible) {
      arrow.hidden = true;
      markControl(discover && stage === 'complete' ? next : null);
      return;
    }
    group.position.copy(target);
    outline.scale.set(miningOre ? 1 : 1.69, miningOre ? 1 : 1.40, miningOre ? 1 : 1.68);
    markerProjection.copy(target).project(camera);
    const inView = Math.abs(markerProjection.x) < .98 && Math.abs(markerProjection.y) < .98 && Math.abs(markerProjection.z) < 1;
    arrow.hidden = !inView;
    if (inView) {
      const { x, y } = markerProjection;
      markerProjection.copy(target);
      markerProjection.y += miningOre ? .53 : .58;
      markerProjection.project(camera);
      positionArrow(markerProjection, x, y);
    }
    const canUse = Boolean(nextHit(aimed, target));
    markControl(canUse ? (discover ? strike : aimedAtObjective ? useButton : null) : inView ? null : point);
  }

  function surfaceFloor(x, z, fromY, toY) {
    const base = Math.floor(fromY + 1e-4);
    const supported = height => bodyOffsets.some(([dx, dz]) => terrain.isSolid(x + dx, height - .055, z + dz));
    if (base >= toY - .012 && supported(base)) return base;
    const lower = base - 1;
    if (lower >= toY - .012 && supported(lower)) return lower;
    return null;
  }

  function blocked(x, z, y) {
    return bodyOffsets.some(([dx, dz]) => [.035, .76, 1.49].some(height => terrain.isSolid(x + dx, y + height, z + dz)));
  }

  function move(dt) {
    const pressed = key => touchKeys.has(key) || keys.has(key) || Object.keys(keyAliases).some(alias => keyAliases[alias] === key && keys.has(alias));
    const walk = Number(pressed('KeyW')) - Number(pressed('KeyS'));
    const strafe = Number(pressed('KeyD')) - Number(pressed('KeyA'));
    const wet = terrain.isWater(position.x, position.z);
    const speed = (wet ? 2.65 : 4.0) * dt / (Math.hypot(walk, strafe) || 1);
    const sin = Math.sin(camera.rotation.y);
    const cos = Math.cos(camera.rotation.y);
    const { minX, maxX, minZ, maxZ } = terrain.bounds;
    const x = THREE.MathUtils.clamp(position.x + speed * (-sin * walk + cos * strafe), minX, maxX);
    const z = THREE.MathUtils.clamp(position.z + speed * (-cos * walk - sin * strafe), minZ, maxZ);
    if (!blocked(x, position.z, position.y)) position.x = x;
    if (!blocked(position.x, z, position.y)) position.z = z;
    const fromY = position.y;
    const proposed = fromY + vy * dt - 8.1 * dt ** 2;
    vy -= 16.2 * dt;
    const waterFloor = terrain.isWater(position.x, position.z) && proposed <= .05 ? .05 : null;
    const floor = vy < 0 ? waterFloor ?? surfaceFloor(position.x, position.z, fromY, proposed) : null;
    grounded = floor !== null;
    if (grounded) {
      position.y = floor;
      vy = 0;
      groundTime = performance.now();
    } else if (vy > 0 && blocked(position.x, position.z, proposed)) {
      vy = 0;
    } else {
      position.y = proposed;
    }
    if (position.y < -12) {
      position.set(terrain.spawn.x, terrain.spawn.y, terrain.spawn.z);
      vy = 0;
    }
  }

  function jump() {
    jumpUntil = performance.now() + 145;
  }

  function applyJump() {
    const time = performance.now();
    if (jumpUntil < time || !(grounded || time - groundTime < 100)) return;
    vy = 6.7;
    grounded = false;
    groundTime = -Infinity;
    jumpUntil = 0;
  }

  function cellNearPlayer(cell) {
    return Math.abs(position.x - cell.x) < .72 && Math.abs(position.z - cell.z) < .72 &&
      cell.y < position.y + 1.56 && cell.y + 1 > position.y + .005;
  }

  function placementFor(hit) {
    const cell = terrain.placementCell(hit);
    return cell && terrain.canPlace(cell, selected) && !cellNearPlayer(cell) ? cell : null;
  }

  function placeBlock(hit) {
    if (!resources[selected]) { say('Mine some of this block first.'); return; }
    const cell = placementFor(hit);
    if (!cell || !terrain.place(cell, selected)) { say('Aim at a free face away from your feet.'); return; }
    const kind = selected;
    resources[kind] -= 1;
    if (stage === 'concentrate' && !pending && resources.ore < oresNeeded) stage = 'mine';
    say(resources[kind] ? `${targetNames[kind]} placed. Press 1 for the pickaxe.` : `${targetNames[kind]} placed. Pickaxe ready.`);
    paint();
  }

  function use(hit = targetAt()) {
    if (!hit) { say('Aim at a block or station within reach.'); return; }
    if (stages[hit.kind]) {
      if (pending) return;
      if (hit.kind !== stage) {
        say(stage === 'complete' ? 'This batch is finished.' : `Next step: ${stages[stage].title}.`);
        return;
      }
      if (!startBatch()) return;
      say(`${targetNames[stage]} running…`);
      paint();
      return;
    }
    if (selected !== 'pickaxe') { placeBlock(hit); return; }
    if (hit.kind === 'bedrock') { say('Bedrock marks the bottom of this quarry.'); return; }
    if (performance.now() - lastStrike < 75) return;
    lastStrike = performance.now();
    swing = .26;
    impactAt.copy(hit.point).addScaledVector(hit.normal, .045);
    impact.material.color.setHex(hit.kind === 'ore' ? 0xfac081 : 0xb4aa9d);
    impact.visible = true;
    impactAge = 0;
    const key = hit.position.toArray().join(',');
    const blows = mining?.key === key ? mining.blows + 1 : 1;
    const required = hit.kind === 'stone' || hit.kind === 'ore' ? 2 : 1;
    mining = { key, blows, required };
    if (blows < required) {
      cracks.position.copy(hit.position);
      cracks.visible = true;
      if (hit.kind === 'ore') crackOre();
      return;
    }
    mining = undefined;
    cracks.visible = false;
    if (!terrain.mine(hit)) return;
    resources[hit.kind] += 1;
    if (hit.kind === 'ore') collectOre();
    say(`${targetNames[hit.kind]} collected.`);
    if (stage === 'mine' && resources.ore >= oresNeeded) stage = 'concentrate';
    paint();
  }

  function process(dt) {
    if (!pending) return;
    pending.elapsed += dt;
    progress.value = Math.min(1, pending.elapsed / pending.duration);
    if (progress.value < 1) {
      const nextCue = pending.recipe.motion[pending.cue + 1];
      if (nextCue && progress.value >= nextCue[0]) {
        pending.cue++;
        if (discover) strike.textContent = nextCue[1];
        else find('quarry-story').textContent = nextCue[1];
      }
      return;
    }
    finishBatch();
    say(stage === 'complete' ? 'Refined copper collected.' : 'Batch ready for the next station.');
    paint();
  }

  function indicate(hit) {
    const name = targetNames[hit?.kind];
    const meshTarget = Boolean(hit && !stages[hit.kind] && hit.kind !== 'bedrock');
    const building = selected !== 'pickaxe' && meshTarget;
    const buildCell = building && resources[selected] ? placementFor(hit) : null;
    outline.visible = building ? Boolean(buildCell) : meshTarget;
    if (buildCell) outline.position.copy(placement.set(buildCell.x, buildCell.y + .5, buildCell.z));
    else if (meshTarget) outline.position.copy(hit.position);
    outline.material.color.setHex(building ? 0x92f3c6 : 0xffe09d);
    const key = meshTarget ? hit.position.toArray().join(',') : '';
    const progressMine = key && mining?.key === key ? ` · ${mining.blows}/${mining.required} strikes` : '';
    const needsRoom = pending && terrain.nearbyStation(position.x, position.y, position.z, 1.7) === stage;
    let text = name ? `${name}${progressMine} · Click or E` : 'Aim at a cube or a station';
    if (needsRoom) text = 'Step back to see the whole machine';
    else if (building) {
      text = buildCell ? `Place ${targetNames[selected]} · Click or E`
        : `${targetNames[selected]} · ${resources[selected] ? 'Aim at an open face' : 'No blocks left'}`;
    }
    if (text !== lastAim) aimText.textContent = lastAim = text;
  }

  function renderFrame(time) {
    const dt = Math.min((time - (lastTime ?? time)) / 1000, .045);
    lastTime = time;
    const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
    for (let i = 0; i < steps; i++) {
      applyJump();
      move(dt / steps);
    }
    pose();
    const station = terrain.nearbyStation(position.x, position.y, position.z);
    if (station !== approachStation) {
      approachStation = station;
      approachTime = time + 450;
    }
    if (!pending && time >= approachTime) introduceStation(station);
    process(dt);
    if (statusTime > 0 && (statusTime -= dt) <= 0) say('');
    swing = Math.max(0, swing - dt);
    const strike = Math.sin(swing / .26 * Math.PI);
    pick.position.set(.39, -.42 - strike * .12, -.88);
    pick.rotation.set(-.12 - strike * .67, -.31, -.39 - strike * .42);
    if (impact.visible) {
      impactAge += dt;
      impact.visible = impactAge < .42;
      impact.material.opacity = Math.max(0, 1 - impactAge / .42);
      for (let i = 0; i < chipPositions.count; i++) {
        const angle = i * 2.39996;
        const distance = impactAge * (1.15 + i % 6 * .31);
        chipPositions.setXYZ(i, impactAt.x + Math.cos(angle) * distance,
          impactAt.y + impactAge * (.85 + i % 5 * .29) - impactAge ** 2 * 4.3,
          impactAt.z + Math.sin(angle) * distance);
      }
      chipPositions.needsUpdate = true;
    }
    terrain.update(time / 1000, stage, pending ? progress.value : null, reducedMotion.matches);
    const aimed = targetAt();
    indicate(aimed);
    guideNextAction(aimed);
    renderer.render(scene, camera);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = viewport;
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio, 1.65, Math.sqrt(1_250_000 / (width * height)));
    renderer.setDrawingBufferSize(width, height, scale);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function look(dx, dy) {
    camera.rotation.y -= dx * .0037;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - dy * .0037, -1.38, 1.38);
  }

  const mouseLocked = () => document.pointerLockElement === canvas;
  const finePointer = matchMedia('(any-pointer: fine)');
  let lockPending = false;

  function syncLook() {
    const locked = mouseLocked();
    lock.hidden = !canvas.requestPointerLock || !finePointer.matches;
    lock.textContent = locked ? 'Release mouse' : 'Capture mouse';
    lock.setAttribute('aria-pressed', String(locked));
  }

  function reportMouseLockError() {
    if (!lockPending) return;
    lockPending = false;
    say('Drag the scene to look around.');
  }

  function captureMouse() {
    if (!canvas.requestPointerLock || !finePointer.matches || lockPending || document.pointerLockElement) return;
    lockPending = true;
    try { Promise.resolve(canvas.requestPointerLock()).catch(reportMouseLockError); }
    catch { reportMouseLockError(); }
  }

  function pointToObjective() {
    const target = terrain.demoTarget(stage);
    if (pending) return;
    if (!target) { say('Look for more ore along the seam.'); return; }
    camera.lookAt(target);
    focusViewport();
    if (targetAt()?.kind !== targetKind()) {
      say('Move in this direction until the objective is within reach.');
    }
  }

  function expanded() {
    return document.fullscreenElement === view || view.classList.contains('quarry-expanded');
  }

  let wasExpanded = false;
  function syncFullscreen() {
    clearInput();
    const large = expanded();
    if (wasExpanded && !large && mouseLocked()) document.exitPointerLock();
    wasExpanded = large;
    fullscreen.textContent = large ? 'Exit fullscreen' : 'Fullscreen';
    fullscreen.setAttribute('aria-pressed', String(large));
    document.body.classList.toggle('quarry-screen-open', view.classList.contains('quarry-expanded'));
    if (discover) {
      if (large) {
        const toolbar = game.querySelector('.quarry-top');
        toolbar.prepend(route);
        toolbar.append(field);
      } else {
        routeHome.after(route);
        game.querySelector('.quarry-actions').before(field);
      }
    }
  }

  async function toggleFullscreen() {
    if (view.classList.contains('quarry-expanded')) view.classList.remove('quarry-expanded');
    else if (document.fullscreenElement === view) await document.exitFullscreen();
    else {
      captureMouse();
      try { await view.requestFullscreen(); }
      catch { view.classList.add('quarry-expanded'); }
    }
    syncFullscreen();
    focusViewport();
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || document.querySelector('dialog[open]')) return;
    focusViewport();
    if (mouseLocked()) { use(); return; }
    if (gesture) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    const locked = mouseLocked();
    if ((!locked && gesture?.id !== event.pointerId) || document.querySelector('dialog[open]')) return;
    if (locked) { look(event.movementX, event.movementY); return; }
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.dragged && Math.hypot(dx, dy) < 4) return;
    look(dx, dy);
    Object.assign(gesture, { x: event.clientX, y: event.clientY, dragged: true });
  });
  canvas.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return;
    const dragged = gesture.dragged;
    gesture = undefined;
    if (!dragged && !document.querySelector('dialog[open]')) {
      const bounds = canvas.getBoundingClientRect();
      use(targetAt(2 * (event.clientX - bounds.left) / bounds.width - 1, 1 - 2 * (event.clientY - bounds.top) / bounds.height));
    }
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => { if (gesture?.id === event.pointerId) gesture = undefined; });
  }
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('dialog[open], input, textarea, select, [contenteditable]')) return;
    if (event.code === 'KeyN' && !event.repeat) {
      if (mouseLocked()) document.exitPointerLock();
      return;
    }
    if (event.code === 'Escape' && view.classList.contains('quarry-expanded')) {
      view.classList.remove('quarry-expanded');
      syncFullscreen();
      return;
    }
    const slot = /^Digit[1-5]$/.test(event.code) ? hotbar[Number(event.code.at(-1)) - 1] : null;
    if (slot && !event.repeat) { select(slot[0]); return; }
    const key = keyAliases[event.code] ?? event.code;
    if (moves.has(key)) {
      event.preventDefault();
      if (!event.repeat) {
        focusViewport();
        keys.add(event.code);
      }
    } else if (key === 'Space' && (keys.size || touchKeys.size || !event.target.closest?.('button, a, summary'))) {
      event.preventDefault();
      if (!event.repeat) {
        focusViewport();
        jump();
      }
    } else if ((key === 'KeyE' || key === 'KeyF' && selected !== 'pickaxe') && !event.repeat) use();
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', clearInput);
  window.addEventListener('pagehide', clearInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); });
  document.addEventListener('focusin', event => {
    if (event.target.closest?.('dialog[open], input, textarea, select, [contenteditable]')) clearInput();
  });
  for (const button of game.querySelectorAll('[data-quarry-move]')) {
    const key = button.dataset.quarryMove;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touchKeys.add(key);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => touchKeys.delete(key));
  }
  playControl(useButton, () => use());
  playControl(strike, () => {
    if (pending || stage === 'complete') return;
    const aimed = targetAt();
    const target = terrain.demoTarget(stage);
    const hit = nextHit(aimed, target);
    if (!hit) {
      say(target ? 'Move closer. Show next step points to the objective.' : 'Look for more ore along the seam.');
      return;
    }
    if (targetKind() === 'ore') select('pickaxe');
    use(hit);
  });
  playControl(find('quarry-jump'), jump);
  point.addEventListener('click', () => pointToObjective());
  fullscreen.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', syncFullscreen);
  find('quarry-home').addEventListener('click', () => { returnToTrail(); focusViewport(); });
  find('quarry-reset').addEventListener('click', () => { reset(); focusViewport(); });
  lock.addEventListener('click', () => {
    if (mouseLocked()) document.exitPointerLock();
    else captureMouse();
    focusViewport();
  });
  document.addEventListener('pointerlockchange', () => {
    lockPending = false;
    gesture = undefined;
    if (mouseLocked() && document.querySelector('dialog[open]')) document.exitPointerLock();
    syncLook();
  });
  document.addEventListener('pointerlockerror', reportMouseLockError);
  finePointer.addEventListener('change', syncLook);
  syncLook();
  reset();
  resize();
  new ResizeObserver(resize).observe(viewport);
  renderer.setAnimationLoop(renderFrame);
}
