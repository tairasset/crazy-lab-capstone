import { crazyCases } from './crazy-cases.js';

const casesById = new Map(crazyCases.map((scenario) => [scenario.id, scenario]));
const allSources = crazyCases.flatMap(({ sources }) => sources);
const stages = ['choosing', 'feedback', 'complete'];
const topics = [
  ['preflight', /\b(?:ventilation|ventilate|exhaust|goggles|ppe|eye protection)\b|вентиляц|вытяж|проветр|сиз|защитн.{0,12}(?:очк|перчат)/iu],
  ['power', /\b(?:current|voltage|electrical|electricity|power|ac|dc)\b|ток|напряж|электр|блок.{0,10}пит/iu],
  ['gas-alarm', /\b(?:hydrogen|alarm|gas|detector|sensor|leak|emergency|shutdown)\b|водород|тревог|газ|датчик|авари|останов/iu],
  ['sample-prep', /\b(?:sediment|filter\w*|wash\w*|dry\w*|moisture|sample prep\w*|dissolved salt)\b|фильтр|промыв|суш|осад|подготовк.{0,12}(?:крупин|проб)/iu],
];

export const unknownCrazyAnswer = 'The mission sources leave this question open. You can ask about ventilation, the power supply, the hydrogen alarm, or sediment preparation.';

export function normalizeCrazyContext(value) {
  if (value?.mission !== 'crazy') return null;
  const scenario = casesById.get(value.caseId);
  if (!scenario) return null;
  const stageStatus = stages.includes(value.stageStatus) ? value.stageStatus : 'choosing';
  const choice = stageStatus !== 'choosing' && Number.isInteger(value.choice) && scenario.options[value.choice]
    ? value.choice : null;
  return { mission: 'crazy', caseId: scenario.id, stageStatus, choice, correct: choice === null ? null : choice === scenario.correct };
}

export function checkedCrazySources(sources) {
  if (!Array.isArray(sources)) return [];
  return allSources.filter((known, index) => allSources.findIndex((source) => source.url === known.url && source.locator === known.locator) === index &&
    sources.some((source) => source?.url === known.url && source.locator === known.locator));
}

export function lookupCrazyAnswer(question, value) {
  const context = normalizeCrazyContext(value);
  const current = context && casesById.get(context.caseId);
  const unknown = { text: unknownCrazyAnswer, topic: 'unknown', sources: [] };
  if (!current) return { local: unknown, scenarios: [], fixed: true };

  const query = question.toLowerCase().replaceAll('ё', 'е');
  if (/\b(?:blast|explos\w*|explod\w*|flash|smok\w*|flame|ignite|fire|sparks?|special effect)\b|взрыв|взорв|взлет.{0,15}воздух|вспыш|дым|плам|подж[ие]|спецэффект/iu.test(query)) {
    return {
      local: {
        text: 'The flash and smoke are scripted game effects. In the learning scenario, the detector sounds an alarm and the simulator shuts down the equipment.',
        topic: 'crazy-effect', sources: [],
      }, scenarios: [current], fixed: true,
    };
  }
  if (/^(?:what is the source|sources?|references?|citations?|источники?|ссылки?)\s*[?.!]*$|\b(?:show|list|cite|which|what).{0,15}\b(?:sources|references|citations)\b|\bsource (?:supports|backs)\b|(?:покажи|дай|како[йе]|какие).{0,20}(?:ссылк|источник)|на что опира/iu.test(query)) {
    return {
      local: { text: `Here are the sources for “${current.title}”.`, topic: current.id, sources: current.sources },
      scenarios: [current], fixed: true,
    };
  }

  const picked = context.choice === null ? null : current.options[context.choice];
  const next = /\b(?:what (?:should i|do i|to) do|what (?:now|next)|next step|where (?:do i|to) click|how (?:do i|to) proceed)\b|что.{0,14}делать|дальше|куда.{0,10}нажат|следующ.{0,10}шаг|подскаж/iu.test(query);
  if (next) {
    let text = `Read the “${current.title}” scenario and choose one of the four options.`;
    if (context.stageStatus === 'complete') text = 'The mission is complete. Start a new shift to try other choices.';
    else if (picked && context.correct) text = current === crazyCases.at(-1)
      ? 'Choice accepted. Select “Finish shift” to see your result.'
      : 'Choice accepted. Select “Next” to go to the next step.';
    else if (picked) text = 'Read the feedback, select “Try again,” and use the early sign to make your next choice.';
    return { local: { text, topic: 'crazy-next', sources: [] }, scenarios: [current], fixed: true };
  }

  const match = topics.find(([id, pattern]) => id === current.id && pattern.test(query)) ??
    topics.find(([, pattern]) => pattern.test(query));
  const selected = match && casesById.get(match[0]);
  const aboutCurrent = /\b(?:why|what happened|mistake|feedback|my choice|correct|safe(?:r|st)?|result|batch|early sign)\b|почему|что.{0,10}(?:произош|случил|пошло)|ошиб|разбор|мой выбор|правильн|безопасн|результат|парти|ранни.{0,8}признак/iu.test(query);
  const scenario = selected ?? (aboutCurrent ? current : null);
  if (!scenario) return { local: unknown, scenarios: [current], fixed: false };
  const option = scenario === current && picked ? picked : scenario.options[scenario.correct];
  const text = /\b(?:early sign|how (?:do i|to) notice|what to look for)\b|ранни.{0,8}признак|как заметить|что замет/iu.test(query) ? option.sign
    : /\b(?:batch|what happened to the sample)\b|парти|что.{0,10}с пробой/iu.test(query) ? option.batch
    : /\b(?:correct|safer?|safest).{0,14}(?:choice|action|decision|do)|\bhow (?:do i|to) fix\b|(?:правильн|безопасн).{0,14}(?:выб|сдел|решен)|как исправ/iu.test(query) ? option.safer
    : `${option.result} ${option.why}`;
  return {
    local: { text, topic: scenario.id, sources: scenario.sources },
    scenarios: scenario === current ? [current] : [current, scenario],
    fixed: false,
  };
}
