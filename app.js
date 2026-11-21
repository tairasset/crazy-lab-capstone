import { createWorld } from './world.js';
import { setupGuide } from './chat.js';
import { setupCrazyLab } from './crazy.js';
import { setupFunLab } from './fun.js';
import { setupLearningLab } from './learning.js';
import { setupPalace } from './palace.js';
import { setupQuarry } from './quarry.js';
import { setupDemoGuide } from './demo-guide.js';
import { showJourneyNav, showModeNav } from './journeys.js';

const find = (id) => document.getElementById(id);
const actions = find('actions');
const feedback = find('feedback');
const labTab = find('lab-tab');
const galleryTab = find('gallery-tab');
const equipmentTab = find('equipment-tab');
const tip = find('scene-tip');
const vr = find('vr');

const labels = {
  atom: 'Atoms and ions', electrodes: 'Two copper plates', salt: 'Where did the salt go?', enter: 'Go to the lab',
  'equipment-wing': 'Explore the equipment', 'basics-wing': 'Back to the basics',
  'equipment-power': 'What makes the current flow?', 'equipment-tank': 'What happens in the tank?',
  'equipment-prep': 'How does the filter work?', 'equipment-reactor': 'What does the reactor do?',
  'pair-charges': 'Pair the + and − signs', 'meet-atom': 'Look at an atom',
  'atom-remove': 'See what happens at the anode', 'charge-plus': 'Plus (+)',
  'charge-zero': 'All signs are paired', 'charge-minus': 'Minus (−)', 'lesson-close': 'Back to exhibits',
  'electrodes-power': 'Switch on the mini tank', 'plate-plus': 'At the + plate', 'plate-minus': 'At the − plate',
  'salt-compare': 'Add salt to the water', 'compare-power': 'Switch off and compare',
  start: 'Switch on the power', gas: 'Find the hydrogen', solid: 'Collect the grains',
  pipe: 'Follow the hydrogen', prep: 'Filter the mixture', dry: 'Rinse and dry the grains', reactor: 'Run the reactor',
  restart: 'Play again', 'lab-observe': 'Continue · Follow both outputs', 'inspect-powder': 'Inspect the copper powder',
};

const equipment = {
  'equipment-power': {
    title: 'Power supply',
    body: 'This box has a screen, a switch and two places to connect wires. Each wire goes to a copper plate in the tank. Switch the power on to make electric charge move.',
    extra: 'The patent calls for direct current. The power supply you see here is a lab example.',
  },
  'equipment-tank': {
    title: 'Electrolysis tank',
    body: 'The tank holds two copper plates in salty water. The salty water carries electric charge. A liquid that can do this is called an electrolyte. Copper leaves one plate and hydrogen bubbles form at the other.',
    extra: 'Copper oxide grains collect at the bottom. Hydrogen rises to the hood and goes out through a tube.',
  },
  'equipment-prep': {
    title: 'Filter and drying station',
    body: 'Watch the liquid drain into the container below. The filter is like a tiny sieve. Liquid passes through, and the solid grains stay on top.',
    extra: 'Rinsing washes away leftover salt. Drying removes the remaining water before the grains go to the reactor.',
  },
  'equipment-reactor': {
    title: 'Heated reactor',
    body: 'The reactor is a hot chamber. Hydrogen gas enters through the tube, and dry copper oxide grains go in separately.',
    extra: 'The grains contain copper joined to oxygen. Hydrogen joins the oxygen to make water. Metallic copper stays behind as a fine powder.',
  },
};

const explanations = {
  atom: 'A copper atom can lose an electron at the + plate. The electron stays in the metal. The copper is left with a positive charge. We call it an ion. Copper from the plate helps form the solid grains collected from the tank.',
  powder: 'Copper oxide grains collect at the bottom of the first tank. In the heated reactor, hydrogen helps turn those grains into metallic copper powder.',
};

const glance = {
  atom: 'Why does copper leave the + plate?',
  electrodes: 'One plate supplies copper. Look for bubbles at the other.',
  salt: 'What happens when salt goes into water?',
};

