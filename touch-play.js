export function offerLandscape(scene, expand) {
  const portrait = matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 600px)');
  const landscape = matchMedia('(pointer: coarse) and (orientation: landscape) and (max-height: 600px)');
  const hint = document.createElement('aside');
  hint.className = 'rotate-phone';
  hint.setAttribute('aria-label', 'Landscape play');
  hint.innerHTML = `
    <div class="rotate-phone-card">
      <span class="rotate-phone-icon" aria-hidden="true"></span>
      <h2>Turn your phone sideways</h2>
      <p>Landscape gives you more room to look and play.</p>
      <button type="button">Play in portrait</button>
    </div>`;
  scene.append(hint);
  let offered = false;
  let dismissed = false;

  function sync() {
    if (offered && !dismissed && landscape.matches) {
      dismissed = true;
      expand();
    }
    hint.hidden = dismissed || !portrait.matches;
    offered ||= !hint.hidden;
  }

  // Both queries can change separately during one rotation.
  portrait.addEventListener('change', sync);
  landscape.addEventListener('change', sync);
  hint.querySelector('button').addEventListener('click', () => {
    dismissed = true;
    sync();
  });
  sync();
}

export function mountThumbstick(parent, change) {
  const stick = document.createElement('div');
  stick.className = 'touch-stick';
  stick.setAttribute('role', 'group');
  stick.setAttribute('aria-label', 'Drag the joystick to move');
  stick.innerHTML = '<span aria-hidden="true"></span>';
  parent.prepend(stick);
  let pointer;
  let bounds;

  function position(event) {
    const radius = bounds.width * .31;
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(dx, dy);
    const scale = distance > radius ? radius / distance : 1;
    stick.style.setProperty('--stick-x', `${dx * scale}px`);
    stick.style.setProperty('--stick-y', `${dy * scale}px`);
    const strength = Math.max(0, (Math.min(1, distance / radius) - .14) / .86);
    if (distance === 0 || strength === 0) change(0, 0);
    else change(dx / distance * strength, dy / distance * strength);
  }

  function reset() {
    const id = pointer;
    pointer = undefined;
    if (id !== undefined && stick.hasPointerCapture(id)) stick.releasePointerCapture(id);
    stick.style.setProperty('--stick-x', '0px');
    stick.style.setProperty('--stick-y', '0px');
    stick.removeAttribute('data-moving');
    change(0, 0);
  }

  stick.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer !== undefined) return;
    event.preventDefault();
    pointer = event.pointerId;
    bounds = stick.getBoundingClientRect();
    stick.setPointerCapture(pointer);
    stick.setAttribute('data-moving', '');
    position(event);
  });
  stick.addEventListener('pointermove', event => {
    if (event.pointerId === pointer) position(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stick.addEventListener(type, event => {
      if (event.pointerId === pointer) reset();
    });
  }
  stick.addEventListener('contextmenu', event => event.preventDefault());
  return { reset, dispose() { reset(); stick.remove(); } };
}

// A secondary finger does not always produce a click, so gameplay uses
// pointerdown for touch and keeps the native click for mouse and keyboard.
export function bindTouchAction(button, action, { start = action, move, end } = {}) {
  let pointer;
  let lastTouch = -Infinity;
  let x;
  let y;

  function reset() {
    if (pointer === undefined) return;
    const id = pointer;
    pointer = undefined;
    if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
    end?.();
  }

  button.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || pointer !== undefined || button.disabled) return;
    event.preventDefault();
    lastTouch = event.timeStamp;
    if (move || end) {
      pointer = event.pointerId;
      button.setPointerCapture(pointer);
      x = event.clientX;
      y = event.clientY;
    }
    start();
  });
  if (move) {
    button.addEventListener('pointermove', event => {
      if (event.pointerId !== pointer) return;
      move(event.clientX - x, event.clientY - y);
      x = event.clientX;
      y = event.clientY;
    });
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, event => {
      if (event.pointerId === pointer) reset();
    });
  }
  button.addEventListener('click', event => {
    const repeatedTouch = event.pointerType === 'touch' ||
      (!event.pointerType && event.detail > 0 && event.timeStamp - lastTouch < 800);
    if (!repeatedTouch) action(event);
  });
  button.addEventListener('contextmenu', event => event.preventDefault());
  return reset;
}
