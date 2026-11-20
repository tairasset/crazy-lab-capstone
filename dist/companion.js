import { setupEnglishGuide } from './chat.js';
import { quarryNotes } from './quarry-notes.js';
const labNotes = {
  idle: 'Two copper plates are taking a salty bath. The salt helps the water carry charge between them.',
  electrolysis: 'Two things are happening at once. One plate supplies copper. The other makes bubbles of hydrogen gas.',
  observe: 'Bubbles float up. Little grains sink. Those grains hold copper joined to oxygen.',
  route: 'The gas has its own road. The tube takes it to the hot chamber while the grains stay behind.',
  'gas-flow': 'Those travelling dots stand for hydrogen. We will need that gas again to free the copper.',
  filter: 'The grains and the water are all mixed up. The filter has tiny paths for the water to escape.',
  filtering: 'Look above the cup! The water gets through, and the filter keeps the grains we need.',
  'prep-dry': 'The grains are wet and salty. Washing carries away leftover salt.',
  drying: 'First a rinse, then a dry. The grains still hold copper and oxygen together.',
  ready: 'Both paths end here. The hot chamber brings the dry grains and the hydrogen together.',
  reduction: 'Hydrogen takes oxygen from the grains. Together they make water. Tiny bits of copper metal stay behind.',
  product: 'That little pile is metal! The real grains are much smaller than the ones you can see here.',
  won: 'You followed copper from a solid plate to a pile of tiny metal grains. Same element, new form!',
};
const palaceNotes = {
  bubbles: ['Still water makes a good detective scene. Look for what changes when the power comes on.', 'Pop! The bubbles mark the plate where hydrogen gas is forming.'],
  filter: ['Imagine trying to keep crumbs while pouring out water. That is the filter’s job.', 'The orange grains stay above the cup. Water fits through the tiny openings.'],
  charge: ['A plus and a minus balance each other. The blue dot is an electron. It carries one minus.', 'One minus left. There is now one extra plus. A tiny building block with charge is called an ion.'],
};
const simpleLabNotes = {
  idle: 'The two plates are in salty water. Salt helps water carry electric charge.',
  electrolysis: 'A gas is something like air. The gas in these bubbles is called hydrogen.',
  observe: 'Copper and oxygen have joined to make the tiny grains you see.',
  route: 'The gas leaves the tank first. The grains take a different path.',
  'gas-flow': 'Look at the bottom of the tank. The grains are still there.',
  filter: 'Think of pasta in a strainer. Water runs through while the pasta stays.',
  filtering: 'Keep those grains. They hold the copper you need.',
  'prep-dry': 'Imagine rinsing salt off a spoon and then drying it.',
  drying: 'Drying takes away water and leaves the grains behind.',
  ready: 'Both paths lead here. The gas and grains meet in the chamber.',
  reduction: 'Look at the tray. The tiny copper bits are what we keep.',
  product: 'We drew the grains much bigger so you could see them.',
  won: 'A plate at the start. A pile of tiny copper bits at the end!',
};
const simplePalaceWrapUp = {
  bubbles: 'In the powder lab, a tube carries this gas to another machine.',
  charge: 'In the tank, copper from the plus plate helps form the grains you collect.',
  filter: 'These grains still hold oxygen. In the hot chamber, hydrogen helps take that oxygen away.',
};

const typingInterval = 34;
const minimumReadingTime = 8000;
const readingTimePerWord = 430;

function createCommentBubble(scene, controls, status) {
  const bubble = document.createElement('div');
  bubble.className = 'pip-bubble';
  bubble.setAttribute('aria-hidden', 'true');
  bubble.hidden = true;
  bubble.innerHTML = '<div class="pip-balloon"><strong>Pip</strong><p class="pip-bubble-text"></p></div><div class="pip-portrait"><i></i><b></b></div>';
  scene.classList.add('pip-scene');
  scene.append(bubble);
  if (controls) {
    const shortScreen = window.matchMedia('(max-height: 500px) and (orientation: landscape)');
    const quarryControls = [...controls.querySelectorAll('.quarry-resources, .quarry-view-tools, .quarry-view-objective')];
    const moveBelowControls = () => {
      const shortFullscreen = shortScreen.matches &&
        (document.fullscreenElement === scene || scene.classList.contains('quarry-expanded'));
      const rows = shortFullscreen && quarryControls.length ? quarryControls : [controls];
      const bottom = Math.max(...rows.map(row => row.getBoundingClientRect().bottom)) - scene.getBoundingClientRect().top;
      bubble.style.setProperty('--pip-top', `${Math.max(12, Math.ceil(bottom + 10))}px`);
    };
    const observer = new ResizeObserver(moveBelowControls);
    observer.observe(controls);
    observer.observe(scene);
    for (const row of quarryControls) observer.observe(row);
    if (quarryControls.length) document.addEventListener('fullscreenchange', moveBelowControls);
    moveBelowControls();
  }

  const message = bubble.querySelector('.pip-bubble-text');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active;
  let pending;
  let frame;
  let timer;

  function show(comment) {
    active = comment;
    bubble.hidden = false;
    status.textContent = comment;
    const characters = Array.from(comment);
    const start = performance.now();
    function type(time) {
      const count = reducedMotion.matches ? characters.length : Math.floor((time - start) / typingInterval) + 1;
      message.textContent = characters.slice(0, count).join('');
      if (count < characters.length) {
        frame = requestAnimationFrame(type);
        return;
      }
      const readingTime = Math.max(minimumReadingTime, comment.split(/\s+/u).length * readingTimePerWord);
      timer = setTimeout(() => {
        const next = pending;
        pending = undefined;
        active = undefined;
        if (next) show(next);
        else bubble.hidden = true;
      }, readingTime);
    }
    type(start);
  }

  return (comment, interrupt = false) => {
    if (!comment) {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      active = pending = undefined;
      status.textContent = '';
      bubble.hidden = true;
      return;
    }
    if (interrupt) {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      pending = undefined;
    } else if (active) {
      pending = comment === active ? undefined : comment;
      return;
    }
    show(comment);
  };
}

