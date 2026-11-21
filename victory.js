import { createVictoryAudio } from './victory-audio.js';

const messages = {
  quarry: 'Refined copper collected!',
  powder: 'You made copper powder!',
  exhibition: 'You’ve completed Discover Copper!',
  fun: 'All robot waves cleared!',
  palace: 'You finished all the chemistry experiments!',
  safety: 'Safety drill complete!',
};
const colors = ['#ffcf69', '#ff8aaa', '#7ff9d5', '#9ac5ff', '#d8a5ff', '#fff4c5'];
const audio = createVictoryAudio();
const view = document.documentElement.dataset.view;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let active;

function allowSound() {
  return document.body.dataset.mode !== 'fun' || document.getElementById('fun-sound')?.checked !== false;
}

if (view !== 'home') for (const event of ['pointerdown', 'keydown']) {
  document.addEventListener(event, () => { if (allowSound()) void audio.unlock(view === 'exhibition'); }, { capture: true, passive: true });
}

function clearBanner() {
  if (!active) return;
  window.clearTimeout(active.timer);
  cancelAnimationFrame(active.frame);
  active.element.remove();
  active = undefined;
}

export function clearVictory() {
  clearBanner();
  audio.stop();
}

function launchPoints(finale) {
  const positions = finale
    ? [[.20,.22],[.80,.20],[.47,.18],[.11,.47],[.88,.44],[.31,.28],[.68,.29],
      [.16,.17],[.85,.19],[.50,.13],[.15,.64],[.84,.62],[.31,.35],[.71,.34],[.50,.25]]
    : [[.31,.16],[.66,.16],[.5,.13],[.20,.24],[.80,.23]];
  return positions.map(([x, y], index) => ({
    x: x + (Math.random() - .5) * .04, y, delay: index * (finale ? .22 : .15),
    color: colors[index % colors.length],
    sparks: Array.from({ length: finale ? 44 : 28 }, (_, spark) => ({
      angle: spark * 2.39996, speed: .57 + Math.random() * .6, size: 1.25 + Math.random() * 1.7,
    })),
  }));
}

function paintFireworks(canvas, context, bursts, seconds, finale) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio, 1.45, Math.sqrt(1_200_000 / (width * height)));
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  const radius = Math.min(finale ? 200 : 92, Math.min(width, height) * (finale ? .25 : .145));
  const still = reducedMotion.matches;
  for (const burst of bursts) {
    const age = still ? .63 : seconds - burst.delay;
    if (age < 0 || age >= 1.7) continue;
    const fade = still ? .85 : Math.min(1, (1.7 - age) * .84);
    const spread = 1 - Math.exp(-age * 2.65);
    const centerX = burst.x * width;
    const centerY = burst.y * height;
    context.fillStyle = burst.color;
    context.strokeStyle = burst.color;
    for (const { angle, speed, size } of burst.sparks) {
      const dx = Math.cos(angle) * radius * speed;
      const dy = Math.sin(angle) * radius * speed;
      const drop = still ? 0 : age * age * 37;
      const x = centerX + dx * spread;
      const y = centerY + dy * spread + drop;
      context.globalAlpha = fade * .51;
      context.lineWidth = size * .9;
      context.beginPath();
      context.moveTo(x - dx * .12, y - dy * .12 - (still ? 0 : age * 9));
      context.lineTo(x, y);
      context.stroke();
      context.globalAlpha = fade;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
  context.globalAlpha = 1;
}

export function showVictory(stage) {
  if (!Object.hasOwn(messages, stage)) return;
  clearVictory();
  const finale = stage === 'exhibition';
  const element = document.createElement('div');
  element.className = 'victory-flare';
  element.dataset.victory = stage;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const banner = document.createElement('div');
  banner.className = 'victory-banner';
  banner.setAttribute('role', 'status');
  const heading = document.createElement('strong');
  heading.textContent = finale ? 'Congratulations!!!' : 'Congratulations!';
  const detail = document.createElement('span');
  detail.textContent = messages[stage];
  banner.append(heading, detail);
  element.append(canvas, banner);
  (document.fullscreenElement ?? document.body).append(element);
  const timer = window.setTimeout(clearBanner, finale ? 7400 : 4400);
  const state = active = { element, frame: 0, timer };
  if (allowSound()) void audio.play(finale);
  const context = canvas.getContext('2d');
  if (!context) return;
  const bursts = launchPoints(finale);
  const start = performance.now();
  function animate(now) {
    if (active !== state) return;
    const seconds = (now - start) / 1000;
    paintFireworks(canvas, context, bursts, seconds, finale);
    if (!reducedMotion.matches && seconds < (finale ? 4.9 : 2.6)) state.frame = requestAnimationFrame(animate);
  }
  state.frame = requestAnimationFrame(animate);
}
