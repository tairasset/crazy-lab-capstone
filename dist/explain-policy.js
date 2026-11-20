// Each public topic has its own vocabulary. Extra words are confined to everyday
// connective language; a generated reply cannot introduce new substances or values.
const everyday = new Set(('a an the its their they that this those these he she it them you your we our and or ' +
  'is are was were be been being does do did has have had of for to with without from than by in on at as if when ' +
  'because so through into up out away behind back while still too can cannot only other same each also what which ' +
  'how why where like means lets keep keeps let gets get makes make made making just much really more most very ' +
  'little big bigger smaller small tiny large larger holes hole things thing way works work goes go easily ' +
  'helps help allows allow acts passes pass passing stays stay takes take enough').split(/\s+/));
const words = s => s.toLowerCase().match(/[a-z]+/g) ?? [];
const root = w => w.length > 4 ? w.replace(/(?:es|s)$/u, '') : w;
export function validExplanation(text, passage) {
  if (typeof text !== 'string' || text.length > 360 || !/^[a-z ,.'’?!-]+$/iu.test(text)) return false;
  const vocab = new Set(words(passage).map(root));
  const terms = words(text);
  const core = terms.filter(w => !everyday.has(w));
  const anchors = [...new Set(words(passage).filter(w => !everyday.has(w)).map(root))];
  const retained = anchors.filter(w => terms.some(term => root(term) === w));
  const polarity = s => /\b(?:not|never|cannot|without)\b/i.test(s);
  if (/^a copper is\b/i.test(text)) return false;
  for (const word of ['positive', 'negative', 'lose', 'gain']) {
    if (words(passage).includes(word) !== terms.includes(word)) return false;
  }
  return polarity(text) === polarity(passage) && retained.length >= Math.ceil(anchors.length * 0.6) &&
    terms.length >= 4 && core.length >= 2 && core.every(w => vocab.has(root(w))) &&
    !/\b(\w+(?:\s+\w+){1,3})\s+\1\b/iu.test(text);
}
