import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validExplanation } from './dist/explain-policy.js';

const asset = name => new URL('./.guide-model/flan-' + name, import.meta.url);
let loading;
let working = false;

async function load() {
  const [ort, { Tokenizer }, vocab, config] = await Promise.all([
    import('onnxruntime-node'), import('@huggingface/tokenizers'),
    readFile(asset('tokenizer.json'), 'utf8'), readFile(asset('config.json'), 'utf8'),
  ]);
  const options = { executionProviders: ['cpu'], intraOpNumThreads: 1, interOpNumThreads: 1,
    enableCpuMemArena: false, enableMemPattern: false };
  const encoder = await ort.InferenceSession.create(fileURLToPath(asset('encoder.onnx')), options);
  const decoder = await ort.InferenceSession.create(fileURLToPath(asset('decoder.onnx')), options);
  return { ort, encoder, decoder, tokenizer: new Tokenizer(JSON.parse(vocab), JSON.parse(config)) };
}

// The generator receives a reviewed fact and a fixed writing task, never the player's
// instructions, previous chat text, private lesson material or a patent reference.
export async function explainFact(fact, lesson) {
  if (working || !fact || !lesson.context.includes(fact)) return null;
  working = true;
  try {
    loading ??= load().catch(error => { loading = undefined; throw error; });
    const { ort, tokenizer, encoder, decoder } = await loading;
    const prompt = 'Paraphrase the sentence: ' + fact;
    const ids = tokenizer.encode(prompt).ids;
    const tensor = xs => new ort.Tensor('int64', BigInt64Array.from(xs, BigInt), [1, xs.length]);
    const mask = tensor(ids.map(() => 1));
    const encoded = await encoder.run({ input_ids: tensor(ids), attention_mask: mask });
    const tokens = [0];
    for (let i = 0; i < 48; i++) {
      const { logits } = await decoder.run({
        input_ids: tensor(tokens), encoder_attention_mask: mask, encoder_hidden_states: encoded.last_hidden_state,
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
  } finally { working = false; }
}
