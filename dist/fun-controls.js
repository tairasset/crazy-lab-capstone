import { getPalacePoints, PALACE_REWARDS } from './fun-rewards.js';
import { clearVictory, showVictory } from './victory.js';

const baseWeapons = ['training', 'scatter', 'copper', 'cryo', 'blaster', 'arc'];
const weaponTypes = [...baseWeapons, 'sidearm', 'carbine', 'shotgun', ...PALACE_REWARDS.map(({ id }) => id)];
const weaponTips = {
  training: 'A simple energy burst.',
  scatter: 'A tight burst of light shards. Aim for a group.',
  copper: 'A wide copper-colored pulse that staggers guards.',
  cryo: 'An icy burst that stops guards for longer.',
  blaster: 'A fast yellow energy bolt for one target.',
  arc: 'A teal arc that can jump to a nearby guard.',
  sidearm: 'Pistol · One shot at a time.',
  carbine: 'Carbine · Hold X to fire repeatedly.',
  shotgun: 'Shotgun · A wide arcade spread.',
  'scatter-plus': 'Palace upgrade · A larger and stronger scatter burst.',
  'copper-plus': 'Palace upgrade · A wider copper wave that stuns longer.',
  'cryo-plus': 'Palace upgrade · A bigger freeze with a longer stun.',
};
const find = (id) => document.getElementById(id);

