import { drawCopperDisplay } from './copper-exhibit-art.js';
import { createExhibitionHall } from './exhibition-hall.js';
import { powderApplications, powderTestingNote } from './copper-applications.js';

const demoLength = 2700;
const finaleDelay = 800;

const exhibits = [
  {
    id: 'circuit', field: 'Electronics', action: 'Light the LED', name: 'A circuit printed with ink',
    preview: 'The lamp needs a complete path for electricity. Press Light the LED to join the tiny particles in the printed ink and finish that path.',
    result: 'The line of ink now carries electricity. The battery can send it around the loop, and the lamp lights up.',
    steps: ['Print an ink line with tiny copper particles.', 'Flash a light to join the particles into a track.', 'Connect a battery so electricity can travel around the loop.'],
    use: 'A printed track can carry electricity on a thin, flexible sheet.',
  },
  {
    id: 'printer', field: '3D printing', action: 'Print a spiral', name: 'A twist made from grains',
    preview: 'A laser draws a shape in a thin layer of powder. Where it passes, the copper grains melt together. Watch the shape grow one layer at a time.',
    result: 'Two copper spirals grew side by side. The solid spirals keep their shape when the loose powder is brushed away.',
    steps: ['Spread a thin bed of loose grains.', 'Use a laser to melt only the places that are part of the shape.', 'Repeat on top of the last layer to build a solid part.'],
    use: 'Building in layers lets a printer make shapes that are hard to carve out of a block.',
  },
  {
    id: 'discs', field: 'Moving machinery', action: 'Compare the two oils', name: 'Which disc gets more scratches?',
    duration: 4600,
    preview: 'Think of two metal lids rubbing together. Both machines do the same test. The left uses plain oil. The right uses that oil with tiny copper particles mixed in.',
    running: 'Watch the top disc press against the bottom disc. After they spin, the top disc lifts so you can see the scratches below.',
    result: 'Look at the bottom discs. In this study, the oil with copper particles left less damage. The enlarged drawings show what that difference looks like.',
    steps: ['Put oil between two metal discs. Only the oil changes between tests.', 'Press the discs together and spin them for the same time.', 'Lift the top discs. Check the scratches on the bottom discs.'],
    use: 'Moving parts can get damaged when they rub. We call that damage wear. The study found less wear with copper particles in its test oil.',
  },
].map(item => ({ ...item, ...powderApplications[item.id] }));

