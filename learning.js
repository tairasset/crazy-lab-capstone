import { clearVictory, showVictory } from './victory.js';

const learningSteps = [
  {
    phase: 'idle', name: 'Power', action: 'start', label: 'Turn on the power',
    title: 'Wake up the tank',
    text: 'The tank is still. Tap the power supply on the left and watch what happens inside the tank.',
    detail: 'The power supply makes electric charge move. That movement is called current. In this tank, current makes changes happen at the two plates.',
    animation: ['electrolysis', 1800, 'Power is on', 'Look for bubbles rising and little grains collecting at the bottom.'],
  },
  {
    phase: 'observe', name: 'Tank', action: 'lab-observe', label: 'Look inside the tank',
    title: 'Spot two clues',
    text: 'Tap the tank. One plate supplies copper for the grains at the bottom. Bubbles of a gas called hydrogen rise from the other plate.',
    detail: 'The plus plate is called the anode. Tiny charged bits of copper leave it and enter the liquid. They become part of solid grains called copper(I) oxide. At the minus plate, called the cathode, some of the water turns into hydrogen bubbles.',
  },
  {
    phase: 'route', name: 'Gas tube', action: 'pipe', label: 'Follow the gas tube',
    title: 'Follow the bubbles',
    text: 'Tap the tube above the tank. Follow the glowing dots as the gas travels to the chamber on the right.',
    detail: 'The hood catches the gas above the liquid. The tube gives it a path to the reactor. The wet grains stay in the tank until you take them to the filter.',
    animation: ['gas-flow', 1850, 'Hydrogen is on its way', 'Watch the glowing dots travel along the tube to the reactor.'],
  },
  {
    phase: 'filter', name: 'Filter', action: 'prep', label: 'Separate the wet grains',
    title: 'Catch the grains',
    text: 'Tap the filter in the middle. Watch the liquid drip into the cup while the tiny solid grains stay on top.',
    detail: 'Think of a kitchen strainer. Liquid fits through tiny openings. Solid grains are caught by the filter. These grains are copper oxide, the material you will turn into copper.',
    animation: ['filtering', 2300, 'Look above and below the filter', 'The cup fills with liquid. The solid grains collect above it.'],
  },
  {
    phase: 'prep-dry', name: 'Rinse & dry', action: 'dry', label: 'Rinse and dry the grains',
    title: 'Get the grains ready',
    text: 'See the grains left on the filter? Tap the drying station to rinse them, dry them and send them to the reactor.',
    detail: 'Rinsing washes away dissolved salt left with the grains. Drying removes the water still on them. The dry grains are still copper oxide.',
    animation: ['drying', 1850, 'Preparing the grains', 'Watch the grains travel toward the chamber after they have been rinsed and dried.'],
  },
  {
    phase: 'ready', name: 'Reactor', action: 'reactor', label: 'Start the reactor',
    title: 'Turn the grains into copper',
    text: 'The gas and the dry grains have arrived. Tap the reactor, the chamber on the right, to bring them together.',
    detail: 'Inside the hot chamber, hydrogen joins with the oxygen in the grains to make water. Copper is what stays behind. This change is called reduction.',
    animation: ['reduction', 2100, 'The grains are changing', 'Hydrogen and oxygen make water. Copper stays behind in the tray.'],
  },
  {
    phase: 'product', name: 'Powder', action: 'inspect-powder', label: 'Inspect the copper powder',
    title: 'Find your copper powder',
    text: 'Tap the tray on the right. The copper is a pile of tiny pieces of metal. That is your powder.',
    detail: 'The patent reports grains smaller than one millionth of a metre in its example. The game draws them much larger so you can see them.',
  },
];

const learningComplete = {
  title: 'Your copper powder is ready',
  text: 'You made wet grains in the tank, caught them with the filter and dried them. In the reactor, hydrogen helped turn those grains into copper powder.',
  detail: 'Follow the two paths again. Gas travels through the top tube. The solid grains travel through the filter and drying station. Both paths meet at the reactor.',
};

