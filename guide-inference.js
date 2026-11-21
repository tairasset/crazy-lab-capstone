import { validExplanation } from './explain-policy.js';

const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const maxTokens = 224;

function tokenTensor(ort, values) {
  return new ort.Tensor('int64', BigInt64Array.from(values, BigInt), [1, values.length]);
}

export async function findMatchingSentence(question, context, { tokenizer, session, ort }) {
  const encode = text => tokenizer.encode(text, { add_special_tokens: false }).ids;
  const separator = tokenizer.token_to_id('[SEP]');
  const ids = [tokenizer.token_to_id('[CLS]'), ...encode(question.slice(0, 400)).slice(0, 72), separator];
  const contextStart = ids.length;
  const passages = [];
  for (const entry of segmenter.segment(context)) {
    const text = entry.segment.trim();
    if (!text) continue;
    const tokens = encode(text);
    if (ids.length + tokens.length >= maxTokens) break;
    if (tokens.length) passages.push({ text, start: ids.length, end: ids.length + tokens.length });
    ids.push(...tokens);
  }
  if (!passages.length) return { reason: 'unknown' };
  ids.push(separator);
  const result = await session.run({
    input_ids: tokenTensor(ort, ids),
    attention_mask: tokenTensor(ort, ids.map(() => 1)),
    token_type_ids: tokenTensor(ort, ids.map((_, index) => Number(index >= contextStart))),
  });
  const start = result.start_logits.data;
  const end = result.end_logits.data;
  // This model predicts the first token if the notes do not answer the question.
  let best = start[0] + end[0];
  let selected;
  for (const passage of passages) {
    for (let first = passage.start; first < passage.end; first++) {
      for (let last = first; last < Math.min(first + 40, passage.end); last++) {
        const score = start[first] + end[last];
        if (score > best) {
          best = score;
          selected = passage;
        }
      }
    }
  }
  return selected ? { text: selected.text, model: 'MiniLM-QA' } : { reason: 'unknown' };
}

export async function rewriteFact(fact, { ort, tokenizer, encoder, decoder }) {
  // FLAN receives a vetted sentence and a fixed instruction. Player text is only used for finding the source sentence.
  const ids = tokenizer.encode('Paraphrase the sentence: ' + fact).ids;
  const mask = tokenTensor(ort, ids.map(() => 1));
  const encoded = await encoder.run({ input_ids: tokenTensor(ort, ids), attention_mask: mask });
  const tokens = [0];
  for (let i = 0; i < 48; i++) {
    const { logits } = await decoder.run({
      input_ids: tokenTensor(ort, tokens), encoder_attention_mask: mask, encoder_hidden_states: encoded.last_hidden_state,
    }, ['logits']);
    const width = logits.dims.at(-1);
    const scores = logits.data.subarray(logits.data.length - width);
    let next = 0;
    for (let j = 1; j < width; j++) if (scores[j] > scores[next]) next = j;
    if (next === 1) {
      const text = tokenizer.decode(tokens.slice(1), { skip_special_tokens: true }).trim();
      const sentence = text && text[0].toUpperCase() + text.slice(1).replace(/[.!?]?$/u, '.');
      return validExplanation(sentence, fact) ? sentence : null;
    }
    tokens.push(next);
  }
  return null;
}