export function mountCopperExhibit(container, { onFinish, onExit, onBack } = {}) {
  const room = document.createElement('section');
  room.className = 'cx-room';
  room.setAttribute('aria-labelledby', 'cx-title');
  room.innerHTML = `
    <header class="cx-intro">
      <div><h1 id="cx-title">Where does copper powder go?</h1>
      <p>Click or tap an exhibit to try it. The gold outline shows the suggested next action.</p></div>
      <span class="cx-progress" role="status">0 of ${exhibits.length} viewed</span>
    </header>
    <div class="cx-hall" hidden><button type="button" data-hall-vr hidden>Enter VR</button></div>
    <p class="cx-oil-status" role="status" hidden></p>
    <div class="cx-caption" aria-live="polite" aria-atomic="true">
      <span class="cx-indicator" aria-hidden="true"></span>
      <div><h2></h2><p></p></div>
    </div>
    <div class="cx-gallery"></div>
    <section class="cx-guide" aria-labelledby="cx-guide-title">
      <div>
        <h2 id="cx-guide-title"></h2>
        <ol></ol>
        <p class="cx-use"></p>
      </div>
      <div class="cx-oil-inspector" hidden>
        <div class="cx-oil-labels"><span>Plain oil</span><span>Oil + tiny copper particles</span></div>
        <canvas width="320" height="190" aria-hidden="true"></canvas>
        <div class="cx-oil-controls">
          <button type="button" data-cx-run-oil hidden>Run again</button>
          <button type="button" data-cx-oil-zoom hidden>Show test setup</button>
        </div>
      </div>
    </section>
    <div class="cx-exit">
      <button type="button" data-cx-back>← Powder lab</button>
      <button type="button" data-cx-home hidden>Return to Crazy Lab →</button>
    </div>
    <details class="cx-studies">
      <summary>About the research</summary>
      <p>${powderTestingNote}</p>
      <ul>${exhibits.map(item => `<li><strong>${item.field}.</strong> ${item.evidence} <a href="${item.source.url}" target="_blank" rel="noopener noreferrer">${item.source.title} ↗</a></li>`).join('')}</ul>
    </details>`;
  container.replaceChildren(room);
  const gallery = room.querySelector('.cx-gallery');
  const caption = room.querySelector('.cx-caption');
  const guide = room.querySelector('.cx-guide');
  const oilInspector = guide.querySelector('.cx-oil-inspector');
  const oilCanvas = oilInspector.querySelector('canvas');
  const oilStatus = room.querySelector('.cx-oil-status');
  const oilRun = oilInspector.querySelector('[data-cx-run-oil]');
  const oilZoom = oilInspector.querySelector('[data-cx-oil-zoom]');
  const home = room.querySelector('[data-cx-home]');
  const progress = room.querySelector('.cx-progress');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const completed = new Set();
  const displays = [];
  let hall;
  let activeIndex = -1;
  let frame = 0;
  let finished = false;
  let finaleTimer;

  function updateGuidance() {
    const next = finished || displays.some(display => display.started !== null)
      ? -1 : displays.findIndex((_, index) => !completed.has(index));
    displays.forEach(({ stand }, index) => stand.toggleAttribute('data-cx-next', index === next));
    hall?.guide(next);
  }

  function finishTour() {
    finished = true;
    room.dataset.complete = 'true';
    progress.textContent = 'Discover Copper complete';
    home.hidden = !onExit;
    updateGuidance();
    onFinish?.();
  }

  function recordView(index, stand) {
    if (completed.has(index)) return;
    completed.add(index);
    stand.classList.add('cx-tried');
    stand.querySelector('.cx-action-mark').textContent = '✓';
    progress.textContent = `${completed.size} of ${exhibits.length} viewed`;
    if (completed.size === exhibits.length) finaleTimer = window.setTimeout(finishTour, finaleDelay);
  }

  function show(index) {
    const switched = activeIndex !== index;
    activeIndex = index;
    const item = exhibits[index];
    const display = displays[index];
    const running = display.started !== null;
    room.dataset.exhibit = item.id;
    room.dataset.tried = String(completed.has(index));
    oilStatus.hidden = item.id !== 'discs' || !display.tried;
    caption.querySelector('h2').textContent = item.name;
    caption.querySelector('p').textContent = running ? item.running ?? item.preview : completed.has(index) ? item.result : item.preview;
    if (switched) {
      guide.querySelector('h2').textContent = item.name;
      guide.querySelector('ol').replaceChildren(...item.steps.map(text => {
        const line = document.createElement('li');
        line.textContent = text;
        return line;
      }));
      guide.querySelector('.cx-use').textContent = item.use;
      oilInspector.hidden = item.id !== 'discs';
      guide.classList.toggle('cx-guide-with-rigs', !oilInspector.hidden);
    }
    for (const [i, display] of displays.entries()) {
      display.stand.classList.toggle('cx-current', i === index);
    }
    updateGuidance();
    queuePaint();
  }

  function paintOil(display, fraction) {
    const running = display.started !== null;
    const ready = display.tried && !running;
    const mode = ready && display.closeUp ? 'wear' : 'test';
    const status = running ? (fraction < .22 ? '1 of 3 · Oil goes between the discs.'
      : fraction < .78 ? '2 of 3 · The top discs press down and the discs spin.' : '3 of 3 · The top discs lift.')
      : ready ? 'Compare the bottom discs. Left: more scratches. Right: fewer scratches in this study.' : '';
    if (oilStatus.textContent !== status) oilStatus.textContent = status;
    oilRun.hidden = !ready;
    oilZoom.hidden = !ready;
    oilZoom.textContent = display.closeUp ? 'Show test setup' : 'Show magnified scratches';
    drawCopperDisplay(oilCanvas, 'discs', fraction, mode, false);
  }

  function paint(now) {
    frame = 0;
    let moving = false;
    let completedDemo = false;
    for (const [index, display] of displays.entries()) {
      let fraction = display.tried ? 1 : 0;
      if (display.started !== null) {
        fraction = reducedMotion.matches ? 1 : Math.min(1, Math.max(0, (now - display.started) / display.duration));
        if (fraction >= 1) {
          display.started = null;
          display.closeUp = true;
          recordView(index, display.stand);
          completedDemo = true;
          if (activeIndex === index) show(index);
        }
        else moving = true;
      }
      drawCopperDisplay(display.canvas, display.item.id, fraction);
      if (display.comparisonLink) display.comparisonLink.hidden = display.started !== null || !completed.has(index);
      if (index === activeIndex && display.item.id === 'discs') paintOil(display, fraction);
    }
    if (completedDemo) updateGuidance();
    if (moving) queuePaint();
  }

  function queuePaint() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  for (const [index, item] of exhibits.entries()) {
    const stand = document.createElement('article');
    stand.className = 'cx-stand';
    stand.innerHTML = `
      <button type="button" class="cx-object" data-cx="${item.id}" aria-label="${item.action}. ${item.name}">
        <span class="cx-field">${item.field}</span>
        <canvas width="320" height="190" aria-hidden="true"></canvas>
        <span class="cx-action">${item.action}<span class="cx-action-mark" aria-hidden="true">↗</span></span>
      </button>
      ${item.id === 'discs' ? '<a class="cx-source cx-comparison-link" href="#cx-guide-title" hidden>See enlarged scratches ↓</a>' : ''}
      <a class="cx-source" href="${item.source.url}" target="_blank" rel="noopener noreferrer" aria-label="Read the original ${item.field.toLowerCase()} study in a new tab">Read study ↗</a>`;
    gallery.append(stand);
    const object = stand.querySelector('button');
    const comparisonLink = stand.querySelector('.cx-comparison-link');
    const display = { stand, item, duration: item.duration ?? demoLength, canvas: stand.querySelector('canvas'),
      comparisonLink, tried: false, started: null, closeUp: false };
    displays.push(display);
    const preview = () => { if (activeIndex !== index) show(index); };
    stand.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') preview(); });
    stand.addEventListener('focusin', preview);
    comparisonLink?.addEventListener('click', () => { display.closeUp = true; show(index); });
    object.addEventListener('click', () => {
      if (display.started !== null) { show(index); return; }
      display.started = performance.now();
      hall?.run(index, display.started, display.duration);
      display.tried = true;
      display.closeUp = false;
      show(index);
    });
  }
  const oilDisplay = displays.find(display => display.item.id === 'discs');
  oilRun.addEventListener('click', () => oilDisplay.stand.querySelector('button').click());
  oilZoom.addEventListener('click', () => {
    oilDisplay.closeUp = !oilDisplay.closeUp;
    queuePaint();
  });
  room.querySelector('[data-cx-back]').addEventListener('click', () => onBack?.());
  home.addEventListener('click', () => onExit?.());
  const space = room.querySelector('.cx-hall');
  try {
    space.hidden = false;
    hall = createExhibitionHall(space, exhibits, show, i => displays[i].stand.querySelector('button').click());
    room.classList.add('cx-spatial');
    room.querySelector('.cx-intro p').textContent = matchMedia('(pointer: coarse)').matches
      ? 'Drag to look around. Use the joystick to walk and tap a machine to run it.'
      : 'Click a machine to run it from where you stand. Drag to look around. Use WASD or the arrow keys to walk.';
  } catch (error) {
    space.hidden = true;
    console.warn('Using illustrated exhibition', error);
  }
  show(0);
  const observer = new ResizeObserver(queuePaint);
  observer.observe(gallery);
  observer.observe(oilInspector);
  queuePaint();
  return () => {
    hall?.dispose();
    observer.disconnect();
    cancelAnimationFrame(frame);
    window.clearTimeout(finaleTimer);
    room.remove();
  };
}