const lessons = {
  'atom-signs': {
    title: 'Meet + and −',
    body: 'Think of a + and a − as a matching pair. One of each balances out. Tap the minus signs and match them to the plus signs.',
    actions: ['pair-charges'],
  },
  'atom-paired': {
    title: 'Every sign has a partner',
    body: 'Each + now has a −. The total charge is zero. See what happens when an atom loses one minus.',
    actions: ['meet-atom'],
  },
  'atom-intro': {
    title: 'What is an atom?',
    body: 'Zoom in on the + plate. It is made of tiny building blocks called atoms. The blue ball shows an electron, a tiny piece of the atom with a minus charge. Watch it leave the copper atom.',
    actions: ['atom-remove'],
  },
  'atom-question': {
    title: 'Which sign lost its partner?',
    body: 'The electron moves into the metal and along the wire. The atom lost one minus. The empty box shows where it used to be.',
    actions: ['charge-plus', 'charge-zero', 'charge-minus'],
  },
  'atom-done': {
    title: 'You found a copper ion',
    body: 'One plus is left without a partner. An atom with a charge is called an ion. In the tank, copper leaves the plate and ends up in solid grains of copper oxide.',
    actions: ['lesson-close'],
  },
  'electrodes-intro': {
    title: 'Two plates in salty water',
    body: 'The power supply has a + wire and a − wire. Each wire connects to one copper plate. Switch on the power and watch both plates.',
    actions: ['electrodes-power'],
  },
  'electrodes-question': {
    title: 'Where are the bubbles?',
    body: 'Watch the bubbles rise. Tap the sign above the plate where they appear.',
    actions: ['plate-plus', 'plate-minus'],
  },
  'electrodes-done': {
    title: 'Copper on one side, bubbles on the other',
    body: 'The + plate gives copper to the water. Its name is the anode. The − plate is where hydrogen bubbles form. Its name is the cathode. The copper grains and the gas meet again later in the reactor.',
    actions: ['lesson-close'],
  },
  'salt-intro': {
    title: 'Where did the salt go?',
    body: 'There is water in the jar and salt beside it. Add the salt and look closely.',
    actions: ['salt-compare'],
  },
  'salt-done': {
    title: 'The salt split into tiny pieces',
    body: 'When salt dissolves, it splits into tiny pieces with a + or − charge. The pieces move in the water and carry electric charge between the plates.',
    actions: ['lesson-close'],
  },
};

const phases = {
  idle: ['Make copper powder', 'The tank is quiet with the power off. Tap the power supply on the left and watch the two copper plates.'],
  electrolysis: ['Watch the two plates', 'Copper leaves the + plate. Hydrogen bubbles rise at the − plate. Look for solid copper oxide grains collecting at the bottom.'],
  observe: ['Copper on the left, bubbles on the right', 'One plate supplies copper for the grains. Hydrogen bubbles form at the other. Switch off the power and see what stops.'],
  'gas-flow': ['Hydrogen heads to the reactor', 'Follow the dots in the top tube. They show hydrogen gas moving from the tank to the reactor.'],
  filtering: ['Watch the filter catch the grains', 'Liquid drains into the container below. The filter holds back the solid grains.'],
  'prep-dry': ['The grains are still wet', 'The filter caught the grains. Rinse away leftover salt and dry the grains before they go into the reactor.'],
  drying: ['Rinse and dry the grains', 'First, clean water washes away leftover salt. Then the remaining water leaves the grains as they dry.'],
  ready: ['Run the heated reactor', 'Hydrogen and dry copper oxide grains are in the reactor. Run it to see what comes out.'],
  reduction: ['Copper stays behind', 'In the heated chamber, hydrogen joins the oxygen from the grains to make water. The copper stays in the tray.'],
  product: ['Your powder is ready', 'The reactor turned copper oxide grains into metallic copper powder. Look for it in the tray on the right.'],
  won: ['First batch complete', 'The tank made copper oxide grains and hydrogen. You filtered, rinsed and dried the grains. In the reactor, hydrogen helped turn them into copper powder.'],
};

const routeSteps = {
  gas: ['Find the hydrogen', 'The bubbles are filled with hydrogen gas. Tap the hydrogen label above the tank to find out where it goes.'],
  pipe: ['Trace the gas tube', 'The hood above the water collects the hydrogen. Tap the tube and follow the gas to the reactor.'],
  solid: ['Collect the grains', 'Hydrogen has reached the reactor. Tap the grains at the bottom of the tank. A solid that forms in a liquid this way is called a precipitate.'],
  prep: ['Separate the grains from the liquid', 'The filter works like a tiny sieve. Tap the middle station to drain the liquid and catch the grains.'],
};

const labStage = { idle: 0, electrolysis: 0, observe: 0, route: 1, 'gas-flow': 1, filtering: 1, 'prep-dry': 1, drying: 1, ready: 2, reduction: 2, product: 2, won: 3 };
const routePhases = ['observe', 'route', 'gas-flow', 'filtering', 'prep-dry', 'drying', 'ready'];

