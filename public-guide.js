import { powderApplications } from './copper-applications.js';
import { quarryNotes } from './quarry-notes.js';

const electrolysis = { title: 'OpenStax Chemistry 2e', locator: 'Electrolysis', url: 'https://openstax.org/books/chemistry-2e/pages/17-7-electrolysis' };
const ions = { title: 'OpenStax Chemistry 2e', locator: 'Ions and electrons', url: 'https://openstax.org/books/chemistry-2e/pages/2-6-ionic-and-molecular-compounds' };
const phases = { title: 'OpenStax Chemistry 2e', locator: 'Solids, liquids and gases', url: 'https://openstax.org/books/chemistry-2e/pages/1-2-phases-and-classification-of-matter' };
const evaporation = { title: 'OpenStax Chemistry 2e', locator: 'Evaporation and phase changes', url: 'https://openstax.org/books/chemistry-2e/pages/10-3-phase-transitions' };
const changes = { title: 'OpenStax Chemistry 2e', locator: 'Physical and chemical changes', url: 'https://openstax.org/books/chemistry-2e/pages/1-3-physical-and-chemical-properties' };
const chargeFlow = { title: 'OpenStax College Physics 2e', locator: 'Current', url: 'https://openstax.org/books/college-physics-2e/pages/20-1-current' };
const potential = { title: 'OpenStax College Physics 2e', locator: 'Potential difference', url: 'https://openstax.org/books/college-physics-2e/pages/19-1-electric-potential-energy-potential-difference' };
const temperatureScale = { title: 'OpenStax College Physics 2e', locator: 'Temperature', url: 'https://openstax.org/books/college-physics-2e/pages/13-1-temperature' };
const filtration = { title: 'IUPAC Gold Book', locator: 'Filtration', url: 'https://goldbook.iupac.org/terms/view/F02388' };
const copper = { title: 'US Geological Survey', locator: 'Copper statistics and information', url: 'https://www.usgs.gov/centers/national-minerals-information-center/copper-statistics-and-information' };
const labSafety = { title: 'OSHA', locator: 'Laboratory safety guidance', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1450AppA' };
const copperMarket = { title: 'London Metal Exchange', locator: 'Copper contract specifications', url: 'https://www.lme.com/Metals/Non-ferrous/LME-Copper/Contract-specifications' };
const printedTrack = powderApplications.circuit.source;
const printedPart = powderApplications.printer.source;
const testedOil = { ...powderApplications.discs.source, locator: 'Independent experiment on friction and wear' };

function quarryCard(note, match) {
  const { text, source } = quarryNotes[note];
  return { match, text, sources: [source] };
}

// Model passages are written for the public guide. Keep the same boundary when cards are read together.
const cards = {
  filter: {
    match: /\b(?:filter\w*|strain(?:er|ing)|siev\w*|colander|separat\w*|trapp?\w* (?:the )?(?:solid|grains?)|catches? (?:the )?grains?)\b|фильтр|сито|дуршлаг|отдел[ия]/u,
    text: 'A filter catches solid grains while letting liquid flow through. Picture a kitchen strainer catching pasta while the water drains away. Water can pass through the small holes in the filter, but grains stay behind because they are bigger than the holes.',
    sources: [filtration],
  },
  charge: {
    match: /\b(?:charge[sd]?|plus|minus|positive|negative|protons?|electrons?|ions?|atoms?|charged particles?)\b|положительн|отрицательн|заряд|плюс|минус|протон|электрон|атом|(?:^|\s)ион/u,
    text: 'An atom is a tiny building block of matter. Its protons have positive charge and its electrons have negative charge. If those charges balance, the atom is neutral. An ion is an atom or a group of atoms with an overall positive or negative charge.',
    sources: [ions],
  },
  electrodes: {
    match: /\b(?:anodes?|cathodes?|electrodes?|plates?)\b|анод|катод|электрод|пластин/u,
    text: 'Electrodes are the places where the electric circuit meets the liquid in the model. At the anode, particles lose electrons. At the cathode, particles gain electrons. The names tell you what happens at each place.',
    sources: [electrolysis],
  },
  electricity: {
    match: /\b(?:power|generator|electric\w*|electrolysis|current|voltage|batter(?:y|ies)|wires?)\b|источник|питани|генератор|электр|напряжени|(?:^|\s)ток/u,
    text: 'The power supply gives energy to the electric circuit. Electrolysis uses electrical energy to drive a chemical change. The animation lets you compare the tank with its power on and off.',
    sources: [electrolysis],
  },
  current: {
    match: /\b(?:voltage|electric current|electric potential|amperage)\b|напряжени|(?:^|\s)ток(?:а|ом|е)?(?:$|\W)/u,
    text: 'Electric current measures how much charge flows past a point each second. Voltage describes a difference in electrical potential, a kind of push that can drive a current through a closed circuit.',
    sources: [chargeFlow, potential],
  },
  temperature: {
    match: /\b(?:temperature|thermometer)\b|температур|термометр/u,
    text: 'Temperature tells you how hot or cold something is. A thermometer measures temperature. For example, you can use one to compare a warm cup of water with a cool cup.',
    sources: [temperatureScale],
  },
  tank: {
    match: /\b(?:tank|bath|liquid|solution|electrolyte|bubbles?)\b|резервуар|аквариум|электролизер|электролит|раствор|жидкост|пузыр/u,
    text: 'The clear tank is a window into the game experiment. A bubble is a pocket of gas in a liquid. Watch a bubble rise, then look for solid grains that stay behind. The animation makes these small changes easier to see.',
    sources: [phases],
  },
  pipe: {
    match: /\b(?:pipes?|tubes?|hoses?|hoods?)\b|труб|шланг/u,
    text: 'A pipe gives moving material a path to follow. Imagine a drinking straw guiding water. The animation lets you follow a moving dot along the pipe with your eyes.',
    sources: [],
  },
  drying: {
    match: /\b(?:dry|dryer|drying|rinse|rinsing|wash|washing|moisture)\b|сушк|сушил|сушить|промыв|просуш|влаг/u,
    text: 'Drying removes moisture. Think of the wet mark a cup leaves on a table. The water can evaporate into the air until the mark is gone. Watch the wet and dry views in the game to see the difference.',
    sources: [evaporation],
  },
  reactor: {
    match: /\breactors?\b|реактор/u,
    text: 'A reactor is a vessel where a chemical change takes place. In the game its window lets you watch the change. Look for the visual difference between the start and end of the animation.',
    sources: [changes],
  },
  quarry: quarryCard('ore', /\b(?:ores?|quarr(?:y|ies)|mine[ds]?|minerals?|mining|rocks?|pickaxe)\b|руд[аыуеой]|шахт|карьер|горнород|минерал|добыва|кирк/u),
  copperConcentrate: quarryCard('concentrate', /\b(?:concentrator|concentrate)\b|обогащен|концентрат(?!рац)/u),
  copperSmelting: quarryCard('smelt', /\b(?:furnace|smelt\w*)\b|печь|плавк/u),
  copperRefining: quarryCard('refine', /\brefin\w*\b|рафинир|очистк.{0,12}мед/u),
  copperWiring: quarryCard('uses', /\b(?:wir(?:e[sd]?|ing)|cables?|motors?|conducts? electricity|carry electricity)\b|провод[акоуеы]|провод.{0,12}электр/u),
  copperHeat: quarryCard('heat', /\b(?:heat|thermal|cooling|radiators?|heat exchangers?)\b|тепл|охлаж|радиатор/u),
  copperShape: quarryCard('shape', /\b(?:ductil\w*|malleab\w*|bend\w*|stretch\w*|copper sheets?)\b|пластичн|ковк|гибк/u),
  copperPatina: quarryCard('surface', /\b(?:patina|green|weather\w*)\b|патин|зелен|выветрив/u),
  copperAlloys: quarryCard('alloys', /\b(?:brass|bronze|alloys?)\b|бронз|латун|сплав/u),
  copperRecycling: quarryCard('recycle', /\b(?:recycl\w*|scraps?)\b|переработ|переплав/u),
  price: {
    match: /\b(?:price[sd]?|costs?|expensive|cheaper|pricier|premium|worth|buy|sell)\b|цен[ауые]|стоимост|стои[тм]|стоят|дороже|дешевле/u,
    text: 'Solid copper and copper powder are sold in different forms. To compare prices, you need quotes for the same weight on the same date. A price for solid copper alone cannot tell you the price of a particular powder. This exhibit has no live prices.',
    sources: [copperMarket],
  },
  circuit: {
    match: /\b(?:electronics?|tracks?|conductive ink|printed circuits?|circuits?|lamp|leds?)\b|электроник|чернил|схем|светодиод|ламп/u,
    text: 'At the electronics exhibit, a printed track carries electric current to a little lamp. Researchers demonstrated this with ink containing tiny copper-based particles. The lamp lighting up shows that current can travel through the track.',
    sources: [printedTrack],
  },
  printing: {
    match: /\b(?:3\s?d print\w*|printing|printer|spirals?|additive manufacturing|helix)\b|3д|печать|печатать|принтер|спирал/u,
    text: 'The printing exhibit shows a metal part taking shape layer by layer. In an independent study, researchers printed a copper part shaped like two spirals. Look at the shape from the side to see the layers stack up.',
    sources: [printedPart],
  },
  wear: {
    match: /\b(?:friction|wear|lubrica\w*|oil|slid\w*|discs?)\b|трени|износ|смазк|масле|масло/u,
    text: 'Friction resists sliding. Wear is damage that builds up as surfaces rub together. In one experiment, metal surfaces wore less in oil containing tiny copper particles. The exhibition lets you compare the marks on two discs.',
    sources: [testedOil],
  },
  uses: {
    match: /\b(?:exhibition|exhibits?)\b|выставк/u,
    text: 'Researchers have used copper particles in printed electrical tracks, metal printing and tests of lubricants. Each team tested its own material. In the exhibition, choose a stand to try one of these examples.',
    sources: [printedTrack, printedPart, testedOil],
  },
  powder: {
    match: /\b(?:powders?|grains?|particles?|sediment|tiny|metal dust)\b|порош|крупин|зерн|частиц|осадок/u,
    text: 'Copper powder is copper metal in the form of many small grains. A solid copper object is one continuous piece. The game enlarges the grains so you can see them separately on the screen.',
    sources: [printedPart],
  },
  copper: {
    match: /\bcopper\b|(?:^|\s)мед[ьиьяюа]|медн/u,
    text: 'Copper is a reddish metal that carries electricity and heat well. It can also be shaped into thin wires or flat sheets. That makes it useful in wiring, motors, heating systems and roofing.',
    sources: [copper, quarryNotes.heat.source],
  },
  safety: {
    match: /\b(?:alarm|siren|safe\w*|goggles?|ventilat\w*|shut(?:down)?|shut off|emergency|protect\w*)\b|защит|безопас|авари|вентиляц|сирен|тревог/u,
    text: 'An alarm tells you to pause and pay attention. In the safety drill, read the warning before choosing a response. In a real teaching lab, follow the instructor’s safety directions.',
    sources: [labSafety],
  },
  next: {
    text: 'Look for the highlighted object or the action button beside the scene. Select it once and watch what changes. You can ask me about the object you see.',
    sources: [],
  },
};

const stageTopic = {
  palaceBubbles: 'tank', palaceFilter: 'filter', palaceCharge: 'charge',
  mine: 'quarry', concentrate: 'copperConcentrate', smelt: 'copperSmelting', refine: 'copperRefining', complete: 'copper',
  circuit: 'circuit', printer: 'printing', discs: 'wear',
  idle: 'electricity', electrolysis: 'tank', observe: 'tank', route: 'pipe', 'gas-flow': 'pipe',
  filter: 'filter', filtering: 'filter', 'prep-dry': 'drying', drying: 'drying',
  ready: 'reactor', reduction: 'reactor', product: 'powder', won: 'powder',
};

const useWords = /\b(?:uses?|used|useful|applications?|industries|good for|what can .{0,20} do with)\b|примен|пригод|использ|индустри/u;
const copperWords = /\bcopper\b|(?:^|\s)мед[ьиьяюа]|медн/u;
const demonstrativeUse = /^(?:what(?:'s| is| are) (?:it|this|that|they) (?:used|useful|good) for|where (?:can|is) (?:it|this|that) (?:be )?used|для чего (?:это|он)|где (?:он|это) применя\S*)[?.!\s]*$/u;
const basicDefinition = /^(?:what(?:'s| is)(?: the meaning of)?|what does) (?:electric(?:al)? )?(?:voltage|current|amperage|temperature)(?: mean)?[?.!\s]*$/u;

// A rejected or unrecognized question never supplies material for a model passage.
const privateIntent = [
  /\b(?:patent(?:s|ed)?|recipes?|formulations?|ingredients?|ratios?|reagents?|parameters?|proportions?|dosages?|blueprints?|specifications?|setpoints?|concentrations?|reconstruct\w*|reproduc\w*|replicat\w*|reverse[ -]engineer\w*|protocols?|claims?|trade secrets?)\b|патент|рецепт|формул[ауые]|пропорц|реагент|концентрац|параметр|дозиров|воспроизв|повтори.{0,16}(?:процесс|технолог)|технологическ.{0,12}(?:схем|карт)|чертеж|专利|配方/u,
  /\b(?:list|outline|recover|derive|describe)\b.{0,25}\b(?:steps|sequence|procedure|method|conditions)\b|\b(?:materials?|chemicals?|substances?) (?:go|went|are added) (?:in|into)\b|перечисл.{0,25}(?:шаг|стади|этап|услови|состав)|режим.{0,12}(?:работы|получения)|покажи.{0,18}(?:полный процесс|все этапы)/u,
  /\b(?:steps?|instructions?|directions?|method) (?:for|to|needed|used|are needed|do i need)\b.{0,35}\b(?:powder|process|reaction)\b|\b(?:make|manufacture|produce|synthesize) (?:the |this |some )?(?:ultra(?:fine|disperse) )?(?:copper |metal )?powder\b|\b(?:settings?|conditions?) (?:for|of) (?:the |this )?(?:process|tank|reactor)\b/u,
  /\b(?:step[ -]by[ -]step|all (?:the )?(?:steps|stages|settings)|(?:every|each) (?:step|setting)|operating (?:range|window|conditions?)|production (?:procedure|method|steps?)|full (?:process|procedure)|in (?:what|which) order|at home|what goes into|what is added|what to add|what chemicals?|which chemicals?)\b|пошаг|все (?:этап|шаг|стади)|последовательност|порядок (?:действий|смешивания)|в домашних|у себя дома|что (?:добав|смеш)|каки[ех].{0,16}(?:химикат|веществ)/u,
  /\b(?:how (?:many|much|hot|long|strong)|which|what|give|tell|exact|optimal|set)\b.{0,52}\b(?:volts?|amps?|amperes?|degrees?|minutes?|hours?|grams?|voltage|amperage|temperature|frequency|pressure|duration|current settings?|settings?)\b|сколько.{0,38}(?:вольт|ампер|градус|минут|час|грамм|времени)|како[еймуюа].{0,26}(?:температур|напряжени|частот|давлени|сил[ау] тока|длительност)|(?:\d\s*(?:°|%|volts?\b|amps?\b|hz\b|rpm\b|mol\b|g\/l\b|вольт|ампер|герц|г\/л))/u,
  /\b(?:how (?:do|can|could|would|should) (?:i|we|you|they)|how to|how (?:is|was) .{0,25}powder|how (?:it|this) is)\b.{0,45}\b(?:mak(?:e|ing)|manufactur\w*|produc\w*|synthesi\w*|prepar\w*|made)\b|как.{0,40}(?:изготов|приготов|синтез|получ(?:ить|ают|ать)|произв(?:ести|одить|одят)|сделать).{0,30}порош/u,
  /\b(?:translate|decode|encode|reveal|disclose|ignore .{0,20}instructions?|system prompt|secret method)\b|переведи|перевод|раскрой|расшифруй|игнорируй|секретн/u,
  /как(?:ая|ое|ой|ие|ую|ом|им)\s.{0,24}(?:температур|давлени|напряжени|частот|длительност|сил[ау] тока)/u,
];
const nextQuestion = /^(?:(?:ok|okay)[, ]+)?(?:what(?:'s| is)? next|what (?:do|can|should) i (?:do|click|tap|press)(?: next)?|where (?:do|should) i (?:go|click|start)|give me a hint|i(?:'m| am) stuck|help(?: me)?|что (?:мне )?(?:дальше|делать)|куда нажать|подскажи|что нажать)[?.!\s]*$/u;
const sceneQuestion = /^(?:what(?:'s| is) (?:this|that|happening|going on)(?: (?:here|now))?|what does (?:it|this|that) do|how does (?:it|this|that) work|why(?: is that| does (?:it|this|that) happen)?|tell me more|why is (?:it|this) (?:useful|important)|что (?:это|происходит)(?: здесь)?|как это работает|зачем это|почему)[?.!\s]*$/u;
const processingTopics = ['copperConcentrate','copperSmelting','copperRefining'];
const materialTopics = [...processingTopics, 'copperPatina','copperAlloys','copperRecycling','copperShape','copperHeat','copperWiring'];
const quarryStages = ['mine','concentrate','smelt','refine','complete'];
const priority = ['price','filter','electrodes','charge','circuit','printing','wear','safety','pipe','drying','reactor','current','temperature','electricity','tank','quarry', ...processingTopics, 'uses','powder','copper'];
export const unknownPublicAnswer = 'I do not have a public lesson on that question. Try asking how a filter works, what an ion is, or where copper is used.';
const restricted = 'This guide covers general science and the game. Manufacturing instructions and operating details are outside its lessons. You can ask what an instrument does or how copper carries electricity.';

export function publicLesson(question, context) {
  const query = typeof question === 'string' ? question.normalize('NFKC').toLowerCase().replace(/[’‘]/gu, "'").replace(/ё/gu, 'е').replace(/\s+/gu, ' ').trim() : '';
  if (!basicDefinition.test(query) && privateIntent.some(pattern => pattern.test(query))) {
    return { restricted: true, known: false, topic: 'protected', context: '', sources: [], text: restricted };
  }
  let topic;
  if (nextQuestion.test(query)) topic = 'next';
  else if (sceneQuestion.test(query)) {
    const phase = context?.phase;
    if (typeof phase === 'string' && Object.hasOwn(stageTopic, phase)) topic = stageTopic[phase];
    else if (context?.mission === 'crazy') topic = 'safety';
    else topic = 'next';
  } else {
    topic = priority.find(id => cards[id].match.test(query));
    if (topic === 'powder' && useWords.test(query)) topic = 'uses';
    const aboutCopper = copperWords.test(query) || quarryStages.includes(context?.phase);
    if (topic !== 'price' && aboutCopper && !cards.powder.match.test(query)) {
      topic = materialTopics.find(id => cards[id].match.test(query)) || topic;
    }
    if (['product', 'won'].includes(context?.phase) && demonstrativeUse.test(query)) topic = 'uses';
    if (['filter', 'filtering', 'palaceFilter'].includes(context?.phase) && /\b(?:holes?|openings?|pores?)\b|отверсти|дырочк/u.test(query)) topic = 'filter';
    if (topic === 'price' && !copperWords.test(query) && !cards.powder.match.test(query)) topic = undefined;
  }
  if (!topic) return { restricted: false, known: false, topic: 'unknown', context: '', sources: [], text: unknownPublicAnswer };
  const { text, sources } = cards[topic];
  return { restricted: false, known: true, topic, context: text, sources, text };
}

// Only an approved topic and a sentence number cross turns. Free chat text
// cannot become evidence for the generator.
const followUp = /^(?:(?:can|could) you |please )?(?:give (?:me |us )?(?:a |an |another )?(?:simple |everyday |real.life )?example|(?:an? |another )?example|explain (?:it|that|this)(?: again| more simply| in simpler words)?|(?:say|make) (?:it|that) (?:simpler|more simply)|in (?:simple|simpler|other) words|why(?: is that| does (?:it|that|this) (?:work|happen))?|how (?:does|would) (?:it|that|this) work|what do you mean|tell me more|почему|объясни проще|приведи пример|например|попроще)[?!. ]*$/iu;
const examples = {
  charge: 'An extra negative charge tips the balance in an atom like an extra player tips the balance between two teams.',
  electrodes: 'Picture electrons as parcels leaving the anode and arriving at the cathode.',
  electricity: 'A battery lighting a small lamp shows how an energy source can make charges move around a circuit.',
  copper: 'Copper wire inside a lamp cord carries the electric current that powers the lamp.',
  copperWiring: 'Copper wire inside a lamp cord carries the electric current that powers the lamp.',
};
export function publicTurn(question, context, previousTopic, previousFact) {
  const original = publicLesson(question, context);
  if (original.restricted) return { lesson: original };
  const previous = Object.hasOwn(cards, previousTopic) ? cards[previousTopic] : null;
  const follow = previous && followUp.test(question.trim());
  const topic = follow ? previousTopic : original.topic;
  if (!Object.hasOwn(cards, topic)) return { lesson: original };
  const card = cards[topic];
  const passage = card.text + (examples[topic] ? ' ' + examples[topic] : '');
  const lesson = { ...original, restricted: false, known: true, topic, context: passage, text: card.text, sources: card.sources };
  const sentences = [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(passage)].map(s => s.segment.trim());
  let focus;
  if (/example|пример|например/iu.test(question) && (follow || original.known)) {
    focus = examples[topic] || sentences.find(s => /\b(?:picture|think of|imagine|for example|experiment|study)\b/i.test(s));
  } else if (follow) {
    const last = Number.isInteger(previousFact) ? sentences[previousFact] : null;
    if (/why|почему|more[?.! ]*$|work/i.test(question)) {
      focus = sentences.find(s => /\bbecause\b/i.test(s)) || sentences.find(s => s !== last);
    } else {
      focus = sentences.find(s => s !== last && /\b(?:picture|think of|imagine|like|kind of)\b/i.test(s)) || last || sentences[0];
    }
  }
  return { lesson, focus, sentences };
}
