import * as ort from './browser-guide-v1/ort.wasm.min.mjs';
import { Tokenizer } from './browser-guide-v1/tokenizers.mjs';
import { findMatchingSentence, rewriteFact } from './guide-inference.js';
import { answerPublicGuide } from './public-guide-answer.js';

const assets = new URL('./browser-guide-v1/', import.meta.url);
// GitHub Pages serves a regular HTTPS page without cross-origin isolation.
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = assets.href;
const options = { executionProviders: ['wasm'] };
let minilm;
let flan;

async function load(name, body) {
  const response = await fetch(new URL(name, assets), { cache: 'force-cache' });
  if (!response.ok) throw new Error(name + ' returned HTTP ' + response.status);
  return response[body]();
}

async function loadTokenizer(vocabulary, config) {
  const [data, settings] = await Promise.all([load(vocabulary, 'json'), load(config, 'json')]);
  return new Tokenizer(data, settings);
}

async function loadModel(file) {
  return ort.InferenceSession.create(await load(file, 'arrayBuffer'), options);
}

async function findFact(question, context) {
  if (!minilm) {
    self.postMessage({ status: 'Loading MiniLM…' });
    const [tokenizer, session] = await Promise.all([
      loadTokenizer('tokenizer.json', 'tokenizer_config.json'),
      loadModel('model.onnx'),
    ]);
    minilm = { tokenizer, session, ort };
  }
  self.postMessage({ status: 'Looking through the study notes…' });
  return findMatchingSentence(question, context, minilm);
}

async function explainFact(fact) {
  if (!flan) {
    self.postMessage({ status: 'Loading FLAN-T5…' });
    const tokenizer = await loadTokenizer('flan-tokenizer.json', 'flan-config.json');
    const encoder = await loadModel('flan-encoder.onnx');
    try {
      const decoder = await loadModel('flan-decoder.onnx');
      flan = { ort, tokenizer, encoder, decoder };
    } catch (error) {
      await encoder.release();
      throw error;
    }
  }
  self.postMessage({ status: 'Writing an explanation…' });
  return rewriteFact(fact, flan);
}

self.addEventListener('message', async ({ data }) => {
  const input = { ...data, explain: data.style === 'explain' };
  self.postMessage({ answer: await answerPublicGuide(input, findFact, explainFact) });
});