function initialState() {
  return { room: 'lab', wing: 'basics', lesson: null, seen: new Set(), phase: 'idle', comparePower: true, selected: null, gas: false, solid: false };
}

const exhibitIds = ['atom', 'electrodes', 'salt', ...Object.keys(equipment)];

let state = initialState();
let timer;
let notice = '';
let retry = false;
let world;
let crazyLab;
const query = new URLSearchParams(window.location.search);
const crazyMode = query.get('mission') === 'crazy';
const learningMode = crazyMode && query.get('mode') === 'learning';
const safetyMode = crazyMode && query.get('mode') === 'safety';
const palaceMode = crazyMode && query.get('mode') === 'palace';
const quarryMode = crazyMode && query.get('mode') === 'quarry';
const discover = query.get('journey') === 'discover' && (quarryMode || learningMode);
const science = query.get('journey') === 'science' && (palaceMode || learningMode);
const funMode = crazyMode && !learningMode && !safetyMode && !palaceMode && !quarryMode;
const primaryMode = funMode ? 'fun' : discover || quarryMode ? 'discover' : 'science';
showModeNav(primaryMode);
if (!crazyMode) {
  find('brand-detail').textContent = 'Equipment reference';
  find('brand-detail').hidden = false;
}

function routeAction() {
  if (state.selected) return state.selected === 'gas' ? 'pipe' : 'prep';
  return state.gas ? 'solid' : 'gas';
}

function activeActions() {
  if (state.room === 'gallery') {
    if (state.lesson) return lessons[state.lesson]?.actions ?? ['lesson-close'];
    const exhibits = state.wing === 'equipment' ? [...Object.keys(equipment), 'basics-wing'] : ['atom', 'electrodes', 'salt', 'equipment-wing'];
    return [...exhibits, 'enter'];
  }
  switch (state.phase) {
    case 'idle': return ['start'];
    case 'observe': return ['lab-observe', 'compare-power'];
    case 'route': return [routeAction()];
    case 'prep-dry': return ['dry'];
    case 'ready': return ['reactor'];
    case 'product': return ['inspect-powder'];
    case 'won': return ['restart'];
    default: return [];
  }
}

