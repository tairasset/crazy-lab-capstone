export function setupPresentation() {
  const home = document.getElementById('explore-home');
  const dialog = document.getElementById('pitch-dialog');
  const stage = document.getElementById('pitch-stage');
  const launch = document.getElementById('pitch-start');
  const previous = document.getElementById('pitch-prev');
  const next = document.getElementById('pitch-next');
  const chapters = [...home.querySelectorAll(':scope > [data-chapter]')];
  // Prepare every slide for the projector and full-page captures on the homepage.
  // The gameplay routes share this HTML and keep the offscreen images lazy.
  home.querySelectorAll('img[loading="lazy"]').forEach(image => {
    image.decoding = 'sync';
    image.loading = 'eager';
  });
  const marker = document.createComment('Crazy Lab homepage');
  home.before(marker);
  let index = 0;
  let originalScroll = 0;

  function show(chapter) {
    index = chapter;
    const address = new URL(location.href);
    address.searchParams.set('present', '1');
    history.replaceState({ ...history.state, crazyLabPitch: { chapter, originalScroll } }, '', address);
    chapters.forEach((section, i) => section.toggleAttribute('data-pitch-active', i === index));
    document.getElementById('pitch-position').textContent = (index + 1) + ' / ' + chapters.length;
    document.getElementById('pitch-name').textContent = chapters[index].dataset.chapter;
    previous.disabled = index === 0;
    next.textContent = index === chapters.length - 1 ? 'Restart' : 'Next';
    stage.scrollTop = 0;
    const heading = chapters[index].querySelector('h1, h2');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  function present() {
    if (dialog.open) return;
    const saved = history.state?.crazyLabPitch;
    const chapter = Number.isInteger(saved?.chapter) && saved.chapter >= 0 && saved.chapter < chapters.length
      ? saved.chapter : 0;
    originalScroll = Number.isFinite(saved?.originalScroll) ? saved.originalScroll : window.scrollY;
    stage.append(home);
    document.documentElement.classList.add('pitch-presenting');
    dialog.showModal();
    show(chapter);
  }

  const advance = () => show((index + 1) % chapters.length);
  previous.addEventListener('click', () => show(Math.max(0, index - 1)));
  next.addEventListener('click', advance);
  document.getElementById('pitch-exit').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    marker.after(home);
    chapters.forEach(section => {
      section.removeAttribute('data-pitch-active');
      section.querySelector('h1, h2').removeAttribute('tabindex');
    });
    document.documentElement.classList.remove('pitch-presenting');
    window.scrollTo({ top: originalScroll, behavior: 'instant' });
    launch.focus({ preventScroll: true });
    const address = new URL(location.href);
    address.searchParams.delete('present');
    const state = { ...history.state };
    delete state.crazyLabPitch;
    history.replaceState(state, '', address);
  });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const interacting = event.target.closest('button, a, input, select, textarea, summary');
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || (event.key === ' ' && !interacting)) {
      event.preventDefault();
      if (!event.repeat) advance();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      if (!event.repeat && index > 0) show(index - 1);
    }
  });
  launch.hidden = false;
  launch.addEventListener('click', present);
  if (new URLSearchParams(location.search).get('present') === '1') present();
}
