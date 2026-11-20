import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = new URL('./.guide-model/', import.meta.url);
const modelFile = new URL('model.onnx', directory);
const tokenizerFile = new URL('tokenizer.json', directory);
const tokenizerConfig = new URL('tokenizer_config.json', directory);
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const maxTokens = 224;
let enginePromise;
let busy = false;

export function isNeuralGuideReady() {
  return [modelFile, tokenizerFile, tokenizerConfig].every(file => existsSync(file));
}

async function loadEngine() {
  const [ort, { Tokenizer }, vocabulary, settings] = await Promise.all([
    import('onnxruntime-node'), import('@huggingface/tokenizers'),
    readFile(tokenizerFile, 'utf8'), readFile(tokenizerConfig, 'utf8'),
  ]);
  const tokenizer = new Tokenizer(JSON.parse(vocabulary), JSON.parse(settings));
  const session = await ort.InferenceSession.create(fileURLToPath(modelFile), {
    executionProviders: ['cpu'],
    executionMode: 'sequential',
    intraOpNumThreads: 1,
    interOpNumThreads: 1,
  });
  return { tokenizer, session, ort };
}

export function prepareNeuralGuide() {
  if (!enginePromise) enginePromise = loadEngine().catch(error => {
    enginePromise = undefined;
    throw error;
  });
  return enginePromise;
}

// Never decode a free-form answer. Token positions can only select original
// sentences from the caller's public, curated context, never from the question.
export async function askNeuralGuide(question, context) {
  if (typeof question !== 'string' || !question.trim() || typeof context !== 'string' || !context.trim()) return { reason: 'unknown' };
  if (busy) return { reason: 'busy' };
  busy = true;
  try {
    const { tokenizer, session, ort } = await prepareNeuralGuide();
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
    const tensor = values => new ort.Tensor('int64', BigInt64Array.from(values, BigInt), [1, ids.length]);
    const result = await session.run({
      input_ids: tensor(ids),
      attention_mask: tensor(ids.map(() => 1)),
      token_type_ids: tensor(ids.map((_, index) => Number(index >= contextStart))),
    });
    const start = result.start_logits.data;
    const end = result.end_logits.data;
    // The SQuAD2 model uses [CLS] to indicate that the context doesn't answer the question.
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
  } catch (error) {
    // Log operational status only. Questions, source text and credentials stay out of logs.
    console.warn('[guide] Local question-answering model unavailable (' + error.name + ').');
    return { reason: 'unavailable' };
  } finally {
    busy = false;
  }
}
