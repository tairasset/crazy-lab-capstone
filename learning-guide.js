import { powderApplications, powderTestingNote } from './copper-applications.js';

const patent = {
  title: 'Patent KZ B 32204',
  url: 'https://gosreestr.kazpatent.kz/Gosreestr/DownloadDescription?documentId=1614379',
};

const cell = { ...patent, locator: 'Pages 2–3 · Electrolysis cell and gas path' };
const preparation = { ...patent, locator: 'Pages 2–3 · Filter, rinse and dry the sediment' };
const reduction = { ...patent, locator: 'Pages 2–3 · Hydrogen reduction and copper powder' };
const electricity = {
  title: 'OpenStax Chemistry 2e',
  url: 'https://openstax.org/books/chemistry-2e/pages/17-7-electrolysis',
  locator: 'Section 17.7 · Electrolysis',
};
const ionicCompounds = {
  title: 'OpenStax Chemistry 2e',
  url: 'https://openstax.org/books/chemistry-2e/pages/2-6-ionic-and-molecular-compounds',
  locator: 'Section 2.6 · Ions',
};
const filtration = {
  title: 'IUPAC Gold Book · Filtration',
  url: 'https://goldbook.iupac.org/terms/view/F02388',
  locator: 'How filters separate suspended solids from liquids',
};

