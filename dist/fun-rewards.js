export const PALACE_REWARDS = [
  { lesson: 'bubbles', title: 'Find the bubbles', id: 'scatter-plus', name: 'Scatter Nova' },
  { lesson: 'filter', title: 'Catch the grains', id: 'copper-plus', name: 'Copper Surge' },
  { lesson: 'charge', title: 'Move the electron', id: 'cryo-plus', name: 'Deep Freeze' },
];

const storageKey = 'crazy-lab-palace-points';
const lessonIds = new Set(PALACE_REWARDS.map(({ lesson }) => lesson));
const sessionPoints = new Set();

export function getPalacePoints() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (Array.isArray(saved)) {
      return new Set([...sessionPoints, ...saved.filter((lesson) => lessonIds.has(lesson))]);
    }
  } catch {
    // In-memory progress also works when storage is unavailable.
  }
  return new Set(sessionPoints);
}

export function earnPalacePoint(lesson) {
  if (!lessonIds.has(lesson)) return false;
  const points = getPalacePoints();
  if (points.has(lesson)) return false;
  points.add(lesson);
  try {
    localStorage.setItem(storageKey, JSON.stringify([...points]));
  } catch {
    sessionPoints.add(lesson);
  }
  return true;
}
