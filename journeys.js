const discoverStops = [
  ['Copper Quarry', '?mission=crazy&mode=quarry&journey=discover'],
  ['Powder Lab', '?mission=crazy&mode=learning&journey=discover'],
  ['Powder Exhibition', '?journey=discover&stage=uses'],
];
const scienceStops = [
  ['Try the basics', '?mission=crazy&mode=palace&journey=science'],
  ['Inside the lab', '?mission=crazy&mode=learning&journey=science'],
  ['Safety Drill', '?mission=crazy&mode=safety'],
];

const modes = [
  ['discover', 'Discover Copper', discoverStops[0][1]],
  ['science', 'Chemistry Made Simple', scienceStops[0][1]],
  ['fun', 'Fun Mode', '?mission=crazy'],
];

export function showModeNav(active) {
  for (const nav of document.querySelectorAll('[data-mode-nav]')) {
    nav.replaceChildren(...modes.map(([mode, label, href]) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.dataset.route = mode;
      if (mode === active) link.setAttribute('aria-current', 'true');
      return link;
    }));
  }
}

export function showJourneyNav(nav, name, active) {
  const discovery = name === 'discover';
  const stops = discovery ? discoverStops : scienceStops;
  nav.setAttribute('aria-label', discovery ? 'Discover Copper stops' : 'Chemistry Made Simple lessons');
  nav.classList.add('journey-nav');
  nav.classList.toggle('discover-journey', discovery);
  nav.replaceChildren(...stops.map(([title, href], index) => {
    const link = document.createElement('a');
    link.href = href;
    const ordinal = document.createElement('span');
    ordinal.textContent = String(index + 1).padStart(2, '0');
    ordinal.setAttribute('aria-hidden', 'true');
    link.append(ordinal, title);
    if (index === active) link.setAttribute('aria-current', 'step');
    return link;
  }));
  if (!discovery) {
    const link = document.createElement('a');
    link.href = '?mission=copper';
    link.textContent = 'Equipment reference';
    link.className = 'journey-reference';
    nav.append(link);
  }
}