const applicationTerms = {
  circuit: /\b(?:electronics?|printed circuits?|circuit boards?|conductive ink|printed tracks?|leds|an led|the led)\b/u,
  printer: /\b(?:3[ -]?d print\w*|three[- ]dimensional print\w*|additive manufacturing|double helix|printed spiral)\b/u,
  discs: /\b(?:lubric\w*|oils?|friction|metal wear|reduce wear|scratches|moving (?:machinery|metal parts))\b/u,
};
const powderUseIntent = [
  /\b(?:uses|applications?|industries|useful|used for|used in|good for)\b/u,
  /\buse (?:it|this|the|copper)\b.*\bfor\b|\buse copper powder\b/u,
  /\b(?:do|make) with (?:it|that|this|the|copper)\b/u,
  /\bwhat(?:'s| is) (?:the |this )?(?:copper )?powder for\b|\bwhere does (?:the |this )?(?:copper )?powder go\b/u,
];
const applications = {
  powderUses: {
    text: `Scientists have used tiny copper particles to print a path that lights a lamp, build a metal spiral layer by layer, and help moving metal parts wear less in an oil test. ${powderTestingNote}`,
    sources: Object.values(powderApplications).map(item => item.source),
  },
  ...Object.fromEntries(Object.entries(powderApplications).map(([id, item]) => [id, {
    text: `${item.evidence} ${powderTestingNote}`,
    sources: [item.source],
  }])),
  cosmetics: {
    text: 'The European Union prohibits cosmetics containing copper in nano form or colloidal copper in nano form. Our lesson sources give no verified cosmetic use for the powder from this lab.',
    sources: [{
      title: 'European Commission · Regulation (EU) 2024/858',
      locator: 'Annex II, entry 1726 · Copper (nano) and colloidal copper (nano) in cosmetics',
      url: 'https://eur-lex.europa.eu/eli/reg/2024/858/oj/eng/pdf',
    }],
  },
};

function matchApplication(question, phase) {
  const query = question.toLowerCase();
  if (/\b(?:cosmetics?|makeup|make-up|skincare)\b/u.test(query)) return 'cosmetics';
  const specific = Object.keys(applicationTerms).filter(id => applicationTerms[id].test(query) ||
    (id === 'circuit' && /\bLED\b/u.test(question)));
  if (specific.length > 1) return 'powderUses';
  if (specific.length) return specific[0];
  const mentionsPowder = /\b(?:powder|nanoparticles?|ultrafine copper)\b/u.test(query);
  const atProduct = (phase === 'product' || phase === 'won') && /\b(?:it|its|this|applications?|uses)\b/u.test(query);
  return (mentionsPowder || atProduct) && powderUseIntent.some(pattern => pattern.test(query)) ? 'powderUses' : null;
}

const miningSource = { title: 'USGS · Copper', url: 'https://www.usgs.gov/centers/national-minerals-information-center/copper-statistics-and-information', locator: 'Copper production from ore to refined metal' };
const topics = {
  ore: { match: /\b(?:ore|mine|mining|quarry|concentrat(?:or|e)|rock)\b/iu, text: 'Ore is rock holding useful minerals. Crushing breaks the rock into bits. Sorting keeps more of the copper-bearing bits and leaves much of the other rock behind.', sources: [miningSource] },
  furnace: { match: /\b(?:furnace|smelt\w*|blister|refin\w*)\b/iu, text: 'In the quarry, smelting and converting turn the concentrate into copper metal that still contains impurities. Refining gives us cleaner copper for the plates in the next lab.', sources: [miningSource] },
  power: {
    match: /\b(?:power|electric(?:al|ity)?|current(?!\s+(?:step|stage))|supply|batter(?:y|ies)|voltage|wires?|dc)\b/iu,
    text: 'The power supply gives the two copper plates the energy to do different jobs. One plate gives copper to the liquid, and hydrogen bubbles form at the other. Without power, the tank stops making new bubbles and the solid already at the bottom stays there.',
    sources: [cell, electricity],
  },
  plates: {
    match: /\b(?:anode|cathode|electrodes?|plates?|positive|negative|plus|minus)\b|[+−]/iu,
    text: 'In this tank, the plus plate is the anode. Some copper leaves it and enters the water as tiny charged bits called ions. The minus plate is the cathode, where some of the water becomes hydrogen bubbles.',
    sources: [cell, electricity],
  },
  ion: {
    match: /\b(?:atoms?|electrons?|ions?|charge)\b/iu,
    text: 'An atom is a tiny piece of matter. An electron is one of its tiny parts and carries a minus charge. At the plus plate, a copper atom gives up an electron and goes into the water with a plus charge. That charged copper atom is an ion.',
    sources: [cell, ionicCompounds],
  },
  tank: {
    match: /\b(?:tank|bath|salt(?:y)? water|brine|electrolyte|electrolysis|solution|bubbles?)\b/iu,
    text: 'The tank holds salt water and two copper plates. Tiny charged bits from the dissolved salt help carry electricity through the water. With the power on, hydrogen bubbles rise and solid copper(I) oxide collects at the bottom.',
    sources: [cell, electricity],
  },
  pipe: {
    match: /\b(?:pipes?|tubes?|gas|hydrogen|h₂|hoods?|route|routing)\b/iu,
    text: 'A cover above the minus plate catches the rising hydrogen bubbles. The pipe gives the gas a path to the reactor. The copper oxide stays at the bottom of the tank and takes a separate path through the preparation bench.',
    sources: [cell],
  },
  filter: {
    match: /\b(?:filter\w*|strainer|sieve|separat\w*|drain\w*)\b/iu,
    text: 'The filter works like a very fine strainer. Liquid passes through, and the filter catches the tiny solid copper oxide grains. Those grains are what you keep for the next stage.',
    sources: [preparation, filtration],
  },
  drying: {
    match: /\b(?:dry\w*|wash\w*|rins\w*|moisture|prepar\w*|salt residue)\b/iu,
    text: 'Rinsing washes away dissolved salt left with the copper oxide grains. Drying removes the remaining water. The dry grains are still copper oxide, ready to go into the reactor.',
    sources: [preparation],
  },
  reactor: {
    match: /\b(?:reactor|reduction|reduce\w*|heating|oxygen|inputs?|reaction)\b/iu,
    text: 'Two things meet in the reactor: dry copper oxide grains and hydrogen gas. Hydrogen joins the oxygen from the oxide and forms water. What is left is copper metal in tiny grains.',
    sources: [reduction],
  },
  product: {
    match: /\b(?:powder|product|ultrafine|microscop\w*|grain size|particle size|final copper)\b/iu,
    text: 'The finished powder is made of tiny grains of copper metal. The game shows the grains much bigger so you can see them. The solid from the tank was copper oxide, a compound of copper and oxygen.',
    sources: [reduction],
  },
  sediment: {
    match: /\b(?:sediment|precipitate|copper\s*(?:\(i\))?\s*oxide|cu₂o|cu2o|grains?)\b/iu,
    text: 'Sediment means little solid grains that have sunk to the bottom. In this tank, those grains are copper(I) oxide. They contain copper joined to oxygen and are the material you prepare for the reactor.',
    sources: [cell, preparation],
  },
};

const stages = {
  palaceBubbles: ['tank','Watch the two plates and see where the bubbles rise.'],
  palaceFilter: ['filter','Watch where the grains stay when the water drains.'],
  palaceCharge: ['ion','Follow the electron to see which charge remains.'],
  mine: ['ore','Strike the flecked rock twice to collect ore.'],
  concentrate: ['ore','Use the concentrator to sort the crushed rock.'],
  smelt: ['furnace','Fire the furnace to get impure copper metal.'],
  refine: ['furnace','Use the refinery to make a clean copper plate.'],
  complete: ['furnace','The plate is ready for the powder lab.'],
  circuit: ['circuit','Light the LED at the electronics stand.'],
  printer: ['printer','Start the printer to build a copper spiral.'],
  discs: ['discs','Start the oil test and compare the two discs.'],
  idle: ['power', 'Select the power supply to begin.'],
  electrolysis: ['tank', 'Watch the tank for bubbles near the minus plate and grains settling at the bottom.'],
  observe: ['plates', 'Inspect the tank to see where the bubbles and grains come from.'],
  route: ['pipe', 'Select the gas pipe to follow the hydrogen to the reactor.'],
  'gas-flow': ['pipe', 'Watch the gas move through the pipe.'],
  filter: ['filter', 'Use the filter to separate the solid grains from the liquid.'],
  filtering: ['filter', 'Watch the liquid pass through while the solid grains stay behind.'],
  'prep-dry': ['drying', 'Continue to the wash and dry step at the preparation bench.'],
  drying: ['drying', 'Watch the preparation bench as it gets the grains ready for the reactor.'],
  ready: ['reactor', 'Select the reactor to bring the prepared grains and the gas together.'],
  reduction: ['reactor', 'Watch the copper oxide change into copper powder inside the reactor.'],
  product: ['product', 'Inspect the finished copper powder.'],
  won: ['product', 'You finished the run. You can replay it or ask about any step.'],
};

const missingPrices = 'The lesson has no dated quotes for the powder and solid copper. To find the difference, compare prices per kilogram on the same day, in the same currency, for the same order size. For the powder, specify the grain size and purity you need.';
const pricing = {
  text: missingPrices + ' The London Metal Exchange quotes Grade A copper cathodes in US dollars per tonne.',
  sources: [{
    title: 'London Metal Exchange · Copper contract specifications',
    url: 'https://www.lme.com/Metals/Non-ferrous/LME-Copper/Contract-specifications',
    locator: 'Futures price quotation and physical delivery form',
  }],
};
const notes = { ...topics, ...applications, pricing };
const priceWords = /\b(?:price[sd]?|pricing|costs?|costly|expensive|cheap(?:er|est)?|pricier|worth|premium|market value|market rate)\b|\bhow much (?:for|(?:more|less) (?:money|per (?:kg|kilo(?:gram)?|tonne)))\b/iu;
const askingPrice = /\bhow much (?:is|are) (?:the |this |a kilo(?:gram)? of )?(?:copper(?: powder)?|powder|it)(?: today| now| per (?:kg|kilo(?:gram)?|tonne))?[?.!\s]*$/iu;
const allSources = Object.values(notes).flatMap(({ sources }) => sources);
const nextQuestion = /\b(?:what next|next step|what (?:should i|do i|to) do|where (?:do i|should i|to) (?:go|click)|what (?:do i|should i) (?:click|press|select)|how (?:do i|to) (?:start|continue|proceed))\b/iu;
const stageQuestion = /^why[?.!\s]*$|\b(?:what(?:’s|'s| is) (?:happening|this|that)|current (?:step|stage)|what does (?:this|that) do|why (?:is this|am i doing this))\b/iu;
const sourcesQuestion = /^(?:sources?|references?|citations?)\s*[?.!]*$|\b(?:show|list|cite|which|what).{0,15}\b(?:sources?|references|citations|studies)\b/iu;
const operatingDetails = /\b(?:exact (?:settings|values|temperature|pressure|current|voltage|time)|operating parameters|recipe|how (?:much|hot|long) (?:should|do|is|are)|how (?:do i|to) (?:build|make (?:an? )?explos\w*|start a fire)|make .{0,18}explode|do this at home|real[- ]world setup)\b/iu;

export const unknownLearningAnswer = 'The lesson sources leave that question open. You can ask how the lab works or explore uses for copper powder in electronics, 3D printing and machinery.';

export function normalizeLearningContext(value) {
  if (value?.mission !== 'learning' || typeof value.phase !== 'string' || !Object.hasOwn(stages, value.phase)) return null;
  return { mission: 'learning', phase: value.phase };
}

export function checkedLearningSources(sources) {
  if (!Array.isArray(sources)) return [];
  return allSources.filter((known, index) => allSources.indexOf(known) === index &&
    sources.some((source) => source?.url === known.url && source.locator === known.locator));
}

export function lookupLearningAnswer(question, value) {
  const context = normalizeLearningContext(value);
  const unknown = { text: unknownLearningAnswer, topic: 'unknown', sources: [] };
  if (!context) return { local: unknown, materials: [], fixed: true };

  const [current, next] = stages[context.phase];
  const namesMaterial = /\b(?:copper|powder|cathodes?|metal)\b/iu.test(question);
  const refersToProduct = ['product', 'won'].includes(context.phase) && /\b(?:it|this|that)\b/iu.test(question);
  if ((namesMaterial || refersToProduct) && (priceWords.test(question) || askingPrice.test(question))) {
    return {
      local: { topic: 'pricing', ...pricing },
      materials: [{ id: 'pricing', ...pricing }],
      unknown: missingPrices,
      fixed: false,
      next,
    };
  }
  if (operatingDetails.test(question)) {
    return { local: { text: 'This guide covers the virtual lab and what each step does. Try asking what changes in the tank or why the filter comes before the reactor.', topic: 'learning-scope', sources: [] }, materials: [], fixed: true };
  }
  const application = matchApplication(question, context.phase);
  if (!application && nextQuestion.test(question)) {
    return { local: { text: next, topic: 'learning-next', sources: [] }, materials: [], fixed: true };
  }

  const matches = Object.entries(topics).map(([id, { match }]) => [id, question.search(match)])
    .filter(([, index]) => index >= 0).sort((a, b) => a[1] - b[1]).map(([id]) => id);
  const topic = application ?? matches[0] ?? current;
  const asksAboutPatent = /\bpatent\b/iu.test(question);
  const sources = application && asksAboutPatent ? [...notes[topic].sources, reduction] : notes[topic].sources;
  if (sourcesQuestion.test(question) || (!application && asksAboutPatent)) {
    return { local: { text: 'Here are the sources for that topic.', topic, sources }, materials: [], fixed: true };
  }

  const isStageQuestion = stageQuestion.test(question);
  const local = application || matches.length || isStageQuestion ? {
    text: isStageQuestion && !application && !matches.length ? `${next} ${notes[topic].text}` : notes[topic].text,
    topic, sources,
  } : unknown;
  const relevant = isStageQuestion && !matches.length && !application ? [current] : application ? [application] : matches.length || isStageQuestion ? [...new Set([...matches, current])] : Object.keys(notes);
  const materials = relevant.map(id => ({ id, text: notes[id].text, sources: id === topic ? sources : notes[id].sources }));
  return { local, materials, fixed: false, next };
}
