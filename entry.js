import { showJourneyNav, showModeNav } from './journeys.js';
import { showVictory } from './victory.js';

const view = document.documentElement.dataset.view;

if (view === 'game') {
  await import('./app.js');
} else {
  const { setupDemoGuide } = await import('./demo-guide.js');
  setupDemoGuide();
  showModeNav(view === 'exhibition' ? 'discover' : undefined);
  if (view === 'home') {
    const { setupPresentation } = await import('./presentation.js');
    setupPresentation();
  }

  if (view === 'exhibition') {
    document.title = 'Crazy Lab · Powder Exhibition';
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = './copper-exhibit.css';
    document.head.append(sheet);
    const { mountCopperExhibit } = await import('./copper-exhibit.js');
    showJourneyNav(document.getElementById('exhibition-route'), 'discover', 2);
    mountCopperExhibit(document.getElementById('exhibition-host'), {
      onFinish: () => showVictory('exhibition'),
      onExit: () => location.assign('./'),
      onBack: () => location.assign('?mission=crazy&mode=learning&journey=discover'),
    });
    const { setupCompanion } = await import('./companion.js');
    setupCompanion('exhibit');
  } else if (new URLSearchParams(location.search).get('complete') === 'exhibition') {
    document.getElementById('journey-finished').hidden = false;
  }
}