function render() {
  const gallery = state.room === 'gallery';
  const equipmentWing = gallery && state.wing === 'equipment';
  const exhibit = gallery ? equipment[state.lesson] : null;
  const lesson = gallery ? lessons[state.lesson] ?? exhibit : null;
  const [title, body] = gallery
    ? lesson ? [lesson.title, lesson.body] : equipmentWing
      ? ['Equipment hall', 'Explore four devices. See what each one does and how it helps make copper powder.']
      : ['Explore the Knowledge Palace', 'Where will bubbles appear? What happens to salt in water? Pick an exhibit and try it.']
    : state.phase === 'route' ? routeSteps[routeAction()] : phases[state.phase];
  const active = activeActions();
  find('location').textContent = gallery ? `Knowledge Palace / ${equipmentWing ? 'Equipment' : 'Basics'}` : 'Mission / Laboratory';
  find('kicker').textContent = gallery ? `Discoveries · ${state.seen.size} of ${exhibitIds.length}` : 'Mission · First batch';
  find('mission-title').textContent = title;
  find('mission-body').textContent = body;
  find('palace-rewards-entry').hidden = !gallery || Boolean(state.lesson);
  const detail = find('exhibit-detail');
  detail.textContent = exhibit?.extra ?? '';
  detail.hidden = !exhibit;
  find('power-example').hidden = !gallery || state.lesson !== 'equipment-power';
  find('patent-apparatus').hidden = !equipmentWing || Boolean(state.lesson);
  const signLesson = gallery && ['atom-signs', 'atom-paired'].includes(state.lesson);
  const paired = state.lesson === 'atom-paired';
  const signBoard = find('sign-board');
  signBoard.hidden = !signLesson;
  signBoard.dataset.paired = String(paired);
  find('signs-apart').hidden = paired;
  find('signs-paired').hidden = !paired;
  find('charge-board').hidden = !gallery || !['atom-intro', 'atom-question', 'atom-done'].includes(state.lesson);
  find('charge-after').hidden = state.lesson === 'atom-intro';
  find('charge-result').hidden = state.lesson !== 'atom-done';
  find('lab-legend').hidden = gallery || !routePhases.includes(state.phase);
  find('scale-note').hidden = gallery || !['product', 'won'].includes(state.phase);
  const powerState = find('power-state');
  powerState.hidden = gallery || state.phase !== 'observe';
  powerState.dataset.power = state.comparePower ? 'on' : 'off';
  powerState.textContent = state.comparePower ? 'Power on. The right plate makes new bubbles. Copper leaves the left plate.'
    : 'Power off. New bubbles stop forming and copper stops leaving the plate. The grains already at the bottom stay there.';
  labels['compare-power'] = state.comparePower ? 'Switch off and compare' : 'Switch the power back on';
  for (const id of ['lab-why', 'why-current', 'why-salt']) {
    const explanation = find(id);
    explanation.hidden = gallery || !['idle', 'electrolysis', 'observe'].includes(state.phase);
    if (explanation.hidden) explanation.open = false;
  }
  const pipe = find('why-pipe');
  pipe.hidden = gallery || !routePhases.includes(state.phase);
  if (pipe.hidden) pipe.open = false;
  const reactor = find('reactor-card');
  reactor.hidden = gallery || !['ready', 'reduction', 'product', 'won'].includes(state.phase);
  reactor.dataset.phase = state.phase;
  find('reactor-before').hidden = ['product', 'won'].includes(state.phase);
  find('reactor-after').hidden = !['product', 'won'].includes(state.phase);
  find('atom-path').hidden = !gallery || !['atom-question', 'atom-done'].includes(state.lesson);
  find('lab-steps').hidden = gallery;
  for (const [index, item] of Array.from(find('lab-steps').children).entries()) {
    const stage = labStage[state.phase];
    item.setAttribute('aria-current', index === stage ? 'step' : 'false');
    item.dataset.complete = String(index < stage);
  }
  const next = find('scene-next');
  next.textContent = gallery ? '' : active.length ? `Next · ${labels[active[0]]}` : title;
  next.dataset.action = active[0] ?? '';
  next.disabled = !active.length;
  next.hidden = gallery;
  galleryTab.setAttribute('aria-current', gallery && !equipmentWing ? 'step' : 'false');
  equipmentTab.setAttribute('aria-current', equipmentWing ? 'step' : 'false');
  labTab.setAttribute('aria-current', gallery ? 'false' : 'step');
  syncActions(active);
  feedback.textContent = notice;
  feedback.classList.toggle('retry', retry);
  feedback.hidden = !notice;
  world?.update(state, active, title, notice || (exhibit ? `${body} ${exhibit.extra}` : body), labels);
}

function syncActions(active) {
  const existing = new Map(Array.from(actions.children, (button) => [button.dataset.action, button]));
  const focused = document.activeElement;
  const hadActionFocus = actions.contains(focused);
  for (const [id, button] of existing) if (!active.includes(id)) button.remove();
  active.forEach((id, index) => {
    const button = existing.get(id) ?? document.createElement('button');
    button.type = 'button';
    button.dataset.action = id;
    const label = state.seen.has(id) ? `✓ ${labels[id]}` : labels[id];
    if (button.textContent !== label) button.textContent = label;
    button.classList.toggle('primary', active.length === 1 || id === 'enter' || id === 'lab-observe');
    button.classList.toggle('selected', state.selected === id);
    if (actions.children[index] !== button) actions.insertBefore(button, actions.children[index] ?? null);
  });
  if (hadActionFocus && !actions.contains(document.activeElement)) {
    (focused.isConnected ? focused : actions.firstElementChild ?? find('mission-title')).focus({ preventScroll: true });
  }
}

function say(text, needsRetry = false) {
  notice = text;
  retry = needsRetry;
}

function showRoom(room, wing = state.wing) {
  const sameArea = state.room === room && (room === 'lab' || state.wing === wing);
  state.room = room;
  state.wing = wing;
  state.lesson = null;
  say('');
  hover(null);
  if (sameArea) world?.center();
  render();
}

function reset() {
  clearTimeout(timer);
  state = initialState();
  say('');
  hover(null);
  world?.reset();
  render();
}

function advance(phase, next, duration) {
  state.phase = phase;
  timer = setTimeout(() => {
    state.phase = next;
    if (state.room === 'lab') {
      say('');
      render();
    }
  }, duration);
}

