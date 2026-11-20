const topics = [
  {
    id: 'electron-transfer',
    match: /электрон.{0,34}(?:улет|ушел|уход|отда|теря|патент)|(?:улет|уход|ушел|отда|теря|патент).{0,34}электрон|(?:почему|зачем|куда).{0,20}сини[йе].{0,10}шарик/u,
    english: /\belectrons?\b.{0,32}\b(?:go|leave|lose|loss|give|move|transfer)|\b(?:lose|loses|lost|give|give up|where|why|how)\b.{0,30}\belectrons?\b|\bblue (?:ball|dot)\b/u,
    text: "At the + plate, a copper atom can give up an electron. The electron stays in the metal and moves along the wire. The copper is now a charged particle called an ion. Copper from that plate is what ends up in the grains you collect.",
  },
  {
    id: 'scale',
    match: /ультрадисперс|микрометр|микрон|размер.{0,30}(?:частиц|порош|крупин)|(?:насколько|очень|тако[йе]|таки[ех])\s+(?:мелк|маленьк)|(?:толщин|тоньше).{0,15}волос/u,
    english: /\b(?:ultrafine|submicron|microns?|micromet(?:re|er)s?)\b|\b(?:size|how (?:big|tiny|small|fine))\b.{0,35}\b(?:particles?|powder|grains?)\b|\b(?:particles?|powder|grains?)\b.{0,35}\bsize\b/u,
    text: "In the patent example, the oxide grains were 0.09 to 0.70 micrometres across. The patent reports the same range for the copper powder after the reaction. One micrometre is one thousandth of a millimetre. The game enlarges the grains so you can see them.",
  },
  {
    id: 'equipment',
    match: /(?:кажд|какие|все|друг|еще|больше).{0,20}(?:прибор|оборудован|детал)|зачем.{0,20}оборудован|электроли[зс]ер.*реактор|реактор.*электроли[зс]ер/u,
    english: /\b(?:what|which|all)\b.{0,28}\b(?:devices|equipment|instruments|apparatus)\b.{0,12}(?:[?!.]|$)|\b(?:tank|cell)\b.*\breactor\b|\breactor\b.*\b(?:tank|cell)\b/u,
    text: "The patent shows a tank with copper plates, hoods and a tube for the hydrogen, a bottom outlet for the grains, a heated reactor with a tray and a water vessel after the reactor. Wires connect the power supply to the plates. The patent also describes filtering, rinsing and drying the grains. The game puts those steps at one station.",
  },
  {
    id: 'water-vessel',
    match: /(?:емкост|сосуд|банка|стакан|вода|водой).{0,28}после реактор|после реактор.{0,28}(?:емкост|сосуд|банка|стакан|вод)|барбот|пробульк/u,
    english: /\b(?:water|bubbler|vessel)\b.{0,30}\b(?:after|beyond|behind)\b.{0,18}\breactor\b|\b(?:after|beyond|behind)\b.{0,15}\breactor\b.{0,30}\b(?:water|bubbles?|vessel)\b/u,
    text: "A water vessel sits after the reactor in the patent diagram. Leftover hydrogen passes through it and makes bubbles. The patent describes using that bubbling as a sign that the copper oxide reaction has finished.",
  },
  {
    id: 'hood',
    match: /колпак|крышк.{0,25}(?:катод|пластин|пузыр|газ)|(?:катод|пластин).{0,25}крышк/u,
    english: /\b(?:hood|cover|lid)\b/u,
    text: "The hood sits over the − plate. It collects hydrogen from the bubbles rising out of the water. The tube carries that hydrogen to the reactor.",
  },
  {
    id: 'outlet',
    match: /люк|слив|выход.{0,20}(?:на дне|внизу|осадк)|(?:кран|клапан).{0,20}(?:внизу|бак|дн)/u,
    english: /\b(?:outlet|hatch|drain valve|bottom tap)\b/u,
    text: "Grains and liquid leave the tank through the bottom outlet. The filter catches the grains. They are rinsed and dried before going to the reactor.",
  },
  {
    id: 'power-appearance',
    match: /(?:источник|блок|питан).{0,55}(?:выгляд|внешн|реальн|настоящ|фото)|(?:выгляд|внешн|реальн|настоящ|фото).{0,55}(?:источник|блок|питан)/u,
    english: /\b(?:power supply|power source|battery)\b.{0,35}\b(?:looks?|real|photo)\b|\b(?:looks?|real|photo)\b.{0,35}\b(?:power supply|power source|battery)\b/u,
    text: "A lab power supply often has a screen, knobs, a switch and places to attach wires. The patent asks for direct current and shows the + and − connections. The game shows one example of a lab power supply.",
  },
  {
    id: 'pipe',
    match: /труб|шланг|куда.{0,25}(?:газ|водород|пузыр)|газ.{0,18}(?:собира|отвод|направ)/u,
    english: /\b(?:tube|pipe|hose|tubing)\b|\b(?:collect|capture|carry)\b.{0,30}\bhydrogen\b|\bwhere\b.{0,20}\bhydrogen\b.{0,14}\bgo\b/u,
    text: "Hydrogen bubbles rise at the − plate. The hood collects the gas, and the tube carries it to the reactor. The wet grains take a different route through the filter. The hydrogen and dry grains meet again in the reactor.",
  },
  {
    id: 'electrode-pair',
    match: /анод.*катод|катод.*анод|отлич.{0,30}(?:пластин|электрод)|дв[аеух].{0,12}(?:пластин|электрод)|плюс.*минус.*пластин/u,
    english: /\banode\b.*\bcathode\b|\bcathode\b.*\banode\b|\b(?:two|both|different)\b.{0,25}\b(?:plates|electrodes)\b/u,
    text: "In this tank, the + plate supplies copper for the grains. It is called the anode. Hydrogen bubbles form at the − plate, called the cathode. The grains and hydrogen meet again in the reactor.",
  },
  {
    id: 'salt',
    match: /электролит|солен|хлорид натрия|(?:^|\s)сол(?:ь|и|ью)(?:[^\p{L}]|$)|nacl|зачем.{0,14}вод[ауые]|(?:что за|какой|из чего).{0,18}раствор|раствор.{0,22}(?:провод|работа)|(?:провод|работа).{0,22}раствор/u,
    english: /\b(?:electrolyte|salty|salt|sodium chloride|nacl|solution|brine)\b/u,
    text: "The tank holds water with dissolved salt. Salt splits into tiny charged pieces called ions. Those ions move in the liquid and carry electric charge between the plates. We call a liquid that carries charge this way an electrolyte.",
  },
  {
    id: 'power-why',
    match: /(?:зачем|почему|для чего|роль).{0,30}(?:электричеств|(?:^|[^\p{L}])ток(?:а|у|ом|е)?(?:[^\p{L}]|$))|(?:электричеств|(?:^|[^\p{L}])ток(?:а|у|ом|е)?(?:[^\p{L}]|$)).{0,18}(?:зачем|нуж[еннаоы]|делает|помога|важен)|без\s+(?:тока|электричества)|(?:выключ|отключ).{0,20}(?:ток|питан|электр)|^(?:а\s+)?почему без (?:этого|него) (?:никак|нельзя)[\s?.!]*$/u,
    english: /\b(?:why|need|without|role|helps?|important)\b.{0,32}\b(?:current|electricity|power)\b|\b(?:current|electricity|power)\b.{0,26}\b(?:need|helps?|important)\b|\b(?:turn|switch)\s+(?:the\s+)?(?:power\s+)?off\b/u,
    text: "The power supply keeps electric charge moving. It takes electrons from the + plate and delivers them to the − plate. Copper can then leave the + plate, and hydrogen bubbles can form at the − plate. Switch off the power in the game and watch both changes stop.",
  },
  {
    id: 'anode',
    match: /анод|(?:плюсов|положительн)\p{L}*\s+(?:пластин|электрод)|(?:пластин|электрод)\p{L}*\s*\(?\+/u,
    english: /\b(?:anode|positive (?:plate|electrode)|plus (?:plate|electrode))\b|\+\s*(?:plate|electrode)\b/u,
    text: "The anode is the + plate in this tank. When the power is on, copper leaves it and enters the water. That copper is used to make the solid grains.",
  },
  {
    id: 'cathode',
    match: /катод|(?:минусов|отрицательн)\p{L}*\s+(?:пластин|электрод)|(?:пластин|электрод)\p{L}*\s*\(-|где.{0,15}пузыр/u,
    english: /\b(?:cathode|negative (?:plate|electrode)|minus (?:plate|electrode))\b|-\s*(?:plate|electrode)\b/u,
    text: "The cathode is the − plate in this tank. With power on, hydrogen bubbles form there. The hood collects the gas and the tube carries it to the reactor.",
  },
  {
    id: 'prep',
    match: /фильтр|воронк|подготовк|промы|суш[аи]|высуш|отдел.{0,28}(?:от воды|от жидкост)|сито/u,
    english: /\b(?:filter\w*|funnel|rinse|rinsing|wash|washing|dry|drying|sieve|strain\w*|separat\w*)\b/u,
    text: "The filter works like a tiny sieve. Liquid can pass through into the container below. The solid grains stay on the filter. After that, clean water rinses away salt left on the grains. Drying removes water before the grains go to the reactor.",
  },
  {
    id: 'reduction',
    match: /восстановл|(?:водород|газ).{0,30}(?:убира|забира|кислород|помога|нужен)|зачем.{0,12}водород|как.{0,35}из.{0,15}оксид.{0,25}(?:мед|порош)/u,
    english: /\b(?:reduction|take away oxygen|remove oxygen)\b|\bhydrogen\b.{0,35}\b(?:oxygen|helps?|need)\b|\b(?:why|need)\b.{0,22}\bhydrogen\b|\bturn\b.{0,12}\bcopper oxide\b.{0,20}\binto\b/u,
    text: "In the heated reactor, hydrogen joins the oxygen from the copper oxide to form water. The copper stays behind as a fine powder. Turning the oxide into the metal is called reduction.",
  },
  {
    id: 'oxide',
    match: /оксид|закись|окисел|cu₂o|cu2o|осад|(?:на дне|дно).{0,22}(?:крупин|порош|красн)|(?:крупин|порош).{0,20}на дне/u,
    english: /\b(?:oxide|cu2o|cu₂o|precipitate|sediment)\b|\b(?:grains?|solid|powder)\b.{0,25}\b(?:bottom|tank)\b|\bbottom\b.{0,25}\b(?:grains?|solid|powder)\b/u,
    text: "The grains at the bottom of the tank are copper(I) oxide, a solid made from copper and oxygen. A solid that forms in a liquid is called a precipitate. The grains become metallic copper later in the reactor.",
  },
  {
    id: 'overview',
    match: /весь процесс|с самого начала|по шагам|что происходит в лаборатор|как все устроено|как (?:делают|получают|сделать|получить).{0,20}(?:порош|медь)|как.{0,16}работает.{0,20}(?:процесс|установка)/u,
    english: /\b(?:whole process|step by step|from the start|lab process)\b|\b(?:how do|how is|how are|how does|how to)\b.{0,35}\b(?:make|made|produce|produced)\b.{0,28}\b(?:powder|copper)\b|\bhow\b.{0,20}\b(?:process|lab)\b.{0,20}\bwork/u,
    text: "First, electric current runs through salty water between copper plates. Hydrogen bubbles rise, and copper oxide grains collect below. The grains are filtered, rinsed and dried. In the heated reactor, hydrogen helps turn the dry grains into copper powder.",
  },
  {
    id: 'reactor',
    match: /реактор|печ(?:ь|к|и)|нагрев|короб.{0,16}справа|ящик.{0,16}справа|где.{0,25}(?:получ|появ).{0,18}порош/u,
    english: /\b(?:reactor|heated chamber|hot chamber|oven)\b|\bwhere\b.{0,30}\bpowder\b.{0,12}\bforms?\b/u,
    text: "The reactor is the heated chamber on the right. Hydrogen enters through the tube. Dry copper oxide grains go in separately. Hydrogen joins oxygen from the grains to make water, leaving metallic copper powder in the tray.",
  },
  {
    id: 'tray',
    match: /лоток|лотк|поддон|блюд|поднос|результат|готовый порош/u,
    english: /\b(?:tray|finished powder|final product|result)\b/u,
    text: "The tray holds the finished metallic copper powder from the reactor. You can inspect it here. The game draws the grains much larger than they are in real life.",
  },
  {
    id: 'hydrogen',
    match: /водород|пузыр|пузер|газ(?:а|ом|е|ы)?(?:[^\p{L}]|$)|h₂|(?:^|\s)h2(?:\s|$)/u,
    english: /\b(?:hydrogen|bubbles?|gas|h2|h₂)\b/u,
    text: "Hydrogen is the gas in the bubbles at the − plate. The bubbles rise to the hood. A tube carries the collected gas to the reactor, where it helps turn copper oxide grains into copper.",
  },
  {
    id: 'power',
    match: /(?:источник|блок).{0,14}(?:ток|питан|электр)|батаре|розет|зачем.{0,15}провод|напряжен|выпрямител/u,
    english: /\b(?:power(?: supply| source)?|battery|supply|voltage|wires?)\b/u,
    text: "The supply keeps charge moving. Its + wire goes to the anode, where copper enters the water. Its − wire goes to the cathode, where hydrogen bubbles appear.",
  },
  {
    id: 'cell',
    match: /электроли[зс][её]р|бак|(?:первая|первом|первыи|первый).{0,15}(?:емкост|сосуд|ванн)|(?:емкост|ванн|сосуд|банка).{0,24}(?:пластин|электрод|солен)/u,
    english: /\b(?:electroly[sz]er|tank|cell|first container)\b/u,
    text: "The tank holds salty water and two copper plates. When the power is on, hydrogen bubbles form at the − plate and copper oxide grains collect at the bottom. This tank is called an electrolyser.",
  },
  {
    id: 'electrolysis',
    match: /электроли[зс]|ток.{0,20}(?:в воде|через воду|в раствор)/u,
    english: /\belectrolysis\b|\bcurrent\b.{0,27}\b(?:water|liquid)\b/u,
    text: "Electrolysis means using electric current to make substances change. In this tank, current passes through salty water between copper plates. Hydrogen bubbles rise and solid copper oxide grains settle.",
  },
  {
    id: 'electrodes',
    match: /электрод|пластин/u,
    english: /\b(?:electrodes?|plates?)\b/u,
    text: "The electrodes are the plates connected to the power supply. They let charge enter and leave the liquid. In this tank, copper leaves the + plate and hydrogen bubbles form at the − plate.",
  },
  {
    id: 'ion',
    match: /(?:^|[^\p{L}])ион\p{L}*|(?:зачем|почему).{0,20}(?:атом|медь).{0,22}(?:электрон|заряд)/u,
    english: /\bions?\b/u,
    text: "An ion is an atom or group of atoms with a charge. If a copper atom loses one electron, it loses one minus charge. That leaves one extra plus, so the charge is +1.",
  },
  {
    id: 'electron',
    match: /электрон|сини[йе].{0,10}шарик|шарик.{0,12}улет/u,
    english: /\belectrons?\b/u,
    text: "An electron is a tiny particle with a minus charge. The blue ball stands for an electron. At the + plate, the electron travels along the metal and the wire. Copper can leave the plate and enter the water.",
  },
  {
    id: 'atom',
    match: /атом|ядро/u,
    english: /\b(?:atoms?|nucleus)\b/u,
    text: "An atom is a tiny building block. It has a centre with plus charge and electrons with minus charge. When those charges balance, the total charge is zero.",
  },
  {
    id: 'charge',
    match: /заряд|плюс|минус|поровну|(?:^|\s)\+(?:\s|[?.!]|$)|(?:^|\s)-(?:\s|[?.!]|$)/u,
    english: /\b(?:charge|plus|minus|positive|negative|neutral)\b|(?:^|\s)[+-](?:[?!.\s]|$)/u,
    text: "Think of a + and a − as a pair that adds up to zero. If you take away one minus, there is one extra plus. At the tank, + and − also label the two sides of the power supply.",
  },
  {
    id: 'current',
    match: /(?:^|[^\p{L}])ток(?:а|у|ом|е)?(?:[^\p{L}]|$)|электричество/u,
    english: /\b(?:electricity|current)\b/u,
    text: "Electric current is the movement of electric charge. In wires, electrons move. In salty water, ions move and carry charge. The power supply keeps that movement going.",
  },
  {
    id: 'patent',
    match: /патент|32204|изобрет/u,
    english: /\b(?:patent|32204|invention|baeshev|baeshov)\b/u,
    text: "Patent KZ B 32204 describes making copper(I) oxide with copper plates and salty water, then using hydrogen to turn the oxide into copper powder. You can open the original patent at the bottom of the page.",
  },
  {
    id: 'powder',
    match: /порош|металлическ.{0,14}мед/u,
    english: /\b(?:powder|metallic copper)\b/u,
    text: "Copper powder is metallic copper in many tiny pieces. It forms in the reactor when the hydrogen reacts with the copper oxide. Look for the finished powder in the tray.",
  },
];

export const guideTopicIds = Object.freeze(topics.map(({ id }) => id));

const followUps = {
  'electron-transfer': 'Think of two paths. The electron goes into the wire. The copper goes into the water. That copper will be part of the powder later.',
  power: 'Follow the two wires from the box. At the plate connected to the + wire, copper enters the water. At the plate connected to the − wire, bubbles rise.',
  'power-why': 'Power on makes the plates do two jobs. One gives copper to the water, and the other makes bubbles. Flip the switch and watch.',
  'electrode-pair': 'Find the plate where copper enters the water. That is the anode. Find the plate making bubbles. That is the cathode.',
  salt: 'Dissolved salt splits into tiny pieces. They can move through the water and carry electric charge.',
  pipe: 'Bubbles rise into the hood. The tube takes their gas from the hood to the reactor.',
  scale: 'One millimetre equals one thousand micrometres. The grains in the patent example are even smaller than one micrometre.',
  prep: 'Think of a sieve. Water goes through the holes and the grains stay on top. Then a rinse washes off the salt, and drying removes the water.',
  reactor: 'The grains contain copper joined to oxygen. In the reactor, the hydrogen joins that oxygen to make water. That leaves copper in the tray.',
  ion: 'Give each plus a minus partner. Take away one minus. The extra plus is the charge that makes the atom an ion.',
};

const lessonHints = {
  'atom-signs': 'Tap the minus signs to pair them with plus signs.',
  'atom-paired': 'The pairs are ready. Choose “Look at an atom”.',
  'atom-intro': 'Tap the blue ball or choose “See what happens at the anode”. The ball shows an electron with a minus charge.',
  'atom-question': 'Look at the empty box. Which sign is left without a partner?',
  'atom-done': 'Go back to the exhibits and try the experiment with the two plates.',
  'salt-intro': 'Add the salt to the jar and see what happens to the grains.',
  'salt-done': 'The tiny charged pieces carry charge through the water. Go back to the exhibits or open the Laboratory tab.',
  'electrodes-intro': 'Switch on the mini tank and watch both plates.',
  'electrodes-question': 'Tap the sign above the plate where the bubbles rise.',
  'electrodes-done': 'Go to Equipment to see where the bubbles go.',
};

const equipmentTopics = {
  'equipment-power': 'power',
  'equipment-tank': 'cell',
  'equipment-prep': 'prep',
  'equipment-reactor': 'reactor',
};

const basicTopics = {
  'atom-signs': 'charge',
  'atom-paired': 'charge',
  'atom-intro': 'atom',
  'atom-question': 'charge',
  'atom-done': 'ion',
  'salt-intro': 'salt',
  'salt-done': 'salt',
  'electrodes-intro': 'electrodes',
  'electrodes-question': 'cathode',
  'electrodes-done': 'electrode-pair',
};

const exhibitNames = {
  atom: 'Atoms and ions',
  electrodes: 'Two copper plates',
  salt: 'Where did the salt go?',
  'equipment-power': 'Power supply',
  'equipment-tank': 'Electrolysis tank',
  'equipment-prep': 'Filter and drying station',
  'equipment-reactor': 'Heated reactor',
};

function nextHint({ room, wing, phase, lesson, selected, gas, remaining, comparePower }) {
  if (room !== 'lab') {
    if (Object.hasOwn(lessonHints, lesson)) return lessonHints[lesson];
    if (Object.hasOwn(equipmentTopics, lesson)) return 'Look closely at the device. When you are ready, go back to the exhibits or choose “Laboratory”.';
    if (Array.isArray(remaining)) {
      const next = remaining.find((id) => Object.hasOwn(exhibitNames, id) && id.startsWith('equipment-') === (wing === 'equipment'));
      if (next) return `Open the “${exhibitNames[next]}” exhibit, or choose “Laboratory” to return to the experiment.`;
    }
    return 'Choose any exhibit or open the Laboratory tab to continue the experiment.';
  }

  switch (phase) {
    case 'electrolysis': return 'Watch the tank. Copper leaves the + plate and bubbles rise at the − plate.';
    case 'observe': return comparePower === false
      ? 'The bubbles stopped. Switch the power back on to compare, or choose “Continue · Follow both outputs”.'
      : 'Switch off the power to see what stops. When you are ready, choose “Continue · Follow both outputs”.';
    case 'route':
      if (selected === 'gas') return 'The hood collects gas. Tap the tube or choose “Follow the hydrogen”.';
      if (selected === 'solid') return 'Tap the filter or choose “Filter the mixture”. Watch it catch the grains.';
      if (gas) return 'Hydrogen has reached the reactor. Tap the bottom of the tank or choose “Collect the grains”.';
      return 'Tap the hydrogen label at the top of the tank or choose “Find the hydrogen”.';
    case 'gas-flow': return 'Watch the tube. Hydrogen is on its way to the reactor.';
    case 'filtering': return 'Watch the filter. Liquid drains into the container below and solid grains stay on top.';
    case 'prep-dry': return 'Tap the preparation station or choose “Rinse and dry the grains”.';
    case 'drying': return 'Watch the rinse remove leftover salt. Then the dryer removes the water.';
    case 'ready': return 'The reactor has both hydrogen and dry grains. Choose “Run the reactor”.';
    case 'reduction': return 'Watch the reactor turn copper oxide grains into metallic copper powder.';
    case 'product': return 'The powder is in the tray on the right. Choose “Inspect the copper powder”.';
    case 'won': return 'Your powder is ready. Explore the Knowledge Palace or choose “Play again”.';
    default: return 'Choose “Switch on the power” and watch the two copper plates.';
  }
}

export function answerQuestion(question, context = {}) {
  const query = typeof question === 'string'
    ? question.slice(0, 400).toLocaleLowerCase('ru').replaceAll('ё', 'е').replaceAll('−', '-').trim()
    : '';
  const current = context && typeof context === 'object' ? context : {};
  if (['power', 'power-appearance'].includes(current.topic) &&
      /^(?:(?:а\s+)?как (?:он|это) выгляд\p{L}*|what does (?:it|that) look like)[\s?.!]*$/u.test(query)) {
    const topic = topics.find(({ id }) => id === 'power-appearance');
    return { text: topic.text, topic: topic.id };
  }
  if (/\b(?:what|where|how)\b.{0,24}\bnext\b|\bnext step\b|\bwhat\b.{0,15}\b(?:click|do now)\b|(?:что|куда|как).{0,16}дальше|что.{0,8}делать|следующ.{0,10}шаг|куда.{0,8}(?:идти|нажать)|(?:^|\s)подскажи[?.!]*$/u.test(query)) {
    return { text: nextHint(current), topic: 'next' };
  }
  if (/^(?:why|how so|how does (?:it|that) work|can you explain (?:more|that)|explain (?:again|more|that|simply)|(?:а\s+)?(?:почему(?: без (?:этого|него) (?:никак|нельзя)| (?:это|он|она) так работает)?|как так|как это работает|зачем|можно проще|(?:объясни|расскажи) (?:проще|еще раз|подробнее)))[\s?.!]*$/u.test(query)) {
    const previous = topics.find(({ id }) => id === current.topic);
    if (previous) return { text: Object.hasOwn(followUps, previous.id) ? followUps[previous.id] : previous.text, topic: previous.id };
  }
  if (/^(?:what (?:is|does) (?:it|this|that)(?: do)?|how does (?:it|this|that) work|explain (?:it|this|that)|(?:а\s+)?(?:что это(?: такое)?|что за штука|зачем (?:это|он|она|оно)|объясни(?: это)?|как это работает|я не понял))[\s?.!]*$/u.test(query)) {
    let lesson;
    if (current.room !== 'lab') {
      if (Object.hasOwn(equipmentTopics, current.lesson)) lesson = equipmentTopics[current.lesson];
      else if (Object.hasOwn(basicTopics, current.lesson)) lesson = basicTopics[current.lesson];
    }
    const selected = lesson ?? (current.selected === 'gas' ? 'hydrogen' : current.selected === 'solid' ? 'oxide' : undefined);
    const topic = topics.find(({ id }) => id === selected);
    if (topic) return { text: topic.text, topic: topic.id };
    return { text: nextHint(current), topic: 'next' };
  }
  const topic = topics.find(({ match, english }) => english.test(query) || match.test(query));
  if (topic) return { text: topic.text, topic: topic.id };
  return {
    text: 'I have no answer for that in this guide. Try naming a device or something you see. For example, ask “What does the filter do?” or “What are the grains at the bottom?”',
    topic: 'unknown',
  };
}
