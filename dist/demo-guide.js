export function setupDemoGuide() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions || document.getElementById('demo-guide')) return;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'demo-guide-trigger';
  trigger.dataset.openDemoGuide = '';
  trigger.textContent = '5-min demo';
  headerActions.append(trigger);

  const guide = document.createElement('dialog');
  guide.id = 'demo-guide';
  guide.setAttribute('aria-labelledby', 'demo-guide-title');
  guide.innerHTML = `
    <header class="demo-guide-header">
      <h2 id="demo-guide-title">5-minute demo</h2>
      <form method="dialog"><button type="submit" autofocus>Close</button></form>
    </header>
    <ol class="demo-guide-steps">
      <li>
        <span class="demo-guide-time">0:00–0:45</span>
        <div><a href="?mission=crazy&amp;mode=quarry&amp;journey=discover">Mine the ore</a>
        <p>Strike the flecked rock twice. Use the concentrator, furnace and refinery. Once the copper is ready, choose <strong>Enter the powder lab</strong>.</p></div>
      </li>
      <li>
        <span class="demo-guide-time">0:45–1:45</span>
        <div><a href="?mission=crazy&amp;mode=learning&amp;journey=discover">Make the powder</a>
        <p>Switch on the tank, catch the grains and run the reactor. Follow the powder to the exhibition.</p></div>
      </li>
      <li>
        <span class="demo-guide-time">1:45–3:30</span>
        <div><a href="?journey=discover&amp;stage=uses">Explore its uses</a>
        <p>Light up a printed circuit, build a copper shape and compare two metal surfaces.</p></div>
      </li>
      <li>
        <span class="demo-guide-time">3:30–4:30</span>
        <div><a href="?mission=crazy&amp;mode=palace&amp;journey=science">Chemistry Made Simple</a>
        <p>Switch on the tank. Look at its two plates and tap the one that makes bubbles. In <a href="?mission=crazy&amp;mode=learning&amp;journey=science">Inside the lab</a>, follow that gas through the pipe.</p></div>
      </li>
      <li>
        <span class="demo-guide-time">4:30–5:00</span>
        <div><a href="?mission=crazy">Fun Mode</a>
        <p>Press <kbd>R</kbd> to sound the alarm. Try a training orb against the security robots.</p></div>
      </li>
    </ol>`;
  document.body.append(guide);

  for (const button of document.querySelectorAll('[data-open-demo-guide]')) {
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', guide.id);
    button.addEventListener('click', () => {
      if (document.pointerLockElement) document.exitPointerLock();
      if (!guide.open) guide.showModal();
    });
  }
  guide.addEventListener('keydown', event => event.stopPropagation());
}