export function setupFunCombat(world, replay, silenceSiren) {
  const hud = find('fun-combat');
  const game = find('game-scene');
  const top = find('fun-combat-top');
  const result = find('fun-combat-result');
  const throwButton = find('fun-throw');
  const pauseButton = find('fun-pause');
  const menuButton = find('fun-menu');
  const fullscreen = find('fun-fullscreen');
  const mouseLock = find('fun-look-lock');
  const viewport = find('viewport');
  const finePointer = matchMedia('(any-pointer: fine)');
  const pauseMenu = find('fun-pause-menu');
  const sensitivity = find('fun-camera-sensitivity');
  const sensitivityValue = find('fun-camera-value');
  const resume = find('fun-resume');
  const touchToggle = find('fun-toggle-touch');
  const input = find('fun-combat-input');
  const hotbar = find('fun-hotbar');
  const keyStatus = find('fun-key-status');
  const propStatus = find('fun-prop-status');
  const propButtons = Object.fromEntries(['grab', 'place', 'toss', 'drop', 'hammer', 'melee', 'gel'].map(action => [action, find(`fun-${action}`)]));
  const tip = find('fun-loadout-tip');
  const buttons = new Map(weaponTypes.map((type) => [type, find(`fun-${type}`)]));
  let points = getPalacePoints();
  let selected = PALACE_REWARDS.findLast(({ lesson }) => points.has(lesson))?.id ?? 'training';
  let shieldTimer;
  let last;
  let paused = false;
  let menuOpen = false;
  let statusTimer;
  let requestedMouseLock = false;
  let restoreMouseLock = false;

  function applySensitivity() {
    const value = sensitivity.valueAsNumber;
    sensitivityValue.value = `${value}%`;
    sensitivity.setAttribute('aria-valuetext', `${value}%`);
    world?.setFunLookSensitivity(value / 100);
  }
  try { sensitivity.value = localStorage.getItem('crazy-lab-camera-sensitivity') ?? '100'; }
  catch {}
  applySensitivity();
  sensitivity.addEventListener('input', () => {
    applySensitivity();
    try { localStorage.setItem('crazy-lab-camera-sensitivity', sensitivity.value); }
    catch {}
  });

  function message(text) {
    keyStatus.textContent = text;
    keyStatus.hidden = false;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { keyStatus.hidden = true; }, 2400);
  }

  function updateLoadout() {
    points = getPalacePoints();
    for (const { lesson, id } of PALACE_REWARDS) buttons.get(id).hidden = !points.has(lesson);
    find('fun-upgrades').hidden = !points.size;
    if (buttons.get(selected).hidden) select('training');
    find('fun-rewards-link').textContent = `Knowledge Palace · ${points.size} / ${PALACE_REWARDS.length} upgrades unlocked ↗`;
  }

  function select(type) {
    if (!buttons.has(type)) return;
    const reward = PALACE_REWARDS.find(({ id }) => id === type);
    if (reward && !points.has(reward.lesson)) {
      tip.textContent = `Complete “${reward.title}” in the Knowledge Palace to unlock ${reward.name}.`;
      return;
    }
    selected = type;
    world?.setFunOrb(type);
    hud.dataset.orb = type;
    for (const [id, button] of buttons) button.setAttribute('aria-pressed', String(id === type));
    tip.textContent = weaponTips[type];
    updateHotbar();
  }

  const hotbarButtons = Array.from({ length: 9 }, (_, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    const key = document.createElement('kbd');
    key.textContent = i + 1;
    const label = document.createElement('span');
    button.append(key, label);
    button.addEventListener('click', () => chooseSlot(i));
    hotbar.append(button);
    return { button, label };
  });
  const shortNames = ['Orb', 'Scatter', 'Copper', 'Freeze', 'Blaster', 'Arc'];

  function updateHotbar() {
    const inv = world?.getFunInventory();
    for (const [i, { button, label }] of hotbarButtons.entries()) {
      const weapon = baseWeapons[i];
      const item = inv?.items[i - 6];
      const chosen = weapon ? selected === weapon || selected === weapon + '-plus' : inv?.active === i - 6;
      label.textContent = weapon ? (selected === weapon + '-plus' ? shortNames[i] + '+' : shortNames[i]) : item ?? '—';
      button.title = weapon ? buttons.get(weapon).textContent : item ?? 'Empty slot';
      button.setAttribute('aria-label', `Slot ${i + 1}: ${button.title}`);
      button.setAttribute('aria-pressed', String(Boolean(chosen)));
    }
  }

  function chooseSlot(i) {
    if (i < 6) {
      world?.equipFunInventory(-1);
      select(baseWeapons[i]);
    } else {
      const item = world?.getFunInventory()?.items[i - 6];
      world?.equipFunInventory(i - 6);
      if (item) message(`${item} in left hand.`);
    }
    updateFurnitureControls();
    if (!menuOpen && !paused) focusCanvas();
  }

  function browseSlots(step) {
    const inv = world?.getFunInventory();
    const slots = [...baseWeapons.keys(), ...((inv?.items ?? []).flatMap((item, i) => item ? [i + 6] : []))];
    const active = inv?.active >= 0 ? inv.active + 6 : Math.max(0, baseWeapons.indexOf(selected.replace(/-plus$/, '')));
    chooseSlot(slots[(slots.indexOf(active) + step + slots.length) % slots.length]);
  }

  function cycleWeapon() {
    const available = weaponTypes.filter(id => !buttons.get(id).hidden);
    select(available[(available.indexOf(selected) + 1) % available.length]);
  }

  function focusCanvas() {
    const canvas = find('viewport').querySelector('canvas');
    if (!canvas) return;
    canvas.tabIndex = -1;
    canvas.focus({ preventScroll: true });
  }

  function render() {
    const state = world?.getFunEncounterState() ?? { status: 'idle', wave: 0, shield: 100 };
    const idle = state.status === 'idle';
    const active = state.status === 'active';
    const statusChanged = state.status !== last?.status;
    const waveChanged = state.wave !== last?.wave;
    const shield = Math.ceil(state.shield);
    if (!idle && waveChanged) find('fun-wave').textContent = `Wave ${state.wave} / ${state.waves}`;
    if (!idle && state.remaining !== last?.remaining) {
      find('fun-remaining').textContent = `${state.remaining} ${state.remaining === 1 ? 'guard' : 'guards'}`;
    }
    if (state.defeated !== last?.defeated) find('fun-goal').textContent = `${state.defeated} / ${state.total} disabled`;
    if (shield !== Math.ceil(last?.shield)) {
      find('fun-shield').value = shield;
      find('fun-shield-value').textContent = `${shield}%`;
      if (shield < last?.shield) {
        game.classList.add('fun-shield-hit');
        window.clearTimeout(shieldTimer);
        shieldTimer = window.setTimeout(() => game.classList.remove('fun-shield-hit'), 240);
      }
    }
    if (paused !== last?.paused) {
      throwButton.setAttribute('aria-disabled', String(paused || !world));
      throwButton.textContent = paused ? 'Paused' : 'Fire · ∞';
    }
    if (statusChanged) {
      hud.dataset.status = state.status;
      top.hidden = idle;
      result.hidden = active || idle;
      if (!result.hidden) {
        const title = state.status === 'won' ? 'All waves cleared!' : 'Shield down';
        find('fun-result-title').textContent = title;
        const detail = find('fun-result-detail');
        detail.hidden = state.status !== 'won';
        detail.textContent = `${state.total} robots disabled`;
        if (state.status === 'won') showVictory('fun');
        find('fun-combat-message').textContent = title;
        suspendLook();
        syncInput();
        if (!menuOpen) find('fun-replay').focus({ preventScroll: true });
      } else {
        syncInput();
      }
    }
    if (active && waveChanged) find('fun-combat-message').textContent = `Wave ${state.wave} of ${state.waves}.`;
    last = { ...state, paused };
  }

  function togglePause() {
    paused = !paused;
    world?.setFunGuardsPaused(paused);
    game.dataset.guardsPaused = String(paused);
    setMenu(paused);
    render();
  }

  function setMenu(open) {
    menuOpen = open;
    syncInput();
    pauseMenu.hidden = !open;
    find('fun-pause-title').textContent = paused ? 'Paused' : 'Menu';
    menuButton.setAttribute('aria-expanded', String(open));
    pauseButton.setAttribute('aria-expanded', String(paused));
    pauseButton.textContent = paused ? 'Resume · P' : 'Pause · P';
    resume.textContent = paused ? 'Resume' : 'Back to game';
    if (open) {
      suspendLook();
      resume.focus({ preventScroll: true });
    } else if (result.hidden) returnToArena();
    else find('fun-replay').focus({ preventScroll: true });
  }

  function updateFurnitureControls() {
    const held = world?.getFunFurniture();
    const canSwing = held === 'Hammer' || held === 'Copper plate' || held === 'Crowbar';
    propButtons.grab.disabled = !world || world.getFunInventory()?.items.every(Boolean);
    propButtons.place.disabled = propButtons.toss.disabled = propButtons.drop.disabled = !held;
    propButtons.hammer.disabled = !world || Boolean(held && !canSwing);
    propButtons.hammer.textContent = canSwing ? 'Swing' : 'Hammer';
    propButtons.hammer.title = canSwing ? 'Swing the held item (B)' : 'Pick up the hammer (B)';
    propButtons.melee.disabled = !world;
    propButtons.gel.disabled = !world;
    updateHotbar();
  }

  function furniture(action, index) {
    if (!world || paused) return;
    const result = world.useFunFurniture(action, index);
    let text = result;
    if (result === 'Copper plate in left hand.') text += ' B to swing or G to throw.';
    if (result === 'Box in left hand.') text += ' Green ring: place. Aim into open space: throw.';
    propStatus.textContent = text;
    message(propStatus.textContent);
    updateFurnitureControls();
  }

  function reset() {
    const replaying = !result.hidden;
    clearVictory();
    window.clearTimeout(shieldTimer);
    game.classList.remove('fun-shield-hit');
    last = undefined;
    world?.resetFunEncounter();
    updateFurnitureControls();
    render();
    if (replaying) returnToArena();
  }

  function start() {
    if (!world?.startFunEncounter()) return false;
    updateLoadout();
    select(selected);
    render();
    if (!paused) focusCanvas();
    return true;
  }

  for (const [type, button] of buttons) button.addEventListener('click', (event) => {
    select(type);
    if (event.detail > 0 && !menuOpen && result.hidden) focusCanvas();
  });
  function arenaButton(button, run) {
    button.addEventListener('click', (event) => {
      if (paused || menuOpen || !result.hidden) return;
      run();
      if (event.detail > 0) focusCanvas();
    });
  }
  arenaButton(throwButton, () => world?.throwFunOrb());
  function enlarged() {
    return document.fullscreenElement === game || game.classList.contains('fun-viewport-fullscreen');
  }

  function syncInput() {
    const cursorMode = menuOpen || !result.hidden;
    world?.setFunMenuOpen(cursorMode);
    game.classList.toggle('fun-menu-open', cursorMode);
    syncLook();
  }

  function syncFullscreen() {
    fullscreen.textContent = enlarged() ? 'Exit fullscreen' : 'Fullscreen';
    document.body.classList.toggle('fun-viewport-open', game.classList.contains('fun-viewport-fullscreen'));
    if (!enlarged()) {
      restoreMouseLock = false;
      world?.unlockFunLook();
    }
    syncLook();
  }

  function syncLook() {
    const locked = viewport.contains(document.pointerLockElement);
    const playing = !paused && !menuOpen && result.hidden;
    game.classList.toggle('fun-mouse-locked', locked && playing);
    mouseLock.hidden = !world || !playing || !finePointer.matches || !Element.prototype.requestPointerLock;
    mouseLock.textContent = locked ? 'Release mouse' : 'Capture mouse';
    mouseLock.setAttribute('aria-pressed', String(locked));
  }

  function reportMouseLockError() {
    if (!requestedMouseLock) return;
    requestedMouseLock = false;
    message('Drag in the room to look.');
  }

  function captureLook() {
    if (!world || paused || menuOpen || !result.hidden || requestedMouseLock ||
        document.querySelector('dialog[open]') || document.pointerLockElement ||
        !finePointer.matches || !Element.prototype.requestPointerLock) return;
    requestedMouseLock = true;
    try { Promise.resolve(world.lockFunLook()).catch(reportMouseLockError); }
    catch { reportMouseLockError(); }
  }

  function suspendLook() {
    if (!viewport.contains(document.pointerLockElement)) return;
    restoreMouseLock = true;
    world?.unlockFunLook();
  }

  function returnToArena() {
    if (paused || menuOpen || !result.hidden) return;
    focusCanvas();
    if (!restoreMouseLock) return;
    restoreMouseLock = false;
    captureLook();
  }

  mouseLock.addEventListener('click', () => {
    restoreMouseLock = false;
    if (viewport.contains(document.pointerLockElement)) world?.unlockFunLook();
    else captureLook();
    focusCanvas();
  });
  fullscreen.addEventListener('click', async () => {
    if (game.classList.contains('fun-viewport-fullscreen')) {
      game.classList.remove('fun-viewport-fullscreen');
    } else if (document.fullscreenElement === game) {
      await document.exitFullscreen();
    } else {
      captureLook();
      try { await game.requestFullscreen(); }
      catch { game.classList.add('fun-viewport-fullscreen'); }
    }
    syncFullscreen();
    if (!paused && !menuOpen) focusCanvas();
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('pointerlockchange', () => {
    requestedMouseLock = false;
    if (paused || menuOpen || !result.hidden) suspendLook();
    else if (document.querySelector('dialog[open]')) world?.unlockFunLook();
    syncLook();
  });
  document.addEventListener('pointerlockerror', reportMouseLockError);
  finePointer.addEventListener('change', syncLook);
  pauseButton.addEventListener('click', togglePause);
  menuButton.addEventListener('click', () => { if (!paused) setMenu(!menuOpen); });
  resume.addEventListener('click', () => { if (paused) togglePause(); else setMenu(false); });
  hotbar.addEventListener('wheel', event => {
    if (!event.deltaY) return;
    event.preventDefault();
    browseSlots(Math.sign(event.deltaY));
  }, { passive: false });
  touchToggle.addEventListener('click', () => {
    input.hidden = !input.hidden;
    touchToggle.setAttribute('aria-expanded', String(!input.hidden));
    touchToggle.textContent = input.hidden ? 'Show on-screen controls' : 'Hide on-screen controls';
  });
  for (const [action, button] of Object.entries(propButtons)) arenaButton(button, () => furniture(action));
  arenaButton(find('fun-jump'), () => world?.jumpFun());
  find('fun-jump').disabled = !world;
  find('fun-replay').addEventListener('click', () => replay());
  window.addEventListener('keydown', (event) => {
    if ((event.repeat && event.code !== 'KeyX') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && event.target.closest('dialog[open], input, textarea, select, [contenteditable]') &&
      !(event.target === sensitivity && ['KeyN', 'KeyP', 'Escape'].includes(event.code))) return;
    if (event.code === 'KeyM') { silenceSiren(); return; }
    if (event.code === 'KeyP') { togglePause(); return; }
    if (event.code === 'KeyN') { if (!paused) setMenu(!menuOpen); return; }
    if (event.code === 'Escape') {
      restoreMouseLock = false;
      if (paused) togglePause();
      else if (menuOpen) setMenu(false);
      else if (game.classList.contains('fun-viewport-fullscreen')) {
        game.classList.remove('fun-viewport-fullscreen');
        syncFullscreen();
      }
      return;
    }
    const slot = Number(event.key) - 1;
    if (Number.isInteger(slot) && slot >= 0 && slot < 9) { chooseSlot(slot); return; }
    if (menuOpen && ['ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
      browseSlots(event.code === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (paused || menuOpen) return;
    if (event.code === 'KeyQ') cycleWeapon();
    else if (event.code === 'KeyR') replay();
    else if (event.code === 'KeyE') furniture('grab');
    else if (event.code === 'KeyF') furniture('place');
    else if (event.code === 'KeyG') furniture('toss');
    else if (event.code === 'KeyZ') furniture('drop');
    else if (event.code === 'KeyB') furniture('hammer');
    else if (event.code === 'KeyV') furniture('melee');
    else if (event.code === 'KeyH') furniture('gel');
    else if (event.code === 'KeyX') {
      if (selected === 'carbine') { if (!event.repeat) world?.holdFunTrigger(true); }
      else world?.throwFunOrb();
    }
    else if (event.code === 'Space' && !event.target.closest?.('a, button, summary')) {
      event.preventDefault();
      world?.jumpFun();
    }
  });
  window.addEventListener('keyup', event => { if (event.code === 'KeyX') world?.holdFunTrigger(false); });
  for (const button of find('fun-movement').querySelectorAll('[data-move]')) {
    const move = button.dataset.move;
    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || paused || menuOpen || !result.hidden) return;
      button.setPointerCapture(event.pointerId);
      world?.holdFunMove(move, true);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(event, () => world?.holdFunMove(move, false));
    }
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  }
  window.addEventListener('pageshow', updateLoadout);
  window.addEventListener('storage', updateLoadout);
  updateLoadout();
  select(selected);
  updateFurnitureControls();
  hud.hidden = false;
  render();
  if (world) window.setInterval(render, 90);
  return { start, reset, select, furniture, status: () => hud.dataset.status };
}
