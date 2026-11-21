import { PALACE_REWARDS, earnPalacePoint, getPalacePoints } from './fun-rewards.js';
import { showVictory } from './victory.js';

const rewardLessons = [
  {
    id: 'bubbles', name: 'Bubbles', title: 'Find the bubbles',
    start: 'The tank is asleep. Wake it up and see which plate fizzes!',
    question: 'Pop the bubbles! Tap the side where they rise.',
    result: 'Pop! In this tank, bubbles of a gas called hydrogen rise from the minus plate.',
    retry: 'Look for the rising bubbles.',
    startAction: ['electrodes-power', 'Power on'],
    answers: [['plate-plus', '+ Plus plate'], ['plate-minus', '− Minus plate']],
    correct: 'plate-minus',
    exhibit: 'electrodes',
    gallery: { start: 'electrodes-intro', question: 'electrodes-question', done: 'electrodes-done' },
  },
  {
    id: 'filter', name: 'Filter', title: 'Catch the grains',
    start: 'Can you save the orange grains? Open the drain and watch where they land.',
    watch: 'Watch the blue liquid drop into the cup.',
    question: 'Where did the orange grains stay?',
    result: 'The liquid went into the cup. The filter caught the grains.',
    retry: 'The cup is blue. Look for orange above it.',
    startAction: ['prep', 'Start filtering'],
    answers: [['crazy-filter-screen', 'In the filter'], ['crazy-filter-cup', 'In the cup']],
    correct: 'crazy-filter-screen',
    wait: 2300,
    lab: { start: 'filter', watch: 'filtering', question: 'prep-dry', done: 'prep-dry' },
  },
  {
    id: 'charge', name: 'Charge', title: 'Move the electron',
    start: 'The blue dot carries a minus sign. Send it on a trip and see what the atom keeps.',
    watch: 'Watch one minus leave the atom.',
    question: 'One minus left. Which sign is left over?',
    result: 'One extra plus gives the atom a positive charge.',
    retry: 'Count the signs. One minus is missing.',
    startAction: ['atom-remove', 'Move the electron'],
    answers: [['charge-plus', 'Plus (+)'], ['charge-minus', 'Minus (−)']],
    correct: 'charge-plus',
    wait: 1100,
    exhibit: 'atom',
    gallery: { start: 'atom-intro', watch: 'atom-question', question: 'atom-question', done: 'atom-done' },
  },
];

const nextAction = 'crazy-palace-next';

const scienceCopy = {
  bubbles: {
    name: 'Find the bubbles', title: 'Where do bubbles start?',
    start: 'Two copper plates sit in salty water. The water is still. Switch on the tank and watch the plates.',
    startAction: ['electrodes-power', 'Switch on the tank'],
    question: 'Trace the bubbles down. Which plate do they rise from?',
    answers: [['plate-plus', 'The + plate'], ['plate-minus', 'The − plate']],
    retry: 'Follow one bubble back to the plate just below it. Look at the sign on that plate.',
    result: 'The bubbles rise from the minus plate. The power helps turn some water into a gas called hydrogen. Each bubble holds a little of that gas.',
    words: 'In this tank, the minus plate is called the cathode. The other plate, marked plus, is the anode.',
  },
  charge: {
    name: 'Move a tiny charge', title: 'What leaves a copper atom?',
    start: 'A copper plate is made of tiny pieces called atoms. Inside each atom, plus and minus charges balance. Move one blue minus into the wire.',
    watch: 'Follow the blue minus from the atom into the wire.',
    question: 'The blue minus is in the wire. Which sign now has one extra inside the atom?',
    retry: 'Look inside the ring marked Atom. The blue minus you moved is outside that ring.',
    result: 'One minus left, so the atom has one extra plus. This is how a tiny piece of copper can enter the water carrying a plus charge.',
    startAction: ['atom-remove', 'Move the blue minus'],
    answers: [['charge-plus', 'Plus (+)'], ['charge-minus', 'Minus (−)']],
    words: 'The blue minus represents an electron. An atom that gains or loses electrons is called an ion. The sketch shows one pair of charges to follow.',
  },
  filter: {
    name: 'Save the grains', title: 'Can you keep the grains?',
    start: 'The tank also makes solid grains that contain copper. They are mixed with water. Open the drain to separate them.',
    watch: 'The water is dripping through the mesh. Watch the orange grains.',
    question: 'You want to save the grains for the next machine. Which part would you keep?',
    answers: [['crazy-filter-screen', 'The grains on the mesh'], ['crazy-filter-cup', 'The liquid in the cup']],
    retry: 'Look for the orange specks. Did they pass through the mesh with the water?',
    result: 'The mesh catches the solid grains, like a strainer catches pasta. These grains hold copper joined to oxygen. In the lab, you can turn them into copper metal.',
    startAction: ['prep', 'Open the drain'],
    words: 'A mesh is a sheet with little holes. Here it acts as a filter. The grains it catches are called copper(I) oxide.',
  },
};