const scienceCopy = {
  'idle': {
    name: 'Power', title: 'Can a copper plate become powder?', label: 'Switch on the tank',
    text: 'Start with two copper plates in salty water. Switch on the power box and watch the tank. Your goal is to collect tiny pieces of copper metal.',
    detail: 'With the power off, the water is still. The box gives the plates energy. With power on, gas bubbles form at one plate and copper leaves the other.',
    watch: ['Two things to follow', 'Bubbles of gas rise. Solid grains sink. They take different routes through the lab.'],
  },
  'observe': {
    title: 'See what the plates make', label: 'Look in the tank',
    text: 'Look inside the tank. Find the bubbles at the minus plate and the pile of grains on the bottom. Those grains contain copper and oxygen.',
    detail: 'The plus plate is the anode. Copper leaves it as tiny charged bits and helps make the solid grains. The minus plate is the cathode. Some water becomes hydrogen bubbles there.',
  },
  'route': {
    name: 'Tube', title: 'Follow the gas', label: 'Follow the tube',
    text: 'The bubbles hold a gas called hydrogen. Follow it along the tube to the hot chamber. The solid grains stay behind for now.',
    watch: ['The gas takes the tube', 'Each moving dot stands for a bit of hydrogen gas.'],
  },
  'filter': {
    title: 'Catch the grains', label: 'Start the filter',
    text: 'Now follow the grains. Open the filter to let the water through. Look for the grains above the little holes.',
    watch: ['The filter keeps the grains', 'The water drips into the cup. The grains stay on top.'],
  },
  'prep-dry': {
    name: 'Wash & dry', title: 'Wash and dry the grains', label: 'Wash and dry',
    text: 'Rinse away the salt, then dry the grains. They still contain copper and oxygen.',
    watch: ['Clean grains on the move', 'The dry grains go to the hot chamber.'],
  },
  'ready': {
    name: 'Hot chamber', title: 'Make copper', label: 'Start the hot chamber',
    text: 'The gas from the tube meets the dry grains here. Start the chamber and see what stays in the tray.',
    watch: ['Copper stays in the tray', 'Hydrogen joins with oxygen from the grains to make water. Tiny bits of copper stay behind.'],
  },
  'product': {
    title: 'Find the copper powder', label: 'Look at the powder',
    text: 'Tap the tray. You made a pile of very tiny bits of copper.',
  },
};

const scienceSteps = learningSteps.map(step => {
  const { watch, ...copy } = scienceCopy[step.phase];
  return { ...step, ...copy, animation: watch ? [...step.animation.slice(0, 2), ...watch] : step.animation };
});

const scienceComplete = {
  title: 'You made copper powder!',
  text: 'The filter saved grains that held copper and oxygen. The hot chamber took the oxygen away. What stayed in the tray was copper metal, in tiny pieces.',
  detail: learningComplete.detail,
};

const discoverySteps = [
  {
    phase: 'idle', name: 'Tank', action: 'start', label: 'Switch on the power',
    title: 'Can you turn a plate into powder?',
    text: 'The copper has already been separated from the mined rock and shaped into plates. Two plates sit in salty water. Switch on the power and look for bubbles.',
    animation: ['electrolysis', 2200, 'Bubbles up, grains down', 'One plate supplies copper for the grains. At the other plate, water gives off a gas called hydrogen.'],
    followUp: ['gas-flow', 2000, 'Follow those bubbles', 'The tube carries the hydrogen to the chamber on the right. The grains stay in the tank.'],
  },
  {
    phase: 'filter', name: 'Filter', action: 'prep', label: 'Catch the grains',
    title: 'Keep the grains, drain the water',
    text: 'The gas took the tube. Left in the tank are grains made of copper joined to oxygen. Tap the filter to catch them while the salty water drains away.',
    animation: ['filtering', 2300, 'Look above and below the filter', 'The grains stay on top. Liquid drips into the cup below.'],
    followUp: ['drying', 2000, 'A quick rinse, then into the dryer', 'Clean water washes away leftover salt. The dryer removes the water from the grains.'],
  },
  {
    phase: 'ready', name: 'Reactor', action: 'reactor', label: 'Run the reactor',
    title: 'Bring the gas and grains together',
    text: 'Your grains have been caught, rinsed and dried. They still contain oxygen. Tap the hot chamber to see what happens when the hydrogen meets them.',
    animation: ['reduction', 2300, 'Watch the grains change', 'Hydrogen joins the oxygen in the grains to make water. Tiny pieces of copper metal stay in the tray.'],
  },
];

const discoveryComplete = {
  title: 'You made copper powder!',
  text: 'The tray shows magnified copper grains. Your next stop is the Powder Exhibition.',
};

const animationEquipment = {
  electrolysis: 'lab-observe',
  'gas-flow': 'pipe',
  filtering: 'prep',
  drying: 'dry',
  reduction: 'inspect-powder',
};