export function setupCompanion(place) {
  const byId = id => document.getElementById(id);
  const host = place === 'quarry' ? byId('quarry-field') : place === 'lab' ? byId('learning-panel') :
    place === 'palace' ? byId('palace-panel') : document.querySelector('.cx-caption');
  const watched = place === 'quarry' ? byId('quarry-game') : place === 'exhibit' ? document.querySelector('.cx-room') : host;
  const scene = place === 'quarry' ? byId('quarry-view') : place === 'exhibit'
    ? watched.querySelector('.cx-hall:not([hidden])') ?? watched.querySelector('.cx-gallery')
    : byId('game-scene');
  const controls = place === 'quarry' ? scene.querySelector('.quarry-top') : place === 'exhibit' ? null : byId('center');
  const inlineLab = place === 'lab' && host.dataset.pacing === 'manual';
  const card = document.createElement('section');
  card.className='copper-companion';
  card.setAttribute('aria-label','Pip, your copper guide');
  card.innerHTML='<div class="pip-copy"><p class="pip-status visually-hidden" role="status" aria-atomic="true"></p><button class="pip-ask" type="button"><b aria-hidden="true">?</b> Ask a question</button><details><summary>Past comments</summary><ul></ul></details></div>';
  if(inlineLab) byId('learning-action').parentElement.before(card);
  else if(place==='lab') byId('learning-action').parentElement.after(card);
  else if(place==='palace') (host.querySelector('.science-next') ?? byId('palace-actions')).after(card);
  else if(place==='quarry') host.append(card);
  else host.after(card); // Field notes also move into the fullscreen view.
  let phase, last='';
  const list = card.querySelector('ul');
  const status = card.querySelector('.pip-status');
  if (inlineLab) {
    const speaker = document.createElement('strong');
    speaker.className = 'pip-speaker';
    speaker.textContent = 'Pip';
    status.before(speaker);
    status.classList.replace('visually-hidden', 'pip-inline-note');
  }
  const showComment = inlineLab ? comment => { status.textContent = comment; } : createCommentBubble(scene, controls, status);
  const historyKey='crazy-lab-pip-comments-v1';
  let history=[];
  try {const saved=JSON.parse(sessionStorage.getItem(historyKey));if(Array.isArray(saved))history=saved.filter(s=>typeof s==='string').slice(-30);} catch {}
  function read(){
    if(place==='quarry'){
      phase=watched.dataset.stage||'mine';
      return quarryNotes[watched.dataset.quarryNote]?.comment ?? '';
    }
    if(place==='lab'){
      phase=host.dataset.phase||'idle';
      const notes=host.dataset.science==='true'?simpleLabNotes:labNotes;
      return notes[phase]||notes.idle;
    }
    if(place==='palace'){
      const lesson=host.dataset.lesson || 'bubbles';phase={charge:'palaceCharge',bubbles:'palaceBubbles',filter:'palaceFilter'}[lesson];
      if(host.dataset.science==='true') return host.dataset.stage==='done'?simplePalaceWrapUp[lesson]:'';
      return palaceNotes[lesson][host.dataset.stage==='done'?1:0];
    }
    phase=watched.dataset.exhibit||'circuit';
    return document.querySelector('.cx-caption p').textContent;
  }
  function render(){
    const comment=read();if(comment===last)return;
    last = comment;
    const enteringStation = place === 'quarry' && ['concentrate', 'smelt', 'refine'].includes(watched.dataset.quarryNote);
    showComment(comment, enteringStation);
    if (!comment) return;
    history=history.filter(s=>s!==comment).concat(comment).slice(-30);
    try{sessionStorage.setItem(historyKey,JSON.stringify(history));}catch{}
    list.replaceChildren(...history.slice().reverse().map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));
  }
  new MutationObserver(render).observe(watched,{attributes:true,attributeFilter:['data-phase','data-stage','data-lesson','data-quarry-note','data-exhibit','data-tried']});
  render();
  const open = byId('guide-open');
  open.textContent = '? Ask a question';
  setupEnglishGuide(()=>({mission:'learning',phase}),{title:'Ask Pip',lead:'Ask about what you just saw, or explore another part of the copper journey.',prompts:place === 'quarry'
    ? ['What is copper ore?', 'Why is copper used for wiring?', 'Why do copper roofs turn green?']
    : ['What is happening?','What do I do next?','What is copper powder used for?']});
  card.querySelector('.pip-ask').onclick=()=>open.click();
}