const scienceLessons = ['bubbles', 'charge', 'filter'].map(id => ({
  ...rewardLessons.find(lesson => lesson.id === id), ...scienceCopy[id],
}));

// The sketches mirror the 3D experiments and remain usable without WebGL.
const scienceSketches = {
  bubbles: `<div class="science-sketch tank-sketch">
    <div class="tank-water"><span class="tank-plate">+</span><span class="tank-plate">−</span>
    <span class="tank-bubbles"><i></i><i></i><i></i></span></div>
    <span class="tank-status"></span>
  </div>`,
  charge: `<div class="science-sketch charge-sketch">
    <span class="atom-ring"></span><span class="charge-wire"></span>
    <span class="fixed-plus">+</span><span class="moving-minus">−</span>
    <span class="sketch-caption">Atom</span><span class="sketch-caption">Wire</span>
  </div>`,
  filter: `<div class="science-sketch mesh-sketch">
    <div class="mesh-top"><span class="mesh-water"></span><span class="mesh-grains">● • ● •</span></div>
    <div class="mesh-cup"><span></span></div>
    <span class="mesh-label">Mesh</span><span class="cup-label">Cup</span>
  </div>`,
};

export function setupPalace(world, { science = false } = {}) {
  const lessons = science ? scienceLessons : rewardLessons;
  const panel = document.getElementById('palace-panel');
  panel.innerHTML = `
    <p class="eyebrow" id="palace-progress"></p>
    <nav class="palace-lessons" aria-label="Experiments"></nav>
    <div class="palace-experiment" aria-labelledby="palace-title">
      <h1 id="palace-title" tabindex="-1"></h1>
      <p id="palace-instruction" class="palace-instruction" aria-live="polite"></p>
      <div class="palace-toy" id="palace-toy"></div><div class="palace-actions" id="palace-actions" role="group" aria-labelledby="palace-instruction"></div>
      <p class="palace-feedback" id="palace-feedback" role="status" hidden></p>
      <details class="learning-details" id="palace-words" hidden>
        <summary>New words</summary><p></p>
      </details>
    </div>
    <div class="palace-reward" id="palace-reward" hidden>
      <span class="palace-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <p id="palace-reward-title"></p>
      <a href="?mission=crazy">Play Fun Mode</a>
    </div>
    <button class="palace-retry" id="palace-retry" type="button">Restart experiment</button>
    <p id="palace-notice" class="palace-feedback" role="status" hidden></p>
  `;

  const find = (id) => document.getElementById(id);
  const title = find('palace-title');
  const instruction = find('palace-instruction');
  const actions = find('palace-actions');
  const feedback = find('palace-feedback');
  const rewardBox = find('palace-reward');
  const rewardTitle = find('palace-reward-title');
  const notice = find('palace-notice');
  const words = find('palace-words');
  const progress = find('palace-progress');
  const lessonList = panel.querySelector('.palace-lessons');
  const points = getPalacePoints();
  const seen = new Set();
  let selected = science ? 0 : Math.max(0, lessons.findIndex(({ id }) => !points.has(id)));
  let stage = 'start';
  let waitTimer;
  let feedbackText = '';
  let newReward = false;
  let visibleActions = [];

  const rewards = new Map(PALACE_REWARDS.map((reward) => [reward.lesson, reward]));
  const scienceNext = science ? document.createElement('a') : null;
  if (scienceNext) {
    panel.dataset.science = 'true';
    actions.before(feedback);
    scienceNext.className = 'science-next';
    scienceNext.href = '?mission=crazy&mode=learning&journey=science';
    scienceNext.textContent = 'Make copper powder in the lab →';
    actions.after(scienceNext);
    const otherLessons = document.createElement('details');
    otherLessons.className = 'science-lesson-list learning-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Choose an experiment';
    otherLessons.append(summary, lessonList);
    find('palace-retry').before(otherLessons);
    if (!world) find('game-scene').hidden = true;
  }
  const lessonButtons = lessons.map(({ id, name }, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.palaceLesson = id;
    const label = document.createElement('strong');
    label.textContent = name;
    const weapon = document.createElement('span');
    weapon.textContent = rewards.get(id).name;
    button.append(label);
    if (!science) button.append(weapon);
    button.addEventListener('click', () => switchLesson(index));
    lessonList.append(button);
    return button;
  });

  function nextLessonIndex() {
    if (science) return selected + 1 < lessons.length ? selected + 1 : -1;
    const offset = lessons.findIndex(({ id }, index) => index > selected && !points.has(id));
    return offset >= 0 ? offset : lessons.findIndex(({ id }) => !points.has(id));
  }

  function buttonsFor(lesson) {
    if (stage === 'start') return [lesson.startAction];
    if (stage === 'question') return lesson.answers;
    if (stage === 'done' && nextLessonIndex() >= 0) {
      const nextName = lessons[nextLessonIndex()].name;
      return [[nextAction, science ? `Next: ${nextName}` : 'Next experiment']];
    }
    return [];
  }

  const toy = find('palace-toy');
  const toyActions = {
    bubbles: ['electrodes-power','plate-minus'],
    filter: ['prep','crazy-filter-screen'],
    charge: ['atom-remove','charge-plus'],
  };
  const toyLabels = {
    bubbles: ['Wake the tank', 'Pop the bubbles rising from the minus plate'],
    filter: ['Drain the cup', 'Collect the grains left on the filter'],
    charge: ['Move the blue electron', 'Collect the plus left behind'],
  };
  const tokens = {
    bubbles: '<i>+</i><b>◦ ◦</b><i>−</i>',
    filter: '<b>• • •</b><i></i><small>≈</small>',
    charge: '<i>+</i><b>−</b>',
  };
  function drawToy(lesson) {
    if (science) {
      if (toy.dataset.model !== lesson.id) {
        toy.dataset.model = lesson.id;
        toy.setAttribute('role', 'img');
        toy.innerHTML = scienceSketches[lesson.id];
      }
      const observations = {
        bubbles: ['Two plates marked plus and minus stand in still water.', 'A stream of bubbles rises from the minus plate.'],
        charge: ['The atom ring holds a plus and a minus. A wire runs alongside it.', 'The plus is inside the atom ring. The minus is now in the wire.'],
        filter: ['Water and orange grains sit above a mesh. The cup below is empty.', 'The orange grains sit on the mesh. Water fills the cup below.'],
      };
      toy.setAttribute('aria-label', observations[lesson.id][stage === 'start' ? 0 : 1]);
      return;
    }
    toy.dataset.model = lesson.id;
    const index = stage === 'start' ? 0 : 1;
    const playable = stage === 'start' || stage === 'question';
    const token = document.createElement(playable ? 'button' : 'span');
    if (playable) {
      token.type = 'button';
      token.setAttribute('aria-label',toyLabels[lesson.id][index]);
      token.addEventListener('click', () => choose(toyActions[lesson.id][index]));
    }
    token.innerHTML = tokens[lesson.id];
    for (const item of token.children) item.setAttribute('aria-hidden','true');
    toy.replaceChildren(token);
  }
  function render() {
    const lesson = lessons[selected];
    const reward = rewards.get(lesson.id);
    const text = stage === 'done' ? lesson.result : lesson[stage];
    visibleActions = buttonsFor(lesson);
    const hintAction = science && (stage === 'start' || stage === 'done') ? visibleActions[0]?.[0] : undefined;
    actions.toggleAttribute('data-palace-guide', science && stage === 'question');
    if (scienceNext) {
      scienceNext.hidden = stage !== 'done' || Boolean(hintAction);
      scienceNext.toggleAttribute('data-palace-guide', !scienceNext.hidden);
    }
    panel.dataset.lesson = lesson.id;
    panel.dataset.stage = stage;
    const signal = { start: 'Try it', watch: 'Watch', question: 'Your turn', done: 'What you found' };
    progress.textContent = science ? `Experiment ${selected + 1} of ${lessons.length} · ${signal[stage]}`
      : `${points.size} ${points.size === 1 ? 'point' : 'points'} · ${points.size}/${lessons.length} upgrades unlocked`;
    for (const [index, button] of lessonButtons.entries()) {
      button.setAttribute('aria-pressed', String(selected === index));
      button.toggleAttribute('data-complete', points.has(lessons[index].id));
      if (science) button.setAttribute('aria-label', lessons[index].name + (points.has(lessons[index].id) ? ', completed' : ''));
    }
    drawToy(lesson);
    title.textContent = lesson.title;
    instruction.textContent = text;
    words.hidden = !science || stage !== 'done';
    if (science) words.querySelector('p').textContent = lesson.words;
    feedback.hidden = !feedbackText;
    feedback.textContent = feedbackText;
    rewardBox.hidden = science || stage !== 'done';
    rewardBox.toggleAttribute('data-new', newReward);
    rewardTitle.textContent = newReward ? `Unlocked ${reward.name}!` : `${reward.name} is unlocked`;
    actions.replaceChildren(...visibleActions.map(([id, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.palaceAction = id;
      button.toggleAttribute('data-palace-guide', id === hintAction);
      button.textContent = label;
      return button;
    }));
    const active = visibleActions.map(([id]) => id);
    world?.update({
      crazy: true, palace: true, learning: Boolean(lesson.lab),
      room: lesson.lab ? 'lab' : 'gallery', wing: 'basics', seen,
      phase: lesson.lab?.[stage] ?? 'idle', lesson: lesson.gallery?.[stage], hintAction,
    }, active, lesson.title, text, Object.fromEntries(visibleActions));
  }

  function switchLesson(index) {
    if (index < 0 || index >= lessons.length) return;
    window.clearTimeout(waitTimer);
    world?.reset();
    selected = index;
    stage = 'start';
    feedbackText = '';
    newReward = false;
    notice.hidden = true;
    words.open = false;
    if (science) lessonList.closest('details').open = false;
    render();
    if (science) title.focus({ preventScroll: true });
  }

  function choose(id) {
    if (!visibleActions.some(([action]) => action === id)) return;
    const lesson = lessons[selected];
    if (id === nextAction) {
      switchLesson(nextLessonIndex());
      return;
    }
    const focusLesson = science && actions.contains(document.activeElement);
    if (stage === 'start') {
      if (lesson.exhibit) world?.exhibit(lesson.exhibit);
      stage = lesson.wait ? 'watch' : 'question';
      if (lesson.wait) {
        waitTimer = window.setTimeout(() => {
          stage = 'question';
          render();
        }, lesson.wait);
      }
      render();
      if (focusLesson) title.focus({ preventScroll: true });
      return;
    }
    if (id !== lesson.correct) {
      feedbackText = lesson.retry;
      feedback.hidden = false;
      feedback.textContent = feedbackText;
      return;
    }
    if (lesson.id === 'bubbles') world?.exhibit('palace-bubble-pop');
    newReward = !points.has(lesson.id) && earnPalacePoint(lesson.id);
    points.add(lesson.id);
    stage = 'done';
    feedbackText = '';
    render();
    if (focusLesson) title.focus({ preventScroll: true });
    if (newReward && points.size === lessons.length) showVictory('palace');
  }

  function restart() {
    switchLesson(selected);
  }

  actions.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-palace-action]');
    if (button) choose(button.dataset.palaceAction);
  });
  find('palace-retry').addEventListener('click', restart);
  find('location').textContent = 'Knowledge Palace';
  panel.hidden = false;
  render();
  return {
    choose, restart,
    showMessage(text) {
      notice.textContent = text;
      notice.hidden = false;
    },
  };
}