function choose(id) {
  if (!activeActions().includes(id)) return;
  say('');
  hover(null);
  if (id === 'atom') {
    state.lesson = 'atom-signs';
  } else if (id === 'pair-charges') {
    state.lesson = 'atom-paired';
  } else if (id === 'meet-atom') {
    state.lesson = 'atom-intro';
  } else if (id === 'electrodes') {
    state.lesson = 'electrodes-intro';
  } else if (id === 'salt') {
    state.lesson = 'salt-intro';
  } else if (id === 'salt-compare') {
    state.seen.add('salt');
    state.lesson = 'salt-done';
  } else if (equipment[id]) {
    state.lesson = id;
  } else if (id === 'equipment-wing' || id === 'basics-wing') {
    showRoom('gallery', id === 'equipment-wing' ? 'equipment' : 'basics');
    return;
  } else if (id === 'atom-remove') {
    state.lesson = 'atom-question';
    world?.exhibit('atom');
  } else if (id === 'charge-plus') {
    state.seen.add('atom');
    state.lesson = 'atom-done';
  } else if (id === 'charge-zero' || id === 'charge-minus') {
    say('Look at the empty box. Which sign is left beside it?', true);
  } else if (id === 'electrodes-power') {
    state.lesson = 'electrodes-question';
    world?.exhibit('electrodes');
  } else if (id === 'plate-plus') {
    say('Look at the − plate. Can you see the bubbles above it?', true);
  } else if (id === 'plate-minus') {
    state.seen.add('electrodes');
    state.lesson = 'electrodes-done';
  } else if (id === 'lesson-close') {
    if (equipment[state.lesson]) state.seen.add(state.lesson);
    state.lesson = null;
  } else if (id === 'enter') {
    showRoom('lab');
    return;
  } else if (id === 'start') {
    advance('electrolysis', 'observe', 3000);
  } else if (id === 'compare-power') {
    state.comparePower = !state.comparePower;
  } else if (id === 'lab-observe') {
    state.phase = 'route';
  } else if (id === 'gas' || id === 'solid') {
    state.selected = id;
    if (id === 'gas') find('why-pipe').open = true;
  } else if (id === 'pipe' || id === 'prep') {
    state[state.selected] = true;
    state.selected = null;
    if (id === 'pipe') advance('gas-flow', 'route', 1850);
    else advance('filtering', 'prep-dry', 2200);
  } else if (id === 'dry') {
    advance('drying', 'ready', 1950);
  } else if (id === 'reactor') {
    advance('reduction', 'product', 2100);
  } else if (id === 'inspect-powder') {
    state.phase = 'won';
  } else if (id === 'restart') {
    reset();
    return;
  }
  render();
}

function hover(id) {
  const text = crazyMode ? '' : glance[id] ?? labels[id];
  tip.textContent = text ?? '';
  tip.hidden = !text;
}

function hint(topic) {
  if (topic === 'powder' && state.room === 'lab') world?.suggest('sample');
  say(explanations[topic]);
  render();
}

if (!quarryMode) try {
  world = createWorld(find('viewport'), (id) => {
    if (crazyLab) crazyLab.choose(id);
    else choose(id);
  }, funMode ? null : hover);
  if (navigator.xr) {
    const refreshSupport = async () => {
      try { vr.hidden = !(await navigator.xr.isSessionSupported('immersive-vr')); }
      catch { vr.hidden = true; }
    };
    refreshSupport();
    navigator.xr.addEventListener('devicechange', refreshSupport);
    vr.addEventListener('click', async () => {
      try { await world.enterVR(); }
      catch {
        const message = 'VR could not start. You can keep playing on screen.';
        if (crazyLab) crazyLab.showMessage(message);
        else { say(message); render(); }
      }
    });
  }
} catch (error) {
  console.warn('3D unavailable', error);
  find('scene-help').textContent = '3D is unavailable. Use the action buttons to continue.';
  find('center').hidden = true;
}

labTab.addEventListener('click', () => showRoom('lab'));
galleryTab.addEventListener('click', () => showRoom('gallery', 'basics'));
equipmentTab.addEventListener('click', () => showRoom('gallery', 'equipment'));
function openBasics(lesson) {
  state.room = 'gallery';
  state.wing = 'basics';
  state.lesson = lesson;
  say('');
  hover(null);
  render();
}
find('learn-atom').addEventListener('click', () => openBasics('atom-intro'));
find('learn-salt').addEventListener('click', () => openBasics('salt-intro'));
find('scene-next').addEventListener('click', (event) => choose(event.currentTarget.dataset.action));
actions.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (button) choose(button.dataset.action);
});
find('restart').addEventListener('click', () => {
  if (crazyLab) crazyLab.restart();
  else reset();
});
find('center').addEventListener('click', () => world?.center());
find('hint-ion').addEventListener('click', () => hint('atom'));
find('hint-powder').addEventListener('click', () => hint('powder'));