export function setupLearningLab(world) {
  const journey = new URLSearchParams(window.location.search).get('journey');
  const discovery = journey === 'discover';
  const science = journey === 'science';
  const manual = discovery || science;
  const steps = discovery ? discoverySteps : science ? scienceSteps : learningSteps;
  const completed = discovery ? discoveryComplete : science ? scienceComplete : learningComplete;
  const find = (id) => document.getElementById(id);
  const panel = find('learning-panel');
  const action = find('learning-action');
  const notice = find('learning-notice');
  const route = find('learning-route');
  const useTextTour = manual && !world;
  const animationPace = manual ? 1.45 : 1;
  if (science) {
    panel.dataset.science = 'true';
    find('learning-why').querySelector('summary').textContent = 'Why does this happen?';
    find('learning-glossary').querySelector('summary').textContent = 'New words';
  }
  if (manual) panel.dataset.pacing = 'manual';
  if (discovery) {
    find('learning-why').hidden = true;
    find('learning-glossary').hidden = true;
  }
  if (useTextTour) {
    find('game-scene').hidden = true;
    notice.textContent = 'Text tour · Use the action button to work each machine.';
    notice.hidden = false;
  }
  const seen = new Set();
  const labels = Object.fromEntries(steps.map(({ action, label }) => [action, label]));
  if (discovery) labels['inspect-powder'] = 'Visit powder exhibits';
  const markers = steps.map(({ name }) => {
    const marker = document.createElement('li');
    marker.textContent = name;
    route.append(marker);
    return marker;
  });
  let step = 0;
  let animation;
  let nextAnimation;
  let animationReady = false;
  let timer;
  let leaving = false;

  function getPhase() {
    return animation?.[0] ?? steps[step]?.phase ?? (discovery ? 'product' : 'won');
  }

  function readyEquipment() {
    return animation && animationReady ? animationEquipment[animation[0]] : undefined;
  }

  function render() {
    const current = steps[step];
    const phase = getPhase();
    const title = animation?.[2] ?? current?.title ?? completed.title;
    const text = animation?.[3] ?? current?.text ?? completed.text;
    if (discovery) {
      find('location').textContent = current ? 'Make copper powder' : 'Powder collected';
    }
    panel.dataset.phase = phase;
    find('learning-title').textContent = title;
    find('learning-body').textContent = text;
    if (!discovery) find('learning-detail').textContent = current?.detail ?? completed.detail;
    find('learning-progress').textContent = current ? `Step ${step + 1} of ${steps.length}` : 'Batch complete';
    for (const [index, marker] of markers.entries()) {
      marker.toggleAttribute('data-done', index < step);
      if (index === step) marker.setAttribute('aria-current', 'step');
      else marker.removeAttribute('aria-current');
    }

    const next = current?.action ?? (discovery ? 'inspect-powder' : 'restart');
    const continueAt = readyEquipment();
    const sceneAction = animation ? continueAt : (current || discovery) ? next : undefined;
    action.dataset.action = animation ? (animationReady ? 'continue' : '') : next;
    action.textContent = animation ? (animationReady ? 'Continue →' : 'Watch the lab…')
      : current?.label ?? (discovery ? 'Enter the exhibition →' : 'Start a new batch');
    action.setAttribute('aria-disabled', String(Boolean(animation) && !animationReady));
    action.toggleAttribute('data-guided-action', Boolean(sceneAction || (animation && animationReady)));
    world?.update({
      learning: true, discovery, crazy: true, room: 'lab', wing: 'basics', seen, phase,
      comparePower: true, animationPace, hintAction: sceneAction, hintLabel: continueAt ? 'Continue →' : undefined,
      gas: ['gas-flow', 'filter', 'filtering', 'prep-dry', 'drying', 'ready', 'reduction', 'product', 'won'].includes(phase),
      solid: ['ready', 'reduction', 'product', 'won'].includes(phase),
    }, sceneAction ? [sceneAction] : [], title, text, labels);
  }

  function visitExhibition() {
    if (leaving || step !== steps.length) return;
    window.clearTimeout(timer);
    leaving = true;
    window.location.assign('?journey=discover&stage=uses');
  }

  function playAnimation(first, followUp) {
    animation = first;
    nextAnimation = followUp;
    animationReady = useTextTour;
    render();
    if (useTextTour) return;
    timer = window.setTimeout(() => {
      if (manual) {
        animationReady = true;
        render();
      } else finishAnimation();
    }, first[1] * (manual ? animationPace : 1.1));
  }

  function finishAnimation() {
    if (nextAnimation) { playAnimation(nextAnimation); return; }
    animation = undefined;
    animationReady = false;
    advanceStep();
  }

  function advanceStep() {
    step += 1;
    render();
    if (step === steps.length) showVictory('powder');
  }

  function choose(id) {
    if (id === 'restart') { restart(); return; }
    if (animation) {
      if (manual && animationReady && (id === 'continue' || id === readyEquipment())) finishAnimation();
      return;
    }
    const current = steps[step];
    if (discovery && !current && id === 'inspect-powder') {
      visitExhibition();
      return;
    }
    if (!current || current.action !== id) return;
    find('learning-why').open = false;
    if (current.animation) {
      playAnimation(current.animation, current.followUp);
      return;
    }
    advanceStep();
  }

  function restart() {
    clearVictory();
    window.clearTimeout(timer);
    animation = undefined;
    nextAnimation = undefined;
    animationReady = false;
    step = 0;
    notice.hidden = !useTextTour;
    find('learning-why').open = false;
    find('learning-glossary').open = false;
    render();
  }

  if (manual) {
    window.addEventListener('pagehide', () => {
      window.clearTimeout(timer);
      if (animation) animationReady = true;
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        leaving = false;
        render();
      }
    });
  }

  action.addEventListener('click', () => choose(action.dataset.action));
  panel.hidden = false;
  find('location').textContent = 'Make copper powder';
  render();
  return {
    choose, restart,
    context: () => ({ mission: 'learning', phase: getPhase() }),
    showMessage(text) {
      notice.textContent = text;
      notice.hidden = false;
    },
  };
}