const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const voice = find('voice');
  const status = find('voice-status');
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  voice.hidden = false;
  find('voice-note').hidden = false;
  const tell = (text) => { status.hidden = false; status.textContent = text; };
  voice.addEventListener('click', () => {
    try {
      recognition.start();
      voice.disabled = true;
      tell('Listening…');
    } catch {
      tell('Voice is unavailable. Try a question button.');
    }
  });
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.toLowerCase();
    if (/powder|reactor|порош|реактор/.test(text)) hint('powder');
    else if (/\bions?\b|ион/.test(text)) hint('atom');
    else { tell('Try asking about ions or copper powder, or choose a question button.'); return; }
    tell('Hint opened.');
  };
  recognition.onerror = () => tell('Voice is unavailable. Try a question button.');
  recognition.onend = () => {
    voice.disabled = false;
    if (status.textContent === 'Listening…') tell('I did not catch that. Try again or choose a question button.');
  };
}

if (crazyMode) {
  configureCrazyPage();
  if (quarryMode) setupQuarry({ discover, nextHref: '?mission=crazy&mode=learning&journey=discover' });
  else if (learningMode) crazyLab = setupLearningLab(world);
  else if (palaceMode) crazyLab = setupPalace(world, { science });
  else crazyLab = safetyMode ? setupCrazyLab(world) : setupFunLab(world);
} else render();
setupDemoGuide();
if (quarryMode || learningMode || palaceMode) {
  const { setupCompanion } = await import('./companion.js');
  setupCompanion(quarryMode ? 'quarry' : palaceMode ? 'palace' : 'lab');
}
else if (!discover && !funMode && !palaceMode && !quarryMode) {
  setupGuide(() => crazyLab ? crazyLab.context() : ({
    room: state.room, wing: state.wing, phase: state.phase, lesson: state.lesson,
    selected: state.selected, gas: state.gas, solid: state.solid, comparePower: state.comparePower,
    remaining: exhibitIds.filter((id) => !state.seen.has(id)),
  }));
}

function configureCrazyPage() {
  document.documentElement.lang = 'en';
  document.body.dataset.mode = quarryMode ? 'quarry' : learningMode ? 'learning' : palaceMode ? 'palace' : safetyMode ? 'crazy' : 'fun';
  const activity = quarryMode ? 'Copper Quarry' : learningMode ? 'Powder Lab'
    : palaceMode ? 'Knowledge Palace' : safetyMode ? 'Safety Drill' : 'Fun Mode';
  document.title = `Crazy Lab · ${activity}`;
  find('brand-name').textContent = 'Crazy Lab';
  find('brand-detail').textContent = funMode ? 'Security Lab' : activity;
  find('brand-detail').hidden = false;
  find('copper-panel').hidden = true;
  const journey = find('lab-nav');
  journey.hidden = funMode;
  if (!funMode) showJourneyNav(journey, primaryMode, quarryMode || palaceMode ? 0 : safetyMode ? 2 : 1);
  find('game-scene').setAttribute('aria-label', '3D laboratory');
  find('center').textContent = 'Reset view';
  find('center').setAttribute('aria-label', 'Reset view');
  find('center').title = 'Reset view';
  find('vr').textContent = 'Enter VR';
  find('guide-open').hidden = funMode || palaceMode || quarryMode || discover;
  find('guide-open').textContent = 'Ask the guide';
  find('restart').hidden = funMode || quarryMode;
  find('restart').textContent = 'Restart';
  find('footer-detail').textContent = funMode ? 'Fictional effects in a virtual lab' : 'Interactive training simulation';
  find('footer-source').textContent = 'Patent KZ B 32204 ↗';
  if (quarryMode) {
    find('game-scene').hidden = true;
    find('footer-detail').textContent = 'Finite map · Simplified copper production';
    find('footer-source').hidden = true;
  }
  const help = find('scene-help');
  if (help.firstElementChild) {
    help.firstElementChild.textContent = learningMode || palaceMode ? 'Tap the highlighted object' : 'Drag to look around';
    help.querySelector('.desktop-help').textContent = ' · WASD to move';
  } else help.textContent = '3D is unavailable. Use the action buttons to continue.';
  find('viewport').querySelector('canvas')?.setAttribute('aria-label', 'Interactive 3D laboratory');
}
